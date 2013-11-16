---
title: RSyslog
---

# RSyslog

RSyslog is a more advanced replacement for the aging klogd and syslogd. It
supports useful features such as attribute filtering and logging to a database.

## Security Notes

RSyslog can log some sensitive information or very useful information for any
potential intruder including service names, versions, valid usernames, logon
times and quite a bit more. It is highly recommended that syslog's are sent to
a central hardened host that can maintain a backup of any logs in case a server
is compromised. It is also very useful for information and error trending.

## Firewall Adjustments

By default RSyslog doesn't need any ports opened. If you intend to send your
logs over the network, it will depend on how you're doing it. UDP is the most
error prone but the least processor intensive. TCP is a bit more reliable. You
can also encrypt syslog messages over TCP using TLS. This however requires
there to be a trusted [Certificate_Authority][1] to create and sign
certificates. TCP is also not supported by all syslog hosts, usually resulting
in a mixed mode setup.

When running as a UDP host, the firewall can be configured to allow the UDP
responses in and block and responses from the syslog server without issue. This
will prevent anyone malicious running a port scan on the network to see that
there is a remote syslog server, which would be a very juicy target. This of
course comes at the expense of the clients and reliability. The clients will
never be able to tell if their message was received but most don't care anyway.

If you're not using TLS on the server to authenticate where messages are coming
from it is a good idea to restrict who can send messages to the syslog server
to prevent attackers from overloading the system.

To allow UDP:

```
-A SERVICES -s 10.13.37.192/28 -m udp -p udp --dport 514 -j ACCEPT
```

To allow TCP:

```
-A SERVICES -s 10.13.37.192/28 -m tcp -p tcp --dport 514 -j ACCEPT
```

To allow TCP/TLS:

```
-A SERVICES -m tcp -p tcp --dport 514 -j ACCEPT
```

## Forwarding Windows Events

There is a handy service that can forward syslog events from the Windows Event
subsystem built into windows to a syslog server. It's called
[eventlog-to-syslog][2] and seems to be under active development (good thing).

## Configuration

### /etc/rsyslog.conf

```
#rsyslog v3 config file

#### MODULES ####

$ModLoad imuxsock.so    # provides support for local system logging (e.g. via logger command)
$ModLoad imklog.so      # provides kernel logging support (previously done by rklogd)

# Provides UDP syslog reception
$ModLoad imudp.so
$UDPServerRun 514

# Provides TCP syslog reception
$ModLoad imtcp.so  
$InputTCPServerRun 514

#### GLOBAL DIRECTIVES ####

# Use default timestamp format
$ActionFileDefaultTemplate RSYSLOG_TraditionalFileFormat

#### RULES ####

# Log anything (except mail) of level info or higher.
# Don't log private authentication messages!
*.info;mail.none;authpriv.none;cron.none                /var/log/messages

# The authpriv file has restricted access.
authpriv.*                                              /var/log/secure

# Log all the mail messages in one place.
mail.*                                                  -/var/log/maillog

# Log cron stuff
cron.*                                                  /var/log/cron

# Everybody gets emergency messages
*.emerg                                                 *

# Save news errors of level crit and higher in a special file.
uucp,news.crit                                          /var/log/spooler

# Save boot messages also to boot.log
local7.*                                                /var/log/boot.log
```

The following chunk is for forwarding messages over the network using TCP, it
should be put at the end of the file. Do not use both TCP and UDP over the
network without adjusting the "ActionQueueFileName".

```
# Begin TCP Forwarding Rule
$WorkDirectory /var/spool/rsyslog
$ActionQueueFileName remotesyslog
$ActionQueueMaxDiskSpace 1g
$ActionQueueSaveOnShutdown on
$ActionQueueType LinkedList
$ActionResumeRetryCount -1
*.* @@syslog.example.org:514
```

The following chunk is for forwarding messages over the network using UDP, it
should be put at the end of the file. Do not use both TCP and UDP over the
network without adjusting the "ActionQueueFileName".

