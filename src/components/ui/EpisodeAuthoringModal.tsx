'use client';

import React, { useState } from 'react';
import { Episode } from '@/types/episode';
import { validateEpisode, ValidationResult } from '@/lib/validateEpisode';
import { X, CheckCircle, AlertTriangle, Download, Code, Play } from 'lucide-react';

interface EpisodeAuthoringModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadCustomEpisode: (episode: Episode) => void;
  currentEpisode: Episode;
}

export const EpisodeAuthoringModal: React.FC<EpisodeAuthoringModalProps> = ({
  isOpen,
  onClose,
  onLoadCustomEpisode,
  currentEpisode,
}) => {
  const [jsonText, setJsonText] = useState<string>(() => JSON.stringify(currentEpisode, null, 2));
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);

  if (!isOpen) return null;

  const handleValidate = () => {
    try {
      const parsed = JSON.parse(jsonText);
      const res = validateEpisode(parsed);
      setValidationResult(res);
      return res.isValid ? parsed : null;
    } catch (e: any) {
      setValidationResult({
        isValid: false,
        errors: [`JSON Syntax Error: ${e.message}`],
        warnings: [],
      });
      return null;
    }
  };

  const handleApply = () => {
    const validData = handleValidate();
    if (validData) {
      onLoadCustomEpisode(validData as Episode);
      onClose();
    }
  };

  const handleDownloadTemplate = () => {
    const blob = new Blob([jsonText], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bhoot-fm-episode-schema.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-3xl bg-[#0c0e14] border border-stone-800 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-stone-800">
          <div className="flex items-center gap-2.5">
            <Code className="w-5 h-5 text-amber-500" />
            <div>
              <h2 className="text-lg font-serif font-bold text-stone-100">
                Episode Authoring & JSON Schema
              </h2>
              <p className="text-xs text-stone-400">
                Author, inspect, or paste custom Bhoot FM episodes and synchronization timelines
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-stone-200 rounded-lg hover:bg-stone-800/60"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Editor Body */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-stone-400">
              Episode Definition Schema (JSON)
            </span>
            <button
              onClick={handleDownloadTemplate}
              className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 font-mono transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Template</span>
            </button>
          </div>

          <textarea
            value={jsonText}
            onChange={(e) => {
              setJsonText(e.target.value);
              setValidationResult(null);
            }}
            rows={15}
            className="w-full p-3 font-mono text-xs bg-stone-950 border border-stone-800 rounded-xl text-stone-300 focus:outline-none focus:border-amber-600/70 resize-y"
            placeholder="Paste episode JSON here..."
          />

          {/* Validation Feedback */}
          {validationResult && (
            <div
              className={`p-4 rounded-xl border text-xs space-y-2 ${
                validationResult.isValid
                  ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-300'
                  : 'bg-red-950/20 border-red-800/40 text-red-300'
              }`}
            >
              <div className="flex items-center gap-2 font-medium">
                {validationResult.isValid ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    <span>Schema validation successful. Episode is ready to load!</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                    <span>Validation errors found:</span>
                  </>
                )}
              </div>

              {validationResult.errors.length > 0 && (
                <ul className="list-disc list-inside space-y-1 text-red-400 pl-1 font-mono">
                  {validationResult.errors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              )}

              {validationResult.warnings.length > 0 && (
                <div className="pt-2 border-t border-stone-800/60 text-amber-300 font-mono">
                  <div className="font-semibold mb-1">Warnings:</div>
                  <ul className="list-disc list-inside space-y-0.5 pl-1">
                    {validationResult.warnings.map((warn, i) => (
                      <li key={i}>{warn}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-stone-800 bg-stone-950/40">
          <button
            onClick={handleValidate}
            className="py-2 px-4 rounded-xl border border-stone-700 text-stone-200 text-xs hover:bg-stone-800 transition-colors"
          >
            Validate Schema
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="py-2 px-4 rounded-xl border border-stone-800 text-stone-400 text-xs hover:bg-stone-800"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              className="flex items-center gap-1.5 py-2 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-stone-950 text-xs font-semibold transition-colors shadow-lg shadow-amber-950/40"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Load into Experience</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
