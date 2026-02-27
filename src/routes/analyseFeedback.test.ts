import { describe, it, expect } from "vitest";
import Fastify from "fastify";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import { registerEnv } from "../config/env.js";
import { registerAnalyseFeedbackRoute } from "./analyseFeedback.js";

async function buildTestApp(envOverrides: Partial<Record<string, string>> = {}) {
  const originalEnv = process.env;
  process.env = { ...originalEnv, ...envOverrides };
  const app = Fastify({ logger: false });
  await registerEnv(app);
  await app.register(cors, { origin: true });
  await app.register(rateLimit, { max: 100, timeWindow: 60000 });
  await registerAnalyseFeedbackRoute(app, app.config);
  app.get("/health", async (_, reply) => reply.status(200).send({ status: "ok" }));
  process.env = originalEnv;
  return app;
}

describe("GET /health", () => {
  it("returns 200 and status ok", async () => {
    const app = await buildTestApp({ ANTHROPIC_API_KEY: "test-key" });
    const res = await app.inject({ method: "GET", url: "/health" });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ status: "ok" });
  });
});

describe("POST /api/analyse-feedback", () => {
  it("returns 400 when feedback_text is missing", async () => {
    const app = await buildTestApp({
      ANTHROPIC_API_KEY: "test-key",
    });
    const res = await app.inject({
      method: "POST",
      url: "/api/analyse-feedback",
      payload: {},
    });
    expect(res.statusCode).toBe(400);
    const body = res.json();
    expect(body.message).toBeDefined();
    expect(body.code).toBeDefined();
  });

  it("returns 400 when feedback_text is empty string", async () => {
    const app = await buildTestApp({
      ANTHROPIC_API_KEY: "test-key",
    });
    const res = await app.inject({
      method: "POST",
      url: "/api/analyse-feedback",
      payload: { feedback_text: "" },
    });
    expect(res.statusCode).toBe(400);
    const body = res.json();
    expect(body.message).toContain("non-empty");
    expect(body.code).toBe("EMPTY_FEEDBACK_TEXT");
  });

  it("returns 400 when feedback_text is only whitespace", async () => {
    const app = await buildTestApp({
      ANTHROPIC_API_KEY: "test-key",
    });
    const res = await app.inject({
      method: "POST",
      url: "/api/analyse-feedback",
      payload: { feedback_text: "   \n\t  " },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().code).toBe("EMPTY_FEEDBACK_TEXT");
  });

});
