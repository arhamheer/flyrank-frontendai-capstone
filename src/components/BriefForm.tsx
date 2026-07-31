"use client";

import { useId, useState, type FormEvent } from "react";
import { CONTENT_TYPES, TONES, type BriefRequest } from "@/lib/types";

interface BriefFormProps {
  onSubmit: (request: BriefRequest) => void;
  disabled: boolean;
  fieldErrors?: Record<string, string>;
}

const CONTENT_TYPE_LABELS: Record<(typeof CONTENT_TYPES)[number], string> = {
  blog: "Blog post",
  landing: "Landing page",
  product: "Product page",
  guide: "In-depth guide",
};

const TONE_LABELS: Record<(typeof TONES)[number], string> = {
  professional: "Professional",
  conversational: "Conversational",
  authoritative: "Authoritative",
  friendly: "Friendly",
};

export default function BriefForm({ onSubmit, disabled, fieldErrors = {} }: BriefFormProps) {
  const [keyword, setKeyword] = useState("");
  const [audience, setAudience] = useState("");
  const [contentType, setContentType] = useState<(typeof CONTENT_TYPES)[number]>("blog");
  const [tone, setTone] = useState<(typeof TONES)[number]>("professional");
  const [notes, setNotes] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  const keywordId = useId();
  const audienceId = useId();
  const contentTypeId = useId();
  const toneId = useId();
  const notesId = useId();
  const keywordErrorId = useId();

  const keywordError = localError ?? fieldErrors.keyword;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmed = keyword.trim();
    if (trimmed.length < 3) {
      setLocalError("Enter a keyword with at least 3 characters.");
      return;
    }
    setLocalError(null);

    onSubmit({
      keyword: trimmed,
      audience: audience.trim() || undefined,
      contentType,
      tone,
      notes: notes.trim() || undefined,
    });
  }

  return (
    <form onSubmit={handleSubmit} noValidate aria-busy={disabled} className="space-y-6">
      <div>
        <label htmlFor={keywordId} className="block text-sm font-medium mb-1">
          Target keyword <span aria-hidden="true">*</span>
          <span className="sr-only"> (required)</span>
        </label>
        <input
          id={keywordId}
          name="keyword"
          type="text"
          required
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          aria-invalid={Boolean(keywordError)}
          aria-describedby={keywordError ? keywordErrorId : undefined}
          placeholder="e.g. best project management software"
          className="w-full rounded-md border border-black/20 dark:border-white/25 bg-transparent px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
        />
        {keywordError && (
          <p id={keywordErrorId} role="alert" className="mt-1 text-sm text-red-700 dark:text-red-400">
            {keywordError}
          </p>
        )}
      </div>

      <div>
        <label htmlFor={audienceId} className="block text-sm font-medium mb-1">
          Target audience <span className="text-black/65 dark:text-white/65 font-normal">(optional)</span>
        </label>
        <input
          id={audienceId}
          name="audience"
          type="text"
          value={audience}
          onChange={(e) => setAudience(e.target.value)}
          placeholder="e.g. small business owners with no marketing team"
          className="w-full rounded-md border border-black/20 dark:border-white/25 bg-transparent px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor={contentTypeId} className="block text-sm font-medium mb-1">
            Content type
          </label>
          <select
            id={contentTypeId}
            name="contentType"
            value={contentType}
            onChange={(e) => setContentType(e.target.value as (typeof CONTENT_TYPES)[number])}
            className="w-full rounded-md border border-black/20 dark:border-white/25 bg-transparent px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
          >
            {CONTENT_TYPES.map((type) => (
              <option key={type} value={type}>
                {CONTENT_TYPE_LABELS[type]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor={toneId} className="block text-sm font-medium mb-1">
            Tone
          </label>
          <select
            id={toneId}
            name="tone"
            value={tone}
            onChange={(e) => setTone(e.target.value as (typeof TONES)[number])}
            className="w-full rounded-md border border-black/20 dark:border-white/25 bg-transparent px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
          >
            {TONES.map((t) => (
              <option key={t} value={t}>
                {TONE_LABELS[t]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor={notesId} className="block text-sm font-medium mb-1">
          Additional context <span className="text-black/65 dark:text-white/65 font-normal">(optional)</span>
        </label>
        <textarea
          id={notesId}
          name="notes"
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Competitor angles to beat, a specific product feature to highlight, constraints, etc."
          className="w-full rounded-md border border-black/20 dark:border-white/25 bg-transparent px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
        />
      </div>

      <button
        type="submit"
        disabled={disabled}
        className="inline-flex items-center justify-center rounded-md bg-blue-700 px-5 py-2.5 text-base font-medium text-white hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {disabled ? "Generating brief…" : "Generate content brief"}
      </button>
    </form>
  );
}
