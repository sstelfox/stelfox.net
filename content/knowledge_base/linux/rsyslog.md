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
#rsyslog v5 config file

#### MODULES ####

$ModLoad imuxsock # Provide support for local system logging (e.g. via logger command)
$ModLoad imklog   # Provide kernel logging support
$ModLoad immark   # Provide --MARK-- message capability

# GLOBAL DIRECTIVES

# Use default timestamp format
$ActionFileDefaultTemplate RSYSLOG_TraditionalFileFormat

# File syncing capability is disabled by default. This feature is usually not
# required, and an extreme performance hit.
#$ActionFileEnableSync on

# Include all config files in /etc/rsyslog.d/
$IncludeConfig /etc/rsyslog.d/*.conf

# TEMPLATES

# Log every remote host to it's own directory, with a timestamped file
$template RemoteHost,"/var/syslog/hosts/%FROMHOST-IP%/%$YEAR%-%$MONTH%-%$DAY%-syslog.log"

# RULESETS

# BEGIN LOCAL RULESET

$RuleSet local
# Log all kernel messages to the console
kern.*                                    /dev/console

# Log anything (except mail, and private authentication message) of level info
# or higher.
*.info;mail.none;authpriv.none;cron.none  /var/log/messages

authpriv.*                                /var/log/secure

# Log all the mail messages in one place.
mail.*                                    -/var/log/maillog

# Log cron stuff
cron.*                                    /var/log/cron

# Everybody gets emergency messages
*.emerg                                   :omusrmsg:*

# Save news errors of level crit and higher in a special file.
uucp,news.crit                            -/var/log/spooler

# Save boot messages also to boot.log
local7.*                                  /var/log/boot.log

# END LOCAL RULESET

# BEGIN REMOTE RULESET

# Use the remote file path template for remote systems
$RuleSet remote
*.* ?RemoteHost

# END REMOTE RULESET

# Use the local RuleSet as default if not specified otherwise
$DefaultRuleset local

# LISTENERS

$ModLoad imtcp
$InputTCPServerBindRuleset remote
$InputTCPServerRun 10514

$ModLoad imudp
$InputUDPServerBindRuleset remote
$UDPServerRun 10514
```

If you want to send your logs to the remote server create the following
contents in `/etc/rsyslog.d/central-server.conf`.

```
# Remote Logging
#
# An on-disk queue is created for this action. If the remote host is down,
# messages are spooled to disk and sent when it is up again.

$WorkDirectory              /var/lib/rsyslog  # The directory to store any queue files
$ActionQueueFileName        syslog-fwd-01     # Prefix for the files stored in the working directory
$ActionQueueMaxDiskSpace    1g                # Limit our queue disk consumption to a gig
$ActionQueueSaveOnShutdown  on                # Whether queues persist through reboots
$ActionQueueType            LinkedList        # Run asynchronously
$ActionResumeRetryCount     -1                # Infinite retries if host is down
*.* @@syslog.example.org:10514
```

You can drop one of the `@` symbols on the last line if you'd like to use UDP.
The port is also optional but since we're using a non-standard port it's
required.

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

## Streaming to Redis

```
yum install ruby rubygem-redis -y
```

Created `/bin/redis-syslog-sender` with the following contents:

```
#!/usr/bin/env ruby

require 'rubygems'
require 'redis'

redis = Redis.new(
  host: 'redis-host',
  password: "redis-password"
)

while message = ARGF.gets
  redis.publish("syslog:stream", message.strip)
end

redis.quit
```

You'll need to edit the host your redis server is running on and provide it's
password.

In `/etc/rsyslog.conf` you'll need to add the following lines:

```
$template RedisSender, "<%PRI%>%TIMESTAMP:::date-rfc3339% %HOSTNAME% %syslogtag:1:32%%msg:::sp-if-no-1st-sp%%msg%"
module(load="omprog")
*.*  action(type="omprog" binary="/bin/syslog-redis-sender" template="RedisSender")
```

After restarting the service a client can begin receiving all the syslog
messages by subscribing to the Redis stream 'syslog:stream'.

[1]: ../certificate_authority/
[2]: http://code.google.com/p/eventlog-to-syslog/

