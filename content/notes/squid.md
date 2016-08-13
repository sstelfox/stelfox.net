---
title: Squid
type: note
---

# Squid

* http://klaubert.wordpress.com/2008/01/09/squid-kerberos-authentication-and-ldap-authorization-in-active-directory/
* http://gofedora.com/how-to-configure-squid-proxy-server/
* http://wiki.squid-cache.org/ConfigExamples/Portal/Splash
* http://rosincore.blogspot.com/2010/01/dansguardian-content-filtering-with-ad.html
* http://eu.squid-cache.org/ConfigExamples/Authenticate/Kerberos
* http://wiki.squid-cache.org/Features/NegotiateAuthentication
* http://www.squid-cache.org/Versions/v3/3.2/cfgman/

For URL filtering please refer to the [SquidGuard][1] page.

```
yum install squid -y
```

Before configuring squid we mind as well get the authentication credentials in
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

Lets drop the config into place, this is fairly generic there are just a few IP
addresses, networks, and emails to change. It should live at
`/etc/squid/squid.conf`.

```sh
# Configuration reference:
# http://www.squid-cache.org/Versions/v3/3.2/cfgman/
# https://calomel.org/squid.html
# Note to self search for "TODO" and "TEST"

# Bind to the standard squid part (3128)
http_port [::]:3128

### GENERAL CONFIGURATION

# Email address of the local cache manager in case an issue crops up. This will
# also show up in error messages.
cache_mgr cache-admin@proxy-01.i.0x378.net

# For security and stability reasons Squid can check hostnames for Internet
# standard RFC compliance.
check_hostnames on

# Leave coredumps in the base cache directory
coredump_dir /var/spool/squid

# Automatically close broken persistent connections
detect_broken_pconn on

# Using the transparent option prevent squid from manipulating this header,
# turning it off just sets the client's address do "unknown".
forwarded_for transparent

# Prevent Squid from announcing it's version information
httpd_suppress_version_string on

# Minimum umask to be enforced for all written files, generally this should be
# public information (cached content) but it can't hurt to  restrict it.
umask 027

# Hostname that is visible in error messages, and if used in a cluster used to
# detect forwarding loops. If your cluster needs to use the same
# visible_hostname investigate the related option unique_hostname.
visible_hostname proxy-01.internal.private.web

### TIMEOUTS

# How long to wait for TCP connect to a requested server or peer to complete
# before Squid should attempt to find another path to forward the request.
connect_timeout 5 second

# If no response is received to a DNS query within this time all DNS servers
# for the queried domain are assumed to be unavailable. This may cause
# transient resolution errors to be cached but I haven't verified that.
dns_timeout 5 second

# Max length of time Squid should attempt to find a forwarding path for a
# request before giving up.
forward_timeout 10 second

# How long to wait for complete HTTP request headers after initial connection
# establishment.
request_timeout 10 second

### AUTHENTICATION

# Ensure usernames are case sensitive
auth_param basic casesensitive on

# Length of time to consider credentials authenticated through the external
# program valid.
auth_param basic credentialsttl 2 hours

# Use basic htpasswd style files to handle authentication.
auth_param basic program /usr/lib64/squid/basic_ncsa_auth /etc/squid/accounts

# The realm to display to any inquistive clients
auth_param basic realm Proxy Access Requires Authentication

### CACHE CONFIGURATION

# <store type> <store location> <cache size in MB> <# of first level
# directories> <# of second level directories> aufs is the non-blocking disk
# storage option
cache_dir aufs /var/spool/squid 1024 16 256

# This represents the maximum amount of ram that squid will utilize to keep
# cached objects in memory. Squid requires about 100Mb of RAM per Gb of cache
# storage. If you have a 10gb cache, Squid will use ~1Gb just to handle that.
# Make sure that cache_mem + (cache_dir size limit * 100Mb) is less than your
# available RAM.
cache_mem 192 MB

# Least Frequently Used with Dynamic Aging (keeps popular objects in cache
# regardless of their size and thus optimizes byte hit rate at the expense of
# hit rate since one large, popular object will prevent many smaller, slightly
# less popular objects from being cached.
cache_replacement_policy heap LFUDA

# Limit the size of file to hold in the cache, 10 MB is about the largest file
# I expect multiple of my client to pull down.
maximum_object_size 10 MB

# Tell squid to release memory it's not using
memory_pools off

# Cacheing rules for content that doesn't have an explicit expire time.
refresh_pattern ^ftp:             1440 20%    10080
refresh_pattern -i (/cgi-bin/|\?) 0    0%     0
refresh_pattern .                 0    20%    4320

# Specifies how long squid should wait when it's service is asked to stop.
# Generally this to allow client requests to complete, but I find it more
# useful to make this fast.
shutdown_lifetime 1 second

# This normally evaluate how much data is left in a transfer when a client
# disconnects before it's completed, and if the remaining data falls in the
# configured range, Squid will finish downloading the file and cache it anyway.
# This is cool but not useful in my environment.
quick_abort_min 0 KB
quick_abort_max 0 KB

### SSL BUMP

# TODO: This is exactly worst practices in most cases, however, for a highly
# restricted network of servers using this as their only means of accessing the
# internet... It can be an important security measure.

### CUSTOM ERROR MESSAGES

# TODO: Useful for client facing servers

### SQUIDGUARD CONFIG

#url_rewrite_program /usr/bin/squidGuard -c /etc/squid/squidGuard.conf
#url_rewrite_bypass off

### LOGGING

# <Client IP> <Username> [<Local Time>] "<Request Method> <Request URL>
# HTTP/<Protocol Version> <Response Status Code> <Sent reply size (with
# headers)> <Referer> <User Agent> <Squid Request Status>:<Squid Hierarchy
# Status>
logformat        combined %>a %un [%tl] "%rm %ru HTTP/%rv" %>Hs %<st "%{Referer}>h" "%{User-Agent}>h" %Ss:%Sh

# <Client IP> <Username> [<Local Time>] "<Sent Headers>" "<Reply Headers>"
logformat        debugheaders %>a %un [%tl] "%>h" "%<h"

# Send our neat logs through to the local syslog server
access_log       syslog:local3.info combined

# Useful for debugging
#access_log      syslog:local3.debug debugheaders
#access_log      stdio:/var/log/squid/headers.log debugheaders
#cache_store_log stdio:/var/log/squid/store.log
#cache_log       stdio:/var/log/squid/cache.log
#logfile_rotate  3

### BEGIN ACL ALIASES

acl CONNECT method CONNECT

# An ACL to match authenticated users
acl authenticated_user proxy_auth REQUIRED

# ACL covering clients allowed to use this proxy
acl allowed_hosts src 10.0.0.0/24
acl allowed_hosts src fc00::/7       # RFC 4193 local private network range
acl allowed_hosts src fe80::/10      # RFC 4291 link-local (directly plugged) machines

# ACLs covering restricted destinations
acl to_local_network dst 10.0.0.0/24

# Limit individual matching hosts to 500 connections
acl proxy_connection_limit maxconn 500

# Which ports to allow raw connects too (For SSL mostly)
acl SSL_ports port 443 	        # https

# Which ports to allow regular unencrypted procols to connect to
acl allowed_ports port 80          # http
acl allowed_ports port 21          # ftp
acl allowed_ports port 443         # https
#acl allowed_ports port 1025-65535  # unregistered ports

### BEGIN ACLS

# Only allow cachemgr access from localhost
http_access allow manager localhost
http_access deny manager

# Access to local web based services should be explictely and directly allowed.
# Deny access to them through this proxy.
http_access deny to_local_network

# Deny requests from clients that go over the connection limits
http_access deny proxy_connection_limit

# Allow CONNECT to only the explicitely allowed ports
http_access allow CONNECT SSL_ports
http_access deny CONNECT

# Deny requests to any port we haven't whitelisted
http_access deny !allowed_ports

# Allow access to this squid server from our local whitelisted network... as
# long as they're authenticated.
http_access allow allowed_hosts authenticated_user

# Deny any requests we haven't allowed by this point
http_access deny all

### PRIVACY / REQUEST MANGLING

# TODO: Client information can leak out through headers including information
# about services and OS's running inside the network. Mangling the requests and
# responses and whitelisting the various headers of value can help mitigate
# this, and provide meaningful dis-information.

#request_header_replace User-Agent Mozilla/5.0 (Windows; U; Windows NT 5.1; en-US; rv:1.9.1.3) Gecko/20090824 Firefox/3.5.3 (.NET CLR 3.5.30729)
#request_header_replace Accept */*
#request_header_replace Accept-Encoding gzip # May cause issues should TEST
#request_header_replace Accept-Language en
#
## Some of these should be reply_header_access
#request_header_access Accept allow all
#request_header_access Accept-Encoding allow all
#request_header_access Accept-Language allow all
#request_header_access Authorization allow all
#request_header_access Cache-Control allow all
##request_header_access Content-Disposition allow all
#request_header_access Content-Encoding allow all
#request_header_access Content-Length allow all
##request_header_access Content-Location allow all
#request_header_access Content-Range allow all
#request_header_access Content-Type allow all
#request_header_access Cookie allow all
#request_header_access Expires allow all
#request_header_access Host allow all
#request_header_access If-Modified-Since allow all
##request_header_access Location allow all
#request_header_access Range allow all
#request_header_access Referer allow all
#request_header_access Set-Cookie allow all
#request_header_access User-Agent deny all
#request_header_access WWW-Authenticate allow all
#request_header_access All deny all
```

