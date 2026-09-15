# Template System Audit — Findings

| # | Finding | Severity | Status |
|---|---------|----------|--------|
| 1 | Template styles hardcode brand colours instead of CSS vars | High | FIXED in fabc38f — travel + review variants now use var(--color-primary) |
| 2 | themeVariant is 1:1 with starters | Low | Noted only — no fix needed |
| 3 | Custom templates may not reach editor | — | CLOSED — false alarm; loadTemplatesFromDb is called by templates page |
| 4 | TemplateStyle flat + growing (~50 fields) | Medium | DEFER — nest during 7.6.9 |
| 5 | No guardrail on brand-colour fields | Low | Convention note only |
| 6 | version: 1 stored but never read | Low | DEFER to Phase 8 |
| 7 | Hero size is template-global, not per-block | Medium | FIXED in 9953501 — size is per-block |
| 8 | Accent colour 100% unused (0 UI usages) | High | FIXED in fabc38f + 9953501 — Featured badge + Verdict stripe |

## Where accent colour is now used

1. **Featured badge** (components/feed/FeedCard.tsx) — accent tint background + accent text
2. **Verdict block top stripe** (components/editor/renderers/VerdictRenderer.tsx) — 4px accent border-top
3. **Itinerary block accents** (deferred to 7.6.9)

## What accent must NOT touch

- Callouts (tip/warning/info) — status colours, fixed by guardrail
- Success/warning/danger — fixed
- Primary buttons/links — that's primary's job
- Site chrome — primary's job
