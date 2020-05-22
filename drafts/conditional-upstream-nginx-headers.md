---
date: 2020-05-22 18:00:05-04:00
tags:
- linux
- nginx
- tips
title: Conditional Upstream Nginx Headers
---

The way one of the development environments work that I'm apart of allow
conditionally sending traffic from production to other environments
selectively. This is roughly accomplished with dynamic Nginx upstreams which
can also be accomplished using maps. The following is a complete nginx sample
config that emulates this pretty well redirect the `/users/300/` path to a
staging upstream.

```
# Haven't finished this need to test...

upstream prodution_upstream {
  server application_backend.production:8000;
}

upstream staging_upstream {
  server application_backend.staging:8000;
}

map $request_uri $pool {
  default "production_upstream";

  ~^/users/300 "staging_upstream";
}

map $request_uri $pool_host {
  default $host;
}

server {
  listen 80;
  server_name production.example.tld;

  set_real_ip_from 172.16.0.0/12;

  location / {
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;

    proxy_pass http://$pool;
  }
}
```

The application servers rely on upstream headers from the production
environment to perform various security and sanity checks. The relevant one
here is the client's external address. This is normally passed in via
`X-Real-IP`.

I should address the `set_real_ip_from` not covering the use case.

```
# Only set this variable if the upstream isn't setting it for us, allows for
# the double nginx proxy weirdness we're doing with nginx while not breaking
# direct connections.
map $upstream_http_x_real_ip $real_ip_hdr {
  # volatile may not be needed test with and without...
  volatile;

  '' $remote_addr;
}

server {
  ...

  location / {
    ...
    proxy_set_header X-Real-IP $real_ip_hdr;
    ...
  }
}
```
