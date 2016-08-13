---
title: Logrotate
type: note
---

# Logrotate

Logrotate is a pretty simple and straight forward program. It's generally run
as a nightly cron job testing the various configured file to see if they match
their respective criteria for rotation.

After installing logrotate defaults are configured that are generally 'good
enough' for most systems and generally include the default system logs in
`/var/log`.

Other services can install their own logrotation configurations without
stomping on other packages by placing their configuration in `/etc/logrotate.d`
such as `yum` and [`nginx`][1]. Defaults for configurations are configured in
`/etc/logrotate.conf`. I generally leave them alone and override them as needed
for specific log files. Where appropriate you'll find the rotation
configurations I use on the relevant service pages.

[1]: <%= @items['/knowledge_base/linux/nginx/'].path %>
