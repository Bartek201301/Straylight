# Testing Patterns

**Analysis Date:** 2026-02-16

## Test Framework

**Status:** Not detected

**Current State:**

- No testing framework installed (Jest, Vitest, or similar absent from `package.json`)
- No test files found in codebase (no `.test.ts`, `.test.tsx`, `.spec.ts` files)
- `package.json` lacks test-related scripts (`test`, `test:watch`, `test:coverage`)

**Implications:**

- Testing is not currently implemented
- When testing is added, establish patterns and guidelines in this document
- Manual testing via development server is current approach

## Testing Infrastructure Gaps

**What's Missing:**

1. Test runner (Jest, Vitest, or Playwright)
2. Assertion library (unless using test runner bundled version)
3. Testing utilities (React Testing Library, @testing-library/react, @testing-library/jest-dom)
4. Mock utilities (jest.mock, vi.mock, or similar)
5. E2E testing framework (Playwright, Cypress, etc.)

**Recommended Setup:**

- Use Jest with TypeScript support for unit/integration tests
- Or use Vitest for faster iteration (ESM-native, Vite-compatible)
- Add React Testing Library for component testing
- Consider Playwright for E2E testing (Next.js default)

## Code Patterns Suitable for Testing

### 1. Validation Schemas (High Priority)

**Location:** `src/lib/validation/affiliate-library.ts`

Current pattern:

```typescript
export const AffiliateLibraryItemSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(300, 'Title must not exceed 300 characters')
    .trim(),
  // ... more fields
});
```

**Testable scenarios:**

- Valid schema passes
- Min/max length validation
- URL format validation
- Enum type validation
- Unique constraint validation (tags array)
- Nullable vs optional field handling

### 2. Error Handling Classes (High Priority)

**Location:** `src/lib/api/error-handling.ts`

Current pattern:

```typescript
export class ApiError extends Error {
  constructor(
    message: string,
    statusCode: number = 500,
    code?: string,
    details?: any,
    requestId?: string
  ) { ... }
  toJSON() { ... }
}

export class ValidationError extends ApiError { ... }
export class AuthenticationError extends ApiError { ... }
```

**Testable scenarios:**

- Error instantiation with all parameters
- Default code assignment based on statusCode
- Error serialization to JSON
- Specific error class inheritance
- Stack trace preservation

### 3. Utility Functions (Medium Priority)

**Location:** `src/lib/auth/middleware-utils.ts`

Current patterns:

```typescript
export function matchesRoute(pathname: string, route: string): boolean { ... }
export function isPublicRoute(pathname: string, config?: RouteProtection): boolean { ... }
export function getRequiredRoles(pathname: string, config?: RouteProtection): UserRole[] | null { ... }
export function hasRequiredRole(userRole: string | null, requiredRoles: UserRole[]): boolean { ... }
```

**Testable scenarios:**

- Exact route matching
- Wildcard route matching (`/*`)
- Prefix route matching (`/admin/`)
- Route detection (public vs protected)
- Role validation logic
- Edge cases (null userRole, empty arrays)

### 4. API Route Handlers (High Priority)

**Location:** `src/app/api/admin/articles/approve/route.ts`

Current pattern:

```typescript
async function approveArticles(
  request: NextRequest,
  context: { user: { id: string; email: string; role: string } }
) {
  const body = await request.json();
  const validatedData = ApprovalRequestSchema.parse(body);
  // ... fetch articles, validate status, update
  return NextResponse.json(response, { status: 200 });
}
```

**Testable scenarios:**

- Valid request processing
- Validation error handling (Zod)
- Article state validation (pending status only)
- Audit logging
- HTTP method restrictions (405 for non-POST)
- Content-Type validation

### 5. React Context (Medium Priority)

**Location:** `src/contexts/AuthContext.tsx`

Current pattern:

```typescript
export function useAuth(): UseAuthReturn {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

const signUp = useCallback(
  async (formData: SignUpFormData): Promise<SignUpResponse> => {
    // ... validation and async operation
  },
  []
);
```

**Testable scenarios:**

- Hook usage outside provider throws error
- Auth state initialization
- Sign up flow (success and error)
- Sign in with OAuth flow
- Token refresh
- Profile fetch and caching
- User state transitions

### 6. React Components (Medium Priority)

**Location:** `src/components/editor/ArticleEditor.tsx`

Current pattern:

```typescript
const ArticleEditorComponent = React.memo(function ArticleEditor({
  onSave,
  onSubmit,
  initialContent = '',
  // ... props
}: ArticleEditorProps) {
  const { resolvedTheme } = useTheme();
  const editor = useEditor({ extensions: [...], content: ... });
  // ... render logic
});
```

**Testable scenarios:**

- Component renders with default props
- Editor state updates on content change
- Save/submit callbacks triggered
- Theme switching (dark mode)
- Error boundary catches editor crashes
- Auto-save functionality

## Testing Strategy by Category

### Unit Tests

**Scope:** Pure functions, utilities, validation

**Examples to implement:**

- `src/lib/auth/middleware-utils.ts` route matching functions
- `src/lib/api/error-handling.ts` error classes
- `src/lib/validation/` Zod schemas

**Approach:**

- Test functions with various inputs (valid, invalid, edge cases)
- Mock external dependencies minimally
- Assert return values and thrown errors

