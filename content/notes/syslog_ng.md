---
date: 2017-10-19 19:56:00-04:00
tags:
- linux
- security
title: Syslog-NG
---

Syslog-NG is a fast, reliable, and secure syslog daemon that can do advanced
processing and log centralization while maintaining a sane configuration file
syntax. I've recently come to vastly prefer it over my previous long term
favority [Rsyslog][3].

It's important to note that when modifying the logs statements, they will be
processed in order. This means log statements that finalize a message will
never make it past that statement. This finalization behavior can be a great
tool for optimizing the processing path of logs but can result in unexpected
behavior if you don't pay attention when re-ordering the statements.

```
@version: 3.7
@module system-source

options {
  # IP addresses are more reliable descriptors and doesn't require a network
  # connection for consistent logging
  use_dns(no);

  # Output log stats every 12 hours, and include details about individual
  # connections and log files.
  stats_freq(43200);
  stats_level(1);

  # Use a more standard timestamp, but keep the precision requested for
  # RFC5424 TIME-SECFRAC
  ts_format(iso);
  frac_digits(6);
};

source local {
  system();
  internal();
};

destination bootFile { file(/var/log/boot.log); };
destination cronFile { file(/var/log/cron); };
destination mailFile { file(/var/log/maillog); };
destination messageFile { file(/var/log/messages); };
destination secureFile { file(/var/log/secure); };
destination spoolFile { file(/var/log/spooler); };
destination syslogFile { file(/var/log/syslog); };

filter authpriv { facility(authpriv); };
filter boot { facility(local7); };
filter cron { facility(cron); };
filter kern { facility(kern); };
filter mail { facility(mail); };
filter messages { level(info) and not (facility(mail, authpriv, cron)); };
filter spool { facility(uucp) or (facility(news) and level(crit)); };
filter syslog { facility(syslog); };

log { source(local); filter(authpriv); destination(secureFile); };
log { source(local); filter(boot); destination(bootFile); };
log { source(local); filter(cron); destination(cronFile); };
log { source(local); filter(mail); destination(mailFile); };
log { source(local); filter(messages); destination(messageFile); };
log { source(local); filter(spool); destination(spoolFile); };
log { source(local); filter(syslog); destination(syslogFile); };
```

## Using a Log File as a Source

It is not uncommon for a daemon to write out its own log files rather than
using syslog. These files should usually be aggregated to a central log server
as well for future analysis. One example (if you don't already have it sending
to syslog) is auditd's log. The following source can be used to read that log
file:

```
source auditd {
  file(
    /var/log/audit/audit.log

    follow_freq(1)

    default_facility(local6)
    default_priority(info)

    flags(no_parse, sanitize_utf8)

    program_override(auditd)
  );
};
```

