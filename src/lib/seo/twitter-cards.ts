import { DEFAULT_METADATA } from './metadata';

/**
 * Twitter Card types and their specifications
 */
export const TWITTER_CARD_TYPES = {
  summary: {
    name: 'summary',
    description: 'Default card with a square image',
    imageSize: { width: 120, height: 120, minWidth: 120, minHeight: 120 },
    maxImageSize: '1MB',
  },
  summary_large_image: {
    name: 'summary_large_image',
    description: 'Large image card for rich visual content',
    imageSize: { width: 1200, height: 630, minWidth: 300, minHeight: 157 },
    maxImageSize: '5MB',
  },
  app: {
    name: 'app',
    description: 'Card for mobile app promotion',
    imageSize: { width: 120, height: 120, minWidth: 120, minHeight: 120 },
    maxImageSize: '1MB',
  },
  player: {
    name: 'player',
    description: 'Card for video/audio content',
    imageSize: { width: 1200, height: 630, minWidth: 300, minHeight: 157 },
    maxImageSize: '5MB',
  },
} as const;

export type TwitterCardType = keyof typeof TWITTER_CARD_TYPES;

/**
 * Generate Twitter Card optimized image URL
 */
function generateTwitterImageUrl({
  title,
  type = 'website',
  author,
  category,
  tags = [],
  cardType = 'summary_large_image',
}: {
  title: string;
  type?: string;
  author?: string;
  category?: string;
  tags?: string[];
  cardType?: TwitterCardType;
}): string {
  const baseUrl = '/api/twitter-card';
  const params = new URLSearchParams({
    title: title.slice(0, 70), // Twitter title limit
    type,
    card: cardType,
  });

  if (author) {
    params.set('author', author);
  }

  if (category) {
    params.set('category', category);
  }

  if (tags.length > 0) {
    params.set('tags', tags.slice(0, 3).join(','));
  }

  return `${baseUrl}?${params.toString()}`;
}

/**
 * Create comprehensive Twitter Card metadata
 */
function createTwitterCard({
  cardType = 'summary_large_image',
  title,
  description,
  image,
  creator,
  site = DEFAULT_METADATA.twitterHandle,
  player,
  app,
}: {
  cardType?: TwitterCardType;
  title: string;
  description: string;
  image?: string;
  creator?: string;
  site?: string;
  url?: string;
  player?: {
    url: string;
    width: number;
    height: number;
    stream?: string;
  };
  app?: {
    name: string;
    id: {
      iphone?: string;
      ipad?: string;
      googleplay?: string;
    };
    country?: string;
  };
}) {
  // Validate and optimize title for Twitter (max 70 characters)
  const twitterTitle =
    title.length > 70 ? title.substring(0, 67) + '...' : title;

  // Validate and optimize description for Twitter (max 200 characters)
  const twitterDescription =
    description.length > 200
      ? description.substring(0, 197) + '...'
      : description;

  const baseCard = {
    card: cardType,
    title: twitterTitle,
    description: twitterDescription,
    creator: creator || DEFAULT_METADATA.twitterHandle,
    site: site || DEFAULT_METADATA.twitterHandle,
  };

  // Add image for visual cards
  if ((cardType === 'summary' || cardType === 'summary_large_image') && image) {
    return {
      ...baseCard,
      images: [
        {
          url: image,
          alt: `${title} - ${DEFAULT_METADATA.siteName}`,
          width: TWITTER_CARD_TYPES[cardType].imageSize.width,
          height: TWITTER_CARD_TYPES[cardType].imageSize.height,
        },
      ],
    };
  }

  // Add player for video/audio cards
  if (cardType === 'player' && player) {
    return {
      ...baseCard,
      players: [
        {
          url: player.url,
          width: player.width,
          height: player.height,
          stream: player.stream,
        },
      ],
      images: image
        ? [
            {
              url: image,
              alt: `${title} - Video Thumbnail`,
              width: TWITTER_CARD_TYPES[cardType].imageSize.width,
              height: TWITTER_CARD_TYPES[cardType].imageSize.height,
            },
          ]
        : undefined,
    };
  }

  // Add app information for app cards
  if (cardType === 'app' && app) {
    return {
      ...baseCard,
      app: {
        name: app.name,
        id: app.id,
        country: app.country || 'US',
      },
    };
  }

  return baseCard;
}

