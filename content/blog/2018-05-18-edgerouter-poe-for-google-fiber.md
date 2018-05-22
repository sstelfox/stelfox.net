---
date: 2018-05-15T18:41:09-06:00
draft: true
tags:
- network
- ubiquiti
title: Setting Up EdgeRouter PoE on Google Fiber
---

I recently moved to an area with Google Fiber and jumped on the chance to have
a cheap, fast, low-latency connection by a company that was actively supporting
the real tenets of net neutrality. I already had a router that was capable of
routing a gigabit worth of small packets (The [Ubiquiti EdgeRouter PoE 5][1]).

When setting up my service I chatted with a support representative that told me
that I could use my own router, but I would still need the Google Fiber Network
Box. When picking up the box from the local store presence, they confirmed the
same thing and told me I just needed to put the Network Box into bridge mode.

After returning home, I plugged everything in and verified my service was
working with the box. I setup my router, running through the 'Basic Setup'
wizard. I confirmed everything was working with double NAT then I went to
enable bridge modem the network box...

Except there is no bridge mode. Let the frantic Googling begin.

[Other][2] [people][3] have been in this situation [before][4] and have written
up their own very good documentation on very similar setups. A lot of the
information is at least a year old so it was worth double checking. I also
found that many of them went more complex than I needed in some ways (a
dedicated guest VLAN) and in other ways not far enough (IPv6, custom DNS).

One thing I will say ahead of time. I'm not adventuring into the TV service as
I don't have it. From the messages I read, if you want this a cheap Gigabit
switch between your router and the fiber jack that you can additionally plug
the TV box into will do the trick (but you'll want to disable the PoE settings
if you go this route).

There was some discussion from an official Google representative in one of the
many threads that made a passing mention they would switch to untagged traffic
so I wanted to verify what was happening. For this I [became the wire][5] and
sniffed the traffic directly. The settings on the wire matched the contents of
a deleted post from a Google representative early on in [this thread][4]
reproduced here:

> Here's the gory details if you really want to use your own router:
>
> 1. Traffic in/out of the fiberjack is vlan tagged with vlan2.
> 2. DHCP traffic should have 802.1p bit = 2
> 3. IGMP traffic should have 802.1p bit = 6
> 4. All other internet traffic 802.1p bit = 3
>
> You can send data without the 802.1p bits but your performance will get
> throttled to something like 10Mbit.
>
> NOTE:  This data is subject to change.  We are planning on changing the data
> in/out of the fiberjack to be untagged, which will then make it really easy
> for you to connect your own router.
>
> A word of warning, most consumer routers don't have hardware forwarding (that
> is my feeble understanding) so you might not be happy with the performance on
> your network, and which will also probably affect tv service quality.

One other piece of information that I gleaned from the traffic capture is that
the IPv6 prefix length of /56. If you reproduce this, look into the DHCPv6
messages for a pair of solicit / request (actually a response but that is how
it is labeled).

I was concerned about the VLAN tagging as it may force the packets to be
software routed preventing me from hitting the full potential of the
connection. The EdgeRouter PoE though has hardware offloading for VLAN tagging
available so this turned out not to be an issue. For anyone using this as a
reference for another router, you'll want to make sure it supports this.

## Basic Connectivity

The first task was to get basic IPv4 connectivity going. When I started the
configuration my router was on version 1.9.1.1, which I upgraded to 1.10.1
*after* I finished all of the configuration, not just from this section
([always keep your network equipment updated][6]).

To accomplish this we need outbound traffic tagged with VLAN 2. If we want to
get the full speed out of our link we additionally need to mark our egress
packets with the appropriate service control values. Setting these up is best
done all at once as changes to the egress QoS mapping requires [manual editing
and restarting][7] of the router. As a bonus we'll also power the Fiber Jack
using PoE from the EdgeRouter.

