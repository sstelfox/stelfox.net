---
date: 2018-05-13T00:55:09-06:00
draft: true
tags:
- network
- ubiquiti
title: Setting Up EdgeRouter PoE on Google Fiber
---

Notes for the post:

The configuration I started with was after a run through of 'Basic Setup'
wizard with DHCPv6 prefix delegation enabled (prefix length of /56, default
firewall enabled, IPv6 LANs of eth1 and swith0), and with the optional
secondary lan port. I'll make my config available but the details setup by this
seem pretty unimportant.

When I performed a packet capture I only noticed VLAN QoS tags of '2', but the
configs I was finding referenced a value of '3'. I may have not looked at a
sufficient number of packets as the deleted Google Fiber post mentioned that
DHCP packets were tagged with a priority of 2. I should dig further into the
PCAP.

The deleted Google Fiber product support forums post:

```
Here's the gory details if you really want to use your own router:

1. Traffic in/out of the fiberjack is vlan tagged with vlan2.
2. DHCP traffic should have 802.1p bit = 2
3. IGMP traffic should have 802.1p bit = 6
4. All other internet traffic 802.1p bit = 3

You can send data without the 802.1p bits but your performance will get
throttled to something like 10Mbit.

NOTE:  This data is subject to change.  We are planning on changing the data
in/out of the fiberjack to be untagged, which will then make it really easy for
you to connect your own router.

A word of warning, most consumer routers don't have hardware forwarding (that
is my feeble understanding) so you might not be happy with the performance on
your network, and which will also probably affect tv service quality.
```

One of my concerns was whether or not outbound VLAN tagging would force
software routing losing the gigabit handling capabilities.

When I started I was on version 1.9.1.1, after the configuration was complete I
upgraded my router to 1.10.1 which didn't seem to cause any issues.

Some data to incorporate:

^ from reboot command to first ping reponse 1 minute 18 seconds
^ from first ping to ssh available 35 seconds
^ from ssh available to actually able to login 19 seconds
^ reported uptime at this point was "1 minute" this doesn't provide seconds so
  it a little rough (so kernel init to network init is between 6-24 seconds...
  (60 - (35 + 19)) = 6 but is bounded by the first timestamp.
^ from login to google fiber link coming up 33 seconds
^ from link up to IPv6 connectivity (both router & LAN) 23 seconds
^ from IPv6 connectivity to IPv4 connectivity 3 minutes 46 seconds

I should talk about why I left out MSS clamping (which stevejenkins's config
has). To set it I should discuss MTU detection, IPV6 shouldn't need it...

Mention error during QoS mapping:

```
egress-qos can only be set at vlan creation for 2
```

Relevant useful code mapping for QoS values of DSCP -> SO_PRIORITY (it gets bit
shifted down 1 for the priority mapping):

```
const __u8 ip_tos2prio[16]={0,0,0,0,2,2,2,2,6,6,6,4,4,4,4};
```

The priority values are defined by the 802.1p standard which maps to:

| PCP value | Priority    | Acronym | Traffic types                       |
|:---------:|:-----------:|:-------:| ----------------------------------- |
| 1         | 0 (lowest)  | BK      | Background                          |
| 0         | 1 (default) | BE      | Best effort                         |
| 2         | 2           | EE      | Excellent effort                    |
| 3         | 3           | CA      | Critical applications               |
| 4         | 4           | VI      | Video, < 100 ms latency and jitter  |
| 5         | 5           | VO      | Voice, < 10 ms latency and jitter   |
| 6         | 6           | IC      | Internetwork control                |
| 7         | 7 (highest) | NC      | Network control                     |

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
            /* This is worth going over as most example configs only cover 0:3, or universal mappings... */
            egress-qos "0:3 1:3 2:3 3:3 4:4 5:5 6:6 7:7"
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
                external-port 0-1024,1080,5432,8000,8080,8081,8088,8443,8888,9100
                subnet 0.0.0.0/0
            }
            rule 30 {
                action deny
                local-port 0-1024,1080,5432,8000,8080,8081,8088,8443,8888,9100
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

* http://comptechrt.blogspot.com/2015/10/google-fiber-with-3rd-party.html
* https://community.ubnt.com/t5/EdgeRouter/Comcast-IPv6-issues-when-hwnat-enabled-on-ER-X/m-p/1850112#U1850112
* https://community.ubnt.com/t5/EdgeRouter/Updated-Google-Fiber-EdgeRouter-Lite-PoE-IPv4-amp-IPv6-config/td-p/1790440
* https://gist.github.com/atomizer123/f8aee29b8fb192d6ea09d9607aa38ef3
* https://github.com/stevejenkins/UBNT-EdgeRouter-Example-Configs
* https://productforums.google.com/forum/#!msg/fiber/AbNh8ij72Mw/l0quYBiiCJ8J
* https://www.stevejenkins.com/blog/2015/11/replace-your-google-fiber-network-box-with-a-ubiquiti-edgerouter-lite/
* https://community.ubnt.com/t5/EdgeRouter/IPv6-DHCPv6-and-DHCPv6-PD/td-p/1115361
* https://kazoo.ga/dhcpv6-pd-for-native-ipv6/
* https://community.ubnt.com/t5/EdgeRouter/The-generation-of-etc-radvd-conf-is-missing-my-configuration/td-p/1355531
* https://community.ubnt.com/t5/EdgeRouter/ERlite-1-5-upnp2-secure-mode/td-p/923222
* https://stackoverflow.com/questions/19810839/skb-priority-and-iptos-and-ping-q

