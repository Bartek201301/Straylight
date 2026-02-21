import { NextRequest } from 'next/server';
import { getRelatedArticles } from '@/lib/services/related-articles';
import {
  createSuccessResponse,
  handleAPIError,
  generateRequestId,
} from '@/lib/errors/api-errors';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const requestId = generateRequestId();
  try {
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get('limit');
    const limit = Math.max(1, Math.min(10, Number(limitParam) || 3));

    const items = await getRelatedArticles({ slug: params.slug, limit });
    return createSuccessResponse(items, 'Related articles', requestId);
  } catch (error) {
    return handleAPIError(error, requestId);
  }
}
