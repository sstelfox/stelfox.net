---
title: IPTables
type: note
---

# iptables

iptables is the bread and butter linux firewall and the last defence before
traffic gets to the applications themselves.

## Security Notes

Since I strongly believe in the defence in-depth strategy, a very strong
hardened firewall both ingress and egress is very important. Ensuring that
iptables has a minimum number of ports open and is not allowing any more than
absolutely necessary for the server to perform it's duties is one of the first
tasks that should be undertaken after any addition or removal of network
services on a machine.

I've configured the default firewall with a few special case rules, such as
preventing non-standard scans and hampering standard scans (enough so that nmap
will stall out), preventing DOS attacks on any service running unless they've
been excluded from this rule.

## Logging

IPTables doesn't provide a way to change the facility that it uses to log
messages, however you can get around this limitation if you are using
[RSyslog][1]. Rsyslog can match based on a known prefix within the message,
IPTables can also be configured to prepend a configurable prefix to a log file.

### RSyslog

First we'll tell RSyslog what to do with the messages when they are received.
The following configuration should be added near the top of `/etc/rsyslog.conf`
but after loading any modules, this will prevent RSyslog from logging the
firewall messages anywhere else.

```
# Log firewall messages to a separate file and skip the rest of the rules
:msg, startswith, "iptables: " -/var/log/iptables.log
& ~
```

If you want the messages to appear in other logs leave out the line "& ~".

You'll need to reload RSyslog at this point for the changes to go into effect.

### Log Rotation

We also need to tell logrotate how to handle the log file. These options are
configurable, as it stands the configuration below saves one week worth of
logs, and rotates them daily. After rotating it sends a HUP signal to rsyslog
so that they release their file handles and start logging in the new files.
This should be placed in `/etc/logrotate.d/iptables`.

```
/var/log/iptables.log {
  rotate 7
  missingok
  notifempty
  daily
  postrotate
    /bin/kill -HUP `cat /var/run/syslogd.pid 2> /dev/null` 2> /dev/null || true
    /bin/kill -HUP `cat /var/run/rsyslogd.pid 2> /dev/null` 2> /dev/null || true
  endscript
}
```

### IPTables Logs

The final step is actually making iptables log the information you want. This
is as simple as appending `--log-prefix "iptables: "` to whatever LOG targets
you have configured. Like so:

```
-A INPUT -m state --state NEW -m tcp -p tcp --dport 22 -j LOG --log-prefix "iptables: "
```

That firewall rule, if placed above any accept rules will log all new
connections to the machine's SSH server after restarting iptables.

## Config Files

There is only one config file of note for Red Hat based systems:

* /etc/sysconfig/iptables

### /etc/sysconfig/iptables

The following is the default iptables rule set that I start from, changed
necessary for a service to run are noted on those services pages. It is pretty
well commented so reading through it should give anyone a pretty good idea of
what's going on.

