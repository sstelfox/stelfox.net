---
created_at: 2013-01-01T00:00:01-0000
updated_at: 2026-04-05T00:00:00-0000
title: RPM Build
slug: rpmbuild
tags:
  - linux
  - fedora
  - operations
aliases:
  - /notes/rpm-build/
---

References:

* https://fedoraproject.org/wiki/How_to_create_an_RPM_package
* https://fedoraproject.org/wiki/Packaging:Guidelines

## Build Environment Setup

Create a dedicated build user. Never build RPMs as root.

```console
# useradd mockbuild
# passwd mockbuild
```

Install the required tools:

```console
# dnf install @development-tools fedora-packager rpmdevtools wget
```

Login as the build user and set up the build tree:

```console
$ rpmdev-setuptree
```

This creates the standard `~/rpmbuild/{BUILD,RPMS,SOURCES,SPECS,SRPMS}` directory structure.

## Working with Existing Source Packages

Download an existing source RPM and install it into your build tree:

```console
$ dnf download --source nginx
$ rpm -ivh nginx*.src.rpm
$ rm nginx*.src.rpm
```

## Building from a Spec File

```console
$ rpmbuild -ba ~/rpmbuild/SPECS/nginx.spec
```

You will likely encounter missing build dependencies. Install them as needed. The `dnf builddep` command can handle this automatically:

```console
# dnf builddep ~/rpmbuild/SPECS/nginx.spec
```

## Adding Custom Modules

When adding third-party modules to an existing package, you need to:

1. Download the module source tarballs into `~/rpmbuild/SOURCES/`
2. Add `Source` entries to the spec file pointing to the tarballs
3. Add any new `BuildRequires` and `Requires` dependencies
4. Add `%setup` lines after the main `%setup -q` to extract the additional sources:
   - Use `-T` to prevent re-extracting the original tarball
   - Use `-D` to preserve existing directories
   - Use `-a N` where N is the source number
   - Use `-n dirname` to set the expected directory name
5. Add `--add-module=./module-dir` flags to the `./configure` invocation in the `%build` section

## Signing Packages

RPM packages can be signed with a GPG key to verify their authenticity. First set the signing key in your `~/.rpmmacros`:

```
%_signature gpg
%_gpg_name Your Name <your@email.com>
```

Then sign packages with:

```console
$ rpm --addsign ~/rpmbuild/RPMS/x86_64/your-package.rpm
```
