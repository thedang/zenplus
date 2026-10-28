export type BreathingPhase = 'idle' | 'prepare' | 'inhale' | 'holdIn' | 'exhale' | 'holdOut' | 'completed';

export interface BreathingPreset {
  id: string;
  name: string;
  vietnameseTitle: string;
  description: string;
  inhale: number;    // seconds
  holdIn: number;    // seconds (giữ khí sau khi hít)
  exhale: number;    // seconds
  holdOut: number;   // seconds (giữ khí/nghỉ sau khi thở)
  defaultSessionDuration: number; // seconds, e.g. 180s = 3 minutes
  tag: string;
  colorScheme: {
    primary: string;
    glow: string;
    bgAccent: string;
  };
}

export interface HapticConfig {
  enabled: boolean;
  intensity: 'light' | 'medium' | 'strong';
  vibrateOnTick: boolean; // Rung nhẹ mỗi giây đếm nhịp
  vibrateOnPhaseChange: boolean; // Rung chuyển giai đoạn
}

export type AmbientSoundType = 'lofi' | 'whitenoise' | 'brownnoise' | 'rain' | 'ocean' | 'none';

export interface AudioConfig {
  enabled: boolean; // Chuông nhịp thở
  volume: number; // Âm lượng chuông (0 - 1)
  bellType: 'tibetan' | 'soft' | 'zen';
  ambientEnabled: boolean; // Bật nhạc nền / tiếng ồn trắng
  ambientType: AmbientSoundType; // Loại âm thanh nền
  ambientVolume: number; // Âm lượng nhạc nền độc lập (0 - 1)
}

export interface SessionRecord {
  id: string;
  timestamp: number;
  presetName: string;
  presetId: string;
  durationSeconds: number;
  cyclesCompleted: number;
}

export interface SessionStats {
  totalSessions: number;
  totalSeconds: number;
  currentStreakDays: number;
  lastSessionDate: string; // YYYY-MM-DD
  history: SessionRecord[];
}

export type ThemeMode = 'zen-dark' | 'deep-ocean' | 'forest-moss' | 'sunset-amber';
