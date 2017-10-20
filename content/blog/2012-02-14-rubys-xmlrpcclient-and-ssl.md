---
date: 2012-02-14 18:08:51+00:00
tags:
- development
- ruby
title: "Ruby's XMLRPC::Client and SSL"
---

For the past few days I've been working on a Ruby project that needed to
interact with a remote XMLRPC API. This isn't particularly unusual but it was
the first time from within a Ruby application. Luckily enough Ruby has a built
in XMLRPC client that handles a lot of the messy bits.

The XMLRPC::Client class itself seems fairly simple. There are only a handful
of methods, five of which are for opening a new connection in a few different
ways, and at least two ways to open each type of connection.

As a starting point this was a simplified chunk of code that I was using to
connect to the remote API:

```ruby
require 'xmlrpc/client'

class APIConnection
  def initialize(username, password, host)
    # Build the arguments for the XMLRPC::Client object
    conn_args = {
      :user => username,
      :password => password,
      :host => host,
      :use_ssl => true,
      :path => "/api"
    }

    @connection = XMLRPC::Client.new_from_hash(conn_args)
  end

  def version
    @connection.call("version")
  end
end
```

The problem I ran into was when connecting to a server using HTTPS. I knew that
this certificate was good however I continued to get the message:

```
warning: peer certificate won't be verified in this SSL session
```

Ruby has taken the approach of by default not including any trusted certificate
authorities which I greatly appreciate especially considering that in 2010 and
2011 12 certificate authorities were known to have been hacked including major
ones such as VeriSign, and [DigiNotar][2]. Some of which were [proven][3] to
have issued false certificates.

Since XMLRPC::Client doesn't expose it's SSL trust settings through it's
methods I went on a bit of a journey through Google to find an answer. What I
found was overly disturbing, a lot of people don't seem to understand what SSL
is actually for. The solutions I found from the most egregious to least:

* Disabling OpenSSL certificate checking globally with
  OpenSSL::SSL::VERIFY_NONE
* Overriding the Net::HTTP certificate checking
* Disabling OpenSSL certificate checking locally by extending XMLRPC::Client
  and over-riding how it was establishing connections
* Using an SSL stripping proxy

I couldn't find a solution out there that didn't the security conscious voice
in my head scream in despair. I asked on [StackOverflow][4] for a good
solution. When I asked I didn't have a good grasp on how Ruby was handling SSL
certificates at all. The thorough answer from [emboss][5] didn't quite answer
my question but it gave me more than enough to really hunt down what I wanted.

First stop, I needed the certificates that I'll be using to verify the
connection. Every single certificate authority that issues certificates for
public websites makes the public portion of their certificates available and
this is what we need to verify the connection. To find out which ones you
specifically need you can go to the API server's address and look at it's
certificate information by clicking on the site's lock icon. Every browser is a
little different so you'll have to find this out on your own. With Chrome (and
perhaps others) you can download each of the certificates in the chain that
you'll need to verify the server's certificate.

The server I was connecting to was using a [RapidSSL][6] certificate, who has
been verified by [GeoTrust][7]. You want to grab their certificates base64
encoded in PEM format. Stick them all in a "ca.crt" file.

How do we get XMLRPC::Client to actually use that information without hacking
it all to pieces? Net::HTTP has a few methods that allow you to set the
appropriate connection settings and XMLRPC::Client uses Net::HTTP. If
XMLRPC::Client allowed to you specify this directly somehow I would've been a
lot happier.

Here's that code snippet again, this time forcing certificate verification with
the ca.crt file. This code assumes that the ca.crt file lives in the same
directory as the connection script:

```ruby
require 'xmlrpc/client'

class APIConnection
  def initialize(username, password, host)
    # Build the arguments for the XMLRPC::Client object
    conn_args = {
      :user => username,
      :password => password,
      :host => host,
      :use_ssl => true,
      :path => "/api"
    }

    @connection = XMLRPC::Client.new_from_hash(conn_args)

    @connection.instance_variable_get("@http").verify_mode = OpenSSL::SSL::VERIFY_PEER
    @connection.instance_variable_get("@http").ca_file = File.join(File.dirname(__FILE__), "ca.crt")
  end

  def version
    @connection.call("version")
  end
end
```

Those last two lines in the initialize method first dive into the connection
we've already setup (but before it's been called), grab the of Net::HTTP and
tells it to force peer verification and to use the certificate file we created
before. No more warning, and we're actually safe.

[2]: http://www.symantec.com/connect/blogs/diginotar-ssl-breach-update
[3]: http://nakedsecurity.sophos.com/2011/08/29/falsely-issued-google-ssl-certificate-in-the-wild-for-more-than-5-weeks/
[4]: http://stackoverflow.com/questions/9199660/why-is-ruby-unable-to-verify-an-ssl-certificate
[5]: http://stackoverflow.com/a/9238221/95114
[6]: http://www.rapidssl.com/
[7]: http://www.geotrust.com/
