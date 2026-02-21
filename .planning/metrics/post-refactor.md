# Baseline Metrics — Phase 1

> Collected at: 2026-02-20T16:31:13.161Z
> Prefix: post-refactor

## Metrics Summary

| Metric                  |  Value | Notes                           |
| ----------------------- | -----: | ------------------------------- |
| Source files (.ts/.tsx) |    329 |                                 |
| Source directories      |    184 |                                 |
| Total lines of code     |  83412 | .ts/.tsx in src/                |
| Production dependencies |     32 | package.json dependencies       |
| Dev dependencies        |     18 | package.json devDependencies    |
| Route count             |    100 | page.tsx + route.ts in src/app/ |
| TypeScript errors       |      0 | tsc --noEmit                    |
| ESLint warnings         |      0 | next lint                       |
| ESLint errors           |      0 | next lint                       |
| Circular dependencies   |      0 | madge --circular                |
| Build time              | 109.2s | Cold build (deleted .next/)     |

## Measurement Conditions

- Cold build: `.next/` deleted before build measurement
- All metrics collected via `node scripts/collect-metrics.js`
- Platform: win32 / Node v22.14.0
- Rerun with: `npm run metrics` or `node scripts/collect-metrics.js --output-prefix <name>`
