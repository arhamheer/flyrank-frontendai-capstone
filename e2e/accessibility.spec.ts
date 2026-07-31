import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const MOCK_BRIEF_RESPONSE = {
  id: "a11y-fixture",
  createdAt: "2026-01-01T00:00:00.000Z",
  source: "ai",
  request: { keyword: "email marketing automation", contentType: "blog", tone: "professional" },
  brief: {
    primaryKeyword: "email marketing automation",
    secondaryKeywords: ["a", "b", "c"],
    searchIntent: "informational",
    audienceSummary: "Marketers who want to automate repetitive email sequences.",
    titleOptions: ["Title A", "Title B", "Title C"],
    metaDescriptions: ["A description under 155 characters."],
    outline: [
      { level: "h2", heading: "What Is It?", notes: "Define it.", targetWords: 200 },
      { level: "h3", heading: "A Subsection", notes: "Detail.", targetWords: 150 },
    ],
    peopleAlsoAsk: ["Q1?", "Q2?"],
    contentDos: ["Do 1", "Do 2"],
    contentDonts: ["Don't 1", "Don't 2"],
    internalLinkingIdeas: ["Link idea"],
    estimatedWordCount: 1200,
  },
};

test.describe("Accessibility (axe-core, WCAG 2.1 AA)", () => {
  test("idle landing page has no WCAG 2.1 A/AA violations", async ({ page }) => {
    await page.goto("/");
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
  });

  test("result view (after generating a brief) has no WCAG 2.1 A/AA violations", async ({ page }) => {
    await page.route("**/api/brief", async (route) => {
      await route.fulfill({ json: MOCK_BRIEF_RESPONSE });
    });

    await page.goto("/");
    await page.getByLabel(/target keyword/i).fill("email marketing automation");
    await page.getByRole("button", { name: /generate content brief/i }).click();
    await expect(page.getByRole("heading", { level: 2, name: "email marketing automation" })).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
  });

  test("validation error state has no WCAG 2.1 A/AA violations", async ({ page }) => {
    await page.goto("/");
    await page.getByLabel(/target keyword/i).fill("ab");
    await page.getByRole("button", { name: /generate content brief/i }).click();
    await expect(page.getByRole("main").getByRole("alert")).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
  });
});
