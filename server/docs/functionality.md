# Server functionality

Base URL: `http://localhost:8000/api/v1`

All successful responses use `{ success: true, data: ... }` unless noted. Validation/errors use `{ success: false, message, errors }` via `ApiError` + error middleware.

---

## `POST /sendData`

Persist a speed test and incrementally update pre-aggregated map/trends data.

**Body (JSON)**

| Field | Required | Description |
|-------|----------|-------------|
| `downloadSpeed` | Yes | Mbps (null/undefined rejected; `0` allowed) |
| `uploadSpeed` | Yes | Mbps |
| `ping` | Yes | Stored as `pingMs` |
| `ip` | No | Defaults to `"Unknown"` |
| `provider` | No | Ignored if missing or looks like an IP; server resolves ISP from IP |
| `latitude` / `longitude` | No | Bucketed to 3 decimals (~100 m) for map aggregation |

On save the server:

1. Resolves ISP name from IP via [ipwho.is](https://ipwho.is) (e.g. `Jio`, `Airtel`, `Vi`, `BSNL`).
2. Stores raw IP in `ip`, full ISP string in `isp`, normalized name in `provider`.
3. Upserts one row in `SpeedTestAggregate` for `(provider, latBucket, lonBucket, date, hour)`.

**Example**

```bash
curl -X POST http://localhost:8000/api/v1/sendData \
  -H 'Content-Type: application/json' \
  -d '{
    "downloadSpeed": 49.9,
    "uploadSpeed": 15.1,
    "ping": 16,
    "ip": "203.0.113.10",
    "latitude": 28.614,
    "longitude": 77.209
  }'
```

---

## `GET /getData`

Returns the most recent `SpeedTest` document (`sort: timestamp desc`). `404` if none exist.

---

## `GET /aggregated`

Reads pre-computed rows from the `SpeedTestAggregate` collection (no full-collection scan).

Buckets use **3 decimal places** (~100 m): `latBucket` / `lonBucket`.

Grouped by ISP `provider` + location bucket + UTC date + hour.

**Response item shape**

```json
{
  "provider": "Jio",
  "location": { "latBucket": 28.614, "lonBucket": 77.209 },
  "timeBucket": { "date": "2026-08-06", "hour": 10 },
  "metrics": {
    "totalTests": 1,
    "avgDownload": 49.9,
    "avgUpload": 15.1,
    "maxDownload": 49.9,
    "minDownload": 49.9,
    "maxUpload": 15.1,
    "minUpload": 15.1
  },
  "lastUpdated": "..."
}
```

Used by the heat map and trends UI.

---

## `GET /geocode?lat=&lon=`

Server-side reverse geocode (Nominatim). Always returns `200` with a location string when lat/lon are valid numbers — on Nominatim failure the string is `"lat, lon"`.

```bash
curl 'http://localhost:8000/api/v1/geocode?lat=28.64&lon=77.20'
# → { "success": true, "data": { "location": "New Delhi, Delhi, India" } }
```

---

## Backfill (existing data)

After upgrading, run once against your database to rebuild aggregates and fix IP-as-provider rows:

```bash
cd server
npm run backfill-aggregates
```

---

## Notes

- The client performs real browser-based speed measurements via `lib/speedTest.js` (Wikimedia download, httpbin upload, ipify ping), with simulated fallback when all measurements fail. The API stores whatever values it receives.
- Aggregation does not average `pingMs` (trends UI derives ping client-side from avg download/upload speeds).
- ISP lookup failures fall back to `"Unknown"` without blocking the save.
