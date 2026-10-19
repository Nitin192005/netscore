# Client architecture

## Overview

Next.js 15 App Router app. Feature UI lives in `components/`; shared API access in `lib/api.js`. Styling is Tailwind CSS 4 + shadcn/ui primitives under `components/ui/`.

```
client/
  app/
    layout.tsx          # Root layout, fonts, Toaster
    page.jsx            # Speed test (/)
    heatmap/page.jsx    # Heat map
    trends/page.jsx     # Trends
    globals.css
  components/
    speed-test-card.jsx
    map-component.jsx
    trends-analysis.jsx
    navbar.jsx
    ui/*                # shadcn + toast
  lib/
    api.js              # ApiClient → NEXT_PUBLIC_API_URL (default localhost:8000/api/v1)
    speedTest.js        # Browser download/upload/ping measurement
    utils.js / utils.ts
  hooks/                # use-toast, use-mobile
```

## Pages → components

| Route | Page | Main component |
|-------|------|----------------|
| `/` | `app/page.jsx` | `SpeedTestCard` |
| `/heatmap` | `app/heatmap/page.jsx` | `MapComponent` |
| `/trends` | `app/trends/page.jsx` | `TrendsAnalysis` |

`Navbar` is shared across pages.

## Data flow

```
SpeedTestCard
  → geolocation (or Delhi-area fallback)
  → apiClient.getPublicIP()          # ipify (browser)
  → apiClient.reverseGeocode()       # GET /api/v1/geocode (our API)
  → speedTest.start()                # real measurement; simulated fallback
  → apiClient.sendSpeedTestData()    # POST /api/v1/sendData

MapComponent / TrendsAnalysis
  → apiClient.getAggregatedData()    # GET /api/v1/aggregated
  → client-side filtering (trends)
```

API base URL comes from `NEXT_PUBLIC_API_URL` in [`lib/api.js`](../../lib/api.js) (defaults to `http://localhost:8000/api/v1`). See [`client/.env.example`](../.env.example).

## UI stack

- **Tailwind + shadcn/ui** — cards, buttons, toasts, selects
- **Leaflet** — dynamic import in `MapComponent` (avoids SSR issues); OSM tiles
- **Recharts** — line/area/bar charts on trends
- **Toaster** — mounted in `app/layout.tsx` so speed-test / map toasts render

## Design notes

- Speed values come from `lib/speedTest.js` (Wikimedia download, httpbin upload, ipify ping). If all measurements fail, the utility falls back to simulated values.
- Reverse geocode is proxied through the Express API so the browser never calls Nominatim directly (avoids DNS/CORS console noise).
- Trends filters are applied **client-side** on the aggregated payload; the server does not accept filter query params.
- Ping chart on trends uses **derived** latency from avg download/upload (server aggregation does not include ping).
