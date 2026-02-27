import type { FastifyInstance } from "fastify";
import type { Env } from "../config/env.js";
import { handleAnalyseFeedback } from "../controllers/analyseFeedbackController.js";
import {
  feedbackAnalysisRequestSchema,
  analyseFeedbackResponseSchema,
} from "../models/feedback.js";

export async function registerAnalyseFeedbackRoute(
  app: FastifyInstance,
  env: Env
): Promise<void> {
  app.post<{
    Body: { feedback_text: string };
    Reply: { summary: string; sentiment: string };
  }>(
    "/api/analyse-feedback",
    {
      schema: {
        description:
          "Submit customer feedback text (any language). Returns an English summary and sentiment (positive, neutral, or negative) via Anthropic Claude.",
        tags: ["Feedback"],
        body: feedbackAnalysisRequestSchema,
        response: {
          200: analyseFeedbackResponseSchema,
          400: {
            description: "Missing or empty feedback_text",
            type: "object",
            properties: {
              error: { type: "string" },
              message: { type: "string" },
              code: { type: "string" },
            },
          },
          429: {
            description: "Rate limit exceeded",
            type: "object",
            properties: {
              error: { type: "string" },
              message: { type: "string" },
              code: { type: "string" },
            },
          },
          502: {
            description: "AI service error or invalid response",
            type: "object",
            properties: {
              error: { type: "string" },
              message: { type: "string" },
              code: { type: "string" },
            },
          },
        },
      },
    },
    (request, reply) => handleAnalyseFeedback(request, reply, env)
  );
}
