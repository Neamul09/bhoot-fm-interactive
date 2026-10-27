'use client';

import React from 'react';
import { InteractableObject } from '@/types/episode';
import { X, Sparkles, Volume2 } from 'lucide-react';

interface InspectDrawerProps {
  object: InteractableObject | null;
  onClose: () => void;
  onTriggerObjectAction: (actionType: string) => void;
}

export const InspectDrawer: React.FC<InspectDrawerProps> = ({
  object,
  onClose,
  onTriggerObjectAction,
}) => {
  if (!object) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm transition-opacity">
      <div
        className="relative w-full max-w-lg bg-[#0e1017] border border-stone-800 rounded-2xl shadow-2xl p-6 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Amber corner accent */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-600/10 rounded-full blur-2xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-stone-800/80">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-widest text-amber-500/90">
              Environmental Inspection • পর্যবেক্ষণ
            </span>
            <h2 className="text-xl font-serif font-bold text-stone-100 mt-1">
              {object.name}
            </h2>
            <p className="text-sm text-stone-400 font-serif">
              {object.bengaliName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-stone-400 hover:text-stone-200 hover:bg-stone-800/60 transition-colors"
            aria-label="Close inspection"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          <div className="p-4 rounded-xl bg-stone-900/50 border border-stone-800/60 text-sm leading-relaxed text-stone-300">
            <h4 className="font-semibold text-stone-200 mb-1">
              {object.details.title}
            </h4>
            <p>{object.details.content}</p>

            {object.details.bengaliContent && (
              <p className="mt-3 pt-3 border-t border-stone-800 text-stone-300 font-serif">
                {object.details.bengaliContent}
              </p>
            )}
          </div>

          {object.details.lore && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-950/20 border border-amber-900/30 text-xs text-amber-300/90 italic">
              <Sparkles className="w-4 h-4 flex-shrink-0 text-amber-400 mt-0.5" />
              <span>&ldquo;{object.details.lore}&rdquo;</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-stone-800/80 flex items-center justify-between gap-3">
          <button
            onClick={() => onTriggerObjectAction(object.type)}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-amber-600/90 hover:bg-amber-500 text-stone-950 font-medium text-sm transition-colors shadow-lg shadow-amber-950/50"
          >
            <Volume2 className="w-4 h-4" />
            <span>{object.actionPrompt}</span>
          </button>
          <button
            onClick={onClose}
            className="py-2.5 px-4 rounded-xl border border-stone-800 text-stone-300 hover:bg-stone-800 text-sm transition-colors"
          >
            Leave
          </button>
        </div>
      </div>
    </div>
  );
};