/**
 * Create Twitter Card for articles with enhanced metadata
 */
export function createArticleTwitterCard({
  title,
  description,
  image,
  author,
  readingTime,
  tags = [],
  url,
}: {
  title: string;
  description: string;
  image?: string;
  author?: string;
  publishedTime?: string;
  readingTime?: number;
  tags?: string[];
  url?: string;
}) {
  // Generate dynamic Twitter image if none provided
  const twitterImage =
    image ||
    generateTwitterImageUrl({
      title,
      type: 'article',
      author,
      tags,
      cardType: 'summary_large_image',
    });

  // Enhanced description with reading time
  let enhancedDescription = description;
  if (readingTime) {
    enhancedDescription = `${description} • ${readingTime} min read`;
  }

  return createTwitterCard({
    cardType: 'summary_large_image',
    title,
    description: enhancedDescription,
    image: twitterImage,
    creator: author
      ? `@${author.replace(/\s+/g, '').toLowerCase()}`
      : DEFAULT_METADATA.twitterHandle,
    url,
  });
}

/**
 * Create Twitter Card for website pages
 */
export function createWebsiteTwitterCard({
  title,
  description,
  image,
  category,
  keywords = [],
}: {
  title: string;
  description: string;
  image?: string;
  category?: string;
  keywords?: string[];
}) {
  // Generate dynamic Twitter image if none provided
  const twitterImage =
    image ||
    generateTwitterImageUrl({
      title,
      type: 'website',
      category,
      tags: keywords.slice(0, 3),
      cardType: 'summary_large_image',
    });

  return createTwitterCard({
    cardType: 'summary_large_image',
    title,
    description,
    image: twitterImage,
  });
}

/**
 * Create Twitter Card for video content
 */
