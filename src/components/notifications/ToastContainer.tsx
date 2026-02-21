'use client';

import React from 'react';
import { useNotificationContext } from '@/contexts/NotificationContext';
import ToastNotification from './ToastNotification';
import { createPortal } from 'react-dom';

interface ToastContainerProps {
  position?:
    | 'top-right'
    | 'top-left'
    | 'bottom-right'
    | 'bottom-left'
    | 'top-center'
    | 'bottom-center';
  className?: string;
}

/**
 * Container component that renders all toast notifications
 * Uses React Portal to render notifications at the root level
 */
export default function ToastContainer({
  position = 'top-right',
  className = '',
}: ToastContainerProps) {
  const { notifications } = useNotificationContext();
  const [mounted, setMounted] = React.useState(false);

  // Ensure component is mounted before rendering portal
  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || notifications.length === 0) {
    return null;
  }

  // Position classes mapping
  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-center': 'top-4 left-1/2 transform -translate-x-1/2',
    'bottom-center': 'bottom-4 left-1/2 transform -translate-x-1/2',
  };

  const containerContent = (
    <div
      className={`
        fixed z-50 pointer-events-none
        ${positionClasses[position]}
        ${className}
      `}
      aria-live="polite"
      aria-label="Notifications"
    >
      <div className="flex flex-col space-y-2 max-w-sm w-full">
        {notifications.map((notification, index) => (
          <ToastNotification
            key={notification.id}
            notification={notification}
            index={index}
          />
        ))}
      </div>
    </div>
  );

  // Use portal to render at document body level
  return createPortal(containerContent, document.body);
}
