import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BreathingPhase, BreathingPreset, HapticConfig, AudioConfig, SessionStats } from './types/breathing';
import { DEFAULT_PRESETS } from './data/defaultPresets';
import {
  getStoredPresets,
  savePresets,
  getSelectedPresetId,
  saveSelectedPresetId,
  getHapticConfig,
  saveHapticConfig,
  getAudioConfig,
  saveAudioConfig,
  getSessionStats,
  recordCompletedSession,
  getStoredShapeMode,
  saveStoredShapeMode,
  getStoredSessionDuration,
  saveStoredSessionDuration,
  clearSessionStats,
} from './utils/storage';
import { triggerHaptic } from './utils/haptics';
import {
  playPhaseSound,
  playCompletionCelebration,
  playTickSound,
  startAmbientSound,
  stopAmbientSound,
  setAmbientVolume,
} from './utils/sound';
import { BreathingVisualizer } from './components/BreathingVisualizer';
import { PresetSelector } from './components/PresetSelector';
import { ConfigModal } from './components/ConfigModal';
import { SessionSummaryModal } from './components/SessionSummaryModal';
import { StatsDrawer } from './components/StatsDrawer';
import { BlindfoldMode } from './components/BlindfoldMode';
import { DeviceFrameWrapper } from './components/DeviceFrameWrapper';
import { ExportSourceModal } from './components/ExportSourceModal';
import {
  Play,
  Pause,
  RotateCcw,
  SlidersHorizontal,
  BarChart3,
  EyeOff,
  Smartphone,
  Volume2,
  VolumeX,
  Flame,
  Info,
  Music,
  Download,
  Cloud,
} from 'lucide-react';

