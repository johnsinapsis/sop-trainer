import type { Attempt } from "@/lib/history";

export function HistoryList({ attempts, onClear }: { attempts: Attempt[]; onClear: () => void }) {
  if (attempts.length === 0) return null;
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-semibold">Training history</h2>
        <button onClick={onClear} className="text-xs text-slate-500 underline hover:text-slate-800">
          Clear
        </button>
      </div>
      <ul className="divide-y divide-slate-100 text-sm">
        {attempts.map((a) => (
          <li key={a.id} className="flex items-center justify-between gap-3 py-2">
            <div className="min-w-0">
              <p className="truncate font-medium">{a.sopTitle}</p>
              <p className="text-xs text-slate-500">{new Date(a.date).toLocaleString()}</p>
            </div>
            <span
              className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                a.score / a.total >= 0.8 ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"
              }`}
            >
              {a.score}/{a.total}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
