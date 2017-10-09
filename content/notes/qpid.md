---
title: Qpid
---

***Note: This page is quite old and is likely out of date. My opinions may have
also changed dramatically since this was written. It is here as a reference
until I get around to updating it.***

Qpid is an open source AMQP broker, providing transaction management, queuing,
distribution, security, management, clustering, and federation.

* http://wiki.openstack.org/QpidSupport
* http://www.linuxjournal.com/magazine/advanced-message-queuing-protocol-amqp?page=0,1

## Installation

Fedora provides a package for qpid called `qpid-cpp-server` which can be
installed like so:

```
yum install qpid-cpp-server qpid-cpp-server-ssl qpid-cpp-server-store \
  qpid-cpp-server-ha -y
```

Additional packages that may be of use:

* qpid-tools
* qpid-qmf

## Configuration

The following configuration file assumes the rest of the configuration on this
page. You'll want to replace the existing configuration at `/etc/qpidd.conf`
with the following:

```ini
##### General Configuration #####

# Directory to contain persistent data
data-dir=/var/lib/qpidd/

worker-threads=3

##### Queue Configuration #####

# Set queue events async, used for services like replication
async-queue-events=no

# How often to attempt purging expired messages from the queues
queue-purge-interval=600

# Default storage limit of any given queue
default-queue-limit=104857600

# The ratio of any specified queue limit at which an event will be raised
default-event-threshold-ratio=80

# Percent of queues maximum capacity at which flow control is activated and
# deactivated.
default-flow-stop-threshold=80
default-flow-resume-threshold=70

# Group identifier to assign to messages delivered to a message group queue that
# do not contain an identifier.
default-message-group=qpid.no-group

# Add current time to each received message
enable-timestamp=yes

##### Management Options #####

# Enable management, publishing data every 10 seconds, with QMF protocol 1 and
# 2
mgmt-enable=yes
mgmt-publish=yes
mgmt-pub-interval=10
mgmt-qmf1=yes
mgmt-qmf2=yes

##### Networking Configuration #####

connection-backlog=10

link-heartbeat-interval=120
link-maintenace-interval=2

# Maximum time a connection can take to send the initial protocol negotiation
# (in milliseconds).
max-negotiate-time=2000

# Port to listen on for unencrypted connections
port=5672

# Set TCP_NODELAY on TCP connections
tcp-nodelay=yes

##### Logging Options #####

log-enable=info+

log-category=yes
log-level=yes
log-time=no

log-to-stderr=no
log-to-stdout=no
log-to-syslog=yes

##### Persistent Storage Options #####

# Number of pages in each journal (1 page is 64Kb)
jfile-size-pgs=24

# Default number of files for each journal instance (queue)
num-jfiles=8

truncate=no

# Size of the pages in the write page cache in Kb, allowable values are powers
# of 2
wcache-page-size=32

##### Authentication & Authorization Configurations #####

# Enable authentication, and configured to use the QPID realm
auth=yes
realm=QPID

# Get SASL configuration from standard redhat location
sasl-config=/etc/sasl2/

# The policy file to load from, loaded from the data dir
acl-file=qpid.acl

# Maximum combined number of connections allowed (0 is no limit)
max-connections=500
max-connections-per-user=0
max-connections-per-ip=0

##### SSL Settings #####

ssl-port=5671

# File containing password to use for accessing the certificate database
ssl-cert-password-file=/var/lib/qpidd/ssl-db-pass

# Where the cert database is stored, the data directory is as good as any
ssl-cert-db=/var/lib/qpidd

# Name of the cerificate to use (usually the hostname)
ssl-cert-name=agni

# Whether or not the server will accept unencrypted connections, there is of
# course overhead to encrypted connections and if the only services that will
# be talking to it will be the localhost then there is no need to require it...
# External connections should of course be encrypted wherever possible.
require-encryption=no
```

You'll want to enable and start the service once the configuration is complete.

```
systemctl enable qpidd.service
systemctl start qpidd.service
```

### Enabling User/Pass Authentication

