---
date: 2017-10-20 19:59:02-04:00
title: Server Naming Convention
---

Over the years I've found myself using many different naming schemes for
servers under my control. I came across a [naming convention][1] that finally
feels correct. That blog post is quite well written and will let it stand on
its own. In the event it ever disappears the important bits (and those where
I've personalized it) are included here.

There are ultimately two or three DNS names that each host receives. The first
is a permanent unique identifier for the host. The blog post offers the
[mnemonic encoding][2] project as a way to generate the hostnames. I've built
[my own generator][3] that accomplishes the same effect with a vastly larger
potential space (not that I need it). It has the added bonus of generating
interesting names that are easy to talk about. Some samples (none real):

```
brave-noon-funeral.stelfox.net
obscured-dawn-bush.stelfox.net
striking-evening-moss.stelfox.net
```

The second name is a CNAME intended to be redirectable to new instances or
servers if an old one dies or otherwise needs to be decommissioned. This is
tied directly to the function of the machine, while letting the machine behind
the name be replaceable.

This name is a combination of a short purpose code, a serial number (indicating
the specific instances of the purpose), what environment it runs in
(production, staging, etc), a location code, and your domain. The blog post
also includes a country code but I've chose to leave that out.

The last name(s) are convenience names intended to expose services to users.
These domains are along the lines of `webmail.stelfox.net` and can point at
multiple instances of purpose names or unique instance names.

Serials are unique to the purpose and site and are zero padded integers (01,
02). Serials are only unique within their local location code. Environment
should not be taken into account when calculating the serial.

## List of Purposes

These three letter purpose codes are kind of arbitrary. For consistency this
documents the purpose codes I've generated for specific uses.

* app - Application server (non-web)
* sql - Database server
* ftp - SFTP server
* mta - Mail server
* dns - Name server
* cfg - Configuration management server (Puppet, Ansible, etc.)
* mon - Monitoring server (Nagios, Sensu, etc.)
* prx - Proxy / Load balancer (software)
* ssh - SSH jump / Bastion host
* sto - Storage server
* vcs - Version control software (Git)
* vmm - Virtual machine manager
* web - Web server
* cch - Cache server (Redis, Memcached, etc.)
* vpn - VPN server

## List of Environments

Similar to the purpose codes, these are the chosen three letter codes for
different environments.

* dev - Development
* tst - Testing
* stg - Staging
* prd - Production

## Location Codes

Location codes in the original blog post are broken into two segments the local
code based on the [United Nations Code for Trade and Transport Locations][4]
(UN/LOCODE) which is more specific than IATA airport codes and the country
code. For my uses I leave the country code out.

[1]: http://mnx.io/blog/a-proper-server-naming-scheme/
[2]: http://web.archive.org/web/20090918202746/http://tothink.com/mnemonic/wordlist.html
[3]: https://github.com/sstelfox/dotfiles/blob/master/bin/server_name_generator
[4]: http://www.unece.org/cefact/locode/service/location.html
