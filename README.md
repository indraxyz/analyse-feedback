# Feedback API

REST API for customer feedback analysis using Anthropic Claude. Accepts feedback text (any language), returns an English summary and sentiment.

## Stack

- **Fastify** – main framework
- **@fastify/cors** – CORS
- **@fastify/env** – env validation and config
- **@fastify/rate-limit** – rate limiting
- **pino-pretty** – dev logging
- **@anthropic-ai/sdk** – Claude API

## Setup

```bash
npm install
cp .env.example .env
# Edit .env and set ANTHROPIC_API_KEY
```

## Scripts

| Command             | Description                              |
| ------------------- | ---------------------------------------- |
| `npm run dev`       | Run with tsx watch                       |
| `npm run build`     | Compile TypeScript (emit to `dist/`)     |
| `npm run typecheck` | Type-check entire codebase (incl. tests) |
| `npm start`         | Run production build                     |
| `npm test`          | Run tests                                |
| `npm run lint`      | ESLint (TypeScript-aware)                |

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

Feedback in any language is analysed; summary and sentiment are always returned in English.

## Configuration (.env)

| Variable                    | Default           | Description         |
| --------------------------- | ----------------- | ------------------- |
| `NODE_ENV`                  | development       | Environment         |
| `PORT`                      | 3000              | Server port         |
| `HOST`                      | 0.0.0.0           | Listen host         |
| `ANTHROPIC_API_KEY`         | (required)        | Anthropic API key   |
| `ANTHROPIC_MODEL`           | claude-sonnet-4-6 | Claude model        |
| `RATE_LIMIT_MAX`            | 60                | Requests per window |
| `RATE_LIMIT_TIME_WINDOW_MS` | 60000             | Window in ms        |

## TypeScript

The project is fully TypeScript:

- **Strict mode** and extra flags: `noUncheckedIndexedAccess`, `noImplicitOverride`, `noFallthroughCasesInSwitch`
- **Type-checking** of tests via `npm run typecheck` (uses `tsconfig.typecheck.json` including `**/*.test.ts`)
- **ESLint** with `typescript-eslint` and type-aware rules (parser uses `tsconfig.typecheck.json`)
- **Build** excludes test files from `dist/` via `tsconfig.json` exclude

## Project structure

```
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

## Production

- Set `NODE_ENV=production`.
- Use a process manager (e.g. PM2) or container orchestration when not on Vercel.
- Ensure `ANTHROPIC_API_KEY` is set via env (no secrets in code).
- Adjust `RATE_LIMIT_MAX` and `RATE_LIMIT_TIME_WINDOW_MS` as needed.
- Health check: `GET /health` returns `{ "status": "ok" }`.
