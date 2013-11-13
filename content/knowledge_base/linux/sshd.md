---
title: SSHd
---

Secure Shell or SSH is a network protocol that allows data to be exchanged
using a secure channel between two networked devices. Used primarily on
GNU/Linux and Unix based systems to access shell accounts, SSH was designed as
a replacement for Telnet and other insecure remote shells, which send
information, notably passwords, in plaintext, rendering them susceptible to
packet analysis. The encryption used by SSH provides confidentiality and
integrity of data over an insecure network, such as the Internet.

## Security Notes

SSH is one of the crux services. An improperly configured SSH could be
equivalent to letting an attacker have physical access to the box.

## Firewall Adjustments

My default [IPTables](iptables) firewall already has the following rules in
place to allow access to SSH by default while still providing a modicum of
protection from attackers.

```
# Allow SSH, but no more than 5 new connections every minute
# Note: This has extreme repercussions if I was to use sftp as each file transfer
# initiates a new connection. Since it's rare for me to use sftp this isn't really an
# issue, however, when I do want to use it this rule will be the cause of failed
# transfers. Hopefully I will save myself the diagnostic nightmare scenario I went
# through last time
-A SERVICES -m tcp -p tcp --dport 22 -m state --state NEW -m recent --name SSH --set
-A SERVICES -m tcp -p tcp --dport 22 -m state --state NEW -m recent --update --seconds 60 --hitcount 5 --rttl --name SSH -j LOG --log-prefix "SSH Brute Force"
-A SERVICES -m tcp -p tcp --dport 22 -m state --state NEW -m recent --update --seconds 60 --hitcount 5 --rttl --name SSH -j DROP
-A SERVICES -m tcp -p tcp --dport 22 -m state --state NEW -j ACCEPT
```

On any sensitive system, where the server can be access from should be further
restricted. An example is provided below that only allows access from the
trusted LAN subnet, this should be used on the central syslog server and the
backup server (In the event of a server compromise I do not want to risk my
logs or backups to further compromise and SSH is probably my most vulnerable
service).

```
-A SERVICES -m tcp -p tcp -s 10.13.37.0/24 --dport 22 -m state --state NEW -m recent --name SSH --set
-A SERVICES -m tcp -p tcp -s 10.13.37.0/24 --dport 22 -m state --state NEW -m recent --update --seconds 60 --hitcount 5 --rttl --name SSH -j LOG --log-prefix "SSH Brute Force"
-A SERVICES -m tcp -p tcp -s 10.13.37.0/24 --dport 22 -m state --state NEW -m recent --update --seconds 60 --hitcount 5 --rttl --name SSH -j DROP
-A SERVICES -m tcp -p tcp -s 10.13.37.0/24 --dport 22 -m state --state NEW -j ACCEPT
```

## Configuration

### /etc/ssh/sshd_config

This ssh configuration should cover pretty much all the servers.

