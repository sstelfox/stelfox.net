---
created_at: 2019-03-24T23:26:30-0400
tags:
  - cisco
  - tips
title: Reflashing Cisco Catalyst With XMODEM
---

One of the Cisco Catalyst 3750 I had to work on recently had it's flash
completely wiped. When this happens you can only flash the filesystem using the
XMODEM serial console. This is a fairly well documented process on Windows. On
Linux most of the documented ways involve switching between multiple utilities
and can be tricky. I wanted to documented how I did this and possibly help
other in the same situation.

I'm doing this on Fedora, but the only thing specific to Fedora is installing
the packages which can be done with the following command (and are pretty
standard names):

```console
dnf install lrzsz screen -y
```

From an external perspective the switch was rapidly blinking it's `SYST` light
with all of the other lights off. I connected up a console cable, the serial
port showed up as `/dev/ttyUSB0`. We'll connect to the serial port using screen
with the following command:

```console
sudo screen /dev/ttyUSB0 9600
```

Power cycling the switch gets you the boot messages that show us the issue:

```console
Using driver version 1 for media type 1
Base ethernet MAC Address: xx:xx:xx:xx:xx:xx
Xmodem file system is available.
The password-recovery mechanism is enabled.
Initializing Flash...
mifs[2]: 0 files, 1 directories
mifs[2]: Total bytes     :    3870720
mifs[2]: Bytes used      :       1024
mifs[2]: Bytes available :    3869696
mifs[2]: mifs fsck took 0 seconds.
mifs[3]: 0 files, 1 directories
mifs[3]: Total bytes     :   27998208
mifs[3]: Bytes used      :       1024
mifs[3]: Bytes available :   27997184
mifs[3]: mifs fsck took 1 seconds.
...done Initializing Flash.
done.
Loading "flash:/c3750-ipservicesk9-mz-15.0-2_SE10a.bin"...flash:/c3750-ipservicesk9-mz-15.0-2_SE10a.bin: no such file or directory

Error loading "flash:/c3750-ipservicesk9-mz-15.0-2_SE10a.bin"

Interrupt within 5 seconds to abort boot process.
Boot process failed...

The system is unable to boot automatically.  The BOOT
environment variable needs to be set to a bootable
image.


switch:
```

We can confirm this isn't just a badly named file quickly:

```console
switch: dir flash:/
Directory of flash://


32513024 bytes available (1024 bytes used)

switch:
```

If you you get the following error:

```console
switch: dir flash:
unable to stat flash:/: invalid argument
```

The flash hardware hasn't been enabled yet. We need to initialize it with the
`flash_init` command which will allow us access to the flash again:

```console
switch: flash_init
Initializing Flash...
flashfs[0]: 0 files, 1 directories
flashfs[0]: 0 orphaned files, 0 orphaned directories
flashfs[0]: Total bytes: 32514048
flashfs[0]: Bytes used: 1024
flashfs[0]: Bytes available: 32513024
flashfs[0]: flashfs fsck took 6 seconds.
...done Initializing Flash.

switch: dir flash:/
Directory of flash://


32513024 bytes available (1024 bytes used)

switch:
```

Definitely nothing present. At this point we need to use XMODEM to get the
firmware file. You'll need to use your support contract to get the latest
firmware for your model of switch. I made sure this file was in my current
directory (saves some time in a bit). For me this file was named
`c3750-ipservicesk9-mz.150-2.SE10a.bin` you'll want to replace this with the
appropriate filename you pull yourself. Right, carrying on.

XMODEM is a very slow process especially when we use the default speed of 9600
baud. We can speed this process up by 12x by adjusting the baud rate. You can
skip this bit though if you're willing to wait several hours for the file to
transfer.

To speed up the baud rate execute the following command, be aware that your
terminal is expected to immediately become responsive and this is fine:

```console
switch: set BAUD 115200
```

Kill the screen session by pressing `Ctrl-a` quickly following by a lone `k`.
It will prompt you to confirm exiting the session, do so with `y` and start a
new session with the higher baud rate:

```console
$ sudo screen /dev/ttyUSB0 115200
```

Press return and you'll get back to the switch prompt. This next bit is tricky
as there is about a ten second timeout between starting the copy command and
needing to being the transfer. If you don't quite make it I've got a tip after
the command below:

```console
switch: copy xmodem:/ flash:/c3750-ipservicesk9-mz.150-2.SE10a.bin
```

Quick press `Ctrl-a` followed by `:`. In the prompt that shows up type in the
following:

```console
exec !! sx -b -X c3750-ipservicesk9-mz.150-2.SE10a.bin
```

If you get an error, it reports as cancelled, it times out just try again. This
time though after pressing `Ctrl-a` and `:` you can press your up arrow to
bring up the last run command. Assuming you typed it in correctly this should
give you enough time to start the transfer. It will show you the progress of
the transfer which depending on size will take between twenty and thirty
minutes (or hours if you didn't update the baud rate).

Site note: One of the benefits of performing the `sx` command through screen is
that if anything happens to your terminal the transfer will continue. This was
particularly important for me at the time as I found myself SSH'd into a laptop
far away from myself over an unstable and shared cell connection running these
commands.

When it's complete you're going to want to ensure the `BOOT` variable properly
matches the filename you just transferred:

```console
set BOOT flash:/c3750-ipservicesk9-mz.150-2.SE10a.bin
```

We're going to reset the baud rate back to normal (skip this if you didn't
update your baud rate) which will cause you to loose the connection again:

```console
unset BAUD
```

Disconnect as we did before and reconnect at the 9600 rate. One final command
should start the switch and get you back into the good graces of the Cisco CLI:

```console
switch: boot
```

One final tip, if you want to access the boot menu of the switch I had a hell
of a time trying to figure out how to actually send the break command to
interrupt the boot menu. None of the recommended combinations of `Ctrl`, `Alt`,
`Shift`, `b`, `Break`, and `Scroll Lock`. You can instead press the `Mode`
button on the front of the switch to emulate this break key.

Cheers friends. Hope this helps another CLI adventurer.
