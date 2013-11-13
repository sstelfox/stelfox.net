---
title: RPM Build
---

Sources:

* https://fedoraproject.org/wiki/How_to_create_an_RPM_package
* http://wiki.mandriva.com/en/Policies/RpmSpecProposal
* https://fedoraproject.org/wiki/Packaging:Guidelines
* http://rpm.org/max-rpm-snapshot/s1-rpm-inside-macros.html

Create a build user whose sole purpose is to handle building packages. Do not
use root under any circumstances.

As root:

```
useradd mockbuild
echo -n 'mockbuild:password' | chpasswd
```

Its valuable to grant the mockbuild user sudo permissions to allow that user to
install missing development packages.

```
yum install sudo -y
groupadd -g 400 sudoers
usermod -a -G sudoers mockbuild
echo '%sudoers ALL=(ALL) NOPASSWD: ALL' >> /etc/sudoers
```

And install the requisite tools:

```
yum install @development-tools fedora-packager wget -y
```

Login as the build user and setup the build environment.

```
rpmdev-setuptree
echo 'timestamping = on' > .wgetrc
echo '-R' > .curlrc
```

The latter bits setup preservation of files when downloading the packages with
wget and curl.

## Downloading existing source packages

```
yumdownloader --source nginx
rpm -ivh nginx*.src.rpm
rm nginx*.src.rpm
```

## Running a spec

```
rpmbuild -ba ~/rpmbuild/SPECS/nginx.spec
```

When running the above command you will probably encounter missing
dependencies.

For nginx these were:

```
sudo yum install GeoIP-devel gd-devel gperftools-devel libxslt-devel \
  openssl-devel pcre-devel perl-devel perl zlib-devel perl-ExtUtils-Embed -y
```

## Modifying Nginx to include Lua support

Since we are going to be adding lua we need to make sure it is represented as
dependencies by adding them to the spec files.

```
BuildRequires:     lua-devel
Requires:          lua
```

Download the ngx_devel_kit which is a module that provides common functions and
useful utilities for other modules.

```
cd ~/rpmbuild/SOURCES
wget https://github.com/simpl/ngx_devel_kit/archive/v0.2.19.tar.gz
wget https://github.com/chaoslawful/lua-nginx-module/archive/v0.9.0.tar.gz
```

Add the following sources:

```
Source2: https://github.com/simpl/ngx_devel_kit/archive/v0.2.19.tar.gz
Source3: https://github.com/chaoslawful/lua-nginx-module/archive/v0.9.0.tar.gz
```

We need to make sure the additional tar balls are extracted. Add the following
lines after the `%setup -q` line:

```
%setup -T -D -a 2 -n ngx_devel_kit-0.2.19
%setup -T -D -a 3 -n lua-nginx-module-0.9.0
```

For future reference the `-D` means dont delete the prior directories before
uncompressing. The `-a` flag indicates the source number that should be
processed. Finally the `-T` flag prevents the original tar ball from being
extracted again. The `-n` flag fixes the name of the folder that the package
gets uncompressed into.

At the beginning of the `%build` section we need to add a few additional
exports.

```
export LUA_LIB=/usr/lib64
export LUA_INC=/usr/share/lua/5.1
```

Finally we need to add the compile flags to include the modules. Near the end
of the ./configure flags (I Choose after the --with-pcre flag) add the
following lines:

```
    --add-module=./ngx_devel_kit-0.2.19 \
    --add-module=./lua-nginx-module-0.9.0 \
```

# lua lua-socket lua-devel

## Signing Packages

Source:

* http://www.question-defense.com/2010/03/04/generate-a-gpg-key-to-sign-rpm-packages-created-using-rpmbuild-on-centos-linux

