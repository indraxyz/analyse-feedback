# Feedback API

REST API for customer feedback analysis using Anthropic Claude. Accepts feedback text (any language), returns an English summary and sentiment.

## Stack

- **Fastify** – main framework
- **@fastify/cors** – CORS
- **@fastify/env** – env validation and config
- **@fastify/rate-limit** – rate limiting
- **@fastify/swagger** & **@fastify/swagger-ui** – OpenAPI and `/documentation`
- **pino-pretty** – dev logging
- **@anthropic-ai/sdk** – Claude API

## Setup

```bash
npm install
cp .env.example .env
# Edit .env and set ANTHROPIC_API_KEY
```

## Scripts

| Command                | Description                                           |
| ---------------------- | ----------------------------------------------------- |
| `npm run dev`          | Run with tsx watch                                    |
| `npm run build`        | Compile TypeScript (emit to `dist/`)                   |
| `npm run typecheck`    | Type-check entire codebase (incl. tests)               |
| `npm start`            | Run production build                                   |
| `npm test`             | Run tests (Vitest)                                     |
| `npm run test:watch`   | Run tests in watch mode                                |
| `npm run lint`         | ESLint on `src` and root config files (TypeScript-aware) |

## Endpoints

| Method | Path                    | Description                                                 |
| ------ | ----------------------- | ----------------------------------------------------------- |
| GET    | `/`                     | Welcome page (server is running); links to health and docs. |
| GET    | `/health`               | Returns `{ "status": "ok" }`.                               |
| GET    | `/documentation`        | Swagger UI (interactive API docs).                          |
| GET    | `/unknown`              | Not-found page (404). Any other unknown URL redirects here. |
| POST   | `/api/analyse-feedback` | Analyse feedback (see below).                               |

## API

### `POST /api/analyse-feedback`

**Body:** `{ "feedback_text": "string" }`

**Success (200):** `{ "summary": "string", "sentiment": "positive" | "neutral" | "negative" }`

**Errors:**

- **400** – Missing or empty `feedback_text` (body or empty/whitespace-only string).
- **429** – Rate limit exceeded.
- **502** – AI service error or invalid response.
- **503** – `ANTHROPIC_API_KEY` not configured (`API_KEY_MISSING`).
- **500** – Unexpected server error (`INTERNAL_ERROR`).

Feedback in any language is analysed; summary and sentiment are always returned in English.

## Configuration (.env)

| Variable                    | Default           | Description              |
| --------------------------- | ----------------- | ------------------------ |
| `NODE_ENV`                  | development       | Environment              |
| `PORT`                      | 3000              | Server port              |
| `HOST`                      | 0.0.0.0           | Listen host               |
| `LOG_LEVEL`                 | info              | Pino log level           |
| `ANTHROPIC_API_KEY`         | (required)        | Anthropic API key        |
| `ANTHROPIC_MODEL`           | claude-sonnet-4-6 | Claude model             |
| `RATE_LIMIT_MAX`            | 60                | Requests per window      |
| `RATE_LIMIT_TIME_WINDOW_MS` | 60000             | Window in ms             |

## TypeScript

The project is fully TypeScript:

- **Strict mode** and extra flags: `noUncheckedIndexedAccess`, `noImplicitOverride`, `noFallthroughCasesInSwitch`
- **Source imports** use `.ts` extensions; the build rewrites them to `.js` in `dist/` via `rewriteRelativeImportExtensions` (TS 5.7+)
- **Type-checking** of the whole codebase (including tests) via `npm run typecheck` (`tsconfig.typecheck.json`)
- **ESLint** with type-aware rules using `tsconfig.eslint.json` (includes config files and tests)
- **Build** emits only application code to `dist/`; test files are excluded in `tsconfig.json`

## Project structure

```
ecosystem.config.cjs   PM2 config for VPS (start with: pm2 start ecosystem.config.cjs)
eslint.config.js        ESLint flat config (defineConfig, type-aware)
tsconfig.json           TypeScript build config
tsconfig.typecheck.json Type-check (incl. tests)
tsconfig.eslint.json    ESLint parser project (src + config files)

src/
  config/     env schema and config helpers
  models/     request/response types and JSON schemas
  services/   business logic (Anthropic call, parsing)
  controllers/  request handling and error mapping
  routes/     route registration and validation
  types/      Fastify augmentation
  app.ts      Fastify app builder
  index.ts    entry point
```

