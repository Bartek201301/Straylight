import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getSupabaseAdmin } from '@/lib/supabase';
import type { PublicProfile, Article } from '@/lib/supabase';
import ClientWrapper from './_components/ClientWrapper';

// Interface for page params
interface ProfilePageParams {
  handle: string;
}

interface ProfilePageProps {
  params: ProfilePageParams;
}

// Fetch user profile by handle
async function getUserProfile(handle: string): Promise<PublicProfile | null> {
  try {
    const { data, error } = await getSupabaseAdmin().rpc(
      'get_user_profile_by_handle',
      { user_handle: handle }
    );

    if (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }

    if (!data || data.length === 0) {
      return null;
    }

    const profile = data[0];

    // Get total likes for this user (count upvotes directly)
    // First get all published article IDs for this user
    const { data: userArticles } = await getSupabaseAdmin()
      .from('articles')
      .select('id')
      .eq('author_id', profile.id)
      .eq('status', 'published');

    let totalLikes = 0;
    if (userArticles && userArticles.length > 0) {
      const articleIds = userArticles.map((a) => a.id);

      // Count upvotes on those articles
      const { count } = await getSupabaseAdmin()
        .from('votes')
        .select('*', { count: 'exact', head: true })
        .eq('vote_type', 'upvote')
        .eq('item_type', 'article')
        .in('item_id', articleIds);

      totalLikes = count || 0;
    }

    return {
      ...profile,
      total_likes: totalLikes,
    };
  } catch (err) {
    console.error('Unexpected error fetching profile:', err);
    return null;
  }
}

// Fetch user's published articles
async function getUserArticles(userId: string): Promise<Article[]> {
  try {
    const { data: articles, error } = await getSupabaseAdmin()
      .from('articles')
      .select('*')
      .eq('author_id', userId)
      .eq('status', 'published')
      .order('published_at', { ascending: false });

    if (error) {
      console.error('Error fetching user articles:', error);
      return [];
    }

    return articles || [];
  } catch (err) {
    console.error('Unexpected error fetching articles:', err);
    return [];
  }
}

// Generate metadata for profile pages
export async function generateMetadata({
  params,
}: ProfilePageProps): Promise<Metadata> {
  const profile = await getUserProfile(params.handle);

  if (!profile) {
    return {
      title: 'User Not Found - StrayLight',
      description: 'The requested user profile could not be found.',
    };
  }

  const displayName = profile.display_name || profile.handle;
  const title = `${displayName} (@${profile.handle}) - StrayLight`;
  const description = profile.bio
    ? `${profile.bio} - View ${displayName}'s articles and profile on StrayLight.`
    : `View ${displayName}'s profile and articles on StrayLight. Member since ${new Date(profile.created_at).toLocaleDateString()}.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'profile',
      url: `https://straylight.com/profile/${profile.handle}`,
      images: profile.avatar_url
        ? [
            {
              url: profile.avatar_url,
              width: 400,
              height: 400,
              alt: `${displayName}'s profile picture`,
            },
          ]
        : [],
    },
    twitter: {
      card: 'summary',
      title,
      description,
      images: profile.avatar_url ? [profile.avatar_url] : [],
    },
  };
}

// Main profile page component
export default async function ProfilePage({ params }: ProfilePageProps) {
  const profile = await getUserProfile(params.handle);

  if (!profile) {
    notFound();
  }

  const articles = await getUserArticles(profile.id);

  return (
    <>
      {/* JSON-LD structured data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Person',
            name: profile.display_name || profile.handle,
            alternateName: profile.handle,
            description: profile.bio,
            url: `https://straylight.com/profile/${profile.handle}`,
            image: profile.avatar_url,
            sameAs: Object.entries(profile.social_links || {})
              .filter(([_, url]) => url)
              .map(([_, url]) => url),
            worksFor: {
              '@type': 'Organization',
              name: 'StrayLight',
            },
            alumniOf: profile.location
              ? {
                  '@type': 'Place',
                  name: profile.location,
                }
              : undefined,
          }),
        }}
      />

      <ClientWrapper profile={profile} articles={articles} />
    </>
  );
}
