import { beforeEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/brief/route";
import { resetRateLimitState } from "@/lib/rateLimit";

function makeRequest(body: unknown, ip = "203.0.113.1") {
  return new NextRequest("http://localhost/api/brief", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-forwarded-for": ip },
    body: JSON.stringify(body),
  });
}

const validPayload = {
  keyword: "customer onboarding software",
  contentType: "blog",
  tone: "professional",
};

describe("POST /api/brief", () => {
  beforeEach(() => {
    resetRateLimitState();
    delete process.env.GROQ_API_KEY; // deterministic fallback path — no network call
  });

  it("returns a generated brief for a valid request", async () => {
    const response = await POST(makeRequest(validPayload));
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.brief.primaryKeyword).toBe("customer onboarding software");
    expect(data.source).toBe("fallback");
  });

  it("returns 400 with field errors for an invalid request", async () => {
    const response = await POST(makeRequest({ keyword: "ab", contentType: "blog", tone: "professional" }));
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe("validation_error");
    expect(data.fieldErrors.keyword).toBeDefined();
  });

  it("returns 400 for a malformed JSON body", async () => {
    const request = new NextRequest("http://localhost/api/brief", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-forwarded-for": "203.0.113.2" },
      body: "{not json",
    });
    const response = await POST(request);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe("invalid_json");
  });

  it("returns 400 for an invalid enum value", async () => {
    const response = await POST(
      makeRequest({ keyword: "customer onboarding software", contentType: "podcast", tone: "professional" }),
    );
    expect(response.status).toBe(400);
  });

  it("rate-limits a client after repeated requests", async () => {
    const ip = "203.0.113.9";
    let lastResponse;
    for (let i = 0; i < 9; i++) {
      lastResponse = await POST(makeRequest(validPayload, ip));
    }
    expect(lastResponse!.status).toBe(429);
    const data = await lastResponse!.json();
    expect(data.error).toBe("rate_limited");
    expect(lastResponse!.headers.get("Retry-After")).toBeTruthy();
  });

  it("does not rate-limit a different client", async () => {
    for (let i = 0; i < 8; i++) {
      await POST(makeRequest(validPayload, "203.0.113.10"));
    }
    const response = await POST(makeRequest(validPayload, "203.0.113.11"));
    expect(response.status).toBe(200);
  });
});
