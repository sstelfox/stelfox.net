---
title: Squid
---

## Installation & Setup

* http://klaubert.wordpress.com/2008/01/09/squid-kerberos-authentication-and-ldap-authorization-in-active-directory/
* http://gofedora.com/how-to-configure-squid-proxy-server/
* http://wiki.squid-cache.org/ConfigExamples/Portal/Splash
* http://rosincore.blogspot.com/2010/01/dansguardian-content-filtering-with-ad.html
* http://eu.squid-cache.org/ConfigExamples/Authenticate/Kerberos
* http://wiki.squid-cache.org/Features/NegotiateAuthentication
* http://www.squid-cache.org/Versions/v3/3.1/cfgman/

```
yum install squid -y
```

Edited config file to reflect below (Note: IP addresses need to change
everytime this is used.)

```
# Lines starting with "acl" are actually aliases to be used in what
# are actually the ACLs
# Configuration reference:
# http://www.squid-cache.org/Versions/v3/3.1/cfgman/
# http://www.squid-cache.org/Versions/v3/3.1/cfgman/index_all.html
# https://calomel.org/squid.html
# Note to self search for "TODO" and "TEST"

########## CONFIGURATION ##########

# What IP & port we're listening on
http_port 10.1.1.30:3128

# Email address of the local cache manager in case cache dies, also shows up in
# error messages
cache_mgr admin@example.org

allow_underscore off      # Underscores are sometimes used in domains despite that it is against RFC compliance, this ensure STRICT name checking with check_hostnames
cache_effective_user squid    # "squid" is what gets forked too anyway but I like things explicit
cache_effective_group squid   # "squid" is what gets forked too anyway but I like things explicit
check_hostnames on      # Ensure that hostnames are RFC compliant (may impact performance, big security benefit)
client_db on        # Collect per-client statistics
coredump_dir /var/spool/squid   # Shouldn't be able to dump at all, but do it in a safe location
detect_broken_pconn on      # Automatically close broken persistent connections
dns_defnames off      # Require FQDN for any web requests
forwarded_for off     # Do not reveal client IP
ftp_passive on        # Allow passive FTP mode
ftp_sanitycheck on      # Ensure data connections go to the requested server
httpd_suppress_version_string on  # Don't announce squid version on error pages
ignore_unknown_nameservers on   # Don't accept DNS reponses from servers we don't talk too
request_header_max_size 20 KB   # (Default is 64) Might prevent buffer overflows, with the request rewriting these should be pretty small
reply_header_max_size 20 KB   # (Default is 64) Might prevent buffer overflows, with the reply rewriting these should be VERY small
strip_query_terms on      # Strip query terms in the logs (may want to turn off when debugging)
umask 027       # Minimum umask to enfore on files
uri_whitespace strip      # RFC2396 Recommendation
visible_hostname private.web.proxy  # Set a different hostname on error messages

# Various connection timeouts - Should TEST with/without these
connect_timeout 30 seconds
forward_timeout 30 seconds
read_timeout 30 seconds
request_timeout 30 seconds
persistent_request_timeout 1 minute

########## CACHE CONFIGURATION ##########

# <store type> <store location> <cache size in MB> <# of first level directories> <# of second level directories>
# aufs is the non-blocking disk storage option
cache_dir aufs /var/spool/squid 1024 16 256

cache_replacement_policy heap LFUDA # Least Frequently Used with Dynamic Aging (optimizes byte hit rate at the expense of hit rate since one large, popular object will prevent many smaller, slightly less popular objects from being cached.)
#cache_replacement_policy heap GDSF # Greedy-Dual Size Frequency (optimizes object hit rate by keeping smaller popular objects in cache so it has a better chance of getting a hit.)
cache_mem 128 MB      # Amount of RAM to use processing requests (Squid may use more)

# Cacheing rules for content that don't have explicit expire times
refresh_pattern ^ftp:   1440  20% 10080
refresh_pattern ^gopher:  1440  0%  1440
refresh_pattern -i (/cgi-bin/|\?) 0 0%  0
refresh_pattern .     0 20% 4320

########## SQUIDGUARD ##########

url_rewrite_program /usr/bin/squidGuard -c /etc/squid/squidGuard.conf
url_rewrite_bypass off

# Default is 5, these consume memory, but not enough will seriously
# impact performance of the proxy
url_rewrite_children 3

########## LOGGING ##########

# Record the request/response MIME headers for each HTTP transaction in the access log
log_mime_hdrs on

# <Client IP> <Username> [<Local Time>] "<Request Method> <Request URL> HTTP/<Protocol Version> <Response Status Code> \
# <Sent reply size (with hdrs)> <Referer> <User Agent> <Squid Request Status>:<Squid Hierarchy Status>
logformat combined %>a %un [%tl] "%rm %ru HTTP/%rv" %>Hs %<st "%{Referer}>h" "%{User-Agent}>h" %Ss:%Sh

# <Client IP> <Username> [<Local Time>] "<Sent Headers>" "<Reply Headers>"
logformat debugheaders %>a %un [%tl] "%>h" "%<h"

access_log /var/log/squid/squid.log squid
access_log /var/log/squid/access.log combined
# Sometimes useful for debugging
access_log /var/log/squid/header.log debugheaders

cache_store_log /var/log/squid/store.log
cache_log  /var/log/squid/cache.log

logfile_rotate 10

########## AUTHENTICATION ##########

# TODO: Figure out how to setup an authenticated/authorization proxy
# Useful config options:
# * auth_param
# * authenticate_ttl
# * authenticate_ip_ttl
# * max_user_ip

########## SSL BUMP ##########

# TODO: Figure out how to setup a CA on the proxy to force all requests
# to be encrypted. This would be a quick way to remove all CAs except
# mine from my browsers 

########## ERROR MESSAGES ##########

# TODO: Figure out custom error messages
# Useful config options:
# * error_directory
# * err_page_stylesheet
# * err_html_text
# * deny_info

# Include the error in email messages sent using the error pages mailto link
email_err_data on

########## BEGIN ACL ALIASES ##########

# Protocol based aliases
acl manager proto cache_object

# Source based aliases
acl localhost src 127.0.0.1/32 ::1 10.1.1.30/32
acl trustednets src 10.1.1.0/24 # Local subnetsacl allowproxy src 10.5.5.0/24 # Additional non-trusted subnets to proxy for
acl allowproxy src fc00::/7 # RFC4193 local private network range
acl allowproxy src fe80::/10 # RFC4291 link-local (directly plugged) machines

# Destination based aliases
acl to_localhost dst 127.0.0.0/8 ::1
acl to_trustednets dst 10.1.1.0/24 # Local subnets

# Port based aliases
acl SSL_ports port 443
acl Safe_ports port 21      # FTP
acl Safe_ports port 80      # HTTP
acl Safe_ports port 443     # HTTPS
acl Safe_ports port 1025-65535    # Unregistered/Unofficial ports

# Method based aliases
acl CONNECT method CONNECT

# Connection limit acls
acl trustednets_conn_limit maxconn 500
acl allowproxy_conn_limit maxconn 100

########## BEGIN ACLS ##########

# Selective access to the squid cache manager
http_access allow manager localhost
#deny_info "Only designated management machines are allowed to access the cache manager" manager
http_access deny manager

# Don't allow proxying to unsafe ports
http_access deny !Safe_ports

# CONNECT should only be used on known/trusted SSL ports
http_access deny CONNECT !SSL_ports

# Don't allow proxying to localhost, there may be applications
# running on 127.0.0.1 that are intentionally not exposed to
# outside services
http_access deny to_localhost

# Deny any requests to trustednets that don't come from the trusted
# nets.
http_access deny !trustednets to_trustednets

# Deny request's if they go over the imposed connection limits
http_access deny trustednets_conn_limit trustednets
http_access deny allowproxy_conn_limit allowproxy

# This sets up the splash page - this would be nifty but squid_session
# is bugged and fucking segfaults everytime it's run (which breaks
# squid...)
#external_acl_type session ttl=60 negative_ttl=0 children=1 concurrency=200 %SRC /usr/lib64/squid/squid_session -t 7200
#acl fresh_users external session
#deny_info http://127.0.0.1/splash.php fresh_users
#http_access deny !fresh_users

# List of aliases that are allowed to use this proxy
http_access allow trustednets
http_access allow allowproxy

# And finally deny all other access to this proxy
http_access deny all

########## PRIVACY/REQUEST MANGLING ##########

# Replace all client user agents with the most common (Accoring to the EFF 2010-01-27)
request_header_replace User-Agent Mozilla/5.0 (Windows; U; Windows NT 5.1; en-US; rv:1.9.1.3) Gecko/20090824 Firefox/3.5.3 (.NET CLR 3.5.30729)
request_header_replace Accept */*
request_header_replace Accept-Encoding gzip # May cause issues should TEST
request_header_replace Accept-Language en

# Some of these should be reply_header_access
request_header_access Accept allow all
request_header_access Accept-Encoding allow all
request_header_access Accept-Language allow all
request_header_access Authorization allow all
request_header_access Cache-Control allow all
#request_header_access Content-Disposition allow all
request_header_access Content-Encoding allow all
request_header_access Content-Length allow all
#request_header_access Content-Location allow all
request_header_access Content-Range allow all
request_header_access Content-Type allow all
request_header_access Cookie allow all
request_header_access Expires allow all
request_header_access Host allow all
request_header_access If-Modified-Since allow all
#request_header_access Location allow all
request_header_access Range allow all
request_header_access Referer allow all
request_header_access Set-Cookie allow all
request_header_access User-Agent deny all
request_header_access WWW-Authenticate allow all
request_header_access All deny all
```

