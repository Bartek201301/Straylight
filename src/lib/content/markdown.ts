import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkFrontmatter from 'remark-frontmatter';
import remarkRehype from 'remark-rehype';
import rehypeSanitize from 'rehype-sanitize';
import rehypeHighlight from 'rehype-highlight';
import rehypeStringify from 'rehype-stringify';
import { defaultSchema } from 'rehype-sanitize';
import {
  calculateReadingTime as calculateEnhancedReadingTime,
  getReadingTimeStats,
  type ReadingTimeResult,
} from '@/lib/content/reading-time';

// Enhanced sanitization schema
// - pozwala na syntax highlighting
// - dodaje wsparcie dla obrazów oraz data/blob URL w src
const sanitizeSchema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    code: ['className'],
    pre: ['className'],
    span: ['className'],
    div: ['className'],
    img: ['src', 'alt', 'title', 'className', 'loading', 'width', 'height'],
  },
  tagNames: [
    ...(defaultSchema.tagNames || []),
    'pre',
    'code',
    'span',
    'div',
    'img',
    'figure',
    'figcaption',
  ],
  protocols: {
    ...(defaultSchema as any).protocols,
    // pozwól na obrazy z http/https oraz data: i blob:
    src: ['http', 'https', 'data', 'blob'],
    href: ['http', 'https', 'mailto', 'tel'],
  },
} as any;

// Interface for processed markdown content
export interface ProcessedMarkdown {
  html: string;
  frontmatter?: Record<string, any>;
  wordCount: number;
  readingTime: number; // Backward compatibility - minutes
  readingTimeData: ReadingTimeResult; // Enhanced reading time data
  readingStats: {
    textWords: number;
    codeWords: number;
    imageCount: number;
    readingSpeed: 'fast' | 'average' | 'slow';
  };
  error?: string;
}

// Parse frontmatter from markdown content
function parseFrontmatter(content: string): {
  content: string;
  frontmatter?: Record<string, any>;
} {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
  const match = content.match(frontmatterRegex);

  if (!match) {
    return { content };
  }

  try {
    const frontmatterText = match[1];
    const bodyContent = match[2];

    // Simple YAML-like parsing for basic key-value pairs
    const frontmatter: Record<string, any> = {};
    frontmatterText.split('\n').forEach((line) => {
      const colonIndex = line.indexOf(':');
      if (colonIndex > 0) {
        const key = line.substring(0, colonIndex).trim();
        const value = line.substring(colonIndex + 1).trim();

        // Handle different value types
        if (value === 'true' || value === 'false') {
          frontmatter[key] = value === 'true';
        } else if (!isNaN(Number(value)) && value !== '') {
          frontmatter[key] = Number(value);
        } else {
          // Remove quotes if present
          frontmatter[key] = value.replace(/^["']|["']$/g, '');
        }
      }
    });

    return { content: bodyContent, frontmatter };
  } catch (error) {
    console.error('Error parsing frontmatter:', error);
    return { content };
  }
}

// Main markdown processing function
export async function processMarkdown(
  markdown: string
): Promise<ProcessedMarkdown> {
  try {
    // Normalize heading levels: promote all markdown H3 (###) to visual H3 but ensure H2/H4+ are not used in TOC.
    // We don't rewrite markdown semantics here to avoid breaking links or anchors; the TOC will target H3 only.
    // Parse frontmatter first
    const { content, frontmatter } = parseFrontmatter(markdown);

    // Enhanced reading time calculation
    const readingTimeData = calculateEnhancedReadingTime(content);
    const readingStats = getReadingTimeStats(content);

    // Legacy compatibility
    const wordCount = readingTimeData.words;
    const readingTime = readingTimeData.minutes;

    // Process markdown to HTML
    const processor = unified()
      .use(remarkParse) // Parse markdown
      .use(remarkGfm) // GitHub Flavored Markdown support
      .use(remarkFrontmatter) // Handle frontmatter
      .use(remarkRehype, { allowDangerousHtml: false }) // Convert to HTML
      .use(rehypeSanitize, sanitizeSchema) // Sanitize HTML for security
      .use(rehypeHighlight, {
        ignoreMissing: true,
        plainText: ['txt', 'text', 'plain'],
      })
      .use(rehypeStringify); // Convert to HTML string

    const result = await processor.process(content);
    const html = String(result);

    return {
      html,
      frontmatter,
      wordCount,
      readingTime,
      readingTimeData,
      readingStats: {
        textWords: readingStats.textWords,
        codeWords: readingStats.codeWords,
        imageCount: readingStats.imageCount,
        readingSpeed: readingStats.readingSpeed,
      },
    };
  } catch (error) {
    console.error('Error processing markdown:', error);

    // Return safe fallback with error information
    const fallbackReadingTime = calculateEnhancedReadingTime(markdown);
    const fallbackStats = getReadingTimeStats(markdown);

    return {
      html: `<div class="error-message">
        <p><strong>Error processing markdown content:</strong></p>
        <p>${error instanceof Error ? error.message : 'Unknown error'}</p>
        <details>
          <summary>Raw content</summary>
          <pre>${markdown}</pre>
        </details>
      </div>`,
      wordCount: fallbackReadingTime.words,
      readingTime: fallbackReadingTime.minutes,
      readingTimeData: fallbackReadingTime,
      readingStats: {
        textWords: fallbackStats.textWords,
        codeWords: fallbackStats.codeWords,
        imageCount: fallbackStats.imageCount,
        readingSpeed: fallbackStats.readingSpeed,
      },
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Helper function to process article content specifically
export async function processArticleContent(article: {
  body_md: string;
  title: string;
  excerpt?: string | null;
}): Promise<ProcessedMarkdown & { enhancedExcerpt?: string }> {
  const processed = await processMarkdown(article.body_md);

  // If no excerpt is provided, try to generate one from the content
  let enhancedExcerpt = article.excerpt || undefined;
  if (!enhancedExcerpt && processed.html) {
    // Extract first paragraph from HTML and strip tags
    const firstParagraphMatch = processed.html.match(/<p[^>]*>(.*?)<\/p>/i);
    if (firstParagraphMatch) {
      enhancedExcerpt = firstParagraphMatch[1]
        .replace(/<[^>]*>/g, '') // Strip HTML tags
        .substring(0, 160) // Limit length
        .trim();

      // Add ellipsis if truncated
      if (enhancedExcerpt.length === 160) {
        enhancedExcerpt += '...';
      }
    }
  }

  return {
    ...processed,
    enhancedExcerpt,
  };
}
