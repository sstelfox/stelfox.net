---
title: Linux Virtual Servers
---

***Note: This page is quite old and is likely out of date. My opinions may have
also changed dramatically since this was written. It is here as a reference
until I get around to updating it.***

## Keepalived

My VMs each have three interfaces, eth0 is the 'public' network network, eth1
is the 'synchronization' network, and eth2 is the 'internal' network. This
sample configuration will be making use of two directors and two "real
servers".

The directors have hostnames 'director-01.i.0x378.net' and
'director-02.i.0x378.net'. 'director-01' will have device/IP pairs of (eth0,
192.168.122.141), (eth1, 10.10.10.10), and (eth2, 10.0.0.2). 'director-02' will
have device/IP pairs of (eth0, 192.168.122.142), (eth1, 10.10.10.11), and
(eth2, 10.0.0.3).

There are two virtual IP addresses that will need to be failed over,
'192.168.122.140' on the 'public' network and '10.0.0.1'  on the 'internal'
network.

These need to be failed over simulatenously.

First we need to install the packages:

```
yum install ipvsadm keepalived -y
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
  notification_email_from failover@example.tld
  notification_email {
    admin+failover@example.tld
  }

  router_id LVS_DIRECTOR_01

  smtp_connect_timeout 5
  smtp_server          127.0.0.1
}

vrrp_sync_group gateway_group_1 {
  group {
    external_network_1
    internal_network_1
  }

  smtp_alert
}

vrrp_instance external_network_1 {
  interface eth0

  state BACKUP

  advert_int        1
  garp_master_delay 1

  priority          100
  virtual_router_id 20

  nopreempt

  unicast_peer {
    # IP address of the other director's eth0 interface
    192.168.122.40
  }

  # You'll want to change this password...
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
  garp_master_delay 1

  priority          100
  virtual_router_id 21

  nopreempt

  unicast_peer {
    # IP address of the other director's eth2 interface
    10.0.0.11
  }

  # You'll want to change this password...
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

For 'director-02' the `router_id` should be set to 'LVS_DIRECTOR_02'. You'll
also want to update the unicast peer addresses for the individual interfaces as
well. Since we've disabled `preempt` failover and are starting the servers in
the BACKUP state, adjusting the priority between the directors doesn't matter.

We now need to ensure we have the firewall rules in place to allow both LVS
instances to communicate their keepalive messages to each other. Add the
following firewall rules:

```
-A SERVICES -i eth0 -p vrrp -s 192.168.122.0/24 -j ACCEPT
-A SERVICES -i eth2 -p vrrp -s 10.0.0.0/24 -j ACCEPT
-A OUTPUT -o eth0 -p vrrp -d 192.168.122.0/24 -j ACCEPT
-A OUTPUT -o eth2 -p vrrp -d 10.0.0.0/24 -j ACCEPT
```

At this point we can start up keepalived on both directors and test their
failover. Run the following two commands on both directors.

```
systemctl enable keepalived.service
systemctl start keepalived.service
```

You can check the IP addresses of each nodes using `ip addr`. One of them will
have both of the virtual IP addresses. Shutdown the keepalive daemon on the
other one and you should see it failover and grab the virtual IP addresses
within a second.

```
systemctl stop keepalived.service
sleep 2
systemctl start keepalived.service
```

As much as I tried I couldn't get keepalived to make use of the synchronization
interface to send it's VRRP packets. At the same time for my uses multicast
isn't an option which I why I chose unicast synchronization. If you have more
than two directors unicast will increase the amount of traffic required for the
synchronization.

## Conntrackd Tools

To allow us to use state based rules we'll also need to synchronize the known
connection states between the two machines for the event of failover. There is
a convenient system to do this. Enter `conntrackd`.

First we'll need to install the package that has the synchronization daemon.

```
yum install conntrack-tools -y
```

We'll need to throw a configuration into place at
`/etc/conntrackd/conntrackd.conf`. The following is for director-01:

```
Sync {
  Mode FTFW {
    DisableExternalCache Off
    PurgeTimeout 5
  }

  Multicast {
    IPv4_address 225.0.0.50
    Group 3780
    IPv4_interface 10.10.10.10
    Interface eth1
    SndSocketBuffer 1249280
    RcvSocketBuffer 1249280
    Checksum on
  }
}

General {
  Nice -20

  HashSize 32768
  HashLimit 131072

  Syslog on

  LockFile /var/lock/conntrack.lock

  UNIX {
    Path /var/run/conntrackd.ctl
    Backlog 20
  }

  NetlinkBufferSize 2097152
  NetlinkBufferSizeMaxGrowth 8388608

  Filter From Userspace {
    Protocol Accept {
      #DCCP
      ICMP
      IPv6-ICMP
      #SCTP
      TCP
      UDP
    }

    Address Ignore {
      # Loopback addresses
      IPv4_address 127.0.0.1
      IPv6_address ::1

      # The director IP addresses
      IPv4_address 10.0.0.10
      IPv4_address 10.0.0.11
      IPv4_address 192.168.122.40
      IPv4_address 192.168.122.41

      # The keepalive network
      IPv4_address 10.10.10.0/24

      # The virtual IP addresses
      IPv4_address 192.168.122.140
      IPv4_address 10.0.0.5
    }
  }
}
```

The only change for director-02 is to change the `IPv4_interface` to
`10.10.10.11`.

You'll notice that I am using multicast here. There is an option in conntrackd
to use unicast as well, and I'll need to come back and reconfigure it to make
use of it. For now though this should work in my environment.

Add the firewall rules needed for the synchronization process on both machines:

```
-A INPUT -i eth1 -m udp -p udp -s 10.10.10.0/24 -d 225.0.0.50 --dport 3780 -j ACCEPT
-A OUTPUT -o eth1 -m udp -p udp -d 225.0.0.50 --dport 3780 -j ACCEPT
```

For most services I would also include connection tracking state information,
but given the nature of this service I decided against it.

Enable and start the service:

```
systemctl enable conntrackd.service
systemctl start conntrackd.service
```

There is some work that conntrackd will need to do whenever keepalive changes
it's cluster state. A script is provided with the `conntrack-tools` package, we
can just copy it into the appropriate place with the following command:

```
cp /usr/share/doc/conntrack-tools-1.4.2/doc/sync/primary-backup.sh /etc/conntrackd/
```

Now we need to tell keepalived to call the script when it's state changes, if
you're following along with this page you'll need to add the following to the
section named `vrrp_sync_group gateway_group_1`.

```
notify_backup "/etc/conntrackd/primary-backup.sh backup"
notify_fault  "/etc/conntrackd/primary-backup.sh fault"
notify_master "/etc/conntrackd/primary-backup.sh primary"
```

Make sure you restart keepalived on both machines.

At this point we have everything in place we need to perform our two target
tasks. Having a gateway on the local network that can failover in the event the
other machine dies, and provide highly availability to multiple services behind
them.