### Integration Tests

**Scope:** API routes with Supabase, auth flows, database queries

**Examples to implement:**

- API route handlers with Supabase mocking
- Auth context with mocked session manager
- Database operations with connection testing

**Approach:**

- Mock Supabase client responses
- Test full request/response cycle
- Verify error handling and logging

### Component Tests

**Scope:** React components with UI interactions

**Examples to implement:**

- ArticleEditor component
- Auth forms (sign up, sign in)
- Toast/notification system
- Modal dialogs

**Approach:**

- Render with React Testing Library
- Simulate user interactions (typing, clicking)
- Assert DOM changes and callbacks
- Use `userEvent` instead of `fireEvent`

### E2E Tests

**Scope:** Full user workflows across pages

**Examples to implement:**

- User authentication flow (sign up → email verification → login)
- Article creation and publication
- Admin approval workflow
- Search functionality

**Approach:**

- Use Playwright for browser automation
- Test against staging/test database
- Verify analytics/redirects

## Mock Patterns (When Tests Are Implemented)

**What to Mock:**

- External services (Supabase, Mailchimp, analytics)
- Next.js modules (router, headers, cookies)
- Environment variables
- Date/time for consistent testing
- Random ID generation

**What NOT to Mock:**

- Core business logic
- Utility functions (test real behavior)
- Standard library APIs (fs, path, etc.)
- Internal modules (mount real implementations)

**Mock Examples (Pseudo-code for future implementation):**

```typescript
// Mock Supabase client
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: { ... },
    from: vi.fn().mockReturnValue({ ... }),
  }
}));

// Mock Zod parsing
const mockParse = vi.spyOn(schema, 'parse');
mockParse.mockImplementation((data) => ({ ... }));

// Mock Next.js router
vi.mock('next/router', () => ({
  useRouter: () => ({ push: vi.fn(), ... })
}));

// Mock environment
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
```

## Test Data & Fixtures

**Currently:** No fixtures or test data files exist

**Recommended Structure** (when tests added):

```
tests/
├── fixtures/
│   ├── users.ts          # Mock user objects
│   ├── articles.ts       # Mock article data
│   ├── auth-responses.ts # Supabase auth responses
│   └── index.ts          # Barrel export
├── unit/
│   ├── lib/
│   │   └── auth/
│   │       └── middleware-utils.test.ts
│   └── api/
│       └── error-handling.test.ts
├── integration/
│   └── api/
│       └── articles/
│           └── approve.test.ts
└── e2e/
    └── auth.spec.ts
```

**Example Fixture** (pseudo-code):

```typescript
// tests/fixtures/users.ts
export const testUser = {
  id: 'uuid-1234',
  email: 'test@example.com',
  role: 'member' as const,
  handle: 'testuser',
  created_at: '2026-01-01T00:00:00Z',
};

export const adminUser = {
  ...testUser,
  id: 'uuid-admin',
  role: 'admin' as const,
};
```

## Code Coverage Targets

**Current:** No coverage tracking (tests not implemented)

**Recommended Targets** (when tests added):

- Overall: 70% minimum
- Utilities: 90% (auth, validation, error handling)
- API routes: 80% (handlers, validation, error cases)
- Components: 60% (renders, interactions, edge cases)
- Contexts: 75% (initialization, state changes, effects)

**Coverage Commands** (to implement):

```bash
npm run test              # Run all tests
npm run test:watch       # Watch mode
npm run test:coverage    # Generate coverage report
```

## Testing Best Practices to Follow

1. **Descriptive Test Names:**
   - Use `describe()` for grouping related tests
   - Test name format: `it('should [action] when [condition]')`
   - Example: `it('should return null when user is not authenticated')`

2. **Arrange-Act-Assert Pattern:**

   ```typescript
   it('should approve pending articles', () => {
     // Arrange: Set up test data
     const articleIds = ['id-1', 'id-2'];
     const mockArticles = [{ id: 'id-1', status: 'pending' }, ...];

     // Act: Execute function
     const result = approveArticles(articleIds);

     // Assert: Verify outcome
     expect(result.success).toBe(true);
     expect(result.approved).toBe(2);
   });
   ```

3. **Isolated Tests:**
   - Each test should be independent
   - No shared state between tests
   - Clean up after each test (afterEach hooks)

4. **Error Cases Always:**
   - Test happy path
   - Test error conditions
   - Test edge cases (null, empty, invalid input)

5. **Async Testing:**
   - Use `async/await` in test functions
   - Wait for promises: `await waitFor(() => { ... })`
   - Mock timers for debounce/throttle testing

6. **Component Testing:**
   - Query by accessible roles/labels, not implementation details
   - Use `userEvent` library for interactions (better than `fireEvent`)
   - Test accessibility (`getByRole`, `getByLabelText`)

## Performance Considerations for Tests

- Keep unit tests fast (< 100ms per test)
- Integration tests acceptable up to 500ms
- Use test timeouts: `{ timeout: 5000 }` for slow tests
- Parallelize test execution when possible
- Cache expensive setup between tests (database seeding)

---

_Testing analysis: 2026-02-16_

**Note:** This document outlines current state (no tests) and provides templates for implementation. Once testing framework is established, update with real test examples and patterns.
