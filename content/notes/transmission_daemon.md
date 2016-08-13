---
title: Transmission Daemon
type: note
---

# Transmission Daemon

## Configuration

First install the transmission-daemon like so:

```
[root@localhost ~]# yum install transmission-daemon -y
```

The init script that comes with transmission-daemon uses the utility `which`
which is not in the minimal install. As such you'll need to edit the init file
to point at the binary as it should be doing in the first place. Find the
following line:

```
DAEMON=$(which $NAME)
```

Replace it with:

```
DAEMON=/usr/bin/transmission-daemon
```

Open up `/etc/sysconfig/transmission-daemon`. We're going to make a few changes
here. First off the defaults listed in this file are not actually the defaults
that the transmission-daemon will start up with. I don't like ambiguity so
we're going to replace them with the real values.

The tranmission-daemon runs as user "tranmission" and it's home directory is
`/var/lib/transmission`. We want to prefer encryption whenever it is available.

I don't like defining configuration information through the service startup
unless they don't have an equivalent setting (encryption preferred - you can
turn encryption support on in the config but not the 'prefer' part) so we get
rid of the blacklist setting.

With those changes the file should look like the following:

```
TRANSMISSION_HOME=/var/lib/transmission
DAEMON_USER="transmission"
DAEMON_ARGS="-ep -g $TRANSMISSION_HOME/.config/transmission-daemon"
```

The install doesn't set up a default configuration, so we need to quickly start
and stop the daemon so one is generated for us to edit like so:

```
[root@localhost ~]# service transmission-daemon start
Starting transmission-daemon (via systemctl):              [  OK  ]
[root@localhost ~]# service transmission-daemon stop
Stopping transmission-daemon (via systemctl):              [  OK  ]
```

Alright now that we have a config lets open it up and make some changes, it can
be found at `/var/lib/transmission/.config/transmission-daemon/settings.json`.

Provided below is my configuration file AFTER I've made changes to the
defaults.

Note to self: This isn't cleaned up and is not fit for public consumption. The
only change that has been made is the removal of the contents of rpc-password
hash.

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

With the config above I've configured it too run a script
`/var/lib/transmission/.config/transmission-daemon/torrent-completed.sh`
whenever a torrent finishes downloading. This file needs to at least exist and
be executable if you don't turn it off above. You can do this with the
following commands:

```
[root@localhost ~]# touch /var/lib/transmission/.config/transmission-daemon/torrent-completed.sh
[root@localhost ~]# chmod +x /var/lib/transmission/.config/transmission-daemon/torrent-completed.sh
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
properly or some other funniness happens, it DELETES it's config file and
resets it back to the defaults. To prevent this we're going to remove
tranmissions ability to change it's config file. The catch with this is that it
starts up with root privileges and will just rewrite the config file with
read/write permissions so you need to make the file immutable like so:

```
[root@localhost ~]# chattr +i /var/lib/transmission/.config/transmission-daemon/settings.json
```

Ensure that transmission's group has write privileges over it's Download,
Incomplete, and TorrentDrop directory.

Now lets start it up for real and make sure it starts up correctly on boot:

```
[root@localhost ~]# chkconfig transmission-daemon on
[root@localhost ~]# service transmission-daemon start
```

You can then use the utility transmission-remote to check on the status of
transmission like so:

```
[root@localhost ~]# transmission-remote transmission-server.example.com -l
ID     Done       Have  ETA           Up    Down  Ratio  Status       Name
Sum:           Unknown               0.0     0.0
```

## Making Torrents from the Command Line

First you need to install the utility "mktorrent" like so:

```
[root@localhost ~]# yum install mktorrent -y
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
[root@localhost ~]# mktorrent -l 19 -p -n "My Special Torrent" -c "A very special torrent that I'm using as an example" \
> -a "<tracker address>" \
> /media/example/MySpecialTorrent/*
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
* All of the torrent traffic could potentially be pushed through an anonymising
  VPN such as that provided by xerobank.com

## Firewall Adjustments

```
# Allow other torrenter's to connect to us
-A SERVICE -m tcp -p tcp --dport 37288 -j ACCEPT
# Allow local access to the web interface
-A SERVICE -s 10.13.37.0/24 -m tcp -p tcp --dport 9091 -j ACCEPT
```