To enable syslog logging we need to add the `-s` flag to `SQUID_OPTS` in
`/etc/sysconfig/squid`.

```
# Squid options (additionally log to syslog)
SQUID_OPTS="-s"

# Time to wait for Squid to shut down when asked. Should not be necessary
# most of the time.
SQUID_SHUTDOWN_TIMEOUT=100

# default squid conf file
SQUID_CONF="/etc/squid/squid.conf"
```

Enable and start the service:

```
systemctl enable squid.service
systemctl start squid.service
```

## Firewall

Allow access to the squid proxy from within the airlock, and the normal ports
outbound.

```
# Allow access to the local squid proxy server (mostly for updates)
-A INPUT  -m tcp -p tcp --dport 3128 -s 10.0.0.0/24 -j ACCEPT

# Allow squid to make FTP/HTTP(S) requests on behalf of the other machines in
# the network
-A OUTPUT -m tcp -p tcp --dport 21  -j ACCEPT
-A OUTPUT -m tcp -p tcp --dport 80  -j ACCEPT
-A OUTPUT -m tcp -p tcp --dport 443 -j ACCEPT
```

Other clients on the network will need to be able to talk to the squid port.

```
-A OUTPUT -m tcp -p tcp --dport 3128 -d 10.0.0.170 -j ACCEPT
```

