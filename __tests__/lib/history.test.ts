import { beforeEach, describe, expect, it } from "vitest";
import { clearHistory, loadHistory, saveToHistory } from "@/lib/history";
import type { GeneratedBrief } from "@/lib/types";
import { buildFallbackBrief } from "@/lib/fallbackBrief";

function makeEntry(id: string): GeneratedBrief {
  const request = { keyword: `keyword ${id}`, contentType: "blog", tone: "professional" } as const;
  return {
    id,
    createdAt: new Date().toISOString(),
    source: "fallback",
    request,
    brief: buildFallbackBrief(request),
  };
}

describe("history storage", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("returns an empty array when nothing is stored", () => {
    expect(loadHistory()).toEqual([]);
  });

  it("saves and reloads an entry", () => {
    saveToHistory(makeEntry("1"));
    const loaded = loadHistory();
    expect(loaded).toHaveLength(1);
    expect(loaded[0].id).toBe("1");
  });

  it("puts the newest entry first", () => {
    saveToHistory(makeEntry("1"));
    saveToHistory(makeEntry("2"));
    const loaded = loadHistory();
    expect(loaded.map((e) => e.id)).toEqual(["2", "1"]);
  });

  it("deduplicates by id, moving the re-saved entry to the front", () => {
    saveToHistory(makeEntry("1"));
    saveToHistory(makeEntry("2"));
    saveToHistory(makeEntry("1"));
    const loaded = loadHistory();
    expect(loaded.map((e) => e.id)).toEqual(["1", "2"]);
  });

  it("caps history at 20 entries", () => {
    for (let i = 0; i < 25; i++) {
      saveToHistory(makeEntry(String(i)));
    }
    expect(loadHistory()).toHaveLength(20);
  });

  it("clears all stored history", () => {
    saveToHistory(makeEntry("1"));
    clearHistory();
    expect(loadHistory()).toEqual([]);
  });

  it("returns an empty array instead of throwing on corrupt data", () => {
    window.localStorage.setItem("flyrank-brief-history", "{not valid json");
    expect(loadHistory()).toEqual([]);
  });
});
