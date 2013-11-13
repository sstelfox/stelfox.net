---
title: Suricata
---

Suricata might be a better option and has packages for Fedora 15.

Useful software that can complement an IDS/IPS: [[Linux/OpenFPC|OpenFPC]],
[https://snorby.org/ Snorby]

## Notes

Alright this is frustrating, Fedora 15 doesn't have snort packages so we're
compiling from source. Here's what we need to do:

Download snort & daq source (both available on snort.org)

Extract them

Install the following fedora packages and their dependencies:

```
bison flex make gcc libpcap libpcap-devel libdnet libdnet-devel zlib zlib-devel mysql mysql-devel

cd into the daq directory
./configure && make && make install

Create the file /etc/ld.so.conf.d/snort-i386.conf with the following contents:
/usr/local/lib/daq

cd into the snort source directory

./configure --with-mysql --enable-dynamicplugin && make && make install
mkdir -p /etc/snort/rules
mkdir -p /var/log/snort
cd etc/
cp * /etc/snort/
```

