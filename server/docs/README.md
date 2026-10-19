# Server documentation

Express API for Network Analyzer. Persists speed tests in MongoDB and serves aggregation + geocode helpers used by the Next.js client.

## Contents

| Doc | Description |
|-----|-------------|
| [Architecture](architecture.md) | Layers, request flow, folder layout |
| [Setup](setup.md) | Env, MongoDB, install, run |
| [Functionality](functionality.md) | Endpoints, models, behavior |

## Quick reference

```bash
cd server
npm install
# create .env — see setup.md
npm run dev   # nodemon → http://localhost:8000
```

Base path: `/api/v1`
