// Web Audio API Synthesizer for high-energy arcade effects & Gemini TTS Player

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export const SoundEngine = {
  // Sound 1: Dice Roll Shake & Land
  playDiceRoll() {
    try {
      const ctx = getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      
      const now = ctx.currentTime;
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.12);
      
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.13);
    } catch (e) {
      // Audio might be muted or not allowed before gesture
    }
  },

  // Sound 2: Board Hop Step
  playBoardHop() {
    try {
      const ctx = getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      
      const now = ctx.currentTime;
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);
      
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.09);
    } catch (e) {}
  },

  // Sound 3: Coin Chime Bonanza
  playCoinChime() {
    try {
      const ctx = getAudioContext();
      const freqs = [987.77, 1318.51, 1567.98, 2093.0];
      const now = ctx.currentTime;
      
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.04);
        
        gain.gain.setValueAtTime(0.1, now + idx * 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.04 + 0.15);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.04);
        osc.stop(now + idx * 0.04 + 0.16);
      });
    } catch (e) {}
  },

  // Sound 4: Reflex Tap Laser Zap
  playLaserHit(pitchMultiplier = 1.0) {
    try {
      const ctx = getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      
      const now = ctx.currentTime;
      osc.frequency.setValueAtTime(800 * pitchMultiplier, now);
      osc.frequency.exponentialRampToValueAtTime(200 * pitchMultiplier, now + 0.1);
      
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.11);
    } catch (e) {}
  },

  // Sound 5: Perfect Combo Fanfare
  playComboChime(comboCount = 1) {
    try {
      const ctx = getAudioContext();
      const baseFreq = Math.min(1200, 440 + comboCount * 60);
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      
      const now = ctx.currentTime;
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, now + 0.18);
      
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.19);
    } catch (e) {}
  },

  // Sound 6: Town Upgrade Construction Chime
  playUpgradeFanfare() {
    try {
      const ctx = getAudioContext();
      const notes = [523.25, 659.25, 783.99, 1046.50];
      const now = ctx.currentTime;
      notes.forEach((note, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(note, now + idx * 0.07);
        
        gain.gain.setValueAtTime(0.12, now + idx * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.25);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.07);
        osc.stop(now + idx * 0.07 + 0.26);
      });
    } catch (e) {}
  },

  // Sound 7: Miss / Error Buzzer
  playErrorBuzz() {
    try {
      const ctx = getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      
      const now = ctx.currentTime;
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.linearRampToValueAtTime(90, now + 0.2);
      
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.21);
    } catch (e) {}
  },

  // Sound 8: Cute Mascot Cuddle Pop
  playPop() {
    try {
      const ctx = getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';

      const now = ctx.currentTime;
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.exponentialRampToValueAtTime(1174.66, now + 0.08); // D6

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.09);
    } catch (e) {}
  },

  // Sound 9: Gentle UI Tile Step
  playTileStep() {
    try {
      const ctx = getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';

      const now = ctx.currentTime;
      osc.frequency.setValueAtTime(650, now);
      osc.frequency.exponentialRampToValueAtTime(820, now + 0.05);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.06);
    } catch (e) {}
  },

  // Sound 10: Powerup / Companion Equip Sparkle
  playPowerup() {
    try {
      const ctx = getAudioContext();
      const notes = [440, 554.37, 659.25, 880];
      const now = ctx.currentTime;
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.05);

        gain.gain.setValueAtTime(0.12, now + idx * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.14);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.05);
        osc.stop(now + idx * 0.05 + 0.15);
      });
    } catch (e) {}
  },

  // Sound 11: Gentle Mascot Coo & Soft Purr
  playCoo() {
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;

      // Primary melodic coo tone (soft curved sine wave)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';

      // Gentle pitch curve: coo swoops softly up and nestles down
      osc.frequency.setValueAtTime(430, now);
      osc.frequency.exponentialRampToValueAtTime(590, now + 0.12);
      osc.frequency.exponentialRampToValueAtTime(470, now + 0.34);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.18, now + 0.07);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.36);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.38);

      // Sweet harmonic overtone for warm gentle cooing resonance
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(860, now);
      osc2.frequency.exponentialRampToValueAtTime(1180, now + 0.12);
      osc2.frequency.exponentialRampToValueAtTime(940, now + 0.34);

      gain2.gain.setValueAtTime(0.005, now);
      gain2.gain.linearRampToValueAtTime(0.05, now + 0.07);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.32);

      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now);
      osc2.stop(now + 0.34);
    } catch (e) {}
  },

  // Sound 12: Playful Spring Bounce (for trampoline / gummy furniture)
  playBounce() {
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';

      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(520, now + 0.15);
      osc.frequency.exponentialRampToValueAtTime(320, now + 0.3);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.33);
    } catch (e) {}
  },

  // Sound 13: Cozy Subterranean Lofi Chime Chord (for radio and fountains)
  playLofiTune() {
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;
      const chords = [392.0, 493.88, 587.33, 739.99]; // Gmaj7 dreamy voicing

      chords.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);

        gain.gain.setValueAtTime(0.001, now + idx * 0.08);
        gain.gain.linearRampToValueAtTime(0.1, now + idx * 0.08 + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 0.75);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.8);
      });
    } catch (e) {}
  },

  // Sound 14: Transit Chute Whoosh Zip (for suction pipes and slides)
  playWhooshZip() {
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';

      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(260, now + 0.35);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.18, now + 0.06);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.38);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.4);
    } catch (e) {}
  },

  // Sound 15: Subterranean Excavation Dig & Gem Unearth
  playExcavation() {
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;

      // Pickaxe / rumble tap
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(140, now);
      osc1.frequency.exponentialRampToValueAtTime(60, now + 0.2);
      gain1.gain.setValueAtTime(0.2, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.23);

      // Bright chime discovery
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + 0.15 + idx * 0.08);

        gain.gain.setValueAtTime(0.001, now + 0.15 + idx * 0.08);
        gain.gain.linearRampToValueAtTime(0.12, now + 0.15 + idx * 0.08 + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.15 + idx * 0.08 + 0.4);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + 0.15 + idx * 0.08);
        osc.stop(now + 0.15 + idx * 0.08 + 0.45);
      });
    } catch (e) {}
  },

  // Sound 16: Ultra-Cute Mascot Chirp & Bubbly Squeak
  playCuteChirp() {
    this.playMascotSqueak('chirp');
  },

  // Sound 17: Multi-Style Procedural Mascot Noises & Squeaks
  // Mascots never talk English words; they only make adorable animal/creature noises!
  playMascotSqueak(style: 'squeak' | 'chirp' | 'purr' | 'boing' | 'giggle' | 'pip' = 'squeak') {
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;

      if (style === 'squeak') {
        // High-pitched rubber-ducky / plushie chibi squeak
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(820, now);
        osc.frequency.exponentialRampToValueAtTime(2150, now + 0.07);
        osc.frequency.exponentialRampToValueAtTime(1620, now + 0.16);

        gain.gain.setValueAtTime(0.01, now);
        gain.gain.linearRampToValueAtTime(0.24, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

        // High harmonic sparkle overtone
        const overtone = ctx.createOscillator();
        const overGain = ctx.createGain();
        overtone.type = 'triangle';
        overtone.frequency.setValueAtTime(1640, now);
        overtone.frequency.exponentialRampToValueAtTime(3200, now + 0.08);
        overGain.gain.setValueAtTime(0.005, now);
        overGain.gain.linearRampToValueAtTime(0.09, now + 0.03);
        overGain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

        osc.connect(gain);
        gain.connect(ctx.destination);
        overtone.connect(overGain);
        overGain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.19);
        overtone.start(now);
        overtone.stop(now + 0.16);
      } else if (style === 'chirp') {
        // Two-part bouncy creature chirp
        // Chirp 1
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(1100, now);
        osc1.frequency.exponentialRampToValueAtTime(1750, now + 0.06);
        gain1.gain.setValueAtTime(0.01, now);
        gain1.gain.linearRampToValueAtTime(0.18, now + 0.02);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.start(now);
        osc1.stop(now + 0.08);

        // Chirp 2 (higher, joyful accent)
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(1480, now + 0.07);
        osc2.frequency.exponentialRampToValueAtTime(2450, now + 0.13);
        osc2.frequency.exponentialRampToValueAtTime(2050, now + 0.20);
        gain2.gain.setValueAtTime(0.01, now + 0.07);
        gain2.gain.linearRampToValueAtTime(0.20, now + 0.10);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start(now + 0.07);
        osc2.stop(now + 0.23);
      } else if (style === 'purr') {
        // Warm vibrating cat/creature purr with LFO tremolo
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.linearRampToValueAtTime(360, now + 0.2);
        osc.frequency.linearRampToValueAtTime(300, now + 0.38);

        // AM LFO for purring vibration
        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        lfo.type = 'sine';
        lfo.frequency.setValueAtTime(22, now); // 22Hz purr flutter
        lfoGain.gain.setValueAtTime(0.09, now);

        gain.gain.setValueAtTime(0.01, now);
        gain.gain.linearRampToValueAtTime(0.15, now + 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.40);

        lfo.connect(gain.gain);
        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        lfo.start(now);
        osc.stop(now + 0.42);
        lfo.stop(now + 0.42);
      } else if (style === 'boing') {
        // Playful cartoon spring-boing noise
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(740, now);
        osc.frequency.exponentialRampToValueAtTime(390, now + 0.05);
        osc.frequency.exponentialRampToValueAtTime(1180, now + 0.16);
        osc.frequency.exponentialRampToValueAtTime(840, now + 0.26);

        gain.gain.setValueAtTime(0.01, now);
        gain.gain.linearRampToValueAtTime(0.22, now + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.29);
      } else if (style === 'giggle') {
        // Four rapid ascending bubbly micro-squeaks (giggle)
        const notes = [1046.5, 1318.5, 1567.98, 2093.0]; // C6, E6, G6, C7
        notes.forEach((freq, idx) => {
          const t = now + idx * 0.045;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq * 0.95, t);
          osc.frequency.exponentialRampToValueAtTime(freq * 1.08, t + 0.03);

          gain.gain.setValueAtTime(0.01, t);
          gain.gain.linearRampToValueAtTime(0.16, t + 0.01);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(t);
          osc.stop(t + 0.07);
        });
      } else if (style === 'pip') {
        // Quick high-pitched pop/pip
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1450, now);
        osc.frequency.exponentialRampToValueAtTime(2250, now + 0.05);

        gain.gain.setValueAtTime(0.01, now);
        gain.gain.linearRampToValueAtTime(0.20, now + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.09);
      }
    } catch (e) {}
  },

  playMascotPurr() {
    this.playMascotSqueak('purr');
  },

  playMascotBoing() {
    this.playMascotSqueak('boing');
  },

  playMascotGiggle() {
    this.playMascotSqueak('giggle');
  },

  playMascotPip() {
    this.playMascotSqueak('pip');
  },
};

// Play Gemini 3.8 Flash Lite TTS Audio - DEPRECATED: Mascots do NOT speak words, they only squeak!
// Kept for backward compatibility but routes to pure mascot squeak
export async function playGeminiTTS(
  _base64Pcm?: string,
  _sampleRate = 24000,
  _cutePitchMultiplier = 1.3
): Promise<void> {
  SoundEngine.playMascotSqueak('squeak');
  return Promise.resolve();
}

// Fallback Voice - DEPRECATED: Mascots do NOT talk, they make noises and squeak!
export function playFallbackMascotVoice(_text?: string, _pitch = 1.75, _rate = 1.25) {
  SoundEngine.playMascotSqueak('squeak');
}
