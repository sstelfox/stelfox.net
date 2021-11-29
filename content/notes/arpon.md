---
title: ARPOn
weight: 23

taxonomies:
  tags:
  - linux
  - networking
  - security
---

A tool for resisting arp spoofing on networks.

<!-- more -->

```
emerge net-analyzer/arpon
```

```
# /etc/conf.d/arpon

LOGFILE="/var/log/arpon.log"
ARPON_OPTS="--harpi --iface-auto --log --log-file ${LOGFILE}"
```

In arch this file seems to be named `/etc/arpon.conf`.

```
# /etc/arpon.sarpi

10.13.37.1   04:18:d6:f1:0b:d2
```

```
rc-update add arpon default
service arpon start
```
