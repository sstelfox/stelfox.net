---
created_at: 2017-10-20T17:18:36-0400
evergreen: true
public: true
tags:
  - security
  - tips
title: Vultr Deny All Firewall
slug: vultr-deny-all-firewall
---

# Vultr Deny All Firewall

While setting up new instances on Vultr for testing, I wanted to initially ensure that no traffic beyond my own could touch the instances. After adding a matching rule for SSH to my IPv4 address, a default rule shows up that drops any unspecified traffic. Switching to the IPv6 I wanted to add a drop all rule (as I wouldn't be using IPv6 until the system was up).

The interface only allows "accept" rules to be created and additionally you'll be greeted with this message while trying to figure out what to do:

> This firewall ruleset will not be active until at least one rule is added.

The creative solution I came up with was to add an SSH rule with a custom IP of "::1/128". The loopback IPv6 address... The drop all rule showed up and unless there is some bug in Vultr's firewalling nothing should be able to reach these instances over IPv6.

If you're interested in using Vultr, I'd appreciate it if you consider using my [affiliate link](https://www.vultr.com/?ref=7199712) to sign up.
