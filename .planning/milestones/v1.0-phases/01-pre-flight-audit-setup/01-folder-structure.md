# Current Folder Structure

**Date:** 2026-02-17
**Total files:** 407 (in `src/`)
**Total directories:** 176 (in `src/`)
**Approximate LOC:** ~108k (from research baseline)

This document serves as the **primary migration reference for Phase 4 (Folder Restructure)**. All file counts and directory structures reflect the state at time of audit.

---

## Top-Level `src/` Structure

```
src/
  app/          128 files   Next.js App Router pages, layouts, and API routes
  components/   183 files   Reusable UI components organized by feature domain
  contexts/       4 files   React context providers (auth, theme, toast, notifications)
  fonts/          1 files   Font configuration (README only)
  hooks/         20 files   Custom React hooks
  lib/           71 files   Business logic, services, utilities, type definitions
```

---

## `src/app/` -- Routes and API (128 files)

### Root Files (6 files)

| File            | Type      | Purpose                     |
| --------------- | --------- | --------------------------- |
| `page.tsx`      | Page      | Landing/home page           |
| `layout.tsx`    | Layout    | Root layout (GA, providers) |
| `error.tsx`     | Error     | Global error boundary       |
| `not-found.tsx` | Not Found | Global 404 page             |
| `robots.ts`     | Config    | robots.txt generation       |
| `sitemap.ts`    | Config    | Sitemap generation          |

### Page Routes

| Route                         | Files | Has page.tsx | Has layout.tsx | Has loading.tsx | Has error.tsx | Has not-found.tsx | Colocated Components                                                           |
| ----------------------------- | ----- | ------------ | -------------- | --------------- | ------------- | ----------------- | ------------------------------------------------------------------------------ |
| `/about`                      | 1     | Yes          | No             | No              | No            | No                | None                                                                           |
| `/access-denied`              | 1     | Yes          | No             | No              | No            | No                | None                                                                           |
| `/admin`                      | 13    | Yes          | Yes            | No              | No            | No                | None                                                                           |
| `/admin/articles`             | --    | Yes          | --             | No              | No            | No                | None                                                                           |
| `/admin/articles/pending`     | --    | Yes          | --             | No              | No            | No                | None                                                                           |
| `/admin/dashboard`            | --    | Yes          | --             | No              | No            | No                | None                                                                           |
| `/admin/featured/articles`    | --    | Yes          | --             | No              | No            | No                | None                                                                           |
| `/admin/featured/tools`       | --    | Yes          | --             | No              | No            | No                | None                                                                           |
| `/admin/library/add`          | --    | Yes          | --             | No              | No            | No                | None                                                                           |
| `/admin/notifications`        | --    | Yes          | --             | No              | No            | No                | None                                                                           |
| `/admin/seo-tools`            | --    | Yes          | --             | No              | No            | No                | None                                                                           |
| `/admin/seo-tools/opengraph`  | --    | Yes          | --             | No              | No            | No                | None                                                                           |
| `/admin/seo-tools/schema`     | --    | Yes          | --             | No              | No            | No                | None                                                                           |
| `/admin/seo-tools/sitemap`    | --    | Yes          | --             | No              | No            | No                | None                                                                           |
| `/articles`                   | 7     | Yes          | No             | Yes             | No            | No                | None                                                                           |
| `/articles/[slug]`            | --    | Yes          | No             | No              | No            | Yes               | 3 (ArticleContent, ArticlePageContent, ClientWrapper)                          |
| `/auth/callback`              | 12    | No (route)   | No             | No              | No            | No                | None                                                                           |
| `/auth/confirmation-complete` | --    | Yes          | No             | No              | No            | No                | None                                                                           |
| `/auth/forgot-password`       | --    | Yes          | Yes            | No              | No            | No                | None                                                                           |
| `/auth/reset-password`        | --    | Yes          | Yes            | No              | No            | No                | None                                                                           |
| `/auth/signin`                | --    | Yes          | Yes            | No              | No            | No                | None                                                                           |
| `/auth/signup`                | --    | Yes          | Yes            | No              | No            | No                | None                                                                           |
| `/auth/verify-email`          | --    | Yes          | Yes            | No              | No            | No                | None                                                                           |
| `/cookies`                    | 1     | Yes          | No             | No              | No            | No                | None                                                                           |
| `/dashboard`                  | 7     | Yes          | Yes            | No              | No            | No                | 4 (DashboardLightTool, DashboardOverview, DashboardProfile, DashboardSettings) |
| `/dashboard/articles`         | --    | Yes          | --             | No              | No            | No                | None                                                                           |
| `/home`                       | 1     | Yes          | No             | No              | No            | No                | None                                                                           |
| `/library`                    | 1     | Yes          | No             | No              | No            | No                | None                                                                           |
| `/preview`                    | 2     | Yes          | No             | No              | No            | No                | 1 (PreviewContent)                                                             |
| `/privacy`                    | 1     | Yes          | No             | No              | No            | No                | None                                                                           |
| `/profile`                    | 4     | Yes          | No             | No              | No            | No                | None                                                                           |
| `/profile/[handle]`           | --    | Yes          | No             | No              | No            | No                | 2 (ClientWrapper, ProfilePageContent)                                          |
| `/quiz`                       | 5     | Yes          | Yes            | No              | No            | No                | None                                                                           |
| `/quiz/questions`             | --    | Yes          | Yes            | No              | No            | No                | None                                                                           |
| `/quiz/results`               | --    | Yes          | --             | No              | No            | No                | None                                                                           |
| `/suggest-resource`           | 2     | Yes          | Yes            | No              | No            | No                | None                                                                           |
| `/terms`                      | 1     | Yes          | No             | No              | No            | No                | None                                                                           |
| `/write`                      | 1     | Yes          | No             | No              | No            | No                | None                                                                           |

