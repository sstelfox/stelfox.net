---
title: Logwatch
weight: 11

taxonomies:
  tags:
  - email
  - linux
  - reporting
  - security

extra:
  done: true
  oudated: true
---

## Configuration

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
