'use client';

import React from 'react';

export type ArticleStatus =
  | 'draft'
  | 'pending'
  | 'published'
  | 'archived'
  | 'rejected';

interface ArticleStatusBadgeProps {
  status: ArticleStatus;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const statusConfig = {
  draft: {
    label: 'Draft',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-800',
    borderColor: 'border-gray-300',
    description: 'Work in progress',
  },
  pending: {
    label: 'Under Review',
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-800',
    borderColor: 'border-yellow-300',
    description: 'Awaiting moderation',
  },
  published: {
    label: 'Published',
    bgColor: 'bg-green-100',
    textColor: 'text-green-800',
    borderColor: 'border-green-300',
    description: 'Live on the platform',
  },
  archived: {
    label: 'Archived',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-800',
    borderColor: 'border-blue-300',
    description: 'No longer active',
  },
  rejected: {
    label: 'Rejected',
    bgColor: 'bg-red-100',
    textColor: 'text-red-800',
    borderColor: 'border-red-300',
    description: 'Needs revision',
  },
};

const sizeConfig = {
  sm: {
    padding: 'px-2 py-1',
    textSize: 'text-xs',
  },
  md: {
    padding: 'px-3 py-1.5',
    textSize: 'text-sm',
  },
  lg: {
    padding: 'px-4 py-2',
    textSize: 'text-base',
  },
};

function ArticleStatusBadge({
  status,
  className = '',
  size = 'md',
}: ArticleStatusBadgeProps) {
  const config = statusConfig[status];
  const sizeStyles = sizeConfig[size];

  if (!config) {
    console.warn(`Unknown article status: ${status}`);
    return null;
  }

  return (
    <span
      className={`
        inline-flex items-center font-medium rounded-full border
        ${config.bgColor} ${config.textColor} ${config.borderColor}
        ${sizeStyles.padding} ${sizeStyles.textSize}
        ${className}
      `}
      title={config.description}
    >
      {config.label}
    </span>
  );
}

// Status progression component for showing workflow steps
interface StatusProgressionProps {
  currentStatus: ArticleStatus;
  className?: string;
}

function _ArticleStatusProgression({
  currentStatus,
  className = '',
}: StatusProgressionProps) {
  const steps: { status: ArticleStatus; label: string }[] = [
    { status: 'draft', label: 'Draft' },
    { status: 'pending', label: 'Review' },
    { status: 'published', label: 'Published' },
  ];

  const getCurrentStepIndex = () => {
    if (currentStatus === 'rejected') return 1; // Show as stuck at review step
    if (currentStatus === 'archived') return 2; // Show as completed but archived
    return steps.findIndex((step) => step.status === currentStatus);
  };

  const currentStepIndex = getCurrentStepIndex();

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {steps.map((step, index) => {
        const isActive = index === currentStepIndex;
        const isCompleted = index < currentStepIndex;
        const isRejected = currentStatus === 'rejected' && index === 1;

        return (
          <React.Fragment key={step.status}>
            <div className="flex flex-col items-center">
              <div
                className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium
                  ${
                    isCompleted
                      ? 'bg-green-500 text-white'
                      : isActive
                        ? isRejected
                          ? 'bg-red-500 text-white'
                          : 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-500'
                  }
                `}
              >
                {isCompleted ? '✓' : index + 1}
              </div>
              <span
                className={`
                mt-1 text-xs
                ${
                  isActive
                    ? isRejected
                      ? 'text-red-600 font-medium'
                      : 'text-blue-600 font-medium'
                    : isCompleted
                      ? 'text-green-600 font-medium'
                      : 'text-gray-400'
                }
              `}
              >
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`
                  flex-1 h-0.5 mx-2
                  ${index < currentStepIndex ? 'bg-green-500' : 'bg-gray-200'}
                `}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// Helper function to get status color for use in other components
function _getStatusColor(status: ArticleStatus): string {
  return statusConfig[status]?.textColor || 'text-gray-500';
}

// Helper function to get next possible statuses for workflow
function _getNextPossibleStatuses(
  currentStatus: ArticleStatus
): ArticleStatus[] {
  switch (currentStatus) {
    case 'draft':
      return ['pending'];
    case 'pending':
      return ['published', 'rejected', 'archived'];
    case 'published':
      return ['archived'];
    case 'rejected':
      return ['pending', 'draft'];
    case 'archived':
      return ['published'];
    default:
      return [];
  }
}

export { ArticleStatusBadge };
