import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import BriefResult from "@/components/BriefResult";
import { buildFallbackBrief } from "@/lib/fallbackBrief";
import type { GeneratedBrief } from "@/lib/types";

const request = { keyword: "landing page copywriting", contentType: "landing", tone: "friendly" } as const;

function makeEntry(overrides: Partial<GeneratedBrief> = {}): GeneratedBrief {
  return {
    id: "entry-1",
    createdAt: "2026-01-01T00:00:00.000Z",
    source: "ai",
    request,
    brief: buildFallbackBrief(request),
    ...overrides,
  };
}

beforeEach(() => {
  vi.stubGlobal("URL", {
    ...URL,
    createObjectURL: vi.fn(() => "blob:mock"),
    revokeObjectURL: vi.fn(),
  });
});

describe("BriefResult", () => {
  it("has no detectable accessibility violations", async () => {
    const { container } = render(<BriefResult entry={makeEntry()} />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("renders the primary keyword as the main heading", () => {
    render(<BriefResult entry={makeEntry()} />);
    expect(screen.getByRole("heading", { level: 2, name: "landing page copywriting" })).toBeInTheDocument();
  });

  it("shows an AI-generated badge when source is ai", () => {
    render(<BriefResult entry={makeEntry({ source: "ai" })} />);
    expect(screen.getByText(/ai-generated/i)).toBeInTheDocument();
  });

  it("shows a fallback badge when source is fallback, so users know it's not AI output", () => {
    render(<BriefResult entry={makeEntry({ source: "fallback" })} />);
    expect(screen.getByText(/template fallback/i)).toBeInTheDocument();
  });

  it("indicates when the AI result came from a retry", () => {
    render(<BriefResult entry={makeEntry({ source: "ai", retried: true })} />);
    expect(screen.getByText(/after retry/i)).toBeInTheDocument();
  });

  it("renders every outline section", () => {
    const entry = makeEntry();
    render(<BriefResult entry={entry} />);
    const outline = screen.getByRole("heading", { name: /outline/i }).closest("section")!;
    for (const section of entry.brief.outline) {
      expect(within(outline).getByText(section.heading)).toBeInTheDocument();
    }
  });

  it("triggers a markdown file download without throwing", async () => {
    const user = userEvent.setup();
    render(<BriefResult entry={makeEntry()} />);
    await user.click(screen.getByRole("button", { name: /download as markdown/i }));
    expect(URL.createObjectURL).toHaveBeenCalled();
  });

  it("copies the brief to the clipboard", async () => {
    // userEvent.setup() installs its own navigator.clipboard stub, so ours
    // must be defined after setup() runs or it gets overwritten.
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });

    render(<BriefResult entry={makeEntry()} />);
    await user.click(screen.getByRole("button", { name: /copy to clipboard/i }));
    expect(writeText).toHaveBeenCalledTimes(1);
  });
});
