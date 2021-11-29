---
title: DANE / TLSA
weight: 90

date: 2016-07-27T14:11:22-04:00
updated: 2021-02-07T12:07:47-06:00

aliases:
  - /notes/tlsa/

taxonomies:
  tags:
  - certificates
---

DANE is an extension to certificate validation allowing DNSSEC to protect SSL
fingerprints, reducing the overall reliance on the public CA infrastructure. It
does this by creating a new DNS record type 'TLSA' for storing the raw value or
hash of either the complete certificate or the public key.

<!-- more -->

[RFC 6698][1] defines four usages of DANE:

* Usage 0: Used to specify a CA certificate, or public key of a certificate,
  that MUST be found in the certification chain for the service's certificate.
  This allows whitelisting what CAs are allowed to issue certificates. This
  mode is also referred to as PKIX-TA.
* Usage 1: Specify the service's public key or certificate. The service must
  present this, and pass the normal CA validation steps to be accepted. This
  mode is also referred to as PKIX-EE.
* Usage 2: This specifies a certificate or public key of a CA certificate that
  must be used as the trust anchor when validating the service certificate.
  Certificate validation then occurs and is valid as long as this CA is in the
  path.  This allows a domain to provide it's own CA certificate for the
  service. This mode is also referred to as DANE-TA.
* Usage 3: Directly specify the public key or certificate of the service. No
  additional validation needs to occur. This mode is also referred to as
  DANE-EE.

TLSA records are ignored unless the response has been authenticated with
DNSSEC.

I find usage 0 interesting to protect against alternative, compromised, or
state controlled CAs issueing certificates for my services and have them
validate successfully. Usage 1 offers similar protections but is more specific,
when used with the publickey I imagine this has very low overhead and protects
against malicious certificates issued even by your own CA. Both of these still
rely on the public CA system to validate the chain itself.

Usage 2 seems to have limited value to me. It seems impractical in all of these
usages to include the entirety of the CA certificate. It will always require
the slower TCP lookups due to size and will happy often even with caching.
Fingerprints are very manageable and they may be able to fit in a faster UDP
lookup.

To validate the service, the CA certificate will have to be presented to the
client as part of the SSL handshake to perform the verification. Presenting
certificate chains is already common with many of the public CAs but does incur
a measurable performance impact on every new connection. Ultimately I think
this is only valuable to simplify the overall management and distribution of an
in house certificate authority as wildcards may be able to be used to limit the
number of records managed.

The most interesting in my opinion is usage 3. Usage 3 has no reliance on any
CA public or private, and if a hash of the public key is used record
maintenance is only required when a new TLS service/server is setup, or when a
key gets rolled due to lifetime or breach. You can re-sign a new certificate
without updating the records as long as the key material doesn't change.

I find a certain amount of irony in the last one as the contents of the
certificate are almost exclusively used as a means to distribute the public
key. TLS certificate and name validation is done to ensure we were provided
with the public key of the service we actually want to talk to.

With DNSSEC we know the answer we got back to our name request is accurate. We
validate ownership over the name by being able to produce globally
authenticated results. With DANE we have a strong hash (minimum SHA256) to
validate the public key is the correct one for the service running on the port
we're trying to reach.

To break either DNSSEC or DANE would require breaking at least one of RSA,
ECDSA, SHA1, or SHA256. Breaking those enough to provide an alternate key would
invalidate the guarantees the normal CA validation provides as well.

## TLSA Record Definition

TLSA records are broken up into four sections. The usage (which we've already
defined), the selector, the match type, and the certificate data.

The selector defines whether the certificate data will have the entire
certificate (value of 0) or just the value of subjectPublicKeyInfo (value 1).

The matching type defines any operations that need to be done on the service
provided data before comparing it to what is in the TLSA record. A value of 0
indicates the data is raw, (perform no operations, just compare the bytes
directly). SHA256, and SHA512 applied over the raw bytes are values 1 and 2
respectively.

The final field is the actual certification data and it's contents are
effectively defined by the selector and the matching type fields.

## Generation

I'm preferential to choosing a usage type of 3 (check the service certificate
directly), checking the public key (selector 1), after applying SHA256 to the
data (matching type 1).

Mozilla has a script available for generating raw records [available here][2]
but generating the above is pretty easily done quickly with the following
couple lines of bash:

