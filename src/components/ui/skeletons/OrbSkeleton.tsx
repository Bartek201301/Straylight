import React from 'react';

export default function OrbSkeleton() {
  return (
    <div className="w-full h-full flex items-center justify-center">
      {/* Orb placeholder with pulsing animation */}
      <div className="relative">
        {/* Main orb shape */}
        <div className="w-96 h-96 md:w-[500px] md:h-[500px] lg:w-[600px] lg:h-[600px] rounded-full bg-gradient-to-br from-ai-teal-500/20 via-neutral-800/30 to-ai-purple-500/20 animate-pulse border border-white/10">
          {/* Inner glow effect */}
          <div className="absolute inset-4 rounded-full bg-gradient-to-br from-ai-teal-500/10 to-ai-purple-500/10 blur-xl animate-pulse"></div>

          {/* Center dot */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-white/30 rounded-full animate-ping"></div>
        </div>

        {/* Loading text */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white/60 text-sm font-medium">
          Loading 3D experience...
        </div>
      </div>
    </div>
  );
}
