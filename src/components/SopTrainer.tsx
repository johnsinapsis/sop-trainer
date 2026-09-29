"use client";

import { useEffect, useState } from "react";
import { clearHistory, deriveTitle, loadHistory, saveAttempt, type Attempt } from "@/lib/history";
import { SAMPLE_SOPS } from "@/lib/samples";
import type { TrainingPack } from "@/lib/schemas";
import { HistoryList } from "./HistoryList";
import { ModuleView } from "./ModuleView";
import { QuizView } from "./QuizView";
import { SetupNotice } from "./SetupNotice";

type Tab = "module" | "quiz";

export function SopTrainer() {
  const [sop, setSop] = useState("");
  const [title, setTitle] = useState("");
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{ message: string; details?: string[] } | null>(null);
  const [pack, setPack] = useState<TrainingPack | null>(null);
  const [tab, setTab] = useState<Tab>("module");
  const [history, setHistory] = useState<Attempt[]>([]);

  useEffect(() => {
    // localStorage is client-only, so history is loaded after mount (async to avoid sync setState in effect).
    Promise.resolve().then(() => setHistory(loadHistory()));
    fetch("/api/status")
      .then((r) => r.json())
      .then((s) => setConfigured(Boolean(s.configured)))
      .catch(() => setConfigured(null));
  }, []);

  async function onFile(file: File | undefined) {
    if (!file) return;
    if (!/\.(txt|md)$/i.test(file.name)) {
      setError({ message: "Please upload a .txt or .md file." });
      return;
    }
    setError(null);
    setSop(await file.text());
    setTitle(file.name.replace(/\.(txt|md)$/i, ""));
  }

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sop }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data?.error?.code === "missing_api_key") setConfigured(false);
        setError({ message: data?.error?.message ?? "Something went wrong.", details: data?.error?.details });
        return;
      }
      setPack(data as TrainingPack);
      setTab("module");
    } catch {
      setError({ message: "Could not reach the server. Check your connection and try again." });
    } finally {
      setLoading(false);
    }
  }

  function onFinish(score: number) {
    if (!pack) return;
    setHistory(
      saveAttempt({
        id: crypto.randomUUID(),
        sopTitle: title || deriveTitle(sop),
        score,
        total: pack.quiz.length,
        date: new Date().toISOString(),
      }),
    );
  }

  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:py-12">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">SOP Trainer</h1>
        <p className="mt-1 text-slate-600">Paste a Standard Operating Procedure and get a training module and quiz.</p>
      </header>

      {configured === false && <SetupNotice />}

      {!pack ? (
        <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex flex-wrap gap-2">
            <span className="self-center text-sm text-slate-500">Try a sample:</span>
            {SAMPLE_SOPS.map((s) => (
              <button
                key={s.id}
                onClick={() => {
                  setSop(s.text);
                  setTitle(s.title);
                  setError(null);
                }}
                className="rounded-full border border-slate-300 px-3 py-1 text-sm hover:bg-slate-50"
              >
                {s.title}
              </button>
            ))}
          </div>
          <textarea
            value={sop}
            onChange={(e) => {
              setSop(e.target.value);
              setTitle("");
            }}
            rows={12}
            placeholder="Paste your SOP here..."
            aria-label="SOP text"
            className="w-full rounded-lg border border-slate-300 p-3 font-mono text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <label className="cursor-pointer text-sm text-slate-600">
              <span className="mr-2 rounded-lg border border-slate-300 px-3 py-2 hover:bg-slate-50">Upload .txt / .md</span>
              <input type="file" accept=".txt,.md,text/plain,text/markdown" className="sr-only" onChange={(e) => onFile(e.target.files?.[0])} />
            </label>
            <button
              onClick={generate}
              disabled={loading || sop.trim().length < 50 || configured === false}
              className="rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {loading ? "Generating..." : "Generate training"}
            </button>
          </div>
          {error && (
            <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              <p className="font-medium">{error.message}</p>
              {error.details && error.details.length > 0 && (
                <ul className="mt-1 list-disc pl-5 text-xs">
                  {error.details.map((d, i) => (
                    <li key={i}>{d}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </section>
      ) : (
        <>
          <div className="flex items-center justify-between gap-3">
            <div role="tablist" className="inline-flex rounded-lg bg-slate-200 p-1 text-sm font-medium">
              {(["module", "quiz"] as const).map((t) => (
                <button
                  key={t}
                  role="tab"
                  aria-selected={tab === t}
                  onClick={() => setTab(t)}
                  className={`rounded-md px-4 py-1.5 ${tab === t ? "bg-white shadow-sm" : "text-slate-600"}`}
                >
                  {t === "module" ? "Training module" : `Quiz (${pack.quiz.length})`}
                </button>
              ))}
            </div>
            <button onClick={() => setPack(null)} className="text-sm text-slate-600 underline hover:text-slate-900">
              New SOP
            </button>
          </div>
          {tab === "module" ? <ModuleView module={pack.module} /> : <QuizView questions={pack.quiz} onFinish={onFinish} />}
        </>
      )}

      <HistoryList
        attempts={history}
        onClear={() => {
          clearHistory();
          setHistory([]);
        }}
      />
    </main>
  );
}
