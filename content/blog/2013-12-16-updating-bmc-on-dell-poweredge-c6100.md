---
date: 2013-12-16 21:26:13 -0500
slug: "updating-bmc-on-dell-poweredge-c6100"
tags:
- dell
- poweredge
- bios
- bmc
- linux
title: "Updating BMC on Dell PowerEdge C6100"
type: post
---

I just received my Dell PowerEdge C6100 and found it's software quite a bit
outdated. After searching around quite a bit I found the resources lacking for
explaining how to perform these updates. So in this post I'm going to quickly
cover updating the BMC firmware on each blade.

The system I received had four different versions of the BMC software
installed, additionally Two were branded as MegaRAC and the others branded as
Dell. This update didn't fix the branding (and I'd love to remove the Dell
branding as it's kind of annoying) it did, however, fix a number of other
issues that I was experiencing such as:

1. Console Redirection failing to connect
2. BMC losing it's network connection after a couple of minutes
3. Slow responses, with occasional failures to load pages
4. Remote IPMI tools being unable to read sensors status

The first step is too download the latest version of of the BMC software from
[Dell's support site](https://support.dell.com/) (Or a [direct
link](http://downloads.dell.com/Pages/Drivers/poweredge-c6100-all.html), I've
also taken the liberty of [hosting a copy
myself](http://static.stelfox.net/files/PEC6100BMC130.exe)). I recommend you go
through the process of entering the service tag of each of the blades and make
sure that Dell recognizes them as existing even if they're out of support.

There has been mention of versions of these blades that had custom
modifications for DCS and any attempts to modify the BIOS or BMC will likely
cause you to end up bricking the remote management board or the motherboard.

Even with the regular board there is always a risk of bricking it, though
firmware updates have gotten a lot more reliable and I haven't experienced a
mis-flashed motherboard in years. You've been warned.

The BMC was fairly straight-foward. I installed the 64-bit version of Fedora 19
on a thumbdrive, downloaded version 1.30 of the BMC software (get the file
named `PEC6100BMC130.exe`). The file itself is a self-extracting zip archive
which can be extracted using the regular unzip utility.

```sh
unzip PEC6100BMC130.exe
```

Inside you'll find two folders, KCSFlash and SOCFlash should both be put on the
live drive within the KCSFlash. You'll need to set the execute bit on the
contents of the linux directory and the linux.sh file. You'll also need to
install the `glibc.i686` package. Afterwards it's as simple as booting each
chassis off the drive and as root run the linux.sh script.

If the KCSFlash fails, the SOCFlash will more likely than not work but it is
slightly more dangerous. If you need it mark the `linux/flash8.sh`,
`linux/socflash`, and `linux/socflash_x64` as executable in the SOCFlash folder
and run the flash8.sh script.

After that you're going to want to reboot into the BIOS and ensure the IPMI
ethernet port is set to dedicated, as this switched it back to "Shared" on me.
