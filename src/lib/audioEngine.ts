/**
 * Procedural & Spatial Web Audio Engine for Bhoot FM Interactive Experience
 * Fully self-contained, zero external asset dependency failure risk,
 * dynamic spatial positioning, limiter-protected to prevent clipping.
 */

export interface SpatialAudioCoords {
  x: number;
  y: number;
  z: number;
}

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private ambientGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;

  // Ambient sound generators
  private rainNode: { noise: AudioNode; gain: GainNode } | null = null;
  private windNode: { noise: AudioNode; filter: BiquadFilterNode; gain: GainNode; lfo: OscillatorNode } | null = null;
  private cricketsNode: { gain: GainNode; intervalId: number | null } | null = null;

  // Volumes
  private masterVol: number = 0.85;
  private ambientVol: number = 0.7;
  private sfxVol: number = 0.85;

  private isInitialized: boolean = false;
  private isMuted: boolean = false;

  constructor() {}

  /**
   * Initializes AudioContext upon user gesture.
   */
  public async init(): Promise<boolean> {
    if (this.isInitialized && this.ctx) {
      if (this.ctx.state === 'suspended') {
        await this.ctx.resume();
      }
      return true;
    }

    try {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtxClass();

      // Dynamics Compressor (Limiter) to guarantee no clipping or sudden spikes
      this.compressor = this.ctx.createDynamicsCompressor();
      this.compressor.threshold.setValueAtTime(-6, this.ctx.currentTime);
      this.compressor.knee.setValueAtTime(10, this.ctx.currentTime);
      this.compressor.ratio.setValueAtTime(12, this.ctx.currentTime);
      this.compressor.attack.setValueAtTime(0.003, this.ctx.currentTime);
      this.compressor.release.setValueAtTime(0.25, this.ctx.currentTime);
      this.compressor.connect(this.ctx.destination);

      // Master Gain
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.masterVol, this.ctx.currentTime);
      this.masterGain.connect(this.compressor);

      // Sub Gaining
      this.ambientGain = this.ctx.createGain();
      this.ambientGain.gain.setValueAtTime(this.ambientVol, this.ctx.currentTime);
      this.ambientGain.connect(this.masterGain);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(this.sfxVol, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      // Start continuous ambient nodes
      this.startRainSynth();
      this.startWindSynth();
      this.startCricketsSynth();

      this.isInitialized = true;
      return true;
    } catch (e) {
      console.warn('Failed to initialize Web Audio context:', e);
      return false;
    }
  }

  public getContextState(): AudioContextState | 'uninitialized' {
    return this.ctx ? this.ctx.state : 'uninitialized';
  }

  public async resume(): Promise<void> {
    if (this.ctx && this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
  }

  public async suspend(): Promise<void> {
    if (this.ctx && this.ctx.state === 'running') {
      await this.ctx.suspend();
    }
  }

  public setMasterVolume(vol: number) {
    this.masterVol = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.ctx && !this.isMuted) {
      this.masterGain.gain.setTargetAtTime(this.masterVol, this.ctx.currentTime, 0.05);
    }
  }

  public setAmbientVolume(vol: number) {
    this.ambientVol = Math.max(0, Math.min(1, vol));
    if (this.ambientGain && this.ctx) {
      this.ambientGain.gain.setTargetAtTime(this.ambientVol, this.ctx.currentTime, 0.05);
    }
  }

  public setSfxVolume(vol: number) {
    this.sfxVol = Math.max(0, Math.min(1, vol));
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setTargetAtTime(this.sfxVol, this.ctx.currentTime, 0.05);
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      const target = this.isMuted ? 0 : this.masterVol;
      this.masterGain.gain.setTargetAtTime(target, this.ctx.currentTime, 0.05);
    }
    return this.isMuted;
  }

  /**
   * Update listener orientation and position in 3D space
   * Synchronized with Three.js camera
   */
  public updateListener(
    pos: { x: number; y: number; z: number },
    forward: { x: number; y: number; z: number },
    up: { x: number; y: number; z: number } = { x: 0, y: 1, z: 0 }
  ) {
    if (!this.ctx) return;
    const listener = this.ctx.listener;
    const now = this.ctx.currentTime;

    if (listener.positionX) {
      listener.positionX.setTargetAtTime(pos.x, now, 0.05);
      listener.positionY.setTargetAtTime(pos.y, now, 0.05);
      listener.positionZ.setTargetAtTime(pos.z, now, 0.05);
      listener.forwardX.setTargetAtTime(forward.x, now, 0.05);
      listener.forwardY.setTargetAtTime(forward.y, now, 0.05);
      listener.forwardZ.setTargetAtTime(forward.z, now, 0.05);
      listener.upX.setTargetAtTime(up.x, now, 0.05);
      listener.upY.setTargetAtTime(up.y, now, 0.05);
      listener.upZ.setTargetAtTime(up.z, now, 0.05);
    } else if (listener.setOrientation && listener.setPosition) {
      // Legacy fallback
      listener.setPosition(pos.x, pos.y, pos.z);
      listener.setOrientation(forward.x, forward.y, forward.z, up.x, up.y, up.z);
    }
  }

  /**
   * Continuous Procedural Monsoon Rain Synthesizer
   */
  private startRainSynth() {
    if (!this.ctx || !this.ambientGain) return;

    const bufferSize = 2 * this.ctx.sampleRate;
    const noiseBuffer = this.ctx.createBuffer(2, bufferSize, this.ctx.sampleRate);
    for (let channel = 0; channel < 2; channel++) {
      const data = noiseBuffer.getChannelData(channel);
      for (let i = 0; i < bufferSize; i++) {
        // Pink-tinted noise with random droplet impulse spikes
        const white = Math.random() * 2 - 1;
        const drop = Math.random() < 0.002 ? (Math.random() * 2 - 1) * 2.5 : 0;
        data[i] = white * 0.4 + drop;
      }
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.loop = true;

    // Filter to simulate sound outside a rural wooden wall/tin roof
    const bpf = this.ctx.createBiquadFilter();
    bpf.type = 'bandpass';
    bpf.frequency.setValueAtTime(1200, this.ctx.currentTime);
    bpf.Q.setValueAtTime(0.7, this.ctx.currentTime);

    const lpf = this.ctx.createBiquadFilter();
    lpf.type = 'lowpass';
    lpf.frequency.setValueAtTime(3200, this.ctx.currentTime);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.08, this.ctx.currentTime); // Low baseline

    noise.connect(bpf);
    bpf.connect(lpf);
    lpf.connect(gain);
    gain.connect(this.ambientGain);

    noise.start();
    this.rainNode = { noise, gain };
  }

  public setRainIntensity(intensity: number) {
    if (!this.rainNode || !this.ctx) return;
    const clamped = Math.max(0, Math.min(1, intensity));
    const targetGain = clamped * 0.45;
    this.rainNode.gain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.4);
  }

  /**
   * Continuous Procedural Wind Synthesizer
   */
  private startWindSynth() {
    if (!this.ctx || !this.ambientGain) return;

    const bufferSize = 3 * this.ctx.sampleRate;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      // Brown noise filter for howling wind base
      data[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = data[i];
      data[i] *= 3.5;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(320, this.ctx.currentTime);
    filter.Q.setValueAtTime(3.0, this.ctx.currentTime);

    // LFO to slowly sweep wind frequency
    const lfo = this.ctx.createOscillator();
    lfo.frequency.setValueAtTime(0.15, this.ctx.currentTime);
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(140, this.ctx.currentTime);
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.12, this.ctx.currentTime);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ambientGain);

    noise.start();
    lfo.start();

    this.windNode = { noise, filter, gain, lfo };
  }

  public setWindIntensity(intensity: number) {
    if (!this.windNode || !this.ctx) return;
    const clamped = Math.max(0, Math.min(1, intensity));
    const targetGain = clamped * 0.35;
    this.windNode.gain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.6);
  }

  /**
   * Continuous Procedural Crickets (Night Insects) Synthesizer
   */
  private startCricketsSynth() {
    if (!this.ctx || !this.ambientGain) return;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
    gain.connect(this.ambientGain);

    // Periodic chirp generator mimicking rural South Asian night crickets
    const chirp = () => {
      if (!this.ctx || gain.gain.value < 0.01) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const chirpGain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(4600 + (Math.random() * 300 - 150), now);

      chirpGain.gain.setValueAtTime(0.001, now);
      chirpGain.gain.linearRampToValueAtTime(0.06, now + 0.015);
      chirpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(chirpGain);
      chirpGain.connect(gain);

      osc.start(now);
      osc.stop(now + 0.09);
    };

    const intervalId = window.setInterval(() => {
      chirp();
      if (Math.random() > 0.4) {
        setTimeout(chirp, 90);
      }
      if (Math.random() > 0.6) {
        setTimeout(chirp, 180);
      }
    }, 1100);

    this.cricketsNode = { gain, intervalId };
  }

  public setCricketsIntensity(intensity: number) {
    if (!this.cricketsNode || !this.ctx) return;
    const clamped = Math.max(0, Math.min(1, intensity));
    const targetGain = clamped * 0.22;
    this.cricketsNode.gain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.5);
  }

  /**
   * Helper to create a PannerNode for spatialized 3D sounds
   */
  private createPanner(coords: [number, number, number]): PannerNode | null {
    if (!this.ctx || !this.sfxGain) return null;
    const panner = this.ctx.createPanner();
    panner.panningModel = 'HRTF';
    panner.distanceModel = 'inverse';
    panner.refDistance = 1.2;
    panner.maxDistance = 25;
    panner.rolloffFactor = 1.3;

    const [x, y, z] = coords;
    if (panner.positionX) {
      panner.positionX.setValueAtTime(x, this.ctx.currentTime);
      panner.positionY.setValueAtTime(y, this.ctx.currentTime);
      panner.positionZ.setValueAtTime(z, this.ctx.currentTime);
    } else if (panner.setPosition) {
      panner.setPosition(x, y, z);
    }
    panner.connect(this.sfxGain);
    return panner;
  }

  /**
   * SPATIAL FOOTSTEPS:
   * Low-frequency wooden resonance thuds positioned at spatial coordinates
   */
  public playSpatialFootstep(position: [number, number, number] = [0, 0, -2], isHeavy: boolean = false) {
    if (!this.ctx) return;
    const panner = this.createPanner(position);
    if (!panner) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const bpf = this.ctx.createBiquadFilter();

    osc.type = 'triangle';
    const baseFreq = isHeavy ? 65 : 85;
    osc.frequency.setValueAtTime(baseFreq + Math.random() * 10, now);
    osc.frequency.exponentialRampToValueAtTime(35, now + 0.18);

    bpf.type = 'lowpass';
    bpf.frequency.setValueAtTime(220, now);

    const amp = isHeavy ? 0.6 : 0.35;
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(amp, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);

    osc.connect(bpf);
    bpf.connect(gain);
    gain.connect(panner);

    osc.start(now);
    osc.stop(now + 0.25);
  }

  /**
   * SPATIAL WOODEN DOOR CREAK:
   * Heavy resonant friction sound coming from the door location
   */
  public playDoorCreak(position: [number, number, number] = [-3.5, 0, 0], isOpen: boolean = true) {
    if (!this.ctx) return;
    const panner = this.createPanner(position);
    if (!panner) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    const startFreq = isOpen ? 95 : 180;
    const endFreq = isOpen ? 170 : 80;
    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(endFreq, now + 1.2);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(450, now);
    filter.Q.setValueAtTime(5.0, now);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.4, now + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(panner);

    osc.start(now);
    osc.stop(now + 1.25);
  }

  /**
   * FLOORBOARD CREAK:
   * Short wood stress click and pitch descent
   */
  public playFloorCreak(position: [number, number, number] = [1.5, 0, 1.0]) {
    if (!this.ctx) return;
    const panner = this.createPanner(position);
    if (!panner) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(280 + Math.random() * 40, now);
    osc.frequency.exponentialRampToValueAtTime(110, now + 0.35);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.28, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(panner);

    osc.start(now);
    osc.stop(now + 0.38);
  }

  /**
   * DISTANT OR NEAR THUNDER:
   * Deep sub-bass boom + lowpass decay rumble
   */
  public playThunder(isClose: boolean = false) {
    if (!this.ctx || !this.ambientGain) return;
    const now = this.ctx.currentTime;

    // Sub rumble
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(isClose ? 65 : 42, now);
    osc.frequency.exponentialRampToValueAtTime(28, now + 2.5);

    const maxAmp = isClose ? 0.7 : 0.35;
    oscGain.gain.setValueAtTime(0.001, now);
    oscGain.gain.linearRampToValueAtTime(maxAmp, now + 0.08);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 2.8);

    osc.connect(oscGain);
    oscGain.connect(this.ambientGain);

    osc.start(now);
    osc.stop(now + 2.9);

    // Noise crack
    const bufferSize = this.ctx.sampleRate * 2.0;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const lpf = this.ctx.createBiquadFilter();
    lpf.type = 'lowpass';
    lpf.frequency.setValueAtTime(isClose ? 450 : 220, now);
    lpf.frequency.exponentialRampToValueAtTime(80, now + 2.0);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.001, now);
    noiseGain.gain.linearRampToValueAtTime(isClose ? 0.6 : 0.25, now + 0.05);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 2.2);

    noise.connect(lpf);
    lpf.connect(noiseGain);
    noiseGain.connect(this.ambientGain);

    noise.start(now);
    noise.stop(now + 2.3);
  }

  /**
   * WINDOW KNOCK / TAP:
   * Supernatural tapping from outside the window
   */
  public playWindowKnock(position: [number, number, number] = [0, 1.2, -4.5], count: number = 3) {
    if (!this.ctx) return;
    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        if (!this.ctx) return;
        const panner = this.createPanner(position);
        if (!panner) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const bpf = this.ctx.createBiquadFilter();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(320 + i * 20, now);

        bpf.type = 'bandpass';
        bpf.frequency.setValueAtTime(850, now);
        bpf.Q.setValueAtTime(6.0, now);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.4, now + 0.005);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

        osc.connect(bpf);
        bpf.connect(gain);
        gain.connect(panner);

        osc.start(now);
        osc.stop(now + 0.09);
      }, i * 260);
    }
  }

  /**
   * SUPERNATURAL DRONE / COLD BREEZE:
   * Eerie detuned tones that swell and fade
   */
  public playSupernaturalDrone(duration: number = 4.0) {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(54, now);

    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(54.7, now); // Detuned for sinister binaural beating

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(140, now);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.35, now + 1.2);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + duration + 0.1);
    osc2.stop(now + duration + 0.1);
  }

  /**
   * VINTAGE RADIO STATIC & TUNING WHISTLE
   */
  public playRadioStatic(duration: number = 2.5) {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    const bufferSize = this.ctx.sampleRate * duration;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const bpf = this.ctx.createBiquadFilter();
    bpf.type = 'bandpass';
    bpf.frequency.setValueAtTime(1600, now);
    bpf.Q.setValueAtTime(3.5, now);

    // Whistle
    const whistle = this.ctx.createOscillator();
    whistle.type = 'sine';
    whistle.frequency.setValueAtTime(1800, now);
    whistle.frequency.exponentialRampToValueAtTime(2400, now + duration);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.25, now + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    noise.connect(bpf);
    bpf.connect(gain);
    whistle.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(now);
    whistle.start(now);
    noise.stop(now + duration);
    whistle.stop(now + duration);
  }

  /**
   * MATCH STRIKE:
   * Striking a match to light the kupi / lantern
   */
  public playMatchStrike() {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    const bufferSize = Math.floor(this.ctx.sampleRate * 0.4);
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.08));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const hpf = this.ctx.createBiquadFilter();
    hpf.type = 'highpass';
    hpf.frequency.setValueAtTime(1800, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.4, now);

    noise.connect(hpf);
    hpf.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(now);
  }

  public dispose() {
    if (this.cricketsNode?.intervalId) {
      clearInterval(this.cricketsNode.intervalId);
    }
    if (this.ctx && this.ctx.state !== 'closed') {
      this.ctx.close();
    }
    this.isInitialized = false;
    this.ctx = null;
  }
}
