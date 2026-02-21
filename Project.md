# StrayLight Project Analysis

## Essential Commands

### Development Commands

```bash
# Development
npm run dev                 # Start development server (Next.js)
npm run build              # Build for production
npm start                  # Start production server
npm run lint               # Run ESLint
npm run lint:fix           # Fix ESLint issues automatically
npm run format             # Format code with Prettier
npm run format:check       # Check code formatting

# Database & Migrations
# Check supabase/migrations/ for SQL migration files
# Use Supabase CLI or dashboard for database operations
```

## Architecture Overview

### Core Technology Stack

- **Framework**: Next.js 14 with App Router
- **Database**: Supabase (PostgreSQL with Row Level Security)
- **Authentication**: Supabase Auth with custom role-based middleware
- **Styling**: Tailwind CSS with custom design system
- **Content**: Markdown processing with TipTap editor
- **Deployment**: Vercel with automatic deployments

### Authentication & Authorization Architecture

**Multi-layered Security System:**

1. **Middleware Layer** (`middleware.ts`): Route-level protection with role-based access control
2. **Context Layer** (`src/contexts/AuthContext.tsx`): Client-side authentication state management
3. **Component Layer** (`src/components/ProtectedRoute.tsx`): Component-level access control
4. **Database Layer** (Supabase RLS): Row-level security policies

**User Roles**: `admin` | `moderator` | `member`

**Key Auth Components:**

- `src/lib/auth/admin-route-wrapper.tsx` - HOC for admin route protection
- `src/lib/auth/middleware-utils.ts` - Middleware utilities and route definitions
- `src/lib/auth/role-verification.ts` - Role validation logic
- `src/lib/session-manager.ts` - Session management utilities

### Database Schema

**Core Tables:**

- `users` - User profiles with roles, XP, badges
- `articles` - Content management with status workflow (draft → pending → published)
- `affiliate_library` - Curated affiliate content (books, tools)
- `votes` - User voting system
- `notifications` - Real-time notification system

**RLS Policies**: Each table has comprehensive Row Level Security policies in `supabase/migrations/`

### Content Management System

**Article Workflow:**

- Draft → Pending → Published → Archived
- Admin moderation system with bulk actions
- Real-time editor with autosave functionality
- Markdown processing with syntax highlighting

**Key Components:**

- `src/components/ArticleEditor.tsx` - TipTap-based rich text editor
- `src/components/admin/PendingArticlesList.tsx` - Admin moderation interface
- `src/lib/markdown.ts` - Markdown processing utilities

### Design System & Theming

**Theme System:**

- Dark/light mode support via `src/contexts/ThemeContext.tsx`
- Comprehensive color palette in `tailwind.config.js`
- Responsive design with custom breakpoints
- Accessibility-focused with dyslexic-friendly fonts

**Key Styling Classes:**

- `card-base` - Base card styling that adapts to theme
- Semantic color system: `neutral-*`, `primary-*`, `accent-*`
- Fluid typography with `fluid-*` classes

### Search & Performance

**Search Architecture:**

- Multi-layered search with autocomplete
- Performance monitoring and caching
- Real-time suggestions with debouncing

**Key Files:**

- `src/lib/services/search-service.ts` - Search implementation
- `src/lib/services/search-performance.ts` - Performance monitoring
- `src/components/AffiliateLibraryFilters.tsx` - Advanced filtering (recently optimized)

## Key Architectural Patterns

### Context Providers Stack

```typescript
// Standard provider order in layout.tsx
<AuthProvider>
  <ThemeProvider>
    <NotificationProvider>
      <ToastProvider>
        // App content
      </ToastProvider>
    </NotificationProvider>
  </ThemeProvider>
</AuthProvider>
```

### Route Protection Pattern

1. Middleware checks route requirements
2. Component-level ProtectedRoute wrapper
3. Hook-based access verification (`useAdminAccess`)
4. Database-level RLS enforcement

### Error Handling Strategy

- Comprehensive error boundaries in `src/components/errors/`
- User-friendly error messages via `src/lib/errors/errorMessages.ts`
- Toast notifications for user feedback
- Structured error logging with monitoring

### Content Processing Pipeline

1. Raw markdown input
2. Sanitization and processing (`src/lib/markdown.ts`)
3. Syntax highlighting with rehype-highlight
4. Frontmatter extraction for metadata
5. Reading time calculation

## Important Implementation Notes

### Supabase Integration

- Always use typed queries with Database type definitions
- Admin operations require `getSupabaseAdmin()` server-side
- RLS policies enforce data access - test thoroughly
- Migration files in `supabase/migrations/` follow numbered sequence

### Theme-Aware Development

- Use semantic color classes (`neutral-*`, not `gray-*`)
- Test components in both light and dark modes
- Leverage `card-base` and design system classes
- Consider accessibility and dyslexic-friendly options

### Performance Considerations

- Image optimization configured in `next.config.js`
- Debounced search inputs to prevent excessive API calls
- Lazy loading and code splitting where appropriate
- Vercel analytics and speed insights integrated

### SEO & Metadata

- Structured data for articles and organization
- Dynamic metadata generation per page
- Sitemap and robots.txt generation
- Social media card optimization

## Development Workflow

### File Organization

- **Pages**: `src/app/` (App Router structure)
- **Components**: `src/components/` (organized by feature/type)
- **Business Logic**: `src/lib/` (services, utilities, types)
- **Contexts**: `src/contexts/` (global state management)
- **Database**: `supabase/` (migrations, functions)

### Component Development

- Follow existing patterns in component structure
- Use TypeScript strictly - all components are typed
- Implement proper error boundaries
- Include loading states and skeletons
- Test responsive behavior across breakpoints

### Database Changes

1. Create migration in `supabase/migrations/`
2. Update type definitions in `src/lib/supabase.ts`
3. Test RLS policies thoroughly
4. Update related components and services

### Code Quality

- ESLint and Prettier configured
- Husky pre-commit hooks enabled
- Follow existing naming conventions
- Document complex business logic

## Recent Improvements

### Admin Dashboard Enhancements

- Added "Create Content" section with direct links to write articles and add library items
- Streamlined layout by removing unnecessary Database Management and Quick Actions sections
- Improved focus on core administrative functionality

### User Dashboard Redesign

- Simplified layout with essential information only
- Added visual status indicators for account verification, role, and session status
- Cleaner navigation with better visual hierarchy and descriptions
- Reduced complexity while maintaining functionality

### Library Filter Performance Optimization

- **Performance Improvements:**
  - Added 300ms debounced search to prevent excessive API calls
  - Optimized re-renders with `useCallback` and `useMemo`
  - Separated search state for immediate UI feedback
- **UI/UX Improvements:**
  - Full dark mode support with proper color schemes
  - Mobile responsive design with proper grid breakpoints
  - Modern styling with rounded corners and smooth transitions
  - Loading indicators and improved accessibility

---

_This project implements a comprehensive content management and community platform with advanced authentication, real-time features, and modern web standards._
