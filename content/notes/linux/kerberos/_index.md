---
created_at: 2013-01-01T00:00:01-0000
updated_at: 2026-04-05T00:00:00-0000
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

The KDC database and configuration files live in different paths depending on
your distribution. RedHat/Fedora uses `/var/kerberos/krb5kdc/`, Debian/Ubuntu
uses `/var/lib/krb5kdc/`, and Arch uses `/var/lib/krb5kdc/`. Adjust the paths
below to match your system.

The main client configuration lives at `/etc/krb5.conf`:

[krb5.conf](krb5.conf)

The KDC configuration (`kdc.conf`) goes in the KDC data directory:

[kdc.conf](kdc.conf)

The admin ACL file (`kadm5.acl`) also lives in the KDC data directory and
controls which principals have admin access. A simple default grants full
access to any principal with an `/admin` suffix:

```
*/admin@EXAMPLE.COM  *
```

Once the configuration files are in place, create the initial database for the
realm. It will ask for a master password for the database. DO NOT FORGET THIS!!

```
$ kdb5_util create -s
```

Create an administrator user. It will ask for a password, make sure it is
strong as this account will be able to create, delete, and see principal keys.

```
$ kadmin.local -q "addprinc <<username>>/admin"
```

Enable and start the KDC and kadmin services. After the database has been
started you will need to create at least one normal user. It will ask for a
password for the account.

```
$ kadmin -p <<username>>/admin
kadmin:  addprinc <<username>>
```

### Slave

Please note these instructions are untested but they are believed to be
correct.

First you will need to create an ACL file for the replication utility `kprop`.
It should live in the KDC data directory as `kpropd.acl` and have the contents:

```
host/kdc1.example.com@EXAMPLE.COM
host/kdc2.example.com@EXAMPLE.COM
```

You will need to create host keys for each of the Kerberos servers if they
have not been created already.

```
$ kadmin -p <<username>>/admin
kadmin:  addprinc -rand host/kdc1.example.com
kadmin:  addprinc -rand host/kdc2.example.com
```

You will need to add the keys to the local keytab file on the primary KDC.

```
$ kadmin -p <<username>>/admin
kadmin:  ktadd host/kdc1.example.com
kadmin:  ktadd host/kdc2.example.com
```

Copy the keytab file from the primary KDC to the secondary server using an
encrypted transfer mechanism such as SCP.

```
$ scp /etc/krb5.keytab root@kdc2.example.com:/etc/krb5.keytab
```

At this point you will want to restart the master's service and then start up
the KDC on the slave server. Once the slave is set up you will need to modify
the `/etc/krb5.conf` on the client machines and the master machine to include
the FQDN of the slave in the `[realms]` section for the appropriate domain.
The `[realms]` section would then look like:

```ini
[realms]
  EXAMPLE.COM = {
    kdc = kdc1.example.com
    kdc = kdc2.example.com
    admin_server = kdc1.example.com
  }
```

## Adding a New Host to the Domain

Hosts need the Kerberos client libraries and workstation tools installed. Be
sure to copy the config file `/etc/krb5.conf` mentioned on this page to each
client machine.

```
$ kadmin -p <<username>>/admin
kadmin:  addprinc -randkey host/<<FQDN>>
kadmin:  ktadd -k /etc/krb5.keytab host/<<FQDN>>
```

You will need to replace `<<FQDN>>` with the domain name of the host you are
adding. It will need a DNS entry matching this hostname.

## Network Ports

Kerberos uses the following ports that need to be accessible through any firewalls:

* **Port 88/tcp** - KDC authentication (needed by both servers and clients)
* **Port 749/tcp** - Kerberos administration (kadmin, should be restricted to admin hosts)

## Notes on Cached Client Login

For roaming clients that may not always have connectivity to the KDC, SSSD can cache Kerberos credentials locally. This allows users to authenticate even when the KDC is unreachable, using previously cached tickets.
