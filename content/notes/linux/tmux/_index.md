---
created_at: 2013-01-01T00:00:01-0000
updated_at: 2026-04-05T00:00:00-0000
tags:
  - linux
  - cli
  - tips
title: Tmux
aliases:
  - /notes/tmux/
---

## Installation

Tmux is available in the package manager of most Linux distributions. Install it
using whatever is appropriate for your system (e.g. `apt install tmux`,
`dnf install tmux`, `pacman -S tmux`, etc).

## Shared Session Configuration

The idea behind this was to allow easy pair programming in a fairly secure way
using a separate unprivileged account to host the session. I've used a
combination of tmux, some bash scripts, and sudo to accomplish this environment.
Please note that I don't add the shared user to the 'sshers' group so there is
only local access to the account.

### User Setup

Create a new user, I used "shared" for the user name as shown in the example
below. This will also create the "shared" group.

```
useradd shared
password shared
```

Set some ridiculous password for the user as no one will be logging directly in.

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
session script I found on the [Arch Linux Wiki][1] which has a ridiculous amount
of very good information that I strongly recommend people reference with any
questions.

[shared-tmux script](shared-tmux.sh)

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

I also created a small shell script to make it easier for users to make use of
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

Here is the [tmux configuration](tmux.conf) for `/home/shared/.tmux.conf`.
There are two configuration items that are relevant to the shared session
configuration and should be included even if you don't use any of the rest of
it. The two relevant configuration lines are the `setw -g aggressive-resize on`
and the `set-option destroy-unattached on`.

Here is the [vim configuration](vimrc) I use for `/home/shared/vimrc`, nothing
specifically related to the shared session in this one.

[1]: https://wiki.archlinux.org/index.php/Tmux#Clients_simultaneously_interacting_with_various_windows_of_a_session
