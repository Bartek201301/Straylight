# Affiliate Link Configuration Guide

This guide explains how to configure affiliate programs for automatic URL injection in the StrayLight library system.

## Overview

The affiliate link injection system automatically detects product URLs and injects your affiliate IDs to monetize book and tool recommendations. The system supports multiple platforms and provides comprehensive tracking and analytics.

## Supported Platforms

### Amazon Associates

- **Domains**: amazon.com, amazon.co.uk, amazon.ca, amazon.de, amazon.fr, amazon.it, amazon.es, amazon.co.jp, amazon.com.au, amazon.in, amazon.com.br, amazon.com.mx, amazon.nl, amazon.se, amazon.sg
- **Parameter**: `tag`
- **Sign up**: [Amazon Associates Program](https://affiliate-program.amazon.com)

### Barnes & Noble Affiliate Program

- **Domains**: barnesandnoble.com, bn.com
- **Parameter**: `affiliateId`
- **Sign up**: [Barnes & Noble Affiliates](https://www.barnesandnoble.com/affiliates/)

### Gumroad Affiliate Program

- **Domains**: gumroad.com, \*.gumroad.com
- **Parameter**: `a`
- **Sign up**: [Gumroad Affiliates](https://gumroad.com/affiliates)

### Paddle Affiliate Program

- **Domains**: paddle.com
- **Parameter**: `vendor`
- **Sign up**: [Paddle Affiliate Program](https://paddle.com/affiliate-program/)

### Lemon Squeezy Affiliate Program

- **Domains**: lemonsqueezy.com
- **Parameter**: `aff`
- **Sign up**: [Lemon Squeezy Affiliates](https://lemonsqueezy.com/affiliates)

## Environment Variables

Add these environment variables to your `.env.local` file:

```bash
# Amazon Associates Program
AMAZON_ASSOCIATE_ID=your-amazon-associate-id-20
NEXT_PUBLIC_AMAZON_ASSOCIATE_ID=your-amazon-associate-id-20

# Barnes & Noble Affiliate Program
BARNES_NOBLE_AFFILIATE_ID=your-bn-affiliate-id
NEXT_PUBLIC_BARNES_NOBLE_AFFILIATE_ID=your-bn-affiliate-id

# Gumroad Affiliate Program
GUMROAD_AFFILIATE_ID=your-gumroad-affiliate-id
NEXT_PUBLIC_GUMROAD_AFFILIATE_ID=your-gumroad-affiliate-id

# Paddle Affiliate Program
PADDLE_AFFILIATE_ID=your-paddle-vendor-id
NEXT_PUBLIC_PADDLE_AFFILIATE_ID=your-paddle-vendor-id

# Lemon Squeezy Affiliate Program
LEMONSQUEEZY_AFFILIATE_ID=your-lemonsqueezy-affiliate-id
NEXT_PUBLIC_LEMONSQUEEZY_AFFILIATE_ID=your-lemonsqueezy-affiliate-id

# Affiliate Integration Settings
NEXT_PUBLIC_AUTO_INJECT_AFFILIATES=true
AFFILIATE_FORCE_REPLACE=false
```

## Configuration Options

### Auto Injection

- **Variable**: `NEXT_PUBLIC_AUTO_INJECT_AFFILIATES`
- **Default**: `true`
- **Description**: Automatically inject affiliate IDs in API responses

### Force Replace

- **Variable**: `AFFILIATE_FORCE_REPLACE`
- **Default**: `false`
- **Description**: Replace existing affiliate parameters with your own

### Logging

- **Variable**: `NODE_ENV`
- **Values**: `development` (enables logging), `production` (disables logging)
- **Description**: Log affiliate injection activities in development mode

## Usage Examples

### Automatic URL Processing

When you add items to the affiliate library, URLs are automatically processed:

```typescript
// Original URL
const originalUrl = 'https://www.amazon.com/dp/B08N5WRWNW';

// Automatically becomes (with your affiliate ID)
const processedUrl =
  'https://www.amazon.com/dp/B08N5WRWNW?tag=your-amazon-id-20';
```

### Manual URL Processing

You can also manually process URLs:

```typescript
import { injectAffiliateId } from '@/lib/affiliate';

const url = 'https://www.amazon.com/dp/B08N5WRWNW';
const affiliateUrl = injectAffiliateId(url);
```

### Batch Processing

Process multiple URLs at once:

```typescript
import { injectAffiliateIdsInBatch } from '@/lib/affiliate';

const urls = [
  'https://www.amazon.com/dp/B08N5WRWNW',
  'https://gumroad.com/l/some-product',
  'https://barnesandnoble.com/w/book/123456',
];

const results = injectAffiliateIdsInBatch(urls);
```

## API Integration

### Get Library Items with Affiliate URLs

```bash
# Get all items with processed affiliate URLs
GET /api/affiliate-library

# Include affiliate metadata
GET /api/affiliate-library?include_metadata=true
```

### Track Clicks

```bash
# Track affiliate link clicks
POST /api/affiliate-library/[id]/click
```

## Platform-Specific Notes

### Amazon

- Supports all international Amazon domains
- Automatically removes existing affiliate parameters
- Validates product URLs (must contain `/dp/` or `/gp/product/`)
- Requires Amazon Associates account approval

### Barnes & Noble

- Works with both barnesandnoble.com and bn.com
- Validates book URLs (must contain `/w/` or `/product/`)

### Gumroad

- Supports main domain and creator subdomains
- Works with direct product links (`/l/product-name`)

### Paddle & Lemon Squeezy

- Primarily for software and digital products
- Works with checkout and purchase URLs

## Testing

Use the affiliate injection test component to verify your configuration:

1. Navigate to `/test` (in development)
2. Add the `AffiliateInjectionTest` component
3. Test URLs with your configured affiliate IDs

## Troubleshooting

### URLs Not Processing

1. Check environment variables are set correctly
2. Verify URL format matches platform requirements
3. Ensure platform is supported

### Missing Affiliate IDs

1. Check console warnings in development mode
2. Verify environment variable names match exactly
3. Restart development server after adding new variables

### Click Tracking Issues

1. Ensure database migrations are applied
2. Check API permissions for click tracking endpoint
3. Verify affiliate_library table exists

## Analytics

Track affiliate performance with the analytics utilities:

```typescript
import { createAffiliateAnalytics } from '@/lib/affiliate-integration';

const analytics = createAffiliateAnalytics(libraryItems);
console.log(analytics.platforms); // Platform performance
console.log(analytics.top_performers); // Best performing items
```

## Security Considerations

1. **Environment Variables**: Never commit actual affiliate IDs to version control
2. **Rate Limiting**: Implement rate limiting for click tracking endpoints
3. **Validation**: Always validate URLs before processing
4. **Logging**: Avoid logging sensitive affiliate information in production

## Legal Compliance

1. **Disclosure**: Always disclose affiliate relationships to users
2. **Terms**: Follow each platform's affiliate program terms
3. **Privacy**: Update privacy policy to mention affiliate tracking
4. **Compliance**: Ensure compliance with FTC guidelines and local laws

## Support

For issues with the affiliate system:

1. Check the configuration status in the test component
2. Review console logs in development mode
3. Verify all required environment variables are set
4. Test with sample URLs first before production use
