# Real-time Notification System Implementation Guide

## Overview

This document provides a comprehensive guide for the real-time notification system implemented for the StrayLight admin dashboard. The system includes database schema, real-time subscriptions, toast notifications, email notifications, and performance optimizations.

## Features Implemented

### ✅ 1. Database Schema for Notifications

- **Notifications table**: Stores all user notifications with status tracking
- **Notification preferences table**: User-specific notification settings
- **Email notifications queue**: Manages email delivery with retry logic
- **Database triggers**: Automatic notification creation on article status changes
- **Row Level Security (RLS)**: Secure access control for all tables

### ✅ 2. Real-time Subscriptions

- **Supabase real-time**: Live updates for notifications and dashboard stats
- **Connection management**: Automatic reconnection and error handling
- **Browser notifications**: Native browser notification support
- **Dashboard updates**: Real-time stats for pending articles, approvals, etc.

### ✅ 3. Toast Notification System

- **Toast notifications**: Beautiful, accessible toast messages
- **Multiple types**: Success, error, warning, info notifications
- **Auto-dismiss**: Configurable timeout with progress bars
- **Action buttons**: Support for action buttons in notifications
- **Queue management**: Automatic queue with maximum notification limits

### ✅ 4. Email Notification System

- **Supabase Edge Functions**: Server-side email processing
- **Resend integration**: Professional email delivery service
- **Email templates**: HTML and text email templates
- **Retry logic**: Exponential backoff for failed emails
- **Batch processing**: Efficient email processing in batches

### ✅ 5. Admin Dashboard Components

- **Real-time dashboard stats**: Live updating statistics
- **Notification bell**: Dropdown with recent notifications
- **Notification management**: Admin interface for system configuration
- **Activity feed**: Real-time activity tracking
- **Connection status**: Visual indicators for real-time connection

### ✅ 6. Notification History

- **Full notification page**: Complete notification history with filtering
- **Advanced filtering**: By type, status, date range, and search
- **Bulk actions**: Mark multiple notifications as read or archive
- **Pagination**: Efficient pagination for large notification lists
- **User preferences**: Individual notification settings management

### ✅ 7. Error Handling & Performance

- **Error categorization**: Connection, permission, rate limit, server errors
- **Retry mechanisms**: Exponential backoff with jitter
- **Performance optimizations**: Caching, batching, debouncing, virtualization
- **Metrics tracking**: Performance metrics and cache hit rates
- **Memory management**: Automatic cleanup and LRU cache eviction

## File Structure

```
src/
├── hooks/
│   ├── useNotifications.ts              # Main notifications hook
│   ├── useRealtimeDashboard.ts          # Dashboard real-time updates
│   ├── useNotificationErrors.ts         # Error handling with retry logic
│   └── useNotificationPerformance.ts    # Performance optimizations
├── contexts/
│   └── NotificationContext.tsx          # Toast notification provider
├── components/
│   ├── notifications/
│   │   ├── ToastContainer.tsx           # Toast notification container
│   │   ├── ToastNotification.tsx        # Individual toast component
│   │   └── NotificationBell.tsx         # Admin notification bell
│   └── admin/
│       ├── RealtimeDashboardStats.tsx   # Real-time dashboard stats
│       └── NotificationManagement.tsx   # Admin notification settings
├── app/admin/notifications/
│   └── page.tsx                         # Full notification history page
├── lib/services/
│   └── notification-service.ts          # Client notification service
└── NOTIFICATION_SYSTEM_GUIDE.md        # This guide

supabase/
├── migrations/
│   ├── 015_create_notifications_tables.sql      # Core notification tables
│   ├── 016_notifications_rls_policies.sql       # Security policies
│   ├── 017_notifications_triggers.sql           # Auto-notification triggers
│   └── 018_setup_default_notification_preferences.sql # Default settings
└── functions/
    ├── send-email-notifications/
    │   └── index.ts                     # Email processing edge function
    ├── process-notifications-cron/
    │   └── index.ts                     # Cron job for email processing
    └── _shared/
        └── database.ts                  # Shared database utilities
```

## Integration Steps

### 1. Database Setup

Run the database migrations in order:

