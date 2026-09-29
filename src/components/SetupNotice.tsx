export function SetupNotice() {
  return (
    <div role="alert" className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
      <p className="font-semibold">AI provider not configured</p>
      <ol className="mt-2 list-decimal space-y-1 pl-5">
        <li>
          Get a free key at{" "}
          <a className="underline" href="https://console.groq.com/keys" target="_blank" rel="noreferrer">
            console.groq.com/keys
          </a>
          .
        </li>
        <li>
          Copy <code className="rounded bg-amber-100 px-1">.env.example</code> to{" "}
          <code className="rounded bg-amber-100 px-1">.env.local</code> and set{" "}
          <code className="rounded bg-amber-100 px-1">LLM_API_KEY</code>.
        </li>
        <li>Restart <code className="rounded bg-amber-100 px-1">npm run dev</code>.</li>
      </ol>
      <p className="mt-2">
        Optional: <code>LLM_BASE_URL</code> and <code>LLM_MODEL</code> select any OpenAI-compatible provider.
      </p>
    </div>
  );
}
