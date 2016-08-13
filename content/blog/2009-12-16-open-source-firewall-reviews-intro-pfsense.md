---
date: 2009-12-16 15:58:15+00:00
slug: "open-source-firewall-reviews-intro-pfsense"
tags:
- firewall
- gaming
- linux
- networking
- pfsense
- traffic-shaping
title: 'Open Source Firewall Reviews: Intro & pfSense'
type: post
---

Every now and then I like to refresh parts of my home network. New technology
comes out, new versions of software come out and new exploits and attacks come
out. This time around I felt it was about time that I look at the various
firewall distributions that have come out in the past couple of years. I'm
going to perform various reviews over the course of the next few weeks time
(and memory) permitting.

I have a few slightly more obscure requirements for my firewall, some of which
very few reviewers touch on. These being support for 802.1q VLAN tagging, a
built in traffic shaper, a tftp server and options to broadcast it as a PXE
boot server in the DHCP options, a captive portal on an arbitrary interface,
and last but not least updates that don't require a full system rebuild.

The more common features on my requirements are port forwarding, stateful
firewall with per interface rules, remote syslog logging, DHCP server, DMZ, and
VPN access (perferably PPTP and OpenVPN).

For a long time I've been an avid supporter of [pfSense][1]. For those of you
not interested in following the link, pfSense is a BSD firewall/router based on
a very strong distribution called m0n0wall. pfSense is in a nutshell a
frankenstein of some of the best pieces of the open source BSDs out there all
wrapped in a bunch of PHP based scripts.

As much as I love pfSense there have been a few issues that I've grown to live
with. The first being a large number of NAT issues. I'm not really sure how to
classify this but it is very apparent if you play any multi-player online games
(and exponentially more apparent if you have more than one person tying to play
online at the same time). I'm going to use Company of Heroes and Call of Duty:
Modern Warfare 2 as examples for this.

Right off the bat connecting online in Modern Warfare 2, it will display your
"NAT Status" as either open or closed. When one person is connected it is
usually "Open", when two people are connected one or both will display
"Closed". Now this isn't a terribly big issue for MW2 as even with a closed NAT
you can still play the game perfectly fine. The trick is that you won't be able
to join any games (or even get into a lobby) with someone that is on the same
network as you. So much for working together.

With Company of Heroes things get considerably worse. Even with only one person
trying to play the game, whenever hosting or joining an online game about 50%
of the individual players you try and connect to or that try to connect to you
will fail with a "NAT negotiation error". This makes playing or hosting
anything more than a 1v1 a royal pain, and more than a 2v2 nigh impossible.

Using a commercial off-the-shell router (in this case an old D-Link 524 I had
laying around) these issues go away completely. At the time of this writing I
am using version 1.2.3-RELEASE (built on Sun Dec 6 23:38:21 EST 2009). The NAT
issues are known and you can find many people with the same issues complaining
in their forums. The answer is almost always use static NAT mapping, but this
only works for one player. It does seem to solve both issues though (as long as
only one person being able to play is acceptable).

The next issue I've run across seems to have something to do with the state
table. Now this is a tricky issue because it might be some dirty trick that
Comcast is playing on me and I haven't tested any other firewall distribution
yet to see where the problem lies.

Right off the bat, pfSense has a maximum state table size of 10,000. This is
WAY more than enough for any home or small business networks. With five people
behind it, I've only seen the state table jump as high as 1,500 and that was
with all of us running torrents. The problem seems to be that anymore than 900
entries in the state table cause severe degredation in performance. How severe?
With a state table of 958, it took 43 seconds for text to be echoed back to me
over an SSH connection. That's impossibly bad latency. This issue is quickly
resolved by blowing away the state table or rebooting the firewall, but will
quickly crop back up when the computers start re-establishing the connections.
The built in traffic shaper only seems to make this problem worse not better.
(As an aside I'm running pfSense on 1.6Ghz box with 512 Mb of ram, this is far
more than the minimum specs of 100Mhz and 128Mb of ram.)

Also while pfSense officially supports having a captive portal on a interface,
I've only been able to get this working for a short period of time and that was
back in version 1.21. So beware anyone wanting to use pfSense for a hotspot.
The only reason I really wanted a captive portal was so that I could broadcast
a second wireless AP that the public could connect to anytime and they would be
able to see a kind notice asking them not to abuse the bandwidth I'm freely
sharing.

So with these issues why have I stayed with pfSense for so long? It is a
fantastic, stable system when you don't need to worry about torrents or gaming.
There are quite a few packages that can be one click installed through the web
interface. It provides good stats about the status of the system in a clean and
easy to navigate interface.

pfSense has been doing a wonderful job of meeting all of my requirements with
the exception of the captive portal but that wasn't _really_ for me anyway, the
gaming issues, and of course the state table. For anybody out there looking for
a solid well rounded firewall don't let my issues deter you. There is a version
2 in the works and is currently available that might solve all of my issues,
although it's alpha software right now and I didn't really want to have to
troubleshoot my home network all the time due to buggy software when I'm trying
to relax.

[1]: http://pfsense.org/
