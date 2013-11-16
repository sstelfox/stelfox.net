---
title: GPSd
---

## Installation

I've been using a BU-353 which if I remember correctly was ~$20 and has been
fairly reliable. It's also got a magnetic base allowing you to attach it to the
roof of a car when war-driving.

```
yum install gpsd gpsd-clients -y
```

If you want to use gpsd on a headless server you'll want to exclude the
`gpsd-clients` as they will install `xgps` and all of X as a dependency.

## Configuration

My GPS device is identified by udev as a serial port, which is fairly common as
NMEA specifies a serial connection with a baud rate of 4800. There is an issue,
however, with a program running in the background called `modem-manager`.

It will actively take control over any serial device that gets plugged in and
send "AT" commands at it to try and determine whether or not the device is a
modem.  It will release control if it fails after 10 seconds but that initial
control breaks GPSd auto-device detection.

To prevent this from happening we need to blacklist the device to
modem-manager. If you use a modem (hah) then you'll want to make sure the
device IDs don't conflict. To get your device ID run the following command:

```
udevadm monitor --env
```

Now plug in your GPS device and you should see something similar to the
following output:

```
**snip**

UDEV  [10963.023977] add      /devices/pci0000:00/0000:00:1d.0/usb2/2-1/2-1.2/2-1.2:1.0/ttyUSB4/tty/ttyUSB4 (tty)
ACTION=add
DEVLINKS=/dev/gps4 /dev/serial/by-id/usb-Prolific_Technology_Inc._USB-Serial_Controller-if00-port0 /dev/serial/by-path/pci-0000:00:1d.0-usb-0:1.2:1.0-port0
DEVNAME=/dev/ttyUSB4
DEVPATH=/devices/pci0000:00/0000:00:1d.0/usb2/2-1/2-1.2/2-1.2:1.0/ttyUSB4/tty/ttyUSB4
ID_BUS=usb
ID_MM_CANDIDATE=1
ID_MODEL=USB-Serial_Controller
ID_MODEL_ENC=USB-Serial\x20Controller
ID_MODEL_FROM_DATABASE=PL2303 Serial Port
ID_MODEL_ID=2303
ID_PATH=pci-0000:00:1d.0-usb-0:1.2:1.0
ID_PATH_TAG=pci-0000_00_1d_0-usb-0_1_2_1_0
ID_REVISION=0300ID_SERIAL=Prolific_Technology_Inc._USB-Serial_Controller
ID_TYPE=generic
ID_USB_DRIVER=pl2303
ID_USB_INTERFACES=:ff0000:
ID_USB_INTERFACE_NUM=00
ID_VENDOR=Prolific_Technology_Inc.
ID_VENDOR_ENC=Prolific\x20Technology\x20Inc.
ID_VENDOR_FROM_DATABASE=Prolific Technology, Inc.
ID_VENDOR_ID=067b
MAJOR=188
MINOR=4
SEQNUM=2470
SUBSYSTEM=tty
TAGS=:systemd:
USEC_INITIALIZED=10963017963

**snip**
```

You'll probably see this a couple time as udev announces all kinds of
crazyness. The important fields to look for are `ID_VENDOR_ID` and
`ID_MODEL_ID`, these will become your `idVendor` and `idProduct` the udev rules
to come. The values for mine are `067b` and `2303` respectively.

Create the file `/etc/udev/rules.d/77-user-mm-usb-device-blacklist.rules` with
the following contents, you'll want to replace the values of `idVendor` and
`idProduct` if yours differ from mine:

```
ACTION!="add|change", GOTO="user_mm_usb_device_blacklist_end"
SUBSYSTEM!="usb", GOTO="user_mm_usb_device_blacklist_end"
ENV{DEVTYPE}!="usb_device", GOTO="user_mm_usb_device_blacklist_end"

ATTRS{idVendor}=="067b", ATTRS{idProduct}=="2303", ENV{ID_MM_DEVICE_IGNORE}="1"

LABEL="user_mm_usb_device_blacklist_end"
```

The changes should be picked up immediately so no need to restart or anything
silly like that.

Now you'll want to start up gpsd and ensure it starts up on boot as well:

```
systemctl enable gpsd.service
systemctl start gpsd.service
```

Thats the end of the configuration, whenever you plug in one or more GPS
devices hotplug will take care of notifying gpsd of the devices, and will
remove it when it's been removed. You can view information on your position as
well as a fix of your location with `xgps` which is installed with the
`gpsd-clients`.

## Using as a Time Source

TODO

## Extending Accuracy with NTRIP / RTCM data

TODO

* http://en.wikipedia.org/wiki/Networked_Transport_of_RTCM_via_Internet_Protocol
* http://www.rtcm-ntrip.org/home
* http://igs.bkg.bund.de/ntrip/caster
* http://www.linuxcertif.com/man/5/rtcm-104/173922/
* http://software.rtcm-ntrip.org/ (BNC is the relevant one)

## Profiling Accuracy of GPS Receivers

Included with the gpsd-clients is a utility called `gpsprof` which can take
samples from a GPS receiver and test the margin of error in x,y,z spaces. By
default it collects 100 samples.

Since NMEA specifies producing 1/sample/sec this will by default take 100
seconds or 1 minute 40 seconds to complete. It outputs the information in
gnuplot format so we'll need that to view the data:

```
yum install gnuplot -y
```

During the test you'll want to ensure that the GPS receiver is in a fixed
location. Personally I trust data more with a larger sample size so I opted to
test my receiver over a period of two hours. Like so:

```
gpsprof -n 7200 | tee two-hour-gps-prof.gnuplot | gnuplot -persist
```

This also saves the data into a file so you can regenerate the graph without
running the test for two hours again.

What I found while running the test indoors is that my GPS receiver isn't that
accurate (big surprise for $20).

Over the course of two hours of testing is that 50% of the fixes were with 9.24
meters of the average, 95% were within 27.32 meters of the average, and 99% of
the fixes were within 37.5 meters (this is only for latitude and longitude).

The latitude varied by as much as 60 meters and the logitude by as much as 40
meters. The altitude varied by as much as 80 meters though I don't have a
statistical breakdown for that. Of the 7200 data point there was also 45 where
the receiver was unable to calculate altitude. The average location (at least
for lat/long) was incredibly accurate as verified by Google Maps so at least
that's something.

A second test run over the course of an hour with a clear view of the sky
through the two separate windows provided an accuracy with 50% of fixes within
6.23 meters of average, 95% of fixes within 25.01 meters, and 99% wihin 31.94
meters.

The latitude varied by as much as 40 meters and the longitude by as much as 25
meters. The altitude varied by as much as 40 meters. All fixes had altitude
fixes as well.

I suspect some if not quite a bit of the error was because I was indoors and
nowhere near a window (my office is in the heart of a building unfortunately).

## Misc References

* http://catb.org/gpsd/hacking.html