By default only ANONYMOUS authentication is enabled which isn't good for any
production systems... Qpid uses SASL for user authentication and that is how we
need to configure what system to make use of. Open up the file
`/etc/sasl2/qpidd.conf` and replace it's contents with the following:

```
auxprop_plugin: sasldb
mech_list: DIGEST-MD5 PLAIN+SSL
pwcheck_method: auxprop
sasldb_path: /var/lib/qpidd/qpidd.sasldb
sql_select: dummy select
```

### Creating Users

I've named the SASL authentication realm after the service that uses it, in
this case Qpid (makes sense no?). You'll need to create at least one user to
make use of authentication, I chose to make one user for administration tasks
(admin), and one per server named after the server (in this case the server is
named openstack after the service I mainly use Qpid for).

Create the user's as root:

```
saslpasswd2 -f /var/lib/qpidd/qpidd.sasldb -u QPID admin
saslpasswd2 -f /var/lib/qpidd/qpidd.sasldb -u QPID openstack
```

Set STRONG passwords for both as arbitrary instructions can be provided to
various openstack services through this service.

The saslpasswd2 command will additionally create the password file, but with
incorrect permissions. Set the ownership and strengthen the permissions like
so:

```
chown qpidd:qpidd /var/lib/qpidd/qpidd.sasldb
chmod 0640 /var/lib/qpidd/qpidd.sasldb
```

If you have started Qpid with `auth=yes` configured before creating the account
it will automatically create this file and add a user with the username and
password 'guest'.

### Listing Users

You can list all the configured realm / username combinations with the
following command:

```
sasldblistusers2 -f /var/lib/qpidd/qpidd.sasldb
```

### User ACLs

The ACL files are pretty straight-forward and plain text. The file lives at
`/var/lib/qpidd/qpid.acl` which doesn't exist initially and will need to be
created. This is a solid initial ACL allowing the admin and openstack access to
any permissions they need while preventing anything else.

In the future I'll need to make this more fine-grained. This is more useful
when using Kerberos as the back end which would have more users you wouldn't
want to have access.

```
# Define the admins and let them do whatever they want
group admins admin@Qpid
acl allow admins all all

# Define the server accounts and set their permissions
group servers openstack@Qpid
acl allow servers all all

# Default deny with logging on any other attempts
acl deny-log all all
```

Ensure the ownership and permissions on the file are appropriate:

```
chown qpidd:qpidd /var/lib/qpidd/qpid.acl
chmod 0640 /var/lib/qpidd/qpid.acl
```

#### ACL BML Syntax

ACLs are case-insensitve, all white space is essentially ignored except when
delimiting between syntax types. Lines can be wrapped by ending the line with a
backslash.

```
user = username[/domain[@realm]]
user-list = user1 user2 user3 ...
group-name-list = group1 group2 group3 ...

group <group-name> = [user-list] [group-name-list]

permission = [allow|allow-log|deny|deny-log]
action = [consume|publish|create|access|bind|unbind|delete|purge|update]
object = [virtualhost|queue|exchange|broker|link|route|method]
property = [name|durable|owner|routingkey|autodelete|exclusive|
            type|alternate|queuename|schemapackage|schemaclass|
            queuemaxsizelowerlimit|queuemaxsizeupperlimit|
            queuemaxcountlowerlimit|queuemaxcountupperlimit]

acl permission {<group-name>|<user-name>|"all"} {action|"all"} [object|"all" 
            [property=<property-value> ...]]
```

#### Action Listing

| Action  | Description                                                                                        |
| ------- | -------------------------------------------------------------------------------------------------- |
| consume | Applied when subscriptions are created                                                             |
| publish | Applied on a per message basis on publish message transfers, this rule consumes the most resources |
| create  | Applied when an object is created, such as bindings, queues, exchanges, links                      |
| access  | Applied when an object is read or accessed                                                         |
| bind    | Applied when objects are bound together                                                            |
| unbind  | Applied when objects are unbound                                                                   |
| delete  | Applied when objects are deleted                                                                   |
| purge   | Similar to delete but the action is performed on more than one object                              |
| update  | Applied when an object is updated                                                                  |

