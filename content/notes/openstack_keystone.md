---
title: Openstack Keystone
---

## Installation/Configuration

Install the required packages with the following command:

```
yum install openstack-utils openstack-keystone python-keystoneclient -y
```

Generate a long, strong unique password for keystone's [MySQL][1] user (MySQL
should already be setup at this point and bound to `10.100.0.11` if you're
following along from the [Openstack][2] page. Open up a MySQL console as the
root user and run the following commands:

Important Note: Openstack has a convenient command `openstack-db` that does the
following for you, however, when it creates the user it uses `keystone` for a
password and doesn't restrict the hosts that can use that account (globally
available). It seems a bit excessive to me to have a script for those three
MySQL commands:

```
CREATE DATABASE keystone;
GRANT ALL ON keystone.* TO 'keystone'@'10.100.0.%' IDENTIFIED BY
  'LongStrongUniquePasswordYouGenerated';
FLUSH PRIVILEGES;
```

Generate a token to be used as the 'admin' global token. When used this will
give you full admin credentials on the keystone service regardless of whether
or not an admin exists.

This is needed for the initial administration of the keystone service once we
get it up and running. I save it directly to the root user's bashrc file as it
it'll be useful to have later on:

```
echo export ADMIN_TOKEN=$(openssl rand -hex 32) > /root/.bashrc
```

After logging off and back on make sure you have the token and copy this for
use in the configuration file later on:

```
echo $ADMIN_TOKEN
f35fb1205820907c2ddd1eb046f6ba2de1e5b729d6b7aedc5b0959156013f4a3
```

