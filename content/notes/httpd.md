---
title: HTTPd
---

***Note: This page is quite old and is likely out of date. My opinions may have
also changed dramatically since this was written. It is here as a reference
until I get around to updating it.***

Apache or httpd is a strong and well tested webserver.

## Installation

To install the Apache web server for this hardening guide on fedora run the
following command as root:

```
[root@localhost] ~# yum install httpd mod_evasive mod_gnutls mod_security \
  mod_selinux -y
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

### /etc/httpd/conf/httpd.conf

This is the main configuration file. This differs quite a bit from the
configuration files that come with most distributions, most notably most of the
modules are disabled and sections of the config are only applicable if certain
modules are loaded. This preserves compatibility with any functionality I may
need in the future while removing the bloat of the modules.

To use this configuration you'll need to create the directory
`/var/www/html/default`. Any additional domains should be created in
`/var/www/html` with their domain name as the folder name.

```
### Section 1: Global Environment

ServerTokens Prod
ServerRoot "/etc/httpd"
PidFile run/httpd.pid
Timeout 60
KeepAlive On
MaxKeepAliveRequests 100
KeepAliveTimeout 5

<IfModule prefork.c>
  StartServers    8
  MinSpareServers   5
  MaxSpareServers   20
  ServerLimit   256
  MaxClients    256
  MaxRequestsPerChild 5000
</IfModule>

# This isn't used by default in Fedora but can be by adjusting
# /etc/sysconfig/httpd
<IfModule worker.c>
  StartServers    4
  MaxClients    300
  MinSpareThreads   25
  MaxSpareThreads   75
  ThreadsPerChild   25
  MaxRequestsPerChild 0
</IfModule>

Listen 80

# Use to restrict by IP Address/Range
LoadModule authz_host_module modules/mod_authz_host.so

# Logging Modules
LoadModule log_forensic_module modules/mod_log_forensic.so
LoadModule log_config_module modules/mod_log_config.so
LoadModule logio_module modules/mod_logio.so

# Allow sending and detecting of mime types
LoadModule mime_module modules/mod_mime.so

# Header magic and compression
LoadModule headers_module modules/mod_headers.so
LoadModule expires_module modules/mod_expires.so
LoadModule deflate_module modules/mod_deflate.so

# Provides DirectoryIndex directive
LoadModule dir_module modules/mod_dir.so

# Disable if you don't need directory indexes
LoadModule autoindex_module modules/mod_autoindex.so

# Used by most MVC stuff
LoadModule rewrite_module modules/mod_rewrite.so

#LoadModule env_module modules/mod_env.so
#LoadModule setenvif_module modules/mod_setenvif.so
#LoadModule auth_basic_module modules/mod_auth_basic.so
#LoadModule authn_file_module modules/mod_authn_file.so
#LoadModule authn_alias_module modules/mod_authn_alias.so
#LoadModule authn_dbm_module modules/mod_authn_dbm.so
#LoadModule authn_default_module modules/mod_authn_default.so
#LoadModule authz_user_module modules/mod_authz_user.so
#LoadModule authz_owner_module modules/mod_authz_owner.so
#LoadModule authz_groupfile_module modules/mod_authz_groupfile.so
#LoadModule authz_dbm_module modules/mod_authz_dbm.so
#LoadModule authz_default_module modules/mod_authz_default.so
#LoadModule mime_magic_module modules/mod_mime_magic.so
#LoadModule vhost_alias_module modules/mod_vhost_alias.so
#LoadModule alias_module modules/mod_alias.so
#LoadModule cache_module modules/mod_cache.so
#LoadModule disk_cache_module modules/mod_disk_cache.so
#LoadModule ext_filter_module modules/mod_ext_filter.so
#LoadModule usertrack_module modules/mod_usertrack.so
#LoadModule dav_module modules/mod_dav.so
#LoadModule dav_fs_module modules/mod_dav_fs.so
#LoadModule actions_module modules/mod_actions.so
#LoadModule speling_module modules/mod_speling.so
#LoadModule suexec_module modules/mod_suexec.so
#LoadModule cgi_module modules/mod_cgi.so
#LoadModule ldap_module modules/mod_ldap.so
#LoadModule auth_digest_module modules/mod_auth_digest.so
#LoadModule authn_anon_module modules/mod_authn_anon.so
#LoadModule authnz_ldap_module modules/mod_authnz_ldap.so
#LoadModule userdir_module modules/mod_userdir.so
#LoadModule status_module modules/mod_status.so
#LoadModule include_module modules/mod_include.so
#LoadModule info_module modules/mod_info.so
#LoadModule negotiation_module modules/mod_negotiation.so
#LoadModule proxy_module modules/mod_proxy.so
#LoadModule proxy_balancer_module modules/mod_proxy_balancer.so
#LoadModule proxy_http_module modules/mod_proxy_http.so
#LoadModule proxy_connect_module modules/mod_proxy_connect.so
#LoadModule proxy_ftp_module modules/mod_proxy_ftp.so
#LoadModule cern_meta_module modules/mod_cern_meta.so
#LoadModule asis_module modules/mod_asis.so
#LoadModule unique_id_module modules/mod_unique_id.so

