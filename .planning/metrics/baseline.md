# Baseline Metrics — Phase 1

> Collected at: 2026-02-17T20:58:44.857Z
> Prefix: baseline

## Metrics Summary

| Metric                  |  Value | Notes                           |
| ----------------------- | -----: | ------------------------------- |
| Source files (.ts/.tsx) |    403 |                                 |
| Source directories      |    175 |                                 |
| Total lines of code     | 107256 | .ts/.tsx in src/                |
| Production dependencies |     36 | package.json dependencies       |
| Dev dependencies        |     21 | package.json devDependencies    |
| Route count             |    100 | page.tsx + route.ts in src/app/ |
| TypeScript errors       |      0 | tsc --noEmit                    |
| ESLint warnings         |    387 | next lint                       |
| ESLint errors           |      0 | next lint                       |
| Circular dependencies   |      0 | madge --circular                |
| Build time              | 117.3s | Cold build (deleted .next/)     |

## Measurement Conditions

- Cold build: `.next/` deleted before build measurement
- All metrics collected via `node scripts/collect-metrics.js`
- Platform: win32 / Node v22.14.0
- Rerun with: `npm run metrics` or `node scripts/collect-metrics.js --output-prefix <name>`
