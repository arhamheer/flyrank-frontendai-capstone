"use client";

import { useEffect, useRef, useState } from "react";
import BriefForm from "@/components/BriefForm";
import BriefResult from "@/components/BriefResult";
import ErrorState from "@/components/ErrorState";
import LoadingState from "@/components/LoadingState";
import HistoryPanel from "@/components/HistoryPanel";
import { loadHistory, saveToHistory, clearHistory } from "@/lib/history";
import type { BriefRequest, GeneratedBrief } from "@/lib/types";

type Status = "idle" | "loading" | "success" | "error";

export default function Home() {
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<GeneratedBrief | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [history, setHistory] = useState<GeneratedBrief[]>([]);
  const [lastRequest, setLastRequest] = useState<BriefRequest | null>(null);

  const resultRef = useRef<HTMLDivElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Reads localStorage, which doesn't exist during SSR — loading it in an
    // effect (rather than a lazy useState initializer) keeps the server-
    // rendered and first client-rendered markup identical, avoiding a
    // hydration mismatch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHistory(loadHistory());
  }, []);

  useEffect(() => {
    if (status === "success") {
      resultRef.current?.focus();
    } else if (status === "error") {
      errorRef.current?.focus();
    }
  }, [status]);

  async function submitRequest(request: BriefRequest) {
    setLastRequest(request);
    setStatus("loading");
    setErrorMessage(null);
    setFieldErrors({});

    try {
      const response = await fetch("/api/brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.error === "validation_error" && data.fieldErrors) {
          setFieldErrors(data.fieldErrors);
          setErrorMessage(data.message ?? "Please fix the highlighted fields.");
        } else if (data.error === "rate_limited") {
          setErrorMessage(data.message ?? "You've hit the request limit. Try again shortly.");
        } else {
          setErrorMessage(data.message ?? "Something went wrong. Please try again.");
        }
        setStatus("error");
        return;
      }

      const entry = data as GeneratedBrief;
      setResult(entry);
      setHistory(saveToHistory(entry));
      setStatus("success");
    } catch {
      setErrorMessage("Couldn't reach the server. Check your connection and try again.");
      setStatus("error");
    }
  }

  function handleRetry() {
    if (lastRequest) {
      submitRequest(lastRequest);
    }
  }

  function handleSelectHistory(entry: GeneratedBrief) {
    setResult(entry);
    setStatus("success");
  }

  function handleClearHistory() {
    clearHistory();
    setHistory([]);
  }

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-blue-700 focus:px-4 focus:py-2 focus:text-white"
      >
        Skip to main content
      </a>

      <header className="border-b border-black/10 dark:border-white/10">
        <div className="mx-auto max-w-5xl px-4 py-6">
          <h1 className="text-xl font-bold">FlyBrief</h1>
          <p className="text-sm text-black/60 dark:text-white/60 mt-1">
            AI-assisted SEO content brief generator
          </p>
        </div>
      </header>

      <main id="main-content" className="mx-auto max-w-5xl px-4 py-8 w-full flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-10">
          <div className="space-y-8">
            <section aria-labelledby="form-heading">
              <h2 id="form-heading" className="sr-only">
                Generate a content brief
              </h2>
              <BriefForm onSubmit={submitRequest} disabled={status === "loading"} fieldErrors={fieldErrors} />
            </section>

            <section aria-labelledby="history-heading">
              <h2 id="history-heading" className="sr-only">
                Previously generated briefs
              </h2>
              <HistoryPanel
                items={history}
                activeId={result?.id}
                onSelect={handleSelectHistory}
                onClear={handleClearHistory}
              />
            </section>
          </div>

          <section aria-labelledby="result-heading" className="min-w-0">
            <h2 id="result-heading" className="sr-only">
              Generated brief
            </h2>

            {status === "loading" && <LoadingState />}

            {status === "error" && (
              <div ref={errorRef} tabIndex={-1} className="focus:outline-none">
                <ErrorState message={errorMessage ?? "Please try again."} onRetry={lastRequest ? handleRetry : undefined} />
              </div>
            )}

            {status === "success" && result && <BriefResult ref={resultRef} entry={result} />}

            {status === "idle" && (
              <div className="rounded-md border border-dashed border-black/20 dark:border-white/20 p-8 text-center text-black/65 dark:text-white/65">
                Fill in the form to generate your first content brief.
              </div>
            )}
          </section>
        </div>
      </main>

      <footer className="border-t border-black/10 dark:border-white/10">
        <div className="mx-auto max-w-5xl px-4 py-6 text-xs text-black/65 dark:text-white/65">
          FlyBrief is a FlyRank capstone project. Briefs are AI-assisted starting points — always
          apply editorial judgment before publishing.
        </div>
      </footer>
    </>
  );
}