function _createVideoTwitterCard({
  title,
  description,
  playerUrl,
  posterImage,
  duration,
  width = 1280,
  height = 720,
}: {
  title: string;
  description: string;
  playerUrl: string;
  posterImage?: string;
  duration?: number;
  width?: number;
  height?: number;
}) {
  // Add duration to description if available
  let enhancedDescription = description;
  if (duration) {
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    enhancedDescription = `${description} • ${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  return createTwitterCard({
    cardType: 'player',
    title,
    description: enhancedDescription,
    image: posterImage,
    player: {
      url: playerUrl,
      width,
      height,
    },
  });
}

/**
 * Create Twitter Card for mobile app promotion
 */
function _createAppTwitterCard({
  title,
  description,
  appName,
  appId,
  icon,
  country = 'US',
}: {
  title: string;
  description: string;
  appName: string;
  appId: {
    iphone?: string;
    ipad?: string;
    googleplay?: string;
  };
  icon?: string;
  country?: string;
}) {
  return createTwitterCard({
    cardType: 'app',
    title,
    description,
    image: icon,
    app: {
      name: appName,
      id: appId,
      country,
    },
  });
}

/**
 * Validate Twitter Card metadata
 */
export function validateTwitterCard(twitterCard: any): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields validation
  if (!twitterCard.card) {
    errors.push('Missing twitter:card');
  } else if (!Object.keys(TWITTER_CARD_TYPES).includes(twitterCard.card)) {
    errors.push(`Invalid card type: ${twitterCard.card}`);
  }

  if (!twitterCard.title) {
    errors.push('Missing twitter:title');
  } else if (twitterCard.title.length > 70) {
    warnings.push(
      'twitter:title is longer than 70 characters (may be truncated)'
    );
  }

  if (!twitterCard.description) {
    warnings.push('Missing twitter:description');
  } else if (twitterCard.description.length > 200) {
    warnings.push(
      'twitter:description is longer than 200 characters (may be truncated)'
    );
  }

  // Card-specific validation
  const cardType = twitterCard.card as TwitterCardType;
  if (cardType && TWITTER_CARD_TYPES[cardType]) {
    const cardSpec = TWITTER_CARD_TYPES[cardType];

    // Image validation for visual cards
    if (
      (cardType === 'summary' || cardType === 'summary_large_image') &&
      twitterCard.images
    ) {
      twitterCard.images.forEach((img: any, index: number) => {
        if (
          img.width < cardSpec.imageSize.minWidth ||
          img.height < cardSpec.imageSize.minHeight
        ) {
          warnings.push(
            `Image ${index} is smaller than recommended size for ${cardType} card`
          );
        }
      });
    }

    // Player validation
    if (cardType === 'player' && !twitterCard.players) {
      errors.push('Player card requires twitter:player');
    }

    // App validation
    if (cardType === 'app' && !twitterCard.app) {
      errors.push('App card requires app information');
    }
  }

  // Site and creator validation
  if (!twitterCard.site) {
    warnings.push('Missing twitter:site (recommended)');
  }

  if (!twitterCard.creator) {
    warnings.push('Missing twitter:creator (recommended)');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Generate Twitter Card debug information
 */
export function getTwitterCardDebugInfo(twitterCard: any): string[] {
  const debugInfo: string[] = [];

  debugInfo.push(`twitter:card: ${twitterCard.card || 'Not set'}`);
  debugInfo.push(`twitter:title: ${twitterCard.title || 'Not set'}`);
  debugInfo.push(
    `twitter:description: ${twitterCard.description || 'Not set'}`
  );
  debugInfo.push(`twitter:site: ${twitterCard.site || 'Not set'}`);
  debugInfo.push(`twitter:creator: ${twitterCard.creator || 'Not set'}`);

  // Images
  if (twitterCard.images?.length > 0) {
    twitterCard.images.forEach((img: any, index: number) => {
      debugInfo.push(`twitter:image:${index}: ${img.url}`);
      debugInfo.push(`twitter:image:alt:${index}: ${img.alt}`);
    });
  } else {
    debugInfo.push('twitter:image: Not set');
  }

  // Player info
  if (twitterCard.players?.length > 0) {
    twitterCard.players.forEach((player: any, index: number) => {
      debugInfo.push(`twitter:player:${index}: ${player.url}`);
      debugInfo.push(`twitter:player:width:${index}: ${player.width}`);
      debugInfo.push(`twitter:player:height:${index}: ${player.height}`);
      if (player.stream) {
        debugInfo.push(`twitter:player:stream:${index}: ${player.stream}`);
      }
    });
  }

  // App info
  if (twitterCard.app) {
    debugInfo.push(`twitter:app:name: ${twitterCard.app.name}`);
    if (twitterCard.app.id.iphone) {
      debugInfo.push(`twitter:app:id:iphone: ${twitterCard.app.id.iphone}`);
    }
    if (twitterCard.app.id.ipad) {
      debugInfo.push(`twitter:app:id:ipad: ${twitterCard.app.id.ipad}`);
    }
    if (twitterCard.app.id.googleplay) {
      debugInfo.push(
        `twitter:app:id:googleplay: ${twitterCard.app.id.googleplay}`
      );
    }
    debugInfo.push(`twitter:app:country: ${twitterCard.app.country || 'US'}`);
  }

  return debugInfo;
}

/**
 * Generate Twitter-specific image with optimal dimensions
 */
function _generateTwitterCardImage({
  title,
  cardType = 'summary_large_image',
  author,
  category,
  tags = [],
}: {
  title: string;
  cardType?: TwitterCardType;
  author?: string;
  category?: string;
  tags?: string[];
}): string {
  const cardSpec = TWITTER_CARD_TYPES[cardType];
  const params = new URLSearchParams({
    title: title.slice(0, 70),
    width: cardSpec.imageSize.width.toString(),
    height: cardSpec.imageSize.height.toString(),
    platform: 'twitter',
    card: cardType,
  });

  if (author) params.set('author', author);
  if (category) params.set('category', category);
  if (tags.length > 0) params.set('tags', tags.join(','));

  return `/api/og?${params.toString()}`;
}
