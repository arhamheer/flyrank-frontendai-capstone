import { describe, expect, it } from "vitest";
import { BriefRequestSchema, BriefResponseSchema } from "@/lib/types";
import { buildFallbackBrief } from "@/lib/fallbackBrief";

describe("BriefRequestSchema", () => {
  it("accepts a minimal valid request", () => {
    const result = BriefRequestSchema.safeParse({
      keyword: "email marketing",
      contentType: "blog",
      tone: "professional",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a keyword shorter than 3 characters", () => {
    const result = BriefRequestSchema.safeParse({
      keyword: "ab",
      contentType: "blog",
      tone: "professional",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(["keyword"]);
    }
  });

  it("rejects a missing keyword entirely", () => {
    const result = BriefRequestSchema.safeParse({
      contentType: "blog",
      tone: "professional",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid contentType enum value", () => {
    const result = BriefRequestSchema.safeParse({
      keyword: "email marketing",
      contentType: "podcast",
      tone: "professional",
    });
    expect(result.success).toBe(false);
  });

  it("rejects notes over 1000 characters", () => {
    const result = BriefRequestSchema.safeParse({
      keyword: "email marketing",
      contentType: "blog",
      tone: "professional",
      notes: "a".repeat(1001),
    });
    expect(result.success).toBe(false);
  });

  it("trims whitespace from keyword", () => {
    const result = BriefRequestSchema.safeParse({
      keyword: "  email marketing  ",
      contentType: "blog",
      tone: "professional",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.keyword).toBe("email marketing");
    }
  });
});

describe("BriefResponseSchema", () => {
  it("validates a well-formed fallback brief for every content type", () => {
    for (const contentType of ["blog", "landing", "product", "guide"] as const) {
      const request = BriefRequestSchema.parse({
        keyword: "project management software",
        contentType,
        tone: "professional",
      });
      const brief = buildFallbackBrief(request);
      const result = BriefResponseSchema.safeParse(brief);
      expect(result.success, `contentType=${contentType}: ${JSON.stringify(result.success ? null : result.error?.issues)}`).toBe(true);
    }
  });

  it("rejects a brief missing required fields", () => {
    const result = BriefResponseSchema.safeParse({ primaryKeyword: "x" });
    expect(result.success).toBe(false);
  });

  it("rejects an outline section with an invalid level", () => {
    const request = BriefRequestSchema.parse({
      keyword: "project management software",
      contentType: "blog",
      tone: "professional",
    });
    const brief = buildFallbackBrief(request);
    const tampered = {
      ...brief,
      outline: [{ ...brief.outline[0], level: "h1" }, ...brief.outline.slice(1)],
    };
    const result = BriefResponseSchema.safeParse(tampered);
    expect(result.success).toBe(false);
  });
});
