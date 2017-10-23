---
date: 2014-08-01 19:50:24 -0400
slug: "fast-hex-to-decimal-in-bash"
tags:
- linux
- tips
title: "Fast Hex to Decimal in Bash"
---

I needed too turn some hexadecimal values into decimal in a bash script and
found a real easy way too do it. The following is a very short bash script
demonstrating how too turn the hexadecimal string "deadbeefcafe" into it's
equivalent decimal value of "244837814094590".

```bash
#!/bin/bash

INPUT="deadbeefcafe"
OUTPUT=$((0x${INPUT}))

echo $OUTPUT
```
