---
title: Tmux
---

# Tmux

## Installation

```
yum install tmux -y
```

## Shared Session Configuration

The idea behind this was to allow easy pair programming in a fairly secure way
using a separate unprivileged account to host the session. I've used a
combination of tmux, some bash scripts, and sudo to accomplish this
environment. Please note that I don't add the shared user to the 'sshers' group
so there is only local access to the account.

### User Setup

Create a new user, I used "shared" for the user name as shown in the example
below. This will also create the "shared" group.

```
useradd shared
password shared
```

Set some rediculous password for the user as no one will be logging directly
in.

Add any users that you want to participate in the shared environment to the
shared group like so:

```
usermod -a -G shared <username>
```

Add this line to the `/etc/sudoers` to allow any user added to the shared group
to be able to switch to it without a password:

```
%shared   ALL=(ALL) NOPASSWD: /bin/su shared -
```

### Shared Session Setup

Switch to the shared user's account from a user that is a member of the shared
group and create a .bin directory in their home.

```
mkdir /home/shared/.bin
```

Inside of that create a file "shared-tmux" with the following contents and make
it executable. This is a simplified version of a more flexible shared tmux
session script I found on the [Arch Linux Wiki][1] which has a ridiculous
amount of very good information that I strongly recommend people reference with
any questions.

```
#!/bin/bash

base_session="shared-session"
tmux_session_count=`tmux ls | grep "^$base_session" | wc -l`

if [[ "$tmux_session_count" == "0" ]]; then
  echo "Launching tmux base session $base_session ..."
  tmux new-session -s $base_session
else
  # Make sure we are not already in a tmux session
  if [[ -z "$TMUX" ]]; then
    # Kill defunct sessions first
    old_sessions=$(tmux ls 2>/dev/null | egrep "^[0-9]{14}.*[0-9]+\)$" | cut -f 1 -d:)
    for old_session_id in $old_sessions; do
        tmux kill-session -t $old_session_id
    done

    echo "Launching copy of base session $base_session ..."

    # Session is is date and time to prevent conflict
    session_id=`date +%Y%m%d%H%M%S`

    # Create a new session (without attaching it) and link to base session 
    # to share windows
    tmux new-session -d -t $base_session -s $session_id
    
    # Attach to the new session
    tmux attach-session -t $session_id

    # When we detach from it, kill the session
    tmux kill-session -t $session_id
  fi
fi
```

I added the following to the shared user's .bashrc file so the shared session
pops open automatically as soon as a user has opened a shell and it will drop
them out of the user's account as soon as they leave tmux.

```
if [[ -z "$TMUX" ]]; then
  export PS1="\W\$(__git_ps1)\$ "
  shared-session
  # The following is needed because funny shit happens when the server drops
  reset
  exit
else
  export PS1="[\u@\h \W]\$(__git_ps1)\$ "
fi
```

I also created a small shell script to make it easier for user's to make use of
the shared session in `/bin/shared`. The contents are below, make sure to make
it executable:

```
#!/bin/bash

sudo su shared -
clear
echo "Left shared environment"
```

#### VIM & Tmux

I made a few compromises on my vim and tmux configuration to work with a
co-worker and tried to keep it simple at the same time, so I'm including their
configuration.

Here is the tmux configuration `/home/shared/.tmux.conf`, there are two
configuration items that are relevant to the shared session configuration and
should be included even if you don't use any of the rest of it. The two
relevant configuration lines are the "setw -g aggressive-resize on" and the
"set-option destroy-unattached on".

```
set-option -g prefix C-a
set-option destroy-unattached on
bind r source-file ~/.tmux.conf
bind C-a last-window
bind a send-prefix
set-window-option -g mode-keys vi
bind-key k select-pane -U
bind-key j select-pane -D
bind-key h select-pane -L
bind-key l select-pane -R
setw -g aggressive-resize on
bind \ split-window -h
bind - split-window -v
set -g base-index 1
set -g visual-activity on
set -g monitor-activity on
set -g history-limit 100000
set -g status-bg black
set -g status-fg green
set -g status-interval 30
set -g status-left-length 40
set -g status-left '#[fg=green](#S) #(whoami)@#H#[default]'
set -g status-right '#[fg=yellow]#(cut -d " " -f 1-3 /proc/loadavg)#[default] #[fg=cyan]%H:%M#[default]'
```

Here is the vim configuration I use /home/shared/vimrc, nothing specifically
related to the shared session in this one:

```
set history=500
set nocompatible
autocmd! bufwritepost vimrc source ~/.vimrc
set modelines=10
set autoread
set scrolloff=5
set wildmenu
set ruler
set cmdheight=2
set nostartofline
set confirm
set pastetoggle=<F11>
nnoremap <C-L> :nohl<CR><C-L>
set shiftwidth=2 tabstop=2
set expandtab
set ai
set smarttab
set ignorecase
set hlsearch
set magic
set showmatch
set noerrorbells
set visualbell
set number
set hidden
syntax on
set ai
set encoding=utf8
try
  lang en_US
catch
endtry
set ffs=unix,dos,mac
set lbr
set laststatus=2
```

[1]: https://wiki.archlinux.org/index.php/Tmux#Clients_simultaneously_interacting_with_various_windows_of_a_session

