import Groq, { APIError } from "groq-sdk";
import { randomUUID } from "crypto";
import { briefJsonSchema } from "./jsonSchema";
import { buildFallbackBrief } from "./fallbackBrief";
import { buildUserPrompt, SYSTEM_PROMPT } from "./prompt";
import { BriefResponseSchema, type BriefRequest, type GeneratedBrief } from "./types";

// Groq's response_format: json_schema (strict mode) is currently only
// supported by the openai/gpt-oss family — see
// https://console.groq.com/docs/structured-outputs. Other Groq models
// (e.g. llama-3.3-70b-versatile) reject the request with a 400.
const DEFAULT_MODEL = "openai/gpt-oss-120b";

function getClient(): Groq | null {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;
  return new Groq({ apiKey });
}

/** Strips ```json fences a model may add despite instructions not to. */
function extractJson(raw: string): string {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  return fenced ? fenced[1].trim() : trimmed;
}

async function callGroq(client: Groq, request: BriefRequest, retry: boolean) {
  const model = process.env.GROQ_MODEL?.trim() || DEFAULT_MODEL;

  const completion = await client.chat.completions.create({
    model,
    temperature: retry ? 0.3 : 0.5,
    max_tokens: 2048,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: buildUserPrompt(request, retry) },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "seo_content_brief",
        description: "A structured SEO content brief.",
        schema: briefJsonSchema,
        strict: true,
      },
    },
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Groq returned an empty response.");
  }

  const json = JSON.parse(extractJson(content));
  return BriefResponseSchema.parse(json);
}

/**
 * Generates a content brief with three layers of resilience:
 *  1. Groq call with strict JSON-schema structured output.
 *  2. One retry with a stricter prompt and lower temperature if (1) throws,
 *     returns malformed JSON, or fails zod validation.
 *  3. A deterministic, non-AI template if both attempts fail, so the user
 *     always gets a usable brief instead of an error page.
 */
export async function generateBrief(request: BriefRequest): Promise<GeneratedBrief> {
  const id = randomUUID();
  const createdAt = new Date().toISOString();
  const client = getClient();

  if (!client) {
    return {
      id,
      createdAt,
      source: "fallback",
      request,
      brief: buildFallbackBrief(request),
    };
  }

  try {
    const brief = await callGroq(client, request, false);
    return { id, createdAt, source: "ai", request, brief };
  } catch (firstError) {
    logGenerationError("first attempt", firstError);

    try {
      const brief = await callGroq(client, request, true);
      return { id, createdAt, source: "ai", request, brief, retried: true };
    } catch (secondError) {
      logGenerationError("retry", secondError);
      return {
        id,
        createdAt,
        source: "fallback",
        request,
        brief: buildFallbackBrief(request),
      };
    }
  }
}

function logGenerationError(stage: string, error: unknown) {
  if (error instanceof APIError) {
    console.error(`[groq] ${stage} failed: ${error.status} ${error.name} — ${error.message}`);
  } else if (error instanceof Error) {
    console.error(`[groq] ${stage} failed: ${error.message}`);
  } else {
    console.error(`[groq] ${stage} failed with unknown error`, error);
  }
}
