---
date: 2018-05-13T00:55:09-06:00
tags:
- linux
- network
title: Quick and Silent Gigabit Packet Interception
---

I regularly find myself inspecting traffic on Linux systems. Usually I'm
already on the client or server when doing this (such as when diagnosing weird
low level app behavior, or unknown, or unusual traffic). It has been a while
since I've needed to silently be the wire between two black boxes.

While verifying link level information about bypassing my Google Fiber Network
Box I needed to be that wire again. Before I connected any wires to anything I
needed to be sure I wouldn't accidentally leak traffic as I wasn't sure what
would impact the link.

You'll need a Linux computer with two gigabit ethernet ports. My last two
laptops haven't had any built in ethernet ports, but USB gigabit adapters are
cheap and I already had a bunch.

I went through and disabled the services that would configure network
interfaces (NetworkManager and ModemManager) as well as all of the networking
services on my system, and confirming your firewalls are all going to allow the
traffic through.

I double checked no packets were sent out up on link up by listening on each
respective interface, plugging in to a powered but otherwise disconnected
switch, and bringing the interface up.

Once I'd verified everything in one root terminal I ran:

```sh
ip link set eth0 promisc on multicast off arp off
ip link set eth1 promisc on multicast off arp off

ip link add name intercept0 type bridge
ip link set intercept0 promisc on multicast off arp off up

ip link set eth0 master intercept0
ip link set eth1 master intercept0
```

In another terminal either as root, or as a user in the `wireshark` group begin
recording the traffic of interest:

```sh
tshark -i intercept0 -w recording.pcap
```

At this point, connect the cables between the two boxes of interest. When ready
bring the links up:

```sh
ip link set eth0 up
ip link set eth1 up
```

Welcome to being the wire.
