---
date: 2019-03-15 21:26:30-04:00
tags:
- aws
- ipsec
- linux
- networking
title: Merging Duplicate Subnets
---

Once upon a time there was a single AWS account. In this AWS account was
several regions but a single VPC. To make sure expansions into other regions
was possible this VPC chose to use the largest private subnet which just so
happened to also be the default (10.0.0.0/8).

Another AWS account enter the picture and while they were single they came to
the same conclusion and followed the best practices and defaults to their
heart's content. Normally this wouldn't be a problem for either of them, but
they found each other and tied the knot and were happily together for the rest
of time...

But in this story there is a darkness looming. Communication was not everything
either of them desired. There were secret things that couldn't be said in
public forums of the internet but they both desperately wanted share. There was
a solution... But it involved dark magics. Things that would work but *should not
be done*. Sometimes there isn't a choice.

I found myself in a situation where two AWS VPCs needed to communicate
sensitive data between the two, but they were using overlapping IP address
spaces. There was a lot of room available in both, but even some individual IPs
overlapped and renumbering would prove problematic and time consuming.
Eventually these two VPCs were intended to be merged anyway, but business
requirements needed a basic level of communication sooner.

The solution I came up with may be useful for others in a pinch; Two layers of
1:1 NAT were employed allowing each to communicate with what each side seemed
to believe were unique IPs. To do this we need to have a usable IP address that
we can map into without potentially wrecking havoc on access to random sites on
the internet.

I was lucky in that all the hosts that need to talk to each other had addresses
on both sides below 10.7.0.x. This is more addresses than are available to the
192.168.0.0/16 private address space but covers only about 25% of the
172.16.0.0/16 space. If you're in a worse situation where hosts are properly
scattered all over the 10.0.0.0/8 address you can still use this technique but
it will require a bit more manual configuration mapping allocating either /24
to route or in the most extreme case individual host addresses.

Before we go any further, I definitely consider this technique to be a band-aid
for the issue. For longer term connectivity some form of migration should be
planned and executed on. This makes a GREAT and stable band-aid though.

If you'd like to follow along you'll need two VPCs, each with two EC2 instances
to work as the tunnel hosts and likely two more to be test hosts to make use of
the tunnels.

The part is easy, we'll use CentOS 7 hosts as a base. You'll need to
additionally install the following software:

* iptables-services
* libreswan

If you're not on AWS you'll also want to make sure that NetworkManager and
firewalld are both ***removed from the system***. They will break the
configurations you put in place if left to their own machinations. If you
remove NetworkManager remember to enable the network service. For good measure
here is a minimal DHCP config you can use to configure `eth0` on your system:

```
# /etc/sysconfig/network-scripts/ifcfg-eth0

DEVICE="eth0"
NM_CONTROLLED="no"
ONBOOT="yes"
TYPE="Ethernet"

BOOTPROTO="dhcp"
IPV4_FAILURE_FATAL="yes"
```

Let's also start with a minimal IPTables ruleset. This is pretty close to the
defaults, but it's good to be sure that we're all on the same page:

```
# /etc/sysconfig/iptables

*nat
:PREROUTING ACCEPT [0:0]
:INPUT ACCEPT [0:0]
:OUTPUT ACCEPT [0:0]
:POSTROUTING ACCEPT [0:0]

COMMIT

*filter
:INPUT DROP [0:0]
:FORWARD DROP [0:0]
:OUTPUT ACCEPT [0:0]

-A INPUT -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT
-A INPUT -p icmp -j ACCEPT
-A INPUT -i lo -j ACCEPT

-A INPUT -m tcp -p tcp --dport 22 -j ACCEPT

-A INPUT -j REJECT --reject-with icmp-host-prohibited
-A FORWARD -j REJECT --reject-with icmp-host-prohibited

COMMIT
```

Place the contents of that file in `/etc/sysconfig/iptables` as the header
indicates. The differences from the default are mostly in that we have also
defined the `nat` table and switched the default action on the `INPUT` and
`FORWARD` chains to drop. Both the default and this one will reject the traffic
anyways so this doesn't actually change the behavior of the firewall.

Defining the `nat` table doesn't change any behavior either, but I'll be
referencing it later on in the post and you should add the rules between the
chains and the `COMMIT` message. If you get confused by any of my instructions
around adding the firewall rules, there is a complete ruleset at the end of the
post you can reference directly.
