---
title: SSHd
---

***Note: This page is quite old and is likely out of date. My opinions may have
also changed dramatically since this was written. It is here as a reference
until I get around to updating it.***

Secure Shell or SSH is a network protocol that allows data to be exchanged
using a secure channel between two networked devices. Used primarily on
GNU/Linux and Unix based systems to access shell accounts, SSH was designed as
a replacement for Telnet and other insecure remote shells, which send
information, notably passwords, in plaintext, rendering them susceptible to
packet analysis. The encryption used by SSH provides confidentiality and
integrity of data over an insecure network, such as the Internet.

## Security Notes

SSH is a crux service. An improperly configured SSH could be equivalent to
letting an attacker have physical access to the box.

Generally it's recommended to run any instances of SSH exposed to the public
internet on an alternate port. Alternate ports won't protect you against
vulnerabilities but it will drastrically reduce the number of automated and
scripted attacks your server will be subjected to. If nothing else it will allow
real attacks to stand out more clearly in your logs.

## Firewall Adjustments

My default [IPTables][1] firewall already has the following rules in place to
allow access to SSH by default while still providing a modicum of protection
from attackers.

```
# Allow SSH, but no more than 5 new connections every minute Note: This has
# extreme repercussions if I was to use sftp as each file transfer initiates a
# new connection. Since it's rare for me to use sftp this isn't really an
# issue, however, when I do want to use it this rule will be the cause of
# failed transfers. Hopefully I will save myself the diagnostic nightmare
# scenario I went through last time
-A INPUT -m tcp -p tcp --dport 22 -m state --state NEW -m recent --name SSH --set
-A INPUT -m tcp -p tcp --dport 22 -m state --state NEW -m recent --update --seconds 60 --hitcount 5 --rttl --name SSH -j LOG --log-prefix "SSH Brute Force"
-A INPUT -m tcp -p tcp --dport 22 -m state --state NEW -m recent --update --seconds 60 --hitcount 5 --rttl --name SSH -j DROP
-A INPUT -m tcp -p tcp --dport 22 -m state --state NEW -j ACCEPT
```

## Configuration

### /etc/ssh/sshd_config

The following is a minimal SSHd config relying mostly on the defaults. It
requires a group named `sshers` to be created before hand and any user that
should have legitimate access via SSH should be added to the group.

```
Banner /etc/issue.net

ClientAliveInterval 60
TCPKeepAlive no

SyslogFacility AUTHPRIV
UseDNS no

PermitRootLogin no
PasswordAuthentication no
UsePAM yes

AllowTcpForwarding no
AllowGroups sshers

# Accept locale-related environment variables
AcceptEnv LANG LC_CTYPE LC_NUMERIC LC_TIME LC_COLLATE LC_MONETARY LC_MESSAGES
AcceptEnv LC_PAPER LC_NAME LC_ADDRESS LC_TELEPHONE LC_MEASUREMENT
AcceptEnv LC_IDENTIFICATION LC_ALL LANGUAGE
```

To create the group and add the user 'test' to it you can run the following
commands:

```
groupadd sshers
usermod -a -G sshers test
```

### /etc/issue.net

The net issue file is what gets displayed before a user logs in. While I'm
under no false pretense that having a policy displayed to a potential attacker
will prevent them from their malicious activity, it is generally recommended by
law enforcement to ensure that notice of unauthorized access was given prior.

At a minimum it will show the server has been professionally configured and
that they are not dealing with a service that was left unconfigured.

```
************************************************************************
This system is privately owned. If you are not authorized to access this
system, exit immediately. Unauthorized access to this system is
forbidden by organization policies, national, and international laws.
Unauthorized users are subject to criminal and civil penalties as well
as organization initiated disciplinary proceedings.

By entry into this system you acknowledge that you are authorized to
access and have been granted the level of privileges you will
subsequently execute on this system. You further acknowledge that by
entry into this system you expect no privacy from monitoring.
************************************************************************
```

### Default SSH Client Configuration

```
# /etc/ssh/ssh_config
Host *
  Compression yes
  HashKnownHosts yes
  Protocol 2
  SendEnv LC_ALL
  VerifyHostKeyDNS ask
  VisualHostKey yes
```

### SSH Authorized Keys

SSH authorized keys provide a considerably stronger authentication method than
a user's password as long as the key is protected by a pass-phrase. If the key
is left without a pass-phrase, anyone who manages to get access to the system
can immediately login as that user anywhere they have deployed the key. Ensure
there is a strong pass-phrase on the key.

The keys are normally created as `~/.ssh/id_rsa` and `~/.ssh/id_rsa.pub`,
however I like to physically separate my keys from my computers so I'll give my
keys a descriptive name of `username@host.key` and put them on a pendrive
located at `/media/pendrive`. Personally I to use keys with 4096 bits. The
following command will create the public / private keys:

