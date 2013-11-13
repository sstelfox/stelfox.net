---
created_at: 2012-02-14 18:08:51+00:00
updated_at: 2012-02-14 18:08:51+00:00
kind: article
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

> warning: peer certificate won't be verified in this SSL session

Ruby has taken the approach of by default not including any trusted certificate
authorities which I greatly appreciate especially considering that in 2010 and
2011 12 certificate authorities were known to have been hacked including major
ones such as [VeriSign][1], and [DigiNotar][2]. Some of which were [proven][3]
to have issued false certificates.

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
encoded in PEM format. Stick them all in a "ca.crt" file. For these two CAs
you're file will look a lot like this one:

```
-----BEGIN CERTIFICATE-----
MIID1TCCAr2gAwIBAgIDAjbRMA0GCSqGSIb3DQEBBQUAMEIxCzAJBgNVBAYTAlVT
MRYwFAYDVQQKEw1HZW9UcnVzdCBJbmMuMRswGQYDVQQDExJHZW9UcnVzdCBHbG9i
YWwgQ0EwHhcNMTAwMjE5MjI0NTA1WhcNMjAwMjE4MjI0NTA1WjA8MQswCQYDVQQG
EwJVUzEXMBUGA1UEChMOR2VvVHJ1c3QsIEluYy4xFDASBgNVBAMTC1JhcGlkU1NM
IENBMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAx3H4Vsce2cy1rfa0
l6P7oeYLUF9QqjraD/w9KSRDxhApwfxVQHLuverfn7ZB9EhLyG7+T1cSi1v6kt1e
6K3z8Buxe037z/3R5fjj3Of1c3/fAUnPjFbBvTfjW761T4uL8NpPx+PdVUdp3/Jb
ewdPPeWsIcHIHXro5/YPoar1b96oZU8QiZwD84l6pV4BcjPtqelaHnnzh8jfyMX8
N8iamte4dsywPuf95lTq319SQXhZV63xEtZ/vNWfcNMFbPqjfWdY3SZiHTGSDHl5
HI7PynvBZq+odEj7joLCniyZXHstXZu8W1eefDp6E63yoxhbK1kPzVw662gzxigd
gtFQiwIDAQABo4HZMIHWMA4GA1UdDwEB/wQEAwIBBjAdBgNVHQ4EFgQUa2k9ahhC
St2PAmU5/TUkhniRFjAwHwYDVR0jBBgwFoAUwHqYaI2J+6sFZAwRfap9ZbjKzE4w
EgYDVR0TAQH/BAgwBgEB/wIBADA6BgNVHR8EMzAxMC+gLaArhilodHRwOi8vY3Js
Lmdlb3RydXN0LmNvbS9jcmxzL2d0Z2xvYmFsLmNybDA0BggrBgEFBQcBAQQoMCYw
JAYIKwYBBQUHMAGGGGh0dHA6Ly9vY3NwLmdlb3RydXN0LmNvbTANBgkqhkiG9w0B
AQUFAAOCAQEAq7y8Cl0YlOPBscOoTFXWvrSY8e48HM3P8yQkXJYDJ1j8Nq6iL4/x
/torAsMzvcjdSCIrYA+lAxD9d/jQ7ZZnT/3qRyBwVNypDFV+4ZYlitm12ldKvo2O
SUNjpWxOJ4cl61tt/qJ/OCjgNqutOaWlYsS3XFgsql0BYKZiZ6PAx2Ij9OdsRu61
04BqIhPSLT90T+qvjF+0OJzbrs6vhB6m9jRRWXnT43XcvNfzc9+S7NIgWW+c+5X4
knYYCnwPLKbK3opie9jzzl9ovY8+wXS7FXI6FoOpC+ZNmZzYV+yoAVHHb1c0XqtK
LEL2TxyJeN4mTvVvk0wVaydWTQBUbHq3tw==
-----END CERTIFICATE-----
-----BEGIN CERTIFICATE-----
MIIDVDCCAjygAwIBAgIDAjRWMA0GCSqGSIb3DQEBBQUAMEIxCzAJBgNVBAYTAlVT
MRYwFAYDVQQKEw1HZW9UcnVzdCBJbmMuMRswGQYDVQQDExJHZW9UcnVzdCBHbG9i
YWwgQ0EwHhcNMDIwNTIxMDQwMDAwWhcNMjIwNTIxMDQwMDAwWjBCMQswCQYDVQQG
EwJVUzEWMBQGA1UEChMNR2VvVHJ1c3QgSW5jLjEbMBkGA1UEAxMSR2VvVHJ1c3Qg
R2xvYmFsIENBMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA2swYYzD9
9BcjGlZ+W988bDjkcbd4kdS8odhM+KhDtgPpTSEHCIjaWC9mOSm9BXiLnTjoBbdq
fnGk5sRgprDvgOSJKA+eJdbtg/OtppHHmMlCGDUUna2YRpIuT8rxh0PBFpVXLVDv
iS2Aelet8u5fa9IAjbkU+BQVNdnARqN7csiRv8lVK83Qlz6cJmTM386DGXHKTubU
1XupGc1V3sjs0l44U+VcT4wt/lAjNvxm5suOpDkZALeVAjmRCw7+OC7RHQWa9k0+
bw8HHa8sHo9gOeL6NlMTOdReJivbPagUvTLrGAMoUgRx5aszPeE4uwc2hGKceeoW
MPRfwCvocWvk+QIDAQABo1MwUTAPBgNVHRMBAf8EBTADAQH/MB0GA1UdDgQWBBTA
ephojYn7qwVkDBF9qn1luMrMTjAfBgNVHSMEGDAWgBTAephojYn7qwVkDBF9qn1l
uMrMTjANBgkqhkiG9w0BAQUFAAOCAQEANeMpauUvXVSOKVCUn5kaFOSPeCpilKIn
Z57QzxpeR+nBsqTP3UEaBU6bS+5Kb1VSsyShNwrrZHYqLizz/Tt1kL/6cdjHPTfS
tQWVYrmm3ok9Nns4d0iXrKYgjy6myQzCsplFAMfOEVEiIuCl6rYVSAlk6l5PdPcF
PseKUgzbFbS9bZvlxrFUaKnjaZC2mqUPuLk/IH2uSrW4nOQdtqvmlKXBx4Ot2/Un
hw4EbNX/3aBd7YdStysVAq45pmp06drE57xNNB6pXE0zX5IJL4hmXXeXxx12E6nV
5fEWCRE11azbJHFwLJhWC9kXtNHjUStedejV0NxPNO3CBWaAocvmMw==
-----END CERTIFICATE-----
```

Ugly right? That's what ruby needs though. But how do we get XMLRPC::Client to
actually use that information without hacking it all to pieces? Net::HTTP has a
few methods that allow you to set the appropriate connection settings and
XMLRPC::Client uses Net::HTTP. If XMLRPC::Client allowed to you specify this
directly somehow I would've been a lot happier.

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

[1]: http://www.informationweek.com/news/security/management/232600406
[2]: http://www.symantec.com/connect/blogs/diginotar-ssl-breach-update
[3]: http://nakedsecurity.sophos.com/2011/08/29/falsely-issued-google-ssl-certificate-in-the-wild-for-more-than-5-weeks/
[4]: http://stackoverflow.com/questions/9199660/why-is-ruby-unable-to-verify-an-ssl-certificate
[5]: http://stackoverflow.com/a/9238221/95114
[6]: http://www.rapidssl.com/
[7]: http://www.geotrust.com/

