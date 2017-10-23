---
title: libvirtd
---

***Note: This page is quite old and is likely out of date. My opinions may have
also changed dramatically since this was written. It is here as a reference
until I get around to updating it.***

libvirt is an open source API and management tool for managing platform
virtualization. It is used to manage Linux KVM and Xen virtual machines through
graphical interfaces such as Virtual Machine Manager and higher level tools
such as oVirt. In this case the backend is KVM.

## Security Notes

Since libvirtd distributes resources to guest machines a tight control needs to
be placed on the guests to prevent the host from becoming unmanageable. Luckily
through the use of CGroups this can be accomplished.

Networking is a tricky topic as there are several ways to do this in libvirtd.
My personal choice is to make the host completely transparent in regards to the
networking and that is bridge mode. There is also routed and NAT either way
exposes the host's IP.

Routed mode also requires additional configuration in the network hardware or
on the client machines and NAT requires port forwarding within the host
machine. I will not cover either of these in this wiki.

Privilege separation is very important. In the event that a guest gets
compromised and the attacker finds a way to break the virtualization's jail,
they should not immediately gain root privileges.

Luckily this is already covered by default (at least with Fedora 12 installs)
in which libvirt will drop it's privileges to the qemu user for every guest
that it spawns. Each guest is also automatically given it's own SELinux label.
This will further isolate each guest.

## Firewall Adjustments

Regardless of the type of network that is chosen for guests all of their
traffic goes through the forwarding chain of iptables. While I really strongly
advocate against any default allow policies on anything, this is one place
where I personally am willing to make an exception. To allow guests to talk to
the network make the following change to the default [IPTables][1] rules:

```
:FORWARD DROP [0:0]
--- Replace with ---
:FORWARD ACCEPT [0:0]
```

## CGroup Configuration

At a high level, CGroups are a generic mechanism the kernel provides for
grouping of processes and applying controls to those groups. Tunables within a
cgroup are provided by what the kernel calls 'controllers', with each
controller able to expose one or more tunable or control.

When mounting the cgroups filesystem it is possible to indicate what
controllers are to be activated. This makes it possible to mount the filesystem
several times, with each mount point having a different set of
(non-overlapping) controllers.

The provided controllers are:

* memory: Memory controller - Allows for setting limits on RAM and swap usage
  and querying cumulative usage of all processes in the group
* cpuset: CPU set controller - Binding of processes within a group to a set of
  CPUs and controlling migration between CPus
* cpuacct: CPU accounting controller - Information about CPU usage for a group
  of processes
* cpu: CPU schedular controller - Controlling the priorization of processes in
  the group. Think of it as a more advanced nice level
* devices: Devices controller - Access control lists on character and block
  devices
* freezer: Freezer controller - Pause and resume execution of processes in the
  group. Think of it as SIGSTOP for the whole group
* net_cls: Network class controller - Control network utilization by associating
  processes with a ‘tc’ network class 

Under KVM all of these are not supported, however cpu, devices and memory are.
Which are in my humble opinion the most important for our task. 

http://berrange.com/posts/2009/12/03/using-cgroups-with-libvirt-and-lxckvm-guests-in-fedora-12/

## Initial Setup

Before creating your first guest there are a few things that I like to do.
These include setting up additional storage pools and configuring networking.
This section covers anything that hasn't been done in the config files and I'll
save the majority of the networking information for it's own section as most of
it is done outside of the virtualization console.

Since I use bridge networking and that is the only way I want my guests to talk
to each other and the rest of the world, I want to get rid of the default
network which performs NAT'ing so that the VMs don't suddenly get a second
network interface that I don't know about.

To do this I'll want to drop into a virsh shell and issue a few commands. You
can see an entire session of me removing the default network here:

```
[root@localhost ~]# virsh
Welcome to virsh, the virtualization interactive terminal.

Type:  'help' for help with commands
       'quit' to quit

virsh # net-destroy default
Network default destroyed

virsh # net-undefine default
Network default has been undefined
```

Now that our networking problem is taken care of, on to additional storage
pools. By default one storage pool (a directory) exists. This can be found at
"/var/lib/libvirt/images". There is nothing wrong with just using the default
for disk images. The only reason I keep a second for disk images is that I like
to keep all of my VMs on an encrypted partition all to themselves.

