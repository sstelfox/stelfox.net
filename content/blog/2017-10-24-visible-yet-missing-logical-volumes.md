---
date: 2017-10-24 10:58:12-04:00
tags:
- linux
- lvm
- tips
title: Visible Yet Missing Logical Volumes
---

While working on an automated install script for an embedded board, I hit an
issue with the logical volumes never showing up in `/dev/mapper`, and in turn
unable to be mounted. This left me in the dracut emergency shell (after about
three minutes), with little to go on beyond the following error:

```none
[187.508531] dracut Warning: Could not boot.
[187.510560] dracut Warning: /dev/disk/by-uuid/5681-902D does not exist
[187.512534] dracut Warning: /dev/mapper/system-root does not exit
[187.513990] dracut Warning: /dev/system/root does not exist
```

After booting into a live CD I checked to make sure the volume group showed up
under `pvscan` like so:

```sh
livecd ~ # pvscan
  PV /dev/mmcblk0p3   VG system     lvm2 [19.50 GiB / 0    free]
  Total: 1 [19.50 GiB] / in use: 1 [19.50 GiB] / in no VG: 0 [0   ]
```

And the logical volumes were also showing up with `lvscan`:

```sh
livecd ~ # lvscan
  inactive          '/dev/system/root' [18.45 GiB] inherit
  inactive          '/dev/system/swap' [1.05 GiB] inherit
```

Notice that they are both marked inactive? That's our issue. To fix it we can
mark all logical volumes under our volume group as active (replace `system`
with your volume group name):

```sh
vgchange --activate y system
```

This didn't fix the LVM volumes showing up at boot but it did allow me to get
back into my root filesystem as a chroot so I could investigate the issue which
I've finished documenting in [another post][1].

[1]: {{< relref "blog/2017-10-24-investigating-lvm-from-dracut.md" >}}
