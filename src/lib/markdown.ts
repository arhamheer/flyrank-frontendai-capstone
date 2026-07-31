import type { GeneratedBrief } from "./types";

export function briefToMarkdown(entry: GeneratedBrief): string {
  const { brief, request, createdAt, source } = entry;
  const lines: string[] = [];

  lines.push(`# Content Brief: ${brief.primaryKeyword}`);
  lines.push("");
  lines.push(
    `_Generated ${new Date(createdAt).toLocaleString()} · ${
      source === "ai" ? "AI-generated" : "Template fallback"
    } · ${request.contentType} · ${request.tone} tone_`,
  );
  lines.push("");

  lines.push("## Overview");
  lines.push(`- **Search intent:** ${brief.searchIntent}`);
  lines.push(`- **Estimated word count:** ${brief.estimatedWordCount}`);
  lines.push(`- **Audience:** ${brief.audienceSummary}`);
  lines.push("");

  lines.push("## Secondary Keywords");
  brief.secondaryKeywords.forEach((k) => lines.push(`- ${k}`));
  lines.push("");

  lines.push("## Title Options");
  brief.titleOptions.forEach((t) => lines.push(`- ${t}`));
  lines.push("");

  lines.push("## Meta Descriptions");
  brief.metaDescriptions.forEach((m) => lines.push(`- ${m}`));
  lines.push("");

  lines.push("## Outline");
  brief.outline.forEach((section) => {
    const prefix = section.level === "h2" ? "##" : "###";
    lines.push(`${prefix} ${section.heading}`);
    lines.push(`_${section.notes} (~${section.targetWords} words)_`);
    lines.push("");
  });

  lines.push("## People Also Ask");
  brief.peopleAlsoAsk.forEach((q) => lines.push(`- ${q}`));
  lines.push("");

  lines.push("## Do");
  brief.contentDos.forEach((d) => lines.push(`- ${d}`));
  lines.push("");

  lines.push("## Don't");
  brief.contentDonts.forEach((d) => lines.push(`- ${d}`));
  lines.push("");

  lines.push("## Internal Linking Ideas");
  brief.internalLinkingIdeas.forEach((i) => lines.push(`- ${i}`));
  lines.push("");

  return lines.join("\n");
}

export function briefFilename(entry: GeneratedBrief): string {
  const slug = entry.brief.primaryKeyword
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return `content-brief-${slug || "untitled"}.md`;
}
