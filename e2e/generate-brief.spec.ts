import { test, expect } from "@playwright/test";

const MOCK_BRIEF_RESPONSE = {
  id: "e2e-fixture-1",
  createdAt: "2026-01-01T00:00:00.000Z",
  source: "ai",
  request: {
    keyword: "email marketing automation",
    contentType: "blog",
    tone: "professional",
  },
  brief: {
    primaryKeyword: "email marketing automation",
    secondaryKeywords: ["email drip campaigns", "marketing automation tools", "lead nurturing"],
    searchIntent: "informational",
    audienceSummary: "Marketers who want to automate repetitive email sequences.",
    titleOptions: [
      "Email Marketing Automation: The Complete Guide",
      "How Email Automation Saves Marketers 10 Hours a Week",
      "Email Marketing Automation 101",
    ],
    metaDescriptions: [
      "Learn how email marketing automation works, the tools to use, and how to set up your first drip campaign.",
    ],
    outline: [
      { level: "h2", heading: "What Is Email Marketing Automation?", notes: "Define it plainly.", targetWords: 200 },
      { level: "h2", heading: "Key Benefits", notes: "List 3 concrete benefits.", targetWords: 250 },
      { level: "h2", heading: "How to Set Up Your First Workflow", notes: "Step-by-step.", targetWords: 350 },
    ],
    peopleAlsoAsk: ["What is email automation?", "Is email automation worth it?"],
    contentDos: ["Use a real workflow example.", "Cite an open-rate benchmark."],
    contentDonts: ["Don't bury the definition.", "Don't overuse jargon."],
    internalLinkingIdeas: ["Link to a tool comparison page.", "Link to a case study."],
    estimatedWordCount: 1300,
  },
};

test.describe("Generate a content brief (happy path)", () => {
  test("fills the form, submits, and displays a structured brief", async ({ page }) => {
    await page.route("**/api/brief", async (route) => {
      await route.fulfill({ json: MOCK_BRIEF_RESPONSE });
    });

    await page.goto("/");
    await expect(page.getByRole("heading", { name: "FlyBrief" })).toBeVisible();

    await page.getByLabel(/target keyword/i).fill("email marketing automation");
    await page.getByLabel(/target audience/i).fill("B2B SaaS marketers");
    await page.getByLabel(/content type/i).selectOption("blog");
    await page.getByLabel(/tone/i).selectOption("professional");

    await page.getByRole("button", { name: /generate content brief/i }).click();

    const resultHeading = page.getByRole("heading", { level: 2, name: "email marketing automation" });
    await expect(resultHeading).toBeVisible();

    await expect(page.getByText(/ai-generated/i)).toBeVisible();
    await expect(page.getByRole("heading", { name: "Outline" })).toBeVisible();
    await expect(page.getByText("What Is Email Marketing Automation?")).toBeVisible();
    await expect(page.getByText("Is email automation worth it?")).toBeVisible();

    // Generated brief is saved to localStorage history.
    await expect(page.getByRole("heading", { name: "History" })).toBeVisible();
    await expect(
      page.getByRole("button", { name: /email marketing automation/i }),
    ).toBeVisible();
  });

  test("keyboard-only users can complete the full flow", async ({ page }) => {
    await page.route("**/api/brief", async (route) => {
      await route.fulfill({ json: MOCK_BRIEF_RESPONSE });
    });

    await page.goto("/");

    await page.getByLabel(/target keyword/i).focus();
    await page.keyboard.type("email marketing automation");
    await page.keyboard.press("Tab"); // audience
    await page.keyboard.press("Tab"); // content type
    await page.keyboard.press("Tab"); // tone
    await page.keyboard.press("Tab"); // notes
    await page.keyboard.press("Tab"); // submit button
    await expect(page.getByRole("button", { name: /generate content brief/i })).toBeFocused();
    await page.keyboard.press("Enter");

    await expect(
      page.getByRole("heading", { level: 2, name: "email marketing automation" }),
    ).toBeVisible();
  });
});
