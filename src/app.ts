import Fastify from "fastify";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import { registerEnv, parseRateLimitConfig } from "./config/env.ts";
import { registerAnalyseFeedbackRoute } from "./routes/analyseFeedback.ts";

const WELCOME_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Feedback API</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col items-center justify-center p-6 font-sans antialiased">
  <main class="w-full max-w-md text-center">
    <h1 class="text-3xl font-bold text-slate-800 tracking-tight mb-2">Feedback API</h1>
    <p class="text-slate-600 mb-8">Server is running. Analyse customer feedback with Claude.</p>
    <nav class="flex flex-col gap-3">
      <a href="/health" class="block rounded-lg bg-white border border-slate-200 px-5 py-3 text-slate-700 font-medium shadow-sm hover:bg-slate-50 hover:border-slate-300 transition-colors">Health Check</a>
      <a href="/documentation" class="block rounded-lg bg-slate-800 text-white px-5 py-3 font-medium shadow-sm hover:bg-slate-700 transition-colors">API documentation</a>
    </nav>
  </main>
</body>
</html>`;

export async function buildApp(): Promise<ReturnType<typeof Fastify>> {
  const isDev = process.env.NODE_ENV !== "production";
  const app = Fastify({
    logger: {
      level: process.env.LOG_LEVEL ?? "info",
      transport: isDev
        ? { target: "pino-pretty", options: { colorize: true } }
        : undefined,
    },
  });

  await registerEnv(app);
  await app.register(cors, { origin: true });

  await app.register(swagger, {
    openapi: {
      info: {
        title: "Feedback API",
        description:
          "REST API for customer feedback analysis with Anthropic Claude",
        version: "1.0.0",
      },
    },
  });

  await app.register(swaggerUi, {
    routePrefix: "/documentation",
  });

  const rateLimitConfig = parseRateLimitConfig(app.config);
  await app.register(rateLimit, {
    max: rateLimitConfig.max,
    timeWindow: rateLimitConfig.timeWindow,
  });

  app.get("/", async (_, reply) => {
    await reply.type("text/html").send(WELCOME_HTML);
  });

  app.get("/health", async (_, reply) => {
    await reply.status(200).send({ status: "ok" });
  });

  await registerAnalyseFeedbackRoute(app, app.config);

  app.get("/unknown", async (_, reply) => {
    await reply
      .status(404)
      .type("text/html")
      .send(
        `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Not found</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col items-center justify-center p-6 font-sans antialiased">
  <main class="w-full max-w-md text-center">
    <h1 class="text-2xl font-bold text-slate-800 mb-2">Page not found</h1>
    <p class="text-slate-600 mb-6">This URL is not known.</p>
    <a href="/" class="inline-block rounded-lg bg-slate-800 text-white px-5 py-3 font-medium shadow-sm hover:bg-slate-700 transition-colors">Back to welcome</a>
  </main>
</body>
</html>`,
      );
  });

  app.setNotFoundHandler(async (_request, reply) => {
    await reply.redirect("/unknown", 302);
  });

  return app;
}

export default await buildApp();
