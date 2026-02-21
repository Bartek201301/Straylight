'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface DashboardStats {
  pendingArticles: number;
  publishedToday: number;
  totalUsers: number;
  recentActivity: ActivityItem[];
}

interface ActivityItem {
  id: string;
  type:
    | 'article_submitted'
    | 'article_approved'
    | 'article_rejected'
    | 'user_registered';
  title: string;
  subtitle: string;
  timestamp: string;
  metadata: Record<string, any>;
}

interface UseRealtimeDashboardReturn {
  stats: DashboardStats;
  loading: boolean;
  error: string | null;
  refreshStats: () => Promise<void>;
  isConnected: boolean;
}

/**
 * Hook for real-time admin dashboard updates
 * Tracks pending articles, recent approvals/rejections, and overall stats
 * Only works for admin users - returns empty state for non-admin users
 */
export function useRealtimeDashboard(): UseRealtimeDashboardReturn {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    pendingArticles: 0,
    publishedToday: 0,
    totalUsers: 0,
    recentActivity: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const channelRef = useRef<RealtimeChannel | null>(null);

  // Check if user has admin role
  const isAdmin = user?.role === 'admin';

  /**
   * Fetch dashboard statistics from API with proper authentication
   */
  const fetchStats = useCallback(async () => {
    try {
      setError(null);
      console.log('📊 Fetching dashboard stats...');

      // Get current session and token
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        console.error('❌ Failed to get session:', sessionError);
        throw new Error(`Session error: ${sessionError.message}`);
      }

      if (!session?.access_token) {
        console.error('❌ No access token available');
        throw new Error(
          'No authentication token available. Please log in again.'
        );
      }

      console.log('🔑 Using access token for API request');

      const response = await fetch('/api/admin/dashboard/stats', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error ||
            `HTTP ${response.status}: Failed to fetch dashboard stats`
        );
      }

      const { data: statsData } = await response.json();

      if (!statsData) {
        throw new Error('No data received from dashboard stats API');
      }

      setStats(statsData);
    } catch (err) {
      console.error('Failed to fetch dashboard stats:', err);

      let errorMessage = 'Failed to fetch dashboard stats';

      if (err instanceof Error) {
        // Network error
        if (err.message.includes('fetch')) {
          errorMessage = 'Network error - please check your connection';
        }
        // Authentication error
        else if (err.message.includes('401') || err.message.includes('403')) {
          errorMessage = 'Authentication required - please login again';
        }
        // Server error
        else if (err.message.includes('500')) {
          errorMessage = 'Server error - please try again later';
        }
        // Use the actual error message if available
        else {
          errorMessage = err.message;
        }
      }

      setError(errorMessage);
    }
  }, []);

  /**
   * Setup real-time subscriptions for dashboard updates
   */
  const setupRealtimeSubscriptions = useCallback(() => {
    console.log('🔴 Setting up real-time subscriptions...');

    // Clean up existing subscription
    if (channelRef.current) {
      console.log('🧹 Cleaning up existing subscription');
      supabase.removeChannel(channelRef.current);
    }

    // Create new channel for dashboard updates
    console.log('📡 Creating new real-time channel');
    const channel = supabase
      .channel('dashboard_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'articles',
        },
        (payload) => {
          console.log('Article change detected:', payload);

          // Update stats based on the change
          if (payload.eventType === 'INSERT') {
            const newArticle = payload.new as any;
            if (newArticle.status === 'pending') {
              setStats((prev) => ({
                ...prev,
                pendingArticles: prev.pendingArticles + 1,
              }));
            }
          } else if (payload.eventType === 'UPDATE') {
            const oldArticle = payload.old as any;
            const newArticle = payload.new as any;

            // Handle status changes
            if (oldArticle.status !== newArticle.status) {
              setStats((prev) => {
                let pendingChange = 0;
                let publishedTodayChange = 0;

                // From pending
                if (oldArticle.status === 'pending') {
                  pendingChange = -1;
                }

                // To pending
                if (newArticle.status === 'pending') {
                  pendingChange = 1;
                }

                // To published today
                if (
                  newArticle.status === 'published' &&
                  newArticle.published_at
                ) {
                  const publishedDate = new Date(newArticle.published_at)
                    .toISOString()
                    .split('T')[0];
                  const today = new Date().toISOString().split('T')[0];
                  if (publishedDate === today) {
                    publishedTodayChange = 1;
                  }
                }

                return {
                  ...prev,
                  pendingArticles: Math.max(
                    0,
                    prev.pendingArticles + pendingChange
                  ),
                  publishedToday: Math.max(
                    0,
                    prev.publishedToday + publishedTodayChange
                  ),
                };
              });
            }
          }

          // Refresh recent activity
          fetchStats();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'users',
        },
        (payload) => {
          console.log('New user registered:', payload);
          setStats((prev) => ({
            ...prev,
            totalUsers: prev.totalUsers + 1,
          }));
        }
      )
      .subscribe((status) => {
        console.log('📡 Dashboard subscription status changed:', status);

        if (status === 'SUBSCRIBED') {
          console.log('✅ Successfully subscribed to dashboard updates');
          setIsConnected(true);
          setError(null); // Clear any previous errors
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Failed to subscribe to dashboard updates');
          setError('Failed to connect to real-time dashboard updates');
          setIsConnected(false);
        } else if (status === 'CLOSED') {
          console.log('🔒 Dashboard subscription closed');
          setIsConnected(false);
        } else if (status === 'TIMED_OUT') {
          console.error('⏰ Dashboard subscription timed out');
          setError('Real-time connection timed out');
          setIsConnected(false);
        } else {
          console.log('📡 Subscription status:', status);
        }
      });

    channelRef.current = channel;
  }, [fetchStats]);

  /**
   * Initialize dashboard with retry logic - only for admin users
   */
  useEffect(() => {
    // Early return for non-admin users
    if (!isAdmin) {
      console.log('🚫 Not an admin user, skipping dashboard initialization');
      setLoading(false);
      setError(null);
      setIsConnected(false);
      return;
    }

    let retryCount = 0;
    const maxRetries = 3;
    const retryDelay = 2000; // 2 seconds

    const initializeDashboard = async () => {
      try {
        console.log('🚀 Initializing admin dashboard...');
        setLoading(true);
        setError(null);

        // Fetch initial stats via API (authentication handled by middleware)
        console.log('📊 Fetching initial dashboard stats...');
        await fetchStats();

        // If successful, setup real-time subscriptions
        console.log('📡 Setting up real-time subscriptions...');
        setupRealtimeSubscriptions();

        // Mark as connected
        setIsConnected(true);
        console.log('✅ Admin dashboard initialized successfully');
      } catch (err) {
        console.error('❌ Failed to initialize admin dashboard:', err);

        // If it's an auth error, don't retry
        if (
          err instanceof Error &&
          (err.message.includes('401') || err.message.includes('403'))
        ) {
          setError('Authentication required - please login again');
          setIsConnected(false);
          setLoading(false);
          return;
        }

        // Retry logic for other errors
        if (retryCount < maxRetries) {
          retryCount++;
          console.log(
            `Retrying admin dashboard initialization (${retryCount}/${maxRetries}) in ${retryDelay}ms...`
          );

          setTimeout(() => {
            initializeDashboard();
          }, retryDelay);
          return;
        }

        // Max retries reached
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to initialize admin dashboard after multiple attempts'
        );
        setIsConnected(false);
      } finally {
        setLoading(false);
      }
    };

    initializeDashboard();

    // Cleanup on unmount
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [isAdmin, fetchStats, setupRealtimeSubscriptions]);

  /**
   * Refresh stats manually with connection retry - only for admin users
   */
  const refreshStats = useCallback(async (): Promise<void> => {
    // Early return for non-admin users
    if (!isAdmin) {
      console.log('🚫 Not an admin user, skipping stats refresh');
      return;
    }

    try {
      setError(null);
      await fetchStats();
      setIsConnected(true);
    } catch (err) {
      console.error('Failed to refresh admin stats:', err);
      setIsConnected(false);
      // Don't update the error state here as fetchStats already handles it
    }
  }, [isAdmin, fetchStats]);

  return {
    stats,
    loading,
    error,
    refreshStats,
    isConnected,
  };
}
