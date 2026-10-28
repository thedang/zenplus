// Pure Web Audio API Meditative Sound Synthesizer & Lo-Fi / White Noise Generator

import { AmbientSoundType } from '../types/breathing';

let audioCtx: AudioContext | null = null;

const getAudioContext = (): AudioContext | null => {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
};

/* ========================================================
   Chimes & Breath Phase Audio Synthesizer
   ======================================================== */

export const playChime = (
  frequency: number,
  duration: number = 1.8,
  volume: number = 0.5,
  type: OscillatorType = 'sine',
  overtones: boolean = true
) => {
  if (volume <= 0) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const masterGain = ctx.createGain();
  masterGain.connect(ctx.destination);
  masterGain.gain.setValueAtTime(0.001, now);
  // Gentle attack to avoid click
  masterGain.gain.exponentialRampToValueAtTime(Math.max(0.01, volume * 0.4), now + 0.08);
  masterGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  // Fundamental frequency
  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, now);
  osc.connect(masterGain);
  osc.start(now);
  osc.stop(now + duration);

  // Harmonic overtone for singing bowl effect
  if (overtones) {
    const overtoneOsc = ctx.createOscillator();
    overtoneOsc.type = 'sine';
    overtoneOsc.frequency.setValueAtTime(frequency * 1.5, now);
    const overtoneGain = ctx.createGain();
    overtoneGain.gain.setValueAtTime(0.001, now);
    overtoneGain.gain.exponentialRampToValueAtTime(volume * 0.15, now + 0.05);
    overtoneGain.gain.exponentialRampToValueAtTime(0.0001, now + duration * 0.8);
    overtoneOsc.connect(overtoneGain);
    overtoneGain.connect(masterGain);
    overtoneOsc.start(now);
    overtoneOsc.stop(now + duration);
  }
};

export const playPhaseSound = (
  phase: 'inhale' | 'holdIn' | 'exhale' | 'holdOut',
  volume: number = 0.5
) => {
  switch (phase) {
    case 'inhale':
      // 432 Hz Solfeggio natural harmony
      playChime(432, 2.2, volume, 'sine', true);
      break;
    case 'holdIn':
      // 360 Hz Warm grounding bell
      playChime(360, 1.8, volume * 0.9, 'sine', true);
      break;
    case 'exhale':
      // 288 Hz Relaxing calming tone
      playChime(288, 2.5, volume, 'sine', true);
      break;
    case 'holdOut':
      // 240 Hz Deep stillness tone
      playChime(240, 1.8, volume * 0.85, 'sine', true);
      break;
  }
};

export const playCompletionCelebration = (volume: number = 0.6) => {
  const freqs = [384, 432, 576, 768];
  freqs.forEach((freq, index) => {
    setTimeout(() => {
      playChime(freq, 3.0, volume, 'sine', true);
    }, index * 260);
  });
};

export const playTickSound = (volume: number = 0.2) => {
  if (volume <= 0) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(600, now);
  osc.frequency.exponentialRampToValueAtTime(200, now + 0.03);
  gain.gain.setValueAtTime(volume * 0.08, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.03);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.035);
};

/* ========================================================
   Ambient Background Sound Engine (Lo-Fi, White/Brown Noise, Rain, Ocean)
   ======================================================== */

interface AmbientController {
  type: AmbientSoundType;
  masterGain: GainNode;
  nodesToStop: Array<{ stop?: () => void; disconnect: () => void }>;
  intervalId?: NodeJS.Timeout;
}

let activeAmbient: AmbientController | null = null;

// Helper: Generate White Noise AudioBuffer (5 seconds looped)
const createWhiteNoiseBuffer = (ctx: AudioContext, seconds: number = 5): AudioBuffer => {
  const bufferSize = ctx.sampleRate * seconds;
  const buffer = ctx.createBuffer(2, bufferSize, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const channelData = buffer.getChannelData(ch);
    for (let i = 0; i < bufferSize; i++) {
      channelData[i] = Math.random() * 2 - 1;
    }
  }
  return buffer;
};

