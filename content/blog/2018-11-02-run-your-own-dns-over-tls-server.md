---
date: 2018-11-02T15:09:02-06:00
tags:
- linux
- nginx
- security
title: Run Your Own DNS-over-TLS Server
---

DNS-over-TLS is a relatively new privacy enhancing protocol that encrypts all
of your DNS requests to a trusted server. In an age when airports, and coffee
shops are outsourcing 'free wifi' to corporate entities that are likely
harvesting as much data as they can this is a nice addition. I largely use VPNs
when connected to these access points which provides at least as good
protection as DNS-over-TLS which has caused me to largely overlook this
development.

When I found out that Android 9 natively supports this through the 'Private
DNS' feature I got significantly more interested. I've always wanted to dictate
what DNS server my phone used, not for privacy reasons but rather to provide
another layer of security when not connected to my VPN. When you're in control
of your DNS server you can blacklist known malicious domains and as an added
bonus the worst of the ad and tracking networks.

Turns out DNS-over-TLS is incredibly simple. It makes no changes to normal DNS
packets, it just wraps the TCP queries in a TLS tunnel with a preconfigured
server address for certificate validation.

I use unbound for my DNS server of choice which natively supports exposing a
TLS protected port, but with a very limited config. My preferred choice of
dealing with this is instead to use Nginx to proxy locally to unbound, allowing
me to ensure the TLS config matches current best practices and limits access to
the servers TLS private key to a single service.

The downside of using Nginx is that you lose the ability to log which internet
addresses are making requests (as the stream access_log directive doesn't seem
to be working for the packaged Nginx server). Since this is an unauthenticated
service I'm slightly concerned about anonymous use and abuse but will address
that if it ever becomes an issue.

First off we need to ensure we have a working local resolver on our host. I'll
use unbound here as its my preference but this will work just as well with Bind
or any other DNS resolver that supports TCP queries. If you want to use another
server, just skip past the unbound config to the Nginx section.

## Unbound

```
dnf install unbound -y
```

I clear out some of the garbage default files that ship with the package, and
perform the automated control key creation:

```
rm -f /etc/unbound/{conf.d,keys.d,local.d}/*
unbound-control-setup
```

I then drop in my config to `/etc/unbound/unbound.conf`. I've included comments
in the config around options that aren't immediately obvious from their names.

```
# /etc/unbound/unbound.conf

server:
  interface-automatic: no
  num-threads: 4
  verbosity: 1

  # Disable statistics collection
  statistics-interval: 0
  statistics-cumulative: no

  # Reserve this many ports per-thread to prevent conflicts
  outgoing-range: 4096

  # Restrict the ports being used to match a tighter SELinux policy
  outgoing-port-avoid: 0-32767
  outgoing-port-permit: 32768-60999

  # Per-thread limits for active TCP connections
  outgoing-num-tcp: 100
  incoming-num-tcp: 100

  # Bind to port with SO_REUSEPORT so queries can be distributed over threads
  so-reuseport: yes

  # Maximum UDP response size, this can prevent some fragmentation issues
  max-udp-size: 3072

  # For our TCP clients, allow us to still use UDP to make upstream requests.
  # All of the TLS requests will come in over TLS even if they'd happily be
  # served in a single UDP packet.
  udp-upstream-without-downstream: yes

  access-control: 127.0.0.1 allow
  access-control: ::1 allow
  access-control: 0.0.0.0/0 deny

  chroot: ""
  directory: "/etc/unbound"
  username: "unbound"

  use-syslog: yes
  log-time-ascii: yes

  pidfile: "/var/run/unbound/unbound.pid"

  hide-identity: yes
  hide-version: yes
  hide-trustanchor: yes

  # Perform various hardening on queries
  harden-short-bufsize: yes
  harden-large-queries: yes
  harden-glue: yes
  harden-dnssec-stripped: yes
  harden-below-nxdomain: yes
  harden-referral-path: yes
  harden-algo-downgrade: yes

  # Perform some upstream privacy protection (and in some cases performance
  # improvements) on our queries
  qname-minimisation: yes

  # Aggressive NSEC uses the DNSSEC NSEC chain to synthesize NXDOMAIN and other
  # denials, using information from previous NXDOMAINs answers.
  aggressive-nsec: yes

  # Use 0x20-encoded random bits in the query to foil spoof attempts. This
  # feature is an experimental implementation of draft dns-0x20.
  use-caps-for-id: yes

  # Enforce privacy of these addresses. Strips them away from answers to
  # protect against potential rebind attacks at the expense of potential DNSSEC
  # validation failures. Since we're directly serving clients this shouldn't be
  # an issue.
  private-address: 10.0.0.0/8
  private-address: 172.16.0.0/12
  private-address: 192.168.0.0/16
  private-address: 169.254.0.0/16
  private-address: fd00::/8
  private-address: fe80::/10
  private-address: ::ffff:0:0/96

  # In the event this server gets unwanted replies, it will clear the cache as
  # a safety measure to flush potential poisonings out of it
  unwanted-reply-threshold: 10000

  # Don't allow this server to... query this server...
  do-not-query-localhost: yes

  # Don't prefetch cache entries that are about to expire
  prefetch: no

  # Round-robin returned RRSET queries
  rrset-roundrobin: yes

  minimal-responses: yes

  module-config: "validator iterator"

  # Perform tests automatically to make sure this resolver is ready for root
  # key rollovers
  root-key-sentinel: yes

  val-clean-additional: yes
  val-log-level: 2

  # Serve expired responses from cache, with TTL 0 in the response,
  # and then attempt to fetch the data afresh.
  serve-expired: yes

  # Enable pulling updated anchor trusts automatically
  auto-trust-anchor-file: "/var/lib/unbound/root.key"

  # Trust anchor signaling sends a RFC8145 key tag query after priming.
  trust-anchor-signaling: yes

  # Instruct the auto-trust-anchor-file probing to avoid changes to anchors
  # using 30 days hold down
  add-holddown: 2592000
  del-holddown: 2592000

remote-control:
  control-enable: yes
```

