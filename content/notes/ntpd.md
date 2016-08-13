---
title: NTPd
type: note
---

# NTPd

The Network Time Protocol (NTP) is a protocol for synchronizing the clocks of
computer systems over packet-switched, variable-latency data networks. NTP uses
UDP on port 123 as its transport layer. It is designed particularly to resist
the effects of variable latency by using a jitter buffer.

NTP also refers to a reference software implementation that is distributed by
the NTP Public Services Project.

## Security Notes

Several authentication schemes and miscellaneous programs running on the
servers rely heavily on closely synced clocks. NTP provides a clock
synchronized to within 10 milliseconds of the other clocks over the internet
and as close as 200 microseconds.

This runs as an unprivileged user with no shell when run as a server as such
it's compromise could at the very worst make it hand out incorrect time. While
this would mean the authentication schemes and programs wouldn't function
correctly this is something that would be noticed when day to day activity
ceased to function.

When run as a client, it has to be run as root to update the system's clock. If
an attacker was to compromise the data stream and was able to execute arbitrary
commands in a response packet there would be issues. This is a highly unlikely
scenario. None-the-less I prefer to have them synchronize against a trusted
locally run server.

## Firewall Adjustments

NTP synchronizations are allowed through my default [IPTables][1] firewall
script. By default it is unrestricted and should be configured to be more
restrictive by replacing it with the one below. You should replace the address
with your time server's address.

```
# Allow time sync updates, once an ntp server is setup this can be further
# restricted to only update from there.
-A OUTPUT -m udp -p udp --dport 123 -j ACCEPT
```

For the server the opposite should be true. The service should only accept
connections on the local subnets. The following firewall rules should be added
to the firewall.

```
# Allow other servers and clients on the local subnet to synchronize their
# clocks to this server using ntp
-A SERVICES -m udp -p udp -s 10.13.37.0/24 --dport 123 -j ACCEPT
-A SERVICES -m udp -p udp -s 10.13.38.0/24 --dport 123 -j ACCEPT
```

## Configuration

### /etc/ntp.conf

A standard configuration of ntp is shown below, there isn't a whole lot to
explain so I'll leave it at that.

```
# For more information about this file, see the man pages
# ntp.conf(5), ntp_acc(5), ntp_auth(5), ntp_clock(5), ntp_misc(5), ntp_mon(5).

driftfile /var/lib/ntp/drift

# Permit time synchronization with our time source, but do not
# permit the source to query or modify the service on this system.
restrict default kod nomodify notrap nopeer noquery
restrict -6 default kod nomodify notrap nopeer noquery

restrict 127.0.0.1 
restrict -6 ::1

# Hosts on local network are less restricted.
restrict 10.13.37.64 mask 255.255.255.192 nomodify notrap nopeer
restrict 10.13.37.128 mask 255.255.255.192 nomodify notrap nopeer
restrict 10.13.37.192 mask 255.255.255.192 nomodify notrap nopeer

# Stratum 1 time servers - diverse group
server clock.nyc.he.net iburst # IPv6 enabled
server clock.sjc.he.net iburst # IPv6 enabled
server time.keneli.org iburst
server bonehed.lcs.mit.edu iburst
server gnomon.cc.columbia.edu iburst

# Enable public key cryptography.
#crypto
includefile /etc/ntp/crypto/pw
keys /etc/ntp/keys

# Specify the key identifiers which are trusted.
trustedkey 1

# Specify the key identifier to use with the ntpdc utility.
requestkey 1

# Specify the key identifier to use with the ntpq utility.
controlkey 1

# Enable writing of statistics records.
statistics clockstats cryptostats loopstats peerstats
```

The server will need to be set to start automatically on boot. Use the
following command to do this:

```
chkconfig --level 345 ntpd on
```

### /etc/ntp/keys

A keyfile needs to be created for local and remote administration of the
service. To do this generate a random 8 character alphanumeric password and
replace the 'xxxxxxxx' in the file `/etc/ntp/keys`.

This file should also be protected from read / write from unauthorized users
`600` with chmod. The contents are below:

```
1      M       xxxxxxxx
```

## Checking Server Status

On the server running `ntpd` you can use the `ntpq` utility to check the
current status of the ntpd service like so:

```
[root@localhost ~]# ntpq -p 127.0.0.1
     remote           refid      st t when poll reach   delay   offset  jitter
==============================================================================
*clock.nyc.he.ne .CDMA.           1 u    1   64    1   52.015  -16.888   2.421
 clock.sjc.he.ne .GPS.            1 u    2   64    1  110.573    3.201   0.366
 time.keneli.org .PPS.            1 u    1   64    1   29.378   -4.100   1.737
 bonehed.lcs.mit .PPS.            1 u    2   64    1   16.254   -1.620   1.396
 gnomon.cc.colum .USNO.           1 u    1   64    1   51.110  -15.607   2.697
```

[1]: ../iptables/