// Helper: Generate Brown Noise AudioBuffer (gentle, deep soothing rumble)
const createBrownNoiseBuffer = (ctx: AudioContext, seconds: number = 5): AudioBuffer => {
  const bufferSize = ctx.sampleRate * seconds;
  const buffer = ctx.createBuffer(2, bufferSize, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const channelData = buffer.getChannelData(ch);
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      lastOut = (lastOut + 0.02 * white) / 1.02;
      channelData[i] = lastOut * 3.2; // Gain compensation
    }
  }
  return buffer;
};

// Helper: Generate Pink Noise AudioBuffer (natural rain/water frequency distribution)
const createPinkNoiseBuffer = (ctx: AudioContext, seconds: number = 5): AudioBuffer => {
  const bufferSize = ctx.sampleRate * seconds;
  const buffer = ctx.createBuffer(2, bufferSize, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const channelData = buffer.getChannelData(ch);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      channelData[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    }
  }
  return buffer;
};

export const stopAmbientSound = () => {
  if (!activeAmbient) return;
  const ctx = getAudioContext();
  if (ctx && activeAmbient.masterGain) {
    const now = ctx.currentTime;
    // Smooth fade out over 0.4s to prevent clicks
    try {
      activeAmbient.masterGain.gain.setValueAtTime(activeAmbient.masterGain.gain.value, now);
      activeAmbient.masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
    } catch {
      // ignore
    }
  }

  const current = activeAmbient;
  activeAmbient = null;

  setTimeout(() => {
    if (current.intervalId) clearInterval(current.intervalId);
    current.nodesToStop.forEach((node) => {
      try {
        if (node.stop) node.stop();
        node.disconnect();
      } catch {
        // ignore
      }
    });
  }, 400);
};

export const setAmbientVolume = (volume: number) => {
  if (!activeAmbient) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  try {
    activeAmbient.masterGain.gain.cancelScheduledValues(now);
    activeAmbient.masterGain.gain.setValueAtTime(activeAmbient.masterGain.gain.value, now);
    activeAmbient.masterGain.gain.linearRampToValueAtTime(Math.max(0.0001, volume * 0.35), now + 0.1);
  } catch {
    // fallback
    activeAmbient.masterGain.gain.value = volume * 0.35;
  }
};

export const isAmbientPlaying = (): boolean => {
  return activeAmbient !== null;
};

export const getActiveAmbientType = (): AmbientSoundType | null => {
  return activeAmbient ? activeAmbient.type : null;
};

