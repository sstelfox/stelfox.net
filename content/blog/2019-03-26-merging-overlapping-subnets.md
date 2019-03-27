---
date: 2019-03-26 23:11:30-04:00
draft: true
tags:
- aws
- ipsec
- linux
- networking
title: Merging Overlapping Subnets
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
* tcpdump

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

# NAT rules will be added here

COMMIT

*filter
:INPUT DROP [0:0]
:FORWARD DROP [0:0]
:OUTPUT ACCEPT [0:0]

-A INPUT -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT
-A INPUT -p icmp -j ACCEPT
-A INPUT -i lo -j ACCEPT

-A INPUT -m tcp -p tcp --dport 22 -j ACCEPT

# Filter rules will be added here

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

## Basic Connectivity

From this point on it is going to become important to distinguish the two
networks I'll be bridging. This method is very symmetric (all the firewalls and
configs should effectively be the same on the two tunnel instances) but there
are a few places where the remote IP and local IPs need to be referenced. Going
forward I'm going to refer to the two networks as east and west but these are
arbitrary labels.

You'll need to collect the public IP from the AWS console for your tunnel hosts
in both the east and west. For me I'm going to use `5.5.5.5` for the west IP
and `7.7.7.7` for the east IP. If you see these in the configs you'll want to
replace them with the appropriate values for your networks. If you expect this
to last a long time or will be a business critical tunnel I highly recommend
using an Elastic IP on each of these hosts.

