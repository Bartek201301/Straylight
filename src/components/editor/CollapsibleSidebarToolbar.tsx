'use client';

import React, { useCallback, useRef, useState, useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { Editor } from '@tiptap/react';

interface CollapsibleSidebarToolbarProps {
  editor: Editor | null;
  className?: string;
  userId?: string;
  documentId?: string;
}

interface ToolbarButtonProps {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  title?: string;
  shortcut?: string;
  icon: React.ReactNode;
  label: string;
  isExpanded: boolean;
}

function ToolbarButton({
  onClick,
  isActive = false,
  disabled = false,
  title,
  shortcut,
  icon,
  label,
  isExpanded,
}: ToolbarButtonProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title ? `${title}${shortcut ? ` (${shortcut})` : ''}` : undefined}
      className={`
        relative h-10 rounded-lg transition-all duration-200 text-sm font-medium
        flex items-center gap-2
        ${isExpanded ? 'w-full px-3 py-2 justify-start' : 'w-10 justify-center'}
        ${
          isActive
            ? 'bg-white text-black shadow-md ring-2 ring-white/20'
            : isDark
              ? 'text-neutral-300 hover:bg-white/10 hover:text-white border border-white/10'
              : 'text-neutral-700 hover:bg-neutral-200/50 hover:text-neutral-900 border border-neutral-200/20'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        focus:outline-none focus:ring-2 focus:ring-offset-2 ${isDark ? 'focus:ring-white/50' : 'focus:ring-neutral-600/50'}
      `}
    >
      <span className="flex-shrink-0">{icon}</span>
      {isExpanded && (
        <span className="whitespace-nowrap overflow-hidden">{label}</span>
      )}
      {isExpanded && shortcut && (
        <span
          className={`ml-auto text-xs flex-shrink-0 ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}
        >
          {shortcut}
        </span>
      )}
    </button>
  );
}

function ToolbarDivider() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  return (
    <div
      className={`w-full h-px my-3 ${isDark ? 'bg-neutral-600/30' : 'bg-neutral-400/30'}`}
    />
  );
}

export default function CollapsibleSidebarToolbar({
  editor,
  className = '',
  userId,
  documentId,
}: CollapsibleSidebarToolbarProps) {
  const { resolvedTheme } = useTheme();
  const _isDark = resolvedTheme === 'dark';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  // Force re-render when editor state changes
  const [, forceUpdate] = useState({});
  const forceRerender = useCallback(() => forceUpdate({}), []);

  // Listen to editor updates to refresh active states
  useEffect(() => {
    if (!editor) return;

    const updateHandler = () => forceRerender();

    editor.on('update', updateHandler);
    editor.on('selectionUpdate', updateHandler);
    editor.on('transaction', updateHandler);

    return () => {
      if (editor) {
        editor.off('update', updateHandler);
        editor.off('selectionUpdate', updateHandler);
        editor.off('transaction', updateHandler);
      }
    };
  }, [editor, forceRerender]);

  // Memoized editor commands
  const toggleBold = useCallback(
    () => editor?.chain().focus().toggleBold().run(),
    [editor]
  );
  const toggleItalic = useCallback(
    () => editor?.chain().focus().toggleItalic().run(),
    [editor]
  );
  const toggleStrike = useCallback(
    () => editor?.chain().focus().toggleStrike().run(),
    [editor]
  );
  const toggleCode = useCallback(
    () => editor?.chain().focus().toggleCode().run(),
    [editor]
  );
  const undo = useCallback(
    () => editor?.chain().focus().undo().run(),
    [editor]
  );
  const redo = useCallback(
    () => editor?.chain().focus().redo().run(),
    [editor]
  );
  const setHeading = useCallback(
    (level: 1 | 2 | 3) => {
      editor?.chain().focus().toggleHeading({ level }).run();
    },
    [editor]
  );
  const setParagraph = useCallback(
    () => editor?.chain().focus().setParagraph().run(),
    [editor]
  );
  const toggleBulletList = useCallback(
    () => editor?.chain().focus().toggleBulletList().run(),
    [editor]
  );
  const toggleOrderedList = useCallback(
    () => editor?.chain().focus().toggleOrderedList().run(),
    [editor]
  );
  const toggleBlockquote = useCallback(
    () => editor?.chain().focus().toggleBlockquote().run(),
    [editor]
  );
  const toggleCodeBlock = useCallback(
    () => editor?.chain().focus().toggleCodeBlock().run(),
    [editor]
  );
  const setLink = useCallback(() => {
    if (!editor) return;
    const url = window.prompt('Enter URL:');
    if (url) {
      const text = window.prompt('Enter link text:', url);
      if (text) {
        editor.chain().focus().insertContent(`[${text}](${url})`).run();
      }
    }
  }, [editor]);
  const setHorizontalRule = useCallback(
    () => editor?.chain().focus().setHorizontalRule().run(),
    [editor]
  );
  const clearFormatting = useCallback(
    () => editor?.chain().focus().clearNodes().unsetAllMarks().run(),
    [editor]
  );

  // File upload handler
  const handleFileSelect = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || []);
      if (files.length === 0) return;

      for (const file of files) {
        if (file.type.startsWith('image/')) {
          try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('userId', userId || '');
            if (documentId) {
              formData.append('documentId', documentId);
            }

            const response = await fetch('/api/images/upload', {
              method: 'POST',
              body: formData,
            });

            if (!response.ok) {
              throw new Error('Upload failed');
            }

            const result = await response.json();
            const imageUrl = result.data.url;
            const altText = file.name.replace(/\.[^/.]+$/, '');

            if (editor) {
              editor
                .chain()
                .focus()
                .setImage({ src: imageUrl, alt: altText })
                .run();
            }
          } catch (error) {
            console.error('Error uploading image:', error);
          }
        }
      }

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [editor, userId, documentId]
  );

  const openFileDialog = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // Helper functions
  const isActive = useCallback(
    (name: string, attributes?: Record<string, any>) => {
      if (!editor || !editor.isActive) return false;
      return editor.isActive(name, attributes);
    },
    [editor]
  );

  const canExecute = useCallback(
    (command: 'undo' | 'redo') => {
      if (!editor || typeof editor.can !== 'function') return false;
      try {
        return command === 'undo' ? editor.can().undo() : editor.can().redo();
      } catch (error) {
        return false;
      }
    },
    [editor]
  );

  if (
    !editor ||
    typeof editor.isActive !== 'function' ||
    typeof editor.can !== 'function'
  ) {
    return (
      <div
        className={`transition-all duration-300 ${isExpanded ? 'w-48' : 'w-12'} ${className}`}
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => setIsExpanded(false)}
      >
        <div className="text-xs text-neutral-500 p-2 text-center">
          {isExpanded ? 'Loading...' : '...'}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`transition-all duration-300 ${isExpanded ? 'w-48' : 'w-12'} ${className}`}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      <div
        className={`max-h-[calc(50vh-5rem)] overflow-y-auto overflow-x-hidden ${isExpanded ? 'px-3 py-2' : 'px-1 py-2'} space-y-2 custom-scrollbar`}
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: 'transparent transparent',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.scrollbarColor =
            'rgba(255, 255, 255, 0.3) transparent';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.scrollbarColor = 'transparent transparent';
        }}
      >
        {/* Undo/Redo */}
        <div
          className={`grid gap-2 ${isExpanded ? 'grid-cols-2' : 'grid-cols-1'}`}
        >
          <ToolbarButton
            onClick={undo}
            disabled={!canExecute('undo')}
            title="Undo"
            shortcut="⌘Z"
            icon="↶"
            label="Undo"
            isExpanded={isExpanded}
          />
          <ToolbarButton
            onClick={redo}
            disabled={!canExecute('redo')}
            title="Redo"
            shortcut="⌘Y"
            icon="↷"
            label="Redo"
            isExpanded={isExpanded}
          />
        </div>

        <ToolbarDivider />

        {/* Text Formatting */}
        <div className="space-y-1">
          <ToolbarButton
            onClick={toggleBold}
            isActive={isActive('bold')}
            title="Bold"
            shortcut="⌘B"
            icon={<strong>B</strong>}
            label="Bold"
            isExpanded={isExpanded}
          />
          <ToolbarButton
            onClick={toggleItalic}
            isActive={isActive('italic')}
            title="Italic"
            shortcut="⌘I"
            icon={<em>I</em>}
            label="Italic"
            isExpanded={isExpanded}
          />
          <ToolbarButton
            onClick={toggleStrike}
            isActive={isActive('strike')}
            title="Strikethrough"
            shortcut="⌘⇧S"
            icon={<span className="line-through">S</span>}
            label="Strike"
            isExpanded={isExpanded}
          />
          <ToolbarButton
            onClick={toggleCode}
            isActive={isActive('code')}
            title="Inline Code"
            shortcut="⌘E"
            icon={<code>&lt;/&gt;</code>}
            label="Code"
            isExpanded={isExpanded}
          />
        </div>

        <ToolbarDivider />

        {/* Headings */}
        <div className="space-y-1">
          <ToolbarButton
            onClick={setParagraph}
            isActive={isActive('paragraph')}
            title="Paragraph"
            shortcut="⌘⌥0"
            icon="P"
            label="Paragraph"
            isExpanded={isExpanded}
          />
          <ToolbarButton
            onClick={() => setHeading(1)}
            isActive={isActive('heading', { level: 1 })}
            title="Heading 1"
            shortcut="⌘⌥1"
            icon="H1"
            label="Heading 1"
            isExpanded={isExpanded}
          />
          <ToolbarButton
            onClick={() => setHeading(2)}
            isActive={isActive('heading', { level: 2 })}
            title="Heading 2"
            shortcut="⌘⌥2"
            icon="H2"
            label="Heading 2"
            isExpanded={isExpanded}
          />
          <ToolbarButton
            onClick={() => setHeading(3)}
            isActive={isActive('heading', { level: 3 })}
            title="Heading 3"
            shortcut="⌘⌥3"
            icon="H3"
            label="Heading 3"
            isExpanded={isExpanded}
          />
        </div>

        <ToolbarDivider />

        {/* Lists */}
        <div className="space-y-1">
          <ToolbarButton
            onClick={toggleBulletList}
            isActive={isActive('bulletList')}
            title="Bullet List"
            shortcut="⌘⇧8"
            icon="•"
            label="Bullet List"
            isExpanded={isExpanded}
          />
          <ToolbarButton
            onClick={toggleOrderedList}
            isActive={isActive('orderedList')}
            title="Numbered List"
            shortcut="⌘⇧7"
            icon="1."
            label="Numbered List"
            isExpanded={isExpanded}
          />
        </div>

        <ToolbarDivider />

        {/* Blocks */}
        <div className="space-y-1">
          <ToolbarButton
            onClick={toggleBlockquote}
            isActive={isActive('blockquote')}
            title="Blockquote"
            shortcut="⌘⇧B"
            icon='"'
            label="Quote"
            isExpanded={isExpanded}
          />
          <ToolbarButton
            onClick={toggleCodeBlock}
            isActive={isActive('codeBlock')}
            title="Code Block"
            shortcut="⌘⌥C"
            icon="{ }"
            label="Code Block"
            isExpanded={isExpanded}
          />
        </div>

        <ToolbarDivider />

        {/* Links & Media */}
        <div className="space-y-1">
          <ToolbarButton
            onClick={openFileDialog}
            disabled={!userId}
            title="Insert Image"
            shortcut="⌘⇧I"
            icon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <rect
                  x="3"
                  y="3"
                  width="18"
                  height="18"
                  rx="2"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" />
                <path
                  d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"
                  stroke="currentColor"
                  strokeWidth="2"
                />
              </svg>
            }
            label="Add Image"
            isExpanded={isExpanded}
          />
          <ToolbarButton
            onClick={setLink}
            title="Add Link"
            shortcut="⌘K"
            icon="🔗"
            label="Link"
            isExpanded={isExpanded}
          />
        </div>

        <ToolbarDivider />

        {/* Utilities */}
        <div className="space-y-1">
          <ToolbarButton
            onClick={setHorizontalRule}
            title="Horizontal Rule"
            icon="―"
            label="Divider"
            isExpanded={isExpanded}
          />
          <ToolbarButton
            onClick={clearFormatting}
            title="Clear Formatting"
            shortcut="⌘\\"
            icon="🧹"
            label="Clear"
            isExpanded={isExpanded}
          />
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}
