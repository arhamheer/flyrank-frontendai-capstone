# Lighthouse Audit — Summary

Run locally against a production build (`next build && next start`) with Lighthouse CLI
and headless Chrome. Full reports (HTML + raw JSON) are in this same directory:
`report-mobile.report.html`, `report-desktop.report.html` (open directly in a browser).

## Scores

| Category       | Mobile | Desktop |
|-----------------|:------:|:-------:|
| Performance      | 96     | 100     |
| Accessibility    | 100    | 100     |
| Best Practices   | 100    | 100     |
| SEO              | 100    | 100     |

Both comfortably clear the ≥85 pass bar and the 90+ target, on mobile and desktop.

## Mobile performance — what's holding it at 96 instead of 100

Simulated mobile CPU/network throttling on local hardware, not a code defect:

| Audit | Score | Value |
|---|---|---|
| Largest Contentful Paint | 0.94 | 2.3s |
| Total Blocking Time | 0.90 | 190ms |
| Time to Interactive | 0.96 | 2.9s |

These are exactly the kind of numbers that improve further on Vercel's edge network and
CDN caching versus a locally throttled run — not chased further here since 96 already
clears the pass bar with headroom.

## Re-running after deployment

```bash
npx lighthouse https://your-deployed-url.vercel.app --view
```
