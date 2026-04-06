---
created_at: 2013-01-01T00:00:01-0000
evergreen: true
public: true
tags:
  - linux
  - storage
  - tips
title: Data Recovery
aliases:
  - /notes/data-recovery/
  - /notes/data_recovery/
---

# Data Recovery

## Recovering Data from Swap

Sometimes useful bits of information can be recovered from swap. Whether it's encryption keys, documents that were being worked on or anything else that might've ended up in RAM. To search through the swap for interesting bits (and depending on the size this might take a while) you can execute the following command as root or sudo to do it:

```console
# strings `/bin/swapon -s | tail -1 | awk '{print $1}'` | less
```

The command above uses the swapon utility to list all of the swap devices in use; look at the last line of the output (most people only have one swap device); extract only the path to the device node. Run the strings utility (which prints only printable strings of text from whatever you run through it) on the swap device. Break the output down by pages.

A lot of the output will look like junk, but if you're patient some interesting things can pop out at you.

## Recovering Deleted Files Still Open by a Process

If a file has been deleted but a process still has it open, the file descriptor is still accessible through `/proc`. Find the process and fd:

```console
# lsof | grep deleted
# cp /proc/<pid>/fd/<fd_number> /path/to/recovered_file
```

This works because the kernel doesn't actually free the inode until all file descriptors referencing it are closed.

## Imaging a Failing Drive

When a drive is starting to fail, the priority is getting data off it as quickly as possible. `ddrescue` is designed for this, it reads what it can first, then goes back for the hard-to-read sectors:

```console
# ddrescue -d -r3 /dev/sdX /path/to/image.img /path/to/logfile.log
```

The `-d` flag uses direct I/O to bypass the kernel cache (reduces overhead on a struggling drive), and `-r3` retries bad sectors up to 3 times. The log file tracks progress so you can resume if interrupted.

Once you have the image, you can mount it as a loop device and work with it safely:

```console
# mount -o loop,ro /path/to/image.img /mnt/recovery
```

## Recovering Files from ext4

`extundelete` can recover recently deleted files from ext4 filesystems. The filesystem must be unmounted (or mounted read-only) first:

```console
# umount /dev/sdX1
# extundelete /dev/sdX1 --restore-all
```

Recovered files end up in a `RECOVERED_FILES/` directory. The sooner you run this after deletion the better, as the blocks can be reused at any time.

For more complex recovery scenarios, `photorec` from the TestDisk suite can carve files based on known file signatures regardless of filesystem state. It works on disk images too:

```console
# photorec /path/to/image.img
```
