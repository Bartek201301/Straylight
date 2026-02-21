'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

// Notification types from database enum
export type NotificationType =
  | 'article_approved'
  | 'article_rejected'
  | 'article_submitted'
  | 'article_updated'
  | 'system_maintenance'
  | 'account_update'
  | 'admin_action';

type NotificationStatus = 'unread' | 'read' | 'archived';

interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  status: NotificationStatus;
  entity_type?: string;
  entity_id?: string;
  metadata: Record<string, any>;
  triggered_by?: string;
  created_at: string;
  read_at?: string;
  archived_at?: string;
}

interface NotificationPreferences {
  id: string;
  user_id: string;
  notification_type: NotificationType;
  email_enabled: boolean;
  push_enabled: boolean;
  in_app_enabled: boolean;
  immediate_delivery: boolean;
  digest_frequency: 'none' | 'daily' | 'weekly';
  created_at: string;
  updated_at: string;
}

interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  preferences: NotificationPreferences[];
  loading: boolean;
  error: string | null;
  markAsRead: (notificationId: string) => Promise<boolean>;
  markAllAsRead: () => Promise<boolean>;
  archiveNotification: (notificationId: string) => Promise<boolean>;
  updatePreferences: (
    preferences: Partial<NotificationPreferences>[]
  ) => Promise<boolean>;
  refreshNotifications: () => Promise<void>;
}

/**
 * Hook for managing user notifications with real-time updates
 * Handles both fetching and real-time subscriptions
 */
