---
title: Linux Hardening
type: note
---

# Linux Hardening

PLEASE NOTE: This guide was developed for Red Had Based architectures,
specifically CentOS 5, and Fedora 16+. A lot of the information here is
generally solid principles but you may need to adapt it to your distribution.

Hardening of all my servers is the largest piece IMHO to the [defence in
depth][1]. It brings to them each a strength to stand on their own. I want to
be able to plug each and everyone on a raw internet connection and feel safe
knowing that they won't be compromised.

In the event that any section of my defence fails, I'll know that the rest of
my systems are strong enough to hopefully be protected from whatever the weak
link was.

This section of my documentation provides a quick overview of procedures to
harden a system to make sure I never miss a step.

This hardening guide started out as a summary and a few updates to the [NSA
RedHat 5 Operating System Security Guidelings][2]. Since then it has grown to
include a lot of services that were not mentioned anywhere in there, and a few
best practices that I've developed myself over the years of managing Linux
boxes.

I've started including information from [National Vulnerability Database (NVD)
National Checklist Program Repository][3] hosted by NIST. They aggregate some
useful information from a few sites including the [Center for Internet Security
(CIS) Security Benchmarks][4]. One more site I've got some information from is
the [SANS Information Security Reading Room][5].

These have all been listed here to give them some credit towards the following
security guidelines. If you doubt anything I've mentioned here I'd recommend
you go look through these sites.

## General Principles

* Encrypt Transmitted Data Whenever Possible
* Minimize Software to Minimize Vulnerability
* Run Different Network Services on Separate Systems
* Configure Security Tools to Improve System Robustness
* Least Privilege

## Review of the Security Notes

This section is mostly a TODO for myself. To keep this as up to date and
relevant as possible I need to annually review the following information:

* Any pre-bootloader changes include BIOS, EFI, RAID, etc.
* OS install instructions
* Applications to be installed, possibly sorted by machine function
* Hardening guidelines starting with OS and including applications
* Instructions for validating the configurables
* Ensure exceptions are documented in the ticket for the device/machine
* Regularly validate the configuration, this should be automated if possible

## Hardware

Hardware and BIOS's change from machine to machine but there are some quick
best practices that should be followed. Follow the [BIOS][6] notes and ensure
the hardware is [physically secure][7].

## Installation Notes

* Follow the [Partitioning][8] guidelines.
* Ensure you set the date correctly so that the remote certificates can have
  their expiration properly checked
* Set a sufficiently strong boot loader password
* Set a sufficiently strong root password
* Install the absolute minimum required packages (Service specific packages can
  be installed afterwards)
* Include the updates repository, so there is never any initial out of date
  packages

## Firewall

A strong firewall does not just protect against incoming attacks but also
prevents a machine from connecting to things it shouldn't. In the event of a
partially compromised system, an egress ruleset can help prevent an attacker
from using the machine as a springboard to launch further attacks on the
internal networks.

IPv4 and IPv6 traffic have separate firewalls. Strong examples for configuring
[IPTables][9] and [IP6Tables][10] can be found on their respective
configuration pages.

## Networking

Follow the [Network][11] guide to configure a static address and gateway.

Update /etc/resolv.conf to include the proper domain and nameserver. It will
look something like this:

```
search internal.example.org
nameserver 4.2.2.2
nameserver 8.8.8.8
```

Verify hostname / domain in `/etc/sysconfig/network`. An example is given
below:

```
NETWORKING=yes
HOSTNAME=testing.internal.example.org
```

Edit `/etc/hosts`. Remove all the IPv6 loopback entries with the exception of
`localhost6` and all of the IPv4 addresses with the exception of `localhost`.
`127.0.0.1` should also have entries for the FQDN of this server and just the
hostname. Other extraneous entries should be removed unless absolutely
necessary.

```
127.0.0.1       testing.internal.example.org testing localhost localhost4
::1             testing.internal.example.org testing localhost localhost6
```

## Logging

You'll want to make sure you configure [RSyslog][12], [Logrotate][13], and
[Logwatch][14] according to their appropriate guides. Logwatch is not installed
in the minimum install and should be installed.

### Configure Root's Mail Recipient

Add the line to following line to `/etc/aliases`, replacing
`administrator@example.tld` with an administrator's email address. This is
where logs will be emailed.

