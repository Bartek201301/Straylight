# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Essential Commands

### Development

```bash
npm run dev              # Start Next.js development server
npm run build            # Build for production
npm start               # Start production server
npm run lint            # Run ESLint
npm run lint:fix        # Fix ESLint issues automatically
npm run format          # Format code with Prettier
npm run format:check    # Check code formatting
```

### Testing & Quality

- No specific test commands found - check with maintainer if tests exist
- Always run `npm run lint` and `npm run build` after making changes
- Use `npm run format` to ensure consistent code style

## Architecture Overview

### Technology Stack

- **Framework**: Next.js 14 with App Router
- **Database**: Supabase (PostgreSQL with Row Level Security)
- **Authentication**: Supabase Auth with role-based middleware
- **Styling**: Tailwind CSS with comprehensive design system
- **Content**: TipTap rich text editor with Markdown processing
- **Deployment**: Vercel with analytics integration

### Authentication & Authorization

Multi-layered security system:

1. **Middleware** (`middleware.ts`): Route-level protection with role checking
2. **Context** (`src/contexts/AuthContext.tsx`): Client-side auth state management
3. **Components** (`src/components/ProtectedRoute.tsx`): Component-level access control
4. **Database** (RLS policies): Row-level security in Supabase

**User Roles**: `admin` | `moderator` | `member`

**Key Files**:

- `src/lib/auth/middleware-utils.ts` - Route definitions and role checking
- `src/lib/auth/role-verification.ts` - Role validation logic
- `src/lib/session-manager.ts` - Session utilities

### Database Architecture

**Core Tables**:

- `users` - User profiles with roles, XP, badges
- `articles` - Content with workflow: draft → pending → published → archived/rejected
- `affiliate_library` - Curated affiliate content (books, tools)
- `votes` - User voting system for articles/library items
- `notifications` - Real-time notification system
- `newsletter_subscriptions` - Newsletter management
- `resource_suggestions` - User-submitted resource suggestions

**Important**: All tables use comprehensive RLS policies defined in `supabase/migrations/`

### Supabase Integration

- Use `supabase` client for frontend operations
- Use `getSupabaseAdmin()` for server-side admin operations (bypasses RLS)
- Always use typed queries with Database type definitions from `src/lib/supabase.ts`
- Migration files in `supabase/migrations/` follow numbered sequence

### Design System & Theming

**Dark Mode System**:

- Context: `src/contexts/ThemeContext.tsx`
- Configuration: `tailwind.config.js` with class-based dark mode
- Optimized for single theme performance

**Key Design Patterns**:

- Use semantic colors: `neutral-*`, `primary-*`, `accent-*` (not `gray-*`)
- Base component: `card-base` for consistent dark styling
- Responsive breakpoints include special cases: `mobile`, `tablet`, `desktop`
- AI-first accent colors: `ai-teal-500`, `ai-purple-500`

### Component Architecture

**Base Components**: `src/components/ui/`

- Error handling with boundaries in `src/components/errors/`
- Loading states and skeletons in `src/components/ui/skeletons/`
- Toast notifications via `src/contexts/ToastContext.tsx`

**Content Components**:

- `src/components/ArticleEditor.tsx` - TipTap-based rich text editor
- `src/components/MarkdownPreview.tsx` - Markdown rendering
- `src/components/admin/PendingArticlesList.tsx` - Admin moderation

## Development Guidelines

### File Organization

- **Pages**: `src/app/` (App Router structure)
- **Components**: `src/components/` (organized by feature/type)
- **Business Logic**: `src/lib/` (services, utilities, types)
- **Database**: `supabase/migrations/` (numbered SQL files)

### Code Conventions

- TypeScript strict mode - all components must be typed
- Use existing patterns for component structure
- Follow semantic color system (never `gray-*`, use `neutral-*`)
- Ensure consistent dark mode styling across all UI changes
- Include proper error boundaries and loading states

### Authentication Patterns

```typescript
// Component-level protection
<ProtectedRoute requireAuth requiredRole="admin">
  <AdminComponent />
</ProtectedRoute>

// Hook usage
const { user, session, loading } = useAuth();

// Server-side admin operations
const admin = getSupabaseAdmin();
const { data } = await admin.from('articles').select('*');
```

### Database Changes Workflow

1. Create migration in `supabase/migrations/xxx_description.sql`
2. Update types in `src/lib/supabase.ts`
3. Test RLS policies thoroughly
4. Update related components and services

### Dark Mode Development

- Use consistent dark mode styling throughout
- Use `card-base` class for uniform container styling
- Leverage semantic color classes: `bg-dark-800`, `text-neutral-300`

### Performance Considerations

- Images configured in `next.config.js` with optimization
- Debounced search inputs prevent excessive API calls
- Vercel analytics and speed insights integrated
- Bundle optimization with SWC minification enabled

### Content Processing

Markdown pipeline: Raw input → Sanitization → Syntax highlighting → Metadata extraction → Reading time calculation

Key files:

- `src/lib/markdown.ts` - Core markdown processing
- `src/lib/reading-time.ts` - Reading time calculation
- `src/components/ArticleEditor.tsx` - Rich text editing

### Newsletter System

Architecture supports both full-featured home page signup and miniature versions on subpages with automatic page detection and consistent API integration.

## Important Notes

- Never commit secrets or keys
- RLS policies enforce data security - test access patterns thoroughly
- Admin operations require `getSupabaseAdmin()` server-side only
- All user-facing text should be accessible and readable in dark mode
- Follow existing error handling patterns with proper user feedback
