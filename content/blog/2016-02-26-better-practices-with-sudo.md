---
created_at: 2016-02-26T17:45:22-0500
evergreen: true
public: true
tags:
  - linux
  - security
  - best-practices
  - sudo
slug: better-practices-with-sudo
title: Better Practices With Sudo
---

# Better Practices With Sudo

I work with a lot of different linux machines from embedded devices, to cloud servers and open stack hosts. For many of them I'm either the sole administrator or one of three or less with administrative access. Where there are multiple administrative users, we all are generally working as backups to each other. We use sudo whenever we need to execute a task with privileges on any of these machines with no direct root login permitted remotely.

I must confess I have established two habits over time that are against best practices with regard to sudo; Using it to execute a root shell only, and not restricting which commands can be run with sudo.

I'm sure many other administrators commit these sins as well. I've always gotten sudo to the 'good enough' point without ever learning how to configure it properly countless times, which mostly meant leaving the distribution's defaults.

At face value, executing a shell this way doesn't seem to pose a problem. We use auditd to record administrative changes, and the kernel can track our original login UID and record that in addition to our effective user ID. Permission to use sudo is still restricted to a subset of trusted administrators.

Using this default configuration is forming bad habits and after working through it it's not particularly hard to make a drastic improvement on the granularity of control.

I'm going to work through the changes I've made slowly building up my final configuration.

***These changes, if made incorrectly or with the wrong paths to binaries may effect your ability to get privileged access to the system. I strongly encourage you to maintain a root shell independent of the shell you are using to test just in case you need to revert a breaking change.***

## Minimal Configuration

Rather than looking at what needs to be changed, or removed I prefer to start with a minimal effective configuration.

Most distribution's default sudo configuration pass through environment variables related to locale and a few others. I have left these out since the way I see sudo executed most commonly ("sudo su -"), removes any environment variables passed through anyway. If you work on multi-lingual systems or otherwise your administrators make use of multiple system locales, you will want to re-introduce the locale values used.

My entire starting sudo configuration is the following:

```sudoers
Defaults env_reset
Defaults !visiblepw

root      ALL=(ALL)     ALL
%wheel    ALL=(root)    ALL
```

This is very similar to most distribution's configurations if you ignore the environment variables and comments. The root user and members of the wheel group can all execute anything as sudo as long as the user can authenticate through PAM and the mechanism won't display their password.

There is also a small restriction in place that ensures members of the wheel group will only be executing commands as the root user. Executing as other user's directly should be a special case and added separately.

Usually distributions also include additional sudo configuration by including all files in "/etc/sudoers.d". This configuration isn't going to be terribly long so we may as well KISS it and not allow the inclusion of other files.

## No Need for su

The first habit I wanted to break was executing "sudo su -" instead of "sudo -s". Generally when sudo is configured correctly, administrators are supposed to minimize the number of times dropping to a root shell. There are always going to be times when a root shell is necessary.

The differences between the two methods of executing a root shell are subtle. They are creating to different types of shells. Executing "sudo su -" creates a login shell, while "sudo -s" doesn't. Both can be subtly changed to provide the other type (Adding the "-i" flag to sudo, or removing the "-" from su).

A login shell resets your environment, spawns the new user's default shell (in this case root's default shell) and executes the user's profile scripts in addition to the shell's rc files.

By not using a login shell, administrators can keep their preferred shells while allowing selective bits of their configuration (whitelisted environment variables) through to the new session.

By removing "su" from the process, administrators can enforce permitted root shells just like whitelisting or blacklisting any other binary on the system. The only way to enforce this transition is to blacklist "su" directly.

A blacklist is added by creating a command alias that includes the commands to be blacklisted, then adjusting ACLs to make use of them. These need to be defined before they're used. Generally this means all command aliases are at the top of the configuration file. The following command alias will be used for our blacklist. The path to `su` is valid for CentOS 7, other distributions do vary.

```sudoers
Cmnd_Alias BLACKLIST = /bin/su
```

To enforce the blacklist the wheel group ACL needs to be adjusted to the following:

```sudoers
%wheel  ALL=(root)  ALL,!BLACKLIST
```

Now when you try to execute "sudo su -" you'll instead get this warning after authenticating:

```console
Sorry, user <username> is not allowed to execute '/bin/su -' as root on <hostname>.
```

This warning will enforce not using the less ideal mechanism.

## Brief Interlude on Blacklists

I'm going to be adding several more things to different forms of blacklists inside sudo. Some of these may be unacceptably inconvenient for some environments. If you find the explained reason insufficient to justify the inconvenience and are willing to accept the risk, remove the offender from the blacklist.

