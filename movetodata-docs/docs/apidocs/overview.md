---
id: overview
title: API Overview
sidebar_label: Overview
---

# MoveToData API Overview

The MoveToData platform exposes a REST API (OpenAPI 3.0.1, version **1.0.1**) that gives
programmatic access to every service available in the platform. All endpoints require
authentication via a **Bearer token** issued by the Passport service.

## Authentication

```http
Authorization: Bearer <token>
```

Obtain a short-lived access token via `POST /api/passport/login`, or create a
long-lived token from **Settings → Security → API Tokens** inside the platform UI.
Refresh short-lived tokens with `POST /api/passport/refresh-token`.

## Base URL

```
https://<your-instance>/api
```

All endpoints below are relative to this base URL.

---

## Services

| Service | Tag | Description |
|---|---|---|
| **Passport** | `Passport` | Authentication, user management, roles, permissions, MFA, OAuth2, groups |
| **Connect** | `Connect` | Data source connectors, SharePoint ingestion, code repository management |
| **Kepler** | `Kepler` | Dashboards, charts, tabs and version management |
| **Kitab** | `Kitab` | Data catalog, comments, resource explorer, dataset transactions |
| **Dataset** | `Dataset` | Dataset management, column mapping, Spark data operations |
| **Build** | `Build` | Build execution, hardware and preview specs |
| **Scheduler** | `Scheduler` | Job scheduling and orchestration |
| **AccessManager** | `AccessManager` | Fine-grained access control on platform resources |
| **DataHealth** | `DataHealth` | Data quality and health monitoring |
| **Fractal** | `Fractal` | Code repository management (PySpark, SQL) |
| **Docket** | `Docket` | Tag and category management |
| **Synchro** | `Synchro` | Synchronise Spark DataFrames to target databases |
| **Bezier** | `Bezier` | Pipeline management and orchestration |
| **File Explorer** | `File Explorer` | Browse and manage files on the platform filesystem |
| **Subscribe** | `Subscribe` | Subscription management |
| **Platform** | `Platform` | Platform-level configuration (SMTP, Git, Spark, cache, licence) |
| **Cache** | `Cache` | Cache configuration |
| **News** | `News` | In-app news and notifications |

---

## Interactive Catalog

For a full interactive reference — including request/response schemas, example
payloads, and a built-in **Try it out** feature — use the
[API Catalog](/learn/api-catalog) page. It renders the complete OpenAPI specification
(350+ endpoints) directly in the browser.

---

## Error handling

All errors follow a standard envelope:

```json
{
  "status": 4xx | 5xx,
  "message": "Human-readable description",
  "timestamp": "ISO-8601"
}
```

Common HTTP status codes used across all services:

| Code | Meaning |
|---|---|
| `200` | OK |
| `201` | Created |
| `400` | Bad Request — validation error |
| `401` | Unauthorized — missing or expired token |
| `403` | Forbidden — insufficient permissions |
| `404` | Not Found |
| `409` | Conflict — resource already exists |
| `500` | Internal Server Error |