```
Port 22
AddressFamily inet
ListenAddress 0.0.0.0
Protocol 2

# Logging
SyslogFacility AUTHPRIV
LogLevel INFO

# Limit the ciphers to those which are FIPS approved and only use ciphers in counter (CTR) mode
Ciphers aes128-ctr,aes192-ctr,aes256-ctr

# Authentication:
LoginGraceTime 2m
PermitRootLogin without-password
StrictModes yes

# Pubkey counts as one of these, this will require brute force users
# to open a lot of connections, quickly blocking their access
MaxAuthTries 3

MaxSessions 2

PubkeyAuthentication yes
AuthorizedKeysFile      .ssh/authorized_keys

HostbasedAuthentication no
IgnoreRhosts yes

PermitEmptyPasswords no
PasswordAuthentication yes

ChallengeResponseAuthentication no

KerberosAuthentication no

GSSAPIAuthentication no

UsePAM no

# Accept locale-related environment variables
AcceptEnv LANG LC_CTYPE LC_NUMERIC LC_TIME LC_COLLATE LC_MONETARY LC_MESSAGES
AcceptEnv LC_PAPER LC_NAME LC_ADDRESS LC_TELEPHONE LC_MEASUREMENT
AcceptEnv LC_IDENTIFICATION LC_ALL LANGUAGE
AcceptEnv XMODIFIERS

AllowAgentForwarding no
AllowTcpForwarding no
GatewayPorts no
X11Forwarding no
PrintMotd yes
PrintLastLog yes
TCPKeepAlive no
UseLogin no
UsePrivilegeSeparation yes
PermitUserEnvironment no
Compression delayed

# Check the client every 15 seconds to make sure that it's still connected
# If no response is heard after 2 minutes assume the client is dead
ClientAliveInterval 15
ClientAliveCountMax 8

ShowPatchLevel no
UseDNS no
PermitTunnel no

# This is the number of unauthenticated open SSH connections
# After 10, there is a fifty percent chance a connection will be
# dropped until the queue reaches 20 at which point all further
# connections will be dropped until the queue clears
MaxStartups 10:50:20

PidFile /var/run/sshd.pid
Banner /etc/issue.net

# I never have use of sftp, preferring scp
#Subsystem      sftp    /usr/libexec/openssh/sftp-server

# Only allow SSH connections from users explicitly given that permission
AllowGroups sshers
```

There are two configuration options that can potentially break older versions
of the ssh server and should be commented out or removed they are: 

```
MaxSessions 5
...
AllowAgentForwarding yes
```

### /etc/issue.net

The net issue file is what gets displayed before a user logs in. The net issue
works as a deterrent, a set of policies, and informs any users trying to login
that they will be monitored. While this won't deter bots trying to brute force
the entry, it at the very least provides a professional appearance to let
potential bad users that they are not dealing with a service that was
accidentally left open and unconfigured.

```
***************************************************************************
     Authorized uses only.  All activity may be monitored and reported.
                            NOTICE TO USERS

This computer system is the private property of BedroomProgrammers.net.
It is for authorized use only. Users (authorized or unauthorized) have no
explicit or implicit expectation of privacy.

Any or all uses of this system and all files on this system may be
intercepted, monitored, recorded, copied, audited, inspected, and
disclosed in accordance with the BedroomProgrammers.net acceptable network
usage policy. 

By using this system, the user consents to such interception, monitoring,
recording, copying, auditing, inspection, disclosure at the discretion of
BedroomProgrammers.net and agrees to comply with all related policies,
procedures and guidelines. Unauthorized or improper use of this system may
result in civil and criminal penalties and administrative or disciplinary
action, as appropriate.

By continuing to use this system you indicate your awareness of and consent
to these terms and conditions of use. LOG OFF IMMEDIATELY if you do not agree
to the conditions stated in this notice.
****************************************************************************
```

### User Configuration

The SSH daemon configuration here restricts SSH access to only users in the
"sshers" group. This group will need to be created like so:

```
[root@localhost]# groupadd sshers -g 401
```

And you'll probably want to add a user to that group. If you want root to be
able to login remotely that account has to be in this group as well! The
following example adds root to the sshers group.

```
[root@localhost]# usermod -a -G sshers root
Adding user root to group sshers
```

And to remove root from the sshers group:

```
[root@localhost]# gpasswd -d root sshers
```

### Default SSH Client Configuration

```
# /etc/ssh/ssh_config
Host *
  CheckHostIP yes
  Compression yes
  CompressionLevel 6
  GSSAPIAuthentication yes
  HashKnownHosts yes
  Protocol 2
  SendEnv LC_ALL
  StrictHostKeyChecking ask
  VisualHostKey yes
```

## Multi-Factor Authentication

I would like to start out by mentioning yes, I know I'm paranoid. I have no
reason to explicitly believe that there is anyone actively trying to get into
my network and additionally I have no reason to believe that the data I'm
protecting has any value to anyone but myself. My response to anyone who thinks
this is excessive is, just because I'm paranoid doesn't mean someone isn't out
to get me. Besides what's the harm in adding another almost non-intrusive
security measure to the system?

