---
title: OpenVAS
weight: 60

taxonomies:
  tags:
  - linux
  - security

extra:
  done: true
  outdated: true
---

## Setup

Install the packages `nikto`, `openvas-scanner`, `openvas-manager`, and
`openvas-client`.

## Scanner

As root run openvas-mkcert like the following:

```
[root@localhost ~]# openvas-mkcert
-------------------------------------------------------------------------------
                        Creation of the OpenVAS SSL Certificate
-------------------------------------------------------------------------------

This script will now ask you the relevant information to create the SSL certificate of OpenVAS.
Note that this information will *NOT* be sent to anybody (everything stays local), but anyone with the ability to connect to your OpenVAS daemon will be able to retrieve this information.

CA certificate life time in days [1460]: 3650
Server certificate life time in days [365]: 
Your country (two letter code) [DE]: US
Your state or province name [none]: Some State
Your location (e.g. town) [Berlin]: Some City
Your organization [OpenVAS Users United]: Example.net

-------------------------------------------------------------------------------
                        Creation of the OpenVAS SSL Certificate
-------------------------------------------------------------------------------

Congratulations. Your server certificate was properly created.

The following files were created:

Certification authority:
   Certificate = /etc/pki/openvas/CA/cacert.pem
   Private key = /etc/pki/openvas/private/CA/cakey.pem

OpenVAS Server :
    Certificate = /etc/pki/openvas/CA/servercert.pem
    Private key = /etc/pki/openvas/private/CA/serverkey.pem

Press [ENTER] to exit

[root@localhost ~]#
```

As root get the NVT feed by running the command `openvas-nvt-sync`.

Create a certificate for the OpenVAS-Manager to connect to the scanner like so:

```
[root@localhost ~]# openvas-mkcert-client -i
This script will now ask you the relevant information to create the SSL client certificates for OpenVAS.

Client certificates life time in days [365]: 3650
Your country (two letter code) [DE]: US
Your state or province name [none]: Some State
Your location (e.g. town) [Berlin]: Some City
Your organization [OpenVAS Users United]: Example.net
Your organizational unit [none]: 

**********
We are going to ask you some question for each client certificate. 

If some question has a default answer, you can force an empty answer by entering a single dot '.'

*********
OpenVAS username for the new user: om
Client certificates life time in days [3650]: 
Your country (two letter code) [DE]: US
Your state or province name [none]: Some State
Your location (e.g. town) [Berlin]: Some City
Your organization [OpenVAS Users United]: Example.net
Organization unit []: 
e-Mail []: 
Generating RSA private key, 1024 bit long modulus
...................................++++++
.................................................++++++
e is 65537 (0x10001)
You are about to be asked to enter information that will be incorporated
into your certificate request.
What you are about to enter is what is called a Distinguished Name or a DN.
There are quite a few fields but you can leave some blank
For some fields there will be a default value,
If you enter '.', the field will be left blank.
-----
Country Name (2 letter code) [DE]:
State or Province Name (full name) [Some-State]:
Locality Name (eg, city) []:
Organization Name (eg, company) [Internet Widgits Pty Ltd]:
Organizational Unit Name (eg, section) []:
Common Name (eg, your name or your server's hostname) []:
Email Address []:
Using configuration from /tmp/openvas-mkcert-client.26805/stdC.cnf
Check that the request matches the signature
Signature ok
The Subject's Distinguished Name is as follows
countryName           :PRINTABLE:'US'
stateOrProvinceName   :PRINTABLE:'Some State'
localityName          :PRINTABLE:'Some City'
organizationName      :PRINTABLE:'Example.net'
commonName            :PRINTABLE:'om'
Certificate is to be certified until Aug 20 17:24:00 2021 GMT (3650 days)

Write out database with 1 new entries
Data Base Updated

User rules

----------
openvassd has a rules system which allows you to restrict the hosts that  has the right to test.
For instance, you may want him to be able to scan his own host only.
Please see the openvas-adduser(8) man page for the rules syntax.
Enter the rules for this user, and hit ctrl-D once you are done:
(the user can have an empty rules set)
User om added to OpenVAS.
[root@localhost ~]#
```

Setup GPG trust of the nvt feed. You'll need to create a GPG key for openvas,
download and verify the transfer integrity key, import & sign the transfer
integrity key and turn on plugin signature checking. This can be done with the
following set of commands:

