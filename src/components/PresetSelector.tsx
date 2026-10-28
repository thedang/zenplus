import React from 'react';
import { BreathingPreset } from '../types/breathing';
import { SlidersHorizontal, Check } from 'lucide-react';

interface PresetSelectorProps {
  presets: BreathingPreset[];
  activePresetId: string;
  onSelectPreset: (preset: BreathingPreset) => void;
  onOpenCustomizer: (preset: BreathingPreset) => void;
  disabled?: boolean;
}

export const PresetSelector: React.FC<PresetSelectorProps> = ({
  presets,
  activePresetId,
  onSelectPreset,
  onOpenCustomizer,
  disabled = false,
}) => {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3 px-1">
        <h3 className="text-sm font-semibold text-slate-200 tracking-tight">
          Chế độ hít thở (Mode)
        </h3>
        <span className="text-xs text-slate-400">
          {presets.length} phương pháp
        </span>
      </div>

      {/* Horizontal scroll container with touch snap */}
      <div className="flex gap-3 overflow-x-auto pb-2 pt-1 no-scrollbar scroll-smooth snap-x">
        {presets.map((preset) => {
          const isActive = preset.id === activePresetId;
          const formula = [
            `Hít ${preset.inhale}s`,
            preset.holdIn > 0 ? `Giữ ${preset.holdIn}s` : null,
            `Thở ${preset.exhale}s`,
            preset.holdOut > 0 ? `Giữ ${preset.holdOut}s` : null,
          ]
            .filter(Boolean)
            .join(' · ');

          return (
            <div
              key={preset.id}
              onClick={() => {
                if (!disabled) onSelectPreset(preset);
              }}
              className={`snap-start shrink-0 w-64 p-3.5 rounded-2xl border transition-all cursor-pointer relative ${
                isActive
                  ? 'bg-slate-800/90 border-cyan-500/60 shadow-lg shadow-cyan-950/30'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700/80 hover:bg-slate-800/40'
              } ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
            >
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <span className="text-sm font-semibold text-white tracking-tight line-clamp-1">
                  {preset.vietnameseTitle}
                </span>
                {isActive ? (
                  <div className="w-5 h-5 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                ) : (
                  <span
                    className="w-2.5 h-2.5 rounded-full mt-1 shrink-0"
                    style={{ backgroundColor: preset.colorScheme.primary }}
                  />
                )}
              </div>

              {/* Formula display */}
              <p className="text-xs font-mono font-medium text-cyan-300/90 mb-1.5">
                {formula}
              </p>

              {/* Description */}
              <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                {preset.description}
              </p>

              {/* Customizer trigger if it's the custom preset or active */}
              {isActive && (
                <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    Mặc định {Math.round(preset.defaultSessionDuration / 60)} phút
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenCustomizer(preset);
                    }}
                    className="flex items-center gap-1.5 text-[11px] font-medium text-cyan-400 hover:text-cyan-300 p-1 -m-1"
                  >
                    <SlidersHorizontal className="w-3 h-3" />
                    <span>Tùy chỉnh số giây</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
