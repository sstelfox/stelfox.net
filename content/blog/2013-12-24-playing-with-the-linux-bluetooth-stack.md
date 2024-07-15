---
created_at: 2013-12-24T14:53:27-0500
evergreen: true
public: true
tags:
  - exploration
  - linux
title: Playing With the Linux Bluetooth Stack
slug: playing-with-the-linux-bluetooth-stack
---

# Playing With the Linux Bluetooth Stack

List all available Bluetooth interfaces:

```console
$ hciconfig -a
```

If you get an error like the following:

```text
Operation not possible due to RF-kill
```

You'll need to unblock access to the resource using "rfkill". You can unblock all blocked devices like so:

```console
$ rfkill unblock all
```

Before doing any iBeacon stuff you should disable scanning:

```console
$ hciconfig hci0 noscan
```

```console
$ hcitool -i hci0 cmd 0x08 0x0008 1E 02 01 1A 1A FF 4C 00 02 15 [ 92 77 83 0A B2 EB 49 0F A1 DD 7F E3 8C 49 2E DE ] [ 00 00 ] [ 00 00 ] C5 00
$ hcitool -i hci0 leadv
```

```text
LE set advertise enable on hci1 returned status 12
```
