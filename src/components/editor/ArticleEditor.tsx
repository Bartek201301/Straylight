'use client';

import React, {
  useCallback,
  useState,
  useMemo,
  useEffect,
  useRef,
} from 'react';
// Note: These imports will work after installing the packages
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import { useAutosave } from '@/hooks/useAutosave';
import { useTheme } from '@/contexts/ThemeContext';
import ArticleSubmissionDialog, {
  ArticleMetadata,
} from '@/components/articles/ArticleSubmissionDialog';
import { ArticleStatus } from '@/components/articles/ArticleStatusBadge';
import { processMarkdown } from '@/lib/content/markdown';

interface ArticleEditorProps {
  onEditorReady?: (editor: any) => void;
  onSave?: (_markdown: string, _metadata?: Partial<ArticleMetadata>) => void;
  onSubmit?: (_markdown: string, _metadata: ArticleMetadata) => Promise<void>;
  initialContent?: string;
  initialMetadata?: Partial<ArticleMetadata>;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  articleStatus?: ArticleStatus;
  // Autosave options
  documentId?: string;
  userId?: string;
  enableAutosave?: boolean;
  autosaveDelay?: number; // in milliseconds, default 30000 (30 seconds)
  // Preview mode options (deprecated - preview disabled)
  enablePreview?: boolean;
  defaultPreviewMode?: 'split' | 'preview' | 'edit';
  // Publishing options
  enablePublishing?: boolean;
  showStatusBadge?: boolean;
  // Cover image options
  currentCoverImageUrl?: string | null;
}