You'll need to setup a dedicated security group for each of the tunnel hosts.
To avoid bouncing back and forth between these the security groups as we
progress through the guide I'm going to put all the rules we're going to need
in the following table. These are inbound rules only and can be hardened a bit
(but I'll get to that later), let's focus on getting this up and running first.

|           Type          |   Protocol   | Port Range |        Source        |         Description        |
|:-----------------------:|:------------:|:----------:|:--------------------:|:--------------------------:|
| SSH                     | TCP          | 22         | 0.0.0.0/0            | SSH Access                 |
| Custom Protocol         | ESP (50)     | All        | {other public IP}/32 | IPSec Encapsulated Packets |
| Custom UDP Rule         | UDP          | 500        | {other public IP}/32 | IPSec Key Management       |
| Custom ICMP Rule - IPv4 | Echo Request | N/A        | 0.0.0.0/0            | Connectivity Checking      |
| All TCP                 | TCP          | 0-65535    | 10.0.0.0/8           | Internal TCP Traffic       |
| All UDP                 | UDP          | 0-65535    | 10.0.0.0/8           | Internal UDP Traffic       |

You'll want to replace `{other public IP}` with the public IP of the tunnel
host in the opposite network. For example if this is the security group for the
west tunnel host, you'd be allowing the traffic from `7.7.7.7`.

If you're doing this in another environment you may also need `UDP/4500` from
the other public IP when NAT traversal is required. AWS EC2 instances are NAT'd
[but we can work around that][1] and will include that later on.

With the security groups in place, the local firewalls configured make sure
each host can ping each other. If they can great! If not, double check all the
IPs, security group rule, and iptables rules all match what I have here.

## The IPSec Tunnel

This tunnel provides strong authentication and encryption for all the traffic
that will be exchanged between the two networks. We've already installed the
required packages we just need to configure the various bits.

First let's handle the firewall. In the `/etc/sysconfig/iptables` file we
standardized on earlier we need to add a couple of rules to each tunnel host
for the IPSec traffic. Add these just after the note for adding filter rules
and before the `REJECT` rules:

```
-A INPUT -p esp -j ACCEPT
-A INPUT -m udp -p udp --sport 500 --dport 500 -j ACCEPT
#-A INPUT -m udp -p udp --sport 4500 --dport 4500 -j ACCEPT
```

This will allow tunneled packets and key exchange through this firewall. If
you're not on AWS when setting this up you may need to uncomment that third
rule for NAT traversal packets.

These rules are pretty unrestricted, but we have already narrowed down who will
actually be able to connect using the security group for these machines. By
leaving this specification out here our IPTables rules can remain symmetric on
both hosts.

Next up there are some specific sysctl settings that need to be adjusted for
the tunneled packets to not be rejected by the kernel. I believe these are
required because after the packet has been authenticated and decrypted it is
re-injected into the interface that it was original received on which can
run-afoul of the reverse path filters, but I could be wrong on this (I'd love
to hear from you if you know better).

You'll want to append the following to `/etc/sysctl.conf` on both tunnel hosts:

```
net.ipv4.conf.default.accept_redirects = 0
net.ipv4.conf.default.send_redirects = 0
net.ipv4.conf.default.rp_filter = 0
net.ipv4.conf.all.accept_redirects = 0
net.ipv4.conf.all.send_redirects = 0
net.ipv4.conf.all.rp_filter = 0

# Annoyingly, this seems to ignore the defaults set above. This should be
# interface that libreswan will be receiving the IPSec connections on
net.ipv4.conf.eth0.rp_filter = 0
```

With that in place run `sysctl -p` to apply the new settings.

We'll quickly do a global IPSec config to make sure we're on the same page.
Replace the contents of `/etc/ipsec.conf` on each tunnel host with the
following:

```
# /etc/ipsec.conf

config setup
  protostack=netkey

include /etc/ipsec.d/*.conf
```

IPSec has a couple of ways of handling authentication. The most secure is
asymmetric encryption using RSA keys which requires each host to have private
key material and knowledge of the other host's public key. To generate this
material on each tunnel run the following commands:

```
sudo ipsec initnss
sudo ipsec newhostkey --output /etc/ipsec.secrets
```



NOTE: West - 5.5.5.5 - 10.255.254.1 - 172.31.254.1
NOTE: East - 7.7.7.7 - 10.255.254.2 - 172.31.254.2

TODO







## The GRE Tunnel

The GRE overlay isn't required for this to work and does add 24 bytes of
overhead to each packet but it provides us some benefits.

The first and probably most important is that each end will have a fixed
private IP address as it's routing target. If the GRE tunnel is down for any
reason the tunnel host won't attempt to send any forwarded traffic to a public
IP address. This provides a layer of security against other misconfigurations.

Since all of the traffic will only be routed to the tunnel endpoint if the GRE
tunnel is up and will always travel over the GRE tunnel we can simplify our
firewall policy around enforcement of encrypted traffic. If we guarantee all
GRE traffic is encrypted over the IPSec tunnel, all traffic using the GRE
tunnel will be encrypted with only a single universal firewall rule.

One final benefit with the firewall is that we get a separate interface we can
use to identify the direction traffic is traveling through our tunnels without
worrying about the details of IP addresses (which will be changing in unusual
ways later on).

If these benefits don't justify the 24 byte per packet overhead to you, you're
welcome to skip this section but you'll need to figure out the changes to the
firewall rules and routing tables on your own later on.








NOTE: West - 5.5.5.5 - 10.255.254.1 - 172.31.254.1
NOTE: East - 7.7.7.7 - 10.255.254.2 - 172.31.254.2

TODO







```
sudo service network restart
```

## Tunnel Host Routing and Rewriting

Up to this point everything has been setting up pretty standard tunnels between
Linux hosts. This is where the magic needs to start happening. Each network
needs to see the other network with a different IP space. I've already
discussed that I'll be using `172.16.0.0/12` as our mapping network.

Since we're going to start forwarding traffic between networks we need to
enable it in the kernel. On both tunnel hosts the following line needs to be
added to `/etc/sysctl.conf` and `sysctl -p` run again to apply the change:

```
net.ipv4.ip_forward = 1
```

We need to ensure each tunnel server routes our mapping network to the other
one. This should be added / removed based on the status of our GRE tunnel so
we'll add it as a static route in `/etc/sysconfig/network-scripts/route-tun0`.

For our west tunnel server the contents of the file should be:

```
172.16.0.0/12 via 10.255.254.2
```

For our east tunnel server the contents of the file should be:

```
172.16.0.0/12 via 10.255.254.1
```

Restart the network (again dealing with a minor disruption) and check the
routing table with the following commands:

```
sudo service network restart
sudo ip -4 route
```

You should see the new route present in the routing table, but now we have a
problem. If the firewalls allowed us to forward traffic right now, any traffic
either tunnel host received with a destination of 172.16.0.0/12 would ping pong
back and forth across the tunnel until it's TTL expired. This would end up
being a nasty traffic amplification issue if we allowed it.

Handling this requires us to rewrite the packet destination received from the
tunnel to the VPC's network before the kernel can make a routing decision on
it and thus we use our first firewall incantation in the `nat` table. On each
tunnel host add the following rule:

```
-A PREROUTING -i tun0 -d 172.16.0.0/12 -j NETMAP --to 10.0.0.0/12
```

Side note: It's not documented very well but when the `NETMAP` is used in the
`PREROUTING` chain it only effects the destination network. When used in the
`POSTROUTING` chain it only effects the source address (which we'll make use of
later).

While we're updating our firewall we should also allow our forwarded traffic.
The following two rules need to be added to the `filter` section of each tunnel
host:

```
-A FORWARD -i eth0 -o tun0 -s 10.0.0.0/12 -d 172.16.0.0/12 -j ACCEPT
-A FORWARD -i tun0 -o eth0 -s 172.16.0.0/12 -d 10.0.0.0/12 -j ACCEPT
```

You may notice that I'm specifying `10.0.0.0/12` instead of `10.0.0.0/8`. This
is a limitation I mentioned at the beginning of this article which worked in my
instance. You can't uniquely map a larger network into a smaller network. If
your hosts are more scattered this is where you'll need to start duplicating
rules and using smaller subnet masks for targeted groups of hosts. There will
be other rules coming up shortly you'll need to update as well.

As part of this our rules won't forward traffic coming from our tunnel hosts
subnet of `10.255.254.0/30` as it is way outside of `10.0.0.0/12`. Simply
allowing this subnet won't allow us to receive the responses to any traffic
leaving our tunnel hosts for the opposite network as the source address will
appear local to the VPC. We can reserve two more addresses within the range of
`172.16.0.0/12` to work as our tunnel endpoints. This isn't strictly necessary
if you really need the two addresses but they make diagnostics significantly
simpler.

We can map our two addresses appropriately using the fixed 1:1 NAT mapping in
the kernel by adding the following rules in the `nat` section of each tunnel
hosts firewall:

```
-A PREROUTING -i tun0 -d 172.31.254.1 -j DNAT --to-destination 10.255.254.1
-A PREROUTING -i tun0 -d 172.31.254.2 -j DNAT --to-destination 10.255.254.2

-A POSTROUTING -o tun0 -d 10.255.254.1 -j SNAT --to-source 172.31.254.1
-A POSTROUTING -o tun0 -d 10.255.254.2 -j SNAT --to-source 172.31.254.2
```

Only half of these rules apply to each tunnel host, but it doesn't hurt having
both sets on both hosts and it keeps us symmetrical. You should be able to ping
each of the tunnel hosts equivalent `172.31.254.0/30` address at this point.

Right now if a client host added a route pointing at either of the tunnel host
for the mapped network it would make it out the opposite tunnel host's `eth0`
interface but it would still have a `10.0.0.0/12` source address and the packet
would never return to the tunnel host, much less the host on the other network.

This is a bit tricky as we only want to rewrite the source address (requiring a
`POSTROUTING` rule) but only want it to effect mapped traffic addresses coming
in from a normal VPC network, and `POSTROUTING` can't match on source
interface. We want to handle this rewriting before any other changes have
occurred which requires us to do the source address rewriting happen on the
source tunnel host.

To handle this we can use a combination of traffic markers and our handy
`NETMAP` target. On both of the tunnel hosts add the following two rules to the
`nat` section:

```
-A PREROUTING -i tun0 -d 172.16.0.0/12 -s 10.0.0.0/12 -j MARK --set-mark 0x01
-A POSTROUTING -o tun0 -m mark --mark 0x01 -s 10.0.0.0/12 -j NETMAP --to 172.16.0.0/12
```






The source addresses need to be rewritten to our `172.16.0.0/12` network as
soon as it hits the tunnel host for routing to the other network. When
receiving a packet from the tunnel we need to rewrite its destination address
*before* the kernel has a chance to make a routing decision on the packet
(otherwise the packets will just ping pong back and forth inside the tunnel).

NOTE: West - 5.5.5.5 - 10.255.254.1 - 172.31.254.1
NOTE: East - 7.7.7.7 - 10.255.254.2 - 172.31.254.2

TODO

## VPC Routing

TODO

## Hardening

TODO

## Troubleshooting

If you've run through everything and you're having issues getting traffic
flowing here are some things that might help diagnose the source of the issue:

* Restart the tunnel host's network
* Verify the tunnel host's firewalls match the final reference firewall below
* Restart the tunnel host's firewalls
* Ensure `libreswan` service is up and running (`/var/log/messages` will have
  any errors it encounters if the tunnel isn't coming up
* Verify the GRE tunnel is up by pinging the other end
* Check the routing table on both tunnel hosts
* Ensure source and destination hosts are within the `10.0.0.0/12` range
* Make sure the source / destination checking is disabled on the tunnel host's
  EC2 instances
* Check to make sure the VPC routing tables include `172.16.0.0/12` pointing at
  the tunnel hosts in both networks.
* Check the relevant security groups to make sure all other traffic is allowed
  to/from the tunnel hosts in each security group

If all else fails sniff the traffic on the interfaces you expect for the
packets in each place to make sure they're going where you expect.

TODO: Deeper diagnostics?

## Conclusion

This post was quite a wild ride for me to write up. If you've made it this far
I'm incredibly flattered. I hope this helps other people out there and I would
especially love to hear from anyone that makes use of this information.

## Reference Firewall

If you had issues following along with incrementally building up our firewall
(I'm sorry!) the final firewall you should end up with (comments removed)
should like the following:

```
# /etc/sysconfig/iptables

*nat
:PREROUTING ACCEPT [0:0]
:INPUT ACCEPT [0:0]
:OUTPUT ACCEPT [0:0]
:POSTROUTING ACCEPT [0:0]

-A PREROUTING -i tun0 -d 172.31.254.1 -j DNAT --to-destination 10.255.254.1
-A PREROUTING -i tun0 -d 172.31.254.2 -j DNAT --to-destination 10.255.254.2

-A POSTROUTING -o tun0 -d 10.255.254.1 -j SNAT --to-source 172.31.254.1
-A POSTROUTING -o tun0 -d 10.255.254.2 -j SNAT --to-source 172.31.254.2

-A PREROUTING -i tun0 -d 172.16.0.0/12 -j NETMAP --to 10.0.0.0/12
-A PREROUTING -i tun0 -d 172.16.0.0/12 -s 10.0.0.0/12 -j MARK --set-mark 0x01
-A POSTROUTING -o tun0 -m mark --mark 0x01 -s 10.0.0.0/12 -j NETMAP --to 172.16.0.0/12

COMMIT

*filter
:INPUT DROP [0:0]
:FORWARD DROP [0:0]
:OUTPUT ACCEPT [0:0]

-A INPUT -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT
-A INPUT -p icmp -j ACCEPT
-A INPUT -i lo -j ACCEPT

-A INPUT -m tcp -p tcp --dport 22 -j ACCEPT

-A INPUT -p esp -j ACCEPT
-A INPUT -m udp -p udp --sport 500 --dport 500 -j ACCEPT

-A FORWARD -i eth0 -o tun0 -s 10.0.0.0/12 -d 172.16.0.0/12 -j ACCEPT
-A FORWARD -i tun0 -o eth0 -s 172.16.0.0/12 -d 10.0.0.0/12 -j ACCEPT

-A INPUT -j REJECT --reject-with icmp-host-prohibited
-A FORWARD -j REJECT --reject-with icmp-host-prohibited

COMMIT
```

[1]: {{< relref "2019-03-17-aws-elastic-ip-details.md" >}}
