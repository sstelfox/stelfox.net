---
title: IceCast
weight: 73

taxonomies:
  tags:
  - linux
  - media

extra:
  done: true
  outdated: true
---

While it's described and primarily used as an audio streaming server, it would
be more accurate to describe it as a media streaming server as it's perfectly
capable of rebroadcasting video streams with or without audio.

## Setup Process

As of this writing Fedora 16 comes with Icecast version 2.3.2, the associated
documentation can be found on the Icecast website. I found some documentation
had been removed rather than updated along with the software and that
documentation can be found in version 2.0.1's documentation.

### Networking

Setup a dedicated IP for use by the Icecast server (this is optional but a good
practice even if it's just an internal address). You'll want to note this down
for what the server will bind it's addresses to later on.

For the purposes of this example configuration I'm using `eth0:1` interface
with an IP Address of 192.168.20.45 configured like so in
`/etc/sysconfig/network-script/ifcfg-eth0:1`

```
# eth0:1 - For Icecast Server
DEVICE="eth0:1"
NM_CONTROLLED="no"
ONBOOT="yes"
BOOTPROTO="static"

IPADDR="192.168.20.45"
NETMASK="255.255.255.0"
NETWORK="192.168.20.0"
BROADCAST="192.168.20.255"

IPV4_FAILURE_FATAL="yes"
IPV6_AUTOCONF="no"
IPV6INIT="no"

NAME="IceCast Interface"
```

Setup an A/CNAME record pointing at the server that will be hosting the Icecast
server, take note of this as it will be needed for the hostname param in the
configuration file. This example will use streams.example.org for the hostname.

### Firewall

Add the following [IPTables][1] rules:

```
-A SERVICES -d 192.168.20.45 -m tcp -p tcp --dport 8000 -j ACCEPT
-A SERVICES -d 192.168.20.45 -m tcp -p tcp --dport 8001 -j ACCEPT
```

### Setup the chroot Environment

The configuration I have here uses a chrooted environment within
`/usr/share/icecast`. By default it isn't fully setup.

```
mkdir /usr/share/icecast/log
chown -R icecast:icecast /usr/share/icecast
rm -rf /var/log/icecast
ln -s /usr/share/icecast/log/ /var/log/icecast
```

### Installation & Configuration

```
yum install icecast -y
```

Place a copy of the [icecast config][2] at `/etc/icecast.xml`. I also have a
[fully commented config][3] available as well. You'll need to change the
values, especially [passwords][4] listed in the configuration before making it
live.

Icecast hasn't been ported over to systemd yet so you mind as well use the old
configuration options to set it to start up on each boot:

```
chkconfig icecast on
service icecast start
```

If you configured everything properly you now have a happy Icecast server ready
to have a source authenticate to it and listeners receive it.

## Example Mount Definitions

### LiveDJ with Automation Fallback

The following configuration provides a public and a hidden mount. If there is a
live DJ authenticated and streaming content it will pull users out of the
automated stream and to listen to the live DJ, if the automated DJ goes down it
will play silence but won't kill the stream. This requires that you put a file
in the web directory named 'silence.ogg'.

You can download the one [I use here][5]. With this you'll want to use the URL
`http://streams.example.org/radio.ogg.m3u` to access the stream.

```xml
<mount>
  <mount-name>/automation.ogg</mount-name>

  <username>automation</username>
  <password>robot-password-hackme</password>

  <fallback-mount>/silence.ogg</fallback-mount>
  <fallback-override>1</fallback-override>

  <charset>UTF8</charset>

  <stream-name>Radio - Automation System</stream-name>
  <stream-description>A Radio Station Automaton</stream-description>
  <stream-url>http://streams.example.org/</stream-url>
  <genre>A Genre!</genre>

  <bitrate>128</bitrate>

  <public>0</public>
  <hidden>1</hidden>
</mount>

<mount>
  <mount-name>/radio.ogg</mount-name>

  <username>livedj</username>
  <password>the-live-djs-password</password>

  <fallback-mount>/automation.ogg</fallback-mount>
  <fallback-override>1</fallback-override>

  <charset>UTF8</charset>

  <stream-name>Radio - Automation System</stream-name>
  <stream-description>A Radio Station Automaton</stream-description>
  <stream-url>http://streams.example.org/</stream-url>
  <genre>A Genre!</genre>

  <bitrate>128</bitrate>

  <public>1</public>
  <hidden>0</hidden>
</mount>
```

## Logrotate Stanza

TODO

## ffmpeg2theora Source Client

TODO

## Using Icecast stream in HTML5

### Audio

Here is a snippet of HTML5 for connecting to the stream
`http://streams.example.org:8000/radio.ogg` with some javascript controls,
pretty straight forward. The loop is included in case the stream dies or is
currently in fallback mode to a file.

```html
<!DOCTYPE html>
<html lang=en>
  <head>
    <meta charset=utf-8 />
    <meta name=viewport content="width=device-width"/>
    <title>HTML5 Radio Player Test</title>
  </head>
  <body>
    <div id=container>
      <audio id=radioStream preload=metadata controls loop>
      <source src="http://streams.example.org:8000/radio.ogg" type="audio/ogg"/>
      </audio>
      <br/>
      <a href="#" onclick="javascript:rs=document.getElementById('radioStream');rs.play();">Play</a>
      <a href="#" onclick="javascript:rs=document.getElementById('radioStream');rs.pause();">Pause</a>
      <a href="#" onclick="javascript:rs=document.getElementById('radioStream');rs.pause();rs.currentTime=0;">Stop</a>
      <input id=volume value=100 type=text /><a href="#" onclick="javascript:rs=document.getElementById('radioStream');vo=document.getElementById('volume');rs.volume=parseInt(vo.value)/100.0;">Set Volume</a>
    </div>
  </body>
</html>
```

### Video

Todo...

## Next Steps

* [EZStream][6]
* [EZStream Manual](http://www.linuxcertif.com/man/1/ezstream/)

[1]: @/notes/iptables.md
[2]: icecast_base.xml
[3]: icecast_fully_commented.xml
[4]: @/notes/password_security.md
[5]: silence.ogg
[6]: @/notes/ezstream.md
