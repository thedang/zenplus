import React, { useEffect, useState } from 'react';
import { BreathingPhase, BreathingPreset } from '../types/breathing';
import { addHapticListener, HapticTriggerType } from '../utils/haptics';

interface BreathingCircleProps {
  phase: BreathingPhase;
  phaseSecondsLeft: number;
  phaseTotalSeconds: number;
  preset: BreathingPreset;
  isRunning: boolean;
  cycleCount: number;
}

export const BreathingCircle: React.FC<BreathingCircleProps> = ({
  phase,
  phaseSecondsLeft,
  phaseTotalSeconds,
  preset,
  isRunning,
  cycleCount,
}) => {
  const [hapticRipple, setHapticRipple] = useState(false);

  useEffect(() => {
    const unsub = addHapticListener((_type: HapticTriggerType) => {
      setHapticRipple(true);
      const timer = setTimeout(() => setHapticRipple(false), 450);
      return () => clearTimeout(timer);
    });
    return unsub;
  }, []);

  // Compute scale and visual progress
  // Inhale: expand from 1.0 to 1.6
  // HoldIn: stay at 1.6
  // Exhale: contract from 1.6 to 1.0
  // HoldOut: stay at 1.0
  let scale = 1.0;
  let phaseText = 'Sẵn sàng';
  let phaseInstruction = 'Chạm nút Bắt đầu để vào nhịp';

  if (!isRunning && phase === 'idle') {
    scale = 1.0;
    phaseText = 'Sẵn sàng';
    phaseInstruction = 'Thả lỏng vai, giữ lưng thẳng';
  } else if (phase === 'prepare') {
    scale = 1.05;
    phaseText = 'Chuẩn bị';
    phaseInstruction = 'Nhắm mắt hoặc nhìn vào vòng tròn';
  } else if (phase === 'inhale') {
    const progress = phaseTotalSeconds > 0 ? (phaseTotalSeconds - phaseSecondsLeft) / phaseTotalSeconds : 0;
    scale = 1.0 + progress * 0.55;
    phaseText = 'HÍT VÀO';
    phaseInstruction = 'Hít sâu êm dịu bằng mũi, phình bụng';
  } else if (phase === 'holdIn') {
    scale = 1.55;
    phaseText = 'GIỮ KHÍ';
    phaseInstruction = 'Nín giữ khí thoải mái, tĩnh tâm';
  } else if (phase === 'exhale') {
    const progress = phaseTotalSeconds > 0 ? (phaseTotalSeconds - phaseSecondsLeft) / phaseTotalSeconds : 0;
    scale = 1.55 - progress * 0.55;
    phaseText = 'THỞ RA';
    phaseInstruction = 'Thở chậm rãi qua miệng, xẹp bụng';
  } else if (phase === 'holdOut') {
    scale = 1.0;
    phaseText = 'GIỮ TRỐNG';
    phaseInstruction = 'Để phổi nghỉ ngơi thư giãn';
  } else if (phase === 'completed') {
    scale = 1.1;
    phaseText = 'HOÀN THÀNH';
    phaseInstruction = 'Tuyệt vời! Bạn vừa nạp thêm năng lượng mới';
  }

  // Circular SVG progress bar
  const radius = 135;
  const circumference = 2 * Math.PI * radius;
  const progressRatio = phaseTotalSeconds > 0 ? (phaseTotalSeconds - phaseSecondsLeft) / phaseTotalSeconds : 0;
  const strokeDashoffset = circumference - progressRatio * circumference;

  return (
    <div className="relative flex flex-col items-center justify-center my-auto w-full select-none">
      {/* Outer Glow Ripples triggered on Haptic */}
      <div
        className={`absolute rounded-full transition-all duration-500 pointer-events-none ${
          hapticRipple
            ? 'w-72 h-72 sm:w-80 sm:h-80 opacity-60 scale-125'
            : 'w-64 h-64 sm:w-72 sm:h-72 opacity-20 scale-100'
        }`}
        style={{
          background: `radial-gradient(circle, ${preset.colorScheme.glow} 0%, transparent 70%)`,
        }}
      />

      {/* SVG Progress Ring */}
      <div className="relative w-72 h-72 sm:w-80 sm:h-80 flex items-center justify-center">
        <svg className="w-full h-full -rotate-90 pointer-events-none" viewBox="0 0 300 300">
          {/* Background track */}
          <circle
            cx="150"
            cy="150"
            r={radius}
            fill="none"
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth="5"
          />
          {/* Active progress stroke */}
          {isRunning && (
            <circle
              cx="150"
              cy="150"
              r={radius}
              fill="none"
              stroke={preset.colorScheme.primary}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              style={{
                strokeDashoffset: isNaN(strokeDashoffset) ? 0 : strokeDashoffset,
                transition: 'stroke-dashoffset 1s linear',
              }}
            />
          )}
        </svg>

        {/* Breathing Orb Circle that expands and contracts */}
        <div
          className="absolute rounded-full flex flex-col items-center justify-center transition-transform shadow-2xl backdrop-blur-md"
          style={{
            width: '180px',
            height: '180px',
            transform: `scale(${scale})`,
            transition: 'transform 1s cubic-bezier(0.4, 0, 0.2, 1)',
            background: `radial-gradient(circle at 35% 35%, rgba(255, 255, 255, 0.25) 0%, ${preset.colorScheme.glow} 60%, rgba(15, 23, 42, 0.85) 100%)`,
            border: `1.5px solid rgba(255, 255, 255, 0.25)`,
            boxShadow: `0 0 50px ${preset.colorScheme.glow}`,
          }}
        >
          {/* Counter display inside the orb */}
          <div className="flex flex-col items-center justify-center text-center z-10 px-2">
            <span
              className="text-xs tracking-widest font-semibold uppercase opacity-90 mb-1"
              style={{ color: '#ffffff' }}
            >
              {phaseText}
            </span>

            <span className="font-mono text-5xl font-extrabold text-white tracking-tight tabular-nums drop-shadow-md">
              {isRunning ? (phase === 'prepare' ? phaseSecondsLeft : phaseSecondsLeft) : '·'}
            </span>

            {isRunning && cycleCount > 0 && (
              <span className="text-[10px] text-white/70 font-medium mt-1">
                Nhịp {cycleCount}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Gentle instruction subtitle */}
      <div className="mt-8 text-center px-4 max-w-xs transition-opacity duration-300">
        <p className="text-sm font-medium text-slate-300 leading-relaxed drop-shadow-sm">
          {phaseInstruction}
        </p>
      </div>
    </div>
  );
};
