import { BreathingPreset, HapticConfig, AudioConfig, SessionStats, SessionRecord, ThemeMode } from '../types/breathing';
import { DEFAULT_PRESETS } from '../data/defaultPresets';

const STORAGE_KEYS = {
  PRESETS: 'zenpulse_presets_v1',
  SELECTED_PRESET_ID: 'zenpulse_selected_preset_v1',
  HAPTIC_CONFIG: 'zenpulse_haptic_config_v1',
  AUDIO_CONFIG: 'zenpulse_audio_config_v1',
  SESSION_STATS: 'zenpulse_session_stats_v1',
  THEME: 'zenpulse_theme_v1',
};

export const getStoredPresets = (): BreathingPreset[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PRESETS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to read presets from storage:', e);
  }
  return DEFAULT_PRESETS;
};

export const savePresets = (presets: BreathingPreset[]) => {
  try {
    localStorage.setItem(STORAGE_KEYS.PRESETS, JSON.stringify(presets));
  } catch (e) {
    console.warn('Failed to save presets:', e);
  }
};

export const getSelectedPresetId = (): string => {
  try {
    return localStorage.getItem(STORAGE_KEYS.SELECTED_PRESET_ID) || 'box-breathing';
  } catch {
    return 'box-breathing';
  }
};

export const saveSelectedPresetId = (id: string) => {
  try {
    localStorage.setItem(STORAGE_KEYS.SELECTED_PRESET_ID, id);
  } catch (e) {
    console.warn('Failed to save selected preset ID:', e);
  }
};

export const getHapticConfig = (): HapticConfig => {
  const defaults: HapticConfig = {
    enabled: true,
    intensity: 'medium',
    vibrateOnTick: false,
    vibrateOnPhaseChange: true,
  };
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.HAPTIC_CONFIG);
    if (raw) {
      return { ...defaults, ...JSON.parse(raw) };
    }
  } catch {
    // fallback
  }
  return defaults;
};

export const saveHapticConfig = (config: HapticConfig) => {
  try {
    localStorage.setItem(STORAGE_KEYS.HAPTIC_CONFIG, JSON.stringify(config));
  } catch (e) {
    console.warn('Failed to save haptic config:', e);
  }
};

export const getAudioConfig = (): AudioConfig => {
  const defaults: AudioConfig = {
    enabled: true,
    volume: 0.6,
    bellType: 'tibetan',
    ambientEnabled: false,
    ambientType: 'lofi',
    ambientVolume: 0.35,
  };
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.AUDIO_CONFIG);
    if (raw) {
      return { ...defaults, ...JSON.parse(raw) };
    }
  } catch {
    // fallback
  }
  return defaults;
};

export const saveAudioConfig = (config: AudioConfig) => {
  try {
    localStorage.setItem(STORAGE_KEYS.AUDIO_CONFIG, JSON.stringify(config));
  } catch (e) {
    console.warn('Failed to save audio config:', e);
  }
};

export const getSessionStats = (): SessionStats => {
  const defaults: SessionStats = {
    totalSessions: 0,
    totalSeconds: 0,
    currentStreakDays: 0,
    lastSessionDate: '',
    history: [],
  };
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SESSION_STATS);
    if (raw) {
      return { ...defaults, ...JSON.parse(raw) };
    }
  } catch {
    // fallback
  }
  return defaults;
};

export const recordCompletedSession = (record: Omit<SessionRecord, 'id' | 'timestamp'>) => {
  try {
    const currentStats = getSessionStats();
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    
    // Streak logic
    let newStreak = currentStats.currentStreakDays;
    if (!currentStats.lastSessionDate) {
      newStreak = 1;
    } else if (currentStats.lastSessionDate === todayStr) {
      // Already practiced today, keep streak
    } else {
      const lastDate = new Date(currentStats.lastSessionDate);
      const diffTime = Math.abs(now.getTime() - lastDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays <= 2) {
        newStreak += 1;
      } else {
        newStreak = 1;
      }
    }

    const fullRecord: SessionRecord = {
      ...record,
      id: 'session_' + Date.now(),
      timestamp: Date.now(),
    };

    const updatedStats: SessionStats = {
      totalSessions: currentStats.totalSessions + 1,
      totalSeconds: currentStats.totalSeconds + record.durationSeconds,
      currentStreakDays: newStreak,
      lastSessionDate: todayStr,
      history: [fullRecord, ...currentStats.history.slice(0, 49)], // keep last 50
    };

    localStorage.setItem(STORAGE_KEYS.SESSION_STATS, JSON.stringify(updatedStats));
    return updatedStats;
  } catch (e) {
    console.warn('Failed to record session:', e);
    return getSessionStats();
  }
};

export const getStoredTheme = (): ThemeMode => {
  try {
    return (localStorage.getItem(STORAGE_KEYS.THEME) as ThemeMode) || 'zen-dark';
  } catch {
    return 'zen-dark';
  }
};

export const saveStoredTheme = (theme: ThemeMode) => {
  try {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  } catch (e) {
    console.warn('Failed to save theme:', e);
  }
};

export const getStoredShapeMode = (): 'square' | 'circle' => {
  try {
    const val = localStorage.getItem('zenpulse_shape_mode_v1');
    if (val === 'square' || val === 'circle') return val;
  } catch {
    // fallback
  }
  return 'square';
};

export const saveStoredShapeMode = (mode: 'square' | 'circle') => {
  try {
    localStorage.setItem('zenpulse_shape_mode_v1', mode);
  } catch (e) {
    console.warn('Failed to save shape mode:', e);
  }
};

export const getStoredSessionDuration = (): number => {
  try {
    const val = localStorage.getItem('zenpulse_session_duration_v1');
    if (val !== null) {
      const num = Number(val);
      if (!isNaN(num) && num >= 0) return num;
    }
  } catch {
    // fallback
  }
  return 300; // default 5 minutes
};

export const saveStoredSessionDuration = (duration: number) => {
  try {
    localStorage.setItem('zenpulse_session_duration_v1', String(duration));
  } catch (e) {
    console.warn('Failed to save session duration:', e);
  }
};

export const clearSessionStats = (): SessionStats => {
  const empty: SessionStats = {
    totalSessions: 0,
    totalSeconds: 0,
    currentStreakDays: 0,
    lastSessionDate: '',
    history: [],
  };
  try {
    localStorage.setItem(STORAGE_KEYS.SESSION_STATS, JSON.stringify(empty));
  } catch (e) {
    console.warn('Failed to clear stats:', e);
  }
  return empty;
};
