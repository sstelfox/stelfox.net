---
created_at: 2013-01-01T00:00:01-0000
title: Kerberos
tags:
  - linux
  - security
  - networking
  - services
aliases:
  - /notes/kerberos/
---
Kerberos is a secure network authentication system.

It is very important that system times are all very close for successful
authentication. You should configure NTP synchronization (chrony, ntpd, etc.)
to ensure the systems stay in sync.

## Master Configuration

Edit the configuration files (provided at the bottom).

Create the initial database for the realm, it will ask for a master password
for the database. DO NOT FORGET THIS!!

```
kdb5_util create -s
```

Create an administrator user, it will ask for the password ensure that it is
strong as this account will be able to create, delete, and see principal's
keys.

```
kadmin.local -q "addprinc <<username>>/admin"
```

Enable and start the KDC and kadmin services, then after the database has been started you'll need to create at least one normal
user, it will ask for a password for the account.

```
[root@localhost ~]# kadmin -p <<username>>/admin
kadmin:  addprinc <<username>>
```

### Slave

Please note these instructions are untested but they are believed to be
correct.

First we'll need to create an ACL file for the replication utility `kprop`. It
should live `/var/Kerberos/krb5kdc/kpropd.acl` and have the contents:

```
host/kdc1.home.bedroomprogrammers.net@BEDROOMPROGRAMMERS.NET
host/kdc2.home.bedroomprogrammers.net@BEDROOMPROGRAMMERS.NET
```

You'll need to create host keys for each of the kerberos servers if they
haven't been created already.

```
[root@localhost ~]# kadmin -p <<username>>/admin
kadmin:  addprinc -rand host/kdc1.home.bedroomprogrammers.net
kadmin:  addprinc -rand host/kdc2.home.bedroomprogrammers.net
```

You'll need to add the keys to the local keytab file on the primary KDC.

```
[root@localhost ~]# kadmin -p <<username>>/admin
kadmin:  ktadd host/kdc1.home.bedroomprogrammers.net
kadmin:  ktadd host/kdc2.home.bedroomprogrammers.net
```

Copy the keytab file from the primary KDC to the secondary server using an
encrypted transfer mechanism such as SCP.

```
[root@localhost ~]# scp /etc/krb5.keytab root@krb2.home.bedroomprogrammers.net:/etc/krb5.keytab
```

At this point you'll want to restart the master's service and then start up the
kdc on the slave server. Once the slave is setup you'll need to modify the `/etc/krb5.conf` on the
client machines and the master machine to include the FQDN of the slave in the
`[realms]` section for the appropriate domain. The `[realms]` section would
then look like:

```ini
[realms]
  BEDROOMPROGRAMMERS.NET = {
    kdc = kdc1.home.bedroomprogrammers.net
    kdc = kdc2.home.bedroomprogrammers.net
    admin_server = kdc1.home.bedroomprogrammers.net
  }
```

## Adding a New Host to the Domain

Hosts need the Kerberos client libraries and workstation tools installed. Be sure to copy the config file `/etc/krb5.conf` mentioned on this page to each
client machine.

```
[root@kerb-client ~]# kadmin -p <<username>>/admin
kadmin:  addprinc -randkey host/<<FQDN>>
kadmin:  ktadd -k /etc/krb5.keytab host/<<FQDN>>
```

You'll need to replace `<<FQDN>>` with the domain name of the host you're adding.
It will need a DNS entry matching this hostname.

## Network Ports

Kerberos uses the following ports that need to be accessible through any firewalls:

* **Port 88/tcp** - KDC authentication (needed by both servers and clients)
* **Port 749/tcp** - Kerberos administration (kadmin, should be restricted to admin hosts)

## Configuration Files

### /etc/krb5.conf

```ini
[logging]
  default = FILE:/var/log/krb5libs.log
  kdc = FILE:/var/log/krb5kdc.log
  admin_server = FILE:/var/log/kadmind.log

[libdefaults]
  default_realm = BEDROOMPROGRAMMERS.NET
  dns_lookup_realm = false
  dns_lookup_kdc = false
  ticket_lifetime = 24h
  renew_lifetime = 3d
  forwardable = true

[realms]
  BEDROOMPROGRAMMERS.NET = {
    kdc = kdc1.home.bedroomprogrammers.net
    admin_server = kdc1.home.bedroomprogrammers.net
  }

[domain_realm]
  .bedroomprogrammers.net = BEDROOMPROGRAMMERS.NET
  bedroomprogrammers.net = BEDROOMPROGRAMMERS.NET
  .home.bedroomprogrammers.net = BEDROOMPROGRAMMERS.NET
  home.bedroomprogrammers.net = BEDROOMPROGRAMMERS.NET
```

### /var/kerberos/krb5kdc/kadm5.acl

```
*/admin@BEDROOMPROGRAMMERS.NET  *
```

### /var/kerberos/krb5kdc/kdc.conf

```ini
[kdcdefaults]
  kdc_ports = 88
  kdc_tcp_ports = 88

[realms]
  BEDROOMPROGRAMMERS.NET = {
    master_key_type = aes256-cts
    acl_file = /var/kerberos/krb5kdc/kadm5.acl
    dict_file = /usr/share/dict/words
    admin_keytab = /var/kerberos/krb5kdc/kadm5.keytab
    supported_enctypes = aes256-cts:normal aes128-cts:normal
  }
```

## Notes on Cached Client Login

For roaming clients that may not always have connectivity to the KDC, SSSD can cache Kerberos credentials locally. This allows users to authenticate even when the KDC is unreachable, using previously cached tickets.
