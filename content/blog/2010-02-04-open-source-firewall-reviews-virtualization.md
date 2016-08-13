---
date: 2010-02-04 16:56:17+00:00
slug: "open-source-firewall-reviews-virtualization"
tags:
- firewall
- virtualization
title: "Open Source Firewall Reviews: Virtualization"
type: post
---

So I hit a snag while attempting to review the open source firewalls on my
list. I still fully intend to get around it but the two spare boxes I had
kicking around to do the testing on both decided that they didn't like their
cd-rom drives. An excessive amount of required overtime at my job left me not
very willing to get PXE installations of the various firewall distributions
working. The only alternative I was left with was virtualization.

I've been playing around with virtualization quite a bit and have been having a
lot of fun doing it. I've been focused on freely available server class
virtualization. I trust linux. I have a lot of experience configuring it just
to my liking and can harden a linux machine to an almost obsessive level.

While I have heard a lot of good things about VMWare and they do provide both a
linux version and a free 'Viewer' the server level stuff is not available for
free so I didn't consider them. This has the downside that the various firewall
distributions tend to provide VMWare appliances pre-configured. I went with
KVM. This choice is something that will need to be left for another blog post.

m0n0wall was not an option right off the bat. I couldn't even get the ISO to
boot to do the installation. pfSense worked like a charm, no fuss at all. I
still have yet to look at how the others are at dealing with being virtualized.
Stay tuned.
