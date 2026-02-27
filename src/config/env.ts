import { fastifyEnv } from "@fastify/env";
import type { FastifyInstance } from "fastify";

const envSchema = {
  type: "object",
  required: [],
  properties: {
    NODE_ENV: { type: "string", default: "development" },
    PORT: { type: "string", default: "3000" },
    HOST: { type: "string", default: "0.0.0.0" },
    ANTHROPIC_API_KEY: { type: "string", default: "" },
    ANTHROPIC_MODEL: { type: "string", default: "claude-sonnet-4-6" },
    RATE_LIMIT_MAX: { type: "string", default: "60" },
    RATE_LIMIT_TIME_WINDOW_MS: { type: "string", default: "60000" },
  },
} as const;

export interface Env {
  NODE_ENV: string;
  PORT: string;
  HOST: string;
  ANTHROPIC_API_KEY: string;
  ANTHROPIC_MODEL: string;
  RATE_LIMIT_MAX: string;
  RATE_LIMIT_TIME_WINDOW_MS: string;
}

export function parseRateLimitConfig(env: Env): {
  max: number;
  timeWindow: number;
} {
  return {
    max: parseInt(env.RATE_LIMIT_MAX, 10) || 60,
    timeWindow: parseInt(env.RATE_LIMIT_TIME_WINDOW_MS, 10) || 60000,
  };
}

export async function registerEnv(app: FastifyInstance): Promise<void> {
  await app.register(fastifyEnv, {
    schema: envSchema,
    dotenv: true,
  });
}
