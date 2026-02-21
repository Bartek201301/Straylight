# Supabase Configuration

StrayLight uses Supabase (PostgreSQL) as its primary database. Migrations are managed via the **Supabase dashboard** and tracked in the hosted migration history, not as local files.

## Directory Structure

```
supabase/
  migrations/    Reserved for future Supabase CLI migrations (currently empty)
  functions/     Supabase Edge Functions (actively deployed)
  .temp/         CLI temporary files (gitignored)
```

### Edge Functions

- `process-notifications-cron` -- Scheduled notification processing
- `send-email-notifications` -- Email delivery for notifications
- `_shared/` -- Shared utilities across edge functions

## Migration History

The production database tracks **48 migrations** applied via the Supabase dashboard. The schema was built incrementally from user tables through articles, library items, votes, notifications, affiliate library, and performance optimizations.

Historical local migration files (44 SQL files with two incompatible naming conventions) were removed because they had zero version overlap with the production migration records. The original files are preserved in git history for reference.

## Current Schema Summary

### Users

```sql
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  handle TEXT UNIQUE NOT NULL,
  role user_role DEFAULT 'member' NOT NULL,  -- enum: admin, moderator, member
  xp INTEGER DEFAULT 0 NOT NULL CHECK (xp >= 0),
  badges JSONB DEFAULT '[]' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
```

### Articles

```sql
CREATE TABLE public.articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (LENGTH(title) > 0 AND LENGTH(title) <= 200),
  slug TEXT UNIQUE NOT NULL CHECK (LENGTH(slug) > 0 AND LENGTH(slug) <= 100),
  body_md TEXT NOT NULL CHECK (LENGTH(body_md) > 0),
  status article_status DEFAULT 'draft' NOT NULL,  -- enum: draft, pending, published, archived
  tags TEXT[] DEFAULT '{}' NOT NULL,
  excerpt TEXT CHECK (LENGTH(excerpt) <= 500),
  view_count INTEGER DEFAULT 0 NOT NULL CHECK (view_count >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  published_at TIMESTAMPTZ
);
```

### Library Items

```sql
CREATE TABLE public.library_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submitter_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (LENGTH(title) > 0 AND LENGTH(title) <= 300),
  description TEXT CHECK (LENGTH(description) <= 2000),
  url TEXT CHECK (url ~ '^https?://'),
  author TEXT CHECK (LENGTH(author) <= 200),
  item_type library_item_type NOT NULL,  -- enum: paper, book, video, article, website, tool, dataset
  tags TEXT[] DEFAULT '{}' NOT NULL,
  doi TEXT CHECK (LENGTH(doi) <= 100),
  isbn TEXT CHECK (LENGTH(isbn) <= 20),
  publication_year INTEGER CHECK (publication_year >= 1900),
  journal TEXT CHECK (LENGTH(journal) <= 200),
  submission_status TEXT DEFAULT 'pending' CHECK (submission_status IN ('pending', 'approved', 'rejected')) NOT NULL,
  view_count INTEGER DEFAULT 0 NOT NULL CHECK (view_count >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  approved_at TIMESTAMPTZ
);
```

### Votes

```sql
CREATE TABLE public.votes (
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  item_id UUID NOT NULL,
  item_type votable_item_type NOT NULL,  -- enum: article, library_item
  vote_type vote_type NOT NULL,          -- enum: upvote, downvote
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  PRIMARY KEY (user_id, item_id, item_type)
);
```

### Additional Tables

- **affiliate_library** -- Curated affiliate content (books, tools) with tags and metadata
- **notifications / notification_preferences** -- Real-time notification system with per-user preferences
- **newsletter_subscriptions** -- Newsletter signup management
- **resource_suggestions** -- User-submitted resource suggestions
- **images** -- Image metadata tracking

## Making Schema Changes

Schema changes should be applied via:

1. **Supabase Dashboard SQL Editor** -- For ad-hoc changes and migrations
2. **Supabase CLI** (`supabase db push`) -- For version-controlled migrations (use `migrations/` directory)

All tables use **Row Level Security (RLS)** policies. When modifying schema, ensure RLS policies are updated accordingly. See `supabase/migrations/` in git history for examples of RLS policy patterns.

## Security

- **RLS** enabled on all tables with granular read/write policies
- **Role-based access**: admin, moderator, member roles enforced at database level
- **Auth integration**: Automatic user profile creation on signup via triggers
- **Data validation**: Check constraints and foreign keys enforce data integrity
