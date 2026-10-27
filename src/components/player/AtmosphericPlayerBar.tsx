'use client';

import React, { useState } from 'react';
import { TimelineEvent } from '@/types/episode';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Sliders,
  Eye,
  Radio,
  Headphones,
  Maximize2,
  Minimize2,
} from 'lucide-react';

interface AtmosphericPlayerBarProps {
  isPlaying: boolean;
  isBuffering: boolean;
  currentTime: number;
  duration: number;
  events: TimelineEvent[];
  onPlay: () => void;
  onPause: () => void;
  onSeek: (time: number) => void;
  youtubeVolume: number;
  onYoutubeVolumeChange: (vol: number) => void;
  ambientVolume: number;
  onAmbientVolumeChange: (vol: number) => void;
  isMuted: boolean;
  onToggleMute: () => void;
  is3DMode: boolean;
  onToggle3DMode: () => void;
  activeNarrativeHint: { bengali?: string; english?: string } | null;
}

export const AtmosphericPlayerBar: React.FC<AtmosphericPlayerBarProps> = ({
  isPlaying,
  isBuffering,
  currentTime,
  duration,
  events,
  onPlay,
  onPause,
  onSeek,
  youtubeVolume,
  onYoutubeVolumeChange,
  ambientVolume,
  onAmbientVolumeChange,
  isMuted,
  onToggleMute,
  is3DMode,
  onToggle3DMode,
  activeNarrativeHint,
}) => {
  const [showMixer, setShowMixer] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickRatio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const targetTime = clickRatio * (duration || 300);
    onSeek(targetTime);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="relative z-40 w-full flex flex-col items-center select-none pointer-events-auto">
      {/* Narrative Clue / Caption Overlay */}
      {activeNarrativeHint && (
        <div className="mb-3 px-5 py-2.5 rounded-full bg-black/85 border border-amber-600/40 text-center backdrop-blur-md shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-300 max-w-xl mx-auto">
          {activeNarrativeHint.bengali && (
            <p className="text-amber-300 font-serif text-sm tracking-wide">
              {activeNarrativeHint.bengali}
            </p>
          )}
          {activeNarrativeHint.english && (
            <p className="text-stone-400 text-xs mt-0.5 italic">
              {activeNarrativeHint.english}
            </p>
          )}
        </div>
      )}

      {/* Main Control Console */}
      <div className="w-full max-w-4xl px-4 py-3 bg-[#0d0f15]/90 border border-stone-800/90 rounded-2xl backdrop-blur-xl shadow-2xl flex flex-col gap-2.5">
        {/* Interactive Scrubbing Bar with Event Markers */}
        <div className="relative w-full group py-1">
          <div
            onClick={handleTimelineClick}
            className="relative w-full h-2 bg-stone-900 rounded-full overflow-visible cursor-pointer transition-all hover:h-2.5"
          >
            {/* Played Progress Bar */}
            <div
              className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-amber-700 to-amber-500 rounded-full"
              style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
            />

            {/* Event Markers on Timeline */}
            {duration > 0 &&
              events.map((ev) => {
                const markerLeft = (ev.at / duration) * 100;
                if (markerLeft < 0 || markerLeft > 100) return null;
                const isPassed = currentTime >= ev.at;
                return (
                  <div
                    key={ev.id}
                    title={`${ev.label || ev.type} (${formatTime(ev.at)})`}
                    className={`absolute top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full pointer-events-none transition-colors ${
                      isPassed ? 'bg-amber-300' : 'bg-stone-500 group-hover:bg-amber-600/70'
                    }`}
                    style={{ left: `${markerLeft}%` }}
                  />
                );
              })}

            {/* Scrubber Knob */}
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-amber-400 border-2 border-stone-950 rounded-full shadow-md pointer-events-none transition-transform group-hover:scale-125"
              style={{ left: `${Math.min(100, Math.max(0, progressPercent))}%`, transform: 'translate(-50%, -50%)' }}
            />
          </div>
        </div>

        {/* Player Controls Row */}
        <div className="flex items-center justify-between gap-3 text-stone-300">
          {/* Left: Playback & Seek */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onSeek(Math.max(0, currentTime - 15))}
              className="p-1.5 rounded-lg hover:bg-stone-800 text-stone-400 hover:text-stone-200 transition-colors"
              title="Seek back 15 seconds"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={isPlaying ? onPause : onPlay}
              disabled={isBuffering}
              className="p-2.5 rounded-full bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold transition-all shadow-md shadow-amber-950/40 disabled:opacity-50"
              title={isPlaying ? 'Pause Episode' : 'Play Episode'}
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
            </button>

            <button
              onClick={() => onSeek(Math.min(duration || 300, currentTime + 15))}
              className="p-1.5 rounded-lg hover:bg-stone-800 text-stone-400 hover:text-stone-200 transition-colors"
              title="Seek forward 15 seconds"
            >
              <RotateCw className="w-4 h-4" />
            </button>

            <div className="text-xs font-mono text-stone-400 ml-1">
              <span>{formatTime(currentTime)}</span>
              <span className="text-stone-600 mx-1">/</span>
              <span>{formatTime(duration)}</span>
            </div>

            {isBuffering && (
              <span className="text-[10px] text-amber-500 animate-pulse font-mono ml-2">
                Buffering...
              </span>
            )}
          </div>

          {/* Right: Audio Mixers & View Options */}
          <div className="flex items-center gap-2">
            {/* Audio Mixer Toggle */}
            <div className="relative">
              <button
                onClick={() => setShowMixer(!showMixer)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono border transition-all ${
                  showMixer
                    ? 'border-amber-500/70 bg-amber-500/10 text-amber-400'
                    : 'border-stone-800 hover:border-stone-700 bg-stone-900/60 text-stone-400'
                }`}
                title="Independent Audio Mixers"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Mixer</span>
              </button>

              {/* Popover Mixer */}
              {showMixer && (
                <div className="absolute right-0 bottom-full mb-3 w-64 p-4 rounded-xl bg-[#0c0e14] border border-stone-800 shadow-2xl flex flex-col gap-3.5 text-xs font-mono">
                  <div className="flex items-center justify-between pb-2 border-b border-stone-800">
                    <span className="text-stone-300 font-semibold">Dual Sound Engine</span>
                    <button
                      onClick={onToggleMute}
                      className="p-1 text-stone-400 hover:text-stone-200"
                      title={isMuted ? 'Unmute' : 'Mute'}
                    >
                      {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* YouTube Episode Audio */}
                  <div>
                    <div className="flex items-center justify-between text-stone-400 mb-1">
                      <span className="flex items-center gap-1 text-[11px]">
                        <Radio className="w-3 h-3 text-red-400" />
                        Original Episode (YouTube)
                      </span>
                      <span>{Math.round(youtubeVolume)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={youtubeVolume}
                      onChange={(e) => onYoutubeVolumeChange(Number(e.target.value))}
                      className="w-full accent-amber-500 cursor-pointer h-1.5 bg-stone-800 rounded-lg"
                    />
                  </div>

                  {/* Spatial Environmental Audio */}
                  <div>
                    <div className="flex items-center justify-between text-stone-400 mb-1">
                      <span className="flex items-center gap-1 text-[11px]">
                        <Headphones className="w-3 h-3 text-cyan-400" />
                        3D Environment & SFX
                      </span>
                      <span>{Math.round(ambientVolume)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={ambientVolume}
                      onChange={(e) => onAmbientVolumeChange(Number(e.target.value))}
                      className="w-full accent-cyan-500 cursor-pointer h-1.5 bg-stone-800 rounded-lg"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Toggle 3D vs 2D Fallback */}
            <button
              onClick={onToggle3DMode}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-mono border transition-all ${
                is3DMode
                  ? 'border-cyan-800 bg-cyan-950/40 text-cyan-300 hover:bg-cyan-900/40'
                  : 'border-stone-800 bg-stone-900/60 text-stone-400 hover:bg-stone-800'
              }`}
              title="Toggle 3D WebGL vs 2D Fallback"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{is3DMode ? '3D' : '2D'}</span>
            </button>

            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className="p-1.5 rounded-lg border border-stone-800 hover:bg-stone-800 text-stone-400 hover:text-stone-200 transition-colors"
              title="Toggle Fullscreen"
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
