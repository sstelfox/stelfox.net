---
title: NSLU2
tags:
- embedded
- hardware
- linux
- nas
---

Neat little NAS for USB 2.0 hard drives. Very convenient for backups.

## Hardware Information

Please note that your hardware may differ if you have a different version.

| Component       | Details                      |
| ---------------:| ---------------------------- |
| CPU             | Intel IXP420, 133 or 266 MHz |
| RAM             | 32Mb                         |
| Flash ROM       | 8Mb                          |
| Ethernet        | 10/100 (integrated SoC)      |
| USB             | 2x USB 2.0, NEC USB          |
| Real Time Clock | Xicor X1205 RTC              |
| Bootloader      | RedBoot                      |

## OpenWRT Installation

[Download the firmware][1]

Install the upslug2 utility (available in the Fedora package repositories).

Plug the NSLU2 into the same subnet of the computer you will be flashing from.
Ensure power and ethernet are connected. While powered off hold down the reset
button on the back and press the power button. Continue holding down the power
button until the status light turns from amber to red. The LED should flash
between red and green, it is now in upgrade mode.

By default upslug2 will use eth0 as the network device to look for the NSLU2,
in my case I needed to switch that interface to use em1. Run the following
command to identify the slug device on your network:

```
sudo upslug2 --device em1
```

Copy the MAC address of the NSLU2 device that you will be upgrading. Navigate
to the directory where the kernel and firmware were downloaded and run the
following command replacing the argument to target with the MAC address
received above:

```
sudo upslug2 --device em1 --target xx:xx:xx:xx:xx:xx \
  --image openwrt-nslu2-squashfs.bin
```

