---
title: Wireless Troubleshouting
---

# Wireless Troubleshooting

## BCM4311

There is a known issue with Fedora 15+ and BCM4311 wireless cards where the
wireless will connect, stay connected for a few minutes, then disconnect until
either the machine is rebooted or wpa_supplicant and NetworkManager are
rebooted. The latter does not always solve the problem. I've personally
observed this issue being more prominent when large file transfers are taking
place.

Before taking these steps you should verify that you do indeed have a Broadcom
BCM4311 wireless card. This can be done with the following command:

```
lspci | grep -i bcm4311
```

You should see something along the following if you have the card:

```
0c:00.0 Network controller: Broadcom Corporation BCM4311 802.11b/g WLAN (rev 01)
```

Ensure you have a wired connection as you will lose access to the wireless card
during this process. You have been warned :). Please also note that the
following commands (with the exception of the reboots) won't do anything unless
you have the RPMFusion repository installed.

As root install the akmod-wl package and reboot like so:

```
yum install akmod-wl -y
reboot
```

Once the system has finished rebooting, perform a system update which will grab
a few additional packages, and reboot once again:

```
yum update -y
reboot
```

If you are unable to see the wireless card then this solution probably hasn't
worked for you. You can bring the card back online by running the following as
root:

```
modprobe b43
```

