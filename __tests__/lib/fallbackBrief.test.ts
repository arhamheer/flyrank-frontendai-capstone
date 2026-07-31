import { describe, expect, it } from "vitest";
import { buildFallbackBrief } from "@/lib/fallbackBrief";
import { BriefResponseSchema, type BriefRequest } from "@/lib/types";

const baseRequest: BriefRequest = {
  keyword: "content marketing strategy",
  contentType: "blog",
  tone: "conversational",
};

describe("buildFallbackBrief", () => {
  it("produces schema-valid output", () => {
    const brief = buildFallbackBrief(baseRequest);
    expect(() => BriefResponseSchema.parse(brief)).not.toThrow();
  });

  it("is deterministic for the same input", () => {
    const first = buildFallbackBrief(baseRequest);
    const second = buildFallbackBrief(baseRequest);
    expect(first).toEqual(second);
  });

  it("incorporates the keyword into the primary output fields", () => {
    const brief = buildFallbackBrief(baseRequest);
    expect(brief.primaryKeyword).toBe("content marketing strategy");
    expect(brief.titleOptions.some((t) => t.toLowerCase().includes("content marketing strategy"))).toBe(true);
  });

  it("maps contentType to a sensible search intent", () => {
    expect(
      buildFallbackBrief({ ...baseRequest, contentType: "product" }).searchIntent,
    ).toBe("transactional");
    expect(
      buildFallbackBrief({ ...baseRequest, contentType: "landing" }).searchIntent,
    ).toBe("commercial");
    expect(
      buildFallbackBrief({ ...baseRequest, contentType: "blog" }).searchIntent,
    ).toBe("informational");
  });

  it("falls back to a generic audience description when none is provided", () => {
    const brief = buildFallbackBrief(baseRequest);
    expect(brief.audienceSummary.length).toBeGreaterThan(0);
  });

  it("uses the provided audience when given", () => {
    const brief = buildFallbackBrief({ ...baseRequest, audience: "freelance writers" });
    expect(brief.audienceSummary).toContain("freelance writers");
  });

  it("never produces an empty outline", () => {
    const brief = buildFallbackBrief(baseRequest);
    expect(brief.outline.length).toBeGreaterThanOrEqual(3);
  });
});
