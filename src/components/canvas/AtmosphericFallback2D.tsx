'use client';

import React from 'react';
import { AtmosphereState, InteractableObject } from '@/types/episode';
import { Flame, Radio, BookOpen, Shield, CloudRain, DoorClosed } from 'lucide-react';

interface AtmosphericFallback2DProps {
  atmosphere: AtmosphereState;
  interactables: InteractableObject[];
  onInspectObject: (object: InteractableObject) => void;
}

export const AtmosphericFallback2D: React.FC<AtmosphericFallback2DProps> = ({
  atmosphere,
  interactables,
  onInspectObject,
}) => {
  const getIconForType = (type: string) => {
    switch (type) {
      case 'lantern':
        return <Flame className="w-5 h-5 text-amber-400 animate-pulse" />;
      case 'radio':
        return <Radio className="w-5 h-5 text-emerald-400" />;
      case 'diary':
        return <BookOpen className="w-5 h-5 text-amber-200" />;
      case 'amulet':
        return <Shield className="w-5 h-5 text-purple-300" />;
      case 'window':
        return <CloudRain className="w-5 h-5 text-cyan-300" />;
      case 'door':
      default:
        return <DoorClosed className="w-5 h-5 text-orange-200" />;
    }
  };

  return (
    <div className="relative w-full h-full bg-gradient-to-b from-[#090b10] via-[#0d1017] to-[#06070a] flex flex-col items-center justify-between p-6 overflow-hidden">
      {/* Lightning Flash Overlay */}
      {atmosphere.lightningActive && (
        <div className="absolute inset-0 bg-blue-100 opacity-30 pointer-events-none transition-opacity duration-75 animate-lightning" />
      )}

      {/* Atmospheric Vignette & Fog */}
      <div
        className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_30%,rgba(5,7,10,0.85)_100%)]"
        style={{
          opacity: 0.8 + atmosphere.fogDensity * 0.2,
        }}
      />

      {/* Rain Streak Layer */}
      {atmosphere.rainIntensity > 0.05 && (
        <div
          className="absolute inset-0 pointer-events-none opacity-40 bg-[repeating-linear-gradient(105deg,rgba(160,200,255,0.15)_0px,rgba(160,200,255,0.15)_1px,transparent_1px,transparent_24px)]"
          style={{
            animation: `rainDrop ${Math.max(0.2, 0.8 - atmosphere.rainIntensity * 0.5)}s linear infinite`,
          }}
        />
      )}

      {/* Center Atmospheric Chamber Illustration */}
      <div className="relative z-10 w-full max-w-2xl my-auto flex flex-col items-center">
        {/* The Hurricane Lamp in 2D Glow */}
        <div className="relative my-8 flex flex-col items-center">
          <div
            className="absolute -inset-16 rounded-full bg-amber-500/20 blur-3xl transition-all duration-300 pointer-events-none"
            style={{
              opacity: atmosphere.lanternBrightness * (0.6 + Math.random() * 0.4 * atmosphere.lanternFlicker),
              transform: `scale(${0.8 + atmosphere.lanternBrightness * 0.4})`,
            }}
          />
          <div className="relative p-6 rounded-2xl border border-amber-950/40 bg-[#120f0c]/80 backdrop-blur-md shadow-2xl flex flex-col items-center text-center">
            <div className="relative w-20 h-28 flex items-center justify-center">
              {/* Hurricane Lamp Glass & Flame Graphic */}
              <div className="w-12 h-20 border-2 border-amber-800/60 rounded-full flex items-center justify-center bg-gradient-to-t from-amber-950/40 via-amber-600/10 to-transparent">
                <div
                  className="w-5 h-8 bg-amber-400 rounded-full blur-[2px] animate-pulse"
                  style={{
                    opacity: atmosphere.lanternBrightness,
                  }}
                />
              </div>
            </div>
            <p className="mt-2 text-xs uppercase tracking-widest text-amber-500/80 font-mono">
              2D Fallback Mode • দ্বিমাত্রিক আবহ
            </p>
            <h3 className="text-sm text-stone-300 font-serif mt-1">
              {atmosphere.weather === 'heavy-storm'
                ? 'Monsoon Storm Outside (বাইরে কালবৈশাখী)'
                : atmosphere.weather === 'light-rain'
                ? 'Rain Falling on Shutter (ঝিরিঝিরি বৃষ্টি)'
                : 'Still Tropical Midnight (নিঝুম রাত)'}
            </h3>
          </div>
        </div>

        {/* Interactable Hotspot Grid */}
        <div className="w-full">
          <p className="text-xs text-stone-400 uppercase tracking-wider font-mono text-center mb-3">
            Inspectable Objects • কক্ষের উপাদানসমূহ
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {interactables.map((item) => (
              <button
                key={item.id}
                onClick={() => onInspectObject(item)}
                className="group p-3 rounded-xl border border-stone-800 hover:border-amber-500/60 bg-stone-900/60 hover:bg-stone-800/80 transition-all text-left flex items-start gap-2.5 backdrop-blur-sm"
              >
                <div className="p-2 rounded-lg bg-stone-950/80 border border-stone-800 group-hover:border-amber-600/40 transition-colors">
                  {getIconForType(item.type)}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-medium text-stone-200 group-hover:text-amber-300 truncate">
                    {item.name}
                  </div>
                  <div className="text-[11px] text-stone-400 truncate">
                    {item.bengaliName}
                  </div>
                  <div className="text-[10px] text-amber-500/70 font-mono mt-0.5">
                    {item.actionPrompt}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes rainDrop {
          0% {
            background-position: 0% 0%;
          }
          100% {
            background-position: 10% 100%;
          }
        }
      `}</style>
    </div>
  );
};
