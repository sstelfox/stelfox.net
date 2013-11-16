---
title: Yum
---

# Yum

Package update/installation utility.

## Security Notes

Changes packages installed on the server... very dangerous.

## Firewall Adjustments

Needs to be able to connect to Fedora mirrors usually use FTP, HTTP and HTTPS.

## Configuration

```
yum install yum-plugin-fastestmirror yum-plugin-security yum-presto \
  yum-plugin-changelog yum-plugin-protectbase -y
```

### /etc/yum.conf

```ini
[main]
cachedir=/var/cache/yum/$basearch/$releasever
keepcache=0
debuglevel=2
logfile=/var/log/yum.log
exactarch=1
obsoletes=1
gpgcheck=1
plugins=1
installonly_limit=3
metadata_expire=90m
```

### /etc/yum/pluginconf.d/changelog.conf

```ini
[main]
enabled=1
when=pre
always=true
```

### /etc/yum/pluginconf.d/fastestmirror.conf

```ini
[main]
enabled=1
verbose=1
always_print_best_host = true
socket_timeout=3
hostfilepath=timedhosts.txt
maxhostfileage=10
maxthreads=15
exclude=.gov, facebook
include_only=.org,.edu,.com,.net
```

### /etc/yum/pluginconf.d/presto.conf

```ini
[main]
enabled=1
```

### /etc/yum/pluginconf.d/protectbase.conf

```ini
[main]
enabled = 1
```

### /etc/yum/pluginconf.d/security.conf

```ini
[main]
enabled=1
```

## Repo Setup

Install a webserver and the helper utilities for managing repos.

```
yum install createrepo repoview nginx -y
```

Create a diffie-hellman parameter file for the webserver:

```
openssl dhparam -rand - 4096 > /etc/pki/tls/certs/dhparam.pem
```

We are also going to generate a super quick self-signed certificate for now
(and we its going to expire in 30 days to force us to replace it).

```
echo -e "AC\n\n \n \n\nrepo-01.i.0x378.net\n\n" | openssl req -new -x509 \
  -newkey rsa:4096 -keyout /etc/pki/tls/private/repo.key -nodes -days 30 \
  -out /etc/pki/tls/certs/repo.crt &> /dev/null
```

Create the base directories for the repo:

```
# Fedora 19 Base Repo
mkdir -p /var/www/repo-01.i.0x378.net/fedora/linux
cd /var/www/repo-01.i.0x378.net/fedora/linux

# Fedora Releases
mkdir -p releases/19/{Fedora,Everything}/{i386/os/Packages,i386/debuginfo/Packages,source/SRPMS,x86_64/os/Packages,x86_64/debuginfo/Packages}
mkdir -p releases/19/Fedora/i386/os/Packages/{a,b,c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t,u,v,w,x,y,z}
mkdir -p releases/19/Fedora/i386/debuginfo/Packages/{a,b,c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t,u,v,w,x,y,z}
mkdir -p releases/19/Fedora/x86_64/os/Packages/{a,b,c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t,u,v,w,x,y,z}
mkdir -p releases/19/Fedora/x86_64/debuginfo/Packages/{a,b,c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t,u,v,w,x,y,z}
mkdir -p releases/19/Everything/i386/os/Packages/{a,b,c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t,u,v,w,x,y,z}
mkdir -p releases/19/Everything/i386/debuginfo/Packages/{a,b,c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t,u,v,w,x,y,z}
mkdir -p releases/19/Everything/x86_64/os/Packages/{a,b,c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t,u,v,w,x,y,z}
mkdir -p releases/19/Everything/x86_64/debuginfo/Packages/{a,b,c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t,u,v,w,x,y,z}
mkdir -p releases/19/Everything/source/SRPMS/{a,b,c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t,u,v,w,x,y,z}

# Fedora Updates
mkdir -p updates/19/{i386,SRPMS,x86_64}

chown -R nginx:nginx /var/www/repo-01.i.0x378.net/
chmod 2775 /var/www/repo-01.i.0x378.net
```

Disable the default server configured on port 80.

Create a server config for the repo:

