---
title: Logwatch
---

***Note: This page is quite old and is likely out of date. My opinions may have
also changed dramatically since this was written. It is here as a reference
until I get around to updating it.***

## Configuration

### /etc/logwatch/conf/logwatch.conf

```
LogDir = /var/log
TmpDir = /var/cache/logwatch
Output = stdout
Format = text
Encode = none

MailTo = administrator@example.net
MailFrom = root@example.net

Archives = No
Range = yesterday

Detail = Med

Service = All

mailer = "/usr/sbin/sendmail -t"
HostLimit = Yes
```
