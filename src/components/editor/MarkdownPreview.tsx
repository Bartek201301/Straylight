'use client';

import React, { useMemo, memo, useCallback } from 'react';

interface MarkdownPreviewProps {
  markdown: string;
  className?: string;
  onScroll?: (scrollTop: number, scrollHeight: number) => void;
}

const MarkdownPreview = memo(function MarkdownPreview({
  markdown,
  className = '',
  onScroll,
}: MarkdownPreviewProps) {
  // Enhanced markdown to HTML conversion
  const htmlContent = useMemo(() => {
    if (!markdown.trim()) return '';

    let html = markdown;

    // Code blocks (handle first to avoid interference)
    html = html.replace(
      /```(\w+)?\s*\n([\s\S]*?)```/g,
      (match, language, code) => {
        const lang = language || 'text';
        return `<pre class="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto my-4 border"><code class="language-${lang} text-sm">${code.trim()}</code></pre>`;
      }
    );

    // Inline code (after code blocks)
    html = html.replace(
      /`([^`]+)`/g,
      '<code class="bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 px-1.5 py-0.5 rounded text-sm font-mono">$1</code>'
    );

    // Headers with proper styling (only H3 is used for left navigation elsewhere)
    html = html.replace(
      /^# (.*$)/gm,
      '<h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-8 mb-4 first:mt-0">$1</h1>'
    );
    html = html.replace(
      /^## (.*$)/gm,
      '<h2 class="text-2xl font-semibold text-gray-900 dark:text-gray-100 mt-6 mb-3">$1</h2>'
    );
    html = html.replace(
      /^### (.*$)/gm,
      '<h3 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mt-5 mb-3">$1</h3>'
    );
    html = html.replace(
      /^#### (.*$)/gm,
      '<h4 class="text-lg font-medium text-gray-900 dark:text-gray-100 mt-4 mb-2">$1</h4>'
    );
    html = html.replace(
      /^##### (.*$)/gm,
      '<h5 class="text-base font-medium text-gray-900 dark:text-gray-100 mt-4 mb-2">$1</h5>'
    );
    html = html.replace(
      /^###### (.*$)/gm,
      '<h6 class="text-sm font-medium text-gray-900 dark:text-gray-100 mt-3 mb-2 uppercase tracking-wide">$1</h6>'
    );

    // Enhanced text formatting
    html = html.replace(
      /\*\*\*(.*?)\*\*\*/g,
      '<strong class="font-bold text-gray-900 dark:text-gray-100"><em>$1</em></strong>'
    );
    html = html.replace(
      /\*\*(.*?)\*\*/g,
      '<strong class="font-semibold text-gray-900 dark:text-gray-100">$1</strong>'
    );
    html = html.replace(
      /\*(.*?)\*/g,
      '<em class="italic text-gray-700 dark:text-gray-300">$1</em>'
    );
    html = html.replace(
      /~~(.*?)~~/g,
      '<del class="line-through text-gray-500 dark:text-gray-400">$1</del>'
    );

    // Enhanced images with captions (allow data: and blob:)
    html = html.replace(
      /!\[([^\]]*)\]\(([^)]+)(?:\s+"([^"]*)")?\)/g,
      (match, alt, src, title) => {
        const titleAttr = title ? ` title="${title}"` : '';
        // Escape quotes in src minimally to avoid breaking attributes
        const safeSrc = src.replace(/"/g, '&quot;');
        return `<figure class="my-6">
          <img src="${safeSrc}" alt="${alt}"${titleAttr} class="max-w-full h-auto rounded-lg shadow-sm mx-auto" loading="lazy" />
          ${alt ? `<figcaption class="text-sm text-gray-600 dark:text-gray-400 text-center mt-2 italic">${alt}</figcaption>` : ''}
        </figure>`;
      }
    );

    // Enhanced links with external link detection
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, text, href) => {
      const isExternal =
        href.startsWith('http') && !href.includes(window.location.hostname);
      const externalAttrs = isExternal
        ? ' target="_blank" rel="noopener noreferrer"'
        : '';
      const externalIcon = isExternal
        ? ' <svg class="inline w-3 h-3 ml-1" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M4.25 5.5a.75.75 0 00-.75.75v8.5c0 .414.336.75.75.75h8.5a.75.75 0 00.75-.75v-4a.75.75 0 011.5 0v4A2.25 2.25 0 0112.75 17h-8.5A2.25 2.25 0 012 14.75v-8.5A2.25 2.25 0 014.25 4h5a.75.75 0 010 1.5h-5z" clip-rule="evenodd" /><path fill-rule="evenodd" d="M6.194 12.753a.75.75 0 001.06.053L16.5 4.44v2.81a.75.75 0 001.5 0v-4.5a.75.75 0 00-.75-.75h-4.5a.75.75 0 000 1.5h2.553l-9.056 8.194a.75.75 0 00-.053 1.06z" clip-rule="evenodd" /></svg>'
        : '';
      return `<a href="${href}" class="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline decoration-2 underline-offset-2"${externalAttrs}>${text}${externalIcon}</a>`;
    });

    // Enhanced blockquotes
    html = html.replace(
      /^> (.*$)/gm,
      '<blockquote class="border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-900/20 pl-4 py-2 my-4 italic text-gray-700 dark:text-gray-300">$1</blockquote>'
    );

    // Tables
    html = html.replace(
      /\|(.+)\|\n\|[-|\s]+\|\n((?:\|.+\|\n?)*)/g,
      (match, header, rows) => {
        const headerCells = header
          .split('|')
          .map(
            (cell: string) =>
              `<th class="px-4 py-2 text-left font-semibold text-gray-900 dark:text-gray-100 border-b border-gray-300 dark:border-gray-600">${cell.trim()}</th>`
          )
          .join('');
        const bodyRows = rows
          .trim()
          .split('\n')
          .map((row: string) => {
            const cells = row
              .split('|')
              .map(
                (cell: string) =>
                  `<td class="px-4 py-2 text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">${cell.trim()}</td>`
              )
              .join('');
            return `<tr>${cells}</tr>`;
          })
          .join('');

        return `<div class="overflow-x-auto my-6">
          <table class="min-w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg">
            <thead class="bg-gray-50 dark:bg-gray-700">
              <tr>${headerCells}</tr>
            </thead>
            <tbody>${bodyRows}</tbody>
          </table>
        </div>`;
      }
    );

    // Horizontal rules
    html = html.replace(
      /^---$/gm,
      '<hr class="my-8 border-gray-300 dark:border-gray-600" />'
    );

    // Process lists and paragraphs
    const sections = html.split(/\n\s*\n/);
    const processedSections = sections.map((section) => {
      section = section.trim();
      if (!section) return '';

      // Skip if already processed (contains HTML tags)
      if (section.match(/^<(h[1-6]|blockquote|pre|hr|figure|div|table)/)) {
        return section;
      }

      // Handle unordered lists
      if (section.match(/^[-*+]\s/m)) {
        const listItems = section
          .split('\n')
          .map((line) =>
            line.replace(
              /^[-*+]\s(.*)/,
              '<li class="mb-1 text-gray-700 dark:text-gray-300">$1</li>'
            )
          )
          .join('\n');
        return `<ul class="list-disc ml-6 my-4 space-y-1">${listItems}</ul>`;
      }

      // Handle ordered lists
      if (section.match(/^\d+\.\s/m)) {
        const listItems = section
          .split('\n')
          .map((line) =>
            line.replace(
              /^\d+\.\s(.*)/,
              '<li class="mb-1 text-gray-700 dark:text-gray-300">$1</li>'
            )
          )
          .join('\n');
        return `<ol class="list-decimal ml-6 my-4 space-y-1">${listItems}</ol>`;
      }

      // Regular paragraphs
      return `<p class="mb-4 text-gray-700 dark:text-gray-300 leading-relaxed">${section}</p>`;
    });

    return processedSections.join('\n');
  }, [markdown]);

  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      if (onScroll) {
        const element = e.currentTarget;
        onScroll(element.scrollTop, element.scrollHeight);
      }
    },
    [onScroll]
  );

  return (
    <div
      className={`prose prose-base sm:prose-lg max-w-none overflow-y-auto transition-all duration-150 ${className}`}
      onScroll={handleScroll}
      style={{ height: '100%' }}
    >
      <div
        className="p-4 sm:p-6"
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />

      {/* Empty state */}
      {!markdown.trim() && (
        <div className="flex items-center justify-center h-full text-gray-500">
          <div className="text-center">
            <p className="text-lg mb-2">📝 Preview</p>
            <p className="text-sm">
              Start typing in the editor to see your content rendered here
            </p>
          </div>
        </div>
      )}
    </div>
  );
});

export default MarkdownPreview;
