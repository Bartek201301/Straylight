# Coding Conventions

**Analysis Date:** 2026-02-16

## Naming Patterns

**Files:**

- Components: PascalCase (e.g., `ArticleEditor.tsx`, `ToastContext.tsx`)
- Utilities/Services: camelCase (e.g., `affiliate.ts`, `markdown.ts`, `analytics.ts`)
- Constants files: camelCase (e.g., `article-status.ts`)
- Routes/Pages: kebab-case in path with PascalCase components (e.g., `src/app/admin/articles/page.tsx`)
- Context files: PascalCase with `Context` suffix (e.g., `AuthContext.tsx`, `ThemeContext.tsx`)

**Functions:**

- Use camelCase for all function names
- Private/internal functions: prefix with underscore for clarity (e.g., `_getClientIP`)
- Async functions: follow camelCase (e.g., `fetchUserProfile`, `approveArticles`)
- Helper functions: descriptive verbs (e.g., `createRedirectURL`, `generateRequestId`, `matchesRoute`)

**Variables:**

- Constants: UPPER_SNAKE_CASE (e.g., `DEFAULT_ROUTE_PROTECTION`, `CACHE_DURATION`)
- Regular variables: camelCase (e.g., `userInfo`, `articleIds`, `currentMarkdown`)
- Boolean variables: prefix with `is`, `has`, `should`, `can` (e.g., `isAuthenticated`, `hasError`, `shouldBypassAPI`)
- React state variables: descriptive camelCase (e.g., `authState`, `showSubmissionDialog`)

**Types:**

- Interface names: PascalCase (e.g., `RouteProtection`, `UserInfoFromCookies`, `Toast`)
- Type names: PascalCase (e.g., `UserRole`, `ArticleStatus`, `AuthEventType`)
- Enum values: UPPER_SNAKE_CASE (e.g., `SIGNED_IN`, `PASSWORD_RECOVERY`)
- Generic type parameters: Single uppercase letter or descriptive PascalCase (e.g., `<T>`, `<Response>`)

## Code Style

**Formatting:**

- Prettier: Configured in `.prettierrc`
- Tab width: 2 spaces
- Print width: 80 characters
- Quotes: Single quotes (`'`) for strings
- Semicolons: Always required
- Trailing comma: ES5 style (`trailingComma: es5`)
- Tabs: Never use tabs, always spaces

**Linting:**

- ESLint: `next/core-web-vitals` extends
- React rules enforced:
  - `react/no-unescaped-entities`: error
  - `@next/next/no-img-element`: warn (use Next.js Image component)
  - `react-hooks/exhaustive-deps`: warn
- Variable rules:
  - `prefer-const`: error (always use const over let)
  - `no-unused-vars`: warn with underscore ignore pattern (unused params start with `_`)
- Target: ES2022 with browser and node environments

**Auto-formatting:**

- Pre-commit hooks via husky + lint-staged
- Stages before commit: ESLint fix + Prettier write for TypeScript/JavaScript
- Additional stages: Prettier write for JSON, CSS, markdown

## Import Organization

**Order:**

1. React and Next.js imports (e.g., `import React from 'react'`, `import { NextRequest } from 'next/server'`)
2. Third-party library imports (e.g., `import { useEditor } from '@tiptap/react'`, `import { z } from 'zod'`)
3. Relative imports from `@/` path alias (e.g., `import { supabase } from '@/lib/supabase'`)
4. Context imports (e.g., `import { useAuth } from '@/contexts/AuthContext'`)
5. Type imports (using `import type` for TypeScript types only)

**Path Aliases:**

- `@/*` → `./src/*` (configured in `tsconfig.json`)
- Use `@/` for all internal imports, never relative paths (`../`)
- Examples:
  - `@/lib/supabase` (libraries)
  - `@/contexts/AuthContext` (React contexts)
  - `@/components/editor/ArticleEditor` (components)
  - `@/lib/auth/middleware-utils` (auth utilities)

## Error Handling

**Patterns:**

1. **Custom Error Classes** (in `src/lib/api/error-handling.ts`):
   - Base class: `ApiError` with `statusCode`, `code`, `details`, `requestId`
   - Specific: `ValidationError`, `AuthenticationError`, `AuthorizationError`, `NotFoundError`, `ConflictError`, `RateLimitError`, `DatabaseError`, `ExternalServiceError`
   - All extend `ApiError` for consistent serialization

2. **Error Handling Flow**:

   ```typescript
   // API routes use try-catch with handleApiError wrapper
   try {
     const validatedData = ApprovalRequestSchema.parse(body);
     // ... operation
     return NextResponse.json(response, { status: 200 });
   } catch (error) {
     if (error instanceof z.ZodError) {
       return NextResponse.json(
         { error: 'Invalid request data', code: 'VALIDATION_ERROR', details: ... },
         { status: 400 }
       );
     }
     return NextResponse.json(
       { error: 'Internal server error', code: 'INTERNAL_ERROR', timestamp: ... },
       { status: 500 }
     );
   }
   ```

