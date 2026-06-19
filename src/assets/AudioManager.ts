import Phaser from "phaser";

interface Note {
  freq: number;
  start: number;
  dur: number;
  vol?: number;
  type?: OscillatorType;
}

const REGISTRY_AUDIO_UNLOCKED = "audioUnlocked";

/**
 * Fantasy SFX via a dedicated Web Audio context (reliable across Phaser sound backends).
 */
export class AudioManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private musicTimer: Phaser.Time.TimerEvent | null = null;
  private musicStarted = false;
  private unlocked = false;

  constructor(private readonly scene: Phaser.Scene) {
    if (this.scene.registry.get(REGISTRY_AUDIO_UNLOCKED)) {
      this.unlocked = true;
      this.ensureContext();
    }
  }

  unlock(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    if (ctx.state === "suspended") {
      void ctx.resume();
    }
    this.unlocked = true;
    this.scene.registry.set(REGISTRY_AUDIO_UNLOCKED, true);
  }

  startMusic(muted: boolean): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.unlocked || this.musicStarted) return;
    this.musicStarted = true;
    this.setMuted(muted);
    this.scheduleMusicLoop();
    this.musicTimer = this.scene.time.addEvent({
      delay: 8000,
      loop: true,
      callback: () => this.scheduleMusicLoop(),
    });
  }

  stopMusic(): void {
    this.musicTimer?.remove(false);
    this.musicTimer = null;
    this.musicStarted = false;
    if (!this.musicGain || !this.ctx) return;
    const now = this.ctx.currentTime;
    this.musicGain.gain.cancelScheduledValues(now);
    this.musicGain.gain.linearRampToValueAtTime(0.0001, now + 0.12);
  }

  setMuted(muted: boolean): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.musicGain) return;
    const now = ctx.currentTime;
    this.musicGain.gain.cancelScheduledValues(now);
    this.musicGain.gain.linearRampToValueAtTime(muted ? 0.0001 : 0.22, now + 0.08);
  }

  playShoot(muted: boolean): void {
    if (muted) return;
    this.playNotes([
      { freq: 880, start: 0, dur: 0.06, vol: 0.08, type: "sine" },
      { freq: 1175, start: 0.04, dur: 0.1, vol: 0.06, type: "triangle" },
    ]);
  }

  playPickup(muted: boolean): void {
    if (muted) return;
    this.playNotes([
      { freq: 523, start: 0, dur: 0.12, vol: 0.14, type: "sine" },
      { freq: 659, start: 0.08, dur: 0.18, vol: 0.12, type: "sine" },
      { freq: 988, start: 0.14, dur: 0.22, vol: 0.08, type: "triangle" },
    ]);
  }

  playShield(muted: boolean): void {
    if (muted) return;
    this.playNotes([
      { freq: 392, start: 0, dur: 0.35, vol: 0.1, type: "sine" },
      { freq: 523, start: 0.02, dur: 0.4, vol: 0.09, type: "sine" },
      { freq: 659, start: 0.04, dur: 0.45, vol: 0.07, type: "triangle" },
      { freq: 784, start: 0.06, dur: 0.5, vol: 0.05, type: "triangle" },
    ]);
  }

  playHit(muted: boolean): void {
    if (muted) return;
    this.playNotes([
      { freq: 73, start: 0, dur: 0.28, vol: 0.22, type: "sine" },
      { freq: 55, start: 0.05, dur: 0.35, vol: 0.18, type: "sawtooth" },
    ]);
    this.playNoiseBurst(0.2, 0.18);
  }

  playVictory(muted: boolean): void {
    if (muted) return;
    this.playNotes([
      { freq: 392, start: 0, dur: 0.2, vol: 0.12, type: "sine" },
      { freq: 494, start: 0.15, dur: 0.2, vol: 0.12, type: "sine" },
      { freq: 587, start: 0.3, dur: 0.25, vol: 0.14, type: "sine" },
      { freq: 784, start: 0.45, dur: 0.5, vol: 0.1, type: "triangle" },
    ]);
  }

  playGameOver(muted: boolean): void {
    if (muted) return;
    this.playNotes([
      { freq: 294, start: 0, dur: 0.35, vol: 0.14, type: "sine" },
      { freq: 262, start: 0.28, dur: 0.35, vol: 0.13, type: "sine" },
      { freq: 220, start: 0.56, dur: 0.4, vol: 0.12, type: "triangle" },
      { freq: 165, start: 0.88, dur: 0.6, vol: 0.1, type: "triangle" },
    ]);
  }

  private ensureContext(): AudioContext | null {
    if (this.ctx) return this.ctx;

    const Ctx =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctx) return null;

    try {
      this.ctx = new Ctx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.85;
      this.masterGain.connect(this.ctx.destination);
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = 0.0001;
      this.musicGain.connect(this.masterGain);
    } catch {
      return null;
    }

    return this.ctx;
  }

  private playNotes(notes: Note[]): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.unlocked || !this.masterGain) return;

    const now = ctx.currentTime;

    for (const n of notes) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = n.type ?? "sine";
      osc.frequency.setValueAtTime(n.freq, now + n.start);

      const peak = n.vol ?? 0.15;
      const t0 = now + n.start;
      const t1 = t0 + 0.012;
      const tEnd = t0 + n.dur;

      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.linearRampToValueAtTime(peak, t1);
      gain.gain.exponentialRampToValueAtTime(0.0001, tEnd);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t0);
      osc.stop(tEnd + 0.05);
    }
  }

  private playNoiseBurst(duration: number, volume: number): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.unlocked || !this.masterGain) return;

    const bufferSize = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 320;

    const gain = ctx.createGain();
    const now = ctx.currentTime;
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    source.start(now);
    source.stop(now + duration);
  }

  private scheduleMusicLoop(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.unlocked || !this.musicGain) return;

    const start = ctx.currentTime + 0.04;
    const melody = [
      440, 523.25, 587.33, 659.25, 587.33, 523.25, 392, 440,
      523.25, 659.25, 783.99, 659.25, 587.33, 523.25, 440, 392,
    ];
    const bass = [110, 146.83, 130.81, 98];

    melody.forEach((freq, index) => {
      this.playPluck(freq, start + index * 0.5, 0.34, index % 4 === 0 ? 0.1 : 0.07);
      if (index % 2 === 1) {
        this.playPluck(freq * 2, start + index * 0.5 + 0.12, 0.16, 0.035, "square");
      }
    });

    bass.forEach((freq, index) => {
      this.playDrone(freq, start + index * 2, 1.82);
    });
  }

  private playPluck(
    freq: number,
    start: number,
    dur: number,
    volume: number,
    type: OscillatorType = "triangle"
  ): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.musicGain) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.996, start + dur);
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(1800, start);
    filter.frequency.exponentialRampToValueAtTime(550, start + dur);

    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.linearRampToValueAtTime(volume, start + 0.018);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);
    osc.start(start);
    osc.stop(start + dur + 0.05);
  }

  private playDrone(freq: number, start: number, dur: number): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.musicGain) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(freq, start);
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(360, start);

    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.linearRampToValueAtTime(0.04, start + 0.08);
    gain.gain.setValueAtTime(0.04, start + dur - 0.18);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);
    osc.start(start);
    osc.stop(start + dur + 0.05);
  }
}
