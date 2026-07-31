# Accessibility Audit — axe-core

Two layers of automated axe-core scanning, both wired into the test suites (not a
one-off manual check):

1. **Component-level** (`jest-axe`, jsdom) — every component test file runs an axe scan
   of its rendered output. See `__tests__/components/*.test.tsx`.
2. **Full-page, real Chrome** (`@axe-core/playwright`) — `e2e/accessibility.spec.ts` scans
   three real page states (idle form, validation-error state, and the generated-brief
   result view) against the `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa` rule tags. This
   catches things jsdom physically cannot, like color contrast, because it runs in an
   actual rendering engine.

Current result: **0 violations** across all three page states (see
`docs/evidence/playwright-output.txt` for the passing run).

## A concrete violation the audit caught and the fix

The first real-Chrome run did **not** pass — it caught a genuine WCAG 2 AA violation,
which is the point of running it in a real browser instead of trusting the design by eye.

**Finding:** `color-contrast` (serious), WCAG 1.4.3 — secondary/muted text used
`text-black/50` (50% black over white ≈ `#808080`), measuring **3.94:1** against the
required **4.5:1** for normal-size text. Flagged on "(optional)" field hints, the empty
history state, timestamps, and the footer.

```json
{
  "id": "color-contrast",
  "impact": "serious",
  "help": "Elements must meet minimum color contrast ratio thresholds",
  "nodes": [{
    "html": "<span class=\"text-black/50 dark:text-white/50 font-normal\">(optional)</span>",
    "target": ["label[for=\"_R_9bavbH1_\"] > .font-normal"],
    "failureSummary": "Element has insufficient color contrast of 3.94 (foreground color: #808080, background color: #ffffff). Expected contrast ratio of 4.5:1"
  }]
}
```

A second pass also caught the active history-item timestamp (`text-blue-100` on a
`bg-blue-600` pill) at **4.29:1** — just under the threshold, easy to miss by eye.

**Fix:** bumped every affected utility from `black/50` → `black/65` (and the dark-mode
equivalent `white/50` → `white/65`), and `text-blue-100` → `text-blue-50` for the active
history item. `black/65` measures ~6.98:1 against white — comfortable headroom above
4.5:1 rather than a value that just barely clears the bar. See the diff in
`src/app/page.tsx`, `src/components/BriefForm.tsx`, `src/components/BriefResult.tsx`,
`src/components/HistoryPanel.tsx`.

**Re-run after the fix:** all three `e2e/accessibility.spec.ts` cases pass with
`results.violations` = `[]`.

## Why this matters for the "how does it fail safely" question

This is also a live example of the app's testing catching a real defect before it
shipped — the exact kind of thing "tests exist and pass" is supposed to guard against,
not a hypothetical.
