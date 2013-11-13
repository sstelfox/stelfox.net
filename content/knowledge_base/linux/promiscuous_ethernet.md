---
title: Promiscuous Ethernet
---

Redhat used to to include a way to enable promiscuous mode in the network
configuration scripts. This was deprecated and no longer available but can be
restored by creating/adding to the /sbin/ifup-local file:

```sh
#!/bin/bash

RC=0

PROM=$(egrep -i 'promisc' /etc/sysconfig/network-scripts/ifcfg-$1 | awk -F"=" '{ print $2 }')

if [ "$PROM" = "yes" ]; then
    /sbin/ifconfig $1 promisc
    RC=$?
fi

exit $RC
```

You can then use this in /etc/sysconfig/network-scripts/ifcfg-eth0 like files
by adding "PROMISC=yes" somewhere in it. This is untested.

