'use client';

import React, { useState, useEffect } from 'react';
import {
  useNotificationContext,
  type ToastNotification as ToastNotificationType,
} from '@/contexts/NotificationContext';

interface ToastNotificationProps {
  notification: ToastNotificationType;
  index: number;
}

/**
 * Individual toast notification component with animations
 */
export default function ToastNotification({
  notification,
  index,
}: ToastNotificationProps) {
  const { removeNotification } = useNotificationContext();
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  // Animation: fade in on mount
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  /**
   * Handle notification dismissal with exit animation
   */
  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => {
      removeNotification(notification.id);
    }, 300); // Match exit animation duration
  };

  /**
   * Get icon based on notification type
   */
  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return (
          <svg
            className="w-5 h-5 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        );
      case 'error':
        return (
          <svg
            className="w-5 h-5 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        );
      case 'warning':
        return (
          <svg
            className="w-5 h-5 text-yellow-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.864-.833-2.634 0L3.216 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        );
      case 'info':
        return (
          <svg
            className="w-5 h-5 text-blue-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
      default:
        return null;
    }
  };

  /**
   * Get styling based on notification type
   */
  const getTypeStyles = () => {
    switch (notification.type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  return (
    <div
      className={`
        pointer-events-auto
        transform transition-all duration-300 ease-in-out
        ${
          isVisible && !isExiting
            ? 'translate-x-0 opacity-100 scale-100'
            : isExiting
              ? '-translate-x-full opacity-0 scale-95'
              : 'translate-x-full opacity-0 scale-95'
        }
      `}
      style={{
        // Stagger animations for multiple notifications
        transitionDelay: `${index * 100}ms`,
      }}
      role="alert"
      aria-live="assertive"
    >
      <div
        className={`
          max-w-sm w-full shadow-lg rounded-lg border-l-4 p-4
          ${getTypeStyles()}
        `}
      >
        <div className="flex items-start">
          {/* Icon */}
          <div className="flex-shrink-0">{getIcon()}</div>

          {/* Content */}
          <div className="ml-3 flex-1">
            <h4 className="text-sm font-semibold mb-1">{notification.title}</h4>

            {notification.message && (
              <p className="text-sm opacity-90 mb-2">{notification.message}</p>
            )}

            {/* Action button if provided */}
            {notification.action && (
              <button
                onClick={notification.action.onClick}
                className={`
                  text-sm font-medium underline hover:no-underline
                  focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-current
                  ${notification.type === 'success' ? 'text-green-700 hover:text-green-800' : ''}
                  ${notification.type === 'error' ? 'text-red-700 hover:text-red-800' : ''}
                  ${notification.type === 'warning' ? 'text-yellow-700 hover:text-yellow-800' : ''}
                  ${notification.type === 'info' ? 'text-blue-700 hover:text-blue-800' : ''}
                `}
              >
                {notification.action.label}
              </button>
            )}
          </div>

          {/* Dismiss button */}
          <div className="ml-4 flex-shrink-0">
            <button
              onClick={handleDismiss}
              className={`
                inline-flex rounded-md p-1.5 
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-current
                hover:bg-black hover:bg-opacity-10
                ${notification.type === 'success' ? 'text-green-500 focus:ring-green-600' : ''}
                ${notification.type === 'error' ? 'text-red-500 focus:ring-red-600' : ''}
                ${notification.type === 'warning' ? 'text-yellow-500 focus:ring-yellow-600' : ''}
                ${notification.type === 'info' ? 'text-blue-500 focus:ring-blue-600' : ''}
              `}
              aria-label="Dismiss notification"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Progress bar for timed notifications */}
        {!notification.persistent &&
          notification.duration &&
          notification.duration > 0 && (
            <div className="mt-2">
              <div className="w-full bg-black bg-opacity-10 rounded-full h-1">
                <div
                  className={`
                  h-1 rounded-full
                  ${notification.type === 'success' ? 'bg-green-600' : ''}
                  ${notification.type === 'error' ? 'bg-red-600' : ''}
                  ${notification.type === 'warning' ? 'bg-yellow-600' : ''}
                  ${notification.type === 'info' ? 'bg-blue-600' : ''}
                `}
                  style={{
                    animation: `shrink ${notification.duration}ms linear forwards`,
                  }}
                />
              </div>
            </div>
          )}
      </div>

      <style jsx>{`
        @keyframes shrink {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
      `}</style>
    </div>
  );
}
