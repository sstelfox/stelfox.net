---
date: ???
draft: true
tags:
- linux
- routing
- security
title: IP Route Blackholing in Linux
---

Uses:

* Dealing with attackers traversing a Linux host working as a router
* Setting up a dark net / dark hole
* Testing disaster recovery / failover scenarios
* Blocking unwanted traffic leaving a network

```
ip -6 route add blackhole 2001:db9:9::9
ip route add blackhole 192.168.10.0/24

# Likely:
ip -6 route add blackhole 2001:db9:9::/64

# Viewing:
ip route show
ip -6 route show

# Removing:
ip route del 192.168.10.0/24

# Likely:
ip -6 route del 2001:db9:9::/64
```