```
[user@localhost ~]$ ssh-keygen -t rsa -b 4096 -f /media/pendrive/username@host.key
Generating public/private rsa key pair.
Enter passphrase (empty for no passphrase):
Enter same passphrase again:
Your identification has been saved in /media/pendrive/username@host.key.
Your public key has been saved in /media/pendrive/username@host.key.pub.
The key fingerprint is:
xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx user@localhost
```

Now that we have a strong key we just need to place it on the servers we want
to access. Conveniently enough there is a utility that makes this quick and
simple, if for some reason you don't trust this utility or want to do it by
hand just copy the contents of username@host.key.pub into
`~/.ssh/authorized_keys` on the remote host and make sure the file's
permissions are set to 0400.

You can use the utility by performing the following command, replacing
`remoteuser@remotehost` with a valid username and hostname for the remote host.

```
[user@localhost ~]$ ssh-copy-id -i /media/pendrive/username@host.key.pub remoteuser@remotehost
remoteuser@remotehost's password: 
Now try logging into the machine, with "ssh 'remoteuser@remotehost'", and check in:

  .ssh/authorized_keys

to make sure we haven't added extra keys that you weren't expecting.

[user@localhost ~]$ ssh -i /media/pendrive/username@host.key remoteuser@remotehost
Enter passphrase for key '/media/pendrive/username@remotehost.key':
[remoteuser@remotehost ~]$
```

Once your sure that the key based login is working you can safely disable
password based logins through ssh to the system entirely by changing the
following line in `/etc/ssh/sshd_config`:

```
PasswordAuthentication yes
---- Replace with ----
PasswordAuthentication no
```

This replaces the 'something you know' of a password based login, with
'something you have' (the key, especially if it's on a pendrive) and 'something
you know' (the key's pass-phrase).

## User Jails

Jails can isolate users from sensitive parts of the system, creating a 'fake'
environment for them to execute their programs. In the event that a user's
account becomes compromised, the jail can limit what an attacker has access too
though it should be considered a delay rather than a security measure since a
determined hacker might be able to break out of an otherwise secure jail.

To start off we're going to need to setup an environment for our jail. The
following commands create the base directories and the /dev/null device within
the jail.

```
mkdir -p /var/jail/{dev,etc,lib,lib64,usr/bin,bin,home}
chown -R root:root /var/jail/
mknod -m 666 /var/jail/dev/null c 1 3
```

There is something serious to note here. The [partitioning][2] security
guidelines add two flags to the mount options of the /var partition.  You will
need to remove the 'nosuid', and 'noexec' options from this partition to be
able use a chroot jail.

Next we need to copy a few minimum files into the jail's etc directory. Hard
links may work better for these as they will get properly updated with the rest
of the system, however, I am unsure whether or not that would actually work.

```
cp /etc/ld.so.cache /etc/ld.so.conf /etc/nsswitch.conf /etc/hosts /var/jail/etc/
```

At this point you need to decide what commands you want you're user to have
access too and copy the appropriate binaries into place. You can use the
`which` command to locate a binary and then copy it into the same directory
within the jail. The following is an example for moving `bash` over.

```
[root@localhost]# which bash
/bin/bash
[root@localhost]# cp /bin/bash /var/jail/bin/
```

The trickiest part of setting up a jail is the required libraries for the
allowed executables. Conveniently, all the Linux distributions that I have
tried come with a tool too determine what libraries are required. `ldd`. Here's
a little snippet that will give you a run down of the counts for the number of
times each library is used by a system:

```
find /bin -type f -perm /a+x -exec ldd {} \; \
| grep so \
| sed -e '/^[^\t]/ d' \
| sed -e 's/\t//' \
| sed -e 's/.*=..//' \
| sed -e 's/ (0.*)//' \
| sort \
| uniq -c \
| sort -n
```

If for some reason ldd isn't reporting all of the libraries, while the app is
running you can use this command to track down what it has actually loaded:

```
lsof -P -T -p Application_PID
```

A few references:

* http://www.fuschlberger.net/programs/ssh-scp-sftp-chroot-jail/
* http://allanfeid.com/content/creating-chroot-jail-ssh-access

## Multiplex-Sessions & Signed PubKeys

* http://comments.gmane.org/gmane.network.openssh.general/8269
* http://blog.johnjosephbachir.org/2006/11/19/multiplex-several-ssh-sessions-over-a-single-tcp-connection/

## Published SSH Host Keys

* https://www.rfc-editor.org/rfc/rfc4255.txt
* http://www.dnorth.net/2007/12/16/sshfp-howto/

## LXC Specific

If you want to run sshd in a LXC container you will need to disable
`pam_loginuid.so` in `/etc/pam.d/sshd` by commenting out the appropriate line.

## Misc

I've play around with implementing a [gatekeeper style script][3] to provide an
additional layer of security. In practice real multi-factor authentication is
more reliable and should be used instead.

[1]: {{< relref "notes/iptables.md" >}}
[2]: {{< relref "notes/partitioning.md" >}}
[3]: {{< relref "notes/sshd_gatekeeper.md" >}}
