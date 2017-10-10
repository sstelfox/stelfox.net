---
date: 2014-04-21 18:37:04 -0400
slug: calculating-rsa-key-fingerprints-in-ruby
tags:
- development
- ruby
- security
title: Calculating RSA Key Fingerprints in Ruby
---

I regularily find myself working on projects that involve the manipulation and
storage of RSA keys. In the past I've never had to worry about identification
or presentation of these keys. Normally I've only got one too three pairs at
most that I'm manipulating (server, certificate authority, client).

I've not found myself working on a project that involves presenting the
certificates to users for selection and comparison. The obvious way too do this
is take a page out of other developer's books and present the key's
fingerprint.

For those unfamiliar with key fingerprints, they are a condensed way to compare
differing RSA with a high probability that if the fingerprints match, so do the
keys. These are generally based on a cryptographic digest function such as SHA1
and MD5, and you'll see them most commonly when connecting to a new SSH host
and will look like the following:.

```
The authenticity of host 'some.fakedomain.tld (127.0.0.1)' can't be established.
RSA key fingerprint is 0c:6c:dd:32:b5:59:40:1d:ac:05:24:4f:04:bc:e0:f3.
Are you sure you want to continue connecting (yes/no)?
```

The string of 32 hex characters presented there can be compared with another
known value to make sure you're connecting to the correct SSH server and will
always be the same length regardless of the bit-strength of the keys used.
Without the fingerprint, users would have to compare 256 hex characters for a
1024 bit key, which is a very low security key.

You can calculate the SSH fingerprint for your SSH key or a SSH host key using
the `ssh-keygen` command like so:

```sh
ssh-keygen -lf ~/.ssh/id_rsa
ssh-keygen -lf /etc/ssh/ssh_host_key.pub
```

It will work when the path is either a private RSA key or a public key
formatted for SSH authorizied key files.

X509 certificates also use a key fingerprint to help identify a certificate's
signing authority. What I rapidly learned through this investigation was that
they are calculated slightly differently from SSH fingerprints even if they're
in the same format.

I couldn't find any good Ruby code that calculated either, and the alternatives
were some dense C++. Luckily SSH fingerprints are pretty documented in
[RFC4253](http://www.ietf.org/rfc/rfc4253.txt) and
[RFC4716](http://www.ietf.org/rfc/rfc4716.txt). Fingerprints on RSA keys for
use with OpenSSL are less clear, and there is a different method for
calculating the fingerprints of certificates.

Slowly working through the undocumented bits of Ruby's OpenSSL wrapper, the
RFCs and a couple of C++ implementations I finally got a set of working
implementations that calculate the following fingerprints in Ruby:

* MD5 & SHA1 fingerprints for RSA SSH keys
* Fingerprints of RSA keys for use with x509 certificates
* Fingerprints of x509 certificates

The easiest being a regular x509 certificate:

```ruby
require 'openssl'

path_to_cert = '/tmp/sample.crt'
cert = OpenSSL::X509::Certificate.new(File.read(path_to_cert))
puts OpenSSL::Digest::SHA1.hexdigest(cert.to_der).scan(/../).join(':')
```

You can compare the output of the above code with OpenSSL's implementation with
the following command:

```sh
openssl x509 -in /tmp/sample.crt -noout -fingerprint
```

Please note that case sensitivity doesn't matter here (OpenSSL will return
upper case hex codes).

The next one I got working was the SSH fingerprints thanks to the RFCs metioned
earlier.

```by
require 'openssl'

path_to_key = '/tmp/ssh_key'

key = OpenSSL::PKey::RSA.new(File.read(path_to_key))
data_string = [7].pack('N') + 'ssh-rsa' + key.public_key.e.to_s(0) + key.public_key.n.to_s(0)
puts OpenSSL::Digest::MD5.hexdigest(data_string).scan(/../).join(':')
```

*Please note: The above only works for RSA SSH keys.*

Calculating a SHA1 fingerprint for SSH hosts is as simple as replacing the
'MD5' class with 'SHA1' or any of the other support digest algorithms.

The last one was the hardest to track down and implement, eventually I found
the answer in [RFC3279](http://www.ietf.org/rfc/rfc3279.txt) under section
2.3.1 for the format of the public key I would need to generate before
performing a digest calculation on it.

```ruby
require 'openssl'

path_to_key = '/tmp/x509_key.pem'

key = OpenSSL::PKey::RSA.new(File.read(path_to_key))
data_string = OpenSSL::ASN1::Sequence([
  OpenSSL::ASN1::Integer.new(key.public_key.n),
  OpenSSL::ASN1::Integer.new(key.public_key.e)
])
puts OpenSSL::Digest::SHA1.hexdigest(data_string.to_der).scan(/../).join(':')
```
