import { NextRequest, NextResponse } from 'next/server';
import { TWITTER_CARD_TYPES, TwitterCardType } from '@/lib/seo/twitter-cards';

export const runtime = 'edge';

/**
 * Twitter Card optimized image generation endpoint
 * Generates images specifically optimized for Twitter Cards
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Extract parameters
    const title = searchParams.get('title') || 'StrayLight';
    const cardType = (searchParams.get('card') ||
      'summary_large_image') as TwitterCardType;
    const author = searchParams.get('author');
    const category = searchParams.get('category');
    const tags = searchParams.get('tags')?.split(',') || [];
    const type = searchParams.get('type') || 'website';

    // Get card specifications
    const cardSpec = TWITTER_CARD_TYPES[cardType];
    if (!cardSpec) {
      throw new Error(`Invalid card type: ${cardType}`);
    }

    // Validate and truncate title for Twitter
    const twitterTitle =
      title.length > 70 ? title.substring(0, 67) + '...' : title;

    // Create Twitter-optimized SVG image
    const svg = generateTwitterCardSVG({
      title: twitterTitle,
      cardType,
      author,
      category,
      tags,
      type,
      width: cardSpec.imageSize.width,
      height: cardSpec.imageSize.height,
    });

    const response = new NextResponse(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Content-Disposition': `inline; filename="twitter-${cardType}-${Date.now()}.svg"`,
      },
    });

    return response;
  } catch (error) {
    console.error('Twitter Card image generation error:', error);

    // Return fallback image on error
    return NextResponse.redirect(
      new URL('/twitter-card-default.jpg', request.url)
    );
  }
}

/**
 * Generate Twitter Card optimized SVG image
 */
