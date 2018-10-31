---
date: 2017-10-13 12:30:23-04:00
tags:
- linux
title: Time
---

This is a very basic operation on a Linux system, but I have to interact with
it so rarely since I run either [chronyd][1] or [ntpd][2] on all of machines.
Occasionally, I find a device that needs a helping hand.

On a device with a known good time (or approximate enough):

```sh
date +%s
```

This will get you the current unix timestamp. On the target system needing
updating as root (replacing `<unix timestamp>` with the results from the last
command):

```
date --set="@<unix timestamp>"
hwclock --systohc
```

Ensure both clocks are updated:

```
date
hwclock --show
```

[1]: {{< ref "./chronyd.md" >}}
[2]: {{< ref "./ntpd.md" >}}
