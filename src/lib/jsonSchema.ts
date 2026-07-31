import { SEARCH_INTENTS } from "./types";

/**
 * Raw JSON Schema mirroring BriefResponseSchema (src/lib/types.ts), written by
 * hand rather than derived from zod. Groq's `strict: true` structured-output
 * mode only supports a subset of JSON Schema (no minLength/maxLength/minItems
 * — see platform.claude.com-style structured-output docs for the equivalent
 * OpenAI-style constraint list Groq inherits). Runtime bounds are enforced by
 * zod in BriefResponseSchema after parsing, not here.
 */
export const briefJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    primaryKeyword: { type: "string" },
    secondaryKeywords: {
      type: "array",
      items: { type: "string" },
    },
    searchIntent: { type: "string", enum: [...SEARCH_INTENTS] },
    audienceSummary: { type: "string" },
    titleOptions: {
      type: "array",
      items: { type: "string" },
    },
    metaDescriptions: {
      type: "array",
      items: { type: "string" },
    },
    outline: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          level: { type: "string", enum: ["h2", "h3"] },
          heading: { type: "string" },
          notes: { type: "string" },
          targetWords: { type: "integer" },
        },
        required: ["level", "heading", "notes", "targetWords"],
      },
    },
    peopleAlsoAsk: {
      type: "array",
      items: { type: "string" },
    },
    contentDos: {
      type: "array",
      items: { type: "string" },
    },
    contentDonts: {
      type: "array",
      items: { type: "string" },
    },
    internalLinkingIdeas: {
      type: "array",
      items: { type: "string" },
    },
    estimatedWordCount: { type: "integer" },
  },
  required: [
    "primaryKeyword",
    "secondaryKeywords",
    "searchIntent",
    "audienceSummary",
    "titleOptions",
    "metaDescriptions",
    "outline",
    "peopleAlsoAsk",
    "contentDos",
    "contentDonts",
    "internalLinkingIdeas",
    "estimatedWordCount",
  ],
} as const;
