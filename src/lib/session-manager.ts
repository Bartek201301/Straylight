import { supabase } from './supabase';
import type {
  AuthUser,
  AuthSession,
  AuthChangeEvent,
  AuthEventType,
} from './supabase';

// Session storage keys
const SESSION_STORAGE_KEYS = {
  REMEMBER_ME: 'auth.remember_me',
  REDIRECT_URL: 'auth.redirect_url',
  LAST_ACTIVITY: 'auth.last_activity',
  SESSION_WARNING_SHOWN: 'auth.session_warning_shown',
} as const;

// Session configuration
const SESSION_CONFIG = {
  // How often to check session validity (5 minutes)
  CHECK_INTERVAL: 5 * 60 * 1000,
  // Show warning when session expires in 15 minutes
  WARNING_THRESHOLD: 15 * 60 * 1000,
  // Auto-refresh session when it expires in 30 minutes
  REFRESH_THRESHOLD: 30 * 60 * 1000,
  // Maximum session duration without activity (8 hours)
  MAX_IDLE_TIME: 8 * 60 * 60 * 1000,
} as const;

// Session event callback type
type SessionEventCallback = (_authEvent: AuthChangeEvent) => void;

class SessionManager {
  private checkInterval: NodeJS.Timeout | null = null;
  private eventCallbacks: SessionEventCallback[] = [];
  private isInitialized = false;

