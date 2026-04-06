---
created_at: 2013-01-01T00:00:01-0000
title: Partitioning
tags:
  - linux
  - storage
  - encryption
aliases:
  - /notes/partitioning/
---
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

The default physical extent size is 4MB. Modern LVM no longer has the 65,536 extent limit that old versions did, so the default extent size is fine for most use cases. You can still increase it if you want slightly less metadata overhead on very large volumes.

```console
$ vgcreate vg_test /dev/sdc1
```

### Logical Volume Creation

The following creates a 1GB logical volume. To use all remaining space, use `-l 100%FREE` instead of `-L`.

```console
$ lvcreate -L 1G -n lv_test vg_test
$ lvcreate -l 100%FREE -n lv_rest vg_test  # use all remaining space
```

## Securing Partitions

* Add `nodev` to all non-root local ext{2,3,4} partitions in `/etc/fstab`
* Add `nosuid` and `noexec` to `/tmp` partition
* Bind mount /tmp to /var/tmp with `rw,nodev,nosuid,noexec,bind` as options
* If removable storage is enabled add `nodev`, `nosuid`, `noexec` to their
  partitions
* Disable auto mounter (autofs)
* Dynamically encrypt the swap partition (not for any machine that will be hibernated)

## Encrypting Additional Partitions

```console
$ cryptsetup luksFormat /dev/vg_test/lv_test
$ cryptsetup luksOpen /dev/vg_test/lv_test cryptTest
$ mkfs.ext4 /dev/mapper/cryptTest
$ cryptsetup luksClose /dev/mapper/cryptTest
```

Modern `cryptsetup` defaults to strong cipher settings (aes-xts-plain64, 256-bit key, argon2id for key derivation), so explicit cipher options are rarely needed.
