---
title: IP6Tables
---

***Note: This page is quite old and is likely out of date. My opinions may have
also changed dramatically since this was written. It is here as a reference
until I get around to updating it.***

IP6Tables is the firewall that will directly effect IPv6 traffic. This is
sample configuration is restricted to allow normal client activity but has no
open ports.

## Security Notes

While turning off IPv6 is definitely one way to handle blocking IPv6 traffic,
if I left ip6tables off or in it's default state and an update re-enabled IPv6
in the networking stack somehow it would be as good as having no firewall
against any attacker that noticed.

This could be a serious security threat allowing someone to bypass my carefully
configured [IPTables][1] firewall.

## /etc/sysconfig/ip6tables

```
*filter
:INPUT DROP [0:0]
:FORWARD DROP [0:0]
:OUTPUT ACCEPT [0:0]

-A INPUT -i lo -j ACCEPT
-A OUTPUT -o lo -j ACCEPT

-A INPUT -m state --state ESTABLISHED,RELATED -j ACCEPT

-A INPUT -p ipv6-icmp -j ACCEPT
-A INPUT -m state --state NEW -m udp -p udp --dport 5353 -d ff02::fb -j ACCEPT

-A INPUT -j REJECT --reject-with icmp6-adm-prohibited
-A FORWARD -j REJECT --reject-with icmp6-adm-prohibited

COMMIT
```

[1]: {{< relref "notes/iptables" >}}
