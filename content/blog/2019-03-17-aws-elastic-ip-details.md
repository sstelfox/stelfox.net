---
created_at: 2019-03-17T16:26:30-0500
evergreen: true
public: true
tags:
  - aws
  - networking
  - operations
title: AWS Elastic IP Details
slug: aws-elastic-ip-details
---

# AWS Elastic IP Details

Sometimes it becomes important to understand how your cloud provider implements certain networking details. While working through an issue in AWS I needed to understand how they handle public IP addressing. While this issue for me was specific to an Elastic IP all of their public addresses are handled this way and may bite you even without them. The problems specifically crop up when a hosted piece of software does NAT traversal detection and changes it's behavior based on the result.

Amazon attaches public IP address to EC2 instances (and likely other of their hosted services) through 1:1 NAT mapping of external to internal addresses. All traffic will reach your instance without issue, but your system's native networking stack will (by default) not become aware of what that public IP is.

In most cases this isn't an issue, the traffic ends up at your instance and is properly changed to the internal address so your system responds without any additional configuration work.

The first issue is tunneled traffic. I [experienced this]({{< relref "2019-03-14-fighting-with-ipsec" >}}) in my last post with IPSec. The tunneled traffic is not modified by going through a 1:1 NAT and your host will not recognize the external address inside the tunnel, which in most cases will result in silently dropped packets (the "oh this isn't for me" syndrome).

There are ways to get your system to respond to tunneled packets with other IP addresses such as treating it like a high-availability shared virtual server IP address but I have yet to find a clean way to deal with responding to the address. IPSec had a way to deal with this built in directly and I'd refer you back to [my other post]({{< relref "2019-03-14-fighting-with-ipsec" >}}) to read about that.

Usually sniffing the tunneled traffic is enough to diagnose these issues. What is a bit more pernicious, is when a server changes its behavior when it detects a NAT in place. This requires deeper understanding of the protocol in use and in some cases the specific server implementation. Once again this post is ultimately about IPSec (and specifically libreswan).

While you don't have to make any changes to get IPSec working with AWS public IPs it will detect the NAT and start encapsulating the traffic. The encapsulation will require an additional port being opened on your security group firewall but more importantly, it will add variable latency and additional processing overhead to each packet. Not everything is sensitive to this but you'll be needlessly adding overhead to your network traffic is you don't address it. In my case (AWS VPC to AWS VPC) there aren't any meaningful NATs in place that require this encapsulation to function appropriately.

If you encounter this and are using libreswan on AWS you only need to add the following two lines to your tunnel's config disable this behavior:

```text
encapsulation=no
nat-keepalive=no
```

I hope this helps someone else diagnose weird behavior when working with public IP addresses on AWS.
