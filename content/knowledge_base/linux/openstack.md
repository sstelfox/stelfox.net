---
title: Openstack
---

# Openstack

This is a mostly (95%) script-less installation and setup of OpenStack from
scratch on a single host, though done in a way that the services could each be
very easily broken out on to their own machines or multiple machines.

A few references that I've used generally for assistance figuring out what I
need:

* http://docs.openstack.org/essex/openstack-compute/install/yum/content/compute-system-requirements.html
* http://fedoraproject.org/wiki/Getting_started_with_OpenStack_on_Fedora_17
* http://docs.openstack.org/trunk/openstack-compute/admin/content/configuration-qpid.html
* https://cwiki.apache.org/qpid/qpid-design-configuration.html
* http://wiki.openstack.org/QpidSupport
* https://github.com/mseknibilel/OpenStack-Folsom-Install-guide/blob/master/OpenStack_Folsom_Install_Guide_WebVersion.rst
* https://github.com/openstack/keystone/blob/master/etc/keystone.conf.sample
* http://docs.openstack.org/developer/keystone/configuration.html

## Installation

This guide and all the other OpenStack sections on this wiki were written using
the pre-packaged version of OpenStack that comes with Fedora (version 2012.1.3
Essex) any other version may have different configuration options, and
different command line flags.

The various services should be configured in the order of the sections listed
here.

### Network Setup

For the sake of knowing exactly what is going, what connections are being made
and between what services I've elected to put every individual service on it's
own IP address. This separation also makes it easy to break individual services
off on to other machines if they become a bottleneck and need a more
distributed setup.

Since this was initially done on a development machine I also created a bridge
to act as a virtual ethernet adapter that was only available locally named
`br-mgmt` which also hosts all of the service's. The address range chosen for
this development test was `10.100.0.0/24` as it generally doesn't interfere
with any networks I normally encounter.

The main bridge was setup using the following configuration file which was
written to `/etc/sysconfig/network-scripts/ifcfg-br-mgmt`.

```
NM_CONTROLLED=no
ONBOOT=yes
TYPE=Bridge
BOOTPROTO=static

IPADDR=10.100.0.10
NETMASK=255.255.255.0
NETWORK=10.100.0.0
BROADCAST=10.100.0.255

IPV6INIT=yes
IPV6_PRIVACY=rfc3041

NAME=ManagementNet
```

Subsequent IP addresses were added to the bridge by creating files at
`/etc/sysconfig/network-scripts/ifcfg-br-mgmt:{id}` replacing {id} with 1
through 9 with the following contents:

```
DEVICE={Interface Name}
NM_CONTROLLED=no
ONBOOT=yes
BOOTPROTO=static

IPADDR={IP Address}
NETMASK=255.255.255.0

IPV6INIT=yes
IPV6_PRIVACY=rfc3041

NAME={Service}
```

The following table show the address allocations I used, and what I intend the
address be used for:

| Interface Name | IP Address  | Service           |
| -------------- | ----------- | ----------------- |
| br-mgmt:1      | 10.100.0.11 | MySQLd            |
| br-mgmt:2      | 10.100.0.12 | Qpidd             |
| br-mgmt:3      | 10.100.0.13 | Keystone/Identity |
| br-mgmt:4      | 10.100.0.14 | Memcached         |
| br-mgmt:5      | 10.100.0.15 | Nova/Compute      |
| br-mgmt:6      | 10.100.0.16 | Cinder/Volume     |
| br-mgmt:7      | 10.100.0.17 | Glance/Image      |
| br-mgmt:8      | 10.100.0.18 | EC2               |
| br-mgmt:9      | 10.100.0.19 | Quantum/Network   |

### Service Pre-Requisites

When configuring the following service be sure to bind them to the address
listed in the table above in the Service/Management network section.

* Install [Mysql Server][1]
* Install [Qpid Message Broker][2]
* Install [Chrony NTP Server][3]
* Install [Memcache][4]

### Keystone/Identity

Keystone is the OpenStack Identity service and it's configuration is documented
on [it's wiki page][5].

### Glance/Image Service

Glance is the OpenStack Image service and it's configuration is documented on
[it's wiki page][6]

### Horizon/Dashboard

Notes for when I get to this:

I should make use of the Cached Database session backend:

* http://docs.openstack.org/trunk/openstack-compute/install/apt/content/dashboard-session-cached-database.html

It will need to have memcache configured as if it was going to be the session
storage:

* http://docs.openstack.org/trunk/openstack-compute/install/apt/content/dashboard-session-memcache.html

Additional notes:

* http://docs.openstack.org/trunk/openstack-object-storage/admin/content/memcached-considerations.html
* http://www.cybera.ca/tech-radar/using-memcached-openstack-nova

[1]: ../mysql/
[2]: ../qpid/
[3]: ../chronyd/
[4]: ../memcached/
[5]: ../openstack_keystone/
[6]: ../openstack_glance/

