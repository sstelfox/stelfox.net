---
title: One-Liner SSL Certificate Generation
date: 2014-03-28T14:52:51-04:00

aliases:
  - /blog/2014/03/one-liner-ssl-certificate-generation/
slug: one-liner-ssl-certificate-generation

taxonomies:
  tags:
  - linux
  - tips
---

I regularly find myself in need of generating a quick SSL key and certificate
pair. I've been using a one-liner for a while to generate these certificates.
No annoying user prompts just a quick fast certificate pair.

<!-- more -->

```sh
echo -e "XX\n\n \n \n\n$(hostname)\n\n" | openssl req -new -x509 -newkey \
  rsa:2048 -keyout service.key -nodes -days 90 -out service.crt &> /dev/null
```

The cert uses the hostname of whatever machine you generated it on. It should
under no circumstances be used for a production service. It's a 2048 bit key
and only valid for for roughly three months.