There is also always a risk that programs allowed through the blacklist have the ability to execute blacklisted applications as root. The blacklist applies only to direct execution through sudo.

Preventing 'commonly used' escalation vectors does make it that much harder on potential attackers and may allow you see an attack in progress through the logs. This should not be considered perfect though. A good example of these vectors is the utility "awk". If allowed to be executed through sudo an unrestricted root shell can be acquired with the following command:

```console
$ sudo awk 'BEGIN {system("/bin/sh")}'
```

## Editing Files as Root

Commonly when I wanted to edit a particular sensitive configuration file, I would drop to a root shell, then open the file in my preferred editor, possibly saving along the way until I was done. Less commonly I would open my editor directly using "sudo" skipping the shell entirely.

The partially complete saves as part of that workflow, have caused issues though they're temporary. Sudo provides a utility, "sudoedit", that covers this use case. It make a copy of the file to be edited into a temporary directory, and allows you to edit and save as you like. When you're done save the file and it will replace the real file with the temporary one you've been editing.

Editing the sudoers file itself should be done using the "visudo" command. And can be invoked by:

```console
$ sudo visudo
```

It's a good idea to restrict the list of editors that can be used by visudo (this doesn't affect sudoedit at all) by adding the following line (replace this with your preferred, colon separated list of editors):

```sudoers
Defaults editor = /bin/vim:/bin/nano
```

## User Writable Directories

Since the blacklist functionality is based on full paths to binaries, there is a quick way for a user with sudo permissions to bypass the blacklist for a specific program, copy it somewhere else.

When an attacker gets into a system and downloads a binary off their site they want to run with privileges. They'll have to put it somewhere they have permission to write to.

This is less of a threat if you always require authentication to use sudo, trust all your administrators, and are confident their credentials will never be stolen.

A salve to both problems is simply to prevent sudo from executing files in user writable directories, and ensuring it has a sane path to lookup trusted binaries. The following three lines need to be added to the sudoers file:

```sudoers
Cmnd_Alias USER_WRITEABLE = /home/*, /tmp/*, /var/tmp/*
Defaults ignore_dot
Defaults secure_path = /sbin:/bin:/usr/sbin:/usr/bin
```

We also need to modify our wheel ACL to prevent the execution in the aliases locations. Replace your previous line with the following one:

```sudoers
%wheel  ALL=(root)  ALL,!BLACKLIST,!USER_WRITEABLE
```

## Preventing Breakouts

I've already shown that there is a way to abuse individual commands to expose a root shell. There are a few additional common applications that can regularly shell out, advanced text editors, pagers, several unix utilities and any interactive programming shell are easy candidates.

These utilities likely still need to be available for general administrative purposes, but we don't want them in turn executing other programs. Sudo has a trick up it's sleeve for this, the noexec flag.

There are two ways to effectively apply this, a whitelist and a blacklist. I encourage you to try the whitelist approach first as it does offer substantially better protection against this potential abuse.

Before applying this it is useful to know how this works and what it's limitations are. Sudo disables the exec call using "LD_PRELOAD" and defining an alternate version of the system call. This is largely effective, but will only work with dynamically linked programs (most coming from a distribution are going to be dynamically linked).

### Whitelisting Programs w/ Exec Privileges

This is very strict but also very effective. We need to ensure that things we expect and want to be able to execute other programs (like shells) still can. Additionally visudo in turn executes your editor, so it to needs to be able to spawn programs.

Be very sure of the paths in the following change. If you have no shells, or editors that can be executed as root through sudo you may lock yourself out of your system privileges.

```sudoers
Cmnd_Alias SHELLS = /bin/sh, /bin/bash
Cmnd_Alias ALLOWED_EXEC = /usr/sbin/visudo
Defaults noexec
Defaults!ALLOWED_EXEC,SHELLS !noexec
```

As you use this in your environment you will probably find programs that behave incorrectly and will need to be added to the whitelist. This whitelist (assuming your paths are correct) will at least be enough to allow future modifications of the sudoers file.

### Blacklisting Programs w/ Exec Privileges

This is a much milder version of the exec restrictions, and won't catch unknown abuses. This will also have the least impact on normal operations to apply and is better than nothing.

```sudoers
Cmnd_Alias EDITORS     = /bin/vim
Cmnd_Alias PAGERS      = /bin/less, /bin/more
Cmnd_Alias BREAKOUT    = /bin/awk, /bin/find
Cmnd_Alias DEVEL_SHELL = /bin/perl, /bin/python, /bin/ruby

Defaults!EDITORS,PAGERS,BREAKOUT,DEVEL_SHELL noexec
```

