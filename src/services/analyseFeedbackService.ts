import { Anthropic } from "@anthropic-ai/sdk";
import type { AnalyseFeedbackResult, SentimentLabel } from "../models/feedback.ts";

const SENTIMENTS: SentimentLabel[] = ["positive", "neutral", "negative"];

const SYSTEM_PROMPT = `You are a feedback analyst. Given customer feedback text (in any language), you must:
1. If the feedback is not in English, mentally translate it to English for analysis.
2. Produce a short summary in English (1-3 sentences).
3. Classify sentiment as exactly one of: positive, neutral, negative.

Respond ONLY with valid JSON in this exact shape, no markdown or extra text:
{"summary": "your summary in English", "sentiment": "positive"|"neutral"|"negative"}`;

export interface AnalyseFeedbackDeps {
  apiKey: string;
  model: string;
}

export class AnalyseFeedbackServiceError extends Error {
  constructor(
    message: string,
    public readonly code: "ANTHROPIC_ERROR" | "INVALID_RESPONSE"
  ) {
    super(message);
    this.name = "AnalyseFeedbackServiceError";
  }
}

function parseResponse(text: string): AnalyseFeedbackResult {
  const trimmed = text.trim().replace(/^```json\s*|\s*```$/g, "").trim();
  const parsed = JSON.parse(trimmed) as unknown;
  if (
    typeof parsed !== "object" ||
    parsed === null ||
    typeof (parsed as Record<string, unknown>).summary !== "string" ||
    !SENTIMENTS.includes((parsed as Record<string, unknown>).sentiment as SentimentLabel)
  ) {
    throw new AnalyseFeedbackServiceError(
      "AI response did not contain valid summary and sentiment",
      "INVALID_RESPONSE"
    );
  }
  return {
    summary: (parsed as { summary: string }).summary,
    sentiment: (parsed as { sentiment: SentimentLabel }).sentiment,
  };
}

export async function analyseFeedback(
  feedbackText: string,
  deps: AnalyseFeedbackDeps
): Promise<AnalyseFeedbackResult> {
  const client = new Anthropic({ apiKey: deps.apiKey });

  try {
    const message = await client.messages.create({
      model: deps.model,
      max_tokens: 512,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Analyse this feedback and respond with JSON only:\n\n${feedbackText}`,
        },
      ],
    });

    type ContentBlock = { type: string; text?: string };
    const block = message.content.find(
      (b: ContentBlock) => b.type === "text"
    );
    if (!block || block.type !== "text" || typeof block.text !== "string") {
      throw new AnalyseFeedbackServiceError(
        "No text in AI response",
        "INVALID_RESPONSE"
      );
    }

    return parseResponse(block.text);
  } catch (err) {
    if (err instanceof AnalyseFeedbackServiceError) throw err;
    if (err instanceof SyntaxError) {
      throw new AnalyseFeedbackServiceError(
        "AI response was not valid JSON",
        "INVALID_RESPONSE"
      );
    }
    const message = err instanceof Error ? err.message : "Unknown error";
    throw new AnalyseFeedbackServiceError(
      `Anthropic API error: ${message}`,
      "ANTHROPIC_ERROR"
    );
  }
}
