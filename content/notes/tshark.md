---
title: TShark
type: note
---

# TShark

```
yum install wireshark -y
```

## Streams w/ PCAPs

First you'll need to extract the stream numbers:

```
tshark -r dump.pcap -T fields -e tcp.stream
```

Then you can extract the content of the streams using the stream number you specified:

```
tshark -r dump.pcap -T fields -e text tcp.stream eq $stream
```

