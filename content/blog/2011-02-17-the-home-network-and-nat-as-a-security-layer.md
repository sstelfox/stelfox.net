---
date: 2011-02-17 18:15:02+00:00
slug: "the-home-network-and-nat-as-a-security-layer"
title: "The Home Network and NAT as a Security Layer"
type: post
---

One of the hot-topics for IPv6 (which I have been thinking about a lot lately)
is NAT. I normally wouldn't go into detail about specifics that are obvious to
people in my field but for the sake of this post I will. NAT or Network Address
Translation, is a way for a large number of computers to share a single public
IP address.

The router that is handling the NAT will keep track of connections coming in
and out of it and re-write the destination IP to an internal address to keep
the traffic flowing.

NAT was necessary with IPv4 because IPv4 only had 4,294,967,296 addresses on
the internet and quite a few those were unroutable or reserved. With a world
population of 7 billion only half the population of the planet could have a
single device online at a time. IPv6 solves this issue by increasing the number
of public routable address to 3.4×10^38. That means that each person alive
could have 4.9x10^28 addresses online at any given time.

So what does this mean for NAT? Clearly we don't need it any more right? There
is no way I'll ever use 4.9x10^28 addresses. I'm willing to bet Google doesn't
own that many machines. Well this is where the debate starts. NAT was never
designed to be used as a security tool and it has even had some security
ramifications because of it.

The weakness of NAT is also it's primary strength. What do I mean by that? You
can't attack a computer if you can't talk to it. In my opinion, this alone has
protected innumerable regular home users from all kinds of terrible things
online. A standard COTS router that comes with most internet connections will
stop port-scans and automated attack tools at the door.

Sounds good right? So why would people be opposed to it? Simple. It complicates
things. There are a limited number of simultaneous connections that can go
through a single NAT device. This hard limit of 65,536 connections (in reality
this number is an order of magnitude less - 32,768) isn't changed between IPv4
and IPv6 and there really isn't a good reason to change it. Sounds like a lot
but trust me it gets used up quickly.

There is also identity reasons, behind a NAT could be 100 people or 1 and to
the rest of the world it will all look the same. If someone breaks into a home
network there isn't any way to differentiate that cracker from a normal user to
the outside world. This privacy also gives home users plausible deniability for
anything that happens on their network.

But those arguments against have very little to do with security. So what is
all this hype about NAT being a form of security through obscurity? The
argument I come across whenever I ask neigh-sayers about NAT, is that if a user
gets infected then the network can still be enumerated behind the NAT as if all
the computers were on the Internet. This argument has one fatal flaw. It is
depending on a user to get infected. A firewall has this exact same
"vulnerability" so would they argue that a firewall is not a layer of security?
I thought not.

NAT has it's problems, but claiming it is not a security layer is just plain
wrong. IPv6 is here to stay and we should really start looking at the security
implications of everything involving it. New security models need to be created
and lots of of research needs to be done in this area still. In the mean time I
suspect a lot of malware and viruses will start making use of IPv6 and how
relatively unknown it really is.
