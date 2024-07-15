---
created_at: 2019-03-14T21:26:30-0400
tags:
  - ipsec
  - linux
  - networking
title: Fighting IPSec on AWS
---

IPSec is a well known and well understood protocol that is pretty easy to get
setup and going... Most of the time. While setting up an IPSec tunnel to an AWS
host I came across a new and unique experience that didn't seem to have an
easily searchable solution.

I had two CentOS 7 EC2 instances, each set up with their own Elastic IP in a
default VPC. I installed and configured libreswan with the following config:

```
conn setup
  protostack=netkey

conn site-tunnel
  auto=start
  pfs=yes

  leftid=@left_tunnel_server_name
  rightid=@right_tunnel_server_name
  left=%defaultroute
  right=<remote-ip>

  authby=rsasig
  leftrsasigkey=<left-key>
  rightrsasigkey=<right-key>
```

The IPSec link came up without issue but pings were timing out without a
response. When sniffing the incoming packets, I was appropriately seeing the
ICMP echo requests coming in encapsulated in the tunnel and being re-injected.
There was never a response being generated.

The traffic capture was also pretty clear as to why. The encapsulated packet
had the elastic IP as the destination which the EC2 instance doesn't
*ACTUALLY* have and wasn't aware... So it didn't attempt to respond.

I went down a bit of a rabbit hole attempting to get the instance to recognize
that address with limited success. Adding the IP to an additional loopback
interface... IPTables DNAT rules... Some of them worked but they were dirty
hacks that would have been left until something blew up...

The solution was simple and even improved the overall performance of the
link. By default libreswan operates in `tunnel` mode which sends along the
destination information as well (and can be used for routing network across).
For the use I almost always use these links for, `transport` is more
appropriate and has less protocol overhead.

By adding the following line to the connection configuration on both sides the
problem vanished:

```
  type=transport
```

With any luck the next person that comes across this issue will find this post
and their life will be a tad bit easier.