```
# Begin UDP Forwarding Rule
$WorkDirectory /var/spool/rsyslog
$ActionQueueFileName remotesyslog
$ActionQueueMaxDiskSpace 1g
$ActionQueueSaveOnShutdown on
$ActionQueueType LinkedList
$ActionResumeRetryCount -1
*.* @syslog.example.org:514
```

### MySQL Schema

The extension "rsyslog-mysql" will need to be installed and loaded in the
"MODULES" section of `/etc/rsyslog.conf` using the following line:

```
$ModLoad ommysql.so
```

Create the database using the following custom schema, this is probably not
compatible with tools expecting the default schema. I didn't like the default
schema. You will need to create a mysql user for the RSyslog service. It only
needs 'INSERT' privileges on the database.

```
CREATE DATABASE IF NOT EXISTS syslog;
use syslog;
DROP TABLE IF EXISTS syslog_events;
CREATE TABLE syslog_events (
  id int unsigned not null auto_increment primary key,
  receivedAt varchar(60) NULL,
  deviceReportedTime varchar(60) NULL,
  facility smallint NULL,
  severity smallint NULL,
  program varchar(60) NULL,
  hostname varchar(60) NULL,
  srcHost varchar(60) NULL,
  srcIP varchar(60) NULL,
  message text NOT NULL,
  inputName varchar(60)
);
```

To use the custom schema above, this template needs to be added near the top of
the config file under "GLOBAL DIRECTIVES". Changes in the schema will need to
be reflected in the template.

```
$template CustomMySQLSyslog,"INSERT INTO syslog_events (receivedAt, deviceReportedTime, facility, severity, program, hostname, srcHost, srcIP, message, inputName) VALUES ('%timegenerated%', '%timereported%', '%syslogfacility%', '%syslogseverity%', '%programname%', '%hostname:::lowercase%', '%fromhost:::lowercase%', '%fromhost-ip%', '%msg%', '%inputname%');",SQL
```

The following code should be added to the very top of the "RULES" section. You
will need to replace dbhost, dbname, dbuser, dbpass with the values for your
MySQL server (dbname will be syslog if you used the schema on this page). The
last line in this will prevent remote syslog messages from flooding the
log-text files of the server.

```
# MySQL Message queue, this will prevent data loss if we aren't able to write
# to the database fast enough
$WorkDirectory /var/spool/rsyslog
$ActionQueueMaxDiskSpace 1g
$ActionQueueSaveOnShutdown on
$ActionQueueType LinkedList
$ActionResumeRetryCount -1
*.*     :ommysql:dbhost,dbname,dbuser,dbpass;CustomMySQLSyslog

# Everything logged to files should only be the localhosts logs
# This will disable everything else
:fromhost-ip, !isequal, "127.0.0.1" ~
```

I also created `/etc/rsyslog.d/remote_hosts.conf` on the central syslog server
to create a log file dedicated to each host.

```
$template DailyPerHostLogs,"/var/log/hosts/%$YEAR%/%$MONTH%/%$DAY%/%FROMHOST-IP%/messages.log"
*.* -?DailyPerHostLogs
```

It also helps to add this cron.daily task:

```
#!/bin/bash
# Compress *.log files not changed in more than 24 hours:
find /var/log/hosts -type f -mtime +1  -name "*.log" -exec xz {} \;
```

## RELP Configuration

On both the client and the server:

```
yum install rsyslog-relp -y
```

On the server (I created the following in `/etc/rsyslog.d/relp.conf`:

```
$ModLoad imrelp
$InputrelpMaxSessions 5000
$InputRELPServerRun 20514
```

And open up tcp/20514:

```
-A INPUT -m tcp -p tcp --dport 20514 -j ACCEPT
```

On the client:

```
$ModLoad omrelp
*.* :omrelp:loghost.example.com:20514;RSYSLOG_ForwardFormat
```

And ensure the client can make the connection:

```
-A OUTPUT -m tcp -tcp --dport 20514 -d <syslog-ip> -j ACCEPT
```

[1]: ../certificate_authority/
[2]: http://code.google.com/p/eventlog-to-syslog/

