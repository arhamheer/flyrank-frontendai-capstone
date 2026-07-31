import { test, expect } from "@playwright/test";

test.describe("Error states", () => {
  test("shows a client-side validation error without calling the API", async ({ page }) => {
    let apiCalled = false;
    await page.route("**/api/brief", async (route) => {
      apiCalled = true;
      await route.continue();
    });

    await page.goto("/");
    await page.getByLabel(/target keyword/i).fill("ab");
    await page.getByRole("button", { name: /generate content brief/i }).click();

    await expect(page.getByRole("main").getByRole("alert")).toContainText(/at least 3 characters/i);
    expect(apiCalled).toBe(false);
  });

  test("shows a retryable error state when the server returns 500", async ({ page }) => {
    await page.route("**/api/brief", async (route) => {
      await route.fulfill({
        status: 500,
        json: { error: "internal_error", message: "Something went wrong generating your brief. Please try again." },
      });
    });

    await page.goto("/");
    await page.getByLabel(/target keyword/i).fill("email marketing automation");
    await page.getByRole("button", { name: /generate content brief/i }).click();

    const errorRegion = page.getByRole("main").getByRole("alert");
    await expect(errorRegion).toContainText(/something went wrong/i);
    await expect(page.getByRole("button", { name: /try again/i })).toBeVisible();
  });

  test("shows a rate-limit-specific message on 429", async ({ page }) => {
    await page.route("**/api/brief", async (route) => {
      await route.fulfill({
        status: 429,
        json: { error: "rate_limited", message: "You've hit the request limit. Try again in a minute." },
      });
    });

    await page.goto("/");
    await page.getByLabel(/target keyword/i).fill("email marketing automation");
    await page.getByRole("button", { name: /generate content brief/i }).click();

    await expect(page.getByRole("main").getByRole("alert")).toContainText(/request limit/i);
  });

  test("recovers from a network failure and lets the user retry", async ({ page }) => {
    let attempt = 0;
    await page.route("**/api/brief", async (route) => {
      attempt += 1;
      if (attempt === 1) {
        await route.abort("failed");
        return;
      }
      await route.fulfill({
        json: {
          id: "retry-success",
          createdAt: new Date().toISOString(),
          source: "fallback",
          request: { keyword: "email marketing automation", contentType: "blog", tone: "professional" },
          brief: {
            primaryKeyword: "email marketing automation",
            secondaryKeywords: ["a", "b"],
            searchIntent: "informational",
            audienceSummary: "Marketers.",
            titleOptions: ["Title A", "Title B"],
            metaDescriptions: ["A description."],
            outline: [{ level: "h2", heading: "Intro", notes: "Note.", targetWords: 100 }],
            peopleAlsoAsk: ["Q1?", "Q2?"],
            contentDos: ["Do 1", "Do 2"],
            contentDonts: ["Don't 1", "Don't 2"],
            internalLinkingIdeas: ["Link idea"],
            estimatedWordCount: 900,
          },
        },
      });
    });

    await page.goto("/");
    await page.getByLabel(/target keyword/i).fill("email marketing automation");
    await page.getByRole("button", { name: /generate content brief/i }).click();

    await expect(page.getByRole("main").getByRole("alert")).toContainText(/couldn't reach the server/i);

    await page.getByRole("button", { name: /try again/i }).click();

    await expect(
      page.getByRole("heading", { level: 2, name: "email marketing automation" }),
    ).toBeVisible();
    await expect(page.getByText(/template fallback/i)).toBeVisible();
  });
});