```
*filter
:INPUT DROP [0:0]
:FORWARD DROP [0:0]
:OUTPUT DROP [0:0]

# Custom chains
:RFC1918 - [0:0]
:NO_FLOOD - [0:0]
:NO_SCANS - [0:0]
:SERVICES - [0:0]

# I trust the loop back device
-A INPUT -i lo -j ACCEPT
-A OUTPUT -o lo -j ACCEPT

# If an address has been declared evil in the past hour just drop all packets
# from it, they can go eat a dick until they're good for a whole hour
-A INPUT -m recent --name EVIL --update --seconds 3600 -j DROP

# For those that are less evil they have to be bad 10 times in an hour before
# I'll tell them to go eat a dick
-A INPUT -m recent --name LESSEVIL --update --seconds 3600 --hitcount 10 -j DROP

# Any already established connections should continue to be allowed
-A INPUT -m state --state RELATED,ESTABLISHED -j ACCEPT

# RFC1918 details reserved networks, none of them are routable across the
# internet. As such none should be talking to us except the ones we are a
# part of
-A INPUT -j RFC1918

# Large number of connections / flood attacks = bad for business, this
# will cap the number of new connections/second that a remote system
# can open. This may need to be tweaked depending on the services running
-A INPUT -j NO_FLOOD

# Check to see if the traffic matches any known type of scan, see the comments
# in the NO_SCANS chain for more information
-A INPUT -j NO_SCANS

# Go through the chain of approved services
-A INPUT -j SERVICES

# For local traffic that we haven't allowed I want to stop it gracefully
# so local applications don't have to wait for the packets to time out
-A INPUT -s 10.13.37.64/26 -j REJECT
-A INPUT -s 10.13.37.128/26 -j REJECT
-A INPUT -s 10.13.37.192/26 -j REJECT

# There is a default drop policy but I want to do it explicitly
-A INPUT -j DROP -m recent --set --name LESSEVIL

# None of these networks should be able to reach us as they aren't routable
# across the internet. The only exception being the local subnets we use
-A RFC1918 -s 10.13.37.0/26 -j RETURN
-A RFC1918 -s 10.13.37.64/26 -j RETURN
-A RFC1918 -s 10.13.37.128/26 -j RETURN
-A RFC1918 -s 10.13.37.192/26 -j RETURN
-A RFC1918 -s 10.0.0.0/8 -j LOG --log-prefix "Spoofed 10 source IP"
-A RFC1918 -s 10.0.0.0/8 -j DROP
# The 127 address space is not actually defined in RFC1918 however since we are
# already trusting our loop back device we shouldn't see any traffic from these
# addresses at this point in the filter
-A RFC1918 -s 127.0.0.0/8 -j LOG --log-prefix "Spoofed 127 source IP"
-A RFC1918 -s 127.0.0.0/8 -j DROP
-A RFC1918 -s 172.16.0.0/12 -j LOG --log-prefix "Spoofed 172 source IP"
-A RFC1918 -s 172.16.0.0/12 -j DROP
-A RFC1918 -s 192.168.0.0/16 -j LOG --log-prefix "Spoofed 192 source IP"
-A RFC1918 -s 192.168.0.0/16 -j DROP

# This chain rate limits new connections to all the services. There shouldn't
# be a lot of connections directly to this server, so lots of connections from
# one address probably indicates an attack
#
# This rule only kicks in if someone tries to open 20 new connections within
# 5 seconds. This is a pretty wide margin so it shouldn't affect normal services
-A NO_FLOOD -m state --state NEW -m recent --name FLOOD --set
-A NO_FLOOD -m state --state NEW -m recent --name FLOOD --update --seconds 5 --hitcount 20 --rttl -j LOG --log-prefix "Excessive new connections"
-A NO_FLOOD -m state --state NEW -m recent --name FLOOD --update --seconds 5 --hitcount 20 --rttl -j DROP

# These are various types of scans, I can check whats open by logging in
# so there shouldn't ever be a reason this machine is getting scanned. Where
# I know the name of the specific type of scan I have it mentioned. No valid
# traffic should have any of these values
#
# Block XMAS tree scans
-A NO_SCANS -m tcp -p tcp --tcp-flags ALL ALL -j LOG --log-prefix "XMAS tree scan attempt"
-A NO_SCANS -m tcp -p tcp --tcp-flags ALL ALL -j DROP -m recent --set --name EVIL

# Block Null scans
-A NO_SCANS -m tcp -p tcp --tcp-flags ALL NONE -j LOG --log-prefix "Null scan attempt"
-A NO_SCANS -m tcp -p tcp --tcp-flags ALL NONE -j DROP -m recent --set --name EVIL

# Stealth scan
-A NO_SCANS -m tcp -p tcp --tcp-flags SYN,ACK SYN,ACK -m state --state NEW -j LOG --log-prefix "Stealth scan attempt"
-A NO_SCANS -m tcp -p tcp --tcp-flags SYN,ACK SYN,ACK -m state --state NEW -j DROP -m recent --set --name EVIL

# SYN/FIN scan
-A NO_SCANS -m tcp -p tcp --tcp-flags SYN,FIN SYN,FIN -j LOG --log-prefix "SYN/FIN scan attempt"
-A NO_SCANS -m tcp -p tcp --tcp-flags SYN,FIN SYN,FIN -j DROP -m recent --set --name EVIL

# SYN/RST scan
-A NO_SCANS -m tcp -p tcp --tcp-flags SYN,RST SYN,RST -j LOG --log-prefix "SYN/RST scan attempt"
-A NO_SCANS -m tcp -p tcp --tcp-flags SYN,RST SYN,RST -j DROP -m recent --set --name EVIL

# Unknown, this is close to the XMAS tree attack however its missing PSH
-A NO_SCANS -m tcp -p tcp --tcp-flags ALL SYN,ACK,RST,URG,FIN -j LOG --log-prefix "Almost XMAS scan attempt"
-A NO_SCANS -m tcp -p tcp --tcp-flags ALL SYN,ACK,RST,URG,FIN -j DROP -m recent --set --name EVIL

# FIN/RST scan
-A NO_SCANS -m tcp -p tcp --tcp-flags FIN,RST FIN -j LOG --log-prefix "FIN/RST scan attempt"
-A NO_SCANS -m tcp -p tcp --tcp-flags FIN,RST FIN -j DROP -m recent --set --name EVIL

# ACK/FIN scan
-A NO_SCANS -m tcp -p tcp --tcp-flags ACK,FIN FIN -j LOG --log-prefix "ACK/FIN scan attempt"
-A NO_SCANS -m tcp -p tcp --tcp-flags ACK,FIN FIN -j DROP -m recent --set --name EVIL

# ACK/PSH scan
-A NO_SCANS -m tcp -p tcp --tcp-flags ACK,PSH PSH -j LOG --log-prefix "ACK/PSH scan attempt"
-A NO_SCANS -m tcp -p tcp --tcp-flags ACK,PSH PSH -j DROP -m recent --set --name EVIL

# ACK/URG scan
-A NO_SCANS -m tcp -p tcp --tcp-flags ACK,URG URG -j LOG --log-prefix "ACK/URG scan attempt"
-A NO_SCANS -m tcp -p tcp --tcp-flags ACK,URG URG -j DROP -m recent --set --name EVIL

# Allow SSH, but no more than 5 new connections every fifteen minutes outside of the local net
# This will also prevent the log from filling up with these messages by just dropping more connections
-A SERVICES -s 10.13.37.128/26 -m tcp -p tcp --dport 22 -j ACCEPT
-A SERVICES -s 10.13.37.192/26 -m tcp -p tcp --dport 22 -j ACCEPT
-A SERVICES -m tcp -p tcp --dport 22 -m state --state NEW -m recent --name SSH --set
-A SERVICES -m tcp -p tcp --dport 22 -m state --state NEW -m recent --update --seconds 900 --hitcount 6 --rttl --name SSH -j DROP
-A SERVICES -m tcp -p tcp --dport 22 -m state --state NEW -m recent --update --seconds 900 --hitcount 5 --rttl --name SSH -j LOG --log-prefix "SSH Brute Force"
-A SERVICES -m tcp -p tcp --dport 22 -m state --state NEW -m recent --update --seconds 900 --hitcount 5 --rttl --name SSH -j REJECT
-A SERVICES -m tcp -p tcp --dport 22 -m state --state NEW -j ACCEPT

# Accept ping from the internal subnets
-A SERVICES -s 10.13.37.64/26 -p icmp --icmp-type 8 -j ACCEPT
-A SERVICES -s 10.13.37.128/26 -p icmp --icmp-type 8 -j ACCEPT
-A SERVICES -s 10.13.37.192/26 -p icmp --icmp-type 8 -j ACCEPT

# Allow already established outgoing connections
-A OUTPUT -m state --state RELATED,ESTABLISHED -j ACCEPT

# Allow DNS queries to the forwarder
-A OUTPUT -d 10.13.37.193 -m udp -p udp --dport 53 -j ACCEPT

# Allow time sync updates from the local time source
-A OUTPUT -d 10.13.37.193 -m udp -p udp --dport 123 -j ACCEPT

# We need to make sure that the server can update itself when needed, this
# could be locked down a lot more by providing a local repository. It would
# also reduce overall traffic consumption and speed up updates/installs
-A OUTPUT -m tcp -p tcp --dport 80 -j ACCEPT
-A OUTPUT -m tcp -p tcp --dport 443 -j ACCEPT

# We send out email reports, let them out but log them
-A OUTPUT -m tcp -p tcp --dport 25 -j LOG --log-prefix "Email sent"
-A OUTPUT -m tcp -p tcp --dport 25 -j ACCEPT

# Anything else we don't want, but stop it gracefully so we don't have to
# wait for programs to time out
-A OUTPUT -j REJECT

COMMIT
```

