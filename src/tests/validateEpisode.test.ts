import { describe, it, expect } from 'vitest';
import { validateEpisode } from '../lib/validateEpisode';

describe('validateEpisode JSON Schema Validator', () => {
  it('validates a correct episode object', () => {
    const validData = {
      id: 'valid-ep-1',
      title: 'Valid Episode',
      youtubeVideoId: 'M7lc1UVf-VE',
      duration: 300,
      events: [
        {
          id: 'ev-1',
          at: 10,
          type: 'ambient',
        },
      ],
      interactables: [
        {
          id: 'obj-1',
          name: 'Lantern',
          position: [0, 1, 0],
        },
      ],
    };

    const result = validateEpisode(validData);
    expect(result.isValid).toBe(true);
    expect(result.errors.length).toBe(0);
  });

  it('rejects an episode with missing id and missing events', () => {
    const invalidData = {
      title: 'Missing Id',
      youtubeVideoId: 'M7lc1UVf-VE',
    };

    const result = validateEpisode(invalidData);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Missing or invalid "id" field (string required).');
    expect(result.errors).toContain('"events" must be an array.');
  });

  it('detects invalid 3D position coordinates and negative timestamp', () => {
    const invalidCoords = {
      id: 'coord-test',
      title: 'Coord Test',
      youtubeVideoId: 'M7lc1UVf-VE',
      duration: 100,
      events: [
        {
          id: 'ev-bad-coord',
          at: -5, // Negative timestamp error!
          type: 'spatial-sound',
          position: [1, 2], // Only 2 coordinates instead of 3!
        },
      ],
    };

    const result = validateEpisode(invalidCoords);
    expect(result.isValid).toBe(false);
    expect(result.errors.some((err) => err.includes('invalid timestamp'))).toBe(true);
    expect(result.errors.some((err) => err.includes('invalid 3D "position" coordinates'))).toBe(true);
  });
});
