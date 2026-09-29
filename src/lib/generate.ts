import { TrainingPackSchema, formatZodIssues, type QuizQuestion, type TrainingPack } from "./schemas";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

/** The small slice of the OpenAI SDK we use; easy to mock in tests. */
export interface LlmClient {
  chat: {
    completions: {
      create(params: {
        model: string;
        messages: ChatMessage[];
        temperature?: number;
        response_format?: { type: "json_object" };
      }): Promise<{ choices: { message: { content: string | null } }[] }>;
    };
  };
}

/** The model never produced valid output (after the retry). Message is safe to show users. */
export class GenerationValidationError extends Error {
  constructor(
    message: string,
    public readonly issues: string[],
  ) {
    super(message);
    this.name = "GenerationValidationError";
  }
}

export const SYSTEM_PROMPT = `You are an expert manufacturing trainer. Turn the Standard Operating Procedure (SOP) supplied by the user into a training module and a quiz.
Respond with ONE JSON object only (no markdown fences, no commentary) with exactly this shape:
{
  "module": {
    "summary": "exactly 3 sentences",
    "keySteps": ["numbered-in-order key steps, each a short imperative string"],
    "safetyWarnings": ["..."],
    "commonMistakes": ["..."]
  },
  "quiz": [
    {
      "question": "...",
      "options": ["exactly 4 options"],
      "correctIndex": 0,
      "sourceStep": "the SOP step this question comes from, e.g. 'Step 4: Rinse with potable water'",
      "explanation": "1-2 sentences on why the answer is correct"
    }
  ]
}
Rules: 5 to 8 quiz questions; every question MUST have a non-empty sourceStep taken from the SOP; correctIndex is the 0-based index of the right option; base everything strictly on the SOP, do not invent requirements.`;

const MAX_ATTEMPTS = 2; // first try + one retry with validation errors fed back

function stripFences(text: string): string {
  const m = text.trim().match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return m ? m[1] : text.trim();
}

/** Parses + validates raw model text. Returns data or a list of problems. */
export function parseTrainingPack(
  raw: string | null | undefined,
): { ok: true; data: TrainingPack } | { ok: false; issues: string[] } {
  if (!raw || !raw.trim()) return { ok: false, issues: ["Response was empty."] };
  let json: unknown;
  try {
    json = JSON.parse(stripFences(raw));
  } catch (e) {
    return { ok: false, issues: [`Response was not valid JSON: ${(e as Error).message}`] };
  }
  const result = TrainingPackSchema.safeParse(json);
  return result.success
    ? { ok: true, data: result.data }
    : { ok: false, issues: formatZodIssues(result.error) };
}

/** Fisher-Yates shuffle of each question's options, remapping correctIndex. Returns a new pack. */
export function shuffleOptions(pack: TrainingPack, rng: () => number = Math.random): TrainingPack {
  const quiz = pack.quiz.map((q): QuizQuestion => {
    const order = q.options.map((_, i) => i);
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    return { ...q, options: order.map((i) => q.options[i]), correctIndex: order.indexOf(q.correctIndex) };
  });
  return { ...pack, quiz };
}

export async function generateTrainingPack(
  client: LlmClient,
  model: string,
  sopText: string,
  rng: () => number = Math.random,
): Promise<TrainingPack> {
  const messages: ChatMessage[] = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: `SOP:\n"""\n${sopText}\n"""` },
  ];
  let issues: string[] = [];

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const res = await client.chat.completions.create({
      model,
      messages,
      temperature: 0.2,
      response_format: { type: "json_object" },
    });
    const raw = res.choices[0]?.message?.content ?? "";
    const parsed = parseTrainingPack(raw);
    if (parsed.ok) return shuffleOptions(parsed.data, rng);

    issues = parsed.issues;
    messages.push(
      { role: "assistant", content: raw },
      {
        role: "user",
        content: `Your previous JSON was invalid. Fix these problems and return the complete corrected JSON object only:\n- ${issues.join("\n- ")}`,
      },
    );
  }

  throw new GenerationValidationError(
    "The AI returned a training pack that failed validation twice. Please try again, or shorten/clarify the SOP.",
    issues,
  );
}
