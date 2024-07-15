---
created_at: 2013-01-01T00:00:01-0000
evergreen: false
public: true
tags:
  - linux
  - operations
  - security
title: Bind
slug: bind
---

# Bind

## Firewall Adjustments

A DNS server isn't very good unless other machines are able to query it. The following allows incoming DNS queries universally.

```iptables
-A INPUT -p udp -m udp --dport 53 -j ACCEPT
-A INPUT -p tcp -m tcp --dport 53 -j ACCEPT
```

If you're running named in a chroot you'll also need to add the following line to rsyslog's configuration file so that the chroot doesn't break named's logging.

```text
$AddUnixListenSocket /var/named/chroot/dev/log
```

## Config Files

### /etc/named.conf

```text
include "/etc/named.root.key";

// Allow no zone transfers. Any slaves should be added here.
acl "xfer" {
  none;
};

// This should include any internal and DMZ subnets so intranet and servers
// can query our internal zones. This also prevents outside hosts from using
// our name server as a resolver for other domains.
acl "trusted" {
  10.87.19.0/24;
  2001:abcd:ef::/64;
  fc00::/7;
  fe80::/10;
  127.0.0.1;
  ::1;
};

key "control-key" {
  algorithm hmac-md5;
  secret "##!!pulled-from-rndc.conf-generation!!##";
};

controls {
  inet 127.0.0.1 port 953 allow { 127.0.0.1; } keys { "control-key"; };
};

logging {
  channel default_syslog {
    severity debug;
    syslog local2;
  };

  channel audit_syslog {
    severity debug;
    syslog local3;
  };

  category default      { default_syslog; };

  category client       { audit_syslog; };
  category config       { default_syslog; };
  category dnssec       { audit_syslog; };
  category general      { default_syslog; };
  category lame-servers { audit_syslog; };
  category network      { audit_syslog; };
  category notify       { audit_syslog; };
  category queries      { audit_syslog; };
  category resolver     { audit_syslog; };
  category security     { audit_syslog; default_syslog; };
  category update       { audit_syslog; };
  category xfer-in      { audit_syslog; };
  category xfer-out     { audit_syslog; };
};

options {
  listen-on port 53     { any; };
  listen-on-v6 port 53  { any; };

  directory           "/var/named";
  dump-file           "/var/named/data/cache_dump.db";
  statistics-file     "/var/named/data/named_stats.txt";
  memstatistics-file  "/var/named/data/named_mem_stats.txt";
  zone-statistics     yes;

  // Override the version information to reduce enumeration options
  version "It's over 9000";

  // More efficient zone transfers
  transfer-format many-answers;

  // Set the maximum time a zone transfer can take. Any zone transfer that
  // takes longer than 15 minutes is unlikely to ever complete. If there are
  // HUGE zone files this may become an issue.
  max-transfer-time-in 15;

  // With no dynamic interfaces, bind doesn't need to poll for interface state
  interface-interval 0;

  dnssec-enable     yes;
  dnssec-validation yes;
  dnssec-lookaside  auto;

  // ISC DLV key
  bindkeys-file           "/etc/named.iscdlv.key";
  managed-keys-directory  "/var/named/dynamic";

  // Only accept queries and cached queries from the trusted ACL
  allow-query       { trusted; };
  allow-query-cache { trusted; };
};

// Trusted portion of the split-horizon DNS containing internal domains,
// private records, as well as allow recursive lookups.
view "internal-in" in {
  match-clients { trusted; };
  recursion yes;

  additional-from-auth yes;
  additional-from-cache yes;

  // Zone transfers limited to members of the "xfer" ACL
  allow-transfer { xfer; };
  zone "." IN {
    type hint;
    file "named.ca";
  };

  zone "1057.name" IN {
    type master;
    file "data/internal/1057.name.zone.db";
    allow-update { none; };
  };

  zone "19.87.10.in-addr.arpa" IN {
    type master;
    file "data/internal/19.87.10.in-addr.arpa.zone.db";
    allow-update { none; };
  };

  zone "0.0.0.0.f.e.0.0.d.c.b.a.1.0.0.2.ip6.arpa" IN {
    type master;
    file "data/internal/0.0.0.0.f.e.0.0.d.c.b.a.1.0.0.2.arpa.zone.db";
    allow-update { none; };
  };

  include "/etc/named.rfc1912.zones";
};

// Untrusted/External portion of the split-horizon DNS, only allow internal
view "external-in" in {
  match-clients { any; };
  recursion no;

  additional-from-auth no;
  additional-from-cache no;

  zone "." IN {
    type hint;
    file "named.ca";
  };

  zone "1057.name" IN {
    type master;
    file "data/public/1057.name.zone.db";
    allow-query   { any; };
    allow-update  { none; };
  };

  zone "0.0.0.0.f.e.0.0.d.c.b.a.1.0.0.2.ip6.arpa" IN {
    type master;
    file "data/public/0.0.0.0.f.e.0.0.d.c.b.a.1.0.0.2.arpa.zone.db";
    allow-query   { any; };
    allow-update  { none; };
  };
};

// View for users attempting to query the server using the CHAOS class. Trusted
// users can still use this to query for the servers version number.
view "bind-chaos" chaos {
  match-clients { any; };
  recursion no;

  zone "bind" {
    type master;
    file "db.bind";

    allow-query     { trusted; };
    allow-transfer  { none; };
  };
};
```

