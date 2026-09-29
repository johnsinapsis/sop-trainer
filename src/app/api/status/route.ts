import { NextResponse } from "next/server";
import { getLlmConfig } from "@/lib/llm";

export const dynamic = "force-dynamic";

/** Tells the UI whether the server is configured. Never returns the key. */
export function GET() {
  const { apiKey, baseURL, model } = getLlmConfig();
  return NextResponse.json({ configured: Boolean(apiKey), baseURL, model });
}
