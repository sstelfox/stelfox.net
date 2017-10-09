---
title: NTPDate
---

***Note: This page is quite old and is likely out of date. My opinions may have
also changed dramatically since this was written. It is here as a reference
until I get around to updating it.***

There are two different means of client configuration. Fedora has a package
`ntpdate` that should be installed instead of [ntpd][1]. Whenever it is started
it will synchronize the server's clock to any configured time servers.  It
needs to be told about time servers it should be synchronizing to in the
`/etc/ntp/step-tickers`. It then needs to be turned on using the following
command:

```
[root@localhost ~]# chkconfig --level 345 ntpdate on
```

If the server doesn't have the ntpdate service (ntpdate seems like it's being
deprecated though I can't imagine why) than the same thing can be accomplished
by installing [ntpd][1] and adding a cron job to synchronize the time.

The following command will add a cron entry that will get run hourly and
synchronize the time against the time server configured for the ntp daemon
(You'll want to reference [ntpd][1] for that configuration.

```
echo '0 * * * * root /usr/sbin/ntpd -q -u ntp:ntp' > /etc/cron.d/ntpd
```

## /etc/ntp/step-tickers

By default this file is empty and ntpdate will have no servers to get it's time
from. This file should include one server per line that are either a FQDN or an
IP address. If there is one or more local time servers they should be the only
ones listed. If there aren't then use the following for the config file:

```
0.pool.ntp.org
1.pool.ntp.org
```

[1]: {{< relref "notes/ntpd.md" >}}