### API Routes (61 files)

| Route Group              | Files | Endpoints                                                                                                     |
| ------------------------ | ----- | ------------------------------------------------------------------------------------------------------------- |
| `/api/admin`             | 7     | analytics (content, system, users), articles (approve, reject), dashboard/stats, management/users             |
| `/api/affiliate-library` | 3     | CRUD, popular-tags, [id]/click                                                                                |
| `/api/articles`          | 10    | CRUD, [id] (status, vote, vote-counts, withdraw), check-slug, newest, popular, related/[slug], user/[userId]  |
| `/api/auth`              | 2     | forgot-password, reset-password                                                                               |
| `/api/chat`              | 1     | AI chat endpoint                                                                                              |
| `/api/cleanup-articles`  | 1     | Article cleanup utility                                                                                       |
| `/api/debug-articles`    | 1     | Debug endpoint (dev only)                                                                                     |
| `/api/debug-user`        | 1     | Debug endpoint (dev only)                                                                                     |
| `/api/drafts`            | 1     | save                                                                                                          |
| `/api/errors`            | 1     | log                                                                                                           |
| `/api/example-optimized` | 1     | Example/template route                                                                                        |
| `/api/featured`          | 2     | articles, tools                                                                                               |
| `/api/images`            | 1     | upload                                                                                                        |
| `/api/newsletter`        | 8     | config, confirm, resend-confirmation, subscribe, subscribe-double-optin, tags, tags/categories, test, webhook |
| `/api/og`                | 1     | OpenGraph image generation                                                                                    |
| `/api/profile`           | 3     | [handle], password, update                                                                                    |
| `/api/quiz`              | 1     | recommendations                                                                                               |
| `/api/resources`         | 1     | suggest                                                                                                       |
| `/api/revalidate`        | 1     | ISR revalidation                                                                                              |
| `/api/search`            | 5     | search, analytics, autocomplete, performance, suggestions                                                     |
| `/api/stats`             | 4     | articles, tools, users, weekly                                                                                |
| `/api/tags`              | 2     | tags, suggest                                                                                                 |
| `/api/twitter-card`      | 1     | Twitter card generation                                                                                       |

### App Directory Observations

- **Only 1 route has `loading.tsx`** (`/articles`) -- most routes lack loading states
- **Only 2 routes have `not-found.tsx`** (root and `/articles/[slug]`)
- **10 colocated component files** exist across 4 routes (`articles/[slug]`, `dashboard`, `preview`, `profile/[handle]`)
- **3 debug/example API routes** exist (`debug-articles`, `debug-user`, `example-optimized`) -- candidates for removal
- **Auth routes each have their own `layout.tsx`** (5 separate layouts) -- potential for consolidation with route groups