```
[root@localhost ~]# mkdir /etc/openvas/gnupg
[root@localhost ~]# gpg --homedir=/etc/openvas/gnupg --gen-key
gpg: WARNING: unsafe permissions on homedir `/etc/openvas/gnupg'
gpg (GnuPG) 1.4.11; Copyright (C) 2010 Free Software Foundation, Inc.
This is free software: you are free to change and redistribute it.
There is NO WARRANTY, to the extent permitted by law.

gpg: keyring `/etc/openvas/gnupg/secring.gpg' created
gpg: keyring `/etc/openvas/gnupg/pubring.gpg' created
Please select what kind of key you want:
   (1) RSA and RSA (default)
   (2) DSA and Elgamal
   (3) DSA (sign only)
   (4) RSA (sign only)
Your selection? 1
RSA keys may be between 1024 and 4096 bits long.
What keysize do you want? (2048) 
Requested keysize is 2048 bits
Please specify how long the key should be valid.
         0 = key does not expire
      <n>  = key expires in n days
      <n>w = key expires in n weeks
      <n>m = key expires in n months
      <n>y = key expires in n years
Key is valid for? (0) 
Key does not expire at all
Is this correct? (y/N) y

You need a user ID to identify your key; the software constructs the user ID
from the Real Name, Comment and Email Address in this form:
    "Heinrich Heine (Der Dichter) <heinrichh@duesseldorf.de>"

Real name: OpenVAS Plugin Verifier
Email address: 
Comment: 
You selected this USER-ID:
    "OpenVAS Plugin Verifier"

Change (N)ame, (C)omment, (E)mail or (O)kay/(Q)uit? o
You need a Passphrase to protect your secret key.

You don't want a passphrase - this is probably a *bad* idea!
I will do it anyway.  You can change your passphrase at any time,
using this program with the option "--edit-key".

We need to generate a lot of random bytes. It is a good idea to perform
some other action (type on the keyboard, move the mouse, utilize the
disks) during the prime generation; this gives the random number
generator a better chance to gain enough entropy.
+++++
....+++++
We need to generate a lot of random bytes. It is a good idea to perform
some other action (type on the keyboard, move the mouse, utilize the
disks) during the prime generation; this gives the random number
generator a better chance to gain enough entropy.

Not enough random bytes available.  Please do some other work to give
the OS a chance to collect more entropy! (Need 67 more bytes)
....+++++
.+++++
gpg: /etc/openvas/gnupg/trustdb.gpg: trustdb created
gpg: key ######## marked as ultimately trusted
public and secret key created and signed.

gpg: checking the trustdb
gpg: 3 marginal(s) needed, 1 complete(s) needed, PGP trust model
gpg: depth: 0  valid:   1  signed:   0  trust: 0-, 0q, 0n, 0m, 0f, 1u
pub   2048R/######## 2011-08-24
      Key fingerprint = #### #### #### #### ####  #### #### #### #### ####
uid                  OpenVAS Plugin Verifier
sub   2048R/######## 2011-08-24

[root@localhost ~]# wget http://www.openvas.org/OpenVAS_TI.asc
--2011-08-23 22:38:34--  http://www.openvas.org/OpenVAS_TI.asc
Resolving www.openvas.org... 78.47.251.62
Connecting to www.openvas.org|78.47.251.62|:80... connected.
HTTP request sent, awaiting response... 200 OK
Length: 1673 (1.6K) [text/plain]
Saving to: “OpenVAS_TI.asc”

100%[==============================================================>] 1,673       --.-K/s   in 0s      

####-##-## ##:##:## (152 MB/s) - “OpenVAS_TI.asc” saved [1673/1673]

[root@localhost ~]# gpg --homedir=/etc/openvas/gnupg --import OpenVAS_TI.asc
gpg: WARNING: unsafe permissions on homedir `/etc/openvas/gnupg'
gpg: key 48DB4530: public key "OpenVAS Transfer Integrity" imported
gpg: Total number processed: 1
gpg:               imported: 1
[root@localhost ~]# gpg --homedir=/etc/openvas/gnupg --lsign-key 48DB4530
gpg: WARNING: unsafe permissions on homedir `/etc/openvas/gnupg'

pub  1024D/48DB4530  created: 2007-11-05  expires: never       usage: SC  
                     trust: unknown       validity: unknown
sub  2048g/70610CFB  created: 2007-11-05  expires: never       usage: E   
[ unknown] (1). OpenVAS Transfer Integrity
pub  1024D/48DB4530  created: 2007-11-05  expires: never       usage: SC  
                     trust: unknown       validity: unknown
 Primary key fingerprint: C3B4 68D2 288C 68B9 D526  4522 4847 9FF6 48DB 4530

     OpenVAS Transfer Integrity

