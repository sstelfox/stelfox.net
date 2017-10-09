---
title: iSCSI
---

***Note: This page is quite old and is likely out of date. My opinions may have
also changed dramatically since this was written. It is here as a reference
until I get around to updating it.***

This is the client configuration for iSCSI, please refer to [iSCSId][1] for the
server portion.

## Configuration

yum install iscsi-initiator-utils -y

```
iscsid.startup = /etc/rc.d/init.d/iscsid force-start
node.startup = automatic

node.session.auth.authmethod = CHAP
node.session.auth.username = client1
node.session.auth.password = XXXXXXXXXXXX

discovery.sendtargets.auth.authmethod = CHAP
discovery.sendtargets.auth.username = client1
discovery.sendtargets.auth.password = XXXXXXXXXXXX

node.conn[0].timeo.login_timeout = 10
node.conn[0].timeo.logout_timeout = 10
node.conn[0].timeo.noop_out_interval = 5
node.conn[0].timeo.noop_out_timeout = 5

node.session.cmds_max = 128
node.session.err_timeo.abort_timeout = 15
node.session.err_timeo.lu_reset_timeout = 30
node.session.err_timeo.tgt_reset_timeout = 30
node.session.initial_login_retry_max = 5
node.session.timeo.replacement_timeout = 120
node.session.queue_depth = 32
node.session.xmit_thread_priority = -20

#node.session.iscsi.InitialR2T = Yes
node.session.iscsi.InitialR2T = No

#node.session.iscsi.ImmediateData = No
node.session.iscsi.ImmediateData = Yes

node.session.iscsi.FirstBurstLength = 262144
node.session.iscsi.MaxBurstLength = 16776192
node.conn[0].iscsi.MaxRecvDataSegmentLength = 262144
node.conn[0].iscsi.MaxXmitDataSegmentLength = 0
discovery.sendtargets.iscsi.MaxRecvDataSegmentLength = 32768

#node.conn[0].iscsi.HeaderDigest = CRC32C,None
node.conn[0].iscsi.HeaderDigest = None

node.session.iscsi.FastAbort = Yes
```

```
[root@localhost ~]# chkconfig iscsi on
[root@localhost ~]# chkconfig iscsid on
[root@localhost ~]# service iscsi start
[root@localhost ~]# service iscsid start
[root@localhost ~]# iscsiadm --mode discovery --type sendtargets --portal <service_ip>
```

[1]: {{< relref "notes/iscsid.md" >}}
