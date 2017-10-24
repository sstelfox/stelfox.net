---
date: 2017-10-24 11:45:07-04:00
tags:
- linux
- lvm
- tips
title: "Investigating LVM From Dracut"
---

In my [my last post][1], I covered finding logical volumes that were missing
from LVM from within a live CD (which is effectively a whole standard
environment). Working with dracut is quite a bit more limited.

Turns out that the commands I'm normally used to for operating and inspecting
LVM volumes can all be accessed as a second parameter to the `lvm` tool like so:

```sh
$ lvm vgscan
$ lvm pvscan
$ lvm lvscan
```

For my particular issue, it led me to notice that block device of my root
filesystem was missing due to a missing kernel driver...

[1]:{{< relref "blog/2017-10-24-visible-yet-missing-logical-volumes.md" >}}
