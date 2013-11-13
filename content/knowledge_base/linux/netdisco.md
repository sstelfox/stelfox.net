---
title: Netdisco
---

## Notes

IPTables gets stopped before running the netdisco configuration utility as it
uses a bunch of ports that wouldn't necessarily be open normally. SELinux is a
tricky one it blocks placement of file and permissions and prevents Apache from
starting up (probably due to the location of the netdisco root), I haven't
investigated yet.

```
[root@localhost ~]# yum install netdisco -y
[root@localhost ~]# service iptables stop
[root@localhost ~]# setenforce 0
[root@localhost ~]# netdisco_config
```

This package was mostly useless too me...

