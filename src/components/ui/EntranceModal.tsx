'use client';

import React from 'react';
import { Flame, Headphones, Volume2, Sparkles } from 'lucide-react';

interface EntranceModalProps {
  onEnter: (prefer3D: boolean) => void;
  title: string;
  bengaliTitle: string;
}

export const EntranceModal: React.FC<EntranceModalProps> = ({
  onEnter,
  title,
  bengaliTitle,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050608] select-none">
      {/* Background ambient dark glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(217,119,6,0.12)_0%,transparent_70%)] pointer-events-none" />

      <div className="relative w-full max-w-lg p-8 rounded-3xl bg-[#0d0f15]/90 border border-stone-800 shadow-2xl backdrop-blur-2xl flex flex-col items-center text-center animate-in fade-in duration-500">
        {/* Glowing Kupi / Hurricane Lamp Icon */}
        <div className="relative mb-6">
          <div className="absolute -inset-4 bg-amber-500/25 rounded-full blur-xl animate-pulse" />
          <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-b from-amber-600/20 to-stone-900 border border-amber-600/40 flex items-center justify-center shadow-inner">
            <Flame className="w-8 h-8 text-amber-400 animate-pulse" />
          </div>
        </div>

        {/* Branding & Bengali typography */}
        <span className="text-[11px] font-mono uppercase tracking-[0.3em] text-amber-500/90 mb-2">
          IMMERSIVE AUDIO EXPERIENCE
        </span>
        <h1 className="text-3xl font-serif font-black text-stone-100 tracking-tight">
          BHOOT FM
        </h1>
        <p className="text-lg text-amber-200/90 font-serif mt-0.5">
          ভূত এফএম — অলৌকিক আবহ
        </p>

        {/* Episode details */}
        <div className="mt-4 p-3.5 rounded-xl bg-stone-950/70 border border-stone-800/80 text-xs w-full">
          <div className="text-stone-300 font-medium">{title}</div>
          <div className="text-stone-400 font-serif mt-0.5">{bengaliTitle}</div>
        </div>

        {/* Audio gesture explanation */}
        <div className="mt-6 flex items-center gap-3 p-3 rounded-xl bg-stone-900/40 border border-stone-800 text-left text-xs text-stone-300">
          <Headphones className="w-6 h-6 flex-shrink-0 text-cyan-400" />
          <div>
            <span className="font-semibold text-stone-200">Headphones Recommended</span>
            <p className="text-[11px] text-stone-400 mt-0.5">
              Featuring 3D binaural spatial audio: footsteps, creaks, and thunder respond dynamically as you turn your head.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center gap-3 w-full">
          <button
            onClick={() => onEnter(true)}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-sm transition-all shadow-xl shadow-amber-950/50 hover:scale-[1.02] active:scale-[0.98]"
          >
            <Sparkles className="w-4 h-4" />
            <span>Light the Lantern (3D Mode)</span>
          </button>
          <button
            onClick={() => onEnter(false)}
            className="w-full sm:w-auto py-3.5 px-4 rounded-2xl border border-stone-800 hover:border-stone-700 bg-stone-900/50 hover:bg-stone-800/80 text-stone-400 hover:text-stone-200 text-xs font-mono transition-all"
            title="Lightweight 2D mode for low-battery or mobile devices"
          >
            2D Fallback
          </button>
        </div>

        <p className="mt-4 text-[11px] text-stone-400 font-mono">
          Clicking lights the lantern and initializes the Web Audio API engine.
        </p>
      </div>
    </div>
  );
};
