---
title: IceCast
---

While it's described and primarily used as an audio streaming server, it would
be more accurate to describe it as a media streaming server as it's perfectly
capable of rebroadcasting video streams with or without audio.

## Setup Process

As of this writing Fedora 16 comes with Icecast version 2.3.2, the associated
documentation can be found on the
[http://www.icecast.org/docs/icecast-2.3.2/icecast2_config_file.html Icecast
Website]. I found some documentation had been removed rather than updated along
with the software and that documentation can be found in
[http://www.icecast.org/docs/icecast-2.0.1/icecast2_config_file.html version
2.0.1's] documentation.

### Networking

Setup a dedicated IP for use by the Icecast server (this is optional but a good
practice even if it's just an internal address). You'll want to note this down
for what the server will bind it's addresses to later on. For the purposes of
this example configuration I'm using eth0:1 interface with an IP Address of
192.168.20.45 configured like so in /etc/sysconfig/network-script/ifcfg-eth0:1

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

Add the following [[Linux/IPTables]] rules:

```
-A SERVICES -d 192.168.20.45 -m tcp -p tcp --dport 8000 -j ACCEPT
-A SERVICES -d 192.168.20.45 -m tcp -p tcp --dport 8001 -j ACCEPT
```

### Setup the chroot Environment

The configuration I have here uses a chrooted environment within
/usr/share/icecast. By default it isn't fully setup.

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

Replace /etc/icecast.xml with the following minimized (read comments and mount
points removed) configuration. You'll need to change the values, especially
[[Security/Passwords]] listed in the configuration before making it live.

```xml
<icecast>
  <hostname>streams.example.org</hostname>
  <fileserve>1</fileserve>
  <server-id>Icecast 2.3.2</server-id>
  <location>Earth</location>
  <shoutcast-mount>/stream</shoutcast-mount>
  <listen-socket>
    <bind-address>192.168.20.45</bind-address>
    <port>8000</port>
  </listen-socket>
  <listen-socket>
    <bind-address>192.168.20.45</bind-address>
    <port>8001</port>
    <shoutcast-compat>1</shoutcast-compat>
  </listen-socket>
  <security>
    <chroot>1</chroot>
    <changeowner>
      <user>icecast</user>
      <group>icecast</group>
    </changeowner>
  </security>
  <paths>
    <pidfile>/var/run/icecast/icecast.pid</pidfile>
    <basedir>/usr/share/icecast</basedir>
    <webroot>/web</webroot>
    <adminroot>/admin</adminroot>
    <logdir>/log</logdir>
    <alias source="/" dest="/status.xsl"/>
  </paths>
  <logging>
    <accesslog>access.log</accesslog>
    <errorlog>error.log</errorlog>
    <playlistlog>playlist.log</playlistlog>
    <loglevel>3</loglevel>
    <logarchive>0</logarchive>
    <logsize>102400</logsize>
  </logging>
  <limits>
    <clients>100</clients>
    <sources>2</sources>
    <threadpool>5</threadpool>
    <queue-size>524288</queue-size>
    <client-timeout>30</client-timeout>
    <header-timeout>15</header-timeout>
    <source-timeout>10</source-timeout>
    <burst-on-connect>1</burst-on-connect>
    <burst-size>65535</burst-size>
  </limits>
  <authentication>
    <source-user>source</source-user>
    <source-password>hackme</source-password>
    <relay-user>relay</relay-user>
    <relay-password>hackme</relay-password>
    <admin-user>admin</admin-user>
    <admin-password>hackme</admin-password>
  </authentication>
</icecast>
```

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
in the web directory named 'silence.ogg'. You can download the one I use here:
[http://assets.stelfox.net/wiki/audio/silence.ogg]. With this you'll want to
use the URL http://streams.example.org/radio.ogg.m3u to access the stream.

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
http://streams.example.org:8000/radio.ogg with some javascript controls, pretty
straight forward. The loop is included in case the stream dies or is currently
in fallback mode to a file.

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

## Fully Documented Configuration File

```xml
<icecast>
  <!--
    This is the DNS name or IP address that will be used for the stream directory
    lookups or possibily the playlist generation if a Host header is not
    provided. While localhost is shown as an example, in fact you will want
    something that your listeners can use.
  -->
  <hostname>streams.example.org</hostname>

  <!--
    This flag turns on the icecast2 fileserver from which static files can be
    served. All files are served relative to the path specified in the
    paths->webroot configuration setting. By default the setting is enabled so
    that requests for the images on the status page are retrievable.

    This service should not be used for general file serving, use a service
    designed for that task such as Apache.
  -->
  <fileserve>1</fileserve>

  <!--
    This optional setting allows for the administrator of the server to override
    the default server identification. The default is icecast followed by a
    version number and most will not care to change it however this setting will
    change that. 
  -->
  <server-id>Icecast 2.3.2</server-id>

  <!--
    This is an undocumented setting, it probably gets announced to the icecast
    directory and defaults to "Earth" the value of this is also visible on the
    Icecast Administration page.
  -->
  <location>Earth</location>

  <!--
    An optional mountpoint setting to be used when shoutcast DSP compatible
    clients connect. The default global setting is /stream but can be overridden
    here to use an alternative name which may include an extension that some
    clients require for certain formats.

    Defining this within a listen-socket group tells icecast that this port and
    the subsequent port are to be used for shoutcast compatible source clients.
    This is an alternative to the shoutcast-compat approach as this implicitly
    defines the second listening socket and allows for specifying multiple
    sockets using different mountpoints for shoutcast source clients.
    
    The shoutcast-mount outside of a listen-socket group is the global setting of
    the mountpoint to use. 
  -->
  <shoutcast-mount>/stream</shoutcast-mount>
  
  <!--
    The listen-sockets define the ports and addresses that the daemon will listen
    on. Best practice dictates that you bind a service only to the IP addresses
    that you want the service to listen on. Without specifying one Icecast will
    listen on all IPv4 and IPv6 addresses the host is aware of.
  -->
  <listen-socket>
    <!--
      An optional IP address that can be used to bind to a specific network card.
      If not supplied, then it will bind to all interfaces. 
    -->
    <bind-address>192.168.20.45</bind-address>

    <!--
      The TCP port that will be used to accept client connections.
    -->
    <port>8000</port>

    <!--
      This could optionally be defined here as well/instead of in the global
      configuration. Refer to it's documentation else where in this config
    -->
    <!-- <shoutcast-mount>/stream</shoutcast-mount> -->
  </listen-socket>
  <listen-socket>
    <bind-address>192.168.20.45</bind-address>
    <port>8001</port>

    <!--
      This optional flag will indicate that this port will operate in
      'shoutcast-compatibility' mode. Due to major differences in the source client
      connection protocol, if you wish to use any of the shoutcast DJ tools, you
      will need to configure at least one socket as shoutcast-compatible. Note that
      when in this mode, only source clients (and specifically shoutcast source
      clients) will be able to attach to this port. All listeners may connect to any
      of the ports defined without this flag. Also, for proper Shoutcast DSP
      compatibility, you must define a listen socket with a port one less than the
      one defined as 'shoutcast-compat'. This means if you define 8001 as
      shoutcast-compat, then you will need to define a listen port of 8000 and it
      must not also be defined as shoutcast-compat.
    -->
    <shoutcast-compat>1</shoutcast-compat>
  </listen-socket>

  <!--
    This section contains configuration settings that can be used to secure the
    icecast server by performing a chroot to a secured location.
  -->
  <security>
    <!--
      An indicator which specifies whether a chroot() will be done when the
      server is started. The chrooted path is specified by the <basedir>
      configuration value the <paths> section.
    -->
    <chroot>1</chroot>
    <!--
      This section indicates the user and group that will own the icecast process
      when it is started. These need to be valid users on the system. This allows
      the daemon to drop it's root privileges. This really shouldn't be optional.
    -->
    <changeowner>
      <user>icecast</user>
      <group>icecast</group>
    </changeowner>
  </security>

  <paths>
    <!--
      This path is used in conjunction with the chroot settings, and specified the
      base directory that is chrooted to when the server is started (and is not used
      if not chroot'd).
    -->
    <basedir>/usr/share/icecast</basedir>

    <!--
      Note that since chroot is turned on, these paths are all relative to
      <basedir> and need to exist within that directory
    -->

    <!--
      This path specifies the base directory used for all static file requests.
      This directory can contain all standard file types (including mp3s and ogg
      vorbis files). For example, if webroot is set to /usr/share/icecast, and a
      request for http://server:port/mp3/stuff.mp3 comes in, then the file
      /usr/share/icecast/mp3/stuff.mp3 will be served.
    -->
    <webroot>/web</webroot>

    <!--
      This path specifies the base directory used for all admin requests. More
      specifically, this is used to hold the XSLT scripts used for the web-based
      admin interface. The admin directory contained within the icecast
      distribution contains these files. 
    -->
    <adminroot>/admin</adminroot>
    
    <!--
      This path specifies the base directory used for logging. Both the error.log
      and access.log will be created relative to this directory. 
    -->
    <logdir>/log</logdir>

    <!--
      This pathname specifies the file to write at startup and to remove at
      normal shutdown. The file contains the process id of the icecast process.
      This could be read and used for sending signals icecast. This is not
      affected by basedir and needs a full path
    -->
    <pidfile>/var/run/icecast/icecast.pid</pidfile>

    <!--
      Aliases treat requests for 'source' path as being for 'dest' path May be
      made specific to a port or bound address using the "port" and "bind-address"
      attributes. The following alias serves up the status page as the root path.
    -->
    <alias source="/" dest="/status.xsl"/>

    <!--
      There are two additional settings that may be applied within this context
      that may be of use later on, though, they're not a good replacement for a
      good firewall. They are documented here:

      allow-ip:
      If specified, this specifies the location of a file that contains a list
      of IP addresses that will be allowed to connect to icecast. This could be
      useful in cases where a master only feeds known slaves. The format of the
      file is simple, one IP per line.

      deny-ip:
      If specified, this specifies the location of a file that contains a list
      of IP addressess that will be dropped immediately. This is mainly for
      problem clients when you have no access to any firewall configuration.
      The format of the file is simple, one IP per line. 
    -->
  </paths>

  <!--
    This section contains information relating to logging within icecast. There
    are two logfiles currently generated by icecast, an error.log (where all log
    messages are placed) and an access.log (where all stream/admin/http requests
    are logged).

    Note that a HUP signal should be sent to icecast when the log files need to
    ne re-opened after moving or deleting the log files. 
  -->
  <logging>
    <!--
      All requests made to the icecast daemon will be logged in this file. It's
      location is relative to the path specified by the <logdir> config value. 
    -->
    <accesslog>access.log</accesslog>

    <!--
      All icecast generated log messages will be written to this file. If the
      loglevel is set too high (Debug for instance) then this file can grow
      fairly large over time. Log-rotation should be handled with logrotate,
      and a HUP signal should be generated after the logs have been
      moved/truncated to inform the icecast daemon of the change.
    -->
    <errorlog>error.log</errorlog>

    <!--
      Into this file, a log of all metadata for each mountpoint will be written.
      The developers note that the format of this logfile will most likely
      change over time as they haven't decided on a format.
      
      Currently, the file is pipe delimited. This option is optional.
    -->
    <playlistlog>playlist.log</playlistlog>

    <!--
      Indicates what messages are logged by icecast. Log messages are categorized
      into one of 4 types, Debug, Info, Warn, and Error. Icecast will log all
      messages matching the value set here and below (so level 3 will log info,
      warn, and error messages).

      4-Debug, 3-Info, 2-Warn, 1-Error
    -->
    <loglevel>3</loglevel>

    <!--
      I let logrotate handle all of my log rotations and as such I don't have any
      use for the built in log rotation. These values are set with this in mind,
      and I don't expect the logs to ever actually reach this size. As such I
      don't have to worry about what Icecast will rename the file when it does
      reach that size.
    -->

    <!--
      If this value is set, then icecast will append a timestamp to the end of
      the logfile name when logsize has been reached. If disabled, then the
      default behavior is to rename the logfile to logfile.old (overwriting any
      previously saved logfiles). We disable this by default to prevent the
      filling up of filesystems for people who don't care (or know) that their
      logs are growing.
    -->
    <logarchive>0</logarchive>

    <!--
      This value specifies (in Kb) the maxmimum size of any of the log files.
      When the logfile grows beyond this value, icecast will either rename it to
      logfile.old, or add a timestamp to the archived file (if logarchive is
      enabled). 

      Here I have it set to 100Mb
    -->
    <logsize>102400</logsize>
  </logging>

  <!--
    This section contains server level settings that, in general, do not need to
    be changed. Only modify this section if you are know what you are doing.
  -->
  <limits>
    <!--
      Total number of concurrent clients supported by the server. Listeners are
      considered clients, but so are accesses to any static content (i.e.
      fileserved content) and also any requests to gather stats. These are max
      *concurrent* connections for the entire server (not per mountpoint). 
    -->
    <clients>100</clients>

    <!--
      Maximum number of connected sources supported by the server. This includes
      active relays and source clients.
    -->
    <sources>2</sources>

    <!--
      This is the number of threads that are started to handle client connections.
      You may need to increase this value if you are running a high traffic
      stream. This recommended value is for a small to medium traffic server. 
    -->
    <threadpool>5</threadpool>

    <!--
      This is the maximum size (in bytes) of the stream queue. A listener may
      temporarily lag behind due to network congestion and in this case an
      internal queue is maintained for the listeners. If the queue grows larger
      than this config value, then it is truncated and any listeners found will be
      removed from the stream.

      This will be the default setting for the streams which is 512k unless
      overridden here. You can override this in the individual mount settings which
      can be useful if you have a mixture of high bandwidth video and low bitrate 
      audio streams. 
    -->
    <queue-size>524288</queue-size>

    <!--
      This does not seem to be used. (Note from official documentation)
    -->
    <client-timeout>30</client-timeout>

    <!--
      The maximum time (in seconds) to wait for a request to come in once the
      client has made a connection to the server. In general this value should not
      need to be tweaked. 
    -->
    <header-timeout>15</header-timeout>

    <!--
      If a connected source does not send any data within this timeout period (in
      seconds), then the source connection will be removed from the server. 
    -->
    <source-timeout>10</source-timeout>

                <!--
                        This setting is really just an alias for burst-size. When enabled the
                        burst-size is 64 kbytes and disabled the burst-size is 0 kbytes. This option
                        is deprecated, use burst-size instead.
                -->
    <burst-on-connect>1</burst-on-connect>

    <!--
      The burst size is the amount of data (in bytes) to burst to a client at
      connection time. Like burst-on-connect, this is to quickly fill the 
      pre-buffer used by media players. The default is 64 kbytes which is a typical
      size used by most clients so changing it is not usually required. This
      setting applies to all mountpoints unless overridden in the mount settings.
    -->
    <burst-size>65535</burst-size>
  </limits>

  <!--
    This section contains all the usernames and passwords used for administration
    purposes or to connect sources and relays. 
  -->
  <authentication>
    <!--
      This is undocumented but icecast seems to accept it, it is kind of implied
      that it exists from the source-password documentation
    -->
    <source-user>source</source-user>

    <!--
      The unencrypted password used by sources to connect to icecast2. The default
      username for all source connections is 'source' but this option allows to
      specify a default password. This and the username can be changed in the
      individual mount sections. 
    -->
    <source-password>hackme</source-password>

    <!--
      Used in the master server as part of the authentication when a slave requests
      the list of streams to relay. The default username is 'relay' 
    -->
    <relay-user>relay</relay-user>

    <!--
      Used in the master server as part of the authentication when a slave requests
      the list of streams to relay. 
    -->
    <relay-password>hackme</relay-password>

    <!--
      The username/password used for all administration functions. This includes
      retrieving statistics, accessing the web-based administration screens, etc.
      A list of these functions can be found in the "Administration" section of
      the manual. 
    -->
    <admin-user>admin</admin-user>
    <admin-password>hackme</admin-password>
  </authentication>

  <!--
    This section contains all the settings for listing a stream on any of the
    Icecast2 YP Directory servers. Multiple occurances of this section can be
    specified in order to be listed on multiple directory servers. 

    Right now it is commented out, if you want your stream listed publicly on
    Icecast's directory then uncomment this whole section. 

    Comments inside this section would mess it up, so I've included the
    documentation here in the parent block:

    yp-url:
    The URL which icecast2 uses to communicate with the Directory server. The
    value for this setting is provided by the owner of the Directory server.

    yp-url-timeout:
    This value is the maximum time icecast2 will wait for a response from a
    particular directory server. The recommended value should be sufficient
    for most directory servers. 
  -->
  <!--
  <directory>
    <yp-url>http://dir.xiph.org/cgi-bin/yp-cgi</yp-url>
    <yp-url-timeout>15</yp-url-timeout>
  </directory>
   -->

  <!--
    If this server is going to be a slave relaying all of the mount points for
    another Icecast server, you can use these settings to configure it to be a
    slave. None of these need to be setup on the master server.

    master-server:
    This is the IP or domain name for the master server that is actually
    hosting the streams.

    master-server-port:
    This is the TCP port on the master server to connect to, while not
    documented anywhere I suspect that this port needs to be a shoutcast-compat
    configured port.

    master-update-interval:
    The interval (in seconds) of how often to update the list of streams
    available on the master. If streams are pretty stable and don't change very
    often (such as an internet radio station) it might be a good idea to
    increase this up to something like 10 or 15 minutes.

    master-username:
    This is the username that has been configured on the master server that the
    slave will use to authenticate. This defaults to 'relay' on both sides and
    is optional.

    master-password:
    This is the password that has been configured on the master server that the
    slave will use to authenticate.

    relays-on-demand:
    When this is set the slave will only connect to a master's stream to
    rebroadcast it if the slave has at least one listener. Setting this avoids
    using bandwidth unecessarily.
  -->
  <!--
    <master-server>other-icecast-server.local</master-server>
    <master-server-port>8001</master-server-port>
    <master-update-interval>120</master-update-interval>
    <master-username>relay</master-password>
    <master-password>hackme</master-password>
    <relays-on-demand>1</relays-on-demand>
  -->

  <!--
    If only specific mountpoints need to be relayed, then you can configure an
    Icecast slave with a "Specific Mountpoint Relay". Using a Specific
    Mountpoint Relay, only those mountpoints specified will be relayed. This
    only needs to be configured on the Icecast slaves.

    server:
    This is the IP or domain name for the server which contains the mountpoint
    to be relayed (The master server).

    port:
    This is the TCP Port for the server which contains the mountpoint to be
    relayed (The master server).

    mount:
    The mountpoint located on the remote server. If you are relaying a shoutcast
    stream, this should be a '/' or '/;name'. 

    local-mount:
    The name to use for the local mountpoint. This is what the mount will be
    named on the relaying server. By default the remote mountpoint name is used. 

    username:
    This is the username the slave will use to authenticate to the remote
    (master) server. Usually this is 'relay'.

    password:
    This is the password the slave will use to authenticate to the remote
    (master) server.

    on-demand:
    An on-demand relay will only retrieve the stream if there are listeners
    requesting the stream. This is useful in cases where you want to limit
    bandwidth when no one is listening. 

    relay-shoutcast-metadata:
    If you are relaying a Shoutcast stream, you may want to specify this
    indicator to also relay the metadata (song titles) that are part of the
    Shoutcast data stream. By default this is enabled but it is up to the
    remote server on whether it sends any. 
  -->
  <!--
  <relay>
    <server>other-icecast-server.local</server>
    <port>8001</port>
    <username>relay</username>
    <password>hackme</password>

    <mount>/remote-stream</mount>
    <local-mount>/local-stream</local-mount>

    <on-demand>1</on-demand>
    <relay-shoutcast-metadata>1</relay-shoutcast-metadata>
  </relay>
  -->

  <!--
    This section contains the settings which apply only to a specific mountpoint
    and applies to an incoming stream whether it is a relay or a source client.
    The purpose of the mount definition is to state certain information that can
    override either global/default settings or settings provided from the
    incoming stream.

    A mount does not need to be stated for each incoming source although you may
    want to specific certain settings like the maximum number of listeners or a
    mountpoint specific username/password. As a general rule, only define what
    you need to but each mount definition needs at least the mount-name.
    Changes to most of these will apply across a configuration file re-read even
    on active streams, however some only apply when the stream starts or ends.
  -->
  <mount>
    <!--
      The name of the mount point for which these settings apply
    -->
    <mount-name>/example.ogg</mount-name>

    <!--
      An optional value which will set the username that a source must use to
      connect using this mountpoint 
    -->
    <username>othersource</username>

    <!--
      An optional value which will set the password that a source must use to
      connect using this mountpoint
    -->
    <password>hackmemore</password>

    <!--
      An optional value which will set the maximum number of listeners that can
      be attached to this mountpoint.
    -->
    <max-listeners>1</max-listeners>

    <!--
      An optional value which will set the length of time a listener will stay
      connected to the stream. An auth component may override this
    -->
    <max-listener-duration>3600</max-listener-duration>

    <!--
      An optional value which will set the filename which will be a dump of the
      stream coming through on this mountpoint 
    -->
    <dump-file>/tmp/dump-example1.ogg</dump-file>

    <!--
      An optional value which will specify the file those contents will be sent
      to new listeners when they connect but before the normal stream is sent.
      Make sure the format of the file specified matches the streaming format.
      The specified file is appended to webroot before being opened
    -->
    <intro>/intro.ogg</intro>

    <!--
      This optional value specifies a mountpoint that clients are automatically
      moved to if the source shuts down or is not streaming at the time a
      listener connects. Only one can be listed in each mount and should refer
      to another mountpoint on the same server that is streaming in the same
      streaming format.

      If clients cannot fallback to another mountpoint, due to a missing
      fallback-mount or it states a mountpoint that is just not available, then
      those clients will be disconnected. If clients are falling back to a
      mountpoint and the fallback-mount is not actively streaming but defines a
      fallback-mount itself then those clients may be moved there instead. This
      multi-level fallback allows clients to cascade several mountpoints.

      A fallback mount can also state a file that is located in webroot. This is
      useful for playing a pre-recorded file in the case of a stream going down.
      It will repeat until either the listener disconnects or a stream comes
      back available and takes the listeners back. As per usual, the file format
      should match the stream format, failing to do so may cause problems with
      playback.

      Note that the fallback file is not timed so be careful if you intend to
      relay this. They are fine on slave streams but don't use them on master
      streams, if you do then the relay will consume stream data at a faster
      rate and the listeners on the relay would eventually get kicked off.
    -->
    <fallback-mount>/example2.ogg</fallback-mount>

    <!--
      When enabled, this allows a connecting source client or relay on this
      mountpoint to move listening clients back from the fallback mount
    -->
    <fallback-override>1</fallback-override>

    <!--
      When set to 1, this will cause new listeners, when the max listener count
      for the mountpoint has been reached, to move to the fallback mount if
      there is one specified
    -->
    <fallback-when-full>1</fallback-when-full>

    <!--
      For non-Ogg streams like MP3, the metadata that is inserted into the stream
      often has no defined character set. We have traditionally assumed UTF8 as
      it allows for multiple language sets on the web pages and stream directory,
      however many source clients for MP3 type streams have assumed Latin1
      (ISO-8859-1) or leave it to whatever character set is in use on the source
      client system.

      This character mismatch has been known to cause a problem as the stats
      engine and stream directory servers want UTF8 so now we assume Latin1 for
      non-Ogg streams (to handle the common case) but you can specify an
      alternative character set with this option.

      The source clients can also specify a charset= parameter to the metadata
      update URL if they so wish.
    -->
    <charset>ISO8859-1</charset>

    <!--
      The default setting for this is -1 indicating that it is up to the source
      client or relay to determine if this mountpoint should advertise. A setting
      of 0 will prevent any advertising and a setting of 1 will force it to
      advertise. If you do force advertising you may need to set other settings
      listed below as the YP server can refuse to advertise if there is not
      enough information provided.
    -->
    <public>1</public>

    <!--
      Setting this will add the specified name to the stats (and therefore YP)
      for this mountpoint even if the source client/relay provide one.
    -->
    <stream-name>My stream</stream-name>

    <!--
      Setting this will add the specified description to the stats (and therefore
      YP) for this mountpoint even if the source client/relay provide one.
    -->
    <stream-description>My description</stream-description>

    <!--
      Setting this will add the specified URL to the stats (and therefore YP)
      for this mountpoint even if the source client/relay provide one. The URL
      is generally for directing people to a website.
    -->
    <stream-url>http://streams.example.org/</stream-url>

    <!--
      Setting this will add the specified genre to the stats (and therefore YP)
      for this mountpoint even if the source client/relay provide one. This can
      be anything be using certain key words can help searches in the YP
      directories.
    -->
    <genre>my-genre</genre>

    <!--
      Setting this will add the specified bitrate to the stats (and therefore YP)
      for this mountpoint even if the source client/relay provide one. This is
      stated in kbps.
    -->
    <bitrate>128</bitrate>

    <!--
      Setting this will add the specified mime type to the stats (and therefore
      YP) for this mountpoint even if the source client/relay provide one. It is
      very unlikely that this will be needed.
    -->
    <type>application/ogg</type>

    <!--
      Setting this will add the specified subtype to the stats (and therefore
      YP) for this mountpoint. The subtype is really to help the YP server to
      identify the components of the type. An example setting is vorbis/theora
      do indicate the codecs in an Ogg stream.
    -->
    <subtype>vorbis</subtype>

    <!--
      Enable this to prevent this mount from being shown on the xsl pages. This
      is mainly for cases where a local relay is configured and you do not want
      the source of the local relay to be shown.
    -->
    <hidden>1</hidden>

    <!--
      This optional setting allows for providing a burst size which overrides
      the default burst size as defined in limits. The value is in bytes.
    -->
    <burst-size>65536</burst-size>

    <!--
      This optional setting specifies what interval, in bytes, there is between
      metadata updates within shoutcast compatible streams. This only applies to
      new listeners connecting on this mountpoint, not existing listeners
      falling back to this mountpoint. The default is either the hardcoded server
      default or the value passed from a relay.
    -->
    <mp3-metadata-interval>4096</mp3-metadata-interval>

    <!--
      This specifies that the named mount point will require listener
      authentication using HTTP basic auth. Despite the official documentation
      claiming to only support "htpasswd" type authentication, it also supports
      "url" type authentication and even provides examples elsewhere in their
      documentation.. They really need to go through and clean up everything...

      Anyway here is an example of htpasswd type authentication...

      The htpasswd authenticator requires a few parameters. The first, filename,
      specifies the name of the file to use to store users and passwords. Note
      that this file need not exist (and probably will not exist when you first
      set it up). Icecast has built-in support for managing users and passwords
      via the web admin interface. The second option, allow_duplicate_users, if
      set to 0, will prevent multiple connections using the same username.
      Setting this value to 1 will enable mutltiple connections from the same
      username on a given mountpoint. Note there is no way to specify a "max
      connections" for a particular user.
    -->
    <authentication type="htpasswd">
      <option name="filename" value="users-auth-file" />
      <option name="allow_duplicate_users" value="0" />
    </authentication>

    <!--
      And an example for URL authentication...

      Authenticating listeners via the URL method involves icecast, when a
      listener connects, issuing requests to a web server and checking the
      response headers. If a certain header is sent back then the listener
      connecting is allowed to continue, if not, an error is sent back to the
      listener.

      The URLs specified will invoke some web server scripts like PHP to do any
      work that they may choose to do. All that is required of the scripting
      language is that POST information can be handled and response headers can
      be sent back. libcurl is used for the requesting so https connections may
      be possible, but be aware of the extra overhead involved.

      The useragent sent in each curl request will represent the icecast server
      version. The response headers will depend on whether the listener is to be
      accepted. Acceptance is determined by the auth_header option you can also
      passed a failed reason in a header that looks like the following:

        icecast-auth-message: some reason for failure

      Each of the options described below are optional. Each option sends the
      parameters action, mount, server, and port. The action is the name of the
      option, the server is either the hostname or IP the user is connected to
      (haven't tested this), the port is the port the user is connected on and
      the mount is the stream mount point with leading slash that the user is
      attempting to connect to. The last catch is that listener_add and
      listener_remove have additional parameters, which are documented in their
      sections..

      The documentation mentions that these will be sent as a POST request,
      however, the way they are shown look like they are actually a GET
      request...
    -->
    <authentication type="url">
      <!--
        This URL is for informing the auth server of a stream starting. No
        listener information is passed for this, but can be used to initialise
        any details the auth server may have.
      -->
      <option name="mount_add" value="http://myauthserver.com/stream_start.php"/>

      <!--
        This URL is for informing the auth server of a stream finishing, like
        the start option, no listener details are passed.
      -->
      <option name="mount_remove" value="http://myauthserver.com/stream_end.php"/>

      <!--
        This is most likely to be used if anything. When a listener connects,
        before anything is sent back to them, this request is processed. The
        default action is to reject a listener unless the auth server sends back
        a response header which may be stated in the 'header' option.

        listener_add also provides, client, user, pass, ip, and agent. client is
        a unique number for the client that is connected. I don't know if the
        client number is re-used after a client disconnects, I don't know if this
        count gets reset every time a source connect or only when the server
        restarts or if it ever resets at all. I suspect user is filled in with
        the value of any basic auth user that has been sent, same with password
        but this might also get filled in by the the 'username' and 'password'
        options that are undocumented, ip is the IP address of the client and
        agent is the user agent the client provided. This is quite a bit of
        useful information for authenticating a user though...
      -->
      <option name="listener_add" value="http://myauthserver.com/listener_joined.php"/>

      <!--
        This URL is for when a listener connection closes.
        
        listener_remove also provides the client, user, pass, and duration. I'm
        assuming client is the same number as that sent in listener_add, user and
        pass are the same as for listener_add in that I assume it's the clients
        basic auth but it could also be the username and password fields passed
        as other options in this section... duration is an interesting one
        though, it is the length in seconds that the listener was connected to
        the string.
      -->
      <option name="listener_remove" value="http://myauthserver.com/listener_left.php"/>

      <!--
        The expected response header to be returned that allows the authencation
        to take place may be specified here. The default is:

          icecast-auth-user: 1
      -->
      <option name="auth_header" value="icecast-auth-user: 1"/>

      <!--
        Listeners could have a time limit imposed on them, and if this header is
        sent back with a figure (which represents seconds) then the Icecast
        server will disconnect them after this duration has elapsed.
      -->
      <option name="timelimit_header" value="icecast-auth-timelimit:"/>

      <!--
        These are quite the mystery... mentioned yet undocumented... I suspect
        they are passed to the listener_{add,remove} script as authentication
        for the server to the authentication server but I have no way to be
        sure... Maybe they're a form of default user/pass?
      -->
      <option name="username" value="user"/>
      <option name="password" value="pass"/>
    </authentication>

    <!--
      State a program that is run when the source is started. It is passed a
      parameter which is the name of the mountpoint that is starting. The
      processing of the stream does not wait for the script to end.
    -->
    <on-connect>/home/icecast/bin/source-start</on-connect>

    <!--
      State a program that is run when the source ends. It is passed a parameter
      which is the name of the mountpoint that has ended. The processing of the
      stream does not wait for the script to end.
    -->
    <on-disconnect>/home/icecast/bin/source-end</on-disconnect>
  </mount>
</icecast>
```

## Next Steps

* http://koorenneef.nl/content/run-your-own-online-radio-station-icecast2-and-ezstream-howto
* http://www.linuxcertif.com/man/1/ezstream/

