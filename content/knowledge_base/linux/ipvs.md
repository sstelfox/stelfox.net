---
title: IPVS
---

My VMs each have three interfaces, eth0 is the 'public' network network, eth1
is the 'keepalive' network, and eth2 is the 'internal' network. This sample
configuration will be making use of two directors and two "real servers".

The directors have hostnames 'director-01.i.0x378.net' and
'director-02.i.0x378.net'. 'director-01' will have device/IP pairs of (eth0,
192.168.122.141), (eth1, 10.10.10.10), and (eth2, 10.0.0.2). 'director-02' will
have device/IP pairs of (eth0, 192.168.122.142), (eth1, 10.10.10.11), and
(eth2, 10.0.0.3). There are two virtual IP addresses that will need to be
failed over, '192.168.122.140' on the 'public' network and '10.0.0.1'  on the
'internal' network.

These need to be failed over simulatenously.

First we need to install the packages:

```
yum install ipvsadm keepalived conntrack-tools -y
```

And copy our failover script into a useful place. This may need to be adjusted
for our specific cases in the future.

```
cp /usr/share/doc/conntrack-tools-1.4.2/doc/sync/primary-backup.sh /etc/conntrackd/
```

If the directors are running within an LXC environment, keepalived won't be
able to load the kernel module it needs for the services. From the host machine
you'll need to run the following command before attempting to start the
keepalived services.

```
modprobe ip_vs
```

This can be done automatically by creating `/etc/rc.d/rc.local` and marking it
as executable with the following contents.

```
#!/bin/sh

modprobe ip_vs
```

Edit the `/etc/keepalived/keepalived.conf`:

```
global_defs {
  notification_email_from failover@director-01.i.0x378.net
  notification_email {
    admin+failover@i.0x378.net
  }

  router_id LVS_DIRECTOR_01

  smtp_connect_timeout 5
  smtp_server          10.0.0.130
}

vrrp_sync_group gateway_group_1 {
  group {
    external_network_1
    internal_network_1
  }

  notify_backup "/etc/conntrackd/primary-backup.sh backup"
  notify_fault  "/etc/conntrackd/primary-backup.sh fault"
  notify_master "/etc/conntrackd/primary-backup.sh primary"

  smtp_alert
}

vrrp_instance external_network_1 {
  interface eth0

  state BACKUP

  advert_int        1
  priority          100
  virtual_router_id 20

  nopreempt

  lvs_sync_daemon_interface eth1
  unicast_peer              10.10.10.11

  authentication {
    auth_type PASS
    auth_pass password
  }

  virtual_ipaddress {
    192.168.122.140/24 dev eth0
    #2001:db8:15:7::100/64 dev eth0
  }
}

vrrp_instance internal_network_1 {
  interface eth2

  state BACKUP

  advert_int        1
  priority          100
  virtual_router_id 30

  nopreempt

  lvs_sync_daemon_interface eth1
  unicast_peer              10.10.10.11

  authentication {
    auth_type PASS
    auth_pass password
  }

  virtual_ipaddress {
    10.0.0.1/24 dev eth2
    #2001:db8:16:10::100/64 dev eth2
  }
}
```

For 'director-02' the `router_id`, `priority`, and `unicast_peer` should be set
to 'LVS_DIRECTOR_2', '50', and '10.10.10.10' respectively.

We now need to ensure we have the firewall rules in place to allow both LVS
instances to communicate their keepalive messages to each other. Add the
following firewall rules:

```
-A SERVICES -p vrrp -i eth2 -j ACCEPT
-A OUTPUT -p vrrp -i eth2 -j ACCEPT
```

On the second director the '11' suffix should be replaced with '10'.

At this point we can start up keepalived on both directors and test their
failover. Run the following two commands on both directors.

```
systemctl enable keepalived.service
systemctl start keepalived.service
```

