"use client";

import { useEffect } from "react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app/error] unhandled render error:", error);
  }, [error]);

  return (
    <main className="mx-auto max-w-2xl px-4 py-16">
      <div role="alert" className="rounded-md border border-red-300 bg-red-50 p-6 text-red-900">
        <h1 className="text-lg font-semibold">Something went wrong</h1>
        <p className="mt-2 text-sm">
          The page hit an unexpected error. Your generated briefs are still saved in this
          browser&apos;s history.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-4 inline-flex items-center rounded-md border border-red-400 px-4 py-2 text-sm font-medium hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-600"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
