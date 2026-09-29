"use client";

import { useState } from "react";
import type { QuizQuestion } from "@/lib/schemas";

interface Props {
  questions: QuizQuestion[];
  onFinish: (score: number) => void;
}

export function QuizView({ questions, onFinish }: Props) {
  const [answers, setAnswers] = useState<(number | null)[]>(() => questions.map(() => null));
  const [submitted, setSubmitted] = useState(false);

  const score = answers.filter((a, i) => a === questions[i].correctIndex).length;
  const allAnswered = answers.every((a) => a !== null);

  function submit() {
    setSubmitted(true);
    onFinish(score);
  }

  function reset() {
    setAnswers(questions.map(() => null));
    setSubmitted(false);
  }

  return (
    <div className="space-y-4">
      {questions.map((q, qi) => {
        const chosen = answers[qi];
        const correct = chosen === q.correctIndex;
        return (
          <fieldset key={qi} className="rounded-xl border border-slate-200 bg-white p-5" disabled={submitted}>
            <legend className="px-1 text-sm font-medium text-slate-500">Question {qi + 1}</legend>
            <p className="mb-3 font-medium">{q.question}</p>
            <div className="space-y-2">
              {q.options.map((opt, oi) => {
                let style = "border-slate-200 hover:bg-slate-50";
                if (submitted && oi === q.correctIndex) style = "border-green-500 bg-green-50";
                else if (submitted && oi === chosen) style = "border-red-400 bg-red-50";
                else if (chosen === oi) style = "border-blue-500 bg-blue-50";
                return (
                  <label key={oi} className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm ${style}`}>
                    <input
                      type="radio"
                      name={`q${qi}`}
                      className="mt-0.5"
                      checked={chosen === oi}
                      onChange={() => setAnswers((a) => a.map((v, i) => (i === qi ? oi : v)))}
                    />
                    <span>{opt}</span>
                  </label>
                );
              })}
            </div>
            {submitted && (
              <div className={`mt-3 rounded-lg p-3 text-sm ${correct ? "bg-green-100 text-green-900" : "bg-red-100 text-red-900"}`}>
                <p className="font-semibold">{correct ? "Correct" : `Incorrect - answer: ${q.options[q.correctIndex]}`}</p>
                <p className="mt-1">{q.explanation}</p>
                <p className="mt-1 text-xs opacity-80">
                  <span className="font-semibold">SOP source:</span> {q.sourceStep}
                </p>
              </div>
            )}
          </fieldset>
        );
      })}

      {submitted ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-lg font-semibold">
            Score: {score} / {questions.length}{" "}
            <span className="text-sm font-normal text-slate-500">({Math.round((score / questions.length) * 100)}%)</span>
          </p>
          <button onClick={reset} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50">
            Retake quiz
          </button>
        </div>
      ) : (
        <button
          onClick={submit}
          disabled={!allAnswered}
          className="w-full rounded-lg bg-blue-600 px-4 py-3 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 sm:w-auto"
        >
          Submit answers {allAnswered ? "" : `(${answers.filter((a) => a !== null).length}/${questions.length})`}
        </button>
      )}
    </div>
  );
}
