# Deployment Environment

## Render backend

Set these Render environment variables for the production service:

| Variable | Required | Production value or format |
| --- | --- | --- |
| `JWT_SECRET` | Yes | A long, unique secret. Do not place it in source control or a `VITE_` variable. |
| `MONGO_URI` | Yes | MongoDB Atlas connection URI. Keep it secret. |
| `CLIENT_ORIGINS` | Yes | Comma-separated HTTPS browser origins, with no paths or trailing slashes. Current production value: `https://kaamsetu-wheat.vercel.app` |
| `NODE_ENV` | Yes | `production` |
| `LOG_LEVEL` | Recommended | `info` |
| `PORT` | Render-managed | Do not override unless the hosting platform requires it. The application reads Render's provided port. |

The backend targets Node.js `22.12.0` or newer within major version 22 (and below 25). Render should use Node 22 so local, CI, and production runtimes match the declared engine.

`CLIENT_ORIGINS` is an exact allowlist. Preview deployments are blocked by default. Add a preview origin only when intentionally required, for example:

```text
CLIENT_ORIGINS=https://kaamsetu-wheat.vercel.app,https://preview.example.vercel.app
```

Requests without an `Origin` header remain allowed for Render health checks and server-to-server tooling. Browser requests from an unlisted origin receive HTTP `403`; Socket.IO handshakes from an unlisted origin are rejected.

For local development, set `NODE_ENV=development` and `ALLOW_LOCAL_ORIGIN=true` in the backend environment. This adds only `http://localhost:5173` in that explicit development environment; it is never enabled by `ALLOW_LOCAL_ORIGIN` in production. Keep `CLIENT_ORIGINS` set to the production HTTPS allowlist on Render.

`NODE_ENV` is required and must be exactly `development`, `test`, or `production`. Local development should use `NODE_ENV=development`; production must use `NODE_ENV=production`. Missing or misspelled values fail startup.

The API sends Helmet security headers and does not expose `X-Powered-By`. Content Security Policy is intentionally disabled because this service returns an API and serves Swagger UI rather than the React application. JSON requests are limited to 1 MB and URL-encoded requests to 100 KB. There are no multipart upload routes; if uploads are added, give them a dedicated parser and limit.

Login is limited to 10 requests per IP per 15 minutes, registration to 5 per IP per hour, and selected authenticated write routes to 60 requests per IP per minute. Render's single reverse proxy is trusted for client IP resolution (`trust proxy = 1`); do not change this to unrestricted proxy trust.

The Socket.IO transport buffer is limited to 1 MB, and event payloads remain subject to the existing Zod validation. SIGTERM and SIGINT stop accepting HTTP connections, attempt to close Socket.IO and MongoDB, and use a 10-second deadline. If the deadline expires, the server logs an incomplete shutdown and sets a failing exit status; the timeout does not cancel cleanup operations.

## Vercel frontend

Set the production build variable below in Vercel:

| Variable | Value |
| --- | --- |
| `VITE_API_URL` | `https://kaamsetu-y4o7.onrender.com` |

Vite embeds `VITE_` values in the browser bundle. Never place secrets in Vercel variables whose names start with `VITE_`.
