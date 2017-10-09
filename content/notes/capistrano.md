---
title: Capistrano
---

# Capistrano

One liner virt-install script to setup a libvirt machine.

```
virt-install --connect qemu:///system --name captest --ram 4096 \
  --arch x86_64 --vcpus 2 --security type=dynamic \
  --location http://mirrors.kernel.org/fedora/releases/18/Fedora/x86_64/os/ \
  --extra-args "text console=ttyS0 ks=http://stelfox.net/ks-lxc.cfg" \
  --os-type=linux --os-variant=fedora18 \
  --disk="pool=default,size=15,sparse=true,format=qcow2" \
  --network="network=default,mac=00:07:3e:22:33:44" --graphics=none --hvm \
  --virt-type=kvm --accelerate --console=pty --memballoon=virtio --autostart \
  --check-cpu
```

Login as root

```
useradd deploy
passwd deploy
```

On your laptop

```
ssh-copy-id deploy@tgt
```

Back as root

```
passwd -l deploy
yum install git tar ruby rubygem-bundler ruby-devel make gcc gcc-c++ -y
```

If using sqlite3...

```
yum install sqlite-devel -y
```

Testing git/ssh access (back on laptop):

```
ssh -A deploy@192.168.122.40 'git ls-remote git@github.com:sstelfox/parcel_pot.git'
```

This didnt work the first time since I didnt have githubs host key added to my
`known_hosts` file. After logging in directly, running the command, and
accepting the host key it worked fine.

And back as root:

Since I switched to using the deploy users home directory I dont need to
perform the following block of commands at all...

```
mkdir -p /var/www/parcel_pot/{releases,shared}
restorecon -R /var/www
chown -R deploy:deploy /var/www/parcel_pot

# All files created in this directory will have the deploy group set
chmod 2755 /var/www/parcel_pot
chmod -R u=rwX,g=rwX,o= /var/www/parcel_pot

# This is only needed if you want to use foreman to create and update system
# init scripts
groupadd -g 401 sudoers
usermod -a -G sudoers deploy
# The following should be more heavily restricted
echo 'Cmnd_Alias FOREMAN = /home/deploy/*/current/bin/foreman, /usr/bin/systemctl' >> /etc/sudoers
echo '%sudoers  ALL=(ALL)  NOPASSWD: FOREMAN' >> /etc/sudoers
```

Back in the project ran:

```
cap staging deploy:check
cap staging deploy
```

