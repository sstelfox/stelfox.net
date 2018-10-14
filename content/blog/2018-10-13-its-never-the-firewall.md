---
date: 2018-10-14T13:36:09-06:00
title: It's Never the Firewall
tags:
- firewall
- iptables
- linux
- security
---

This last Thursday I had the privilege of giving a talk at our local Linux User
Group about diagnosing firewall issues on Linux entitled "It's Never the
Firewall: Diagnosing Linux Firewall Issues". I really enjoyed giving the talk,
however, I left a few questions unanswered. While I may do a more extensive
post on everything that I went through (I have been lax on writing content for
this blog), this post is more to answer those outstanding questions and of
course [to make my slides available][1].

As far as I remember the only question I wasn't able to answer was about file
descriptors related to TCP connections. It isn't exactly a firewall issue but
exhaustion of file descriptors is one of the issues I've seen blamed on the
firewall (which in turn was relevant to the talk).

Established TCP connections consume file descriptors on Linux systems. Each
user session is restricted by a limit defined by the system administrator (or
more likely using the distribution's defaults). Some services consume a large
number of file descriptors for their basic operations before any network
connections are involved ([Redis][2] and [Elasticsearch][3] being two common
file services that both recommend increasing this limit).

When file descriptors are exhausted there are two common behaviors of
applications depending on how they're written. The first and more common
behavior will an immediately terminated connection, which to the user will look
quite similar to a iptables REJECT response. The less common behavior is
waiting until a file descriptor to become available before accepting the
connection, which will result in a hanging incomplete connection much like an
iptables DROP target.

An important caveat here is that I'm talking about user perception. If you look
at the packets being exchanged, it's clear that this isn't the case.

A quick way to diagnose if this is an issue is to compare the current number of
open file descriptors by a user to their limit. In my experience most of these
commands are available to unprivileged users which is also handy if there is a
complicated process for using or executing commands with elevated privileges.

First let's check what the total number of open file descriptors are on the
system:

```
[user@sample-host] ~ $ lsof | wc -l
185779
```

If it is under 10,000 there is a very good chance this is not the problem
you're looking for. If you see a large number like the output above, it is
worth investigating more. The host that I sampled that from currently has no
file descriptor issues 

[1]: /files/it_is_never_the_firewall.pdf
[2]: https://redis.io/topics/clients
[3]: https://www.elastic.co/guide/en/elasticsearch/reference/current/file-descriptors.html
