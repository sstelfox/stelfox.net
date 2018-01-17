---
date: 2017-12-18T17:49:22-05:00
tags:
- arm
- embedded
- linux
- tips
title: Cross-Compiling Gentoo for Xilinx Boards
---

*Note: If you've come here looking to build a root filesystem for 32 bit ARM
devices I suspect everything but the build tuple will be the same. The issues
that need to be worked around largely packaging and profile issues that should
all be the same.*

I got a hold of a Zynq 7100 development board, and while I've played with some
embedded ARM microcontrollers such as the STM32F3 series and more basic RISC
style microcontrollers like Atmel's SAMD10 and Atmega lines, I've never played
with FPGA development before so I considered this an interesting learning
opportunity.

To do development of the FPGA and generally use the board at all you have to
shell out $2,995 for a non-transferable license of a proprietary piece of
software called Vivado to develop on the FPGA. For a hobby project just
exploring the board this isn't going to fly. There is a 30-day evaluation
version though and there are guides to getting it to work in Linux.

For this post I'm going to gloss over this part and get to the meat of the
largest issue I had while attempting to bootstrap the Linux portion of this
development board. Xilinx maintains its own very rough hacked together
distribution called [PetaLinux][1] which is just a very poorly designed wrapper
around [Yocto Linux][2].

Unfortunately I haven't been fully able to remove PetaLinux from my build, I
still need to use it to integrate the board specifics with the Linux kernel and
in turn compile the Linux kernel, u-boot, and handle the configuration to point
at a root filesystem living on the SD card. PetaLinux's incredibly limited
documentation can at least get you this far. This post covers building that
root filesystem and guides around some of the problems the Gentoo cross process
doesn't cover.

