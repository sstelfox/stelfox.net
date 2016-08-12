---
title: Mutt
---

# Mutt

```
yum install mutt -y
```

Do a basic configuration in `~/.muttrc`

```
# Name to be displayed on sent emails:
set my_name = Sam Stelfox

# Use the Maildir format
set mbox_type = Maildir
set folder = ~/Maildir
set spoolfile = +/

# How often to check for new mail (in seconds)
set mail_check = 150

# Cache messages and headers locally to speed up some operations, this is
# mostly valuable when retrieving email via IMAP or POP.
set header_cache = ~/.cache/mutt
set message_cachedir = ~/.cache/mutt

# Where to store sent emails and drafts
set record = +Sent
set postponed = +Drafts

# When using GMail properly you should uncomment the following lines
#unset record
#set postponed = +[Gmail]/Drafts

# The path to our editor of choice
set editor = /usr/bin/vim

# Blow away the user agent
unset user_agent

# A personal custom header for my amusement
my_hdr X-Access-Validation: `dd if=/dev/urandom bs=1 count=16 2>/dev/null | hexdump | head -n 1`

set date_format="%Y%m%d %T"
set index_format="%2C %Z [%d] %f %s"

# Path to a signature file
set signature = ".signature"

# Ensure our emails are sent with a decent character set
set send_charset = utf-8

# Display all the headers when viewing an email
unignore headers *

# Disable +s at beginning of wrapped lines
set markers = no

# Cancel a message when subject is blank
set abort_nosubject = yes

# Asks to include message when replying
set include = ask-yes

# Asks to postpone a message when not sent
set postpone = ask-yes

# Delete messages without asking when Mutt is quit
set delete = yes

# sort messages by thread
set sort = threads

# Set quotemark to 1 byte
set indent_str = "> "

# Collapse old messages
set collapse_unread = no

## Colours for items in the index
color index brightcyan black ~N
color index brightred black ~O
color index brightyellow black ~F
color index black green ~T
color index brightred black ~D

## Highlights inside the body of a message.

## URLs
color body brightgreen black "(http|ftp|news|telnet|finger)://[^ \"\t\r\n]*"
color body brightgreen black "mailto:[-a-z_0-9.]+@[-a-z_0-9.]+"

## Email addresses.
color body brightgreen black "[-a-z_0-9.%$]+@[-a-z_0-9.]+\\.[-a-z][-a-z]+"

## Header
color header green black "^from:"
color header green black "^to:"
color header green black "^cc:"
color header green black "^date:"
color header yellow black "^reply-to:"
color header brightcyan black "^subject:"
color header red black "^x-spam-rule:"
color header green black "^x-mailer:"
color header yellow black "^message-id:"
color header yellow black "^Organization:"
color header yellow black "^Organisation:"
color header yellow black "^User-Agent:"
color header yellow black "^message-id: .*pine"
color header red black "^x-spam-rule:"
color header green black "^x-mailer:"
color header yellow black "^message-id:"
color header yellow black "^Organization:"
color header yellow black "^Organisation:"
color header yellow black "^User-Agent:"
color header yellow black "^X-Message-Flag:"
color header yellow black "^X-Spam-Status:"
color header yellow black "^X-SpamProbe:"
color header red black "^X-SpamProbe: SPAM"

## Coloring quoted text - coloring the first 7 levels:
color quoted cyan black
color quoted1 yellow black
color quoted2 red black
color quoted3 green black
color quoted4 cyan black
color quoted5 yellow black
color quoted6 red black
color quoted7 green black

## Default color definitions
color signature brightmagenta black
color indicator black cyan
color attachment black green
color error red black
color message white black
color search brightwhite magenta
color status brightyellow blue
color tree brightblue black
color normal white black
color tilde green black
color bold brightyellow black
#color underline magenta black
color markers brightcyan black
color status green black
color indicator default red

# When using IMAP these will automatically open a connection, and keep it
# open. Otherwise these wont do anything.
unset imap_passive
set imap_keepalive = 300

# Configure what SMTP server to use
set realname = $my_name
set from = "admin@0x378.net"
set envelope_from = "yes"
set use_from = yes
set smtp_url = smtp://127.0.0.1

# activate TLS if available on the server
set ssl_starttls = yes
```

## Vim

Since I use vim as my editor I also added the following line to my vim
configuration file to autowrap my lines at 72 characters, but only for mutt
composed messsages.

```
au BufRead /tmp/mutt-* set tw=72
```

