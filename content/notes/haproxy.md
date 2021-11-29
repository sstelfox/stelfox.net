---
title: HAProxy
weight: 37

taxonomies:
  tags:
  - linux

extra:
  done: true
  outdated: true
---
Specialized network proxy daemon.

<!-- more -->

## Notes on Setup

I setup two simple nginx webservers to test this configuration. They both
served up a simple static page whose only contents was an indication of which
server it was served from.

```sh
yum install haproxy keepalived -y
```

Setup the logging haproxy will use

```
cat << EOF > /etc/rsyslog.d/haproxy.conf
local2.*        /var/log/haproxy.log
EOF

service rsyslog restart
```

This [config][1] worked as an initial pass setting up haproxy. The
configuration lives at `/etc/haproxy/haproxy.cfg`. You will also need to open
up the outbound firewall to nginx and the inbound firewall to the port.

```
-A INPUT  -m tcp -p tcp --dport 80 -m conntrack --ctstate NEW -j ACCEPT
-A OUTPUT -m tcp -p tcp --dport 80 -j ACCEPT
```

And setup haproxy to run.

```
systemctl enable haproxy.service
systemctl start haproxy.service
```

[1]: haproxy.cfg
