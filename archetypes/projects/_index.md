---
title: {{ replace .Name "-" " " | title }}
slug: {{ .File.ContentBaseName }}
created_at: {{ now.Format "2006-01-02T15:04:05-07:00" }}
draft: true
tags: []

# Project metadata
status: "planning"  # planning | active | on-hold | maintenance | archived
source_url: ""      # Optional: GitHub/GitLab URL
demo_url: ""        # Optional: Running instance / project URL
tech_stack: []      # Technologies used (e.g., ["Go", "PostgreSQL", "React"])
---

Brief one-line description of your project for the projects listing page.

<!--more-->

## Overview

Describe the project purpose, goals, and what problem it solves.

## Current Status

This project is in the **planning** phase.

## Technology Stack

Add technologies to the `tech_stack` array in the front matter above.

## Links

Add source code and demo URLs to the front matter above.

## Getting Started

Instructions for setting up and running the project locally.

## Documentation

Links to additional documentation, reference pages, and resources.
