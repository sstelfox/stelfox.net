---
created_at: 2014-08-01T19:50:24-0400
tags:
  - linux
  - tips
slug: "fast-hex-to-decimal-in-bash"
title: "Fast Hex to Decimal in Bash"
---

I needed too turn some hexadecimal values into decimal in a bash script and found a real easy way too do it. The following is a very short bash script demonstrating how too turn the hexadecimal string "deadbeefcafe" into it's equivalent decimal value of "244837814094590".

```bash
#!/bin/bash

INPUT="deadbeefcafe"
OUTPUT=$((0x${INPUT}))

echo $OUTPUT
```