export default function App() {
  // Presets and Active Selection
  const [presets, setPresets] = useState<BreathingPreset[]>(DEFAULT_PRESETS);
  const [selectedPresetId, setSelectedPresetId] = useState<string>('box-breathing');

  // Haptic & Audio Config
  const [hapticConfig, setHapticConfig] = useState<HapticConfig>(getHapticConfig());
  const [audioConfig, setAudioConfig] = useState<AudioConfig>(getAudioConfig());
  const [stats, setStats] = useState<SessionStats>(getSessionStats());

  // Breathing Engine State
  const [phase, setPhase] = useState<BreathingPhase>('idle');
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [phaseSecondsLeft, setPhaseSecondsLeft] = useState<number>(0);
  const [phaseTotalSeconds, setPhaseTotalSeconds] = useState<number>(0);
  const [cycleCount, setCycleCount] = useState<number>(0);

  // Job (Session) Timer
  const [sessionDuration, setSessionDuration] = useState<number>(300); // 5 min default
  const [sessionSecondsElapsed, setSessionSecondsElapsed] = useState<number>(0);

  // Modals & Views
  const [isConfigOpen, setIsConfigOpen] = useState<boolean>(false);
  const [isStatsOpen, setIsStatsOpen] = useState<boolean>(false);
  const [isSummaryOpen, setIsSummaryOpen] = useState<boolean>(false);
  const [isBlindfoldActive, setIsBlindfoldActive] = useState<boolean>(false);
  const [showVibrationToast, setShowVibrationToast] = useState<boolean>(false);
  const [shapeMode, setShapeMode] = useState<'square' | 'circle'>('square');
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);

  // References for tick loops
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Load stored state on mount
  useEffect(() => {
    const loadedPresets = getStoredPresets();
    const storedPresetId = getSelectedPresetId();
    setPresets(loadedPresets);
    setSelectedPresetId(storedPresetId);

    const activePreset = loadedPresets.find((p) => p.id === storedPresetId) || loadedPresets[0];
    if (activePreset) {
      setSessionDuration(activePreset.defaultSessionDuration);
    }
  }, []);

  const activePreset = presets.find((p) => p.id === selectedPresetId) || presets[0];

  // Helper: Next Phase Decision Tree
  const getNextPhase = useCallback(
    (currentPhase: BreathingPhase): { next: BreathingPhase; seconds: number } => {
      if (currentPhase === 'prepare') {
        return { next: 'inhale', seconds: activePreset.inhale };
      }
      if (currentPhase === 'inhale') {
        if (activePreset.holdIn > 0) {
          return { next: 'holdIn', seconds: activePreset.holdIn };
        }
        return { next: 'exhale', seconds: activePreset.exhale };
      }
      if (currentPhase === 'holdIn') {
        return { next: 'exhale', seconds: activePreset.exhale };
      }
      if (currentPhase === 'exhale') {
        if (activePreset.holdOut > 0) {
          return { next: 'holdOut', seconds: activePreset.holdOut };
        }
        return { next: 'inhale', seconds: activePreset.inhale };
      }
      if (currentPhase === 'holdOut') {
        return { next: 'inhale', seconds: activePreset.inhale };
      }
      return { next: 'inhale', seconds: activePreset.inhale };
    },
    [activePreset]
  );

  // Trigger phase sound and haptic
  const notifyPhaseChange = useCallback(
    (newPhase: BreathingPhase) => {
      if (
        newPhase === 'inhale' ||
        newPhase === 'holdIn' ||
        newPhase === 'exhale' ||
        newPhase === 'holdOut'
      ) {
        if (hapticConfig.enabled && hapticConfig.vibrateOnPhaseChange) {
          triggerHaptic(newPhase, hapticConfig.intensity, true);
        }
        if (audioConfig.enabled) {
          playPhaseSound(newPhase, audioConfig.volume);
        }
      }
    },
    [hapticConfig, audioConfig]
  );

  // End Session Callback
  const handleCompleteSession = useCallback(() => {
    setIsRunning(false);
    setPhase('completed');
    if (timerRef.current) clearInterval(timerRef.current);

    // Stop ambient background sound on session completion
    stopAmbientSound();

    // Celebratory Haptic + Sound
    if (hapticConfig.enabled) {
      triggerHaptic('complete', hapticConfig.intensity, true);
    }
    if (audioConfig.enabled) {
      playCompletionCelebration(audioConfig.volume);
    }

    // Save to storage
    const updatedStats = recordCompletedSession({
      presetName: activePreset.vietnameseTitle,
      presetId: activePreset.id,
      durationSeconds: Math.max(1, sessionSecondsElapsed),
      cyclesCompleted: Math.max(1, cycleCount),
    });
    setStats(updatedStats);

    // Open summary modal
    setIsSummaryOpen(true);
    if (isBlindfoldActive) {
      setIsBlindfoldActive(false);
    }
  }, [
    activePreset,
    sessionSecondsElapsed,
    cycleCount,
    hapticConfig,
    audioConfig,
    isBlindfoldActive,
  ]);

  // Main Timer Tick Engine
  useEffect(() => {
    if (!isRunning) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setSessionSecondsElapsed((prev) => {
        const nextElapsed = prev + 1;
        // Check if job finished
        if (sessionDuration > 0 && nextElapsed >= sessionDuration) {
          handleCompleteSession();
          return nextElapsed;
        }
        return nextElapsed;
      });

      setPhaseSecondsLeft((prevLeft) => {
        // Optional tick vibration on each second
        if (hapticConfig.enabled && hapticConfig.vibrateOnTick) {
          triggerHaptic('tick', 'light', true);
        }

        if (prevLeft <= 1) {
          // Transition to next phase
          const { next, seconds } = getNextPhase(phase);
          setPhase(next);
          setPhaseTotalSeconds(seconds);
          notifyPhaseChange(next);

          // If transitioning to inhale from exhale/holdOut, increment cycle
          if (next === 'inhale') {
            setCycleCount((c) => c + 1);
          }

          return seconds;
        } else {
          return prevLeft - 1;
        }
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [
    isRunning,
    phase,
    sessionDuration,
    getNextPhase,
    notifyPhaseChange,
    handleCompleteSession,
    hapticConfig,
  ]);

  // Start / Resume breathing
  const handleStartResume = () => {
    if (phase === 'idle' || phase === 'completed') {
      // Begin with 3s prepare countdown
      setPhase('prepare');
      setPhaseSecondsLeft(3);
      setPhaseTotalSeconds(3);
      setCycleCount(1);
      setSessionSecondsElapsed(0);
      if (hapticConfig.enabled) {
        triggerHaptic('test', hapticConfig.intensity, true);
      }
    }
    // Start ambient background sound if enabled
    if (audioConfig.ambientEnabled && audioConfig.ambientType !== 'none') {
      startAmbientSound(audioConfig.ambientType, audioConfig.ambientVolume);
    }
    setIsRunning(true);
  };

  // Pause breathing
  const handlePause = () => {
    setIsRunning(false);
    stopAmbientSound();
    triggerHaptic('tick', 'light', hapticConfig.enabled);
  };

  // Reset breathing
  const handleReset = () => {
    setIsRunning(false);
    stopAmbientSound();
    setPhase('idle');
    setPhaseSecondsLeft(0);
    setPhaseTotalSeconds(0);
    setCycleCount(0);
    setSessionSecondsElapsed(0);
    triggerHaptic('tick', 'light', hapticConfig.enabled);
  };

  // Select Preset
  const handleSelectPreset = (preset: BreathingPreset) => {
    if (isRunning) return;
    setSelectedPresetId(preset.id);
    saveSelectedPresetId(preset.id);
    setSessionDuration(preset.defaultSessionDuration);
    setPhase('idle');
    setPhaseSecondsLeft(0);
    setPhaseTotalSeconds(0);
    setCycleCount(0);
    setSessionSecondsElapsed(0);
    triggerHaptic('tick', 'medium', hapticConfig.enabled);
  };

  // Save Preset updates (e.g. customized seconds)
  const handleSavePreset = (updated: BreathingPreset) => {
    const nextPresets = presets.map((p) => (p.id === updated.id ? updated : p));
    setPresets(nextPresets);
    savePresets(nextPresets);
    if (phase !== 'idle') {
      handleReset();
    }
  };

  // Haptic update
  const handleHapticConfigChange = (cfg: HapticConfig) => {
    setHapticConfig(cfg);
    saveHapticConfig(cfg);
  };

  // Audio update
  const handleAudioConfigChange = (cfg: AudioConfig) => {
    setAudioConfig(cfg);
    saveAudioConfig(cfg);
    if (isRunning) {
      if (cfg.ambientEnabled && cfg.ambientType !== 'none') {
        startAmbientSound(cfg.ambientType, cfg.ambientVolume);
      } else {
        stopAmbientSound();
      }
    }
  };

  // Toggle ambient sound on/off
  const handleToggleAmbient = () => {
    const nextEnabled = !audioConfig.ambientEnabled;
    const nextType = audioConfig.ambientType === 'none' && nextEnabled ? 'lofi' : audioConfig.ambientType;
    const updated: AudioConfig = {
      ...audioConfig,
      ambientEnabled: nextEnabled,
      ambientType: nextType,
    };
    handleAudioConfigChange(updated);
    if (isRunning) {
      if (nextEnabled) {
        startAmbientSound(nextType, audioConfig.ambientVolume);
      } else {
        stopAmbientSound();
      }
    }
  };

  const handleToggleShapeMode = (m: 'square' | 'circle') => {
    setShapeMode(m);
    saveStoredShapeMode(m);
  };

  const handleSessionDurationChange = (dur: number) => {
    setSessionDuration(dur);
    saveStoredSessionDuration(dur);
  };

  const handleClearStats = () => {
    const empty = clearSessionStats();
    setStats(empty);
  };

  // Quick vibration test trigger
  const handleQuickTestVibration = () => {
    triggerHaptic('test', hapticConfig.intensity, true);
    if (audioConfig.enabled) {
      playPhaseSound('inhale', audioConfig.volume);
    }
    setShowVibrationToast(true);
    setTimeout(() => setShowVibrationToast(false), 2000);
  };

  // Time format
  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const remainingSessionSeconds =
    sessionDuration > 0 ? Math.max(0, sessionDuration - sessionSecondsElapsed) : 0;

  return (
    <DeviceFrameWrapper>
      {/* Blindfold Mode Overlay (Eyes Closed Screen-Off Meditation) */}
      {isBlindfoldActive && (
        <BlindfoldMode
          phase={phase}
          phaseSecondsLeft={phaseSecondsLeft}
          preset={activePreset}
          isRunning={isRunning}
          cycleCount={cycleCount}
          totalSecondsElapsed={sessionSecondsElapsed}
          totalJobSeconds={sessionDuration}
          onTogglePlayPause={() => (isRunning ? handlePause() : handleStartResume())}
          onExitBlindfold={() => setIsBlindfoldActive(false)}
          soundEnabled={audioConfig.enabled}
          onToggleSound={() =>
            handleAudioConfigChange({ ...audioConfig, enabled: !audioConfig.enabled })
          }
          hapticEnabled={hapticConfig.enabled}
          onToggleHaptic={() =>
            handleHapticConfigChange({ ...hapticConfig, enabled: !hapticConfig.enabled })
          }
          ambientEnabled={audioConfig.ambientEnabled}
          onToggleAmbient={handleToggleAmbient}
          ambientType={audioConfig.ambientType}
        />
      )}

      {/* Main Mobile App Layout */}
      <div className="flex-1 flex flex-col justify-between p-4 sm:p-5 select-none relative overflow-x-hidden">
        {/* Top App Bar */}
        <header className="flex items-center justify-between pb-3 border-b border-slate-800/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-2xl flex items-center justify-center font-bold text-white shadow-md shadow-cyan-950/40"
              style={{
                background: `linear-gradient(135deg, ${activePreset.colorScheme.primary}, #3b82f6)`,
              }}
            >
              ZP
            </div>
            <div>
              <h1 className="text-sm font-bold text-white tracking-tight leading-tight">
                ZenPulse
              </h1>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                <span>Rung nhịp hít thở</span>
                {stats.currentStreakDays > 0 && (
                  <>
                    <span>·</span>
                    <span className="text-amber-400 flex items-center gap-0.5">
                      <Flame className="w-3 h-3 fill-amber-400" />
                      {stats.currentStreakDays}d
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Quick action buttons */}
          <div className="flex items-center gap-1">
            {/* Quick Vibration Toggle / Test */}
            <button
              onClick={handleQuickTestVibration}
              className={`p-2 rounded-xl border transition-all ${
                hapticConfig.enabled
                  ? 'bg-cyan-950/40 border-cyan-500/40 text-cyan-400 hover:bg-cyan-900/50'
                  : 'bg-slate-900 border-slate-800 text-slate-500'
              }`}
              title="Thử rung phản hồi (Haptic)"
            >
              <Smartphone className="w-4 h-4" />
            </button>

            {/* Ambient Background Audio Toggle */}
            <button
              onClick={handleToggleAmbient}
              className={`p-2 rounded-xl border transition-all ${
                audioConfig.ambientEnabled
                  ? 'bg-purple-950/40 border-purple-500/40 text-purple-400 hover:bg-purple-900/50 shadow-sm'
                  : 'bg-slate-900 border-slate-800 text-slate-500'
              }`}
              title={`Nhạc nền: ${
                audioConfig.ambientType === 'lofi'
                  ? 'Lo-Fi Thiền Định'
                  : audioConfig.ambientType === 'ocean'
                  ? 'Sóng Biển'
                  : audioConfig.ambientType === 'rain'
                  ? 'Mưa Rơi'
                  : audioConfig.ambientType === 'brownnoise'
                  ? 'Ồn Nâu'
                  : audioConfig.ambientType === 'whitenoise'
                  ? 'Ồn Trắng'
                  : 'Tắt'
              } (Bật/Tắt)`}
            >
              <Music className="w-4 h-4" />
            </button>

            {/* Chime Audio Toggle */}
            <button
              onClick={() =>
                handleAudioConfigChange({ ...audioConfig, enabled: !audioConfig.enabled })
              }
              className={`p-2 rounded-xl border transition-all ${
                audioConfig.enabled
                  ? 'bg-indigo-950/40 border-indigo-500/40 text-indigo-400 hover:bg-indigo-900/50'
                  : 'bg-slate-900 border-slate-800 text-slate-500'
              }`}
              title="Bật/Tắt chuông thiền chuyển nhịp"
            >
              {audioConfig.enabled ? (
                <Volume2 className="w-4 h-4" />
              ) : (
                <VolumeX className="w-4 h-4" />
              )}
            </button>

            {/* Stats */}
            <button
              onClick={() => setIsStatsOpen(true)}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              title="Nhật ký & Thống kê"
            >
              <BarChart3 className="w-4 h-4" />
            </button>

            {/* Config & Customize */}
            <button
              onClick={() => setIsConfigOpen(true)}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              title="Cấu hình nhịp thở và độ dài job"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>

            {/* Export / Google Drive Modal */}
            <button
              onClick={() => setIsExportOpen(true)}
              className="p-2 rounded-xl bg-cyan-950/60 border border-cyan-500/50 text-cyan-300 hover:text-white hover:bg-cyan-900/60 transition-colors flex items-center justify-center shadow-sm cursor-pointer"
              title="Nhận mã nguồn (.zip) & Lưu vào Google Drive"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Google Drive Source Code Banner */}
        <div className="mt-2.5">
          <button
            onClick={() => setIsExportOpen(true)}
            className="w-full px-3 py-2 rounded-2xl bg-gradient-to-r from-cyan-950/80 via-blue-950/70 to-indigo-950/80 border border-cyan-500/50 text-cyan-200 text-xs flex items-center justify-between hover:border-cyan-400 transition-all cursor-pointer group shadow-sm"
          >
            <div className="flex items-center gap-2 truncate">
              <Cloud className="w-4 h-4 text-cyan-400 shrink-0 group-hover:scale-110 transition-transform" />
              <span className="font-semibold text-slate-100 truncate">
                Lưu toàn bộ Source Code vào Google Drive
              </span>
            </div>
            <span className="shrink-0 text-[10px] bg-cyan-500 text-slate-950 font-bold px-2 py-0.5 rounded-full shadow-sm ml-2">
              Lưu ngay
            </span>
          </button>
        </div>

        {/* Quick Vibration Toast Alert */}
        {showVibrationToast && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 bg-cyan-950 border border-cyan-500/60 text-cyan-200 text-xs px-3.5 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 animate-bounce">
            <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
            <span>Đã kích hoạt nhịp rung thử nghiệm!</span>
          </div>
        )}

        {/* Session / Job Status Bar */}
        <div className="mt-3 px-3.5 py-2.5 rounded-2xl bg-slate-900/70 border border-slate-800/80 flex items-center justify-between text-xs shrink-0">
          <div className="flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: activePreset.colorScheme.primary }}
            />
            <span className="font-medium text-slate-200 truncate max-w-[120px]">
              {activePreset.vietnameseTitle}
            </span>
            {audioConfig.ambientEnabled && audioConfig.ambientType !== 'none' && (
              <button
                onClick={() => setIsConfigOpen(true)}
                className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-950/70 border border-purple-500/40 text-[10px] text-purple-300 hover:text-purple-200 transition-colors"
                title="Đang phát nhạc nền · Bấm để đổi"
              >
                <Music className="w-2.5 h-2.5" />
                <span>
                  {audioConfig.ambientType === 'lofi'
                    ? 'Lo-Fi'
                    : audioConfig.ambientType === 'ocean'
                    ? 'Sóng Biển'
                    : audioConfig.ambientType === 'rain'
                    ? 'Mưa'
                    : audioConfig.ambientType === 'brownnoise'
                    ? 'Ồn Nâu'
                    : 'Ồn Trắng'}
                </span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 font-mono text-slate-400">
            {sessionDuration > 0 ? (
              <span>
                Còn lại:{' '}
                <strong className="text-white tabular-nums">
                  {formatTimer(remainingSessionSeconds)}
                </strong>
              </span>
            ) : (
              <span>
                Thời gian:{' '}
                <strong className="text-white tabular-nums">
                  {formatTimer(sessionSecondsElapsed)}
                </strong>
              </span>
            )}
          </div>
        </div>

        {/* Center: Interactive Breathing Square (Box) or Circle with Real-Time Edge Tracer */}
        <main className="flex-1 flex flex-col items-center justify-center py-2">
          <BreathingVisualizer
            phase={phase}
            phaseSecondsLeft={phaseSecondsLeft}
            phaseTotalSeconds={phaseTotalSeconds}
            preset={activePreset}
            isRunning={isRunning}
            cycleCount={cycleCount}
            shapeMode={shapeMode}
            onToggleShapeMode={handleToggleShapeMode}
          />
        </main>

        {/* Bottom Control Zone (Thumb Ergonomics) */}
        <div className="space-y-4 shrink-0 pt-2 pb-1">
          {/* Preset Selector Carousel (Hidden when running to maintain zen stillness, but easily accessible when paused) */}
          {!isRunning && (
            <PresetSelector
              presets={presets}
              activePresetId={selectedPresetId}
              onSelectPreset={handleSelectPreset}
              onOpenCustomizer={(p) => {
                setSelectedPresetId(p.id);
                setIsConfigOpen(true);
              }}
              disabled={isRunning}
            />
          )}

          {/* Primary Action Buttons */}
          <div className="flex items-center gap-3">
            {/* Blindfold Mode Trigger (Chế độ nhắm mắt) */}
            <button
              onClick={() => {
                if (!isRunning) {
                  handleStartResume();
                }
                setIsBlindfoldActive(true);
              }}
              className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white flex items-center justify-center active:scale-95 transition-all shadow-md"
              title="Chế độ nhắm mắt (Tắt màn hình, chỉ rung)"
            >
              <EyeOff className="w-5 h-5 text-indigo-400" />
            </button>

            {/* Play / Pause Main CTA */}
            {isRunning ? (
              <button
                onClick={handlePause}
                className="flex-1 h-14 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-[0.98] transition-all"
              >
                <Pause className="w-5 h-5 fill-slate-950" />
                <span>Tạm Dừng</span>
              </button>
            ) : (
              <button
                onClick={handleStartResume}
                className="flex-1 h-14 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 active:scale-[0.98] transition-all"
              >
                <Play className="w-5 h-5 fill-slate-950" />
                <span>
                  {phase === 'idle'
                    ? 'Bắt Đầu Hít Thở'
                    : phase === 'completed'
                    ? 'Thực Hiện Lại'
                    : 'Tiếp Tục'}
                </span>
              </button>
            )}

            {/* Reset Button */}
            {(phase !== 'idle' || isRunning) && (
              <button
                onClick={handleReset}
                className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white flex items-center justify-center active:scale-95 transition-all shadow-md"
                title="Khởi động lại nhịp thở"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Quick Haptic / Eyes-closed Hint */}
          <div className="flex items-center justify-between px-1 text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
              {hapticConfig.enabled
                ? 'Rung theo từng nhịp thở'
                : 'Đang tắt rung'}
            </span>
            <button
              onClick={() => setIsConfigOpen(true)}
              className="text-cyan-400 hover:underline flex items-center gap-1"
            >
              <span>Đổi thời gian & giây</span>
            </button>
          </div>
        </div>
      </div>

      {/* Configuration Modal */}
      <ConfigModal
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        preset={activePreset}
        onSavePreset={handleSavePreset}
        sessionDuration={sessionDuration}
        onChangeSessionDuration={handleSessionDurationChange}
        hapticConfig={hapticConfig}
        onChangeHapticConfig={handleHapticConfigChange}
        audioConfig={audioConfig}
        onChangeAudioConfig={handleAudioConfigChange}
      />

      {/* Stats & History Drawer */}
      <StatsDrawer
        isOpen={isStatsOpen}
        onClose={() => setIsStatsOpen(false)}
        stats={stats}
        onClearStats={handleClearStats}
      />

      {/* Session Completion Summary */}
      <SessionSummaryModal
        isOpen={isSummaryOpen}
        onClose={() => setIsSummaryOpen(false)}
        onRestart={() => {
          setIsSummaryOpen(false);
          handleStartResume();
        }}
        preset={activePreset}
        cyclesCompleted={cycleCount}
        durationSeconds={sessionSecondsElapsed}
        stats={stats}
      />

      {/* Export Source & Google Drive Modal */}
      <ExportSourceModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
      />
    </DeviceFrameWrapper>
  );
}
