---
title: EZStream
---

***Note: This page is quite old and is likely out of date. My opinions may have
also changed dramatically since this was written. It is here as a reference
until I get around to updating it.***

EZStream is a media streamer and re-encoder that can be used to feed
[Icecast][1].

## Mounting Content

I have a [Samba][2] share "Media" setup on the server "samba-srv" that holds
all my media and allows anonymous read access to the content. You'll need to
install `cifs-utils` to mount the samba share. To make it available to my
stream server I've performed the following:

```
mkdir /media/content
mount -t cifs -o username=guest /samba-srv/Media /media/content
```

The above command could be added to an init script like an `rc.local` or
alternatively you can do it right and add it to the fstab file to be mounted
automatically. You'll want to add the following to `/etc/fstab`:

```
/samba-srv/Media  /media/content  cifs  auto,guest,_netdev  0 0
```

Nice and easy.

## Installation & Configuration

Quick and Easy:

```
yum install ezstream -y
```

ezstream.xml

```xml
<ezstream>
  <url>http://127.0.0.1:8000/automation.ogg</url>

  <sourceuser>automation</sourceuser>
  <sourcepassword>hackme</sourcepassword>

  <format>VORBIS</format>

  <filename>./song_request.rb</filename>
  <playlist_program>1</playlist_program>

  <svrinfobitrate>128</svrinfobitrate>
  <svrinfochannels>2</svrinfochannels>
  <svrinfosamplerate>44100</svrinfosamplerate>

  <metadata_format>@a@ - @t@</metadata_format>

  <reencode>
    <enable>1</enable>
    <encdec>
      <format>FLAC</format>
      <match>.flac</match>
      <decode>flac -s -d --force-raw-format --sign=signed --endian=little -o - "@T@"</decode>
      <encode>Not supported Yet</encode>
    </encdec>
    <encdec>
      <format>MP3</format>
      <match>.mp3</match>
      <decode>madplay -b 16 -R 44100 -S -o raw:- "@T@"</decode>
      <encode>Not supported Yet</encode>
    </encdec>
    <encdec>
      <format>VORBIS</format>
      <match>.ogg</match>
      <decode>oggdec -R -b 16 -e 0 -s 1 -o - "@T@"</decode>
      <encode>oggenc -r -B 16 -C 2 -R 44100 --raw-endianness 0 -q 1.5 -t "@M@" -</encode>
    </encdec>
  </reencode>
</ezstream>
```

[1]: {{< ref "./icecast.md" >}}
[2]: {{< ref "./samba.md" >}}
