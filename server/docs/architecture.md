# Server architecture

## Overview

```
src/devServer.js      # dotenv, connectDB, listen (local/Docker)
index.js              # Vercel serverless entry
src/expressApp.js     # Express app, CORS, morgan, routes, error middleware
src/routes/           # Route definitions
src/controllers/      # Request handlers
src/services/         # ISP resolution, incremental aggregation
src/models/           # Mongoose schemas
src/db/               # Mongo connection
src/utils/            # ApiError, asyncHandler, geoBucket
src/constant.js       # DB_NAME = NetworkSAnalizer
scripts/              # One-off maintenance (backfill-aggregates)
```

## Request flow

```
Client
  → CORS + JSON + morgan
  → /api/v1/* router
  → asyncHandler(controller)
  → Mongoose / external fetch
  → JSON response
  → error middleware (if next(err))
```

Error middleware is registered **after** routes so `asyncHandler` can forward failures with the correct status and body.

## Layers

| Layer | Responsibility |
|-------|----------------|
| `devServer.js` / `index.js` | Boot: load env, connect Mongo, start HTTP server |
| `expressApp.js` | Middleware pipeline and route mounting |
| `routes/measure.routes.js` | Maps HTTP paths to controllers |
| Controllers | Validate input, call services/models, shape responses |
| `services/isp.service.js` | IP → ISP lookup + Indian carrier normalization |
| `services/aggregate.service.js` | Incremental upsert + response mapping |
| `models/measure.model.js` | Raw `SpeedTest` documents |
| `models/aggregate.model.js` | Pre-aggregated `SpeedTestAggregate` rows |
| `db/index.js` | `mongoose.connect(`${MONGODB_URI}/${DB_NAME}`)` |

## Controllers

| File | Role |
|------|------|
| `measure.controllers.js` | Resolve ISP, save measurement, upsert aggregate |
| `aggregate.controller.js` | Read pre-aggregated rows for map/trends |
| `geocode.controller.js` | Server-side Nominatim reverse geocode with silent fallback |

## Data models

### `SpeedTest` (raw measurements)

| Field | Type | Notes |
|-------|------|-------|
| `ip` | String | Required |
| `isp` | String | Full ISP name from ipwho.is |
| `provider` | String | Normalized display name (Jio, Airtel, …) |
| `latitude` / `longitude` | Number | Raw coords; bucketed at aggregate time |
| `downloadSpeedMbps` / `uploadSpeedMbps` | Number | |
| `pingMs` | Number | |
| `timestamp` | Date | Default `Date.now` |

### `SpeedTestAggregate` (pre-computed)

Unique key: `provider` + `location.latBucket` + `location.lonBucket` + `timeBucket.date` + `timeBucket.hour`.

Buckets use 3 decimal places (~100 m) via `utils/geoBucket.js`.

Stores running sums (`sumDownload`, `sumUpload`, `totalTests`) and min/max; averages computed on read.

## Write path (speed test)

```
POST /sendData
  → resolveIsp(ip)
  → SpeedTest.save()
  → upsertSpeedTestAggregate(entry)   # O(1) indexed upsert
```

## Read path (map/trends)

```
GET /aggregated
  → SpeedTestAggregate.find()
  → toAggregateResponse() per doc
```

## External dependencies

- **MongoDB** — primary store (raw + aggregate collections)
- **Nominatim (OSM)** — reverse geocode from the server only
- **ipwho.is** — ISP lookup from IP (HTTPS, no API key); cached in-memory 24h
