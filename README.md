# FlyBrief — AI SEO Content Brief Generator

**Live URL:** _add your deployed URL here after you deploy (see [Deployment](#deployment))_
**Repository:** https://github.com/arhamheer/flyrank-frontendai-capstone

## Project Brief

FlyBrief turns a target keyword into an editor-ready SEO content brief — search intent,
secondary keywords, title and meta-description options, a heading-by-heading outline
with word-count targets, People Also Ask questions, and concrete do/don't guidance —
in seconds instead of the 20–30 minutes a content strategist normally spends manually
researching and structuring one. It's built for content marketers, freelance SEO
writers, and small marketing teams who need a consistent starting point for every
piece of content without a dedicated strategist on every project. I chose this over a
generic chatbot because it forces the AI to do something a plain text box can't:
produce a *strictly structured, schema-validated* deliverable that plugs directly into
an existing content workflow, with a real fallback path when the AI is unavailable —
not just a wrapper around "ask an LLM a question."

## Table of Contents

- [Quick Start](#quick-start)
- [Architecture](#architecture)
- [AI Integration](#ai-integration)
- [Testing](#testing)
- [Performance & Accessibility](#performance--accessibility)
- [Deployment](#deployment)
- [Known Limitations & Future Improvements](#known-limitations--future-improvements)
- [Reflection](#reflection)

---

## Quick Start

Requires Node.js 20+.

```bash
git clone https://github.com/arhamheer/flyrank-frontendai-capstone.git
cd flyrank-frontendai-capstone
npm install
cp .env.example .env.local   # optional — see below
npm run dev
```

Open http://localhost:3000. That's it — **the app works with zero configuration.**
Without a `GROQ_API_KEY`, every brief comes from the deterministic template generator
(`src/lib/fallbackBrief.ts`) instead of the AI, so you can run and demo the whole app,
UI, and error states without any API key.

To get AI-generated (not template) briefs:

1. Create a free account at [console.groq.com](https://console.groq.com/keys) and
   generate an API key (Groq's free tier is generous and requires no credit card).
2. Put it in `.env.local`:
   ```
   GROQ_API_KEY=gsk_your_key_here
   ```
3. Restart `npm run dev`.

### All commands

```bash
npm run dev            # start the dev server
npm run build           # production build
npm run start            # run the production build locally
npm run lint              # ESLint
npx tsc --noEmit           # type check
npm run test               # unit + integration tests (Vitest)
npm run test:coverage       # same, with a coverage report
npm run test:e2e             # end-to-end tests (Playwright, real Chrome)
```

---

## Architecture

```
src/
  app/
    page.tsx              Main page — owns request/response state, wires form → API → result
    layout.tsx             Root layout, metadata
    error.tsx               Next.js error boundary (crash fallback UI)
    api/brief/route.ts       POST /api/brief — validates, rate-limits, calls the AI, returns JSON
  components/
    BriefForm.tsx           Accessible input form (labels, aria-describedby, live validation)
    BriefResult.tsx          Renders a generated brief; download-as-Markdown, copy-to-clipboard
    ErrorState.tsx            role="alert" error panel with retry
    LoadingState.tsx           role="status" busy indicator
    HistoryPanel.tsx            Recent-briefs list, backed by localStorage
  lib/
    types.ts                 zod schemas for the request and the AI's structured response
    jsonSchema.ts              Hand-written JSON Schema mirror of types.ts, for Groq's strict mode
    groq.ts                    The AI client: call → validate → retry → fallback (see below)
    fallbackBrief.ts             Deterministic, non-AI brief generator (the safety net)
    prompt.ts                     System + user prompt construction
    rateLimit.ts                   In-memory per-IP sliding-window limiter
    history.ts                      localStorage read/write for the "recent briefs" panel
    markdown.ts                      Brief → downloadable Markdown
__tests__/                    Vitest unit + integration tests (mirrors src/ structure)
e2e/                           Playwright end-to-end tests, incl. real-browser axe-core scans
docs/evidence/                  Saved, real command output — coverage, e2e run, Lighthouse, axe
```

**Request flow:** `BriefForm` collects and client-side-validates input → `page.tsx`
`fetch`es `POST /api/brief` → the route re-validates with zod, checks the rate limiter,
then calls `generateBrief()` → the result (AI-sourced or fallback-sourced, the client
can always tell which) is rendered by `BriefResult` and saved to `localStorage` history.

**Why this split:** `page.tsx` owns all state so every component below it is a plain,
easily-testable function of props — `BriefForm`, `BriefResult`, `ErrorState`, and
`HistoryPanel` don't know about `fetch`, loading state, or each other. That's what
made isolated unit tests for every component possible without mocking the network in
each one.

---

## AI Integration

**Provider:** [Groq](https://groq.com) (`groq-sdk`), **not** a plain chat completion —
here's specifically what that means and why.

### The prompt

Two-part prompt in `src/lib/prompt.ts`:

- **System prompt** sets the persona ("senior SEO content strategist") and a hard
  constraint: never produce generic filler, everything must be actionable without
  further research.
- **User prompt** is built from the form fields (keyword, audience, content type, tone,
  free-text notes) plus an explicit field-by-field spec of what "good" looks like for
  each part of the schema (e.g. "titleOptions: 3 distinct, click-worthy titles under 60
  characters" — not just "give me some titles").

### Why not a plain chat call

1. **Forced structured output, not hope-it's-JSON.** The request sets
   `response_format: { type: "json_schema", json_schema: { schema, strict: true } }`
   (Groq's structured-output mode — see `src/lib/jsonSchema.ts` for the schema, hand
   -written to match the zod schema in `types.ts`). This is a model-level constraint,
   not a "please respond in JSON" instruction that the model can ignore.
2. **Independent runtime validation.** Even with strict mode, the response is parsed
   and re-validated against the zod schema (`BriefResponseSchema.parse(...)` in
   `groq.ts`) before it's ever shown to a user. Strict mode plus zod is defense in
   depth — either one alone is not something I'd trust in production.
3. **A real retry strategy, not a blind one.** If the first call throws, returns
   unparsable JSON, or fails zod validation, `generateBrief()` retries **once** with a
   stricter, more explicit prompt and a lower `temperature` (0.5 → 0.3) — the theory
   being that most failures are the model wandering off-format under a looser prompt,
   which a more constrained retry usually fixes.
4. **A deterministic fallback that's actually useful, not an error page.** If both AI
   attempts fail — no API key, Groq is down, rate-limited, whatever — `generateBrief()`
   returns a brief from `buildFallbackBrief()`, a template-based generator that fills
   in the same schema using the keyword and form inputs. The UI shows a visible
   "Template fallback — AI was unavailable" badge (`BriefResult.tsx`) rather than
   silently passing off a generic brief as AI output. **The user never hits a dead
   end** — see `docs/evidence/playwright-output.txt` for the automated test that
   exercises this exact path end-to-end.

### Model

Defaults to `openai/gpt-oss-120b` — as of this writing, Groq's strict
`response_format: json_schema` mode is only supported by the `openai/gpt-oss` family
(`gpt-oss-120b`, `gpt-oss-20b`); other Groq-hosted models reject the request with a 400
(confirmed against the live API while building this, not assumed from docs). Override
via `GROQ_MODEL` in `.env.local` — swap to `openai/gpt-oss-20b` for a faster/cheaper
option, or any future Groq model that adds `json_schema` support, no code changes
needed either way.

### Resilience summary

| Failure | What happens |
|---|---|
| No `GROQ_API_KEY` set | Fallback template immediately, no network call |
| Network error / Groq outage | Retry once, then fallback template |
| Model returns malformed JSON | Retry once with a stricter prompt, then fallback |
| Model returns valid JSON that fails schema validation | Same as above — zod catches it |
| Client sends invalid input (e.g. 2-character keyword) | 400 with field-level errors, no AI call made |
| Client exceeds 8 requests/minute | 429 with a clear message and `Retry-After` header |
| Client-side network failure (fetch throws) | Error state with a "Try again" button that replays the last request |

All of the above is exercised by tests — see `__tests__/lib/groq.test.ts` (mocks the
Groq client to force every failure branch) and `__tests__/api/brief-route.test.ts`.

---

## Testing

Three layers, per the FE-09 testing pyramid:

| Layer | Tool | What it covers |
|---|---|---|
| Unit | Vitest | Schema validation, fallback generator, rate limiter, localStorage history, markdown export |
| Integration | Vitest + Testing Library + jest-axe | Every component in isolation (form validation, result rendering, error/history panels), plus the `/api/brief` route handler directly |
| E2E | Playwright, real Chrome | Full happy path, keyboard-only flow, 4 distinct error states, 3 real-browser axe-core scans |

**64 unit/integration tests, 9 e2e tests, all passing.** Real coverage (not claimed —
see `docs/evidence/coverage-table.md` for the exact per-file numbers from
`npm run test:coverage`):

| Metric | Coverage |
|---|---|
| Statements | 93.16% |
| Branches | 82.41% |
| Functions | 92.72% |
| Lines | 94.06% |

Well above the 50%-of-components pass bar — every `lib/` module and every component
has direct tests.

Saved, real (not fabricated) command output lives in `docs/evidence/`:
- `vitest-output.txt` — full unit/integration run + coverage table
- `coverage-table.md` — accurate per-file breakdown (the terminal coverage table
  vitest prints collapses some 100%-covered files; this is the reliable version, read
  straight from `coverage/coverage-summary.json`)
- `playwright-output.txt` — full e2e run, all 9 passing
- `accessibility-audit.md` — a real WCAG violation the audit caught, and the fix
- `lighthouse-summary.md` — scores + the raw HTML/JSON reports

To reproduce any of it locally: `npm run test:coverage`, then
`npm run build && npm run test:e2e`.

---

## Performance & Accessibility

### Lighthouse (local production build, headless Chrome)

| Category | Mobile | Desktop |
|---|:---:|:---:|
| Performance | 96 | 100 |
| Accessibility | 100 | 100 |
| Best Practices | 100 | 100 |
| SEO | 100 | 100 |

Raw reports: `docs/evidence/report-mobile.report.html`,
`docs/evidence/report-desktop.report.html` — open either directly in a browser.
Details in `docs/evidence/lighthouse-summary.md`.

### Accessibility (WCAG 2.1 AA)

- Every form control has a real, associated `<label>`; errors use `aria-invalid` +
  `aria-describedby` and are announced via `role="alert"`.
- Skip-to-content link, semantic landmarks (`header`/`main`/`footer`), one `h1` per
  page, logical heading order inside the result view.
- Focus is moved programmatically to the result heading on success and to the error
  panel on failure, so keyboard and screen-reader users aren't stranded on the button
  they just pressed.
- Loading state uses `role="status"`/`aria-live="polite"`; errors use `role="alert"`
  (assertive) — screen readers get the right urgency for each.
- Automated axe-core scans run in **two** places: jsdom-based (`jest-axe`) on every
  component in isolation, and real-Chrome (`@axe-core/playwright`) on three full page
  states. **The real-Chrome pass caught an actual WCAG 1.4.3 (color contrast) violation
  during development** — `text-black/50` measured 3.94:1 against the required 4.5:1.
  Full before/after in `docs/evidence/accessibility-audit.md`. This is the concrete
  example of "one improvement made from audit findings" the capstone brief asks for —
  it's a real bug the tooling caught, not a hypothetical.

---

## Deployment

### Deployment checklist

- [x] `npm run build` succeeds with zero errors
- [x] `npm run lint` and `npx tsc --noEmit` are clean
- [x] All unit/integration tests pass (`npm run test`)
- [x] All e2e tests pass, including axe-core accessibility scans (`npm run test:e2e`)
- [x] App is fully functional with **zero environment variables set** (fallback path)
- [x] Lighthouse ≥ 90 on all four categories, both mobile and desktop
- [x] No console errors on any page state (idle, loading, success, error)
- [x] Error boundary (`src/app/error.tsx`) in place for unexpected render crashes
- [x] Rate limiting in place on the only server route that costs money/quota
- [x] `.env.example` documents every required/optional environment variable
- [x] `.gitignore` excludes `.env*` (except `.env.example`) — no secrets in git history
- [ ] `GROQ_API_KEY` set in the hosting provider's environment variables *(you do this
      at deploy time — see below)*
- [ ] Production URL smoke-tested after deploy (generate one real brief, confirm the
      "AI-generated" badge shows instead of "Template fallback")

### Deploying (Vercel)

1. Push this repo to GitHub (already done if you're reading this from the repo).
2. [vercel.com/new](https://vercel.com/new) → import
   `arhamheer/flyrank-frontendai-capstone` → Next.js is auto-detected, no config
   needed.
3. Add an environment variable: `GROQ_API_KEY` = your key (Project Settings →
   Environment Variables). Optionally add `GROQ_MODEL` too.
4. Deploy. Every push to `main` auto-deploys from then on.

### Deploying (Netlify)

1. [app.netlify.com](https://app.netlify.com) → "Add new site" → import from Git →
   select the repo. Netlify's Next.js Runtime auto-detects the build command
   (`next build`) and publish directory.
2. Site settings → Environment variables → add `GROQ_API_KEY` (and optionally
   `GROQ_MODEL`).
3. Deploy.

### How it fails safely

- **AI unavailable at any layer** (no key, network, rate limit, malformed output):
  every case degrades to the template generator — see the resilience table above.
  The user always gets a usable brief; they're just told, visibly, whether it came
  from the AI or the template.
- **Invalid input:** rejected with a 400 and specific field errors before any AI call
  is made — no wasted API quota on requests that can't succeed.
- **Unexpected render crash:** caught by `src/app/error.tsx` (Next.js error boundary),
  which shows a recoverable error UI instead of a blank white screen, and reminds the
  user their history is still saved locally.
- **API abuse / runaway cost:** the in-memory rate limiter (`src/lib/rateLimit.ts`)
  caps a client to 8 requests/minute. It's documented as per-instance, not
  distributed (see limitations below) — the goal is smoothing accidental bursts from
  one browser tab, not enforcing a hard global quota.

### Monitoring & rollback

- **Monitoring:** Vercel/Netlify's built-in function logs cover the `/api/brief` route
  out of the box — `console.error` calls in `route.ts` and `groq.ts` are structured
  enough (`[groq] <stage> failed: ...`) to grep in the dashboard without extra
  tooling. No paid observability stack wired up for a capstone-scale app — the
  honest scope call, not an oversight.
- **Rollback plan:** both Vercel and Netlify keep every deployment and let you
  "promote"/"publish" a previous one from the dashboard in one click — that's the
  primary rollback path, and it's instant (no rebuild). The git-level fallback is
  `git revert <bad-commit> && git push`, which triggers a fresh auto-deploy from a
  known-good `main`. Because `GROQ_API_KEY` is the only stateful external dependency
  and it's never written to, rollback carries zero data-migration risk.

---

## Known Limitations & Future Improvements

**Limitations (honest, not hidden):**
- The rate limiter is in-memory and per-instance — it resets on redeploy and doesn't
  share state across serverless instances. Fine for a capstone/demo; a real
  multi-instance deployment needs Upstash Redis or Vercel KV behind the same
  `checkRateLimit()` interface.
- "History" is per-browser `localStorage`, not an account system — clearing browser
  data clears history, and it doesn't sync across devices.
- The fallback template generator is intentionally generic — it guarantees the app
  never hard-fails, but it's not a substitute for the AI's topic-specific research.
- No streaming — briefs return all at once. Groq is fast enough (usually 1–3s) that
  this hasn't been a real problem, but a streaming UI would improve perceived speed
  on longer briefs.

**What I'd build next:**
- A "regenerate just this section" action, so a good brief with one weak outline
  section doesn't require a full re-roll.
- Optional competitor-URL input with actual fetch-and-summarize (deliberately left out
  of scope here — see the reflection below on why).
- Distributed rate limiting for real multi-instance deployments.

---

## Reflection

**Hardest part.** Making the AI failure modes *actually* resilient rather than just
having a `try/catch` that returns a generic 500. The three-layer design (structured
output → retry with a stricter prompt → deterministic fallback) took more iteration
than the happy path did, and testing it properly meant mocking the Groq SDK at the
module boundary to force every failure branch on demand — that test file
(`__tests__/lib/groq.test.ts`) took longer to get right than `groq.ts` itself.

**What surprised me.** How much of "accessibility" in practice is arithmetic, not
judgment calls. `text-black/50` *looked* fine by eye in the editor — it took a
real-Chrome axe-core scan to catch that it measured 3.94:1 against a 4.5:1 requirement.
I'd assumed most accessibility issues would be structural (missing labels, bad
heading order) — those I could reason about directly — but the color-contrast one only
showed up because the tooling computed the actual ratio. That's a good argument for
running an automated audit in a real browser rather than trusting a jsdom-based check
or a visual read alone.

**What I'd do differently.** I'd write the Playwright e2e tests against a production
build (`next start`) from the start instead of the dev server. I initially pointed
Playwright at `next dev`, and the dev server's HMR WebSocket handling triggered
full-page reloads mid-test in this environment — wiping form state and making it look
like the submit handler was broken, when the actual app was fine. Switching the e2e
`webServer` config to `next start` fixed it immediately and is also more representative
of what actually ships, so it should have been the default from the first test I wrote,
not something I backed into after debugging a false failure.
