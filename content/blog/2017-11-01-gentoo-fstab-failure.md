---
created_at: 2017-11-01T11:12:34-0400
evergreen: true
public: true
tags:
  - gentoo
  - linux
  - tips
title: Gentoo Fstab Failure
slug: gentoo-fstab-failure
---

# Gentoo Fstab Failure

I use Gentoo with OpenRC quite a bit both for my personal servers and as a compilation test bed for new software since I can control the dependency versions very tightly.  I have a set of scripts I've been using for quite some time that handle setting up a hardened, fairly minimal install.

I recently encountered a weird issue with them that resulted in an esoteric error that prevented my host from fully booting and leaving the root filesystem read-only. There also didn't seem to be much reliable information on the problem so I'm documenting it here in hopes it may help someone else.

In addition to the read-only filesystem, none of the system services would start up leaving me with the kernel's default hostname of "(none)". This includes networking so I had to diagnose this directly via the console. I was able to login as a user but unable to use sudo to switch to a new user (though I could still use it to execute commands with elevated privileges).

I was able to verify all the OpenRC services had not started with by executing:

```console
$ sudo rc-status
```

I attempted to start the SSH daemon (though any networked service should behave the same) using the following command:

```console
$ sudo service sshd start
```

This was the first time any error had directly presented itself to my screen (and since my filesystems were read-only, and my logger was stopped I had no on disk logs to go off from). The error that was repeated over my screen was the following:

```console
 * Checking local filesystems  .../sbin/fsck.xfs: XFS file system.
fsck.fat 4.0 (2016-05-06)
open: No such file or directory

 * Filesystems couldn't be fixed
                                         [ !! ]
 * ERROR: fsck failed to start
 * ERROR: cannot start root as fsck would not start
```

This was quite confusing and more than a little concerning as XFS doesn't use fsck, instead it uses xfs_repair. There was also the "No such file or directory" error which also didn't seem to make sense.

Ultimately, after reviewing the fsck init script I found the culprit. There was a bad line in my /etc/fstab file pointing at a device that didn't exist. I was able to remount my root filesystem read-write and edit my fstab to fix the device name in my fstab file:

```console
$ sudo mount -o remount,rw /
$ sudoedit /etc/fstab
```

Tracing things back, this was ultimately caused by the Gentoo installation medium detecting it's only disk as /dev/sda while the kernel I use exposed it as /dev/vda. Since I was already using a GPT filesystem I was able to adjust my scripts so they reference this particular partition by UUID instead of directly by device name.
