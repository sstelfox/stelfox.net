---
title: Mailman
---

# Mailman

[GNU Mailman][1] is a computer software application from the GNU project for
managing electronic mailing lists.

Mailman is coded primarily in Python and currently maintained by Barry Warsaw.
Mailman is free software, distributed under the GNU General Public License.

While I currently don't have a Mailman installation installed in the
BedroomProgrammers.net, I have had to configure it on several occasions so
keeping my config guide handy in my documentation system could help me in the
future.

## Security Notes

Mailman in it's lowest form is a mail relay. Improperly configured, this means
that it could be used as a spam relay. This is not something that can be solved
through crafty firewall trickery so care needs to be taken when configuring the
service.

## Firewall Adjustments

Mailman needs to be able to both send and receive mail. These jobs are handled
by the system's MTA, the only two of which I use are [Postfix][2] and
[Sendmail][3] depending on the system. If I ever get around to it I'll also get
around to writing a config guide for [Exim][4]. Refer to those for proper
hardening and firewalling.

The other half of Mailman is the administrative interfaces. This is done
through a web site hosted on an [Apache][5] installation. Please refer to that
guide for firewall and configuration on that service.

## Configuration

TODO

[1]: http://www.list.org/
[2]: ../postfix/
[3]: ../sendmail/
[4]: ../exim/
[5]: ../httpd/

