---
title: Xen
---

Full Xen dom0 support was added in the Linux 3.0 kernel. This means there's no
longer a need to drag patches forward from old kernels and work from special
branches and git repositories when building a kernel for dom0.

Something else you might not have noticed is that the Fedora kernel team has
quietly slipped Linux 3.0 into Fedora 15's update channels in disguise. Click
that link, scroll down, and you'll see "Rebase to 3.0. Version reports as
2.6.40 for compatibility with older userspace." Although I'm not a fan of
calling something what it isn't (2.6.40 doesn't exist on kernel.org), I can
understand some of the reasoning behind the choice.

This change makes the Xen installation on Fedora 15 pretty trivial. To get
started, update your kernel to the latest if you're not already on Fedora's
2.6.40 kernels:

```
yum -y upgrade kernel
```

We need three more packages (quite a few dependencies will roll in with them):

```
yum -y install xen libvirt python-virtinst
```

The xen package reels in the hypervisor itself along with libraries and command
line tools (like xl and xm). Libvirt gives us easy access to VM management with
the virsh command and python-virtinst gives us the handy virt-install command
to make OS installations easy.

Once those packages are installed, we need to make some adjustments in your
grub configuration. Open /boot/grub/menu.lst in your text editor of choice and
add something like this at the bottom:

```
title Fedora + Xen (2.6.40-4.fc15.x86_64)
        root (hd0,1)
  kernel /boot/xen.gz
        module /boot/vmlinuz-2.6.40-4.fc15.x86_64 ro root=/dev/sda1
        module /boot/initramfs-2.6.40-4.fc15.x86_64.img
```

Ensure that the root (hd0,1) is applicable to your system (adjust it if it
isn't). Also, check the kernel version to ensure it matches your installed
kernel and adjust the root= portion to match your root volume. Flip the default
line to a value which will boot your new grub entry and ensure the timeout is
set to a reasonable number if you need to temporarily switch back to your
original grub entry at boot time. (Hey, we all make mistakes.)

I take one extra precaution and change the UPDATEDEFAULT=yes line to no in
/etc/sysconfig/kernel. This ensures that future kernel updates don't trample
the entry you've just made. Keep in mind that you'll need to manually update
your grub configuration when you do kernel upgrades later.

Cross your fingers and reboot. If your system doesn't reboot properly, reboot
it again and choose your old kernel from the grub menu. Double-check your
configuration for fat-fingering and give it another try. If your system boots
and pings but you have no output via a monitor, don't fret. There's a patch for
the problem which should appear soon in Linux 3.0. The impatient can snag a
kernel source RPM, add the patch file, and build a local kernel (or you can
download my local build from when I did it).

Log in and verify that you booted into the dom0:

```
[root@xenbox ~]# xm dmesg | head -n 5
 __  __            _  _    _   _   ____     __      _ ____  
 \ \/ /___ _ __   | || |  / | / | |___ \   / _| ___/ | ___| 
  \  // _ \ '_ \  | || |_ | | | |__ __) | | |_ / __| |___ \ 
  /  \  __/ | | | |__   _|| |_| |__/ __/ _|  _| (__| |___) |
 /_/\_\___|_| |_|    |_|(_)_(_)_| |_____(_)_|  \___|_|____/
```

Once you're done with that, make sure libvirtd is running:

```
/etc/init.d/libvirtd start
chkconfig libvirtd on
```

Try installing a VM:

```
virt-install \
  --paravirt \
  --name=testvm \
  --ram=512 \
  --vcpus=4 \
  --file /dev/vmstorage/testvm \
  --graphics vnc,port=5905 --noautoconsole \
  --autostart --noreboot \
  --location=http://mirrors.kernel.org/debian/dists/squeeze/main/installer-amd64/
```

You should have a VM installation underway pretty quickly and it will be
visible via port 5905 on the local host. Enjoy the power and freedom of your
brand new type 1 hypervisor.

[http://fclose.com/b/linux/2258/managing-xen-dom0s-cpu-and-memory/ Additional notes about dom0's CPU and memory]

