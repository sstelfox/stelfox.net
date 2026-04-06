---
created_at: 2013-01-01T00:00:01-0000
updated_at: 2026-04-05T00:00:00-0000
tags:
  - security
  - linux
  - networking
  - firewall
title: Suricata
aliases:
  - /notes/suricata/
  - /notes/security/suricata/
---

## Overview

Suricata is an open source network threat detection engine that can operate as an Intrusion Detection
System (IDS), Intrusion Prevention System (IPS), and Network Security Monitor (NSM). It's developed by
the Open Information Security Foundation (OISF) and has become the go-to choice over Snort for a few
practical reasons: native multi-threading support, built-in protocol detection regardless of port, and
first-class JSON logging output that plays nicely with modern log pipelines. It also supports Snort
rules directly so migration is straightforward.

## Installation

Most distributions package Suricata directly. The package name is typically just `suricata`:

```sh
# Debian/Ubuntu
apt install suricata

# Fedora/RHEL/CentOS
dnf install suricata

# Arch
pacman -S suricata
```

You'll also want the rule update tool:

```sh
# Usually packaged alongside suricata, but if not:
apt install suricata-update   # Debian/Ubuntu
dnf install suricata-update   # Fedora/RHEL
```

## Configuration

The main configuration file lives at `/etc/suricata/suricata.yaml`. It's a big file but only a handful
of settings need attention for most deployments.

### HOME_NET and EXTERNAL_NET

Define what Suricata considers your internal network. This directly affects how rules match traffic:

```yaml
vars:
  address-groups:
    HOME_NET: "[192.168.0.0/16,10.0.0.0/8,172.16.0.0/12]"
    EXTERNAL_NET: "!$HOME_NET"
```

Narrow this down to your actual network ranges for better accuracy and fewer false positives.

### Interface Settings

Configure the capture interface depending on your mode. For AF_PACKET (the most common on Linux):

```yaml
af-packet:
  - interface: eth0
    cluster-id: 99
    cluster-type: cluster_flow
    defrag: yes
    use-mmap: yes
    tpacket-v3: yes
```

### Rule Paths

Tell Suricata where to find rule files:

```yaml
default-rule-path: /var/lib/suricata/rules
rule-files:
  - suricata.rules
```

The `suricata-update` tool manages files in this location by default.

### EVE JSON Logging

EVE (Extensible Event Format) is the modern logging output and should be your primary log source. It
produces structured JSON that's easy to parse and ship to log aggregation systems:

```yaml
outputs:
  - eve-log:
      enabled: yes
      filetype: regular
      filename: eve.json
      types:
        - alert:
            payload: yes
            payload-printable: yes
            packet: yes
        - http:
            extended: yes
        - dns:
        - tls:
            extended: yes
        - files:
            force-magic: no
        - flow
        - netflow
```

This gives you alerts plus protocol-level metadata for HTTP, DNS, TLS, and flow records all in one
structured log stream.

## IDS Mode (Passive Monitoring)

In IDS mode Suricata passively observes a copy of network traffic without being in the path. This is the
safest way to start since dropping or mangling traffic isn't possible. You'll need traffic fed to your
monitoring interface through a mirror/SPAN port on your switch, a network TAP, or a virtual bridge in a
hypervisor.

### Running with AF_PACKET

AF_PACKET is the standard capture method on Linux. It's fast, supports zero-copy with mmap, and doesn't
need any extra kernel modules:

```sh
# Start suricata in IDS mode on a specific interface
suricata -c /etc/suricata/suricata.yaml -i eth0

# Or using the systemd service (after configuring the interface in suricata.yaml)
systemctl start suricata
```

For dedicated monitoring interfaces, bring the interface up without an IP address so it operates in
promiscuous mode only:

```sh
ip link set eth0 up promisc on
```

## IPS Mode (Inline / Transparent Bridge)

In IPS mode Suricata sits directly in the traffic path and can drop, reject, or modify packets based on
rules. The classic approach uses a transparent bridge with two dedicated NICs. Traffic enters one
interface, crosses the bridge through Suricata's inspection, and exits the other.

### Bridge Configuration with systemd-networkd

Create network configuration files for the two physical interfaces and the bridge. Replace `eth1` and
`eth2` with your actual interface names.

#### /etc/systemd/network/10-br-ips.netdev

```ini
[NetDev]
Name=br-ips
Kind=bridge

[Bridge]
STP=false
ForwardDelay=0
```

#### /etc/systemd/network/20-eth1.network

```ini
[Match]
Name=eth1

[Network]
Bridge=br-ips
```

#### /etc/systemd/network/20-eth2.network

```ini
[Match]
Name=eth2

[Network]
Bridge=br-ips
```

#### /etc/systemd/network/30-br-ips.network

```ini
[Match]
Name=br-ips

[Network]
# No address assigned, this is a transparent bridge
LinkLocalAddressing=no
LLDP=no
EmitLLDP=no
```

Apply the configuration:

```sh
systemctl restart systemd-networkd
```

### Sysctl Settings

Enable forwarding for both IPv4 and IPv6, and turn on bridge netfilter support so Suricata can inspect
bridged traffic:

