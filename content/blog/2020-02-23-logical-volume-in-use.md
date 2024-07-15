---
created_at: 2020-02-23T20:09:02-0400
public: true
evergreen: true
tags:
  - linux
  - lvm
title: Logical Volume in Use
slug: logical-volume-in-use
---

# Logical Volume in Use

While attempting to automate some filesystem creation that involved LVM I kept running into an issue occasionally with some holding open the logical volumes. I would attempt to disable the volume using the following command:

```console
$ lvchange -an system/storage
Logical volume system/storage contains a filesystem in use.
```

All of the mounts for the filesystems that were on the volume were unmounted, so it must have been a process. The trick to finding this out is to query all the processes mount files to find out what is holding this open. In my case since I'm searching for the system volume I'll need to filter out systemd. The following the command will find the offending processes:

```console
$ grep system /proc/*/mounts | grep -vE '(cgroup|systemd)'
/proc/338/mounts:/dev/mapper/system-storage /mnt/storage_target xfs rw,noatime,attr2,inode64,logbufs=8,logbsize=32k,noquota 0 0
/proc/421/mounts:/dev/mapper/system-storage /mnt/storage_target xfs rw,noatime,attr2,inode64,logbufs=8,logbsize=32k,noquota 0 0
```

From here we need to identify the offending processes using the PID identifiers from the previous output:

```console
$ ps -q 338,421 -o comm=
systemd-udevd
systemd-logind
```

Disabling, shutting down, or kill the offending processes allow the LVM to be disabled and properly removed. Of course it was systemd...
