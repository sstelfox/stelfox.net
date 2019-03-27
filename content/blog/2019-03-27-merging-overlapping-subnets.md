---
date: 2019-03-27 19:11:30-04:00
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
a solution... But it involved dark magicks.

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

This part is easy, we'll use CentOS 7 hosts as a base. You'll need to
additionally install the following software:

* iptables-services
* libreswan
* tcpdump (optional but invaluable to diagnose issues)

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
referencing it later on in the post and you should add the rules where
indicated by the comment. If you get confused by any of my instructions around
adding the firewall rules, there is a complete ruleset at the end of the post
you can reference directly.

Finally let's make sure the firewall is enabled and running:

```
systemctl enable iptables.service
systemctl start iptables.service
```

## Basic Connectivity

From this point on it is going to become important to distinguish the two
networks I'll be bridging. This method is very symmetric (all the firewalls and
configs should effectively be the same on the two tunnel instances) but there
are a few places where the remote IP and local IPs need to be referenced. Going
forward I'm going to refer to the two networks as `east` and `west` but these
are arbitrary labels.

You'll need to collect the public IP from the AWS console for your tunnel hosts
in both the `east` and `west`. For me I'm going to use `5.5.5.5` for the `west`
IP and `7.7.7.7` for the `east` IP. If you see these in the configs you'll want
to replace them with the appropriate values for your networks. If you expect
this to last a long time or will be a business critical tunnel I highly
recommend using an Elastic IP on each of these hosts.

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
`west` tunnel host, you'd be allowing the traffic from `7.7.7.7`.

If you're doing this in another environment you may also need `UDP/4500` from
the other public IP when NAT traversal is required. AWS EC2 instances are NAT'd
[but we can work around that][1] and will include that later on.

With the security groups in place, and the local firewalls configured make sure
each host can ping each other. If they can great! If not, double check all the
IPs, security group rules, and iptables rules all match what I have documented
here.

## The IPSec Tunnel

This tunnel provides strong authentication and encryption for all the traffic
that will be exchanged between the two networks. We've already installed the
required packages we just need to configure the various pieces to get it
running.

First let's handle the firewall. In the `/etc/sysconfig/iptables` file we
standardized on earlier we need to add a couple of rules to each tunnel host
for the IPSec traffic. Add these just after the note for adding filter rules
and before the `REJECT` rules:

```
-A INPUT -p esp -j ACCEPT
-A INPUT -m udp -p udp --sport 500 --dport 500 -j ACCEPT
#-A INPUT -m udp -p udp --sport 4500 --dport 4500 -j ACCEPT
```

This will allow tunneled packets and key exchange through the firewall. If
you're not on AWS when setting this up you may need to uncomment that third
rule for NAT traversal packets.

These rules are pretty unrestricted, but we have already narrowed down who will
be able to connect using the security group for these machines. By leaving a
more refined specification out of our definition here our IPTables rules can
remain symmetric on both hosts making automated management through a devops
tool simpler.