```
CERT_FILE="web_stelfox_lab.crt"
DOMAIN="_443._tcp.stelfox.lab."

RAW_RRDATA=$( openssl x509 -in ${CERT_FILE} -pubkey -noout | openssl rsa -pubin \
  -outform der | sha256sum | sed 's/ .*//' )

echo "${DOMAIN}   IN    TLSA        3 1 1   ${RAW_RRDATA}"
```

If the certificate is an ECDSA one instead of RSA you'll need to replace the
RAW_RRDATA line with the following one:

```
RAW_RRDATA=$( openssl x509 -in ${CERT_FILE} -pubkey -noout | openssl ec \
  -pubin -outform der 2> /dev/null | sha256sum | sed 's/ .*//' )
```

When both ECDSA and RSA certificates are used by a service, both records can be
published under the same key.

If Bind / NSD doesn't yet support TLSA you can instead use the 'raw form' just
replace the last line with:

```
ENC_RRDATA="0301${RAW_RRDATA}"
echo "${DOMAIN}   IN    TYPE65468   \\#     $(echo ${ENC_RRDATA} | wc -c)   ${ENC_RRDATA}"
```

There is also an [online service][4] for generating these records individually.

## Simple Tricks

If one certificate / key pair is used by a particular machine management of the
TLSA records for that machine can be simplified by using CNAME records. The
following shows a mail server sharing one TLSA record for all it's mail related
services:

```
_dane.mail.stelfox.lab.     IN    TLSA    3 1 1   a06b4224c68f79aa710b445d94263d0ebbeaf1a9df6dcb62d72feee9bdeaeb00

_25._tcp.mail.stelfox.lab.  IN    CNAME   _dane.mail.stelfox.lab.
_587._tcp.mail.stelfox.lab. IN    CNAME   _dane.mail.stelfox.lab.
_993._tcp.mail.stelfox.lab. IN    CNAME   _dane.mail.stelfox.lab.
```

I tend to make my services available based on CNAME tied to their function. A
bonus of using the public key method of TLSA allows me use the private key for
the host, while generating a unique certificate tied to that key for each
service.

## "Common Mistakes"

Take from [this page][3].

* Failure to automate DNS zone signing
* Failure to update TLSA record before transitioning to new certificates (see
  maintenance section)
* SMTP/TLSA usage MUST be either DANE-TA or DANE-EE
* Failure to include issuing CA in server provided certificate chain file.
* Incorrect TLSA selector (ex: using the certificate selector and generating
  the RRDATA using the public key)
* Incorrect TLSA digest (ex: indicating RAW but using SHA256)
* Selective availability of STARTTLS on SMTP servers (must be always available)
* DNS filtering firewalls that block TLSA queries
* Nameservers that don't handle the denial of existance for missing TLSA
  records correctly.
* Partial implementation (All MX records should be covered by DNSSEC and have
  published TLSA records)

## Maintenance / Key Rollover

### Fixed DANE Parameters

This is very straightforward and will likely be the most common type. If you
are aware of this happening, plan ahead by reducing the TTL on the TLSA records
affected to a short interval (say five minutes), do this at least one TTL in
advance of the rollover preferably two to prevent caching issues.

First generate the new material (cert or key, whatever is applicable to your
record). Generate a TLSA record for the new material and add it to the zone
(leave the old TLSA record in place).

The new and old record should be published for twice the length of the TTL of
the records. Once this time has elapsed, the service can begin using the new
key material.

Verify the server certificate is still validating with DANE. Once confirmed it
is safe to remove the old record from your zone.

### Transitioning from Self-Signed DANE-EE

This is a tad bit more complicated as you need to perform two transitions.
Because the certificate is self-signed it can not generally be valid in a
certificate authority chain.

First ensure you have the new certificate and key material for the certificate
that is valid under the new parameters. Perform a DANE-EE -> DANE-EE transition
as described in the Fixed DANE Parameters section.

With the new certificate validating, add a TLSA record with the new parameters,
After twice the TTL has expired verify, remove the old entry. Wait for the TTL
to expire again and ensure the certificate is still validating with DANE.

[1]: https://tools.ietf.org/rfc/rfc6698.txt
[2]: https://hg.mozilla.org/users/dkeeler_mozilla.com/dnssec-tls/file/tip/cert2dane.sh
[3]: https://dane.sys4.de/common_mistakes
[4]: https://ssl-tools.net/tlsa-generator
