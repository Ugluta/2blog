export const AI_REQUEST_STATUSES = ["SUCCESS", "FAILED"] as const;
export type AiRequestStatus = (typeof AI_REQUEST_STATUSES)[number];

export interface AiRequest {
  id: string;
  userId: string;
  provider: string;
  promptKey: string | null;
  prompt: string;
  resultText: string | null;
  resultRef: string | null;
  tokensUsed: number | null;
  status: AiRequestStatus;
  errorMessage: string | null;
  createdAt: string;
}

export interface GenerateTextResponse {
  text: string;
  tokensUsed: number | null;
  provider: string;
  requestId: string;
}