Multi-factor authentication is using three or more different types of user
verification schemes to provide a considerably harder time for an unauthorized
user to gain access. These verification schemes can include but are not limited
to:

* Access control (firewall port restrictions or user ACL conditions)
* Something you know (your password or pass phrase)
* Something you have (your ssh key or secure id key-fob hardware)
* Something you are (fingerprint or iris scan)
* Somebody you know (human authentication through mutual acquaintance)
* Something you deduce (logical authentication which the user will need to
  reason, usually based on personal knowledge or life experience)

Multi-factor authentication can easily be implemented on these using built-in
functionality. Multiple verifications of the same type do not count towards the
number of verification schemes in use (for example both firewall and restrict
by user are both ACLs and thus count as one verification scheme) although they
can still increase the security of the box. Assuming that the server is
configured according to the guidelines on this wiki in regards to
[[Linux/IPTables]] and SSH, then it already has the following:

* limit access by group with the "AllowGroups" directive (whitelist - access
  control)
* use a password (something you know)

We can further increase the security into a true multi-factor authentication
system by disabling password based access and requiring the following:

* limit access to ssh by ip address (access control)
* use a pre-authorized ssh key (something you have)
* use that ssh key _with_ a strong pass-phrase (something you know)
* force a script to run on login that will ask questions of the user (logical
  authentication of a constantly changing answer)

The first can be done using [IPTables](iptables) and the rules are mentioned in
the firewall section of this page. I will cover the rest in the following two
sub-sections.

### SSH Authorized Keys

SSH authorized keys provide a considerably stronger authentication method than
a user's password as long as the key is protected by a pass-phrase. If the key
is left without a pass-phrase, anyone who manages to get access to the system
can immediately login as that user anywhere they have deployed the key. ENSURE
THERE IS A STRONG PASS-PHRASE ON THE KEY.

The keys are normally created as ~/.ssh/id_rsa and ~/.ssh/id_rsa.pub, however I
like to physically separate my keys from my computers so I'll give my keys a
descriptive name of username@host.key and put them on a pendrive located at
/media/pendrive. Personally I to use keys with 4096 bits. The following command
will create the public/private keys:

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
~/.ssh/authorized_keys on the remote host and make sure the file's permissions
are set to 0400.

You can use the utility by performing the following command, replacing
'remoteuser@remotehost' with a valid username and hostname for the remote host.

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
following line in /etc/ssh/sshd_config:

```
PasswordAuthentication yes
---- Replace with ----
PasswordAuthentication no
```

This replaces the 'something you know' of a password based login, with
'something you have' (the key, especially if it's on a pendrive) and 'something
you know' (the key's pass-phrase).

### Gatekeeper Script

If you've already implemented the SSH keys for authentication and have a
password on your key then you've already achieved multi-factor authentication,
as I've said before now I'm paranoid and any additional step that could keep
the baddies out of the systems that I need to ensure the security of is a step
that I'll take.

The gatekeeper script is something that I haven't come across on any other
systems that other people administer. Perhaps they haven't thought of it, or
perhaps it's too much trouble for them without much gain. I had the idea for
this while watching a James Bond movie (Golden Eye for those who care). A
Russian systems engineer put riddles on one of his machines that you had to go
through in order to access the system, while this alone isn't secure, asking
the user a random question that they alone would know the answer to couldn't
hurt the security. I highly recommend using some logic that changes
periodically, but the client can remotely deduce.

First we need to make a script to handle the additional authentication.Please
note that the following script is just an example, posting the actual script
would defeat the purpose of having it in the first place. You'll have to come
up with your own question and answer sections, though this is a good template
to start from.