Are you sure that you want to sign this key with your
key "OpenVAS Plugin Verifier" (########)

The signature will be marked as non-exportable.

Really sign? (y/N) y
```

Alright now we need to start up the scanner service for the first time. It will
take a LONG time the first time and a significant amount of time everytime
there are updates to the NVT feed, though not nearly as long for the updates.

It takes so long that the service script will think that it failed. It HASN'T,
it's still doing it magic in the background, it's easiest to just watch it go
with top. When it finally settles down it'll be ready for the next step.

## OpenVAS Manager

Now we need to build the OpenVAS manager database. I'm not entirely sure what
the manager gets us as right now we have a working scanner (albeit without
users). I know it provides alternative connection methods such as an XML based
API for web services. Hey it might be useful it might not and there is some
funnyness but it's part of the full installation so I'm going to include
directions.

That touch at the beginning? Yeah if you don't create that file you'll get a
"Aborted (core dumped)" message when you try and rebuild the database. Having
it in existence though allows it to just run smoothly. Pretty big bug if you
ask me but one with an easy work around.

```
[root@localhost ~]# touch /var/lib/openvas/mgr/tasks.db
[root@localhost ~]# openvasmd --rebuild
```

## OpenVAS Administrator ##

This is getting it's own special section as it isn't available via the standard
Fedora package repositories annoyingly enough. For the time being I'm going to
leave this alone.

## Creating Users ##

I personally prefer using certificate for authentication against the server.
Easier than typing in a password every time and more secure in some ways. To
create a user that authenticates with a certificate you need to use the
`openvas-mkcert-client` command like so:

```
[root@localhost ~]# openvas-mkcert-client
This script will now ask you the relevant information to create the SSL client certificates for OpenVAS.

Client certificates life time in days [365]:
Your country (two letter code) [DE]: US
Your state or province name [none]: Some State
Your location (e.g. town) [Berlin]: Some City
Your organization [none]: Example.net
Your organizational unit [none]:
**********
We are going to ask you some question for each client certificate.

If some question has a default answer, you can force an empty answer by entering a single dot '.'

*********
OpenVAS username for the new user: <username>
Client certificates life time in days [365]:
Country (two letter code) [US]:
State or province name [Some State]:
Location (e.g. town) [Some City]:
Organization [Example.net]:
Organization unit []:
e-Mail []:
Generating RSA private key, 1024 bit long modulus
....++++++
............................................++++++
e is 65537 (0x10001)
You are about to be asked to enter information that will be incorporated
into your certificate request.
What you are about to enter is what is called a Distinguished Name or a DN.
There are quite a few fields but you can leave some blank
For some fields there will be a default value,
If you enter '.', the field will be left blank.
-----
Country Name (2 letter code) [DE]:
State or Province Name (full name) [Some-State]:
Locality Name (eg, city) []:
Organization Name (eg, company) [Internet Widgits Pty Ltd]:
Organizational Unit Name (eg, section) []:
Common Name (eg, your name or your server's hostname) []:
Email Address []:
Using configuration from /tmp/openvas-mkcert-client.15980/stdC.cnf
Check that the request matches the signature
Signature ok
The Subject's Distinguished Name is as follows
countryName           :PRINTABLE:'US'
stateOrProvinceName   :PRINTABLE:'Some State'
localityName          :PRINTABLE:'Some City'
organizationName      :PRINTABLE:'Example.net'
commonName            :PRINTABLE:'<username>'
Certificate is to be certified until Aug 23 18:10:38 2012 GMT (365 days)

Write out database with 1 new entries
Data Base Updated

User rules

----------
openvassd has a rules system which allows you to restrict the hosts that  has the right to test.
For instance, you may want him to be able to scan his own host only.
Please see the openvas-adduser(8) man page for the rules syntax.
Enter the rules for this user, and hit ctrl-D once you are done:
(the user can have an empty rules set)
User sstelfox added to OpenVAS.
Your client certificates are in /tmp/openvas-mkcert-client.15980 .
You will have to copy them by hand.
[root@localhost ~]# chown -R <username>:<username> /tmp/openvas-mkcert-client.15980/
[root@localhost ~]# mv /tmp/openvas-mkcert-client.15980/ /home/<username>/
[root@localhost ~]# cp /etc/pki/openvas/CA/cacert.pem /home/<username>/openvas-mkcert-client.15980/
```

## Verification

Save [this script](openvas_check.sh) and make it executable.
