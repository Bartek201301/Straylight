# Repository Guidelines

## Project Structure & Module Organization

`src/app` contains the Next.js routes grouped by feature (for example `src/app/library/page.tsx`). Shared UI lives in `src/components`, hooks in `src/hooks`, helpers in `src/lib`, and static assets in `public/`. Supabase edge code and SQL migrations sit in `supabase/` and the root `*.sql` files, while operational notes stay in `docs/` and the root Markdown reports. Automation scripts reside in `scripts/`; call them through the npm wrappers below.

## Build, Test, and Development Commands

Run `npm run dev` for local development. `npm run build` validates the app and compresses assets, and `npm run build:production` adds the heavier image optimization pass; serve built output with `npm start`. Quality checks are `npm run lint` (or `npm run lint:fix`) and `npm run format:check`; format with `npm run format` before committing. Asset chores are `npm run optimize-images[:verbose]` and `npm run compress-assets`—use them when adding imagery or preparing marketing content.

## Coding Style & Naming Conventions

The codebase is TypeScript with React Server Components. Use two-space indentation, `PascalCase` filenames for components and contexts, and `camelCase` with a `use` prefix for hooks (`useArticleValidation.ts`). Prefer named exports, reserve defaults for single-purpose modules, and rely on Tailwind utility classes before writing custom CSS.

## Testing Guidelines

Automated coverage is light, so add feature-level tests with new work and capture manual steps in the relevant doc. Quick smoke checks exist via `node test-validation.js` for validation logic and `node test-filter-changes.js` for diff helpers. Finish every contribution with `npm run lint` and `npm run build`, and follow the small Node-script style if you add new checks.

## Commit & Pull Request Guidelines

Commit messages here are short and imperative (`Add library item working`); keep that tone and group related edits together. Pull requests should list the problem, screenshots or screencasts for UI updates, linked issues or Notion tasks, and the commands you ran (lint, build, targeted scripts). Flag any new environment variables or Supabase migrations so reviewers can replicate your setup.

## Security & Configuration Tips

Store Supabase keys, Mailchimp tokens, and analytics IDs in `.env.local` only. Keep `supabase/` functions aligned with the hosted project and track schema changes in the matching SQL files. When adding an external integration, append setup notes to `ARCHITECTURE.md` and mention the required configuration in your PR description.
