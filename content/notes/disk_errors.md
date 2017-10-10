---
date: 2017-10-09 23:05:43+00:00
tags:
- linux
- tips
title: Disk Errors
---

This is a weird file... But while installing gentoo on a disk I started getting
a weird error when printing the current partitions on the drive:

```
Warning: The driver descriptor says the physical block size is 2048 bytes, but Linux says it is 512 bytes.
```

The only thing I've been able to find anywhere about this is "a low-level
device tool (like dd) wrote blocks at the wrong size directly onto the device".
Which apparently can fixed with another dd command with the correct byte size.

```
dd if=/dev/zero of=/dev/sda bs=2048 count=32 oflag=sync
```

That didn't actually seem to do the trick, but recreating the partition table
did... It also looks like it was due to me using `bs=1M` when copying the ISO
over the flash drive.
