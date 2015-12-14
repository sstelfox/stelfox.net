---
title: IIS
tags:
- iis
- windows
---

## WebDAV

For remote access to files and "network drives". Was used to replace FTP with
something that can have a certificate slapped on it. This was done on a Windows
Server 2008R2 Enterprise SP1 box.

## Installed Roles

These are just what happened to be installed on the machine I'm documenting,
these don't necessary all apply.

* File Services
  * File Server
  * File Server Resource Manager
* Web Server (IIS)
  * Web Server
    * Common HTTP Features
      * Static Content
      * Default Document
      * Directory Browsing
      * HTTP Errors
      * HTTP Redirection
      * WebDAV Publishing
    * Health and Diagnostics
      * HTTP Logging
      * Logging Tools
      * Request Monitor
    * Security
      * Basic Authentication
      * Windows Authentication
      * Request Filtering
      * IP and Domain Restrictions
    * Performance
      * Static Content Compression
      * Dynamic Content Compression
  * Management Tools
    * IIS Management Console

## Installed Features

These are just what happened to be installed on the machine I'm documenting,
these don't necessary all apply.

* Remote Server Administration Tools
  * Role Administration Tools
    * File Services Tools
      * File Server Resource Manager Tools
    * Web Server (IIS) Tools

## Web Server Setup

In the IIS Manager I created two "Sites" one bound to port 80 ("Informational
Site") the other to port 443 ("WebDAV Drives"). They are both pointing at
I:\wwwroot which has a simple information page about the different WebDAV
shares. The root folder needed read/execute permissions for the local
"IIS_IUSRS" group to function properly. The shares do not seem to have the same
permissions restrictions.

In the site bound to port 443 with a valid certificate I created a bunch of
virtual directories each pointing at one 'share'.

## Global Configuration

* Authentication
  * Only Anonymous Authentication turned on
* Compression
  * Both kinds of compression are on
  * Static Compression
    * Only compress files larger than (in bytes): 2700
    * Cache directory: %SystemDrive%\inetpub\temp\IIS Temporary Compressed Files
    * Per application pool disk space limit (in MB): 100
* Default Document
  * Only index.html
* Directory Browsing
  * Disabled
* Error Pages
  * I left the defaults
* Handler Mappings
  * I left the defaults however it might be best to remove the OPTIONS, TRACE, and WebDAV from the global options and just configure WebDAV on the sub folders.
* HTTP Redirect
  * I left the defaults
* HTTP Response Headers
  * I left the defaults
* IP Address and Domain Restrictions
  * I left the defaults
* Logging
  * One log file per: Site
  * Format: W3C w/ default fields
  * Directory: %SystemDrive%\inetpub\logs\LogFiles
  * Encoding: UTF-8
  * Log File Rollover: Schedule - Daily
* MIME Types
  * I left the defaults
* Modules
* Output Caching
* Request Filtering
* Server Certificates
* WebDAV Authoring Rules
  * WebDAV Settings
* Worker Processes

## Informational Site

Nothing special I just crafted an index.html that explained how to connect and
use the WebDAV shares.

## WebDAV Drives

* Directory Browsing - Enable
* Request Filtering
  * Hidden Segments - Add - 'web.config'
* WebDAV Authoring Rules
  * Add Authoring Rule:
    * All content
    * Specified roles or user groups: "EXAMPLE\Domain Admins, EXAMPLE\Domain Users"
    * Permissions: Read, Source, Write
