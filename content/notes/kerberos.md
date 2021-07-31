---
title: Kerberos
weight: 83

taxonomies:
  tags:
  - linux
  - security

extra:
  done: true
---

Kerberos is a secure network authentication system.

It is very important that system times are all very close for successful
authentication. You should configure [NTPd][1] or [Chronyd][2] to ensure the
systems stay in sync.

## Root KDC Configuration

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

Set the services to startup automatically and start them up:

```
chkconfig krb5kdc on
chkconfig kadmin on
/etc/init.d/krb5kdc start
/etc/init.d/kadmin start
```

After the database has been started you'll need to create at least one normal
user, it will ask for a password for the account.

```
[root@localhost ~]# kadmin -p <<username>>/admin
kadmin:  addprinc <<username>>
```

## Peer KDC Configuration

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
kdc on the slave server:

```
[root@slave ~]# chkconfig krb5kdc start
[root@slave ~]# /etc/init.d/krb5kdc start
```

Once the Slave is setup you'll need to modify the `/etc/krb5.conf` on the
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

Hosts need `krb5-workstation` and `krb5-libs` installed. Make sure the client
firewall rules have been applied.

Be sure to copy the config file `/etc/krb5.conf` mentioned on this page to each
client machine.

```
[root@kerb-client ~]# kadmin -p <<username>>/admin
kadmin:  addprinc -randkey host/<<FQDN>>
kadmin:  ktadd -k /etc/krb5.keytab host/<<FQDN>>
```

You'll need to replace `<<FQDN>>` with the domain name of the host you're
adding. It will need a DNS entry matching this hostname.

## Firewall Configuration

Server Adjustments:

```
# Allow authentication to the KDC
-A INPUT -m tcp -p tcp --dport 88 -j ACCEPT
# Allow remote kerberos administration. This should probably be restricted more
-A INPUT -m tcp -p tcp --dport 749 -j ACCEPT
```

Client Adjustments:

```
# Allow authentication to the KDC
-A OUTPUT -m tcp -p tcp --dport 88 -j ACCEPT
```

Setting up a client machine to talk to the KDC will initially require this rule
as well:

```
# Temporarily need this to setup the connection with the KDC
-A OUTPUT -m tcp -p tcp --dport 749 -j ACCEPT
```

## Sample Configuration Files

* [/etc/krb5.conf](krb5.conf)
* [/var/kerberos/krb5kdc/kadm5.acl](kadm5.acl)
* [/var/kerberos/krb5kdc/kdc.conf](kdc.conf)

## Notes on Cached Client Login

* [Caching Kerberos credentials for offline logins](https://redhatcat.blogspot.com/2008/07/caching-kerberos-credentials-for.html)
* [Offline auth. with Kerberos and timeouts (pam_krb5.so, pam_ccreds.so)](https://ubuntuforums.org/showthread.php?t=1205604)
* [Authentication caching with nscd](https://www.techrepublic.com/blog/linux-and-open-source/authentication-caching-with-nscd/)
* [LDAP/Kerberos + nscd + libpam-ccreds + libpam-mklocaluser/pam_mkhomedir](http://people.skolelinux.org/pere/blog/Caching_password__user_and_group_on_a_roaming_Debian_laptop.html)

[1]: @/notes/ntpd.md
[2]: @/notes/chronyd.md
