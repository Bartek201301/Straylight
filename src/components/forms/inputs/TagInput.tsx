'use client';

import React, {
  useCallback,
  useRef,
  useState,
  KeyboardEvent,
  useEffect,
  useMemo,
} from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { useDebounce } from '@/hooks/useDebounce';
import FormField from './FormField';

interface TagSuggestion {
  name: string;
  count?: number;
  category?: string;
  confidence?: number;
  reason?: string;
}

interface TagInputProps {
  label?: string;
  error?: string | null;
  warning?: string | null;
  help?: string;
  isValidating?: boolean;
  touched?: boolean;
  showValidationIcon?: boolean;
  tags: string[];
  maxTags?: number;
  maxTagLength?: number;
  placeholder?: string;
  suggestions?: string[];
  allowCustomTags?: boolean;
  onTagsChange?: (tags: string[]) => void;
  onBlurCallback?: () => void;
  className?: string;
  // Enhanced features
  enableAutocomplete?: boolean;
  enableContentSuggestions?: boolean;
  contentForSuggestions?: string;
  titleForSuggestions?: string;
  showCategories?: boolean;
  categoryFilter?: string;
  showPopularTags?: boolean;
  onCategoryChange?: (category: string) => void;
}

export default function TagInput({
  label,
  error,
  warning,
  help,
  isValidating = false,
  touched = false,
  showValidationIcon = true,
  tags = [],
  maxTags = 10,
  maxTagLength = 50,
  placeholder = 'Type a tag and press Enter...',
  suggestions = [],
  allowCustomTags = true,
  onTagsChange,
  onBlurCallback,
  className = '',
  // Enhanced features
  enableAutocomplete = true,
  enableContentSuggestions = false,
  contentForSuggestions = '',
  titleForSuggestions = '',
  showCategories = false,
  categoryFilter = '',
  showPopularTags = false,
  onCategoryChange,
}: TagInputProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [apiSuggestions, setApiSuggestions] = useState<TagSuggestion[]>([]);
  const [contentSuggestions, setContentSuggestions] = useState<TagSuggestion[]>(
    []
  );
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [showContentSuggestions, setShowContentSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounced input for API calls
  const debouncedInputValue = useDebounce(inputValue, 300);

  // Fetch autocomplete suggestions from API
  useEffect(() => {
    if (
      !enableAutocomplete ||
      !debouncedInputValue ||
      debouncedInputValue.length < 2
    ) {
      setApiSuggestions([]);
      return;
    }

    setIsLoadingSuggestions(true);

    const searchParams = new URLSearchParams({
      search: debouncedInputValue,
      limit: '10',
      popular: showPopularTags ? 'true' : 'false',
      ...(categoryFilter && { category: categoryFilter }),
    });

    fetch(`/api/tags?${searchParams}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setApiSuggestions(data.data.tags);
          setCategories(data.data.categories);
        }
      })
      .catch((error) => {
        console.error('Failed to fetch tag suggestions:', error);
      })
      .finally(() => {
        setIsLoadingSuggestions(false);
      });
  }, [
    debouncedInputValue,
    enableAutocomplete,
    categoryFilter,
    showPopularTags,
  ]);

  // Fetch content-based suggestions
  useEffect(() => {
    if (
      !enableContentSuggestions ||
      (!contentForSuggestions && !titleForSuggestions)
    ) {
      return;
    }

    fetch('/api/tags/suggest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: contentForSuggestions,
        title: titleForSuggestions,
        existingTags: tags,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setContentSuggestions(data.data.suggestions);
        }
      })
      .catch((error) => {
        console.error('Failed to fetch content suggestions:', error);
      });
  }, [
    enableContentSuggestions,
    contentForSuggestions,
    titleForSuggestions,
    tags,
  ]);

  // Combine all suggestions
  const allSuggestions = useMemo(() => {
    const combined = new Map<string, TagSuggestion>();

    // Add manual suggestions
    suggestions.forEach((suggestion) => {
      if (
        suggestion.toLowerCase().includes(inputValue.toLowerCase()) &&
        !tags.includes(suggestion) &&
        inputValue.length > 0
      ) {
        combined.set(suggestion, { name: suggestion, category: 'manual' });
      }
    });

    // Add API suggestions
    apiSuggestions.forEach((suggestion) => {
      if (!tags.includes(suggestion.name)) {
        combined.set(suggestion.name, suggestion);
      }
    });

    return Array.from(combined.values()).slice(0, 8);
  }, [suggestions, apiSuggestions, inputValue, tags]);

  // Normalize tag (trim, lowercase for comparison)
  const normalizeTag = useCallback((tag: string): string => {
    return tag.trim().replace(/\s+/g, '-').toLowerCase();
  }, []);

  // Validate tag
  const validateTag = useCallback(
    (tag: string): { isValid: boolean; error?: string } => {
      const normalizedTag = normalizeTag(tag);

      if (!normalizedTag) {
        return { isValid: false, error: 'Tag cannot be empty' };
      }

      if (normalizedTag.length > maxTagLength) {
        return {
          isValid: false,
          error: `Tag cannot be longer than ${maxTagLength} characters`,
        };
      }

      if (!/^[a-z0-9_-]+$/.test(normalizedTag)) {
        return {
          isValid: false,
          error:
            'Tag can only contain letters, numbers, hyphens, and underscores',
        };
      }

      if (tags.map((t) => normalizeTag(t)).includes(normalizedTag)) {
        return { isValid: false, error: 'Tag already exists' };
      }

      if (tags.length >= maxTags) {
        return { isValid: false, error: `Maximum ${maxTags} tags allowed` };
      }

      return { isValid: true };
    },
    [tags, maxTags, maxTagLength, normalizeTag]
  );

  // Add tag
  const addTag = useCallback(
    (tag: string) => {
      const validation = validateTag(tag);

      if (validation.isValid) {
        const normalizedTag = normalizeTag(tag);
        const newTags = [...tags, normalizedTag];
        onTagsChange?.(newTags);
        setInputValue('');
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
      }
    },
    [tags, onTagsChange, validateTag, normalizeTag]
  );

  // Remove tag
  const removeTag = useCallback(
    (index: number) => {
      const newTags = tags.filter((_, i) => i !== index);
      onTagsChange?.(newTags);
    },
    [tags, onTagsChange]
  );

  // Handle input change
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setInputValue(value);
      setShowSuggestions(
        value.length > 0 && (allSuggestions.length > 0 || isLoadingSuggestions)
      );
      setSelectedSuggestionIndex(-1);
    },
    [allSuggestions.length, isLoadingSuggestions]
  );

  // Handle key down
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();

        if (
          selectedSuggestionIndex >= 0 &&
          allSuggestions[selectedSuggestionIndex]
        ) {
          addTag(allSuggestions[selectedSuggestionIndex].name);
        } else if (inputValue.trim() && allowCustomTags) {
          addTag(inputValue.trim());
        }
      } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
        removeTag(tags.length - 1);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (showSuggestions) {
          setSelectedSuggestionIndex((prev) =>
            prev < allSuggestions.length - 1 ? prev + 1 : 0
          );
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (showSuggestions) {
          setSelectedSuggestionIndex((prev) =>
            prev > 0 ? prev - 1 : allSuggestions.length - 1
          );
        }
      } else if (e.key === 'Escape') {
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
      }
    },
    [
      inputValue,
      tags,
      selectedSuggestionIndex,
      allSuggestions,
      showSuggestions,
      allowCustomTags,
      addTag,
      removeTag,
    ]
  );

  // Handle input blur
  const handleBlur = useCallback(() => {
    // Delay hiding suggestions to allow for click selection
    setTimeout(() => {
      setShowSuggestions(false);
      setShowContentSuggestions(false);
      setSelectedSuggestionIndex(-1);
      onBlurCallback?.();
    }, 150);
  }, [onBlurCallback]);

  // Handle suggestion click
  const handleSuggestionClick = useCallback(
    (suggestionName: string) => {
      addTag(suggestionName);
      inputRef.current?.focus();
    },
    [addTag]
  );

  // Handle content suggestion click
  const handleContentSuggestionClick = useCallback(
    (suggestion: TagSuggestion) => {
      addTag(suggestion.name);
      inputRef.current?.focus();
    },
    [addTag]
  );

  // Toggle content suggestions
  const toggleContentSuggestions = useCallback(() => {
    setShowContentSuggestions((prev) => !prev);
  }, []);

  // Determine validation state for styling
  const hasError = touched && error;
  const hasWarning = touched && warning && !error;

  // Container classes
  const containerClasses = `
    min-h-[42px] w-full rounded-md border transition-colors duration-200
    focus-within:ring-2 focus-within:ring-offset-0
    ${
      hasError
        ? `border-red-300 dark:border-red-600 
         focus-within:border-red-500 focus-within:ring-red-500/20
         ${isDark ? 'bg-red-950/20' : 'bg-red-50'}`
        : hasWarning
          ? `border-yellow-300 dark:border-yellow-600
           focus-within:border-yellow-500 focus-within:ring-yellow-500/20
           ${isDark ? 'bg-yellow-950/20' : 'bg-yellow-50'}`
          : `border-gray-300 dark:border-gray-600
           focus-within:border-blue-500 focus-within:ring-blue-500/20
           ${
             isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300'
           }`
    }
    ${className}
  `
    .trim()
    .replace(/\s+/g, ' ');

  // Tag classes
  const tagClasses = `
    inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium
    transition-colors duration-150
    ${
      isDark
        ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30'
        : 'bg-blue-100 text-blue-800 border border-blue-200'
    }
  `;

  const removeButtonClasses = `
    ml-1 p-0.5 rounded-full transition-colors duration-150
    hover:bg-red-500/20 focus:outline-none focus:ring-1 focus:ring-red-500
    ${isDark ? 'text-blue-300 hover:text-red-300' : 'text-blue-600 hover:text-red-600'}
  `;

  return (
    <FormField
      label={label}
      error={error}
      warning={warning}
      help={help}
      isValidating={isValidating}
      touched={touched}
      showValidationIcon={showValidationIcon}
      className="relative"
    >
      <div className="relative">
        {/* Main input container */}
        <div className={containerClasses}>
          <div className="flex flex-wrap items-center gap-1 p-2">
            {/* Existing tags */}
            {tags.map((tag, index) => (
              <span key={`${tag}-${index}`} className={tagClasses}>
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(index)}
                  className={removeButtonClasses}
                  aria-label={`Remove ${tag} tag`}
                >
                  <svg
                    className="w-3 h-3"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </span>
            ))}

            {/* Input field */}
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onBlur={handleBlur}
              onFocus={() =>
                setShowSuggestions(
                  inputValue.length > 0 &&
                    (allSuggestions.length > 0 || isLoadingSuggestions)
                )
              }
              placeholder={tags.length === 0 ? placeholder : ''}
              maxLength={maxTagLength}
              disabled={tags.length >= maxTags}
              className={`
                flex-1 min-w-[120px] border-none outline-none bg-transparent
                placeholder:text-gray-400 text-sm
                disabled:opacity-50 disabled:cursor-not-allowed
                ${isDark ? 'text-gray-100' : 'text-gray-900'}
              `}
            />
          </div>
        </div>

        {/* Suggestions dropdown */}
        {showSuggestions &&
          (allSuggestions.length > 0 || isLoadingSuggestions) && (
            <div
              className={`
            absolute z-50 w-full mt-1 max-h-60 overflow-auto rounded-md border shadow-lg
            ${
              isDark
                ? 'bg-gray-800 border-gray-600'
                : 'bg-white border-gray-200'
            }
          `}
            >
              {isLoadingSuggestions && (
                <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400 flex items-center">
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin mr-2" />
                  Loading suggestions...
                </div>
              )}

              {allSuggestions.map((suggestion, index) => (
                <button
                  key={suggestion.name}
                  type="button"
                  onClick={() => handleSuggestionClick(suggestion.name)}
                  className={`
                  w-full px-3 py-2 text-left transition-colors duration-150
                  focus:outline-none focus:ring-1 focus:ring-blue-500
                  ${
                    index === selectedSuggestionIndex
                      ? isDark
                        ? 'bg-blue-600/20 text-blue-300'
                        : 'bg-blue-100 text-blue-800'
                      : isDark
                        ? 'text-gray-200 hover:bg-gray-700'
                        : 'text-gray-700 hover:bg-gray-50'
                  }
                `}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm">{suggestion.name}</span>
                    <div className="flex items-center space-x-2">
                      {suggestion.count && (
                        <span className="text-xs text-gray-400">
                          {suggestion.count}
                        </span>
                      )}
                      {suggestion.category && (
                        <span
                          className={`
                        text-xs px-1.5 py-0.5 rounded-full
                        ${
                          isDark
                            ? 'bg-gray-700 text-gray-300'
                            : 'bg-gray-100 text-gray-600'
                        }
                      `}
                        >
                          {suggestion.category}
                        </span>
                      )}
                    </div>
                  </div>
                  {suggestion.reason && (
                    <div className="text-xs text-gray-400 mt-1">
                      {suggestion.reason}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}

        {/* Category filter */}
        {showCategories && categories.length > 0 && (
          <div className="mt-2">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                Filter by category:
              </span>
              <select
                value={categoryFilter}
                onChange={(e) => onCategoryChange?.(e.target.value)}
                className={`
                  text-xs px-2 py-1 rounded border focus:outline-none focus:ring-1 focus:ring-blue-500
                  ${
                    isDark
                      ? 'bg-gray-700 border-gray-600 text-gray-200'
                      : 'bg-white border-gray-300 text-gray-700'
                  }
                `}
              >
                <option value="">All categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category.charAt(0).toUpperCase() +
                      category.slice(1).replace('-', ' ')}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Content suggestions */}
        {enableContentSuggestions && contentSuggestions.length > 0 && (
          <div className="mt-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                Suggested tags based on content:
              </span>
              <button
                type="button"
                onClick={toggleContentSuggestions}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline focus:outline-none"
              >
                {showContentSuggestions ? 'Hide' : 'Show'} suggestions
              </button>
            </div>

            {showContentSuggestions && (
              <div className="flex flex-wrap gap-1.5">
                {contentSuggestions.slice(0, 6).map((suggestion) => (
                  <button
                    key={suggestion.name}
                    type="button"
                    onClick={() => handleContentSuggestionClick(suggestion)}
                    disabled={tags.includes(suggestion.name)}
                    className={`
                      text-xs px-2 py-1 rounded-full border transition-colors duration-150
                      focus:outline-none focus:ring-1 focus:ring-blue-500
                      ${
                        tags.includes(suggestion.name)
                          ? 'opacity-50 cursor-not-allowed'
                          : 'cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20'
                      }
                      ${
                        isDark
                          ? 'bg-gray-700 border-gray-600 text-gray-300'
                          : 'bg-gray-50 border-gray-200 text-gray-700'
                      }
                    `}
                    title={suggestion.reason}
                  >
                    <div className="flex items-center space-x-1">
                      <span>{suggestion.name}</span>
                      {suggestion.confidence && (
                        <span className="text-green-500">
                          {'●'.repeat(Math.round(suggestion.confidence * 3))}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tag count */}
        <div
          className={`text-xs mt-2 flex items-center justify-between ${
            isDark ? 'text-gray-400' : 'text-gray-500'
          }`}
        >
          <span
            className={`${
              tags.length > maxTags * 0.8
                ? 'text-yellow-600 dark:text-yellow-400'
                : ''
            } ${
              tags.length >= maxTags ? 'text-red-600 dark:text-red-400' : ''
            }`}
          >
            {tags.length}/{maxTags} tags
          </span>

          {enableContentSuggestions &&
            contentSuggestions.length > 0 &&
            !showContentSuggestions && (
              <button
                type="button"
                onClick={toggleContentSuggestions}
                className="text-blue-600 dark:text-blue-400 hover:underline focus:outline-none"
              >
                {contentSuggestions.length} AI suggestions
              </button>
            )}
        </div>
      </div>
    </FormField>
  );
}