### /etc/rndc.conf

This needs to be generated on your own which can be done using the following command:

```console
$ rndc-confgen -b 512 > /etc/rndc.conf
```

The commented out code belongs in "/etc/named.conf", just replace the following comment with the code:

```text
## INCLUDE KEY AND CONFIG FROM /etc/rndc.conf ##
```

512 is unfortunately the strongest bit size available for authentication so it is strongly recommended to firewall off and limit the IP addresses the control channel is running on. By default this is exclusively the IPv4 loopback address.

### /var/named/db.bind

```text
$TTL 86400
@   CHAOS    SOA   @   rname.invalid.  (
    0   ; serial
    1D  ; refresh
    1H  ; retry
    1W  ; expire
    3H  ; minimum
)

    NS    @

version.bind.   CHAOS TXT "It's over 9000"
authors.bind.   CHAOS TXT "Nom de plume"
```

### /var/named/data/internal/1057.name.zone.db

```text
$TTL 86400
@   IN    SOA   ns1.1057.name.    dns.1057.name.  (
  2012080801  ; Serial number YYYYMMDDNN
  43200       ; Refresh
  7200        ; Retry
  2592000     ; Expire
  3600        ; Min TTL
)

      NS          ns1.1057.name.

ns1   IN    A         10.87.19.15
ns1   IN    AAAA      2001:abcd:ef::1059:afc:5bb:aa92
```

### /var/named/data/internal/19.87.10.in-addr.arpa.zone.db

```text
$TTL 86400
@   IN    SOA   ns1.1057.name.    dns.1057.name.  (
  2013020801  ; Serial number YYYYMMDDNN
  43200       ; Refresh
  7200        ; Retry
  2592000     ; Expire
  3600        ; Min TTL
)

      NS          ns1.1057.name.

15     IN    PTR       ns1.1057.name.
```

### /var/named/data/internal/0.0.0.0.f.e.0.0.d.c.b.a.1.0.0.2.arpa.zone.db

```text
$TTL 86400
@   IN    SOA   ns1.1057.name.    dns.1057.name.  (
  2013020801  ; Serial number YYYYMMDDNN
  43200       ; Refresh
  7200        ; Retry
  2592000     ; Expire
  3600        ; Min TTL
)

      NS          ns1.1057.name.

2.9.1.1.b.b.5.0.c.f.a.0.9.5.0.1    IN    PTR    ns1.1057.name.
```

### /var/named/data/public/1057.name.zone.db

```text
$TTL 86400
@   IN    SOA   ns1.1057.name.    dns.1057.name.  (
  2012080801  ; Serial number YYYYMMDDNN
  43200       ; Refresh
  7200        ; Retry
  2592000     ; Expire
  3600        ; Min TTL
)

      NS          ns1.1057.name.

ns1   IN    A         4.2.2.2
ns1   IN    AAAA      2001:abcd:ef::1059:afc:5bb:aa92
```

### /var/named/data/public/0.0.0.0.f.e.0.0.d.c.b.a.1.0.0.2.arpa.zone.db

```text
$TTL 86400
@   IN    SOA   ns1.1057.name.    dns.1057.name.  (
  2013020801  ; Serial number YYYYMMDDNN
  43200       ; Refresh
  7200        ; Retry
  2592000     ; Expire
  3600        ; Min TTL
)

      NS          ns1.1057.name.

2.9.1.1.b.b.5.0.c.f.a.0.9.5.0.1    IN    PTR    ns1.1057.name.
```

## LDAP Backend

Using the package "bind-dyndb-ldap", an ldap backend can be used either exclusively or in addition to other zones. Configuring a simple authenticated ldap lookup can be done with something along the line of the following configuration:

```text
dynamic-db "my_db_name" {
  library "ldap.so";
  arg "uri ldap://ldap.example.com";
  arg "base cn=dns, dc=example, dc=com";
  arg "auth_method none";
  arg "cache_ttl 300";
};
```

With this configuration, the LDAP back-end will try to connect to server ldap.example.com with simple authentication, without any password. It will then do an LDAP subtree search in the "cn=dns,dc=example,dc=com" base for entries with object class idnsZone, for which the idnsZoneActive attribute is set to True.

For each entry it will find, it will register a new zone with BIND. The LDAP back-end will keep each record it gets from LDAP in its cache for 5 minutes.

It also supports SASL authentication methods which means we can use encrypted authentication and/or kerberos.

## IPv6 Slow down

If there is a local IPv6 network but it is unrouted bind will regularily attempt to contact other nameservers using IPv6 and doesn't seem to cache whether it was able to reach them or not.

This has a dramatically visible impact on the time it takes to query for a name. To prevent this there are really only two options, the first is to make the IPv6 network routeable, and the second is to put bind in IPv4 only mode. Neither solution is good, but the latter is the only feasible one (This does mean it won't even listen on an IPv6 port).

```console
$ echo 'OPTIONS="-4"' >> /etc/sysconfig/named
$ service named restart
```