export function useNotifications(): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreferences[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const channelRef = useRef<RealtimeChannel | null>(null);
  const userIdRef = useRef<string | null>(null);

  // Calculate unread count
  const unreadCount = notifications.filter((n) => n.status === 'unread').length;

  /**
   * Fetch notifications from the database
   */
  const fetchNotifications = useCallback(async (userId: string) => {
    try {
      setError(null);

      // Fetch notifications
      const { data: notificationData, error: notificationError } =
        await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', userId)
          .neq('status', 'archived')
          .order('created_at', { ascending: false })
          .limit(100); // Limit for performance

      if (notificationError) {
        throw notificationError;
      }

      // Fetch preferences
      const { data: preferencesData, error: preferencesError } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', userId);

      if (preferencesError) {
        throw preferencesError;
      }

      setNotifications(notificationData || []);
      setPreferences(preferencesData || []);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to fetch notifications'
      );
    }
  }, []);

  /**
   * Setup real-time subscription for notifications
   */
  const setupRealtimeSubscription = useCallback((userId: string) => {
    // Clean up existing subscription
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    // Create new channel for user's notifications
    const channel = supabase
      .channel(`notifications_${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('New notification received:', payload);
          const newNotification = payload.new as Notification;

          setNotifications((prev) => [newNotification, ...prev]);

          // Show browser notification if supported and permissions granted
          if (
            'Notification' in window &&
            Notification.permission === 'granted'
          ) {
            new Notification(newNotification.title, {
              body: newNotification.message,
              icon: '/favicon.ico',
              tag: newNotification.id,
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('Notification updated:', payload);
          const updatedNotification = payload.new as Notification;

          setNotifications((prev) =>
            prev.map((n) =>
              n.id === updatedNotification.id ? updatedNotification : n
            )
          );
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('Notification deleted:', payload);
          const deletedNotification = payload.old as Notification;

          setNotifications((prev) =>
            prev.filter((n) => n.id !== deletedNotification.id)
          );
        }
      )
      .subscribe((status) => {
        console.log('Notifications subscription status:', status);

        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to notifications');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Failed to subscribe to notifications');
          setError('Failed to connect to real-time notifications');
        }
      });

    channelRef.current = channel;
  }, []);

  /**
   * Initialize notifications and real-time subscription
   */
  useEffect(() => {
    const initializeNotifications = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get current user
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          throw userError;
        }

        if (!user) {
          setNotifications([]);
          setPreferences([]);
          setLoading(false);
          return;
        }

        userIdRef.current = user.id;

        // Fetch initial data
        await fetchNotifications(user.id);

        // Setup real-time subscription
        setupRealtimeSubscription(user.id);

        // Request notification permissions
        if ('Notification' in window && Notification.permission === 'default') {
          await Notification.requestPermission();
        }
      } catch (err) {
        console.error('Failed to initialize notifications:', err);
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to initialize notifications'
        );
      } finally {
        setLoading(false);
      }
    };

    initializeNotifications();

    // Cleanup on unmount
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [fetchNotifications, setupRealtimeSubscription]);

  /**
   * Mark a notification as read
   */
  const markAsRead = useCallback(
    async (notificationId: string): Promise<boolean> => {
      try {
        const { error } = await supabase.rpc('mark_notification_read', {
          notification_id: notificationId,
        });

        if (error) {
          throw error;
        }

        // Update local state
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notificationId
              ? {
                  ...n,
                  status: 'read' as NotificationStatus,
                  read_at: new Date().toISOString(),
                }
              : n
          )
        );

        return true;
      } catch (err) {
        console.error('Failed to mark notification as read:', err);
        return false;
      }
    },
    []
  );

  /**
   * Mark all notifications as read
   */
  const markAllAsRead = useCallback(async (): Promise<boolean> => {
    try {
      const unreadIds = notifications
        .filter((n) => n.status === 'unread')
        .map((n) => n.id);

      if (unreadIds.length === 0) {
        return true;
      }

      const { error } = await supabase
        .from('notifications')
        .update({
          status: 'read',
          read_at: new Date().toISOString(),
        })
        .in('id', unreadIds)
        .eq('user_id', userIdRef.current);

      if (error) {
        throw error;
      }

      // Update local state
      setNotifications((prev) =>
        prev.map((n) =>
          n.status === 'unread'
            ? {
                ...n,
                status: 'read' as NotificationStatus,
                read_at: new Date().toISOString(),
              }
            : n
        )
      );

      return true;
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
      return false;
    }
  }, [notifications]);

  /**
   * Archive a notification
   */
  const archiveNotification = useCallback(
    async (notificationId: string): Promise<boolean> => {
      try {
        const { error } = await supabase
          .from('notifications')
          .update({
            status: 'archived',
            archived_at: new Date().toISOString(),
          })
          .eq('id', notificationId)
          .eq('user_id', userIdRef.current);

        if (error) {
          throw error;
        }

        // Remove from local state (since we filter out archived)
        setNotifications((prev) => prev.filter((n) => n.id !== notificationId));

        return true;
      } catch (err) {
        console.error('Failed to archive notification:', err);
        return false;
      }
    },
    []
  );

  /**
   * Update notification preferences
   */
  const updatePreferences = useCallback(
    async (
      updatedPreferences: Partial<NotificationPreferences>[]
    ): Promise<boolean> => {
      try {
        for (const pref of updatedPreferences) {
          const { error } = await supabase
            .from('notification_preferences')
            .update(pref)
            .eq('id', pref.id!)
            .eq('user_id', userIdRef.current);

          if (error) {
            throw error;
          }
        }

        // Refresh preferences
        if (userIdRef.current) {
          await fetchNotifications(userIdRef.current);
        }

        return true;
      } catch (err) {
        console.error('Failed to update notification preferences:', err);
        return false;
      }
    },
    [fetchNotifications]
  );

  /**
   * Refresh notifications manually
   */
  const refreshNotifications = useCallback(async (): Promise<void> => {
    if (userIdRef.current) {
      await fetchNotifications(userIdRef.current);
    }
  }, [fetchNotifications]);

  return {
    notifications,
    unreadCount,
    preferences,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    archiveNotification,
    updatePreferences,
    refreshNotifications,
  };
}
