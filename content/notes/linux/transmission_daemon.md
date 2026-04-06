---
created_at: 2013-01-01T00:00:01-0000
updated_at: 2026-04-05T00:00:00-0000
tags:
  - linux
  - services
  - networking
title: Transmission Daemon
aliases:
  - /notes/transmission-daemon/
---
## Configuration

First install the transmission-daemon. The package is typically called
`transmission-daemon` on Debian/Ubuntu and `transmission-daemon` or
`transmission-cli` on Fedora/Arch.

```
# Install the daemon (Debian/Ubuntu)
$ sudo apt install transmission-daemon

# Install the daemon (Fedora)
$ sudo dnf install transmission-cli

# Install the daemon (Arch)
$ sudo pacman -S transmission-cli
```

The install doesn't set up a default configuration, so we need to quickly start
and stop the daemon so one is generated for us to edit:

```
# systemctl start transmission-daemon
# systemctl stop transmission-daemon
```

Alright now that we have a config lets open it up and make some changes, it can
be found at `/var/lib/transmission/.config/transmission-daemon/settings.json`.

Provided below is my configuration file AFTER I've made changes to the
defaults.

After entering a password into the rpc-password field, start and stop the
service again to have it in hashed form. Also note that I've picked a random
but static port in this case 37288. Make sure that it is allowed through the
firewall and forwarded.

```
{
  "alt-speed-down": 200,
  "alt-speed-enabled": false,
  "alt-speed-time-begin": 540,
  "alt-speed-time-day": 127,
  "alt-speed-time-enabled": false,
  "alt-speed-time-end": 1020,
  "alt-speed-up": 200,
  "bind-address-ipv4": "0.0.0.0",
  "bind-address-ipv6": "::",
  "blocklist-enabled": true,
  "blocklist-url": "http://list.iblocklist.com/?list=bt_level1&fileformat=p2p&archiveformat=gz",
  "cache-size-mb": 10,
  "dht-enabled": true,
  "download-dir": "/media/storage/Torrents/Downloads/",
  "encryption": 1,
  "idle-seeding-limit": 30,
  "idle-seeding-limit-enabled": false,
  "incomplete-dir": "/media/storage/Torrents/Incomplete",
  "incomplete-dir-enabled": true,
  "lazy-bitfield-enabled": true,
  "lpd-enabled": false,
  "message-level": 2,
  "open-file-limit": 32,
  "peer-congestion-algorithm": "",
  "peer-limit-global": 240,
  "peer-limit-per-torrent": 60,
  "peer-port": 37288,
  "peer-port-random-high": 65535,
  "peer-port-random-low": 49152,
  "peer-port-random-on-start": false,
  "peer-socket-tos": "default",
  "pex-enabled": true,
  "port-forwarding-enabled": true,
  "preallocation": 0,
  "prefetch-enabled": 1,
  "ratio-limit": 15,
  "ratio-limit-enabled": false,
  "rename-partial-files": true,
  "rpc-authentication-required": true,
  "rpc-bind-address": "10.13.37.52",
  "rpc-enabled": true,
  "rpc-password": "",
  "rpc-port": 9091,
  "rpc-url": "/transmission/",
  "rpc-username": "torrentadmin",
  "rpc-whitelist": "127.0.0.1,10.13.37.*",
  "rpc-whitelist-enabled": true,
  "script-torrent-done-enabled": true,
  "script-torrent-done-filename": "/var/lib/transmission/.config/transmission-daemon/torrent-completed.sh",
  "speed-limit-down": 100,
  "speed-limit-down-enabled": false,
  "speed-limit-up": 100,
  "speed-limit-up-enabled": false,
  "start-added-torrents": true,
  "trash-original-torrent-files": true,
  "umask": 18,
  "upload-slots-per-torrent": 14,
  "watch-dir": "/media/storage/Dropbox/TorrentDrop",
  "watch-dir-enabled": true
}
```

With the config above I've configured it to run a script
`/var/lib/transmission/.config/transmission-daemon/torrent-completed.sh`
whenever a torrent finishes downloading. This file needs to at least exist and
be executable if you don't turn it off above. You can do this with the
following commands:

```
# touch /var/lib/transmission/.config/transmission-daemon/torrent-completed.sh
# chmod +x /var/lib/transmission/.config/transmission-daemon/torrent-completed.sh
```

I've personally set it up to email me whenever a torrent completes by putting
the following script in that file:

