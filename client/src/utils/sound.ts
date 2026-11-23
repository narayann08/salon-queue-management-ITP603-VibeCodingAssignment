// Web Audio API Synthesizer for Luxury Salon Chimes

class SoundManager {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  private initContext() {
    if (!this.ctx && typeof window !== "undefined") {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      void this.ctx.resume();
    }
  }

  public enableAudio(): boolean {
    this.initContext();
    return !!this.ctx;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
  }

  public playCallChime() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      
      // Dual-tone pentatonic chime (E5 -> B5 -> E6)
      const notes = [
        { freq: 659.25, time: now, duration: 0.35, gain: 0.15 },
        { freq: 987.77, time: now + 0.15, duration: 0.45, gain: 0.18 },
        { freq: 1318.51, time: now + 0.32, duration: 0.75, gain: 0.22 },
      ];

      for (const note of notes) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(note.freq, note.time);

        gain.gain.setValueAtTime(0, note.time);
        gain.gain.linearRampToValueAtTime(note.gain, note.time + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, note.time + note.duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(note.time);
        osc.stop(note.time + note.duration + 0.05);
      }
    } catch (e) {
      console.warn("Audio playback not permitted yet", e);
    }
  }

  public playTick() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(800, now);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.07);
    } catch {
      // ignore
    }
  }
}

export const soundManager = new SoundManager();
