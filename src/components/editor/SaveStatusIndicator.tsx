'use client';

import React from 'react';
import { SaveStatus, AutosaveState } from '@/hooks/useAutosave';

interface SaveStatusIndicatorProps {
  state: AutosaveState;
  onManualSave: () => Promise<void>;
  className?: string;
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);

  if (diffSeconds < 10) return 'just now';
  if (diffSeconds < 60) return `${diffSeconds}s ago`;
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;

  return date.toLocaleDateString();
}

function getStatusIcon(status: SaveStatus, isDirty: boolean) {
  switch (status) {
    case 'saving':
      return (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="2"
          />
          <polyline
            points="12,6 12,12 16,14"
            stroke="currentColor"
            strokeWidth="2"
          />
        </svg>
      );

    case 'saved':
      return (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M20 6 9 17l-5-5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );

    case 'error':
      return (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="2"
          />
          <path d="m15 9-6 6" stroke="currentColor" strokeWidth="2" />
          <path d="m9 9 6 6" stroke="currentColor" strokeWidth="2" />
        </svg>
      );

    case 'offline':
      return (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M5 12.55a11 11 0 0 1 14.08 0"
            stroke="currentColor"
            strokeWidth="2"
          />
          <path
            d="M1.42 9a16 16 0 0 1 21.16 0"
            stroke="currentColor"
            strokeWidth="2"
          />
          <path
            d="M8.53 16.11a6 6 0 0 1 6.95 0"
            stroke="currentColor"
            strokeWidth="2"
          />
          <line
            x1="12"
            y1="20"
            x2="12.01"
            y2="20"
            stroke="currentColor"
            strokeWidth="2"
          />
          <line
            x1="2"
            y1="2"
            x2="22"
            y2="22"
            stroke="currentColor"
            strokeWidth="2"
          />
        </svg>
      );

    default: // idle
      if (isDirty) {
        return (
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
              stroke="currentColor"
              strokeWidth="2"
            />
            <path
              d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
              stroke="currentColor"
              strokeWidth="2"
            />
          </svg>
        );
      }
      return (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"
            stroke="currentColor"
            strokeWidth="2"
          />
          <polyline
            points="17,21 17,13 7,13 7,21"
            stroke="currentColor"
            strokeWidth="2"
          />
          <polyline
            points="7,3 7,8 15,8"
            stroke="currentColor"
            strokeWidth="2"
          />
        </svg>
      );
  }
}

function getStatusConfig(
  status: SaveStatus,
  isDirty: boolean,
  error: string | null,
  retryCount: number
) {
  switch (status) {
    case 'saving':
      return {
        text: 'Saving...',
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        animate: true,
      };

    case 'saved':
      return {
        text: 'Saved',
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        animate: false,
      };

    case 'error':
      return {
        text: retryCount > 0 ? `Error (retry ${retryCount}/3)` : 'Save failed',
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        animate: false,
      };

    case 'offline':
      return {
        text: 'Offline - saved locally',
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200',
        animate: false,
      };

    default: // idle
      if (isDirty) {
        return {
          text: 'Unsaved changes',
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          animate: false,
        };
      }
      return {
        text: 'All changes saved',
        color: 'text-gray-500',
        bgColor: 'bg-white',
        borderColor: 'border-gray-200',
        animate: false,
      };
  }
}

export default function SaveStatusIndicator({
  state,
  onManualSave,
  className = '',
}: SaveStatusIndicatorProps) {
  const { status, lastSaved, isDirty, error, retryCount } = state;
  const config = getStatusConfig(status, isDirty, error, retryCount);
  const icon = getStatusIcon(status, isDirty);

  const handleManualSave = async () => {
    try {
      await onManualSave();
    } catch (err) {
      console.error('Manual save failed:', err);
    }
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Premium Status Indicator */}
      <div
        className={`
          flex items-center gap-3 px-4 py-2 rounded-xl border text-sm backdrop-blur-sm
          ${config.color} ${config.bgColor} ${config.borderColor}
          ${config.animate ? 'animate-pulse' : ''} 
          transition-all duration-300 shadow-sm
        `}
      >
        <span className="flex items-center">{icon}</span>
        <span className="font-medium">{config.text}</span>

        {/* Last saved time */}
        {lastSaved && status === 'idle' && (
          <span className="text-xs opacity-75">
            • {formatRelativeTime(lastSaved)}
          </span>
        )}
      </div>

      {/* Premium Manual Save Button */}
      <button
        onClick={handleManualSave}
        disabled={status === 'saving' || (!isDirty && status !== 'error')}
        className={`
          btn-premium flex items-center gap-2 min-w-[100px] justify-center micro-interaction
          ${
            status === 'saving'
              ? 'opacity-50 cursor-not-allowed'
              : isDirty || status === 'error'
                ? 'btn-premium-primary hover-lift'
                : 'opacity-50 cursor-not-allowed'
          }
        `}
        title={
          status === 'saving'
            ? 'Currently saving...'
            : !isDirty && status !== 'error'
              ? 'No changes to save'
              : 'Save changes now'
        }
      >
        {status === 'saving' ? (
          <>
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
            <span>Saving</span>
          </>
        ) : (
          <>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"
                stroke="currentColor"
                strokeWidth="2"
              />
              <polyline
                points="17,21 17,13 7,13 7,21"
                stroke="currentColor"
                strokeWidth="2"
              />
              <polyline
                points="7,3 7,8 15,8"
                stroke="currentColor"
                strokeWidth="2"
              />
            </svg>
            <span>Save</span>
          </>
        )}
      </button>

      {/* Error Details (if any) */}
      {error && status === 'error' && (
        <div className="flex items-center gap-2">
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="text-red-500"
          >
            <path
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
              stroke="currentColor"
              strokeWidth="2"
            />
          </svg>
          <span className="text-xs text-red-500" title={error}>
            {error.length > 20 ? `${error.substring(0, 20)}...` : error}
          </span>
        </div>
      )}
    </div>
  );
}