```
root:     administrator@example.tld
```

As root run the `newaliases` command which will update the binary database of
mail recipients.

## Services

Review the list of services running on the machine with the following command:

```
systemctl --type=service
```

Pay special attention to any that is listed as "running", these are the always
on services that start up on boot. If it says "exited" it has started up on
boot finished whatever part in the boot process it took care of and then
properly exited. The latter need to be audited as well, if they're not needed
they should not be executing on boot.

Whenever you find a service that shouldn't be started on boot run the following
command replacing "rpcbind.service" with the service you would like to disable.

```
systemctl disable rpcbind.service
systemctl stop rpcbind.service
```

If it's particularily pesky about not going away you may need to mask it. This
will essentially create a symlink of the service to `/dev/null`, allowing it to
attempt to execute without actually accomplishing anything.

```
systemctl mask rpcbind.service
```

To re-enable a service you'll want to execute the following commands:

```
system enable rpcbind.service
system start rpcbind.service
```

If you masked the service you'll need to unmask it before re-enabling it.

```
systemctl unmask rpcbind.service
```

You need to be aware that the mask / unmask command is a stronger version of
"disable", disable just prevents systemd from starting the service on boot.
"mask" links the service file to `/dev/null` preventing manual activation as
well as other services attempting to start it as requirements.

If you mask a critical service that the machine need to boot it will fail and
you'll need to fix this by hand in the debug shell.

### All Server Services

On all of my servers I configure:

* [SSHd][15] (If you follow this guide, you won't be able to SSH into the box
  until users and groups have been configured)
* [NTPd][16] or [Chronyd][17] (pick your preference)
* [RSyslog][12]

## Updates

Updates regardless of whether [KSplice][18] is being used should be done as
soon as possible. For the most part there shouldn't be any reason not to update
automatically unless you are using untrusted repositories.

There is a daemon available [yum-updatesd][19] in the Fedora repositories which
can be configured to notify administrators of new packages and optionally
install them automatically.

### Updating Manually

Updating the system manually can be performed using the following command:

```
yum update
```

## Init Process

Ensure that root logins are only permitted on appropriate terminals in
`/etc/securetty`. An example used by me is the following:

```
tty1
tty2
tty3
```

If I'm going to access the system of the serial console I'd want to add
"console" to that as well.

The init process by default starts with that pretty plymouth graphical boot
loader, to change it back to the default linux boot sequence that is actually
verbose and useful you need to make a few changes to the `/etc/sysconfig/init`
file. I use the following:

```
BOOTUP=verbose
AUTOSWAP=no
ACTIVE_CONSOLES=/dev/tty[1-3]
SINGLE=/sbin/sulogin
```

The changes actually made reduces the number of active TTYs to 3 from 6,
requires a root login to get into single user mode, and disables the pretty
color status display when in text mode during boot up.

The other change that needs to be made is in the default grub options in
`/etc/default/grub`. Remove `rhgb` and `quiet` from the `GRUB_CMDLINE_LINUX`
variable. Strictly speaking you don't need to remove quiet, however, it allows
the kernel to print out it's boot messages which can help debug some lower
level issues and I generally find it useful. After making the change you'll
need to run `grub2-mkconfig -o /boot/grub2/grub.cfg` as root.

One thing that I have noticed is that as of grub2 if a boot password is defined
you need to add `--unrestricted` to the menu entry if you want to boot the menu
entry without a super user password. I've done this in `/etc/grub.d/10_linux`
by adding ` --unrestricted` to the `CLASS` environment variable around line 29
and rebuilding the grub config.

## Sudo

Sudo is one of those things that I need to go through and properly restrict.
Since I'm usually the lone administrator or am very close with the few others
on servers and I trust the people given sudo permissions with global root like
permissions.

This definitely has larger security implications but here is how to configure
that. This grants unlimited sudo privileges to any user in the sudoers group.
They still need to authenticate however.

Edit `/etc/sudoers` adding the line:

```
%sudoers                ALL=(ALL)        ALL
```

## Users

### Password Requirements

Update the minimum user password to 10 characters in `/etc/login.defs`

### Creation

If local authentication is used, create any users that will need access to the
system using the following command:

```
useradd <username>
passwd <username>
```

