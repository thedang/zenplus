import React, { useState, useEffect } from 'react';
import { BreathingPhase, BreathingPreset } from '../types/breathing';
import { addHapticListener, HapticTriggerType } from '../utils/haptics';
import { Eye, Pause, Play, Volume2, VolumeX, Smartphone, Music } from 'lucide-react';

interface BlindfoldModeProps {
  phase: BreathingPhase;
  phaseSecondsLeft: number;
  preset: BreathingPreset;
  isRunning: boolean;
  cycleCount: number;
  totalSecondsElapsed: number;
  totalJobSeconds: number;
  onTogglePlayPause: () => void;
  onExitBlindfold: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  hapticEnabled: boolean;
  onToggleHaptic: () => void;
  ambientEnabled?: boolean;
  onToggleAmbient?: () => void;
  ambientType?: string;
}

export const BlindfoldMode: React.FC<BlindfoldModeProps> = ({
  phase,
  preset,
  isRunning,
  cycleCount,
  totalSecondsElapsed,
  totalJobSeconds,
  onTogglePlayPause,
  onExitBlindfold,
  soundEnabled,
  onToggleSound,
  hapticEnabled,
  onToggleHaptic,
  ambientEnabled,
  onToggleAmbient,
}) => {
  const [pulse, setPulse] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);

  // Auto-hide helper controls after 4 seconds of inactivity
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (controlsVisible && isRunning) {
      timer = setTimeout(() => {
        setControlsVisible(false);
      }, 4000);
    }
    return () => clearTimeout(timer);
  }, [controlsVisible, isRunning]);

  useEffect(() => {
    const unsub = addHapticListener((_type: HapticTriggerType) => {
      setPulse(true);
      const timer = setTimeout(() => setPulse(false), 350);
      return () => clearTimeout(timer);
    });
    return unsub;
  }, []);

  const formatMinSec = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const getPhaseVietnamese = () => {
    switch (phase) {
      case 'inhale':
        return 'Hít vào...';
      case 'holdIn':
        return 'Giữ hơi...';
      case 'exhale':
        return 'Thở ra...';
      case 'holdOut':
        return 'Nghỉ / Giữ trống...';
      default:
        return 'Tập trung nhịp thở...';
    }
  };

  return (
    <div
      onClick={() => setControlsVisible((prev) => !prev)}
      className="fixed inset-0 z-50 bg-black text-white flex flex-col items-center justify-between p-6 select-none cursor-pointer"
      style={{ backgroundColor: '#000000' }}
    >
      {/* Top Bar with gentle subtle controls */}
      <div
        className={`w-full flex items-center justify-between transition-opacity duration-300 ${
          controlsVisible ? 'opacity-90' : 'opacity-20 hover:opacity-80'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onExitBlindfold}
          className="flex items-center gap-2 px-3 py-2 rounded-full bg-neutral-900 border border-neutral-800 text-xs text-neutral-300 active:scale-95"
        >
          <Eye className="w-4 h-4 text-cyan-400" />
          <span>Mở sáng màn hình</span>
        </button>

        <div className="flex items-center gap-2">
          {onToggleAmbient && (
            <button
              onClick={onToggleAmbient}
              className={`p-2.5 rounded-full border transition-colors ${
                ambientEnabled
                  ? 'bg-neutral-800 border-neutral-700 text-purple-400'
                  : 'bg-neutral-900 border-neutral-800 text-neutral-600'
              }`}
              title="Bật / tắt nhạc nền Lo-Fi & Tiếng ồn trắng"
            >
              <Music className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onToggleHaptic}
            className={`p-2.5 rounded-full border transition-colors ${
              hapticEnabled
                ? 'bg-neutral-800 border-neutral-700 text-cyan-400'
                : 'bg-neutral-900 border-neutral-800 text-neutral-600'
            }`}
            title="Bật / tắt rung"
          >
            <Smartphone className="w-4 h-4" />
          </button>
          <button
            onClick={onToggleSound}
            className={`p-2.5 rounded-full border transition-colors ${
              soundEnabled
                ? 'bg-neutral-800 border-neutral-700 text-cyan-400'
                : 'bg-neutral-900 border-neutral-800 text-neutral-600'
            }`}
            title="Bật / tắt chuông"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Center Breathing Focal Point (Ultra Low Luminescence for Dark Rooms) */}
      <div className="flex flex-col items-center justify-center my-auto">
        <div className="relative flex items-center justify-center">
          {/* Subtle tactile pulse glow */}
          <div
            className={`absolute rounded-full transition-all duration-300 pointer-events-none ${
              pulse ? 'w-48 h-48 opacity-40 scale-125' : 'w-24 h-24 opacity-10 scale-90'
            }`}
            style={{
              background: `radial-gradient(circle, ${preset.colorScheme.primary} 0%, transparent 70%)`,
            }}
          />

          {/* Minimal breathing core */}
          <div
            className={`w-16 h-16 rounded-full border flex items-center justify-center transition-all duration-1000 ${
              phase === 'inhale'
                ? 'scale-125 border-cyan-400/50 bg-cyan-950/20'
                : phase === 'exhale'
                ? 'scale-85 border-neutral-700 bg-neutral-950'
                : 'scale-100 border-neutral-600 bg-neutral-900'
            }`}
          >
            <div className="w-2.5 h-2.5 rounded-full bg-cyan-300 opacity-60 animate-ping" />
          </div>
        </div>

        {/* Phase whisper */}
        <p className="mt-8 text-sm font-medium tracking-wide text-neutral-400 text-center">
          {getPhaseVietnamese()}
        </p>

        <p className="mt-1 text-xs text-neutral-600 font-mono tabular-nums">
          Nhịp {cycleCount} · {formatMinSec(totalSecondsElapsed)}
          {totalJobSeconds > 0 ? ` / ${formatMinSec(totalJobSeconds)}` : ''}
        </p>
      </div>

      {/* Bottom Hint & Controls */}
      <div
        className={`w-full flex flex-col items-center gap-3 transition-opacity duration-300 ${
          controlsVisible ? 'opacity-90' : 'opacity-20 hover:opacity-80'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onTogglePlayPause}
          className="flex items-center gap-2 px-6 py-3 rounded-full bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-white font-medium text-sm active:scale-95 transition-all shadow-lg shadow-black"
        >
          {isRunning ? (
            <>
              <Pause className="w-4 h-4 text-amber-400" />
              <span>Tạm dừng</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 text-emerald-400 fill-emerald-400" />
              <span>Tiếp tục</span>
            </>
          )}
        </button>

        <p className="text-[11px] text-neutral-500 text-center">
          Nhắm mắt và cảm nhận rung nhẹ ở mỗi nhịp chuyển · Chạm màn hình để bật/tắt menu
        </p>
      </div>
    </div>
  );
};
