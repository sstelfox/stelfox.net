---
title: Swap
---

***Note: This page is quite old and is likely out of date. My opinions may have
also changed dramatically since this was written. It is here as a reference
until I get around to updating it.***

## Security

If at any point a decryption key is needed to access a file, it will be stored
in RAM. If an otherwise encrypted file is edited it will get stored in RAM
before being saved. Without warning at any time that RAM can be swapped out to
disk, at which point there is now a recoverable copy of an encryption key or
sections of an encrypted document plain text on disk that [can be
recovered][1].

To prevent this I strongly recommend encrypting the swap. During a standard
install of Fedora if you want to accomplish this you have to use dirty
VolGroups and LVMs. I hate VolGroups and LVMs and on top of that it will be
using a set static key that I'm sure will eventually be open to static
analysis. While most people won't care about the latter I like to avoid the
whole thing if I can do it with a fast simple solution.

My solution is to take swap out of the hands of fstab and mount it myself after
generating a one-time key for that session. When the computer turns off the key
will be completely lost and a new one will be generated the next time the
computer boots. I don't want to do this by hand every time the computer boots
so I'll make sure it does this automatically.

The first step is to prevent Linux from mounting the swap on it's own. To do
this comment out all the lines in fstab that have to do with swap. They will
look like the following:

```
/dev/sda3       swap                swap        defaults        0 0
```

Your going to need to know what partitions your swap lives on. In the above
example swap lives on `/dev/sda3`, it is very likely that your's will live on a
different device/partition.

First we're going to want to fill the swap space with junk to make sure that
there isn't anything useful left on there to be recovered. Your going to want
to make sure that your system isn't currently using the swap, so first turn it
off before writing over the swap space. The latter command is very dangerous if
you do it on the wrong partition! Double check before executing it!

```
[root@localhost ~]# swapoff -a
[root@localhost ~]# dd if=/dev/urandom of=/dev/sda3
```

Next we'll want to make one of the boot scripts initialize encryption and mount
the swap, there is a specific boot script created explicitly for user
modification that other packages won't touch. We're going to use that one which
is `/etc/rc.d/rc.local`. You'll want to add the following lines to it.

```
cryptsetup -c blowfish -h sha256 -d /dev/urandom create swap /dev/sda3
mkswap -f /dev/mapper/swap
swapon /dev/mapper/swap
```

The cipher in the above command can be swapped around, blowfish is a strong
encryption with a fairly good throughput however it seems that 256bit
aes-xts-plain is a bit faster without sacrificing too much security. If you'd
prefer to use that instead, replace the cryptsetup invocation with the
following one:

```
cryptsetup -c aes-xts-plain -s 256 -h sha256 -d /dev/urandom create swap /dev/sda3
```

Fedora has device mapper support built into the kernel, however if your
distribution doesn't have device mapper support active by default, in the line
right before the cryptsetup invocation add the line "modprobe dm-mod" to load
the kernel module. Otherwise you'll get a "Command failed: Incompatible
libdevmapper" error.

[1]: {{< relref "notes/data_recovery.md" >}}
