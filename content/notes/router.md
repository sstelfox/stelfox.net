---
created_at: 2013-01-01T00:00:01-0000
title: Router
---

***Note: This page is quite old and is likely out of date. My opinions may have
also changed dramatically since this was written. It is here as a reference
until I get around to updating it.***

Resources:

* http://www.fclose.com/816/port-forwarding-using-iptables/

This was done as a quick and dirty iptables NAT/gateway for a private LXC
network. Create the LXC container using our base templating trick:

```
cp -ar /var/lib/libvirt/lxc/fedora-19-x86_64-template /var/lib/libvirt/lxc/gateway-01
virt-install --connect lxc:// --name gateway-01 --ram 512 --vcpus 1 \
  --filesystem "/var/lib/libvirt/lxc/gateway-01,/" --network="network=br0" \
  --network="network=isolated" --console "pty" --check-cpu
```

```
echo 1 > /proc/sys/net/ipv4/ip_forward
echo 'net.ipv4.ip_forward = 1' > /etc/sysctl.d/70-routing.conf
```

cat << EOF > /etc/sysconfig/network-scripts/ifcfg-eth1
DEVICE="eth1"
NM_CONTROLLED="no"
ONBOOT="yes"
TYPE="Ethernet"
BOOTPROTO="static"

IPADDR="10.0.0.1"
NETMASK="255.255.255.0"
DEFROUTE="no"

IPV4_FAILURE_FATAL="no"
IPV6INIT="yes"

NAME="LAN"
EOF

Going to ignore IPv6 for now :(

For this eth0 is the external network connection and eth1 is the internal
network. These will have 192.168.122.10 as the external IP address and 10.0.0.1
for the internal IP address.

## /etc/sysconfig/iptables

```
*filter
:INPUT DROP [0:0]
:FORWARD DROP [0:0]
:OUTPUT DROP [0:0]

-A INPUT -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT
-A INPUT -p icmp -j ACCEPT
-A INPUT -i lo -j ACCEPT

# Allow the internal network to connect to this SSH server (harden to airlock)
-A INPUT -m tcp -p tcp --dport 22 -i eth1 -m conntrack --ctstate NEW -j ACCEPT

-A OUTPUT -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT
-A OUTPUT -p icmp -j ACCEPT
-A OUTPUT -o lo -j ACCEPT

# DNS requests (harden to internal server)
-A OUTPUT -m udp -p udp --dport 53 -m conntrack --ctstate NEW -j ACCEPT
-A OUTPUT -m tcp -p tcp --dport 53 -m conntrack --ctstate NEW -j ACCEPT

# For updates (harden to squid server)
-A OUTPUT -m tcp -p tcp --dport 80 -m conntrack --ctstate NEW -j ACCEPT
-A OUTPUT -m tcp -p tcp --dport 443 -m conntrack --ctstate NEW -j ACCEPT

# Log any attempts that try to slip through
-A OUTPUT -m limit --limit 2/s --limit-burst 5 -j LOG --log-prefix "Outgoing attempt: "
-A OUTPUT -j REJECT

# Allow existing connections in both directions
-A FORWARD -i eth0 -o eth1 -m conntrack --ctstate RELATED,ESTABLISHED -j ACCEPT
-A FORWARD -i eth1 -o eth0 -m conntrack --ctstate RELATED,ESTABLISHED -j ACCEPT

# Always allow pinging out from the internal network
-A FORWARD -i eth1 -o eth0 -s 10.0.0.0/24 -p icmp -j ACCEPT

# Allow us to forward to the airlock's SSH server
-A FORWARD -m tcp -p tcp -d 10.0.0.100 --dport 22 -j ACCEPT

# Temporarily allow routing all other traffic from the inside out
-A FORWARD -i eth1 -s 10.0.0.0/24 -o eth0 -j ACCEPT

COMMIT

*nat
:PREROUTING   ACCEPT [0:0] # TODO: Harden?
:INPUT        ACCEPT [0:0] # TODO: Harden?
:OUTPUT       ACCEPT [0:0] # TODO: Harden?
:POSTROUTING  ACCEPT [0:0] # TODO: Harden?

# Portfowarding port 2200 to port 22 on the airlock
-A PREROUTING -i eth0 -m tcp -p tcp --dport 2200 -j DNAT --to 10.0.0.100:22

# Handle the NAT routing
-A POSTROUTING -s 10.0.0.0/24 -o eth0 -j MASQUERADE

COMMIT
```

LXC /proc/sys fix can be accomplished by:

```
cat << EOF > /etc/rc.d/rc.local
#!/bin/sh
umount /proc/sys
systemctl start systemd-sysctl.service
EOF
chmod +x /etc/rc.d/rc.local
```
