---
title: HAProxy
type: note
---

# HAProxy

## A Note on SSL

If you're using HAProxy to proxy SSL traffic without terminating it at HAProxy
you might quickly discover what I did. You lose the client IP in the request
completely. This unfortunately was a deal breaker for me. HAProxy's SSL support
was slow to evolve and as far as I can tell doesn't directly support the
elliptic curve based protocols.

This is mostly an assumption since I couldn't find any documentation on this
being in place anywhere, and there doesn't seem to be a way to directly provide
a diffie-hellman parameter file (though it's not uncommon for this to just be
appended to the certificate file).

Instead my next step was too look at the kernel's support for virtual IPs
shared among different machines (IPVS and Keepalived).

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