After rebooting I did not have the status light come on and the device had the
static address of 192.168.1.1. If that happens to be your router address (it
wasn't for me) you should be able to talk to it directly by setting a static
arp entry like so (replacing the xx:xx... with the MAC address you retrieved
above):

```
arp -s 192.168.1.1 xx:xx:xx:xx:xx:xx
```

## Initial Configuration

Telnet into the device and set a password like so: *Remember:* This password is
being sent in clear text so ensure that you are on a fully trusted (and
preferably switched) network segment before setting it or change it to
something else over SSH after you set the initial password.

```
[user@example-host ~]$ telnet 192.168.1.1
Trying 192.168.1.1...
Connected to 192.168.1.1.
Escape character is '^]'.

* SNIP MOTD *

root@OpenWrt:/# passwd
Changing password for root
New password: 
Retype password: 
Password for root changed by root
root@OpenWrt:/# exit
Connection closed by foreign host.
```

It's best practice to change the password over the newly established encryption
communication channel.

```
[user@example-host ~]$ ssh root@192.168.1.1
The authenticity of host '192.168.1.1 (192.168.1.1)' can't be established.
RSA key fingerprint is d7:fd:3f:92:e1:3a:6d:67:4f:64:92:c6:89:4c:7f:4f.
Are you sure you want to continue connecting (yes/no)? yes
Warning: Permanently added '192.168.1.1' (RSA) to the list of known hosts.
root@192.168.1.1's password: 

* SNIP MOTD *

root@OpenWrt:~# passwd
Changing password for root
New password: 
Retype password: 
Password for root changed by root
root@OpenWrt:~#
```

The first thin I always do is get rid of the damn banner:

```
rm /etc/banner
touch /etc/banner
```

Setup a minimal and more secure initial configuration:

```
/etc/init.d/dnsmasq stop
/etc/init.d/dnsmasq disable
rm /etc/config/dhcp
```

### /etc/config/dropbear

```
config 'dropbear'
  option 'PasswordAuth'   'on'
  option 'RootPasswordAuth' 'on'
  option 'Port'     '22'
```

### /etc/config/firewall

```
config 'defaults'
  option 'syn_flood'  '1'
  option 'input'    'DROP'
  option 'output'   'ACCEPT'
  option 'forward'  'DROP'

config 'zone'
  option 'name'   'lan'
  option 'network'  'lan'
  option 'conntrack'      '1'
  option 'input'    'DROP'
  option 'output'   'ACCEPT'
  option 'forward'  'DROP'

# Allow IPv4 ping
config 'rule'
  option 'name'   'Allow-Ping'
  option 'src'    'lan'
  option 'proto'    'icmp'
  option 'icmp_type'  'echo-request'
  option 'family'   'ipv4'
  option 'target'   'ACCEPT'

# Allow DHCPv6 replies
config 'rule'
  option 'name'   'Allow-DHCPv6'
  option 'src'    'lan'
  option 'proto'    'udp'
  option 'src_ip'   'fe80::/10'
  option 'src_port' '547'
  option 'dest_ip'  'fe80::/10'
  option 'dest_port'  '546'
  option 'family'   'ipv6'
  option 'target'   'ACCEPT'

# Allow essential incoming IPv6 ICMP traffic
config 'rule'
  option 'name'   'Allow-ICMPv6-Input'
  option 'src'    'lan'
  option 'proto'    'icmp'
  list 'icmp_type'  'echo-request'
  list 'icmp_type'  'echo-reply'
  list 'icmp_type'  'destination-unreachable'
  list 'icmp_type'  'packet-too-big'
  list 'icmp_type'  'time-exceeded'
  list 'icmp_type'  'bad-header'
  list 'icmp_type'  'unknown-header-type'
  list 'icmp_type'  'router-solicitation'
  list 'icmp_type'  'neighbour-solicitation'
  list 'icmp_type'  'router-advertisement'
  list 'icmp_type'  'neighbour-advertisement'
  option 'limit'    '1000/sec'
  option 'family'   'ipv6'
  option 'target'   'ACCEPT'

config 'rule'
  option 'name'   'Allow local SSH'
  option 'src'    'lan'
  option 'proto'    'tcp'
  option 'dest_port'  '22'
  option 'target'   'ACCEPT'
```

### /etc/config/network

```
config 'interface' 'loopback'
  option 'ifname'   'lo'
  option 'proto'    'static'
  option 'ipaddr'   '127.0.0.1'
  option 'netmask'  '255.0.0.0'

config 'interface' 'lan'
  option 'ifname'   'eth0'
  option 'type'   'bridge'
  option 'proto'    'static'
  option 'ipaddr'   '192.168.150.80'
  option 'netmask'  '255.255.255.0'
  option 'dns'    '192.168.150.1'
  option 'gateway'  '192.168.150.1'
```

### /etc/config/system

```
config 'system'
  option 'hostname' 'nas'
  option 'timezone' 'EST5EDT,M3.2.0,M11.1.0'

config 'timeserver' 'ntp'
  list 'server'   '0.pool.ntp.org'
  list 'server'   '1.pool.ntp.org'
  list 'server'   '2.pool.ntp.org'
  list 'server'   '3.pool.ntp.org'
  option 'enable_server'  '1'
```

Commit the configuration and reboot:

```
uci commit
reboot
```

## LEDs

The available LED names in the NSLU2 go by the sys names of
`nslu2:green:disk-1`, `nslu2:green:disk-2`, `nslu2:green:ready`,
`nslu2:red:status`. The ready and status light are the same. The first light,
when they're both on it will appear green just slightly brighter than with just
the ready on. If you want it to show up as red, you have to turn off the ready
light.

You can manually change the lights on and off by echoing a 0 and 1 into the
system file located at `/sys/class/leds/{LED NAME}/brightness`.

To check the available triggers on each LED cat the trigger file located in the
same directory as the LED name. I added the following to the end of
`/etc/config/system`:

```
config 'led'
  option 'name'           'Ready'
  option 'sysfs'          'nslu2:green:ready'
  option 'default'        '1'
  option 'trigger'        'default-on'
```

Additional configuration information can be found on the [OpenWRT UCI/System
page under LEDs][2].

## USB Disk Setup

Now that we have networking and some basic security on the device lets get this
usable as a NAS again. First we need to setup USB storage like the following:

```
opkg update
opkg install kmod-usb-core kmod-usb-ohci kmod-usb-uhci kmod-usb2 \
  kmod-ledtrig-usbdev usbutils kmod-usb-storage cfdisk kmod-fs-ext4 e2fsprogs \
  block-mount
```

Ensure your USB drive is plugged in. Mine showed up as `/dev/sda` and that will
be used for the remainder of this page. Now we'll need to configure the
partitions. We now have cfdisk to do that. I had an issue where my SSH
connection was passing `xterm-256color` as the `TERM` variable which as causing
issues with starting cfdisk. The first command alleviates this issue:

```
export TERM="xterm"
cfdisk
```

Use the interface to create a 512Mb swap partition (type 82), and the rest as
an ext4 partition (type 83). Make sure not to mark either partition as bootable
as it has weird effects on the NSLU2...

For me `/dev/sda1` is the swap and `/dev/sda2` is the ext4 data partition. Both
partitions need to be formatted like so:

```
mkswap /dev/sda1
mkfs.ext4 /dev/sda2
```

I'm going to be mounting the storage partition at `/mnt/storage` so that
directory needs to exist...

```
mkdir /mnt/storage
```

You'll need to get the UUID of both of the partition which is easily enough
like the following, and note the UUIDs the get outputted:

```
blkid /dev/sda1
blkid /dev/sda2
```

Filesystem configuration is handled by the UCI file `/etc/config/fstab`
extensive details can be found on the [OpenWRT wiki][3].

```
config 'global' 'automount'
  option 'from_fstab'     '1'
  option 'anon_mount'     '0'

config 'global' 'autoswap'
  option 'from_fstab'     '1'
  option 'anon_swap'      '0'

config 'mount'
  option 'uuid'           '<uuid of ext4 partition>'
  option 'target'         '/mnt/storage'
  option 'fstype'         'ext4'
  option 'options'        'nodev,noexec,nosuid,noatime,rw,sync'
  option 'enabled_fsck'   '1'

config 'swap'
  option 'uuid'   '<uuid of swap partition>'
```

Get the storage all happy and setup with the following command:

```
/etc/init.d/fstab restart
```

## Additional Package Space

The NSLU2 doesn't have a whole lot of space on the device and adding a lot of
packages is a good way to fill that up and cause instabilities. Adding a small
virtual partition to install additional packages into can easily alleviate this
issue.

This will use a quick loop back file living on the external drive we've already
setup. I've chosen 512Mb, it's an insignificant amount compared to the size of
my hard drive and should be way overkill for any packages I'd need to install.
The OpenWRT wiki suggests 128Mb but why not add more wiggle room when it
essentially costs me nothing?

We'll need the loopback package:

```
opkg update
opkg install kmod-loop
```

And we'll need to create a file large enough for the virtual partition:

```
root@nas:~# dd if=/dev/zero of=/mnt/storage/package_partition.disk bs=1M count=512
root@nas:~# mkfs.ext4 /mnt/storage/package_partition.disk

/mnt/storage/package_partition.disk is not a block special device.
Proceed anyway? (y,n) y
Filesystem label=
OS type: Linux
Block size=4096 (log=2)
Fragment size=4096 (log=2)
Stride=0 blocks, Stripe width=0 blocks
32768 inodes, 131072 blocks
6553 blocks (5.00%) reserved for the super user
First data block=0
Maximum filesystem blocks=134217728
4 block groups
32768 blocks per group, 32768 fragments per group
8192 inodes per group
Superblock backups stored on blocks:
         32768, 98304

Allocating group tables: done
Writing inode tables: done
Creating journal (4096 blocks): done
Writing superblocks and filesystem accounting information: done
```

Create the package directory and mount the partition:

```
mkdir /mnt/packages
mount -o loop /mnt/storage/package_partition.disk /mnt/packages
```

We need to make sure that the package partition exists after boot up so the
mount line needs to be added to `/etc/rc.local` before the "exit 0" line.

Append the following line to `/etc/opkg.conf`:

```
dest usb /mnt/packages
```

To install a package to that location you'll want to add "-dest usb" to the
opkg install command like so:

```
opkg -dest usb install package-name
```

## OpenSSH Server

We'll need to put Dropbear on a different port to get OpenSSH on it. So first
things first we need to add a firewall rule allowing access to the new port.
I've chosen port 2222 as the other port so I've added this rule to
`/etc/config/firewall`:

```
config 'rule'
  option 'name'           'Dropbear SSH'
  option 'src'            'lan'
  option 'proto'          'tcp'
  option 'dest_port'      '2222'
  option 'target'         'ACCEPT'
```

And the firewall needs to be restarted like so:

```
/etc/init.d/firewall restart
```

Alright down to business. Change the dropbear config file at
`/etc/config/dropbear` to:

```
config 'dropbear'
  option 'PasswordAuth'   'on'
  option 'RootPasswordAuth' 'on'
  option 'Port'     '2222'
```

Restart dropbear:

```
/etc/init.d/dropbear restart
```

and log back into the NAS on it's new port.

Install OpenSSH Server:

```
opkg update
opkg install openssh-server
```

If you want the full SFTP server beyond the built-in one (which I'm personally
perfectly happy with) as well you'll want to also install the
openssh-sftp-server package as well.

Finally enable the server and set it to start at boot:

```
/etc/init.d/sshd enable
/etc/init.d/sshd start
```

You'll want to config the SSH server with the standard config file located at
[/etc/ssh/sshd_config][4].

Finally remove the firewall rule we added earlier and then disable and stop the
dropbear service. You mind as well remove the config file as well like so:

```
/etc/init.d/dropbear disable
/etc/init.d/dropbear stop
```

I like rebooting after a major service change just to be on the safe side.

## Authentication

Since this system is intended for backups, I created a backup user by manually
editing `/etc/passwd`, `/etc/groups`, and setting a password for the user.

Append the following to `/etc/passwd`:

```
backup-user:x:500:500:backup-user:/mnt/storage/backups:/bin/false
```

Append the following to /etc/group

```
backup-user:x:500:
```

Append the following to /etc/shadow

```
backup-user:*:0:0:99999:7:::
```

Set a ridiculous password for the user:

```
passwd backup-user
```

And then create the backups home directory:

```
mkdir /mnt/storage/backups
chmod 0750 /mnt/storage/backups
mkdir /mnt/storage/backups/backups
mkdir /mnt/storage/backups/.ssh
touch /mnt/storage/backups/.ssh/authorized_keys
chown backup-user:backup-user /mnt/storage/backups/backups
chown -R root:backup-user /mnt/storage/backups/.ssh
chmod 0750 /mnt/storage/backups/.ssh
chmod 0640 /mnt/storage/backups/.ssh/authorized_keys
```

So I need to explain a bit about that set of commands. Because I chroot the
backups user to the backups directory the backups directory needs to be owned
by root and have permissions set to `0750`.

This requirement is imposed by the SSH daemon if you want to login and
necessitates the additional backups directory if I want to allow the
backup-user write access to anything and thus giving the backup user ownership
over the backups directory.

I do not want the backup user to be able to arbitrarily edit or replace it's
authorized keys files. I'll leave that to be a root administration task and
thus the ownership and permissions on the `.ssh` directory and contents.

With that setup here is the tail end of my `/etc/ssh/sshd_config` file which
handles the chroot and command enforcement as well as the SFTP definition (I
use the internal SFTP server rather than the external one for convienience):

```
Subsystem sftp internal-sftp

Match User backup-user
  ChrootDirectory %h
  PasswordAuthentication no
  ForceCommand internal-sftp
```

You now have a user that is highly isolated and able to write to single
directory on the NAS. It still needs at least one authorized key added to
`/mnt/storage/backups/.ssh/authorized_keys` before any backups can take place
but that will get covered with some additional notes in the next section...

## Backing Up to the NSLU2

I've gone through the trouble on each machine that I'm going to be backing up
to creating an OpenSSH key without a password that will only be used for
backing up to the NSLU2. You could potentially use one pair for this but it
makes it harder to revoke a single system's authentication.

You really need to protect the private keys well as they don't just have
permission to create backups, they also have the permission to delete backups
which I'm sure any malicious attacker would happily do for you.

Ideally I'd be able to set the +a attribute (append only) on the
`/mnt/storage/backups/backups` directory only allowing the backup-user to
create and append to existing files without the ability to delete them,
however, OpenWRT's `e2fsprogs` doesn't compile with chattr and short of
plugging in the external drive on another machine and setting the attribute, we
can't set that (though that is a possible solution and one I've chosen to
employ).

