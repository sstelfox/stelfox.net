---
date: 2014-08-12 16:16:14 -0400
slug: dependency-prelink-issues
tags:
- linux
title: Dependency Prelink Issues
---

While running an aide check on one of my servers after updating it, I started
seeing a large number of very concerning warning messages:

```
/usr/sbin/prelink: /bin/mailx: at least one of file's dependencies has changed since prelinking
Error on exit of prelink child process
/usr/sbin/prelink: /bin/rpm: at least one of file's dependencies has changed since prelinking
Error on exit of prelink child process
/usr/sbin/prelink: /sbin/readahead: at least one of file's dependencies has changed since prelinking
Error on exit of prelink child process
/usr/sbin/prelink: /lib64/libkrb5.so.3.3: at least one of file's dependencies has changed since prelinking
Error on exit of prelink child process
/usr/sbin/prelink: /lib64/libgssapi_krb5.so.2.2: at least one of file's dependencies has changed since prelinking
```

The list went on with maybe a total of forty packages and libraries. My initial
reaction was 'Did I get hacked?'. Before running the updates I ran an aide
verification check which returned no issues and the files that were now
displaying the issue were in the packages that got updated.

What was the next worse scenario? The packages had been tampered with and I
just installed malicious files. This didn't seem likely as the packages are all
signed with GPG and an aide check would have caught tampering with my trust
database, the `gpg` binary, or the aide binary. Still a key could have been
compromised.

After some Googling I came across people with similar issues, (including one
annoyingly paywalled Red Hat article on the issue). Several people simply ended
the conversation on the assumption the user with the issue had been hacked.
Finally I [came across one helpful individual][1] with the fix. The binaries
just need to have their prelink cache updated again. This can be accomplished
with the following command on CentOS 6.5 (probably the same on others).

```
/usr/sbin/prelink -av -mR
```

*Update:* Ultimately I decided to follow [my own advice][2] (search for
prelink) and just simply disabled prelinking too prevent it from interferring
with aide checks and causing other weird issues. The memory trade-off isn't
valuable enough for me.

[1]: http://lists.centos.org/pipermail/centos/2007-December/049222.html
[2]: {{< relref "notes/linux_hardening.md" >}}
