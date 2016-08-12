---
title: Suricata
---

# Suricata

## Installation

```
yum install suricata -y
```

## Configuration

### Network Configuration for IPS

I purchased a dedicated two NIC PCIe card to make use of Suricata in IPS mode.
When connected these interfaces were reported to me as devices p1p1 and p2p1. I
want the IPS to show up transparently, at no point should the IPS be
addressable on it's sniffing interfaces. The bridge interface that will handle
the filtering, sniffing etc will be br256. Here are the various configuration
files:

#### /etc/sysconfig/network-scripts/ifcfg-p1p1

```
DEVICE="p1p1"
NM_CONTROLLED="no"
HWADDR="00:0A:CD:20:86:EC"
ONBOOT="yes"
BOOTPROTO="none"

BRIDGE=br256

IPV6INIT=no
IPV6_AUTOCONF=no

NAME="Transparent TAP"
```

#### /etc/sysconfig/network-scripts/ifcfg-p2p1

```
DEVICE="p2p1"
NM_CONTROLLED="no"
HWADDR="00:0A:CD:20:86:ED"
ONBOOT="yes"
BOOTPROTO="none"

BRIDGE=br256

IPV6INIT=no
IPV6_AUTOCONF=no

NAME="Transparent TAP"
```

#### /etc/sysconfig/network-scripts/ifcfg-br256

```
# br256 - No VLAN - Transparent Intercept Bridge
DEVICE=br256
NM_CONTROLLED=no
ONBOOT=yes
TYPE=Bridge

STP=off
DELAY=0

BOOTPROTO=none

IPV6INIT=no
IPV6_AUTOCONF=no

NAME="Transparent Intercept Bridge"
```

### Sysctl Configuration Options

The following changes will need to be made to sysctl settings to allow
filtering of traffic across bridges:

```
# Ensure all traffic is forwarded where appropriate
net.ipv4.ip_forward = 1
net.ipv6.conf.default.forwarding = 1
net.ipv6.conf.all.forwarding = 1

# Enable netfilter on bridges.
net.bridge.bridge-nf-call-ip6tables = 1
net.bridge.bridge-nf-call-iptables = 1
net.bridge.bridge-nf-call-arptables = 0
net.bridge.bridge-nf-filter-pppoe-tagged = 0
net.bridge.bridge-nf-filter-vlan-tagged = 0
net.bridge.bridge-nf-pass-vlan-input-dev = 1
```

### Initial Firewall Rules

Initially we want to allow all the traffic across the bridges.

First iptables:

```
# Traffic across the transparent bridge
-A FORWARD -i br256 -o br256 -j ACCEPT
```

And then ip6tables:

```
# Traffic across the transparent bridge
-A FORWARD -i br256 -o br256 -j ACCEPT
```

After restarting the network, applying the sysctl file, connecting the card's
ports and bringing up the interfaces you can start watching traffic with
tshark:

```
tshark -i br256
```