cat > /etc/nginx/conf.d/repo.conf <<EOF
server {
  listen 443;
  ssl on;

  # Certs sent to the client in SERVER HELLO are concatenated in ssl_certificate
  ssl_certificate /etc/pki/tls/certs/repo.crt;
  ssl_certificate_key /etc/pki/tls/private/repo.key;

  # Diffie-Hellman parameter for DHE ciphersuites, recommended 2048 or 4096 bits
  ssl_dhparam /etc/pki/tls/certs/dhparam.pem;

  ssl_session_timeout 5m;
  ssl_session_cache shared:NginxCache123:50m;
  ssl_protocols TLSv1.2 TLSv1.1 TLSv1;

  ssl_ciphers 'ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-AES256-GCM-SHA384:kEDH+AESGCM:ECDHE-RSA-AES128-SHA256:ECDHE-ECDSA-AES128-SHA256:ECDHE-RSA-AES128-SHA:ECDHE-ECDSA-AES128-SHA:ECDHE-RSA-AES256-SHA384:ECDHE-ECDSA-AES256-SHA384:ECDHE-RSA-AES256-SHA:ECDHE-ECDSA-AES256-SHA:DHE-RSA-AES128-SHA256:DHE-RSA-AES128-SHA:DHE-RSA-AES256-SHA256:DHE-DSS-AES256-SHA:AES128-GCM-SHA256:AES256-GCM-SHA384:ECDHE-RSA-RC4-SHA:ECDHE-ECDSA-RC4-SHA:RC4-SHA:HIGH:!aNULL:!eNULL:!EXPORT:!DES:!3DES:!MD5:!PSK';

  ssl_prefer_server_ciphers on;

  # Enable this if your want HSTS (recommended, but be careful)
  add_header Strict-Transport-Security max-age=15768000;

  # OCSP Stapling, fetch OCSP records from URL in ssl_certificate and cache
  # them
  #ssl_stapling on;
  #ssl_stapling_verify on;

  # Verify chain of trust of OCSP response using the root CA and any
  # intermediate certs
  #ssl_trusted_certificate /path/to/root_CA_cert_plus_intermediates;

  resolver 192.168.122.1;

  # <insert the rest of your server configuration here>
  server_name repo-01.i.0x378.net;

  location / {
    root      /var/www/repo-01.i.0x378.net;
    autoindex on;
  }
}
EOF

Open up port 443 on the firewall...

```
-A INPUT  -m tcp -p tcp --dport 443 -s 192.168.122.0/24 -m conntrack --ctstate NEW -j ACCEPT
```

Enable the webserver to start automatically:

```
systemctl enable nginx.service
```

Any standard packaged RPMs should be moved into
`/var/www/repo-01.i.0x378.net/fedora/linux/releases/19/Everything/x86_64/os/Packages/`.
Specifically the folder that matches the first letter of the package.

Debug RPMs should be moved into
`/var/www/repo-01.i.0x378.net/fedora/linux/releases/19/Everything/x86_64/debuginfo`.
Specifically the folder that matches the first letter of the package.

Source RPMs should be moved into
`/var/www/repo-01.i.0x378.net/fedora/linux/releases/19/Everything/source/SRPMS/`.
Specifically the folder that matches the first letter of the package.

Create the source repository:

```
cd /var/www/repo-01.i.0x378.net/fedora/linux/releases/19/Everything/source/SRPMS
createrepo .
```

Create the standard repository:

```
cd /var/www/repo-01.i.0x378.net/fedora/linux/releases/19/Everything/x86_64/os
createrepo .
```

Create the debug repository:

```
cd /var/www/repo-01.i.0x378.net/fedora/linux/releases/19/Everything/x86_64/debuginfo
createrepo .
```

You will also need to distribute a repository file that points at the server:

```ini
[0x378]
name=0x378 Private Repo $releasever - $basearch
failovermethod=priority
baseurl=https://repo-01.i.0x378.net/fedora/linux/releases/$releasever/Everything/$basearch/os/
enabled=1
priority=10
metadata_expire=7d
gpgcheck=1
gpgkey=file:///etc/pki/rpm-gpg/RPM-GPG-KEY-0x378-$releasever-$basearch

[0x378-updates]
name=0x378 Private Repo $releasever - $basearch - Updates
failovermethod=priority
baseurl=https://repo-01.i.0x378.net/fedora/linux/updates/$releasever/$basearch/
enabled=1
priority=10
gpgcheck=1
gpgkey=file:///etc/pki/rpm-gpg/RPM-GPG-KEY-fedora-$releasever-$basearch

[0x378-updates-debuginfo]
name=0x378 Private Repo $releasever - $basearch - Updates - Debug
failovermethod=priority
baseurl=https://repo-01.i.0x378.net/fedora/linux/updates/$releasever/$basearch/debug/
enabled=0
priority=10
gpgcheck=1
gpgkey=file:///etc/pki/rpm-gpg/RPM-GPG-KEY-fedora-$releasever-$basearch

[0x378-updates-source]
name=0x378 Private Repo $releasever - Updates Source
failovermethod=priority
baseurl=https://repo-01.i.0x378.net/fedora/linux/updates/$releasever/SRPMS/
enabled=0
priority=10
gpgcheck=1
gpgkey=file:///etc/pki/rpm-gpg/RPM-GPG-KEY-fedora-$releasever-$basearch

[0x378-debuginfo]
name=0x378 Private Repo $releasever - $basearch - Debug
failovermethod=priority
baseurl=https://repo-01.i.0x378.net/fedora/linux/releases/$releasever/Everything/$basearch/debug/
enabled=0
priority=10
metadata_expire=7d
gpgcheck=1
gpgkey=file:///etc/pki/rpm-gpg/RPM-GPG-KEY-0x378-$releasever-$basearch

[0x378-source]
name=0x378 Private Repo $releasever - Source
failovermethod=priority
baseurl=https://repo-01.i.0x378.net/fedora/linux/releases/$releasever/Everything/source/SRPMS/
enabled=0
priority=10
metadata_expire=7d
gpgcheck=1
gpgkey=file:///etc/pki/rpm-gpg/RPM-GPG-KEY-0x378-$releasever-$basearch
```

Along with that repository you should install `yum-plugin-priorities` to make
sure any rebuilt plugins are pulled out of the custom repo instead of the
standard ones.

