import type { GeneratedBrief } from "./types";

const STORAGE_KEY = "flyrank-brief-history";
const MAX_ITEMS = 20;

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function loadHistory(): GeneratedBrief[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as GeneratedBrief[]) : [];
  } catch {
    // Corrupt or foreign data in the slot — treat as empty rather than throw.
    return [];
  }
}

export function saveToHistory(entry: GeneratedBrief): GeneratedBrief[] {
  if (!isBrowser()) return [];
  const current = loadHistory();
  const next = [entry, ...current.filter((item) => item.id !== entry.id)].slice(0, MAX_ITEMS);
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage full or disabled (private browsing) — fail silently; history
    // is a convenience feature, not load-bearing for the core flow.
  }
  return next;
}

export function clearHistory(): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
