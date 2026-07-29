/* ==========================================================================
   FUTURISTIC AI BIRTHDAY CAKE - AUDIO SYNTHESIZER (WEB AUDIO API)
   ========================================================================== */

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.ambientGain = null;
    this.isMuted = false;
    this.isInitialized = false;
  }

  init() {
    if (this.isInitialized) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
      this.isInitialized = true;
      this.startAmbientMusic();
    } catch (e) {
      console.warn("Web Audio API not supported:", e);
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.ambientGain && this.ctx) {
      this.ambientGain.gain.setValueAtTime(
        this.isMuted ? 0 : 0.15,
        this.ctx.currentTime
      );
    }
    return this.isMuted;
  }

  // ------------------------------------------------------------------------
  // Background Sci-Fi Ambient Synth Pad
  // ------------------------------------------------------------------------
  startAmbientMusic() {
    if (!this.ctx || this.isMuted) return;

    // Master ambient gain
    this.ambientGain = this.ctx.createGain();
    this.ambientGain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    this.ambientGain.connect(this.ctx.destination);

    // Create 3 harmonic synth oscillators for sci-fi atmosphere
    const freqs = [110, 164.81, 220]; // A2, E3, A3
    freqs.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      const oscGain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      // Slow pulse modulation
      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(0.2 + idx * 0.1, this.ctx.currentTime);
      lfoGain.gain.setValueAtTime(5, this.ctx.currentTime);

      lfo.connect(osc.frequency);
      oscGain.gain.setValueAtTime(0.3, this.ctx.currentTime);

      osc.connect(oscGain);
      oscGain.connect(this.ambientGain);

      osc.start();
      lfo.start();
    });
  }

  fadeOutMusic(durationSec = 3) {
    if (this.ambientGain && this.ctx) {
      this.ambientGain.gain.exponentialRampToValueAtTime(
        0.0001,
        this.ctx.currentTime + durationSec
      );
    }
  }

  // ------------------------------------------------------------------------
  // Robotic Arm Mechanical Sound Effect
  // ------------------------------------------------------------------------
  playRobotArmSound() {
    if (!this.ctx || this.isMuted) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(60, this.ctx.currentTime + 1.2);

    gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 1.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 1.2);
  }

  // ------------------------------------------------------------------------
  // Glowing Laser Knife Ignition & Slice Hum
  // ------------------------------------------------------------------------
  playLaserKnifeSound() {
    if (!this.ctx || this.isMuted) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.15);
    osc.frequency.linearRampToValueAtTime(320, now + 0.6);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(now + 0.6);
  }

  // ------------------------------------------------------------------------
  // Fireworks Celebration Pop Effect
  // ------------------------------------------------------------------------
  playFireworksSound() {
    if (!this.ctx || this.isMuted) return;

    const count = 4;
    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const bufferSize = this.ctx.sampleRate * 0.25;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const output = buffer.getChannelData(0);

        for (let j = 0; j < bufferSize; j++) {
          output[j] = Math.random() * 2 - 1;
        }

        const whiteNoise = this.ctx.createBufferSource();
        whiteNoise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1000 + Math.random() * 2000, now);
        filter.Q.setValueAtTime(3, now);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

        whiteNoise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        whiteNoise.start(now);
      }, i * 300);
    }
  }

  // ------------------------------------------------------------------------
  // Synthesized Crowd Cheers & Applause
  // ------------------------------------------------------------------------
  playApplauseSound() {
    if (!this.ctx || this.isMuted) return;

    const now = this.ctx.currentTime;
    const duration = 2.5;
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.sin(i / 100);
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.18, now + 0.5);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start(now);
  }

  // ------------------------------------------------------------------------
  // Slice Eating Crunch / Sci-Fi Energy Bite Sound
  // ------------------------------------------------------------------------
  playBiteSound() {
    if (!this.ctx || this.isMuted) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(150, now + 0.12);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.12);
  }
}

const audioEngine = new SoundEngine();