You can create an SSH key for the backups using the following commands on a
linux system:

```
ssh-keygen -b 4096 -f ~/.ssh/backups_key
```

Copy the key out of `~/.ssh/backups_key.pub` and as the root user on the NSLU2
paste the key at the end of `/mnt/storage/backups/.ssh/authorized_keys`. I add
the following command prefix to key, ensuring that is all the key will every be
able to do like so:

```
command="internal-sftp" ssh-rsa AAAA... user@host.net
```

While the command is already restricted to only that at the server level, it
can't hurt to have the same restriction here and prevents any messiness if the
server config is modified in the future.

At this point you can safely append any files you'd like from any backup
software you'd like that makes use of SFTP as the transfer mechanism. I'm
personally preferential to [duplicity][5], which is a clean command line
utility that encrypts and signs all your backups locally before sending them
along to the remote server and supports incremental backups as well.

## Sysupgrade / MTD

Luckily for us we can download the new factory image to the storage partition
so we don't use up the RAM.

```
cd /mnt/storage
wget http://downloads.openwrt.org/snapshots/trunk/ixp4xx/openwrt-nslu2-squashfs.bin
wget http://downloads.openwrt.org/snapshots/trunk/ixp4xx/md5sums
md5sum -c md5sums
```

The output should have one success (the failures are the packages you didn't
download). In my case it says "24 or 25 computed checksums did NOT match".