```
#!/bin/sh
# Gatekeeper.sh - Post-login authentication script

# In the event that a user tries to get crafty and Ctrl-C out of the script
# we'll just kill the connection
trap jail INT
jail() {
    kill -9 $PPID
    exit 0
}

# Once a user logs in, check to see if they just wanted a shell.
# SSH_ORIGINAL_COMMAND will be null (-z) if they did
if [ -z "$SSH_ORIGINAL_COMMAND" ]; then
    # The answer the user needs to know, a function or call to another
    # script could be used to generate this answer based on any number
    # of resources available to the system. This could include querying an
    # internal web script to get a daily password user's of a site have
    # access to (and perhaps are supposed to be checking)
    CORRECT_ANSWER="muffins"

    # Message displayed to the user before being prompted, I'm going to assume
    # the user knows the question in this case what's the admin's favorite breakfast
    echo -n "Gatekeeper token authentication required: "

    # Get the user's answer. If the answer is correct execute the command.
    # If the answer is wrong, log the attempt and kill the connection.
    while read -s inputline; do
        RESPONSE="$inputline"
        echo ""
        if [ $CORRECT_ANSWER = "${RESPONSE}" ]; then
            echo "Gatekeeper authentication accepted."
            $SHELL -l
            exit 0
        else
            logger "Gatekeeper: $USER login failed from $SSH_CLIENT"
            kill -9 $PPID
            exit 0
        fi
    done
fi

# This command will bypass the gatekeeper script if the user tries to rsync
# as this script will break rsync. It creates a fresh shell just for good
# measure.
#if [ `echo $SSH_ORIGINAL_COMMAND | awk '{print $1}'` = rsync ]; then
#    $SHELL -c "$SSH_ORIGINAL_COMMAND"
#    exit 0
#fi

# If a user tried to execute something other than an 'approved' command
# just kill the session. This will prevent SCP and SFTP unless they are
# configured to bypass the script.
kill -9 $PPID
exit 0
```

Put this script in /etc/ssh/gatekeeper.sh and change it's permissions to 755
with the owner being root. To make the SSH server pass off control to the
Gatekeeper script once it's done authenticating a user, we'll use the
'ForceCommand' command in SSHd's config file (/etc/ssh/sshd_config). Add the
following line to the end of the config and restart the SSH daemon.

```
ForceCommand /etc/ssh/gatekeeper.sh
```

Assuming everything went according to plan, when you SSH into the remote server
once your done authenticating it'll ask for the token. Putting in 'muffins'
should get you to your shell, while anything else will kill the connection.
This provides the final layer of the multi-factor authentication as 'something
you deduce'.

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
[root@localhost]# mkdir -p /var/jail/{dev,etc,lib,lib64,usr/bin,bin,home}
[root@localhost]# chown -R root:root /var/jail/
[root@localhost]# mknod -m 666 /var/jail/dev/null c 1 3
```

There is something serious to note here. The [partitioning](partitioning)
security guidelines add two flags to the mount options of the /var partition.
You will need to remove the 'nosuid', and 'noexec' options from this partition
to be able use a chroot jail.

Next we need to copy a few minimum files into the jail's etc directory. Hard
links may work better for these as they will get properly updated with the rest
of the system, however, I am unsure whether or not that would actually work.

```
[root@localhost]# cp /etc/ld.so.cache /etc/ld.so.conf /etc/nsswitch.conf /etc/hosts /var/jail/etc/
```

At this point you need to decide what commands you want you're user to have
access too and copy the appropriate binaries into place. You can use the
'which' command to locate a binary and then copy it into the same directory
within the jail. The following is an example for moving 'bash' over.

```
[root@localhost]# which bash
/bin/bash
[root@localhost]# cp /bin/bash /var/jail/bin/
```

The trickiest part of setting up a jail is the required libraries for the
allowed executables. Conveniently, all the Linux distributions that I have
tried come with a tool too determine what libraries are required. "ldd". Here's
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
pam_loginuid.so in /etc/pam.d/sshd by commenting out the appropriate line.
