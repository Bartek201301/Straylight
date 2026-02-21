'use client';

import React, { useState, useCallback } from 'react';
import { Editor } from '@tiptap/react';
import { useTheme } from '@/contexts/ThemeContext';

interface EditorToolbarProps {
  editor: Editor | null;
  className?: string;
  onImageUpload?: () => void;
  // Preview mode controls
  enablePreview?: boolean;
  previewMode?: 'split' | 'preview' | 'edit';
  onPreviewModeChange?: (mode: 'split' | 'preview' | 'edit') => void;
}

interface ToolbarButtonProps {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  title?: string;
  shortcut?: string;
  children: React.ReactNode;
}

function ToolbarButton({
  onClick,
  isActive = false,
  disabled = false,
  title,
  shortcut,
  children,
}: ToolbarButtonProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title ? `${title}${shortcut ? ` (${shortcut})` : ''}` : undefined}
      className={`
        relative min-h-[40px] px-3 py-2 rounded-xl transition-all duration-300 text-sm font-medium
        flex items-center justify-center min-w-[40px] micro-interaction
        ${
          isActive
            ? isDark
              ? 'bg-white text-black shadow-premium-lg transform scale-105'
              : 'bg-black text-white shadow-premium-lg transform scale-105'
            : isDark
              ? 'bg-white/10 text-white hover:bg-white/20 active:bg-white/15 backdrop-blur-sm'
              : 'bg-black/10 text-black hover:bg-black/20 active:bg-black/15 backdrop-blur-sm'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-premium hover:transform hover:scale-105'}
        focus:outline-none focus:ring-2 focus:ring-offset-2 ${isDark ? 'focus:ring-neutral-300/50' : 'focus:ring-neutral-600/50'}
      `}
    >
      {children}
      {shortcut && (
        <span className="sr-only">Keyboard shortcut: {shortcut}</span>
      )}
    </button>
  );
}