function generateTwitterCardSVG({
  title,
  cardType,
  author,
  category,
  tags,
  type: _type,
  width,
  height,
}: {
  title: string;
  cardType: TwitterCardType;
  author?: string | null;
  category?: string | null;
  tags?: string[];
  type: string;
  width: number;
  height: number;
}) {
  // Twitter-specific color schemes
  const twitterColorSchemes = {
    summary: {
      background: 'linear-gradient(135deg, #1da1f2 0%, #0d8bd9 100%)',
      primary: '#1da1f2',
      secondary: '#8899a6',
      accent: '#ffffff',
      text: '#ffffff',
      cardBg: '#15202b',
    },
    summary_large_image: {
      background: 'linear-gradient(135deg, #15202b 0%, #192734 100%)',
      primary: '#1da1f2',
      secondary: '#8899a6',
      accent: '#ffffff',
      text: '#ffffff',
      cardBg: '#1c2938',
    },
    app: {
      background: 'linear-gradient(135deg, #1da1f2 0%, #0d8bd9 100%)',
      primary: '#1da1f2',
      secondary: '#8899a6',
      accent: '#ffffff',
      text: '#ffffff',
      cardBg: '#15202b',
    },
    player: {
      background: 'linear-gradient(135deg, #15202b 0%, #000000 100%)',
      primary: '#1da1f2',
      secondary: '#8899a6',
      accent: '#ffffff',
      text: '#ffffff',
      cardBg: '#000000',
    },
  };

  const colors = twitterColorSchemes[cardType];

  // Calculate responsive font sizes based on card type and dimensions
  const isLargeCard =
    cardType === 'summary_large_image' || cardType === 'player';
  const titleFontSize = isLargeCard
    ? title.length > 40
      ? '36'
      : title.length > 25
        ? '42'
        : '48'
    : title.length > 30
      ? '18'
      : '22';

  const titleLineHeight = isLargeCard
    ? title.length > 40
      ? '40'
      : title.length > 25
        ? '46'
        : '52'
    : title.length > 30
      ? '22'
      : '26';

  // Split title into lines for better formatting
  const maxCharsPerLine = isLargeCard ? 30 : 20;
  const titleLines = splitTextIntoLines(title, maxCharsPerLine);

  // Layout calculations
  const padding = isLargeCard ? 40 : 20;
  const _contentWidth = width - padding * 2;
  const _contentHeight = height - padding * 2;

  const svg = `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          ${
            colors.background.includes('linear-gradient')
              ? colors.background
                  .match(/#[a-fA-F0-9]{6}/g)
                  ?.map(
                    (color, index) =>
                      `<stop offset="${index * 100}%" style="stop-color:${color};stop-opacity:1" />`
                  )
                  .join('') ||
                `<stop offset="0%" style="stop-color:#15202b;stop-opacity:1" />
              <stop offset="100%" style="stop-color:#192734;stop-opacity:1" />`
              : `<stop offset="0%" style="stop-color:${colors.background};stop-opacity:1" />`
          }
        </linearGradient>
        
        <linearGradient id="twitterGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style="stop-color:#1da1f2;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#0d8bd9;stop-opacity:1" />
        </linearGradient>

        <filter id="twitterGlow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge> 
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      <!-- Background -->
      <rect width="100%" height="100%" fill="url(#bgGradient)"/>
      
      <!-- Twitter-style decorative elements -->
      ${
        isLargeCard
          ? `
        <circle cx="${width - 80}" cy="80" r="60" fill="${colors.primary}" opacity="0.1"/>
        <circle cx="80" cy="${height - 80}" r="40" fill="${colors.accent}" opacity="0.1"/>
      `
          : `
        <circle cx="${width - 30}" cy="30" r="20" fill="${colors.primary}" opacity="0.15"/>
      `
      }
      
      <!-- Twitter brand indicator -->
      <rect x="${padding}" y="${padding}" width="${isLargeCard ? '120' : '60'}" height="3" fill="url(#twitterGradient)" rx="2"/>
      
      <!-- Platform indicator -->
      <text x="${padding}" y="${padding + (isLargeCard ? 35 : 25)}" 
            font-family="system-ui, -apple-system, sans-serif" 
            font-size="${isLargeCard ? '16' : '12'}" 
            font-weight="600" 
            fill="${colors.primary}">
        StrayLight
      </text>
      
      <!-- Card type indicator -->
      ${
        cardType !== 'summary'
          ? `
        <text x="${width - padding}" y="${padding + (isLargeCard ? 35 : 25)}" 
              font-family="system-ui, -apple-system, sans-serif" 
              font-size="${isLargeCard ? '12' : '10'}" 
              font-weight="500" 
              fill="${colors.secondary}" 
              text-anchor="end"
              text-transform="uppercase" 
              letter-spacing="1px">
          ${cardType.replace('_', ' ')}
        </text>
      `
          : ''
      }
      
      <!-- Main title -->
      <g transform="translate(${padding}, ${padding + (isLargeCard ? 80 : 50)})">
        ${titleLines
          .map(
            (line, index) => `
          <text x="0" y="${index * parseInt(titleLineHeight)}" 
                font-family="system-ui, -apple-system, sans-serif" 
                font-size="${titleFontSize}" 
                font-weight="800" 
                fill="${colors.text}" 
                filter="url(#twitterGlow)">
            ${escapeXml(line)}
          </text>
        `
          )
          .join('')}
      </g>
      
      <!-- Metadata area -->
      ${
        isLargeCard
          ? `
        <g transform="translate(${padding}, ${height - padding - 60})">
          ${
            author
              ? `
            <text x="0" y="0" 
                  font-family="system-ui, -apple-system, sans-serif" 
                  font-size="14" 
                  font-weight="500" 
                  fill="${colors.secondary}">
              by ${escapeXml(author)}
            </text>
          `
              : ''
          }
          
          ${
            category
              ? `
            <text x="0" y="${author ? '20' : '0'}" 
                  font-family="system-ui, -apple-system, sans-serif" 
                  font-size="12" 
                  font-weight="500" 
                  fill="${colors.primary}">
              ${escapeXml(category)}
            </text>
          `
              : ''
          }
          
          ${
            tags && tags.length > 0
              ? `
            <text x="0" y="${(author ? 20 : 0) + (category ? 20 : 0)}" 
                  font-family="system-ui, -apple-system, sans-serif" 
                  font-size="11" 
                  font-weight="400" 
                  fill="${colors.secondary}">
              ${tags.map((tag) => `#${escapeXml(tag)}`).join(' ')}
            </text>
          `
              : ''
          }
        </g>
      `
          : ''
      }
      
      <!-- Twitter branding -->
      <g transform="translate(${width - padding - 80}, ${height - padding - 20})">
        <!-- Twitter bird icon (simplified) -->
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5.64 7.5c-.29 4.68-2.05 8.83-5.64 10.5-2.02-.57-3.76-1.61-5.12-2.98.34.04.68.06 1.04.06 2.07 0 3.96-.7 5.47-1.89-1.93-.04-3.56-1.31-4.12-3.06.27.05.55.07.84.07.4 0 .8-.05 1.17-.15-2.01-.4-3.52-2.18-3.52-4.31v-.05c.59.33 1.27.53 1.99.55A4.096 4.096 0 0 1 5.7 7.13c0-.73.2-1.41.54-2.01 2.17 2.66 5.41 4.41 9.06 4.59-.07-.31-.11-.64-.11-.98 0-2.37 1.92-4.29 4.29-4.29 1.23 0 2.34.52 3.12 1.36.97-.19 1.89-.55 2.71-1.04-.32.99-.99 1.82-1.87 2.35.86-.1 1.69-.33 2.46-.66-.57.85-1.29 1.6-2.12 2.2z" 
              fill="${colors.primary}" 
              opacity="0.6" 
              transform="scale(0.8)"/>
        
        <text x="25" y="12" 
              font-family="system-ui, -apple-system, sans-serif" 
              font-size="10" 
              font-weight="500" 
              fill="${colors.secondary}">
          Twitter Card
        </text>
      </g>
    </svg>
  `;

  return svg;
}

/**
 * Split text into lines for better formatting
 */
function splitTextIntoLines(text: string, maxLength: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    if (currentLine.length + word.length + 1 <= maxLength) {
      currentLine += (currentLine ? ' ' : '') + word;
    } else {
      if (currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        // Word is too long, split it
        lines.push(word.slice(0, maxLength));
        currentLine = word.slice(maxLength);
      }
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines.slice(0, 3); // Limit to 3 lines
}

/**
 * Escape XML special characters
 */
function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
