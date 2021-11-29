---
title: iSCSId
weight: 23

taxonomies:
  tags:
  - linux

extra:
  done: true
  outdated: true
---

This is the server configuration for iSCSI, please refer to [iSCSI][1] for the
client portion.

<!-- more -->

## Configuration

Install the package `scsi-target-utils`.

Example config:

```
default-driver iscsi
initiator-address 10.0.0.100
#ignore-errors yes

<target iqm.2011-09.net.bedroomprogrammers.lab:example-srv.storage>
  backing-store /dev/vdb

  incominguser client1 XXXXXXXXXXXX
  incominguser client2 XXXXXXXXXXXX

  write-cache off
  vendor_id Bedroom Programmers
</target>
```

```
[root@localhost ~]# chkconfig tgtd on
[root@localhost ~]# service tgtd start
```

## References

* [Scsi-target-utils Quickstart Guide](https://fedoraproject.org/wiki/Scsi-target-utils_Quickstart_Guide)

[1]: @/notes/iscsi.md
