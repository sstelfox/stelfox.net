---
title: RSyslog
---

# RSyslog

RSyslog is a more advanced replacement for the aging klogd and syslogd. It
supports useful features such as attribute filtering, multiple protocol
support, and logging to databases.

## Security Notes

RSyslog can log some sensitive information or very useful information for any
potential intruder including service names, versions, valid usernames, logon
times and quite a bit more.

It is highly recommended that logs are sent to a central hardened host that can
maintain a backup of any logs in case a server is compromised as well as
providing a central place for logs to be processed and manipulated.

These logs generally travel unencrypted over the network unless configured to
do otherwise.

## Firewall Adjustments

If you're sending or receiving log messages between machines you'll need to
adjust your firewall rules to allow the traffic. Syslog has an IANA assigned
port number of *514* for both TCP and UDP.

It is common and more widely supported by endpoint devices to support UDP as it
requires less processing but is more prone to message loss. TCP is
significantly more reliable for message delivery, at the cost of having more
processing overhead.

Rsyslog also supports a homegrown protocol referred to as RELP (the "Reliable
Event Logging Protocol"). This does not have an IANA standard port assigned to
it but defaults to port *2514/tcp*.

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
configuration works at version 7.4.8 of RSyslog. I've had serious compatibility
issues going to new and older minor releases of RSyslog with certain subsets of
the new syntax, all of which I've left out of these examples to the best of my
abilities.

My base `/etc/rsyslog.conf` file.

```
module(load="imuxsock")
module(load="imjournal" statefile="imjournal.state")
module(load="imklog")
module(load="immark")

$WorkDirectory /var/lib/rsyslog

$IncludeConfig /etc/rsyslog.d/*.conf
```

## RELP

RELP is a custom log protocol created by the maintainers of RSyslog attempting
to ensure logs are reliably delivered to particular servers. In practice I've
had significant issues RELP, mostly around it's reliability at sending logs
when all systems are operating normally and at low volumes. It was never able
to pass any of my deployment tests reliably enough for me to be able to make
use of it in production and I highly encourage it not be used.

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
concious way (such as integrating encryption, and third party message
signatures) and stability (such as log queues).

[1]: ../certificate_authority/
[2]: http://code.google.com/p/eventlog-to-syslog/
[3]: http://www.rsyslog.com/doc/sigprov_gt.html
[4]: http://guardtime.com/
