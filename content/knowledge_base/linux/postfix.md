---
title: Postfix
---

By default Fedora/CentOS come with sendmail. Postfix is preferable as it was
written with security in mind.

[https://grepular.com/Automatically_Encrypting_all_Incoming_Email Something
that would be good] to port over to Fedora/Postfix with a nice Stelfox spin,
and it's
[https://grepular.com/Automatically_Encrypting_all_Incoming_Email_Part_2 follow
up].

[https://grepular.com/Protecting_a_Laptop_from_Simple_and_Sophisticated_Attacks
This] is what originally turned me on to that.

[http://library.linode.com/email/postfix/dovecot-mysql-centos-5 This]] will
help setup a mail gateway.

I can use [http://library.linode.com/email/fetchmail this] to centralize my
email.

This [http://rimuhosting.com/support/settingupemail.jsp?mta=postfix site] has
some diagnostic information that may be useful.

As for Dovecot, while not being Postfix, is still an important piece of this
puzzle. The [http://wiki.dovecot.org/MailLocation/ Mail Location] for Dovecot
will need to be considered, so far I'm leaning towards
[http://wiki2.dovecot.org/MailboxFormat/dbox sdbox], however, it is not
compatible with mutt which is my ideal client. My next alternative would be the
[http://wiki.dovecot.org/MailboxFormat/Maildir Maildir].

## General Host MTA

## Local Network Mail Relay

## Generic Mail Relay

### Configuration

#### /etc/postfix/main.cf

The following configuration was used as a temporary mail relay. It does not
filter spam and was done fast so there are probably problems in the
configuration that were missed. Proceed with caution. A tool that was
invaluable to me in diagnosing queueing issues was "qshape" which is part of
the package "postfix-perl-scripts" in Fedora 15.

```
myhostname = mailrelay.example.org

command_directory = /usr/sbin
daemon_directory = /usr/libexec/postfix
data_directory = /var/lib/postfix
queue_directory = /var/spool/postfix

mail_owner = postfix
default_privs = nobody
setgid_group = postdrop

allow_percent_hack = no
disable_vrfy_command = yes
smtpd_helo_required = yes

inet_interfaces = all
inet_protocols = all

mydestination = $myhostname
unknown_local_recipient_reject_code = 550

mynetworks_style = subnet
mynetworks = 10.15.0.0/16, 127.0.0.0/8

relay_domains = example.org, example.com
relayhost = [10.15.1.65]

in_flow_delay = 0

alias_maps = hash:/etc/aliases
alias_database = hash:/etc/aliases

fast_flush_domains = $relay_domains

smtpd_banner = $myhostname ESMTP

local_destination_concurrency_limit = 2
default_destination_concurrency_limit = 20

sendmail_path = /usr/sbin/sendmail.postfix
newaliases_path = /usr/bin/newaliases.postfix
mailq_path = /usr/bin/mailq.postfix
```

## Full Local Client MTA w/ Relaying

```
queue_directory = /var/spool/postfix
command_directory = /usr/sbin
daemon_directory = /usr/libexec/postfix
data_directory = /var/lib/postfix
mail_owner = postfix
inet_interfaces = localhost
inet_protocols = all
mydestination = $myhostname, localhost
local_recipient_maps = unix:passwd.byname $alias_maps
unknown_local_recipient_reject_code = 550
mynetworks_style = host
mynetworks = 127.0.0.0/8
relayhost = 0x378.net
#relayhost = [mail-01.i.0x378.net]
alias_maps = hash:/etc/aliases
alias_database = hash:/etc/aliases
debug_peer_level = 2

debugger_command =
         PATH=/bin:/usr/bin:/usr/local/bin:/usr/X11R6/bin
         ddd $daemon_directory/$process_name $process_id & sleep 5

sendmail_path = /usr/sbin/sendmail.postfix
newaliases_path = /usr/bin/newaliases.postfix
mailq_path = /usr/bin/mailq.postfix

setgid_group = postdrop
html_directory = no
manpage_directory = /usr/share/man
sample_directory = /usr/share/doc/postfix-2.10.2/samples
readme_directory = /usr/share/doc/postfix-2.10.2/README_FILES
```

You'll also want to append an administrator's email to the aliases table:

```
echo "root:  admin+$(hostname -s)@i.0x378.net" >> /etc/aliases
newaliases
```

And enable/start the service:

```
systemctl enable postfix.service
systemctl start postfix.service
```

## Creating a catch-all

```sh
groupadd -g 201 collector
useradd -u 201 -g 201 collector
passwd collector
mkdir /var/spool/mail/all
chown collector:collector /var/spool/mail/all
```

yum install postfix -y

Edit /etc/postfix/main.cf

Created lines:

  myhostname = postfix-catch-all.i.0x378.net
  home_mailbox = Maildir/
  #local_recipient_maps = # Intentionally unset
  virtual_mailbox_maps = regexp:/etc/postfix/virtual_mailbox_regexes.txt
  virtual_mailbox_base = /home
  virtual_uid_maps = static:201 # The UID of the mailtrap user
  virtual_gid_maps = static:201 # The GID of postfix
  virtual_minimum_uid = 200

Changed lines:

  inet_interfaces = all

Created the file /etc/postfix/virtual_mailbox_regexes.txt with the following contents:

  /.*/  collector/Maildir/

Opened port 25 on the firewall

## Round 2

```
yum install postfix -y
```

Edit /etc/postfix/main.cf

Created lines:

```
disable_vrfy_command = yes
myhostname = mail-01.i.0x378.net
home_mailbox = Maildir/
local_recipient_maps = unix:passwd.byname $alias_maps
virtual_alias_maps = regexp:/etc/postfix/virtual_aliases
```

Changed lines:

```
inet_interfaces = all
```

Make sure `mydestination` is unset

Created the file /etc/postfix/virtual_aliases with the following contents:

  /.*/  root

Opened port 25 on the firewall

Great success! The local root account is now receiving emails to literally any
address. In production this probably shouldn't be the root user....

## Notes on Building the App

yum install ruby git rubygem-bundler ruby-devel make gcc openssl-devel openssh-server -y

systemctl enable sshd.service
systemctl start sshd.service

Temporarily allow HTTPS for gem installation...

On development box...

rails new parcel_pot --skip-test-unit --skip-bundle
cd parcel_pot

cat > Gemfile <<-EOS
source 'https://rubygems.org'

gem 'rails', '4.0.0'

gem 'jquery-rails'
gem 'turbolinks'
gem 'jbuilder', '~> 1.2'

# Use ActiveModel has_secure_password
# gem 'bcrypt-ruby', '~> 3.0.0'

gem 'puma'

group :development do
  gem 'capistrano'
  gem 'sqlite3'
end

gem 'debugger', group: [:development, :test]
EOS

bundle
git init
git add .
git commit -m "Initial commit"

cap install

cat > Capfile <<-EOS
require 'capistrano/setup'
require 'capistrano/deploy'
require 'capistrano/bundler'
require 'capistrano/rails/assets'
require 'capistrano/rails/migrations'

Dir.glob('lib/capistrano/tasks/*.cap').each { |r| import r } 
EOS

## Potentially Useful Links

* http://library.edgecase.com/configuring-postfix-to-deliver-email-to-ruby

## Diagnosing Mail Issues

To check the current state of the mail queue on a server you can run the
following command:

```
postqueue -p
```

or:

```
mailq
```

The error messages often indicate what the problem is allowing you to find mail
routing issues.

To immediately flush the queue (attempt to resent all the mail:

```
postqueue -f
```

Alternatively you can just delete all the deferred mail in the queue or all
mail in the queue with one of the following two commands:

```
postsuper -d ALL deferred
postsuper -d ALL
```

## Authenticated Mail Relay

* http://www.anthonyldechiaro.com/blog/2008/10/17/postfix-authenticated-smtp-relayhost/

## Greylisting

milter-greylist, sqlgrey

## SSL

```
yum install cyrus-sasl -y
```

Create the SSL certificate

```
cd /etc/postfix
openssl req -new -x509 -newkey rsa:4096 -keyout key.pem -nodes -days 365 -out cert.pem
chmod 0600 *.pem
```

Enable TLS on the SMTP server by adding the following set of commands:

```
smtpd_use_tls = yes
tls_random_source = dev:/dev/urandom
smtpd_tls_cert_file = /etc/postfix/cert.pem
smtpd_tls_key_file = /etc/postfix/key.pem
```

## Anti-Virus & Spam Filtering

```
yum install amavisd-new spamassassin clamav clamav-update clamav-server-sysvinit -y
```

I opened up `/etc/sysconfig/freshclam` and commented out the last line.

Edited $mydomain variable in /etc/amavisd/amavisd.conf to be '0x378.net' and
finally enable and start the services.

```
systemctl enable amavisd.service
systemctl enable clamd.amavisd.service
systemctl enable spamassassin.service
systemctl start amavisd.service
systemctl start clamd.amavisd.service
systemctl start spamassassin.service
```

Additional things to consider:

bogofilter spambayes spamprobe dspam

## DKIM

There are two postfix DKIM milters available, opendkim, and dkim-milter. The
former is a fork of the latter, has fewer bugs, and is under a much tighter
release schedule.

```
yum install opendkim -y
```

## DMARC



## SPF Validation

There are two postfix SPF filters available as well. The first one is
perl-Mail-SPF and the other is pypolicyd-spf. From what I can tell the latter
is significantly more sophisticated and it provides a saner set of defaults so
thats the choice I'm going with.

The following is a set of the valid SPF keywords and their modifiers.

```
v=spf1  ->  Specifies this is an SPF record, and we're using version 1 of it.
all       ->  Matches everything not specifically matched.
a         ->  Match the A record of the domain by default, additionally an
              other domain can be specified, and a CIDR network prefix can be
              applied to the resolved address. (ex: a a:other.tld a/24
              a:test.tld/24)
mx        ->  Match the MX records of the domain by default, additional domains
              and CIDR suffixes can be applied like the a record. (ex: mx
              mx:other.tld mx/28 mx:something.tld/24)
ip4       ->  IPv4 address or network (CIDR format) (ex: ip4:192.168.0.0/24)
ip6       ->  IPv6 address or network (CIDR format) (ex:
              ip6:2001:51b2:200C::/64)
ptr       ->  ptr, without an argument this validates that at least one of the
              domains resolved by looking up the client's IP address resolves
              back to the current domain. When a domain is provided it
              validates the reverse lookups match that domain instead.
exists    ->  Matches successfully if the provided domain successfully resolves
              to an address (it doesn't matter what address). This is valuable
              for use with macros, allowing RBL-style reversed-IP lookups.
include   ->  Additionally add the SPF record from another domain. If that
              other domain doesn't include an SPF record the result will be a
              PermError. (ex: include:example.com).
redirect  ->  ignore this SPF record and use the SPF record at the provided
              domain instead. If the provided domain doesn't have an spf record
              the result is unknown. (ex: redirect=example.com)
exp       ->  If an SMTP receiver rejects a message, it can direct
              non-conforming users to a web page that provides further
              instructions. When the domain is expanded; a TXT lookup is
              performed, the result of the TXT query is then macro expanded and
              shown to the sender (ex: exp=explain._spf.%{d})
```

Expressions:

```
-     Fail
~     Soft-fail (accept but mark)
+     Pass
?     Neutral
```

Install SPF stuff:

```
yum install pypolicyd-spf -y
```

## SenderID

This is the Microsoft specific version of SPF. It's confusing as they have
similar syntax. SenderID is obsolete but occasionally still causes issues when
broken SenderID implementations attempt to validate a SPF record. There was
some mention in the articles I read that SPF and SenderID operate at different
layers, but they never went into details about it.

Looking into the 'layers' thing a little bit deeper, it seems that SPF use the
SMTP protocol's "MAIL FROM" envelope address to perform the validation while
SenderID uses the headers in the body content. Definitely smarter on the SPF
front.

