'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from 'react';
import { sessionManager } from '@/lib/session-manager';
import { supabase } from '@/lib/supabase';
import type {
  AuthUser,
  AuthSession,
  AuthState,
  SignUpFormData,
  SignInFormData,
  SignUpResponse,
  SignInResponse,
  UseAuthReturn,
  AuthProviderProps,
  AuthOptions,
  PasswordResetData,
  UpdatePasswordData,
  UserProfile,
} from '@/lib/supabase';

// Create the Auth Context
const AuthContext = createContext<UseAuthReturn | undefined>(undefined);

// Profile cache to reduce redundant API calls
const profileCache = new Map<
  string,
  { profile: UserProfile | null; timestamp: number }
>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

// Helper function to fetch user profile from database with caching
const fetchUserProfile = async (
  userId: string,
  forceRefresh = false
): Promise<UserProfile | null> => {
  // console.log('🔍 [AuthContext] Fetching user profile for userId:', userId, {
  //   forceRefresh,
  // });

  // Check cache first (unless forcing refresh)
  if (!forceRefresh && profileCache.has(userId)) {
    const cached = profileCache.get(userId)!;
    const isValid = Date.now() - cached.timestamp < CACHE_DURATION;
    if (isValid) {
      // console.log('✅ [AuthContext] Using cached user profile');
      return cached.profile;
    }
  }

  try {
    const { data: userProfile, error } = await supabase
      .from('users')
      .select('*') // Pobierz wszystkie pola z tabeli users
      .eq('id', userId)
      .single();

    if (error) {
      console.error('❌ [AuthContext] Error fetching user profile:', error);
      // Cache null result to prevent repeated failed requests
      profileCache.set(userId, { profile: null, timestamp: Date.now() });
      return null;
    }

    const profile = userProfile as UserProfile;

    // Cache the successful result
    profileCache.set(userId, { profile, timestamp: Date.now() });

    console.log('✅ [AuthContext] User profile fetched successfully:', {
      id: profile?.id,
      handle: profile?.handle,
      display_name: profile?.display_name,
      role: profile?.role,
      hasProfile: !!profile,
    });

    return profile;
  } catch (error) {
    console.error('❌ [AuthContext] Failed to fetch user profile:', error);
    // Cache null result to prevent repeated failed requests
    profileCache.set(userId, { profile: null, timestamp: Date.now() });
    return null;
  }
};

