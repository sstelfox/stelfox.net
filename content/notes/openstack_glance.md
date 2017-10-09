---
title: OpenStack Glance
---

***Note: This page is quite old and is likely out of date. My opinions may have
also changed dramatically since this was written. It is here as a reference
until I get around to updating it.***

## Installation/Configuration

Install the required packages with the following command:

```
yum install openstack-utils openstack-glance python-glanceclient -y
```

Generate a long, strong unique password for glance's [MySQL][1] user (MySQL
should already be setup at this point and bound to `10.100.0.11` if you're
following along from the [Openstack][2] page. Open up a MySQL console as the
root user and run the following commands:

```
CREATE DATABASE glance;
GRANT ALL ON glance.* TO 'glance'@'10.100.0.%' IDENTIFIED BY 'LongStrongUniquePasswordYouGenerated';
FLUSH PRIVILEGES;
```

[1]: {{< relref "notes/mysql.md" >}}
[2]: {{< relref "notes/openstack.md" >}}
