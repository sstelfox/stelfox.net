---
title: Postfix
---

By default Fedora/CentOS come with sendmail. Postfix is preferable as it was
written with security in mind.

[Something that would be good][1] to port over to Fedora/Postfix with a nice
Stelfox spin, and it's [follow up][2].

[This][3] is what originally turned me on to that.

[This][4] will help setup a mail gateway.

I can use [this][5] to centralize my email.

This [site][6] has some diagnostic information that may be useful.

As for Dovecot, while not being Postfix, is still an important piece of this
puzzle. The [Mail Location][7] for Dovecot will need to be considered, so far
I'm leaning towards [sdbox][8], however, it is not compatible with mutt which
is my ideal client. My next alternative would be the [Maildir][9].

## General Host MTA

## Local Network Mail Relay

## Generic Mail Relay

### Configuration

#### /etc/postfix/main.cf

The following configuration was used as a temporary mail relay. It does not
filter spam and was done fast so there are probably problems in the
configuration that were missed. Proceed with caution. A tool that was
invaluable to me in diagnosing queueing issues was `qshape` which is part of
the package `postfix-perl-scripts` in Fedora 15.

```ini
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

```ini
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

```
yum install postfix -y
```

Edit `/etc/postfix/main.cf`

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

Created the file `/etc/postfix/virtual_aliases` with the following contents:

```
/.*/  root
```

Opened port `25/tcp` on the firewall.

Since the root account is going to be receiving mail for all accounts and all
domains make sure that root is not being redirected to another email address in
the `/etc/aliases` file. Make sure to run `newaliases` if you make a change to
the file.

Great success! The local root account is now receiving emails to literally any
address. In production this probably shouldn't be the root user....

## Notes on Building the App

```
yum install ruby git rubygem-bundler ruby-devel make gcc openssl-devel \
  openssh-server -y

systemctl enable sshd.service
systemctl start sshd.service
```

Temporarily allow HTTPS for gem installation...

On development box...

```
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
```

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

* milter-greylist
* sqlgrey

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
yum install amavisd-new spamassassin clamav clamav-update \
  clamav-server-sysvinit -y
