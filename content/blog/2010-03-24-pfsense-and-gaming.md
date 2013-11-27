---
created_at: 2010-03-24 14:18:00+00:00
updated_at: 2010-03-24 14:18:00+00:00
type: post
kind: article
layout: blog_post
title: 'pfSense and Gaming'
tags:
- gaming
- networking
- pfsense
---

Previously while reviewing open source firewall distributions (which I never
finished), I mentioned some gaming issues. I found a solution that seems to fix
all the issues I had with gaming but unfortunately creates a few new issues
that I didn't arise. The issue lies with how pfSense performs NAT'ing.

The ports that a particular client opens under some cases can be easily
predicted and in turn exploited. To prevent this pfSense randomizes the
external port that traffic is coming from. This is perfectly fine for any
application that follows networking standards. However it seems that games such
as Call of Duty and Company of Heroes passes the port they open inside their
network protocol which is what the game servers then use to connect back to
them rather than looking at the actual frames that arrive from the client. This
means that the server will be trying to connect back on the wrong port as
pfSense has changed it.

I can see some impossibly small security benefits for the game programmers to
do this. I'm guessing more likely than not this was a failing of the network
library they use where they don't have access to the information in the frames
of the packets so they wrote a work around for it, and in turn violate basic
network programming best practices.

So what's the solution? I strongly recommend that anyone reading this read the
complete article as it is possible to prevent yourself from being able to use
your network connection behind pfSense. If any setting doesn't look quite like
I describe it your probably using a different version and should consult with
the good people in the IRC channels or in their forums.

Here are the steps to get it to work:

1. Open up Firewall -> NAT
2. There should be three tabs, 'Port Forward', '1:1', and 'Outbound'
3. Click on the 'Outbound' tab
4. There should be two radio buttons, by default "Automatic outbound NAT rule
   generation (IPsec passthrough)" is selected. Choose "Manual Outbound NAT
   rule generation (Advanced Outbound NAT (AON))"
5. Verify that there is a mapping with the following settings:
  * Interface: WAN
  * Source: Your internal (LAN) subnet
  * Source Port: *
  * Destination: *
  * Destination Port: *
  * NAT Address: *
  * NAT Port: *
  * Static Port: YES
6. If you have more than one subnet you'll need to do this for each one.
7. Save and Apply the settings

That should be it, there has only been two issues that I've found, one I'm not
really sure if it's related. About the same time as when I made this change
UPnP broke. I'm not sure why but it's something that seems to break quite a bit
with pfSense and I can see this being related to NAT'ing.

The second issue is traffic in between subnets. While it seems to mostly work,
there have been a few oddities such as a computer on one subnet is able to talk
to a computer on a different subnet as long as it initiates the connection. If
the other computer trys to initiate the connection then it will just time out.
It definitely wasn't related to firewall rules (I set an allow all on both
interfaces and turned off the firewall on both computers). Switching back to
auto-nat'ing resolved the issue.