## A Note on Non-Standard Ports

It is highly recommended to run squid on a non-standard port if it is going to
be exposed to the internet. The catch is that this will throw SELinux for a
loop. The following command will tell SELinux to be ok with squid running on
port 11637.

```
[root@localhost ~]# semanage port -a -t http_cache_port_t -p tcp 11637
```

This may be necessary if squid needs to listen on multiple ports (for example
for dansGuardian with kerberos authentication).

## Viewing Statistics

On the squid server you can run a report to see the status of squid with the
"squidclient" command like so:

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

To get yum working with the proxy add the following line to the `[main]`
section of /etc/yum.conf file.

```ini
proxy=http://10.0.0.170:3128
```

If authentication is required the two following lines can always be added:

```ini
proxy_username=username
proxy_password=password
```

To setup general proxy use on the system for various command line utilities
like `wget`, `curl`, and `lynx`, there are a set of common environment variable
to set. I created a file `/etc/profile.d/proxy.sh` with the following contents
and make it executable.

```
# General proxy configuration for system tools
export http_proxy=squid.local.tld:3128
export https_proxy=squid.local.tld:3128
export ftp_proxy=squid.local.tld:3128
export ALL_PROXY=squid.local.tld:3128
export no_proxy=.i.0x378.net
export NO_PROXY=.i.0x378.net
```

You can include credentials by prepending the `user:pass@` to the hosts of the
protocols above.

[1]: ../squid_guard/

