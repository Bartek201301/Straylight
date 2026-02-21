# Row-Level Security (RLS) Documentation and Security Guidelines

## Table of Contents

1. [Overview](#overview)
2. [RLS Policy Implementation by Table](#rls-policy-implementation-by-table)
3. [Security Best Practices](#security-best-practices)
4. [Troubleshooting Guide](#troubleshooting-guide)
5. [Policy Update Procedures](#policy-update-procedures)
6. [Usage Examples](#usage-examples)
7. [Common Security Pitfalls](#common-security-pitfalls)
8. [Maintenance and Monitoring](#maintenance-and-monitoring)
9. [Testing and Validation](#testing-and-validation)

## Overview

Row-Level Security (RLS) is implemented across all database tables in the StrayLight application to ensure data access is properly controlled based on user authentication and authorization. This document provides comprehensive guidance on the implemented policies, security considerations, and maintenance procedures.

### Key Security Principles

- **Principle of Least Privilege**: Users can only access data they explicitly need
- **Defense in Depth**: Multiple layers of security controls
- **Data Isolation**: Users cannot access other users' private data
- **Role-Based Access Control**: Different permission levels for members, moderators, and admins
- **Audit Trail**: All access attempts are logged and can be monitored

## RLS Policy Implementation by Table

### 1. Users Table (`public.users`)

**Migration Files**: `001_create_users_table.sql`, `002_users_rls_policies.sql`

**Policies Implemented**:

```sql
-- Public profile visibility
CREATE POLICY "Users can view all profiles" ON public.users
  FOR SELECT USING (true);

-- Self-profile management
CREATE POLICY "Users can insert their own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Admin-only role management
CREATE POLICY "Only admins can update user roles" ON public.users
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- Admin-only user deletion
CREATE POLICY "Only admins can delete users" ON public.users
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );
```

**Security Features**:

- ✅ Public profile information is readable by all users
- ✅ Users can only modify their own profile data
- ✅ Role escalation is prevented (only admins can change roles)
- ✅ Account deletion is restricted to admins

### 2. Articles Table (`public.articles`)

**Migration Files**: `004_create_articles_table.sql`, `005_articles_rls_policies.sql`

**Policies Implemented**:

```sql
-- Public access to published content
CREATE POLICY "Anyone can view published articles" ON public.articles
  FOR SELECT USING (status = 'published');

-- Author access to own content
CREATE POLICY "Authors can view their own articles" ON public.articles
  FOR SELECT USING (auth.uid() = author_id);

-- Moderator/admin oversight
CREATE POLICY "Moderators and admins can view all articles" ON public.articles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'moderator'))
  );

-- Content creation
CREATE POLICY "Authenticated users can create articles" ON public.articles
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = author_id);

-- Content modification
CREATE POLICY "Authors can update their own articles" ON public.articles
  FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Moderators and admins can update any article" ON public.articles
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'moderator'))
  );

-- Content deletion
CREATE POLICY "Authors can delete their draft articles" ON public.articles
  FOR DELETE USING (auth.uid() = author_id AND status = 'draft');

CREATE POLICY "Admins can delete any article" ON public.articles
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );
```

**Security Features**:

- ✅ Published articles are publicly accessible
- ✅ Draft articles are only visible to authors and moderators/admins
- ✅ Authors can only modify their own content
- ✅ Content moderation capabilities for elevated roles
- ✅ Deletion restrictions prevent accidental data loss

### 3. Votes Table (`public.votes`)

**Migration Files**: `010_create_votes_table.sql`, `011_votes_rls_policies.sql`

**Policies Implemented**:

```sql
-- Vote privacy
CREATE POLICY "Users can view their own votes" ON public.votes
  FOR SELECT USING (auth.uid() = user_id);

-- Moderation oversight
CREATE POLICY "Moderators and admins can view all votes" ON public.votes
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'moderator'))
  );

-- Vote casting
CREATE POLICY "Authenticated users can cast votes" ON public.votes
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- Vote modification
CREATE POLICY "Users can update their own votes" ON public.votes
  FOR UPDATE USING (auth.uid() = user_id);

-- Vote removal
CREATE POLICY "Users can delete their own votes" ON public.votes
  FOR DELETE USING (auth.uid() = user_id);
```

**Security Features**:

- ✅ Vote privacy protection (users can only see their own votes)
- ✅ Duplicate vote prevention via composite primary key
- ✅ Vote manipulation prevention
- ✅ Moderation capabilities for oversight

### 4. Library Items Table (`public.library_items`)

**Migration Files**: `007_create_library_items_table.sql`, `008_library_items_rls_policies.sql`

**Policies Implemented**:

```sql
-- Public access to approved items
CREATE POLICY "Anyone can view approved library items" ON public.library_items
  FOR SELECT USING (submission_status = 'approved');

-- Submitter access to own items
CREATE POLICY "Submitters can view their own library items" ON public.library_items
  FOR SELECT USING (auth.uid() = submitter_id);

-- Moderation capabilities
CREATE POLICY "Moderators and admins can view all library items" ON public.library_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'moderator'))
  );
```

**Security Features**:

- ✅ Approved items are publicly accessible
- ✅ Pending submissions are only visible to submitters and moderators
- ✅ Content curation through moderation workflow

### 5. Affiliate Library Table (`public.affiliate_library`)

**Migration Files**: `013_create_affiliate_library_table.sql`, `014_affiliate_library_rls_policies.sql`

**Security Features**:

- ✅ Public read access for affiliate items
- ✅ Admin-only creation and deletion
- ✅ Moderator update capabilities for content management

### 6. Notifications Tables (`public.notifications`, `public.notification_preferences`)

**Migration Files**: `015_create_notifications_tables.sql`, `016_notifications_rls_policies.sql`

**Security Features**:

- ✅ Users can only access their own notifications
- ✅ Personal notification preferences are private
- ✅ Admin oversight capabilities for system management

## Security Best Practices

### 1. Authentication and Authorization

```typescript
// Always verify user authentication before database operations
const { data: { user } } = await supabase.auth.getUser();
if (!user) {
  throw new Error('User not authenticated');
}

// Use auth.uid() in RLS policies for user identification
CREATE POLICY "example_policy" ON table_name
  FOR SELECT USING (auth.uid() = user_id);
```

### 2. Role-Based Access Control

```sql
-- Check user roles in policies
EXISTS (
  SELECT 1 FROM public.users
  WHERE id = auth.uid() AND role IN ('admin', 'moderator')
)
```

### 3. Data Validation

```sql
-- Include validation checks in policies
WITH CHECK (
  auth.uid() IS NOT NULL
  AND auth.uid() = author_id
  AND LENGTH(title) > 0
)
```

### 4. Principle of Least Privilege

- Grant minimum necessary permissions
- Use specific operations (SELECT, INSERT, UPDATE, DELETE) rather than ALL
- Implement granular access controls

### 5. Defense in Depth

- Combine RLS with application-level security
- Use multiple validation layers
- Implement audit logging

## Troubleshooting Guide

### Common Issues and Solutions

#### 1. "Permission Denied" Errors

**Symptoms**: Users receive permission denied errors when accessing data

**Diagnosis**:

```sql
-- Check if RLS is enabled
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public' AND rowsecurity = true;

-- Check existing policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'your_table_name';
```

**Solutions**:

- Verify user authentication status
- Check policy conditions match user context
- Ensure proper role assignments
- Review WITH CHECK conditions for INSERT/UPDATE

#### 2. Users Can See Data They Shouldn't

**Symptoms**: Data leakage between users or unauthorized access

**Diagnosis**:

```sql
-- Test policy conditions
SELECT auth.uid(); -- Check current user context
SELECT * FROM table_name WHERE condition; -- Test specific conditions
```

**Solutions**:

- Review and tighten policy conditions
- Add additional filtering criteria
- Check for policy conflicts or overlaps

#### 3. Performance Issues

**Symptoms**: Slow query performance with RLS enabled

**Solutions**:

- Add appropriate indexes on filtered columns
- Optimize policy conditions
- Consider policy-specific indexes
- Monitor query execution plans

#### 4. Policy Update Failures

**Symptoms**: Unable to modify or create policies

**Solutions**:

- Check for existing policy conflicts
- Verify user has sufficient privileges
- Use `DROP POLICY` before recreating if necessary

### Debugging Tools

#### 1. Policy Testing Query

```sql
-- Test policy conditions manually
SELECT
  auth.uid() as current_user,
  auth.jwt() as user_jwt,
  auth.role() as user_role;
```

#### 2. Policy Impact Analysis

```sql
-- Check what data is visible with current policies
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM your_table WHERE your_conditions;
```

## Policy Update Procedures

### 1. Development Process

1. **Design Phase**
   - Document policy requirements
   - Review security implications
   - Plan testing scenarios

2. **Implementation**
   - Create migration files
   - Write policy SQL
   - Add comprehensive comments

3. **Testing**
   - Unit test individual policies
   - Integration test policy interactions
   - Security test edge cases

4. **Deployment**
   - Apply migrations in staging
   - Validate policy behavior
   - Deploy to production

### 2. Migration Template

```sql
-- Migration: [timestamp]_update_[table]_rls_policies.sql

-- Drop existing policy if modifying
DROP POLICY IF EXISTS "policy_name" ON public.table_name;

-- Create new or updated policy
CREATE POLICY "policy_name" ON public.table_name
  FOR operation
  USING (condition)
  WITH CHECK (condition);

-- Add descriptive comment
COMMENT ON POLICY "policy_name" ON public.table_name
  IS 'Description of what this policy does and why';
```

### 3. Testing Checklist

- [ ] Policy syntax is valid
- [ ] Policy logic is correct
- [ ] No unintended data exposure
- [ ] Performance impact is acceptable
- [ ] All user roles tested
- [ ] Edge cases covered
- [ ] Documentation updated

## Usage Examples

### 1. Implementing a New Policy

```sql
-- Example: Add policy for collaborative editing
CREATE POLICY "Collaborators can edit shared articles" ON public.articles
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.article_collaborators
      WHERE article_id = articles.id
      AND user_id = auth.uid()
      AND permission = 'edit'
    )
  );
```

### 2. Client-Side Implementation

```typescript
// Proper client-side usage with RLS
export async function getUserArticles(userId: string) {
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('author_id', userId); // RLS will filter based on auth.uid()

  if (error) throw error;
  return data;
}

// Admin function with proper role checking
export async function getAllArticles() {
  // Client-side role check for UX
  const { data: user } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.user?.id)
    .single();

  if (!profile || !['admin', 'moderator'].includes(profile.role)) {
    throw new Error('Insufficient permissions');
  }

  // RLS will enforce server-side
  const { data, error } = await supabase.from('articles').select('*');

  if (error) throw error;
  return data;
}
```

## Common Security Pitfalls

### 1. Authentication Bypass

❌ **Wrong**:

```sql
CREATE POLICY "users_select" ON users
  FOR SELECT USING (true); -- Too permissive
```

✅ **Correct**:

```sql
CREATE POLICY "users_select" ON users
  FOR SELECT USING (
    status = 'published' OR
    auth.uid() = author_id OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'moderator'))
  );
```

### 2. Role Confusion

❌ **Wrong**:

```sql
-- Checking role in application code only
if (userRole === 'admin') {
  // Database operation without RLS enforcement
}
```

✅ **Correct**:

```sql
-- Always enforce in database
CREATE POLICY "admin_only" ON sensitive_table
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );
```

### 3. Information Leakage

❌ **Wrong**:

```sql
-- Exposing sensitive data in error messages
CREATE POLICY "restrictive" ON table
  USING (column = 'secret_value'); -- Might leak in error messages
```

✅ **Correct**:

```sql
-- Use proper boolean conditions
CREATE POLICY "restrictive" ON table
  USING (auth.uid() = owner_id);
```

### 4. Performance Pitfalls

❌ **Wrong**:

```sql
-- Expensive subqueries in policies
CREATE POLICY "expensive" ON table
  USING (
    id IN (SELECT id FROM expensive_view WHERE complex_condition)
  );
```

✅ **Correct**:

```sql
-- Simple, indexed conditions
CREATE POLICY "efficient" ON table
  USING (owner_id = auth.uid());
-- With supporting index: CREATE INDEX idx_table_owner_id ON table(owner_id);
```

## Maintenance and Monitoring

### 1. Regular Security Audits

#### Monthly Checklist

- [ ] Review policy effectiveness
- [ ] Check for unauthorized data access
- [ ] Validate role assignments
- [ ] Review failed authentication attempts
- [ ] Update security documentation

#### Quarterly Reviews

- [ ] Performance impact analysis
- [ ] Policy optimization opportunities
- [ ] Security testing with new attack vectors
- [ ] Update threat model

### 2. Monitoring Queries

```sql
-- Monitor failed policy checks
SELECT
  schemaname,
  tablename,
  count(*) as failed_attempts
FROM pg_stat_user_tables
WHERE schemaname = 'public'
GROUP BY schemaname, tablename;

-- Check policy usage patterns
SELECT
  policyname,
  schemaname,
  tablename
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

### 3. Automated Testing

```bash
#!/bin/bash
# Security test automation script

echo "Running RLS security tests..."

# Test unauthorized access attempts
npm run test:security

# Validate policy integrity
npm run test:rls-policies

# Performance benchmarks
npm run test:performance

echo "Security tests completed."
```

## Testing and Validation

### 1. Test Components Available

- `UserRLSPolicyTest.tsx` - User table policy validation
- `ArticleRLSPolicyTest.tsx` - Article access control testing
- `VoteRLSPolicyTest.tsx` - Vote constraint validation
- `EditorPermissionPolicyTest.tsx` - Role-based permission testing
- `ComprehensiveRLSTestSuite.tsx` - Complete security test suite

### 2. Testing Procedures

1. **Unit Testing**: Test individual policies in isolation
2. **Integration Testing**: Test policy interactions across tables
3. **Security Testing**: Attempt unauthorized access patterns
4. **Performance Testing**: Measure policy impact on query performance
5. **User Acceptance Testing**: Validate policies meet business requirements

### 3. Continuous Monitoring

```typescript
// Example monitoring function
export async function validateRLSIntegrity() {
  const tests = [
    testUserProfileAccess,
    testArticleVisibility,
    testVotePrivacy,
    testRolePermissions,
    testDataIsolation,
  ];

  const results = await Promise.all(tests.map((test) => test()));

  const failures = results.filter((result) => !result.passed);
  if (failures.length > 0) {
    // Alert security team
    console.error('RLS integrity failures detected:', failures);
  }

  return {
    passed: failures.length === 0,
    results,
  };
}
```

## Conclusion

This Row-Level Security implementation provides comprehensive data protection for the StrayLight application. Regular maintenance, monitoring, and testing are essential to ensure continued security effectiveness.

For questions or security concerns, consult this documentation and run the comprehensive test suite to validate system integrity.

---

**Last Updated**: [Current Date]
**Version**: 1.0
**Maintainer**: Development Team
