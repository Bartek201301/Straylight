#!/usr/bin/env node

/**
 * Metrics Collection Script
 *
 * Collects codebase metrics and outputs to both JSON and Markdown formats.
 * Designed to be rerunnable for regression checks after every phase.
 *
 * Usage:
 *   node scripts/collect-metrics.js                          # default "baseline" prefix
 *   node scripts/collect-metrics.js --output-prefix post-p2  # custom prefix
 *
 * Output:
 *   .planning/metrics/{prefix}.json   — machine-readable
 *   .planning/metrics/{prefix}.md     — human-readable table
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ROOT = path.resolve(__dirname, '..');

function parseArgs() {
  const args = process.argv.slice(2);
  let outputPrefix = 'baseline';
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--output-prefix' && args[i + 1]) {
      outputPrefix = args[i + 1];
      i++;
    }
    if (args[i] === '--help' || args[i] === '-h') {
      console.log(`
Metrics Collection Script

Usage:
  node scripts/collect-metrics.js [options]

Options:
  --output-prefix <name>   Output file prefix (default: "baseline")
                            Files written to .planning/metrics/<prefix>.json and .md
  --help, -h               Show this help message

Metrics collected:
  sourceFileCount          .ts and .tsx files in src/
  sourceDirectoryCount     directories in src/
  totalLOC                 total lines of code in .ts/.tsx in src/
  productionDependencies   count from package.json dependencies
  devDependencies          count from package.json devDependencies
  routeCount               page.tsx and route.ts files in src/app/
  typescriptErrors         errors from tsc --noEmit
  eslintWarnings           warnings from next lint
  eslintErrors             errors from next lint
  circularDependencies     from madge --circular
  buildTimeMs              cold next build time (deletes .next/ first)
  collectedAt              ISO timestamp
`);
      process.exit(0);
    }
  }
  return { outputPrefix };
}

/** Recursively collect file paths matching a predicate. */
function walkSync(dir, predicate, results = []) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return results;
  }
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      // Skip node_modules / .next / hidden dirs inside src
      if (
        entry.name === 'node_modules' ||
        entry.name === '.next' ||
        entry.name.startsWith('.')
      ) {
        continue;
      }
      walkSync(fullPath, predicate, results);
    } else if (predicate(entry.name, fullPath)) {
      results.push(fullPath);
    }
  }
  return results;
}

/** Recursively collect directory paths. */
function walkDirsSync(dir, results = []) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return results;
  }
  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (
        entry.name === 'node_modules' ||
        entry.name === '.next' ||
        entry.name.startsWith('.')
      ) {
        continue;
      }
      const fullPath = path.join(dir, entry.name);
      results.push(fullPath);
      walkDirsSync(fullPath, results);
    }
  }
  return results;
}

/** Count lines in a file. */
function countLines(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return content.split('\n').length;
  } catch {
    return 0;
  }
}

/** Run a shell command and return stdout (or empty string on error). */
function run(cmd, opts = {}) {
  try {
    return execSync(cmd, {
      cwd: ROOT,
      encoding: 'utf-8',
      maxBuffer: 50 * 1024 * 1024,
      stdio: ['pipe', 'pipe', 'pipe'],
      ...opts,
    });
  } catch (err) {
    // Many tools exit non-zero when they find issues — still capture output
    return (err.stdout || '') + (err.stderr || '');
  }
}

// ---------------------------------------------------------------------------
// Metric collectors
// ---------------------------------------------------------------------------

function collectSourceFileCount() {
  const srcDir = path.join(ROOT, 'src');
  const files = walkSync(srcDir, (name) => /\.(ts|tsx)$/.test(name));
  return files.length;
}

function collectSourceDirectoryCount() {
  const srcDir = path.join(ROOT, 'src');
  const dirs = walkDirsSync(srcDir);
  return dirs.length;
}

