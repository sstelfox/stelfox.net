---
title: yum-updatesd
---

'''PLEASE NOTE''': yum-updatesd is currently broken on Fedora 17 so I've
replaced it on my current systems with the following daily cron script which I
drop into the file /etc/cron.daily/00update-system with execute permissions

```
#!/bin/bash
yum update -y >/dev/null
```

yum-updatesd provides a daemon which checks for available updates and can
notify you when they are available via email, syslog or dbus.

By default yum-updatesd notifies the administrator via dbus. DBus as a
notification channel is great for desktop machines but almost useless without
additional daemons for servers. I personally prefer syslog as a notification
mechanism but email is useful as well.

## Security Notes

Updates are critically important to keeping a system secured. This daemon can
notify administrators of pending updates and optionally install them
automatically upon detection. If you are using a trusted repository with a
community or locally reviewed updates that are cryptographically signed such as
the default Fedora or RedHat repositories it is safe to automatically install
updates.

## Configuration

You'll want to ensure /etc/yum/yum-updatesd.conf looks like below:

```
[main]
# Check for updates automatically every hour (in seconds)
run_interval = 3600
# Allow checking (refresh) every 10 minutes (in seconds)
updaterefresh = 600

# send notifications to syslog (valid: dbus, email, syslog)
emit_via = syslog
# Don't listen on the dbus we don't use it
dbus_listener = no

# automatically install updates
do_update = yes
# automatically download updates
do_download = yes
# automatically download dependencies of updates
do_download_deps = yes
```

Afterwards configure it to start up automagically and start up now:

```
systemctl enable yum-updatesd.service
systemctl start yum-updatesd.service
```

