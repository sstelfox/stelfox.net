---
title: Building a Certificate Authority
weight: 67

aliases:
  - /notes/certificate_authority/

taxonomies:
  tags:
  - cryptography
  - linux

extra:
  done: true
  outdated: true
---

This page goes through how to create a local PKI infrastructure for use with
all the other components listed in my notes and many may not mention it at all.
It uses OpenSSL and provides scripts, information about choices made during the
process and where to go next.

## Security Notes

There are varying levels of security that need to be taken into account
throughout this process. The first and most important certificate is the 'root'
certificate authority's certificate. If the private key for this is compromised
everything else will need to be done by scratch. Additionally the private key
needs to be generated from a true random source. This is important as a little
bit of predictability will impair all future operations done with this
certificate and thus all encrypted operations done from certificates at the
heart of this system.

Second level certificate authorities should still be protected with utmost
caution, but these are for secondary services such as one for the [Linux/389
Directory Server] to hand out certificates, another for [Linux/OpenVPN]
certificates, one for websites and perhaps even another for personal
certificates for email and code signing. If one of these gets compromised the
root certificate can issue a CRL automatically invalidating all certificates
from that authority and limits the damage done.

## Root CA

Caution needs to be taken when working with the root certificate from the get
go. It should be generated on a clean machine disconnected from the network.

### Support Structure

The following set of commands builds a directory structure in the current
user's home drive in a folder called pki. It adjusts the permissions on the
folders to ensure that it is somewhat protected (though not protected from the
root user). Once again this should be performed on a trusted machine.

```
mkdir -p ~/pki/root/{certs,crl,newcerts,private}
chown -R `id -u`:`id -g` ~/pki
chmod -R 700 ~/pki
```

### Create the Configuration File

Create a file in the root CA's directory named openssl.cnf with the following
contents:

* [openssl.cnf](openssl.cnf)

### Create CA Key & Certificate

This section creates the CA private key, public certificate, and serial file
using the `openssl.cnf` file above.

```
openssl req -new -keyout private/ca.key -out ca.csr -config openssl.cnf
openssl ca -create_serial -config ./openssl.cnf -out ca.crt -days 1095 -batch \
  -keyfile private/ca.key -selfsign -extensions v3_ca -infiles ca.csr
```

You will now want to distribute "ca.crt" to any client that will use a service
with your CA.

## Common Tasks

### Simple Client Certificate Creation

First we'll need to create a key for client, this should be done on the client
itself. It may be easier if the CA config (openssl.cnf) was distributed as well
as there are some strict signing requirements in the above configuration where
the country, state, and org name need to match exactly.

```
openssl genrsa 2048 > host.example.org.key
openssl req -new -key host.example.org.key -out host.example.org.csr \
  -extensions v3_req
```

Once the CSR has been generated transfer it to the host containing the CA, this
assumes you have placed the file (and are currently within) the CA's directory.

```
openssl ca -config ./openssl.cnf -out host.example.org.crt -days 365 -batch \
  -keyfile private/ca.key -cert ca.crt -infiles host.example.org.csr
```

### Advanced Client Certificate Creation

Creating a certificate with multiple domains requires one extra step, create a
key and certificate as normal but create an additional file
`test.domain.net.cnf` that includes something along the following lines:

```
subjectAltName=DNS:www.test.domain.net,DNS:*.test.domain.net,DNS:other.domain.net
```

When you sign the key you'll need to add the flag `-extfile` and specify the
file with the above contents. This will append those domains to the
certificate. An example way to sign the CSR:

```
openssl ca -config ./openssl.cnf -out test.domain.net.crt -days 365 -batch \
  -keyfile private/ca.key -cert ca.crt -infiles test.domain.net.csr \
  -extfile test.domain.net.cnf
```

### Convert a Certificate for Microsoft Certificate Store

This will convert a standard OpenSSL certificate/key pair into a pfx for use by
Microsoft products (fuck them for being different).

```
openssl pkcs12 -export -out keycert.pfx -inkey priv.key -in cert.crt
```

### View the Contents of a Certificate

To view the text content of a certificate you can use the following command:

```
openssl x509 -text -noout -in cert.crt
```

You can also view the contents of a signing request using:

```
openssl req -text -noout -in cert.csr
```

## Quick Self Signed Cert

```
openssl req -new -x509 -newkey rsa:4096 -keyout server.key -nodes -days 365 \
  -out server.crt
```

## Add / Change a Password on a Keyfile

```
openssl rsa -des -in unprotected.key -out encrypted.key
```