---

## `src/components/` -- UI Components (183 files)

### Directory Breakdown

| Directory         | Files | Purpose                                                                 | Shared vs Route-Specific                            |
| ----------------- | ----- | ----------------------------------------------------------------------- | --------------------------------------------------- |
| `admin/`          | 10    | Admin panel components (user mgmt, pending articles, dashboard widgets) | Route-specific (`/admin`)                           |
| `affiliate/`      | 5     | Affiliate library display, cards, links                                 | Route-specific (`/library`)                         |
| `articles/`       | 14    | Article cards, lists, filters, voting                                   | Shared (used by `/articles`, `/home`, `/dashboard`) |
| `auth/`           | 6     | Sign-in/up forms, password reset, protected route                       | Shared (used by `/auth/*`, layout)                  |
| `chat/`           | 2     | AI chatbot widget                                                       | Shared (global widget)                              |
| `editor/`         | 13    | TipTap rich text editor, toolbar, extensions                            | Route-specific (`/write`, `/dashboard`)             |
| `effects/`        | 13    | Visual effects (aurora, glare, blur, particles)                         | Shared (decorative, used across pages)              |
| `error-handling/` | 17    | Error boundaries, error pages, validation displays                      | Shared (app-wide error infrastructure)              |
| `errors/`         | 1     | Legacy error boundary (likely superseded by error-handling/)            | Candidate for removal                               |
| `forms/`          | 8     | Form components (inputs, selects, submission flow)                      | Shared (used by multiple features)                  |
| `home/`           | 10    | Homepage-specific sections and widgets                                  | Route-specific (`/home`)                            |
| `layout/`         | 9     | Header, footer, navigation, sidebar                                     | Shared (used in root layout)                        |
| `newsletter/`     | 4     | Newsletter signup forms (full and mini)                                 | Shared (used on home + subpages)                    |
| `notifications/`  | 3     | Notification bell, dropdown, items                                      | Shared (used in layout header)                      |
| `providers/`      | 6     | Context providers wrapper, service worker, asset perf                   | Shared (used in root layout)                        |
| `quiz/`           | 11    | AI quiz flow (questions, results, recommendations)                      | Route-specific (`/quiz`)                            |
| `resources/`      | 2     | Resource suggestion form                                                | Route-specific (`/suggest-resource`)                |
| `search/`         | 4     | Search bar, results, autocomplete                                       | Shared (used in layout header)                      |
| `seo/`            | 5     | Structured data, JSON-LD, metadata components                           | Shared (used across pages)                          |
| `ui/`             | 38    | Base UI primitives (buttons, cards, modals, skeletons, icons)           | Shared (design system foundation)                   |

### `ui/` Subdirectory Detail

| Subdirectory | Files | Contents                                            |
| ------------ | ----- | --------------------------------------------------- |
| `buttons/`   | 1     | Button variants                                     |
| `display/`   | 3     | Display components (badges, tags, etc.)             |
| `feedback/`  | 3     | Toast, progress, loading indicators                 |
| `icons/`     | 4     | Icon components                                     |
| `skeletons/` | 11    | Loading skeleton variants for various content types |
| Root `ui/`   | 16    | Core primitives (Card, Modal, Tooltip, etc.)        |

### `error-handling/` Subdirectory Detail

| Subdirectory  | Files | Contents                                                      |
| ------------- | ----- | ------------------------------------------------------------- |
| `boundaries/` | 4     | ErrorBoundary, ApiErrorBoundary, ContentErrorBoundary + index |
| `displays/`   | 3     | Error display components                                      |
| `pages/`      | 4     | Full-page error views (500, 404, etc.)                        |
| `validation/` | 6     | Form/input validation error displays                          |

### Component Observations

- **Route-specific components still in `components/`:** `admin/` (10), `affiliate/` (5), `home/` (10), `quiz/` (11), `resources/` (2), `editor/` (13) = **51 files** that could be colocated with their routes in Phase 4
- **`errors/` (1 file) likely superseded by `error-handling/` (17 files)** -- candidate for consolidation/removal
- **`effects/` (13 files)** contains decorative visual components -- unclear which are actively used vs experimental
- **`ui/` (38 files)** is the largest subdirectory and is well-organized with subdirectories

