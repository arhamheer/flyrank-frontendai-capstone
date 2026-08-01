# What Is FlyBrief?

**Live demo:** https://flyrank-frontendai-capstone.vercel.app/

FlyBrief is a small web app that helps content writers and marketers plan an article before they start writing it. You type in a topic (say, "email automation software"), pick a content type and a tone, and it hands you back a full content brief: a suggested title, meta description, an outline with headings, questions people actually search for, keywords to include, and a rough word count target.

Think of it as the planning document a senior content strategist would hand a writer before they start a blog post — except it's generated in a few seconds.

## How is this different from just asking ChatGPT?

This is the part that actually matters, so it's worth spelling out.

If you open ChatGPT and type "give me a content brief for email automation software," you'll get *something*. But every time you ask, you get a differently-shaped answer — sometimes a bulleted list, sometimes paragraphs, sometimes it forgets the meta description entirely. You're also fully dependent on the chat window staying open, and if the AI service is slow or down that night, you get nothing.

FlyBrief is built to not have those problems:

- **The output is always shaped the same way.** Every brief has the same sections in the same order — title options, meta descriptions, outline, "people also ask" questions, dos and don'ts, keyword ideas. The app forces the AI to answer in that exact structure, so the result can be reliably displayed, downloaded, and reused. You're not hoping the AI remembers to include everything this time.
- **It doesn't fall over if the AI is unavailable.** If the AI service is slow, rejects the request, or sends back something broken, the app quietly retries once, and if that also fails, it builds a solid brief from a template instead of showing an error page. You still walk away with something usable. A plain chat window just fails and leaves you staring at an error.
- **It's a tool, not a conversation.** There's no back-and-forth prompting required, no "can you make it better," no copy-pasting your topic into a chat every time. You fill in a short form and get a consistent, structured result — the kind of thing you could build a real workflow around, not just a novelty.
- **It remembers your recent work.** Past briefs are saved locally in your browser so you can revisit or compare them, without needing an account or a database.
- **It's built like a real product**, with accessibility for screen-reader and keyboard users, fast load times, and automated tests — not a weekend demo that only works on the developer's laptop.

In short: a chatbot gives you a one-off answer. FlyBrief gives you a dependable tool that happens to use AI as one of its ingredients, not the whole recipe.

---

## For Technical Viewers

FlyBrief is a **Next.js 16 (App Router) + React 19 + TypeScript** application deployed on Vercel, using **Tailwind CSS v4** for styling.

**AI integration** — the part meant to prove this isn't a trivial API wrapper:

- Calls the **Groq API** (`openai/gpt-oss-120b`) using its `response_format: json_schema` **strict structured-output mode**, so the model is constrained to return JSON matching a predefined schema — not free-form text that has to be parsed and hoped for.
- The response is validated a second time independently with **Zod**, so even a technically-valid-but-wrong-shaped response gets caught before it reaches the UI.
- **Three-layer resilience**: (1) structured AI call → (2) one automatic retry with a stricter prompt and lower temperature if the first call errors or fails validation → (3) a deterministic, non-AI fallback generator that builds a template brief from the same inputs. The user never sees a hard failure; they see a clearly labeled "AI-generated" or "template fallback" result.
- A simple in-memory, per-IP **rate limiter** protects the API route from abuse.

**Testing** — this is a claim backed by evidence in `/docs/evidence`, not just an assertion:

- **Vitest** unit/integration tests (including a mocked Groq client) covering the schema validation, fallback generator, rate limiter, and API route logic.
- **React Testing Library** component tests for the form, results view, error states, and history panel.
- **Playwright** end-to-end tests against a real production build, covering the happy path, keyboard-only navigation, and error/rate-limit handling.
- **axe-core** accessibility scans (via `jest-axe` and `@axe-core/playwright`) run against real Chrome, checking WCAG 2.1 AA compliance — this actually caught and fixed real color-contrast bugs during development, documented in `docs/evidence/accessibility-audit.md`.
- **Lighthouse** performance/accessibility/SEO audits run against the production build, with saved HTML/JSON reports.

**Why this setup, specifically:**

- Structured output + double validation exists because AI responses are the least trustworthy input in the whole system — they need to be treated like untrusted user input, not like a function return value.
- The fallback layer exists because a "content brief generator" that just shows an error page when the AI hiccups isn't actually production-ready — the tool's job is to produce a usable brief, with or without the AI cooperating.
- Groq was chosen over a paid provider (like the Claude or OpenAI APIs) because it offers a generous free tier while still supporting strict JSON-schema-constrained outputs, which was the non-negotiable requirement for this design to work at all.

See `README.md` for full setup instructions, architecture details, and the complete test/coverage evidence.
