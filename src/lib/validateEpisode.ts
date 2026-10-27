import { Episode, TimelineEvent, InteractableObject } from '@/types/episode';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateEpisode(data: unknown): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!data || typeof data !== 'object') {
    return { isValid: false, errors: ['Episode definition must be a valid JSON object.'], warnings: [] };
  }

  const ep = data as Partial<Episode>;

  if (!ep.id || typeof ep.id !== 'string') {
    errors.push('Missing or invalid "id" field (string required).');
  }
  if (!ep.title || typeof ep.title !== 'string') {
    errors.push('Missing or invalid "title" field (string required).');
  }
  if (!ep.youtubeVideoId || typeof ep.youtubeVideoId !== 'string') {
    errors.push('Missing or invalid "youtubeVideoId" field (string required).');
  } else if (!/^[a-zA-Z0-9_-]{11}$/.test(ep.youtubeVideoId.trim())) {
    warnings.push(`"youtubeVideoId" "${ep.youtubeVideoId}" is not a standard 11-character YouTube video ID.`);
  }

  if (typeof ep.duration !== 'number' || ep.duration <= 0) {
    warnings.push('Duration is missing or not a positive number; player duration will be used dynamically.');
  }

  if (!Array.isArray(ep.events)) {
    errors.push('"events" must be an array.');
  } else {
    let lastTime = -1;
    ep.events.forEach((event: TimelineEvent, idx: number) => {
      if (!event.id) {
        errors.push(`Event at index ${idx} is missing an "id".`);
      }
      if (typeof event.at !== 'number' || event.at < 0) {
        errors.push(`Event "${event.id || idx}" has an invalid timestamp "at" (must be >= 0).`);
      } else if (event.at < lastTime) {
        warnings.push(`Event "${event.id}" timestamp (${event.at}s) is out of chronological order.`);
      } else {
        lastTime = event.at;
      }

      if (!event.type) {
        errors.push(`Event "${event.id || idx}" is missing a "type".`);
      }

      if (event.position) {
        if (!Array.isArray(event.position) || event.position.length !== 3 || event.position.some(isNaN)) {
          errors.push(`Event "${event.id}" has invalid 3D "position" coordinates (must be [x, y, z] numbers).`);
        }
      }
    });
  }

  if (ep.interactables && !Array.isArray(ep.interactables)) {
    errors.push('"interactables" must be an array if provided.');
  } else if (ep.interactables) {
    ep.interactables.forEach((item: InteractableObject, idx: number) => {
      if (!item.id || !item.name) {
        errors.push(`Interactable at index ${idx} must have "id" and "name".`);
      }
      if (!item.position || !Array.isArray(item.position) || item.position.length !== 3) {
        errors.push(`Interactable "${item.id || idx}" must have [x, y, z] "position".`);
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}
