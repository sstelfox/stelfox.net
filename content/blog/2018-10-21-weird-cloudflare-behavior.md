---
created_at: 2018-10-21T22:36:09-0600
title: Weird CloudFlare Behavior
tags:
  - nginx
  - linux
  - cloudflare
---

While working on a replacement webserver, I encountered some odd behavior which
took a bit to track down to CloudFlare. This isn't a bug or an issue with
CloudFlare, it was just unexpected.

The server was configured to respond to `www.example.tld` as well as
`example.tld`, to both encrypted and unencrypted connections. Any requests to
the `www.` domain get redirected to `https://example.tld`. The config was
roughly:

```
server {
  listen 80;
  listen [::]:80;

  listen 443 ssl http2;
  listen [::]:443 ssl http2;

  server_name www.example.tld;

  # Valid / Basic SSL settings (omitted for brevity)

  return 301 https://example.tld$request_uri;
}
```

This worked fine. To match this config, I configured the unencrypted root
domain to redirect traffic from http to https with a config like the following:

```
server {
  listen 80;
  listen [::]:80;

  server_name example.tld;
  return 301 https://example.tld$request_uri;
}

server {
  listen 443 ssl http2;
  listen [::]:443 ssl http2;

  server_name example.tld;

  # Valid / Basic SSL settings (omitted for brevity)

  # Normal site config
}
```

When I attempted to go to the site, it performed the https redirect, but
continued to try to redirect the browser. CloudFlare was hitting my upstream on
the unencrypted port and always getting the redirect message.

I wanted to leave this in place so clients would have the same experience when
I bypassed CloudFlare's HTTP CDN proxy. The way I solved this was to simply
turn on 'Full (strict)' SSL setting to ensure CloudFlare also connected to my
upstream on HTTPS, and relied on the 'Always Use HTTPS' setting when CloudFlare
was active to maintain the same behavior. If you don't have a valid SSL
certificate (such as a self signed certificate) you'll have to use 'Full SSL'
instead.

Funnily enough, this is apparently [common enough][1] of an issue to be
mentioned directly in the Help for the SSL configuration within CloudFlare.

[1]: https://support.cloudflare.com/hc/en-us/articles/115000219871
