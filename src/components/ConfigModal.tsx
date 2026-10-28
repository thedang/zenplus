import React, { useState } from 'react';
import { BreathingPreset, HapticConfig, AudioConfig } from '../types/breathing';
import {
  X,
  Smartphone,
  Volume2,
  Clock,
  Wind,
  Plus,
  Minus,
  Check,
  Vibrate,
  Info,
  Music,
  Waves,
  CloudRain,
  Radio,
  Download,
} from 'lucide-react';
import { triggerHaptic, hasVibrationSupport } from '../utils/haptics';
import { playPhaseSound, startAmbientSound, stopAmbientSound, setAmbientVolume } from '../utils/sound';

interface ConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  preset: BreathingPreset;
  onSavePreset: (updated: BreathingPreset) => void;
  sessionDuration: number;
  onChangeSessionDuration: (duration: number) => void;
  hapticConfig: HapticConfig;
  onChangeHapticConfig: (cfg: HapticConfig) => void;
  audioConfig: AudioConfig;
  onChangeAudioConfig: (cfg: AudioConfig) => void;
}

export const ConfigModal: React.FC<ConfigModalProps> = ({
  isOpen,
  onClose,
  preset,
  onSavePreset,
  sessionDuration,
  onChangeSessionDuration,
  hapticConfig,
  onChangeHapticConfig,
  audioConfig,
  onChangeAudioConfig,
}) => {
  // Local edit state
  const [inhale, setInhale] = useState(preset.inhale);
  const [holdIn, setHoldIn] = useState(preset.holdIn);
  const [exhale, setExhale] = useState(preset.exhale);
  const [holdOut, setHoldOut] = useState(preset.holdOut);
  const [selectedDuration, setSelectedDuration] = useState(sessionDuration);
  const [haptic, setHaptic] = useState<HapticConfig>(hapticConfig);
  const [audio, setAudio] = useState<AudioConfig>(audioConfig);
  const [activeTab, setActiveTab] = useState<'breath' | 'job' | 'haptic'>('breath');
  const [testVibrateFeedback, setTestVibrateFeedback] = useState(false);
  const [isPreviewingAmbient, setIsPreviewingAmbient] = useState(false);

  if (!isOpen) return null;

  const durationOptions = [
    { label: '1 phút', value: 60 },
    { label: '2 phút', value: 120 },
    { label: '3 phút', value: 180 },
    { label: '5 phút', value: 300 },
    { label: '10 phút', value: 600 },
    { label: '15 phút', value: 900 },
    { label: 'Không giới hạn', value: 0 },
  ];

  const handleTestVibration = () => {
    setTestVibrateFeedback(true);
    triggerHaptic('test', haptic.intensity, true);
    if (audio.enabled) {
      playPhaseSound('inhale', audio.volume);
    }
    setTimeout(() => setTestVibrateFeedback(false), 600);
  };

  const handleClose = () => {
    if (isPreviewingAmbient) {
      setIsPreviewingAmbient(false);
      if (audioConfig.ambientEnabled && audioConfig.ambientType !== 'none') {
        startAmbientSound(audioConfig.ambientType, audioConfig.ambientVolume);
      } else {
        stopAmbientSound();
      }
    }
    onClose();
  };

  const handleSaveAll = () => {
    onSavePreset({
      ...preset,
      inhale: Math.max(1, inhale),
      holdIn: Math.max(0, holdIn),
      exhale: Math.max(1, exhale),
      holdOut: Math.max(0, holdOut),
    });
    onChangeSessionDuration(selectedDuration);
    onChangeHapticConfig(haptic);
    onChangeAudioConfig(audio);
    setIsPreviewingAmbient(false);
    onClose();
  };

  const adjustValue = (setter: React.Dispatch<React.SetStateAction<number>>, delta: number, min: number = 0, max: number = 30) => {
    setter((prev) => Math.min(max, Math.max(min, prev + delta)));
    triggerHaptic('tick', 'light', haptic.enabled);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-800 shrink-0">
          <div>
            <h2 className="text-base font-semibold text-white tracking-tight">
              Cấu hình Nhịp & Rung
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Tùy chỉnh thời gian hít thở, giữ khí và độ rung
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 -mr-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-slate-800 bg-slate-900/60 p-1.5 gap-1 shrink-0 px-6">
          <button
            onClick={() => setActiveTab('breath')}
            className={`flex-1 py-2 text-xs font-medium rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'breath'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Wind className="w-3.5 h-3.5 text-cyan-400" />
            <span>Nhịp thở (s)</span>
          </button>
          <button
            onClick={() => setActiveTab('job')}
            className={`flex-1 py-2 text-xs font-medium rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'job'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            <span>Thời lượng Job</span>
          </button>
          <button
            onClick={() => setActiveTab('haptic')}
            className={`flex-1 py-2 text-xs font-medium rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'haptic'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
            <span>Rung & Âm thanh</span>
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'breath' && (
            <div className="space-y-4">
              <div className="p-3 bg-cyan-950/20 border border-cyan-900/30 rounded-2xl text-xs text-cyan-200 leading-relaxed">
                Đang cấu hình: <strong className="text-white">{preset.vietnameseTitle}</strong>. Bạn có thể tăng giảm số giây cho từng nhịp dưới đây.
              </div>

              {/* Inhale */}
              <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                    <span className="text-sm font-medium text-white">Hít vào (Inhale)</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">Thời gian nạp dưỡng khí</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => adjustValue(setInhale, -1, 1, 30)}
                    className="w-9 h-9 rounded-full bg-slate-700 hover:bg-slate-600 text-white flex items-center justify-center active:scale-95"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-12 text-center font-mono text-lg font-bold text-white tabular-nums">
                    {inhale}s
                  </span>
                  <button
                    onClick={() => adjustValue(setInhale, 1, 1, 30)}
                    className="w-9 h-9 rounded-full bg-slate-700 hover:bg-slate-600 text-white flex items-center justify-center active:scale-95"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Hold In */}
              <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-400" />
                    <span className="text-sm font-medium text-white">Giữ khí sau khi hít (Hold)</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">Nín hơi giữ oxy (0s nếu bỏ qua)</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => adjustValue(setHoldIn, -1, 0, 30)}
                    className="w-9 h-9 rounded-full bg-slate-700 hover:bg-slate-600 text-white flex items-center justify-center active:scale-95"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-12 text-center font-mono text-lg font-bold text-white tabular-nums">
                    {holdIn}s
                  </span>
                  <button
                    onClick={() => adjustValue(setHoldIn, 1, 0, 30)}
                    className="w-9 h-9 rounded-full bg-slate-700 hover:bg-slate-600 text-white flex items-center justify-center active:scale-95"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Exhale */}
              <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                    <span className="text-sm font-medium text-white">Thở ra (Exhale)</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">Thải khí CO2 và thư giãn cơ</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => adjustValue(setExhale, -1, 1, 30)}
                    className="w-9 h-9 rounded-full bg-slate-700 hover:bg-slate-600 text-white flex items-center justify-center active:scale-95"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-12 text-center font-mono text-lg font-bold text-white tabular-nums">
                    {exhale}s
                  </span>
                  <button
                    onClick={() => adjustValue(setExhale, 1, 1, 30)}
                    className="w-9 h-9 rounded-full bg-slate-700 hover:bg-slate-600 text-white flex items-center justify-center active:scale-95"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Hold Out */}
              <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                    <span className="text-sm font-medium text-white">Giữ khí sau khi thở (Rest)</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">Nghỉ phổi tĩnh tâm (0s nếu bỏ qua)</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => adjustValue(setHoldOut, -1, 0, 30)}
                    className="w-9 h-9 rounded-full bg-slate-700 hover:bg-slate-600 text-white flex items-center justify-center active:scale-95"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-12 text-center font-mono text-lg font-bold text-white tabular-nums">
                    {holdOut}s
                  </span>
                  <button
                    onClick={() => adjustValue(setHoldOut, 1, 0, 30)}
                    className="w-9 h-9 rounded-full bg-slate-700 hover:bg-slate-600 text-white flex items-center justify-center active:scale-95"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="p-3 bg-slate-800/30 rounded-xl text-xs text-slate-400 flex items-center justify-between">
                <span>Tổng 1 chu kỳ thở:</span>
                <span className="font-mono text-white font-semibold">
                  {inhale + holdIn + exhale + holdOut} giây / nhịp
                </span>
              </div>
            </div>
          )}

          {activeTab === 'job' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-400">
                Chọn thời gian cho 1 phiên chạy (Job Duration). Khi hết giờ, app sẽ rung kết thúc và phát chuông chúc mừng.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {durationOptions.map((opt) => {
                  const isSel = selectedDuration === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => setSelectedDuration(opt.value)}
                      className={`p-3.5 rounded-2xl border text-left transition-all ${
                        isSel
                          ? 'bg-indigo-950/60 border-indigo-500 text-white shadow-md'
                          : 'bg-slate-800/50 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-semibold">{opt.label}</span>
                        {isSel && <Check className="w-4 h-4 text-indigo-400" />}
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {opt.value > 0 ? `~${Math.floor(opt.value / (inhale + holdIn + exhale + holdOut))} nhịp thở` : 'Thở tự do'}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/60">
                <span className="text-xs text-slate-400 block mb-2">Hoặc chỉnh số phút cụ thể:</span>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={60}
                    max={1800}
                    step={60}
                    value={selectedDuration || 300}
                    onChange={(e) => setSelectedDuration(Number(e.target.value))}
                    className="flex-1 accent-indigo-500 cursor-pointer"
                  />
                  <span className="w-16 text-right font-mono text-sm font-bold text-white">
                    {selectedDuration > 0 ? `${Math.round(selectedDuration / 60)} phút` : 'Tự do'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'haptic' && (
            <div className="space-y-5">
              {/* Vibration Toggle */}
              <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Vibrate className="w-4 h-4 text-cyan-400" />
                    <span className="text-sm font-medium text-white">Chức năng rung (Haptic)</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Rung nhẹ theo nhịp để theo dõi không cần nhìn màn hình
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={haptic.enabled}
                    onChange={(e) => setHaptic({ ...haptic, enabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
                </label>
              </div>

              {/* Intensity */}
              {haptic.enabled && (
                <div className="space-y-3">
                  <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Độ mạnh rung
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {(['light', 'medium', 'strong'] as const).map((level) => {
                      const labels = {
                        light: 'Rung Nhẹ',
                        medium: 'Vừa Phải',
                        strong: 'Rõ Ràng',
                      };
                      const isSel = haptic.intensity === level;
                      return (
                        <button
                          key={level}
                          onClick={() => {
                            setHaptic({ ...haptic, intensity: level });
                            triggerHaptic('test', level, true);
                          }}
                          className={`py-2.5 px-3 rounded-xl border text-xs font-medium transition-all ${
                            isSel
                              ? 'bg-cyan-950/60 border-cyan-500 text-white shadow-sm'
                              : 'bg-slate-800/40 border-slate-700/50 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {labels[level]}
                        </button>
                      );
                    })}
                  </div>

                  {/* Tick vibrate option */}
                  <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/40 flex items-center justify-between mt-2">
                    <div>
                      <span className="text-xs font-medium text-slate-200 block">
                        Rung vi nhịp mỗi giây (Tick)
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Rung siêu nhẹ mỗi 1 giây để cảm nhận thời gian trôi
                      </span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={haptic.vibrateOnTick}
                        onChange={(e) => setHaptic({ ...haptic, vibrateOnTick: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-500"></div>
                    </label>
                  </div>
                </div>
              )}

              {/* Test Vibration Button */}
              <button
                type="button"
                onClick={handleTestVibration}
                className={`w-full py-3 px-4 rounded-2xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${
                  testVibrateFeedback
                    ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-lg shadow-cyan-500/20'
                    : 'bg-slate-800 hover:bg-slate-750 text-white border-slate-700'
                }`}
              >
                <Smartphone className="w-4 h-4" />
                <span>{testVibrateFeedback ? 'Đang rung...' : 'Thử rung thiết bị ngay'}</span>
              </button>

              {/* Hardware note */}
              <div className="p-3 bg-slate-800/30 rounded-xl border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2">
                <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <span>
                  {hasVibrationSupport()
                    ? 'Thiết bị của bạn hỗ trợ mô tơ rung Web Vibration API! Bạn có thể nhắm mắt hoàn toàn trong khi thở.'
                    : 'Thiết bị/trình duyệt này chưa kích hoạt bộ rung phần cứng (thường gặp trên máy tính hoặc iOS Safari). ZenPulse sẽ tự động phát âm chuông thiền để bạn dễ nhắm mắt theo dõi.'}
                </span>
              </div>

              {/* Audio Chime Configuration */}
              <div className="pt-4 border-t border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-indigo-400" />
                    <div>
                      <span className="text-sm font-medium text-white block">Chuông chuyển nhịp (Chime)</span>
                      <span className="text-[11px] text-slate-400">Âm chuông thiền Solfeggio 432Hz</span>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={audio.enabled}
                      onChange={(e) => setAudio({ ...audio, enabled: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
                  </label>
                </div>

                {audio.enabled && (
                  <div className="p-3.5 bg-slate-800/40 border border-slate-700/50 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-300">
                      <span>Âm lượng chuông nhịp thở</span>
                      <span className="font-mono text-indigo-400 font-bold">{Math.round(audio.volume * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min={0.05}
                      max={1.0}
                      step={0.05}
                      value={audio.volume}
                      onChange={(e) => setAudio({ ...audio, volume: Number(e.target.value) })}
                      className="w-full accent-indigo-500 cursor-pointer"
                    />
                  </div>
                )}
              </div>

              {/* Ambient Sound / Lo-Fi & White Noise Configuration (Independent Volume) */}
              <div className="pt-4 border-t border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Music className="w-4 h-4 text-purple-400" />
                    <div>
                      <span className="text-sm font-medium text-white block">
                        Nhạc nền Lo-Fi & Tiếng ồn trắng
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Không gian âm thanh thư giãn với âm lượng độc lập
                      </span>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={audio.ambientEnabled}
                      onChange={(e) => {
                        const newEnabled = e.target.checked;
                        const newType = audio.ambientType === 'none' && newEnabled ? 'lofi' : audio.ambientType;
                        setAudio({ ...audio, ambientEnabled: newEnabled, ambientType: newType });
                        if (!newEnabled) {
                          stopAmbientSound();
                          setIsPreviewingAmbient(false);
                        } else {
                          startAmbientSound(newType, audio.ambientVolume);
                          setIsPreviewingAmbient(true);
                        }
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500"></div>
                  </label>
                </div>

                {audio.ambientEnabled && (
                  <div className="space-y-3">
                    <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                      Chọn không gian âm thanh
                    </span>

                    {/* Sound Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {[
                        {
                          type: 'lofi' as const,
                          label: 'Lo-Fi Thiền Định',
                          desc: 'Hợp âm analog ấm áp, sâu lắng',
                          icon: Music,
                          color: 'text-purple-400',
                        },
                        {
                          type: 'ocean' as const,
                          label: 'Sóng Biển Rì Rào',
                          desc: 'Nhịp sóng nhấp nhô đều đặn',
                          icon: Waves,
                          color: 'text-cyan-400',
                        },
                        {
                          type: 'rain' as const,
                          label: 'Mưa Rơi Êm Dịu',
                          desc: 'Tiếng mưa rơi nhẹ nhàng tĩnh tâm',
                          icon: CloudRain,
                          color: 'text-blue-400',
                        },
                        {
                          type: 'brownnoise' as const,
                          label: 'Tiếng Ồn Nâu (Brown)',
                          desc: 'Âm trầm sâu, dễ ngủ & xả stress',
                          icon: Radio,
                          color: 'text-amber-400',
                        },
                        {
                          type: 'whitenoise' as const,
                          label: 'Tiếng Ồn Trắng (White)',
                          desc: 'Lọc tạp âm, tăng tập trung',
                          icon: Wind,
                          color: 'text-teal-400',
                        },
                      ].map((item) => {
                        const IconComponent = item.icon;
                        const isSel = audio.ambientType === item.type;
                        return (
                          <button
                            key={item.type}
                            type="button"
                            onClick={() => {
                              setAudio({ ...audio, ambientType: item.type, ambientEnabled: true });
                              startAmbientSound(item.type, audio.ambientVolume);
                              setIsPreviewingAmbient(true);
                            }}
                            className={`p-3 rounded-2xl border text-left flex items-start gap-3 transition-all ${
                              isSel
                                ? 'bg-purple-950/60 border-purple-500 text-white shadow-md shadow-purple-950/40'
                                : 'bg-slate-800/40 border-slate-700/50 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                            }`}
                          >
                            <div
                              className={`p-2 rounded-xl shrink-0 ${
                                isSel ? 'bg-purple-500/20 text-purple-300' : 'bg-slate-800 ' + item.color
                              }`}
                            >
                              <IconComponent className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-white truncate">
                                  {item.label}
                                </span>
                                {isSel && <Check className="w-3.5 h-3.5 text-purple-400 shrink-0" />}
                              </div>
                              <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">
                                {item.desc}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Independent Volume Slider for Ambient Sound */}
                    <div className="p-3.5 bg-slate-800/40 border border-slate-700/50 rounded-2xl space-y-2 mt-2">
                      <div className="flex items-center justify-between text-xs text-slate-300">
                        <span className="flex items-center gap-1.5">
                          <Music className="w-3.5 h-3.5 text-purple-400" />
                          <span>Âm lượng Nhạc Nền Độc Lập</span>
                        </span>
                        <span className="font-mono text-purple-400 font-bold">
                          {Math.round(audio.ambientVolume * 100)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min={0.05}
                        max={1.0}
                        step={0.05}
                        value={audio.ambientVolume}
                        onChange={(e) => {
                          const newVol = Number(e.target.value);
                          setAudio({ ...audio, ambientVolume: newVol });
                          setAmbientVolume(newVol);
                        }}
                        className="w-full accent-purple-500 cursor-pointer"
                      />
                    </div>

                    {/* Preview Button */}
                    <button
                      type="button"
                      onClick={() => {
                        if (isPreviewingAmbient) {
                          stopAmbientSound();
                          setIsPreviewingAmbient(false);
                        } else {
                          startAmbientSound(audio.ambientType, audio.ambientVolume);
                          setIsPreviewingAmbient(true);
                        }
                      }}
                      className={`w-full py-2.5 px-4 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${
                        isPreviewingAmbient
                          ? 'bg-purple-950/80 border-purple-500/80 text-purple-200'
                          : 'bg-slate-800/80 hover:bg-slate-750 text-slate-300 border-slate-700'
                      }`}
                    >
                      <Music className="w-3.5 h-3.5" />
                      <span>{isPreviewingAmbient ? 'Đang phát thử · Chạm để dừng' : 'Nghe thử không gian âm thanh'}</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Download Source Code Section */}
              <div className="pt-4 border-t border-slate-800 space-y-2">
                <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                  Xuất mã nguồn (Export Source)
                </span>
                <p className="text-[11px] text-slate-400">
                  Tải toàn bộ source code sạch (đã nén .zip) về máy tính để tự deploy lên Vercel, Netlify hoặc máy chủ riêng.
                </p>
                <a
                  href="/zenpulse-source-code.zip"
                  download="zenpulse-source-code.zip"
                  className="w-full py-3 px-4 rounded-2xl bg-cyan-950/40 hover:bg-cyan-900/50 border border-cyan-500/40 text-xs font-semibold text-cyan-300 flex items-center justify-center gap-2 transition-all shadow-sm active:scale-[0.98]"
                >
                  <Download className="w-4 h-4" />
                  <span>Tải về file ZenPulse-Source-Code.zip (70 KB)</span>
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="p-5 border-t border-slate-800 bg-slate-900/95 flex items-center gap-3 shrink-0">
          <button
            onClick={handleClose}
            className="flex-1 py-3 px-4 rounded-xl border border-slate-700 text-slate-300 text-xs font-medium hover:bg-slate-800 active:scale-95 transition-all"
          >
            Hủy
          </button>
          <button
            onClick={handleSaveAll}
            className="flex-1 py-3 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-semibold shadow-lg shadow-cyan-500/20 active:scale-95 transition-all flex items-center justify-center gap-1.5"
          >
            <Check className="w-4 h-4 stroke-[2.5]" />
            <span>Áp dụng cấu hình</span>
          </button>
        </div>
      </div>
    </div>
  );
};
