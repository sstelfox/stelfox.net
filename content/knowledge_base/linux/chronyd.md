---
title: Chronyd
---

Replacement for the ntpd daemon. This doesn't seem to be "production ready".

## Installation

```
yum install chrony -y
```

After configuration enable the service like so

```
systemctl enable chronyd.service
```

## Server

### /etc/chrony.conf

```
bindaddress <Server IP>
bindcmdaddress 127.0.0.1

# IPv4/IPv6:
server clock.nyc.he.net iburst
server clock.sjc.he.net iburst

# IPv4 only:
server time.keneli.org iburst
server bonehed.lcs.mit.edu iburst
server gnomon.cc.columbia.edu iburst

# Record the rate at which the system clock gains/losses time.
driftfile /var/lib/chrony/drift

# Enable kernel RTC synchronization.
rtcsync

# In first three updates step the system clock instead of slew
# if the adjustment is larger than 100 seconds.
makestep 100 3

# Allow client access from local network.
allow 10.13.37

# Serve time even if not synchronized to any NTP server.
local stratum 6

keyfile /etc/chrony.keys

# Specify the key used as password for chronyc.
commandkey 1
cmdallow 127.0.0.1

# Send a message to syslog if a clock adjustment is larger than 0.5 seconds.
logchange 0.5

logdir /var/log/chrony
log measurements statistics tracking
```

If you want to have multiple chrony servers on the local network it's a good
idea to mark them as peers with each other with the following directive:

```
peer <Other Server IP>
```

This will automatically generate a unique key in /etc/chrony.keys

## Client (always on)

### /etc/chrony.conf

```
server <Server IP>
driftfile /var/lib/chrony/drift
rtcsync
keyfile /etc/chrony.keys
commandkey 2
cmdallow 127.0.0.1
initstepslew 20 <Server IP>
logchange 0.5
logdir /var/log/chrony
log measurements statistics tracking
```

This will automatically generate a unique key in /etc/chrony.keys

## Client (Intermittant Connection)

This section relies on NetworkManager's dispatcher to inform chronyd when we
have and don't have a network connection to take the synchronization on and
offline.

### /etc/chrony.conf

```
server <Server IP> offline
driftfile /var/lib/chrony/drift
rtcsync
keyfile /etc/chrony.keys
commandkey 2
cmdallow 127.0.0.1
initstepslew 20 <Server IP>
logchange 0.5
logdir /var/log/chrony
log measurements statistics tracking
```

This will automatically generate a unique key in /etc/chrony.keys

### /etc/NetworkManager/dispatcher.d/20-chrony

This file needs to be executable and should be owned by root. A similar version
of this script comes with Fedora, however, it isn't quite as friendly as mine
:). Just replace it.

```sh
#!/bin/sh

INTERFACE=$1    # The interface which is brought up or down
STATUS=$2       # Interface status

case "$STATUS" in
  'up')
    # Check to see if the interface added a default route
    /sbin/ip route list dev "$INTERFACE" | grep -q '^default' &&
      /usr/libexec/chrony-helper command online > /dev/null 2>&1
    ;;
  'down')
    # If we don't have a default route anymore mark chrony as offline
    /sbin/ip route list | grep -q '^default' ||
      /usr/libexec/chrony-helper command offline > /dev/null 2>&1
    ;;
esac
```