This config will poll the file once a second for any changes (you may want to
drop this for programs that don't log as often). I recommend setting a program,
facility, and priority as the defaults are not ideal for daemon logs. Know what
the flags mean and set them according to the file you're pulling in.

## Receiving Secure Logs from Other Hosts

System logs hold valuable diagnostic and security related events, but may
accidentally contain additional sensitive information. Whenever possible, log
senders should be authenticated and should be using an encrypted transport
mechanism. This is very easy to setup and tune with syslog-ng.

You should create a [certificate authority][1] dedicated to authenticating
clients to your logging infrastructure. The server cert does not have to be
signed by the same certificate as your clients, but your clients must be able
to verify the validity of the server using their CA. Clients should not use a
public CA for authentication as any attacker could purchase a valid certificate
and poison your log data.

Place the server certificate at `/etc/syslog-ng/server.crt` and it's associated
private key (no passphrase supported) at `/etc/syslog-ng/server.key`. Ensure
both have sane restrictive permissions such as `0600`. All certificates and
keys should be in the PEM format.

Create two directories `/etc/syslog-ng/ca.d` and `/etc/syslog-ng/crl.d`. Place
the CA certificate in the `ca.d` directory and switch to that directory.
syslog-ng uses the hashed directory format so a symlink needs to be created
with it's hash. The following one liner will create the appropriate hash link
for the certificate authority file `syslog_clients.crt`:

```
ln -s syslog_clients.crt $(openssl x509 -noout -hash -in syslog_clients.crt).0
```

If you have a CRL associated with the client certificate (doesn't hurt to
pre-generate an empty one and configure it now) place it in the `crl.d`
directory. This also needs a hash identifier but the name is slightly
different. This assumes a CRL file name of syslog_clients.crl, and that you're
in the `crl.d` directory:

TODO: Check and see if this works, x509 may need to be replaced with crl.
Ultimately the hash identifier needs to be the hash of the issuing CA so it may
simply need to be reused from the last step.

```
ln -s syslog_clients.crl $(openssl x509 -noout -hash -in syslog_clients.crl).r0
```

You'll also want to generate custom a custom dhparam file using the following
command:

```
openssl dhparam -out /etc/syslog-ng/dhparam.pem 2048
chmod 0600 /etc/syslog-ng/dhparam.pem
```

For the security and safety of your log server, I highly recommend restricting
the cipher list to only those supported by TLS 1.2 or later. You can find which
of these your log server supports by running the following command on it:

```
openssl ciphers -v | grep TLSv1.2 | awk '{ print $1 }' | tr '\n' ':' | sed -e 's/:$//'
```

The output of the above will be used in the `ciphers` parameter to `tls` in the
config below.

Similarly with ECDH curves, view what is supported on your system (and remove
the NIST curves just in case they really are untrustworthy):

```
openssl ecparam -list_curves | sed 's/://g' | awk '{ print $1 }' | grep -v prime | tr '\n' ':'
```

This list will be used as the contents of the `ecdh_curve_list` parameter to
`tls` in the config below.

```
source tlsListener {
  max_connections(100)

  syslog(
    trasport(tls)
    tls(
      ca_dir(/etc/syslog-ng/ca.d)
      crl_dir(/etc/syslog-ng/crl.d)

      dhparam_file(/etc/syslog-ng/dhparam.pem)

      cert_file(/etc/syslog-ng/server.crt)
      key_file(/etc/syslog-ng/server.key)

      ciphers(ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-SHA384:ECDHE-ECDSA-AES256-SHA384:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-SHA256:ECDHE-ECDSA-AES128-SHA256:AES256-GCM-SHA384:AES256-SHA256:AES128-GCM-SHA256:AES128-SHA256:DHE-DSS-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-SHA256:DHE-DSS-AES256-SHA256:DHE-DSS-AES128-GCM-SHA256:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES128-SHA256:DHE-DSS-AES128-SHA256)
      ecdh_curve_list(secp256k1:secp384r1:secp521r1)
      peer_verify(require_trusted)
      ssl_options(no_sslv2, no_sslv3, no_tlsv1)
    )

    so_rcvbuf(1MiB)
    so_sndbuf(1MiB)
  );

  tags(secure)
};

destination networkLogs {
  file(
    /var/log/remote/${HOST}/${YEAR}/${MONTH}/${DAY}_sys.log

    create_dirs(yes)
  )
};

log { source(tlsListener); destination(networkLogs) };
```

There are a few parameters that should be tuned to your specific log host.
Those being the `max_connections`, `so_rcvbuf` and `so_sndbuf`.

The `max_connections` option is easy, it should be set based on the number of
log clients you expect to have. There is memory overhead for each of these
slots so setting it very high to ignore it isn't ideal, it's still a good idea
to give yourself ~30% overhead to accomadate future clients and reconnection
surges when the server may not be aware clients disconnected.

The buffer settings should be set based on the peak number of messages any
individual client may produce. This is initially hard to guess, but can be easy
to measure if you use the graphite plugin to monitor incoming log volumes.
Details on tuning this is provided in the syslog-ng Open Source Edition
Administrator Guide in section 6.5.1, but roughly it seems that 1MiB of buffer
is roughly able to support 1k msg/s.

Adjustments to `so_rcvbuf` may require changing the system's
`net.core.rmem_max` sysctl parameter, and `so_sndbuf` may require changing the
system's `net.core.wmem_max` sysctl parameter. `so_sndbuf` is much less
important here than on the clients so it may also be omitted in the interest of
saving memory.

The other two considerations for this are largely administrator preference. The
first, I prefer to tag my logs that come in through this mechanism as 'secure'
since we received them authenticated, and encrypted. It is very unlikely they
were tampered with in transit. This is used to differentiate with logs that
came in through the UDP network mechanism from clients that don't support
sending their logs over TLS. If you prefer to save the few bytes with every
message you can remove the `tags` config or adjust it to your liking.

The other is the path for per-host logs (defined in the destination). I would
consider carefully what the most likely use case of the logs are going to be
(when are you going to want to access them?). There are generally two schools
of thought for these types of file, host centric or date centric.

If you are likely going to be using your raw log files to investigate an issue
on an individual host (performance issue, limited security breach, etc) then a
host centric view is going to be most efficient for you. If instead you want to
see paterns or similarities between many hosts at once during a certain time
window (large security breach, common changes such as package upgrades between
several hosts, etc), it'll likely be easier to work with your logs based on the
date. I prefer the host centric approach as I additionally push my logs into
graylog, but limit the time window that graylog keeps relying on these on disk
files for long term archiving.

You'll need to allow tcp port 6514 inbound on your host's firewall from your
log clients (I usually allow the whole network since this is a heavily
authenticated service).

## Receiving Insecure Logs from Other Hosts

Note all log generators support sending their logs over the network using TLS
with client certificates. Most switches and routers only support sending their
log information using UDP. We get no authentication or privacy guarantees so
they may be spoofed fairly easily, reviewing these when looking for hostile
actions should be viewed in this light. The logs themselves are still
potentially invaluable information for diagnostic and incident response and
thus should still be collected.

Due to the potential for abuse of this I highly recommend you create a filter
that whitelist IPs allowed to send to this destination. (TODO: Give an example
of this)

```
source udpListener {
  syslog(
    transport(udp)
    tags(insecure)
  )
};

log { source(udpListener); destination(networkLogs) };
```

Generally the devices that I have sending UDP only logs to my server have a
fairly low volume, if you do have high incoming volumes, you'll likely want to
increase the `so_rcvbuf` option.

I reuse the same destination target for this as used in the secure log
reception, if you aren't using that be sure to pull the `networkLogs`
destination from there.

The log statements between to the two can be combined to simplify the reasoning
around what will end up in the final logs. Filtering of specific sources and be
handled with channels within the log context if so desired.

You'll need to open udp port 514 inbound from your insecure log client to allow
the logs through.

### Secure Flag Spoofing

With the current config it is possible for an insecure client to set the secure
flag before syslog-ng receives it. Ideally this source would remove the tag if
it is set. A rewrite rule like the following can be used to remove the tag:

```
rewrite secureRemoval {
  clear_tag(secure);
};
```

The problem with the above is rewrites can't be applied directly to sources,
they have to be part of a log statement. There are advanced uses involving
nested logs that may provide this but I haven't looked into it. The alternative
is to specify a filter like the following and use it in places where I only
care about the secure logs (which is currently my preferred choice):

```
filter secureOnly { tags(secure) and not tags(insecure); };
```

It may also be useful to separately log these attempts to pollute the logs
using something like the following:

```
destination spoofed { file(/var/log/network/spoofed_secure.log); };
filter spoofedSecure { tags(secure, insecure); };
log { source(tlsListener); filter(spoofedSecure); destination(spoofed); flags(final); }
```

## Sending Logs Securely

To match our secure reception, we need to be able to securely send logs to our
central log host. Similar to the server portion of this you'll need to generate
a client certificate & key pair, as well as place the server's issuing cert (or
chain of certs) into `/etc/syslog-ng/ca.d` and perform the same hashing step on
each individual certificate as was done in the server portion.

