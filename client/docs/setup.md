# Client setup

## Prerequisites

- Node.js 18+
- npm
- Running Network Analyzer API on port `8000` (see [server setup](../../server/docs/setup.md))

## Install & run

```bash
cd client
cp .env.example .env   # optional — defaults to localhost:8000
npm install
npm run dev
```

Open `http://localhost:3000`.

## Scripts

| Script | Command | Purpose |
|--------|---------|---------|
| `dev` | `next dev` | Development server |
| `build` | `next build` | Production build |
| `start` | `next start` | Serve production build |
| `lint` | `next lint` | ESLint |

## Environment

Copy `.env.example` to `.env` and set:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

`lib/api.js` reads `process.env.NEXT_PUBLIC_API_URL` with the same localhost default if unset. The URL must be reachable from the **browser** (use host-mapped ports in Docker, not internal service names).

## Docker

Built via the root [`docker-compose.yml`](../../docker-compose.yml). Defaults are in that file; create a root `.env` to override `NEXT_PUBLIC_API_URL` and rebuild if the API host differs.

## Production build

```bash
cd client
npm run build
npm start
```

**Important:** Do not run `next build` while `next dev` is still running. The production build replaces `.next` and the dev server will then 404 CSS/JS chunks (unstyled page, dead buttons). Stop the dev process first, or clear `.next` and restart `npm run dev` if that happens:

```bash
# recover broken dev server
pkill -f "next dev" || true
rm -rf .next
npm run dev
```

## Browser permissions

- **Geolocation** — optional; on deny/timeout the app falls back to a Delhi-area coordinate with small jitter.
- **Network** — needs access to the API host (default `localhost:8000`), `api.ipify.org` (IP + ping), `upload.wikimedia.org` (download test), and `httpbin.org` (upload test).
