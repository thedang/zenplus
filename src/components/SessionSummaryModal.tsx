import React from 'react';
import { BreathingPreset, SessionStats } from '../types/breathing';
import { Sparkles, Trophy, RotateCcw, Check, Heart } from 'lucide-react';

interface SessionSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRestart: () => void;
  preset: BreathingPreset;
  cyclesCompleted: number;
  durationSeconds: number;
  stats: SessionStats;
}

export const SessionSummaryModal: React.FC<SessionSummaryModalProps> = ({
  isOpen,
  onClose,
  onRestart,
  preset,
  cyclesCompleted,
  durationSeconds,
  stats,
}) => {
  if (!isOpen) return null;

  const minutes = Math.floor(durationSeconds / 60);
  const seconds = durationSeconds % 60;
  const timeFormatted = minutes > 0 ? `${minutes} phút ${seconds > 0 ? `${seconds}s` : ''}` : `${seconds} giây`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in select-none">
      <div className="w-full max-w-sm bg-slate-900 border border-cyan-500/30 rounded-3xl p-6 text-center shadow-2xl relative overflow-hidden">
        {/* Glow ambient background */}
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-48 h-48 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-cyan-500/25">
          <Trophy className="w-8 h-8 text-white" />
        </div>

        <h3 className="text-xl font-bold text-white tracking-tight mb-1">
          Hoàn Thành Phiên Thở!
        </h3>
        <p className="text-xs text-slate-400 mb-6">
          Tâm trí bạn vừa được tái tạo và nạp đầy oxy trong lành
        </p>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="p-3.5 bg-slate-800/60 border border-slate-700/60 rounded-2xl">
            <span className="text-[11px] text-slate-400 block mb-1">Thời lượng tập</span>
            <span className="font-mono text-lg font-bold text-white tabular-nums">
              {timeFormatted}
            </span>
          </div>

          <div className="p-3.5 bg-slate-800/60 border border-slate-700/60 rounded-2xl">
            <span className="text-[11px] text-slate-400 block mb-1">Số nhịp thở</span>
            <span className="font-mono text-lg font-bold text-cyan-400 tabular-nums">
              {cyclesCompleted} nhịp
            </span>
          </div>
        </div>

        {/* Streak highlight */}
        <div className="p-3.5 bg-indigo-950/40 border border-indigo-800/40 rounded-2xl mb-6 flex items-center justify-between text-left">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-semibold text-white block">
                Chuỗi ngày thở
              </span>
              <span className="text-[11px] text-indigo-200">
                Duy trì thói quen mỗi ngày
              </span>
            </div>
          </div>
          <span className="font-mono text-lg font-extrabold text-amber-400">
            {stats.currentStreakDays} ngày 🔥
          </span>
        </div>

        <div className="flex items-center gap-2 text-slate-400 text-xs justify-center mb-6">
          <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
          <span>Bài tập: {preset.vietnameseTitle}</span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={onRestart}
            className="flex-1 py-3 px-4 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-200 text-xs font-medium flex items-center justify-center gap-1.5 transition-all active:scale-95"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Thở tiếp</span>
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-semibold shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-1.5 transition-all active:scale-95"
          >
            <Check className="w-4 h-4 stroke-[2.5]" />
            <span>Xong</span>
          </button>
        </div>
      </div>
    </div>
  );
};
