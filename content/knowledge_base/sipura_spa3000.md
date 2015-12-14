---
title: Sipura SPA3000
tags:
- embedded
- linux
- voip
---

Getting this working properly with incoming, and outgoing calls through the FXO
port and as a standard extension through the FXS port was quite a trick so I've
documented all of my configuration notes of what was required to get it too
work here. They're pretty crude but you can follow them easy enough, each
indentation level indicates a tab or section, while the actual settings are
reflected in a key: value pair.

For SPA3000 on [FreeSWITCH][1]

```
[Working Sipura Configuration]
System
  System Configuration
    Admin Password: ********
  Internet Connection Type
    DHCP: no
    Static IP: 10.13.37.x
    Netmask: 255.255.255.0
    Gateway: 10.13.37.1
  Optional Network Configuration:
    HostName: spa3000
    Domain: example.com
    Primary DNS: 10.13.37.x
    DNS Server Order: Manual
    DNS Query Mode: Sequential
    Primary NTP Server: 10.13.37.x
SIP
  RTP Parameters
    RTP Port Min: 10000
    RTP Port Max: 10100
    RTP Packet Size: 0.020
Line 1
  SIP Settings:
    SIP Port: 5060
  Proxy and Registration
    Proxy: 10.13.37.xx
    Register: yes
    Register Expires: 300
  Subscriber Information
    Display Name: House Phone
    User ID: SPA3000_LINE
    Password: ********
  VoIP Fallback To PSTN
    Auto PSTN Fallback: yes
  Dial Plan
    Dial Plan (default): (*xx|[3469]11|0|00|[2-9]xxxxxx|1xxx[2-9]xxxxxxS0|xxxxxxxxxxxx.)
    Dial Plan (working): ???

PSTN Line (same as Line 1 except the following)
  SIP Settings:
    SIP Port: 5061
  Proxy and Registration
    Proxy: 10.13.37.xx
    Register: yes
    Register Expires: 300
  Subscriber Information
    Display Name: INCOMING CALL
    User ID: SPA3000_PSTNIN
    Password: ********
  Dial Plans
    Dial Plan 1: (S0<:s>)
  VoIP-To-PSTN Gateway Setup
    VoIP-To-PSTN Gateway Enable: yes
    VoIP Caller Auth Method: HTTP Digest
    One Stage Dialing: yes
    Line 1 VoIP Caller DP: none
    VoIP Caller Default DP: none
    Line 1 Fallback DP: none
  VoIP Users and Passwords (HTTP Authentication)
    VoIP User 1 Auth ID: from-pbx
    VoIP User 1 DP: 1
    VoIP User 1 Password: *********
  PSTN-To-VoIP Gateway Setup
    PSTN-To-VoIP Gateway Enable: yes
    PSTN Caller Auth Method: none
    RSTN Ring Thru Line 1: no
    PSTN CID For VoIP CID: yes
    PSTN Caller Default DP: 1
  FXO Timer Values (sec)
    PSTN Answer Delay: 5
  International Control
    SPA To PSTN Gain: 10
    PSTN To SPA Gain: 10
```

## Factory Reset

To perform a factory reset, make sure the line cable is disconnect and a touch
tone phone is plugged into the phone port. Pick up the receiver and dial
'****'. This will take you to the sipura configuration menu. Dial '73738#'. It
will ask you to confirm that you want to reset the device, press 1 to do so
then hang up the phone. It will be reset to factory defaults, the username and
password are 'admin'.

## Finding the Device's IP Address

To perform a factory reset, make sure the line cable is disconnect and a touch
tone phone is plugged into the phone port. Pick up the receiver and dial
'****'. This will take you to the sipura configuration menu. Dial '110#' and it
will read out the IP address one digit at a time.

[1]: http://wiki.freeswitch.org/wiki/SPA3102_FreeSwitch_HowTo
