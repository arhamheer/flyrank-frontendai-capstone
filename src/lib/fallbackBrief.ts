import type { BriefRequest, BriefResponse } from "./types";

/**
 * Deterministic, template-based brief generator. No network call, no AI —
 * this is the safety net when Groq is unreachable, rate-limited, out of
 * quota, or returns output that fails schema validation twice in a row.
 * It guarantees the app always returns a usable brief instead of an error
 * page, at the cost of being generic rather than tailored.
 */
export function buildFallbackBrief(request: BriefRequest): BriefResponse {
  const { keyword, audience, contentType, tone } = request;
  const audienceLine = audience?.trim()
    ? audience.trim()
    : "readers actively searching for this topic";

  const capitalized = keyword.trim().replace(/\s+/g, " ");
  const titleCase = capitalized.replace(/\b\w/g, (c) => c.toUpperCase());

  const intentByType: Record<BriefRequest["contentType"], BriefResponse["searchIntent"]> = {
    blog: "informational",
    guide: "informational",
    landing: "commercial",
    product: "transactional",
  };

  return {
    primaryKeyword: capitalized,
    secondaryKeywords: [
      `${capitalized} guide`,
      `${capitalized} tips`,
      `best ${capitalized}`,
      `how to use ${capitalized}`,
    ],
    searchIntent: intentByType[contentType],
    audienceSummary: `Content should speak directly to ${audienceLine}. Match a ${tone} tone throughout and avoid jargon that would alienate a first-time reader.`,
    titleOptions: [
      `${titleCase}: The Complete Guide`,
      `${titleCase} — Everything You Need to Know`,
      `How to Get Started with ${titleCase}`,
    ],
    metaDescriptions: [
      `Learn everything about ${capitalized}, from the basics to advanced tactics, in this ${contentType} written for ${audienceLine}.`,
      `A practical, no-fluff breakdown of ${capitalized} — what it is, why it matters, and how to apply it.`,
    ],
    outline: [
      {
        level: "h2",
        heading: `What Is ${titleCase}?`,
        notes: `Define the term plainly for someone encountering it for the first time. Anchor the definition to why ${audienceLine} should care.`,
        targetWords: 200,
      },
      {
        level: "h2",
        heading: `Why ${titleCase} Matters`,
        notes: "Cover the concrete benefit or problem this solves. Use one real-world example.",
        targetWords: 250,
      },
      {
        level: "h2",
        heading: `How to Get Started with ${titleCase}`,
        notes: "Break this into a short numbered list of concrete steps.",
        targetWords: 350,
      },
      {
        level: "h3",
        heading: "Common Mistakes to Avoid",
        notes: "List 3-4 pitfalls beginners hit, each with a one-line fix.",
        targetWords: 200,
      },
      {
        level: "h2",
        heading: "Frequently Asked Questions",
        notes: "Answer the People Also Ask questions below directly, one per subheading.",
        targetWords: 250,
      },
    ],
    peopleAlsoAsk: [
      `What is ${capitalized}?`,
      `How does ${capitalized} work?`,
      `Is ${capitalized} worth it?`,
      `What are alternatives to ${capitalized}?`,
    ],
    contentDos: [
      `Open with the reader's problem before introducing ${capitalized}.`,
      "Use short paragraphs (2-3 sentences) and scannable subheadings.",
      "Back claims with a specific example, number, or source.",
    ],
    contentDonts: [
      "Don't bury the definition past the second paragraph.",
      "Don't stack more than one CTA in the same section.",
      "Don't use unexplained jargon without a plain-language gloss.",
    ],
    internalLinkingIdeas: [
      `Link to a comparison or "alternatives" page for ${capitalized}, if one exists.`,
      "Link to a beginner glossary or definitions page.",
      "Link to a related case study or customer story.",
    ],
    estimatedWordCount: 1250,
  };
}
