---
created_at: 2014-02-01T13:50:46-0500
tags:
  - linux
  - tips
slug: setting-linux-system-timezone
title: Setting Linux System Timezone
---

# Setting Linux System Timezone

I change the timezone on the linux systems so rarely that I almost always have
to look it up. I'm writing it up here for my own personal reference. With any
luck it'll also help others.

The system timezone is controlled by the `/etc/localtime` file and is generally
symlinked to locale files stored in `/usr/share/zoneinfo`. Generally I like to
keep my systems on UTC as I my machines are in several timezones and it makes
all the logs have consistent times.

To set the system time to UTC you'd run the following command as root:

```sh
ln -sf /usr/share/zoneinfo/UTC /etc/localtime
```

Other timezones can be found in the `/usr/share/zoneinfo` and are generally
broken up by continent with a few exceptions.

As a user it's obviously more useful to see the time in my local timezone and
this can be overridden on a per-user basis using the `TZ` environment variable.
I stick this in my `~/.bashrc` file and it just works transparently:

```sh
export TZ="America/Los_Angeles"
```
