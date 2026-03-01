# Laravel Framework — Reference & Guide Documentation

Reference and guide for Laravel development, structured the same as the Feedback API project: installation, configuration, project structure, development, routing, API patterns, testing, and deployment. Use this when building similar applications with Laravel.

**Target version:** Laravel 12 (PHP 8.2–8.5). Most content applies to Laravel 11+. Where behaviour differs from older versions, it is noted.

---

## Stack Overview

- **Runtime:** PHP 8.2+ (Laravel 12 supports 8.2–8.5; Laravel 11 supports 8.2–8.4)
- **Framework:** Laravel
- **Composer:** Dependency management
- **Artisan:** CLI and code generation
- **Blade:** Templating (optional; APIs often use JSON only)
- **Eloquent:** ORM (when using a database)

---

## 1. Installation

### Requirements

- **PHP** 8.2 or higher (Laravel 12: 8.2–8.5). Extensions: BCMath, Ctype, cURL, DOM, Fileinfo, JSON, Mbstring, OpenSSL, PCRE, PDO, Tokenizer, XML.
- **Composer** 2
- **Node.js & npm** (optional; for frontend assets, e.g. Vite)

### New Project

```bash
composer create-project laravel/laravel my-app
cd my-app
```

This installs the latest Laravel (e.g. Laravel 12). To pin a version: `composer create-project laravel/laravel my-app "12.*"`.

### Environment File

```bash
cp .env.example .env
php artisan key:generate
```

Edit `.env`: set `APP_KEY` (generated above), `APP_ENV`, `APP_DEBUG`, database and other service credentials. See **Configuration** for main variables.

### First Run

**Development server:**

```bash
php artisan serve
```

Runs at `http://localhost:8000` (or `--host` / `--port`).

**Production:** Use a web server (Nginx/Apache) with PHP-FPM; document root points to `public/`.

### Verify Installation

- **http://localhost:8000** — default welcome page
- **http://localhost:8000/api/user** (with auth) or a custom health route — e.g. `{ "status": "ok" }`

---

## 2. Configuration

Config is split between `.env` (environment-specific values) and `config/*.php` (structure and defaults), similar to this project’s `.env` + `src/config/`.

### Main Environment Variables (.env)

| Variable           | Default          | Description                                                                         |
| ------------------ | ---------------- | ----------------------------------------------------------------------------------- |
| `APP_NAME`         | Laravel          | Application name                                                                    |
| `APP_ENV`          | local            | Environment (local, production, etc.)                                               |
| `APP_KEY`          | —                | Encryption key (`php artisan key:generate`)                                         |
| `APP_DEBUG`        | true             | Debug mode (false in production)                                                    |
| `APP_URL`          | http://localhost | Base URL                                                                            |
| `LOG_CHANNEL`      | stack            | Log channel                                                                         |
| `LOG_LEVEL`        | debug            | Log level (debug, info, warning, error)                                             |
| `DB_CONNECTION`    | mysql            | Database driver                                                                     |
| `DB_*`             | —                | Database host, port, database, username, password                                   |
| `CACHE_STORE`      | database         | Cache store (Laravel 11+: was `CACHE_DRIVER`; options: file, database, redis, etc.) |
| `QUEUE_CONNECTION` | database         | Queue driver (sync, database, redis, etc.)                                          |

Never commit `.env`; use `.env.example` as template. Use `config()` in code to read values (e.g. `config('app.env')`).

### Config Source

- **`config/`** — PHP files that return arrays (e.g. `config/app.php`, `config/database.php`). Values can reference `env('KEY', default)`.
- **In app:** Use `config('file.key')`, e.g. `config('app.timezone')`. Cached in production with `php artisan config:cache`.

---

## 3. Project Structure

### Root Files

| File / Dir                          | Purpose                                                               |
| ----------------------------------- | --------------------------------------------------------------------- |
| `artisan`                           | CLI entry (e.g. `php artisan serve`, `migrate`, `make:controller`)    |
| `composer.json`                     | PHP dependencies and autoload                                         |
| `package.json`                      | Frontend deps (Vite, etc.) if used                                    |
| `.env` / `.env.example`             | Environment and template                                              |
| `bootstrap/app.php`                 | App bootstrap; Laravel 11+: exception handling via `withExceptions()` |
| `phpunit.xml` or `phpunit.xml.dist` | PHPUnit config for tests                                              |

### Application Directory: `app/`

| Path                    | Role (same idea as this project)                             |
| ----------------------- | ------------------------------------------------------------ |
| `app/Http/Controllers/` | Request handling, status codes, response (like controllers/) |
| `app/Http/Middleware/`  | Middleware (CORS, rate limit, auth)                          |
| `app/Models/`           | Eloquent models / domain models                              |
| `app/Services/`         | Business logic (e.g. call external API, parse result)        |
| `app/Providers/`        | Service providers (config, bindings, routes)                 |
| `app/Http/Requests/`    | Form requests (validation + auth)                            |

