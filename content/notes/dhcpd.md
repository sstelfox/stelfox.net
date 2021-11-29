---
title: DHCPd
weight: 30

taxonomies:
  tags:
  - linux
  - networking

extra:
  done: true
  outdated: true
---

Heavy but full featured open source DHCP server.

<!-- more -->

## Firewall Adjustments

```
# Accept DHCP requests
-A INPUT -m udp -p udp --dport 67 --sport 68 -j ACCEPT
```

## Configuration

* [/etc/dhcp/dhcpd.conf](dhcpd.conf)
* [/etc/dhcp/known-clients.conf](known-clients.conf)
