---
title: FFMPEG
---

# FFMPEG

## Mass Conversion from WMA to Ogg

```
find -iname "*.wma" -exec ffmpeg -i {} -acodec libvorbis -aq 100 {}.ogg \; \
  -exec rm -f {} \; -print
```