```sql
-- Run these in Supabase SQL editor or via CLI
psql -h your-db-host -U postgres -d your-db -f supabase/migrations/015_create_notifications_tables.sql
psql -h your-db-host -U postgres -d your-db -f supabase/migrations/016_notifications_rls_policies.sql
psql -h your-db-host -U postgres -d your-db -f supabase/migrations/017_notifications_triggers.sql
psql -h your-db-host -U postgres -d your-db -f supabase/migrations/018_setup_default_notification_preferences.sql
```

### 2. Environment Variables

Add these environment variables to your `.env.local`:

```env
# Email Service (Resend)
RESEND_API_KEY=your_resend_api_key
FROM_EMAIL=noreply@yourdomain.com

# Cron Security (optional)
CRON_SECRET=your_cron_secret_key

# Supabase (already configured)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 3. Deploy Edge Functions

Deploy the Supabase Edge Functions:

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login and link project
supabase login
supabase link --project-ref your-project-ref

# Deploy functions
supabase functions deploy send-email-notifications
supabase functions deploy process-notifications-cron

# Set environment variables for functions
supabase secrets set RESEND_API_KEY=your_resend_api_key
supabase secrets set FROM_EMAIL=noreply@yourdomain.com
supabase secrets set CRON_SECRET=your_cron_secret_key
```

### 4. Update App Layout

Update your main layout to include the notification providers:

```tsx
// src/app/layout.tsx
import { NotificationProvider } from '@/contexts/NotificationContext';
import ToastContainer from '@/components/notifications/ToastContainer';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html>
      <body>
        <NotificationProvider>
          {children}
          <ToastContainer position="top-right" />
        </NotificationProvider>
      </body>
    </html>
  );
}
```

### 5. Add Notification Bell to Navigation

Update your admin navigation to include the notification bell:

```tsx
// src/components/Navigation.tsx
import NotificationBell from '@/components/notifications/NotificationBell';

export default function Navigation() {
  return (
    <nav>
      {/* Your existing navigation */}
      <div className="flex items-center space-x-4">
        <NotificationBell showCount={true} />
        {/* Other nav items */}
      </div>
    </nav>
  );
}
```

### 6. Update Admin Dashboard

Add real-time stats to your admin dashboard:

```tsx
// src/app/admin/dashboard/page.tsx
import RealtimeDashboardStats from '@/components/admin/RealtimeDashboardStats';

export default function AdminDashboard() {
  return (
    <div>
      <RealtimeDashboardStats />
      {/* Your existing dashboard content */}
    </div>
  );
}
```

### 7. Set Up Cron Job

Set up a cron job to process email notifications regularly. You can use:

- **Vercel Cron** (recommended for Vercel deployments)
- **GitHub Actions** (for any deployment)
- **External cron service** (like cron-job.org)

Example Vercel cron configuration (`vercel.json`):