Since I need one of my VMs at boot and won't be able to remotely provide a key
until after that VM has booted it needs to be on an unencrypted partition which
I still use the default for.

The rest of the VMs will live in a storage pool named "secure" mounted at
"/var/lib/libvirt/images/secure". I'm using the the subdirectory of
"/var/lib/libvirt/images" so that I won't have to add additional SELinux
policies which is potentially very messy and could present additional security
risks.

First we need to create an XML file to define the storage pool. Create the
following in a file named "secure.xml":

```xml
<pool type='dir'>
  <name>secure</name>
  <target>
    <path>/var/lib/libvirt/images/secure</path>
    <permissions>
      <mode>0700</mode>
      <owner>0</owner>
      <group>0</group>
    </permissions>
  </target>
</pool>
```

Next you need to tell libvirt about the pool. You can do this with the
following series of commands:

```
[root@legba ~]# virsh
Welcome to virsh, the virtualization interactive terminal.

Type:  'help' for help with commands
       'quit' to quit

virsh # virsh pool-define secure.xml
Pool secure defined from secure.xml

virsh # pool-start secure
Pool secure started

virsh # pool-autostart secure
Pool secure marked as autostarted

virsh # pool-refresh secure
Pool secure refreshed
```

## Guest Networking

My network is a tad unusual in that I have VMs on the same box that need to be
on different network segments. Each of these network segments comes back to my
virtualization host through VLANs.

While Linux has long supported tagged VLANs and been able to hop on different
segments as defined by the system administrator, libvirt's virtual network does
not support trunking. This means that the interfaces need to be setup on the
host and bridged through to the guest. I'm going to provide a working example
that passes VLAN20 into a guest as it's native network card.

I'm assuming the trunked port on the host is eth1, please adjust the following
configuration to match what your network has. This example is also specific to
the Red Hat architecture. The configuration will be different than it is here
(and I have not documented it).

You will need to make sure that the package `bridge-utils` is installed on the
server. I think this is a dependency of libvirt but I could be wrong so it's
best to double check.

First eth1 needs to be configured (or unconfigured in this case). This can be
done by editing `/etc/sysconfig/network-scripts/ifcfg-eth1`. The entirety of
the files contents should be replaced with the following:

```
DEVICE=eth1
BOOTPROTO=none
HWADDR=XX:XX:XX:XX:XX:XX
ONBOOT=yes
```

Next we need to tell the server about the VLAN. Create the file
`/etc/sysconfig/network-scripts/ifcfg-vlan20` if it doesn't exist already, and
populate it with the following:

```
VLAN=yes
VLAN_NAME_TYPE=VLAN_PLUS_VID_NO_PAD
DEVICE=vlan20
PHYSDEV=eth1
BOOTPROTO=none
ONBOOT=yes
TYPE=Ethernet
BRIDGE=br20
```

Note above that I've specified which bridge the vlan device is going to be
connected to. The 20 in br20 can be changed to any other number you'd like,
however for simplicity sake I like to have the bridge reflect what VLAN it is
connected to.

The last step is to configure the bridge interface. This is needed so that a
guest may make a connection to it. Create the file
`/etc/sysconfig/network-scripts/ifcfg-br20` if it doesn't already exist and
replace the contents with the following:

```
# br20 - vlan20 - Some non-existant subnet
DEVICE=br20
NM_CONTROLLED=no
ONBOOT=yes
TYPE=Bridge
BOOTPROTO=static

IPADDR="10.13.37.30"
NETMASK="255.255.255.0"
GATEWAY="10.13.37.1"

DEFROUTE=yes

DNS1="10.13.37.1"
DNS2="10.13.37.2"

IPV4_FAILURE_FATAL=yes
IPV6INIT=no

NAME="Some Bridged Network"
```

Careful with this one, the value for TYPE is case sensitive. Putting 'bridge'
or 'BRIDGE' will cause the scripts to ignore that this is a bridge and the
interface will not come up.

