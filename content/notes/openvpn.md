---
title: OpenVPN
type: note
---

# OpenVPN

If doing this from within an LXC container you'll need to perform the following
two steps (this didnt work):

```
mkdir /var/lib/libvirt/lxc/${VMNAME}/dev/net
mknod /var/lib/libvirt/lxc/${VMNAME}/dev/net/tun c 10 200
```

```
yum install openssl openvpn -y
mkdir -p /etc/openvpn/keys
cd /etc/openvpn/keys
openssl dhparam -rand - 1024 > dh1024.pem

# Create the CA
touch /etc/pki/CA/index.txt
echo -e 'US\nVermont\nBurlington\n0x378.net\n\nca.0x378.net\n\n' \
  | openssl req -new -x509 -newkey rsa:2048 -keyout ca.key -nodes -days 365 \
  -out ca.crt &> /dev/null

# Create the server key & csr
echo -e 'US\nVermont\nBurlington\n0x378.net\n\nairlock-01.i.0x378.net\n\n\n\n' \
  | openssl req -newkey rsa:2048 -keyout server.key -nodes -days 365 \
  -out server.csr &> /dev/null

# Sign the server cert
openssl x509 -req -in server.csr -days 365 -CA ca.crt -CAkey ca.key \
  -set_serial 01 -out server.crt
```

Create the server configuration file:

```
cat << EOF > /etc/openvpn/server.conf
port 1194
dev tun
mode server

tls-server
ca keys/ca.crt
cert keys/server.crt
key keys/server.key
dh keys/dh1024.pem

ifconfig 10.8.0.1 10.8.0.2
ifconfig-pool 10.8.0.4 10.8.0.255
ifconfig-pool-persist ipp.txt

push "route 10.8.0.1 255.255.255.255"
push "route 10.0.0.0 255.255.255.0"

comp-lzo

keepalive 10 60
inactive 600

route 10.8.0.0 255.255.255.0

user openvpn
group openvpn

persist-tun
persist-key

verb 4
status openvpn-status.log
log-append openvpn.log
EOF
```

