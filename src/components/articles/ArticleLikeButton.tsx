'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { voteService } from '@/lib/services/vote-service';
import { cn } from '@/lib/utils';
import SignInPromptModal from '@/components/auth/SignInPromptModal';

interface ArticleLikeButtonProps {
  articleId: string;
  initialLikes?: number;
  className?: string;
  showCount?: boolean;
}

export default function ArticleLikeButton({
  articleId,
  initialLikes = 0,
  className,
  showCount = true,
}: ArticleLikeButtonProps) {
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(initialLikes);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [showSignInModal, setShowSignInModal] = useState(false);

  // Always load public vote counts (works for both authenticated and guest users)
  useEffect(() => {
    let isMounted = true;

    const loadCounts = async () => {
      try {
        const counts = await voteService.getVoteCounts(articleId);
        if (isMounted && counts) {
          setLikeCount(counts.likes);
        }
      } catch (error) {
        console.error('Error loading vote counts:', error);
      } finally {
        if (isMounted && !user) {
          setIsInitializing(false);
        }
      }
    };

    loadCounts();

    return () => {
      isMounted = false;
    };
  }, [articleId, user]);

  // Fetch the authenticated user's vote status (and refresh counts) when logged in
  useEffect(() => {
    if (!user) {
      return;
    }

    let isMounted = true;

    const initializeForUser = async () => {
      try {
        const [userVoteStatus, voteCounts] = await Promise.all([
          voteService.getUserVoteStatus(articleId),
          voteService.getVoteCounts(articleId),
        ]);

        if (!isMounted) {
          return;
        }

        if (userVoteStatus) {
          setIsLiked(userVoteStatus.hasLiked);
        }

        if (voteCounts) {
          setLikeCount(voteCounts.likes);
        }
      } catch (error) {
        console.error('Error initializing like button for user:', error);
      } finally {
        if (isMounted) {
          setIsInitializing(false);
        }
      }
    };

    initializeForUser();

    return () => {
      isMounted = false;
    };
  }, [articleId, user]);

  // Handle like/unlike action
  const handleLikeToggle = async () => {
    // If user is not logged in, show sign-in modal
    if (!user) {
      setShowSignInModal(true);
      return;
    }

    if (isLoading) {
      return;
    }

    const previousLikedState = isLiked;
    const previousCount = likeCount;

    setIsLoading(true);

    try {
      // Optimistic update
      const newLikedState = !previousLikedState;
      setIsLiked(newLikedState);
      setLikeCount((prev) => {
        const next = newLikedState ? prev + 1 : prev - 1;
        return next < 0 ? 0 : next;
      });

      // Make API call using the previous state to determine server action
      const response = await voteService.toggleLike(
        articleId,
        previousLikedState
      );

      if (!response.success) {
        // Revert optimistic update on error
        setIsLiked(previousLikedState);
        setLikeCount(previousCount);
        console.error('Failed to toggle like:', response.error);
        return;
      }

      // Fetch updated counts to ensure consistency/cache invalidation
      const updatedCounts = await voteService.getVoteCounts(articleId);
      if (updatedCounts) {
        setLikeCount(updatedCounts.likes);
      }
    } catch (error) {
      // Revert optimistic update on error
      setIsLiked(previousLikedState);
      setLikeCount(previousCount);
      console.error('Error toggling like:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isInitializing) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <div className="w-8 h-8 rounded-full bg-dark-800/50 animate-pulse" />
        {showCount && (
          <span className="text-sm text-neutral-400 animate-pulse">
            {likeCount}
          </span>
        )}
      </div>
    );
  }

  return (
    <>
      {/* Sign-in prompt modal */}
      <SignInPromptModal
        isOpen={showSignInModal}
        onClose={() => setShowSignInModal(false)}
        action="like this article"
        title="Sign in to like articles"
      />

      <div className={cn('flex items-center gap-2', className)}>
        <button
          onClick={handleLikeToggle}
          disabled={isLoading}
          className={cn(
            'relative group flex items-center justify-center w-8 h-8 rounded-full transition-all duration-200 ease-in-out transform active:scale-95',
            'focus:outline-none focus:ring-2 focus:ring-ai-primary/50',
            {
              // Liked state - pink/red glow
              'bg-gradient-to-r from-pink-500/20 to-red-500/20 border border-pink-500/30 shadow-lg shadow-pink-500/20':
                isLiked,
              'hover:shadow-pink-500/30 hover:border-pink-400/50':
                isLiked && !isLoading && user,

              // Unliked state - neutral
              'bg-dark-800/50 border border-neutral-600/30 hover:border-pink-400/50':
                !isLiked,
              'hover:bg-pink-500/10': !isLiked && !isLoading && user,

              // Disabled state
              'opacity-50 cursor-not-allowed': isLoading,
              // Guest state - still interactive to trigger modal
              'cursor-pointer': !user,
            }
          )}
          aria-label={isLiked ? 'Unlike article' : 'Like article'}
          title={
            !user
              ? 'Sign in to like articles'
              : isLiked
                ? 'Unlike this article'
                : 'Like this article'
          }
        >
          {/* Heart Icon */}
          <svg
            className={cn('w-4 h-4 transition-all duration-200', {
              'text-pink-400 fill-current': isLiked,
              'text-neutral-400 group-hover:text-pink-400': !isLiked && user,
              'text-neutral-500': !user,
            })}
            fill={isLiked ? 'currentColor' : 'none'}
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>

          {/* Loading spinner overlay */}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-3 h-3 border-2 border-pink-400 border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {/* Subtle glow effect when liked - no animation */}
          {isLiked && (
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-pink-500/20 to-red-500/20 blur-sm -z-10 opacity-75" />
          )}
        </button>

        {/* Like count */}
        {showCount && (
          <span
            className={cn(
              'text-sm font-medium transition-colors duration-300',
              {
                'text-pink-400': isLiked,
                'text-neutral-400': !isLiked,
              }
            )}
          >
            {likeCount}
          </span>
        )}
      </div>
    </>
  );
}
