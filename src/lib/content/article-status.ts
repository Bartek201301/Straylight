/**
 * Centralized article status management
 * Provides consistent status-based behavior across the application
 */

import type { ArticleStatus } from '@/components/articles/ArticleStatusBadge';

type ArticleAction = 'edit' | 'view' | 'withdraw' | 'delete' | 'resubmit';

interface ArticlePermissions {
  canEdit: boolean;
  canView: boolean;
  canWithdraw: boolean;
  canDelete: boolean;
  canResubmit: boolean;
  isReadOnly: boolean;
  primaryAction: ArticleAction | null;
  secondaryActions: ArticleAction[];
}

interface ArticleAccessControl {
  permissions: ArticlePermissions;
  routingStrategy: 'edit-page' | 'view-page' | 'external';
  viewMode: 'edit' | 'read-only' | 'public';
}

/**
 * Get permissions and access control for an article based on its status
 * This centralizes all status-based logic in one place
 */
export function getArticleAccessControl(
  status: ArticleStatus,
  isOwner: boolean = true
): ArticleAccessControl {
  switch (status) {
    case 'draft':
      return {
        permissions: {
          canEdit: isOwner,
          canView: isOwner,
          canWithdraw: false,
          canDelete: isOwner,
          canResubmit: false,
          isReadOnly: false,
          primaryAction: 'edit',
          secondaryActions: ['delete'],
        },
        routingStrategy: 'edit-page',
        viewMode: 'edit',
      };

    case 'pending':
      return {
        permissions: {
          canEdit: false,
          canView: isOwner,
          canWithdraw: isOwner,
          canDelete: false,
          canResubmit: false,
          isReadOnly: true,
          primaryAction: 'view',
          secondaryActions: isOwner ? ['withdraw'] : [],
        },
        routingStrategy: 'edit-page',
        viewMode: 'read-only',
      };

    case 'published':
      return {
        permissions: {
          canEdit: false,
          canView: true,
          canWithdraw: false,
          canDelete: false,
          canResubmit: false,
          isReadOnly: true,
          primaryAction: 'view',
          secondaryActions: [],
        },
        routingStrategy: 'external',
        viewMode: 'public',
      };

    case 'rejected':
      return {
        permissions: {
          canEdit: isOwner,
          canView: isOwner,
          canWithdraw: false,
          canDelete: isOwner,
          canResubmit: isOwner,
          isReadOnly: false,
          primaryAction: 'view',
          secondaryActions: isOwner ? ['edit', 'delete'] : [],
        },
        routingStrategy: 'edit-page',
        viewMode: 'edit',
      };

    case 'archived':
      return {
        permissions: {
          canEdit: false,
          canView: isOwner,
          canWithdraw: false,
          canDelete: false,
          canResubmit: false,
          isReadOnly: true,
          primaryAction: 'view',
          secondaryActions: [],
        },
        routingStrategy: 'edit-page',
        viewMode: 'read-only',
      };

    default:
      // Fallback for unknown statuses
      return {
        permissions: {
          canEdit: false,
          canView: false,
          canWithdraw: false,
          canDelete: false,
          canResubmit: false,
          isReadOnly: true,
          primaryAction: null,
          secondaryActions: [],
        },
        routingStrategy: 'edit-page',
        viewMode: 'read-only',
      };
  }
}

/**
 * Generate the appropriate route for accessing an article
 */
export function generateArticleRoute(
  status: ArticleStatus,
  articleId: string,
  slug?: string,
  isOwner: boolean = true
): string {
  const accessControl = getArticleAccessControl(status, isOwner);

  switch (accessControl.routingStrategy) {
    case 'external':
      return `/articles/${slug}`;
    case 'view-page':
      return `/articles/${slug}`;
    case 'edit-page':
    default:
      return `/write?edit=${articleId}`;
  }
}

/**
 * Check if an article status allows editing
 */
function _canEditArticleStatus(status: ArticleStatus): boolean {
  return ['draft', 'rejected'].includes(status);
}

/**
 * Check if an article status allows viewing
 */
function _canViewArticleStatus(
  status: ArticleStatus,
  isOwner: boolean = true
): boolean {
  const accessControl = getArticleAccessControl(status, isOwner);
  return accessControl.permissions.canView;
}

/**
 * Get the appropriate button text for an article action
 */
export function getActionButtonText(action: ArticleAction): string {
  const buttonTexts: Record<ArticleAction, string> = {
    edit: 'Edit',
    view: 'View',
    withdraw: 'Withdraw',
    delete: 'Delete',
    resubmit: 'Resubmit',
  };

  return buttonTexts[action];
}

/**
 * Get status-specific messaging for the user
 */
function _getStatusMessage(status: ArticleStatus): {
  title: string;
  description: string;
} {
  const messages: Record<
    ArticleStatus,
    { title: string; description: string }
  > = {
    draft: {
      title: 'Draft',
      description: 'This article is in draft mode and can be edited.',
    },
    pending: {
      title: 'Article Under Review',
      description:
        'This article has been submitted for review and cannot be edited. You can view the content below.',
    },
    published: {
      title: 'Published',
      description: 'This article has been published and is publicly available.',
    },
    rejected: {
      title: 'Review Feedback',
      description:
        'This article was returned for revisions. You can edit and resubmit it.',
    },
    archived: {
      title: 'Archived',
      description:
        'This article has been archived and is no longer publicly visible.',
    },
  };

  return (
    messages[status] || {
      title: 'Unknown Status',
      description: 'Article status is unknown.',
    }
  );
}
