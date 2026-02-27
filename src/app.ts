import Fastify from "fastify";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import { registerEnv, parseRateLimitConfig } from "./config/env.js";
import { registerAnalyseFeedbackRoute } from "./routes/analyseFeedback.js";

const WELCOME_HTML = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><title>Feedback API</title></head>
<body>
  <h1>Feedback API</h1>
  <p>Server is running.</p>
  <ul>
    <li><a href="/health">Health</a></li>
    <li><a href="/documentation">API documentation</a></li>
  </ul>
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
<head><meta charset="utf-8"><title>Not found</title></head>
<body><h1>Page not found</h1><p>This URL is not known. <a href="/">Back to welcome</a>.</p></body>
</html>`,
      );
  });

  app.setNotFoundHandler(async (_request, reply) => {
    await reply.redirect("/unknown", 302);
  });

  return app;
}
