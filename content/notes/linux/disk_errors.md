---
created_at: 2017-10-09T23:05:43-0000
evergreen: true
public: true
tags:
  - linux
  - storage
  - tips
title: Disk Errors
aliases:
  - /notes/disk-errors/
  - /notes/disk_errors/
---

# Disk Errors

A collection of disk-related errors and their fixes.

## Block Size Mismatch Warning

After writing an ISO to a flash drive, partitioning tools may complain:

```text
Warning: The driver descriptor says the physical block size is 2048 bytes, but Linux says it is 512 bytes.
```

This happens when a tool like dd writes at the ISO's native 2048-byte block size onto a device that uses 512-byte sectors. Zeroing the first few blocks sometimes helps:

```console
$ dd if=/dev/zero of=/dev/sdX bs=2048 count=32 oflag=sync
```

If that doesn't clear it, recreating the partition table with `fdisk` or `gdisk` will.

## SMART Monitoring

Check the health of a drive with smartctl:

```console
$ smartctl -a /dev/sdX
```

Key attributes to watch for trouble:

- **Reallocated_Sector_Ct** (ID 5): sectors the drive has remapped due to read errors. Any non-zero value means the drive is actively degrading.
- **Current_Pending_Sector** (ID 197): sectors waiting to be remapped on next write. Non-zero means the drive is struggling.
- **Offline_Uncorrectable** (ID 198): sectors that couldn't be read during offline tests.
- **UDMA_CRC_Error_Count** (ID 199): usually indicates a bad cable or connection rather than a dying drive.

Run a short self-test:

```console
$ smartctl -t short /dev/sdX
```

And check results after a few minutes:

```console
$ smartctl -l selftest /dev/sdX
```

## Filesystem Repair

For ext4 filesystems, unmount first then check:

```console
$ umount /dev/sdX1
$ fsck.ext4 -f /dev/sdX1
```

The `-f` flag forces a check even if the filesystem appears clean. For XFS:

```console
$ xfs_repair /dev/sdX1
```

If the filesystem is too damaged to mount normally, try mounting read-only first to recover what you can:

```console
$ mount -o ro,norecovery /dev/sdX1 /mnt/recovery
```

## Bad Blocks

Test a drive for bad blocks (this is a destructive write test, data will be lost):

```console
$ badblocks -wsv /dev/sdX
```

For a non-destructive read-only test:

```console
$ badblocks -sv /dev/sdX
```

These tests take a long time on large drives but can confirm whether a drive has physical media issues beyond what SMART reports.
