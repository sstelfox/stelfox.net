---
created_at: 2013-01-01T00:00:01-0000
updated_at: 2026-04-05T00:00:00-0000
evergreen: false
public: true
tags:
  - dns
  - linux
  - operations
  - security
title: Bind
aliases:
  - /notes/bind/
---

# Bind

## Ports and Protocols

A DNS server needs to be reachable by clients. The following ports are relevant for a BIND deployment:

| Port | Protocol | Direction | Description |
|------|----------|-----------|-------------|
| 53 | UDP | Inbound | DNS queries |
| 53 | TCP | Inbound | DNS queries and zone transfers |
| 953 | TCP | Loopback | rndc control channel |

If you're running named in a chroot you'll also need to add the following line to rsyslog's configuration file so that the chroot doesn't break named's logging.

```text
$AddUnixListenSocket /var/named/chroot/dev/log
```

## Configuration

### named.conf

The main [named.conf](named.conf) configuration sets up a split-horizon DNS with internal and external views, DNSSEC validation, syslog-based logging across multiple channels, and a CHAOS view that masks version information from untrusted clients. ACLs control which clients can query and perform zone transfers. You'll want to adjust the `trusted` ACL to match your own network ranges.

### CHAOS Zone

The [db.bind](db.bind) file provides a CHAOS class zone that returns custom responses for `version.bind` and `authors.bind` queries. This prevents external clients from fingerprinting your BIND version through CHAOS TXT queries.

### Zone Files

An [example forward zone](example-internal.zone.db) shows the basic structure for an internal authoritative zone with SOA, NS, A, and AAAA records. The serial number format follows the common YYYYMMDDNN convention for tracking zone updates.

An [example reverse zone](example-reverse.zone.db) demonstrates the PTR record layout for reverse DNS lookups in an `in-addr.arpa` delegation.

## Generating rndc Keys

The rndc configuration needs to be generated per-host using:

```console
$ rndc-confgen -b 512 > /etc/rndc.conf
```

The output includes a commented section containing the matching `key` and `controls` blocks that belong in your `named.conf`. Copy those into the appropriate location. Modern versions of BIND support stronger algorithms like hmac-sha256 for rndc key generation.

It is strongly recommended to firewall off and limit the IP addresses the control channel is running on. By default this is exclusively the IPv4 loopback address.

## LDAP Backend

Using the package "bind-dyndb-ldap", an LDAP backend can be used either exclusively or in addition to other zones. Configuring a simple authenticated LDAP lookup can be done with something along the lines of the following configuration:

```text
dynamic-db "my_db_name" {
  library "ldap.so";
  arg "uri ldap://ldap.example.com";
  arg "base cn=dns, dc=example, dc=com";
  arg "auth_method none";
  arg "cache_ttl 300";
};
```

With this configuration, the LDAP backend will try to connect to server ldap.example.com with simple authentication, without any password. It will then do an LDAP subtree search in the "cn=dns,dc=example,dc=com" base for entries with object class idnsZone, for which the idnsZoneActive attribute is set to True.

For each zone entry it finds, it will register a new zone with BIND. The LDAP backend will keep each record it gets from LDAP in its cache for 5 minutes.

It also supports SASL authentication methods which means you can use encrypted authentication and/or Kerberos.