sysupgrade unfortunately doesn't support the NSLU2, and using mtd requires the
use of the "firmware" named mtd partition. You can see the available mtd
partitions by catting `/proc/mtd` like so:

```
root@nas:/mnt/storage# cat /proc/mtd
 dev:    size   erasesize  name
mtd0: 00040000 00020000 "RedBoot"
mtd1: 00020000 00020000 "SysConf"
mtd2: 00020000 00020000 "Loader"
mtd3: 00120000 00020000 "Kernel"
mtd4: 00640000 00020000 "rootfs"
mtd5: 00500000 00020000 "rootfs_data"
mtd6: 00020000 00020000 "FIS directory"
```

This unfortunately means that I don't know how to upgrade to a new firmware on
the device... Since RedBoot is still there however I should still be able to
use the `upslug2` utility to update the whole device, though this will be at
the expense of all configuration on the device.

## Upslug2 && RedBoot

You'll need to install upslug2 if you don't have it already, and download the
most recent snapshot for the NSLU2 [here][6]. Open up a console and change to
the directory you downloaded the firmware.

For me the interface I want to use is `em1` so that is what I've used in the
following commands. You'll need to get the MAC address of the device that you
want to upgrade with the first command like so:

```
[user@host ~]$ sudo upslug2 --device em1
NSLU2     xx:xx:xx:xx:xx:xx Product ID: 1 Protocol ID: 0 Firmware Version: R23V63 [0x2363]
[user@host ~]$ sudo upslug2 --device em1 --target xx:xx:xx:xx:xx:xx --image openwrt-nslu2-squashfs.bin

* Snip *
```