I always need to stress changes like these should be understood before being
blindly used. Make sure you start and enable the service:

```
systemctl start unbound.service
systemctl enable unbound.service
```

Perform various queries against the service to ensure it's working as intended:

```
dig +tcp google.com @::1
dig +tcp reddit.com @::1
dig +tcp stelfox.net @::1
```

If you get reasonable responses from those queries then we have a working
resolver. The next step is to add our TLS layer with Nginx.

## Nginx

With a resolver setup the next bit is to setup Nginx to proxy requests to the
resolver. You need to have a trusted TLS certificate and key for your server's
domain name. Let's Encrypt works great for this and I use both an ECDSA
cert/key pair and an RSA cert/key pair but you can use one or the other if that
is your preference. I'll cover requesting these certificates in a future post,
in the mean time there are plenty of existing Let's Encrypt tutorials.

This can be a bit tricky as anyone reading this might have an Nginx config in
place already. It'll be up to you to merge this config with yours. To assist
with this merging I've kept the Nginx config as minimal while still being
completely functional as possible and avoided using includes to increase the
clarity of the config.

On Fedora 28 you'll need both the `nginx` and the `nginx-mod-stream` package.
After installing them both you'll want to place the following config to
`/etc/nginx/nginx.conf`.

```
# /etc/nginx/nginx.conf

error_log /var/log/nginx/error.log warn;
user nginx;
worker_processes auto;

events {
  worker_connections 1024;
}

# Needs to be loaded before the http or stream blocks are used
load_module "/usr/lib64/nginx/modules/ngx_stream_module.so";

# This is where your normal http block would live
#http {
#}

stream {
  upstream dns_tcp_servers {
    server [::1]:53;
  }

  server {
    listen 853 ssl;
    proxy_pass dns_tcp_servers;

    ssl_certificate /etc/nginx/nginx.ec.crt;
    ssl_certificate_key /etc/nginx/nginx.ec.key;

    ssl_certificate /etc/nginx/nginx.rsa.crt;
    ssl_certificate_key /etc/nginx/nginx.rsa.key;

    ssl_handshake_timeout 30s;
    ssl_session_cache shared:DNSTCP:50m;
    ssl_session_tickets off;
    ssl_session_timeout 1h;

    ssl_protocols TLSv1.2;
    ssl_ciphers 'ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-SHA384:ECDHE-RSA-AES256-SHA384:ECDHE-ECDSA-AES128-SHA256:ECDHE-RSA-AES128-SHA256';
    ssl_prefer_server_ciphers on;
  }
}
```

The SSL configuration is largely what Mozilla currently recommends for a
'Modern' config. Any client that supports DNS-over-TLS is new enough that
they'll have access to modern queries. You'll need to put your key and
certificates in the appropriate locations for that config.

With that in place start up the server:

```
systemctl start nginx.service
systemctl enable nginx.service
```

You'll need to allow `953/tcp` through your firewall and will likely need to
make changes to your SELinux policy to allow Nginx to listen on that port.

I haven't found a good way to directly test the resolver using command line
clients but by configuring my Android phone towards my server and temporarily
adding the following to my unbound server config I can that queries being made
and responded to appropriately:

```
log-queries: yes
log-replies: yes
```

The next steps are on you. Configure unbound with your domain blacklists of
choice and voila additional privacy and security for those times when VPNs are
to power hungry.