3. **Validation with Zod**:
   - Always validate request bodies with Zod schemas
   - Use descriptive error messages
   - Max limits on arrays (e.g., `.max(100)` for bulk operations)
   - Pattern validation for URLs, emails, handles
   - Examples in `src/lib/validation/affiliate-library.ts`

4. **Auth Context Error Handling** (in `src/contexts/AuthContext.tsx`):
   - Catch all auth operation errors
   - Set error in state: `setAuthState((prev) => ({ ...prev, error: authError }))`
   - Return standardized response: `{ user: null, session: null, error }`
   - Never throw errors from hooks directly; let consumers handle via state

## Logging

**Framework:** `console` module (no external logging library)

**Patterns:**

1. **Prefixes by Component** (emoji + bracketed name):
   - `🚀 [AuthContext]` - Initialization logs
   - `👤 [AuthContext]` - User data logs
   - `✅ [AuthContext]` - Success logs
   - `❌ [AuthContext]` - Error logs
   - `⚠️` - Warning logs
   - `🔍` - Debug/info logs
   - `🔒` - Security-related logs
   - `📧` - Email/notifications logs

2. **Severity Levels**:
   - `console.error()` - Errors and failures (API errors, auth failures, unexpected exceptions)
   - `console.warn()` - Warnings and edge cases (slow responses, missing data, validation failures)
   - `console.log()` - Info about operation success and state changes

3. **Information to Log**:
   - Authentication state changes (user ID, role, session presence)
   - API request/response details (method, status, timing)
   - Route protection decisions (allowed/denied/redirect)
   - Data validation failures
   - Performance metrics (slow requests > 1000ms)
   - Never log: passwords, tokens, API keys, PII without anonymization

4. **Example from middleware**:
   ```typescript
   console.log('🚀 [AuthContext] Starting authentication initialization');
   console.log('✅ [AuthContext] Auth state updated successfully');
   console.error('❌ [AuthContext] Auth state change failed:', error);
   ```

## Comments

**When to Comment:**

- Complex authentication/authorization logic
- Non-obvious workarounds or hacks
- Performance-critical sections
- Database queries with special conditions
- JSDoc for exported functions and types

**JSDoc/TSDoc:**

- Use JSDoc for public functions, especially in API routes
- Format: `/** Description */` above function
- Include `@param` and `@returns` for complex signatures
- Example from `src/app/api/admin/articles/approve/route.ts`:
  ```typescript
  /**
   * Approve Articles API Endpoint
   * POST /api/admin/articles/approve
   *
   * Securely approves one or more articles with comprehensive audit logging
   * and optimistic locking for concurrent modification handling
   */
  async function approveArticles(...) { ... }
  ```

## Function Design

**Size:**

- Keep functions under 100 lines when possible
- Use helper functions to break up long operations
- Example: `logApprovalAction()` extracted from main handler

**Parameters:**

- Use object destructuring for multiple parameters
- Prefer typed objects over many positional params
- Optional params as trailing destructured properties with defaults
- Example: `function createSuccessResponse<T>(data: T, options: { status?: number; ... } = {})`

**Return Values:**

- Always return consistent types (avoid mixed return types)
- Use discriminated unions for multiple return types: `{ success: true; data: T } | { success: false; error: string }`
- Async functions return Promises
- API handlers return `NextResponse` or `Response` objects
- Context hooks return destructured object: `{ user, session, loading, error, ...methods }`

## Module Design

**Exports:**

- Named exports for utilities: `export function matchesRoute() { ... }`
- Default export for components: `export default function MyComponent() { ... }`
- Mixed exports from contexts (default provider, named hooks):
  ```typescript
  export function AuthProvider() { ... }
  export function useAuth() { ... }
  ```

**Barrel Files:**

- Use index files to organize complex modules
- Example in `src/lib/api/index.ts` for API utilities
- Re-export from barrel for cleaner imports

## React Component Patterns

**Functional Components:**

- All components must be functional (no class components except error boundaries)
- Use `React.memo()` for expensive re-render prevention
- Example: `const ArticleEditorComponent = React.memo(function ArticleEditor() { ... })`

**Hooks:**

- Custom hooks exported from `src/lib/hooks/` or directly in context files
- Use `useCallback` for event handlers passed to children
- Use `useMemo` for expensive computations and context values
- Use `useEffect` for side effects with proper dependency arrays

**Props:**

- Define typed interfaces for all props ending in `Props`
- Example: `interface ArticleEditorProps { ... }`
- Use discriminated unions for conditional props
- Default values via destructuring

**Error Boundaries:**

- Implemented as class components (required by React spec)
- Example: `ArticleEditorErrorBoundary` catches editor crashes
- Display user-friendly error UI with retry button

---

_Convention analysis: 2026-02-16_
