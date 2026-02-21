# Environment Variable Audit

**Date:** 2026-02-17
**Status:** PASS
**Auditor:** Automated scan + manual verification

## Security Checks

### 1. .gitignore Coverage

All `.env` file patterns are properly gitignored (lines 18-22 of `.gitignore`):

```
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
```

**Result:** PASS

### 2. Tracked .env Files

```bash
git ls-files | grep -i "\.env"
# Result: empty (no .env files tracked)
```

**Result:** PASS

### 3. Hardcoded Secrets in Source

Scanned all `.ts` and `.tsx` files under `src/` for patterns: `sk_`, `api_key`, `secret`, `password`, `token`.

All matches are either:

- References to `process.env.*` (correct pattern)
- Supabase Auth SDK method names (`access_token`, `refresh_token`, `password` as form field names)
- Error message strings
- Type/interface property names

**No hardcoded secret values found in source code.**

**Result:** PASS

### 4. Server-Only Secret Isolation

| Secret Variable             | Used In                                                                  | Server-Only?     | Status |
| --------------------------- | ------------------------------------------------------------------------ | ---------------- | ------ |
| `SUPABASE_SERVICE_ROLE_KEY` | `src/lib/supabase.ts` (getSupabaseAdmin)                                 | Yes              | PASS   |
| `AI_API_KEY`                | `src/app/api/chat/route.ts`, `src/app/api/quiz/recommendations/route.ts` | Yes (API routes) | PASS   |
| `MAILCHIMP_API_KEY`         | `src/lib/mailchimp.ts` (server-side only)                                | Yes              | PASS   |
| `MAILCHIMP_WEBHOOK_SECRET`  | `src/app/api/newsletter/webhook/route.ts`                                | Yes (API route)  | PASS   |
| `REVALIDATION_TOKEN`        | `src/lib/revalidation.ts`, `src/app/api/revalidate/route.ts`             | Yes              | PASS   |

None of these variables use the `NEXT_PUBLIC_` prefix, confirming they are not exposed to the client bundle.

### 5. NEXT*PUBLIC* Variable Review

All `NEXT_PUBLIC_` prefixed variables contain non-secret, client-safe values:

| Variable                                | Contains Secret?                    | Status |
| --------------------------------------- | ----------------------------------- | ------ |
| `NEXT_PUBLIC_SUPABASE_URL`              | No (public URL)                     | PASS   |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`         | No (public anon key, RLS-protected) | PASS   |
| `NEXT_PUBLIC_SITE_URL`                  | No (site URL)                       | PASS   |
| `NEXT_PUBLIC_GA_ID`                     | No (analytics ID)                   | PASS   |
| `NEXT_PUBLIC_AMAZON_ASSOCIATE_ID`       | No (affiliate ID)                   | PASS   |
| `NEXT_PUBLIC_BARNES_NOBLE_AFFILIATE_ID` | No (affiliate ID)                   | PASS   |
| `NEXT_PUBLIC_GUMROAD_AFFILIATE_ID`      | No (affiliate ID)                   | PASS   |
| `NEXT_PUBLIC_PADDLE_AFFILIATE_ID`       | No (affiliate ID)                   | PASS   |
| `NEXT_PUBLIC_LEMONSQUEEZY_AFFILIATE_ID` | No (affiliate ID)                   | PASS   |
| `NEXT_PUBLIC_AUTO_INJECT_AFFILIATES`    | No (boolean flag)                   | PASS   |

## Complete Environment Variable Inventory

### Core Required Variables (in .env.local)

| Variable                        | Type   | Purpose                                 | Used In                                                                  |
| ------------------------------- | ------ | --------------------------------------- | ------------------------------------------------------------------------ |
| `NEXT_PUBLIC_SUPABASE_URL`      | Public | Supabase project URL                    | `src/lib/supabase.ts`, auth callback, middleware                         |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public | Supabase anonymous key (RLS-gated)      | `src/lib/supabase.ts`, auth callback                                     |
| `SUPABASE_SERVICE_ROLE_KEY`     | Secret | Supabase admin access (bypasses RLS)    | `src/lib/supabase.ts` (getSupabaseAdmin)                                 |
| `AI_API_KEY`                    | Secret | OpenAI-compatible API key for chat/quiz | `src/app/api/chat/route.ts`, `src/app/api/quiz/recommendations/route.ts` |
| `MAILCHIMP_API_KEY`             | Secret | Mailchimp newsletter integration        | `src/lib/mailchimp.ts`                                                   |
| `MAILCHIMP_SERVER_PREFIX`       | Config | Mailchimp datacenter prefix             | `src/lib/mailchimp.ts`                                                   |
| `MAILCHIMP_LIST_ID`             | Config | Mailchimp audience list ID              | `src/lib/mailchimp.ts`                                                   |

### Optional / Feature-Toggle Variables

| Variable                                | Type   | Purpose                                  | Used In                                                                                   | Default                                             |
| --------------------------------------- | ------ | ---------------------------------------- | ----------------------------------------------------------------------------------------- | --------------------------------------------------- |
| `NEXT_PUBLIC_SITE_URL`                  | Public | Site URL for OAuth redirects             | `src/contexts/AuthContext.tsx`, API routes                                                | `http://localhost:3000`                             |
| `NEXT_PUBLIC_GA_ID`                     | Public | Google Analytics tracking ID             | `src/app/layout.tsx`, `src/lib/analytics.ts`                                              | Not set (GA disabled)                               |
| `NEXTAUTH_URL`                          | Config | Base URL for SEO/metadata                | `src/components/seo/StructuredData.tsx`, `src/lib/metadata.ts`, `src/lib/revalidation.ts` | `https://straylight.dev` or `http://localhost:3000` |
| `AI_MODEL`                              | Config | AI model selection                       | `src/app/api/chat/route.ts`, `src/app/api/quiz/recommendations/route.ts`                  | `gpt-4o-mini`                                       |
| `AI_BASE_URL`                           | Config | AI API base URL                          | `src/app/api/chat/route.ts`, `src/app/api/quiz/recommendations/route.ts`                  | `https://api.openai.com/v1`                         |
| `REVALIDATION_TOKEN`                    | Secret | Token for ISR revalidation endpoint      | `src/lib/revalidation.ts`, `src/app/api/revalidate/route.ts`                              | Not set                                             |
| `MAILCHIMP_WEBHOOK_SECRET`              | Secret | Webhook verification secret              | `src/app/api/newsletter/webhook/route.ts`                                                 | Not set                                             |
| `NEXT_PUBLIC_AMAZON_ASSOCIATE_ID`       | Public | Amazon affiliate ID                      | `src/lib/affiliate.ts`                                                                    | Not set                                             |
| `NEXT_PUBLIC_BARNES_NOBLE_AFFILIATE_ID` | Public | Barnes & Noble affiliate ID              | `src/lib/affiliate.ts`                                                                    | Not set                                             |
| `NEXT_PUBLIC_GUMROAD_AFFILIATE_ID`      | Public | Gumroad affiliate ID                     | `src/lib/affiliate.ts`                                                                    | Not set                                             |
| `NEXT_PUBLIC_PADDLE_AFFILIATE_ID`       | Public | Paddle affiliate ID                      | `src/lib/affiliate.ts`                                                                    | Not set                                             |
| `NEXT_PUBLIC_LEMONSQUEEZY_AFFILIATE_ID` | Public | LemonSqueezy affiliate ID                | `src/lib/affiliate.ts`                                                                    | Not set                                             |
| `NEXT_PUBLIC_AUTO_INJECT_AFFILIATES`    | Public | Enable auto-injection of affiliate links | `src/lib/affiliate-integration.ts`                                                        | `true` (disabled when `'false'`)                    |
| `AFFILIATE_FORCE_REPLACE`               | Config | Force replace existing affiliate links   | `src/lib/affiliate-integration.ts`                                                        | `false`                                             |

