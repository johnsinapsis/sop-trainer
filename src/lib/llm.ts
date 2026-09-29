import OpenAI from "openai";
import type { LlmClient } from "./generate";

export const DEFAULT_BASE_URL = "https://api.groq.com/openai/v1";
export const DEFAULT_MODEL = "llama-3.3-70b-versatile";

export interface LlmConfig {
  apiKey?: string;
  baseURL: string;
  model: string;
}

/** Reads provider settings from env vars only. Server-side use. */
export function getLlmConfig(env: NodeJS.ProcessEnv = process.env): LlmConfig {
  return {
    apiKey: env.LLM_API_KEY?.trim() || undefined,
    baseURL: env.LLM_BASE_URL?.trim() || DEFAULT_BASE_URL,
    model: env.LLM_MODEL?.trim() || DEFAULT_MODEL,
  };
}

export function createLlmClient(config: LlmConfig & { apiKey: string }): LlmClient {
  return new OpenAI({ apiKey: config.apiKey, baseURL: config.baseURL }) as unknown as LlmClient;
}
