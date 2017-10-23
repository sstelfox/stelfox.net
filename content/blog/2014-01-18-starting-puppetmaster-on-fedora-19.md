---
date: 2014-01-18 22:47:37 -0500
slug: starting-puppetmaster-on-fedora-19
tags:
- linux
title: Starting Puppet Master on Fedora 19
---

I was trying to get puppet running out of the box on Fedora 19 and found a bug
exists in their systemd service file. After installing `puppet` and
`puppet-server`, whenever I tried to start the server with the following
command:

```sh
systemctl start puppetmaster.service
```

It would hang for a long time and the following error message would show up in
the log:

```
Jan 19 03:42:18 puppet-01 puppet-master[1166]: Starting Puppet master version 3.3.1
Jan 19 03:42:18 puppet-01 systemd[1]: PID file /run/puppet/master.pid not readable (yet?) after start.
Jan 19 03:43:07 puppet-01 systemd[1]: puppetmaster.service operation timed out. Terminating.
Jan 19 03:43:07 puppet-01 puppet-master[1166]: Could not run: can't be called from trap context
```

Starting puppet directly from the command line using the same command specified
in the service file would work fine, but that wasn't really a solution. Turns
out puppet, additionally I would briefly see the `puppetmaster` service open up
port 8140 before systemd would kill it.

Turns out the systemd service script is looking in the wrong location for the
pid file. All of the pids are stored in `/var/run/puppet/` with a filename of
either `agent.pid` or `master.pid` depending on the mode it was run as. The
systemd script, as the log indicates is looking for the pid files in
`/run/puppet`.

The real solution would be to bring this too the attention of the script
maintainers, but I haven't had a lot of luck going through those processes.
Instead you can work around the issue without any bureaucracy by changing the
`rundir` configuration option in `/etc/puppet/puppet.conf` to `/run/puppet`,
and creating `/run/puppet` (with puppet as the user and group owning the
directory).

After that, voila! The service starts up. You'd think a QA process would catch
that the service script doesn't work...
