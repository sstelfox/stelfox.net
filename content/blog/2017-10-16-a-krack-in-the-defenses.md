---
date: 2017-10-16 08:23:43-04:00
tags:
- security
title: A KRACK In the Defenses
---

An advisory from US CERT has been circulating for the last week about a
protocol level flaw in WPA & WPA2. The advisory itself was:

> US-CERT has become aware of several key management vulnerabilities in the
> 4-way handshake of the Wi-Fi Protected Access II (WPA2) security protocol.
> The impact of exploiting these vulnerabilities includes decryption, packet
> replay, TCP connection hijacking, HTTP content injection, and others. Note
> that as protocol-level issues, most or all correct implementations of the
> standard will be affected. The CERT/CC and the reporting researcher KU
> Leuven, will be publicly disclosing these vulnerabilities on 16 October 2017.

Details of the vulnerability have been [released today][1], and paint a pretty
horrifying picture. Ultimately this is an issue with a mechanism for dealing
with lost packets during the initial 4-way key negotiation and the client's
behavior when they receive one of these packets after they're session is
already established.

Almost all WiFi devices out there are vulnerable to this attack and patches
should be applied as soon as they are available. Some very quick and important
notes I'd like to make available for people:

* This is an active against clients
* WPA & WPA2 both personal and enterprise are effected
* The WiFi association key (your network's passphrase) is safe, this attack
  breaks a per-client session key.
* Assume all your traffic is being sent in plain text and can be manipulated by
  an attacker until you have patched.

If you have a VPN available to your client devices, having it active will
protect your traffic from this attack.

[1]: https://www.krackattacks.com/
