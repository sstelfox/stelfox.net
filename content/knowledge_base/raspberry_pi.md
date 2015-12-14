---
title: Raspberry Pi
tags:
- embedded
- linux
---

Downloaded the ArchLinux version [from here][1]

used the following command to get the image on:

```
dd if=archlinux-hf-2013-07-22.img | pv | sudo dd of=/dev/mmcblk0 bs=4M
```

used the following to update the partitions on the device, and mount the
rootfs:

```
partprobe /dev/mmcblk0
mount /dev/mmcbl0p5 /mnt
```

I edited `/etc/iptables/simple_firewall.rules` and added the following after
the ctstate line:

```
-A INPUT -m tcp -p tcp --dport 22 -j ACCEPT
```

(Turns out the above wasnt needed as it defaults to wide-open).

Grabbed a password hash out of my shadow file and replaced the one that was in
it (didnt bother too look up what the defaults were).

Ran sync on the card, removed it installed it in the RPi, connected its
ethernet jack and power. Scanned for port 22 and found it.

```
ssh root@<rpi>

pacman -Syu
hostnamectl set-hostname io.0x378.net
```

Created network config file `/etc/conf.d/network@eth0` with the following
contents:

```ini
address=192.168.0.15
netmask=24
broadcast=192.168.0.255
gateway=192.168.0.1
```

And a systemd file at `/etc/systemd/system/network@.service` with the following
config:

```ini
[Unit]
Description=Network connectivity (%i)
Wants=network.target
Before=network.target
BindsTo=sys-subsystem-net-devices-%i.device
After=sys-subsystem-net-devices-%i.device

[Service]
Type=oneshot
RemainAfterExit=yes
EnvironmentFile=/etc/conf.d/network@%i

ExecStart=/usr/bin/ip link set dev %i up
ExecStart=/usr/bin/ip addr add ${address}/${netmask} broadcast ${broadcast} dev %i
ExecStart=/usr/bin/ip route add default via ${gateway}

ExecStop=/usr/bin/ip addr flush dev %i
ExecStop=/usr/bin/ip link set dev %i down

[Install]
WantedBy=multi-user.target
```

```
systemctl enable network@eth0.service
systemctl start network@eth0.service
systemctl disable dhcpcd@eth0.service
```

At this point I switched to the arch linux notes.

[1]: http://www.raspberrypi.org/downloads
