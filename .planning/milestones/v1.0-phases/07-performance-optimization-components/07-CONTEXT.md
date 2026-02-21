# Phase 7: Performance Optimization - Components - Context

**Gathered:** 2026-02-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Optimize server/client component boundaries and reduce bundle size. Push `"use client"` directives down to leaf components, code-split heavy bundles with dynamic imports, and optimize image/font usage. No new features or functionality changes — purely performance optimization with zero behavioral regression.

</domain>

<decisions>
## Implementation Decisions

### Client directive strategy

- Add ESLint guard rule to prevent future `"use client"` pollution (e.g., warn when large files have `"use client"` at top level)
- This is a locked decision — guard rule must be implemented

### Claude's Discretion

**Client directive splitting:**

- How aggressively to split `"use client"` components (maximum vs. pragmatic) — Claude evaluates each case based on bundle impact
- Whether to convert fully client-side pages to server components with client islands — Claude assesses difficulty vs. payoff per page
- Layout files priority — Claude determines whether to prioritize layouts over pages based on cascade impact analysis

**Code-splitting targets:**

- Whether TipTap editor should be dynamically imported — Claude determines based on bundle impact analysis
- Admin component handling — Claude evaluates whether additional splitting beyond Next.js route-level splitting is needed
- SSR skip decisions (`ssr: false`) — Claude determines per-component based on SEO needs vs. performance tradeoff

**Image & font optimization:**

- Scope of `<img>` to `next/image` migration — Claude determines based on how many non-optimized images exist
- Font loading strategy — Claude audits codebase to determine font usage and optimize accordingly
- Static asset audit — Claude audits `public/` folder and flags oversized files
- User-uploaded image flow — Claude checks upload/serving flow and optimizes accordingly

**Bundle tracking:**

- Granularity of before/after metrics tracking — Claude determines appropriate level

</decisions>

<specifics>
## Specific Ideas

- No specific pain points identified — optimize based on bundle analysis and metrics
- User wants all key metrics tracked: total JS bundle size, first load JS per route, and Lighthouse performance score
- Bundle target is best-effort toward 20% reduction — not a hard gate, but aim for it with reasonable optimizations
- Heavy third-party libraries should be audited — user suspects there may be oversized deps but doesn't know which ones
- Claude should audit bundle composition and flag heavy dependencies for potential replacement with lighter alternatives

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

_Phase: 07-performance-optimization-components_
_Context gathered: 2026-02-19_