// AuthProvider component
export function AuthProvider({
  children,
  initialSession = null,
}: AuthProviderProps) {
  // Auth state
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: initialSession,
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const { hash, pathname, search } = window.location;

    if (!hash || !hash.includes('access_token')) {
      return;
    }

    const params = new URLSearchParams(hash.slice(1));
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');

    if (accessToken && refreshToken) {
      void supabase.auth
        .setSession({ access_token: accessToken, refresh_token: refreshToken })
        .then(({ error }) => {
          if (error) {
            console.error(
              '❌ [AuthContext] Error setting session from OAuth tokens:',
              error
            );
            return;
          }

          // Clear stale PKCE verifier once the session is in place
          for (let index = 0; index < window.localStorage.length; index++) {
            const key = window.localStorage.key(index);
            if (key && key.endsWith('code-verifier')) {
              window.localStorage.removeItem(key);
            }
          }
        });
    }

    window.history.replaceState(null, '', `${pathname}${search}`);
  }, []);

  // Initialize auth state with SSR safety and improved stability
  const initializeAuth = useCallback(async () => {
    // Skip initialization during SSR to prevent hydration issues
    if (typeof window === 'undefined') {
      console.log('🚀 [AuthContext] Skipping auth initialization during SSR');
      return;
    }

    let initializationTimeout: NodeJS.Timeout | null = null;

    try {
      setAuthState((prev) => ({ ...prev, loading: true, error: null }));

      console.log('🚀 [AuthContext] Starting authentication initialization');

      // Set a shorter fallback timeout to prevent hanging
      initializationTimeout = setTimeout(() => {
        console.warn(
          '⚠️ [AuthContext] Auth initialization timeout - setting default state'
        );
        setAuthState({
          user: null,
          session: null,
          loading: false,
          error: null, // Don't treat timeout as an error, just no auth
        });
      }, 5000); // Reduced to 5 second timeout

      // Initialize session manager with timeout protection
      try {
        await sessionManager.initialize();
      } catch (initError) {
        console.error('❌ Session manager initialization failed:', initError);
        // Continue without session manager - fallback to direct Supabase calls
      }

      // Get current user and session with individual timeouts
      const getUserWithTimeout = () => {
        return Promise.race([
          sessionManager.getCurrentUser(),
          new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000)),
        ]);
      };

      const getSessionWithTimeout = () => {
        return Promise.race([
          sessionManager.getCurrentSession(),
          new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000)),
        ]);
      };

      const [user, session] = await Promise.all([
        getUserWithTimeout(),
        getSessionWithTimeout(),
      ]);

      console.log('👤 [AuthContext] Got user and session:', {
        hasUser: !!user,
        hasSession: !!session,
        userId: user?.id,
      });

      // If user exists, fetch their profile (with timeout)
      let enhancedUser = null;
      if (user) {
        try {
          // Add profile fetch timeout to prevent blocking
          const profilePromise = fetchUserProfile(user.id, false);
          const profileTimeout = new Promise<null>((resolve) =>
            setTimeout(() => resolve(null), 2000)
          );

          const userProfile = await Promise.race([
            profilePromise,
            profileTimeout,
          ]);

          enhancedUser = {
            ...user,
            role: userProfile?.role || undefined,
            handle: userProfile?.handle || null,
            xp: userProfile?.xp || 0,
            badges: userProfile?.badges || [],
            profile: userProfile || undefined,
          };
        } catch (profileError) {
          console.error(
            '⚠️ Profile fetch failed, using base user data:',
            profileError
          );
          // Always provide enhanced user structure even on profile fetch failure
          enhancedUser = {
            ...user,
            role: undefined,
            handle: null,
            xp: 0,
            badges: [],
            profile: undefined,
          };
        }
      }

      // Clear the timeout since we completed successfully
      if (initializationTimeout) {
        clearTimeout(initializationTimeout);
        initializationTimeout = null;
      }

      console.log(
        '✅ [AuthContext] Authentication initialization completed successfully'
      );
      setAuthState({
        user: enhancedUser,
        session,
        loading: false,
        error: null,
      });
    } catch (error) {
      if (initializationTimeout) {
        clearTimeout(initializationTimeout);
      }

      console.error('❌ Auth initialization failed:', error);
      setAuthState({
        user: null,
        session: null,
        loading: false,
        error: error as Error,
      });
    }
  }, []);

  // Update auth state when session manager events occur with stability checks
  const handleAuthStateChange = useCallback(async (event: any) => {
    console.log('🔄 [AuthContext] Auth state change event:', event.event, {
      hasUser: !!event.user,
      hasSession: !!event.session,
      userId: event.user?.id,
    });

    // Add stability check - prevent rapid state changes
    setAuthState((prev) => {
      // If we're in the same state, avoid unnecessary updates
      const sameUser = prev.user?.id === event.user?.id;
      const sameSession =
        prev.session?.access_token === event.session?.access_token;

      if (sameUser && sameSession && !prev.loading) {
        console.log('👍 [AuthContext] Auth state unchanged, skipping update');
        return prev;
      }

      return { ...prev, loading: true };
    });

    try {
      // Extend Supabase User with our custom fields
      let enhancedUser = null;
      if (event.user) {
        // Use cached profile data when available, only fetch if needed
        const userProfile = await fetchUserProfile(event.user.id, false);

        enhancedUser = {
          ...event.user, // Keep all original Supabase User fields
          role: userProfile?.role || undefined, // UserRole | undefined
          handle: userProfile?.handle || null,
          xp: userProfile?.xp || 0,
          badges: userProfile?.badges || [],
          profile: userProfile || undefined, // UserProfile | undefined
        };
      }

      setAuthState((prev) => ({
        ...prev,
        user: enhancedUser,
        session: event.session,
        loading: false,
        error: null,
      }));

      console.log('✅ [AuthContext] Auth state updated successfully');
    } catch (error) {
      console.error('❌ [AuthContext] Auth state change failed:', error);
      setAuthState((prev) => ({
        ...prev,
        loading: false,
        error: error as Error,
      }));
    }
  }, []);

  // Sign up method
  const signUp = useCallback(
    async (
      formData: SignUpFormData,
      options: AuthOptions = {}
    ): Promise<SignUpResponse> => {
      try {
        setAuthState((prev) => ({ ...prev, loading: true, error: null }));

        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              handle: formData.handle,
            },
            ...options,
          },
        });

        if (error) throw error;

        const response: SignUpResponse = {
          user: data.user as AuthUser,
          session: data.session as AuthSession,
          error: null,
        };

        // Don't update state here - let the auth state listener handle it
        setAuthState((prev) => ({ ...prev, loading: false }));

        return response;
      } catch (error) {
        const authError = error as Error;
        setAuthState((prev) => ({ ...prev, loading: false, error: authError }));

        return {
          user: null,
          session: null,
          error: authError,
        };
      }
    },
    []
  );

  // Sign in method
  const signIn = useCallback(
    async (
      formData: SignInFormData,
      options: AuthOptions = {}
    ): Promise<SignInResponse> => {
      try {
        setAuthState((prev) => ({ ...prev, loading: true, error: null }));

        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
          ...options,
        });

        if (error) throw error;

        // Handle "Remember Me" functionality
        if (formData.rememberMe) {
          localStorage.setItem('auth.remember_me', 'true');
        } else {
          localStorage.removeItem('auth.remember_me');
        }

        const response: SignInResponse = {
          user: data.user as AuthUser,
          session: data.session as AuthSession,
          error: null,
        };

        // Don't update state here - let the auth state listener handle it
        setAuthState((prev) => ({ ...prev, loading: false }));

        return response;
      } catch (error) {
        const authError = error as Error;
        setAuthState((prev) => ({ ...prev, loading: false, error: authError }));

        return {
          user: null,
          session: null,
          error: authError,
        };
      }
    },
    []
  );

  // Google sign in method
  const signInWithGoogle = useCallback(
    async (options: AuthOptions = {}): Promise<SignInResponse> => {
      try {
        setAuthState((prev) => ({ ...prev, loading: true, error: null }));

        const origin =
          typeof window === 'undefined'
            ? process.env.NEXT_PUBLIC_SITE_URL!
            : window.location.origin;

        // Use provided redirectTo or default to /auth/callback
        const redirectTo = options.redirectTo || `${origin}/auth/callback`;

        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: redirectTo,
            queryParams: {
              access_type: 'offline',
              prompt: 'consent',
            },
          },
        });

        if (error) throw error;

        if (typeof window !== 'undefined') {
          for (let index = 0; index < window.localStorage.length; index++) {
            const key = window.localStorage.key(index);
            if (!key || !key.endsWith('code-verifier')) continue;

            const verifierValue = window.localStorage.getItem(key);
            if (!verifierValue) continue;

            const secureFlag =
              window.location.protocol === 'https:' ? ' Secure;' : '';
            document.cookie = `${key}=${encodeURIComponent(
              verifierValue
            )}; Path=/; SameSite=Lax;${secureFlag}`;
          }
        }

        const response: SignInResponse = {
          user: null, // OAuth redirect doesn't return user immediately
          session: null, // OAuth redirect doesn't return session immediately
          error: null,
        };

        // Don't update state here - let the auth state listener handle it
        setAuthState((prev) => ({ ...prev, loading: false }));

        return response;
      } catch (error) {
        const authError = error as Error;
        setAuthState((prev) => ({ ...prev, loading: false, error: authError }));

        return {
          user: null,
          session: null,
          error: authError,
        };
      }
    },
    []
  );

  // Sign out method
  const signOut = useCallback(async (): Promise<{ error: Error | null }> => {
    try {
      setAuthState((prev) => ({ ...prev, loading: true, error: null }));

      const { error } = await sessionManager.signOut();

      if (error) throw error;

      // State will be updated by auth state listener
      return { error: null };
    } catch (error) {
      const authError = error as Error;
      setAuthState((prev) => ({ ...prev, loading: false, error: authError }));
      return { error: authError };
    }
  }, []);

  // Reset password method
  const resetPassword = useCallback(
    async (data: PasswordResetData): Promise<{ error: Error | null }> => {
      try {
        setAuthState((prev) => ({ ...prev, error: null }));

        const { error } = await supabase.auth.resetPasswordForEmail(
          data.email,
          {
            redirectTo: `${window.location.origin}/auth/reset-password`,
          }
        );

        if (error) throw error;

        return { error: null };
      } catch (error) {
        const authError = error as Error;
        setAuthState((prev) => ({ ...prev, error: authError }));
        return { error: authError };
      }
    },
    []
  );

  // Update password method
  const updatePassword = useCallback(
    async (data: UpdatePasswordData): Promise<{ error: Error | null }> => {
      try {
        setAuthState((prev) => ({ ...prev, loading: true, error: null }));

        if (data.password !== data.confirmPassword) {
          throw new Error('Hasła nie są identyczne');
        }

        const { error } = await supabase.auth.updateUser({
          password: data.password,
        });

        if (error) throw error;

        setAuthState((prev) => ({ ...prev, loading: false }));
        return { error: null };
      } catch (error) {
        const authError = error as Error;
        setAuthState((prev) => ({ ...prev, loading: false, error: authError }));
        return { error: authError };
      }
    },
    []
  );

  // Refresh session method
  const refreshSession = useCallback(async (): Promise<void> => {
    try {
      setAuthState((prev) => ({ ...prev, error: null }));

      const result = await sessionManager.refreshSession();

      if (result.error) {
        throw result.error;
      }

      // State will be updated by auth state listener if successful
    } catch (error) {
      const authError = error as Error;
      setAuthState((prev) => ({ ...prev, error: authError }));
      throw authError;
    }
  }, []);

  // Resend verification email method
  const resendVerificationEmail = useCallback(
    async (email?: string): Promise<{ error: Error | null }> => {
      setAuthState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const emailToUse = email || authState.user?.email;

        if (!emailToUse) {
          throw new Error('No email address available');
        }

        const { error: resendError } = await supabase.auth.resend({
          type: 'signup',
          email: emailToUse,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });

        if (resendError) {
          throw resendError;
        }

        setAuthState((prev) => ({ ...prev, loading: false }));
        return { error: null };
      } catch (error) {
        const authError = error as Error;
        setAuthState((prev) => ({ ...prev, loading: false, error: authError }));
        return { error: authError };
      }
    },
    [authState.user?.email]
  );

  // Refresh user profile method
  const refreshUserProfile = useCallback(async (): Promise<{
    error: Error | null;
  }> => {
    try {
      if (!authState.user?.id) {
        return { error: new Error('No user logged in') };
      }

      const userProfile = await fetchUserProfile(authState.user.id);

      if (userProfile) {
        const enhancedUser = {
          ...authState.user,
          role: userProfile.role || undefined,
          handle: userProfile.handle || null,
          xp: userProfile.xp || 0,
          badges: userProfile.badges || [],
          profile: userProfile || undefined,
        };

        setAuthState((prev) => ({
          ...prev,
          user: enhancedUser,
        }));
      }

      return { error: null };
    } catch (error) {
      const authError = error as Error;
      console.error('❌ Failed to refresh user profile:', authError);
      return { error: authError };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authState.user?.id]);

  // Initialize auth on mount with stability check
  useEffect(() => {
    console.log('🔄 [AuthContext] Component mounted, initializing auth');

    // Add a small delay to ensure DOM is ready
    const initTimer = setTimeout(() => {
      initializeAuth();
    }, 100);

    return () => {
      if (initTimer) clearTimeout(initTimer);
    };
  }, [initializeAuth]);

  // Set up auth state listener
  useEffect(() => {
    const unsubscribe = sessionManager.onAuthStateChange(handleAuthStateChange);

    return () => {
      unsubscribe();
    };
  }, [handleAuthStateChange]);

  // Context value - memoized to prevent unnecessary re-renders
  const contextValue: UseAuthReturn = useMemo(
    () => ({
      // State
      user: authState.user,
      session: authState.session,
      loading: authState.loading,
      error: authState.error,

      // Methods
      signUp,
      signIn,
      signInWithGoogle,
      signOut,
      resetPassword,
      updatePassword,
      refreshSession,
      resendVerificationEmail,
      refreshUserProfile,
    }),
    [
      authState.user,
      authState.session,
      authState.loading,
      authState.error,
      signUp,
      signIn,
      signInWithGoogle,
      signOut,
      resetPassword,
      updatePassword,
      refreshSession,
      resendVerificationEmail,
      refreshUserProfile,
    ]
  );

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}