## Blocking ISPs/AS Numbers

The following script generates rules to block the subnets associates with given
AS numbers. AS numbers can be found on [Arin's website][2] and [Team Cymru][3]
keeps a list of other places that keep this information.

block_as.sh:

```
#!/bin/bash

ASLIST="$@"

for ASNO in $ASLIST; do
  SUFFIX="$ASNO";
  #SUFFIX="" # enable this to gather all rules in one chain
  echo "iptables -N reject_as$SUFFIX";
  echo "ip6tables -N reject_as$SUFFIX";
  whois -B -i origin "AS$ASNO" \
    | grep '^route' \
    | while read proto prefix rest; do
        case "$proto" in
          route:) prog=iptables; ;;
          route6:) prog=ip6tables; ;;
          *) prog=echo; ;;
        esac
        echo "$prog -A "reject_as$SUFFIX" -s $prefix -j REJECT";
      done;
done
```

It fetches all network via whois and generates appropriate iptables rules.
Maybe you have to adjust your whois-Query since I only ran tests against the
ripe db.

Looks something like this:

```
[root@localhost ~]# ./block_as.sh 3320 6724
iptables -N reject_as3320
ip6tables -N reject_as3320
iptables -A reject_as3320 -s 193.103.152.0/22 -j REJECT
[...]
iptables -A reject_as3320 -s 134.97.128.0/17 -j REJECT
iptables -A reject_as3320 -s 194.156.246.0/24 -j REJECT
iptables -A reject_as3320 -s 91.222.232.0/22 -j REJECT
ip6tables -A reject_as3320 -s 2003:0000::/19 -j REJECT
ip6tables -A reject_as3320 -s 2003:0000::/20 -j REJECT
iptables -N reject_as6724
ip6tables -N reject_as6724
iptables -A reject_as6724 -s 192.67.198.0/24 -j REJECT
[...]
iptables -A reject_as6724 -s 85.214.0.0/15 -j REJECT
iptables -A reject_as6724 -s 81.169.128.0/17 -j REJECT
ip6tables -A reject_as6724 -s 2a01:238::/32 -j REJECT
```

[1]: ../rsyslog/
[2]: ftp://ftp.arin.net/info/asn.txt
[3]: http://www.team-cymru.org/Services/ip-to-asn.html

