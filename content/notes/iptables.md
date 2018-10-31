---
date: 2017-10-20 12:14:02-04:00
tags:
- linux
- security
title: IPTables
---

iptables (and ip6tables) is a simple application for interacting directly with
the Linux kernel's netfilter firewall. nftables is attempting to replace it.
nftables has better performance but is incredibly complex and difficult to use.
Until the tooling and usability around nftables is addressed iptables will
likely remain the reigning champion.

It is important that your systems have effective ingress and egress rules.
Depending on your host OS, you'll find your rule set stored in different
locations but the following list are where I've seen them before:

* /etc/conf.d/iptables, /etc/conf.d/ip6tables
* /etc/sysconfig/iptables, /etc/conf.d/ip6tables
* /var/lib/iptables/rules-save, /var/lib/ip6tables/rules-save

I have a base rule set that I riff off of for [iptables][1], and
[ip6tables][2]. It can generally be hardened a tad depending on the local
services you have available (such as a DNS resolver, local NTP servers, or an
HTTP(S) proxy).

## Logging From Rules

If you're using my [auditd][3] rules, you'll already have a detailed log of any
connection to or from the system so this may be of little use. Sometimes it's
valuable to log attempts that don't successfully make it through the firewall
(such as failed outbound network attempts).  These are also valuable if your
system has too many connections for the auditd rules to be effective, or you're
not using my rule set.

The final step is actually making iptables log the information you want. This
is as simple as appending `--log-prefix "iptables: "` to whatever LOG targets
you have configured. Like so:

The following rule will log any new SSH connection attempts on the default port
for any traffic that successfully makes it to the rule:

```
-A INPUT -m state --state NEW -m tcp -p tcp --dport 22 -j LOG --log-prefix "sshConn: "
```

## Additional Gentoo Config

Gentoo's defaults have an annoying habit to override the rules every time the
service is shut down. Before enabling the services I additionally drop the
configs around service control in place at [/etc/conf.d/iptables][4] and
[/etc/conf.d/ip6tables][5].

This expects the iptables rules to be at `/var/lib/iptables/rules-save` and
`/var/lib/ip6tables/rules-save`.

## Blocking ISPs/AS Numbers

I've created [a script][6] that generates rules to block the subnets associates
with given AS numbers. AS numbers can be found on [Arin's website][7] and [Team
Cymru][8] keeps a list of other places that keep this information.

It fetches all network via whois and generates appropriate iptables rules.
Maybe you have to adjust your whois-Query since I only ran tests against the
ripe db.

This script could be made significantly more efficient, and safer to update by
switching to ipsets, but I haven't gotten around to it.

[1]: /note_files/iptables/iptables.rules
[2]: /note_files/iptables/ip6tables.rules
[3]: {{< ref "./auditd.md" >}}
[4]: /note_files/iptables/gentoo_iptables_conf
[5]: /note_files/iptables/gentoo_ip6tables_conf
[6]: /note_files/iptables/block_as.sh
[7]: ftp://ftp.arin.net/info/asn.txt
[8]: http://www.team-cymru.org/Services/ip-to-asn.html
