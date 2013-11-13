---
title: 389 Directory Server
---

The 389 Directory Server is an LDAP server and thus the central hub for all
user and group information on a network. This can also be used by
[Asterisk](asterisk) for routing calls and voicemails to users.

http://docs.redhat.com/docs/en-US/Red_Hat_Directory_Server/

## Service Prerequisites

* [Bind](bind) - This is optional if host files are used to store the FQDN of
   the server on the server and it's clients.
* [Certificate Authority](certificate_authority) - This is optional if the
   directory is not intended to be part of a PKI system. It can be added to the
   PKI system, though this may have ramifications for clients.

## Security Notes

### Firewall Adjustments

389 Directory Server has three main ports that should have different levels of
protection. 389 is unencrypted authentication/querying and should only be
allowed on the local network. 636 is LDAP over SSL and can be exposed a bit
more loosely though I would try and limit it as much as possible. 9830 is the
administration port and should be limited to only those machines that will be
used to administrate the directory server. Account management can be done over
389 and 636 using additional tools such as
[http://directory.apache.org/studio/index.html Apache Directory Studio].

## Setup Log

### Initial Installation

While the minimum amount of RAM is suggested to be 256Mb, the server itself
needs more as that is 256Mb for the process itself. The kernel and minimum
services in Fedora 15 consume about 19Mb of RAM. This would still fully consume
the RAM. 384Mb is my personal recommendation for a minimum amount of RAM.

It is no longer recommended to create an additional user as it breaks selinux
rules. The following line SHOULD NOT BE RUN but is left here for future
documentation purposes.

```sh
[root@localhost ~]# useradd -d /etc/dirsrv/ -M -r -s /sbin/nologin -u 389 directory
[root@localhost ~]# setenforce 0
```

Install the packages, set some kernel limits and adjust sysctl variables before
running the setup.

```sh
[root@localhost ~]# yum install 389-ds-base 389-ds-console 389-admin 389-admin-console -y
[root@localhost ~]# echo "*               soft    nofile          8192" >> /etc/security/limits.conf
[root@localhost ~]# echo "*               hard    nofile          8192" >> /etc/security/limits.conf
[root@localhost ~]# echo "net.ipv4.tcp_keepalive_time = 60" >> /etc/sysctl.conf
[root@localhost ~]# setup-ds-admin.pl
```

This will run through a semi-automated setup wizard. The log below is from when
I setup the directory server for the Gentlemens Lounge. Note that the passwords
are not shown.

```
==============================================================================
This program will set up the 389 Directory and Administration Servers.

It is recommended that you have "root" privilege to set up the software.
Tips for using this program:
  - Press "Enter" to choose the default and go to the next screen
  - Type "Control-B" then "Enter" to go back to the previous screen
  - Type "Control-C" to cancel the setup program

Would you like to continue with set up? [yes]: 

==============================================================================
BY SETTING UP AND USING THIS SOFTWARE YOU ARE CONSENTING TO BE BOUND BY
AND ARE BECOMING A PARTY TO THE AGREEMENT FOUND IN THE
LICENSE.TXT FILE. IF YOU DO NOT AGREE TO ALL OF THE TERMS
OF THIS AGREEMENT, PLEASE DO NOT SET UP OR USE THIS SOFTWARE.

Do you agree to the license terms? [no]: yes

==============================================================================
Your system has been scanned for potential problems, missing patches,
etc.  The following output is a report of the items found that need to
be addressed before running this software in a production
environment.

389 Directory Server system tuning analysis version 10-AUGUST-2007.

NOTICE : System is x86_64-unknown-linux2.6.38.8-32.fc15.x86_64 (1 processor).

WARNING: 365MB of physical memory is available on the system. 1024MB is recommended for best performance on large production system.

WARNING  : The warning messages above should be reviewed before proceeding.

Would you like to continue? [no]: yes

==============================================================================
Choose a setup type:

   1. Express
       Allows you to quickly set up the servers using the most
       common options and pre-defined defaults. Useful for quick
       evaluation of the products.

   2. Typical
       Allows you to specify common defaults and options.

   3. Custom
       Allows you to specify more advanced options. This is 
       recommended for experienced server administrators only.

To accept the default shown in brackets, press the Enter key.

Choose a setup type [2]: 

==============================================================================
Enter the fully qualified domain name of the computer
on which you're setting up server software. Using the form
<hostname>.<domainname>
Example: eros.example.com.

To accept the default shown in brackets, press the Enter key.

Warning: This step may take a few minutes if your DNS servers
can not be reached or if DNS is not configured correctly.  If
you would rather not wait, hit Ctrl-C and run this program again
with the following command line option to specify the hostname:

    General.FullMachineName=your.hostname.domain.name

Computer name [directory.example.org]: 

WARNING: There are problems with the hostname.
Hostname 'directory.example.org' is valid, but none of the IP addresses
resolve back to directory.example.org
- address 192.168.2.10 resolves to host nameserver.example.org

Please check the spelling of the hostname and/or your network configuration.
If you proceed with this hostname, you may encounter problems.

Do you want to proceed with hostname 'directory.example.org'? [no]: yes

==============================================================================
The servers must run as a specific user in a specific group.
It is strongly recommended that this user should have no privileges
on the computer (i.e. a non-root user).  The setup procedure
will give this user/group some permissions in specific paths/files
to perform server-specific operations.

If you have not yet created a user and group for the servers,
create this user and group using your native operating
system utilities.

System User [nobody]: 
System Group [nobody]: 

==============================================================================
Server information is stored in the configuration directory server.
This information is used by the console and administration server to
configure and manage your servers.  If you have already set up a
configuration directory server, you should register any servers you
set up or create with the configuration server.  To do so, the
following information about the configuration server is required: the
fully qualified host name of the form
<hostname>.<domainname>(e.g. hostname.example.com), the port number
(default 389), the suffix, the DN and password of a user having
permission to write the configuration information, usually the
configuration directory administrator, and if you are using security
(TLS/SSL).  If you are using TLS/SSL, specify the TLS/SSL (LDAPS) port
number (default 636) instead of the regular LDAP port number, and
provide the CA certificate (in PEM/ASCII format).

If you do not yet have a configuration directory server, enter 'No' to
be prompted to set up one.

Do you want to register this software with an existing
configuration directory server? [no]: 

==============================================================================
Please enter the administrator ID for the configuration directory
server.  This is the ID typically used to log in to the console.  You
will also be prompted for the password.

Configuration directory server
administrator ID [admin]: 
Password: 
Password (confirm): 

==============================================================================
The information stored in the configuration directory server can be
separated into different Administration Domains.  If you are managing
multiple software releases at the same time, or managing information
about multiple domains, you may use the Administration Domain to keep
them separate.

If you are not using administrative domains, press Enter to select the
default.  Otherwise, enter some descriptive, unique name for the
administration domain, such as the name of the organization
responsible for managing the domain.

Administration Domain [example.org]: example.org

==============================================================================
The standard directory server network port number is 389.  However, if
you are not logged as the superuser, or port 389 is in use, the
default value will be a random unused port number greater than 1024.
If you want to use port 389, make sure that you are logged in as the
superuser, that port 389 is not in use.

Directory server network port [389]: 

==============================================================================
Each instance of a directory server requires a unique identifier.
This identifier is used to name the various
instance specific files and directories in the file system,
as well as for other uses as a server instance identifier.

Directory server identifier [directory]: 

==============================================================================
The suffix is the root of your directory tree.  The suffix must be a valid DN.
It is recommended that you use the dc=domaincomponent suffix convention.
For example, if your domain is example.com,
you should use dc=example,dc=com for your suffix.
Setup will create this initial suffix for you,
but you may have more than one suffix.
Use the directory server utilities to create additional suffixes.

Suffix [dc=example, dc=org]: 

==============================================================================
Certain directory server operations require an administrative user.
This user is referred to as the Directory Manager and typically has a
bind Distinguished Name (DN) of cn=Directory Manager.
You will also be prompted for the password for this user.  The password must
be at least 8 characters long, and contain no spaces.
Press Control-B or type the word "back", then Enter to back up and start over.

Directory Manager DN [cn=Directory Manager]: 
Password: 
Password (confirm): 

==============================================================================
The Administration Server is separate from any of your web or application
servers since it listens to a different port and access to it is
restricted.

Pick a port number between 1024 and 65535 to run your Administration
Server on. You should NOT use a port number which you plan to
run a web or application server on, rather, select a number which you
will remember and which will not be used for anything else.

Administration port [9830]: 

==============================================================================
The interactive phase is complete.  The script will now set up your
servers.  Enter No or go Back if you want to change something.

Are you ready to set up your servers? [yes]: 
Creating directory server . . .
Your new DS instance 'directory' was successfully created.
Creating the configuration directory server . . .
Beginning Admin Server creation . . .
Creating Admin Server files and directories . . .
Updating adm.conf . . .
Updating admpw . . .
Registering admin server with the configuration directory server . . .
Updating adm.conf with information from configuration directory server . . .
Updating the configuration for the httpd engine . . .
Starting admin server . . .
The admin server was successfully started.
Admin server was successfully created, configured, and started.
Exiting . . .
Log file is '/tmp/setup6kj9Az.log'
```

## Directory Configuration

The installation setup starts the directory and administration processes
automatically, however they will not come on automatically yet. Make sure they
get turned on during boot with the following commands:

```sh
[root@localhost ~]# chkconfig dirsrv on
[root@localhost ~]# chkconfig dirsrv-admin on
```

There is one more process dirsrv-snmp however I don't have use for that until
the directory is actually up and operating.

After opening up the console and logging in the directory administrator
account, our first task is to clean up some automatically added groups that we
won't need or ever use. Switch to the Users and Groups tab and use '*' as the
search term. Delete the groups "Accounting Managers", "HR Managers", "QA
Managers", and "PD Managers".

Rename the OU "People" to "Users", this is a more appropriate name for what
we're going to use it for, though we may find this causes us trouble in the
future.

Create an OU under "Users" named "Guests", for a description I put "Users that
only need limited access to resources for a short time". This OU will be
dedicated for any accounts that may not need to be around for very long and
will make it easier to clean them up in the future.

Create an OU under "Users" named "Service Accounts" with a description of
"Non-person accounts for services that need access to the directory or
directory protected services". Separating out these users will make it easier
to restrict them from certain tasks and apply unique password and account
restrictions to them (such as no password expiration and minimum password
length of 32).

Create an OU under "Users" named "People" with a description of "Normal
permanent users of the system".

### Directory Server Console

In the 389 Management Console expand the tree [domain]->[server]->Server Group
and double click on the Directory Server. This will open up the Directory
Server Console (389-ds-console).

Open up the configuration tab and turn on the following plugins:

* MemberOf Plugin

To setup a global password policy choose the Configuration tab in the Console
and click on "Data".

* Passwords Tab
  * Enable fine-grained password policy - Enabled
  * User may change password
  * Keep password history - Remember 3
  * Password never expires - Enabled
  * Check password syntax - Enabled
    * Password minimum length - 8
    * Minimum required character categories - 3
    * Minimum token length - 3
  * Password encryption: Salted Secure Hashing Algorithm (SSHA512)
* Account Lockout
  * Accounts may be locked out
  * Lockout account after 3 login failures
  * Reset failure count after 20 minutes
  * Lockout duration 60 minutes

While we're in there expand logs and click on "Access Log". Set the maximum
number of logs to 14. Set the new log creation to happen every night at
midnight. Under the Deletion Policy change "When total log size exceeds" to
150MB, set "When free disk space is less than" to 100MB and "When a file is
older than" to 2 weeks.

Under "Error Log". Set the Maximum number of logs to 4. Set the new log
creation to happen once a week at midnight. Under the Deletion Policy set "When
total log size exceeds" to 150MB, the "When free disk space is less than" to
100MB and "When a file is older than" to 4 weeks. Under Log Level turn on the
following:

* Search filter processing
* Config file processing
* Replication
* Plug-ins
* Access control summary

In "Audit Log" enable logging set the maximum number of logs to 31 and to
create a new log every night at midnight.

We need a slightly different password scheme for our Service and Guest
accounts. Switch to the Directory tab and expand the tree [server]->[base
domain]->Users. Right click on [base domain] and choose "Manage Password
Policy"->"For subtree". Set the following on the Guests OU with the following
settings:

* Passwords Tab
  * Create subtree level password policy
  * Password expires after 14 days
  * Check Password Syntax
    * Password minimum length - 8
    * Minimum required character categories - 3
    * Minimum token length - 3
  * Password encryption: Salted Secure Hashing Algorithm (SSHA512)
* Account Lockout
  * Lockout account after 3 login failures
  * Reset failure count after 20 minutes
  * Lockout forever

And for the Services OU:

* Create subtree level password policy
* Check password syntax
  * Password minimum length - 32
  * Minimum required character categories - 3
  * Minimum token length - 3
* Password encryption: Salted Secure Hashing Algorithm (SSHA512)

### Config Files

## Administration

You will need to install the package "389-console" via yum to administer the
server.

If trying to use 389-console via SSH tunnel in addition to forwarding port 9830
to the directory server, either port 389 (possibly 636 if SSL is enabled) needs
to be directly accessible via the FQDN that the server was setup with OR you
need to also forward the port of SSH and set the FQDN in the local host file as
it establishes the connection independently. Since port 389 is a privileged
port, to do the latter you NEED to create the SSH tunnel from the root account.

## Utilities

```sh
ldapsearch -x -b '{Search Path (OU)}' -s sub -h {Host} -D {Username} -W '{Filter}'
```

