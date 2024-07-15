---
created_at: 2017-10-24T11:45:07-0400
evergreen: true
public: true
tags:
  - linux
  - lvm
  - tips
title: Investigating LVM From Dracut
slug: investigating-lvm-from-dracut
---

# Investigating LVM From Dracut

In my [my last post]({{< ref "2017-10-24-visible-yet-missing-logical-volumes" >}}), I covered finding logical volumes that were missing from LVM from within a live CD (which is effectively a whole standard environment). Working with dracut is quite a bit more limited.

Turns out that the commands I'm normally used to for operating and inspecting LVM volumes can all be accessed as a second parameter to the "lvm" tool like so:

```console
$ lvm vgscan
$ lvm pvscan
$ lvm lvscan
```

For my particular issue, it led me to notice that block device of my root filesystem was missing due to a missing kernel driver...
