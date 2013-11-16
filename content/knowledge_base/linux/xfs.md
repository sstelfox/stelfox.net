---
title: XFS
---

# XFS

## Installation/Setup

```
yum install xfsprogs -y
```

The XFS partition needs to be created on a proper partition not a raw device.
It also seems like XFS for linux is currently having issues with partitions
larger than 2Tb...

Creating the partition is as simple as:

```
mkfs.xfs /dev/sda1
```