// Error boundary component to catch editor crashes
class ArticleEditorErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ArticleEditor crashed:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="border border-red-300 rounded-lg p-4 bg-red-50 dark:bg-red-900/20">
          <h3 className="text-red-800 dark:text-red-200 font-semibold mb-2">
            Editor Error
          </h3>
          <p className="text-red-600 dark:text-red-300 mb-3">
            The editor encountered an error and couldn&rsquo;t load properly.
          </p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const ArticleEditorComponent = React.memo(function ArticleEditor({
  onEditorReady,
  onSave,
  onSubmit,
  initialContent = '',
  initialMetadata = {},
  placeholder = 'Start writing your article...',
  className = '',
  disabled = false,
  documentId,
  userId,
  enableAutosave = true,
  autosaveDelay = 30000,
  enablePublishing = false,
  currentCoverImageUrl = null,
}: ArticleEditorProps) {
  // Theme context for dark mode support
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  // Image upload modal removed - using Ctrl+V paste instead

  // Preview mode state (forced to edit-only)
  const _previewMode = 'edit';

  // Publishing workflow state
  const [showSubmissionDialog, setShowSubmissionDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Article statistics
  const [wordCount, setWordCount] = useState(0);
  const [readingTime, setReadingTime] = useState(0);

  // Real-time content state for preview updates
  const [currentMarkdown, setCurrentMarkdown] = useState(() => {
    // Initialize with markdown version of initial content if it's HTML
    if (initialContent && initialContent.includes('<')) {
      return initialContent; // We'll convert this in the editor update
    }
    return initialContent;
  });

  // Refs for performance optimization
  const markdownUpdateTimeoutRef = useRef<NodeJS.Timeout>();
  const latestHtmlRef = useRef<string>('');

  // Editor ref for scroll handling
  const editorRef = useRef<HTMLDivElement>(null);

  // Memoize editor extensions configuration for performance
  const editorExtensions = useMemo(
    () => [
      StarterKit.configure({
        // Configure StarterKit extensions
        heading: {
          levels: [1, 2, 3, 4, 5, 6],
        },
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
        // Enable additional formatting options with theme support
        code: {
          HTMLAttributes: {
            class: `px-1 py-0.5 rounded text-sm font-mono ${
              isDark ? 'bg-black text-white' : 'bg-gray-100 text-gray-800'
            }`,
          },
        },
        codeBlock: {
          HTMLAttributes: {
            class: `p-4 rounded overflow-x-auto font-mono ${
              isDark ? 'bg-black text-green-400' : 'bg-gray-100 text-gray-800'
            }`,
          },
        },
        blockquote: {
          HTMLAttributes: {
            class: `pl-4 italic border-l-4 ${
              isDark
                ? 'border-white/20 text-white'
                : 'border-gray-300 text-gray-700'
            }`,
          },
        },
      }),
      // Add Image extension for proper image handling
      Image.configure({
        inline: true,
        allowBase64: true,
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded',
        },
      }),
    ],
    [isDark]
  );

  // Memoize editor props configuration
  const editorProps = useMemo(
    () => ({
      attributes: {
        class: `max-w-none focus:outline-none overflow-hidden ${
          isDark ? 'prose-invert' : ''
        }`,
        'data-placeholder': placeholder,
      },
    }),
    [isDark, placeholder]
  );

  // Initialize TipTap editor with memoized configurations
  const editor = useEditor({
    extensions: editorExtensions,
    content: initialContent,
    editable: !disabled,
    immediatelyRender: false, // Fix SSR hydration issues
    editorProps,
    onUpdate: ({ editor }) => {
      // Ensure images are properly styled (lightweight operation)
      const images = editor.view.dom.querySelectorAll('img');
      images.forEach((img) => {
        if (!img.style.maxWidth) {
          img.style.maxWidth = '100%';
          img.style.height = 'auto';
        }
      });

      // Debounced markdown update for better performance
      const html = editor.getHTML();
      debouncedMarkdownUpdate(html);
    },
  });

  // Ensure consistent initial rendering: if initialContent is Markdown, convert
  // it to HTML once and set into TipTap so that the left panel always renders
  // WYSIWYG the same way before i po zapisie/odświeżeniu.
  const hasInitializedFromMarkdown = useRef(false);
  useEffect(() => {
    if (!editor) return;
    if (hasInitializedFromMarkdown.current) return;
    if (!initialContent) return;

    // Heuristic: treat as HTML only if it clearly contains tags
    const looksLikeHtml = /<\w+[^>]*>/.test(initialContent);
    if (!looksLikeHtml) {
      let cancelled = false;
      (async () => {
        try {
          const { html } = await processMarkdown(initialContent);
          if (!cancelled) {
            editor.commands.setContent(html);
            hasInitializedFromMarkdown.current = true;
          }
        } catch (_) {
          // fallback: leave as-is
          hasInitializedFromMarkdown.current = true;
        }
      })();
      return () => {
        cancelled = true;
      };
    } else {
      hasInitializedFromMarkdown.current = true;
    }
  }, [editor, initialContent]);

  // Notify parent when editor is ready and fully initialized
  useEffect(() => {
    if (editor && onEditorReady) {
      // Ensure editor has all necessary methods before passing it
      const hasIsActive = typeof editor.isActive === 'function';
      const hasCan = typeof editor.can === 'function';
      const hasChain = !!editor.chain;

      if (hasIsActive && hasCan && hasChain) {
        console.log(
          '[ArticleEditor] Editor instance ready, passing to parent:',
          {
            hasIsActive,
            hasCan,
            hasChain,
            isEditable: editor.isEditable,
          }
        );
        onEditorReady(editor);
      } else {
        console.warn(
          '[ArticleEditor] Editor not fully initialized yet, waiting...',
          { hasIsActive, hasCan, hasChain }
        );
        // Retry after a short delay if editor is not fully ready
        const timer = setTimeout(() => {
          const retryHasIsActive = typeof editor.isActive === 'function';
          const retryHasCan = typeof editor.can === 'function';
          const retryHasChain = !!editor.chain;

          if (retryHasIsActive && retryHasCan && retryHasChain) {
            console.log('[ArticleEditor] Editor ready after retry');
            onEditorReady(editor);
          }
        }, 100);
        return () => clearTimeout(timer);
      }
    }
  }, [editor, onEditorReady]);

  // Memoized and optimized HTML to Markdown conversion
  const htmlToMarkdown = useMemo(() => {
    // Pre-compile regex patterns for better performance
    const patterns = [
      [/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n'],
      [/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n'],
      [/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n'],
      [/<h4[^>]*>(.*?)<\/h4>/gi, '#### $1\n\n'],
      [/<h5[^>]*>(.*?)<\/h5>/gi, '##### $1\n\n'],
      [/<h6[^>]*>(.*?)<\/h6>/gi, '###### $1\n\n'],
      [/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**'],
      [/<b[^>]*>(.*?)<\/b>/gi, '**$1**'],
      [/<em[^>]*>(.*?)<\/em>/gi, '*$1*'],
      [/<i[^>]*>(.*?)<\/i>/gi, '*$1*'],
      [/<s[^>]*>(.*?)<\/s>/gi, '~~$1~~'],
      [/<del[^>]*>(.*?)<\/del>/gi, '~~$1~~'],
      [/<code[^>]*>(.*?)<\/code>/gi, '`$1`'],
      [/<pre[^>]*><code[^>]*>([\s\S]*?)<\/code><\/pre>/gi, '```\n$1\n```\n\n'],
      [/<hr[^>]*\/?>/gi, '\n---\n\n'],
      [/<ul[^>]*>([\s\S]*?)<\/ul>/gi, '$1\n'],
      [/<li[^>]*>(.*?)<\/li>/gi, '- $1\n'],
      [/<img\s+[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*>/gi, '![$2]($1)'],
      [/<img\s+[^>]*alt="([^"]*)"[^>]*src="([^"]*)"[^>]*>/gi, '![$1]($2)'],
      [/<img\s+[^>]*title="([^"]*)"[^>]*src="([^"]*)"[^>]*>/gi, '![$1]($2)'],
      [/<img\s+[^>]*src="([^"]*)"[^>]*title="([^"]*)"[^>]*>/gi, '![$2]($1)'],
      [/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n'],
      [/<br[^>]*\/?>/gi, '\n'],
      [/<[^>]+>/g, ''],
    ] as const;

    return (html: string): string => {
      let result = html;

      // Apply simple patterns first
      for (const [pattern, replacement] of patterns) {
        result = result.replace(pattern, replacement as string);
      }

      // Handle complex patterns that need custom logic
      result = result
        .replace(
          /<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi,
          (match, content) => {
            return (
              content
                .split('\n')
                .map((line: string) => `> ${line.trim()}`)
                .join('\n') + '\n\n'
            );
          }
        )
        .replace(/<ol[^>]*>([\s\S]*?)<\/ol>/gi, (match, content) => {
          let counter = 1;
          return (
            content.replace(
              /<li[^>]*>(.*?)<\/li>/gi,
              () => `${counter++}. $1\n`
            ) + '\n'
          );
        })
        .replace(/<img\s+[^>]*src="([^"]*)"[^>]*>/gi, (match, src) => {
          const altText = src.startsWith('data:') ? 'Uploaded Image' : 'Image';
          return `![${altText}](${src})`;
        });

      // Clean up whitespace efficiently
      return result
        .replace(/\n\s*\n\s*\n/g, '\n\n')
        .replace(/^\s+|\s+$/g, '')
        .replace(/\n{3,}/g, '\n\n');
    };
  }, []);

  // Calculate word count and reading time
  const calculateStats = useCallback((markdown: string) => {
    // Remove markdown formatting for accurate word count
    const plainText = markdown
      .replace(/#{1,6}\s+/g, '') // Remove headers
      .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove bold
      .replace(/\*([^*]+)\*/g, '$1') // Remove italic
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links, keep text
      .replace(/```[\s\S]*?```/g, '') // Remove code blocks
      .replace(/`([^`]+)`/g, '$1') // Remove inline code
      .replace(/!\[([^\]]*)\]\([^)]+\)/g, '') // Remove images
      .trim();

    const words = plainText.split(/\s+/).filter((word) => word.length > 0);
    const wordCount = words.length;
    const readingTime = Math.max(1, Math.ceil(wordCount / 200)); // 200 words per minute

    setWordCount(wordCount);
    setReadingTime(readingTime);
  }, []);

  // Debounced markdown update function with better performance
  const debouncedMarkdownUpdate = useCallback(
    (html: string) => {
      // Skip update if HTML is the same as before (performance optimization)
      if (html === latestHtmlRef.current) {
        return;
      }

      // Clear any existing timeout
      if (markdownUpdateTimeoutRef.current) {
        clearTimeout(markdownUpdateTimeoutRef.current);
      }

      // Store the latest HTML for immediate access
      latestHtmlRef.current = html;

      // Debounce the expensive conversion (300ms delay - better for performance)
      markdownUpdateTimeoutRef.current = setTimeout(() => {
        const markdown = htmlToMarkdown(html);
        setCurrentMarkdown((prev) => {
          // Only update if markdown actually changed
          if (prev !== markdown) {
            // Calculate stats only when markdown changes
            calculateStats(markdown);
            return markdown;
          }
          return prev;
        });
      }, 300);
    },
    [htmlToMarkdown, calculateStats]
  );

  // Get immediate markdown (for save actions - bypasses debounce)
  const getImmediateMarkdown = useCallback(() => {
    if (!editor) return currentMarkdown;

    // Use latest HTML from ref or get fresh from editor
    const html = latestHtmlRef.current || editor.getHTML();
    return htmlToMarkdown(html);
  }, [editor, currentMarkdown, htmlToMarkdown]);

  // Handle save action with debouncing to prevent multiple rapid saves
  const saveTimeoutRef = useRef<NodeJS.Timeout>();
  const [isSaving, setIsSaving] = useState(false);

  const _handleSave = useCallback(() => {
    if (!onSave || isSaving) return;

    // Clear any existing save timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    setIsSaving(true);

    try {
      // Get immediate markdown for saving (don't wait for debounce)
      const markdown = getImmediateMarkdown();
      onSave(markdown);

      // Update the current state if it's behind
      if (markdown !== currentMarkdown) {
        setCurrentMarkdown(markdown);
      }

      // Reset saving state after a short delay
      saveTimeoutRef.current = setTimeout(() => {
        setIsSaving(false);
      }, 1000);
    } catch (error) {
      console.error('Error saving content:', error);
      setIsSaving(false);
      // Show user-friendly error - don't crash the app
      alert('Failed to save content. Please try again.');
    }
  }, [onSave, getImmediateMarkdown, currentMarkdown, isSaving]);

  // Handle submission workflow
  const _handleSubmitForReview = useCallback(() => {
    if (!onSubmit) return;
    setShowSubmissionDialog(true);
  }, [onSubmit]);

  // Handle final submission
  const handleFinalSubmit = useCallback(
    async (metadata: ArticleMetadata) => {
      if (!onSubmit) return;

      setIsSubmitting(true);
      try {
        const markdown = getImmediateMarkdown();
        await onSubmit(markdown, metadata);
        setShowSubmissionDialog(false);
      } catch (error) {
        console.error('Error submitting article:', error);
        // Error handling will be done by parent component
      } finally {
        setIsSubmitting(false);
      }
    },
    [onSubmit, getImmediateMarkdown]
  );

  // Handle save draft from dialog
  const handleSaveDraftFromDialog = useCallback(
    async (metadata: ArticleMetadata) => {
      if (!onSave) return;

      try {
        const markdown = getImmediateMarkdown();
        onSave(markdown, metadata);
        setShowSubmissionDialog(false);
      } catch (error) {
        console.error('Error saving draft:', error);
      }
    },
    [onSave, getImmediateMarkdown]
  );

  // Note: getMarkdown removed as it was unused

  // Current content for autosave (use immediate markdown for accuracy)
  const currentContent = useMemo(() => {
    // For autosave, use the most current content
    return currentMarkdown;
  }, [currentMarkdown]); // Use currentMarkdown state instead of function

  // Helper function to generate title from content
  const generateTitleFromContent = useCallback((content: string): string => {
    // Extract first heading or first line
    const lines = content.split('\n').filter((line) => line.trim());

    for (const line of lines) {
      // Look for markdown heading
      const headingMatch = line.match(/^#+\s+(.+)$/);
      if (headingMatch) {
        return headingMatch[1].trim();
      }

      // Use first non-empty line if no heading found
      if (line.trim() && !line.startsWith('#')) {
        return line.trim().substring(0, 100);
      }
    }

    return 'Untitled Draft';
  }, []);

  // Autosave configuration (memoized to prevent re-renders)
  const autosaveOptions = useMemo(
    () => ({
      delay: autosaveDelay,
      storageKey: documentId || 'article-editor',
      documentId,
      userId,
      // Zapis w chmurze tylko gdy mamy prawdziwe UUID artykułu (po pierwszym manualnym zapisie)
      enableCloudStorage: !!(
        documentId &&
        userId &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          documentId
        )
      ),
      // Autosave zawsze idzie na endpoint draftów – nie wywołujemy onSave(handleSave),
      // żeby nie dublować tworzonych rekordów. Gdy nie mamy jeszcze UUID artykułu,
      // zapisujemy tylko do localStorage (useAutosave zrobi to sam) – endpoint pominie brak documentId.
      onSave: async (content: string) => {
        try {
          if (
            !documentId ||
            !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
              documentId
            )
          ) {
            return; // jeszcze bez ID artykułu – nie wywołuj API
          }
          const title = generateTitleFromContent(content) || 'Untitled Draft';

          const response = await fetch('/api/drafts/save', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              documentId,
              userId,
              content,
              title,
              timestamp: new Date().toISOString(),
            }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `HTTP ${response.status}`);
          }

          const result = await response.json();
          if (result.data?.id && result.data.id !== documentId) {
            console.log('Draft saved with new ID:', result.data.id);
          }
        } catch (error) {
          console.error('Autosave error:', error);
          throw error;
        }
      },
    }),
    [autosaveDelay, documentId, userId, generateTitleFromContent]
  );

  // Initialize autosave with error handling
  const [_autosaveState, _autosaveActions] = useAutosave(
    enableAutosave ? currentContent : '',
    autosaveOptions
  );

  // Initialize markdown content when editor is ready
  useEffect(() => {
    if (editor && !currentMarkdown && initialContent) {
      // Convert initial HTML content to markdown if needed
      const html = editor.getHTML();
      if (html && html !== '<p></p>') {
        const markdown = htmlToMarkdown(html);
        setCurrentMarkdown(markdown);
        calculateStats(markdown);
      }
    }
  }, [editor, currentMarkdown, initialContent, htmlToMarkdown, calculateStats]);

  // Calculate initial stats from initial content
  useEffect(() => {
    if (initialContent) {
      calculateStats(initialContent);
    }
  }, [initialContent, calculateStats]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (markdownUpdateTimeoutRef.current) {
        clearTimeout(markdownUpdateTimeoutRef.current);
      }
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Image upload handler removed - using Ctrl+V paste instead

  // Preview mode change handler (disabled)
  const _handlePreviewModeChange = useCallback(
    (_mode: 'split' | 'preview' | 'edit') => {
      // Preview mode is disabled - always stay in edit mode
    },
    []
  );

  // Image insertion removed - using Ctrl+V paste instead

  // Check if editor has content
  const hasContent = editor && !editor.isEmpty;

  // Memoize className computations for performance
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const containerClasses = useMemo(() => `max-w-full w-full`, [isDark]);

  const contentAreaClasses = useMemo(
    () => 'flex max-w-full overflow-hidden',
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isDark]
  );

  const editorPanelClasses = useMemo(
    () =>
      `w-full max-w-full min-h-[500px] overflow-y-auto overflow-x-hidden bg-transparent`,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isDark]
  );

  // Memoize scroll handlers for performance
  const editorScrollHandler = useCallback(
    (_e: React.UIEvent<HTMLDivElement>) => {
      // Scroll handling can be added here if needed
    },
    []
  );

  // Memoize additional UI classes
  const _saveStatusClasses = useMemo(
    () =>
      `border-t p-4 sm:p-6 transition-all duration-300 backdrop-premium ${
        isDark ? 'border-white/10 bg-black/30' : 'border-black/10 bg-white/50'
      }`,
    [isDark]
  );

  const _saveButtonClasses = useMemo(
    () =>
      `btn-premium btn-premium-primary 
     flex items-center gap-2 ${
       !hasContent || disabled || isSaving
         ? 'opacity-50 cursor-not-allowed'
         : 'hover-lift'
     }`,
    [hasContent, disabled, isSaving]
  );

  return (
    <div className={`relative max-w-full overflow-hidden ${className}`}>
      {/* Main Container */}
      <div
        className={containerClasses}
        role="application"
        aria-label="Rich text editor"
      >
        {/* Content Area - Editor Only */}
        <div className={contentAreaClasses}>
          {/* Editor Panel */}
          <div
            ref={editorRef}
            className={editorPanelClasses}
            onScroll={editorScrollHandler}
            role="textbox"
            aria-label="Article editor"
            aria-multiline="true"
          >
            <style jsx>{`
              .ProseMirror {
                word-wrap: break-word;
                overflow-wrap: break-word;
                white-space: pre-wrap;
                max-width: 100% !important;
                width: 100% !important;
                overflow-x: hidden;
                font-size: 16px;
                min-width: 0;
                flex: 1;
                line-height: 1.75;
                color: #c2c2cd;
              }

              .ProseMirror > * {
                max-width: 100% !important;
              }
              @media (max-width: 640px) {
                .glass-enhanced {
                  max-width: 100vw !important;
                  width: 100% !important;
                  box-sizing: border-box !important;
                }
              }
              @media (max-width: 640px) {
                .ProseMirror {
                  max-width: 100%;
                  width: 100%;
                  margin: 0;
                  padding: 12px;
                  box-sizing: border-box;
                  overflow-wrap: anywhere;
                  word-break: break-word;
                  overflow-x: hidden;
                  font-size: 15px;
                }
              }
              @media (max-width: 430px) {
                .ProseMirror {
                  max-width: 100%;
                  width: 100%;
                  padding: 8px;
                  overflow-x: hidden;
                  font-size: 14px;
                }
              }
              @media (max-width: 320px) {
                .ProseMirror {
                  max-width: 100% !important;
                  width: 100% !important;
                  padding: 6px !important;
                  font-size: 13px !important;
                  overflow-x: hidden !important;
                  margin: 0 !important;
                  box-sizing: border-box !important;
                }
              }
              .ProseMirror * {
                max-width: 100%;
                word-wrap: break-word;
                overflow-wrap: break-word;
                hyphens: auto;
                box-sizing: border-box;
              }
              .ProseMirror h1,
              .ProseMirror h2,
              .ProseMirror h3,
              .ProseMirror h4,
              .ProseMirror h5,
              .ProseMirror h6 {
                margin-top: 2rem;
                margin-bottom: 1rem;
                font-weight: 600;
                color: #ffffff;
                word-wrap: break-word;
                overflow-wrap: break-word;
                hyphens: auto;
                line-break: anywhere;
                max-width: 100% !important;
                width: 100%;
              }

              .ProseMirror h1 {
                font-size: 2.25rem;
                margin-top: 0;
              }

              .ProseMirror h2 {
                font-size: 1.875rem;
                border-bottom: 1px solid #4a4a57;
                padding-bottom: 0.5rem;
              }

              .ProseMirror h3 {
                font-size: 1.5rem;
              }

              .ProseMirror h4 {
                font-size: 1.25rem;
              }

              .ProseMirror h5 {
                font-size: 1.125rem;
              }

              .ProseMirror h6 {
                font-size: 1rem;
              }
              @media (max-width: 640px) {
                .ProseMirror h1,
                .ProseMirror h2,
                .ProseMirror h3,
                .ProseMirror h4,
                .ProseMirror h5,
                .ProseMirror h6 {
                  max-width: 100% !important;
                  width: 100% !important;
                  overflow-wrap: anywhere !important;
                  word-break: break-word !important;
                  hyphens: auto !important;
                  overflow-x: hidden !important;
                }
                .ProseMirror p,
                .ProseMirror div,
                .ProseMirror span {
                  max-width: 100% !important;
                  width: 100% !important;
                  overflow-wrap: anywhere !important;
                  word-break: break-word !important;
                  overflow-x: hidden !important;
                }
              }
              @media (max-width: 474px) {
                .ProseMirror h1 {
                  font-size: 1.75rem !important;
                  line-height: 1.2 !important;
                  margin-top: 1.5rem !important;
                  margin-bottom: 0.75rem !important;
                }
                .ProseMirror h2 {
                  font-size: 1.5rem !important;
                  line-height: 1.2 !important;
                  margin-top: 1.5rem !important;
                  margin-bottom: 0.75rem !important;
                }
                .ProseMirror h3 {
                  font-size: 1.25rem !important;
                  line-height: 1.2 !important;
                  margin-top: 1.5rem !important;
                  margin-bottom: 0.75rem !important;
                }
                .ProseMirror p {
                  margin-bottom: 1rem !important;
                  line-height: 1.6 !important;
                }
                .ProseMirror img {
                  margin: 1.5rem 0 !important;
                }
              }
              @media (max-width: 320px) {
                .ProseMirror h1 {
                  font-size: 1.5rem !important;
                  line-height: 1.2 !important;
                  margin-top: 1rem !important;
                  margin-bottom: 0.5rem !important;
                  max-width: 100% !important;
                  width: 100% !important;
                }
                .ProseMirror h2 {
                  font-size: 1.25rem !important;
                  line-height: 1.2 !important;
                  margin-top: 1rem !important;
                  margin-bottom: 0.5rem !important;
                  max-width: 100% !important;
                  width: 100% !important;
                }
                .ProseMirror h3 {
                  font-size: 1.1rem !important;
                  line-height: 1.2 !important;
                  margin-top: 1rem !important;
                  margin-bottom: 0.5rem !important;
                  max-width: 100% !important;
                  width: 100% !important;
                }
                .ProseMirror p {
                  margin-bottom: 0.75rem !important;
                  line-height: 1.5 !important;
                  max-width: 100% !important;
                  width: 100% !important;
                }
                .ProseMirror img {
                  margin: 1rem 0 !important;
                }
                .ProseMirror * {
                  max-width: 100% !important;
                  width: auto !important;
                  overflow-wrap: anywhere !important;
                  word-break: break-word !important;
                  hyphens: auto !important;
                }
              }
              .ProseMirror p {
                margin-bottom: 1.5rem;
                color: #c2c2cd;
                max-width: 100% !important;
                width: 100%;
                word-wrap: break-word;
                overflow-wrap: break-word;
                word-break: break-word;
              }

              .ProseMirror ul,
              .ProseMirror ol {
                margin-bottom: 1.5rem;
                padding-left: 2rem;
                max-width: 100% !important;
                width: 100%;
              }

              .ProseMirror li {
                margin-bottom: 0.5rem;
                color: #c2c2cd;
                max-width: 100% !important;
              }

              .ProseMirror blockquote {
                border-left: 4px solid #3190ee;
                padding-left: 1.5rem;
                margin: 2rem 0;
                font-style: italic;
                color: #a1a1aa;
                background-color: #18181c;
                padding: 1rem 1.5rem;
                border-radius: 0.375rem;
                max-width: 100% !important;
                width: 100%;
              }

              .ProseMirror img {
                max-width: 100% !important;
                height: auto !important;
                border-radius: 0.5rem;
                margin: 2rem 0;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                display: block;
              }

              .ProseMirror pre {
                margin: 2rem 0;
                background-color: #18181c !important;
                border: 1px solid #4a4a57;
                border-radius: 0.5rem;
                overflow-x: auto;
                max-width: 100% !important;
                width: 100%;
              }

              .ProseMirror code {
                background-color: #18181c;
                border: 1px solid #4a4a57;
                padding: 0.125rem 0.375rem;
                border-radius: 0.25rem;
                font-size: 0.875em;
              }

              .ProseMirror table {
                width: 100% !important;
                max-width: 100% !important;
                margin: 2rem 0;
                border-collapse: collapse;
                border: 1px solid #4a4a57;
                border-radius: 0.5rem;
                overflow: hidden;
              }

              .ProseMirror th,
              .ProseMirror td {
                padding: 0.75rem 1rem;
                text-align: left;
                border-bottom: 1px solid #4a4a57;
              }

              .ProseMirror th {
                background-color: #232329;
                font-weight: 600;
                color: #ffffff;
              }

              .ProseMirror td {
                color: #c2c2cd;
              }

              .ProseMirror a {
                color: #3190ee;
                text-decoration: underline;
                text-decoration-color: rgba(49, 144, 238, 0.5);
                text-underline-offset: 2px;
                transition: all 0.2s ease;
              }

              .ProseMirror a:hover {
                color: #5aa7f2;
                text-decoration-color: #5aa7f2;
              }

              .ProseMirror hr {
                border: none;
                border-top: 1px solid #4a4a57;
                margin: 3rem 0;
              }

              /* Force full width for all TipTap wrappers */
              :global(.ProseMirror-wrapper),
              :global(.tiptap),
              :global(.editor-content),
              :global([data-editor]),
              div[class*='ProseMirror'] {
                max-width: 100% !important;
                width: 100% !important;
              }
            `}</style>
            <div
              className="overflow-hidden"
              style={{ maxWidth: '100%', width: '100%' }}
            >
              <EditorContent
                editor={editor}
                style={{ maxWidth: '100%', width: '100%' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Image Upload Modal removed - using Ctrl+V paste instead */}

      {/* Article Submission Dialog */}
      {enablePublishing && (
        <ArticleSubmissionDialog
          isOpen={showSubmissionDialog}
          onClose={() => setShowSubmissionDialog(false)}
          onSubmit={handleFinalSubmit}
          onSaveDraft={handleSaveDraftFromDialog}
          initialMetadata={initialMetadata}
          wordCount={wordCount}
          readingTime={readingTime}
          isSubmitting={isSubmitting}
          userId={userId}
          documentId={documentId}
          currentCoverImageUrl={currentCoverImageUrl}
        />
      )}
    </div>
  );
});

// Main ArticleEditor component with error boundary
const ArticleEditor = React.memo(function ArticleEditor(
  props: ArticleEditorProps
) {
  return (
    <ArticleEditorErrorBoundary>
      <ArticleEditorComponent {...props} />
    </ArticleEditorErrorBoundary>
  );
});

// Export utility functions for external use
export const useArticleEditor = () => {
  return {
    // Helper to validate markdown content
    validateMarkdown: (content: string) => {
      if (!content.trim()) return { valid: false, error: 'Content is empty' };
      return { valid: true, error: null };
    },

    // Helper to estimate reading time
    estimateReadingTime: (content: string) => {
      const wordsPerMinute = 200;
      const words = content.trim().split(/\s+/).length;
      return Math.ceil(words / wordsPerMinute);
    },
  };
};

export default ArticleEditor;
