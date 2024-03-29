---
title: Time
weight: 42

taxonomies:
  tags:
  - linux

extra:
  done: true
---

This is a very basic operation on a Linux system, but I have to interact with
it so rarely since I run either [chronyd][1] or [ntpd][2] on all of machines.
Occasionally, I find a device that needs a helping hand.

<!-- more -->

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

[1]: @/notes/chronyd.md
[2]: @/notes/ntpd.md
