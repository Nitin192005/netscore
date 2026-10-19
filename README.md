# Network Analyzer

Crowdsourced network performance app. Users run a speed test in the browser; results are stored in MongoDB and visualized on a heat map and trends dashboard.

```
Browser (Next.js :3000)
  → Express API (:8000) /api/v1
    → MongoDB (NetworkSAnalizer)
```

## Structure

| Path | Role |
|------|------|
| [`client/`](client/) | Next.js 15 frontend (speed test, heat map, trends) |
| [`server/`](server/) | Express + Mongoose API |
| [`client/docs/`](client/docs/) | Frontend architecture, setup, features |
| [`server/docs/`](server/docs/) | Backend architecture, setup, API |
| [`docker-compose.yml`](docker-compose.yml) | Full stack (MongoDB + API + frontend) |

## Prerequisites

- Node.js 18+ (20 recommended)
- npm
- MongoDB (local install or Docker)

## Quick start

### Docker Compose (recommended)

Runs API and frontend (MongoDB via Atlas — configure in `server/.env`):

```bash
# server/.env must contain MONGODB_URI (see server/.env.example)
docker compose up --build
```

Defaults are set in [`docker-compose.yml`](docker-compose.yml). Atlas URI goes in [`server/.env`](server/.env) (gitignored). Optional root `.env` overrides `NEXT_PUBLIC_API_URL` and `CORS_ORIGIN`.

- Frontend: http://localhost:3000
- API: http://localhost:8000/api/v1

The client reads `NEXT_PUBLIC_API_URL` at build time (defaults to `http://localhost:8000/api/v1`). This must be reachable from your **browser**, not from inside the client container.

### Manual setup

#### 1. MongoDB

```bash
docker run -d --name network-analyzer-mongo -p 27017:27017 mongo:7
```

#### 2. API

```bash
cd server
cp .env.example .env   # or create .env (see below)
npm install
npm run dev
```

Server listens on `http://localhost:8000`.

**`server/.env`**

```env
MONGODB_URI=mongodb://127.0.0.1:27017
PORT=8000
CORS_ORIGIN=http://localhost:3000
```

### 3. Client

```bash
cd client
cp .env.example .env   # optional — defaults to localhost:8000
npm install
npm run dev
```

Open `http://localhost:3000`.

> Do not run `next build` while `next dev` is running — it overwrites `.next` and breaks CSS/JS in the browser. Stop the dev server first if you need a production build.

## Features

- **Speed Test** (`/`) — browser-based download/upload/ping via `lib/speedTest.js` (simulated fallback), geolocation, public IP, reverse geocode via API, save to MongoDB
- **Heat Map** (`/heatmap`) — Leaflet map of aggregated speeds by location
- **Trends** (`/trends`) — Recharts charts with provider/location/date filters (client-side)

## API overview

Base URL: `http://localhost:8000/api/v1`

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/sendData` | Save a speed test result |
| `GET` | `/getData` | Latest measurement |
| `GET` | `/aggregated` | Geo/time aggregated metrics |
| `GET` | `/geocode?lat=&lon=` | Reverse geocode (server-side Nominatim) |

| [`server/docs/`](server/docs/) | Backend architecture, setup, API |

## Environment variables

| Variable | Where | Default | Purpose |
|----------|-------|---------|---------|
| `NEXT_PUBLIC_API_URL` | client | `http://localhost:8000/api/v1` | Browser-facing API base URL |
| `MONGODB_URI` | server | — | Mongo host (no DB name suffix) |
| `PORT` | server | `8000` | HTTP listen port |
| `CORS_ORIGIN` | server | `*` | Allowed browser origin |

## Documentation

- [Client docs](client/docs/README.md)
- [Server docs](server/docs/README.md)

## External services (browser)

Speed tests and metadata use these hosts (in addition to `localhost:8000`):

- `api.ipify.org` — public IP and ping target
- `upload.wikimedia.org` — download speed test file
- `httpbin.org` — upload speed test endpoint

## Tech stack

- **Frontend:** Next.js 15, React 18, Tailwind CSS 4, Leaflet, Recharts, shadcn/ui
- **Backend:** Express 5, Mongoose 8, Morgan, CORS, dotenv
- **Database:** MongoDB

## License

ISC
