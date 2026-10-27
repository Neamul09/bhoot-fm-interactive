'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { EPISODES } from '@/data/episodes';
import { Episode, AtmosphereState, InteractableObject, TimelineEvent } from '@/types/episode';
import { SyncEngine } from '@/lib/syncEngine';
import { AudioEngine } from '@/lib/audioEngine';
import { YouTubePlayerController } from '@/lib/youtubePlayer';
import { HorrorEnvironment3D } from '@/components/canvas/HorrorEnvironment3D';
import { AtmosphericFallback2D } from '@/components/canvas/AtmosphericFallback2D';
import { AtmosphericPlayerBar } from '@/components/player/AtmosphericPlayerBar';
import { YouTubeEmbedContainer } from '@/components/player/YouTubeEmbedContainer';
import { ExperienceHeader } from '@/components/ui/ExperienceHeader';
import { InspectDrawer } from '@/components/ui/InspectDrawer';
import { EntranceModal } from '@/components/ui/EntranceModal';
import { EpisodeAuthoringModal } from '@/components/ui/EpisodeAuthoringModal';

export default function BhootExperiencePage() {
  const [currentEpisode, setCurrentEpisode] = useState<Episode>(EPISODES[0]);
  const [hasEntered, setHasEntered] = useState<boolean>(false);
  const [is3DMode, setIs3DMode] = useState<boolean>(true);
  const [atmosphere, setAtmosphere] = useState<AtmosphereState>(EPISODES[0].defaultAtmosphere);
  const [inspectingObject, setInspectingObject] = useState<InteractableObject | null>(null);
  const [isAuthoringOpen, setIsAuthoringOpen] = useState<boolean>(false);

  // Audio & Player States
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isBuffering, setIsBuffering] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(EPISODES[0].duration);
  const [youtubeVolume, setYoutubeVolume] = useState<number>(80);
  const [ambientVolume, setAmbientVolume] = useState<number>(85);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [audioContextState, setAudioContextState] = useState<'running' | 'suspended' | 'uninitialized'>('uninitialized');
  const [youtubeError, setYoutubeError] = useState<string | null>(null);

  // Narrative hint
  const [activeNarrativeHint, setActiveNarrativeHint] = useState<{
    bengali?: string;
    english?: string;
  } | null>(null);
  const hintTimeoutRef = useRef<number | null>(null);

  // Engine Singletons / Refs
  const syncEngineRef = useRef<SyncEngine | null>(null);
  const audioEngineRef = useRef<AudioEngine | null>(null);
  const ytControllerRef = useRef<YouTubePlayerController | null>(null);

  // Initialize Engines on Mount
  useEffect(() => {
    // 1. Audio Engine
    const audio = new AudioEngine();
    audioEngineRef.current = audio;

    // 2. Sync Engine
    const sync = new SyncEngine({
      onAtmosphereChange: (newAtmos) => {
        setAtmosphere({ ...newAtmos });
        // Forward changes to procedural audio generator
        audio.setRainIntensity(newAtmos.rainIntensity);
        audio.setWindIntensity(newAtmos.windIntensity);
        audio.setCricketsIntensity(newAtmos.cricketsIntensity);
      },
      onOneShotEvent: (event: TimelineEvent) => {
        handleOneShotEvent(event);
      },
      onNarrativeClue: (clue) => {
        if (hintTimeoutRef.current) clearTimeout(hintTimeoutRef.current);
        setActiveNarrativeHint({ bengali: clue.bengali, english: clue.english });
        hintTimeoutRef.current = window.setTimeout(() => {
          setActiveNarrativeHint(null);
        }, (clue.duration || 6) * 1000);
      },
    });
    sync.loadEpisode(currentEpisode);
    syncEngineRef.current = sync;

    // 3. YouTube Player Controller
    const yt = new YouTubePlayerController({
      onStateChange: (state) => {
        if (state === 'playing') {
          setIsPlaying(true);
          setIsBuffering(false);
          audio.resume();
          sync.setPlaybackState(true, false);
          setAudioContextState('running');
        } else if (state === 'paused') {
          setIsPlaying(false);
          setIsBuffering(false);
          sync.setPlaybackState(false, false);
        } else if (state === 'buffering') {
          setIsBuffering(true);
          sync.setPlaybackState(false, true);
        } else if (state === 'ended') {
          setIsPlaying(false);
          sync.setPlaybackState(false, false);
        }
      },
      onTimeUpdate: (curr, dur) => {
        setCurrentTime(curr);
        if (dur > 0) setDuration(dur);
        sync.onTimeUpdate(curr);
      },
      onError: (code, msg) => {
        setYoutubeError(msg);
      },
    });
    ytControllerRef.current = yt;

    return () => {
      sync.destroy();
      audio.dispose();
      yt.destroy();
      if (hintTimeoutRef.current) clearTimeout(hintTimeoutRef.current);
    };
  }, []);

  // Handle Episode Changes
  useEffect(() => {
    if (!syncEngineRef.current || !hasEntered) return;
    syncEngineRef.current.loadEpisode(currentEpisode);
    setAtmosphere({ ...currentEpisode.defaultAtmosphere });
    setCurrentTime(0);
    setDuration(currentEpisode.duration);
    setYoutubeError(null);

    if (ytControllerRef.current) {
      ytControllerRef.current.loadVideoById(currentEpisode.youtubeVideoId);
    }
  }, [currentEpisode, hasEntered]);

  // Dispatch One-Shot Events to Audio Engine
  const handleOneShotEvent = useCallback((event: TimelineEvent) => {
    const audio = audioEngineRef.current;
    if (!audio) return;

    const pos = event.position || [0, 0, -2];

    switch (event.asset) {
      case 'footsteps':
        audio.playSpatialFootstep(pos, false);
        setTimeout(() => audio.playSpatialFootstep([pos[0] + 0.3, pos[1], pos[2] + 0.4], false), 450);
        setTimeout(() => audio.playSpatialFootstep([pos[0] + 0.6, pos[1], pos[2] + 0.8], true), 900);
        break;
      case 'door-creak':
        audio.playDoorCreak(pos, true);
        break;
      case 'floor-creak':
        audio.playFloorCreak(pos);
        break;
      case 'thunder':
        audio.playThunder(false);
        break;
      case 'thunder-close':
        audio.playThunder(true);
        // Trigger quick visual lightning
        setAtmosphere((prev) => ({ ...prev, lightningActive: true }));
        setTimeout(() => setAtmosphere((prev) => ({ ...prev, lightningActive: false })), 350);
        break;
      case 'window-knock':
        audio.playWindowKnock(pos, 3);
        break;
      case 'drone':
        audio.playSupernaturalDrone(4.5);
        break;
      case 'radio-static':
        audio.playRadioStatic(2.8);
        break;
      default:
        break;
    }
  }, []);

  // User Enters Experience (satisfies Web Audio unlock)
  const handleEnterExperience = async (prefer3D: boolean) => {
    setIs3DMode(prefer3D);
    setHasEntered(true);

    if (audioEngineRef.current) {
      await audioEngineRef.current.init();
      setAudioContextState(audioEngineRef.current.getContextState() as any);
      audioEngineRef.current.setRainIntensity(atmosphere.rainIntensity);
      audioEngineRef.current.setWindIntensity(atmosphere.windIntensity);
      audioEngineRef.current.setCricketsIntensity(atmosphere.cricketsIntensity);
    }

    if (ytControllerRef.current) {
      await ytControllerRef.current.init('yt-player-element', currentEpisode.youtubeVideoId, youtubeVolume);
    }
  };

  // Playback Control Handlers
  const handlePlay = () => {
    if (ytControllerRef.current) {
      ytControllerRef.current.play();
    }
  };

  const handlePause = () => {
    if (ytControllerRef.current) {
      ytControllerRef.current.pause();
    }
  };

  const handleSeek = (targetTime: number) => {
    if (ytControllerRef.current) {
      ytControllerRef.current.seekTo(targetTime);
    }
    if (syncEngineRef.current) {
      syncEngineRef.current.reconstructStateAt(targetTime);
    }
    setCurrentTime(targetTime);
  };

  // Audio Mixer Handlers
  const handleYoutubeVolumeChange = (vol: number) => {
    setYoutubeVolume(vol);
    if (ytControllerRef.current) {
      ytControllerRef.current.setVolume(vol);
    }
  };

  const handleAmbientVolumeChange = (vol: number) => {
    setAmbientVolume(vol);
    if (audioEngineRef.current) {
      audioEngineRef.current.setMasterVolume(vol / 100);
    }
  };

  const handleToggleMute = () => {
    if (audioEngineRef.current) {
      const muted = audioEngineRef.current.toggleMute();
      setIsMuted(muted);
    }
  };

  // Camera Head Tracking for Spatial Audio
  const handleCameraOrientationChange = useCallback(
    (
      pos: { x: number; y: number; z: number },
      forward: { x: number; y: number; z: number },
      up: { x: number; y: number; z: number }
    ) => {
      if (audioEngineRef.current) {
        audioEngineRef.current.updateListener(pos, forward, up);
      }
    },
    []
  );

  // Interactive Object Actions (inside inspect drawer)
  const handleObjectAction = (type: string) => {
    const audio = audioEngineRef.current;
    if (!audio) return;

    switch (type) {
      case 'lantern':
        audio.playMatchStrike();
        setAtmosphere((prev) => ({
          ...prev,
          lanternBrightness: Math.min(1.0, prev.lanternBrightness + 0.25),
        }));
        break;
      case 'radio':
        audio.playRadioStatic(2.2);
        break;
      case 'window':
        audio.playWindowKnock([0, 1.2, -3.9], 2);
        break;
      case 'door':
        audio.playDoorCreak([-3.5, 0, 0], atmosphere.doorState === 'closed');
        setAtmosphere((prev) => ({
          ...prev,
          doorState: prev.doorState === 'closed' ? 'ajar' : 'closed',
        }));
        break;
      case 'amulet':
        audio.playSupernaturalDrone(3.0);
        break;
      case 'diary':
      default:
        audio.playFloorCreak([0.2, 0, -1.5]);
        break;
    }
  };

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-black text-stone-100 flex flex-col justify-between">
      {/* Top Navigation & Branding Bar */}
      <ExperienceHeader
        currentEpisode={currentEpisode}
        allEpisodes={EPISODES}
        onSelectEpisode={(ep) => setCurrentEpisode(ep)}
        onOpenAuthoringModal={() => setIsAuthoringOpen(true)}
        audioState={audioContextState}
      />

      {/* Main Atmospheric Canvas Layer */}
      <div className="absolute inset-0 z-0">
        {is3DMode ? (
          <HorrorEnvironment3D
            atmosphere={atmosphere}
            interactables={currentEpisode.interactables}
            onInspectObject={(obj) => setInspectingObject(obj)}
            onCameraOrientationChange={handleCameraOrientationChange}
            isInspecting={!!inspectingObject}
          />
        ) : (
          <AtmosphericFallback2D
            atmosphere={atmosphere}
            interactables={currentEpisode.interactables}
            onInspectObject={(obj) => setInspectingObject(obj)}
          />
        )}
      </div>

      {/* YouTube Embed Container */}
      <YouTubeEmbedContainer
        containerId="yt-player-element"
        videoId={currentEpisode.youtubeVideoId}
        errorMessage={youtubeError}
        onRetryWithFallback={() => {
          setYoutubeError(null);
          setCurrentEpisode(EPISODES[0]);
        }}
      />

      {/* Bottom Player Console & Scrubber */}
      <div className="relative z-30 p-4 w-full flex justify-center">
        <AtmosphericPlayerBar
          isPlaying={isPlaying}
          isBuffering={isBuffering}
          currentTime={currentTime}
          duration={duration}
          events={currentEpisode.events}
          onPlay={handlePlay}
          onPause={handlePause}
          onSeek={handleSeek}
          youtubeVolume={youtubeVolume}
          onYoutubeVolumeChange={handleYoutubeVolumeChange}
          ambientVolume={ambientVolume}
          onAmbientVolumeChange={handleAmbientVolumeChange}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          is3DMode={is3DMode}
          onToggle3DMode={() => setIs3DMode(!is3DMode)}
          activeNarrativeHint={activeNarrativeHint}
        />
      </div>

      {/* Object Inspection Modal */}
      <InspectDrawer
        object={inspectingObject}
        onClose={() => setInspectingObject(null)}
        onTriggerObjectAction={handleObjectAction}
      />

      {/* Episode Authoring / JSON Schema Modal */}
      <EpisodeAuthoringModal
        isOpen={isAuthoringOpen}
        onClose={() => setIsAuthoringOpen(false)}
        onLoadCustomEpisode={(ep) => setCurrentEpisode(ep)}
        currentEpisode={currentEpisode}
      />

      {/* Initial Entrance Modal (User Gesture for Web Audio) */}
      {!hasEntered && (
        <EntranceModal
          title={currentEpisode.title}
          bengaliTitle={currentEpisode.bengaliTitle}
          onEnter={handleEnterExperience}
        />
      )}
    </main>
  );
}
