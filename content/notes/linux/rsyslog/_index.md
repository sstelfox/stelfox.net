---
created_at: 2013-01-01T00:00:01-0000
updated_at: 2026-04-05T00:00:00-0000
title: RSyslog
tags:
  - linux
  - logging
  - security
  - operations
aliases:
  - /notes/rsyslog/
---
# RSyslog

RSyslog is a more advanced replacement for the aging klogd and syslogd. It
supports useful features such as attribute filtering, multiple protocol
support, and logging to databases.

## Security Notes

RSyslog can log some sensitive information or very useful information for any
potential intruder including service names, versions, valid usernames, logon
times and quite a bit more.

Attempts are usually made to alter or destroy logs by various malicious actors
to cover their tracks. As such it is highly recommended that logs are sent to a
central hardened host that can maintain a backup of any logs in case a server
is compromised as well as providing a central place for logs to be processed
and manipulated.

Other software will need to be used to handle the correlation of logs, RSyslog
itself only provides mechanisms for aggregations.

## Firewall Adjustments

By default RSyslog doesn't need any ports opened. If you intend to send your
logs over the network, it will depend on how you're doing it. UDP is the most
error prone but the least processor intensive, you could also use UDP across a
one-way data path which can be valuable in some high security situations.

TCP is more reliable but does require more processing and memory as connections
need to be tracked. This overhead is usually trivial amounts in small to medium
logging situations and can probably be safely ignored in most cases.

RSyslog also provides a mechanism to encrypt syslog messages over TCP using
TLS. This however requires there to be a trusted [Certificate Authority][1] to
create and sign certificates. Using a private CA for this purpose is the most
common approach and correctly authenticates clients to your log server.

Many network appliances, switches, and routers don't support TCP or TLS syslog
reporting. This frequently means you'll want to operate in a mixed mode setup,
providing a secure connection to clients that support it while still allowing
older clients to send you logs over UDP.

These logs generally travel unencrypted over the network unless configured to
do otherwise.

If you're sending or receiving log messages between machines you'll need to
adjust your firewall rules to allow the traffic. The following ports are
relevant:

| Port | Protocol | Direction | Description |
|------|----------|-----------|-------------|
| 514 | UDP | Inbound/Outbound | Standard syslog (widely supported) |
| 514 | TCP | Inbound/Outbound | Reliable syslog delivery |
| 2514 | TCP | Inbound/Outbound | RELP (Reliable Event Logging Protocol) |

It is a good idea to limit the hosts that can send log messages to your central
log servers or implement a form of authentication to prevent malicious
attackers from flooding / overloading your log server.

## Forwarding Windows Events

There is a handy service that can forward syslog events from the Windows Event
subsystem built into windows to a syslog server. It's called
[eventlog-to-syslog][2] and seems to be under active development (good thing).

## Modular Configuration

Modular configuration of services has become increasingly important with the
rise of configuration management systems. By making use of the modular imports,
configuration of systems can be mostly standardized with only the variations
based on the system's role adding or removing individual files without worrying
about the state of others.

I've updated my example configurations for RSyslog to make full use of the
modular configuration mechanism.

***Compatibility warning:*** I've switched from using the "legacy" syslog.conf
syntax to RSyslog's "RainerScript" as much as possible. This sample
configuration works at version 7.4.8 of RSyslog on Fedora 20. I've had serious
compatibility issues going to new and older minor releases of RSyslog with
certain subsets of the new syntax, all of which I've left out of these examples
to the best of my abilities.

My base `/etc/rsyslog.conf` file loads the core modules and sets up the modular
config directory:

[rsyslog.conf](rsyslog.conf)

If you prefer not to have time based mark messages periodically added to your
log files you'll want to remove or comment out that line or change the interval
that they're logged at (I've found hourly to be pretty balanced and useful).

The first important modular configuration file is for logging messages to local
files. All my systems get this file which I place at
`/etc/rsyslog.d/local_logging.conf`.

There is one weird condition on only logging to local files if the log message
itself didn't come from a file, the reason for this will become apparent later
on.

[local_logging.conf](local_logging.conf)

You can stop at this point if you're not going to send your logs to a central
location. On the systems that will be receiving logs you'll want to add the
following configuration file at `/etc/rsyslog.d/server.conf`.