// Custom hook to use auth context
export function useAuth(): UseAuthReturn {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}

// Helper hook for checking if user is authenticated
export function useIsAuthenticated(): boolean {
  const { user, loading } = useAuth();
  return !loading && !!user;
}

// Helper hook for getting user profile data
export function useUserProfile() {
  const { user, loading } = useAuth();

  const profileData = {
    profile: user?.profile || null,
    handle: user?.handle || user?.profile?.handle || null,
    email: user?.email || null,
    role: user?.role || null,
    isLoading: loading,
    isAuthenticated: !loading && !!user,
  };

  console.log('👤 [useUserProfile] Profile data:', {
    hasUser: !!user,
    isLoading: loading,
    isAuthenticated: profileData.isAuthenticated,
    handle: profileData.handle,
    role: profileData.role,
    hasProfile: !!profileData.profile,
    userKeys: user ? Object.keys(user) : [],
  });

  return profileData;
}

// Helper hook for session information
export function useSession() {
  const { session, loading } = useAuth();

  const isExpired = session?.expires_at
    ? Date.now() / 1000 >= session.expires_at
    : false;

  const timeUntilExpiry = session?.expires_at
    ? Math.max(0, session.expires_at * 1000 - Date.now())
    : null;

  return {
    session,
    isLoading: loading,
    isValid: !loading && !!session && !isExpired,
    isExpired,
    timeUntilExpiry,
    expiresAt: session?.expires_at ? new Date(session.expires_at * 1000) : null,
  };
}
