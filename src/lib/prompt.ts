import type { BriefRequest } from "./types";

export const SYSTEM_PROMPT = `You are a senior SEO content strategist producing content briefs for professional writers. You write briefs that are specific to the keyword and audience given — never generic filler. Every heading, question, and recommendation must be something a writer could act on without further research. Return output that matches the provided JSON schema exactly.`;

export function buildUserPrompt(request: BriefRequest, retry = false): string {
  const { keyword, audience, contentType, tone, notes } = request;

  const lines = [
    `Create an SEO content brief for the target keyword: "${keyword.trim()}".`,
    `Content type: ${contentType}.`,
    `Desired tone: ${tone}.`,
  ];

  if (audience?.trim()) {
    lines.push(`Target audience: ${audience.trim()}.`);
  }

  if (notes?.trim()) {
    lines.push(`Additional context from the requester: ${notes.trim()}`);
  }

  lines.push(
    "",
    "Requirements:",
    "- secondaryKeywords: 3-6 realistic related keyword phrases (not just the primary keyword with one word swapped).",
    "- titleOptions: 3 distinct, click-worthy titles under 60 characters.",
    "- metaDescriptions: 2 options, each under 155 characters.",
    "- outline: 4-8 sections mixing h2 and h3, each with a one-sentence writing note and a realistic target word count.",
    "- peopleAlsoAsk: 3-6 real questions a searcher would type, phrased as questions.",
    "- contentDos / contentDonts: concrete, specific to this topic — not generic writing advice.",
    "- internalLinkingIdeas: 2-4 plausible internal link targets (described, not URLs).",
    "- estimatedWordCount: a realistic total for this content type and topic depth.",
  );

  if (retry) {
    lines.push(
      "",
      "Return ONLY a single JSON object matching the schema. No markdown code fences, no commentary before or after the JSON.",
    );
  }

  return lines.join("\n");
}
