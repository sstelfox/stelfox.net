---
title: Logwatch
---

# Logwatch

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

