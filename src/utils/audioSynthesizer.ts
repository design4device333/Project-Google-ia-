// Audio synthesizer for PS5 UI sounds and character voice frequency simulation
class SoundEffects {
  private ctx: AudioContext | null = null;

  private init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // PS5 UI click / hover sound
  playClick() {
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, this.ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.05); // A5

      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.06);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.06);
    } catch {
      // Audio context might be restricted before user gesture
    }
  }

  // Generation / Success fanfare sound (PS5 achievement chime)
  playSuccess() {
    try {
      this.init();
      if (!this.ctx) return;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.08);

        gain.gain.setValueAtTime(0.09, this.ctx.currentTime + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + idx * 0.08 + 0.25);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(this.ctx.currentTime + idx * 0.08);
        osc.stop(this.ctx.currentTime + idx * 0.08 + 0.25);
      });
    } catch {}
  }

  // Tactical radio comms beep / voice snippet simulation
  playRadioComms(pitchType: string = 'mid') {
    try {
      this.init();
      if (!this.ctx) return;
      const baseFreq = pitchType.includes('Grave') ? 140 : pitchType.includes('Aguda') ? 290 : 210;

      // 1. Radio click / static squelch
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(baseFreq * 1.5, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(baseFreq, this.ctx.currentTime + 0.15);

      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.35);

      // Add slight bandpass filter for radio walkie-talkie feel
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1200, this.ctx.currentTime);
      filter.Q.setValueAtTime(3, this.ctx.currentTime);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.35);

      // Second beep
      setTimeout(() => {
        if (!this.ctx) return;
        const beep = this.ctx.createOscillator();
        const bGain = this.ctx.createGain();
        beep.type = 'sine';
        beep.frequency.setValueAtTime(baseFreq * 2, this.ctx.currentTime);
        bGain.gain.setValueAtTime(0.05, this.ctx.currentTime);
        bGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.1);
        beep.connect(bGain);
        bGain.connect(this.ctx.destination);
        beep.start();
        beep.stop(this.ctx.currentTime + 0.1);
      }, 360);
    } catch {}
  }
}

export const sound = new SoundEffects();
