import { forwardRef } from "react";
import type { GeneratedBrief } from "@/lib/types";
import { briefFilename, briefToMarkdown } from "@/lib/markdown";

interface BriefResultProps {
  entry: GeneratedBrief;
}

const BriefResult = forwardRef<HTMLDivElement, BriefResultProps>(function BriefResult(
  { entry },
  ref,
) {
  const { brief, source, retried } = entry;

  function handleDownload() {
    const markdown = briefToMarkdown(entry);
    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = briefFilename(entry);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(briefToMarkdown(entry));
    } catch {
      // Clipboard API can be unavailable (older browsers, insecure context,
      // denied permission) — the download button remains a working fallback.
    }
  }

  return (
    <div ref={ref} tabIndex={-1} className="space-y-8 focus:outline-none">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/10 dark:border-white/10 pb-4">
        <div>
          <h2 className="text-2xl font-semibold">{brief.primaryKeyword}</h2>
          <p className="mt-1 text-sm text-black/60 dark:text-white/60">
            {brief.searchIntent} intent · ~{brief.estimatedWordCount.toLocaleString()} words
          </p>
        </div>
        <div className="flex items-center gap-2">
          {source === "fallback" ? (
            <span className="rounded-full bg-amber-100 dark:bg-amber-900/40 px-3 py-1 text-xs font-medium text-amber-900 dark:text-amber-200">
              Template fallback — AI was unavailable
            </span>
          ) : (
            <span className="rounded-full bg-green-100 dark:bg-green-900/40 px-3 py-1 text-xs font-medium text-green-900 dark:text-green-200">
              AI-generated{retried ? " (after retry)" : ""}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleDownload}
          className="rounded-md border border-black/20 dark:border-white/25 px-4 py-2 text-sm font-medium hover:bg-black/5 dark:hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600"
        >
          Download as Markdown
        </button>
        <button
          type="button"
          onClick={handleCopy}
          className="rounded-md border border-black/20 dark:border-white/25 px-4 py-2 text-sm font-medium hover:bg-black/5 dark:hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600"
        >
          Copy to clipboard
        </button>
      </div>

      <section aria-labelledby="brief-overview-heading" className="space-y-2">
        <h3 id="brief-overview-heading" className="text-lg font-semibold">
          Overview
        </h3>
        <p>{brief.audienceSummary}</p>
      </section>

      <section aria-labelledby="brief-keywords-heading" className="space-y-2">
        <h3 id="brief-keywords-heading" className="text-lg font-semibold">
          Secondary keywords
        </h3>
        <ul className="flex flex-wrap gap-2">
          {brief.secondaryKeywords.map((kw) => (
            <li
              key={kw}
              className="rounded-full bg-black/5 dark:bg-white/10 px-3 py-1 text-sm"
            >
              {kw}
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="brief-titles-heading" className="space-y-2">
        <h3 id="brief-titles-heading" className="text-lg font-semibold">
          Title options
        </h3>
        <ul className="list-disc pl-5 space-y-1">
          {brief.titleOptions.map((title) => (
            <li key={title}>{title}</li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="brief-meta-heading" className="space-y-2">
        <h3 id="brief-meta-heading" className="text-lg font-semibold">
          Meta descriptions
        </h3>
        <ul className="list-disc pl-5 space-y-1">
          {brief.metaDescriptions.map((meta) => (
            <li key={meta}>{meta}</li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="brief-outline-heading" className="space-y-3">
        <h3 id="brief-outline-heading" className="text-lg font-semibold">
          Outline
        </h3>
        <ol className="space-y-3">
          {brief.outline.map((section, index) => (
            <li key={`${section.heading}-${index}`} className="border-l-2 border-black/15 dark:border-white/20 pl-4">
              <p className="font-medium">
                <span className="uppercase text-xs text-black/65 dark:text-white/65 mr-2">
                  {section.level}
                </span>
                {section.heading}
              </p>
              <p className="text-sm text-black/70 dark:text-white/70 mt-0.5">{section.notes}</p>
              <p className="text-xs text-black/65 dark:text-white/65 mt-0.5">
                ~{section.targetWords} words
              </p>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="brief-paa-heading" className="space-y-2">
        <h3 id="brief-paa-heading" className="text-lg font-semibold">
          People Also Ask
        </h3>
        <ul className="list-disc pl-5 space-y-1">
          {brief.peopleAlsoAsk.map((q) => (
            <li key={q}>{q}</li>
          ))}
        </ul>
      </section>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <section aria-labelledby="brief-dos-heading" className="space-y-2">
          <h3 id="brief-dos-heading" className="text-lg font-semibold">
            Do
          </h3>
          <ul className="list-disc pl-5 space-y-1">
            {brief.contentDos.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="brief-donts-heading" className="space-y-2">
          <h3 id="brief-donts-heading" className="text-lg font-semibold">
            Don&apos;t
          </h3>
          <ul className="list-disc pl-5 space-y-1">
            {brief.contentDonts.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      </div>

      <section aria-labelledby="brief-links-heading" className="space-y-2">
        <h3 id="brief-links-heading" className="text-lg font-semibold">
          Internal linking ideas
        </h3>
        <ul className="list-disc pl-5 space-y-1">
          {brief.internalLinkingIdeas.map((idea) => (
            <li key={idea}>{idea}</li>
          ))}
        </ul>
      </section>
    </div>
  );
});

export default BriefResult;
