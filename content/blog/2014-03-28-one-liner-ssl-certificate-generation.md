---
date: 2014-03-28 14:52:51 -0400
slug: "one-liner-ssl-certificate-generation"
tags:
- linux
- openssl
- certificates
title: "One-Liner SSL Certificate Generation"
---

I regularily find myself in need of generating a quick SSL key and certificate
pair. I've been using a one-liner for a while to generate these certificates.
No annoying user prompts just a quick fast certificate pair.

```bash
echo -e "XX\n\n \n \n\n*\n\n" | openssl req -new -x509 -newkey rsa:2048 \
  -keyout service.key -nodes -days 90 -out service.crt &> /dev/null
```

A few notes about this, it is an ultimate wildcard matching any and all
hostnames with no location specific information, it should under no
circumstances be used for a production service. It's a 2048 bit key and only
valid for for roughly three months.
