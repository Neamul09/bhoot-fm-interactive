'use client';

import React, { useState } from 'react';
import { ExternalLink, AlertCircle, Eye, EyeOff } from 'lucide-react';

interface YouTubeEmbedContainerProps {
  containerId: string;
  videoId: string;
  errorMessage: string | null;
  onRetryWithFallback: () => void;
}

export const YouTubeEmbedContainer: React.FC<YouTubeEmbedContainerProps> = ({
  containerId,
  videoId,
  errorMessage,
  onRetryWithFallback,
}) => {
  const [isMinimized, setIsMinimized] = useState(true);

  return (
    <aside
      aria-label="YouTube Episode Player"
      className={`fixed bottom-24 right-4 z-40 transition-all duration-300 pointer-events-auto ${
        isMinimized ? 'w-48 sm:w-56' : 'w-72 sm:w-80'
      }`}
    >
      <div className="rounded-2xl border border-stone-800 bg-[#0d0f15]/95 shadow-2xl backdrop-blur-xl overflow-hidden flex flex-col">
        {/* Title bar */}
        <div className="flex items-center justify-between px-3 py-1.5 bg-stone-950/80 border-b border-stone-800 text-[11px] font-mono text-stone-400">
          <span className="flex items-center gap-1.5 truncate">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            YouTube Source
          </span>
          <div className="flex items-center gap-1">
            <a
              href={`https://www.youtube.com/watch?v=${videoId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1 hover:text-stone-200"
              title="Open video on YouTube"
            >
              <ExternalLink className="w-3 h-3" />
            </a>
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1 hover:text-stone-200"
              title={isMinimized ? 'Expand Video' : 'Minimize Video'}
            >
              {isMinimized ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            </button>
          </div>
        </div>

        {/* Video Frame Container */}
        <div className={`relative w-full transition-all duration-300 ${isMinimized ? 'h-28' : 'h-48'}`}>
          <div id={containerId} className="w-full h-full" />

          {/* Error Message Overlay */}
          {errorMessage && (
            <div className="absolute inset-0 p-3 bg-black/90 flex flex-col items-center justify-center text-center text-xs space-y-2">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <p className="text-[11px] text-stone-300 leading-tight">
                {errorMessage}
              </p>
              <button
                onClick={onRetryWithFallback}
                className="py-1 px-3 rounded-lg bg-amber-600 hover:bg-amber-500 text-stone-950 text-[11px] font-semibold transition-colors"
              >
                Use Verified Stream
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
