'use client';

import React from 'react';
import { AffiliateLibraryRow } from '@/lib/types/affiliate-library';
import AffiliateLibraryCard from '@/components/affiliate/AffiliateLibraryCard';

interface EnhancedRecommendationCardProps {
  item: AffiliateLibraryRow;
  personalizedGuidance?: string;
  position?: number;
  onCardClick?: (_itemId: string) => void;
}

/**
 * Enhanced Recommendation Card
 * Displays an affiliate library card with personalized AI-generated guidance below
 * Used in quiz results to show tool recommendations with custom user-specific advice
 */
export default function EnhancedRecommendationCard({
  item,
  personalizedGuidance,
  position,
  onCardClick,
}: EnhancedRecommendationCardProps) {
  return (
    <div className="space-y-4">
      {/* Standard affiliate card */}
      <AffiliateLibraryCard
        item={item}
        source="recommendation"
        position={position}
        onCardClick={onCardClick}
      />

      {/* Personalized guidance section */}
      {personalizedGuidance && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
          <div className="flex items-start gap-3">
            {/* Icon */}
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-ai-teal-500 to-ai-purple-500 flex items-center justify-center">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>

            {/* Content */}
            <div className="flex-1 space-y-1">
              <h4 className="text-sm font-semibold text-white font-inter">
                Twoja spersonalizowana porada
              </h4>
              <p className="text-sm text-white/80 font-source leading-relaxed">
                {personalizedGuidance}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
