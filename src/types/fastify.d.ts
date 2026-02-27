import type { Env } from "../config/env.js";

declare module "fastify" {
  interface FastifyInstance {
    config: Env;
  }
}
