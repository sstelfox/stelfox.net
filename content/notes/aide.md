---
date: 2017-10-09 14:19:45+00:00
tags:
- linux
- security
title: AIDE
---

AIDE (Advanced Intrusion Detection Environment) is a file and directory
integrity checker that compares the current hashes, permissions, and attributes
of files directories against a known database built from the system.

This can be run periodically to detect manipulation of critical system files,
though a motivated attacker with an appropriate level of permissions could
modify this database or disable the check as long as the system is able to
write to it.

For this to be effective this process needs to be added to the systems update
process and the database should be backed up immediately after being updated.
With good backups in place this can help identify what changes were made by an
attacker after a breach which can be invaluable in knowing both the impact and
intent of a security incident.

## Import Caveat

There does seems to be an issue that causes core dumps like so:

```
Floating point exception (core dumped)
```

I initially suspected UTF-8 characters in the path name or to many files. Both
I was able to disprove. I can enable all checks on an effected directory except
for any of the hashes (I tested all the ones available to me individually).

The issue itself could be with the specific compiled version (community/aide
0.16-1 on arch linux) I was testing with.

After strace'ing down the files it was having issues with I simply excluded the
files that were triggering the issue from checksum validation. I couldn't find
anything unusual about the files themselves though... no extended attributes,
normal permissions, readable... Maybe a bug in libmhash?

## Secure Usage

While this utility provides no preventative defense measures, it is extremely
useful in the detection of malicious behavior on the host. To perform this
detection, a cron job should periodically have AIDE analyse the files it is
monitoring and report the findings. A central logging system should be setup to
consume these reports.

For these reports to be effective, the reference database needs to be trusted
and well maintained. To accomplish this I recommend hosting a read-only NFS
volume mounted at a known location to store the current database.

This database will likely need to be updated after every system update as
critical binaries and config files may have been updated. If an automation
system like [puppet][1] is in use, automatic modification of configuration
files or installed packages may also trigger this.

## Initial Setup

The defaults are sane for usage on a single system. After the initial
installation the database needs to be initialized which can be done with the
following command:

```sh
# aide -i
```

Depending on the amount of packages installed on your system and the speed of
your disks this can take quite some time (on a fairly minimal production system
for me this took about two minutes). You then need to copy the created database
into the reference location:

```sh
# cp /var/lib/aide/aide.db{.new,}.gz
```

You can confirm the system is working with:

```sh
# aide -C
```

If any monitored file or directory's attributes changed they will be reported
to both stdout and written to `/var/log/aide/aide.log`. This file is always
completely rewritten after every run, if you want to keep historical reports,
[logrotate][2] can be used to move these files aside.

I do recommend reviewing the configuration file both to ensure all critical
system directories are covered on your systems and to be aware of what is
monitored and to what extent. Pay special attention to the package manager
files of your system as they may not be included in the default config.

If you make any changes it is wise to validate the config afterwards by
running:

```sh
# aide -D
```

It will produce no output and exit with a zero status if the configuration is
valid.

I have a modified configuration file covering my general use case
[available][3], a slightly tweaked [cron job][4] ([original here][5]), and
slightly [modified script][6] to check AIDE itegrity remotely using SSH
(original in the contrib directory of the AIDE source). If you use any of these
you will likely need to adjust paths to match the config.

[1]: {{< relref "notes/puppet.md" >}}
[2]: {{< relref "notes/logrotate.md" >}}
[3]: /note_files/aide/aide.conf
[4]: /note_files/aide/aide.cron
[5]: http://sources.gentoo.org/cgi-bin/viewvc.cgi/gentoo-x86/app-forensics/aide/files/aide.cron
[6]: /note_files/aide/sshaide.sh
