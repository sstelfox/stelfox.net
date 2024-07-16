---
title: {{ replace .File.ContentBaseName "-" " " | title }}
stub: {{ .File.ContentBaseName }}
created_at: {{ .Date | time.Format "2006-01-02T15:04:05-0700" }}
draft: true
evergreen: true
public: true
tags: []
---

# {{ replace .Name "-" " " | title }}{{ replace .File.ContentBaseName "-" " " | title }}
