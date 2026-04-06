---
created_at: 2013-01-01T00:00:01-0000
updated_at: 2026-04-05T00:00:00-0000
tags:
  - linux
  - networking
  - web
  - security
title: Squid
aliases:
  - /notes/squid/
---

For URL filtering please refer to the [SquidGuard](../squid_guard/) page.

```
yum install squid -y
```

## Authentication Setup

Before configuring squid you should get the authentication credentials in
place. To do this we make use of the `htpasswd` utility which can be installed
through the `httpd-tools` package.

For the first account:

```
htpasswd -b -c /etc/squid/accounts username password
```

And subsequent accounts:

```
htpasswd -b /etc/squid/accounts username2 password2
```

## Configuration

The main squid configuration file lives at `/etc/squid/squid.conf`. This
[squid.conf](squid.conf) is a fairly generic starting point with basic auth,
caching, ACLs, and logging. You will need to update IP addresses, networks,
and email addresses to match your environment.

To enable syslog logging we need to add the `-s` flag to `SQUID_OPTS` in
`/etc/sysconfig/squid`. See the [sysconfig options](squid.sysconfig) for an
example.

Enable and start the service:

```
systemctl enable squid.service
systemctl start squid.service
```

## Firewall

The proxy needs inbound access from clients on the network and outbound access
to fetch content on their behalf.

| Port | Protocol | Direction | Description |
|------|----------|-----------|-------------|
| 3128 | TCP | Inbound | Squid proxy access (from internal network) |
| 21 | TCP | Outbound | FTP requests |
| 80 | TCP | Outbound | HTTP requests |
| 443 | TCP | Outbound | HTTPS requests |

Other clients on the network will need outbound access to the squid port
(3128/TCP) as well.

## A Note on Non-Standard Ports

It is highly recommended to run squid on a non-standard port if it is going to
be exposed to the internet. The catch is that this will throw SELinux for a
loop. The following command will tell SELinux to be ok with squid running on
port 11637.

```
semanage port -a -t http_cache_port_t -p tcp 11637
```

This may be necessary if squid needs to listen on multiple ports (for example
for dansGuardian with kerberos authentication).

## Viewing Statistics

On the squid server you can run a report to see the status of squid with the
`squidclient` command like so:

```
squidclient -h 127.0.0.1 mgr:info
```

## Testing

You can confirm the squid works like so:

```
curl -x 10.0.0.170:3128 https://www.google.com/
```

With authentication:

```
curl --proxy-basic --proxy-user user:pass -x 10.0.0.170:3128 https://www.google.com/
```

## Package Manager Proxy Configuration

Most package managers support proxy configuration. Check the docs for your
specific package manager, but typically you can add a proxy URL
(`http://proxy-host:3128`) to the package manager's config file. If
authentication is required, the proxy URL can include credentials in the
format `http://username:password@proxy-host:3128`.

## Environment Variable Proxy Configuration

To setup general proxy use on the system for various command line utilities
like `wget`, `curl`, and `lynx`, there are a set of common environment
variables to set. Create a file at `/etc/profile.d/proxy.sh` with the
following contents and make it executable.

```
# General proxy configuration for system tools
export http_proxy=squid.local.tld:3128
export https_proxy=squid.local.tld:3128
export ftp_proxy=squid.local.tld:3128
export ALL_PROXY=squid.local.tld:3128
export no_proxy=.i.0x378.net
export NO_PROXY=.i.0x378.net
```

You can include credentials by prepending `user:pass@` to the hosts of the
protocols above.
