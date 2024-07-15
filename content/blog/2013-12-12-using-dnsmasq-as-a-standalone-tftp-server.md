---
created_at: 2013-12-12T18:29:46-0500
tags:
  - linux
  - tips
title: Using Dnsmasq as a Standalone TFTP Server
slug: using-dnsmasq-as-a-standalone-tftp-server
---

# Using Dnsmasq as a Standalone TFTP Server

*If you've come across this blog post with the intention of setting up TFTP on an modern version of OpenWRT I have a [more recent blog post]({{< relref "2014-07-01-using-openwrts-dnsmasq-as-a-tftp-server.md" >}}) detailing how too configure your system.*

I found myself in need of a TFTP server but wanted to avoid having all of the xinet.d packages and services on my system (even if they were disabled). While looking for alternatives I found out that "dnsmasq" has a built-in read-only TFTP server.

I already have a DNS and DHCP server on my network and didn't want dnsmasq to take on either of those roles so my first challenge was finding a way to prevent dnsmasq from running those bits of it's code, or failing that I would just firewall off the service. Luckily it's quite easy to disable both bits of functionality.

For DHCP you simply have to leave out any of the dhcp option in the configuration file, DNS you just tell it to operate on port 0 and it will be disabled.

So my whole configuration starting out looks like this:

```text
# Disable DNS
port=0
```

Now I need to configure the TFTP bits of dnsmasq. This too was rather simple only requiring me to add the following to my already terse configuration file:

```text
# Enable the TFTP server
enable-tftp
tftp-root=/var/lib/tftp
```

I created the root directory for my TFTP server and started it up with the following commands:

```console
$ mkdir /var/lib/tftp
$ systemctl enable dnsmasq.service
$ systemctl start dnsmasq.service
```

Voila, TFTP running and happy. If you have a firewall running you'll also want to open ports "69/tcp" and "69/udp" (though I suspect only the UDP one is needed).