Include conf.d/*.conf

<IfModule status_module>
  ExtendedStatus Off
</IfModule>

User apache
Group apache

### Section 2: 'Main' server configuration

ServerAdmin sstelfox@bedroomprogrammers.net
UseCanonicalName Off
DocumentRoot "/var/www/html/default"

<Directory />
  Options FollowSymLinks
  AllowOverride None

  Order Deny,Allow
  Deny from all
</Directory>

<Directory "/var/www/html">
  # Indexes Includes FollowSymLinks SymLinksifOwnerMatch ExecCGI MultiViews
  Options Indexes SymLinksifOwnerMatch

  AllowOverride FileInfo AuthConfig Limit

  Order allow,deny
  Allow from all
</Directory>

<IfModule mod_userdir.c>
  # This module won't get loaded unless we want to use it so we should
  # make sure that it's properly configured
  UserDir disabled root
  UserDir public_html

  <Directory /home/*/public_html>
    AllowOverride AuthConfig Limit
    Options Indexes SymLinksIfOwnerMatch
    <Limit GET POST>
      Order allow,deny
      Allow from all
    </Limit>
    <LimitExcept GET POST>
      Order deny,allow
      Deny from all
    </LimitExcept>
  </Directory>
</IfModule>

DirectoryIndex index.html

AccessFileName .htaccess
<Files ~ "^\.ht">
  Order allow,deny
  Deny from all
</Files>

TypesConfig /etc/mime.types
DefaultType text/plain

<IfModule mod_mime_magic.c>
  MIMEMagicFile conf/magic
</IfModule>

HostnameLookups Off

# Disable these if we need to serve files from NFS
EnableMMAP On
EnableSendfile On

ErrorLog logs/error_log
LogLevel warn

LogFormat "%v %h %t \"%r\" %>s %b \"%{Referer}i\" \"%{User-Agent}i\" \"%{forensic-id}n\" %I %O %T" combined
LogFormat "%v %h %t \"%r\" %>s %b" common
LogFormat "%v %{Referer}i -> %U" referer
LogFormat "%v %{User-agent}i" agent

CustomLog logs/access_log combined
ForensicLog logs/forensic_log

ServerSignature Off

<IfModule mod_dav_fs.c>
  DAVLockDB /var/lib/dav/lockdb
</IfModule>

