---
created_at: 2013-01-01T00:00:01-0000
updated_at: 2026-04-05T00:00:00-0000
tags:
  - linux
  - networking
  - web
  - security
title: Squid Guard
aliases:
  - /notes/squid-guard/
---

SquidGuard is a URL rewrite program that works alongside [Squid](../squid/).
It takes information about a requested page and checks it against a series of
ACLs, blacklists, and whitelists in an order specified by the administrator.
Offending pages get redirected to a block page (which has to be hosted outside
of Squid itself).

## Installation

SquidGuard is available in most Linux distribution package managers. On
Debian/Ubuntu you can install it with `apt install squidguard`, on Fedora/RHEL
with `dnf install squidGuard`, and on Arch with `pacman -S squidguard`.

Don't use the "squidGuard" systemd service directly. It is incorrectly defined,
looks for non-existent files, and is poorly implemented. Call squidGuard
directly from the Squid config instead (see [Squid](../squid/)).

To use SquidGuard at all you need a web server set up to handle redirects for
denied sites. You could set up a simple page that displays the client's address,
the category of the offending URL, and the URL itself. The config provided below
includes redirect URLs pointing at a local block page for this purpose.

## Black and White Lists

Remove the default blacklist file since we are going to use a different one.
This is a necessary step to continue using the rest of these instructions. If
you don't want to use the lists referenced here, you will have to adapt the
instructions but they should not differ much between different list providers.

```
rm -f /var/squidGuard/blacklists.tar.gz
mkdir -p /var/squidGuard/blacklists
mkdir -p /var/squidGuard/whitelists/custom/
touch /var/squidGuard/whitelists/custom/domains
touch /var/squidGuard/whitelists/custom/urls
```

You will need a domain blacklist to feed into squidGuard. The Shalla Secure
Services list (formerly at shallalist.de) was the go-to source for a long time
but that site is no longer serving blacklists. Some alternatives worth looking
into are [URLhaus](https://urlhaus.abuse.ch/),
[UT1 Blocklists](https://dsi.ut-capitole.fr/blacklists/), and the
[OISD blocklist](https://oisd.nl/). You will need to adapt the category names
in the config to match whichever list you choose.

If your chosen list provides a tarball, download and verify it:

```
curl -o /var/squidGuard/blacklists/blocklist.tar.gz <LIST_URL>
```

Extract the lists and fix ownership:

```
cd /var/squidGuard
tar -xzvf blacklists/blocklist.tar.gz --strip-components 1
chown -R squid:squid /var/squidGuard/
```

## Configuration

By default, squidGuard tries to store its logfiles in `/var/log/squidGuard`.
Since Squid starts up squidGuard, it will be running under the squid user. That
user won't have permission to write to `/var/log/squidGuard` so we should point
it at `/var/log/squid` instead. Make sure `/var/squidGuard/blacklists` is owned
by squid with the squid group.

The full configuration file is available here:
[squidGuard configuration](squidguard.conf)

The config defines time-based ACLs (restricting more categories during work
hours), source network definitions, whitelist overrides, and per-category
blacklist entries. The `acl` block at the end ties it all together, specifying
which categories to block for which source networks and time periods.

## Live Config Changes

The squid command `squid -k reconfigure` will re-evaluate squidGuard config
changes as well. This makes it easy to quickly adjust things across the server
without a significant service interruption.

## Testing and Diagnostics

If there is an issue with squidGuard starting up, Squid will still succeed and
there will probably not be any errors anywhere. It will simply not block
anything. This is obviously not ideal. To test and make sure your configuration
is good (or possibly see the errors that may be preventing filtering from
working) run the following command:

```
squidGuard -c /etc/squid/squidGuard.conf -C all
```

It will go through and build the database files for every category defined in
the configuration then verify that everything is in order. If an error does
occur you will see the message:

```
2011-09-20 12:15:50 [7140] Going into emergency mode
```

Look at the line above it and you will have to figure out the issue based on
that message.

After running that command all of the database files will be owned by root.
That won't work, so fix it with:

```
chown -R squid:squid /var/squidGuard/*
```

Additional permission issues can usually be resolved with:

```
chown -R root:squid /etc/squid
chmod 640 /etc/squid/*
```

To test individual rules and make sure things are being redirected or blocked
correctly you can test squidGuard like this:

```
su squid -s /bin/bash -c \
  'echo "http://porn.com 10.0.0.1/ - - GET" | squidGuard -d -c /etc/squid/squidGuard.conf'
```

It will either return nothing (passes the check) or return a URL to redirect
the user to (failed the check). You can replace `10.0.0.1` with an IP of a
machine you want to test the rules against.

## Security Notes

squidGuard is an additional layer of protection against known bad sites. It
cannot possibly catch all of the bad sites but it does help. For any general
browsing that you don't want to restrict the content of, I strongly suggest
including the following groups as exclusions. They will help promote anonymous
safe browsing.

* adv
* costtraps
* in-addr
* redirector
* ringtones
* spyware
* trackers

The only one that may cause issues is "in-addr" which blocks going to IP
addresses directly. I personally get around this by including the sites I want
to access directly in my whitelist file.
