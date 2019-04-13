---
date: 2019-04-13 11:53:22-04:00
tags:
- linux
- firefox
- tips
title: Fixing Dark Input Boxes in Firefox
---

I recently began trying out [Cinnamon][1] as my desktop environment and I've
been thoroughly enjoying it. The only issue I was having was occasionally a
page's form input fields would have a dark background while still having dark
text making it impossible to read, and very difficult to write.

It wasn't happening everywhere, and I couldn't track down what about a website
would cause the issue. Most prominently for me was when this showed up in AWS's
interface.

![Example of Dark Input in AWS Security Groups](/images/dark_firefox_inputs.png)

Searching around apparently this was an issue with dark GTK themes and has been
a [known issue for about 18 years][2] and was re-reported again [about 3 years
ago][3]. There have been a really bad workaround that people have suggested
including [extensions][4], [custom user CSS][5], and [using desktop shortcuts
with environment variables][6].

None of these work well, will be inconsistent based on how you open Firefox, or
might cause other issues with different websites. Generally I'm not a fan of
using random extensions for security, stability, and performance reasons.
Ultimately Mozilla hasn't fixed this issue, but there is a workable override at
this point.

To solve the issue we do need to override the GTK theme with a light one.
Generally people recommend `Adwaita` for the light theme that fixes it and it
seems to work well for me. You can check and make sure that the theme is
available by checking the `/usr/share/themes` directory on your system.

When you've confirmed the presence of the theme, open up Firefox and go to the
URL `about:config`. This override value doesn't exist by default so you'll need
to right click anywhere in that page and go to `New -> String` in that context
menu. For the preference name enter `widget.content.gtk-theme-override` and for
the value enter `Adwaita`. After refreshing the effected pages the background
color issue should be resolved.

If you're making use of a `user.js` to enforce configuration options you can
add the following line to it address the issue:

```
user_pref("widget.content.gtk-theme-override", "Adwaita");
```

A little side note in case someone comes looking for other options. There was
another `about:config` option that some Stack Overflow answers recommended
changing, `widget.content.allow-gtk-dark-theme`. The default is `false` and
they're recommending changing it to... `false`. It's not the answer to this
problem.

Hope this helps someone else out. Cheers!

[1]: https://github.com/linuxmint/Cinnamon
[2]: https://bugzilla.mozilla.org/show_bug.cgi?id=70315
[3]: https://bugzilla.mozilla.org/show_bug.cgi?id=1283086
[4]: https://github.com/DmitriK/darkContrast#text-contrast-for-dark-themes
[5]: https://stackoverflow.com/questions/19911090/firefox-how-to-see-text-in-input-fields-with-black-background-set-in-preference
[6]: https://medium.com/@lsm/fix-firefox-dark-text-input-on-ubuntu-18-when-using-gnome-dark-themes-98f253f8ed7f
