---
title: MySQL
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

Before applying the following configuration file in /etc/my.cnf. Safely
shutdown the server and delete the logfiles /var/lib/mysql/ib_logfile*. This
configuration file will change the size of the log buffer and it will cause an
error when starting the server backup that will look like:

```
InnoDB: Error: log file ./ib_logfile0 is of a different size 0 5242880 bytes
InnoDB: than specified in the .cnf file 0 67108864 bytes!
```

There is still one major security feature that I haven't added to this
configuration yet. Running the mysql daemon in a chroot environment. Details on
setting up a chroot environment for mysql can be found,
[http://www.symantec.com/connect/articles/securing-mysql-step-step here], and
[http://www.webhostingskills.com/articles/mysql_in_a_chrooted_environment
here],

Detailed information on all of the configuration options can be found
[http://dev.mysql.com/doc/refman/5.5/en/dynamic-system-variables.html here].
There is a script that can assist in tuning larger production databases I've
stored in this wiki [[Linux/MySQL Tuning|here]].

```
[mysqld]
# Bind only to expected address. You can not bind to multiple addresses, it's
# none, 1 or all (0.0.0.0)
bind-address = 127.0.0.1

# Always use UTF-8
character-set-server = utf8

# Root path used to store MySQL's data
datadir = /var/lib/mysql

# Use innodb by default (true anyways but I like to be explicit)
default-storage-engine = innodb

# 0 = Don't log warnings, 1 = log warnings, 2 = log warnings and access denied
# errors.
log-warnings = 2

# How many real world seconds pass before we consider a query to be long
# running. Default is 10.
long_query_time = 5

# Which port to listen on, default is 3306
port = 3306

# A user needs to have the INSERT privilege on the mysql.user table to use the
# GRANT statement. This can be provided to non-root users with the following
# command:
# GRANT INSERT(user) ON mysql.user TO 'user_name'@'host_name';
safe_user_create

# Prevent client connections from clients attempting to use insecure password
# authentication
secure_auth

# Only allow load data and outfile to be to/from the given directory. This
# ensures that whatever user is trying to load or dump data from this server
# instance already needs to be able to write to that directory. If an
# unauthorized person can write to the mysql data directory anyways the data
# can't be trusted anyway.
secure-file-priv = /var/lib/mysql

# Require privileges to actually list/enumerate the databases
skip-show-database

# Prevent symbolic links as a security measureskip-symbolic-links
# Log any "slow" queries from hosts, useful as a diagnostic measure for both
# application development and production diagnostics. A slow query is defined by
# the long_query_time variable.
#
# These logs will live in /var/lib/mysql/ and will be pre-pended with the
# hostname that caused the slow query itself.
slow_query_log

# Path to the socket file used to access the server locally
socket = /var/lib/mysql/mysql.sock

##### SSL Settings #####

# All three options are required to enable SSL for the server. To force a user
# to use an SSL connection when they are connecting to the server, while granting
# them privileges add "REQUIRE SSL" to the end of the grant statement. "REQUIRE
# X509" will require the user to present a valid certificate (it's unclear whether
# this needs to be signed by a certificate in the server's CA file), "REQUIRE
# ISSUER" and "REQUIRE SUBJECT" specify details required in the provided
# certificate. The last three imply "REQUIRE SSL".

# Define the certificate authority file, it should have been used to sign the
# server's certificate, and will be used to validate client certificates that
# have been presented.
#ssl_ca = ca.crt

# The name of the SSL certficate file in PEM format to use for establishing a
# secure connection.
#ssl_cert = mysql.crt

# The name of the SSL key file in PEM format to use for establishing a secure
# connection
#ssl_key = mysql.key

##### InnoDB specific settings #####

# If there are lots of tables in the database you may need to increase this
# value from it's default of 8Mb. MySQLd will log warning messages if this is
# the case.
innodb_additional_mem_pool_size = 8M

# Amount of data to cache, default is 8Mb, shouldn't ever be more than 80% of
# server's physical memory size even on a dedicated box. Even that high may
# cause other issues on the server such as competition from the OS, and the
# space must be contiguous which isn't always available. This is only the table
# and data cache, MySQLd may allocate additional memory for buffers and control
# structures. On dedicated MySQL boxes it is recommended that this be between
# 75% and 80%
innodb_buffer_pool_size = 32M

# Validate the checksums of all pages read from disk to ensure fault tolerance
# against broken hardware or data files. Enabled by default but I like to be
# explicit...
innodb_checksums = 1

# Breaks the database into smaller more managable pieces, and if careful can
# allow for individual table backups and restoration while the server is
# running. There is a special process to handle this and it should looked up
# before attempting. The main benefit of using this option is the prevention
# of main tablespace growth.
innodb_file_per_table

# 0 = A most one second of transactions are lost in the event of an application
# crash, 1 = ACID compliant and most reliable storage of data, 2 is somewhere in
# between 0 and 1 losing at most 1 second of data only in the case of power
# outage or server failure. 1 is the default. If you're not worried about losing
# transactions for the last second or two a value of 2 can have a dramatic increase
# especially when there are a lot of short write transactions.
innodb_flush_log_at_trx_commit = 2

# An upper limit on the IO activity performed by InnoDB background tasks.
# Default value is 200 with a minimum value of 100. This parameter should be set
# approximately what the IOPS of the system disk the tables are stored on is
# able to provide (100 for 5.2k & 7.2k drives, 150 for 10k, 200 for 15k and
# 250 for SSDs). It is recommended to 'keep this setting as low as practical, but
# not so low that these background activities fall behind.' Too high and data will
# be removed from the buffer pool too quickly to benefit from the caching.
innodb_io_capacity = 100

# This will prevent too much log switching on write heavy databases (default is
# 8Mb). Larger buffers all larger transactions to run without the need to write
# the log to disk before the transactions commit. On larger databases this should
# be set higher to something like 256Mb, there isn't a large benefit above 512Mb
innodb_log_file_size = 64M

# The size of the buffer that InnoDB uses to write to the log files on disk.
# Default is 8Mb. A larger log buffer allows larger transactions to run without
# a need to write the log to disk before the transactions commit.
innodb_log_buffer_size = 8M

# The size of each transaction log (default is 5Mb). The larger the value the
# less checkpoint flush activity is needed in the buffer pool saving disk IO at
# the expense of crash recovery time. Recommended is 1/nth of the
# innodb_buffer_pool_size where N is the value of innodb_log_files_in_group. In
# this file that's 1/2 of 32Mb.
innodb_log_file_size = 16M

# The number of transaction logs to make use of, the default, recommended and
# minimum is 2. These will written to in a circular fashion.
innodb_log_files_in_group = 2

[mysqld_safe]

# Where to store the MySQLd process ID
pid-file = /var/run/mysqld/mysqld.pid

# Enable logging to syslog
syslog

[mysql]

# Adjust the prompt to be more useful/verbose.
prompt=(\\u@\\h) [\\d]>\\_
```

There is some additional configuration in the systemd init script, specifically
which user/group the service will fork too (default is mysql/mysql). If you
need to change this you'll need to make the adjustment in
/etc/systemd/system/multi-user.target.wants/mysqld.service

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
sure to kill the mysqld_safe instance, start up the daemon normally and restore
access to the server.

### Quick Self Signed SSL Cert w/ Client

This should be used for testing and development only, it requires a bit more
than a simple SSL cert as MySQL requires a CA cert as well so we'll generate a
self signed CA, a server certificate, and then a client certificate that can be
used for user authentication.

First the CA:

```
openssl req -new -x509 -newkey rsa:4096 -keyout ca.key -nodes -days 365 -out ca.crt
```

Then the server cert:

```
openssl req -newkey rsa:4096 -keyout server.key -nodes -days 365 -out server.csr
openssl x509 -req -in server.csr -days 365 -CA ca.crt -CAkey ca.key -set_serial 01 -out server.crt
rm server.csr
```

Then the client cert:

```
openssl req -newkey rsa:4096 -keyout client.key -nodes -days 365 -out client.csr
openssl x509 -req -in client.csr -days 365 -CA ca.crt -CAkey ca.key -set_serial 02 -out client.crt
rm client.csr
```

## Client
### Remotely Calculate the Size of a Database

Paste the following query into an interactive console session to collect the
sizes of all databases the current user has access to:

```
SELECT table_schema "Database Name", SUM(data_length + index_length) / 1024 / 1024 "Size in Mb" FROM information_schema.TABLES GROUP BY table_schema;
```

### Drop Tables

Without being able to drop a database and create a new one it can be kind of
frustrating to empty a database of all it's tables so I've written a quick
script to drop all the tables from a specified database.

```sh
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
 
TABLES=$(mysql -u $DBUSER -p$DBPASS -h$DBHOST $DBNAME -e 'show tables;' | awk '{ print $1}' | grep -v '^Tables' )
 
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
GRANT ALL ON example.* TO 'some-example-user'@'%.home-network.net' IDENTIFIED BY 'mYsUperSt0ngpassWordD0ntcoPyM3!';
FLUSH PRIVILEGES;
```

### Change User Password

Note: For security reasons this password update should be performed over an
encrypted channel. See the section on Using SSL.

```
UPDATE mysql.user SET password=PASSWORD("my-new-super-secure-password") where user='some-user-name';
```

### Configuration

Quick and simple change I make to my client configuration to make the prompt a
little more verbose. Create the following file in ~/.my.cnf:

```
[mysql]prompt=(\\u@\\h) [\\d]>\\_
```

This can also be set system wide in /etc/my.cnf for all users by appending the
above (which I do in all my server configurations).

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

* http://www.percona.com/doc/percona-toolkit/2.1/

### TCMalloc

Due to high thread contention in some versions of MySQL a huge performance
boost can be gained by using a third party malloc, TCMalloc has been proven to
reduce thread contention in MySQL and provide as much as a 30% boost in all
query timing.

* http://goog-perftools.sourceforge.net/doc/tcmalloc.html
* https://code.google.com/p/gperftools/

MORE TODO

