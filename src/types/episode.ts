export type WeatherType = 'clear-night' | 'light-rain' | 'heavy-storm';
export type DoorStateType = 'closed' | 'ajar' | 'open';
export type WindowStateType = 'closed' | 'open';

export interface AtmosphereState {
  weather: WeatherType;
  rainIntensity: number;       // 0.0 - 1.0
  windIntensity: number;       // 0.0 - 1.0
  cricketsIntensity: number;   // 0.0 - 1.0
  lanternBrightness: number;   // 0.0 - 1.0
  lanternFlicker: number;      // 0.0 - 1.0
  fogDensity: number;          // 0.0 - 1.0
  doorState: DoorStateType;
  windowState: WindowStateType;
  rockingChair: boolean;
  activeSupernatural: string | null;
  coldMist: boolean;
  radioGlitch: boolean;
  lightningActive: boolean;
}

export type EventType =
  | 'spatial-sound'
  | 'ambient'
  | 'lighting'
  | 'weather'
  | 'environmental'
  | 'supernatural'
  | 'narrative-hint';

export interface TimelineEvent {
  id: string;
  at: number; // Timestamp in seconds from video start
  type: EventType;
  action?: 'play' | 'stop' | 'set' | 'fade-in' | 'fade-out' | 'pulse' | 'strike';
  asset?: string;
  position?: [number, number, number]; // [x, y, z] spatial audio coordinate
  duration?: number;                   // duration in seconds
  intensity?: number;                  // 0.0 to 1.0
  isPersistent?: boolean;              // true = survives seek & rebuilds state; false = transient
  statePayload?: Partial<AtmosphereState>; // Payload applied to state if persistent
  label?: string;                      // Human-readable title
  bengaliHint?: string;                // Bengali text hint / narrative clue
  englishHint?: string;                // English hint / description
}

export interface InteractableObject {
  id: string;
  name: string;
  bengaliName: string;
  type: 'lantern' | 'radio' | 'window' | 'door' | 'diary' | 'amulet' | 'matches';
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
  description: string;
  bengaliDescription: string;
  actionPrompt: string;
  details: {
    title: string;
    bengaliTitle?: string;
    content: string;
    bengaliContent?: string;
    lore?: string;
  };
}

export interface Episode {
  id: string;
  title: string;
  bengaliTitle: string;
  date: string;
  narrator: string;
  callerOrStoryteller: string;
  youtubeVideoId: string;
  duration: number; // Total duration in seconds
  environmentId: 'rural-bedroom' | 'veranda-rain' | 'bamboo-grove';
  verifiedStatus: 'official-embed' | 'curated-demonstration' | 'community-authored';
  disclaimer: string;
  description: string;
  bengaliDescription: string;
  defaultAtmosphere: AtmosphereState;
  events: TimelineEvent[];
  interactables: InteractableObject[];
}