  /**
   * Initialize session manager
   * Sets up automatic session refresh and event listeners
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    // Skip initialization during SSR
    if (typeof window === 'undefined') {
      console.log('🚀 Session Manager: Skipping initialization during SSR');
      return;
    }

    try {
      // Set up Supabase auth state listener
      supabase.auth.onAuthStateChange((event, session) => {
        this.handleAuthStateChange(event, session);
      });

      // Start periodic session checks
      this.startSessionChecks();

      // Update last activity timestamp
      this.updateLastActivity();

      // Set up activity listeners
      this.setupActivityListeners();

      this.isInitialized = true;
      console.log('✅ Session Manager initialized');
    } catch (error) {
      console.error('❌ Session Manager initialization failed:', error);
      throw error;
    }
  }

  /**
   * Get current session
   */
  async getCurrentSession(): Promise<AuthSession | null> {
    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();
      if (error) throw error;
      return session as AuthSession;
    } catch (error: any) {
      // Don't log AuthSessionMissingError as it's expected when no user is logged in
      if (error?.name !== 'AuthSessionMissingError') {
        console.error('Error getting current session:', error);
      }
      return null;
    }
  }

  /**
   * Get current user
   */
  async getCurrentUser(): Promise<AuthUser | null> {
    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();
      if (error) throw error;
      return user as AuthUser;
    } catch (error: any) {
      // Don't log AuthSessionMissingError as it's expected when no user is logged in
      if (error?.name !== 'AuthSessionMissingError') {
        console.error('Error getting current user:', error);
      }
      return null;
    }
  }

  /**
   * Refresh current session
   */
  async refreshSession(): Promise<{
    session: AuthSession | null;
    error: Error | null;
  }> {
    try {
      const { data, error } = await supabase.auth.refreshSession();

      if (error) {
        console.error('Session refresh failed:', error);
        return { session: null, error };
      }

      if (data.session) {
        this.updateLastActivity();
        console.log('✅ Session refreshed successfully');
        return { session: data.session as AuthSession, error: null };
      }

      return { session: null, error: new Error('No session received') };
    } catch (error) {
      console.error('Session refresh error:', error);
      return { session: null, error: error as Error };
    }
  }

  /**
   * Sign out user and clean up session
   */
  async signOut(): Promise<{ error: Error | null }> {
    try {
      // Clear local storage
      this.clearSessionStorage();

      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error('Sign out error:', error);
        return { error };
      }

      console.log('✅ User signed out successfully');
      return { error: null };
    } catch (error) {
      console.error('Sign out failed:', error);
      return { error: error as Error };
    }
  }

  /**
   * Check if session is valid and not expired
   */
  async isSessionValid(): Promise<boolean> {
    try {
      const session = await this.getCurrentSession();
      if (!session) return false;

      const now = Date.now() / 1000;
      const expiresAt = session.expires_at || 0;

      // Check if session is expired
      if (expiresAt <= now) {
        console.log('⚠️ Session expired');
        return false;
      }

      // Check if user has been idle too long
      const lastActivity = this.getLastActivity();
      if (
        lastActivity &&
        Date.now() - lastActivity > SESSION_CONFIG.MAX_IDLE_TIME
      ) {
        console.log('⚠️ Session expired due to inactivity');
        await this.signOut();
        return false;
      }

      return true;
    } catch (error) {
      console.error('Session validation error:', error);
      return false;
    }
  }

  /**
   * Check if session needs refresh
   */
  async shouldRefreshSession(): Promise<boolean> {
    try {
      const session = await this.getCurrentSession();
      if (!session || !session.expires_at) return false;

      const now = Date.now() / 1000;
      const expiresAt = session.expires_at;
      const timeUntilExpiry = (expiresAt - now) * 1000; // Convert to milliseconds

      return timeUntilExpiry <= SESSION_CONFIG.REFRESH_THRESHOLD;
    } catch (error) {
      console.error('Error checking session refresh need:', error);
      return false;
    }
  }

  /**
   * Add event listener for auth state changes
   */
  onAuthStateChange(callback: SessionEventCallback): () => void {
    this.eventCallbacks.push(callback);

    // Return unsubscribe function
    return () => {
      const index = this.eventCallbacks.indexOf(callback);
      if (index > -1) {
        this.eventCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Handle auth state changes from Supabase
   */
  private handleAuthStateChange(event: string, session: any): void {
    const authEvent: AuthChangeEvent = {
      event: event as AuthEventType,
      session: session as AuthSession,
      user: (session?.user as AuthUser) || null,
    };

    // Update last activity on successful sign in
    if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
      this.updateLastActivity();
    }

    // Clear session data on sign out
    if (event === 'SIGNED_OUT') {
      this.clearSessionStorage();
    }

    // Notify all listeners
    this.eventCallbacks.forEach((callback) => {
      try {
        callback(authEvent);
      } catch (error) {
        console.error('Auth state change callback error:', error);
      }
    });

    console.log(`🔄 Auth state changed: ${event}`);
  }

  /**
   * Start periodic session checks
   */
  private startSessionChecks(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    this.checkInterval = setInterval(async () => {
      try {
        // Check if session needs refresh
        if (await this.shouldRefreshSession()) {
          const result = await this.refreshSession();
          if (result.error) {
            console.error('Automatic session refresh failed:', result.error);
          }
        }

        // Check if session is still valid
        const isValid = await this.isSessionValid();
        if (!isValid) {
          console.log('⚠️ Invalid session detected, signing out');
          await this.signOut();
        }
      } catch (error) {
        console.error('Session check error:', error);
      }
    }, SESSION_CONFIG.CHECK_INTERVAL);
  }

  /**
   * Set up activity listeners to track user activity
   */
  private setupActivityListeners(): void {
    if (typeof window === 'undefined') return;

    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click',
    ];

    const updateActivity = () => {
      this.updateLastActivity();
    };

    events.forEach((event) => {
      document.addEventListener(event, updateActivity, { passive: true });
    });

    // Also listen for visibility changes
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        this.updateLastActivity();
      }
    });
  }

  /**
   * Update last activity timestamp
   */
  private updateLastActivity(): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(
      SESSION_STORAGE_KEYS.LAST_ACTIVITY,
      Date.now().toString()
    );
  }

  /**
   * Get last activity timestamp
   */
  private getLastActivity(): number | null {
    if (typeof window === 'undefined') return null;
    const timestamp = localStorage.getItem(SESSION_STORAGE_KEYS.LAST_ACTIVITY);
    return timestamp ? parseInt(timestamp, 10) : null;
  }

  /**
   * Clear all session-related localStorage data
   */
  private clearSessionStorage(): void {
    if (typeof window === 'undefined') return;

    Object.values(SESSION_STORAGE_KEYS).forEach((key) => {
      localStorage.removeItem(key);
    });
  }

  /**
   * Clean up session manager
   */
  destroy(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }

    this.eventCallbacks = [];
    this.isInitialized = false;
    console.log('🧹 Session Manager destroyed');
  }

  /**
   * Get session info for debugging
   */
  async getSessionInfo(): Promise<{
    isValid: boolean;
    user: AuthUser | null;
    session: AuthSession | null;
    lastActivity: number | null;
    timeUntilRefresh: number | null;
  }> {
    const session = await this.getCurrentSession();
    const user = await this.getCurrentUser();
    const isValid = await this.isSessionValid();
    const lastActivity = this.getLastActivity();

    let timeUntilRefresh = null;
    if (session?.expires_at) {
      const now = Date.now() / 1000;
      timeUntilRefresh = (session.expires_at - now) * 1000;
    }

    return {
      isValid,
      user,
      session,
      lastActivity,
      timeUntilRefresh,
    };
  }
}

// Create singleton instance
export const sessionManager = new SessionManager();

// Utility functions for easy access
const _getCurrentSession = () => sessionManager.getCurrentSession();
const _getCurrentUser = () => sessionManager.getCurrentUser();
const _refreshSession = () => sessionManager.refreshSession();
const _signOut = () => sessionManager.signOut();
const _isSessionValid = () => sessionManager.isSessionValid();

// Initialize session manager (call this in your app's entry point)
const _initializeSessionManager = () => sessionManager.initialize();
