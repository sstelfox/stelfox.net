---
title: High Availability
---

Packages of interest:

* keepalived
* ipvsadm
* pacemaker

## IPVS

IPVS (IP Virtual Server) is used to present a single address in a high
availability scenario for one more services.

## Installation / Setup

```
yum install ipvsadm -y
```

A note about LXC containers: In order to make use of ipvsadm within an LXC
container, you will also need to install the ipvsadm package on the LXC host
and reboot it (optionally just load the kernel module though I don't know it by
name). Additionally the simplest version, VS/NAT, requires enabling IPv4 packet
forwarding which requires modification of the read-only proc filesystem and
thus doesn't seem to be an easy option, there may be work arounds for this, and
it may effect the other forms but they haven't been tested yet.

First pass at commands:

```
ipvsadm -A -t 192.168.122.30:443 -s wlc
ipvsadm -a -t 192.168.122.30:443 -r 192.168.122.61:443 -g -w 1
ipvsadm -a -t 192.168.122.30:443 -r 192.168.122.62:443 -g -w 1
```

That didn't work so I rebooted to clear it all out.

```
yum install keepalived -y
```

Ah ha, Eureka moment. Inside the LXC container I can unmount the /proc/sys
overlay as long as I'm root...

```
umount /proc/sys
echo 1 > /proc/sys/net/ipv4/ip_forward
```

It seems that `net.ipv4.ip_nonlocal_bind` isn't available within an LXC
container: `cat /proc/sys/net/ipv4/ip_nonlocal_bind`.

Valuable sites:

* http://mojobojo.com/blog/2011/01/14/lvs-nginx-nodejs-mongodb-cluster-setup-on-rackspace/
* https://www.rackspace.com/blog/installing-and-configuring-lvs-tun/

Interesting use for this as a firewall:

* http://keepalived.org/Keepalived-LVS-NAT-Director-ProxyArp-Firewall-HOWTO.html
* http://backreference.org/2013/04/03/firewall-ha-with-conntrackd-and-keepalived/

