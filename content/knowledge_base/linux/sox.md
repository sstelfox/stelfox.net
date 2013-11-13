---
title: Sox
---

## Installation

```
yum install sox sox-plugins-freeworld lame -y
```

## Convert Folders of flacs into mp3s

```
for i in */*.flac;do echo $i; sox "$i" "${i%%.flac}.mp3"; done
```

