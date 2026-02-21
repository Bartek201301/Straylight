# External Integrations

**Analysis Date:** 2026-02-16

## APIs & External Services

**Email Marketing:**

- Mailchimp - Newsletter management and email campaigns
  - SDK/Client: `@mailchimp/mailchimp_marketing` v3.0.80
  - Auth: `MAILCHIMP_API_KEY` (required)
  - Configuration: `MAILCHIMP_SERVER_PREFIX`, `MAILCHIMP_LIST_ID`
  - Webhook: `MAILCHIMP_WEBHOOK_SECRET` for webhook validation
  - Implementation: `src/lib/mailchimp.ts`, `src/lib/mailchimp-errors.ts`
  - Endpoints: `src/app/api/newsletter/subscribe/route.ts`, `src/app/api/newsletter/webhook/route.ts`

**Affiliate & Monetization:**

- Amazon Associates - Book and product affiliate links
  - Config: `NEXT_PUBLIC_AMAZON_ASSOCIATE_ID`
  - Implementation: `src/lib/affiliate.ts`, `src/lib/affiliate-integration.ts`

- Barnes & Noble Affiliates - Book retail affiliate links
  - Config: `NEXT_PUBLIC_BARNES_NOBLE_AFFILIATE_ID`

- Gumroad - Digital product affiliate links
  - Config: `NEXT_PUBLIC_GUMROAD_AFFILIATE_ID`

- LemonSqueezy - SaaS product affiliate links
  - Config: `NEXT_PUBLIC_LEMONSQUEEZY_AFFILIATE_ID`

- Paddle - SaaS payment processing affiliate links
  - Config: `NEXT_PUBLIC_PADDLE_AFFILIATE_ID`

**AI/LLM (Optional):**

- Generic AI API support
  - Configuration: `AI_BASE_URL`, `AI_API_KEY`, `AI_MODEL`
  - Used for: Chat functionality (if enabled)
  - Implementation: `src/app/api/chat/route.ts`

## Data Storage

**Databases:**

- Supabase (PostgreSQL)
  - Provider: Managed PostgreSQL via Supabase
  - Connection: `NEXT_PUBLIC_SUPABASE_URL` (client-side), `SUPABASE_SERVICE_ROLE_KEY` (server-side)
  - Client: `@supabase/supabase-js` v2.52.0 with SSR support
  - ORM/Access: Raw SQL via Supabase client with Row-Level Security (RLS)
  - Schema location: `supabase/migrations/` (numbered migration files)
  - Tables: users, articles, library_items, votes, affiliate_library, newsletter_subscriptions, resource_suggestions
  - Type definitions: `src/lib/supabase.ts` (Database type exports)

**Caching:**

- Redis (Optional)
  - Provider: External Redis instance or in-memory fallback
  - Connection: `REDIS_URL` (optional)
  - Client: `ioredis` v5.7.0
  - Purpose: Rate limiting, query caching, session storage
  - Fallback: In-memory rate limiter via `src/lib/api/rate-limiting.ts` when Redis unavailable

**File Storage:**

- Supabase Storage
  - Provider: Built-in S3-compatible storage in Supabase
  - Usage: Article cover images, user avatars, affiliate item images
  - Access: Via Supabase client from `src/lib/supabase.ts`
  - URL pattern: `https://*.supabase.co/storage/v1/object/public/**` (allowed in Next.js image config)

**Search:**

- Caching only - no dedicated search engine (Elasticsearch, Algolia)
  - Implementation: Query caching in `src/lib/cache/query-cache.ts`
  - Search optimization: `src/lib/services/search-cache.ts`
  - API: `src/app/api/tags/suggest/route.ts` for tag autocomplete

## Authentication & Identity

**Auth Provider:**

- Supabase Auth - PostgreSQL-backed authentication
  - Implementation: `src/lib/supabase.ts` with PKCE flow configured
  - Realtime: Enabled with event limits (2 events/second for frontend, disabled for admin)
  - Configuration:
    - `persistSession: true` - Local storage session persistence
    - `autoRefreshToken: true` - Automatic token refresh
    - `detectSessionInUrl: true` - OAuth callback detection
    - `flowType: 'pkce'` - Secure flow for browser apps
  - Client auth: `src/contexts/AuthContext.tsx`
  - Server auth: `src/lib/auth/middleware-utils.ts`
  - Route protection: `middleware.ts` with role-based access control
  - User roles: admin, moderator, member
  - Session management: `src/lib/session-manager.ts`