This is one of the places where I couldn't find a RainerScript equivalent
(around the definition of templates). The RELP module also doesn't support the
'ruleset' attribute, otherwise, I'd probably include the module just for
completeness.

[server.conf](server.conf)

This will maintain independent log files for each client that sends the server
logs broken down by IP address in the `/var/log/remote` directory. Each
directory will match the one you'd expect to see on that system's `/var/log`
directory.

If you look closely you can see that I've got some special logic in place for
handling one special type of log, the output of 'auditd'. We'll get to that
soon.

We need to now configure our clients to send the logs to our server. On all
machines (I do this on the log servers as well) I add the following
configuration file at `/etc/rsyslog.d/remote.conf`.

[remote.conf](remote.conf)

You'll want to replace the value of the target attribute with the name of your
logserver. I've never had issues with using hostnames though generally the best
practice for logging is to use IP addresses. This name will only be looked up
when the configuration is evaluated.

I have two separate log servers that I send logs to for redundancy, this does
make log processing later on a smidge more difficult due to duplications but
I've found the benefits far outweigh the added effort.

The final link in this log chain is sending our audit log files to the central
server. This is why I've added a conditional statement to the local logging as
rsyslog isn't responsible for generating or locally logging this data and why
the server file has conditions for dealing with the audit log. I keep this
configuration in `/etc/rsyslog.d/audit_input.conf`.

[audit_input.conf](audit_input.conf)

Ensure you restart the syslog server after making these changes:

```
systemctl restart rsyslog.service
```

## Log Rotation for Servers

The last component in the log server is to ensure log files are regularly
rotated and compressed. My per server log volume is relatively small so I
rotate my logs weekly and keep a years worth for each machine.

I stick the following configuration file at
`/etc/logrotate.d/rsyslog_server.conf`. This assumes you already have
[logrotate][5] configured.

[rsyslog_server_logrotate.conf](rsyslog_server_logrotate.conf)

## RELP

RELP is a custom log protocol created by the maintainers of RSyslog attempting
to ensure logs are reliably delivered to particular servers. In practice I've
had significant issues RELP, mostly around its reliability (ironically) at
sending logs when all systems are operating normally and at low volumes.

RELP was never able to pass any of my deployment tests reliably enough for me
to be able to make use of it in production and I highly encourage it not be
used.

## Signature Providers

RSyslog has integrated [signature provider support][3] through a third party
service called [GuardTime][4]. The Rsyslog developers have claimed other
signature provider modules will be provided in the future but give no
indications on possible timelines or how they might be implemented.

GuardTime itself as a service isn't well documented, their entire site being a
shrine to abstract meaningless buzz words. What I have been able to gather is
that they implement some form of a block chain (it is unclear whether it is
public or not) and they use the aggregated signatures of everyone requesting
signatures of hashes as part of this block chain. I could be *way* off on this
as the documentation is very sparse, old and is largely based off of jumps of
intuition.

GuardTime itself seems to have been having issues. They shut down their API due
to DoS attacks now requiring an account. It also requires trusting them as a
third party, even though they claim this is not the case (they provide no
technical information backing this claim).

Signing logs is not an easy problem. Systemd is also attempting to solve the
problem in their own way, but there is a lot of criticism and valid arguments
over their implementation.

I work in environments that by definition don't trust third parties, so until
there is a self-hosted solution for providing signatures, I can't recommend
this.

## Personal Views

I use RSyslog because it is IMHO the best open source log daemon available. I
am appalled by the developers compatibility breaking changes between minor
versions that I've experienced, the self-aggrandizing ('RainerScript'...),
inconsistent documentation, and general lack of support that I've witnessed.

That being said, I have yet to see even a commercial offering that works as
well as RSyslog. The developers are continuing to develop in a security
conscious way (such as integrating encryption, and third party message
signatures) and stability (such as log queues).

[1]: {{< ref "/notes/security/certificate_authority/" >}}
[2]: http://code.google.com/p/eventlog-to-syslog/
[3]: http://www.rsyslog.com/doc/sigprov_gt.html
[4]: http://guardtime.com/
[5]: {{< ref "../logrotate.md" >}}
