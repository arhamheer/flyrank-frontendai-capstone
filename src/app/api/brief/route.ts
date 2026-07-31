import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { BriefRequestSchema } from "@/lib/types";
import { generateBrief } from "@/lib/groq";
import { checkRateLimit } from "@/lib/rateLimit";

export const runtime = "nodejs";

function clientKey(req: NextRequest): string {
  // Best-effort client identity for the in-memory limiter. x-forwarded-for
  // is attacker-controllable, but this limiter's job is to smooth accidental
  // bursts from one browser tab, not to defend against a determined abuser —
  // see src/lib/rateLimit.ts for the documented tradeoff.
  const forwarded = req.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || "anonymous";
}

export async function POST(req: NextRequest) {
  const key = clientKey(req);
  const rateLimit = checkRateLimit(key);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        error: "rate_limited",
        message: "You've hit the request limit. Try again in a minute.",
        resetAt: rateLimit.resetAt,
      },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)) },
      },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "invalid_json", message: "Request body must be valid JSON." },
      { status: 400 },
    );
  }

  const parsed = BriefRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "validation_error",
        message: "Check the highlighted fields and try again.",
        fieldErrors: flattenZodError(parsed.error),
      },
      { status: 400 },
    );
  }

  try {
    const result = await generateBrief(parsed.data);
    return NextResponse.json(result, {
      headers: { "X-RateLimit-Remaining": String(rateLimit.remaining) },
    });
  } catch (error) {
    // generateBrief() already falls back internally on AI failures, so
    // reaching this branch means something unexpected happened (e.g. a bug
    // in the fallback path itself). Fail loudly rather than silently.
    console.error("[api/brief] unexpected failure", error);
    return NextResponse.json(
      {
        error: "internal_error",
        message: "Something went wrong generating your brief. Please try again.",
      },
      { status: 500 },
    );
  }
}

function flattenZodError(error: ZodError): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form";
    if (!fieldErrors[key]) fieldErrors[key] = issue.message;
  }
  return fieldErrors;
}
