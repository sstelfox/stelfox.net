---
created_at: 2013-11-19T09:55:40-0500
tags:
  - linux
  - tips
slug: backing-up-gmail-with-fetchmail
title: Backing up Gmail with fetchmail
---

# Backing up Gmail with fetchmail

This morning I found myself in need of a large set of emails to test a
particular set of code. Ideally these emails would be broken out into easily
digestible pieces, and it was strictly for my own personal testing so I wasn't
concerned with using my own live data for this test (There will probably be
another post on this project later on).

Having used `fetchmail` with good results in the past I decided it was a good
idea to take this opportunity to also backup my Gmail account into the common
`Maildir` format (which essentially breaks out emails into individual files
meeting my requirements).

The first step was to enable POP access to my account through Gmail's
interface. You can accomplish this with the following steps.

1. Login to Gmail
2. Click on the gear icon
3. Choose settings
4. Forwarding and POP/IMAP
5. Enable POP for all mail
6. When messages are accessed with POP... Keep"
7. Save Changes.

Ensure you have `fetchmail` and `procmail` installed. For me on Fedora this can
be accomplished using yum by running the following commands:

```sh
sudo yum install fetchmail procmail -y
```

We need to configure fetchmail to let it know where to retrieve our mail from.
This configuration file lives at `$HOME/.fetchmailrc`. By default fetchmail
will send all retrieved mail to the local SMTP server over a normal TCP
connection. This isn't necessary or ideal, rather we'll additionally supply a
local mail delivery agent (procmail) to handle processing the mail into the
Maildir format.

```
poll pop.gmail.com
protocol pop3
timeout 300
port 995
username "full_email@withdomain.tld" password "yourpassword"
keep
ssl
sslcertck
sslproto TLS1
mda "/usr/bin/procmail -m '/home/<username>/.procmailrc'"
```

Be sure to set the permissions on the `.fetchmailrc` file to 0600:

```sh
chmod 0600 $HOME/.fetchmailrc
```

We'll now need to configure procmail to properly deliver our mail to the local
`Maildir` folder. Procmail's configuration by default lives in
`$HOME/.procmailrc`

```sh
LOGFILE=$HOME/.procmail.log
MAILDIR=$HOME
VERBOSE=on

:0
Maildir/
```

With that done, simply run the `fetchmail` command. In my experience this can
take a while process and it seems like Google limits the number of emails you
can download at a time, so you may need to run the command a couple of times to
get all your emails.