If the server certificate is publicly verifiable, you can instead point
`ca_dir` at the system directory (which on my test system is /etc/ssl/certs).
Ensure this directory uses the hashing format by looking for taletell symlinks
with names similar to `ce5e74ef.0`.

```
destination tlsLogServer {
  syslog(
    10.0.0.10

    disk_buffer(
      disk_buf_size(256MiB)
      mem_buf_size(16MiB)
      reliable(no)
    )

    transport(tls)
    tls(
      ca_dir(/etc/syslog-ng/ca.d/)

      cert_file(/etc/syslog-ng/client.crt)
      key_file(/etc/syslog-ng/client.key)

      ciphers(ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-SHA384:ECDHE-ECDSA-AES256-SHA384:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-SHA256:ECDHE-ECDSA-AES128-SHA256:AES256-GCM-SHA384:AES256-SHA256:AES128-GCM-SHA256:AES128-SHA256:DHE-DSS-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-SHA256:DHE-DSS-AES256-SHA256:DHE-DSS-AES128-GCM-SHA256:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES128-SHA256:DHE-DSS-AES128-SHA256)
      ecdh_curve_list(secp256k1:secp384r1:secp521r1)
      peer_verify(require_trusted)
      ssl_options(no_sslv2, no_sslv3, no_tlsv1)
    );
  );
};

log { source(local); destination(tlsLogServer); };
```