```
#!/bin/bash

# Transmission populates the following variables for use in the script:
# TR_APP_VERSION
# TR_TIME_LOCALTIME
# TR_TORRENT_DIR
# TR_TORRENT_HASH
# TR_TORRENT_ID
# TR_TORRENT_NAME

# Setup the message to be sent
TO_ADDR=admin@example.com
SUBJECT="Torrent Completed"
FROM_ADDR="transmission@example.com"
BODY="Transmission finished downloading \"$TR_TORRENT_NAME\" on $TR_TIME_LOCALTIME"

# Send the email
echo $BODY | mailx -s "$SUBJECT" -r "$FROM_ADDR" $TO_ADDR
```

Alright now this part is strange. If for some reason transmission doesn't close
properly or some other funniness happens, it DELETES its config file and
resets it back to the defaults. To prevent this we're going to remove
transmission's ability to change its config file. The catch with this is that it
starts up with root privileges and will just rewrite the config file with
read/write permissions so you need to make the file immutable like so:

```
# chattr +i /var/lib/transmission/.config/transmission-daemon/settings.json
```

Ensure that transmission's group has write privileges over its Download,
Incomplete, and TorrentDrop directory.

Now lets start it up for real and make sure it starts up correctly on boot:

```
# systemctl enable transmission-daemon
# systemctl start transmission-daemon
```

You can then use the utility transmission-remote to check on the status of
transmission like so:

```
$ transmission-remote transmission-server.example.com -l
ID     Done       Have  ETA           Up    Down  Ratio  Status       Name
Sum:           Unknown               0.0     0.0
```

## Making Torrents from the Command Line

First you need to install the `mktorrent` utility. The package is called
`mktorrent` on most distributions.

```
# Debian/Ubuntu
$ sudo apt install mktorrent

# Fedora
$ sudo dnf install mktorrent

# Arch
$ sudo pacman -S mktorrent
```

I use a private tracker so these instructions are going to be specific for
them.

First things first we're going to figure out the best size for the pieces in
the torrent. Generally I default to 512Kb (2^19), if the torrent is around the
size of a DVD I'll increase the size of the pieces to 1Mb (2^20). Anything
larger than that probably doesn't belong in a single torrent. We need to know
this as the exponent is one of the flags passed (specifically -l) so for my
default I'll use the flag "-l 19".

Since I use a private tracker I need to set the private flag (-p). You should
really give the torrent a meaningful name with the "-n" flag. Additionally a
comment on the torrent is usually welcome with "-c".

With my current private tracker when creating a torrent you get a unique
tracker link that looks something like `http://tracker.<site>.org:34000/<Your
private 32 character ID string>/announce`, so you need to get that before you
can finish setting up the torrent. Pass it as an option to the "-a" flag

Make sure all the files you want in the torrent are in the same directory
(we're going to use `/media/example/MySpecialTorrent/`) in this example:

```
$ mktorrent -l 19 -p -n "My Special Torrent" -c "A very special torrent that I'm using as an example" \
  -a "<tracker address>" \
  /media/example/MySpecialTorrent/*
mktorrent 1.0 (c) 2007, 2009 Emil Renner Berthing

Hashed 40 of 40 pieces.
Writing metainfo file... done.
```

You will then have a .torrent file in your current directory named after what
you gave mktorrent with the -n flag.

## Security Notes

* The transmission-daemon doesn't support multiple users, so either a shared
  password needs to be provided, none configured or a reverse proxy needs to be
  setup in front of it that has basic authentication.
  * A lot of the clients can support basic authentication by using the format:
    `http://username:password@torrentbox.local/` for the "host".
  * A reverse proxy can also be used to provide HTTPS access to the interface
  * A reverse proxy can safely make the interface available to the outside
    world by putting restrictions on it
* The transmission daemon can restrict access to certain things based on IP
  masks, these should be configured appropriately
* Blocklists can be used to eliminate potential corporation spies that'll do
  bad things to you
* I strongly encourage preferring or enforcing encryption as it will reduce
  what is visible to ISPs
* All of the torrent traffic could potentially be pushed through an anonymizing
  VPN for additional privacy
* If your system routes traffic through a proxy, make sure your package manager
  is configured to use it as well

## Firewall Adjustments

The following ports need to be accessible for transmission to work properly:

| Port | Protocol | Direction | Description |
|------|----------|-----------|-------------|
| 37288 | TCP | Inbound | BitTorrent peer connections (configurable) |
| 9091 | TCP | Inbound (local) | Web interface / RPC access |
