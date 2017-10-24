---
date: 2017-10-24 18:39:22-04:00
tags:
- certificates
- security
title: CFSSL
---

[CFSSL][1] is a toolkit of utilities for TLS PKI infrastructures and supports
more functionality than I've personally needed. It is a fast and convenient way
to setup and manage a multi-layer internal certificate authority.

I've used it to generate an internal root CA, with sub-CAs for internal only
server certificates, and separate CAs for each domain of client certificates
(such as VPN, log, mail, and LDAP servers). This allows the root CA to be
protected more stringently than specific domains.

CFSSL supports hardware backed private keys (HSMs), including the [Yubikey
NEO][2] as long as you don't need > 1 signature/sec (which I definitely don't).
You could also set it up with a Red October server for private key management,
which could in turn be HSM backed.

## Installation

These notes assume you have a working [golang][3] installation. To install
cfssl and the other associated utilities run the following command:

```
go get -u github.com/cloudflare/cfssl/cmd/...
```

If you have any errors, ensure your golang installation is sane. Some
distributions do not have support for all of the available ciphers
(specifically the eliptic curve variants in Red Hat based distributions) which
may impact your ability to install and use the tool.

## Root CA Setup

For the sake of organization I use a fairly simple directory structure which
can be created with the following command:

```
mkdir -p ca/{source,json,output}
cd ca
```

All the configuration is done through JSON files. The config for a root CA may
look something like the following (which I placed in `ca/source/root.json`):

```json
{
  "CN": "Stelfox Root Certificate Authority",
  "key": {
    "algo": "ecdsa",
    "size": 521
  }
}
```

If you want to use RSA as your root key, you'd replace the `algo` field with
`rsa` and the `size` field with an appropriately sized key (I'd recommend 3072
or 4096 but you should match it to your security standards.

To generate the cert/key pair you can use the following command:

```
cfssl genkey -initca source/root.json > json/root.json
```

You can turn the resulting files into a set of PEM encoded files more familiar
to day to operation:

```
cat json/root.json | cfssljson -bare output/root
```

In the output directory you'll find `root.csr`, `root-key.pem`, and `root.pem`
which is the effective CSR used to generate the cert, the private key, and the
cert itself respectively. You can view the contents of the certificate using
the following command:

```
openssl x509 -in output/root.pem -text -noout
```

We'll then want to create a `config.json` file to define who, and how we sign
future certificates.

```json
{
  "signing": {
    "profiles": {
      "subca": {
        "ca_constraint": {
          "is_ca": true,
          "max_path_len": 0
        },
        "expiry": "8760h",
        "usages": ["cert sign", "crl sign"]
      }
    }
  }
}
```

## Generating a Sub-CA

We'll generate a CA to handle internal server authentication (my servers to my
servers). I created the following file in `sources/servers.json`:

```json
{
  "CN": "Stelfox Server Certificate Authority",
  "key": {
    "algo": "ecdsa",
    "size": 521
  }
}
```

And generate the servers CA with the following command:

```
cfssl gencert -ca file:output/root.pem -ca-key file:output/root-key.pem -config config.json -profile subca source/servers.json > json/servers.json
```

Which can in turn be turned into normal certificates as before with the
following command:

```
cat json/servers.json | cfssljson -bare output/servers
```

You'll also want to generate a certificate for your first server using this.
Before we can we'll want to add another profile to our config. This is up to
you to merge into your config:

```json
"server": {
  "expiry": "8760h",
  "usages": ["signing", "key encipherment", "server auth", "client auth"]
}
```

## Creating a Server Certificate

Create a certificate configuration for the server (this one for
testhost.stelfox.net with a couple of CNAMEs) store in `source/testhost.json`.
If you use the hosts array, be sure to include the CN name as well if it needs
to be validated as well.

```json
{
  "CN": "testhost.stelfox.net",
  "key": {
    "algo": "ecdsa",
    "size": 521
  },
  "hosts": [
    "testhost.stelfox.net",
    "tst01.dev.sfa.stelfox.net",
    "fud01.dev.sfa.stelfox.net"
  ],
  "names": [
    {
      "C": "US",
      "ST": "No State",
      "L": "No Town",
      "O": "Stelfox Personal Systems",
      "OU": "Research & Development"
    }
  ]
}
```

And generate the key and certificate:

```
cfssl gencert -ca file:output/servers.pem -ca-key file:output/servers-key.pem -config config.json -profile server source/testhost.json > json/testhost.json
cat json/testhost.json | cfssljson -bare output/testhost
```

## Distributing Trust

You'll want to combine the certificate authority and server CAs (and any other
relevant sub-CAs) into one file like the following:

```
cat output/root.pem output/server.pem > local-ca.pem
```

You'll want to trust this with one of the following methods (depends on how
your distro is setup). This list is not comprehensive, you may need to identify
a new method.

Method 1:

```
mkdir -p /usr/local/share/ca-certificates
cp local-ca.pem /usr/local/share/ca-certificates/
update-ca-certificates
```

(I lost my other notes)

[1]: https://github.com/cloudflare/cfssl
[2]: {{< relref "notes/yubikey.md" >}}
[3]: https://golang.org/
