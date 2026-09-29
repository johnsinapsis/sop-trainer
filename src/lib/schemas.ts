import { z } from "zod";

const nonEmpty = (what: string) =>
  z.string().trim().min(1, `${what} must not be empty`);

/** Rough sentence count; abbreviations like "e.g." are ignored. Deliberately approximate. */
export function countSentences(text: string): number {
  const cleaned = text.replace(/\b(e\.g|i\.e|etc|vs|approx|no|fig)\./gi, "$1");
  return (cleaned.match(/[.!?](\s|$)/g) ?? []).length;
}

export const TrainingModuleSchema = z.object({
  // The prompt asks for 3 sentences; accept 2-4 since counting is approximate.
  summary: nonEmpty("summary").refine((s) => {
    const n = countSentences(s);
    return n >= 2 && n <= 4;
  }, "summary must be 2-4 sentences (aim for 3)"),
  keySteps: z
    .array(nonEmpty("key step"))
    .min(3, "provide at least 3 key steps")
    .max(15),
  safetyWarnings: z.array(nonEmpty("safety warning")).min(1, "provide at least 1 safety warning"),
  commonMistakes: z.array(nonEmpty("common mistake")).min(1, "provide at least 1 common mistake"),
});

export const QuizQuestionSchema = z.object({
  question: nonEmpty("question"),
  options: z.array(nonEmpty("option")).length(4, "each question needs exactly 4 options"),
  correctIndex: z.number().int().min(0).max(3),
  sourceStep: nonEmpty("sourceStep"),
  explanation: nonEmpty("explanation"),
});

export const TrainingPackSchema = z.object({
  module: TrainingModuleSchema,
  quiz: z
    .array(QuizQuestionSchema)
    .min(5, "quiz needs at least 5 questions")
    .max(8, "quiz needs at most 8 questions"),
});

export type TrainingModule = z.infer<typeof TrainingModuleSchema>;
export type QuizQuestion = z.infer<typeof QuizQuestionSchema>;
export type TrainingPack = z.infer<typeof TrainingPackSchema>;

/** Human/LLM-readable list of validation problems, e.g. `quiz.2.sourceStep: ...`. */
export function formatZodIssues(error: z.ZodError): string[] {
  return error.issues.map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`);
}
