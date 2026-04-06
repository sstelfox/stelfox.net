---
date: 2017-10-09 22:14:23+00:00
updated_at: 2026-04-06T00:00:00-0000
tags:
- linux
- networking
- vpn
title: GRE Tunnel
slug: gre-tunnel
aliases:
  - /notes/gre-tunnel/
  - /notes/linux/gre-tunnel/
---

GRE (Generic Routing Encapsulation) wraps layer 3 traffic inside IP protocol 47 packets, creating a simple point-to-point tunnel between two hosts. The tunnel itself is unencrypted, so pair it with IPSec or WireGuard if you need confidentiality.

## Quick Setup

Two hosts connecting their private networks through a GRE tunnel. Use a dedicated /30 for the inner tunnel addresses that does not overlap with anything else on either side.

| | Host 1 | Host 2 |
|---|---|---|
| Public IP | 1.2.3.4 | 4.3.2.1 |
| Tunnel IP | 172.16.10.1 | 172.16.10.2 |
| Private network | 10.0.0.0/24 | 10.16.0.0/24 |

On Host 1:

```console
# ip tunnel add gre0 mode gre key 0x12345678 csum remote 4.3.2.1 local 1.2.3.4
# ip addr add dev gre0 172.16.10.1 peer 172.16.10.2/30
# ip link set gre0 mtu 1476 up
# ip route add 10.16.0.0/24 dev gre0
```

On Host 2:

```console
# ip tunnel add gre0 mode gre key 0x12345678 csum remote 1.2.3.4 local 4.3.2.1
# ip addr add dev gre0 172.16.10.2 peer 172.16.10.1/30
# ip link set gre0 mtu 1476 up
# ip route add 10.0.0.0/24 dev gre0
```

Teardown on both:

```console
# ip link set gre0 down
# ip tunnel del gre0
```

The `key` is not real security but it does prevent accidental cross-talk if you run multiple tunnels between the same pair of hosts. The `csum` flag adds a checksum to catch corruption.

## MTU Considerations

GRE adds 24 bytes of overhead (20 byte IP header + 4 byte GRE header). With a tunnel key that becomes 28 bytes, and the checksum adds another 4 for 32 bytes total. On a standard 1500 byte MTU link that means the tunnel MTU should be set to 1476 (with key) or 1468 (with key + checksum).

Getting MTU wrong causes silent packet drops for anything that hits the limit, which is frustrating to debug because small packets (pings, DNS) work fine while larger transfers stall. Set the MTU explicitly on the tunnel interface rather than relying on PMTUD, which is frequently broken by overzealous firewalls that block ICMP.

If you are running GRE over a link that already has reduced MTU (like inside another tunnel or over PPPoE), subtract the GRE overhead from that lower value instead.

## Firewall

GRE is IP protocol 47, not a TCP or UDP port. Your firewall rules need to allow it by protocol number, restricted to your tunnel endpoints.

| Protocol | Direction | Description |
|----------|-----------|-------------|
| IP protocol 47 (GRE) | Inbound | Tunnel traffic from remote endpoint |
| IP protocol 47 (GRE) | Outbound | Tunnel traffic to remote endpoint |

## Multipoint GRE

You can accept connections from any remote by specifying `remote any` instead of a specific IP. This is useful for hub-and-spoke topologies where multiple spokes connect to a central concentrator:

```console
# ip tunnel add gre0 mode gre key 0x12345678 csum remote any local 1.2.3.4
```

Each spoke still specifies the hub as its explicit remote. NHRP (Next Hop Resolution Protocol) can be layered on top for dynamic spoke-to-spoke communication but that gets complicated fast.
