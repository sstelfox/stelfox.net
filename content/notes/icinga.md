---
title: Icinga
---

***Note: This page is quite old and is likely out of date. My opinions may have
also changed dramatically since this was written. It is here as a reference
until I get around to updating it.***

Icinga is a serious and awesome port of nagios. It properly modernizes it and
gives it all the stuff the nagios developers made into an "Enterprise only"
release just to be tool bags. Unfortunately at this time there aren't any handy
Fedora packages, but this should be [coming soon][1] with any luck.

However I seem to be lucky and found that the RHEL6 packages seem to work
perfectly on Fedora 15. You can get the packages [here][2]. There is a doc,
gui, idoutils, api and plain icinga packages, they should all be installed.
(Tested with 1.5.1-1).

Install `httpd` and `mysql-server`. Set everything to start up. Might need to
create a database like so:

```
[user@host ~]$ mysql -u root -p
mysql> CREATE DATABASE icinga;
 GRANT USAGE ON *.* TO 'icinga'@'localhost'
   IDENTIFIED BY 'icinga'
   WITH MAX_QUERIES_PER_HOUR 0
   MAX_CONNECTIONS_PER_HOUR 0
   MAX_UPDATES_PER_HOUR 0;
 GRANT SELECT , INSERT , UPDATE , DELETE
   ON icinga.* TO 'icinga'@'localhost';
 FLUSH PRIVILEGES ;
 quit
```

You need to turn selinux off for now... Yeah not my favorite either.

Create an htpasswd file in the icinga configuration directory and give apache
access too it:

```
[root@localhost ~]# htpasswd -c /etc/icinga/htpasswd.users admin
New password:
Re-type new password:
Adding password for user admin
[root@localhost ~]# chown icinga:apache /etc/icinga/htpasswd.users
```

It occurs to me that isn't enough...

```
[root@icinga etc]# chown -R icinga:apache /etc/icinga/
```

I edited this value in the /etc/icinga/icinga.cfg file:

```
icinga_group=apache
```

* http://docs.icinga.org/latest/en/icinga-web-scratch.html
* http://docs.icinga.org/latest/en/quickstart-idoutils.html

[1]: https://bugzilla.redhat.com/show_bug.cgi?id=693608
[2]: http://pkgs.repoforge.org/icinga/
