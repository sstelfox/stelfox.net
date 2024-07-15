---
created_at: 2013-01-01T00:00:01-0000
evergreen: false
public: true
tags:
  - linux
  - operations
  - telephony
  - voip
title: Asterisk
slug: asterisk
---

# Asterisk

Asterisk is a software implementation of a telephone private branch exchange (PBX) originally created in 1999 by Mark Spencer of Digium. Like any PBX, it allows attached telephones to make calls to one another, and to connect to other telephone services including the public switched telephone network (PSTN) and Voice over Internet Protocol (VoIP) services. Its name comes from the asterisk symbol, “*”.

NOTE: FreeSWITCH may be a solid replacement for asterisk as it has support for the Linksys SPA3000 as well as ZRTP and SRTP support. It might be wise to look into using kamailio as a front end SIP router though this doesn't seem to be necessary unless we want to start handling multi-thousands of calls concurrently.

A few [references](http://robsmart.co.uk/2009/06/02/freeswitch_linksys3102/) for help when building FreeSWITCH.

## Previous Reasoning

This was setup on my private network to provide a land line phone to my office using our existing internet connection. I wanted to go about doing this without having to pay for the services as I don't expect this to get a lot of use.

This Asterisk setup involves the use of [Google Voice](http://google.com/voice) and [SIPGate](http://www.sipgate.com/). SIPGate provides a single phone number, SIP connectivity and call forwarding. Google Voice doesn't provide services to receive phone calls, however, it can be setup as an intermediary that will call you and then connect to another number on your behalf, while also providing call forwarding.

Combining the three will get free incoming and outgoing to anywhere in the US and Canada. Incoming calls will come from Google Voice, which will forward the call to the SIPGate phone number, which the Asterisk PBX will be tied to and we'll in turn be able to receive the call.

Outgoing calls are a bit more tricky. Implemented using [pygooglevoice](http://code.google.com/p/pygooglevoice/), the Asterisk box will actually connect to Google Voice's APIs to dial the number and call back (making it an incoming call and thus free) to make the outgoing call.

## Links

* <http://ofps.oreilly.com/titles/9780596517342/asterisk-Arch.html>
* <http://www.asteriskdocs.org/>
* <http://www.voip-info.org/>
* <http://nerdvittles.com/index.php?p=65>
* <http://www.voip-info.org/wiki/index.php?page=Asterisk+LDAP>
* <http://download.ag-projects.com/>

## Security Notes

Asterisk/SIP are going to be a significant security hole in the network if I allow outside access to the SIP services (In case I want to say be able to pick up the phone from my laptop while at a cafe or from my office). I intend to research making this considerably more secure before allowing this kind of setup and will document it here.

One of the things for me to note ahead of time is to not put incoming calls into the same context as my dial plans. This alone will be a significant increase in any kind of security.

### Encryption

The configurations provided have TLS enabled BUT it won't do any good until the server has a certificate. A normal webserver certificate in PKCS12 format. FOR TESTING ONLY you can generate a self signed certificate. You'll need both the certificate authority's cert and the key/cert pair for the server.

You can use the following to create a self-signed one:

```console
# openssl genrsa -out ca.key 4096
# openssl req -new -x509 -days 3650 -key ca.key -out ca.crt
# openssl genrsa -des3 -out pbx.key 4096
# openssl req -new -key argus.key -out pbx.csr
# openssl x509 -req -days 3650 -in pbx.csr -CA ca.crt -CAkey ca.key -set_serial 01 -out pbx.crt
# openssl rsa -in pbx.key -out pbx.key.insecure
# cat pbx.crt > pbx.pem
# cat pbx.key.insecure >> pbx.pem
# mv pbx.pem ca.crt /var/lib/asterisk/
# restorecon -R /var/lib/asterisk/
# chown asterisk:asterisk /var/lib/asterisk
```

### Firewall Adjustments

```iptables
# Allow incoming SIP calls from the local network
-A PRIMARYSERVICES -s 10.13.37.0/24 -m udp -p udp --dport 5060 -j ACCEPT
-A PRIMARYSERVICES -s 10.13.37.0/24 -m tcp -p tcp --dport 5060:5061 -j ACCEPT

# Log and allow SIP traffic from other people
-A PRIMARYSERVICES -m state --state NEW -m udp -p udp --dport 5060 -j LOG --log-prefix "SIP Traffic "
-A PRIMARYSERVICES -m state --state NEW -m tcp -p tcp --dport 5060:5061 -j LOG --log-prefix "SIP Traffic "
-A PRIMARYSERVICES -m udp -p udp --dport 5060 -j ACCEPT
-A PRIMARYSERVICES -m tcp -p tcp --dport 5060:5061 -j ACCEPT

# Allow incoming RTP traffic from the local network
-A PRIMARYSERVICES -s 10.13.37.0/24 -m udp -p udp --dport 10000:10100 -j ACCEPT

# Log and allow RTP traffic from other people
-A PRIMARYSERVICES -m state --state NEW -m udp -p udp --dport 10000:10100 -j LOG --log-prefix "RTP Traffic "
-A PRIMARYSERVICES -m udp -p udp --dport 10000:10100 -j ACCEPT
```

### Fail2Ban

Due to the overwhelmingly large number of attackers trying to exploit unsecured Asterisk boxes, configuring [Fail2Ban](fail2ban) with Asterisk is HIGHLY recommended. I'm updating the regular expressions in that template as I see attacks, and in some cases where I intentionally generate the logs myself.

## Config Files

There are a significant number of configuration files created when asterisk is installed, these all reside in "/etc/asterisk". I'll go over the ones that I made modifications too including full source (without the comments that come included, there are a lot of them). I copied the original files to "*.conf.o" and blew away most of the files I edited (including the stock comments).

### /etc/asterisk/asterisk.conf

```ini
; --- Asterisk's Primary Configuration ---
; Gentlemen

[directories](!)
  astetcdir => /etc/asterisk                ; The Asterisk configuration files
  astmoddir => /usr/lib64/asterisk/modules  ; The loadable modules
  astvarlibdir => /usr/share/asterisk       ; The base location for variable state information used by
                                            ; various parts of Asterisk. This includes items that are
                                            ; written out by Asterisk at runtime
  astdbdir => /var/spool/asterisk           ; Asterisk will store its internal database in this directory
                                            ; as a file called astdb
  astkeydir => /var/lib/asterisk            ; Asterisk will use a subdirectory called keys in this
                                            ; directory as the default location for loading keys for
                                            ; encryption
  astdatadir => /usr/share/asterisk         ; This is the base directory for system-provided data, such as
                                            ; the sound files that come with Asterisk
  astagidir => /usr/share/asterisk/agi-bin  ; Asterisk will use a subdirectory called agi-bin in this
                                            ; directory as the default location for loading AGI scripts
  astspooldir => /var/spool/asterisk        ; The Asterisk spool directory, where voicemail, call
                                            ; recordings, and the call origination spool are stored.
  astrundir => /var/run/asterisk            ; The location where Asterisk will write out it's unix control
                                            ; socket as well as it PID file
  astlogdir => /var/log/asterisk            ; The asterisk log directory

[options]
  verbose = 3                     ; Sets the default verbose setting for the Asterisk logger
  timestamp = yes                 ; Adds timestamps to all output except output from a CLI command
  initcrypto = yes                ; Load keys from the astkeydir at startup
  systemname = jeeves             ; The name of the PBX, yeah ours is called Jeeves, what you going to do about
                                  ; it?
  maxload = 0.8                   ; Sets a maximum load average. If the load average is at or above this
                                  ; threshold, Asterisk will not accept new calls.
  minmemfree = 10                 ; Sets the minimum number of megabytes of free memory required for Asterisk to
                                  ; continue accepting calls.
  cache_record_files = yes        ; When doing recording, stores the file in record_cache_dir until recording is
                                  ; complete.
  runuser = asterisk              ; Run Asterisk under the user specified
  rungroup = asterisk             ; Run Asterisk under the group specified
  defaultlanguage = en            ; Set the default language
  documentation_language = en_US  ; Set the preferred language for the command help

[files]
  astctlpermissions = 0660  ; Sets the permissions for the Asterisk control socket
  astctlowner = root        ; Sets the owner for the Asterisk control socket
  astctlgroup = asterisk    ; Sets the group for the Asterisk control socket
  astctl = asterisk.ctl     ; Sets the filename for the Asterisk control socket
```

### /etc/asterisk/ccss.conf

```ini
; --- Call Completion Supplementary Services ---
; Gentlemen

[general]
  cc_max_requests = 20  ; Global limit on the number of CC requests that may be in the Asterisk
                        ; system at any one time.
```

### /etc/asterisk/cdr_adaptive_odbc.conf

```ini
; --- ODBC Database CDR storage ---
; Gentlemen

[default]
  connection = gentlemen  ; Name of the connections (references res_odbc.conf)
  table = asterisk        ; Name of the table in the database
  usegmtime = yes         ; Use Greenwich Mean Time in the database
```

### /etc/asterisk/cdr.conf

```ini
; --- Asterisk Call Detail Record Engine Configuration ---
; Gentlemen

[general]
  batch = yes
  enable = yes
  safeshutdown = yes
  scheduleronly = no
  size = 100
  time = 300
  unanswered = yes

[csv]
  accountlogs = yes   ; Create separate log file for each account code
  loguniqueid = yes   ; Log uniqueid for the call
  loguserfield = yes  ; Log user field
  usegmtime = yes     ; Log date and time in GMT
```

### /etc/asterisk/cdr_syslog.conf

```ini
; --- Asterisk Call Detail Records (CDR) - Syslog Backend ---
; Gentlemen

; This line needs to be added to /etc/rsyslog.conf:
; local4.info                   /var/log/asterisk-cdr.log

[cdr]
  facility=local4
  priority=info

  ; High Resolution Time for billsec and duration fields
  template = '${CDR(clid)}','${CDR(src)}','${CDR(dst)}','${CDR(dcontext)}','${CDR(channel)}','${CDR(dstchannel)}','${CDR(lastapp)}','${CDR(lastdata)}','${CDR(start)}','${CDR(answer)}','${CDR(end)}','${CDR(duration,f)}','${CDR(billsec,f)}','${CDR(disposition)}','${CDR(amaflags)}','${CDR(accountcode)}','${CDR(uniqueid)}','${CDR(userfield)}'
```

### /etc/asterisk/extensions.conf

The only thing that I have changed in the below configuration is that where it says 'SPA3000' in the variables I used the MAC address of the actual SPA3000 device as it is defined in sip.conf (this has also been changed there). This will allow it to remain unique even if another is added.

```ini
; --- Asterisk Extension Configuration ---
; Gentlemen

; Global variables to be used in the rest of the dial plan
[globals]
  ; Area information
  LOCALAREACODE=802

  ; User extensions
  U1=SIP/user1
  U2=SIP/user2
  U3=SIP/user3

  ; Device extensions
  PSTNOUT=SIP/SPA3000_PSTNOUT
  PSTNIN=SIP/SPA3000_PSTNIN
  LANDLINE=SIP/SPA3000_LINE

; This context contains the menu for callers coming in over the PSTN line
[pstnmenu]
  exten => s,1,Verbose(3,${CALLERID(all)})  ; Print the Caller ID to the console if it's available
           same => n,GoTo(debug,echo,1)
           same => n,Answer()
           same => n,HangUp()

  exten => i,1,GoTo(s,1)

; This context is where unauthenticated SIP clients from the internet are going
; to end up This will provide a certain measure of spam and robot protection by
; requiring the user to answer a simple math question generated on the fly
[unauthenticated]
  ; If we allow numeric extension calls from the internet:
  ;       exten => _XXX,1,GoTo(internal-public,1,${EXTEN})

  ; If we allow alpha extension calls from the internet (assumes all extensions are lower case)
  ;       exten => _X.,1,Set(SAFE_EXTEN=${FILTER(a-z,${EXTEN})})
  ;               same => n,GoTo(internal-public,1,${SAFE_EXTEN})

  ; Catch any unknown or unallowed extensions and give them a "Network out of order" response
  ; This might trip up some brute force tools, and is better than not passing a reason
  exten => i,1,HangUp(38)

; Our trunk lines should never be making calls into the system, by putting them into this context
; if anyone manages to collect a valid username/password set from one of our trunk they will not be
; able to make calls through our system. This trunk should never have any dialplan in it beyonds 'hang up'
[from-trunk]
  ; Catch any unknown or unallowed extensions and give them a "Network out of order" response
  ; This might trip up some brute force tools, and is better than not passing a reason
  exten => i,1,HangUp(38)

; This is by far the most dangerous context. This one makes outgoing calls from
[callout]
  exten => _NXXNXXXXXX,1,Dial(${PSTNOUT}/1${EXTEN})     ; 10-digit pattern match for NANP
  exten => _9NXXNXXXXXX,1,Dial(${PSTNOUT}/1${EXTEN:1})  ; 10-digit pattern match for NANP (9 first)

  exten => _NXXXXXX,1,Dial(${PSTNOUT}/${LOCALAREACODE}${EXTEN})     ; 7-digit pattern match for NANP
  exten => _9NXXXXXX,1,Dial(${PSTNOUT}/${LOCALAREACODE}${EXTEN:1})  ; 7-digit pattern match for NANP
                                                                    ; (9 first)

  ;exten => _1NXXNXXXXXX,1,Dial(${PSTNOUT}/${EXTEN})     ; Long-distance pattern match for NANP
  ;exten => _91NXXNXXXXXX,1,Dial(${PSTNOUT}/${EXTEN:1})  ; Long-distance pattern match for NANP (9 first)

  ;exten => _011.,1,HangUp(63)   ; Deny the International pattern match for calls made from NANP
                                 ; with 'Service or option unavailable'
  ;exten => _9011.,1,HangUp(63)  ; Deny the International pattern match for calls made from NANP
                                 ; with 'Service or option unavailable' (9 first)

  ; The number they're reaching doesn't match anything we know about, deny it
  exten => i,1,HangUp()

[internal]
  include => callout          ; Allow internal phones to call out
  include => internal-public  ; Include public extensions (user extensions should only be defined once,
                              ; either here or there)

  exten => 600,1,GoTo(debug,echo,1)

; This context holds the private internal extensions that will be available publicly either
; through a PSTN line or through anonymous SIP connections from the internet. These lines
; will be directly dialable from the internal context
[internal-public]
  exten => 301,1,Dial(${U1})
  exten => user1,1,Dial(${U1})

  exten => 302,1,Dial(${U2})
  exten => user2,1,Dial(${U2})

  exten => 303,1,Dial(${U3})
  exten => user3,1,Dial(${U3})

  exten => 304,1,Dial(${LANDLINE})
  exten => landline,1,Dial(${LANDLINE})

; Various extensions that can be used to debug troublesome clients
[debug]
  ; This channel will echo back whatever sounds this server receives from the client
  ; including DTMF tones until they hangup or they press #
  exten => echo,1,Answer()
    same => n,Playback(silence/1)   ; Prevent the beginning of our audio from getting cut off
    same => n,Playback(demo-echotest)
    same => n,Echo()
    same => n,Playback(demo-echodone)
    same => n,Playback(vm-goodbye)
    same => n,Playback(silence/1)   ; Prevent the end of our audio from getting cut off
    same => n,HangUp()

  ; This can be used anywhere in any other dialplan through the GoSub() routine like so:
  ;       exten => example,1,GoSub(debug,log,1(1,[${CHANNEL}] This is the message))
  ; By default all logging is off, to turn it on you need to execute the following commands
  ; at the asterisk console:
  ;       *CLI> core set verbose 0
  ;       *CLI> database put Log all 1
  ;
  ; You can optionally only turn on logging for a single channel by running the following
  ; command in place of the latter command (this example is for the "incoming" channel)
  ;       *CLI> database put Log/channel/incoming 1
  ;
  exten => log,1,GotoIf($[${DB_EXISTS(Log/all)} = 0]?checkchan1)
    same => n,GotoIf($[${ARG1} <= ${DB(Log/all)}]?log)
    same => n(checkchan1),Set(KEY=Log/channel/${CHANNEL})
    same => n,GotoIf($[${DB_EXISTS(${KEY})} = 0]?checkchan2)
    same => n,GotoIf($[${ARG1} <= ${DB(${KEY})}]?log)
    same => n(checkchan2),Set(KEY=Log/channel/${CUT(CHANNEL,-,1)})
    same => n,GotoIf($[${DB_EXISTS(${KEY})} = 0]?return)
    same => n,GotoIf($[${ARG1} <= ${DB(${KEY})}]?log)
    same => n(return),Return()              ; Logging is not turned on return without doing anything
    same => n(log),Verbose(0,${ARG2})       ; Log the message to the console
    same => n,Return()
```

### /etc/asterisk/features.conf

```ini
; Asterisk Call Features (parking, transfer, etc) Configuration
; Gentlemen

[general]
  ; Nothing has been configured yet
```

### /etc/asterisk/indications.conf

I never got around to configuring this file, I left the section here as the default asterisk install adds this file in. For now you're on your own in configuring indications.

### /etc/asterisk/logger.conf

```ini
; --- Logging Configuration ---
; Gentlemen

[general]
  rotatestrategy = rotate
  exec_after_rotate=gzip -9 ${filename}.2

[logfiles]
  console => notice,warning,error,dtmf
  ;full => notice,warning,error,debug,verbose,dtmf,fax
  ;verbose => notice,warning,error,verbose
  messages => notice,warning,error

  syslog.local4 => notice,warning,error
```

### /etc/asterisk/manager.conf

```ini
; --- AMI - The Asterisk Manager Interface Configuration ---
; Gentlemen

[general]
  ;bindaddr = 10.13.37.17
  enabled = no
  ;port = 5038
  webenabled = no
```

### /etc/asterisk/modules.conf

```ini
; --- Module Loader configuration file ---
; Gentlemen

[modules]
  ; I much prefer the whitelist approach of loading modules as I won't get anything that I don't need,
  ; security through simplicity
  autoload=no

  ; Uncomment the following if you wish to use the Speech Recognition API
  ;preload => res_speech.so

  ; Essential modules needed for basic operations
  load => app_dial.so           ; Used to connection channels together (i.e., make phone calls)
  load => app_stack.so          ; Provides GoSub(), GoSubIf(), Return(), StackPop(), LOCAL(),
                                ; and LOCAL_PEEK()
  load => chan_sip.so           ; Session Initiation Protocol channel driver
  load => pbx_config.so         ; This is the traditional, and most popular, dialplan language
                                ; for Asterisk. Without this module, Asterisk cannot read
                                ; extensions.conf
  load => res_rtp_asterisk.so   ; Provides RTP

  ; Security Modules
  load => cdr_adaptive_odbc.so  ; Writes CDRs through ODBC framework to a database
  load => cdr_csv.so            ; Write CDRs to a CSV file
  load => cdr_syslog.so         ; Writes CDRs to syslog
  load => res_security_log.so   ; Enables security logging

  ; Audio Codecs

  ; Recommended Order:
  ;       ulaw, alaw, gsm, g722, g726, speex

  ; Description:          A-law PCM codec used all over the world (except Canada/USA) on the PSTN
  ; Codec:                G.711 (alaw)
  ; Nominal Bandwidth:    64 kbit/s
  ; Algorithmic Latency:  0.125ms
  ; Mean Opinion Score:   4.2
  ; Fax Capable:          Yes
  ; Video Capable:        No
  load => codec_alaw.so

  ; Description:          Global System for Mobile Communications (GSM) codec
  ; Codec:                GSM-FR
  ; Nominal Bandwidth:    13 kbit/s
  ; Algorithmic Latency:
  ; Mean Opinion Score:   3.7
  ; Fax Capable:          No
  ; Video Capable:        No
  load => codec_gsm.so

  ; Description:          Wideband audio codec
  ; Codec:                G.722
  ; Nominal Bandwidth:    64 kbit/s
  ; Algorithmic Latency:
  ; Mean Opinion Score:
  ; Fax Capable:          Maybe
  ; Video Capable:        No
  load => codec_g722.so

  ; Description:          Flavor of ADPCM
  ; Codec:                G.726
  ; Nominal Bandwidth:    16-40 kbit/s
  ; Algorithmic Latency:  0.125ms
  ; Mean Opinion Score:   3.85
  ; Fax Capable:          No
  ; Video Capable:        No
  load => codec_g726.so

  ; Open source speech codec
  ; Codec:                Speex
  ; Nominal Bandwidth:    2.15-22.4 kbit/s
  ; Algorithmic Latency:  30-34ms
  ; Mean Opinion Score:
  ; Fax Capable:          No
  ; Video Capable:        No
  load => codec_speex.so

  ; Description:          Mu-law PCM codec used in Canada/USA on PSTN
  ; Codec:                G.711 (ulaw)
  ; Nominal Bandwidth:    64 kbit/s
  ; Algorithmic Latency:  0.125ms
  ; Mean Opinion Score:   4.2
  ; Fax Capable:          Yes
  ; Video Capable:        No
  load => codec_ulaw.so

  ; Audio Codec Converters
  load => codec_resample.so  ; Re-samples between 8-bit and 16-bit signed linear
  load => codec_a_mu.so      ; A-law to mu-law direct converter

  ; Format Interpreters (used to read audio files from the disk)
  load => format_ogg_vorbis.so  ; Play ogg vorbis files
  load => format_wav.so         ; Play WAV files

  ; Resources & Function Modules
  load => func_cdr.so         ; Used by cdr_syslog module to format it's output
  load => func_strings.so     ; Used for security reasons on incoming calls from the PSTN lines
  load => res_adsi.so         ; Used by voicemail
  load => res_odbc.so         ; Used by the cdr_adaptive_odbc module
  load => res_musiconhold.so  ; Provides music on hold resources

  ; Voicemail
  load => app_voicemail_plain.so  ; Stores voicemails in files

  ; Production Debug Tools
  load => app_echo.so     ; Used in the echo channel to ensure two way audio is working
  load => app_verbose.so  ; Used in the various channels to send messages to the console and logs

  ; Used in various dialplans
  load => app_playback.so  ; Plays back a pre-recorded audio file

  ; For Caller ID information
  load => app_setcallerid.so
  load => func_callerid.so
```

### /etc/asterisk/musiconhold.conf

```ini
; --- Music on Hold Configuration ---
; Gentlemen

[default]
  directory = moh  ; Directory relative to the astdatadir that has the music on hold files
  mode = files     ; Read files from the configured directory
  sort = random    ; Sort the files in random order
```

### /etc/asterisk/res_odbc.conf

```ini
; --- ODBC Configuration File ---
; Gentlemen

; This 'context' name is the name that other files will reference this by
[gentlemen]
  enabled => yes                    ; Not strictly necessary but a quick way to remind myself this can
                                    ; be disabled without deleting or commenting out the whole thing
  dsn => asterisk-gentlemen         ; This value should match an entry in /etc/odbc.ini
  username => databaseuser          ; The username used to connect to the database
  password => databasepass          ; Password for connecting to the database
  pre-connect => yes                ; Open a connection as soon as asterisk starts
  idlecheck => 3600                 ; How often should we check that the database connection is still
                                    ; open? (in seconds)
  share_connections => yes          ; Allow connections to be shared, this reduces overhead but doesn't
                                    ; work on all databases
  limit => 5                        ; What is the maximum number of database connections we can have open
                                    ; at any one time?
  connect_timeout => 5              ; How long should we attempt to connect before considering the
                                    ; connection dead?
  negative_connection_cache => 300  ; When a connection fails, how long should we cache that information
                                    ; before we attempt another connection?
```

### /etc/asterisk/rtp.conf

```ini
; --- RTP Configuration ---
; Gentlemen

[general]
  rtpstart=10000
  rtpend=10100

  ;rtpchecksums=no
  ;dtmftimeout=3000
  ;rtcpinterval = 5000    ; Milliseconds between rtcp reports
                          ;(min 500, max 60000, default 5000)

  ; Enable strict RTP protection. This will drop RTP packets that
  ; do not come from the source of the RTP stream. This option is
  ; disabled by default.
  ;strictrtp=yes
```

### /etc/asterisk/sip.conf

```ini
; --- SIP Configuration ---
; Gentlemen

[general]
  ; Features/SIP Defaults
  allowguest = no            ; Disable unauthenticated call
  alwaysauthreject = yes     ; Always respond as if every extension is valid, this makes brute force
                             ; scanning of extensions pointless
  canreinvite = no           ; Force all calls to be relayed through asterisk since SIP clients
                             ; outside the firewall won't be able to directly talk to internal extensions
  context = unauthenticated  ; Default context for incoming calls
  dtmfmode = auto            ; Automatically detect the DTMF tranmission type
  srvlookup = no             ; Disable DNS SRV record lookup on outbound calls
  videosupport = yes         ; May be useful later when setting up video calls

  ; Network options
  bindport = 5060                      ; Explicitely bind to the default SIP port
  externip = x.x.x.x                   ; The current external IP address of The Gentlemens Lounge
  localnet = 10.13.37.0/255.255.255.0  ; Our internal subnet
  tcpenable = yes                      ; We'll allow incoming connections via TCP as well
  udpbindaddr = 10.13.37.xx            ; Listen for UDP requests on the primary interface

  ; Encryption settings
  tlsenable = yes                          ; Turn encryption support on
  tlsbindbindaddr = 10.13.37.xx            ; Listen for encrypted calls on the primary interface
  tlscafile = /var/lib/asterisk/ca.crt     ; Certificate authority's cert
  tlscertfile = /var/lib/asterisk/pbx.pem  ; This server's private key and certificate

  ; Clear the list of codecs
  disallow = all

  ; Set a default order for our codecs, providing all of them will increase compatibility with other
  ; internet clients. Notes on the quality tradeoff can be found in the module.conf file where these
  ; codecs are loaded
  allow = ulaw
  allow = alaw
  allow = gsm
  allow = g722
  allow = g726
  allow = speex
  allow = g729

; Template to restrict SIP users to only the local network
[localonly](!)
  ; Start by denying everyone
  deny = 0.0.0.0/0.0.0.0
  ; Allow connetion that originate from 10.13.37.X to attempt to authenticate against this account
  permit = 10.13.37.0/255.255.255.0

; A template for VoIP extensions that might connect from the outside
[sipclient](!)
  context = internal  ; They should be in our internal context
  host = dynamic      ; The clients will not be static (they could be anywhere)
  type = friend       ; User type
  qualify = yes       ; Talk to them frequently to make sure they're still there (and too hold
                      ; firewall connections open)

; Slight adjustment of the sipclient template to adjust that these extensions will be connecting from the outside
[roadwarrior](!,sipclient)
  nat = yes  ; Yes, they're probably on the other side of our NAT

; This is specifically for my SPA-3000, I've found that even though my device has a static addresses
; I should leave the host type as dynamic as registrations cause errors in the asterisk log, I suppose it
; would be possible to configure the LINE and PSTNIN as peers and turn off registrations in the Sipura's
; configuration, which might be the better route to go. I will have to investigate this in the future but
; this works for now.
[atadevice](!,sipclient,localonly)
  nat = never  ; These devices should never be outside our NAT

; Configuration for internal POTS line on the Linksys SPA-3000
[SPA3000_LINE](atadevice)
  context = internal
  port = 5060
  secret = setyourownpassword

; Configuration for incoming phone calls from the POTS line through the SPA-3000
[SPA3000_PSTNIN](atadevice)
  context = pstnmenu
  secret = setyourownpassword

; Configuration for incoming telephone line on the Linksys SPA-3000
[SPA3000_PSTNOUT](atadevice)
  context = from-trunk
  default-user = from-pbx
  host = 10.13.37.xx
  port = 5061
  secret = setyourownpassword

; SIP Users, these should have especially strong passwords. I use the following to generate
; passwords for them:
;      dd if=/dev/random count=2 bs=8 2>/dev/null | base64 | sed -e 's/=*$//'
; It will create passwords like:
;      9VkLRZz0s9GNFcAica0ONA
;      SOhiPwA0pTupjFx/QCu7BA
;      5Zw+5B8435lrMLKvsSNVpQ
[user1](roadwarrior)
  callerid = "User 1"
  secret = setyourownpassword

[user2](roadwarrior)
  callerid ="User 2"
  secret = setyourownpassword

[user3](roadwarrior)
  callerid = "User 3"
  secret = setyourownpassword
```

### /etc/odbc.ini

```ini
[asterisk-gentlemen]
Description = Database driver for Asterisk call logs
Trace       = Off
TraceFile   = stderr
Driver      = MySQL
SERVER      = mysqlserver.localhost
PORT        = 3306
DATABASE    = gentlemen
```

Here is the schema for the table that I use:

```sql
--
-- Database: `gentlemen`
--

-- --------------------------------------------------------

--
-- Table structure for table `asterisk`
--

DROP TABLE IF EXISTS `asterisk`;
CREATE TABLE `asterisk` (
  `call_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `accountcode` varchar(255) DEFAULT NULL COMMENT 'An account ID. This field is user-defined and is empty by default.',
  `src` varchar(255) NOT NULL COMMENT 'The calling party’s caller ID number. It is set automatically and is read-only.',
  `dst` varchar(255) NOT NULL COMMENT 'The destination extension for the call. This field is set automatically and is read-only.',
  `dcontext` varchar(255) NOT NULL COMMENT 'The destination context for the call. This field is set automatically and is read-only.',
  `clid` varchar(255) NOT NULL COMMENT 'The full caller ID, including the name, of the calling party. This field is set automatically and is read-only.',
  `channel` varchar(255) NOT NULL COMMENT 'The calling party’s channel. This field is set automatically and is read-only.',
  `dstchannel` varchar(255) NOT NULL COMMENT 'The called party’s channel. This field is set automatically and is read-only.',
  `lastapp` varchar(255) NOT NULL COMMENT 'The last dialplan application that was executed. This field is set automatically and is read-only.',
  `lastdata` varchar(255) NOT NULL COMMENT 'The arguments passed to the lastapp. This field is set automatically and is read-only.',
  `start` varchar(255) NOT NULL COMMENT 'The start time of the call. This field is set automatically and is read-only.',
  `answer` varchar(255) NOT NULL COMMENT 'The answered time of the call. This field is set automatically and is read-only.',
  `end` varchar(255) NOT NULL COMMENT 'The end time of the call. This field is set automatically and is read-only.',
  `duration` varchar(255) NOT NULL COMMENT 'The number of seconds between the start and end times for the call. This field is set automatically and is read-only.',
  `billsec` varchar(255) NOT NULL COMMENT 'The number of seconds between the answer and end times for the call. This field is set automatically and is read-only.',
  `disposition` varchar(255) NOT NULL COMMENT 'An indication of what happened to the call. This may be NO ANSWER, FAILED, BUSY, ANSWERED, or UNKNOWN.',
  `amaflags` varchar(255) NOT NULL COMMENT 'The Automatic Message Accounting (AMA) flag associated with this call. This may be one of the following: OMIT, BILLING, DOCUMENTATION, or Unknown.',
  `userfield` varchar(255) DEFAULT NULL COMMENT 'A general-purpose user field. This field is empty by default and can be set to a user-defined string.',
  `uniqueid` varchar(255) NOT NULL COMMENT 'The unique ID for the src channel. This field is set automatically and is read-only.',
  PRIMARY KEY (`call_id`)
) ENGINE=MyISAM  DEFAULT CHARSET=latin1 ;
```

## Music On Hold

The way that music on hold is configured in the dial plan on this page it will look for files in the directory "/usr/share/asterisk/moh/". Files will be chosen at random from this directory as long as asterisk can read them (that is it has a codec for the audio file loaded). I strongly suggest the music be in "ogg" format.

## Text to Speech

Please refer to my notes on [Festival](festival) for more information on text to speech with asterisk.
