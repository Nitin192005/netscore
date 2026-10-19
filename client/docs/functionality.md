# Client functionality

## Speed Test (`/`)

1. User clicks **Run Speed Test**.
2. App requests GPS (4s timeout, `enableHighAccuracy: false`). On failure → fallback coords near New Delhi.
3. Fetches public IP via ipify (fallback IP if offline).
4. Reverse-geocodes via `GET /api/v1/geocode` (place name or `"lat, lon"`).
5. Runs `speedTest.start()` — real browser download (Wikimedia), upload (httpbin), and ping (ipify). Falls back to simulated values if all measurements fail.
6. `POST /api/v1/sendData` saves the result (server resolves ISP name from IP — e.g. Jio, Airtel — not the raw IP).
7. Toast + expandable **Saved Result** JSON panel on success; provider badge shown after save.

Displayed metrics: Mbps down/up, ping ms, IP, ISP provider name, location label.

## Heat Map (`/heatmap`)

1. Initializes a Leaflet map centered on India.
2. Loads `GET /api/v1/aggregated` (pre-computed buckets, ~100 m grid, grouped by ISP).
3. Places colored markers per location bucket (color by avg download):
   - Green ≥ 40 Mbps
   - Yellow ≥ 30
   - Orange ≥ 20
   - Red below 20
4. Marker badge shows `totalTests`; click opens a detail panel (title shows `latBucket, lonBucket`).
5. Refresh button reloads aggregated data.

Requires valid lat/lon buckets and metrics from the API.

## Trends (`/trends`)

1. Loads aggregated data once on mount.
2. Client-side filters: provider, location, date range (no server-side filtering).
3. Charts (Recharts) for download/upload over time; ping chart uses derived values from avg speeds (not stored ping).

Empty state when no data or filters exclude all points.

## Navigation

Top navbar: **Speed Test** | **Heat Map** | **Trends**.

## Error handling (UX)

| Situation | Behavior |
|-----------|----------|
| GPS denied/timeout | Silent fallback location |
| Geocode / Nominatim down | Coords string via API; no browser Nominatim call |
| IP fetch fails | Fallback IP |
| Speed test measurement fails | Simulated fallback values |
| Save / load API fails | Toast + `console.error` |

## Out of scope (current)

- Auth / multi-user accounts
- Server-side trend filtering
- Lab-grade bandwidth accuracy (browser tests are best-effort)
