---
title: OpenStack Glance
---

## Installation/Configuration

Install the required packages with the following command:

```
yum install openstack-utils openstack-glance python-glanceclient -y
```

Generate a long, strong unique password for glance's [[Linux/Mysqld|MySQL]]
user (MySQL should already be setup at this point and bound to 10.100.0.11 if
you're following along from the [[Linux/Openstack|Openstack]] page. Open up a
MySQL console as the root user and run the following commands:

```
CREATE DATABASE glance;
GRANT ALL ON glance.* TO 'glance'@'10.100.0.%' IDENTIFIED BY 'LongStrongUniquePasswordYouGenerated';
FLUSH PRIVILEGES;
```

