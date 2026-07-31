import { z } from "zod";

export const CONTENT_TYPES = ["blog", "landing", "product", "guide"] as const;
export const TONES = [
  "professional",
  "conversational",
  "authoritative",
  "friendly",
] as const;
export const SEARCH_INTENTS = [
  "informational",
  "commercial",
  "transactional",
  "navigational",
] as const;

export type ContentType = (typeof CONTENT_TYPES)[number];
export type Tone = (typeof TONES)[number];

export const BriefRequestSchema = z.object({
  keyword: z
    .string()
    .trim()
    .min(3, "Keyword must be at least 3 characters.")
    .max(120, "Keyword must be under 120 characters."),
  audience: z
    .string()
    .trim()
    .max(200, "Audience must be under 200 characters.")
    .optional()
    .or(z.literal("")),
  contentType: z.enum(CONTENT_TYPES),
  tone: z.enum(TONES),
  notes: z
    .string()
    .trim()
    .max(1000, "Notes must be under 1000 characters.")
    .optional()
    .or(z.literal("")),
});

export type BriefRequest = z.infer<typeof BriefRequestSchema>;

const OutlineSectionSchema = z.object({
  level: z.enum(["h2", "h3"]),
  heading: z.string().min(1).max(160),
  notes: z.string().min(1).max(400),
  targetWords: z.number().int().min(50).max(2000),
});

export const BriefResponseSchema = z.object({
  primaryKeyword: z.string().min(1).max(120),
  secondaryKeywords: z.array(z.string().min(1).max(80)).min(2).max(8),
  searchIntent: z.enum(SEARCH_INTENTS),
  audienceSummary: z.string().min(1).max(400),
  titleOptions: z.array(z.string().min(1).max(120)).min(2).max(4),
  metaDescriptions: z.array(z.string().min(1).max(170)).min(1).max(3),
  outline: z.array(OutlineSectionSchema).min(3).max(14),
  peopleAlsoAsk: z.array(z.string().min(1).max(200)).min(2).max(8),
  contentDos: z.array(z.string().min(1).max(200)).min(2).max(6),
  contentDonts: z.array(z.string().min(1).max(200)).min(2).max(6),
  internalLinkingIdeas: z.array(z.string().min(1).max(200)).min(1).max(6),
  estimatedWordCount: z.number().int().min(300).max(6000),
});

export type BriefResponse = z.infer<typeof BriefResponseSchema>;
export type OutlineSection = z.infer<typeof OutlineSectionSchema>;

/** Metadata attached to a generated brief describing how it was produced. */
export type BriefSource = "ai" | "fallback";

export interface GeneratedBrief {
  id: string;
  createdAt: string;
  source: BriefSource;
  request: BriefRequest;
  brief: BriefResponse;
  /** Present only when source is "ai" and a retry happened before success. */
  retried?: boolean;
}
