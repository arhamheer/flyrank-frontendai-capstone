import { beforeEach, describe, expect, it } from "vitest";
import { checkRateLimit, resetRateLimitState } from "@/lib/rateLimit";

describe("checkRateLimit", () => {
  beforeEach(() => {
    resetRateLimitState();
  });

  it("allows requests under the limit", () => {
    const result = checkRateLimit("client-a", 1000);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(7);
  });

  it("blocks the request once the limit is exceeded within the window", () => {
    const now = 1000;
    for (let i = 0; i < 8; i++) {
      checkRateLimit("client-b", now);
    }
    const result = checkRateLimit("client-b", now + 500);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("resets the count after the window elapses", () => {
    const now = 1000;
    for (let i = 0; i < 8; i++) {
      checkRateLimit("client-c", now);
    }
    const blocked = checkRateLimit("client-c", now + 1000);
    expect(blocked.allowed).toBe(false);

    const afterWindow = checkRateLimit("client-c", now + 60_001);
    expect(afterWindow.allowed).toBe(true);
  });

  it("tracks separate clients independently", () => {
    for (let i = 0; i < 8; i++) {
      checkRateLimit("client-d", 1000);
    }
    const other = checkRateLimit("client-e", 1000);
    expect(other.allowed).toBe(true);
  });
});