Open up the keystone configuration file at: `/etc/keystone/keystone.conf` and
replace it with the following (changing appropriate variables for your
installation such as `admin_token` and the MySQL password:

```ini
[DEFAULT]
onready = keystone.common.systemd
admin_port = 35357
admin_token = ADMIN
bind_host = 0.0.0.0
compute_port = 8774
public_port = 5000

# Logging Options
debug = False
syslog_log_facility = LOG_USER
use_syslog = True
verbose = False

[sql]
connection = mysql://keystone:keystone@127.0.0.1/keystone
idle_timeout = 200

[identity]
driver = keystone.identity.backends.sql.Identity

[catalog]
driver = keystone.catalog.backends.sql.Catalog
template_file = /etc/keystone/default_catalog.templates

[token]
driver = keystone.token.backends.sql.Token
expiration = 7200

[policy]
driver = keystone.policy.backends.rules.Policy

[ec2]
driver = keystone.contrib.ec2.backends.sql.Ec2

[ssl]
#enable = True
#certfile = /etc/keystone/ssl/certs/keystone.pem
#keyfile = /etc/keystone/ssl/private/keystonekey.pem
#ca_certs = /etc/keystone/ssl/certs/ca.pem
#cert_required = True

[signing]
certfile = /etc/keystone/ssl/certs/signing_cert.pem
ca_certs = /etc/keystone/ssl/certs/ca.pem
ca_password = SuperSecretCAPass
keyfile = /etc/keystone/ssl/private/signing_key.pem
key_size = 4096
valid_days = 3650
token_format = PKI

[ldap]
# url = ldap://localhost
# user = dc=Manager,dc=example,dc=com
# password = None
# suffix = cn=example,cn=com
# use_dumb_member = False

# user_tree_dn = ou=Users,dc=example,dc=com
# user_objectclass = inetOrgPerson
# user_id_attribute = cn
# user_name_attribute = sn

# tenant_tree_dn = ou=Groups,dc=example,dc=com
# tenant_objectclass = groupOfNames
# tenant_id_attribute = cn
# tenant_member_attribute = member
# tenant_name_attribute = ou

# role_tree_dn = ou=Roles,dc=example,dc=com
# role_objectclass = organizationalRole
# role_id_attribute = cn
# role_member_attribute = roleOccupant

[filter:debug]
paste.filter_factory = keystone.common.wsgi:Debug.factory

[filter:token_auth]
paste.filter_factory = keystone.middleware:TokenAuthMiddleware.factory

[filter:admin_token_auth]
paste.filter_factory = keystone.middleware:AdminTokenAuthMiddleware.factory

[filter:xml_body]
paste.filter_factory = keystone.middleware:XmlBodyMiddleware.factory

[filter:json_body]
paste.filter_factory = keystone.middleware:JsonBodyMiddleware.factory

[filter:user_crud_extension]
paste.filter_factory = keystone.contrib.user_crud:CrudExtension.factory

[filter:crud_extension]
paste.filter_factory = keystone.contrib.admin_crud:CrudExtension.factory

[filter:ec2_extension]
paste.filter_factory = keystone.contrib.ec2:Ec2Extension.factory

[filter:s3_extension]
paste.filter_factory = keystone.contrib.s3:S3Extension.factory

[filter:url_normalize]
paste.filter_factory = keystone.middleware:NormalizingFilter.factory

[filter:stats_monitoring]
paste.filter_factory = keystone.contrib.stats:StatsMiddleware.factory

[filter:stats_reporting]
paste.filter_factory = keystone.contrib.stats:StatsExtension.factory

[app:public_service]
paste.app_factory = keystone.service:public_app_factory

[app:admin_service]
paste.app_factory = keystone.service:admin_app_factory

[pipeline:public_api]
pipeline = stats_monitoring url_normalize token_auth admin_token_auth xml_body json_body debug ec2_extension user_crud_extension public_service

[pipeline:admin_api]
pipeline = stats_monitoring url_normalize token_auth admin_token_auth xml_body json_body debug stats_reporting ec2_extension s3_extension crud_extension admin_service

[app:public_version_service]
paste.app_factory = keystone.service:public_version_app_factory

[app:admin_version_service]
paste.app_factory = keystone.service:admin_version_app_factory

[pipeline:public_version_api]
pipeline = stats_monitoring url_normalize xml_body public_version_service

[pipeline:admin_version_api]
pipeline = stats_monitoring url_normalize xml_body admin_version_service

[composite:main]
use = egg:Paste#urlmap
/v2.0 = public_api
/ = public_version_api

[composite:admin]
use = egg:Paste#urlmap
/v2.0 = admin_api
/ = admin_version_api
```

Please note that I haven't yet delved into the Compositions, Filters, Apps or
Pipelines and don't have a handle on what exactly they're doing. As far as
configuration documentation goes there is much to be desired in Keystone...

We need to create a full [certificate authority][3] in
`/etc/keystone/ssl/certs`. Ideally the CA itself would be signed by a higher CA
of our control. A keystone SSL cert and key will also need to be created (and
signed by the CA).

The cert and key file should be placed at
`/etc/keystone/ssl/certs/signing_cert.pem` and
`/etc/keystone/ssl/private/signing_key.pem` respectively. You'll also want to
ensure the `[signing]` portion of the `keystone.conf` file reflects the actual
size of the key.

```
keystone-manage db_sync
```

Now that we're configured let's get the service going...

```
systemctl enable openstack-keystone.service
systemctl start openstack-keystone.service
```

You should now have a running (though empty) keystone service. Let's test and
make sure it's responding nicely:

```
keystone --token $ADMIN_TOKEN --endpoint http://10.100.0.13:35357/v2.0/ tenant-list
```

## Initial Setup

Now that we have the service up and running we need to add users, roles,
tenants, services and endpoints. A quick note on a couple of things here.
'Tenant' is used as a means of logically grouping a bunch of users. A user can
exist in multiple tenants and will only be aware of the resources within
tenants that it has been granted access too unless that user is an admin of the
special admin tenant which will automatically grant them full access to all
tenants and their contents regardless of whether that user is in that tenant
and as such care should be taken when granting that level of permissions.

First since we'll be running a lot of commands and it can quickly become
burdensome to repeatedly provide the endpoint and the token we're going to set
two environment variables to make the access easier, then test to make sure we
can still access the service:

```
export SERVICE_ENDPOINT=http://10.100.0.13:35357/v2.0/
export SERVICE_TOKEN=$ADMIN_TOKEN
keystone tenant-list
```

There is another slightly annoying thing that can be easily worked around in
Openstack; Whenever you refer to a user, role, tenant, service, endpoint or
other object you need to do so by it's ID and not it's friendly name. As such
I've adapted a few helper methods to easily grab an object ID based on it's
friendly name. Add these too root's bash file and re-source it by either
logging out and back in or by running ". ~/.bashrc".

We now need to create an admin user, role, tenant, and combine them all:

```
keystone user-create --name admin --pass secret --email admin@email.net
+----------+-------------------------------------------------------------------------------------------------------------------------+
| Property |                                                          Value                                                          |
+----------+-------------------------------------------------------------------------------------------------------------------------+
|  email   |                                                     sam@stelfox.net                                                     |
| enabled  |                                                           True                                                          |
|    id    |                                             2e981959c1d54789a3ae6a88611cc0db                                            |
|   name   |                                                          admin                                                          |
| password | $6$rounds=40000$ZXGfdZeIcwVWGWvA$VLgWIRk7tM5OdEjeYZEnpANbjVO0SydvXZgK7UAlh0VED4S1dbCMWYxFNWgz4p.7Ni6Nmzw3FUtLx6MLYVEm21 |
| tenantId |                                                                                                                         |
+----------+-------------------------------------------------------------------------------------------------------------------------+
keystone role-create --name admin
+----------+----------------------------------+
| Property |              Value               |
+----------+----------------------------------+
|    id    | df6b8c5b5a0847259e1c78a34aae09d1 |
|   name   |              admin               |
+----------+----------------------------------+
keystone tenant-create --name admin
+-------------+----------------------------------+
|   Property  |              Value               |
+-------------+----------------------------------+
| description |                                  |
|   enabled   |               True               |
|      id     | adb579d87cc7438da8ddb6147ca69717 |
|     name    |              admin               |
+-------------+----------------------------------+
keystone user-role-add --user-id 2e981959c1d54789a3ae6a88611cc0db --role-id df6b8c5b5a0847259e1c78a34aae09d1 --tenant-id adb579d87cc7438da8ddb6147ca69717
```

## Potentially Old Information

```
get_tenant_id() {
  echo `keystone tenant-list | grep $@ | awk '{ print $2 }'`
}

get_user_id() {
  echo `keystone user-list | grep $@ | awk '{ print $2 }'`
}

get_role_id() {
  echo `keystone role-list | grep $@ | awk '{ print $2 }'`
}

get_service_id() {
  echo `keystone service-list | grep $@ | awk '{ print $2 }'`
}
```

### Tenant Creation

```
keystone tenant-create --name=admin
keystone tenant-create --name=service
```

### Role Creation

```
keystone role-create --name admin
keystone role-create --name KeystoneAdmin
keystone role-create --name KeystoneServiceAdmin
keystone role-create --name Member
```

### User Creation

Generate a five long strong unique passwords for the admin user and each of the
four service accounts here. For this example I'm going to use password{1-5}. If
you use the same ones... you probably shouldn't be playing at this level... You
will need these later when setting up each of the services so note them down
somewhere secure.

```
keystone user-create --name=admin --pass=password1 --email=admin@your-admin.cn
keystone user-create --name=nova --pass=password2 --tenant_id $(get_tenant_id service)
keystone user-create --name=glance --pass=password3 --tenant_id $(get_tenant_id service)
keystone user-create --name=quantum --pass=password4 --tenant_id $(get_tenant_id service)
keystone user-create --name=cinder --pass=password5 --tenant_id $(get_tenant_id service)
```

### Granting Roles

Grant the admin user the `admin`, `KeystoneAdmin`, and `KeystoneServiceAdmin`
roles within the admin tenant and the service accounts the admin role within
the service tenant.

```
keystone user-role-add --user $(get_user_id admin) --role $(get_role_id admin) --tenant_id $(get_tenant_id admin)
keystone user-role-add --user $(get_user_id admin) --role $(get_role_id KeystoneAdmin) --tenant_id $(get_tenant_id admin)
keystone user-role-add --user $(get_user_id admin) --role $(get_role_id KeystoneServiceAdmin) --tenant_id $(get_tenant_id admin)

keystone user-role-add --tenant_id $(get_tenant_id service) --user $(get_user_id nova) --role $(get_role_id admin)
keystone user-role-add --tenant_id $(get_tenant_id service) --user $(get_user_id glance) --role $(get_role_id admin)
keystone user-role-add --tenant_id $(get_tenant_id service) --user $(get_user_id quantum) --role $(get_role_id admin)
keystone user-role-add --tenant_id $(get_tenant_id service) --user $(get_user_id cinder) --role $(get_role_id admin)
```

### Service Creation

```
keystone service-create --name nova --type compute --description 'OpenStack Compute Service'
keystone service-create --name cinder --type volume --description 'OpenStack Volume Service'
keystone service-create --name glance --type image --description 'OpenStack Image Service'
keystone service-create --name keystone --type identity --description 'OpenStack Identity'
keystone service-create --name ec2 --type ec2 --description 'OpenStack EC2 service'
keystone service-create --name quantum --type network --description 'OpenStack Networking service'
```

### Endpoint Creation

End points are the next thing to be defined, they require that a region be
specified. This is an arbitrary string that can be used to delinieate between
service regions that could be data centers, portions of a data-center or what
have you.

Since I'm not working on an installation large enough to really need multiple
regions this name is more or less useless for me so I chose to just use Primary
as the region name.

```
keystone endpoint-create --region Primary --service_id $(get_service_id compute) \
  --publicurl 'http://10.100.0.15:8774/v2/$(tenant_id)s' \
  --adminurl 'http://10.100.0.15:8774/v2/$(tenant_id)s' \
  --internalurl 'http://10.100.0.15:8774/v2/$(tenant_id)s'

keystone endpoint-create --region Primary --service_id $(get_service_id volume) \
  --publicurl 'http://10.100.0.16:8776/v1/$(tenant_id)s' \
  --adminurl 'http://10.100.0.16:8776/v1/$(tenant_id)s' \
  --internalurl 'http://10.100.0.16:8776/v1/$(tenant_id)s'

keystone endpoint-create --region Primary --service_id $(get_service_id image) \
  --publicurl 'http://10.100.0.17:9292/v2' \
  --adminurl 'http://10.100.0.17:9292/v2' \
  --internalurl 'http://10.100.0.17:9292/v2'

keystone endpoint-create --region Primary --service_id $(get_service_id identity) \
  --publicurl 'http://10.100.0.13:5000/v2.0' \
  --adminurl 'http://10.100.0.13:35357/v2.0' \
  --internalurl 'http://10.100.0.13:5000/v2.0'

keystone endpoint-create --region Primary --service_id $(get_service_id ec2) \
  --publicurl 'http://10.100.0.18:8773/services/Cloud' \
  --adminurl 'http://10.100.0.18:8773/services/Admin' \
  --internalurl 'http://10.100.0.18:8773/services/Cloud'

keystone endpoint-create --region Primary --service_id $(get_service_id network) \
  --publicurl 'http://10.100.0.19:9696/' \
  --adminurl 'http://10.100.0.19:9696/' \
  --internalurl 'http://10.100.0.19:9696/'
```

### Keystone Management

With keystone setup, the admin user in place, and endpoints defined you no
longer need to use the admin token to authenticate and manage the service. As a
regular user export the following information into your bash shell, unset the
admin token and try to access the keystone user-list again:

```
export OS_TENANT_NAME=admin
export OS_USERNAME=admin
export OS_PASSWORD=password1
export OS_AUTH_URL=http://10.100.0.13:5000/v2.0/
unset ADMIN_TOKEN
keystone tenant-list
+----------------------------------+---------+---------+
|                id                |   name  | enabled |
+----------------------------------+---------+---------+
| bb9509fd9dea40f5b58d720aaaa15044 | service | True    |
| cbabea52a4be417998b266e43280ef35 | admin   | True    |
+----------------------------------+---------+---------+
```

You can also specify those options via the command line if you don't want to
set the  environment variables like so:

```
keystone --os_username admin --os_password password1 --os_tenant_name admin \
  --os_auth_url http://10.100.0.13:5000/v2.0/ tenant-list
+----------------------------------+---------+---------+
|                id                |   name  | enabled |
+----------------------------------+---------+---------+
| bb9509fd9dea40f5b58d720aaaa15044 | service | True    |
| cbabea52a4be417998b266e43280ef35 | admin   | True    |
+----------------------------------+---------+---------+
```

## Future Steps

There are some features that I'd really like to take a look at getting as I
feel they will improve the quality, security or reliability of the service in
general. These features that I haven't documented here yet are as follows:

* LDAP Authentication Backend
  * With Memcached queries
* SSL
* Detailed policy.json evaluation
  * Breaking out permissions into more explicit roles
  * What can I actually accomplish with this file?

[1]: {{< relref "notes/mysql.md" >}}
[2]: {{< relref "notes/openstack.md" >}}
[3]: {{< relref "notes/certificate_authority.md" >}}
