---
title: VLAN
tags:
- networking
---

I use a fairly simple scheme to assign VLAN ID's based on the Class C subnet.
Valid VLAN numbers range from 1 - 1024 (A 10-bit number). Not all of these are
available for use however.

The Cisco switch at the core of my network limits the number of in-use VLANs to
250. This isn't a problem as if my network ever gets big enough that I need
this many I will probably be able to buy additional switches to trunk/route
more VLANs too.

The scheme used to calculate the VLAN for a subnet uses the bits to encode
information about the network. We have 10 bits to work with, these are broken
up into two groups, Sub-network (V) and Class C (C) like so VVCCCCCCCC. The
Class C segment is a binary representation of the Class C subnet that VLAN will
have running over it. The sub-network part is a number 0-3 encoded in binary
starting at 0 to allow a Class C be broken up into four subnets. This does not
require them to all have the same subnet mask (There could be a /25 a /26 and
two /27s if you'd please).

This scheme WILL bump into a few of the reserved subnets which can not be used
and are noted in the reserved section.

## Reserved

The table below lists all the VLANs that are reserved and why.

| ID        | Encoded Binary        | Affected Subnets  | Description                                                                                                                                      |
| --------- | --------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| 0         | 0000000000            | *.*.0.* / 0       | This is not a real VLAN however I've included it since subnet 0 can only have 3 sub-networks due to this                                         |
| 1         | 0000000001            | *.*.1.* / 0       | VLAN 1 is the default VLAN that traffic lives on when not tagged. This can be changed though it is against best practices. It should not be used |
| 1002      | 1111101010            | *.*.235.* / 3     | Cisco legacy reserved for: fddi-default                                                                                                          |
| 1003      | 1111101011            | *.*.236.* / 3     | Cisco legacy reserved for: trcrf-default                                                                                                         |
| 1004      | 1111101100            | *.*.237.* / 3     | Cisco legacy reserved for: fddinet-default                                                                                                       |
| 1005      | 1111101101            | *.*.238.* / 3     | Cisco legacy reserved for: trbrf-default                                                                                                         |
| 1006-1023 | 1111101101-1111111111 | *.*.239-255.* / 3 | Not actually available on Cisco switches                                                                                                         |
