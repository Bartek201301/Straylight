import React from 'react';

export default function ChatSkeleton() {
  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Chat button skeleton */}
      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-ai-teal-500/20 to-ai-purple-500/20 animate-pulse border border-white/10 flex items-center justify-center">
        {/* Chat icon placeholder */}
        <div className="w-6 h-6 bg-white/20 rounded animate-pulse"></div>
      </div>

      {/* Loading tooltip */}
      <div className="absolute bottom-16 right-0 mb-2 px-3 py-2 bg-black/80 text-white text-xs rounded-lg border border-white/10 opacity-70">
        Loading chat...
      </div>
    </div>
  );
}
