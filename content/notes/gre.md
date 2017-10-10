---
date: 2017-10-09 22:14:23+00:00
tags:
- linux
- networking
title: GRE Tunnel
---

GRE encapsulates all layer 2 traffic, but does so through an unencrypted
tunnel. Sensitive traffic should exclusively go through a lower level encrypted
tunnel like IPSec.

## Firewall

The following iptables need to be enabled to allow the GRE traffic to and from
the system. This should be restricted to / from IP addresses as well.

```
-A INPUT  -p 47 -j ACCEPT
-A OUTPUT -p 47 -j ACCEPT
```

## Manual Setup

I've seen several setups on the internet that make some... Odd choices. When
making one of these tunnels, the inner IP addresses should be an independent
network from any other on the router. Other setups recommend re-using an
already existing IP, or another IP on an existing network which will likely
leak traffic between the tunnel and the local network.

Tunnel keys don't provide very much security, but it is a small layer of
protection that is trivial to add.

This setup is between two hosts. The first host has a private network of
10.0.0.0/24, a public IP of 1.2.3.4 and will use an inner tunnel IP of
172.16.10.1. The second host has a private network of 10.16.0.0/24, a public IP
of 4.3.2.1, and an inner tunnel IP of 172.16.10.2.

I have a suspicion that the local value isn't required but it does restrict
where the tunnel can come from to be valid.

```
# Host 1
ip tunnel add gre0 mode gre key 0x12345678 csum remote 4.3.2.1 local 1.2.3.4
ip addr add dev gre0 172.16.10.1 peer 172.16.10.2/30
ip link set gre0 up
ip route add 10.16.0.0/24 dev gre0
```

```
# Host 2
ip tunnel add gre0 mode gre key 0x12345678 csum remote 1.2.3.4 local 4.3.2.1
ip addr add dev gre0 172.16.10.2 peer 172.16.10.1/30
ip link set gre0 up
ip route add 10.0.0.0/24 dev gre0
```

To remove the tunnels you can run this on both machines:

```
ip link set gre0 down
ip tunnel del gre0
```

## CentOS / Fedora / RHEL Config

A simple point to point tunnel can be established using the standard CentOS
network config pretty straight forward. I believe the `MY_OUTER_IPADDR` is
optional (just like the 'local' field in the manual setup).

For a single host to host connection it seems like it's pretty straight
forward. You'll need to pick IPs for the inside of the tunnel for both the
local and remote side and place a file on both hosts with a file at
`/etc/sysconfig/network-scripts/ifcfg-gre0` with contents like the following
(replacing the addresses with appropriate ones).

```
# /etc/sysconfig/network-scripts/ifcfg-gre0

DEVICE=gre0
BOOTPROTO=none
ONBOOT=yes
TYPE=GRE

MY_INNER_IPADDR=10.98.0.1
#MY_OUTER_IPADDR=192.168.76.3

PEER_INNER_IPADDR=10.98.0.2
PEER_OUTER_IPADDR=192.168.56.72
```

## Other Notes

There are at least two forms of GRE tunneling, point to point and point to
multipoint. I believe there is a multipoint to multipoint as well but haven't
been able to find much about either multipoint anything other than a reference
that it appears to use a shared key for tunnel authentication.

You can specify any remote can connect as long as they have the correct tunnel
key using the following command:

```
ip tunnel add gre0 mode gre key 0x12345678 csum remote any
```