#### Object Listing

| Object   | Description                          |
| -------- | ------------------------------------ |
| queue    | A queue                              |
| exchange | An exchange                          |
| broker   | The broker                           |
| link     | A federation or inter-broker link    |
| method   | Management or agent or broker method |

#### Property Listing

| Property                | Type    | Description                                                                    | Usage                                           |
| ----------------------- | ------- | ------------------------------------------------------------------------------ | ----------------------------------------------- |
| name                    | String  | Object name, such as a queue name or exchange name.                            |                                                 |
| durable                 | Boolean | Indicates the object is durable                                                | CREATE QUEUE, CREATE EXCHANGE                   |
| routingkey              | String  | Specifies routing key                                                          | BIND EXCHANGE, UNBIND EXCHANGE, ACCESS EXCHANGE |
| autodelete              | Boolean | Indicates whether or not the object gets deleted when the connection is closed | CREATE QUEUE                                    |
| exclusive               | Boolean | Indicates the presence of an exclusive flag                                     | CREATE QUEUE                                    |
| type                    | String  | Type of exchange, such as topic, fanout, or xml                                | CREATE EXCHANGE                                 |
| alternate               | String  | Name of the alternate exchange                                                 | CREATE EXCHANGE, CREATE QUEUE                   |
| queuename               | String  | Name of the queue                                                              | ACCESS EXCHANGE                                 |
| schemapackage           | String  | QMF schema package name                                                        | ACCESS METHOD                                   |
| schemaclass             | String  | QMF schema class name                                                          | ACCESS METHOD                                   |
| queuemaxsizelowerlimit  | Integer | Minimum value for queue.max_size                                               | CREATE QUEUE                                    |
| queuemaxsizeupperlimit  | Integer | Maximum value for queue.max_size                                               | CREATE QUEUE                                    |
| queuemaxcountlowerlimit | Integer | Minimum value for queue.max_count                                              | CREATE QUEUE                                    |
| queuemaxcountupperlimit | Integer | Maximum value for queue.max_count                                              | CREATE QUEUE                                    |

### SSL

Unfortunately SSL for Qpid isn't as easy as generating PEM certificates and
pointing the config at them. Qpid makes use of a Mozilla Network Security
Services database. These databases can be created using certutil.

First we'll need to initialize the database:

```
certutil -N -d /var/lib/qpidd/
```

Provide a strong password to the database and put a copy in the file
`/var/lib/qpidd/ssl-db-pass` on it's own with no newline.

I already have PKI in place and a trusted [Certificate Authority][1], so I
just have to import my trusted certificate authority chain. Generate a
certificate for this server and import it's certificate and chain.

Import the CA cert:

```
certutil -A -n cert-authority -t "TC,," -i ca.crt -d /var/lib/qpidd
```

The server certificate is a bit trickier, before we can import an OpenSSL
generated PEM format key set we'll need to convert it to a pkcs12 file, luckily
OpenSSL plays well with others:

```
openssl pkcs12 -export -out qpid.pfx -inkey qpid.key -in qpid.crt -certfile ca.crt
```

Import the newly generate pkcs12 file, it will firstly ask for the password for
the database, and then the password for the pkcs12 file:

```
pk12util -d /var/lib/qpidd/ -i qpid.pfx
```

And be sure to clean up after yourself:

```
rm qpid.pfx
```

Set the permissions on all of the files we just created:

```
chown qpidd:qpidd /var/lib/qpidd/{cert8.db,key3.db,ssl-db-pass}
chmod 0640 /var/lib/qpidd/{cert8.db,key3.db,ssl-db-pass}
```

### Firewall

```
# Encrypted Qpid connections (Unencrypted are 5672 but those shouldn't be
# accessed remotely)
-A SERVICE -m tcp -p tcp --dport 5671 -j ACCEPT
```

[1]: {{< relref "notes/certificate_authority.md" >}}
