---
title: MySQL
weight: 45

aliases:
  - /notes/mysql_tuning/

taxonomies:
  tags:
  - linux

extra:
  done: true
  outdated: true
---

## Server

### Installation

Install the package.

```
yum install mysql-server -y
```

Set to start up auto-magically and get it going now.

```
systemctl enable mysqld.service
systemctl start mysqld.service
```

Run the quick and dirty secure installation script that comes with the server.
The questions are pretty straight-forward just set a secure password when it
asks for it.

```
mysql_secure_installation
```

### Configuration

Before applying the [configuration file](my.cnf) in `/etc/my.cnf`. Safely
shutdown the server and delete the logfiles `/var/lib/mysql/ib_logfile*`. This
configuration file will change the size of the log buffer and it will cause an
error when starting the server backup that will look like:

```
InnoDB: Error: log file ./ib_logfile0 is of a different size 0 5242880 bytes
InnoDB: than specified in the .cnf file 0 67108864 bytes!
```

There is still one major security feature that I haven't added to this
configuration yet. Running the mysql daemon in a chroot environment. Details on
setting up a chroot environment for mysql can be found, [here][1].

Detailed information on all of the configuration options can be found
[here][2]. There is a script that can assist in tuning larger production
databases I've stored [here][3].

There is some additional configuration in the systemd init script, specifically
which user/group the service will fork too (default is mysql/mysql). If you
need to change this you'll need to make the adjustment in
`/etc/systemd/system/multi-user.target.wants/mysqld.service`.

### Firewall

```
-A SERVICES -m tcp -p tcp --dport 3306 -j ACCEPT
```

### Resetting the Root Password

Stop the MySQL daemon, and disable remote access to the server (block in
firewall etc). Start up MySQL with privilege checking disabled (In this mode
any credential will be accepted for any username and that user will have full
root database privileges (thus blocking remote access).

```
mysqld_safe --skip-grant-tables
```

In a separate terminal window connect to the database:

```
mysql -u root
```

Refer to the section on changing a user's password at this point. When done be
sure to kill the `mysqld_safe` instance, start up the daemon normally and
restore access to the server.

### Quick Self Signed SSL Cert w/ Client

This should be used for testing and development only, it requires a bit more
than a simple SSL cert as MySQL requires a CA cert as well so we'll generate a
self signed CA, a server certificate, and then a client certificate that can be
used for user authentication.

First the CA:

```
openssl req -new -x509 -newkey rsa:4096 -keyout ca.key -nodes -days 365 \
  -out ca.crt
```

Then the server cert:

```
openssl req -newkey rsa:4096 -keyout server.key -nodes -days 365 \
  -out server.csr
openssl x509 -req -in server.csr -days 365 -CA ca.crt -CAkey ca.key \
  -set_serial 01 -out server.crt
rm server.csr
```

Then the client cert:

```
openssl req -newkey rsa:4096 -keyout client.key -nodes -days 365 \
  -out client.csr
openssl x509 -req -in client.csr -days 365 -CA ca.crt -CAkey ca.key \
  -set_serial 02 -out client.crt
rm client.csr
```

## Client

### Remotely Calculate the Size of a Database

Paste the following query into an interactive console session to collect the
sizes of all databases the current user has access to:

```
SELECT table_schema "Database Name", SUM(data_length + index_length) / 1024
  / 1024 "Size in Mb" FROM information_schema.TABLES GROUP BY table_schema;
```

### Drop Tables

Without being able to drop a database and create a new one it can be kind of
frustrating to empty a database of all it's tables so I've written a quick
script to drop all the tables from a specified database.

```
#!/bin/bash

DBUSER="$1"
DBPASS="$2"
DBNAME="$3"
DBHOST="$4"

if [ $# -ne 4 ]; then
  echo "Usage: $0 {username} {password} {database} {hostname}"
  echo "Drops all tables from a MySQL"
  exit 1
fi

TABLES=$(mysql -u $DBUSER -p$DBPASS -h$DBHOST $DBNAME -e 'show tables;' |
  awk '{ print $1}' | grep -v '^Tables' )

for t in $TABLES; do
  echo "Deleting $t table from $MDB database..."
  mysql -u $DBUSER -p$DBPASS -h$DBHOST $DBNAME -e "drop table $t;"
done
```

### New Database and User

Note: For security reasons user creation should be performed over an encrypted
channel. See the section on Using SSL.

```
CREATE DATABASE example;
GRANT ALL ON example.* TO 'some-example-user'@'%.home-network.net' IDENTIFIED
  BY 'mYsUperSt0ngpassWordD0ntcoPyM3!';
FLUSH PRIVILEGES;
```

### Change User Password

Note: For security reasons this password update should be performed over an
encrypted channel. See the section on Using SSL.

```
UPDATE mysql.user SET password=PASSWORD("my-new-super-secure-password") WHERE
  user='some-user-name';
```

### Configuration

Quick and simple change I make to my client configuration to make the prompt a
little more verbose. Create the following file in `~/.my.cnf`:

```
[mysql]prompt=(\\u@\\h) [\\d]>\\_
```

This can also be set system wide in `/etc/my.cnf` for all users by appending
the above (which I do in all my server configurations).

### Using SSL

Pretty straight forward, one off can be done like the following:

```
mysql -u user -ppassword -h host --ssl-ca=./ca.crt database
```

Once connected you can verify the session is encrypted with the following
query:

```
(root@127.0.0.1) [(none)]> show status like 'ssl_cipher';
```

If the second column returned is non-empty then your session is encrypted.

### See Remote Version

```
(user@example-mysql) [(none)]> SELECT VERSION();
```

### Useful Diagnostic / Testing / Maintenance Scripts

* [Percona Toolkit](https://www.percona.com/doc/percona-toolkit/2.1/index.html)

### TCMalloc

Due to high thread contention in some versions of MySQL a huge performance
boost can be gained by using a third party malloc, TCMalloc has been proven to
reduce thread contention in MySQL and provide as much as a 30% boost in all
query timing.

* [TCMalloc : Thread-Caching Malloc](http://goog-perftools.sourceforge.net/doc/tcmalloc.html)
* [gperftools](https://github.com/gperftools/gperftools)

MORE TODO

[1]: https://community.broadcom.com/symantecenterprise/communities/community-home/librarydocuments/viewdocument?DocumentKey=e424fa89-758d-42ec-a272-a0c285d887ac&CommunityKey=1ecf5f55-9545-44d6-b0f4-4e4a7f5f5e68&tab=librarydocuments
[2]: https://dev.mysql.com/doc/refman/8.0/en/dynamic-system-variables.html
[3]: mysql_tuning.sh
