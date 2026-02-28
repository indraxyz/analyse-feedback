export interface FeedbackAnalysisRequest {
  feedback_text: string;
}

export type SentimentLabel = "positive" | "neutral" | "negative";

export interface AnalyseFeedbackResult {
  summary: string;
  sentiment: SentimentLabel;
  language: string;
}

export const feedbackAnalysisRequestSchema = {
  type: "object",
  required: ["feedback_text"],
  properties: {
    feedback_text: { type: "string" },
  },
  additionalProperties: false,
} as const;

export const analyseFeedbackResponseSchema = {
  type: "object",
  required: ["summary", "sentiment", "language"],
  properties: {
    summary: { type: "string" },
    sentiment: { type: "string", enum: ["positive", "neutral", "negative"] },
    language: {
      type: "string",
      description: "Detected language of the feedback, e.g. english, indonesian, japanese",
    },
  },
} as const;
