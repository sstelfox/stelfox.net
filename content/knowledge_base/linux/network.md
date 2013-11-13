---
title: Network
---

## RedHat Based Systems
### Simple Static IP Address

You'll need to find the interface name of your primary ethernet card. Generally
this can be done with the "ipaddr show" command. The device name will more
likely than not be either "eth0" or "em1", though occasionally I've seen
ethernet addresses along the lines of p12p1 (which is a terrible naming
convention that bothers the hell out of me but I understand why the linux
developers switched to this naming convention).

This is going to assume that you want to set a static address on "eth0", it's
going to be the primary interface (in that it will have the default gateway).
You'll want to edit the file /etc/sysconfig/network-scripts/ifcfg-eth0 in this
case. Make sure that the device name at the end of the file AND the one in the
config match. You'll also need to make sure the mac address of the card matches
the HWADDR in the file otherwise the network script will throw a fit and will
either fail to bring up the interface or just complain and use the real
hardware address anyway. You can not use this script to "spoof" mac addresses.

The contents of the following file set the static IP address 10.13.37.200 on
the interface with 10.13.37.1 as the default gateway, and two nameservers
8.8.8.8 and 4.2.2.2. This also tells the network that we're on a /24 network
the interface should start up when the machine does and that if this fails to
come up the rest of the boot scripts that rely on a network should be skipped
(That's the IPV4_FAILURE_FATAL command).

```
# /etc/sysconfig/network-scripts/ifcfg-eth0
DEVICE="eth0"
NM_CONTROLLED="yes"
ONBOOT="yes"
HWADDR="12:34:56:78:90:AB"
BOOTPROTO="static"

IPADDR="10.13.37.200"
NETMASK="255.255.255.0"
GATEWAY="10.13.37.1"

DNS1="8.8.8.8"
DNS2="4.2.2.2"
DOMAIN="internal.example.org"

DEFROUTE="yes"

IPV4_FAILURE_FATAL="yes"
IPV6INIT="yes"

NAME="Standard LAN"
```

You'll need to restart the NetworkManager for this to take effect like so:

```
systemctl restart NetworkManager.service
```

### Additional IP Addresses

Additional IP addresses are one of the simplest things to perform. In the
following example I'm going to be created an additional IP on the eth0
interface assuming we're using the same eth0 described in the last section.

Too add an IP address to the eth0 interface we simply create a new one by
copying that file into a new one and adding a ":1" to the name additional
addresses would need to increment this number. So like so:

```
[root@localhost ~]# cp /etc/sysconfig/network-scripts/ifcfg-eth0 /etc/sysconfig/network-scripts/ifcfg-eth0:1
```

You'll need to open up the new file and change a few things. Specifically you
want to get rid of the "HWADDR" variable, change the IP to whatever the second
IP will be and change the device name to reflect the ":1". The new file will
look like this:

```
# /etc/sysconfig/network-scripts/ifcfg-eth0:1
DEVICE="eth0:1"
NM_CONTROLLED="no"
ONBOOT="yes"
BOOTPROTO="static"

IPADDR="10.13.37.201"
NETMASK="255.255.255.0"
DEFROUTE="no"

IPV4_FAILURE_FATAL="yes"
IPV6INIT="yes"

NAME="Standard LAN"
```

Bring it up like so:

```
[root@localhost ~]# ifup eth0:1
```

Bam. Done.

```
[root@localhost ~]# ifconfig eth0:1
eth0:1    Link encap:Ethernet  HWaddr 12:34:56:78:90:AB  
          inet addr:10.13.37.201  Bcast:10.13.37.255  Mask:255.255.255.0
          UP BROADCAST RUNNING MULTICAST  MTU:1500  Metric:1
```

### Bridges
#### Spanning Tree
### NIC Bonding
### Routing

This section describes how to turn a linux system into a basic router. This
assumes that the user is competent enough to know a few things about routing
already including what needs to be routed.

Note: I noticed that my port forwarding issue seemed to go away after
installing the iptstate package. This may be because it installed
'libnetfilter_conntrack' as a dependency. Based on the 'yum info' description I
don't believe this to be the case. Further testing may be required.

#### Configuration
##### /etc/sysctl.conf

The following settings need to be changed/added to securely handle the routing.
Detailed information about the individual options is
[http://www.frozentux.net/ipsysctl-tutorial/ipsysctl-tutorial.html available]
as well as [http://www.faqs.org/rfcs/rfc1812.html Routing RFC information].

```
# Controls IP packet forwarding
net.ipv4.ip_forward = 1

# Enable dynamic-ip address hacking for use with a DHCP WAN address and Masquerading
net.ipv4.ip_dynaddr = 1

# Ignore ICMP broadcast packets
net.ipv4.icmp_echo_ignore_broadcasts = 1

# Log spoofed packets, source routed packets, redirect packets
net.ipv4.conf.default.log_martians = 1

# Do not accept source routing
net.ipv4.conf.default.accept_source_route = 0

# Controls source route verification, this would drop all packets going out a different interface
net.ipv4.conf.default.rp_filter = 0

# Since we're only going to have one route going out (the WAN interface, we have no need to adjust our routing table
net.ipv4.conf.default.accept_redirects = 0

# Decrease the time default value for tcp_fin_timeout connection
net.ipv4.tcp_fin_timeout = 15

# Decrease the time default value for tcp_keepalive_time connection
net.ipv4.tcp_keepalive_time = 1800
```

Active One:

```
# Kernel sysctl configuration file for Red Hat Linux
#
# For binary values, 0 is disabled, 1 is enabled.  See sysctl(8) and
# sysctl.conf(5) for more details.

# Controls IP packet forwarding
net.ipv4.ip_forward = 1

# We use a dynamic address for our WAN
net.ipv4.ip_dynaddr = 1

# Controls source route verification
net.ipv4.conf.default.rp_filter = 1
net.ipv4.conf.all.rp_filter = 1

# Do not accept source routing
net.ipv4.conf.default.accept_source_route = 0
net.ipv4.conf.all.accept_source_route = 0

# Disable protocol features with few legitimate uses
net.ipv4.conf.default.accept_redirects = 0
net.ipv4.conf.all.accept_redirects = 0
net.ipv4.conf.default.secure_redirects = 0
net.ipv4.conf.all.secure_redirects = 0

# Log all suspcious packets
net.ipv4.conf.all.log_martians = 1

# Thwart some forms of ICMP attacks
net.ipv4.icmp_echo_ignore_broadcasts = 1
net.ipv4.icmp_ignore_bogus_error_messages = 1

net.ipv4.tcp_syncookies - 1

# Controls the System Request debugging functionality of the kernel
kernel.sysrq = 0

# Controls whether core dumps will append the PID to the core filename.
# Useful for debugging multi-threaded applications.
kernel.core_uses_pid = 1

# Disable netfilter on bridges.
net.bridge.bridge-nf-call-ip6tables = 0
net.bridge.bridge-nf-call-iptables = 0
net.bridge.bridge-nf-call-arptables = 0
```

##### /etc/sysconfig/network

```
NETWORKING=yes
HOSTNAME=talos.home.bedroomprogrammers.net
FORWARD_IPV4=yes
NETWORKING_IPV6=yes
```

##### /etc/sysconfig/network-scripts/ifcfg-eth1

```
# eth1 - br1 - vlan100 - WAN
DEVICE=eth1
NM_CONTROLLED=no
ONBOOT=yes
HWADDR=52:54:00:10:B6:10
TYPE=Ethernet
BOOTPROTO=dhcp

DEFROUTE=yes
PEERROUTES=yes

PEERDNS=no
DNS1="208.67.222.222"
DNS2="208.67.220.220"

IPV4_FAILURE_FATAL=yes
IPV6INIT=yes
IPV6_PRIVACY="rfc3041"

NAME="WAN"
```

##### /etc/sysconfig/network-scripts/ifcfg-eth{0,2,3,4,5}

The only thing that changes in this among the five interfaces are the IP
address options, the comment at the top and the name at the bottom. All of that
information is documented elsewhere on this wiki.

```
# eth0 - br0 - vlan37 - Public
DEVICE="eth0"
NM_CONTROLLED="no"
ONBOOT="yes"
HWADDR="52:54:00:40:97:25"
TYPE=Ethernet
BOOTPROTO="static"

IPADDR="10.13.37.1"
NETMASK="255.255.255.192"
#NETWORK="10.13.37.0"
#BROADCAST="10.13.37.63"

IPV4_FAILURE_FATAL=yes
IPV6INIT=yes
IPV6_PRIVACY="rfc3041"

NAME="LAN/Trusted"
```

##### Firewall

```
####################### NAT Table ######################

*nat
:PREROUTING ACCEPT [0:0]
:POSTROUTING ACCEPT [0:0]
:OUTPUT ACCEPT [0:0]
:PRUPNP - [0:0]

# Forwarding packets
-A PREROUTING -m tcp -p tcp -i eth0 --dport 2200 -j DNAT --to 10.13.37.70:22

# This is a precursor to the UPnP rules to prevent ports from 
-A PREROUTING -m multiport -m tcp -p tcp -i eth0 --dports 1:1024 -j ACCEPT

# Run through the UPnP rules after the rest of the forward rules to prevent
# any of them from overuling our manually generated rules
-A PREROUTING -i eth0 -j PRUPNP

# Many-to-One NAT Masquerading
-A POSTROUTING -s 10.13.37.0/24 -o eth0 -j MASQUERADE
-A POSTROUTING -s 192.168.100.0/24 -o eth0 -j MASQUERADE

# Weird DMZ shit going on here
-A POSTROUTING -s 10.13.37.0/24 -o eth3 -j ACCEPT
-A POSTROUTING -s 192.168.100.0/24 -o eth3 -j ACCEPT

COMMIT

##################### Filter Table #####################

*filter
:INPUT DROP [0:0]
:FORWARD DROP [0:0]
:OUTPUT ACCEPT [0:0]
:FWUPNP - [0:0]

# I trust the loopback device
-A INPUT -i lo -j ACCEPT
-A OUTPUT -o lo -j ACCEPT

# Any connections that are already established may continue unheeded
-A INPUT -m state --state ESTABLISHED,RELATED -j ACCEPT
-A OUTPUT -m state --state ESTABLISHED,RELATED -j ACCEPT
-A FORWARD -m state --state ESTABLISHED,RELATED -j ACCEPT

#################### Sanity Checks #####################

# Drop any new connections that aren't advertising themselves as new
-A INPUT -m tcp -p tcp ! --syn -m state --state NEW -j LOG --log-prefix "Invalid new connection in"
-A INPUT -m tcp -p tcp ! --syn -m state --state NEW -j DROP
-A FORWARD -m tcp -p tcp ! --syn -m state --state NEW -j LOG --log-prefix "Invalid new connection fw"
-A FORWARD -m tcp -p tcp ! --syn -m state --state NEW -j DROP

#################### Local Traffic #####################

# Allow ping from local subnets
-A INPUT -s 192.168.100.0/16 -p icmp -j ACCEPT
-A INPUT -s 10.13.37.0/24 -p icmp -j ACCEPT

# Allow access to the standard SSH from our local subnets
-A INPUT -s 10.13.37.64/26 -m tcp -p tcp --dport 22 -j ACCEPT
-A INPUT -s 10.13.37.128/26 -m tcp -p tcp --dport 22 -j ACCEPT
-A INPUT -s 10.13.37.192/26 -m tcp -p tcp --dport 22 -j ACCEPT

# Accept DHCP requests
-A INPUT -i eth1 -m udp -p udp --dport 67 --sport 68 -j ACCEPT
-A INPUT -i eth2 -m udp -p udp --dport 67 --sport 68 -j ACCEPT
-A INPUT -i eth3 -m udp -p udp --dport 67 --sport 68 -j ACCEPT
-A INPUT -i eth4 -m udp -p udp --dport 67 --sport 68 -j ACCEPT
-A INPUT -i eth5 -m udp -p udp --dport 67 --sport 68 -j ACCEPT

################ Inter-Subnet Traffic ##################

# Public net
-A FORWARD -i eth4 -j DROP

# DMZ - This needs to be restricted further
-A FORWARD -i eth3 -o eth0 -s 10.13.37.64/26 -j ACCEPT

# Trusted - This needs to be restricted further
-A FORWARD -i eth1 -o eth0 -s 10.13.37.128/26 -j ACCEPT

# Servers - This needs to be restricted further
-A FORWARD -i eth2 -o eth0 -s 10.13.37.192/26 -j ACCEPT

# Room mates
-A FORWARD -i eth5 -o eth0 -s 192.168.100.0/24 -j DROP

# Forward traffic from the trusted subnet to the server subnet and vice versa
-A FORWARD -i eth1 -o eth2 -s 10.13.37.128/26 -d 10.13.37.192/26 -j ACCEPT
-A FORWARD -i eth2 -o eth1 -s 10.13.37.192/26 -d 10.13.37.128/26 -j ACCEPT

# Forward traffic from the DMZ subnet and the server subnet, this will need to be restricted more later
-A FORWARD -i eth3 -o eth2 -s 10.13.37.64/26 -d 10.13.37.192/26 -j ACCEPT
-A FORWARD -i eth2 -o eth3 -s 10.13.37.192/26 -d 10.13.37.64/26 -j ACCEPT

# Forward traffic from the trusted subnet to the DMZ, but not vice versa
-A FORWARD -i eth1 -o eth3 -s 10.13.37.128/26 -d 10.13.37.64/26 -j ACCEPT

# Allow the public and room mate networks to access the DMZ but not vice versa
-A FORWARD -i eth4 -o eth3 -s 10.13.37.0/26 -d 10.13.37.64/26 -j ACCEPT
-A FORWARD -i eth5 -o eth3 -s 192.168.100.0/24 -d 10.13.37.64/26 -j ACCEPT

# Allow port forwarded traffic, only valid to the DMZ subnet (.66-126)
-A FORWARD -m tcp -p tcp -d 10.13.37.70 --dport 22 -o eth3 -j ACCEPT

# Jump into the UPnP chain if on an interface that is allowed to use UPnP
-A FORWARD -i eth0 -o eth1 -d 10.13.37.128/26 -j FWUPNP
-A FORWARD -i eth0 -o eth5 -d 192.168.100.0/24 -j FWUPNP

COMMIT
```

##### Useful Tools

* netstat-nat
* conntrack-tools
* iptstate
* dstat

### VLANs