## Troubleshooting

If you get `502` with `AI_SERVICE_ERROR`:

1. **Check server logs** – The real Anthropic error is logged (e.g. invalid API key, wrong model, rate limit). Run `npm run dev` and look at the terminal when the request fails.
2. **API key** – Ensure `ANTHROPIC_API_KEY` in `.env` is valid and has no extra spaces. Create/manage keys at [Anthropic Console](https://console.anthropic.com/).
3. **Model** – Default is `claude-sonnet-4-6`. If that model is deprecated, set `ANTHROPIC_MODEL` to a current model ID from [Anthropic docs](https://docs.anthropic.com/en/docs/models-overview).

## Deploy on Vercel

This project is set up to deploy on [Vercel](https://vercel.com) with zero-config Fastify support.

1. **Push to Git** and [import the project](https://vercel.com/new) in Vercel (or use [Vercel CLI](https://vercel.com/docs/cli): `vc deploy`).

2. **Set environment variables** in the Vercel project (Settings → Environment Variables):
   - `ANTHROPIC_API_KEY` (required)
   - Optionally: `ANTHROPIC_MODEL`, `RATE_LIMIT_MAX`, `RATE_LIMIT_TIME_WINDOW_MS`, `NODE_ENV`

3. **Build** runs `npm run build`; the entrypoint `src/index.ts` is [detected automatically](https://vercel.com/docs/frameworks/backend/fastify).

**Local preview:** `vercel dev` (CLI 48.6.0+).

**Note:** Rate limiting is in-memory per instance; on serverless it applies per function instance, not globally.

## Production deploy on AWS (EC2 / VPS)

For a long-running Node server on an AWS EC2 instance or another VPS:

### Requirements

- **Node.js 22+** (see `engines` in `package.json`). Install via [NodeSource](https://github.com/nodesource/distributions) or your distro’s package manager.

### Build and run

1. **Clone and install**
   ```bash
   git clone <your-repo-url> feedback && cd feedback
   npm ci
   ```

2. **Environment**
   - Copy `.env.example` to `.env` (or set variables in the shell/systemd/PM2).
   - Set `ANTHROPIC_API_KEY` and optionally `NODE_ENV=production`, `PORT`, `HOST`, `ANTHROPIC_MODEL`, `RATE_LIMIT_*`.

3. **Build and start**
   ```bash
   npm run build
   npm start
   ```
   The app listens on `HOST:PORT` (default `0.0.0.0:3000`). Health: `GET /health` → `{ "status": "ok" }`.

### Process manager (recommended)

- **PM2**
  ```bash
  npm install -g pm2
  npm run build
  pm2 start ecosystem.config.cjs
  pm2 save && pm2 startup
  ```
  The repo includes `ecosystem.config.cjs`: it sets `NODE_ENV=production`, loads `.env`, and writes logs under `logs/`. Ensure `.env` exists in the app directory with `ANTHROPIC_API_KEY` and other vars.

- **systemd** – Create a unit that runs `node /path/to/feedback/dist/index.js` with `EnvironmentFile=/path/to/feedback/.env` and `Restart=always`.

### Security and networking

- **Firewall** – Open only the HTTP(S) port (e.g. 80/443) and SSH; leave 3000 closed from the internet if you put a reverse proxy in front.
- **Reverse proxy** – Put Nginx (or Caddy) in front; proxy to `http://127.0.0.1:3000` and terminate TLS. Optionally add rate limiting and static assets at the proxy.
- **Secrets** – Keep `ANTHROPIC_API_KEY` in env or a secrets manager; never commit `.env` (it’s in `.gitignore`).

### Health check

- **Endpoint:** `GET /health` → `{ "status": "ok" }`.
- Use this for load balancer health checks, monitoring, or uptime checks.

## Production (general)

- Set **`NODE_ENV=production`**.
- Use a **process manager** (e.g. PM2) or container/orchestration when not on Vercel; see [Production deploy on AWS (EC2 / VPS)](#production-deploy-on-aws-ec2--vps) above.
- Ensure **`ANTHROPIC_API_KEY`** is set via env (no secrets in code).
- Tune **`RATE_LIMIT_MAX`** and **`RATE_LIMIT_TIME_WINDOW_MS`** as needed.
- **Health check:** `GET /health` returns `{ "status": "ok" }`.
