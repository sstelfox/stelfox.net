---
title: Chronyd
weight: 40

taxonomies:
  tags:
  - linux

extra:
  done: true
  oudated: true
---

Replacement for the ntpd daemon.

## Installation

```
yum install chrony -y
```

After configuration enable the service like so

```
systemctl enable chronyd.service
```

## Server

* [/etc/chrony.conf](chrony_server.conf)

If you want to have multiple chrony servers on the local network it's a good
idea to mark them as peers with each other with the following directive:

```
peer <Other Server IP>
```

This will automatically generate a unique key in `/etc/chrony.keys`

## Client (always on)

* [/etc/chrony.conf](chrony_client_always_on.conf)

This will automatically generate a unique key in `/etc/chrony.keys`

## Client (Intermittant Connection)

This section relies on NetworkManager's dispatcher to inform chronyd when we
have and don't have a network connection to take the synchronization on and
offline.

* [/etc/chrony.conf](chrony_client_intermittent.conf)

This will automatically generate a unique key in /etc/chrony.keys

This following file needs to be placed at
`/etc/NetworkManager/dispatcher.d/20-chrony`, marked as executable, and should
be owned by root. A similar version of this script comes with Fedora, however,
it isn't quite as friendly as mine. Just replace it.

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
