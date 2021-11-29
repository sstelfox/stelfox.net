---
title: Dynamic DNS
weight: 67

date: 2016-01-22T16:07:13-05:00
updated: 2016-01-22T16:07:13-05:00

taxonomies:
  tags:
  - dhcp
  - linux
---

This guide intends to help you setup DDNS updates between an ISC DHCP server
and an authoritative NSD name server. We assume you have a DHCP server with the
following config:

<!-- more -->

```
# /etc/dhcp/dhcpd.conf

authoritative;
option domain-name "example.lab";
option domain-name-servers google-public-dns-a.google.com, google-public-dns-b.google.com;
ddns-update-style none;

subnet 10.0.0.0 netmask 255.255.255.0 {
  range 10.0.0.192 10.0.0.254;
  option routers 10.0.0.1;
}
```

And a working NSD server with the following minimal config:

```
# /etc/nsd/nsd.conf

zone:
  name: "example.lab"
  zonefile: "%s.zone"

zone:
  name: "10.in-addr.arpa"
  zonefile: "%s.zone"
```

It's expected that you already have the zone files setup for the two zones as
well. The domain doesn't have to be the top level domain and it's generally
recommended to keep DDNS clients in a separate delegated zone from statically
configured entries to prevent them from overriding them.

Now we need to generate a key that'll be used by the DHCP server to
authenticate updates to the DNS server. A lot of guides recommend using either
the `dnssec-keygen` or `ddns-confgen` utilities. I have neither pre-installed
and would rather avoid installing additional tools for a one-off task.
Ultimately what those tools are giving you is pre-formatting the output for the
appropriate tool.

I prefer HMAC-SHA256 as the security algorithm for the updates. It's well into
the computational complexity range of unfeasible to attack and is not to far
overboard as to overload either the DNS or DHCP servers. In high stress
environments you can certainly drop it back down to reduce the CPU load
required for updates.

For key generation, I tend to shoot for half of the hash strength for the key.
For SHA256 that means 128 bits for the key. This is mostly personal preference,
though I wouldn't go below that.

To generate the key I use the following command which should work pretty much
everywhere:

```
DDNS_KEY=$(dd status=none if=/dev/urandom bs=1 count=128 | base64 -w 0)
```

We'll start by configuring NSD to accept the signed updates with key. We're
going to put the NSD key config in it's own file and include it. First the
creation in the appropriate format:

```
cat << EOF > /etc/nsd/ddns-key.conf
key:
  name: "ddns_update_key"
  algorithm: hmac-sha256
  secret: "${DDNS_KEY}"
EOF
```

And protect it:

```
chown root:nsd /etc/nsd/ddns-key.conf
chmod 0640 /etc/nsd/ddns-key.conf
```

You'll need to edit your nsd.conf file with the following line *before* the
zones are defined:

```
include: /etc/nsd/ddns-key.conf
```

TODO: I have no idea if NSD supports updating records using DDNS... If it does
I'll need to figure out the per-zone config. Everything else will have been
setup correctly though...

Now to setup the DHCPd server. Like NSD we need to get an external config file
with our authentication key in:

```
cat << EOF > /etc/dhcp/ddns-key.conf
key ddns_update_key {
  algorithm HMAC-SHA256;
  secret "${DDNS_KEY}";
};
EOF
```

And protect this one to:

```
chown root:dhcp /etc/dhcp/ddns-key.conf
chmod 0640 /etc/dhcp/ddns-key.conf
```

The following config assumes that the master DNS server is located at
10.0.0.33. I added the following config file before the global options,
ensuring that I remove the 'ddns-update-style none;' entry from the config if
it's present.

```
ddns-updates off;
ddns-update-style interim;
ddns-hostname example.lab;
ddns-update-style standard;

ignore client-updates;
update-static-leases on;

include "/etc/dhcp/ddns.key";

zone example.lab. {
  primary 10.0.0.33;
  key ddns_update_key;
}

zone 10.in-addr.arpa. {
  primary 10.0.0.33;
  key ddns_update_key;
}
```

One final change is required to enable the updates. For each subnet definition
you want the DHCP server to subnet client updates for you'll want to add the
following entry:

```
ddns-updates on;
```

Reload the DHCP server and it should begin issuing updates.
