import { describe, it, expect, vi, beforeEach } from "vitest";
import Fastify from "fastify";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import type { Env } from "../config/env.ts";
import { registerEnv } from "../config/env.ts";
import { registerAnalyseFeedbackRoute } from "./analyseFeedback.ts";
import {
  analyseFeedback,
  AnalyseFeedbackServiceError,
} from "../services/analyseFeedbackService.ts";

vi.mock("../services/analyseFeedbackService.ts", async (importOriginal) => {
  const mod = await importOriginal<typeof import("../services/analyseFeedbackService.ts")>();
  return {
    ...mod,
    analyseFeedback: vi.fn(),
  };
});

function getEnv(): Env {
  return {
    NODE_ENV: process.env.NODE_ENV ?? "development",
    PORT: process.env.PORT ?? "3000",
    HOST: process.env.HOST ?? "0.0.0.0",
    LOG_LEVEL: process.env.LOG_LEVEL ?? "info",
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY ?? "",
    ANTHROPIC_MODEL: process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-6",
    RATE_LIMIT_MAX: process.env.RATE_LIMIT_MAX ?? "60",
    RATE_LIMIT_TIME_WINDOW_MS: process.env.RATE_LIMIT_TIME_WINDOW_MS ?? "60000",
  };
}

async function buildTestApp(envOverrides: Partial<Record<string, string>> = {}) {
  const originalEnv = process.env;
  process.env = { ...originalEnv, ...envOverrides };
  const app = Fastify({ logger: false });
  await registerEnv(app);
  await app.register(cors, { origin: true });
  await app.register(rateLimit, { max: 100, timeWindow: 60000 });
  await registerAnalyseFeedbackRoute(app, getEnv());
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
  beforeEach(() => {
    vi.mocked(analyseFeedback).mockReset();
  });

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

  it("returns 503 when ANTHROPIC_API_KEY is not configured", async () => {
    const app = await buildTestApp({
      ANTHROPIC_API_KEY: "",
    });
    const res = await app.inject({
      method: "POST",
      url: "/api/analyse-feedback",
      payload: { feedback_text: "The app is great, would recommend." },
    });
    expect(res.statusCode).toBe(503);
    const body = res.json();
    expect(body.code).toBe("API_KEY_MISSING");
    expect(body.message).toContain("ANTHROPIC_API_KEY");
    expect(analyseFeedback).not.toHaveBeenCalled();
  });

  it("returns 200 with summary and sentiment when payload is valid", async () => {
    vi.mocked(analyseFeedback).mockResolvedValue({
      summary: "Customer is satisfied with the product.",
      sentiment: "positive",
    });
    const app = await buildTestApp({ ANTHROPIC_API_KEY: "test-key" });
    const payload = { feedback_text: "Great product, fast delivery!" };
    const res = await app.inject({
      method: "POST",
      url: "/api/analyse-feedback",
      payload,
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body).toHaveProperty("summary", "Customer is satisfied with the product.");
    expect(body).toHaveProperty("sentiment", "positive");
    expect(analyseFeedback).toHaveBeenCalledOnce();
    expect(analyseFeedback).toHaveBeenCalledWith(
      payload.feedback_text,
      expect.objectContaining({
        apiKey: "test-key",
        model: expect.any(String),
      })
    );
  });

  it("returns 502 when AI service fails", async () => {
    vi.mocked(analyseFeedback).mockRejectedValue(
      new AnalyseFeedbackServiceError("API error", "ANTHROPIC_ERROR")
    );
    const app = await buildTestApp({ ANTHROPIC_API_KEY: "test-key" });
    const res = await app.inject({
      method: "POST",
      url: "/api/analyse-feedback",
      payload: { feedback_text: "Mixed experience." },
    });
    expect(res.statusCode).toBe(502);
    const body = res.json();
    expect(body.code).toBe("AI_SERVICE_ERROR");
  });
});
