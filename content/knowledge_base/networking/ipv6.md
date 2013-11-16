---
title: IPv6
---

# IPv6

## Personal Security Thoughts

[Deployment Guide][1]

[1]: http://tools.ietf.org/html/draft-ietf-v6ops-enterprise-incremental-ipv6-01

### On Subnet Enumeration Through Scanning

Over and over again I've heard that it is completely infeasible to scan the
entirety of the IPv6 address space. 

Size of the IPv4 and IPv6 address space:

| IP Version | Bits | Total Address Space                                 | Most Prevalent Network Size |
| ---------- |----- | --------------------------------------------------- | --------------------------- |
| v4         | 32   | 4,294,967,296                                       | /24                         |
| v6         | 128  | 340,282,366,920,938,463,463,374,607,431,768,211,456 | /64                         |

At first glance this is very true, with traditional methods where you brute
force scan an entire subnet or range of subnets, yes this would take an
extraordinary amount of time. But what if we got smarter? Previously with IPv4
it was common to block all forms of ping packets, but with IPv6 ICMP has become
critical to its proper operation.

Best practice as it stands right now: Don't block any ICMP packets in IPv6
deployments.

Big deal right? You can't ping all of that address space! That would still take
a ridiculous amount of time!

Lets do some statistics right now. Each of these tests were done ten times with
the time averaged, were timed using the `time` command in linux. These times
ARE variable so I recommend doing your own testing. These are merely for
showing some values later on.

| Scan                    | LAN/WAN | Hosts: Up/Total | Total Scan Time | Average Time Per Host |
| ----------------------- | ------- | --------------- | --------------- | --------------------- |
| Nmap ping (nmap -n -sP) | LAN     | /256            | -               | -                     |
| Nmap ping (nmap -n -sP) | LAN     | /512            | -               | -                     |
| Nmap ping (nmap -n -sP) | LAN     | /1024           | -               | -                     |
| Nmap ping (nmap -n -sP) | WAN     | 2638/65536      | 591.513s        | 0.00902577s           |
|                         |         |                 | Average Time:   | -                     |

The entire world is your LAN. Sounds good right? Lets pretend for now that
everyone has a gigabit connection, the Internet backbone has gotten to a point
where it can support this volume of traffic and suddenly everyone all at the
same time just stops using their computer. While we're imagining the impossible
lets also ignore that pesky speed of light limit too. That computer you want to
talk to in the Seychelles has the exact same latency as the laptop next to you.

But what if we could make the world smaller? And by that I mean make the IPv6
address space smaller?

* http://pythonforfunandprofit.blogspot.com/2011/03/creating-distributed-ssh-brute-forcer_31.html

## Some IPv6 References

* http://fedoraproject.org/wiki/How_to_setup_tunnel_broker_via_Hurricane_Electric
* http://tehchimp.wordpress.com/2010/08/17/configuring-hurricane-electric-ipv6-tunnel/
* http://fedoraproject.org/wiki/IPv6Guide
* http://blog.martinshouse.com/2010/09/ipv6-cisco-1841-adsl-monowall.html

