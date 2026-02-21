'use client';

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
} from 'react';
import {
  createUserFriendlyError,
  ErrorSeverity,
} from '@/lib/errors/errorMessages';

interface Toast {
  id: string;
  title?: string;
  message: string;
  severity: ErrorSeverity;
  duration?: number;
  dismissible?: boolean;
  actions?: ToastAction[];
  timestamp: Date;
}

interface ToastAction {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id' | 'timestamp'>) => string;
  removeToast: (id: string) => void;
  clearToasts: () => void;
  showError: (error: Error | string, context?: any) => string;
  showSuccess: (message: string, title?: string) => string;
  showWarning: (message: string, title?: string) => string;
  showInfo: (message: string, title?: string) => string;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

interface ToastProviderProps {
  children: React.ReactNode;
  maxToasts?: number;
  defaultDuration?: number;
}

export function ToastProvider({
  children,
  maxToasts = 5,
  defaultDuration = 5000,
}: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const generateId = useCallback(() => {
    return `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));

    // Clear timeout if exists
    const timeout = timeoutsRef.current.get(id);
    if (timeout) {
      clearTimeout(timeout);
      timeoutsRef.current.delete(id);
    }
  }, []);

  const addToast = useCallback(
    (toastData: Omit<Toast, 'id' | 'timestamp'>) => {
      const id = generateId();
      const toast: Toast = {
        ...toastData,
        id,
        timestamp: new Date(),
        duration: toastData.duration ?? defaultDuration,
        dismissible: toastData.dismissible ?? true,
      };

      setToasts((prev) => {
        const newToasts = [toast, ...prev];
        // Limit number of toasts
        return newToasts.slice(0, maxToasts);
      });

      // Auto-remove toast after duration
      if ((toast.duration ?? 0) > 0) {
        const timeout = setTimeout(() => {
          removeToast(id);
        }, toast.duration!);

        timeoutsRef.current.set(id, timeout);
      }

      return id;
    },
    [generateId, defaultDuration, maxToasts, removeToast]
  );

  const clearToasts = useCallback(() => {
    // Clear all timeouts
    timeoutsRef.current.forEach((timeout) => clearTimeout(timeout));
    timeoutsRef.current.clear();

    setToasts([]);
  }, []);

  const showError = useCallback(
    (error: Error | string, context?: any) => {
      const friendlyError = createUserFriendlyError(error, context);

      const actions: ToastAction[] = [];

      // Add retry action if retryable
      if (friendlyError.isRetryable && context?.onRetry) {
        actions.push({
          label: 'Retry',
          onClick: context.onRetry,
          variant: 'primary',
        });
      }

      // Add primary suggestion as action
      const primarySuggestion = friendlyError.suggestions.find(
        (s) => s.priority === 'primary'
      );
      if (primarySuggestion && primarySuggestion.type !== 'retry') {
        actions.push({
          label: primarySuggestion.action,
          onClick: () => {
            if (primarySuggestion.link) {
              window.location.href = primarySuggestion.link;
            }
          },
          variant: 'secondary',
        });
      }

      return addToast({
        title: friendlyError.title,
        message: friendlyError.message,
        severity: friendlyError.severity,
        duration: friendlyError.severity === 'error' ? 8000 : defaultDuration,
        actions: actions.length > 0 ? actions : undefined,
      });
    },
    [addToast, defaultDuration]
  );

  const showSuccess = useCallback(
    (message: string, title?: string) => {
      return addToast({
        title,
        message,
        severity: 'success',
        duration: 4000,
      });
    },
    [addToast]
  );

  const showWarning = useCallback(
    (message: string, title?: string) => {
      return addToast({
        title,
        message,
        severity: 'warning',
        duration: 6000,
      });
    },
    [addToast]
  );

  const showInfo = useCallback(
    (message: string, title?: string) => {
      return addToast({
        title,
        message,
        severity: 'info',
        duration: 5000,
      });
    },
    [addToast]
  );

  const value: ToastContextType = {
    toasts,
    addToast,
    removeToast,
    clearToasts,
    showError,
    showSuccess,
    showWarning,
    showInfo,
  };

  return (
    <ToastContext.Provider value={value}>{children}</ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