<IfModule autoindex_module>
  Alias /icons/ "/var/www/icons/"
  <Directory "/var/www/icons">
    Options SymLinksIfOwnerMatch
    AllowOverride None

    Order allow,deny
    Allow from all
  </Directory>

  IndexOptions FancyIndexing VersionSort NameWidth=* HTMLTable Charset=UTF-8

  AddIconByEncoding (CMP,/icons/compressed.gif) x-compress x-gzip

  AddIconByType (TXT,/icons/text.gif) text/*
  AddIconByType (IMG,/icons/image2.gif) image/*
  AddIconByType (SND,/icons/sound2.gif) audio/*
  AddIconByType (VID,/icons/movie.gif) video/*

  AddIcon /icons/binary.gif .bin .exe
  AddIcon /icons/binhex.gif .hqx
  AddIcon /icons/tar.gif .tar
  AddIcon /icons/world2.gif .wrl .wrl.gz .vrml .vrm .iv
  AddIcon /icons/compressed.gif .Z .z .tgz .gz .zip
  AddIcon /icons/a.gif .ps .ai .eps
  AddIcon /icons/layout.gif .html .shtml .htm .pdf
  AddIcon /icons/text.gif .txt
  AddIcon /icons/c.gif .c
  AddIcon /icons/p.gif .pl .py
  AddIcon /icons/f.gif .for
  AddIcon /icons/dvi.gif .dvi
  AddIcon /icons/uuencoded.gif .uu
  AddIcon /icons/script.gif .conf .sh .shar .csh .ksh .tcl
  AddIcon /icons/tex.gif .tex
  AddIcon /icons/bomb.gif core

  AddIcon /icons/back.gif ..
  AddIcon /icons/hand.right.gif README
  AddIcon /icons/folder.gif ^^DIRECTORY^^
  AddIcon /icons/blank.gif ^^BLANKICON^^

  DefaultIcon /icons/unknown.gif

  AddDescription "GZIP compressed document" .gz
  AddDescription "tar archive" .tar
  AddDescription "GZIP compressed tar archive" .tgz
  AddDescription "BZIP2 compressed tar archive" .tar.bz2

  ReadmeName README.html
  HeaderName HEADER.html

  IndexIgnore .??* *~ *# HEADER* README* RCS CVS *,v *,t
</IfModule>

AddDefaultCharset UTF-8

# Compressed
AddType application/x-tar      .tgz
AddType application/x-compress .Z
AddType application/x-gzip     .gz .tgz

# Certificates
AddType application/x-x509-ca-cert .crt
AddType application/x-pkcs7-crl    .crl

# Audio
AddType audio/ogg     oga ogg

# Video
AddType video/ogg     ogv
AddType video/mp4     mp4
AddType video/webm    webm

# SVG
AddType image/svg+xmlsvg svgz
AddEncoding gzip         svgz

# Web Fonts
AddType application/vnd.ms-fontobject eot
AddType font/truetype                 ttf
AddType font/opentype                 otf
AddType application/x-font-woff       woff

# Assorted
AddType image/x-icon                   ico
AddType image/webp                     webp
AddType text/cache-manifest            appcache manifest
AddType text/x-component               htc
AddType application/x-chrome-extension crx
AddType application/x-xpinstall        xpi
AddType application/octet-stream       safariextz

# Add a bunch of compression directives
<IfModule mod_deflate.c>
  # 0 - 9 CPU/Bandwidth tradeoff
  DeflateCompressionLevel 7

  <IfModule mod_setenvif.c>
    <IfModule mod_headers.c>
      SetEnvIfNoCase ^(Accept-EncodXng|X-cept-Encoding|X{15}|~{15}|-{15})$ ^((gzip|deflate)\s,?\s(gzip|deflate)?|X{4,13}|~{4,13}|-{4,13})$ HAVE_Accept-Encoding
      RequestHeader append Accept-Encoding "gzip,deflate" env=HAVE_Accept-Encoding
    </IfModule>
  </IfModule>

  # html, txt, css, js, json, xml, etc:
  <IfModule filter_module>
    FilterDeclare COMPRESS
    FilterProvider  COMPRESS DEFLATE resp=Content-Type /text/(html|css|javascript|plain|x(ml|-component))/
    FilterProvider  COMPRESS DEFLATE resp=Content-Type /application/(javascript|json|xml|x-javascript)/
    FilterChain COMPRESS
    FilterProtocol  COMPRESS change=yes;byteranges=no
  </IfModule>

  # webfonts and svg:
  <FilesMatch "\.(ttf|otf|eot|svg)$" >
    SetOutputFilter DEFLATE
  </FilesMatch>
</IfModule>

<IfModule mod_include>
  AddType text/html .shtml
  AddOutputFilter INCLUDES .shtml
</IfModule>

#ErrorDocument 500 "The server just diagnosed itself with schizophrenia."
#ErrorDocument 404 /missing.html
#ErrorDocument 404 "/cgi-bin/missing_handler.pl"
#ErrorDocument 402 http://www.example.com/subscription_info.html

<IfModule mod_setenvif>
  BrowserMatch "Mozilla/2" nokeepalive
  BrowserMatch "MSIE 4\.0b2;" nokeepalive downgrade-1.0 force-response-1.0
  BrowserMatch "RealPlayer 4\.0" force-response-1.0
  BrowserMatch "Java/1\.0" force-response-1.0
  BrowserMatch "JDK/1\.0" force-response-1.0

  BrowserMatch "Microsoft Data Access Internet Publishing Provider" redirect-carefully
  BrowserMatch "MS FrontPage" redirect-carefully
  BrowserMatch "^WebDrive" redirect-carefully
  BrowserMatch "^WebDAVFS/1.[0123]" redirect-carefully
  BrowserMatch "^gnome-vfs/1.0" redirect-carefully
  BrowserMatch "^XML Spy" redirect-carefully
  BrowserMatch "^Dreamweaver-WebDAV-SCM1" redirect-carefully
</IfModule>

<IfModule status_module>
  <Location /server-status>
    SetHandler server-status
    Order deny,allow
    Deny from all
    Allow from 10.13.37.
        </Location>
</IfModule>

<IfModule info_module>
  <Location /server-info>
    SetHandler server-info
    Order deny,allow
    Deny from all
    Allow from 10.13.37.
  </Location>
</IfModule>

<IfModule mod_proxy>
  ProxyRequests On
  ProxyVia Block

  <Proxy *>
    Order deny,allow
    Deny from all
    Allow from 10.13.37.
  </Proxy>
  <IfModule mod_disk_cache.c>
    CacheEnable disk /
    CacheRoot "/var/cache/mod_proxy"
  </IfModule>
</IfModule>
```

### /etc/httpd/conf.d/php.conf

This file is being included here as it will be needed most places that I run
Apache. Please refer to the PHP section below for more information.

```
<IfModule prefork.c>
  LoadModule php5_module modules/libphp5.so
</IfModule>
<IfModule worker.c>
  LoadModule php5_module modules/libphp5-zts.so
</IfModule>

AddHandler php5-script .php
AddType text/html .php
AddType application/x-httpd-php-source .phps

DirectoryIndex index.php
```

### /etc/httpd/conf.d/mod_evasive.conf

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

```
LoadModule evasive20_module modules/mod_evasive20.so

<IfModule mod_evasive20.c>
  DOSHashTableSize  3097
  DOSPageCount    2
  DOSSiteCount    50
  DOSPageInterval   1
  DOSSiteInterval   1
  DOSBlockingPeriod 10
  #DOSEmailNotify   alerts@example.org
  DOSLogDir   "/var/lock/mod_evasive"
  #DOSWhitelist   192.168.0.*
</IfModule>
```

### /etc/httpd/conf.d/mod_gnutls.conf

The GnuTLS module provides SSL encryption for web requests. It's quite a bit
more flexible than `mod_ssl` though it hasn't been audited as thoroughly. It is
also considered an 'experimental' module for apache even though it's been in
the wild for two years.

```
LoadModule gnutls_module modules/mod_gnutls.so

GnuTLSCache dbm "/var/cache/mod_gnutls"
GnuTLSCacheTimeout 300

Listen 443
```

### /etc/httpd/conf.d/mod_security.conf

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

### /etc/httpd/conf.d/mod_selinux.conf

The `mod_selinux` module allows us to extend SELinux contexts into individual
web applications or virtual hosts without impacting the memory usage of
individual child processes (The parent process seems to use about 100Kb of
memory more but this is negligible).

Since I don't use the built in apache authentication I'm limited to
restrictions based on virtual hosts, which is still a rather large gain of
security.

You can additionally adjust contexts based on the IP the user is connecting
from.

```
LoadModule selinux_module modules/mod_selinux.so

selinuxServerDomain *:s0
selinuxDomainEnv  SELINUX_DOMAIN
```

If you enable the environment module (`env_module`) in apache the domain may be
available for use within the application (it would be `SELINUX_DOMAIN`). This
hasn't been tested. With PHP you may need to add the `E` to the string
`variable_order`, and adjust `auto_globals_jit` in the `php.ini` file.

Changing contexts with the stock SELinux rules is denied! You will need to
create a SELinux policy to allow it.

#### Virtual Host Contexts

To make use of this feature you need to define contexts within each of the
virtual host configuration directives after enabling `mod_selinux` by adding
the following line:

```
selinuxDomainVal    *:s0:c1
```

The trailing domain should be different for virtual host (the next one would be
c2).

#### IP Based Contexts

You can set contexts based on the IP address being connected from by adding the
following line within a Directory definition:

```
SetEnvIf Remote_Addr "10.13.37.(25[0-5]|2[0-4][0-9]|[1-9]?[0-9])$" SELINUX_DOMAIN=*:s0:c1
```

### /etc/httpd/conf.d/virtual_hosts.conf

This does not exist upon the default installation and will need to be created.
No certificates are automatically generated when you install the GnuTLS module,
if you need them you will need to generate them yourself.

```
NameVirtualHost *:80

<IfModule gnutls_module>
  NameVirtualHost *:443

  # Redirect all unencrypted connections which haven't been defined to the secure ones
  <VirtualHost _default_:80>
    RewriteEngine On
    RewriteCond %{HTTPS} off
    RewriteRule (.*) https://%{HTTP_HOST}%{REQUEST_URI}
  </VirtualHost>
</IfModule>

<VirtualHost _default_:443>
  GnuTLSEnable On
  GnuTLSPriorities SECURE
  GnuTLSCertificateFile /etc/pki/tls/certs/localhost.crt
  GnuTLSKeyFile /etc/pki/tls/private/localhost.key
</VirtualHost>

<VirtualHost *:443>
  ServerName something.example.org
  GnuTLSEnable On
  GnuTLSPriorities SECURE
  GnuTLSCertificateFile /etc/pki/tls/certs/something.example.org.crt
  GnuTLSKeyFile /etc/pki/tls/private/something.example.org.key
  DocumentRoot "/var/www/html/something.example.org"
</VirtualHost>
```

### /etc/httpd/conf.d/welcome.conf

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

### /etc/php.ini

The following is for production use, `display_errors`,
`display_startup_errors`, `mysql.trace_mode` may be useful in development.

```ini
[PHP]
short_open_tag = Off
asp_tags = Off
precision = 14
y2k_compliance = On
output_buffering = 4096
zlib.output_compression = Off
implicit_flush = Off
serialize_precision = 100
allow_call_time_pass_reference = Off
safe_mode = Off
open_basedir /var/www/html:/tmp
disable_functions = system, show_source, symlink, exec, dl, shell_exec, passthru, escapeshellarg, escapeshellcmd, pcntl_exec, phpinfo
expose_php = Off
max_execution_time = 30
max_input_time = 60
memory_limit = 128M
error_reporting = E_ALL | E_STRICT
display_errors = Off
display_startup_errors = Off
log_errors = On
log_errors_max_len = 1024
ignore_repeated_errors = Off
ignore_repeated_source = Off
report_memleaks = On
track_errors = Off
variables_order = "GPCS"
request_order = "GP"
register_globals = Off
register_long_arrays = Off
register_argc_argv = Off
auto_globals_jit = On
post_max_size = 8M
magic_quotes_gpc = Off
magic_quotes_runtime = Off
magic_quotes_sybase = Off
default_mimetype = "text/html"
enable_dl = Off
file_uploads = On
upload_max_filesize = 2M
allow_url_fopen = Off
allow_url_include = Off
default_socket_timeout = 15

[Date]
date.timezone = America/Montreal

[Syslog]
define_syslog_variables  = Off

[mail function]
sendmail_path = /usr/sbin/sendmail -t -i
mail.add_x_header = Off

[SQL]
sql.safe_mode = Off

[ODBC]
odbc.allow_persistent = On
odbc.check_persistent = On
odbc.max_persistent = -1
odbc.max_links = -1
odbc.defaultlrl = 4096
odbc.defaultbinmode = 1

[MySQL]
mysql.allow_persistent = On
mysql.max_persistent = -1
mysql.max_links = -1
mysql.default_port = 3306
mysql.connect_timeout = 15
mysql.trace_mode = Off

[MySQLi]
mysqli.max_links = -1
mysqli.default_port = 3306
mysqli.reconnect = Off

[PostgresSQL]
pgsql.allow_persistent = On
pgsql.auto_reset_persistent = Off
pgsql.max_persistent = -1
pgsql.max_links = -1
pgsql.ignore_notice = 0
pgsql.log_notice = 0

[Sybase-CT]
sybct.allow_persistent = On
sybct.max_persistent = -1
sybct.max_links = -1
sybct.min_server_severity = 10
sybct.min_client_severity = 10

[bcmath]
bcmath.scale = 0

[Session]
session.save_handler = files
session.save_path = "/var/lib/php/session"
session.use_cookies = 1
session.use_only_cookies = 1
session.name = UNCID
session.auto_start = 0
session.cookie_lifetime = 21600
session.cookie_path = /
session.serialize_handler = php
session.gc_probability = 1
session.gc_divisor = 1000
session.gc_maxlifetime = 1440
session.bug_compat_42 = Off
session.bug_compat_warn = Off
session.entropy_length = 16
session.entropy_file = /dev/urandom
session.cache_limiter = nocache
session.cache_expire = 180
session.use_trans_sid = 0
session.hash_function = 1
session.hash_bits_per_character = 5

[MSSQL]
mssql.allow_persistent = On
mssql.max_persistent = -1
mssql.max_links = -1
mssql.min_error_severity = 10
mssql.min_message_severity = 10
mssql.compatability_mode = Off
mssql.connect_timeout = 5
mssql.timeout = 15
mssql.textlimit = 4096
mssql.textsize = 4096
mssql.batchsize = 0
mssql.datetimeconvert = On
; This may need to be adjusted
mssql.secure_connection = Off
mssql.max_procs = -1

[Assertion]
assert.active = On
assert.warning = On
assert.bail = Off
assert.callback = 0

[Tidy]
tidy.clean_output = Off

[soap]
soap.wsdl_cache_enabled=1
soap.wsdl_cache_dir="/tmp"
soap.wsdl_cache_ttl=86400
```

### /etc/php.d/suhosin.ini

This is the config file for the suhosin extension. If an application isn't
working check the logs generated by suhosin to see if it is the issue.

```
extension = suhosin.so

[suhosin]
suhosin.log.syslog.facility = LOG_LOCAL2
suhosin.executor.max_depth = 15
suhosin.executor.include.max_traversal = 2
suhosin.executor.disable_eval = On
suhosin.executor.disable_emodifier = On
suhosin.mail.protect = 2
suhosin.session.cryptraddr = 2
suhosin.cookie.cryptraddr = 2
; This is not an official response, just funny :D
suhosin.filter.action = 418
suhosin.upload.disallow_elf = On
```

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

http://www.grolmsnet.de/kerbtut/

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

[1]: http://www.ietf.org/rfc/rfc3546.txt
[2]: {{< relref "notes/ruby.md" >}}