For URL filtering please refer to the [SquidGuard][1] page.

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
[root@localhost ~]# squidclient -h 10.1.15.23 mgr:info
HTTP/1.0 200 OK
Server: squid
Mime-Version: 1.0
Date: Mon, 19 Sep 2011 16:35:22 GMT
Content-Type: text/plain
Expires: Mon, 19 Sep 2011 16:35:22 GMT
Last-Modified: Mon, 19 Sep 2011 16:35:22 GMT
X-Cache: MISS from squid-test.lounge.gentlemenslounge.org
X-Cache-Lookup: MISS from squid-test.lounge.gentlemenslounge.org:3128
Via: 1.0 squid-test.lounge.gentlemenslounge.org (squid)
Connection: close

Squid Object Cache: Version 3.1.15
Start Time:     Mon, 19 Sep 2011 16:34:26 GMT
Current Time:   Mon, 19 Sep 2011 16:35:22 GMT
Connection information for squid:
        Number of clients accessing cache:      2
        Number of HTTP requests received:       2
        Number of ICP messages received:        0
        Number of ICP messages sent:    0
        Number of queued ICP replies:   0
        Number of HTCP messages received:       0
        Number of HTCP messages sent:   0
        Request failure ratio:   0.00
        Average HTTP requests per minute since start:   2.1
        Average ICP messages per minute since start:    0.0
        Select loop called: 5056 times, 11.069 ms avg