### Other Key Directories

| Path                   | Purpose                                                                                                   |
| ---------------------- | --------------------------------------------------------------------------------------------------------- |
| `routes/`              | Web, API, console, and channel routes                                                                     |
| `config/`              | Configuration files                                                                                       |
| `database/migrations/` | Schema migrations                                                                                         |
| `database/seeders/`    | Seed data                                                                                                 |
| `public/`              | Document root; `index.php` entry                                                                          |
| `resources/views/`     | Blade templates                                                                                           |
| `storage/`             | Logs, cache, uploads                                                                                      |
| `tests/`               | Feature and unit tests (Pest or PHPUnit)                                                                  |
| `bootstrap/`           | Framework bootstrap, cache; Laravel 11+: `bootstrap/app.php` configures middleware, exceptions, providers |

### Building an API Like the Feedback Project

- **Routes:** `routes/api.php` — define `POST /api/analyse-feedback` (optionally under `Route::prefix('api')`).
- **Controller:** `app/Http/Controllers/AnalyseFeedbackController.php` — validate input, call service, return JSON.
- **Service:** `app/Services/AnalyseFeedbackService.php` — call Anthropic (or other API), parse response, throw on error.
- **Request:** `app/Http/Requests/AnalyseFeedbackRequest.php` — validate `feedback_text` (required, string, not empty).
- **Config:** Add keys to `.env` (e.g. `ANTHROPIC_API_KEY`) and optional `config/services.php` entries; read via `config('services.anthropic.key')`.

---

## 4. Development

### Artisan Commands

| Command                            | Description                                 |
| ---------------------------------- | ------------------------------------------- |
| `php artisan serve`                | Dev server (localhost:8000)                 |
| `php artisan route:list`           | List routes                                 |
| `php artisan make:controller Name` | Create controller                           |
| `php artisan make:request Name`    | Create form request                         |
| `php artisan make:service Name`    | (Custom) or create class in `app/Services/` |
| `php artisan config:clear`         | Clear config cache                          |
| `php artisan cache:clear`          | Clear application cache                     |
| `php artisan migrate`              | Run migrations                              |
| `php artisan test`                 | Run tests (PHPUnit)                         |

### Frontend (if used)

```bash
npm install
npm run dev
```

Laravel often uses Vite; `npm run build` for production assets.

### Logging

- Logs go to `storage/logs/laravel.log` (default).
- Use `Log::info()`, `Log::error()`, etc. Level controlled by `LOG_LEVEL` in `.env`.

---

## 5. Routing & Requests

### Route Registration

- **Web:** `routes/web.php` — typically session, CSRF, HTML.
- **API:** `routes/api.php` — prefix `api` by default, stateless; ideal for a feedback API.

Example API route (same concept as this project):

```php
// routes/api.php
use App\Http\Controllers\AnalyseFeedbackController;

Route::post('/analyse-feedback', [AnalyseFeedbackController::class, 'store']);
```

### Request Lifecycle

1. Request → `public/index.php` → Kernel (middleware: global, route).
2. Route match → Middleware (e.g. throttle, auth:api) → Controller.
3. Controller validates (e.g. via Form Request), calls service, returns JSON response.

### Middleware

- **Throttle:** Rate limiting (e.g. `throttle:60,1` for 60 requests per minute). In Laravel 11+, API routes often use `throttle:api` (see `bootstrap/app.php` or `App\Providers\AppServiceProvider`).
- **CORS:** Configure in `config/cors.php` or middleware.
- **Auth:** `auth:sanctum` for API token auth (Laravel Sanctum).

### 404 and Error Handling

- Unmatched routes return 404. **Laravel 11+:** Customize exception rendering in `bootstrap/app.php` via `->withExceptions(function (Exceptions $exceptions) { ... })`. **Laravel 10 and below:** Use `app/Exceptions/Handler.php`.

---

## 6. API Reference (Laravel Equivalent)

For an API like the Feedback project in Laravel:

### Base URL

- Local: `http://localhost:8000` (or your `APP_URL`). API prefix: `/api` by default.

  ### Endpoints (Example Mapping)

  | Method | Path                    | Description                       |
  | ------ | ----------------------- | --------------------------------- |
  | GET    | `/`                     | Welcome / info page               |
  | GET    | `/api/health`           | Health check `{ "status": "ok" }` |
  | POST   | `/api/analyse-feedback` | Analyse feedback (body required)  |

  ### POST /api/analyse-feedback

  **Request:** `Content-Type: application/json`

  ```json
  { "feedback_text": "string (required, non-empty)" }
  ```

  **Success (200):**

  ```json
  {
    "summary": "string",
    "sentiment": "positive" | "neutral" | "negative",
    "language": "string"
  }
  ```

  **Error responses:** Same status codes and body shape as the reference project (400 validation, 429 throttle, 502 service error, 503 missing API key, 500 server error). Return with `response()->json([...], status)`.

  ### Validation (Form Request)

  In `AnalyseFeedbackRequest`: require `feedback_text`, string, and reject empty/whitespace (e.g. `Rule::notIn([''])` and trim). Return 422 with validation errors if invalid.

  ***

