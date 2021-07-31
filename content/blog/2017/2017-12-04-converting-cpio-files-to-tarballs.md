---
title: Converting CPIO Files to Tarballs
date: 2017-12-04T22:46:56-05:00

aliases:
  - /blog/2017/12/converting-cpio-files-to-tarballs/
slug: converting-cpio-files-to-tarballs

taxonomies:
  tags:
  - linux
  - tips
---

I needed to convert a directory full of CPIO files to tar balls. This quick
script did the trick for me but didn't preserve the user / group. Running it as
root will preserve the ownership information but that wasn't important for my
immediate use case.

```
#!/bin/bash

SRC_DIR=$(pwd)
for i in *.cpio; do
  CPIO_TMP_DIR="$(mktemp -d /tmp/cpioconv.XXXX)"
  (cd ${CPIO_TMP_DIR} && cpio -idm < "${SRC_DIR}/${i}" && tar -cf ${SRC_DIR}/${i%%.cpio}.tar .)
  rm -rf ${CPIO_TMP_DIR}
done
```
