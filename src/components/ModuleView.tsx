import type { TrainingModule } from "@/lib/schemas";

function Section({ title, tone, children }: { title: string; tone: string; children: React.ReactNode }) {
  return (
    <section className={`rounded-xl border p-5 ${tone}`}>
      <h3 className="mb-3 text-base font-semibold">{title}</h3>
      {children}
    </section>
  );
}

export function ModuleView({ module: m }: { module: TrainingModule }) {
  return (
    <div className="space-y-4">
      <Section title="Summary" tone="border-slate-200 bg-white">
        <p className="leading-relaxed text-slate-700">{m.summary}</p>
      </Section>
      <Section title="Key steps" tone="border-slate-200 bg-white">
        <ol className="list-decimal space-y-2 pl-5 text-slate-700">
          {m.keySteps.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ol>
      </Section>
      <Section title="⚠ Safety warnings" tone="border-red-200 bg-red-50 text-red-900">
        <ul className="list-disc space-y-2 pl-5">
          {m.safetyWarnings.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ul>
      </Section>
      <Section title="Common mistakes" tone="border-amber-200 bg-amber-50 text-amber-900">
        <ul className="list-disc space-y-2 pl-5">
          {m.commonMistakes.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ul>
      </Section>
    </div>
  );
}