Cache information for squid:
        Hits as % of all requests:      5min: 0.0%, 60min: 0.0%
        Hits as % of bytes sent:        5min: -0.0%, 60min: -0.0%
        Memory hits as % of hit requests:       5min: 0.0%, 60min: 0.0%
        Disk hits as % of hit requests: 5min: 0.0%, 60min: 0.0%
        Storage Swap size:      52692 KB
        Storage Swap capacity:   5.0% used, 95.0% free
        Storage Mem size:       108 KB
        Storage Mem capacity:    0.1% used, 99.9% free
        Mean Object Size:       10.21 KB
        Requests given to unlinkd:      0
Median Service Times (seconds)  5 min    60 min:
        HTTP Requests (All):   0.00000  0.00000
        Cache Misses:          0.00000  0.00000
        Cache Hits:            0.00000  0.00000
        Near Hits:             0.00000  0.00000
        Not-Modified Replies:  0.00000  0.00000
        DNS Lookups:           0.00000  0.00000
        ICP Queries:           0.00000  0.00000
Resource usage for squid:
        UP Time:        55.966 seconds

        CPU Time:       0.075 seconds
        CPU Usage:      0.13%
        CPU Usage, 5 minute avg:        0.00%
        CPU Usage, 60 minute avg:       0.00%
        Process Data Segment Size via sbrk(): 5244 KB
        Maximum Resident Size: 49472 KB
        Page faults with physical i/o: 1
Memory usage for squid via mallinfo():
        Total space in arena:    5376 KB
        Ordinary blocks:         5308 KB    136 blks
        Small blocks:               0 KB      0 blks
        Holding blocks:          1104 KB      4 blks
        Free Small blocks:          0 KB
        Free Ordinary blocks:      67 KB
        Total in use:            6413 KB 99%
        Total free:                67 KB 1%
        Total size:              6480 KB
Memory accounted for:
        Total accounted:          985 KB 15%
        memPool accounted:        985 KB 15%
        memPool unaccounted:     5495 KB 85%
        memPoolAlloc calls:     11736
        memPoolFree calls:      11825
File descriptor usage for squid:
        Maximum number of file descriptors:   1024
        Largest file desc currently in use:     19
        Number of file desc currently in use:   14
        Files queued for open:                   0
        Available number of file descriptors: 1010
        Reserved number of file descriptors:   100
        Store Disk files open:                   0
Internal Data Structures:
          5190 StoreEntries
            27 StoreEntries with MemObjects
            26 Hot Object Cache Items
          5161 on-disk objects
```

Notice that I used the external IP address of the server. I did this because we
aren't listening on 127.0.0.1 and won't be able to connect to it there, you'll
need to make sure that squid's external IP is listed in the "localhost" alias
as well.

## Configuration

### /etc/sysconfig/squid

```
# Squid options (additionally log to syslog)
SQUID_OPTS="-s"

# Time to wait for Squid to shut down when asked. Should not be necessary
# most of the time.
SQUID_SHUTDOWN_TIMEOUT=20

# default squid conf file
SQUID_CONF="/etc/squid/squid.conf"
```

## New notes

```
yum install squid -y
```

See the config above.

```
systemctl enable squid.service
systemctl start squid.service
```

Allow access to the squid proxy from within the airlock.

```
-A INPUT  -m tcp -p tcp --dport 3128 -s 10.0.0.0/24 -j ACCEPT
```

Other clients on the network will need to be able to talk to the squid port.

```
-A OUTPUT -m tcp -p tcp --dport 3128 -d 10.0.0.170 -j ACCEPT
```

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

```
proxy=http://10.0.0.170:3128
```

If authentication is required the two following lines can always be added:

```
proxy_username=username
proxy_password=password
```

[1]: ../squid_guard/