## TTYs

Enforcing the use of TTYs generally prevents non-interactive processes from executing anything as sudo either remotely or locally. Examples of this might be from cron, apache, or from a remote Jenkins server. In almost all cases prevention of this type of execution is the ideal behavior.

There are a [couple](https://unix.stackexchange.com/questions/65774/is-it-okay-to-disable-requiretty) of very [visible](https://bugzilla.redhat.com/show_bug.cgi?id=1020147) search results on this topic that indicate there isn't any security benefit to this, but their are [exceptions](https://superuser.com/questions/180764/sudoers-files-requiretty-flag-security-implications) as well. The argument that seems to have the most merit, is that no special privileges are required to create a PTY. This in turn means an attacking process could spawn the PTY required, and continue it's attack.

The same argument could be used in favor of the option. An attacker would have learn they need to make this adjustment and actively work around it. As the administrator you know the option is set and should be able to work around it more easily than the attacker.

The most common form of pain seems to be remotely executing privileged commands through ssh. By providing the SSH command being executed the '-t' flag twice, the client will force a PTY allocation even when there is no local tty. Other more stubborn use cases can be individually exempted.

When the user already has a local TTY, the sudoers man page calls out to an additional potential attack vector around TTYs under the 'use_pty' option:

> A malicious program run under sudo could conceivably fork a background process that retains to the user's terminal device after the main program has finished executing. Use of this option will make that impossible.

I haven't been able to find any attacks that exploit this possibility, but I have yet to be impacted by turning that feature on within sudo. Making both changes can be done by adding the following line to the sudoers configuration.

```sudoers
Defaults requiretty, use_pty
```

## Notification of Violation

Receiving immediate notification when privilege gain has been attempted can be invaluable to stopping an attacker before they can do any damage. If the linux system has a properly configured MTA forwarding root's email to relevant parties it is recommended to have failure mailed to them directly to take action.

```sudoers
Defaults mail_badpass, mail_no_perms
Defaults mailfrom = root
Defaults mailsub = "Sudo Policy Violation on %H by %u"
```

The overridden subject provides everything but the command itself (which isn't available through the expanded variables) needed to quickly judge a threat at a glance.

## Auditing Interactive Shells

With all the protections put in place so far, we still have no visibility or restrictions on what administrators do with the root shells when they use them. These should hopefully be relatively few and far between.

Built into sudo is an option to *record* execution of commands. This has proven to be valuable to narrow down things that have gone wrong, or see how something was done before. This may not prove useful as much for an audit tool as a user with root privileges can purge the recordings and logs.

If auditing is the goal, use of the kernel audit subsystem may be a better choice, but will only give you the command and arguments executed. This shows what was displayed to the privileged shell directly. There will be a future article covering the use of the audit subsystem and centralizing the information in a future post.

If you didn't go the whitelist exec route, to enable this you will need to pull in the 'SHELLS' command alias from there to make use of this.

```sudoers
Defaults!SHELLS log_output
```

Once this is in place you can get a list of recorded sessions using the command:

```console
$ sudo sudoreplay -l
Feb 26 17:56:18 2016 : jdoe : TTY=/dev/pts/7 ; CWD=/home/jdoe ; USER=root ; TSID=000001 ; COMMAND=/bin/bash
```

To view an individual session provide "sudoreplay" with the TSID value of the session like so:

```console
$ sudo sudoreplay 000001
```

Refer to the man page of "sudoreplay" for additional tricks such as speeding up playback.

## Final Configuration

Some of the options from above I have combined into a single configuration line. This uses the stricter whitelist policy for exec privileges.

```sudoers
# /etc/sudoers

Cmnd_Alias ALLOWED_EXEC = /usr/sbin/visudo
Cmnd_Alias BLACKLIST = /usr/bin/su
Cmnd_Alias SHELLS = /usr/bin/sh, /usr/bin/bash
Cmnd_Alias USER_WRITEABLE = /home/*, /tmp/*, /var/tmp/*

Defaults env_reset, mail_badpass, mail_no_perms, noexec, requiretty, use_pty
Defaults !visiblepw

Defaults editor = /usr/bin/vim
Defaults mailfrom = root
Defaults mailsub = "Sudo Policy Violation on %H by %u"
Defaults secure_path = /sbin:/bin:/usr/sbin:/usr/bin

Defaults!ALLOWED_EXEC,SHELLS !noexec
Defaults!SHELLS log_output

root    ALL=(ALL)   ALL
%wheel  ALL=(root)  ALL,!BLACKLIST,!USER_WRITEABLE
```
