---
created_at: 2018-03-24T20:20:22-0600
evergreen: true
public: true
tags:
  - openldap
  - operations
  - linux
  - tips
title: Including LDIF Files in OpenLDAP
slug: including-ldif-files-in-openldap
---

While setting up and OpenLDAP server I found my distribution shipped with a couple of schema files, but no equivalent LDIF files. I found ways to convert the file using "slapcat" and "slaptest" and the files were valid on their own.

I was specifically trying to bootstrap an OpenLDAP server, with it's schema, from scratch for a CI/CD system to test against. To accomplish this I was making use of the "include" directive in a configuration LDIF file and saw some very odd behavior.

When I included the LDIF schema files that shipped with the software, I could include multiple of them back to back like so:

```ldif
include: file:///etc/openldap/schema/core.ldif
include: file:///etc/openldap/schema/cosine.ldif
include: file:///etc/openldap/schema/inetorgperson.ldif
```

When I included my converted file, it would successfully apply it, then just stop... I assumed at first that there was a syntax error, but there was no error. Everything contained in the included LDIF was present in the DIT. It had simply stopped.

After many frustrating attempts, and hours Googling, the result came down to... There was an empty line at the end of the file. I couldn't find any documentation about this behavior and identified it through dumb luck. For anyone that comes across this I hope this solves your issue as well.
