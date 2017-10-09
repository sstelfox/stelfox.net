---
title: DHCPd
---

# DHCPd

## Firewall Adjustments

```
# Accept DHCP requests
-A INPUT -m udp -p udp --dport 67 --sport 68 -j ACCEPT
```

## Configuration

### /etc/dhcp/dhcpd.conf

```
# Default lease time information
min-lease-time 300;
max-lease-time 86400;
default-lease-time 86400;

# We are the only DHCP server there should be...
authoritative;

# No updates, might deal with this later
ddns-updates off;
ddns-update-style none;

# Security measures
ignore bootp;
ignore client-updates;
deny declines;
deny duplicates;

# Verify the address is unused before assigning
ping-check true;
ping-timeout 1;

# Logging information
log-facility local1;

# Default DNS servers
option domain-name-servers 8.8.8.8, 4.2.2.2;

# Room Mate's network
subnet 192.168.100.0 netmask 255.255.255.0 {
  option routers 192.168.100.1;
  option broadcast-address 192.168.100.255;

  range 192.168.100.50 192.168.100.250;

  # I don't monitor nor care about the devices my room mates
  # put on this subnet. Allow them all.
  allow unknown-clients;
}

# Public network
subnet 10.13.37.0 netmask 255.255.255.192 {
  option routers 10.13.37.1;
  option broadcast-address 10.13.37.63;

  range 10.13.37.10 10.13.37.40;

  # They probably won't be around long... no need to hold onto
  # resources they don't need
  max-lease-time 1800;
  default-lease-time 600;

  # I don't know who will get on this... besides I want to have
  # some fun with strangers...
  allow unknown-clients;
}

# Private/Trusted LAN
subnet 10.13.37.128 netmask 255.255.255.192 {
  option routers 10.13.37.129;
  option broadcast-address 10.13.37.191;

  option domain-name "home.bedroomprogrammers.net";
  option ntp-servers 10.13.37.129;
  option time-offset -18000;

  range 10.13.37.140 10.13.37.170;

  deny unknown-clients;
}

# Include my known clients configurations
include "/etc/dhcp/known-hosts.conf";
```

### /etc/dhcp/known-clients.conf

This file needs to be created by hand. Initially it is empty, clients should be
added as needed.

```
host caerleon {
    hardware ethernet 00:25:22:0d:6d:66;
    fixed-address 10.13.37.140;
}
```

