---
created_at: 2017-11-27T17:23:09+0500
evergreen: false
public: true
tags:
  - gentoo
  - linux
  - xfce
title: XFCE Failed to Connect to Socket
slub: xfce-failed-to-connect-to-socket
---

# XFCE Failed to Connect to Socket

While trying to build up a minimal Gentoo graphical environment I kept running into an error every time I logged into XFCE from lightdm (I didn't try starting up XFCE any other way). There are tons of blog posts that relate to systemd, ubuntu, or crouton but none related to Gentoo.

The first error message that pops up is:

```text
Unable to contact settings server

Failed to connect to socket /tmp/dbus-xxxxxxxxx: Connection refused
```

Once you click through there was a second error message, but I believe it was due to the previous error and not actually an issue:

```text
Unable to load a failsafe session

Unable to determine failsafe session name. Possible causes: xfconfd isn't
running (D-Bus setup problem), environment variable $XDG_CONFIG_DIRS is set
incorrectly (must include "/etc"), or xfce4-session is installed incorrectly.
```

Where the x's are replaced with a random string. My issue ultimately was dbus not being compiled with the 'X' use flag. Adding that flag to "sys-apps/dbus" and re-emerging with the new flags got me to a clean desktop. Great success.
