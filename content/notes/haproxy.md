---
created_at: 2013-01-01T00:00:01-0000
title: HAProxy
---

***Note: This page is quite old and is likely out of date. My opinions may have
also changed dramatically since this was written. It is here as a reference
until I get around to updating it.***

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

The following is the config that worked as an initial pass setting up haproxy.
The configuration lives at `/etc/haproxy/haproxy.cfg`.

```
global
  log         /dev/log local2 info

  chroot      /var/lib/haproxy
  pidfile     /var/run/haproxy.pid
  maxconn     10000
  user        haproxy
  group       haproxy
  daemon

  stats socket /var/lib/haproxy/stats

defaults
  mode                    http
  log                     global
  option                  httplog
  option                  dontlognull
  option http-server-close
  option forwardfor       except 127.0.0.0/8
  option                  redispatch
  retries                 3
  timeout http-request    5s
  timeout queue           1m
  timeout connect         5s
  timeout client          1m
  timeout server          1m
  timeout http-keep-alive 10s
  timeout check           5s
  maxconn                 5000

frontend  main *:80
  default_backend             app

backend app
  balance leastconn
  server  nginx-01 192.168.122.61:80 check
  server  nginx-02 192.168.122.62:80 check

listen ssl :443
  balance leastconn
  mode    tcp
  server  nginx-01 192.168.122.61:443 check
  server  nginx-02 192.168.122.62:443 check
```

You will also need to open up the outbound firewall to nginx and the inbound
firewall to the port.

```
-A INPUT  -m tcp -p tcp --dport 80 -m conntrack --ctstate NEW -j ACCEPT
-A OUTPUT -m tcp -p tcp --dport 80 -j ACCEPT
```

And setup haproxy to run.

```
systemctl enable haproxy.service
systemctl start haproxy.service
```