You should replace `10.0.0.10` with the IP or hostname of your log host.

As with the server side there is some level of tuning required for your
specific setup. One that is missing but may be relevant is the `so_sndbuf`
option which might need tuning from the defaults, but due to the buffer on the
system is less valuable here than on the receiver.

The disk / memory buffer has two modes of operation which should be considered
based on your deployment. When the `reliable` option is disabled, and the
connection to the log server is backed up or lost, messages will begin by first
queueing to memory and when that fills up will begin queueing to disk.

The documentation on the reliable mode was a bit confusing but if I read it
correctly, when lost it will buffer to both memory and disk, when the memory
fills up it will continue buffering to disk only which seems to largely make
the memory buffer redundant.

Both modes guarantee message delivery in the event there is only a connection
issue, but only the reliable mode guarantees message delivery in the event
syslog-ng reloads, restarts, or crashes at the expense of a large performance
hit. For the systems I operate that performance penalty for a slim chance of
message loss is not worth the trade off, but environments under certain
compliance requirements may not have the luxury of allowing that trade off.

You'll need to allow tcp port 6514 outbound in your host's firewall to the
logserver to ensure your logs arrive.

While not required, I highly recommend enabling mark messages (in another
section in this document) for all outbound network based destinations to be
used as a health indicator for the connection and host.

## Mark Messages

When sending logs to a remote system it can be incredibly valuable to know
whether the sending host has not sent anything because it or its logging daemon
are down or if there simply has not been any log generated on the machine.

The destinations themselves can take a couple of mark options to send along a
mark notice whenever there has been no desitnation traffic. The following is an
example of sending a mark after 15 minutes of inactivity to a destination:

```
mark_freq(900);
mark_mode(dst_idle);
```

There are more mark modes which can be specified and are detailed in chapter 9
of the syslog-ng OSE admin guide (though dst_idle, none, and periodical are the
only ones I find of value).

## Testing Sources, Filters, and Destinations

Before relying on a complex set of rules you should test them extensively.
Normally this would be rather tricky, relying on legitimate messages to come
in. This task is easier if the host you're testing is a log server, but that
limits your testing to simply that source.

Since syslog-ng allows a source to be a combination of individual sources, we
can turn individual sources into a log server and test directly against them
using the logger utility. This should be done one source at a time (though by
setting different ports you could potentially test them all at once).

If I wanted to test the following source:

```
source local {
  system();
  internal();
};
```

I would add a syslog block like so:

```
source local {
  system();
  internal();

  syslog(
    ip(127.0.0.1)
    port(5014)
    transport(udp)
    tags(testCase)
  );
};
```

