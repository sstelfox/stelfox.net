---
created_at: 2013-01-01T00:00:01-0000
title: Snort
---

***Note: This page is quite old and is likely out of date. My opinions may have
also changed dramatically since this was written. It is here as a reference
until I get around to updating it.***

Suricata might be a better option and has packages for Fedora 15.

Useful software that can complement an IDS/IPS: OpenFPC, Snorby

## Notes

Alright this is frustrating, Fedora 15 doesn't have snort packages so we're
compiling from source. Here's what we need to do:

Download snort & daq source (both available on snort.org)

Extract them

Install the following fedora packages and their dependencies:

```
yum bison flex make gcc libpcap libpcap-devel libdnet libdnet-devel zlib \
  zlib-devel mysql mysql-devel -y
```

cd into the daq directory

```
./configure && make && make install
```

Create the file `/etc/ld.so.conf.d/snort-i386.conf` with the following
contents: `/usr/local/lib/daq`

cd into the snort source directory

```
./configure --with-mysql --enable-dynamicplugin && make && make install
mkdir -p /etc/snort/rules
mkdir -p /var/log/snort
cd etc/
cp * /etc/snort/
```