## 7. Testing

**Run tests:**

```bash
php artisan test
```

Laravel uses PHPUnit by default; Pest is optional. Config: `phpunit.xml` or `phpunit.xml.dist` (and Laravel’s `TestCase` base).

### Test Layout

- **Feature tests:** `tests/Feature/` — HTTP tests (e.g. hit `/api/analyse-feedback`, assert status and JSON). Use `$this->postJson('/api/analyse-feedback', [...])`.
- **Unit tests:** `tests/Unit/` — test services, helpers in isolation.

### Mocking External API

- Use Laravel’s HTTP fake: `Http::fake([...])` to stub the Anthropic (or external) API in feature tests.
- In unit tests, mock the service class and assert controller or service behaviour.

### What to Test (Same as Reference Project)

- Health route returns 200 and `{ "status": "ok" }`.
- POST analyse-feedback: 422/400 when `feedback_text` missing or empty; 503 when API key not set; 200 with body when successful (mocked); 502 when service throws.

---

## 8. Deployment

### Production Checklist

- Set **`APP_ENV=production`** and **`APP_DEBUG=false`**.
- Set **`APP_KEY`** (and keep it secret).
- Use **HTTPS** and correct **`APP_URL`**.
- Run **`php artisan config:cache`** and **`php artisan route:cache`** (and migrate if using DB).
- **Secrets** (e.g. API keys) only in `.env`; never in code.

### Typical Laravel Deployment

- **Server:** VPS (e.g. AWS EC2, DigitalOcean) or Laravel Forge / Ploi.
- **Stack:** Nginx (or Apache) + PHP-FPM; document root = `public/`.
- **Process:** Clone repo, `composer install --no-dev`, copy `.env`, key generate, migrate, cache config/route, set permissions on `storage/` and `bootstrap/cache/`.
- **Queue/workers:** If using queues, run `php artisan queue:work` via Supervisor or systemd.
- **Scheduler:** Cron entry for `php artisan schedule:run`.

### Health Check

- Expose a route (e.g. `GET /api/health`) that returns `{ "status": "ok" }` for load balancer or monitoring.

### Deploy Script (Concept)

Similar to this project’s `deploy.sh`:

```bash
git pull
composer install --no-dev --optimize-autoloader
php artisan config:cache
php artisan route:cache
php artisan migrate --force
# Restart queue workers if used (e.g. Supervisor)
```

---

## Laravel Version Reference

| Laravel | PHP     | Notes                                                                                                                                                                                              |
| ------: | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|      12 | 8.2–8.5 | Current; `CACHE_STORE`, exception rendering via `bootstrap/app.php` `withExceptions()`, new starter kits (React/Vue/Svelte/Livewire, optional WorkOS AuthKit). Breeze/Jetstream no longer updated. |
|      11 | 8.2–8.4 | Slimmed structure; `CACHE_STORE`; `withExceptions()` in `bootstrap/app.php`.                                                                                                                       |
|      10 | 8.1–8.3 | Uses `CACHE_DRIVER` and `app/Exceptions/Handler.php` (older structure).                                                                                                                            |

---

## Quick Comparison: This Project vs Laravel

| Topic      | This project (Node/Fastify)                       | Laravel                                                  |
| ---------- | ------------------------------------------------- | -------------------------------------------------------- |
| Install    | `npm install`, `.env`                             | `composer create-project`, `.env`, `key:generate`        |
| Config     | `src/config/env.ts`, `.env`                       | `config/*.php`, `.env`                                   |
| Structure  | `src/config`, `services`, `controllers`, `routes` | `app/Http/Controllers`, `app/Services`, `routes/api.php` |
| Dev server | `npm run dev` (tsx)                               | `php artisan serve`                                      |
| Routes     | Fastify routes in `app.ts` + route modules        | `routes/api.php` (and web.php)                           |
| Validation | Route schema + controller checks                  | Form Requests + validation rules                         |
| Tests      | Vitest, `app.inject()`, mock service              | PHPUnit, HTTP fake, feature/unit tests                   |
| Deploy     | Node, PM2 or Vercel                               | PHP-FPM, Nginx, Forge/VPS, queue workers                 |

Use this document as the single reference for Laravel development aligned with the same structure and practices as the Feedback API project.
