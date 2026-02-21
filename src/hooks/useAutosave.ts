'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

// Inline useDebounce to avoid import issues
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error' | 'offline';

interface AutosaveOptions {
  /** Delay in milliseconds before autosave triggers (default: 30000 = 30 seconds) */
  delay?: number;
  /** Unique key for localStorage storage */
  storageKey: string;
  /** Document/article ID for Supabase storage */
  documentId?: string;
  /** User ID for Supabase storage */
  userId?: string;
  /** Enable Supabase cloud storage (default: true) */
  enableCloudStorage?: boolean;
  /** Custom save function (if not provided, uses default localStorage + Supabase) */
  onSave?: (_content: string, _metadata?: any) => Promise<void>;
}

export interface AutosaveState {
  status: SaveStatus;
  lastSaved: Date | null;
  isDirty: boolean;
  error: string | null;
  retryCount: number;
}

interface AutosaveActions {
  save: () => Promise<void>;
  load: () => string | null;
  clear: () => void;
  reset: () => void;
}

// Maximum retry attempts for failed saves
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 2000; // 2 seconds

export function useAutosave(
  content: string,
  options: AutosaveOptions
): [AutosaveState, AutosaveActions] {
  const {
    delay = 30000, // 30 seconds default
    storageKey,
    documentId,
    userId,
    enableCloudStorage = true,
    onSave,
  } = options;

  // State management
  const [status, setStatus] = useState<SaveStatus>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Refs for stable references
  const contentRef = useRef(content);
  const retryTimeoutRef = useRef<NodeJS.Timeout>();
  const initialContentRef = useRef<string>('');

  // Debounced content for autosave
  const debouncedContent = useDebounce(content, delay);

  // Update content ref and dirty state
  useEffect(() => {
    contentRef.current = content;

    // Set initial content on first render
    if (initialContentRef.current === '') {
      initialContentRef.current = content;
      setIsDirty(false);
    } else {
      // Check if content has changed
      setIsDirty(content !== initialContentRef.current);
    }
  }, [content]);

  // Check if we're online
  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

  // Save to localStorage (always works, even offline)
  const saveToLocalStorage = useCallback(
    (contentToSave: string): void => {
      try {
        if (typeof window === 'undefined') return;

        const saveData = {
          content: contentToSave,
          timestamp: new Date().toISOString(),
          documentId,
          userId,
        };

        localStorage.setItem(
          `autosave_${storageKey}`,
          JSON.stringify(saveData)
        );

        // Also save a recovery version with timestamp
        const recoveryKey = `recovery_${storageKey}_${Date.now()}`;
        localStorage.setItem(recoveryKey, JSON.stringify(saveData));

        // Clean up old recovery saves (keep only last 5)
        const keys = Object.keys(localStorage)
          .filter((key) => key.startsWith(`recovery_${storageKey}_`))
          .sort();

        if (keys.length > 5) {
          keys.slice(0, -5).forEach((key) => localStorage.removeItem(key));
        }
      } catch (err) {
        console.warn('Failed to save to localStorage:', err);
      }
    },
    [storageKey, documentId, userId]
  );

  // Save to Supabase (cloud storage)
  const saveToSupabase = useCallback(
    async (contentToSave: string): Promise<void> => {
      if (!enableCloudStorage || !documentId || !userId) {
        return; // Skip cloud save if not configured
      }

      try {
        const response = await fetch('/api/drafts/save', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            documentId,
            userId,
            content: contentToSave,
            timestamp: new Date().toISOString(),
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || `HTTP ${response.status}`);
        }
      } catch (err) {
        console.error('Failed to save to Supabase:', err);
        throw err;
      }
    },
    [enableCloudStorage, documentId, userId]
  );

  // Main save function
  const save = useCallback(async (): Promise<void> => {
    const contentToSave = contentRef.current;

    if (!contentToSave.trim()) {
      return; // Don't save empty content
    }

    setStatus('saving');
    setError(null);

    try {
      // Always save to localStorage first (immediate backup)
      saveToLocalStorage(contentToSave);

      // Use custom save function if provided
      if (onSave) {
        await onSave(contentToSave, { documentId, userId });
      } else if (isOnline) {
        // Try to save to Supabase if online
        await saveToSupabase(contentToSave);
      }

      // Success
      setStatus('saved');
      setLastSaved(new Date());
      setIsDirty(false);
      setRetryCount(0);
      initialContentRef.current = contentToSave;

      // Clear saved status after 3 seconds
      setTimeout(() => {
        setStatus('idle');
      }, 3000);
    } catch (err: any) {
      console.error('Save failed:', err);
      setError(err.message || 'Save failed');

      if (!isOnline) {
        setStatus('offline');
      } else {
        setStatus('error');

        // Implement retry logic
        if (retryCount < MAX_RETRY_ATTEMPTS) {
          setRetryCount((prev) => prev + 1);

          // Schedule retry
          retryTimeoutRef.current = setTimeout(
            () => {
              save();
            },
            RETRY_DELAY * (retryCount + 1)
          ); // Exponential backoff
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onSave, saveToLocalStorage, saveToSupabase, isOnline, retryCount]);

  // Load from storage
  const load = useCallback((): string | null => {
    try {
      if (typeof window === 'undefined') return null;

      const saved = localStorage.getItem(`autosave_${storageKey}`);
      if (!saved) return null;

      const saveData = JSON.parse(saved);
      return saveData.content || null;
    } catch (err) {
      console.warn('Failed to load from localStorage:', err);
      return null;
    }
  }, [storageKey]);

  // Clear all saved data
  const clear = useCallback((): void => {
    try {
      if (typeof window === 'undefined') return;

      // Clear main autosave
      localStorage.removeItem(`autosave_${storageKey}`);

      // Clear recovery saves
      const keys = Object.keys(localStorage).filter((key) =>
        key.startsWith(`recovery_${storageKey}_`)
      );
      keys.forEach((key) => localStorage.removeItem(key));

      setLastSaved(null);
      setIsDirty(false);
      setStatus('idle');
      setError(null);
      setRetryCount(0);
    } catch (err) {
      console.warn('Failed to clear localStorage:', err);
    }
  }, [storageKey]);

  // Reset state
  const reset = useCallback((): void => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }

    setStatus('idle');
    setError(null);
    setRetryCount(0);
    setIsDirty(false);
    initialContentRef.current = contentRef.current;
  }, []);

  // Autosave when debounced content changes
  useEffect(() => {
    if (
      debouncedContent !== initialContentRef.current &&
      debouncedContent.trim()
    ) {
      save();
    }
  }, [debouncedContent, save]);

  // Handle online/offline status changes
  useEffect(() => {
    const handleOnline = () => {
      if (isDirty && status === 'offline') {
        save(); // Retry save when back online
      }
    };

    const handleOffline = () => {
      if (status === 'saving') {
        setStatus('offline');
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, [isDirty, status, save]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  // State object
  const state: AutosaveState = {
    status,
    lastSaved,
    isDirty,
    error,
    retryCount,
  };

  // Actions object
  const actions: AutosaveActions = {
    save,
    load,
    clear,
    reset,
  };

  return [state, actions];
}
