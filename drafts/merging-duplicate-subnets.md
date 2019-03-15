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
