---
title: Apache
weight: 68

aliases:
  - /notes/httpd/

taxonomies:
  tags:
  - linux
  - web_server

extra:
  done: true
  outdated: true
---

Apache or httpd is a strong and well tested webserver.

## Installation

To install the Apache web server for this hardening guide on fedora run the
following command as root:

```
[root@localhost] ~# yum install httpd mod_evasive mod_gnutls mod_security mod_selinux -y
```

A few modules I need to look into (TODO):

* `mod_log_post`

## Security Notes

Apache starts up using root privileges initially. Dropping the privileges is
highly recommended as soon as possible (which it does if alternative
credentials are supplied in it's configuration).

Additionally, the Apache web server can be used to remotely execute dynamic
code if a vulnerability is found with the privileges the process is running as.
This could be very dangerous... The languages allowed to be executed should be
chosen wisely and hardened appropriately.

User credentials can be passed through the web server so it is strongly
recommended that SSL certificates be used. If SSL certificates are available
there are very few reasons not to use SSL everywhere.

The only exception I have been able to come up with is for an application that
is extremely latency sensitive, contains no sensitive data, and have the data
verified in a different way (through data signatures like HMAC or GPG). The
latter is not necessarily required.

### Firewall Adjustments

By default Apache only runs on port 80 using TCP, if SSL is enabled it will
also use port 443 over SSL. Additional ports can be configured by the admin.

```
-A SERVICES -m tcp -p tcp --dport 80 -j ACCEPT
-A SERVICES -m tcp -p tcp --dport 443 -j ACCEPT
```

This service is very sensitive to the flood attack rules. It is recommended
these be adjusted to allow twice the maximum number of connections expected
during a time frame or alternatively to allow traffic on these two ports too
bypass the anti-flood rules.

## Performance Notes

If you use `mod_security` you should note that in my testing each Apache thread
increases it's resident memory size by ~27Mb using the stock configuration. For
servers that need to handle a high volume of requests this may not be
acceptable. If using `mod_security` you DEFINITELY need to adjust the
`ServerLimit` and `MaxClients` (they are aliases of each other so should always
be the same).

### Tuning ServerLimit/MaxClients with the worker MPM

* Start up the apache server
* Use the `ps` utility to determine the size of client threads (will be in Kb)
* Determine that max amount of RAM the apache process should be allowed to use
* Subtract the `parent` processes RAM from that
* Divide the remaining RAM by the size of the client threads, this is your
  ServerLimit / MaxClient value

An example of this is provided below:

```
[root@localhost ~]# /etc/init.d/httpd start
Starting httpd:                                            [  OK  ]
[root@localhost ~]# ps aux -u apache | grep httpd
root      2238  0.7  0.4 177132  9312 ?        Ss   10:45   0:00 /usr/sbin/httpd
apache    2240  0.0  0.2 177132  5124 ?        S    10:45   0:00 /usr/sbin/httpd
apache    2241  0.0  0.2 177132  5124 ?        S    10:45   0:00 /usr/sbin/httpd
apache    2242  0.0  0.2 177132  5124 ?        S    10:45   0:00 /usr/sbin/httpd
apache    2243  0.0  0.2 177132  5124 ?        S    10:45   0:00 /usr/sbin/httpd
apache    2244  0.0  0.2 177132  5124 ?        S    10:45   0:00 /usr/sbin/httpd
apache    2245  0.0  0.2 177132  5124 ?        S    10:45   0:00 /usr/sbin/httpd
apache    2246  0.0  0.2 177132  5124 ?        S    10:45   0:00 /usr/sbin/httpd
apache    2247  0.0  0.2 177132  5124 ?        S    10:45   0:00 /usr/sbin/httpd
root      2249  0.0  0.0 103376   832 pts/0    S+   10:45   0:00 grep --color=auto httpd
[root@localhost ~]# PARENTMEMORY=$((9312/1024))
[root@localhost ~]# CHILDMEMORY=$((5124/1024))
[root@localhost ~]# APACHERAM=1024
[root@localhost ~]# echo $(($(($APACHERAM-$PARENTMEMORY))/$CHILDMEMORY))
203
```

The parent process will have a running user of 'root', all of the children
processes will have 'apache'. In the above example the parent process is using
9312Kb of memory or ~9Mb, the child process is using 5124Kb or ~5Mb, and we're
allowing Apache to use up to 1Gb of memory (1024Mb). With that knowledge we can
see that we should set ServerLimit and MaxClients to "203" each.

## Configuration

* [/etc/httpd/conf/httpd.conf](httpd.conf)

This is the main configuration file. This differs quite a bit from the
configuration files that come with most distributions, most notably most of the
modules are disabled and sections of the config are only applicable if certain
modules are loaded. This preserves compatibility with any functionality I may
need in the future while removing the bloat of the modules.

To use this configuration you'll need to create the directory
`/var/www/html/default`. Any additional domains should be created in
`/var/www/html` with their domain name as the folder name.

* [/etc/httpd/conf.d/php.conf](php.conf)

This file is being included here as it will be needed most places that I run
Apache. Please refer to the PHP section below for more information.

* [/etc/httpd/conf.d/mod_evasive.conf](mod_evasive.conf)

`mod_evasive` is a crafty little module designed to limit the impact of DoS and
DDoS attacks. This won't stop them but it will help defend against them. It
will also send notices to an admin if desired (it's an optional feature which
can be disabled).

The one potential problem I can see cropping up is with AJAX requests. Those
can come in fast and hard, and they are intentional and necessary, if that
becomes a problem (you'll get a 403 response when you trip and it will last for
DOSBlockingPeriod seconds) then play with the DOSPageCount setting and the
DOSSiteCount setting. Alternatively you can just program your AJAX clients to
understand what happened and to react accordingly.

* [/etc/httpd/conf.d/mod_gnutls.conf](mod_gnutls.conf)

The GnuTLS module provides SSL encryption for web requests. It's quite a bit
more flexible than `mod_ssl` though it hasn't been audited as thoroughly. It is
also considered an 'experimental' module for apache even though it's been in
the wild for two years.

* /etc/httpd/conf.d/mod_security.conf

WARNING: While this is a good module to have loaded it sextuples the amount of
memory used by child processes. You will need to tune the server's performance
settings accordingly. This may have a huge impact on high-traffic sites.

With that out of the way this is a very good application firewall to have as
part of the defense-in-depth doctrine, though it's configuration can be a
burden. The `mod_security` module gives your Apache Web server increased
ability to inspect and process input from Web clients before it's acted on by
the scripts or processes waiting for the input.

The `mod_security` module even lets you inspect Web server output before it's
transmitted back to clients. I love this feature: it allows you to watch out
for server responses that might indicate that other filters have failed and an
attack has succeeded!

With that said this isn't the file you should actually be looking at. Yes this
is where everything will get loaded but the stock Fedora `mod_security` for the
most parts loads up `mod_security` rules in other places including the Core
ModSecurity Rule Set which will get updated with the rest of your server.

The variables that you'll want to play around with are located in
`/etc/httpd/modsecurity.d/modsecurity_crs_10_config.conf` and if you want to
write your own rules in `/etc/httpd/modsecurity.d/modsecurity_localrules.conf`.

Some changes I'd recommend in
`/etc/httpd/modsecurity.d/modsecurity_crs_10_config.conf`:

* Uncomment the rule that limits argument name length to 100 characters
* Uncomment the rule that limits the value of an argument's length to 400
  characters
* Uncomment the rule that limits the total argument length to 64000 characters
* Review the restricted extension types

After keeping an eye on the logs for a few weeks and ensuring that there aren't
any false positives, you should change the line `SecDefaultAction
"phase:2,pass` to `SecDefaultAction "phase:2,deny,log,status:403"`.

* [/etc/httpd/conf.d/mod_selinux.conf](mod_selinux.conf)

The `mod_selinux` module allows us to extend SELinux contexts into individual
web applications or virtual hosts without impacting the memory usage of
individual child processes (The parent process seems to use about 100Kb of
memory more but this is negligible).

Since I don't use the built in apache authentication I'm limited to
restrictions based on virtual hosts, which is still a rather large gain of
security.

You can additionally adjust contexts based on the IP the user is connecting
from.

If you enable the environment module (`env_module`) in apache the domain may be
available for use within the application (it would be `SELINUX_DOMAIN`). This
hasn't been tested. With PHP you may need to add the `E` to the string
`variable_order`, and adjust `auto_globals_jit` in the `php.ini` file.

Changing contexts with the stock SELinux rules is denied! You will need to
create a SELinux policy to allow it.

### Virtual Host Contexts

To make use of this feature you need to define contexts within each of the
virtual host configuration directives after enabling `mod_selinux` by adding
the following line:

```
selinuxDomainVal    *:s0:c1
```

The trailing domain should be different for virtual host (the next one would be
c2).

### IP Based Contexts

You can set contexts based on the IP address being connected from by adding the
following line within a Directory definition:

```
SetEnvIf Remote_Addr "10.13.37.(25[0-5]|2[0-4][0-9]|[1-9]?[0-9])$" SELINUX_DOMAIN=*:s0:c1
```

* [/etc/httpd/conf.d/virtual_hosts.conf](virtual_hosts.conf)

This does not exist upon the default installation and will need to be created.
No certificates are automatically generated when you install the GnuTLS module,
if you need them you will need to generate them yourself.

* /etc/httpd/conf.d/welcome.conf

Delete this file, it has no use and should be removed.

## Virtual Hosts

Please note that name based virtual hosts are not supported on SSL connections
when using `mod_ssl`. They work quite well with `mod_gnutls` and browsers that
support SNI (Server Name Indication, as described in section 3.1 of
[RFC3546][1]). Compatibility with older browsers may be impacted.

### Name Based

Name based virtual hosts allow you to re-use an IP to host multiple websites.
This is only officially supported for unencrypted connections, however by using
the GnuTLS module you can easily set this up with SSL based hosts as well. An
example of how to use this can be seen in the `virtual_hosts.conf` file on this
page.

### IP Based

I don't really use these so I'm not including documentation, this section is
mostly so other people referencing this documentation can be aware that they
can have different virtual hosts bound to specific IP addresses rather than
hostnames.

## PHP

```
[root@localhost] ~# yum install php php-suhosin
```

Additional PHP packages that may be needed and that I've found very useful:

* php-mcrypt
* php-bcmath
* php-ldap
* php-snmp
* php-pdo
* php-mysql
* php-pecl-xdebug

* [/etc/php.ini](php.ini)

The following is for production use, `display_errors`,
`display_startup_errors`, `mysql.trace_mode` may be useful in development.

* [/etc/php.d/suhosin.ini](suhosin.ini)

This is the config file for the suhosin extension. If an application isn't
working check the logs generated by suhosin to see if it is the issue.

## Basic Authentication

Sometimes it's just needed to prevent access to something for a little while,
HTTP basic authentication can help! If you're using the hardened configuration
above you'll need to enable a few modules to actually use it and make sure that
a .htaccess file has permission to override `AuthConfig`. Add the following
lines if they aren't already there in the section where you load modules:

```
LoadModule auth_basic_module modules/mod_auth_basic.so
LoadModule authn_file_module modules/mod_authn_file.so
LoadModule authz_user_module modules/mod_authz_user.so
```

Additionally if you want to use group based authentication add:

```
LoadModule authz_groupfile_module modules/mod_authz_groupfile.so
```

First create a user to use for the login:

```
htpasswd -c .htpasswd demouser
```

Additional users can be added by omitting the `-c`.

Create or append the following to a `.htaccess` file in the directory you want
to protect:

```
AuthType Basic
AuthName "Some Name Describing the site"
AuthUserFile /path/to/.htpasswd
Require valid-user
```

That's it you'll have HTTP Basic authentication. If you want to use a group
file you'll need to change the setting in the `.htaccess` file to match:

```
AuthType Basic
AuthName "Some Name Describing the site"
AuthUserFile /path/to/.htpasswd
AuthGroupFile /path/to/.htgroups
Require group demogroup
```

And create a group file `.htgroups` with the following:

```
demogroup: demouser someotheruser
```

## Kerberos Authentication

* [Using mod_auth_kerb and Windows 2000/2003/2008R2 as KDC](http://www.grolmsnet.de/kerbtut/)

## Passenger

Before going through this you need to ensure that the tools for compiling ruby
are installed on the system these are listed in [Ruby][2].

Ensure that ruby is installed on the system as well as the development headers
needed to compile the passenger module, this is all done as root:

```
yum install ruby curl-devel ruby-devel httpd-devel apr-devel apr-util-devel -y
```

```
gem install passenger
passenger-install-apache2-module
```

I wasn't able to get this working at the current time as there is a bug in
passenger 3.0.12 that prevents it from being compiled with GCC 4.6.

[1]: https://www.ietf.org/rfc/rfc3546.txt
[2]: @/notes/ruby.md
