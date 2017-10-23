---
date: 2011-02-25 14:37:39+00:00
slug: linux-n-issues-kde-multi-monitor-woes
tags:
- linux
title: Linux N Issues & KDE Multi-Monitor Woes
---

So I recently did a fresh install of Fedora 14 with KDE installed (not the KDE
spin mind you) on my ThinkPad. I'm pleasantly surprised with hows it's working
everything seems to be working out the box very stably. I used it without issue
for a solid month and a half without a single issue.

Earlier this week I started having issues with my wireless card on some
networks, but not at all of them. The most prominent one being my home network.
I've had issues with my access point dropping connections before on a wide
array of machines and not actually dropping it (IE: my laptop would see it as
connected but the AP wouldn't exchange traffic with it). So when I started
seeing this behavior I expected that issue to have cropped up again.

The actual behavior that I was witnessing was this:

1. Connect to wireless network
2. Use the connection for 5-10 seconds
3. Pages would start timing out even though the connection was still 'active'

Disconnecting and reconnecting to the wireless would start the situation all
over again, which quickly became frustrating but I didn't have time to mess
with it so I just plugged into an ethernet port and went about my business.

The next day I received my the `logwatch` from my laptop (Yes, my laptop sends
it's logs to my email) and it mentioned more than 20,000 new entries of an
error I've never seen before:

```
iwlagn 0000:03:00.0: BA scd_flow 0 does not match txq_id 10
```

After poking around a bit online I found that the issue is with a recent kernel
update (I'm currently running 2.6.35.11-83) changing the behavior of some
sanity checks to wireless connections that support 'N'. Turns out my wireless
card and all the networks I was having issues with support 'N'. Good to know.

It was easy enough to solve that issue, the kernel module just needed an option
passed to it that I believe just disables 'N'. This is all well and good but I
haven't had to manually pass options to a kernel module for a couple of
releases now (I think the last was Fedora 10). Since then the file
`/etc/modules.conf` has been deprecated in favor of placing files in
`/etc/modules.d/`. There are some files that come stock in there but none are
passing parameters to modules and the naming scheme doesn't seem to conform to
anything.

I was unsure if there was something specific I had to name the file or if it
needed to be in one of the existing files. I ended up creating the
file `/etc/modprobe.d/iwlagn.conf` and putting the following in it:

```
options iwlagn 11n_disable=1
# This one might be needed instead
#options iwlagn 11n_disable50=1
```

After I rebooted the problem vanished like it was never there. If you notice
there is a second option in there that is commented out. I found some people
where the first option didn't work but replacing it with that second option
did, so if one doesn't work for you try the second option.

The second issue that I encountered was just this morning. I'm working at a
remote site today that I'm not at very often, and am using my laptop as my
desktop workhorse. Usually when I'm at a remote site, I steal an office that
isn't in use and claim it as my own, and today was no different. There was a
screen in this office that had its power plugged it but it's VGA cable was just
sitting there. I figured 'why not?' so I plugged it in and KDE happily
announced that it detected a new display and offered to take me to the settings
interface that would allow me to configure it.

"Awesome!" I thought, multiple desktops has always been one of those things I
had to tweak and search around for and it looks like KDE is making some serious
strides in their support for it. When I turned it on I wasn't really paying
attention to the settings and my laptop display ended up on the wrong side of
the screen and my primary desktop on the LCD. Not exactly what I wanted but
it's cool that it was that easy to setup.

I went back into the configuration options switched things around, but no
matter what I did, the 'primary desktop' was always on the external monitor.
What's more is that there isn't any option for selecting the primary display!
That *used to* be there...

I hunted around before getting frustrated and searching around online. Sure
enough other people were annoyed by this regression but the solution was very
easy (though it appears you have to do it every time).

To set the primary monitor to my laptop screen (LCDS1) I just opened a shell
and put this in:

```sh
xrandr --output LCDS1 --primary
```

Poof! Everything is all set and I'm happy once again. I hope that the KDE
developers put back the primary display selection in the settings but for now
it's easy enough. Hopefully this will help other people on the net.
