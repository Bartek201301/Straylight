/**
 * HTML to Markdown Converter
 *
 * Converts HTML content from TipTap editor to clean Markdown format.
 * Handles headings, formatting, lists, images, code blocks, and more.
 */

/**
 * Convert HTML to Markdown
 *
 * @param html - HTML string to convert
 * @returns Markdown string
 */
export function htmlToMarkdown(html: string): string {
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
        content.replace(/<li[^>]*>(.*?)<\/li>/gi, () => `${counter++}. $1\n`) +
        '\n'
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
}

/**
 * Calculate word count and reading time from markdown content
 *
 * @param markdown - Markdown string to analyze
 * @returns Object with wordCount and readingTime (in minutes)
 */
function _calculateStats(markdown: string): {
  wordCount: number;
  readingTime: number;
} {
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

  return { wordCount, readingTime };
}

/**
 * Validate that a string is valid Markdown (not HTML)
 *
 * @param content - Content to validate
 * @returns true if content appears to be Markdown, false if HTML
 */
export function isMarkdown(content: string): boolean {
  // Check for common HTML tags
  const htmlTags =
    /<(html|head|body|div|span|p|h[1-6]|ul|ol|li|table|tr|td|th)[^>]*>/i;
  return !htmlTags.test(content);
}

/**
 * Generate title from markdown content
 * Extracts first heading or first line
 *
 * @param content - Markdown content
 * @returns Generated title string
 */
function _generateTitleFromContent(content: string): string {
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
}

/**
 * Generate excerpt from markdown content
 *
 * @param markdown - Markdown content
 * @param maxLength - Maximum length of excerpt (default: 150)
 * @returns Excerpt string
 */
function _generateExcerpt(markdown: string, maxLength: number = 150): string {
  // Remove markdown formatting for excerpt
  const plainText = markdown
    .replace(/#{1,6}\s+/g, '') // Remove headers
    .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove bold
    .replace(/\*([^*]+)\*/g, '$1') // Remove italic
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links, keep text
    .replace(/```[\s\S]*?```/g, '') // Remove code blocks
    .replace(/`([^`]+)`/g, '$1') // Remove inline code
    .trim();

  if (plainText.length <= maxLength) {
    return plainText;
  }

  // Cut at word boundary
  const truncated = plainText.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  return (
    (lastSpace > 0 ? truncated.substring(0, lastSpace) : truncated) + '...'
  );
}
