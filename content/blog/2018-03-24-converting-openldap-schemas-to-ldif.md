---
date: 2018-03-24T20:20:22-06:00
tags:
- openldap
- linux
- tips
title: Converting OpenLDAP Schemas to LDIF
---

I've been writing software to work against an OpenLDAP instance, with a highly
customized schema. The operators of the existing system only had the schema
files and searching around found several elaborate ways to convert the files
which I tried with mixed success. After doing the research to figure this out,
it became clear I could probably have used `slapcat` and have dumped the active
schema directly to LDIF.

As a sample of how I converted these, I'll use the `rfc2307bis.schema` file
which didn't seem to come with a matching LDIF file in the source distribution.
You'll need to identify the dependencies of the schema, which I've tended to
just do with trial and error. If a dependency is missing you'll receive an
error like the following:

```
5ab6f5a6 /etc/openldap/schema/cosine.schema: line 1084 objectclass: ObjectClass not found: "person"
```

You can identify the requisite schema file by grep'ing for the missing object
in the other schema files and adding it to the config. The `rfc2307.schema`
file depends on the `core.schema` and `cosine.schema` files. With this in mind
you can use the following script to convert the LDIF file:

```
SCHEMA_CONV_DIR="$(mktemp -d)"

cat << EOF > ${SCHEMA_CONV_DIR}/convert.conf
include /etc/openldap/schema/core.schema
include /etc/openldap/schema/cosine.schema
include /etc/openldap/schema/rfc2307bis.schema
EOF

slapcat -f ${SCHEMA_CONV_DIR}/convert.conf -F ${SCHEMA_CONV_DIR} -n 0 \
  -s "cn={2}rfc2307bis,cn=schema,cn=config" | sed -re 's/\{[0-9]+\}//' \
  -e '/^structuralObjectClass: /d' -e '/^entryUUID: /d' -e '/^creatorsName: /d' \
  -e '/^createTimestamp: /d' -e '/^entryCSN: /d' -e '/^modifiersName: /d' \
  -e '/^modifyTimestamp: /d' -e '/^$/d' > /etc/openldap/schema/rfc2307bis.ldif

rm -rf ${SCHEMA_CONV_DIR}
```

One important thing to note is the schema identifier in the slapcat command
`cn={2}rfc2307bis,cn=schema,cn=config`. The '{2}' there will be the line number
from the `convert.conf` file counting from 0 and will likely be different for
the schemas you're converting, and the name will be defined by the contents of
the schema file.

You'll also want to pay attention to the file names and make sure the inputs
and outputs match your expectations.
