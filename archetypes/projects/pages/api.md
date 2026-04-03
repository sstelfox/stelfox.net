---
title: "API Reference"
date: {{ now.Format "2006-01-02T15:04:05-07:00" }}
draft: true
# TODO: Update PROJECT_NAME to match your project slug
url: /projects/PROJECT_NAME/api/
---

# API Reference

Sample API documentation page. Delete or modify as needed.

## Authentication

Describe authentication mechanisms.

## Endpoints

### GET /api/resource

Description of the endpoint.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| id   | int  | Yes      | Resource ID |

**Example Request:**

```bash
curl -X GET https://api.example.com/api/resource?id=123
```

**Example Response:**

```json
{
  "id": 123,
  "name": "Example Resource",
  "created_at": "2024-01-01T00:00:00Z"
}
```

### POST /api/resource

Create a new resource.

**Request Body:**

```json
{
  "name": "New Resource"
}
```