Next up there are some specific sysctl settings that need to be adjusted for
the tunneled packets to not be rejected by the kernel. The reason behind the
sysctl settings is pretty well [documented on LibreSwan's FAQ][4] if you're
curious for why they're needed.

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

With that in place run `sysctl -p` to apply the new settings and `systemctl
restart iptables.service` to update the firewall rules.

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
asymmetric encryption using RSA keys which requires each host to have a private
key and knowledge of the other host's public key. To these keys on each tunnel
host run the following commands:

```
sudo ipsec initnss
sudo ipsec newhostkey --output /etc/ipsec.secrets
```

Similar to our `west` and `east` analogy, IPSec has the concept of `left` and
`right` hosts on either side of a tunnel. We're going to map them the same way
but need to get the public keys of each host first so they can verify each
other.

On our `west` host, which will be our `left` host for the IPSec config retrieve
the public key with the following two commands. The output will be one very
long line that begins with `leftrsasigkey=` record this entire output.

```
CKAID="$(sudo ipsec showhostkey --list | head -n 1 | awk '{ print $NF }')"
sudo ipsec showhostkey --left --ckaid ${CKAID} | tail -n 1
```

A bit of an explanation of those two commands. The first one extracts the
unique key identifier for the first key present (there shouldn't be any
others), while the second gets the actual public key for that identifier. We'll
need to repeat the process on our `east` host slightly modified which will be
our `right` host:

```
CKAID="$(sudo ipsec showhostkey --list | head -n 1 | awk '{ print $NF }')"
sudo ipsec showhostkey --right --ckaid ${CKAID} | tail -n 1
```

This will also output another long line that this time will begin with
`rightrsasigkey=` which you should also record. On both hosts you'll want to
place the following IPSec tunnel config at `/etc/ipsec.d/vpc-link-tunnel.conf`:

```
conn vpc-link-tunnel
  auto=start
  pfs=yes
  type=transport

  leftid=@west_tunnel_server
  rightid=@east_tunnel_server
  left={west external ip}
  right={east external ip}

  authby=rsasig
  leftrsasigkey={left/west sig key}
  rightrsasigkey={right/east sig key}
```

Be sure to replace the `{west external ip}` with the external IP address of our
`west` server and likewise the `{east external ip}` with the external IP
address of our `east` server. Be sure to replace the last two lines with the
output of the two keys we got from our `west` and `east` tunnel hosts.

That's it for the IPSec configuration, let's start the daemon up and verify
that it's working on both tunnel servers:

```
sudo systemctl enable ipsec.service
sudo systemctl start ipsec.service
```

Let's check the IPSec status to make sure it's happy:

```
sudo ipsec status
```

There will be quite a bit of output but what you're looking for is a line that
looks like this:

```
000 Total IPsec connections: loaded 1, active 1
```

If the loaded count is 0, double check the presence and file names as well as
the global config. If you've properly loaded the config but it isn't coming up
as active, review the contents of `/var/log/secure` for any IPSec error
messages. If there is an authentication error, most likely the public keys got
copied incorrectly. Make sure that both keys exist in both configs and match
the outputs from the key extraction commands earlier on.

If there are connection issues there are quite a few other bits that could have
gone wrong. Review the firewalls, security groups, and IPSec configs to make
sure the addresses are correct and the protocols are allowed through.

Once the details have been worked out and the tunnel is up, all the traffic
between the two hosts should now be encrypted. This can be verified using
`tcpdump` and sending a couple pings at the other host. When IPSec is flowing
the traffic will look something along the lines of:

```
21:51:02.807688 IP 10.0.1.156 > 7.7.7.7: ESP(spi=0x171f19e9,seq=0xe), length 116
```

Make sure this is working, everything beyond this depends on the IPSec tunnel
up and running correctly.

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

Let's start the setup with a safety net. We need to allow the GRE traffic
through the firewall on the tunnel hosts, but we want to make sure that we only
pass if it has been properly encrypted with the IPSec. We can use the iptables
`policy` module. Add the following rules to the filter section of each of our
firewalls:

```
-A INPUT -m policy --dir in --pol ipsec --proto esp -p gre -j ACCEPT
-A OUTPUT -m policy --dir out --pol ipsec --proto esp -p gre -j ACCEPT
-A OUTPUT -p gre -j DROP
```

These three lines are all that is required to enforce that all of our traffic
being routed between the two networks will always be encrypted if they have any
hope of making it.

Restart the firewall so the change can take effect:

```
sudo systemctl restart iptables.service
```

Configuring a GRE tunnel on a CentOS box is very simple on each host create a
new file `/etc/sysconfig/network-scripts/ifcfg-tun0` with the following
contents:

```
# /etc/sysconfig/network-scripts/ifcfg-tun0

DEVICE=tun0
BOOTPROTO=none
ONBOOT=yes
TYPE=GRE

MY_INNER_IPADDR=10.255.254.1
#MY_OUTER_IPADDR={current side external IP}

PEER_INNER_IPADDR=10.255.254.2
PEER_OUTER_IPADDR={opposing side external IP}

# Not needed since we only have one tunnel. Can be any 32 bit numerical value
#KEY=12345678
EOF
```

For completeness I've included `MY_OUTER_IPADDR` and `KEY` commented out as
they may be useful for other GRE tunnels but not necessary for this one. For
the `west` server `{current side external IP}` should be replaced by the `west`
tunnel server's external IP and `{opposing side external IP}` with the east
tunnel server's external IP. Reverse the settings on the east tunnel server.

On each tunnel host bring the tunnel up:

```
sudo ifup tun0
```

The state of the tunnel can be checked with `sudo ip addr show tun0` which will
have an output similar to the following:

```
5: tun0@NONE: <POINTOPOINT,NOARP,UP,LOWER_UP> mtu 8977 qdisc noqueue state UNKNOWN group default qlen 1000
    link/gre 0.0.0.0 peer 7.7.7.7
    inet 10.255.254.1 peer 10.255.254.2/32 scope global tun0
       valid_lft forever preferred_lft forever
```

You're specifically looking for the `UP` and `LOWER_UP` flags. You can double
check the tunnel is functioning by pinging `10.255.254.1` and `10.255.254.2`
from the `east` and `west` tunnel host respectively.

We now have a private encrypted layer 2 tunnel between the two VPC tunnel
hosts, next up is to get other traffic in the VPC passing across the tunnel.

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

For our `west` tunnel server the contents of the file should be:

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
sudo systemctl restart network.service
sudo ip -4 route
```

You should see the new route present in the routing table, but now we have a
problem. If the firewalls allowed us to forward traffic right now, any traffic
either tunnel host received with a destination of `172.16.0.0/12` would ping
pong back and forth across the tunnel until it's TTL expired. This would end up
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
each of the tunnel hosts equivalent `172.31.254.0/30` address at this point (if
you restart the firewall).

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

Let's restart the firewall again to make sure all the rules have been properly
applied:

```
sudo systemctl restart iptables.service
```

That's the last of the changes we need to make to the tunnel hosts, now the
other hosts need to learn how to send their traffic to the other side...

## VPC Routing

Hosts inside a VPC will directly send traffic to any other host within it's
defined network. For networks beyond their VPC subnet (such as our
`172.16.0.0/12`) network will send their traffic to their default gateway which
is the VPC router. These routers are configurable within the AWS web console by
going to the `VPC` section, finding the relevant VPC you're using and clicking
on the link to your `Main Route Table`.

Under the `Routes` sub-tab on the selected Route Table, click on the `Edit
routes` button. Add `172.16.0.0/12` as a destination to the routes. Click on
the `Target` drop down, choose `Instance` and find your VPC tunnel host in the
list. Click `Save Routes` and allow a minute or two for the route to update.

There is a sneaky potential issue here. If you've gone and done some deep
customization to your VPC, you may have created and specified additional route
tables for specific subnets. You'll want to evaluate each of the potential
route tables and add the same route to each one.

There is one final thing generally stopping our traffic from flowing freely. By
default every single EC2 instance drops any traffic that reaches an EC2
instance with a source or destination address that doesn't match the IP that
has been assigned to that instance. This is generally a very useful protection,
but we'll be shooting out packets with source addresses in the `172.16.0.0/12`
range so need to disable this protection on each of tunnel hosts.

Find your tunnel host in the list of your EC2 instances. Right click on the
instance, go to the `Networking` sub-menu, and choose `Change Source/Dest.
Check`. It will pop up a confirmation, confirm it by clicking on `Yes,
Disable`.

Now the only thing preventing hosts in each VPC from talking to each other is
their respective inbound security groups but the traffic should flow freely.
We're effectively done and everything should be happy.

It may not be immediately obvious but you will have to do some math to convert
the IP addresses of the remote subnet into the mapping network. Specifically
you'll need to replace the first octet (`10`) with the mapping network's first
octet (`172`), then add `16` to the second octet. If the resulting second octet
is greater than `31` it won't be able to traverse the network. The remaining
two octets are left unchanged.

Some examples of what this translation looks like:

* `10.0.0.2` becomes `172.16.0.2`
* `10.4.1.80` becomes `172.20.1.80`
* `10.30.56.100` becomes `172.46.56.100` and is unroutable

No matter which side of the tunnel you're on the other side's addresses will
always be mapped this way.

## Hardening

We have some fairly wide open firewall rules for passing traffic on the
tunneling hosts themselves and in the security groups on them. These can
certainly be tightened further and I'll even cover some situations in a bit
about when you might want to do that. As it stands right now the internal
private IP addresses of the tunnel host's and clients haven't matter beyond
whether or not they were in the routable range.

If you use ephemeral containers or autoscaling IP addresses are going to change
frequently. To harden the rules on the tunnel hosts themselves would need to be
updated whenever these addresses change which removes a lot of benefits. Since
we're already using a dedicated security group for our tunnel hosts, we can
instead have other security groups reference it directly.

To allow traffic from the opposite VPC side, allow the relevant port's traffic
from the tunnel host's security group and bam problem solved. This is still
somewhat course granularity of firewalling as you are effectively granting the
entire other VPC access to that service port. In a lot of cases that will be
enough and additional network controls such as inter-service authentication
will be sufficient to mitigating additional issues.

If you do need finer granularity you can start by limiting traffic on the VPC
tunnel's inbound security group from the opposite side. If that is not fine
grained enough you can eventually resort to firewall rules in the `FORWARD`
chain itself.

There is one additional benefit of putting the rules in the forward chain if
your addresses are sufficiently static to deploy rules through it. With
security groups alone, the traffic will traverse the tunnel before being
dropped by the opposing side's security group. Likely your service will retry
the connection. These little bits of traffic do add up and will take time.

If you instead firewall with reject packets as they enter the tunnel, a service
will get immediate feedback the traffic won't flow. No additional bandwidth is
wasted and the latency will be very small. You can also log these packets with
a `LOG` target before rejecting them so you can audit and diagnose traffic that
doesn't make it through the tunnel.

For those reasons I do prefer to firewall at the tunnel hosts themselves for
sufficiently static services.

## Troubleshooting

I've tried to include basic diagnostics for each piece that we've built up but
if you're still having issues getting traffic flowing here is a checklist to
look over that might help diagnose the source of the issue:

* Restart the tunnel host's network
* Verify the tunnel host's firewalls match the final reference firewall below
* Restart the tunnel host's firewalls
* Make sure each tunnel host can ping the other one
* Ensure `libreswan` service is up and running (`/var/log/secure` will have
  any errors it encounters if the tunnel isn't coming up
* Verify the GRE tunnel is up by pinging the other end's tunnel IP
* Check the routing table on both tunnel hosts
* Ensure source and destination hosts are within the `10.0.0.0/12` range
* Make sure the source / destination checking is disabled on the tunnel host's
  EC2 instances
* Check to make sure the VPC routing tables include `172.16.0.0/12` pointing at
  the tunnel hosts in both networks.
* Check the relevant security groups to make sure all other traffic is allowed
  to/from the tunnel hosts in each security group

If all else fails sniff the traffic on the interfaces you expect for the
packets in each place to make sure they're going where you expect. Usually this
makes it pretty clear to me whether packets are even getting to the tunnel
hosts and which interface they either stop or aren't being manipulated at.

## Conclusion

This post was quite a wild ride for me to write up and is probably my longest
post to date. If you've made it this far I'm incredibly flattered. I hope this
helps other people out there and I would especially love to hear from anyone
that makes use of this information or finds an issue with anything in the post.

Either [send me an email][2] or [open an issue][3] for my website's public
repository. Cheers!

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

-A INPUT -m policy --dir in --pol ipsec --proto esp -p gre -j ACCEPT
-A OUTPUT -m policy --dir out --pol ipsec --proto esp -p gre -j ACCEPT
-A OUTPUT -p gre -j DROP

-A FORWARD -i eth0 -o tun0 -s 10.0.0.0/12 -d 172.16.0.0/12 -j ACCEPT
-A FORWARD -i tun0 -o eth0 -s 172.16.0.0/12 -d 10.0.0.0/12 -j ACCEPT

-A INPUT -j REJECT --reject-with icmp-host-prohibited
-A FORWARD -j REJECT --reject-with icmp-host-prohibited

COMMIT
```

[1]: {{< relref "2019-03-17-aws-elastic-ip-details.md" >}}
[2]: mailto:sam@stelfox.net
[3]: https://github.com/sstelfox/stelfox.net/issues/new
[4]: https://libreswan.org/wiki/FAQ