```ini
# Enable forwarding
net.ipv4.ip_forward = 1
net.ipv6.conf.default.forwarding = 1
net.ipv6.conf.all.forwarding = 1

# Enable netfilter on bridges
net.bridge.bridge-nf-call-ip6tables = 1
net.bridge.bridge-nf-call-iptables = 1
net.bridge.bridge-nf-call-arptables = 0
```

Drop these into `/etc/sysctl.d/90-suricata-bridge.conf` and apply:

```sh
sysctl --system
```

You may also need to load the `br_netfilter` kernel module:

```sh
modprobe br_netfilter
echo "br_netfilter" > /etc/modules-load.d/br_netfilter.conf
```

### nftables Rules for Bridge Forwarding

Set up nftables to allow all traffic across the bridge. This replaces the old iptables approach:

```sh
nft add table bridge filter
nft add chain bridge filter forward '{ type filter hook forward priority 0; policy accept; }'
```

For a persistent configuration, create `/etc/nftables.d/bridge-ips.nft` (or add to your existing
nftables config):

```
table bridge filter {
    chain forward {
        type filter hook forward priority 0; policy accept;

        # Accept all traffic across the IPS bridge
        ibrname "br-ips" accept
        obrname "br-ips" accept
    }
}
```

### Running Suricata in IPS Mode

Configure Suricata to use NFQ (netfilter queue) or AF_PACKET in inline mode:

```yaml
# In suricata.yaml, for AF_PACKET inline mode:
af-packet:
  - interface: eth1
    cluster-id: 98
    cluster-type: cluster_flow
    defrag: yes
    use-mmap: yes
    tpacket-v3: yes
    copy-mode: ips
    copy-iface: eth2
  - interface: eth2
    cluster-id: 97
    cluster-type: cluster_flow
    defrag: yes
    use-mmap: yes
    tpacket-v3: yes
    copy-mode: ips
    copy-iface: eth1
```

Start it up:

```sh
suricata -c /etc/suricata/suricata.yaml --af-packet
```

The `copy-mode: ips` setting means Suricata will forward packets between the two interfaces, dropping
anything that matches a `drop` rule action.

## Network Requirements

| Port/Protocol | Direction | Description |
|---|---|---|
| N/A (passive tap) | Inbound | Mirrored traffic for IDS mode |
| Bridge forwarding | Through | All traffic passes through in IPS mode |
| TCP 443 (HTTPS) | Outbound | Rule updates via suricata-update |
| TCP/UDP 53 (DNS) | Outbound | DNS resolution for update servers |

Suricata itself doesn't listen on any ports. In IDS mode it only reads from a capture interface. In IPS
mode it forwards traffic between bridge members.

## Rule Management

The `suricata-update` tool handles downloading, merging, and managing rulesets. The Emerging Threats
Open ruleset is free and a solid starting point:

```sh
# Fetch and install the latest rules
suricata-update

# List available rule sources
suricata-update list-sources

# Enable an additional source
suricata-update enable-source et/open

# Update rules and reload Suricata without restart
suricata-update
kill -USR2 $(pidof suricata)
```

Rules land in `/var/lib/suricata/rules/suricata.rules` by default. You can customize which rules are
enabled or disabled:

```sh
# Disable a noisy rule by SID
echo "1234567" >> /etc/suricata/disable.conf

# Then re-run the update to apply
suricata-update
```

## Testing

### Configuration Validation

Always validate your config before starting Suricata in production:

```sh
suricata -T -c /etc/suricata/suricata.yaml
```

This parses the config, loads all rules, and reports any errors without actually starting the engine.

### Testing with Sample PCAPs

You can replay packet captures through Suricata to verify rules trigger correctly:

```sh
# Process a pcap file
suricata -c /etc/suricata/suricata.yaml -r sample.pcap -l /tmp/suricata-test/

# Check what triggered
cat /tmp/suricata-test/eve.json | jq 'select(.event_type == "alert")'
```

The Suricata project and Emerging Threats both provide test pcaps. You can also grab samples from places
like [malware-traffic-analysis.net](https://www.malware-traffic-analysis.net/) for more realistic
testing.

## Log Analysis

EVE JSON logs live at `/var/log/suricata/eve.json` by default. Since everything is structured JSON, you
can do quick analysis with `jq` right on the box:

```sh
# Show all alerts
jq 'select(.event_type == "alert")' /var/log/suricata/eve.json

# Count alerts by signature
jq -r 'select(.event_type == "alert") | .alert.signature' /var/log/suricata/eve.json | sort | uniq -c | sort -rn

# Look at DNS queries
jq 'select(.event_type == "dns")' /var/log/suricata/eve.json

# Find TLS connections with specific SNI
jq 'select(.event_type == "tls" and .tls.sni == "example.com")' /var/log/suricata/eve.json

# Show HTTP requests with status codes
jq 'select(.event_type == "http") | {src: .src_ip, host: .http.hostname, url: .http.url, status: .http.status}' /var/log/suricata/eve.json
```

For anything beyond quick spot checks, shipping EVE logs into a proper stack is worth the effort.
Elasticsearch and Kibana (the ELK stack) with Filebeat is the most common setup. There's also
[Arkime](https://arkime.com/) (formerly Moloch) for full packet capture and indexed search alongside
Suricata alerts. For something lighter weight, [Grafana Loki](https://grafana.com/oss/loki/) can ingest
EVE JSON and give you dashboards without the resource overhead of Elasticsearch.
