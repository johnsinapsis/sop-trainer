import { NextResponse } from "next/server";
import { z } from "zod";
import { GenerationValidationError, generateTrainingPack } from "@/lib/generate";
import { createLlmClient, getLlmConfig } from "@/lib/llm";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_SOP_CHARS = 20_000;
const BodySchema = z.object({ sop: z.string().trim().min(50, "SOP is too short (min 50 characters).").max(MAX_SOP_CHARS, `SOP is too long (max ${MAX_SOP_CHARS} characters).`) });

function fail(status: number, code: string, message: string, details?: string[]) {
  return NextResponse.json({ error: { code, message, details } }, { status });
}

export async function POST(req: Request) {
  const config = getLlmConfig();
  if (!config.apiKey) {
    return fail(503, "missing_api_key", "LLM_API_KEY is not set on the server. See the setup instructions.");
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail(400, "bad_request", "Request body must be JSON.");
  }
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return fail(400, "bad_request", parsed.error.issues[0]?.message ?? "Invalid request.");
  }

  try {
    const client = createLlmClient({ ...config, apiKey: config.apiKey });
    const pack = await generateTrainingPack(client, config.model, parsed.data.sop);
    return NextResponse.json(pack);
  } catch (e) {
    if (e instanceof GenerationValidationError) {
      return fail(502, "invalid_ai_output", e.message, e.issues);
    }
    console.error("LLM request failed:", e instanceof Error ? e.message : e);
    return fail(502, "llm_error", "The AI provider request failed. Check your key, base URL and model, then try again.");
  }
}
