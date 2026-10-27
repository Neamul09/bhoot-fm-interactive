import { AtmosphereState, Episode, TimelineEvent } from '@/types/episode';

export interface SyncEngineCallbacks {
  onAtmosphereChange?: (state: AtmosphereState) => void;
  onOneShotEvent?: (event: TimelineEvent) => void;
  onNarrativeClue?: (clue: { bengali?: string; english?: string; duration?: number }) => void;
  onLog?: (msg: string) => void;
}

export class SyncEngine {
  private episode: Episode | null = null;
  private currentAtmosphere: AtmosphereState;
  private defaultAtmosphere: AtmosphereState;
  private triggeredEventIds: Set<string> = new Set();
  private lastEvaluatedTime: number = -1;
  private callbacks: SyncEngineCallbacks;
  private isBuffering: boolean = false;
  private isPaused: boolean = true;

  constructor(callbacks: SyncEngineCallbacks = {}) {
    this.callbacks = callbacks;
    this.defaultAtmosphere = this.getInitialFallbackAtmosphere();
    this.currentAtmosphere = { ...this.defaultAtmosphere };
  }

  private getInitialFallbackAtmosphere(): AtmosphereState {
    return {
      weather: 'clear-night',
      rainIntensity: 0.1,
      windIntensity: 0.2,
      cricketsIntensity: 0.8,
      lanternBrightness: 0.9,
      lanternFlicker: 0.2,
      fogDensity: 0.15,
      doorState: 'closed',
      windowState: 'closed',
      rockingChair: false,
      activeSupernatural: null,
      coldMist: false,
      radioGlitch: false,
      lightningActive: false,
    };
  }

  public loadEpisode(episode: Episode) {
    this.episode = episode;
    this.defaultAtmosphere = { ...episode.defaultAtmosphere };
    this.currentAtmosphere = { ...episode.defaultAtmosphere };
    this.triggeredEventIds.clear();
    this.lastEvaluatedTime = -1;
    this.callbacks.onAtmosphereChange?.(this.currentAtmosphere);
    this.callbacks.onLog?.(`Loaded episode: "${episode.title}" (${episode.events.length} events)`);
  }

  public getAtmosphere(): AtmosphereState {
    return { ...this.currentAtmosphere };
  }

  public getEpisode(): Episode | null {
    return this.episode;
  }

  /**
   * Called on every player timeupdate / poll tick (typically every 100-250ms).
   */
  public onTimeUpdate(currentTime: number) {
    if (!this.episode) return;

    // First time update initialization
    if (this.lastEvaluatedTime < 0) {
      if (currentTime > 1.0) {
        // Started or cued directly into mid-episode -> reconstruct state
        this.reconstructStateAt(currentTime);
        this.lastEvaluatedTime = currentTime;
        return;
      }
      this.lastEvaluatedTime = 0;
    }

    // Detect seeking (backwards jump or jump forward > 2.5s)
    const timeDelta = currentTime - this.lastEvaluatedTime;
    const isSeeking = timeDelta < -0.3 || timeDelta > 2.5;

    if (isSeeking) {
      this.callbacks.onLog?.(
        `Seek detected: jumped from ${this.lastEvaluatedTime.toFixed(1)}s to ${currentTime.toFixed(1)}s. Reconstructing state...`
      );
      this.reconstructStateAt(currentTime);
      this.lastEvaluatedTime = currentTime;
      return;
    }

    // Normal forward playback progression
    const prevTime = Math.max(0, this.lastEvaluatedTime);
    this.lastEvaluatedTime = currentTime;

    // Check events that fall within (prevTime, currentTime]
    for (const event of this.episode.events) {
      if (event.at > prevTime && event.at <= currentTime) {
        this.processEvent(event);
      }
    }
  }

  private processEvent(event: TimelineEvent) {
    if (this.triggeredEventIds.has(event.id)) {
      return; // Prevent duplicate firing
    }
    this.triggeredEventIds.add(event.id);

    // Apply persistent changes if any
    if (event.isPersistent && event.statePayload) {
      this.currentAtmosphere = {
        ...this.currentAtmosphere,
        ...event.statePayload,
      };
      this.callbacks.onAtmosphereChange?.(this.currentAtmosphere);
    }

    // Handle narrative clues
    if (event.bengaliHint || event.englishHint) {
      this.callbacks.onNarrativeClue?.({
        bengali: event.bengaliHint,
        english: event.englishHint,
        duration: event.duration || 6,
      });
    }

    // Notify listeners for spatial audio / visual one-shot triggers
    // Transient events or events with an asset trigger audio effects
    if (!event.isPersistent || event.asset) {
      this.callbacks.onOneShotEvent?.(event);
    }
    this.callbacks.onLog?.(`Triggered event [${event.type}]: ${event.label || event.id} at ${event.at}s`);
  }

  /**
   * Reconstruct the persistent atmospheric state at a given seek timestamp.
   * Crucially, this does NOT trigger one-shot sounds (footsteps, knocks, jump-scares)
   * that occurred in the past.
   */
  public reconstructStateAt(targetTime: number) {
    if (!this.episode) return;

    // Reset base state to episode default
    let rebuiltState: AtmosphereState = { ...this.defaultAtmosphere };

    // Reset triggered set: re-mark past events as triggered so they don't fire now,
    // and clear future events so they can trigger if we play forward to them.
    this.triggeredEventIds.clear();

    // Sort events chronologically up to targetTime
    const pastEvents = [...this.episode.events]
      .filter((ev) => ev.at <= targetTime)
      .sort((a, b) => a.at - b.at);

    for (const event of pastEvents) {
      this.triggeredEventIds.add(event.id);

      // Only accumulate persistent atmosphere payloads
      if (event.isPersistent && event.statePayload) {
        rebuiltState = {
          ...rebuiltState,
          ...event.statePayload,
        };
      }
    }

    this.currentAtmosphere = rebuiltState;
    this.callbacks.onAtmosphereChange?.(this.currentAtmosphere);
    this.callbacks.onLog?.(
      `State reconstructed at ${targetTime.toFixed(1)}s (weather=${rebuiltState.weather}, rain=${rebuiltState.rainIntensity.toFixed(2)})`
    );
  }

  public setPlaybackState(isPlaying: boolean, isBuffering: boolean = false) {
    this.isPaused = !isPlaying;
    this.isBuffering = isBuffering;
  }

  public getPlaybackState() {
    return {
      isPlaying: !this.isPaused && !this.isBuffering,
      isPaused: this.isPaused,
      isBuffering: this.isBuffering,
    };
  }

  public reset() {
    if (this.episode) {
      this.currentAtmosphere = { ...this.episode.defaultAtmosphere };
    } else {
      this.currentAtmosphere = this.getInitialFallbackAtmosphere();
    }
    this.triggeredEventIds.clear();
    this.lastEvaluatedTime = -1;
    this.callbacks.onAtmosphereChange?.(this.currentAtmosphere);
  }

  public destroy() {
    this.triggeredEventIds.clear();
    this.episode = null;
  }
}
