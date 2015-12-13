---
date: 2011-05-01 15:48:08+00:00
slug: "exploration-of-a-acn-iris-3000"
title: 'Exploration of an ACN Iris 3000'
---

So I found a dirt cheap video SIP phone (ACN Iris 3000) at a local HAM fest.
After looking around I found the vendor has locked in the phone with their
specific service with an iron grip and had gone out of business. I guess I
should expect that kind of anti-competitive behavior from a business that
Donald Trump has a vested interest in.

I've come across one post on a forum that seems to have been crawled and copied
out every where. The poster had cracked it and got it working with an Asterisk
server which is what my ultimate goal for this phone is, however they claim to
have done it by getting root through telnet. The problem being that port 23
(telnet) is not open so this was a dead end.

This is a running document of how I'm doing it, you'll notice that I'm writing
this as I go.

## Reconnaissance

First thing's first a little run down of what I've found. I can change the
network address and the way it's handling networking (either bridged or NAT). I
can not get into the Administrators menu which is where all the juicy bits seem
to be. I've found that the factory reset code is 7517517, though that doesn't
get me anything beyond cleaning up it's last known phone number.

Through a very thorough nmap scan I've found that ports TCP 21, 79, 113, 513,
514, 554, 5060, 7022, and 8080 are all open. There doesn't appear to be any UDP
ports available which actually surprised me, since SIP over UDP is pretty
common.

7022 and 8080 both immediately caught my eye. 7022 looks like someone moved SSH
(port 22) to a non-standard port, and 8080 is a very common alternate port for
HTTP. Connecting to 7022 via telnet confirmed my suspicions of SSH. I received
this prompt:

> Connected to 10.0.0.85.
> Escape character is '^]'.
> SSH-2.0-dropbear_0.45

Bingo. SSH it is, and an old version of dropbear at that.  Unfortunately as the
one poster I found said the password was neither blank nor 'root'. I suspect
that they had an older firmware revision and these 'bugs' were ironed out in a
later revision. That's ok though it'll just take a bit more work.

As for port 8080 it is definitely running a web configuration interface. All it
asks for is a password (which we don't have). The extension for the login page
(esp) makes me suspect that the Iris device is running a copy of AppWebServer
or something similar and using embedded javascript as the server side
processing. For now that doesn't provide much but it could be very useful later
on.

## Attack

So while looking for an exploit for DropBear 0.45 I started up a SSH dictionary
attack and encountered by first real problem. The screen started blinking while
running three or more threads trying to break in, at first I thought it was
kind of funny but then it turned off completely.

Turns out the adapter I have for it is only rated for pushing out 500mA and the
phone itself takes up to 1500mA, apparently I hit that limit and browned-out
the phone. It still seems to work but if I want to take this route I'll need a
more robust power supply. Looking around I found a 1500mA supply and after
checking the boards for damage I gave it a shot and everything seems to be
working OK.

Unfortunately I wasn't able to find any viable exploits for that particular
DropBear version as the vulnerabilities that had been found were either DoS
vulnerabilities or were only useful with valid credentials.

The basic dictionary attack failed and I started up a more comprehensive one. I
could easily start brute forcing this but it would take a very long time,
especially if the company realized that a weak password wasn't cutting it.
