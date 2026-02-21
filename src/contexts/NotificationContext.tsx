'use client';

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
} from 'react';

export interface ToastNotification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number; // in milliseconds, 0 means no auto-dismiss
  action?: {
    label: string;
    onClick: () => void;
  };
  persistent?: boolean; // if true, won't auto-dismiss
}

interface NotificationContextType {
  notifications: ToastNotification[];
  addNotification: (notification: Omit<ToastNotification, 'id'>) => string;
  removeNotification: (id: string) => void;
  clearAllNotifications: () => void;
  // Convenience methods
  showSuccess: (
    title: string,
    message?: string,
    options?: Partial<ToastNotification>
  ) => string;
  showError: (
    title: string,
    message?: string,
    options?: Partial<ToastNotification>
  ) => string;
  showWarning: (
    title: string,
    message?: string,
    options?: Partial<ToastNotification>
  ) => string;
  showInfo: (
    title: string,
    message?: string,
    options?: Partial<ToastNotification>
  ) => string;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

interface NotificationProviderProps {
  children: React.ReactNode;
  maxNotifications?: number; // Maximum number of notifications to show at once
}

export function NotificationProvider({
  children,
  maxNotifications = 5,
}: NotificationProviderProps) {
  const [notifications, setNotifications] = useState<ToastNotification[]>([]);
  const timersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const removeNotificationRef = useRef<((id: string) => void) | null>(null);

  /**
   * Generate unique ID for notifications
   */
  const generateId = useCallback(() => {
    return `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  /**
   * Set auto-dismiss timer for a notification
   */
  const setDismissTimer = useCallback((id: string, duration: number) => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        removeNotificationRef.current?.(id);
      }, duration);

      timersRef.current.set(id, timer);
    }
  }, []);

  /**
   * Clear timer for a notification
   */
  const clearTimer = useCallback((id: string) => {
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  /**
   * Add a new notification
   */
  const addNotification = useCallback(
    (notification: Omit<ToastNotification, 'id'>): string => {
      const id = generateId();
      const newNotification: ToastNotification = {
        id,
        duration: 5000, // Default 5 seconds
        ...notification,
      };

      setNotifications((prev) => {
        // Remove oldest notifications if we exceed the limit
        const updatedNotifications = [...prev, newNotification];
        if (updatedNotifications.length > maxNotifications) {
          const toRemove = updatedNotifications.slice(
            0,
            updatedNotifications.length - maxNotifications
          );
          toRemove.forEach((notif) => clearTimer(notif.id));
          return updatedNotifications.slice(-maxNotifications);
        }
        return updatedNotifications;
      });

      // Set auto-dismiss timer unless persistent or duration is 0
      if (
        !newNotification.persistent &&
        newNotification.duration &&
        newNotification.duration > 0
      ) {
        setDismissTimer(id, newNotification.duration);
      }

      return id;
    },
    [generateId, maxNotifications, setDismissTimer, clearTimer]
  );

  /**
   * Remove a notification
   */
  const removeNotification = useCallback(
    (id: string) => {
      clearTimer(id);
      setNotifications((prev) =>
        prev.filter((notification) => notification.id !== id)
      );
    },
    [clearTimer]
  );

  // Update the ref whenever removeNotification changes
  removeNotificationRef.current = removeNotification;

  /**
   * Clear all notifications
   */
  const clearAllNotifications = useCallback(() => {
    // Clear all timers
    timersRef.current.forEach((timer) => clearTimeout(timer));
    timersRef.current.clear();

    setNotifications([]);
  }, []);

  /**
   * Convenience method for success notifications
   */
  const showSuccess = useCallback(
    (
      title: string,
      message?: string,
      options?: Partial<ToastNotification>
    ): string => {
      return addNotification({
        type: 'success',
        title,
        message,
        ...options,
      });
    },
    [addNotification]
  );

  /**
   * Convenience method for error notifications
   */
  const showError = useCallback(
    (
      title: string,
      message?: string,
      options?: Partial<ToastNotification>
    ): string => {
      return addNotification({
        type: 'error',
        title,
        message,
        duration: 8000, // Longer duration for errors
        ...options,
      });
    },
    [addNotification]
  );

  /**
   * Convenience method for warning notifications
   */
  const showWarning = useCallback(
    (
      title: string,
      message?: string,
      options?: Partial<ToastNotification>
    ): string => {
      return addNotification({
        type: 'warning',
        title,
        message,
        duration: 6000, // Slightly longer for warnings
        ...options,
      });
    },
    [addNotification]
  );

  /**
   * Convenience method for info notifications
   */
  const showInfo = useCallback(
    (
      title: string,
      message?: string,
      options?: Partial<ToastNotification>
    ): string => {
      return addNotification({
        type: 'info',
        title,
        message,
        ...options,
      });
    },
    [addNotification]
  );

  // Cleanup timers on unmount
  useEffect(() => {
    const currentTimers = timersRef.current;
    return () => {
      currentTimers.forEach((timer) => clearTimeout(timer));
      currentTimers.clear();
    };
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        addNotification,
        removeNotification,
        clearAllNotifications,
        showSuccess,
        showError,
        showWarning,
        showInfo,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

/**
 * Hook to use the notification context
 */
export function useNotificationContext(): NotificationContextType {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      'useNotificationContext must be used within a NotificationProvider'
    );
  }
  return context;
}
