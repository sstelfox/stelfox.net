---
title: Nagios
---

***Note: This page is quite old and is likely out of date. My opinions may have
also changed dramatically since this was written. It is here as a reference
until I get around to updating it.***

```
yum install nagios nagios-plugins httpd nagios-plugins-load \
  nagios-plugins-users nagios-plugins-http nagios-plugins-ping \
  nagios-plugins-ssh nagios-plugins-procs nagios-plugins-disk \
  nagios-plugins-smtp nagios-plugins-dns nagios-plugins-tcp -y
```

```
rm -f /etc/httpd/conf.d/welcome.conf
```

There is also an undeclared depedency:

```
yum install perl-Text-ParseWords -y
```

```
htpasswd -c /etc/nagios/passwd nagiosadmin
```

Updates are going to be handled by yum exclusively, so the first change is
adjusting `check_for_updates=1` to `0`, and for good measure
`bare_update_check=0` to `1` in `/etc/nagios/nagios.cfg`.

```
systemctl enable httpd.service
systemctl enable nagios.service
systemctl start httpd.service
systemctl start nagios.service
```

I had a strange issue where the ping plugin wasn't working with an error like
"CRITICAL - Could not interpret output from ping command" the solution was to
give the setuid bit to the ping program like so:

```
chmod u+s /usr/bin/ping
```

Next steps:

* Investigate using nginx instead of apache
* Setup nagios to be the root of apache
* Add SSL to apache
* Add a port forward through to nagios

## Permission Fixing

In the event all the editing goo breaks nagios's ability to access files I
wrote the following quick little script to fix the various ownerships and
permissions.

```sh
#!/bin/bash

# Fix the ownership of the various directories
chown root:root /etc/nagios
chown -R root:nagios /etc/nagios/*
chown root:apache /etc/nagios/passwd

# And fix the permissions on the various files and directories
chmod -R u=rwX,g=rX,o=rX /etc/nagios
chmod 0640 /etc/nagios/private/resource.cfg /etc/nagios/passwd

# And restore any selinux attributes on the files
restorecon -R /etc/nagios
```
