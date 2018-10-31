---
title: Partitioning
---

***Note: This page is quite old and is likely out of date. My opinions may have
also changed dramatically since this was written. It is here as a reference
until I get around to updating it.***

## Recommended / Best Practices

* /boot 200Mb
* swap 1.5x times the amount of RAM
* /
* /home
* /tmp
* /var
* /var/log
* /var/log/audit
* Encrypt all partitions except /boot

## Creating an LVM partition

### Create a Physical Partition

* Open the drive in fdisk, create a new primary partition
* Mark the new partition as type '8e' or Linux LVM
* Write the partition table

### Create Physical LVM Volume

```
pvcreate /dev/sdc1 (assuming /dev/sdc1 was the partition just created)
```

### Volume Group Creation

This point needs a bit of thinking before doing. There is a limit on the number
of physical extents that can be accessed. This in turn limits the size of the
volume group. This limit is 65,536 extents.

The default size is 4MB/extent. This by default leads to a limit of 256GB per
volume group. 8MB/extent gets you 512GB. The maximum size I see needing is
32MB/extent for a size of 2TB. The following example uses an extent size of
16MB and assumes the partition is `/dev/sdc1`.

```
vgcreate -s 16M vg_test /dev/sdc1
```

### Logical Volume Creation

The following creates a 1GB logical volume group, there does not seem to be a
way to create a logical volume with all the remaining space in the volume
group.

```
lvcreate -L 1G -n lv_test vg_test
```

## Securing Partitions

* Add `nodev` to all non-root local ext{2,3,4} partitions in `/etc/fstab`
* Add `nosuid` and `noexec` to `/tmp` partition
* Bind mount /tmp to /var/tmp with `rw,nodev,nosuid,noexec,bind` as options
* If removable storage is enabled add `nodev`, `nosuid`, `noexec` to their
  partitions
* Disable auto mounter (autofs)
* Dynamically [encrypt the swap partition][1] (not for any machine that will be
  hibernated)

## Encrypting Additional Partitions

```
cryptsetup luksFormat -c aes-xts-plain -s 256 -h sha256 /dev/vg_test/lv_test
cryptsetup luksOpen -c aes-xts-plain -s 256 -h sha256 /dev/vg_test/lv_test \
  cryptTest
mkfs.ext4 /dev/mapper/cryptTest
cryptsetup luksClose /dev/mapper/cryptTest
```

[1]: {{< ref "./swap.md" >}}
