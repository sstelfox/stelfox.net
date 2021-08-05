---
title: Random Security Notes
weight: 47

taxonomies:
  tags:
  - embedded
  - linux
  - serial
---

## Serial Terminal Resizing

Serial lines don't have a way to transfer terminal resizes. If I want a large
working area I can resize it manually. Before starting the terminal you can
find the size of the terminal with the following command:

```
echo "stty cols ${COLUMNS} rows ${LINES}"
```

Start up the serial window (do not resize it after running the above command),
login if necessary, and once you have an active terminal window execute the
command that was printed out above to resize it.

## Gentoo Installation Over Serial

The Gentoo installation media isn't setup for serial and tends to be in a
pretty bad state. I've started using the ArchLinux install media to perform my
base install which actually works and already has all the pre-requisite
software and configurations present.

The arch linux CD is configured to talk over the serial port, but the rest of
the system isn't. It runs at 38400 8n1.

After connecting to the serial port (should be able to do it directly using
virt-install or virsh). Press tab at the bootloader on the default boot line
and append the following information to continue the install over serial:

```
console=ttyS0,38400n1
```

Press enter to boot the system, you should get a root shell to continue the
install.
