---
title: iSCSId
---

***Note: This page is quite old and is likely out of date. My opinions may have
also changed dramatically since this was written. It is here as a reference
until I get around to updating it.***

This is the server configuration for iSCSI, please refer to [iSCSI][1] for the
client portion.

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

* http://fedoraproject.org/wiki/Scsi-target-utils_Quickstart_Guide - High Quality
* `http://www.ryanuber.com/a-quick-introduction-to-gfs2-over-iscsi.html` (dead link) - Transition from iSCSI to GFS2

[1]: {{< ref "./iscsi.md" >}}
