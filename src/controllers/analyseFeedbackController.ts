import type { FastifyRequest, FastifyReply } from "fastify";
import { analyseFeedback } from "../services/analyseFeedbackService.js";
import type { Env } from "../config/env.js";
import type { FeedbackAnalysisRequest } from "../models/feedback.js";
import { AnalyseFeedbackServiceError } from "../services/analyseFeedbackService.js";

const EMPTY_TEXT_MSG = "feedback_text must be a non-empty string";

function isEmptyText(value: unknown): boolean {
  if (typeof value !== "string") return true;
  return value.trim().length === 0;
}

export async function handleAnalyseFeedback(
  request: FastifyRequest<{ Body: FeedbackAnalysisRequest }>,
  reply: FastifyReply,
  env: Env
): Promise<void> {
  const { feedback_text } = request.body;

  if (isEmptyText(feedback_text)) {
    await reply.status(400).send({
      error: "Bad Request",
      message: EMPTY_TEXT_MSG,
      code: "EMPTY_FEEDBACK_TEXT",
    });
    return;
  }

  try {
    const result = await analyseFeedback(feedback_text, {
      apiKey: env.ANTHROPIC_API_KEY,
      model: env.ANTHROPIC_MODEL,
    });
    await reply.status(200).send(result);
  } catch (err) {
    if (err instanceof AnalyseFeedbackServiceError) {
      if (err.code === "ANTHROPIC_ERROR") {
        request.log.error(
          { err, message: err.message },
          "Anthropic API error in analyse-feedback"
        );
        await reply.status(502).send({
          error: "Bad Gateway",
          message: "AI service temporarily unavailable",
          code: "AI_SERVICE_ERROR",
        });
        return;
      }
      await reply.status(502).send({
        error: "Bad Gateway",
        message: "Invalid response from AI service",
        code: "AI_RESPONSE_ERROR",
      });
      return;
    }
    request.log.error({ err }, "Unexpected error in analyse-feedback");
    await reply.status(500).send({
      error: "Internal Server Error",
      message: "An unexpected error occurred",
      code: "INTERNAL_ERROR",
    });
  }
}
