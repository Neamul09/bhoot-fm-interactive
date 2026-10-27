import { describe, it, expect, vi } from 'vitest';
import { SyncEngine } from '../lib/syncEngine';
import { Episode } from '../types/episode';

const mockEpisode: Episode = {
  id: 'test-ep-01',
  title: 'Test Zamindar Story',
  bengaliTitle: 'টেস্ট পর্ব',
  date: '2026',
  narrator: 'RJ Russell',
  callerOrStoryteller: 'Caller Test',
  youtubeVideoId: 'M7lc1UVf-VE',
  duration: 200,
  environmentId: 'rural-bedroom',
  verifiedStatus: 'curated-demonstration',
  disclaimer: 'Test disclaimer',
  description: 'Test description',
  bengaliDescription: 'টেস্ট বিবরণ',
  defaultAtmosphere: {
    weather: 'clear-night',
    rainIntensity: 0.1,
    windIntensity: 0.2,
    cricketsIntensity: 0.8,
    lanternBrightness: 0.9,
    lanternFlicker: 0.1,
    fogDensity: 0.1,
    doorState: 'closed',
    windowState: 'closed',
    rockingChair: false,
    activeSupernatural: null,
    coldMist: false,
    radioGlitch: false,
    lightningActive: false,
  },
  interactables: [],
  events: [
    {
      id: 'rain-start',
      at: 20,
      type: 'weather',
      isPersistent: true,
      statePayload: {
        weather: 'light-rain',
        rainIntensity: 0.5,
      },
    },
    {
      id: 'footsteps-left',
      at: 40,
      type: 'spatial-sound',
      asset: 'footsteps',
      position: [-3, 0, -2],
      isPersistent: false,
    },
    {
      id: 'door-ajar',
      at: 60,
      type: 'environmental',
      isPersistent: true,
      statePayload: {
        doorState: 'ajar',
      },
    },
    {
      id: 'heavy-storm',
      at: 90,
      type: 'weather',
      isPersistent: true,
      statePayload: {
        weather: 'heavy-storm',
        rainIntensity: 0.9,
      },
    },
  ],
};

describe('SyncEngine Timeline Synchronization & Seeking Reconstruction', () => {
  it('loads episode and initializes with default atmosphere', () => {
    const onAtmosphereChange = vi.fn();
    const engine = new SyncEngine({ onAtmosphereChange });
    engine.loadEpisode(mockEpisode);

    expect(engine.getEpisode()?.id).toBe('test-ep-01');
    expect(engine.getAtmosphere().weather).toBe('clear-night');
    expect(engine.getAtmosphere().rainIntensity).toBe(0.1);
    expect(onAtmosphereChange).toHaveBeenCalled();
  });

  it('triggers events during normal forward playback', () => {
    const onOneShotEvent = vi.fn();
    const onAtmosphereChange = vi.fn();
    const engine = new SyncEngine({ onOneShotEvent, onAtmosphereChange });
    engine.loadEpisode(mockEpisode);

    // Initial playback start
    engine.onTimeUpdate(0);

    // Playback progresses to 19s (before event)
    for (let t = 1; t <= 19; t += 1.5) {
      engine.onTimeUpdate(t);
    }
    expect(onOneShotEvent).not.toHaveBeenCalled();

    // Playback crosses 20s (rain-start: persistent weather change)
    engine.onTimeUpdate(20.5);
    expect(engine.getAtmosphere().weather).toBe('light-rain');
    expect(engine.getAtmosphere().rainIntensity).toBe(0.5);

    // Playback advances to 40.5s (crosses footsteps-left: transient one-shot)
    for (let t = 22; t <= 39; t += 2.0) {
      engine.onTimeUpdate(t);
    }
    engine.onTimeUpdate(40.5);

    expect(onOneShotEvent).toHaveBeenCalledTimes(1);
    const lastCalledEvent = onOneShotEvent.mock.calls[0][0];
    expect(lastCalledEvent.id).toBe('footsteps-left');
  });

  it('prevents duplicate event firing when ticks repeat near same second', () => {
    const onOneShotEvent = vi.fn();
    const engine = new SyncEngine({ onOneShotEvent });
    engine.loadEpisode(mockEpisode);

    engine.onTimeUpdate(0);
    engine.onTimeUpdate(39.5);
    engine.onTimeUpdate(40.2); // crosses 40s
    engine.onTimeUpdate(40.4); // same second tick

    // footsteps should only have fired once
    const footstepEvents = onOneShotEvent.mock.calls.filter((call) => call[0].id === 'footsteps-left');
    expect(footstepEvents.length).toBe(1);
  });

  it('reconstructs correct persistent atmosphere on forward seek without firing old one-shots', () => {
    const onOneShotEvent = vi.fn();
    const onAtmosphereChange = vi.fn();
    const engine = new SyncEngine({ onOneShotEvent, onAtmosphereChange });
    engine.loadEpisode(mockEpisode);

    // Direct seek / jump to 75s
    // (past 20s rain-start, 40s footsteps, 60s door-ajar)
    engine.onTimeUpdate(75);

    // Persistent state should be reconstructed
    expect(engine.getAtmosphere().weather).toBe('light-rain');
    expect(engine.getAtmosphere().rainIntensity).toBe(0.5);
    expect(engine.getAtmosphere().doorState).toBe('ajar');

    // Crucially: transient one-shot events (footsteps) should NOT have fired!
    expect(onOneShotEvent).not.toHaveBeenCalled();
  });

  it('reconstructs earlier state when seeking backward', () => {
    const engine = new SyncEngine();
    engine.loadEpisode(mockEpisode);

    // Jump to 95s (heavy storm active)
    engine.onTimeUpdate(95);
    expect(engine.getAtmosphere().weather).toBe('heavy-storm');
    expect(engine.getAtmosphere().rainIntensity).toBe(0.9);

    // Now seek backward to 30s (where rain is light-rain, door is closed)
    engine.onTimeUpdate(30);
    expect(engine.getAtmosphere().weather).toBe('light-rain');
    expect(engine.getAtmosphere().rainIntensity).toBe(0.5);
    expect(engine.getAtmosphere().doorState).toBe('closed');
  });
});
