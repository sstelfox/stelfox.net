---
date: 2018-11-04T19:38:35-0600
tags:
- linux
- openvpn
- performance
- security
title: Performance Impact of OpenVPN Port Sharing
---

I recently had cause to use OpenVPN on the standard HTTPS port to protect my
traffic. This was done as a compromise with administrators who didn't want to
change their egress filtering, but wanted to allow me to continue doing my
normal work.

I already run several webservers, including this one, and didn't want to give
up exclusive access to the precious TCP port 443. The recommended way to deal
with this is to make use of the `port-share` option built into OpenVPN. This
left me with two choices, run this on an existing server sharing the port with
existing websites, or setup a dedicated server just for this instance of
OpenVPN.

I couldn't find any other posts that took a look at how this port sharing
effects the performance of the HTTPS server so I felt like doing a quick
analysis for other curious parties.

I setup a fresh Nginx server with Let's Encrypt certificates that mimics my
production setup and used `ab` to bench the service for 30 seconds. The mean
measured rate was 288.70 +/- 14.39 requests per second. Mean request
fullfillment took 3.47 +/- 0.17 ms.

After enabling `port-share` on OpenVPN I reran the exact same test. The result
was 139.76 +/- 67.68 requests per second. Mean measured request fullfillment
7.44 +/- 4.16 ms.

That is a 51% peak request handling reduction, each request has an additional
4-8ms of latency, and an almost 40x increase of jitter. That is a massive
relative impact but the vast majority of the websites I run need won't be
terribly impacted by that additional latency.

I ultimately ended up setting up a seperate server for OpenVPN as I didn't want
to mess with known working systems.
