---
date: 2017-11-26T21:49:51-05:00
tags:
- gentoo
- linux
title: Unable to Enter LUKS Passphrase
---

While setting up a gentoo install with a full disk encryption, I continuously
got to a point where the passphrase would show up on boot but I was unable to
enter the passphrase. The behavior of the keyboard was also odd, it would
toggle it's numlock light every couple of button presses.

Once again this was an issue that was hard to search for, and most other people
asking it seemed to only get snarky non-answers which seem so prevalent in
forums.

Ultimately the issue was with me not having XHCI support compiled into my
kernel and having my keyboard plugged into a USB 3.0 or 3.1 port. After
enabling and recompiling my kernel the issue immediately cleared up.
