---
date: 2017-11-27T17:23:09+05:00
tags:
- linux
- gentoo
- xfce
title: XFCE Failed to Connect to Socket
---

While trying to build up a minimal Gentoo graphical environment I kept running
into an error every time I logged into XFCE from lightdm (I didn't try starting
up XFCE any other way). There are tons of blog posts that relate to systemd,
ubuntu, or crouton but none related to Gentoo.

There error in particular is:

```
Failed to connect to socket /tmp/dbus-xxxxxxxxx: Connection refused
```

Where the x's are replaced with a random string. My issue ultimately was dbus
not being compiled with the 'X' use flag. Adding that flag to 'sys-apps/dbus'
and re-emerging with the new flags got me to a clean desktop. Great success.
