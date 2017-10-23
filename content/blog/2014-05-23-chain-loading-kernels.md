---
date: 2014-05-23 11:39:16 -0400
slug: chain-loading-kernels
tags:
- linux
title: Chain Loading Kernels
---

I've found several places where I needed to be able to update my kernels but
for one reason or another can't update the kernel that gets booted initially. A
couple of these situations were:

* Running Custom or Updated Kernels on DigitalOcean (this is one of their
  biggest failings IMHO)
* Allowing updating of kernels on embedded linux devices that require their
  kernel flashed into NVRAM.
* Running an embedded system that used an active/backup partition scheme for
  updating.

In all cases the process was pretty much the same, though there were some
custom changes to the preliminary init system depending on what I needed to get
done, especially with the last one which I may cover in a different article.

In all cases these were done on a Red Hat based distribution like CentOS,
Scientific Linux, RHEL, or even Fedora. For those users of Debian based systems
you'll need to adjust the scripts too your system though I can't imagine
anything other than the package names changing.

This assumes you already have the kernel and initramfs you want to boot
installed on your local filesystem at `/boot/vmlinuz-custom` and
`/boot/initramfs.img`.

A quick background on how this works, when the linux kernel is compiled an init
program is configured to be the first thing triggered, by default and in most
situations this will be the executable `/sbin/init`. This init process is then
responsible for starting the rest of the daemons and processes that make up the
systems we regularly interact with.

There are tools that allow you too effectively execute another kernel to run in
place of the kernel that is already running. There are some catches though as
the new kernel won't always re-initialize all devices (since they've already
been initialized) and that can lead too some weird behaviors with processes
that already have hooks on those devices.

Too prevent any issues you need to load the new kernel as early in the boot
process as possible. Doing this in the init program is pretty much as early as
you can get and makes for a pretty stable system (I've yet to experience any
issues with machines running this way).

There are several different init systems and they all behave a little
differently, as far as I know only systemd supports a means of automatically
executing a different kernel but I am personally not a systemd fan and it would
be too late in the boot process already for me too trust the chain load. You
can reliably chain load kernels regardless of what your normal init system is
though very easily and that's what I'm going to cover here.

You'll need to have the kexec tools installed on your system. This is pretty
straight-forward:

```sh
yum install kexec-tools -y
```

Next we're going to shift the standard init process off to the side, someplace
still accessible so we can call it later (this will need to be done as root).

```sh
mv /sbin/init /sbin/init.original
```

Now we need to create our own init script that will handle detecting if it's
the new or old kernel, replacing the kernel if it is indeed an old one, and
starting up the normal init process if it's the new kernel.

Now there is a very important catch here, whatever process starts up first is
given PID 1 which is very important in kernel land. Whatever process is PID 1
will inherit all zombie processes on the system and will need to handle them.
Since our shell script is the first thing started up it will get PID 1 for both
the old and new kernel and getting the process handling code correct is not a
trivial issue.

What we really need is to hand over PID 1 to the init process so it can do it's
job normally as if the shell script never existed. There is a native function
to do exactly this in these shell scripts: `exec`.

Our simple shell script to do the chain load looks like this:

```sh
#!/bin/bash

# Detect if this is the old kernel (not booted with the otherwise meaningless
# 'kexeced' parameter.
if [ $(grep -q ' kexeced$' /proc/cmdline) ]; then
  kexec --load /boot/vmlinuz-custom --initrd=/boot/initramfs.img \
    --reuse-cmdline --append=' kexeced'
  kexec --exec
fi

# If we made it this far we're running on the new kernel, trigger the original
# init binary with all the options passed too this as well as having it take
# over this process's PID.
exec /sbin/init.original "$@"
```

After rebooting you should be in your new kernel which you can verify with
`uname -a` and also by examining the `/proc/cmdline` file for the existence of
the `kexeced` flag.

If you modify the script above, be very careful as any execution error will
cause your system to die and recovery will only be possible by mounting the
filesystem on another linux system and fixing it.

In a future article I'll cover how to use this trick to build an active /
backup system allowing you to fall back to a known good system when booting
fails which is incredibly useful for embedded devices in the field that need
updates but are not easy to get too or replace when an update bricks the
system.
