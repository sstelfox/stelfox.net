---
title: VOIP
tags:
- security
- voip
- communications
---

Sensitive information can be transmitted through phone systems, POTS lines can
also be very very expensive if anonymous calls are allowed through the POTS
line. Mitigations must be implemented in the network, network perimeter,
servers, and phones. Mitigations in the network aim to deny access to attackers
through virtual separation of data and phone networks using [VLANs][1], and
perimeter security devices such as firewalls and filtering routers.

Servers AND phones must be security hardened. Phones must require strong
authentication and authorization of users to prevent identity spoofing. Phones
should also encrypt voice streams through high risk environments such as the
internet.

## Authentication

Devices and users should authenticate themselves separately to the PBX.
Additionally devices should ensure the validity of the server before allow user
authentication.

## Network Separation

### VLANs

Dividing the network into multiple VLANs does not provide any benefit if the
traffic between the VLANs is not restricted. VLANs are so trivial to implement
that there really isn't any reason not to use them, and they do provide a solid
defense against malicious traffic on other networks... As long as attackers
can't craft packets to traverse the VLANs...

Filters need to configured at every available device to permit only traffic
between phones and the telephony server.

### Physical/Layer 2

An attacker who has physical access to the network may bypass any VLAN
separation by simply unplugging an IP phone and introducing a malicious
machine. A simple solution would be to only allow know MAC addresses, however,
this too could be fooled quite trivially. The solution to this is 802.1X
authentication. Additional trickery can be added using various switch port
security features such as dhcp client sniffing.

### Services

Ideally, voice networks should have their own service providers for basic
functionality like DNS, DHCP, and NTP. This might be a bit overkill, however,
it's pretty simple to implement these services and they don't require much of a
box to do it. What this gets you is a complete separation of voice and data
networks preventing even leaks about the other networks from occuring on the
other one.

In the event of a voice network that goes only to POTS lines and doesn't need
any external SIP clients, or to receive voice calls from outside the local
voice network, then having the services separated allows for total network
isolation. Even with external SIP clients it can be made so that there is
exactly one point where external data can get into the voice network and out of
it. This provides a very nice and convienient place to drop an [IDS][2].

## Call Eavesdropping

Eavesdropping on unencrypted voice communication is more likely when
conversations travel over a general use IP network. Media streams are easily
reconstructed if packets can be captured. Security protections at the network
layer can make call eavesdropping more difficult, but not prevent it. If VoIP
traffic traverses public networks unencrypted, eavesdropping is a serious
concern.

By eavesdropping on VoIP calls, attackers can potentially obtain sensitive
information such as passwords, usernames, caller location, and addresses of
other devices. They could also use traffic analysis to determine relationship
patterns between unique callers on the system.

A switched network means that network traffic is not broadcast to all devices
connected to a switch, thus making packet capturing more difficult. However,
there are methods to subvert the switch. One method is to flood the switch with
traffic, which overfills the MAC address table causing the switch to broadcast
traffic on all ports. The other method of subverting a switched network is to
implement a man-in-the-middle attack. In this case, an attacker pretends to be
the victim device by spoofing the victim’s MAC address.

The best and only robust solution to eavesdropping is to encrypt all voice
traffic on the network from end to end.

## Signal Leakage

With many VoIP implementations signaling is done out-of-band. Signalling is
meta-data about calls such as the destination number, extensions, caller
identity information, etc.

If this information is sent plaintext an attacker can potentially build up a
social graph of users of the phone system that may be later used in a social
engineering attack.

If this signalling information is sent without a form of crytographic
verification, plaintext or not, these messages would be suscetible to MITM
attacks allowing an attacker to cause havoc such as change who you are calling
tranparently, even potentially routing them to the attacker themselves to
continue a social enginerring attack, effectively disrupting the integrity of a
critical communications service.

## Impersonation

Impersonating a caller can potentially allow an attacker access services on
telephony servers reserved for the legitimate user, spoof caller ID
information, bypass filters based on caller name, and eavesdrop on calls. While
people are used to using a caller's voice as a form of authentication, this
only works after answering the phone and with telephony applications that are
voice-based.

If phones can be contacted from the Internet, this could lead to problems with
SPAM over Internet Telephony (SPIT), because SPAMmers can cheaply automate
sending messages or calling phones. In addition, by impersonating a user to the
telephony server, an attacker can eavesdrop on calls from anywhere on the
network using the registration hijacking attack. This attack allows an attacker
to send spoofed messages to the telephony server and potentially reroute a
user's calls.

## Call Plan Security

### Outgoing PIN

A neat little trick that could be accomplished to greatly increase the security
of a PBX to prevent abuse from people making paid phone calls could be to
require a PIN be entered whenever an outgoing call is made to a number that has
never been dialed from an extension before.

### 911

Any fixed phone should have it's physical location stored and available to make
911 calls safely. Remote SIP clients or any other phone that moves regularily,
however, should not be able to dial 911 and should rely on additional means for
emergency services.

## Call Log Auditing

Here, there comes a tradeoff. Keeping call logs (not recordings mind you) can
be very useful in tracking down abuse, the other side of this coin is privacy
for the users. Knowing the source number, destination number, call duration,
and time the call occurred are important for this nothing more and nothing
less.

If these logs were kept only for a month it would limit the privacy impact. If
any call that lasted under 15 seconds never entered the call log, as these
would have minimal importance, and probably wouldn't be particularily valuable.

The source number could be removed after a week, anonymising the call logs to a
certain extent that would probably be acceptable to most users.

This is one of those security measures I wouldn't want to relax quite this much
unless things such as the outgoing pin, a strong IDS, and firewall logs had
been implemented.

[1]: {{< relref "vlan.md" >}}
[2]: {{< relref "ids.md" >}}
