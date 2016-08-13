---
title: NGinx
type: note
---

# NGinx

## Dynamic Backend w/ Fallback

Sources:

* http://devblog.mixlr.com/2012/06/26/how-we-use-nginx-lua-and-redis-to-beta-ify-mixlr/
* http://wiki.nginx.org/HttpRedis2Module
* http://spin.atomicobject.com/2013/07/08/nignx-load-balancing-reverse-proxy-updated/

```
upstream redis {
  # TODO Properly configure this
  server redis-01.i.0x378.net:6379;
  keepalive 1024 single;

  redis2_connect_timeout 100ms;
  redis2_send_timeout 100ms;
  redis2_read_timeout 100ms;
  redis2_pass redis;
}

server {
  listen 443;

  # Include SSL stuff;

  # Log stuff
  access_log /var/log/nginx/access.log;

  # Local/Internal DNS resolver
  resolver 192.168.122.1;

  location / {
    # Don't do any magic to static files
    root '/var/www/assets.i.0x378.net';
    if (-f $request_filename) {
      break;
      # This probably needs some work
    }

    # TODO: Get this from Redis
    set $server 'app-01.i.0x378.net';
    set $port '80';

    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header Host $http_host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-Proto $scheme; # Should always be https

    # Intercept all errors, if one matches the error block sent the request to
    # a different backend
    proxy_intercept_errors on;
    error_page 502 = @fallback;

    proxy_pass http://$server:$port;
  }

  location @fallback {
    # Look this up, but pretty sure it means don't allow clients / HTTP
    # requests to access this.
    internal;
    proxy_pass http://fall-back-host.i.0x378.net:80/;
  }
}
```

## Cert

```
echo -e "AC\n\n \n \n\n*.i.0x378.net\n\n" | openssl req -new -x509 \
  -newkey rsa:2048 -keyout server.key -nodes -days 365 -out server.crt
```

And include some DH parameters.

```
openssl dhparam -rand - 2048 > server_dh.pem
```

I just dropped `server.{key,cert}` into `/etc/nginx/`, and a quick SSL
configuration to dump into the nginx configuration.

```
cat << EOF > /etc/nginx/conf.d/ssl.conf
server {
  listen 443;

  ssl on;

  ssl_certificate     /etc/nginx/server.crt;
  ssl_certificate_key /etc/nginx/server.key;

  ssl_dhparam /etc/nginx/server_dh.pem;

  ssl_session_timeout 5m;
  ssl_protocols TLSv1.2 TLSv1.1 TLSv1;

  ssl_ciphers 'ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-AES256-GCM-SHA384:kEDH+AESGCM:ECDHE-RSA-AES128-SHA256:ECDHE-ECDSA-AES128-SHA256:ECDHE-RSA-AES128-SHA:ECDHE-ECDSA-AES128-SHA:ECDHE-RSA-AES256-SHA384:ECDHE-ECDSA-AES256-SHA384:ECDHE-RSA-AES256-SHA:ECDHE-ECDSA-AES256-SHA:DHE-RSA-AES128-SHA256:DHE-RSA-AES128-SHA:DHE-RSA-AES256-SHA256:DHE-DSS-AES256-SHA:AES128-GCM-SHA256:AES256-GCM-SHA384:ECDHE-RSA-RC4-SHA:ECDHE-ECDSA-RC4-SHA:RC4-SHA:HIGH:!aNULL:!eNULL:!EXPORT:!DES:!3DES:!MD5:!PSK';
  ssl_prefer_server_ciphers on;

  add_header Strict-Transport-Security max-age=15768000;

  access_log /var/log/nginx/access.log;

  resolver 192.168.122.1;

  location / {
    # Don't do any magic to static files
    root '/var/www/default';
    index index.html;
  }
}
EOF
```