```json
{
  "crons": [
    {
      "path": "/api/cron/process-notifications",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

Create the cron endpoint:

```tsx
// src/app/api/cron/process-notifications/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Verify cron secret
  const cronSecret = request.headers.get('x-cron-secret');
  if (cronSecret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Call the Supabase Edge Function
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/process-notifications-cron`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          'x-cron-secret': process.env.CRON_SECRET || '',
        },
      }
    );

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

## Usage Examples

### Creating Custom Notifications

```tsx
import { NotificationService } from '@/lib/services/notification-service';

// Create a notification for a user
await NotificationService.createNotification({
  userId: 'user-id',
  type: 'article_approved',
  title: 'Article Approved!',
  message: 'Your article has been approved and published.',
  entityType: 'article',
  entityId: 'article-id',
  metadata: {
    articleTitle: 'My Article',
    articleSlug: 'my-article',
  },
});
```

### Using Toast Notifications

```tsx
import { useNotificationContext } from '@/contexts/NotificationContext';

function MyComponent() {
  const { showSuccess, showError } = useNotificationContext();

  const handleSave = async () => {
    try {
      await saveData();
      showSuccess('Saved!', 'Your changes have been saved successfully.');
    } catch (error) {
      showError(
        'Save Failed',
        'Failed to save your changes. Please try again.'
      );
    }
  };

  return <button onClick={handleSave}>Save</button>;
}
```

### Accessing Real-time Notifications

```tsx
import { useNotifications } from '@/hooks/useNotifications';

function NotificationsList() {
  const { notifications, unreadCount, markAsRead, loading } =
    useNotifications();

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h2>Notifications ({unreadCount} unread)</h2>
      {notifications.map((notification) => (
        <div key={notification.id}>
          <h3>{notification.title}</h3>
          <p>{notification.message}</p>
          {notification.status === 'unread' && (
            <button onClick={() => markAsRead(notification.id)}>
              Mark as Read
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
```

## Performance Considerations

### 1. Database Indexes

All necessary indexes are created in the migration files to ensure fast queries.

### 2. Connection Management

Real-time connections are automatically managed with reconnection logic.

### 3. Memory Usage

- LRU cache with configurable size limits
- Automatic cleanup of old notifications
- Efficient batch processing

### 4. Rate Limiting

- Built-in retry logic with exponential backoff
- Rate limit detection and handling
- Batch operations to reduce API calls

## Security Features

### 1. Row Level Security (RLS)

All notification tables have RLS policies to ensure users can only access their own data.

### 2. Input Validation

All inputs are validated using Zod schemas.

### 3. API Security

- Service role authentication for edge functions
- CORS headers for cross-origin requests
- Cron secret verification

## Monitoring & Debugging

### 1. Performance Metrics

```tsx
import { useNotificationPerformance } from '@/hooks/useNotificationPerformance';

function PerformanceMonitor() {
  const { getMetrics } = useNotificationPerformance();
  const metrics = getMetrics();

  return (
    <div>
      <p>Cache Hit Rate: {metrics.cacheHitRate}%</p>
      <p>Batch Efficiency: {metrics.batchEfficiency}x</p>
      <p>Cache Size: {metrics.cacheSize}</p>
    </div>
  );
}
```

### 2. Error Tracking

```tsx
import { useNotificationErrors } from '@/hooks/useNotificationErrors';

function ErrorMonitor() {
  const { errors, getErrorMessage } = useNotificationErrors();

  return (
    <div>
      {errors.map((error) => (
        <div key={error.id}>
          <p>{getErrorMessage(error)}</p>
          <p>
            Retries: {error.retryCount}/{error.maxRetries}
          </p>
        </div>
      ))}
    </div>
  );
}
```

### 3. Email Status Monitoring

```tsx
import { NotificationService } from '@/lib/services/notification-service';

// Get email notification status
const emailStatus = await NotificationService.getEmailNotificationStatus();
console.log('Email queue status:', emailStatus.data);
```

## Troubleshooting

### Common Issues

1. **Real-time not working**
   - Check Supabase project settings for real-time enabled
   - Verify RLS policies allow subscription
   - Check browser console for connection errors

2. **Emails not sending**
   - Verify RESEND_API_KEY is set correctly
   - Check edge function logs in Supabase dashboard
   - Ensure cron job is running regularly

3. **Performance issues**
   - Check cache hit rates using performance metrics
   - Verify database indexes are created
   - Monitor memory usage in browser dev tools

### Debug Commands

```tsx
// Test email system
await NotificationService.testEmailNotification('test@example.com');

// Check notification preferences
const prefs = await NotificationService.getNotificationPreferences('user-id');

// Get email status
const status = await NotificationService.getEmailNotificationStatus();
```

## Future Enhancements

### Potential Improvements

1. **Push notifications** via Web Push API
2. **Notification categories** with custom icons and colors
3. **Email templates editor** for admins
4. **Notification scheduling** for future delivery
5. **Analytics dashboard** for notification metrics
6. **Mobile app notifications** via FCM/APNS
7. **Webhook notifications** for external integrations

### Migration Path

The system is designed to be extensible. Future enhancements can be added without breaking existing functionality through:

- Additional database columns with default values
- New notification types in the enum
- Optional features that default to disabled
- Backward-compatible API changes

---

This notification system provides a solid foundation for real-time user engagement while maintaining performance, security, and scalability. The modular design allows for easy customization and future enhancements.