After a restart, you can use the logger utility to send messages like so:

```
logger --udp --server 127.0.0.1 --port 5014 --tag syslogTest --id=$$ --priority local1.info "Test message"
```

A few important details from this, when filtering on program name, you'll want
to modify the `--tag` parameter. The message is the last quoted portion, the
facility is the portion before the period in the priority, and the severity the
portion after the dot.

If you perform filtering based on IP you'll need to modify the specific IP to
match against 127.0.0.1.

Establish your test and check all of your filters for both positive and
negative matches, and ensure all configured destinations are outputing the
expected results. Once testing is complete, be sure to remove the extra source.

I like to additionally test, on an actual system what messages I might be
missing from sources. Adding the following rules will log all messages that
haven't matched any filters to `/var/log/fallback.log`. I recommend adding all
of your sources to the log entry.

```
destination fallback {
  file(
    /var/log/fallback.log

    template("${ISODATE} ${SOURCE}->${FACILITY}.${LEVEL} ${PROGRAM} ${TAG} ${MSGID} ${MSG}\n")
    template_escape(no)
  );
};
log { source(local); destination(fallback); flags(fallback); };
```

## Audit Log Filter

If you have [auditd][2] configured to send it's messages to syslog via it's
dispatcher it is useful to filter those out into their own file so the audit
reporting tools can still operate on them. The following example is intended to
be used with the config documented on my [auditd][2] page as well as the
listener defined in the secure log reception section in on this page.

Pay attention to the location of where these blocks are placed as they include
a `final` flag to prevent polluting the normal logs from the hosts.

```
destination networkAuditFile {
  file (
    /var/log/remote/${HOST}/${YEAR}/${MONTH}/${DAY}_audit.log

    # We need to strip out the headers so the utilities can understand the
    # format
    template("${MSG}\n")
    template_escape(no)
  );
};

# Info filter is required as audispd will include status reports about it's
# operations.
filter auditLogs {
  program(audispd) and facility(local6) and level(info);
};

# The filter `secureOnly` is mentioned in the insecure logs from other hosts
# section and can be removed is you don't receive insecure logs.
log {
  source(tlsListener);
  destination(networkAuditFile);

  filter(auditLogs);
  filter(secureOnly);

  flags(final);
}
```

With this in place you can make use of the audit tools as normal, while on the
log host, by cat'ing in appropriate file(s) into the tool. For an example:

```
cat /var/log/remote/testhost.example.tld/2017/10/19_audit.log | aureport --interpret --failed --executable
```

## Value Parsing Concern

The default value when using a parser on the incoming log data is to simply
drop a message. I *NEVER* want to lose a message because of a bug in the
parser. At the same time if a data source is expecting a type and it doesn't
get it, that could cause harm to the data source. Maybe the log message does go
through to the internal() messaging source and it simply won't show up at the
destination (test this). Alternatively I can try and send it anyway by setting
the following global option:

```
on-error(fallback-to-string);
```

## Future Work

There is a package named logcheck that seems interesting for extracting
anomalous events from logs. It may be useful directly or at least as a
reference for anomalous events. syslog-ng is capable of some pretty powerful
processing, which when combined with the smtp endpoint, may be sufficient on
its own (there are also more powerful tools such as graylog as well).

There are use flags for enable smtp destinations, json handling, and amqp
destinations. They may be useful and should be looked into to see what kind of
value I can get out of them.

I may want to modify the group() and user() variable to drop permissions when I
can... Reduce privileges wherever possible.

Very good chance that the process accounting logs are something worth
investigating, but that is beyond the scope of this page.

For logs coming in from TLS authenticated clients we can inject the
certificate's CN by modifying that destinations template to include
`${.TLS.X509_CN}`. I'm not sure if that is worth while but could add extra
validity information.

[1]: {{< relref "notes/certificate_authority.md" >}}
[2]: {{< relref "notes/auditd.md" >}}
[3]: {{< relref "notes/rsyslog.md" >}}
