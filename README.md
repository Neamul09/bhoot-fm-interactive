# Bhoot FM — Immersive Supernatural Audio Experience (ভূত এফএম — অলৌকিক আবহ)

An autonomous web product that transforms classic **Bhoot FM** radio episodes into reactive, interactive 3D audio-visual supernatural experiences.

> **"The original episode tells the story. The environment makes the listener experience it."**

---

## 👻 Product Overview

Unlike conventional video players or visualizers, this experience places the listener inside a dark, authentic rural Bengali room (rural bedroom/veranda). As the official Bhoot FM recording unfolds through an embedded YouTube player, the virtual environment responds dynamically in real time:

- **Spatial Footsteps**: Creeping footsteps on damp floorboards positioned binaurally around the room.
- **Monsoon Weather System**: Torrential rains tapping on the barred window, wind howling through ceiling rafters, and close/distant thunderclaps.
- **Dynamic Lighting**: A brass kerosene hurricane lamp (হারিকেন বাতি) with procedural flicker that dims when chill drafts blow through the room, punctuated by lightning flashes.
- **Supernatural Events**: Sudden door creaks, window knocks, cold ground mist, and vintage transistor radio static bursts.
- **Inspectable Objects**: Interact with the hurricane lantern (adjust flame/strike match), Philips shortwave radio (tune frequencies), barred monsoon window, yellowed handwritten zamindar diary, and consecrated silver amulet (তাবিজ).
- **Dual Sound Engine**: Built on the HTML5 Web Audio API with procedural sound synthesis (zero 404 missing audio file risks) and 3D Panner orientation tracking linked to head/mouse rotation.
- **Timeline Synchronization Engine**: Reusable state machine that handles forward playback, pause/buffering recovery, and state reconstruction on seeking (distinguishing persistent weather/lighting states from transient jump-scares).

---

## 🛠️ Architecture & Tech Stack

- **Framework**: Next.js 14 (App Router) + TypeScript
- **Styling**: Tailwind CSS (dark Bengali atmospheric color palette, animations, blur effects)
- **3D Graphics**: Three.js WebGL procedural room, rain particle system, volumetric shadows, raycaster
- **2D Mode**: Accessible low-power SVG/Canvas fallback for low-end mobile or battery-saver devices
- **Audio Engine**: HTML5 Web Audio API with procedural rain, wind, crickets, thunder, door creaks, floorboards, and 3D HRTF listener orientation
- **Original Playback**: Official YouTube IFrame Player API (preserves attribution, licensing, and policies)
- **Testing**: Vitest automated tests covering synchronization timeline and JSON schema validation

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ (tested on Node.js v24)
- npm or yarn

### Installation & Run
```bash
# Clone the repository
git clone https://github.com/Neamul09/bhoot-interactive.git
cd bhoot-interactive

# Install dependencies
npm install

# Run automated tests
npm run test

# Build for production
npm run build

# Start production server
npm run start
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧭 Episode Authoring & JSON Schema

Adding a new Bhoot FM episode does **not** require code modifications. Episodes are defined as structured JSON definitions adhering to the documented schema. You can also author, test, and validate episodes directly in the web UI via the **Author Episode** button in the header.

### Schema Example:

```json
{
  "id": "episode-zamindar-bari",
  "title": "The Abandoned Zamindar Bari in Bogura",
  "bengaliTitle": "বগুড়ার পরিত্যক্ত জমিদার বাড়ি",
  "date": "Broadcast Classic",
  "narrator": "RJ Russell",
  "callerOrStoryteller": "Tanvir Hossain",
  "youtubeVideoId": "M7lc1UVf-VE",
  "duration": 380,
  "environmentId": "rural-bedroom",
  "verifiedStatus": "curated-demonstration",
  "disclaimer": "Curated demonstration timeline synchronized with verified embeddable stream.",
  "description": "A bone-chilling tale of an old family estate left behind in rural Bogura...",
  "bengaliDescription": "বগুড়ার নির্জন এক গ্রামে শতবর্ষ পুরনো এক পরিত্যক্ত জমিদার বাড়ি...",
  "defaultAtmosphere": {
    "weather": "clear-night",
    "rainIntensity": 0.05,
    "windIntensity": 0.15,
    "cricketsIntensity": 0.85,
    "lanternBrightness": 0.85,
    "lanternFlicker": 0.15,
    "fogDensity": 0.1,
    "doorState": "closed",
    "windowState": "closed",
    "rockingChair": false,
    "activeSupernatural": null,
    "coldMist": false,
    "radioGlitch": false,
    "lightningActive": false
  },
  "events": [
    {
      "id": "ep1-ev-rain",
      "at": 30,
      "type": "weather",
      "isPersistent": true,
      "statePayload": {
        "weather": "light-rain",
        "rainIntensity": 0.4
      },
      "label": "Light Monsoon Rain Begins",
      "bengaliHint": "আকাশ ভেঙে গুঁড়ি গুঁড়ি বৃষ্টি শুরু হলো..."
    },
    {
      "id": "ep1-ev-footsteps",
      "at": 70,
      "type": "spatial-sound",
      "asset": "footsteps",
      "position": [-3.2, 0, -2.5],
      "isPersistent": false,
      "label": "Footsteps in Left Hallway",
      "bengaliHint": "বাঁ দিকের বারান্দায় কারো ভারী পায়ের শব্দ শোনা গেল..."
    }
  ]
}
```

### Event Types:
1. `spatial-sound`: Directional 3D audio effect (`[x, y, z]` coordinates relative to listener).
2. `weather`: Monsoon rain, storms, fog density (`isPersistent: true`).
3. `lighting`: Hurricane lamp flame, wind flickering, lightning strikes.
4. `environmental`: Doors swinging open, window rattling, drafts.
5. `supernatural`: Freezing mist, radio static frequency glitches, binaural drone.
6. `narrative-hint`: Timed Bengali/English story caption clues.

---

## ⚖️ Copyright & Distribution Policy

- **Original Episodes**: Bhoot FM was broadcast by Radio Foorti 88.0 FM in Bangladesh and hosted by RJ Russell.
- **Embedded Audio**: All episode audio plays strictly via the official YouTube IFrame Player API. No YouTube video or audio stream is downloaded, ripped, scraped, proxied, or hosted locally.
- **Branding**: Product branding is fully modular and configurable for fair use educational and artistic demonstration.