```

I opened up `/etc/sysconfig/freshclam` and commented out the last line.

Edited `$mydomain` variable in `/etc/amavisd/amavisd.conf` to be `0x378.net`
and finally enable and start the services.

```
systemctl enable amavisd.service
systemctl enable clamd.amavisd.service
systemctl enable spamassassin.service
systemctl start amavisd.service
systemctl start clamd.amavisd.service
systemctl start spamassassin.service
```

Additional things to consider:

* bogofilter
* spambayes
* spamprobe
* dspam

## DKIM

There are two postfix DKIM milters available, `opendkim`, and `dkim-milter`.
The former is a fork of the latter, has fewer bugs, and is under a much tighter
release schedule.

```
yum install opendkim -y
```

## DMARC



## SPF Validation

There are two postfix SPF filters available as well. The first one is
`perl-Mail-SPF` and the other is `pypolicyd-spf`. From what I can tell the
latter is significantly more sophisticated and it provides a saner set of
defaults so thats the choice I'm going with.

The following is a set of the valid SPF keywords and their modifiers.

|          |                                                                                                                                                                                                                                                                                            |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| v=spf1   | Specifies this is an SPF record, and we're using version 1 of it.                                                                                                                                                                                                                          |
| all      | Matches everything not specifically matched.                                                                                                                                                                                                                                               |
| a        | Match the A record of the domain by default, additionally an other domain can be specified, and a CIDR network prefix can be applied to the resolved address. (ex: a a:other.tld a/24 a:test.tld/24)                                                                                       |
| mx       | Match the MX records of the domain by default, additional domains and CIDR suffixes can be applied like the a record. (ex: mx mx:other.tld mx/28 mx:something.tld/24)                                                                                                                      |
| ip4      | IPv4 address or network (CIDR format) (ex: ip4:192.168.0.0/24)                                                                                                                                                                                                                             |
| ip6      | IPv6 address or network (CIDR format) (ex: ip6:2001:51b2:200C::/64)                                                                                                                                                                                                                        |
| ptr      | ptr, without an argument this validates that at least one of the domains resolved by looking up the client's IP address resolves back to the current domain. When a domain is provided it validates the reverse lookups match that domain instead.                                         |
| exists   | Matches successfully if the provided domain successfully resolves to an address (it doesn't matter what address). This is valuable for use with macros, allowing RBL-style reversed-IP lookups.                                                                                            |
| include  | Additionally add the SPF record from another domain. If that other domain doesn't include an SPF record the result will be a PermError. (ex: include:example.com).                                                                                                                         |
| redirect | ignore this SPF record and use the SPF record at the provided domain instead. If the provided domain doesn't have an spf record the result is unknown. (ex: redirect=example.com)                                                                                                          |
| exp      | If an SMTP receiver rejects a message, it can direct non-conforming users to a web page that provides further instructions. When the domain is expanded; a TXT lookup is performed, the result of the TXT query is then macro expanded and shown to the sender (ex: exp=explain._spf.%{d}) |

Expressions:

|   |                             |
|---|-----------------------------|
| - | Fail                        |
| ~ | Soft-fail (accept but mark) |
| + | Pass                        |
| ? | Neutral                     |

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

## Spam Trapping

This is a very simple message of seeding the website of a domain with fake
email addresses in a way that isn't visible too users but would get picked up
by any scrapers that are using simple regular expressions (such as using HTML
comments too hide the email).

This email address should be a real one that can receive mail. How the
administrator uses these mails is up too them. Some ideas could be:

* Auto-training spam filters
* Immediately blacklisting senders
* Watching for potential phishing attacks

These all have their own pros and cons and are not exclusive from each other.
There is a high probability that anything sent too this address is going too be
a spammer, especially so if the name is obvious too a human reader.

## Bounce Message Handling

## Monitoring Sent Bounce Messages

You can configure postfix in a way that when it sends a bounce message to a
remote mail server, it additionally sends a copy to static address. This is
useful for monitoring for abuse from mail clients that are compromised (large
number of bounce messages probably indicate a spam blast).

To send these too the address 'sent-bounces@example.tld' you'll want to add the
following lines too your postfix configuration:

```
notify_classes = resource, software, bounce
bounce_notice_recipient = sent-bounces@example.tld
```

The first line adds the 'bounce' class of messages to the standard messages
sent too the postmaster for delivery issues related too the software or server.
The second line redirects those specific messages to the email address shown
above.

### VERP

This is a pretty nifty trick that has [been standardized][10] too a certain
extent. The key too understanding how this works is knowing the difference
between the various forms of the FROM address used by mail servers. The three
are:

1. Return-Path (sometimes referred too as the Reverse-Path, or the
   Envelope-FROM) is the value submitted in the `MAIL FROM` part of the SMTP
   session. This does not need to be the same value found in the headers of the
   email sent after the DATA portion of the session.

   This is added as a header by the recipient's SMTP server. If one already
   exists it is replaced.

   All email bounces that get automatically generated should go too the
   Return-Path value. Not all mail servers obey this rule, some will bounce the
   email back to the From address.
2. The From address is the value found in the From header. This is supposed to
   be who the message is actually From (i.e. The user or software that actually
   sent the message). This is what is generally shown in mail clients as who
   sent the mail. This is also the email address that will be used for all
   human (mail client) responses if the email doesn't have a Reply-To header.
3. The Reply-To header is added by the sender (or the sender's software). This
   header is used to direct human responses to another address. It should be
   the first thing looked for when a user clicks on the 'Reply' button in their
   client and should be used to populate the `To:` field on the new message.

VERP takes advantage of the 'Return-Path' header to help direct bounces too an
automated system. While this can be used by things like mailing list systems
too automatically unsubscribe bad or no longer active email addresses, it can
also be used too detect compromised accounts and abuse of your mail server.

By combining a recipient delimiter in the 'Return-Path', you could add unique
bounce message processing detection based on any individual metric you want.
Usually sender is the most relevant.

As it stands Postfix supports VERP both for receiving, and for sending. Sending
is trickier as the client that is initiating the SMTP session for the mail to
get relayed has too explicitely enable VERP for that message by appending
'VERP' too the 'MAIL FROM:' component. This is not ideal for general tracking
and I haven't found a solution for it yet.

For receipt of these VERP bounces I prefer setting up a dedicated address that
I can pass too a script for processing such as 'bounce@example.tld'. Make sure
this address exists if before taking the following actions.

This method makes use of postfix transports too handle bounces speciality.
After the address has been created ensure you have the recipient delimiter
option configured in your `main.cf` file like so:

```
recipient_delimiter = +
```

We'll need to define a new transport, which will send the mail through the
script or software that will be handling the bounce messages. This will receive
the messages via STDIN, and can take any arguments you want too provide. I use
the bounce extension as the only argument too my script which results in an
addition to my 'master.cf' file that looks like the following:

```
bounce   unix  -       n       n       -       -       pipe
  flags=RX user=nobody argv=/srv/scripts/mail_bounce_handler ${extension}
```

The 'R' flag ensures that a 'Return-Path' message header is added too the
message before passing it into the script. The 'X' flag is used specifically by
me for my script, this flag indicates that this transport performs final
delivery of the message. If you want to additionally have these bounce messages
end up in a mailbox you'll want too leave this out.

The transport additionally indicates the script specified by the argv argument
will be executed as the nobody user with the extension passed as the sole
parameter too the script. You'll want too change the path of argv too the path
of your script.

If you don't already have a transports map (otherwise just add this tranport
and remap it if it's a hash type), create the file '/etc/postfix/transport' and
add the following contents:

```
bounce@example.tld    bounce:
```

And build the hash map:

```
postmap /etc/postfix/transport
```

Finally make sure postfix is aware of your transport map (the following line
should be in your 'main.cf' file).

```
transport_maps = hash:/etc/postfix/transport
```

Reload your postfix configuration and your script should now be handling all
mail sent too 'bounce@example.tld'.

[1]: https://grepular.com/Automatically_Encrypting_all_Incoming_Email
[2]: https://grepular.com/Automatically_Encrypting_all_Incoming_Email_Part_2
[3]: https://grepular.com/Protecting_a_Laptop_from_Simple_and_Sophisticated_Attacks
[4]: http://library.linode.com/email/postfix/dovecot-mysql-centos-5
[5]: http://library.linode.com/email/fetchmail
[6]: http://rimuhosting.com/support/settingupemail.jsp?mta=postfix
[7]: http://wiki.dovecot.org/MailLocation/
[8]: http://wiki2.dovecot.org/MailboxFormat/dbox
[9]: http://wiki.dovecot.org/MailboxFormat/Maildir
[10]: http://cr.yp.to/proto/verp.txt