## Monitoring & Observability

**Error Tracking:**

- Not detected - No Sentry, DataDog, or similar error tracking service configured

**Logs:**

- Console-only logging
  - Development: `console.log`, `console.error`, `console.warn`
  - Production: No centralized log aggregation detected
  - Custom logging: `src/lib/mailchimp-errors.ts` includes error parsing and logging utilities

**Analytics:**

- Google Analytics
  - Integration: `NEXT_PUBLIC_GA_ID` environment variable
  - Implementation: `src/app/layout.tsx` (Google Tag Manager script)
  - Client SDK: `src/lib/analytics.ts`

- Vercel Analytics
  - Integration: `@vercel/analytics` v1.5.0
  - Implementation: `src/app/layout.tsx` (imported as Analytics component)
  - Tracks: Page views, Web Vitals

- Vercel Speed Insights
  - Integration: `@vercel/speed-insights` v1.2.0
  - Implementation: `src/app/layout.tsx` (imported as SpeedInsights component)
  - Tracks: Core Web Vitals, performance metrics

## CI/CD & Deployment

**Hosting:**

- Vercel - Recommended deployment platform
  - Optimizations: SWC minification, dynamic imports, image optimization
  - Environment: Node.js 18+ runtime
  - Build: `npm run build` with asset compression
  - Caching: Configured cache headers in `next.config.js`

**CI Pipeline:**

- Husky 8.0.0 - Git hooks
  - Pre-commit hooks via `lint-staged` (configured in `.lintstagedrc.json`)
  - Runs ESLint and Prettier on staged files before commit

## Environment Configuration

**Required env vars:**

- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Public Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` - Private service key (server-side only)
- `MAILCHIMP_API_KEY` - Mailchimp API authentication
- `MAILCHIMP_SERVER_PREFIX` - Mailchimp server identifier (e.g., "us1")
- `MAILCHIMP_LIST_ID` - Newsletter list ID in Mailchimp

**Optional env vars:**

- `REDIS_URL` - Redis connection string for distributed rate limiting
- `NEXT_PUBLIC_GA_ID` - Google Analytics tracking ID
- `NEXT_PUBLIC_SITE_URL` - Canonical site URL (defaults to localhost:3000)
- `MAILCHIMP_WEBHOOK_SECRET` - Webhook signature validation
- `AI_BASE_URL`, `AI_API_KEY`, `AI_MODEL` - LLM configuration
- Affiliate IDs: Amazon, Barnes & Noble, Gumroad, LemonSqueezy, Paddle
- `RATE_LIMIT_WHITELIST` - Comma-separated IPs to exclude from rate limiting

**Secrets location:**

- Environment files (`.env.local`, `.env.production`) - Not committed to git
- Vercel deployment: Environment variables in project settings
- Development: Local `.env.local` file with secrets

## Webhooks & Callbacks

**Incoming:**

- Mailchimp webhooks
  - Endpoint: `src/app/api/newsletter/webhook/route.ts`
  - Purpose: Newsletter subscription updates, list changes
  - Validation: `MAILCHIMP_WEBHOOK_SECRET` HMAC verification
  - Status: Implemented with error handling and database sync

- Supabase auth callbacks
  - Endpoint: `src/app/auth/callback/route.ts`
  - Purpose: OAuth and email confirmation redirects
  - Flow: Handles password reset, email confirmation, OAuth provider callbacks

**Outgoing:**

- Newsletter signups to Mailchimp
  - Direction: Database → Mailchimp API
  - Endpoint: `POST /api/newsletter/subscribe`
  - Implementation: `src/lib/mailchimp.ts` (addNewsletterSubscriber)

- Analytics events to Vercel & Google Analytics
  - Direction: Browser → Vercel Analytics, Google Analytics
  - Automatic tracking of page views and Web Vitals

---

_Integration audit: 2026-02-16_
