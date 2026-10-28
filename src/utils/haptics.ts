// Web Vibration API utility with intensity scaling & visual pulse listener

export type HapticTriggerType = 'inhale' | 'holdIn' | 'exhale' | 'holdOut' | 'tick' | 'complete' | 'test';

type HapticListener = (type: HapticTriggerType) => void;
const listeners = new Set<HapticListener>();

export const addHapticListener = (listener: HapticListener) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const hasVibrationSupport = (): boolean => {
  return typeof window !== 'undefined' && typeof navigator !== 'undefined' && 'vibrate' in navigator;
};

const getIntensityMultiplier = (intensity: 'light' | 'medium' | 'strong'): number => {
  switch (intensity) {
    case 'light':
      return 0.7;
    case 'strong':
      return 1.4;
    case 'medium':
    default:
      return 1.0;
  }
};

const scalePattern = (pattern: number[], mult: number): number[] => {
  return pattern.map((val) => Math.max(10, Math.round(val * mult)));
};

export const triggerHaptic = (
  type: HapticTriggerType,
  intensity: 'light' | 'medium' | 'strong' = 'medium',
  enabled: boolean = true
) => {
  // Always notify UI listeners so visual haptic ripple/wave triggers
  listeners.forEach((listener) => {
    try {
      listener(type);
    } catch {
      // ignore
    }
  });

  if (!enabled) return;

  const mult = getIntensityMultiplier(intensity);

  let rawPattern: number[];
  switch (type) {
    case 'inhale':
      // 2 gentle pulses signifying expansion
      rawPattern = [45, 60, 45];
      break;
    case 'holdIn':
      // 1 distinct crisp pulse for retaining breath
      rawPattern = [80];
      break;
    case 'exhale':
      // 1 smooth relaxing pulse for release
      rawPattern = [65];
      break;
    case 'holdOut':
      // 1 gentle soft pulse for resting lungs
      rawPattern = [50];
      break;
    case 'tick':
      // Micro-tick for counting seconds
      rawPattern = [15];
      break;
    case 'complete':
      // Celebratory multi-pulse
      rawPattern = [100, 80, 100, 80, 260];
      break;
    case 'test':
      rawPattern = [70, 70, 70];
      break;
  }

  const finalPattern = scalePattern(rawPattern, mult);

  if (hasVibrationSupport()) {
    try {
      navigator.vibrate(finalPattern);
    } catch (e) {
      console.warn('Vibration failed:', e);
    }
  }
};
