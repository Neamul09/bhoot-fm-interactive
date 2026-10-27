'use client';

import React, { useState } from 'react';
import { Episode } from '@/types/episode';
import { Flame, ShieldCheck, Code, Info, ChevronDown, Check, Volume2 } from 'lucide-react';

interface ExperienceHeaderProps {
  currentEpisode: Episode;
  allEpisodes: Episode[];
  onSelectEpisode: (episode: Episode) => void;
  onOpenAuthoringModal: () => void;
  audioState: 'running' | 'suspended' | 'uninitialized';
}

export const ExperienceHeader: React.FC<ExperienceHeaderProps> = ({
  currentEpisode,
  allEpisodes,
  onSelectEpisode,
  onOpenAuthoringModal,
  audioState,
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);

  return (
    <header className="relative z-40 w-full px-4 py-3 flex items-center justify-between pointer-events-auto">
      {/* Brand & Title */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/60 border border-stone-800 backdrop-blur-md">
          <Flame className="w-4 h-4 text-amber-500 animate-pulse" />
          <span className="font-serif font-black tracking-wide text-stone-100 text-sm">
            BHOOT FM
          </span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30">
            AUDIO LAB
          </span>
        </div>

        {/* Audio Engine Running Indicator */}
        <div
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/40 border border-stone-800/80 text-[10px] font-mono text-stone-400 backdrop-blur-md"
          title={`Web Audio Engine: ${audioState}`}
        >
          <div
            className={`w-2 h-2 rounded-full ${
              audioState === 'running'
                ? 'bg-emerald-500 animate-ping'
                : 'bg-amber-600'
            }`}
          />
          <span>{audioState === 'running' ? 'Spatial Audio Active' : 'Audio Standby'}</span>
        </div>
      </div>

      {/* Episode Selector Dropdown & Actions */}
      <div className="flex items-center gap-2">
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/60 hover:bg-stone-900 border border-stone-800 text-xs text-stone-200 backdrop-blur-md transition-colors"
          >
            <span className="max-w-[140px] sm:max-w-[220px] truncate font-medium">
              {currentEpisode.bengaliTitle}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
          </button>

          {showDropdown && (
            <div className="absolute right-0 top-full mt-2 w-72 p-2 rounded-xl bg-[#0e1017] border border-stone-800 shadow-2xl flex flex-col gap-1 z-50 text-xs">
              <span className="px-2 py-1 text-[10px] font-mono uppercase text-stone-400">
                Choose Episode • পর্ব নির্বাচন
              </span>
              {allEpisodes.map((ep) => (
                <button
                  key={ep.id}
                  onClick={() => {
                    onSelectEpisode(ep);
                    setShowDropdown(false);
                  }}
                  className={`w-full flex items-start justify-between p-2 rounded-lg text-left transition-colors ${
                    ep.id === currentEpisode.id
                      ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                      : 'hover:bg-stone-800/60 text-stone-300'
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <div className="font-serif font-medium truncate">{ep.bengaliTitle}</div>
                    <div className="text-[11px] text-stone-400 truncate">{ep.title}</div>
                  </div>
                  {ep.id === currentEpisode.id && (
                    <Check className="w-3.5 h-3.5 text-amber-400 mt-1 flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* JSON Schema Authoring Button */}
        <button
          onClick={onOpenAuthoringModal}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-black/60 hover:bg-stone-900 border border-stone-800 text-xs font-mono text-amber-400 backdrop-blur-md transition-colors"
          title="Author or inspect episode JSON synchronization timeline"
        >
          <Code className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Author Episode</span>
        </button>

        {/* Info & Legal Disclaimer Modal Toggle */}
        <button
          onClick={() => setShowInfoModal(true)}
          className="p-2 rounded-xl bg-black/60 hover:bg-stone-900 border border-stone-800 text-stone-400 hover:text-stone-200 backdrop-blur-md transition-colors"
          title="About & Legal Disclaimer"
        >
          <Info className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Info & Legal Disclaimer Modal */}
      {showInfoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-md p-6 rounded-2xl bg-[#0d0f15] border border-stone-800 shadow-2xl space-y-4 text-xs text-stone-300">
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <h3 className="text-sm font-serif font-bold text-stone-100 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-500" />
                Product Architecture & Attribution
              </h3>
              <button
                onClick={() => setShowInfoModal(false)}
                className="text-stone-400 hover:text-stone-200 text-sm"
              >
                ✕
              </button>
            </div>

            <p className="leading-relaxed">
              <strong>Bhoot FM Interactive Experience</strong> transforms real radio storytelling into an immersive sensory journey.
            </p>

            <div className="p-3 rounded-xl bg-stone-950 border border-stone-800/80 space-y-2">
              <div className="font-semibold text-amber-400">Original Recording Policy:</div>
              <p className="text-[11px] text-stone-400 leading-relaxed">
                All episodes play through the official YouTube IFrame Player API. The application preserves YouTube attribution, controls, and policies. It does not download, re-host, or strip audio streams.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-stone-950 border border-stone-800/80 space-y-2">
              <div className="font-semibold text-cyan-400">Spatial Audio Design:</div>
              <p className="text-[11px] text-stone-400 leading-relaxed">
                All environmental audio (monsoon rain, wood creaks, binaural whispers, footsteps) is procedurally generated in real time using the HTML5 Web Audio API and spatialized via 3D Panner nodes linked to camera head tracking.
              </p>
            </div>

            <button
              onClick={() => setShowInfoModal(false)}
              className="w-full py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-medium transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