export const startAmbientSound = (type: AmbientSoundType, volume: number = 0.4) => {
  if (type === 'none') {
    stopAmbientSound();
    return;
  }

  const ctx = getAudioContext();
  if (!ctx) return;

  // If already playing the same type, just adjust volume
  if (activeAmbient && activeAmbient.type === type) {
    setAmbientVolume(volume);
    return;
  }

  // Stop current before starting new
  stopAmbientSound();

  const now = ctx.currentTime;
  const masterGain = ctx.createGain();
  masterGain.connect(ctx.destination);
  masterGain.gain.setValueAtTime(0.0001, now);
  // Smooth fade-in over 0.8s
  masterGain.gain.linearRampToValueAtTime(Math.max(0.0001, volume * 0.35), now + 0.8);

  const nodesToStop: Array<{ stop?: () => void; disconnect: () => void }> = [masterGain];
  let intervalId: NodeJS.Timeout | undefined;

  switch (type) {
    case 'whitenoise': {
      // Gentle White Noise with lowpass filter at 3200Hz to remove harshness
      const buffer = createWhiteNoiseBuffer(ctx, 5);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(3200, now);

      source.connect(filter);
      filter.connect(masterGain);
      source.start(now);

      nodesToStop.push(source, filter);
      break;
    }

    case 'brownnoise': {
      // Deep warm Brown Noise (lowpass at 800Hz) - best for deep relaxation & sleep
      const buffer = createBrownNoiseBuffer(ctx, 5);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(750, now);

      source.connect(filter);
      filter.connect(masterGain);
      source.start(now);

      nodesToStop.push(source, filter);
      break;
    }

    case 'rain': {
      // Soothing Rain: Pink noise with soft bandpass + subtle raindrop flutter
      const buffer = createPinkNoiseBuffer(ctx, 6);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1400, now);
      filter.Q.setValueAtTime(0.8, now);

      const highShelf = ctx.createBiquadFilter();
      highShelf.type = 'highshelf';
      highShelf.frequency.setValueAtTime(3000, now);
      highShelf.gain.setValueAtTime(-6, now);

      source.connect(filter);
      filter.connect(highShelf);
      highShelf.connect(masterGain);
      source.start(now);

      nodesToStop.push(source, filter, highShelf);
      break;
    }

    case 'ocean': {
      // Ocean Waves: Pink noise modulated by low-frequency oscillator (~0.12 Hz wave swell)
      const buffer = createPinkNoiseBuffer(ctx, 8);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(400, now);
      filter.Q.setValueAtTime(2.5, now);

      // LFO for wave motion
      const lfo = ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(0.12, now); // 1 wave every ~8.3 seconds

      const lfoGain = ctx.createGain();
      lfoGain.gain.setValueAtTime(320, now); // Sweep filter between 80Hz and 720Hz

      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);

      source.connect(filter);
      filter.connect(masterGain);

      source.start(now);
      lfo.start(now);

      nodesToStop.push(source, filter, lfo, lfoGain);
      break;
    }

    case 'lofi': {
      // Lo-Fi Zen Ambient Chord Progression:
      // Meditative, lush analog warm chords (D minor 9th / F major 7th / A minor 9th) with slow filter breathing
      // Synthesized mathematically via detuned warm sine/triangle waves with tape warmth
      const chordNotes = [
        [146.83, 220.0, 261.63, 329.63, 392.0], // Dm9: D3, A3, C4, E4, G4
        [174.61, 261.63, 329.63, 392.0, 440.0], // Fmaj7: F3, C4, E4, G4, A4
        [220.0, 261.63, 329.63, 392.0, 493.88], // Am9: A3, C4, E4, G4, B4
        [196.0, 246.94, 293.66, 392.0, 440.0],  // G6: G3, B3, D4, G4, A4
      ];

      let currentChordIndex = 0;
      let activeOscs: OscillatorNode[] = [];
      let chordGain = ctx.createGain();
      chordGain.gain.setValueAtTime(0.001, now);
      chordGain.connect(masterGain);

      const lofiFilter = ctx.createBiquadFilter();
      lofiFilter.type = 'lowpass';
      lofiFilter.frequency.setValueAtTime(700, now);
      lofiFilter.Q.setValueAtTime(1.0, now);

      // Sub-drone 110Hz (A2) continuous warm foundation
      const subOsc = ctx.createOscillator();
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(110, now);
      const subGain = ctx.createGain();
      subGain.gain.setValueAtTime(0.18, now);
      subOsc.connect(subGain);
      subGain.connect(masterGain);
      subOsc.start(now);
      nodesToStop.push(subOsc, subGain);

      const playChord = (notes: number[]) => {
        if (!ctx) return;
        const cNow = ctx.currentTime;

        // Fade out previous chord smoothly
        chordGain.gain.cancelScheduledValues(cNow);
        chordGain.gain.setValueAtTime(chordGain.gain.value, cNow);
        chordGain.gain.linearRampToValueAtTime(0.001, cNow + 0.8);

        setTimeout(() => {
          activeOscs.forEach((o) => {
            try {
              o.stop();
              o.disconnect();
            } catch {
              // ignore
            }
          });
          activeOscs = [];

          if (!activeAmbient) return;
          const nextTime = ctx.currentTime;
          chordGain = ctx.createGain();
          chordGain.gain.setValueAtTime(0.001, nextTime);
          chordGain.gain.linearRampToValueAtTime(0.25, nextTime + 1.2);
          chordGain.connect(lofiFilter);
          lofiFilter.connect(masterGain);

          notes.forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
            // Subtle lo-fi analog detune (+- 1.5 Hz)
            osc.frequency.setValueAtTime(freq + (Math.random() * 2 - 1) * 1.2, nextTime);
            osc.connect(chordGain);
            osc.start(nextTime);
            activeOscs.push(osc);
            nodesToStop.push(osc);
          });
        }, 800);
      };

      // Play first chord immediately
      playChord(chordNotes[0]);

      // Cycle chords every 7 seconds
      intervalId = setInterval(() => {
        currentChordIndex = (currentChordIndex + 1) % chordNotes.length;
        playChord(chordNotes[currentChordIndex]);
      }, 7000);

      nodesToStop.push(chordGain, lofiFilter);
      break;
    }
  }

  activeAmbient = {
    type,
    masterGain,
    nodesToStop,
    intervalId,
  };
};
