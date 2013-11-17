---
title: Building a Certificate Authority
---

# Building a Certificate Authority

This page goes through how to create a local PKI infrastructure for use with
all the other components listed in this wiki and many not mentioned at all. It
uses OpenSSL and provides scripts, information about choices made during the
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

```ini
HOME                    = .
RANDFILE                = $ENV::HOME/.rnd
oid_section             = new_oids

[ new_oids ]

[ ca ]
default_ca = CA_default

[ CA_default ]
dir = /home/sstelfox/pki             # The root directory
certs = $dir/certs                   # Where the issued certs are kept
crl_dir = $dir/crl                   # Where the issued crl are kept
database = $dir/index.txt            # Database index file.
unique_subject = yes
new_certs_dir = $dir/newcerts        # Default place for new certs.

certificate = $dir/cacert.pem        # The CA certificate
serial = $dir/serial                 # The current serial number
crlnumber = $dir/crlnumber           # The current crl number
crl = $dir/crl.pem                   # The current CRL
private_key = $dir/private/ca.key # The private key
RANDFILE = $dir/private/.rand        # Private random number file

x509_extensions = usr_cert           # The extentions to add to the cert

name_opt = ca_default                # Subject Name options
cert_opt = ca_default                # Certificate field options

crl_extensions = crl_ext

default_days = 365                   # How long to certify for
default_crl_days = 7                 # How long before next CRL
default_md = sha256                  # Use sha256 for the hash
preserve = no                        # Keep passed DN ordering
policy = policy_match

# For the CA policy
[ policy_match ]
countryName = match
stateOrProvinceName = match
organizationName = match
organizationalUnitName = optional
commonName = supplied
emailAddress = optional

[ policy_anything ]
countryName = optional
stateOrProvinceName = optional
localityName = optional
organizationName = optional
organizationalUnitName = optional
commonName = supplied
emailAddress = optional

###################### CA Request Defaults ##########################
[ req ]
default_bits = 4096
default_md = sha256
default_keyfile = priv.key
distinguished_name = req_distinguished_name
attributes = req_attributes
x509_extensions = v3_ca # The extentions to add to the self signed cert

string_mask = utf8only

[ req_distinguished_name ]
countryName = Country Name
countryName_default = AC
countryName_min = 2
countryName_max = 2

stateOrProvinceName = State or Province Name (full name)
stateOrProvinceName_default = YmVkcm9vbXByb2dyYW1tZXJzLm5ldA==

localityName = Locality Name
localityName_default = dHJ1ZWR1YWxpdHk=

0.organizationName = Organization Name
0.organizationName_default = QmVkcm9vbSBQcm9ncmFtbWVycyAtIENvZGUgVGhlIFBsYW5ldA==

organizationalUnitName = Organizational Unit Name (eg, section)
organizationalUnitName_default = QWRtaW5pc3RyYXRpb24=

commonName  = Common Name (User\'s name the server\'s hostname)
commonName_max = 64

emailAddress = Email Address
emailAddress_max = 64

[ req_attributes ]
challengePassword = A challenge password
challengePassword_min = 4
challengePassword_max = 24

[ usr_cert ]
basicConstraints = CA:false

# These two are the only expected use cases at the time for this CA. If it is
# omitted the certificate can be used for anything *except* object signing.
# nsCertType = server
# nsCertType = client, email, objsign

# This is typical in keyUsage for a client certificate.
# keyUsage = nonRepudiation, digitalSignature, keyEncipherment

nsComment = "Certificate issued by BedroomProgrammers.net"

# PKIX recommendations harmless if included in all certificates.
subjectKeyIdentifier=hash
authorityKeyIdentifier=keyid,issuer

# This stuff is for subjectAltName and issuerAltname.
# Import the email address.
# subjectAltName=email:copy
# An alternative to produce certificates that aren't
# deprecated according to PKIX.
# subjectAltName=email:move

# Location of the public cert
issuerAltName = URI:http://bedroomprogrammers.net/bpca.crt

# Information about the certificates
nsCaRevocationUrl = http://bedroomprogrammers.net/bpca.crl
nsBaseUrl = http://bedroomprogrammers.net/ssl/
nsRevocationUrl = http://bedroomprogrammers.net/ssl/revoke/?
nsRenewalUrl = http://bedroomprogrammers.net/ssl/renew/?
nsCaPolicyUrl = http://bedroomprogrammers.net/ssl/policy/

# This is required for TSA certificates.
# extendedKeyUsage = critical,timeStamping

[ v3_req ]
# Extensions to add to a certificate request

basicConstraints = CA:false
keyUsage = nonRepudiation, digitalSignature, keyEncipherment

[ v3_ca ]
# Extensions for a typical CA

# PKIX recommendation.
subjectKeyIdentifier=hash
authorityKeyIdentifier=keyid:always,issuer

# This may break some older clients
basicConstraints = critical,CA:true
# If this happens the certificate will have to be remade using this option:
#basicConstraints = CA:true

# Some might want this also
# nsCertType = sslCA, emailCA

# Include email address in subject alt name: another PKIX recommendation
# subjectAltName=email:copy
# Copy issuer details
issuerAltName = URI:http://bedroomprogrammers.net/bpca.crt

[ crl_ext ]
issuerAltName = URI:http://bedroomprogrammers.net/bpca.crt
authorityKeyIdentifier = keyid:always

[ proxy_cert_ext ]
basicConstraints=CA:false

# nsCertType = server
# nsCertType = objsign
# nsCertType = client, email
# nsCertType = client, email, objsign

# This is typical in keyUsage for a client certificate.
# keyUsage = nonRepudiation, digitalSignature, keyEncipherment

nsComment = "Certificate issued by BedroomProgrammers.net"

# PKIX recommendations harmless if included in all certificates.
subjectKeyIdentifier = hash
authorityKeyIdentifier = keyid,issuer

# Copy subject details
issuerAltName = issuer:copy

nsCaRevocationUrl = http://bedroomprogrammers.net/bpca.crl
nsBaseUrl = http://bedroomprogrammers.net/ssl/
nsRevocationUrl = http://bedroomprogrammers.net/ssl/revoke/?
nsRenewalUrl = http://bedroomprogrammers.net/ssl/renew/?
nsCaPolicyUrl = http://bedroomprogrammers.net/ssl/policy/

# This really needs to be in place for it to be a proxy certificate.
proxyCertInfo=critical,language:id-ppl-anyLanguage,pathlen:3,policy:foo
```

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

## Notes

http://www.prshanmu.com/2009/03/generating-ssl-certificates-with-x509v3-extensions.html