I want a target that is a bit more inclusive than most embedded Linux root
filesystems (think IoT devices). This device is less constrained than devices
like most OpenWRT capable devices (we're not limited to 16MB of space). Let's
quickly define some criteria that will determine the successful build of a root
filesystem:

* It will have all the utilities necessary to support interactive logins
* It will have a working file editor
* It will have a valid native compiler for itself
* It will have a working package manager to allow it to extend itself

From this set of goals we will both be able to re-compile everything natively
on the board if we so choose, and get access to the vast majority of packaged
software from the Gentoo repositories as well as easily perform project
development directly.

To get started you will have to have a working Gentoo install to start the
cross compilation from. I've personally had issues with the hardened, SELinux,
and no-multilib profile variants. If you encounter issues I strongly recommend
trying the standard system profile on your build host. I'm also sure there is
probably some way to get the portage cross tooling working in other
distributions, but I'll leave that as an exercise to the reader.

## Tooling

To get started we're going to want to setup an overlay specifically for our
cross development. This will allow customization of the profile for the device
later on. This is largely for use beyond this guide and is a good practice to
separate changes from your system and the target board.

These commands are pretty straight forward and do need to be run as root:

```bash
mkdir -p /usr/local/overlay/portage-crossdev/{profiles,metadata}
echo 'crossdev' > /usr/local/overlay/portage-crossdev/profiles/repo_name
echo 'masters = gentoo' >
/usr/local/overlay/portage-crossdev/metadata/layout.conf
chown -R portage:portage /usr/local/overlay/portage-crossdev

cat << EOF > /usr/local/overlay/portage-crossdev/metadata/layout.conf
masters = gentoo
thin-manifests = true
EOF

mkdir -p /etc/portage/repos.conf
cat << EOF > /etc/portage/repos.conf/crossdev.conf
[crossdev]
location = /usr/local/overlay/portage-crossdev
priority = 10
masters = gentoo
auto-sync = no
EOF
```

With our overlay setup we now need to install the cross development tools (once
again as root):

```
emerge sys-devel/crossdev
```

The next step is to build our initial tool chain. Having worked with many tool
chains before this is absolutely the easiest time I've ever had setting one up.
One command will get you all the way to a C/C++ compiler, linker, bintools, and
a standard library. The specific tool chain target tuple is for a glibc based
tool chain, on a Xilinx variant of an arm processor (or
arm-xilinx-linux-gnueabi).

```
crossdev --stable -s4 -t arm-xilinx-linux-gnueabi
```

This will result in a very bare bones root filesystem in
`/usr/arm-xilinx-linux-gnueabi`. This doesn't really have anything of value
yet.

## Base System

We need to configure portage and then a profile for our build. First off the
portage configuration, this exists in
`/etc/arm-xilinx-linux-gnueabi/etc/portage/make.conf` and varies slightly from
the default.

```
CHOST='arm-xilinx-linux-gnueabi'
CBUILD='x86_64-pc-linux-gnu'
ARCH='arm'

HOSTCC='x86_64-pc-linux-gnu-gcc'

CFLAGS='-O2 -pipe -fomit-frame-pointer'
CXXFLAGS="${CFLAGS}"

ROOT="/usr/${CHOST}/"

ACCEPT_KEYWORDS='arm'

USE="${ARCH}"

FEATURES='sandbox noman noinfo nodoc'

# Be sure we dont overwrite pkgs from another repo..
PKGDIR="${ROOT}packages/"
PORTAGE_TMPDIR="${ROOT}tmp/"

ELIBC='glibc'

PKG_CONFIG_PATH="${ROOT}usr/lib/pkgconfig/"

PYTHON_TARGETS='python2_7'
```

If you pay attention compared to the defaults there are a few changes I've
explicitly made:

1. Do not build packages, we simply don't need them
2. Allow PAM to be included
3. Reject the testing arm packages (~arm keyword)
4. Re-enable the file collision protections between packages
5. Explicitly define our valid python target at 2.7 only

The first three align with my original stated goals, building will be allowed
and preferred on the device so we won't need to host any packages. We want a
standard interactive login and ideally we want a stable system (as much as
possible). The last one is personal preference as in my build (after this guide
is over) I'll be using software that doesn't work on Python 3 variants.

The fourth change is something I want to draw specific attention to. This is
disabled by default because the stock ARM profile is inherently broken. It
attempts to force both a complete busybox system in addition to the standard
Gentoo base. The faux busybox binaries directly conflict and you'll end up in a
weird mixed state that isn't good. This is true of libraries as well which will
result in some core libraries failing to compile (`dev-libs/gmp` was the first
one that failed on me).

To both fix that issue and allow us to have a clean build, I needed to build a
custom Gentoo profile for targeting this device. This minimal profile will work
cleanly for our target.

```
rm /usr/arm-xilinx-linux-gnueabi/etc/portage/make.profile
mkdir /usr/arm-xilinx-linux-gnueabi/etc/portage/make.profile
echo 5 > /usr/arm-xilinx-linux-gnueabi/etc/portage/make.profile/eabi
cat << EOF > /usr/arm-xilinx-linux-gnueabi/etc/portage/make.profile/parent
/usr/portage/profiles/base
/usr/portage/profiles/arch/arm/armv7a
EOF

mkdir -p /usr/arm-xilinx-linux-gnueabi/etc/portage/package.keywords
cat << EOF > /usr/arm-xilinx-linux-gnueabi/etc/portage/package.keywords/system
sys-apps/coreutils ~arm
sys-apps/sandbox ~arm
EOF
```

There is one final workaround we're going to need to put in place before we can
begin compiling our system. Currently `sys-apps/portage` and
`dev-python/pyxattr` are incorrectly packaged and will use the system library
paths rather than those in the chroot.

This prevents both of them from being compiled with native extensions and
incorrectly places the files inside the chroot (They're in the 64 bit path on a
32 bit target). This is fixable once we have the root filesystem on the device
but in the meantime we need to set some use flags to avoid the issue:

```
mkdir -p /usr/arm-xilinx-linux-gnueabi/etc/portage/package.use
echo 'sys-apps/portage -native-extensions -xattr' > /usr/arm-xilinx-linux-gnueabi/etc/portage/package.use/portage
```

With that in place sit back grab a cup of your favorite warm beverage and watch
the system compile (seriously this is going to take a hot minute):

```
arm-xilinx-linux-gnueabi-emerge --update --newuse --deep @system
```

There is one final gotcha with the root filesystem, the commands to date will
not create several important directories. These can be created with the
following command:

```
mkdir -p /usr/arm-xilinx-linux-gnueabi/{dev,home,proc,root,sys}
```

At this point you should have a mostly complete root filesystem and may want to
start diverging from this guide (but pay attention to the kernel modules
section, and the rebuild section). There are a couple of things that won't
currently work, specifically:

* Authentication
* Serial Console
* Networking

## Authentication & Serial Usage

First authentication, we need to provide root with a password and PAM needs its
configuration files to function. We can't use the native tools (without qemu
binary emulation) to change the password so the fastest way to give root a
password is to pregenerate a password hash and drop it directly into the
relevant files. If you'd like to keep going you can use the hash below for the
super secure password 'root' (I don't recommend it):

```
sed -i 's`root:[^:]*:`root:$6$ufWqa3MP$CfFwj0M7tW15gUYBRVms3GG2FJTRMAhlpkwV7Bp4aro6mGFHmotMjHoePNoTd1Gf9fgzh/jJM3rvJgkGgSjz31:`' /usr/arm-xilinx-linux-gnueabi/etc/shadow
```

And the requisite PAM configuration files:

```
arm-xilinx-linux-gnueabi-emerge sys-auth/pambase
```

The serial console is going to be more device specific and is a bit tricky to
figure out. To find this out on my board I created a service that collected the
names of all devices under `/dev`, logged them to a file and found mine to be
`ttyPS0` (also one I've never seen before).

The following command will replace the default serial configuration with one
for this device (you may also have to change the baud rate it's running at):

```
sed -i 's`^s0:.*$`ps0:12345:respawn:/sbin/agetty -L 115200 ttyPS0 vt100`' /usr/arm-xilinx-linux-gnueabi/etc/inittab
```

## Networking

```
arm-xilinx-linux-gnueabi-emerge sys-apps/net-tools net-misc/netifrc \
  net-misc/dhcpcd net-misc/iputils sys-apps/iproute2
```

To get it to come up by default, since we can't use the `rc` tools natively yet
we can cheat. This assumes your kernel is configured to use the legacy network
names (which are more consistent and predictable :-/). This will setup eth0 to
come up automatically and use DHCP to grab an address on the network:

```
cat << 'EOF' > /usr/arm-xilinx-linux-gnueabi/etc/conf.d/net
# /etc/conf.d/net
modules="iproute2"

# Default DHCP config for interfaces
dhcp="release nonis nontp"

config_eth0="dhcp"
EOF

echo 'arm-board' > /usr/arm-xilinx-linux-gnueabi/etc/hostname
echo 'hostname="arm-board.localhost"' > /usr/arm-xilinx-linux-gnueabi/etc/conf.d/hostname
cat << 'EOF' > /usr/arm-xilinx-linux-gnueabi/etc/hosts
# /etc/hosts

127.0.0.1 localhost4 localhost
::1       localhost6 localhost
EOF

cd /usr/arm-xilinx-linux-gnueabi/etc/init.d/
ln -s net.lo net.eth0

cd /usr/arm-xilinx-linux-gnueabi/etc/runlevels/default/
ln -s /etc/init.d/net.eth0 net.eth0
rm -f netmount
```

## Kernel Modules

Part of the kernel build that has to happen still in the PetaLinux environment
are kernel modules. One of the build artifacts is the root filesystem PetaLinux
thinks you're going to use. These contain very important kernel modules which
need to be extracted.

Inside the root of your PetaLinux project after a build you should find a file
`images/linux/rootfs.tar.gz` which will have a directory inside it
`./lib/modules`. The contents need to be transferred to your root filesystem.
If you transfer that to the system you're building the board root on you can
extract all of the appropriate files using the following command:

```
tar -xf rootfs.tar.gz -C /usr/arm-xilinx-linux-gnueabi/ ./lib/modules
```

You can verify they are present by confirming a directory that looks along the
lines of `4.9.0-xilinx-v2017.2` exists in
`/usr/arm-xilinx-linux-gnueabi/lib/modules/`.

## SSH Server

If you would additionally like an SSH server running (that supports root
login) there is a bit of a trick. User privilege separation requires a
dedicated user and group named `sshd` for this to work.

The OpenSSH ebuild doesn't create this user and I'm not entirely sure what
does. For now we can solve this issue by creating the user and group manually.

```
arm-xilinx-linux-gnueabi-emerge net-misc/openssh

echo 'sshd:x:22:22:added by portage for openssh:/var/empty:/sbin/nologin' >> /usr/arm-xilinx-linux-gnueabi/etc/passwd
echo 'sshd:*:0:0:::::' >> /usr/arm-xilinx-linux-gnueabi/etc/shadow
echo 'sshd:x:22:' >> /usr/arm-xilinx-linux-gnueabi/etc/group

cat << 'EOF' > /usr/arm-xilinx-linux-gnueabi/etc/ssh/sshd_config
# /etc/ssh/sshd_config

HostKeyAlgorithms ssh-ed25519,ecdsa-sha2-nistp521,ssh-rsa

ClientAliveInterval 10

UseDNS no

AllowTcpForwarding no
UsePAM yes

PasswordAuthentication yes
PermitRootLogin yes
EOF

cd /usr/arm-xilinx-linux-gnueabi/etc/runlevels/default/
ln -s /etc/init.d/sshd sshd
```

## Additional Tools

This is a pretty solid foundation for any root Linux system. Everything at this
point is going to preferential and determined by your project requirements. A
few things you may want to include:

* VIM
* NTPd or Chronyd for time keeping
* A syslog server (I recommend syslog-ng) and in turn logrotate
* Network performance testing tools (such as iperf3)

From the above list I wanted both VIM and iperf3 and thus ran the following:

```
echo 'net-misc/iperf ~arm' > /usr/arm-xilinx-linux-gnueabi/etc/portage/package.keywords/network_utils
echo 'app-editors/vim minimal' > /usr/arm-xilinx-linux-gnueabi/etc/portage/package.use/vim
arm-xilinx-linux-gnueabi-emerge app-editors/vim net-misc/iperf
```

## Rebuilding on the System

Once all the packages you want for your base system are installed, the root may
be in an inconsitent state. It's a good idea to run a sync, global use update,
a preserved rebuild, and dependency clean on the board before continuing:

```
emerge --sync
arm-xilinx-linux-gnueabi-emerge --update --newuse --deep @world
arm-xilinx-linux-gnueabi-emerge @preserved-rebuild
arm-xilinx-linux-gnueabi-emerge --depclean
```

We now need to get the root filesystem on a live board and rebuilding cleaning
up some of the mismatch package flags and irregularities introduced by the
cross compilation process. At a minimum want to fix the incorrectly built
portage package so everything is usable normally.

Before transferring this it's a good idea to preemptively adjust the make
config to no longer be a cross environment, and remove the special case for
portage. This can be done with the following command:

```
cat << 'EOF' > /usr/arm-xilinx-linux-gnueabi/etc/portage/make.conf
ARCH='arm'
CFLAGS='-O2 -pipe'
CXXFLAGS="${CFLAGS}"
CHOST='arm-xilinx-linux-gnueabi'

ACCEPT_KEYWORDS='arm'
FEATURES='sandbox noman noinfo nodoc'
USE="${ARCH} pam"

ELIBC='glibc'

L10N='en'
LINGUAS='en'

PYTHON_TARGETS='python2_7'
EOF

rm -f /usr/arm-xilinx-linux-gnueabi/etc/portage/package.use/portage
```

We now need to package up our root filesystem:

```
tar -cJf ~/xilinx_root_non_native.txz -C /usr/arm-xilinx-linux-gnueabi .
```

This next bit requires the proper settings in PetaLinux and a completed build
(you'll need your own BOOT.BIN, image.ub, and system.dtb files). After
inserting an appropriately size SD card (You're going to want 4 or 8Gb more
likely than not). For me the device showed up as mmcblk0 on my machine. Confirm
yours before following the next steps:

```
dd if=/dev/zero bs=1M count=1 oflag=sync of=/dev/mmcblk0

parted --script -a optimal /dev/mmcblk0 -- mklabel msdos
parted --script -a optimal /dev/mmcblk0 -- mkpart primary fat32 100 600
parted --script -a optimal /dev/mmcblk0 -- mkpart primary ext4 600 -1

dd if=/dev/zero bs=1M count=1 oflag=sync of=/dev/mmcblk0p1
dd if=/dev/zero bs=1M count=1 oflag=sync of=/dev/mmcblk0p2

mkfs.vfat -n BOOT -F 32 /dev/mmcblk0p1
mkfs.ext4 -L rootfs /dev/mmcblk0p2

mkdir -p /mnt/boot
mount /dev/mmcblk0p1 /mnt/boot

mkdir -p /mnt/root
mount /dev/mmcblk0p2 /mnt/root
```

You'll need to copy BOOT.BIN, image.ub, and system.dtb to /mnt/boot and
extract the root filesystem into the root directory (compressed version still
lives at ~/xilinx_root_non_native.txz).

```
tar -xf ~/xilinx_root_non_native.txz -C /mnt/root
```

Ensure the writes complete and cleanly unmount the filesystems:

```
sync
umount /mnt/boot /mnt/root
```

Stick the microSD card into the board and let it boot up. If you're following
this guide you should be able to get to a login screen and be able to login
with root / root.

The device should be on the network and you should be able to SSH to the
device. For my board at the very least I haven't gotten the hardware clock
working correctly so it needs to be set manually upon every boot. Before we can
compile quite a few of the packages the date needs to be roughly correct. You
can reference the build host's time using the following command:

```
date +%s
```

And set it on the board using the following command (replacing VALUE with
the value returned above):

```
date --set="@VALUE"
```

We now need to sync the system's packages and fix portage. This is where we
have to work around the issue of portage being incorrectly installed by
prefixing any use of the portage python module with a '64 bit' path:

```
PYTHONPATH='/usr/lib64/python2.7/site-packages' env-update

cat << 'EOF' > /etc/locale.gen
en_US ISO-8859-1
en_US.UTF-8 UTF-8
EOF
locale-gen

PYTHONPATH='/usr/lib64/python2.7/site-packages' eselect locale set "$(eselect locale list | grep 'en_US.utf8' | awk '{ print $1 }' | grep -oE '[0-9]+')"
PYTHONPATH='/usr/lib64/python2.7/site-packages' env-update

. /etc/profile

PYTHONPATH='/usr/lib64/python2.7/site-packages' emerge --sync
PYTHONPATH='/usr/lib64/python2.7/site-packages' emerge --oneshot sys-apps/portage

# There is a circular dependency that has to be broken during this update
USE="dev-util/pkgconfig internal-glib" emerge dev-util/pkgconfig

# With the circular update broken we can update everything (this will recompile
# pkgconfig again)
emerge --update --newuse --deep @world
```

The last will recompile quite a few packages (though not all). I recommend
shutting the system down, removing the SD card and making a clean backup of the
root by performing the following commands once the drive is back in your
machine (this assumes the same device name as before):

```
mount /dev/mmcblk0p2 /mnt/root
rm -rf /mnt/root/root/.bash_history /mnt/root/etc/ssh/ssh_host* /usr/portage/*
tar -cJf ~/xilinx_root_native.txz -C /mnt/root .
```

You now have a solid base to perform development on and a good backup in case
you mess up. I hope this helps someone else out there.

[1]: http://www.wiki.xilinx.com/PetaLinux
[2]: https://www.yoctoproject.org/