In my experience adding a VLAN (and it's the same for each one after) adds a
couple seconds to the boot process each time the server boots up. If
uptime/downtime is important and you need servers coming back up as fast as
they can a large number of VLANs can significantly delay the process.

When creating a guest you'll want to add the following line to the command to
give the guest an interface on the appropriate VLAN:

```
--network=bridge:br20
```

You can also define a network in virsh so that it'll show up to utilities like
virt-manager by putting the following in an xml file and running `virsh
net-define bridge20.xml` assuming you name the file `bridge20.xml`, and `virsh
net-autostart LANBridge` which assumes you use the same name that I've chosen
for this bridge below:

```xml
<network>
  <name>LANBridge</name>
  <uuid>5ba71de3-c507-4512-93c3-65fd3a38e112</uuid>
  <forward mode="bridge" />
  <bridge name="br20" />
</network>
```

### IPv6 Pass Through

https://www.berrange.com/posts/2011/06/16/providing-ipv6-connectivity-to-virtual-guests-with-libvirt-and-kvm/

## Devices

### USB Devices

http://david.wragg.org/blog/2009/03/using-usb-pass-through-under-libvirt.html

### PCI Devices

## Creating New Guests

Things you'll need to determine before creating a new native KVM guest:

* How much RAM do you want to allocate to it? (It's a good idea to consider how
  much RAM is currently used by other guests before determining this, also you
  should cross reference the amount used with what is configured in CGroups if
  those are being implemented.)
* How much disk space do you want to allocate to it? (If using a qcow2 image for
  the disk image, only what is used within the image will be used on the host's
  hard drive. Creating a 50GB image with nothing in it will use up 256Kb on the
  host's drive.)
* How many cores/CPUs should the guest have access to?
* What networks should it belong to?
* What OS will it be running?
* Will it need a graphical interface or console?
* What name would you like to refer to the guest by?

I've found that headless linux guests don't need a whole lot of RAM to function
well. Depending on the function of the server I usually give my guests between
128 and 384Mb of RAM.

Disk space will have to be determined on a guest by guest basis, however I do
like to the qcow2 image for my disk images for a variety of reasons. Snapshots,
compression, encryption, and copy-on-write images are all handy little features
of the qcow2 image format.

There is a small performance hit, I've measured that a qcow2 image is about 8%
slower on reads, and about 12% slower on writes. The added bonuses however more
than make up for that for me. You'll have to decide on your own how you'd like
to handle it.

I have never used more than one core for a guest as they've never needed it,
I've also heard some things that I've never checked into that some guests
become unstable with more than one core defined. You'll have to figure that out
on your own.

Networks need to be created before the guests. If using bridging (like I always
do) then you need the bridge created and figure out which ones you want
available on your guest.

The OS is less important and can even be omitted, however libvirt has some
internal optimizations for certain OS's so if it's available its best to list
what type of OS is going to be run in the guest during the initial creation.

I don't normally need a graphical environment from my guests, preferring to
administer from the command line as it is more powerful and less resource
hungry. In some cases it is unavoidable. You'll notice in the example I give
that the creation commands has the following in it:

```
--graphics none --serial pty --extra-args="console=ttyS0 serial"
```

If your going to be using graphics you will want to omit those two options and
replace them with:

```
--graphics vnc
```

This will allow you to VNC into the guest (there is no authentication or
encryption although these can be configured. These are not documented here.)

Finally the name of the guest, this can not contain spaces and should not
contain any special characters as they may interfere with issuing commands. I
like the names to be short and descriptive referring to either the name of the
server or the primary purpose.

The following command creates a Fedora 16 guest with the name 'example', with 1
CPU, 512Mb of RAM, no graphics, a network card on the LANBridge network, and a
20Gb raw sparse hard disk image.

```
virt-install --connect qemu:///system \
    --name example \
    --description="This is an example VM intended for the wiki" \
    --ram 512 \
    --arch=x86_64 \
    --vcpus=1,maxvcpus=2 \
    --check-cpu \
    --os-type=linux \
    --os-variant=fedora16 \
    --hvm \
    --graphics none \
    --serial pty \
    --location="http://mirror.chpc.utah.edu/pub/fedora/linux/releases/17/Fedora/x86_64/os" \
    --extra-args="console=ttyS0 serial ks=http://example.org/kickstarts/ks.cfg" \
    --disk path=/var/lib/libvirt/images/example.img,format=raw,size=20,sparse=true \
    --network=network:LANBridge
```

## LXC

* https://www.berrange.com/posts/2011/09/27/getting-started-with-lxc-using-libvirt/

[1]: {{< relref "notes/iptables.md" >}}