---

## `src/lib/` -- Business Logic (71 files)

### Directory Breakdown

| Directory     | Files | Purpose                                                  |
| ------------- | ----- | -------------------------------------------------------- |
| `analytics/`  | 1     | Analytics tracking utilities                             |
| `api/`        | 7     | API client, rate limiting, performance monitoring        |
| `auth/`       | 5     | Auth middleware, role verification, API middleware       |
| `cache/`      | 1     | Caching utilities                                        |
| `constants/`  | 1     | App-wide constants                                       |
| `database/`   | 2     | Database query helpers                                   |
| `errors/`     | 3     | Error types, API errors, submission errors               |
| `hooks/`      | 1     | Shared hook utilities (NOTE: also `src/hooks/` exists)   |
| `middleware/` | 1     | Middleware utilities                                     |
| `quiz/`       | 5     | Quiz logic, scoring, recommendations                     |
| `services/`   | 8     | Business services (articles, users, notifications, etc.) |
| `types/`      | 2     | TypeScript type definitions                              |
| `utils/`      | 2     | General utility functions                                |
| `validation/` | 5     | Input validation schemas and helpers                     |

### Root `lib/` Files (25 files)

| File                       | Purpose                           |
| -------------------------- | --------------------------------- |
| `affiliate.ts`             | Affiliate link configuration      |
| `affiliate-integration.ts` | Affiliate link auto-injection     |
| `analytics.ts`             | Google Analytics integration      |
| `article-status.ts`        | Article workflow status helpers   |
| `font-performance.ts`      | Font loading performance tracking |
| `html-to-markdown.ts`      | HTML to Markdown conversion       |
| `mailchimp.ts`             | Mailchimp API integration         |
| `mailchimp-errors.ts`      | Mailchimp error types             |
| `markdown.ts`              | Markdown processing pipeline      |
| `metadata.ts`              | SEO metadata generation           |
| `monitoring.ts`            | Application monitoring            |
| `opengraph.ts`             | OpenGraph tag utilities           |
| `optimized-imports.ts`     | Dynamic import optimization       |
| `performance-monitor.ts`   | Client-side performance tracking  |
| `reading-time.ts`          | Reading time calculation          |
| `resourcePreloader.ts`     | Resource preloading utility       |
| `responsive-utils.ts`      | Responsive design utilities       |
| `revalidation.ts`          | ISR revalidation utilities        |
| `session-manager.ts`       | Session management utilities      |
| `sitemap-utils.ts`         | Sitemap generation helpers        |
| `structured-data.ts`       | JSON-LD structured data           |
| `supabase.ts`              | Supabase client initialization    |
| `theme-utils.ts`           | Theme/dark mode utilities         |
| `twitter-cards.ts`         | Twitter card metadata             |
| `utils.ts`                 | General utility functions         |

### Lib Observations

- **Flat root has 25 files** -- many could be grouped (e.g., `affiliate.ts` + `affiliate-integration.ts`, `mailchimp.ts` + `mailchimp-errors.ts`, SEO-related files)
- **`lib/hooks/` (1 file) duplicates `src/hooks/` (20 files)** -- confusing dual location for hooks
- **`lib/services/` (8 files)** contains core business logic that other modules depend on
- **`lib/quiz/` (5 files)** is route-specific logic -- candidate for colocation with `/quiz` route

---

## `src/contexts/` -- React Contexts (4 files)

| File                      | Purpose                          |
| ------------------------- | -------------------------------- |
| `AuthContext.tsx`         | Authentication state and methods |
| `NotificationContext.tsx` | Real-time notification state     |
| `ThemeContext.tsx`        | Dark mode theme management       |
| `ToastContext.tsx`        | Toast notification state         |

Well-organized. All 4 contexts are genuinely app-wide. No changes needed for Phase 4.

---

## `src/hooks/` -- Custom Hooks (20 files)

