---
title: fail2ban
---

# Fail2Ban

fail2ban provides a vital service of blocking troublesome IPs from attempting
brute force logins.

My immediate issue is that it requires a few packages off the bat that I do not
want on my system. Specifically tcpwrappers and shorewall. My firewall scripts
are stronger, easier to use, and IMHO more secure than what shorewall provides
and I don't need it. Neither does the fail2ban package as indicated in [this
ticket][1] on the redhat bug tracker.

TODO: [MySQL][2] logs now that the documented configuration logs authorization
failures.

## Installation

So what's my solution? Fuck the man we're doing this my way. Regular install
through yum, force the old packages out using rpm, and exclude fail2ban from
updating (and preventing those damn packages from coming back). This is done
using the following commands:

```
[root@localhost ~]# yum install fail2ban -y
[root@localhost ~]# rpm -v --nodeps -e shorewall tcp_wrappers
```

Finally add this line to `/etc/yum.conf`.

```
exclude=fail2ban shorewall tcp_wrappers
```

There are of course security implication too not updating a package (in this
case fail2ban won't ever get updated) however it's an exception that I'm
willing to make to get fail2ban and not have the shitty shittiness of shorewall
and tcp_wrappers on my systems.

## Firewall Modifications

There are some small changes that need to be made to the firewall script that
should probably be merged with the default as they can't hurt and having
fail2ban easily available to my default config would be a significant benefit.

The changes are specifically:

* Add an "OFFENDINGIPS" chain
* Push all incoming traffic through the OFFENDINGIPS chain before continuing
  through the INPUT chain
* Add a rule to the OFFENDINGIPS chain to prevent ongoing attacks from getting
  through for the duration of the attack

The chain definition (near the top) should look like this:

```
:OFFENDINGIPS - [0:0]
```

Push all the traffic through the chain looks like this (this belongs above all other INPUT chain rules):

```
# [DEF-RULESET] Pass all traffic through the OFFENDINGIPS table to block
# any hosts that have been caught being malicious in some way
-A INPUT -j OFFENDINGIPS
```

Rule to prevent ongoing attacks:

```
# [DEF-RULESET] If something keeps trying to connect after we have marked
# them as an attacker, keep blocking them until they stop for a full hour.
# When fail2ban is adding IPs to this table, it will initially mark them
# as an ATTACKER and they will be banned for a minimum of the fail2ban time,
# but it will be indefinite as long as they keep trying 
-A OFFENDINGIPS -m recent --name ATTACKER --update --seconds 3600 -j DROP
```

## Configuration

I've noticed that the documentation on the actual raw config files for fail2ban
is really poor. Most of the documentation I've found is drop in files for
specific services but completely unable to find coherent documentation on all
the options in the actions files. Sure signs of amateur work which disheartens
me. This package is still useful though...

### /etc/fail2ban/fail2ban.conf

```
[Definition]
# Log informational level messages
loglevel = 3

# Log to syslog
logtarget = SYSLOG

socket = /var/run/fail2ban/fail2ban.sock
```

### /etc/fail2ban/jail.conf

```ini
[DEFAULT]

# Never ban localhost or the internal network
ignoreip = 127.0.0.1 10.13.37.0/24

# Number of seconds that a host is banned by default (12 Hours)
bantime  = 43200

# The time period to look for number of failed attempts
findtime = 600

# The number of failures before a host get banned
maxretry = 5

# Pick the best backend based on what's available on the system
backend  = auto

[ssh-iptables]
enabled  = true
filter   = sshd
action   = iptables
logpath  = /var/log/secure

# If asterisk is installed on this machine turn this on. The log path assumes you've followed the configuration in the FKAM wiki.
[asterisk-iptables]
enabled  = false
filter   = asterisk
action   = iptables
logpath  = /var/log/asterisk.log
```

### /etc/fail2ban/filter.d/sshd.conf

```
[INCLUDES]
# Include common.conf before this file
before = common.conf

[Definition]
_daemon = sshd

failregex = ^%(__prefix_line)s(?:error: PAM: )?Authentication failure for .* from <HOST>\s*$
            ^%(__prefix_line)s(?:error: PAM: )?User not known to the underlying authentication module for .* from <HOST>\s*$
            ^%(__prefix_line)sFailed (?:password|publickey) for .* from <HOST>(?: port \d*)?(?: ssh\d*)?$
            ^%(__prefix_line)sROOT LOGIN REFUSED.* FROM <HOST>\s*$
            ^%(__prefix_line)s[iI](?:llegal|nvalid) user .* from <HOST>\s*$
            ^%(__prefix_line)sUser \S+ from <HOST> not allowed because not listed in AllowUsers$
            ^%(__prefix_line)sauthentication failure; logname=\S* uid=\S* euid=\S* tty=\S* ruser=\S* rhost=<HOST>(?:\s+user=.*)?\s*$
            ^%(__prefix_line)srefused connect from \S+ \(<HOST>\)\s*$
            ^%(__prefix_line)sAddress <HOST> .* POSSIBLE BREAK-IN ATTEMPT!*\s*$
            ^%(__prefix_line)sUser \S+ from <HOST> not allowed because none of user's groups are listed in AllowGroups$

ignoreregex =
```

### /etc/fail2ban/filter.d/asterisk.conf

This file required a bit of special attention, I noticed that the one set of
regular expressions that have been copied and pasted everywhere DIDN'T MATCH
actual logs. They didn't take into account the port, and frankly I like
matching the whole line rather than just part of it. I modified the expressions
which are now below. They are perfectly backwards compatible with older
versions of asterisk that may not include the port and as a bonus will match
against syslog output if you are logging to syslog as well.

```ini
[INCLUDES]
before = common.conf

[Definition]
_daemon = asterisk

# These are the regular expressions that will trigger fail2ban into blocking an
# IP address for an asterisk 1.8 installation. The first regular expression
# should match against the following line taken directly from a misconfigured
# client:
#
# Nov  9 18:47:21 pbx asterisk[3432]: NOTICE[3445]: chan_sip.c:24331 in handle_request_register: Registration from 'INCOMING CALL <sip:SPA3000_PSTN@10.13.37.102>' failed for '10.13.37.101:5061' - No matching peer found
failregex = ^%(__prefix_line)s?NOTICE\[[0-9]+\]: chan_sip.c:[0-9]+ in handle_request_register: Registration from '.*' failed for '<HOST>(:[0-9]+)?' - No matching peer found\s*$
#
# The following should match against the following line log taken directly from
# an attack:
# Nov 14 06:32:16 pbx asterisk: NOTICE[1640]: chan_sip.c:21975 in handle_request_invite: Sending fake auth rejection for device "sip" <sip:sip@91.226.97.107>;tag=L7922NDHSn
            ^%(__prefix_line)s?NOTICE\[[0-9]+\]: chan_sip.c:[0-9]+ in handle_request_invite: Sending fake auth rejection for device ".*" <sip:.*@<HOST>>;tag=[a-zA-Z0-9]+\s*$
#
# The following regexes were provided through an asterisk forum, they are a bit
# sloppy and might be outdated. I've already updated one (the first one above)
# to reflect what I actually see in my logs. The rest will be updated as
# I see the attacks
#
#           ^%(__prefix_line)s?NOTICE.*: Registration from '.*' failed for '<HOST>(:[0-9]+)?' - Wrong Password\s*$
#           ^%(__prefix_line)s?NOTICE.*: Registration from '.*' failed for '<HOST>(:[0-9]+)?' - Username/auth name mismatch\s*$
#           ^%(__prefix_line)s?NOTICE.*: Registration from '.*' failed for '<HOST>(:[0-9]+)?' - Device does not match ACL\s*$
#           ^%(__prefix_line)s?NOTICE.* <HOST>(:[0-9]+)? failed to authenticate as '.*'\s*$
#           ^%(__prefix_line)s?NOTICE.*: No registration for peer '.*' \(from <HOST>(:[0-9]+)?\)\s*$
#           ^%(__prefix_line)s?NOTICE.*: Host <HOST>(:[0-9]+)? failed MD5 authentication for '.*' (.*)\s*$
#           ^%(__prefix_line)s?NOTICE.*: Failed to authenticate user .*@<HOST>(:[0-9]+)?.*\s*$

ignoreregex =
```

Some notes on this specific file. I found 'pre-made' asterisk configurations
for fail2ban on the internet and found them to be very lacking. The did not
deal with an attack log I saw actually hitting my server the 'Sending fake
auth rejection' log specifically.

I was also greatly displeased by their performance. By making the regular
expression more specific (without sacrificing positive matches) I was able to
get a real world performance increase of 442%.

This was measured using the unix 'time' program and fail2ban's regular
expression tester 'fail2ban-regex'. As an example with one rule (the 'No
matching peer found' log) turned on in each test, first the old than my updated
one gave the following results:

```
[root@localhost ~]# time fail2ban-regex /var/log/asterisk.log /etc/fail2ban/filter.d/old-asterisk.conf > /dev/null

real    0m1.621s
user    0m1.534s
sys     0m0.049s
[root@localhost ~]# time fail2ban-regex /var/log/asterisk.log /etc/fail2ban/filter.d/asterisk.conf > /dev/null

real    0m0.367s
user    0m0.298s
sys     0m0.047s
```

### /etc/fail2ban/actions.d/iptables.conf

```ini
[Init]
# The following had defaults that I wasn't happy with, but now they're not being
# used anyways as I don't want offending hosts talking to *any* service on this
# server until the ban expires. IF you just want to block access to the offending
# service these SHOULD NOT have defaults, the triggering rule should apply them
# so they actually block just that service rather than mess up whatever the default
# is
#name =
#port =
#protocol =

# This is the manual table that I setup to handle blocked hosts
table = OFFENDINGIPS

[Definition]

# The commands that get executed when fail2ban starts up
# We don't need to do anything since I take care of this manually and permanently
actionstart =

# The commands that get executed when fail2ban shuts down
# We don't need to do anything since I take care of this manually and permanently
actionstop =

# There doesn't really seem to be any documentation on what this actually does,
# I've modified it so it will look at the appropriate table and it appears that
# it's just checking to make sure that the INPUT table is properly redirecting
# to the table that has the offending hosts in it
actioncheck = iptables -n -L INPUT | grep -q <table>

# This command bans the offending IP and marks them as an attacker
actionban = iptables -A <table> -s <ip> -j LOG --log-prefix "Attacker's Back "
            iptables -A <table> -s <ip> -m recent --set --name ATTACKER -j DROP

# This command removes an IP from the ban-list
actionunban = iptables -D <table> -s <ip> -j LOG --log-prefix "Attacker's Back "
              iptables -D <table> -s <ip> -j DROP
```

## Testing Matches/Regexes/Bans Without Making the System Live

### Validation Configuration

Using the following command you can verify that the configuration is valid and
that fail2ban will be happy with what you told it. It's output isn't very
friendly but it'll do in a pinch.

```
[root@localhost ~]# fail2ban-client -d
```

### Validation Regular Expressions

First off you'll need a sample of the log that your going to be matching
against. If the message is already in your log more power to you, you can use
that logfile as the input (and it's what I did).

As for the regex, the tool supports passing the full thing on the command line
HOWEVER it doesn't expand fail2ban REGEX variables beyond <HOST> (that is those
defined in the common.conf file) which means you won't get an accurate
representation on a match.

The best way is to define the regex in a filter file for fail2ban and run the
tool like so (This is from me testing asterisk with the output from my test):

```
[root@localhost ~]# fail2ban-regex /var/log/asterisk.log /etc/fail2ban/filter.d/asterisk.conf

Running tests
=============

Use regex file : /etc/fail2ban/filter.d/asterisk.conf
Use log file   : /var/log/asterisk.log


Results
=======

Failregex
|- Regular expressions:
|  [1] ^\s*(?:\S+ )?(?:@vserver_\S+ )?(?:(?:\[\d+\])?:\s+[\[\(]?asterisk(?:\(\S+\))?[\]\)]?:?|[\[\(]?asterisk(?:\(\S+\))?[\]\)]?:?(?:\[\d+\])?:)?\s*?NOTICE.*: Registration from '.*' failed for '<HOST>(:[0-9]+)?' - Wrong Password\s*$
|  [2] ^\s*(?:\S+ )?(?:@vserver_\S+ )?(?:(?:\[\d+\])?:\s+[\[\(]?asterisk(?:\(\S+\))?[\]\)]?:?|[\[\(]?asterisk(?:\(\S+\))?[\]\)]?:?(?:\[\d+\])?:)?\s*?NOTICE.*: Registration from '.*' failed for '<HOST>(:[0-9]+)?' - No matching peer found\s*$
|  [3] ^\s*(?:\S+ )?(?:@vserver_\S+ )?(?:(?:\[\d+\])?:\s+[\[\(]?asterisk(?:\(\S+\))?[\]\)]?:?|[\[\(]?asterisk(?:\(\S+\))?[\]\)]?:?(?:\[\d+\])?:)?\s*?NOTICE.*: Registration from '.*' failed for '<HOST>(:[0-9]+)?' - Username/auth name mismatch\s*$
|  [4] ^\s*(?:\S+ )?(?:@vserver_\S+ )?(?:(?:\[\d+\])?:\s+[\[\(]?asterisk(?:\(\S+\))?[\]\)]?:?|[\[\(]?asterisk(?:\(\S+\))?[\]\)]?:?(?:\[\d+\])?:)?\s*?NOTICE.*: Registration from '.*' failed for '<HOST>(:[0-9]+)?' - Device does not match ACL\s*$
|  [5] ^\s*(?:\S+ )?(?:@vserver_\S+ )?(?:(?:\[\d+\])?:\s+[\[\(]?asterisk(?:\(\S+\))?[\]\)]?:?|[\[\(]?asterisk(?:\(\S+\))?[\]\)]?:?(?:\[\d+\])?:)?\s*?NOTICE.* <HOST>(:[0-9]+)? failed to authenticate as '.*'\s*$
|  [6] ^\s*(?:\S+ )?(?:@vserver_\S+ )?(?:(?:\[\d+\])?:\s+[\[\(]?asterisk(?:\(\S+\))?[\]\)]?:?|[\[\(]?asterisk(?:\(\S+\))?[\]\)]?:?(?:\[\d+\])?:)?\s*?NOTICE.*: No registration for peer '.*' \(from <HOST>(:[0-9]+)?\)\s*$
|  [7] ^\s*(?:\S+ )?(?:@vserver_\S+ )?(?:(?:\[\d+\])?:\s+[\[\(]?asterisk(?:\(\S+\))?[\]\)]?:?|[\[\(]?asterisk(?:\(\S+\))?[\]\)]?:?(?:\[\d+\])?:)?\s*?NOTICE.*: Host <HOST>(:[0-9]+)? failed MD5 authentication for '.*' (.*)\s*$
|  [8] ^\s*(?:\S+ )?(?:@vserver_\S+ )?(?:(?:\[\d+\])?:\s+[\[\(]?asterisk(?:\(\S+\))?[\]\)]?:?|[\[\(]?asterisk(?:\(\S+\))?[\]\)]?:?(?:\[\d+\])?:)?\s*?NOTICE.*: Failed to authenticate user .*@<HOST>(:[0-9]+)?.*\s*$
|
`- Number of matches:
   [1] 0 match(es)
   [2] 75 match(es)
   [3] 0 match(es)
   [4] 0 match(es)
   [5] 0 match(es)
   [6] 0 match(es)
   [7] 0 match(es)
   [8] 0 match(es)

Ignoreregex
|- Regular expressions:
|
`- Number of matches:

Summary
=======

Addresses found:
[1]
[2]
    X.X.X.X (Mon Nov 07 11:55:38 2011)
    X.X.X.X (Mon Nov 07 11:55:38 2011)
    X.X.X.X (Mon Nov 07 11:55:39 2011)
    X.X.X.X (Mon Nov 07 11:55:39 2011)
    Y.Y.Y.Y (Wed Nov 09 04:13:36 2011)
    Y.Y.Y.Y (Wed Nov 09 04:33:36 2011)
    Y.Y.Y.Y (Wed Nov 09 08:33:37 2011)
    Y.Y.Y.Y (Wed Nov 09 08:33:37 2011)
[3]
[4]
[5]
[6]
[7]
[8]

Date template hits:
13339 hit(s): MONTH Day Hour:Minute:Second
0 hit(s): WEEKDAY MONTH Day Hour:Minute:Second Year
0 hit(s): WEEKDAY MONTH Day Hour:Minute:Second
0 hit(s): Year/Month/Day Hour:Minute:Second
0 hit(s): Day/Month/Year Hour:Minute:Second
0 hit(s): Day/MONTH/Year:Hour:Minute:Second
0 hit(s): Month/Day/Year:Hour:Minute:Second
0 hit(s): Year-Month-Day Hour:Minute:Second
0 hit(s): Day-MONTH-Year Hour:Minute:Second[.Millisecond]
0 hit(s): Day-Month-Year Hour:Minute:Second
0 hit(s): TAI64N
0 hit(s): Epoch
0 hit(s): ISO 8601
0 hit(s): Hour:Minute:Second
0 hit(s): <Month/Day/Year@Hour:Minute:Second>

Success, the total number of match is 75

However, look at the above section 'Running tests' which could contain
important information.
```

The above shows that I have 75 matches and the IPs (removed) that matched
against which rule.

[1]: https://bugzilla.redhat.com/show_bug.cgi?id=244275
[2]: ../mysql/