If the user isn't available locally to enter their own password, a hash from
another system can be extracted and dropped into place or alternatively a very
strong temporary password can be set and provided to the user through secure
means. You can then run the following command to force the user to change their
password the next time they login:

```
chage -d 0 <username>
```

### Securing System Users

Review `/etc/passwd` to ensure all non-user accounts have their account shells
set to `/sbin/nologin` with the exception of `halt`, `shutdown`, `sync` which
should be `/sbin/halt`, `/sbin/shutdown`, and `/bin/sync` respectively.

[Mysql][20] creates it's user with `/bin/bash` as the shell which shouldn't be
(this is just an example).

### System Wide Settings

Edit `/etc/profile`, find `HISTSIZE` replace that line with these couple of
lines.

```
readonly HISTSIZE=50
export readonly TMOUT=900
export readonly HISTFILE="$HOME/.bash_history"
```

## Groups

### Creation

Create the sudoers and sshers group

```
groupadd sudoers -g 400
groupadd sshers -g 401
```

### Add Users

```
useradd <username>
passwd <username>
```

Any users that are going to be SSH'ing into the server should be added to the
`sshers` group. This includes root if necessary (which by default is only
available to pubkey based authentication if you follow this guide).

```
usermod -a -G sshers <username>
```

Any users that NEED sudo permission should be added to the `sudoers` group like
so:

```
usermod -a -G sudoers <username>
```

You can do both at the same time like so:

```
usermod -a -G sshers,sudoers <username>
```

## System Hardening

* Change the permissions of the rpm binary `/bin/rpm` to `0700`
* Remove suid privileges on `/bin/mount` and `/bin/umount` using the following
  command: `chmod a-s /bin/mount /bin/umount`
* Create `/etc/cron.allow` and `/etc/at.allow` putting `root` in both of them.
  Set the permissions on the files to `600`.
* Restrict permissions on all of the cron tasks using the following command:
  `chmod -R go-rwx /etc/cron.* /etc/crontab`
* Restrict boot configurations to only be readable / writable by root
  `chmod 600 /etc/grub.conf`
* Restrict access to the boot scripts `chmod -R go-rwx /etc/rc.d`
* Change the owner and permission of the sudo binary to be owned by
  `root:sudoers` and have permissions `750`

You'll want to verify that that there are not more SUID or GUID flags set than
absolutely necessary. You can find all of the files with these flags set with
the following command:

```
[root@localhost ~]# find / -type f \( -perm -04000 -o -perm -02000 \)
```

The same goes for unowned files as there should never be any of these:

```
[root@localhost ~]# find / \( -nouser -o -nogroup \) -print
```

Something that should be considered is security limits per user. This can not
only be used to prevent users from abusing the system but to prevent a user
accidentally fork bombing a system or causing other kinds of havoc. These
settings can be found in `/etc/security/limits.conf`

### Checklist

* Network
  * If DHCP is used, minimize accepted options `/etc/dhclient.conf`
    * Accept only IP, Router, DNS
    * Override domain name
* Package updating
  * Install additional packages
    * aide
* Disable USB Support
  * Disable usb-storage kernel module in `/etc/modules.d/blacklist.conf`
  * If USB devices are completely unecessary, disable USB completely with the
    `nousb` option in kernel boot options
* Set `kernel.randomize_va_space` to 2, 1 if that's not possible
* Disable Rebooting When 'ctrl-alt-del' is Pressed
  * `/etc/init/control-alt-delete.conf`: -exec /sbin/shutdown -r now
    "Control-Alt-Delete pressed"

### Updating Software

* Repository Configuration
  * yum install yum-plugin-fastestmirror yum-plugin-security yum-presto \
    yum-plugin-changelog yum-plugin-protectbase -y
  * Configure local repository if available
  * If using the btrfs filesystem install yum-plugin-fs-snapshot
* Manual Software Update
  * Manual verification of installed GPG key with remote resource
  * Verify gpgcheck is enabled in all yum configuration files
* Configuring Automatic Updates
  * [Fedora Update & Security Check Script][21]

### Permission Verification

* Verify Permissions on passwd, shadow, group, and gshadow Files
* Verify All World-Writeable Directories Have Sticky Bits Set
* Verify All World Writeable Directories Have Proper Ownership
* Find Unauthorized World-Writeable Files
* Find Unauthorized SUID/SGID System Executables
* Find and Repair Unowned Files
* Restrict access to init files only to root `/etc/rc.d`
* Restrict Permissions on Files Used by cron

