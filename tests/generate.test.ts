import { describe, expect, it, vi } from "vitest";
import { GenerationValidationError, generateTrainingPack, parseTrainingPack, type LlmClient } from "@/lib/generate";
import { QuizQuestionSchema, TrainingPackSchema } from "@/lib/schemas";

const question = (i: number) => ({
  question: `Question ${i}?`,
  options: ["A", "B", "C", "D"],
  correctIndex: 1,
  sourceStep: `Step ${i}: do the thing`,
  explanation: "Because the SOP says so.",
});

const validPack = () => ({
  module: {
    summary: "This SOP covers cleaning. Follow each step in order. Record results.",
    keySteps: ["Lock out", "Scrub", "Sanitize"],
    safetyWarnings: ["Wear gloves"],
    commonMistakes: ["Skipping rinse"],
  },
  quiz: [1, 2, 3, 4, 5].map(question),
});

/** Mock client that returns the queued replies in order and records calls. */
function mockClient(replies: (string | Error)[]) {
  const create = vi.fn(async () => {
    const next = replies.shift();
    if (next === undefined) throw new Error("no more replies queued");
    if (next instanceof Error) throw next;
    return { choices: [{ message: { content: next } }] };
  });
  return { client: { chat: { completions: { create } } } as LlmClient, create };
}

describe("schemas", () => {
  it("accepts a valid pack", () => {
    expect(TrainingPackSchema.safeParse(validPack()).success).toBe(true);
  });

  it("rejects a question without sourceStep", () => {
    const { sourceStep: _omit, ...rest } = question(1);
    void _omit;
    expect(QuizQuestionSchema.safeParse(rest).success).toBe(false);
    expect(QuizQuestionSchema.safeParse({ ...rest, sourceStep: "  " }).success).toBe(false);
  });

  it("enforces 5-8 questions, 4 options and a 3-sentence summary", () => {
    const few = { ...validPack(), quiz: [1, 2, 3].map(question) };
    const many = { ...validPack(), quiz: [1, 2, 3, 4, 5, 6, 7, 8, 9].map(question) };
    const badOptions = { ...validPack(), quiz: [1, 2, 3, 4, 5].map((i) => ({ ...question(i), options: ["A", "B"] })) };
    const p = validPack();
    const badSummary = { ...p, module: { ...p.module, summary: "Only one sentence." } };
    for (const bad of [few, many, badOptions, badSummary]) {
      expect(TrainingPackSchema.safeParse(bad).success).toBe(false);
    }
  });
});

describe("parseTrainingPack", () => {
  it("reports invalid JSON", () => {
    const r = parseTrainingPack("not json {");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.issues[0]).toMatch(/not valid JSON/);
  });

  it("strips markdown fences", () => {
    expect(parseTrainingPack("```json\n" + JSON.stringify(validPack()) + "\n```").ok).toBe(true);
  });

  it("names the offending path for a missing sourceStep", () => {
    const pack = validPack();
    // @ts-expect-error deliberately invalid
    delete pack.quiz[2].sourceStep;
    const r = parseTrainingPack(JSON.stringify(pack));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.issues.join("\n")).toContain("quiz.2.sourceStep");
  });
});

describe("generateTrainingPack", () => {
  it("returns on first valid response without retrying", async () => {
    const { client, create } = mockClient([JSON.stringify(validPack())]);
    const pack = await generateTrainingPack(client, "m", "sop text");
    expect(pack.quiz).toHaveLength(5);
    expect(create).toHaveBeenCalledTimes(1);
  });

  it("retries once with validation errors fed back, then succeeds", async () => {
    const bad = validPack();
    // @ts-expect-error deliberately invalid
    delete bad.quiz[0].sourceStep;
    const { client, create } = mockClient([JSON.stringify(bad), JSON.stringify(validPack())]);

    const pack = await generateTrainingPack(client, "m", "sop text");

    expect(pack.quiz).toHaveLength(5);
    expect(create).toHaveBeenCalledTimes(2);
    const retryMessages = (create.mock.calls[1] as unknown as [{ messages: { role: string; content: string }[] }])[0].messages;
    const feedback = retryMessages[retryMessages.length - 1];
    expect(feedback.role).toBe("user");
    expect(feedback.content).toContain("quiz.0.sourceStep");
    expect(retryMessages[retryMessages.length - 2]).toEqual({ role: "assistant", content: JSON.stringify(bad) });
  });

  it("retries after invalid JSON", async () => {
    const { client, create } = mockClient(["oops", JSON.stringify(validPack())]);
    await expect(generateTrainingPack(client, "m", "sop")).resolves.toBeDefined();
    expect(create).toHaveBeenCalledTimes(2);
  });

  it("fails gracefully after two invalid responses (no third call)", async () => {
    const { client, create } = mockClient(["nope", "still nope"]);
    const err = await generateTrainingPack(client, "m", "sop").catch((e) => e);
    expect(err).toBeInstanceOf(GenerationValidationError);
    expect((err as GenerationValidationError).message).toMatch(/failed validation/);
    expect((err as GenerationValidationError).issues.length).toBeGreaterThan(0);
    expect(create).toHaveBeenCalledTimes(2);
  });

  it("does not swallow transport errors", async () => {
    const { client, create } = mockClient([new Error("network down")]);
    await expect(generateTrainingPack(client, "m", "sop")).rejects.toThrow("network down");
    expect(create).toHaveBeenCalledTimes(1);
  });
});
