---
title: Fast Hex to Decimal in Bash
date: 2014-08-01T19:50:24-04:00

aliases:
  - /blog/2014/08/fast-hex-to-decimal-in-bash/
slug: fast-hex-to-decimal-in-bash

taxonomies:
  tags:
  - linux
  - tips
---

I needed too turn some hexadecimal values into decimal in a bash script and
found a real easy way too do it. The following is a very short bash script
demonstrating how too turn the hexadecimal string "deadbeefcafe" into it's
equivalent decimal value of "244837814094590".

<!-- more -->

```bash
#!/bin/bash

INPUT="deadbeefcafe"
OUTPUT=$((0x${INPUT}))

echo $OUTPUT
```
