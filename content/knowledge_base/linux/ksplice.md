---
title: KSplice
---

# KSplice

This information was for Fedora 14 and needs to be updated

When using Fedora a free service to update running kernels is available through
[KSplice][1]. There is no good reason not too download this and set it to
auto-install.

Install the package using `yum install ksplice-uptrack.rpm --nogpgcheck -y`.
After installing the package run "uptrack-upgrade -n" and accept the license
and let it retrieve an API key.

Open up `/etc/upstart/upstart.conf` and change "autoinstall" to yes. It will
automatically check and install updates every half an hour. The specific times
it updates are not exact and adjusted by KSplice to balance the load on their
servers.

[1]: http://www.ksplice.com/uptrack/download-fedora