function collectTotalLOC() {
  const srcDir = path.join(ROOT, 'src');
  const files = walkSync(srcDir, (name) => /\.(ts|tsx)$/.test(name));
  let total = 0;
  for (const f of files) {
    total += countLines(f);
  }
  return total;
}

function collectProductionDependencies() {
  const pkg = JSON.parse(
    fs.readFileSync(path.join(ROOT, 'package.json'), 'utf-8')
  );
  return Object.keys(pkg.dependencies || {}).length;
}

function collectDevDependencies() {
  const pkg = JSON.parse(
    fs.readFileSync(path.join(ROOT, 'package.json'), 'utf-8')
  );
  return Object.keys(pkg.devDependencies || {}).length;
}

function collectRouteCount() {
  const appDir = path.join(ROOT, 'src', 'app');
  const routes = walkSync(
    appDir,
    (name) => name === 'page.tsx' || name === 'route.ts'
  );
  return routes.length;
}

function collectTypescriptErrors() {
  const output = run('npx tsc --noEmit 2>&1');
  const matches = output.match(/error TS/g);
  return matches ? matches.length : 0;
}

function collectEslintResults() {
  const output = run('npx next lint 2>&1');
  let warnings = 0;
  let errors = 0;

  // Next.js lint outputs a summary like "✖ 394 problems (0 errors, 394 warnings)"
  // or "Warning: ..." lines. Try the summary line first.
  const summaryMatch = output.match(
    /(\d+)\s+problems?\s*\((\d+)\s+errors?,\s*(\d+)\s+warnings?\)/
  );
  if (summaryMatch) {
    errors = parseInt(summaryMatch[2], 10);
    warnings = parseInt(summaryMatch[3], 10);
  } else {
    // Fallback: count individual lines
    const warningLines = output.match(/Warning:/g);
    const errorLines = output.match(/Error:/g);
    warnings = warningLines ? warningLines.length : 0;
    errors = errorLines ? errorLines.length : 0;
  }

  return { eslintWarnings: warnings, eslintErrors: errors };
}

function collectCircularDependencies() {
  const output = run(
    'npx madge --circular --ts-config tsconfig.json --json src/'
  );
  try {
    // madge --json outputs a JSON array of circular dependency chains
    const parsed = JSON.parse(output.trim());
    return Array.isArray(parsed) ? parsed.length : 0;
  } catch {
    // If JSON parsing fails, try to count from text output
    return 0;
  }
}

