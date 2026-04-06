---
created_at: 2013-01-01T00:00:01-0000
title: LM Sensors
tags:
  - linux
  - hardware
  - monitoring
aliases:
  - /notes/lm-sensors/
---
Useful for monitoring system statistics such as CPU core temperatures, fan speeds, and voltages.

## Setup

After installing the `lm_sensors` package, run `sensors-detect` as root to walk through loading any kernel modules necessary to read sensor data:

```console
# sensors-detect
```

This will probe for hardware monitoring chips and offer to add the detected modules to your system's module loading configuration. Once done, run `sensors` to see the output:

```console
$ sensors
```

## Watching Values

For continuous monitoring, use the `-u` flag for raw values or watch for changes:

```console
$ watch -n 1 sensors
```

## Configuration

Sensor output can be customized through `/etc/sensors3.conf` or drop-in files under `/etc/sensors.d/`. This is useful for:

* Renaming sensor labels to something meaningful
* Setting warning and critical thresholds
* Applying correction factors for sensors that read slightly off
* Hiding sensors that aren't useful

Example configuration to customize a sensor:

```text
chip "coretemp-isa-0000"
  label temp2 "Core 0"
  set temp2_max 85
  set temp2_crit 95
```

## Integration with Other Tools

The sensor data exposed by lm_sensors is readable by most monitoring systems (Prometheus node_exporter, collectd, Nagios plugins, etc.) through the sysfs interface at `/sys/class/hwmon/`. The `sensors` command is just a nice frontend for reading the same data.