| Hook                                 | Purpose                            |
| ------------------------------------ | ---------------------------------- |
| `useAdvancedIntersectionObserver.ts` | Enhanced intersection observer     |
| `useArticleValidation.ts`            | Article form validation            |
| `useAssetPerformance.ts`             | Asset loading performance tracking |
| `useAutosave.ts`                     | Draft auto-save functionality      |
| `useCodeBlockEnhancement.ts`         | Code block syntax highlighting     |
| `useDebounce.ts`                     | Debounce utility hook              |
| `useErrorRecovery.ts`                | Error recovery/retry logic         |
| `useImageUpload.ts`                  | Image upload handling              |
| `useIntersectionObserver.ts`         | Basic intersection observer        |
| `useLibraryState.ts`                 | Library page state management      |
| `useNotificationErrors.ts`           | Notification error handling        |
| `useNotificationPerformance.ts`      | Notification performance tracking  |
| `useNotifications.ts`                | Notification data fetching         |
| `useRealtimeDashboard.ts`            | Real-time dashboard data           |
| `useRetry.ts`                        | Retry logic for failed operations  |
| `useScrollSync.ts`                   | Scroll position synchronization    |
| `useSlugManagement.ts`               | URL slug generation/validation     |
| `useSubmissionFlow.ts`               | Article submission workflow        |
| `useSubmissionWithRecovery.ts`       | Submission with error recovery     |
| `useTagManagement.ts`                | Tag CRUD operations                |

### Hooks Observations

- **Flat structure** -- all 20 hooks in one directory with no grouping
- **Some hooks are route-specific:** `useArticleValidation`, `useAutosave`, `useSlugManagement`, `useSubmissionFlow`, `useSubmissionWithRecovery` are only used by the write/editor feature
- **`useIntersectionObserver` + `useAdvancedIntersectionObserver`** -- potential duplication, review for consolidation
- **`useNotificationErrors` + `useNotificationPerformance` + `useNotifications`** -- notification hooks could be grouped

---

## `src/fonts/` -- Font Assets (1 file)

Contains only `README.md`. Font configuration is handled in `src/app/layout.tsx` using Next.js font optimization. No actual font files are stored here.

---

## Summary for Phase 4

### Well-Organized (Keep as-is)

- `src/contexts/` -- 4 app-wide contexts, clean and purposeful
- `src/components/ui/` -- Good subdirectory organization with semantic grouping
- `src/components/error-handling/` -- Well-structured with boundaries/displays/pages/validation
- `src/app/api/` -- Logical grouping by resource type

### Needs Restructuring (Phase 4 priorities)

1. **Route-specific components in `components/`** (51 files): `admin/`, `affiliate/`, `home/`, `quiz/`, `resources/`, `editor/` should be colocated with their routes
2. **Flat `lib/` root** (25 files): Group related files (affiliate pair, mailchimp pair, SEO-related files)
3. **Dual hooks location**: `src/hooks/` (20 files) vs `src/lib/hooks/` (1 file) -- consolidate
4. **Route-specific lib modules**: `lib/quiz/` (5 files) should move near `/quiz` route
5. **Legacy `components/errors/`** (1 file): Likely superseded by `error-handling/` -- remove or merge

### Largest Directories (Restructuring Impact)

| Directory                    | Files | Priority                        |
| ---------------------------- | ----- | ------------------------------- |
| `components/ui/`             | 38    | Low (already well-organized)    |
| `components/error-handling/` | 17    | Low (well-organized)            |
| `components/articles/`       | 14    | Medium (shared, may stay)       |
| `components/effects/`        | 13    | Medium (audit usage first)      |
| `components/editor/`         | 13    | High (route-specific, colocate) |
| `components/quiz/`           | 11    | High (route-specific, colocate) |
| `components/admin/`          | 10    | High (route-specific, colocate) |
| `components/home/`           | 10    | High (route-specific, colocate) |

### Route-Specific vs Shared Component Ratio

- **Route-specific:** ~51 files (28%) -- candidates for colocation
- **Shared/app-wide:** ~132 files (72%) -- remain in `components/`

### Missing Infrastructure

- No `loading.tsx` for most routes (only `/articles` has one)
- No `error.tsx` for any sub-route (only root has one)
- No route groups (e.g., `(auth)`, `(dashboard)`) for layout sharing
- Debug API routes (`debug-articles`, `debug-user`, `example-optimized`) should be removed or gated