### Debug / Development-Only Variables

| Variable               | Type   | Purpose                            | Used In                        | Default                           |
| ---------------------- | ------ | ---------------------------------- | ------------------------------ | --------------------------------- |
| `SIMULATE_SLOW_API`    | Config | Simulate slow API responses in dev | `src/lib/api/index.ts`         | Not set                           |
| `SIMULATE_API_ERRORS`  | Config | Simulate API errors in dev         | `src/lib/api/index.ts`         | Not set                           |
| `REDIS_URL`            | Config | Redis connection for rate limiting | `src/lib/api/rate-limiting.ts` | Not set (falls back to in-memory) |
| `RATE_LIMIT_WHITELIST` | Config | IP whitelist for rate limiting     | `src/lib/api/rate-limiting.ts` | Empty                             |
| `VERCEL_URL`           | Config | Auto-set by Vercel deployment      | `src/lib/revalidation.ts`      | Not set                           |

## Observations

### Note on NEXTAUTH_URL

The variable `NEXTAUTH_URL` is referenced in `StructuredData.tsx` (a server component, no `'use client'` directive) and `metadata.ts` (server-side metadata generation). Despite the name suggesting NextAuth.js, it is used purely as a base URL configuration. This is safe but could cause confusion. Consider renaming to `SITE_URL` or `BASE_URL` in a future cleanup phase.

### Note on Affiliate Server/Public Dual Pattern

`src/lib/affiliate.ts` checks both server-side (`AMAZON_ASSOCIATE_ID`) and public (`NEXT_PUBLIC_AMAZON_ASSOCIATE_ID`) variants of affiliate IDs. The server-side variants are never set anywhere else in the codebase, so the `NEXT_PUBLIC_` variants are effectively the only source. The dual-check pattern is harmless but unnecessary.

## Recommendations

1. **No runtime env validation exists** -- There is no Zod schema or startup check to validate that required environment variables are present and correctly formatted. Recommend adding this in a future phase (e.g., `src/lib/env.ts` with Zod validation at app startup).

2. **No `.env.example` file** -- There is no template file documenting required variables for new developers. Recommend creating one as part of developer experience improvements.

## Overall Status: PASS

All environment variables are properly secured:

- All `.env` files are gitignored
- No `.env` files are tracked by git
- No hardcoded secrets in source code
- All server-only secrets are used exclusively in server-side code
- All `NEXT_PUBLIC_` variables contain non-secret values
