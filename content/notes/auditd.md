---
date: 2017-10-12 15:33:21-04:00
tags:
- linux
- security
title: Auditd
---

Auditd collects any configured syscall execution with critical security
metadata associated with the event. This can help enrich other security tools
such as [AIDE][1] to determine what user and process are responsible for the
change.

For reliable operation the rules should be carefully tuned to your system.
Tracking every write to disk will generate an unreasonable amount of events and
depending on the configuration of the kernel's audit subsystem, may trigger a
kernel panic.

Auditd will also identify the IP address a remote user is connecting in allow
cross system tracing of events.

## Recommended Events to Audit

* All logins to the system
* Writes & attribute changes on sensitive files that are largely static
  (think /etc)
* Writes & attribute changes to critical system binaries
* Write to the kernel / initramfs
* Any program executed with root privileges
* Any program execution that has the suid bit set
* Changes to SELinux policies
* Time / Date changes (both to the system and sensitive files)
* Truncation of log files
* Access to the audit and audit reporting tools and logs
* Creation, modification, and deletion of special files (think mknod)
* Mount and Unmount operations
* User & Group creation and removal
* Read/write access to private key material
* Changes to the hostname
* Any failure to access a file
* Changes to power state (such as shutdown)
* Administrative access to user home directories
* Executions out of temporary directories (Only important if this is possible,
  but never hurts)

## Log Integrity

For these logs to be meaningful they need to be shipped off a system. Auditd
itself can receive audit events over the network and comes with a utility for
pushing them over the network. Without kerberos though these events are sent
without authentication or encryption and could be tampered with or spoofed by a
crafty attacker.

Some log aggregators are able to read (tail) files and consume the lines as
events (such as [RSyslog][2]) and do so over a SSL or otherwise encrypted
tunnel.

The final option for getting logs off the system, is to specify a custom
dispatcher using the `dispatcher` config option in `/etc/audit/auditd.conf`.
This needs to be an executable on the system that will take audit records
through STDIN. A custom dispatcher could POST individual events to an API, log
the events directly to syslog, or anything else that can be coded. This will be
run with root permissions, so the ability for it to drop permissions is highly
desirable.

## Configuration

I have a sample [/etc/audit/auditd.conf][3] and [/etc/libaudit.conf][4]
available as well as a matching set of [/etc/audit/audit.rules][5] that are
tuned for my environments. I consider them a good starting point for other
people wanting detailed auditing logs.

## Audit Dispatcher

By default auditd has two mechanisms for sending audit events to an
administrator for review. The first and common one is to log directly to disk.
The other is to pass the events to a dispatch program. This is a very powerful
second option as the other program will receive a binary stream of all events
from auditd and can do anything with them.

Auditd comes with a dispatcher with the ability to send the messages directly
to syslog, to a remote auditd instance, or to a unix socket. I normally use the
log file option rather than the dispatcher, and use the ability to read in
files as a log source inside my syslog daemon of choice to get those messages
to a central log server. Sending them directly to syslog is signficantly more
efficient (push vs poll).

If you use another dispatcher other than the one that comes with auditd, be
aware that it will be started up with root privileges.

Unfortunately it seems like the dispatcher that comes with auditd 2.6.4 is
broken. With all plugins disabled (to eliminate them as a source of an issue),
I was still receiving the following message in syslog:

```
Dispatcher protocol mismatch, exiting
```

Which of course, hasn't seemed to have been encountered by anyone else online.
Digging through the source code, it seems audispd hasn't been updated for an
update to the protocol built into auditd. I'll have to look into either fixing
the source or writing my own dispatcher...

I wasn't able to find anything about fixes that may be related so I'm unsure
when it was fixed. I updated to 2.7.1 and it seemed to resolve that issue.

To get the information going to syslog I made two relatively small changes to
the exising configs. You really only need to set 'active' to yes in
`/etc/audisp/plugins.d/syslog.conf`. I made minor tweaks to the configs to
better support my logging environment (I keep local6 reserved for auditd
records). These two files include my relevant changes:

* [/etc/audisp/audispd.conf][6]
* [/etc/audisp/plugins.d/syslog.conf][7]

## More References

* https://access.redhat.com/documentation/en-US/Red_Hat_Enterprise_Linux/6/html/Security_Guide/chap-system_auditing.html
* http://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-123.pdf
* https://security.stackexchange.com/questions/4629/simple-example-auditd-configuration
* https://linux-audit.com/tuning-auditd-high-performance-linux-auditing/

[1]: {{< relref "notes/aide.md" >}}
[2]: {{< relref "notes/rsyslog.md" >}}
[3]: /note_files/auditd/auditd.conf
[4]: /note_files/auditd/libaudit.conf
[5]: /note_files/auditd/audit.rules
[6]: /note_files/auditd/audispd.conf
[7]: /note_files/auditd/audispd_syslog.conf
