import { NextRequest, NextResponse } from 'next/server';
import { OG_IMAGE_CONFIG } from '@/lib/seo/opengraph';

export const runtime = 'edge';

/**
 * Dynamic Open Graph image generation endpoint
 * Generates PNG images for social media sharing
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Extract parameters
    const title = searchParams.get('title') || 'StrayLight';
    const type = searchParams.get('type') || 'og-website';
    const author = searchParams.get('author');
    const category = searchParams.get('category');
    const tags = searchParams.get('tags')?.split(',') || [];

    // Validate title length
    const displayTitle =
      title.length > 60 ? title.substring(0, 57) + '...' : title;

    // Create SVG-based Open Graph image
    const svg = generateOGImageSVG({
      title: displayTitle,
      type,
      author,
      category,
      tags,
    });

    // Convert SVG to PNG (for production, you might want to use a proper image generation library)
    const response = new NextResponse(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Content-Disposition': `inline; filename="og-${type}-${Date.now()}.svg"`,
      },
    });

    return response;
  } catch (error) {
    console.error('OG Image generation error:', error);

    // Return fallback image on error
    return NextResponse.redirect(new URL('/og-default.jpg', request.url));
  }
}

/**
 * Generate SVG-based Open Graph image
 */
function generateOGImageSVG({
  title,
  type,
  author,
  category,
  tags,
}: {
  title: string;
  type: string;
  author?: string | null;
  category?: string | null;
  tags?: string[];
}) {
  // Color scheme based on type
  const colorSchemes = {
    'og-article': {
      background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
      primary: '#3b82f6',
      secondary: '#64748b',
      accent: '#f59e0b',
      text: '#f8fafc',
    },
    'og-website': {
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      primary: '#6366f1',
      secondary: '#64748b',
      accent: '#10b981',
      text: '#f8fafc',
    },
    'og-book': {
      background: 'linear-gradient(135deg, #7c2d12 0%, #451a03 100%)',
      primary: '#f97316',
      secondary: '#a3a3a3',
      accent: '#fbbf24',
      text: '#fef7ed',
    },
    'og-profile': {
      background: 'linear-gradient(135deg, #581c87 0%, #3b0764 100%)',
      primary: '#a855f7',
      secondary: '#a3a3a3',
      accent: '#ec4899',
      text: '#faf5ff',
    },
  };

  const colors =
    colorSchemes[type as keyof typeof colorSchemes] ||
    colorSchemes['og-website'];

  // Calculate font sizes based on title length
  const titleFontSize =
    title.length > 40 ? '42' : title.length > 25 ? '48' : '56';
  const titleLineHeight =
    title.length > 40 ? '46' : title.length > 25 ? '52' : '60';

  // Split title into lines for better formatting
  const titleLines = splitTextIntoLines(title, 30);

  const svg = `
    <svg width="${OG_IMAGE_CONFIG.width}" height="${OG_IMAGE_CONFIG.height}" viewBox="0 0 ${OG_IMAGE_CONFIG.width} ${OG_IMAGE_CONFIG.height}" xmlns="http://www.w3.org/2000/svg">
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
                `<stop offset="0%" style="stop-color:#0f172a;stop-opacity:1" />
              <stop offset="100%" style="stop-color:#1e293b;stop-opacity:1" />`
              : `<stop offset="0%" style="stop-color:${colors.background};stop-opacity:1" />`
          }
        </linearGradient>
        
        <linearGradient id="accentGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style="stop-color:${colors.primary};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${colors.accent};stop-opacity:1" />
        </linearGradient>

        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge> 
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      <!-- Background -->
      <rect width="100%" height="100%" fill="url(#bgGradient)"/>
      
      <!-- Decorative elements -->
      <circle cx="1050" cy="150" r="100" fill="${colors.primary}" opacity="0.1"/>
      <circle cx="150" cy="500" r="80" fill="${colors.accent}" opacity="0.1"/>
      
      <!-- Brand area -->
      <rect x="60" y="60" width="200" height="4" fill="url(#accentGradient)" rx="2"/>
      <text x="60" y="110" font-family="system-ui, -apple-system, sans-serif" font-size="24" font-weight="700" fill="${colors.text}">
        StrayLight
      </text>
      
      <!-- Type indicator -->
      ${
        type !== 'og-website'
          ? `
        <rect x="60" y="130" width="auto" height="24" fill="${colors.primary}" opacity="0.2" rx="12"/>
        <text x="72" y="147" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="600" fill="${colors.primary}" text-transform="uppercase" letter-spacing="1px">
          ${type.replace('og-', '')}
        </text>
      `
          : ''
      }
      
      <!-- Main title -->
      <g transform="translate(60, ${type !== 'og-website' ? '200' : '180'})">
        ${titleLines
          .map(
            (line, index) => `
          <text x="0" y="${index * parseInt(titleLineHeight)}" 
                font-family="system-ui, -apple-system, sans-serif" 
                font-size="${titleFontSize}" 
                font-weight="800" 
                fill="${colors.text}" 
                filter="url(#glow)">
            ${escapeXml(line)}
          </text>
        `
          )
          .join('')}
      </g>
      
      <!-- Metadata area -->
      <g transform="translate(60, ${OG_IMAGE_CONFIG.height - 120})">
        ${
          author
            ? `
          <text x="0" y="0" font-family="system-ui, -apple-system, sans-serif" font-size="16" font-weight="500" fill="${colors.secondary}">
            By ${escapeXml(author)}
          </text>
        `
            : ''
        }
        
        ${
          category
            ? `
          <text x="0" y="${author ? '25' : '0'}" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="500" fill="${colors.accent}">
            ${escapeXml(category)}
          </text>
        `
            : ''
        }
        
        ${
          tags && tags.length > 0
            ? `
          <text x="0" y="${(author ? 25 : 0) + (category ? 25 : 0)}" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="400" fill="${colors.secondary}">
            ${tags?.map((tag) => `#${escapeXml(tag)}`).join(' ') || ''}
          </text>
        `
            : ''
        }
      </g>
      
      <!-- Footer brand -->
      <text x="${OG_IMAGE_CONFIG.width - 60}" y="${OG_IMAGE_CONFIG.height - 30}" 
            font-family="system-ui, -apple-system, sans-serif" 
            font-size="14" 
            font-weight="500" 
            fill="${colors.secondary}" 
            text-anchor="end">
        straylight.ai
      </text>
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
