import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BriefResponseSchema, type BriefRequest } from "@/lib/types";

const { createMock } = vi.hoisted(() => ({ createMock: vi.fn() }));

vi.mock("groq-sdk", () => {
  class MockAPIError extends Error {
    status: number;
    constructor(message: string, status = 500) {
      super(message);
      this.name = "APIError";
      this.status = status;
    }
  }

  class MockGroq {
    chat = { completions: { create: createMock } };
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- signature must match the real Groq constructor
    constructor(opts: { apiKey: string }) {}
  }

  return { default: MockGroq, APIError: MockAPIError };
});

const request: BriefRequest = {
  keyword: "email automation software",
  contentType: "blog",
  tone: "professional",
};

const validBriefJson = JSON.stringify({
  primaryKeyword: "email automation software",
  secondaryKeywords: ["email automation", "marketing automation", "drip campaigns"],
  searchIntent: "informational",
  audienceSummary: "Marketers evaluating automation tools.",
  titleOptions: ["Title One", "Title Two", "Title Three"],
  metaDescriptions: ["A description under 155 characters that summarizes the article well."],
  outline: [
    { level: "h2", heading: "What Is Email Automation?", notes: "Define it.", targetWords: 200 },
    { level: "h2", heading: "Key Benefits", notes: "List benefits.", targetWords: 250 },
    { level: "h2", heading: "How to Choose a Tool", notes: "Comparison criteria.", targetWords: 300 },
  ],
  peopleAlsoAsk: ["What is email automation?", "Is email automation worth it?"],
  contentDos: ["Use a real example.", "Cite a benchmark stat."],
  contentDonts: ["Don't bury the definition.", "Don't overuse jargon."],
  internalLinkingIdeas: ["Link to a comparison page.", "Link to a case study."],
  estimatedWordCount: 1400,
});

function mockCompletion(content: string | null) {
  return { choices: [{ message: { content } }] };
}

describe("generateBrief", () => {
  const originalKey = process.env.GROQ_API_KEY;

  beforeEach(() => {
    createMock.mockReset();
    process.env.GROQ_API_KEY = "test-key";
  });

  afterEach(() => {
    process.env.GROQ_API_KEY = originalKey;
  });

  it("returns an AI-sourced brief on the first successful call", async () => {
    createMock.mockResolvedValueOnce(mockCompletion(validBriefJson));

    const { generateBrief } = await import("@/lib/groq");
    const result = await generateBrief(request);

    expect(result.source).toBe("ai");
    expect(result.retried).toBeUndefined();
    expect(createMock).toHaveBeenCalledTimes(1);
    expect(() => BriefResponseSchema.parse(result.brief)).not.toThrow();
  });

  it("strips markdown code fences before parsing", async () => {
    createMock.mockResolvedValueOnce(mockCompletion(`\`\`\`json\n${validBriefJson}\n\`\`\``));

    const { generateBrief } = await import("@/lib/groq");
    const result = await generateBrief(request);

    expect(result.source).toBe("ai");
  });

  it("retries once on malformed JSON and succeeds", async () => {
    createMock
      .mockResolvedValueOnce(mockCompletion("this is not json"))
      .mockResolvedValueOnce(mockCompletion(validBriefJson));

    const { generateBrief } = await import("@/lib/groq");
    const result = await generateBrief(request);

    expect(result.source).toBe("ai");
    expect(result.retried).toBe(true);
    expect(createMock).toHaveBeenCalledTimes(2);
  });

  it("falls back to the deterministic template after two failed attempts", async () => {
    createMock
      .mockRejectedValueOnce(new Error("network error"))
      .mockRejectedValueOnce(new Error("network error again"));

    const { generateBrief } = await import("@/lib/groq");
    const result = await generateBrief(request);

    expect(result.source).toBe("fallback");
    expect(createMock).toHaveBeenCalledTimes(2);
    expect(() => BriefResponseSchema.parse(result.brief)).not.toThrow();
  });

  it("falls back when the response violates the schema twice", async () => {
    const invalid = JSON.stringify({ primaryKeyword: "x" });
    createMock
      .mockResolvedValueOnce(mockCompletion(invalid))
      .mockResolvedValueOnce(mockCompletion(invalid));

    const { generateBrief } = await import("@/lib/groq");
    const result = await generateBrief(request);

    expect(result.source).toBe("fallback");
  });

  it("uses the fallback immediately when no API key is configured", async () => {
    delete process.env.GROQ_API_KEY;

    const { generateBrief } = await import("@/lib/groq");
    const result = await generateBrief(request);

    expect(result.source).toBe("fallback");
    expect(createMock).not.toHaveBeenCalled();
  });
});