### Restrict Dangerous Execution Patterns

* Set Daemon umask to `027`
  * `/etc/init.d/functions`: `umask 022` -> `umask 027`
* Disable Core Dumps
  * `/etc/security/limits.conf`: `+*                hard    core            0`
  * `/etc/sysctl.conf`: `+fs.suid_dumpable = 0`
* Disable Prelink (if turned on)
  * `/etc/sysconfig/prelink`: `PRELINKING=yes` -> `PRELINKING=no`
  * `/usr/sbin/prelink -ua`
  * `yum remove prelink -y`

### Restrict Password Based Login

* Limit `su` Access to `root` and the `wheel` Group
  * `chgrp wheel /bin/su && chmod o-rx /bin/su`
* Configure sudo to Improve Auditing of Root Access
  * Create `sudoers` Group and Allow it to Use sudo
* Verify Proper Storage and Existence of Password Hashes
* Verify No Non-root Accounts Have UID 0

### Account Security

* Create a Unique Default Group for Each User
* Create and Maintain a Group Containing All Human Users
  * `users` Group
* Set Password Quality Requirements
  * Either [pam_cracklib][22] or [pam_passwdqc][23]
* Set Lockouts for Failed Password Attempts
  * [|pam_tally2][24]
* Set Password Hashing Algorithm to SHA-512
  * `/etc/pam.d/system-auth`: Ensure: `password     sufficient    pam_unix.so
    {sha512}`
  * `/etc/login.defs`: Ensure: `ENCRYPT_METHOD SHA512`
  * `/etc/libuser.conf`: Ensure: `crypt_style = sha512`
* Limit Password Reuse
  * `/etc/pam.d/system-auth`: `password    sufficient    pam_unix.so` +
    <existing options> remember=5
* Ensure User Home Directories Are Not Group-Writable or World-Readable
* Ensure User's Hidden Files Are Not World-Writeable
* Configure User umask Values
  * `/etc/profile`: `umask 022` -> `umask 027`
* Use a Centralized Authentication Service
* Ensure there are no dangerous directories in root's path (realtive or
  world-writable)

### SELinux

* Ensure SELinux is Properly Enabled
* Disable and Remove SETroubleshoot if Possible
* Disable MCS Translation Service (mcstrans) if Possible
* Configure Restorecon Service (restorecond)
* Check for Unconfined Daemons
* Check for Unlabeled Device Files
* Debug any SELinux Policy Errors
* Strengthen the Default SELinux Boolean Configuration

### Network/Firewall Configuration

* Ensure System is Not Acting as a Network Sniffer
* Remove Wireless Hardware if Possible
* Disable Wireless Through Software Configuration if Possible

### Logging and Auditing

* Configure auditd's Data Retention
* Enable Auditing for Processes Which Start Prior to the Audit Daemon
* Configure auditd Rules for Comprehensive Auditing
* Configure Audit Log aureport To Send Daily Emails

### Misc

* Add Local [Certificate Authority][25]'s Public Key to the Trusted Store
* Harden [sysctl.conf][26] Values

### Services

* Configure SMART Disk Monitoring
* Disable at & anacron if Possible
* Configure an MTA if necessary

[1]: https://en.wikipedia.org/wiki/Defence_in_depth
[2]: http://www.nsa.gov/ia/_files/os/redhat/NSA_RHEL_5_GUIDE_v4.2.pdf
[3]: http://web.nvd.nist.gov/view/ncp/repository
[4]: http://benchmarks.cisecurity.org/en-us/
[5]: http://www.sans.org/reading_room/
[6]: ../../security/bios/
[7]: ../../security/physical/
[8]: ../partitioning/
[9]: ../iptables/
[10]: ../ip6tables/
[11]: ../network/
[12]: ../rsyslog/
[13]: ../logrotate/
[14]: ../logwatch/
[15]: ../sshd/
[16]: ../ntpd/
[17]: ../chronyd/
[18]: ../ksplice/
[19]: ../yum-updatesd/
[20]: ../mysql/
[21]: ../../security/fedora_check/
[22]: ../pam_cracklib/
[23]: ../pam_passwdqc/
[24]: ../pam_tally2/
[25]: ../certificate_authority/
[26]: ../sysctl/

