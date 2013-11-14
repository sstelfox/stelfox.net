---
title: Google Earth
---

## Installation on Fedora

Create /etc/yum.repos.d/google-earth.repo with the following contents:

```ini
[google-earth]
name=google-earth
baseurl=http://dl.google.com/linux/earth/rpm/stable/\$basearch
enabled=1
gpgcheck=1
gpgkey=https://dl-ssl.google.com/linux/linux_signing_key.pub
```

And then run:

```sh
[root@host ~]# yum install google-earth-stable redhat-lsb.i686 redhat-lsb-graphics.i686 -y
```