function collectBuildTime() {
  // Delete .next/ for cold build measurement
  const nextDir = path.join(ROOT, '.next');
  try {
    fs.rmSync(nextDir, { recursive: true, force: true });
  } catch {
    // May not exist
  }

  const start = Date.now();
  run('npx next build', { timeout: 600000 });
  const elapsed = Date.now() - start;
  return elapsed;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const { outputPrefix } = parseArgs();

  const metricsDir = path.join(ROOT, '.planning', 'metrics');
  fs.mkdirSync(metricsDir, { recursive: true });

  const metrics = {};
  const notes = {};

  const collectors = [
    {
      key: 'sourceFileCount',
      label: 'Source files (.ts/.tsx)',
      fn: collectSourceFileCount,
    },
    {
      key: 'sourceDirectoryCount',
      label: 'Source directories',
      fn: collectSourceDirectoryCount,
    },
    {
      key: 'totalLOC',
      label: 'Total lines of code',
      fn: collectTotalLOC,
    },
    {
      key: 'productionDependencies',
      label: 'Production dependencies',
      fn: collectProductionDependencies,
    },
    {
      key: 'devDependencies',
      label: 'Dev dependencies',
      fn: collectDevDependencies,
    },
    {
      key: 'routeCount',
      label: 'Routes (page.tsx + route.ts)',
      fn: collectRouteCount,
    },
    {
      key: 'typescriptErrors',
      label: 'TypeScript errors',
      fn: collectTypescriptErrors,
    },
    {
      key: 'eslint',
      label: 'ESLint results',
      fn: collectEslintResults,
      multi: true,
    },
    {
      key: 'circularDependencies',
      label: 'Circular dependencies',
      fn: collectCircularDependencies,
    },
    {
      key: 'buildTimeMs',
      label: 'Build time (cold)',
      fn: collectBuildTime,
    },
  ];

  for (const collector of collectors) {
    process.stdout.write(`Collecting: ${collector.label}...`);
    try {
      const result = collector.fn();
      if (collector.multi) {
        // Spread multiple values (e.g., eslintWarnings, eslintErrors)
        Object.assign(metrics, result);
        notes[collector.key] = 'OK';
      } else {
        metrics[collector.key] = result;
        notes[collector.key] = 'OK';
      }
      const display = collector.multi ? JSON.stringify(result) : result;
      console.log(` ${display}`);
    } catch (err) {
      console.log(` FAILED: ${err.message}`);
      if (collector.multi) {
        metrics.eslintWarnings = null;
        metrics.eslintErrors = null;
      } else {
        metrics[collector.key] = null;
      }
      notes[collector.key] = `Error: ${err.message}`;
    }
  }

  metrics.collectedAt = new Date().toISOString();

  // -------------------------------------------------------------------------
  // Write JSON
  // -------------------------------------------------------------------------
  const jsonPath = path.join(metricsDir, `${outputPrefix}.json`);
  fs.writeFileSync(jsonPath, JSON.stringify(metrics, null, 2) + '\n');
  console.log(`\nJSON written to: ${jsonPath}`);

  // -------------------------------------------------------------------------
  // Write Markdown
  // -------------------------------------------------------------------------
  const mdLines = [
    `# Baseline Metrics — Phase 1`,
    '',
    `> Collected at: ${metrics.collectedAt}`,
    `> Prefix: ${outputPrefix}`,
    '',
    '## Metrics Summary',
    '',
    '| Metric | Value | Notes |',
    '| ------ | ----: | ----- |',
  ];

  const rows = [
    ['Source files (.ts/.tsx)', metrics.sourceFileCount, ''],
    ['Source directories', metrics.sourceDirectoryCount, ''],
    ['Total lines of code', metrics.totalLOC, '.ts/.tsx in src/'],
    [
      'Production dependencies',
      metrics.productionDependencies,
      'package.json dependencies',
    ],
    [
      'Dev dependencies',
      metrics.devDependencies,
      'package.json devDependencies',
    ],
    ['Route count', metrics.routeCount, 'page.tsx + route.ts in src/app/'],
    ['TypeScript errors', metrics.typescriptErrors, 'tsc --noEmit'],
    ['ESLint warnings', metrics.eslintWarnings, 'next lint'],
    ['ESLint errors', metrics.eslintErrors, 'next lint'],
    ['Circular dependencies', metrics.circularDependencies, 'madge --circular'],
    [
      'Build time',
      metrics.buildTimeMs != null
        ? `${(metrics.buildTimeMs / 1000).toFixed(1)}s`
        : 'null',
      'Cold build (deleted .next/)',
    ],
  ];

  for (const [label, value, note] of rows) {
    const v = value != null ? String(value) : 'null';
    mdLines.push(`| ${label} | ${v} | ${note} |`);
  }

  mdLines.push('');
  mdLines.push('## Measurement Conditions');
  mdLines.push('');
  mdLines.push('- Cold build: `.next/` deleted before build measurement');
  mdLines.push('- All metrics collected via `node scripts/collect-metrics.js`');
  mdLines.push(`- Platform: ${process.platform} / Node ${process.version}`);
  mdLines.push(
    '- Rerun with: `npm run metrics` or `node scripts/collect-metrics.js --output-prefix <name>`'
  );
  mdLines.push('');

  const mdPath = path.join(metricsDir, `${outputPrefix}.md`);
  fs.writeFileSync(mdPath, mdLines.join('\n'));
  console.log(`Markdown written to: ${mdPath}`);
  console.log('\nDone.');
}

main();
