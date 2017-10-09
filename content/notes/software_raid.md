---
title: Software RAID
---

***Note: This page is quite old and is likely out of date. My opinions may have
also changed dramatically since this was written. It is here as a reference
until I get around to updating it.***

## Installation

The mdadm package is required for software RAID:

```
yum install mdadm -y
```

## Array Creation

```
mdadm --create /dev/md0 --verbose --level=1 --raid-devices=2 /dev/sda /dev/sdb
```

Shorthand:

```
mdadm -Cv /dev/md0 -l1 -n2 /dev/sd[ab]
```

Note: If you use a RAID 0 and want to put ZFS on top of be sure to set a chunk
size <= 256 (maybe even 128 if you're still getting errors) otherwise ZFS will
warn about issues creating it's partitions.

## Troubleshooting

## Status Check

You can view the status of the RAID by cat'ing `/proc/mdstat`. You can see more
details by using the mdadm utility like so:

```
mdadm --misc --detail /dev/md0
```

As long as the state is clean you're golden.

## Recovery

### Configuration File

During initial setup the /etc/mdadm.conf is created automatically. All this
data exists in the metadata on the disks and can be rebuilt with the mdadm tool
like so:

```
mdadm --examine --scan > /etc/mdadm.conf
```

### Remove Disk from Array

A disk needs to be failed before it can be removed from an array, if it isn't
already you'll need to fail it manually:

```
mdadm /dev/md0 --fail /dev/sda
```

Then remove it:

```
mdadm /dev/md0 --remove /dev/sda
```

Or in a single step:

```
mdadm /dev/md0 --fail /dev/sda --remove /dev/sda
```

### Adding a Disk to an Existing Array

Probably useful for replacing a failed disk:

```
mdadm /dev/md0 --add /dev/sda
```

## Delete an Array

You'll lose all data... don't say I didn't warn you...

```
mdadm --stop /dev/md0
```

I didn't need the second command but you'll want to run it if the device is
still kicking around:

```
mdadm --remove /dev/md0
```

And blow away the super block on all of the drives:

```
mdadm --zero-superblock /dev/sd[ab]
```
