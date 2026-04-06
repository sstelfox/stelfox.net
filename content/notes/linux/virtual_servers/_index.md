---
created_at: 2013-01-01T00:00:01-0000
updated_at: 2026-04-05T00:00:00-0000
tags:
  - linux
  - networking
  - firewall
  - operations
title: Linux Virtual Servers
slug: virtual-servers
aliases:
  - /notes/linux-virtual-servers/
---
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
'192.168.122.140' on the 'public' network and '10.0.0.1' on the 'internal'
network.

These need to be failed over simultaneously.

First we need to install the relevant packages. The two you'll need are
`ipvsadm` and `keepalived`, available in most distribution repositories.

If the directors are running within an LXC environment, keepalived won't be
able to load the kernel module it needs for the services. From the host machine
you'll need to ensure the `ip_vs` module is loaded before attempting to start
the keepalived services.

```
modprobe ip_vs
```

To make this persistent across reboots, create a file at
`/etc/modules-load.d/ip_vs.conf` containing the module name:

```
ip_vs
```

Edit the `/etc/keepalived/keepalived.conf` with the following configuration:

[keepalived.conf](keepalived.conf)

For 'director-02' the `router_id` should be set to 'LVS_DIRECTOR_02'. You'll
also want to update the unicast peer addresses for the individual interfaces as
well. Since we've disabled `preempt` failover and are starting the servers in
the BACKUP state, adjusting the priority between the directors doesn't matter.

We now need to ensure we have the firewall rules in place to allow both LVS
instances to communicate their keepalive messages to each other. The following
ports and protocols need to be permitted:

| Port/Protocol | Direction | Description |
|--------------|-----------|-------------|
| VRRP (IP protocol 112) | Inbound/Outbound | Keepalived health checks between directors |

At this point we can start up keepalived on both directors and test their
failover. Run the following two commands on both directors.

```
systemctl enable keepalived.service
systemctl start keepalived.service
```

You can check the IP addresses of each node using `ip addr`. One of them will
have both of the virtual IP addresses. Shutdown the keepalive daemon on the
other one and you should see it failover and grab the virtual IP addresses
within a second.

```
systemctl stop keepalived.service
sleep 2
systemctl start keepalived.service
```

As much as I tried I couldn't get keepalived to make use of the synchronization
interface to send its VRRP packets. At the same time for my uses multicast
isn't an option which is why I chose unicast synchronization. If you have more
than two directors unicast will increase the amount of traffic required for the
synchronization.

## Conntrackd Tools

To allow us to use state based rules we'll also need to synchronize the known
connection states between the two machines for the event of failover. There is
a convenient system to do this. Enter `conntrackd`.

First we'll need to install the `conntrack-tools` package, which is available
in most distribution repositories.

We'll need to throw a configuration into place at
`/etc/conntrackd/conntrackd.conf`. The following is for director-01:

[conntrackd.conf](conntrackd.conf)

The only change for director-02 is to change the `IPv4_interface` to
`10.10.10.11`.

You'll notice that I am using multicast here. There is an option in conntrackd
to use unicast as well, and I'll need to come back and reconfigure it to make
use of it. For now though this should work in my environment.

The following ports need to be open for the synchronization process on both
machines:

| Port | Protocol | Direction | Description |
|------|----------|-----------|-------------|
| 3780 | UDP (multicast 225.0.0.50) | Inbound/Outbound | Connection state synchronization |

For most services I would also include connection tracking state information,
but given the nature of this service I decided against it.

Enable and start the service:

```
systemctl enable conntrackd.service
systemctl start conntrackd.service
```

There is some work that conntrackd will need to do whenever keepalive changes
its cluster state. A script is provided with the `conntrack-tools` package, we
can just copy it into the appropriate place with the following command:

```
cp /usr/share/doc/conntrack-tools-1.4.2/doc/sync/primary-backup.sh /etc/conntrackd/
```

Now we need to tell keepalived to call the script when its state changes. If
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
other machine dies, and provide high availability to multiple services behind
them.
