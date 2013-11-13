---
title: Memcached
---

## Installation

```
yum install memcached -y
```

## Configuration

Memcached doesn't have a whole lot of configuration options. There is the user
it's running under, what port it should listen on, what IP address it should
bind too and how large it's cache is. The default port is 11211 (TCP & UDP),
and by default it will bind to INADDR_ANY (0.0.0.0 and ::). Multiple addresses
CAN be specified to bind too with the -l flag. By default memcached will use
64Mb of memory.

These options can be set in /etc/sysconfig/memcached. Here is mine which
restricts where it's bound too. For my general use 64Mb of storage is more than
enough (roughly the equivalent of 17.5k pages of plain text and these are
simple key value text pairs).

```
PORT="11211"
USER="memcached"
MAXCONN="1024"
CACHESIZE="64"
OPTIONS="-l 10.100.0.14"
```

## Firewall

By default memcached listens on both UDP and TCP port 11211