## IXP420 GPIO Pins

|          |          |                                        |                                           |                |
| -------- | -------- | -------------------------------------- | ----------------------------------------- | -------------- |
| GPIO     | IXP Ball | Function                               | Connected to:                             | Configured as: |
| GPIO0    | Y22      | Red Status LED (1 = On)                | Status LED                                | Output         |
| GPIO1    | W21      | Green Ready LED (1 = On)               | Ready LED                                 | Output         |
| GPIO2    | AC26     | Disk 2 LED (0 = On)                    | Disk 2 LED                                | Output         |
| GPIO3    | AA24     | Disk 1 LED (0 = On)                    | Disk 1 LED                                | Output         |
| GPIO4    | AB26     | Buzzer                                 | Buzzer                                    | Output         |
| GPIO5    | Y25      | Power Button (Pulse when state change) | Power Button via flipflop                 | Input          |
| GPIO6    | V21      | I²C SCL                                | X1205 RTC - SCL - Pin 6                   | Output         |
| GPIO7    | AA26     | I²C SDA                                | X1205 RTC - SDA - Pin 5                   | Tristate       |
| GPIO8    | W23      | Power Off (1 = Turn Off)               | R10                                       | Output         |
| GPIO9    | V22      | PCI INTC                               | uPD720101 USB (EHCI) - INTC0 - Pin 43     | Input          |
| GPIO10   | Y26      | PCI INTB                               | uPD720101 USB (OHCI #2) - INTB0 - Pin 88  | Input          |
| GPIO11   | W25      | PCI INTA                               | uPD720101 USB (OHCI #1) - INTA0 - Pin 125 | Input          |
| GPIO12   | W26      | Reset Button (0 = Pressed)             | Reset Button                              | Input          |
| GPIO13   | V24      | PCI Reset                              | uPD720101 USB - VBBRST0 - Pin 87          | Output         |
| GPIO14   | U22      | PCI Clock (33MHz)                      | uPD720101 USB - PCLK - Pin 42             | Output         |
| GPIO15   | U25      | Expansion Bus Clock (33MHz)            | IXP420 - EX_CLK - Ball M32                | Output         |

[1]: http://downloads.openwrt.org/snapshots/trunk/ixp4xx/openwrt-nslu2-squashfs.bin
[2]: http://wiki.openwrt.org/doc/uci/system#leds
[3]: http://wiki.openwrt.org/doc/uci/fstab
[4]: {{< relref "sshd.md" >}}
[5]: {{< relref "duplicity.md" >}}
[6]: http://downloads.openwrt.org/snapshots/trunk/ixp4xx/openwrt-nslu2-squashfs.bin
