import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import HistoryPanel from "@/components/HistoryPanel";
import { buildFallbackBrief } from "@/lib/fallbackBrief";
import type { GeneratedBrief } from "@/lib/types";

function makeEntry(id: string, keyword: string): GeneratedBrief {
  const request = { keyword, contentType: "blog", tone: "professional" } as const;
  return {
    id,
    createdAt: "2026-01-01T00:00:00.000Z",
    source: "ai",
    request,
    brief: buildFallbackBrief(request),
  };
}

describe("HistoryPanel", () => {
  it("shows an empty-state message with no items", () => {
    render(<HistoryPanel items={[]} onSelect={vi.fn()} onClear={vi.fn()} />);
    expect(screen.getByText(/will appear here/i)).toBeInTheDocument();
  });

  it("has no detectable accessibility violations with items present", async () => {
    const items = [makeEntry("1", "seo tools"), makeEntry("2", "keyword research")];
    const { container } = render(<HistoryPanel items={items} onSelect={vi.fn()} onClear={vi.fn()} />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("lists each entry's primary keyword", () => {
    const items = [makeEntry("1", "seo tools"), makeEntry("2", "keyword research")];
    render(<HistoryPanel items={items} onSelect={vi.fn()} onClear={vi.fn()} />);
    expect(screen.getByText("seo tools")).toBeInTheDocument();
    expect(screen.getByText("keyword research")).toBeInTheDocument();
  });

  it("calls onSelect with the clicked entry", async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    const items = [makeEntry("1", "seo tools")];
    render(<HistoryPanel items={items} onSelect={onSelect} onClear={vi.fn()} />);

    await user.click(screen.getByText("seo tools"));
    expect(onSelect).toHaveBeenCalledWith(items[0]);
  });

  it("calls onClear when Clear is clicked", async () => {
    const onClear = vi.fn();
    const user = userEvent.setup();
    render(<HistoryPanel items={[makeEntry("1", "seo tools")]} onSelect={vi.fn()} onClear={onClear} />);

    await user.click(screen.getByRole("button", { name: /clear/i }));
    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it("marks the active entry with aria-current", () => {
    const items = [makeEntry("1", "seo tools"), makeEntry("2", "keyword research")];
    render(<HistoryPanel items={items} activeId="2" onSelect={vi.fn()} onClear={vi.fn()} />);

    expect(screen.getByRole("button", { name: /keyword research/i })).toHaveAttribute(
      "aria-current",
      "true",
    );
    expect(screen.getByRole("button", { name: /^seo tools/i })).not.toHaveAttribute("aria-current");
  });
});
