// Enhanced reading time calculation utility

export interface ReadingTimeResult {
  text: string;
  minutes: number;
  time: number; // in seconds
  words: number;
  imageReadingTime: number;
  codeReadingTime: number;
  textReadingTime: number;
}

interface ReadingTimeOptions {
  wordsPerMinute?: number;
  imageReadingTimeSeconds?: number;
  codeReadingWpm?: number;
  includeCodeBlocks?: boolean;
  includeImages?: boolean;
}

const DEFAULT_OPTIONS: Required<ReadingTimeOptions> = {
  wordsPerMinute: 200, // Average adult reading speed
  imageReadingTimeSeconds: 12, // Time to process an image
  codeReadingWpm: 80, // Slower reading for code
  includeCodeBlocks: true,
  includeImages: true,
};

/**
 * Calculate reading time for markdown content with enhanced analysis
 */
export function calculateReadingTime(
  content: string,
  options: ReadingTimeOptions = {}
): ReadingTimeResult {
  const config = { ...DEFAULT_OPTIONS, ...options };

  if (!content || content.trim().length === 0) {
    return {
      text: '1 min read',
      minutes: 1,
      time: 60,
      words: 0,
      imageReadingTime: 0,
      codeReadingTime: 0,
      textReadingTime: 60,
    };
  }

  // Remove frontmatter if present
  const contentWithoutFrontmatter = content.replace(/^---[\s\S]*?---\n?/, '');

  // Extract and count images
  const imageMatches =
    contentWithoutFrontmatter.match(/!\[[^\]]*\]\([^)]+\)/g) || [];
  const imageCount = imageMatches.length;
  const imageReadingTime = config.includeImages
    ? imageCount * config.imageReadingTimeSeconds
    : 0;

  // Extract code blocks and inline code
  let codeContent = '';
  let contentWithoutCode = contentWithoutFrontmatter;

  if (config.includeCodeBlocks) {
    // Extract fenced code blocks
    const codeBlockMatches =
      contentWithoutFrontmatter.match(/```[\s\S]*?```/g) || [];
    codeBlockMatches.forEach((block) => {
      // Remove the fence markers and get the code content
      const codeText = block.replace(/```[^\n]*\n?/g, '').replace(/```$/g, '');
      codeContent += codeText + ' ';
      contentWithoutCode = contentWithoutCode.replace(block, ' ');
    });

    // Extract inline code
    const inlineCodeMatches = contentWithoutCode.match(/`[^`]+`/g) || [];
    inlineCodeMatches.forEach((code) => {
      const codeText = code.replace(/`/g, '');
      codeContent += codeText + ' ';
      contentWithoutCode = contentWithoutCode.replace(code, ' ');
    });
  }

  // Remove remaining markdown syntax for accurate word count
  const cleanedContent = contentWithoutCode
    // Remove image markdown
    .replace(/!\[[^\]]*\]\([^)]+\)/g, '')
    // Remove links but keep text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Remove headers
    .replace(/^#{1,6}\s+/gm, '')
    // Remove bold/italic
    .replace(/(\*\*|__)(.*?)\1/g, '$2')
    .replace(/(\*|_)(.*?)\1/g, '$2')
    // Remove blockquotes
    .replace(/^>\s+/gm, '')
    // Remove list markers
    .replace(/^[\s]*[-*+]\s+/gm, '')
    .replace(/^[\s]*\d+\.\s+/gm, '')
    // Remove horizontal rules
    .replace(/^[\s]*[-*_]{3,}[\s]*$/gm, '')
    // Remove HTML tags
    .replace(/<[^>]*>/g, '')
    // Clean up extra whitespace
    .replace(/\s+/g, ' ')
    .trim();

  // Count words in different content types
  const textWords = cleanedContent
    .split(/\s+/)
    .filter((word) => word.length > 0).length;
  const codeWords = codeContent
    .split(/\s+/)
    .filter((word) => word.length > 0).length;
  const totalWords = textWords + codeWords;

  // Calculate reading times
  const textReadingTime = Math.ceil((textWords / config.wordsPerMinute) * 60);
  const codeReadingTime = config.includeCodeBlocks
    ? Math.ceil((codeWords / config.codeReadingWpm) * 60)
    : 0;

  const totalReadingTimeSeconds =
    textReadingTime + codeReadingTime + imageReadingTime;
  const totalReadingTimeMinutes = Math.max(
    1,
    Math.ceil(totalReadingTimeSeconds / 60)
  );

  // Format reading time text
  const formatReadingTime = (minutes: number): string => {
    if (minutes === 1) {
      return '1 min read';
    } else if (minutes < 60) {
      return `${minutes} min read`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      if (remainingMinutes === 0) {
        return `${hours} hr read`;
      } else {
        return `${hours} hr ${remainingMinutes} min read`;
      }
    }
  };

  return {
    text: formatReadingTime(totalReadingTimeMinutes),
    minutes: totalReadingTimeMinutes,
    time: totalReadingTimeSeconds,
    words: totalWords,
    imageReadingTime,
    codeReadingTime,
    textReadingTime,
  };
}

/**
 * Get reading time statistics for analytics
 */
export function getReadingTimeStats(content: string): {
  textWords: number;
  codeWords: number;
  imageCount: number;
  estimatedTime: ReadingTimeResult;
  readingSpeed: 'fast' | 'average' | 'slow';
} {
  const readingTime = calculateReadingTime(content);

  // Determine reading speed category based on content density
  const wordsPerMinute = readingTime.words / readingTime.minutes;
  let readingSpeed: 'fast' | 'average' | 'slow';

  if (wordsPerMinute < 150) {
    readingSpeed = 'slow'; // Dense technical content
  } else if (wordsPerMinute > 250) {
    readingSpeed = 'fast'; // Light, easy reading
  } else {
    readingSpeed = 'average'; // Standard content
  }

  // Count different content types
  const imageMatches = content.match(/!\[[^\]]*\]\([^)]+\)/g) || [];
  const codeBlockMatches = content.match(/```[\s\S]*?```/g) || [];
  const inlineCodeMatches = content.match(/`[^`]+`/g) || [];

  let codeWords = 0;
  [...codeBlockMatches, ...inlineCodeMatches].forEach((code) => {
    const codeText = code
      .replace(/```[^\n]*\n?/g, '')
      .replace(/```$/g, '')
      .replace(/`/g, '');
    codeWords += codeText.split(/\s+/).filter((word) => word.length > 0).length;
  });

  const textWords = readingTime.words - codeWords;

  return {
    textWords,
    codeWords,
    imageCount: imageMatches.length,
    estimatedTime: readingTime,
    readingSpeed,
  };
}

/**
 * Calculate reading progress percentage
 */
function _calculateReadingProgress(
  scrollTop: number,
  scrollHeight: number,
  clientHeight: number
): number {
  const scrollable = scrollHeight - clientHeight;
  if (scrollable <= 0) return 100;

  const progress = (scrollTop / scrollable) * 100;
  return Math.min(100, Math.max(0, progress));
}
