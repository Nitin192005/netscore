# Server setup

## Prerequisites

- Node.js 18+
- npm
- MongoDB reachable at the URI in `.env` (Docker example below)

## MongoDB (Docker)

```bash
docker run -d --name network-analyzer-mongo -p 27017:27017 mongo:7
# later: docker start network-analyzer-mongo
```

## Environment

Create `server/.env` (not committed):

```env
MONGODB_URI=mongodb://127.0.0.1:27017
PORT=8000
CORS_ORIGIN=http://localhost:3000
```

| Variable | Required | Default | Purpose |
|----------|----------|---------|---------|
| `MONGODB_URI` | Yes | — | Host URI **without** DB name; code appends `/NetworkSAnalizer` |
| `PORT` | No | `8000` | HTTP listen port |
| `CORS_ORIGIN` | No | `*` | Allowed browser origin |

## Install & run

```bash
cd server
npm install
npm run dev
```

`npm run dev` runs `nodemon src/index.js`. On success you should see Mongo connected and `Server is running on port 8000`.

There is no production `start` script yet; for a simple prod run:

```bash
node src/index.js
```

## Verify

```bash
curl -s http://localhost:8000/api/v1/aggregated
curl -s 'http://localhost:8000/api/v1/geocode?lat=28.64&lon=77.20'
curl -s -X POST http://localhost:8000/api/v1/sendData \
  -H 'Content-Type: application/json' \
  -d '{"downloadSpeed":40,"uploadSpeed":10,"ping":20,"ip":"1.2.3.4","latitude":28.6,"longitude":77.2,"provider":"DemoISP"}'
```

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `Failed to connect to the database` | Start Mongo; check `MONGODB_URI` |
| CORS errors in browser | Set `CORS_ORIGIN=http://localhost:3000` |
| Port in use | Change `PORT` or free `8000` |
