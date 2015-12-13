---
date: 2012-07-22 03:07:42+00:00
stub: "thoughts-on-ipv6-security-and-mitigation"
tags:
- networking
- system-administration
title: "Thoughts on IPv6 Security and Mitigation"
---

I setup IPv6 on my home network with an OpenWRT router and Hurricane Electric
and now I suddenly have an opinion on the state of IPv6 security. This is
something that I've been meaning to do for some time and have been mulling over
in the back of my mind. I'll go over the details from start to finish of
setting up hurricane electric on the router in another post as the information
to do so is very scattered and disjointed. It does appear to be very well
documented on the OpenWRT wiki but I found that they leave out some very
important steps, so stay tuned for that.

Lets start with the loss of NAT. NAT was never intended to be a security
measure and lots of people will argue with me for saying that it was. However,
the truth of the matter is that any machine that is behind a NAT is not
directly addressable from the internet without someone on the inside
intentionally poking holes (even if that someone is a bad-guy).

Anyone technically knowledgeable enough can usually use fingerprints of how a
machine responds to different types of traffic both normal and unusual to
identify what operating system, version, and specific details about the
services and potential vulnerabilities of that machine. This information is
invaluable to attackers.

One of IPv6's biggest selling points (and one that I quite enjoy, don't
misunderstand this post) is that every device is addressable. This can
potentially allow attackers to learn more about what they're attacking.

So how do you counter this? Well firewalls can help quite a bit in thwarting OS
fingerprinting, but even the strongest firewall won't completely prevent this.
Another, more protective layer that IPv6 gives you for free is it's sheer size.

Doing a pure enumeration of a single home subnet remotely (that is you are not
on the link IPv6 local link) would take millennia by some estimations, as
opposed the the IPv4 address space which could be done at home in a matter of
weeks. One house vs the world. That is the scale we are now working at in IPv6.

The vast scale, however, while enough to defend against random scans, will not
prevent your address showing up in server logs that you connect to. A single
IPv6 address can be scanned just as easily as an IPv4 address.

What's more is that once an attacker has a presence on a subnet they can
enumerate every single machine on that network in a matter of seconds to
minutes. Since most home users are infected through drive by trojans, found in
emails, and websites that the user chooses to go to, and attackers are already
used to not having direct access to a machine from the internet, means the
slowness and difficulty of the raw scans just simply won't be an issue.

Due too the ease of enumerating local networks and that they probably contain
more vulnerable machines.... I'll leave that extrapolation as an exercise to my
readers. I do predict that infrastructure will become a larger target due to
this, just to collect their logs to attack home users.

The next thing that I want to bring up is IPv6, by default, uses the
interface's MAC address to generate the last 12 characters / 48 bits of the
IPv6 address. The rest of the local address consists of an identifier
indicating that the address was generated using a MAC address and was not
randomly generated.

So what does this actually tell us? Well if the OS and OS version can help up
specify attacks, why not the brand and possibly the model of the MAC address?
What attack vectors are waiting in the firmware of our ethernet and wireless
cards? Firmware that almost never gets updated, and is known to have bugs and
quirks?

That one is actually an easy one, RFC 3041 defines "Privacy Addresses". These
are completely random local addresses that get generated once a day. Logs
become increasingly useless on the server end, there is a lot of decoys on
networks, and we're no longer exposing as much information to potential
hostiles.

I use Fedora 17 and it took me a while to figure out how to enable privacy
addresses the "Red Hat" way. You can easily do it generally on any Linux system
with sysctl. Just add the following to your /etc/sysctl.conf and reload sysctl:

```ini
net.ipv6.conf.all.use_tempaddr = 2
net.ipv6.conf.default.use_tempaddr = 2
```

But that isn't the "Red Hat" way. Red Hat manages it's interfaces and network
configuration through various interface configuration files living in
/etc/sysconfig/network-scripts. For any IPv6 enabled interface you can turn on
privacy addresses with the following line for example in
"/etc/sysconfig/network-scripts/ifcfg-eth0":

```bash
IPV6_PRIVACY="rfc3041"
```

After restarting your network interfaces they will additionally have privacy
addresses that will be change automatically. The interfaces still have the MAC
based addresses as well but they will not longer be the default and thus will
not show up in remote server logs.

Now, what would be a solid and strong step forward was a way to have a local
machine register it's privacy address with a local IDS/IPS with an expiration,
and to automatically trigger the IDS/IPS whenever a new connection is made to
an expired privacy address. It would almost be like a free honey pot on your
own network.
