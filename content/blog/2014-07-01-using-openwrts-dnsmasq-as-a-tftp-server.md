---
created_at: 2014-07-01T21:26:45-0400
tags:
  - linux
slug: using-openwrts-dnsmasq-as-a-tftp-server
title: Using OpenWRT's Dnsmasq as a TFTP Server
---

I recently reflashed my primary router to a newer version of OpenWRT and
attempted to follow [my own directions][1] written in an earlier blog post to
add PXE booting to my local network using the dnsmasq service built in. After
following my advice I found that the dnsmasq service wasn't starting.

Looking into the `logread` output I finally saw that this was due too a
permission issue. Combining this with the output of `ps` too identify the user
that dnsmasq was running on I was able to both modify my instructions and use
OpenWRT's own configuration system to perform the configuration instead of
modifying the dnsmasq configuration.

First was solving the permissions issue. I created a dedicated directory at
`/var/tftp` and changed the ownership to 'nobody' and 'nogroup' and mode too
'0755'.

Previously I used `/var/lib/tftp`, however, the default permissions on the
`/var/lib` directory is too restrictive and I didn't want to reduce the rest of
that directories security posture simply too allow directory traversal.

Next up was getting the TFTP portion of dnsmasq configured and running. Open up
`/etc/config/dhcp` and under the `dnsmasq` section add the following lines (or
if these lines already exist adjust the values to match).

```
option enable_tftp '1'
option tftp_root '/var/tftp'
option dhcp_boot 'pxelinux.0'
```

Run `uci commit dhcp` too commit the changes and finally `/etc/init.d/dnsmasq
restart` To apply the changes. You'll want too put the `pxelinux.0` and
associated configuration files into the `/var/tftp` directory too complete the
PXE booting configuration.

I'll probably write a blog post covering my PXE setup and configuration if I
don't get distracted by other projects.

[1]: {{< relref "2013-12-12-using-dnsmasq-as-a-standalone-tftp-server.md" >}}