As far as I can tell, there is no way on the EdgeRouter PoE to perform egress
mapping on different traffic protocols (maybe using the advanced traffic
control settings but I didn't explore those). I don't care about IGMP traffic
(this will largely be for the TV service) so I ignored those settings and I
confirmed that DHCP will get an address when tagged with a QoS value of 3
(which is what the bulk traffic should be tagged with), but this may be the
reason behind the [connectivity times I'm experiencing][8].

I tried several mapping values for different types of traffic and ultimately it
does seem that the `0:3` mapping most other people are doing seems to work just
fine. For completeness these are the other mappings I've tried:

* 0:2
* 0:3 1:3 2:3 3:3 4:3 5:3 6:3 7:3
* 0:3 1:3 2:3 3:3 4:4 5:5 6:6 7:7
* 0:6

To actually perform the setup, connect the fiber jack to eth0 on the router and
make sure the fiber jack doesn't have its external power connected. SSH into
your router and go into configure mode:

```
configure
```

There are a lot of changes that need to be made, the one thing you'll want to
double check is the name of your firewall rules which should have already been
setup. By default they get named `WAN_IN`, `WANv6_IN`, `WAN_LOCAL`, and
`WANv6_LOCAL` and I didn't need to make any changes to them. Because there are
so many changes, we're going to start from a clean slate:

```
delete interfaces ethernet eth0
```

Now we'll setup the basic physical connection again:

```
edit interfaces ethernet eth0
set description "Google Fiber Jack"
set duplex auto
set speed auto
set poe output 48v
exit
```

We're now going to want to create the VLAN interface on eth0, which is done
through the `vif` sub-commands off the interface. While not necessary yet,
we'll also place the IPv6 firewalls in place, even if you don't intend to using
IPv6 having these in place can prevent accidents if it ever gets enabled.

```
edit interfaces ethernet eth0 vif 2
set description Internet
set address dhcp
set egress-qos 0:3
set firewall in name WAN_IN
set firewall in ipv6-name WANv6_IN
set firewall local name WAN_LOCAL
set firewall local name WANv6_IN
exit
```

To ensure the routing performance is as good as it can be, we want to ensure
hardware offload is configured.

```
edit system offload
set ipv4 forwarding enable
set ipv4 vlan enable
exit
```

At this point we need to commit the change to allow the VLAN interface to be
created, but the routing won't be setup correctly yet. The outbound interface
for NAT will also need to be updated and recommitted. You'll want to double
check your NAT rule number matches mine (5010).

```
commit
set service nat rule 5010 outbound-interface eth0.2
commit
```

Now you'll have to wait a while for everything to come up, which can be [up to
five minutes][8] but your IPv4 connectivity should be all set.

## IPv6 Connectivity

TODO

## Custom DNS Configuration

TODO

## Changing the egress-qos Value

If you want to change the `egress-qos` value after the VLAN interface comes up
you'll be presented with the following error message:

```
admin@ubnt-router:~$ configure
[edit]
admin@ubnt-router# set interfaces ethernet eth0 vif 2 egress-qos "0:2"
[edit]
admin@ubnt-router# commit
egress-qos can only be set at vlan creation for 2

Commit failed
[edit]
```

To actually change this value, you need to switch to root, and use `vi` to edit
the `/config/config.boot` file and reboot the router itself.

## Initial Connectivity Time

Several time during the course of testing this I assumed I had broken my
connectivity while testing. I was actually experiencing surprisingly long
delays getting connectivity after changes. Part of this is that the PoE to the
fiber jack isn't maintained while the router is rebooting, forcing the jack to
boot as well, but a large portion of that is the IPv4 connectivity itself.

The timings I measured during a reboot were:

* 1 minute 18 seconds to first ping of internal LAN interface
* An additional 35 seconds before the SSH port was open
* 19 more seconds before logins were allowed
* A further 33 seconds before the router saw the link from the fiber jack come
  up
* 22 seconds until IPv6 connectivity was established (internal hosts now have
  IPv6 internet)
* An additional 3 minutes 46 seconds before the eth0.2 interface gets an IPv4
  address and IPv4 connectivity is available.

Total boot time: 5 minutes 53 seconds. That is pretty crazy and it's almost all
waiting for an IPv4 address on the link. Either something is really slow on
Google's end, or this delay is because the DHCP traffic is tagged with an
incorrect QoS value (I haven't tested it).

Either way, reboots once setup are pretty rare and I can wait the almost six
minutes without internet when it happens.

## MSS Clamping

[Steve Jenkins][3]'s post has the most complete documentation on setting up the
EdgeRouter (and makes his configs [available on GitHub][9]), but I was a tad
confused about him using MSS clamping, which I've left out of my config.

MSS clamping is used to restrict MTU sizes through TCP headers, and is very
useful when tunneling traffic or wrapping in an authentication mechanism such
as PPPoE, MPLS, or GRE. During the crafting of packets, hosts won't be aware of
the tunnel which will have its own MTU and packet overhead and thus can hit
some performance snags.

With this config, we are at most adding 4 bytes to each packet as a VLAN tag
but won't encounter a tunnel that will break a packet up into multiple tunneled
packets when a packet is to large and rebuild it at the other exactly the same.
Any fragmentation that occurs in transit will be visible to the MSS detection
algorithms and handled correctly without the overhead or limitation of MSS
clamping. If anything I'd expect it to slow down the connection slightly for
large packets.

[1]: https://www.ubnt.com/edgemax/edgerouter-poe/
[2]: http://comptechrt.blogspot.com/2015/10/google-fiber-with-3rd-party.html
[3]: https://www.stevejenkins.com/blog/2015/11/replace-your-google-fiber-network-box-with-a-ubiquiti-edgerouter-lite/
[4]: https://productforums.google.com/forum/#!msg/fiber/AbNh8ij72Mw/l0quYBiiCJ8J
[5]: /blog/2018/05/quick-and-silent-gigabit-packet-interception/
[6]: https://arstechnica.com/information-technology/2018/02/a-potent-botnet-is-exploiting-a-critical-router-bug-that-may-never-be-fixed/
[7]: #changing-the-egress-qos-value
[8]: #initial-connectivity-time
[9]: https://github.com/stevejenkins/UBNT-EdgeRouter-Example-Configs

## Notes for the post:

Raw config:

```
/* Everything in this section with the one exception are defaults */
firewall {
    all-ping enable
    broadcast-ping disable
    ipv6-name WANv6_IN {
        default-action drop
        description "WAN inbound traffic forwarded to LAN"
        enable-default-log
        rule 10 {
            action accept
            description "Allow established/related sessions"
            state {
                established enable
                related enable
            }
        }
        rule 20 {
            action drop
            description "Drop invalid state"
            state {
                invalid enable
            }
        }
        /* This is the one thing that was added, but I'm not sure it's necessary... */
        rule 30 {
            action accept
            description "Allow ICMPv6"
            log disable
            protocol icmpv6
        }
    }
    ipv6-name WANv6_LOCAL {
        default-action drop
        description "WAN inbound traffic to the router"
        enable-default-log
        rule 10 {
            action accept
            description "Allow established/related sessions"
            state {
                established enable
                related enable
            }
        }
        rule 20 {
            action drop
            description "Drop invalid state"
            state {
                invalid enable
            }
        }
        rule 30 {
            action accept
            description "Allow IPv6 icmp"
            protocol ipv6-icmp
        }
        rule 40 {
            action accept
            description "allow dhcpv6"
            destination {
                port 546
            }
            protocol udp
            source {
                port 547
            }
        }
    }
    ipv6-receive-redirects disable
    ipv6-src-route disable
    ip-src-route disable
    log-martians enable
    name WAN_IN {
        default-action drop
        description "WAN to internal"
        rule 10 {
            action accept
            description "Allow established/related"
            state {
                established enable
                related enable
            }
        }
        rule 20 {
            action drop
            description "Drop invalid state"
            state {
                invalid enable
            }
        }
    }
    name WAN_LOCAL {
        default-action drop
        description "WAN to router"
        rule 10 {
            action accept
            description "Allow established/related"
            state {
                established enable
                related enable
            }
        }
        rule 20 {
            action drop
            description "Drop invalid state"
            state {
                invalid enable
            }
        }
    }
    receive-redirects disable
    send-redirects enable
    source-validation disable
    syn-cookies enable
}
interfaces {
    ethernet eth0 {
        description "Google Fiber Jack"
        duplex auto
        poe {
            /* Power the Fiber jack */
            output 48v
        }
        speed auto
        /* Most of this section is relevant */
        vif 2 {
            address dhcp
            description Internet
            dhcpv6-pd {
                /* Go over the DNS options even though they're not required... */
                no-dns
                pd 0 {
                    interface eth1 {
                        /* Relevant option */
                        host-address ::1
                        /* Go over the DNS options even though they're not required... */
                        no-dns
                        /* Relevant options */
                        prefix-id :0
                        service slaac
                    }
                    interface switch0 {
                        /* Relevant option */
                        host-address ::1
                        /* Go over the DNS options even though they're not required... */
                        no-dns
                        /* Relevant options */
                        prefix-id :1
                        service slaac
                    }
                    /* Google Fiber specific */
                    prefix-length /56
                }
                /* This is debateable and seems to work either way, cover the discussion */
                rapid-commit enable
            }
            /* This is worth going over */
            egress-qos 0:3
            firewall {
                in {
                    ipv6-name WANv6_IN
                    name WAN_IN
                }
                local {
                    ipv6-name WANv6_LOCAL
                    name WAN_LOCAL
                }
            }
        }
    }
    ethernet eth1 {
        /* Person specific */
        address 10.186.208.1/24
        description DMZ
        duplex auto
        ipv6 {
            /* Set automatically */
            dup-addr-detect-transmits 1
            router-advert {
                /* Set automatically */
                cur-hop-limit 64
                link-mtu 0
                managed-flag false
                max-interval 600
                /* Good to go over but not relevant */
                name-server 2606:4700:4700::1111
                name-server 2606:4700:4700::1001
                other-config-flag false
                /* Needs to be set, without it it will be missing from the dhcpv6-pd config, but only if name servers are set */
                prefix ::/64 {
                    autonomous-flag true
                    on-link-flag true
                    /* Will get set automatically */
                    valid-lifetime 2592000
                }
                /* Will get set automatically */
                reachable-time 0
                retrans-timer 0
                send-advert true
            }
        }
        poe {
            output off
        }
        speed auto
    }
    ethernet eth2 {
        description "LAN"
        duplex auto
        poe {
            output off
        }
        speed auto
    }
    ethernet eth3 {
        description "LAN"
        duplex auto
        poe {
            output off
        }
        speed auto
    }
    ethernet eth4 {
        description "LAN"
        duplex auto
        poe {
            output off
        }
        speed auto
    }
    loopback lo {
    }
    switch switch0 {
        /* Person specific */
        address 10.202.254.1/24
        description "LAN"
        ipv6 {
            /* Set automatically */
            dup-addr-detect-transmits 1
            router-advert {
                /* Set automatically */
                cur-hop-limit 64
                link-mtu 0
                managed-flag false
                max-interval 600
                /* Good to go over but not relevant */
                name-server 2606:4700:4700::1111
                name-server 2606:4700:4700::1001
                /* Will get set automatically */
                other-config-flag false
                /* Needs to be set, without it it will be missing from the dhcpv6-pd config, but only if name servers are set */
                prefix ::/64 {
                    autonomous-flag true
                    on-link-flag true
                    /* Will get set automatically */
                    valid-lifetime 2592000
                }
                /* Will get set automatically */
                reachable-time 0
                retrans-timer 0
                send-advert true
            }
        }
        mtu 1500
        switch-port {
            interface eth2 {
            }
            interface eth3 {
            }
            interface eth4 {
            }
            vlan-aware disable
        }
    }
}
service {
    dhcp-server {
        disabled false
        hostfile-update disable
        shared-network-name LAN {
            authoritative enable
            /* Person specific */
            subnet 10.186.208.0/24 {
                /* Person specific */
                default-router 10.186.208.1
                /* Good to go over but not relevant */
                dns-server 1.1.1.1
                dns-server 1.0.0.1
                /* Irrelevant */
                domain-name example.tld
                lease 86400
                /* Person specific */
                start 10.186.208.38 {
                    stop 10.186.208.243
                }
            }
        }
        shared-network-name DMZ {
            authoritative enable
            /* Person specific */
            subnet 10.202.254.0/24 {
                /* Person specific */
                default-router 10.202.254.1
                /* Good to go over but not relevant */
                dns-server 1.1.1.1
                dns-server 1.0.0.1
                /* Irrelevant */
                domain-name example.tld
                lease 86400
                /* Person specific */
                start 10.202.254.38 {
                    stop 10.202.254.243
                }
            }
        }
        use-dnsmasq disable
    }
    gui {
        http-port 80
        https-port 443
        /* Good practice, but not relevant to Fiber */
        older-ciphers disable
    }
    nat {
        rule 5010 {
            description "masquerade for WAN"
            /* Relevant to Fiber config (vif 2) */
            outbound-interface eth0.2
            type masquerade
        }
    }
    /* Defaults */
    ssh {
        port 22
        protocol-version v2
    }
    /* Next two services are unrelated to Fiber config */
    ubnt-discover {
        disable
    }
    /* Need to go over the security trade offs here... */
    upnp2 {
        acl {
            rule 10 {
                action deny
                local-port 0-1024
                subnet 0.0.0.0/0
            }
            rule 20 {
                action deny
                external-port 0-1024,1080,5432,8000,8080,8081,8088,8443,8888,9100,9200
                subnet 0.0.0.0/0
            }
            rule 30 {
                action deny
                local-port 0-1024,1080,5432,8000,8080,8081,8088,8443,8888,9100,9200
                subnet 0.0.0.0/0
            }
            rule 40 {
                action allow
                subnet 10.202.254.0/24
            }
            rule 100 {
                action deny
                subnet 0.0.0.0/0
            }
        }
        listen-on switch0
        nat-pmp disable
        secure-mode enable
        wan eth0.2
    }
}
system {
    /* These next two lines are not relevant to the Fiber config */
    domain-name example.tld
    host-name ubnt-router.example.tld
    /* These will always be user specific */
    login {
        user admin {
            authentication {
                encrypted-password ****************
                plaintext-password ****************
            }
            full-name "Admin User"
            level admin
        }
    }
    /* While these are not relevant to Google Fiber config it is good to go over */
    name-server 1.1.1.1
    name-server 1.0.0.1
    name-server 2606:4700:4700::1111
    name-server 2606:4700:4700::1001
    /* Defaults */
    ntp {
        server 0.ubnt.pool.ntp.org {
        }
        server 1.ubnt.pool.ntp.org {
        }
        server 2.ubnt.pool.ntp.org {
        }
        server 3.ubnt.pool.ntp.org {
        }
    }
    offload {
        /* This is not available on the EdgeRouter PoE */
        hwnat disable
        /* These are all worth discussing */
        ipsec enable
        ipv4 {
            forwarding enable
            vlan enable
        }
        ipv6 {
            forwarding enable
            vlan enable
        }
    }
    syslog {
        global {
            facility all {
                level notice
            }
        }
        /* Irrelevant to Fiber config */
        host 2605:a601:4049:c100:afdb:e15f:c174:5f71 {
            facility all {
                level info
            }
        }
    }
    /* Irrelevant to Fiber config */
    time-zone UTC
    /* Irrelevant to Fiber config */
    traffic-analysis {
        dpi disable
        export enable
    }
}
```

Refs:

* https://community.ubnt.com/t5/EdgeRouter/Comcast-IPv6-issues-when-hwnat-enabled-on-ER-X/m-p/1850112#U1850112
* https://community.ubnt.com/t5/EdgeRouter/Updated-Google-Fiber-EdgeRouter-Lite-PoE-IPv4-amp-IPv6-config/td-p/1790440
* https://community.ubnt.com/t5/EdgeRouter/IPv6-DHCPv6-and-DHCPv6-PD/td-p/1115361
* https://kazoo.ga/dhcpv6-pd-for-native-ipv6/
* https://community.ubnt.com/t5/EdgeRouter/The-generation-of-etc-radvd-conf-is-missing-my-configuration/td-p/1355531
* https://community.ubnt.com/t5/EdgeRouter/ERlite-1-5-upnp2-secure-mode/td-p/923222
* https://flyovercountry.org/2014/02/google-fiber-gigabit-speeds-your-router-part-1-vlans/
* http://itnutt.com/how-to-bypass-google-fibers-network-box/
* https://netswat.com/blog/google-fiber-ubiquitis-edgerouter/
* https://netswat.com/blog/wp-content/uploads/2016/07/Edge-Setup-Interfacesv3.txt
* https://netswat.com/blog/wp-content/uploads/2016/07/EdgeRouter-TVScript6.txt
