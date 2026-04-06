---
created_at: 2013-01-01T00:00:01-0000
title: Network
tags:
  - linux
  - networking
aliases:
  - /notes/network/
---

# Network Configuration

Modern Linux networking is typically managed through `ip` commands (from iproute2), NetworkManager (`nmcli`), or systemd-networkd. This note covers common tasks using these tools.

## Viewing Network State

List all interfaces and their addresses:

```console
$ ip addr show
$ ip link show
```

Show the routing table:

```console
$ ip route show
```

Show active connections and listening ports:

```console
$ ss -tulnp
```

## Static IP Address

### Using ip commands (temporary, lost on reboot)

```console
$ ip addr add 10.13.37.200/24 dev eth0
$ ip route add default via 10.13.37.1
$ ip link set eth0 up
```

### Using NetworkManager (persistent)

```console
$ nmcli con add type ethernet con-name "static-lan" ifname eth0 \
    ipv4.method manual \
    ipv4.addresses 10.13.37.200/24 \
    ipv4.gateway 10.13.37.1 \
    ipv4.dns "8.8.8.8,8.8.4.4"
$ nmcli con up static-lan
```

To modify an existing connection:

```console
$ nmcli con mod "static-lan" ipv4.addresses 10.13.37.201/24
$ nmcli con up "static-lan"
```

## Additional IP Addresses

Add a second address to an interface:

```console
$ ip addr add 10.13.37.201/24 dev eth0
```

With NetworkManager:

```console
$ nmcli con mod "static-lan" +ipv4.addresses 10.13.37.201/24
$ nmcli con up "static-lan"
```

## Bridges

Create a bridge and add an interface to it:

```console
$ ip link add name br0 type bridge
$ ip link set eth0 master br0
$ ip link set br0 up
```

With NetworkManager:

```console
$ nmcli con add type bridge con-name br0 ifname br0
$ nmcli con add type bridge-slave con-name br0-port0 ifname eth0 master br0
$ nmcli con up br0
```

### Spanning Tree

Disable spanning tree on a bridge (common for VM host bridges):

```console
$ ip link set br0 type bridge stp_state 0
```

## NIC Bonding

Create a bond with two interfaces in active-backup mode:

```console
$ nmcli con add type bond con-name bond0 ifname bond0 \
    bond.options "mode=active-backup,miimon=100"
$ nmcli con add type ethernet con-name bond0-port0 ifname eth0 master bond0
$ nmcli con add type ethernet con-name bond0-port1 ifname eth1 master bond0
$ nmcli con up bond0
```

Common bond modes:
* `balance-rr` (0) - Round-robin for load balancing
* `active-backup` (1) - Only one active interface, failover
* `802.3ad` (4) - LACP, requires switch support

## VLANs

Create a VLAN interface:

```console
$ ip link add link eth0 name eth0.100 type vlan id 100
$ ip link set eth0.100 up
$ ip addr add 10.100.0.1/24 dev eth0.100
```

With NetworkManager:

```console
$ nmcli con add type vlan con-name vlan100 ifname eth0.100 \
    dev eth0 id 100 \
    ipv4.method manual ipv4.addresses 10.100.0.1/24
```

## Routing

Enable IP forwarding (required for any routing):

```console
$ sysctl -w net.ipv4.ip_forward=1
```

Make it persistent in `/etc/sysctl.d/99-routing.conf`:

```ini
# Enable packet forwarding
net.ipv4.ip_forward = 1

# Log packets with impossible addresses
net.ipv4.conf.all.log_martians = 1

# Do not accept source routing
net.ipv4.conf.all.accept_source_route = 0

# Ignore ICMP broadcast requests
net.ipv4.icmp_echo_ignore_broadcasts = 1

# Reject bogus ICMP error responses
net.ipv4.icmp_ignore_bogus_error_responses = 1

# Enable SYN cookies for SYN flood protection
net.ipv4.tcp_syncookies = 1
```

Add a static route:

```console
$ ip route add 10.16.0.0/24 via 172.16.10.2 dev eth1
```

## Useful Tools

* `ss` - Socket statistics (replacement for netstat)
* `ip` - Network interface and routing configuration
* `nmcli` - NetworkManager command line interface
* `conntrack` - View/manage connection tracking entries
* `tcpdump` - Packet capture
* `mtr` - Combines traceroute and ping for network path analysis
