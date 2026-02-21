'use client';

import React, { useId } from 'react';
import { useTheme } from '@/contexts/ThemeContext';

interface FormFieldProps {
  label?: string;
  error?: string | null;
  warning?: string | null;
  help?: string;
  required?: boolean;
  isValidating?: boolean;
  touched?: boolean;
  children: React.ReactElement;
  className?: string;
  showValidationIcon?: boolean;
}

export default function FormField({
  label,
  error,
  warning,
  help,
  required = false,
  isValidating = false,
  touched = false,
  children,
  className = '',
  showValidationIcon = true,
}: FormFieldProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const fieldId = useId();
  const errorId = useId();
  const warningId = useId();
  const helpId = useId();

  // Clone children to add necessary props
  const childElement = React.cloneElement(children, {
    id: fieldId,
    'aria-describedby':
      [help ? helpId : null, warning ? warningId : null, error ? errorId : null]
        .filter(Boolean)
        .join(' ') || undefined,
    'aria-invalid': error ? 'true' : 'false',
    'aria-required': required,
  });

  // Determine validation state for styling
  const hasError = touched && error;
  const hasWarning = touched && warning && !error;
  const isValid = touched && !error && !warning && !isValidating;

  // Base classes for the container
  const containerClasses = `space-y-2 ${className}`;

  // Classes for the label
  const labelClasses = `block text-sm font-medium transition-colors duration-200 ${
    hasError
      ? 'text-red-600 dark:text-red-400'
      : hasWarning
        ? 'text-yellow-600 dark:text-yellow-400'
        : isDark
          ? 'text-gray-200'
          : 'text-gray-700'
  }`;

  // Classes for validation messages
  const messageClasses = 'text-sm flex items-center gap-2 mt-1';
  const errorClasses = `${messageClasses} text-red-600 dark:text-red-400`;
  const warningClasses = `${messageClasses} text-yellow-600 dark:text-yellow-400`;
  const helpClasses = `${messageClasses} ${
    isDark ? 'text-gray-400' : 'text-gray-600'
  }`;

  // Validation icons
  const getValidationIcon = () => {
    if (!showValidationIcon) return null;

    if (isValidating) {
      return (
        <div className="animate-spin h-4 w-4">
          <svg
            className="w-4 h-4 text-blue-500"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </div>
      );
    }

    if (hasError) {
      return (
        <svg
          className="w-4 h-4 text-red-500"
          fill="currentColor"
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
            clipRule="evenodd"
          />
        </svg>
      );
    }

    if (hasWarning) {
      return (
        <svg
          className="w-4 h-4 text-yellow-500"
          fill="currentColor"
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
            clipRule="evenodd"
          />
        </svg>
      );
    }

    if (isValid) {
      return (
        <svg
          className="w-4 h-4 text-green-500"
          fill="currentColor"
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clipRule="evenodd"
          />
        </svg>
      );
    }

    return null;
  };

  return (
    <div className={containerClasses}>
      {/* Label */}
      {label && (
        <label htmlFor={fieldId} className={labelClasses}>
          {label}
          {required && (
            <span className="text-red-500 ml-1" aria-label="required">
              *
            </span>
          )}
        </label>
      )}

      {/* Input wrapper with validation styling */}
      <div className="relative">
        {childElement}

        {/* Validation icon */}
        {showValidationIcon && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            {getValidationIcon()}
          </div>
        )}
      </div>

      {/* Validation messages */}
      {hasError && (
        <div id={errorId} className={errorClasses} role="alert">
          <svg
            className="w-4 h-4 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {hasWarning && (
        <div id={warningId} className={warningClasses}>
          <svg
            className="w-4 h-4 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          <span>{warning}</span>
        </div>
      )}

      {/* Help text */}
      {help && !hasError && !hasWarning && (
        <div id={helpId} className={helpClasses}>
          <svg
            className="w-4 h-4 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
              clipRule="evenodd"
            />
          </svg>
          <span>{help}</span>
        </div>
      )}
    </div>
  );
}
