import React, { useState } from 'react';
import { SessionStats } from '../types/breathing';
import { X, Flame, Clock, Award, History, Calendar, Trash2 } from 'lucide-react';

interface StatsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  stats: SessionStats;
  onClearStats?: () => void;
}

export const StatsDrawer: React.FC<StatsDrawerProps> = ({
  isOpen,
  onClose,
  stats,
  onClearStats,
}) => {
  if (!isOpen) return null;

  const totalMinutes = Math.round(stats.totalSeconds / 60);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/80 backdrop-blur-sm animate-fade-in select-none">
      <div
        className="w-full max-w-md bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white tracking-tight">
                Nhật Ký & Thống Kê
              </h2>
              <p className="text-[11px] text-slate-400">
                Hành trình nuôi dưỡng hơi thở của bạn
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Top 3 KPI Cards */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="p-3 bg-slate-800/60 border border-slate-700/60 rounded-2xl text-center">
              <div className="flex items-center justify-center text-amber-400 mb-1">
                <Flame className="w-4 h-4" />
              </div>
              <span className="font-mono text-lg font-bold text-white block">
                {stats.currentStreakDays}
              </span>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                Ngày liên tiếp
              </span>
            </div>

            <div className="p-3 bg-slate-800/60 border border-slate-700/60 rounded-2xl text-center">
              <div className="flex items-center justify-center text-cyan-400 mb-1">
                <Clock className="w-4 h-4" />
              </div>
              <span className="font-mono text-lg font-bold text-white block">
                {totalMinutes}
              </span>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                Phút thở
              </span>
            </div>

            <div className="p-3 bg-slate-800/60 border border-slate-700/60 rounded-2xl text-center">
              <div className="flex items-center justify-center text-indigo-400 mb-1">
                <Award className="w-4 h-4" />
              </div>
              <span className="font-mono text-lg font-bold text-white block">
                {stats.totalSessions}
              </span>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                Phiên hoàn thành
              </span>
            </div>
          </div>

          {/* History list */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-slate-400" />
                <span>Lịch sử gần đây</span>
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">
                  {stats.history.length} bản ghi
                </span>
                {onClearStats && stats.history.length > 0 && (
                  <button
                    onClick={() => {
                      if (window.confirm('Bạn có chắc muốn đặt lại toàn bộ lịch sử luyện thở?')) {
                        onClearStats();
                      }
                    }}
                    className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                    title="Đặt lại lịch sử"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {stats.history.length === 0 ? (
              <div className="text-center py-10 px-4 rounded-2xl bg-slate-800/20 border border-slate-800/60">
                <Calendar className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-xs text-slate-400">
                  Chưa có lịch sử. Hãy hoàn thành phiên thở đầu tiên!
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {stats.history.map((item) => {
                  const dateObj = new Date(item.timestamp);
                  const formattedDate = `${dateObj.getDate()}/${dateObj.getMonth() + 1} lúc ${dateObj.getHours()}:${String(dateObj.getMinutes()).padStart(2, '0')}`;
                  const mins = Math.floor(item.durationSeconds / 60);
                  const secs = item.durationSeconds % 60;
                  const durationStr = mins > 0 ? `${mins}p ${secs > 0 ? `${secs}s` : ''}` : `${secs}s`;

                  return (
                    <div
                      key={item.id}
                      className="p-3 rounded-xl bg-slate-800/40 border border-slate-800 flex items-center justify-between"
                    >
                      <div>
                        <span className="text-xs font-medium text-white block">
                          {item.presetName}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {formattedDate} · {item.cyclesCompleted} nhịp
                        </span>
                      </div>
                      <span className="font-mono text-xs font-semibold text-cyan-400">
                        {durationStr}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