export default function EditorToolbar({
  editor,
  className = '',
  onImageUpload,
  enablePreview = true,
  previewMode = 'split',
  onPreviewModeChange,
}: EditorToolbarProps) {
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);

  // Memoized text formatting commands (defined before early return)
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

  // Memoized heading commands
  const setHeading = useCallback(
    (level: 1 | 2 | 3 | 4 | 5 | 6) => {
      editor?.chain().focus().toggleHeading({ level }).run();
    },
    [editor]
  );
  const setParagraph = useCallback(
    () => editor?.chain().focus().setParagraph().run(),
    [editor]
  );

  // Memoized list commands
  const toggleBulletList = useCallback(
    () => editor?.chain().focus().toggleBulletList().run(),
    [editor]
  );
  const toggleOrderedList = useCallback(
    () => editor?.chain().focus().toggleOrderedList().run(),
    [editor]
  );

  // Memoized block formatting
  const toggleBlockquote = useCallback(
    () => editor?.chain().focus().toggleBlockquote().run(),
    [editor]
  );
  const toggleCodeBlock = useCallback(
    () => editor?.chain().focus().toggleCodeBlock().run(),
    [editor]
  );
  const setHorizontalRule = useCallback(
    () => editor?.chain().focus().setHorizontalRule().run(),
    [editor]
  );

  // Memoized link handling
  const setLink = useCallback(() => {
    if (!editor) return;
    const url = window.prompt('Enter URL:');
    if (url) {
      const text = window.prompt('Enter link text:', url);
      if (text) {
        // Insert markdown-style link
        editor.chain().focus().insertContent(`[${text}](${url})`).run();
      }
    }
  }, [editor]);

  // Memoized utility commands
  const undo = useCallback(
    () => editor?.chain().focus().undo().run(),
    [editor]
  );
  const redo = useCallback(
    () => editor?.chain().focus().redo().run(),
    [editor]
  );
  const clearFormatting = useCallback(
    () => editor?.chain().focus().clearNodes().unsetAllMarks().run(),
    [editor]
  );

  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  if (!editor) {
    return null;
  }

  return (
    <div className={`flex relative ${className}`}>
      {/* Left Panel - Basic Formatting Tools */}
      <div
        className={`fixed top-1/2 -translate-y-1/2 z-10 transition-transform duration-300 ease-in-out ${
          leftPanelOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{
          left: 'max(1rem, calc((100vw - 1280px) / 2 - 200px))',
        }}
      >
        <div
          className={`glass-enhanced rounded-2xl p-3 md:p-4 shadow-premium backdrop-blur-lg max-h-[80vh] overflow-y-auto ${
            isDark
              ? 'bg-dark-800/95 border-dark-600/50'
              : 'bg-light-100/95 border-light-400/50'
          }`}
        >
          {/* Panel Header */}
          <div className="flex items-center justify-between mb-4">
            <h3
              className={`text-sm font-semibold ${isDark ? 'text-neutral-200' : 'text-neutral-800'}`}
            >
              Format
            </h3>
            <button
              onClick={() => setLeftPanelOpen(false)}
              className={`p-1 rounded-lg transition-colors ${
                isDark
                  ? 'hover:bg-white/10 text-neutral-300'
                  : 'hover:bg-black/10 text-neutral-700'
              }`}
              title="Close panel"
            >
              ←
            </button>
          </div>

          {/* Basic Formatting Tools */}
          <div className="flex flex-col gap-2">
            {/* Undo/Redo */}
            <div className="flex gap-1">
              <ToolbarButton
                onClick={undo}
                disabled={!editor.can().undo()}
                title="Undo"
                shortcut="Ctrl+Z"
              >
                ↶
              </ToolbarButton>
              <ToolbarButton
                onClick={redo}
                disabled={!editor.can().redo()}
                title="Redo"
                shortcut="Ctrl+Y"
              >
                ↷
              </ToolbarButton>
            </div>

            {/* Text Formatting */}
            <div className="flex gap-1">
              <ToolbarButton
                onClick={toggleBold}
                isActive={editor.isActive('bold')}
                title="Bold"
                shortcut="Ctrl+B"
              >
                <strong>B</strong>
              </ToolbarButton>
              <ToolbarButton
                onClick={toggleItalic}
                isActive={editor.isActive('italic')}
                title="Italic"
                shortcut="Ctrl+I"
              >
                <em>I</em>
              </ToolbarButton>
            </div>

            <div className="flex gap-1">
              <ToolbarButton
                onClick={toggleStrike}
                isActive={editor.isActive('strike')}
                title="Strikethrough"
                shortcut="Ctrl+Shift+S"
              >
                <span className="line-through">S</span>
              </ToolbarButton>
              <ToolbarButton
                onClick={toggleCode}
                isActive={editor.isActive('code')}
                title="Inline Code"
                shortcut="Ctrl+E"
              >
                <code className="text-xs">&lt;/&gt;</code>
              </ToolbarButton>
            </div>

            {/* Headings */}
            <div className="w-full h-px bg-neutral-600 dark:bg-neutral-400 my-2 opacity-30"></div>
            <div className="flex gap-1">
              <ToolbarButton
                onClick={setParagraph}
                isActive={editor.isActive('paragraph')}
                title="Paragraph"
                shortcut="Ctrl+Alt+0"
              >
                P
              </ToolbarButton>
              <ToolbarButton
                onClick={() => setHeading(1)}
                isActive={editor.isActive('heading', { level: 1 })}
                title="Heading 1"
                shortcut="Ctrl+Alt+1"
              >
                H1
              </ToolbarButton>
            </div>

            <div className="flex gap-1">
              <ToolbarButton
                onClick={() => setHeading(2)}
                isActive={editor.isActive('heading', { level: 2 })}
                title="Heading 2"
                shortcut="Ctrl+Alt+2"
              >
                H2
              </ToolbarButton>
              <ToolbarButton
                onClick={() => setHeading(3)}
                isActive={editor.isActive('heading', { level: 3 })}
                title="Heading 3"
                shortcut="Ctrl+Alt+3"
              >
                H3
              </ToolbarButton>
            </div>

            {/* Lists */}
            <div className="w-full h-px bg-neutral-600 dark:bg-neutral-400 my-2 opacity-30"></div>
            <div className="flex flex-col gap-1">
              <ToolbarButton
                onClick={toggleBulletList}
                isActive={editor.isActive('bulletList')}
                title="Bullet List"
                shortcut="Ctrl+Shift+8"
              >
                • List
              </ToolbarButton>
              <ToolbarButton
                onClick={toggleOrderedList}
                isActive={editor.isActive('orderedList')}
                title="Numbered List"
                shortcut="Ctrl+Shift+7"
              >
                1. List
              </ToolbarButton>
            </div>

            {/* Quote */}
            <ToolbarButton
              onClick={toggleBlockquote}
              isActive={editor.isActive('blockquote')}
              title="Blockquote"
              shortcut="Ctrl+Shift+B"
            >
              &quot; &quot;
            </ToolbarButton>
          </div>
        </div>
      </div>

      {/* Left Panel Toggle (when closed) */}
      {!leftPanelOpen && (
        <button
          onClick={() => setLeftPanelOpen(true)}
          className={`fixed top-1/2 -translate-y-1/2 z-10 p-3 glass-enhanced rounded-xl shadow-premium transition-all duration-300 hover:scale-105 ${
            isDark
              ? 'bg-dark-800/95 border-dark-600/50 text-neutral-200 hover:bg-dark-700/95'
              : 'bg-light-100/95 border-light-400/50 text-neutral-800 hover:bg-light-200/95'
          }`}
          style={{
            left: 'max(0.5rem, calc((100vw - 1280px) / 2 - 250px))',
          }}
          title="Show formatting tools"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M9 18l6-6-6-6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      )}

      {/* Right Panel - Advanced Tools */}
      <div
        className={`fixed top-1/2 -translate-y-1/2 z-10 transition-transform duration-300 ease-in-out ${
          rightPanelOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{
          right: 'max(1rem, calc((100vw - 1280px) / 2 - 200px))',
        }}
      >
        <div
          className={`glass-enhanced rounded-2xl p-3 md:p-4 shadow-premium backdrop-blur-lg max-h-[80vh] overflow-y-auto ${
            isDark
              ? 'bg-dark-800/95 border-dark-600/50'
              : 'bg-light-100/95 border-light-400/50'
          }`}
        >
          {/* Panel Header */}
          <div className="flex items-center justify-between mb-4">
            <h3
              className={`text-sm font-semibold ${isDark ? 'text-neutral-200' : 'text-neutral-800'}`}
            >
              Tools
            </h3>
            <button
              onClick={() => setRightPanelOpen(false)}
              className={`p-1 rounded-lg transition-colors ${
                isDark
                  ? 'hover:bg-white/10 text-neutral-300'
                  : 'hover:bg-black/10 text-neutral-700'
              }`}
              title="Close panel"
            >
              →
            </button>
          </div>

          {/* Advanced Tools */}
          <div className="flex flex-col gap-2">
            {/* Links & Images */}
            <div className="flex flex-col gap-1">
              <ToolbarButton
                onClick={setLink}
                title="Add Link"
                shortcut="Ctrl+K"
              >
                🔗
              </ToolbarButton>
              {onImageUpload && (
                <ToolbarButton onClick={onImageUpload} title="Upload Image">
                  🖼️
                </ToolbarButton>
              )}
            </div>

            {/* Code & Utilities */}
            <div className="w-full h-px bg-neutral-600 dark:bg-neutral-400 my-2 opacity-30"></div>
            <div className="flex flex-col gap-1">
              <ToolbarButton
                onClick={toggleCodeBlock}
                isActive={editor.isActive('codeBlock')}
                title="Code Block"
                shortcut="Ctrl+Alt+C"
              >
                {'{ }'}
              </ToolbarButton>
              <ToolbarButton
                onClick={setHorizontalRule}
                title="Horizontal Rule"
              >
                ―
              </ToolbarButton>
            </div>

            {/* Clear Formatting */}
            <ToolbarButton
              onClick={clearFormatting}
              title="Clear Formatting"
              shortcut="Ctrl+\\"
            >
              🧹
            </ToolbarButton>

            {/* Preview Mode Controls */}
            {enablePreview && onPreviewModeChange && (
              <>
                <div className="w-full h-px bg-neutral-600 dark:bg-neutral-400 my-2 opacity-30"></div>
                <div className="flex flex-col gap-1">
                  <ToolbarButton
                    onClick={() => onPreviewModeChange('edit')}
                    isActive={previewMode === 'edit'}
                    title="Edit Mode"
                  >
                    📝
                  </ToolbarButton>
                  <div className="hidden sm:block">
                    <ToolbarButton
                      onClick={() => onPreviewModeChange('split')}
                      isActive={previewMode === 'split'}
                      title="Split View"
                    >
                      📄
                    </ToolbarButton>
                  </div>
                  <ToolbarButton
                    onClick={() => onPreviewModeChange('preview')}
                    isActive={previewMode === 'preview'}
                    title="Preview Mode"
                  >
                    👁️
                  </ToolbarButton>
                </div>
              </>
            )}

            {/* Shortcuts Toggle */}
            <div className="w-full h-px bg-neutral-600 dark:bg-neutral-400 my-2 opacity-30"></div>
            <ToolbarButton
              onClick={() => setShowShortcuts(!showShortcuts)}
              title="Toggle Keyboard Shortcuts"
              isActive={showShortcuts}
            >
              ⌨️
            </ToolbarButton>
          </div>
        </div>
      </div>

      {/* Right Panel Toggle (when closed) */}
      {!rightPanelOpen && (
        <button
          onClick={() => setRightPanelOpen(true)}
          className={`fixed top-1/2 -translate-y-1/2 z-10 p-3 glass-enhanced rounded-xl shadow-premium transition-all duration-300 hover:scale-105 ${
            isDark
              ? 'bg-dark-800/95 border-dark-600/50 text-neutral-200 hover:bg-dark-700/95'
              : 'bg-light-100/95 border-light-400/50 text-neutral-800 hover:bg-light-200/95'
          }`}
          style={{
            right: 'max(0.5rem, calc((100vw - 1280px) / 2 - 250px))',
          }}
          title="Show advanced tools"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M15 18l-6-6 6-6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      )}

      {/* Keyboard Shortcuts Overlay */}
      {showShortcuts && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div
            className={`glass-enhanced rounded-2xl p-6 shadow-premium max-w-4xl w-full max-h-[80vh] overflow-y-auto ${
              isDark
                ? 'bg-dark-800/95 border-dark-600/50'
                : 'bg-light-100/95 border-light-400/50'
            }`}
          >
            <div className="flex items-center justify-between mb-6">
              <h4
                className={`text-lg font-semibold ${isDark ? 'text-neutral-200' : 'text-neutral-800'}`}
              >
                Keyboard Shortcuts
              </h4>
              <button
                onClick={() => setShowShortcuts(false)}
                className={`p-2 rounded-lg transition-colors ${
                  isDark
                    ? 'hover:bg-white/10 text-neutral-300'
                    : 'hover:bg-black/10 text-neutral-700'
                }`}
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-sm">
              <div className="space-y-3">
                <h5
                  className={`font-semibold ${isDark ? 'text-neutral-200' : 'text-neutral-800'}`}
                >
                  Text Formatting
                </h5>
                <div
                  className={`space-y-2 ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}
                >
                  <div className="flex justify-between items-center">
                    <span>Bold</span>
                    <kbd
                      className={`px-2 py-1 rounded-lg text-xs font-mono ${
                        isDark
                          ? 'bg-dark-700 text-neutral-200'
                          : 'bg-light-300 text-neutral-800'
                      }`}
                    >
                      Ctrl+B
                    </kbd>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Italic</span>
                    <kbd
                      className={`px-2 py-1 rounded-lg text-xs font-mono ${
                        isDark
                          ? 'bg-dark-700 text-neutral-200'
                          : 'bg-light-300 text-neutral-800'
                      }`}
                    >
                      Ctrl+I
                    </kbd>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Strike</span>
                    <kbd
                      className={`px-2 py-1 rounded-lg text-xs font-mono ${
                        isDark
                          ? 'bg-dark-700 text-neutral-200'
                          : 'bg-light-300 text-neutral-800'
                      }`}
                    >
                      Ctrl+Shift+S
                    </kbd>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Code</span>
                    <kbd
                      className={`px-2 py-1 rounded-lg text-xs font-mono ${
                        isDark
                          ? 'bg-dark-700 text-neutral-200'
                          : 'bg-light-300 text-neutral-800'
                      }`}
                    >
                      Ctrl+E
                    </kbd>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h5
                  className={`font-semibold ${isDark ? 'text-neutral-200' : 'text-neutral-800'}`}
                >
                  Headings
                </h5>
                <div
                  className={`space-y-2 ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}
                >
                  <div className="flex justify-between items-center">
                    <span>Paragraph</span>
                    <kbd
                      className={`px-2 py-1 rounded-lg text-xs font-mono ${
                        isDark
                          ? 'bg-dark-700 text-neutral-200'
                          : 'bg-light-300 text-neutral-800'
                      }`}
                    >
                      Ctrl+Alt+0
                    </kbd>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Heading 1</span>
                    <kbd
                      className={`px-2 py-1 rounded-lg text-xs font-mono ${
                        isDark
                          ? 'bg-dark-700 text-neutral-200'
                          : 'bg-light-300 text-neutral-800'
                      }`}
                    >
                      Ctrl+Alt+1
                    </kbd>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Heading 2</span>
                    <kbd
                      className={`px-2 py-1 rounded-lg text-xs font-mono ${
                        isDark
                          ? 'bg-dark-700 text-neutral-200'
                          : 'bg-light-300 text-neutral-800'
                      }`}
                    >
                      Ctrl+Alt+2
                    </kbd>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Heading 3</span>
                    <kbd
                      className={`px-2 py-1 rounded-lg text-xs font-mono ${
                        isDark
                          ? 'bg-dark-700 text-neutral-200'
                          : 'bg-light-300 text-neutral-800'
                      }`}
                    >
                      Ctrl+Alt+3
                    </kbd>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h5
                  className={`font-semibold ${isDark ? 'text-neutral-200' : 'text-neutral-800'}`}
                >
                  Lists & More
                </h5>
                <div
                  className={`space-y-2 ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}
                >
                  <div className="flex justify-between items-center">
                    <span>Bullet List</span>
                    <kbd
                      className={`px-2 py-1 rounded-lg text-xs font-mono ${
                        isDark
                          ? 'bg-dark-700 text-neutral-200'
                          : 'bg-light-300 text-neutral-800'
                      }`}
                    >
                      Ctrl+Shift+8
                    </kbd>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Number List</span>
                    <kbd
                      className={`px-2 py-1 rounded-lg text-xs font-mono ${
                        isDark
                          ? 'bg-dark-700 text-neutral-200'
                          : 'bg-light-300 text-neutral-800'
                      }`}
                    >
                      Ctrl+Shift+7
                    </kbd>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Link</span>
                    <kbd
                      className={`px-2 py-1 rounded-lg text-xs font-mono ${
                        isDark
                          ? 'bg-dark-700 text-neutral-200'
                          : 'bg-light-300 text-neutral-800'
                      }`}
                    >
                      Ctrl+K
                    </kbd>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Undo</span>
                    <kbd
                      className={`px-2 py-1 rounded-lg text-xs font-mono ${
                        isDark
                          ? 'bg-dark-700 text-neutral-200'
                          : 'bg-light-300 text-neutral-800'
                      }`}
                    >
                      Ctrl+Z
                    </kbd>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
