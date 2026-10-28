import React, { useEffect, useState } from 'react';
import { BreathingPhase, BreathingPreset } from '../types/breathing';
import { addHapticListener, HapticTriggerType } from '../utils/haptics';
import { Square, Circle, ArrowUp, ArrowRight, ArrowDown, ArrowLeft } from 'lucide-react';

interface BreathingVisualizerProps {
  phase: BreathingPhase;
  phaseSecondsLeft: number;
  phaseTotalSeconds: number;
  preset: BreathingPreset;
  isRunning: boolean;
  cycleCount: number;
  shapeMode?: 'square' | 'circle';
  onToggleShapeMode?: (mode: 'square' | 'circle') => void;
}

export const BreathingVisualizer: React.FC<BreathingVisualizerProps> = ({
  phase,
  phaseSecondsLeft,
  phaseTotalSeconds,
  preset,
  isRunning,
  cycleCount,
  shapeMode = 'square',
  onToggleShapeMode,
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

  // Calculate progress ratio (0.0 to 1.0)
  const progress =
    phaseTotalSeconds > 0
      ? Math.min(1, Math.max(0, (phaseTotalSeconds - phaseSecondsLeft) / phaseTotalSeconds))
      : 0;

  // Compute inner scale
  let scale = 1.0;
  let phaseText = 'Sẵn sàng';
  let phaseStep = 'Chuẩn bị';
  let phaseInstruction = 'Chạm nút Bắt đầu để vào nhịp';

  if (!isRunning && phase === 'idle') {
    scale = 1.0;
    phaseText = 'SẴN SÀNG';
    phaseStep = 'Bước 1: Bắt đầu';
    phaseInstruction = 'Thả lỏng cơ thể, ngồi thẳng lưng';
  } else if (phase === 'prepare') {
    scale = 1.05;
    phaseText = 'CHUẨN BỊ';
    phaseStep = 'Sẵn sàng...';
    phaseInstruction = 'Tập trung vào từng cạnh của hình vuông';
  } else if (phase === 'inhale') {
    scale = 1.0 + progress * 0.45;
    phaseText = 'HÍT VÀO';
    phaseStep = 'Bước 1: Hít vào';
    phaseInstruction = 'Hít sâu êm dịu bằng mũi, phình căng lồng ngực';
  } else if (phase === 'holdIn') {
    scale = 1.45;
    phaseText = 'GIỮ KHÍ';
    phaseStep = 'Bước 2: Nín giữ hơi';
    phaseInstruction = 'Nín giữ dưỡng khí thoải mái, tĩnh tâm';
  } else if (phase === 'exhale') {
    scale = 1.45 - progress * 0.45;
    phaseText = 'THỞ RA';
    phaseStep = 'Bước 3: Thở ra';
    phaseInstruction = 'Thở chậm rãi qua miệng, xẹp bụng từ từ';
  } else if (phase === 'holdOut') {
    scale = 1.0;
    phaseText = 'GIỮ TRỐNG';
    phaseStep = 'Bước 4: Nghỉ trống';
    phaseInstruction = 'Để phổi nghỉ ngơi hoàn toàn trước nhịp mới';
  } else if (phase === 'completed') {
    scale = 1.1;
    phaseText = 'HOÀN THÀNH';
    phaseStep = 'Xuất sắc';
    phaseInstruction = 'Bạn đã hoàn tất phiên thở trọn vẹn';
  }

  // Geometry for Square Box Breathing
  // Box size: 220px x 220px, inset margin: 12px
  // Inset box: 196px x 196px (from 12 to 208)
  const boxDim = 220;
  const margin = 12;
  const innerLen = boxDim - margin * 2; // 196

  let tracerX = margin;
  let tracerY = boxDim - margin;

  if (phase === 'inhale') {
    // Edge 1: Left edge moving UP from (margin, boxDim - margin) to (margin, margin)
    tracerX = margin;
    tracerY = boxDim - margin - progress * innerLen;
  } else if (phase === 'holdIn') {
    // Edge 2: Top edge moving RIGHT from (margin, margin) to (boxDim - margin, margin)
    tracerX = margin + progress * innerLen;
    tracerY = margin;
  } else if (phase === 'exhale') {
    // Edge 3: Right edge moving DOWN from (boxDim - margin, margin) to (boxDim - margin, boxDim - margin)
    tracerX = boxDim - margin;
    tracerY = margin + progress * innerLen;
  } else if (phase === 'holdOut') {
    // Edge 4: Bottom edge moving LEFT from (boxDim - margin, boxDim - margin) to (margin, boxDim - margin)
    tracerX = boxDim - margin - progress * innerLen;
    tracerY = boxDim - margin;
  } else {
    // Default starting point (bottom-left)
    tracerX = margin;
    tracerY = boxDim - margin;
  }

  // Circle Geometry
  const circleRadius = 100;
  const circleCircumference = 2 * Math.PI * circleRadius;
  const circleDashoffset = circleCircumference - progress * circleCircumference;

  // Active step highlighter flags
  const isStep1Active = isRunning && phase === 'inhale';
  const isStep2Active = isRunning && phase === 'holdIn';
  const isStep3Active = isRunning && phase === 'exhale';
  const isStep4Active = isRunning && phase === 'holdOut';

  return (
    <div className="relative flex flex-col items-center justify-center my-auto w-full select-none">
      {/* Shape Mode Switcher (Hình Vuông / Vòng Tròn) */}
      <div className="flex items-center justify-center gap-1.5 mb-3">
        <div className="p-1 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center gap-1 shadow-sm">
          <button
            type="button"
            onClick={() => onToggleShapeMode && onToggleShapeMode('square')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
              shapeMode === 'square'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Square className="w-3.5 h-3.5" />
            <span>Hình Vuông (Box)</span>
          </button>
          <button
            type="button"
            onClick={() => onToggleShapeMode && onToggleShapeMode('circle')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
              shapeMode === 'circle'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Circle className="w-3.5 h-3.5" />
            <span>Vòng Tròn (Zen)</span>
          </button>
        </div>
      </div>

      {/* Main Visualizer Area */}
      {shapeMode === 'square' ? (
        /* ========================================================
           SQUARE BOX BREATHING MATRIX (4 STEPS VISUALIZATION)
           ======================================================== */
        <div className="relative flex flex-col items-center justify-center w-full max-w-[340px] px-2">
          {/* STEP 2: TOP BADGE (GIỮ KHÍ) */}
          <div className="w-full flex justify-center mb-2">
            <div
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-medium transition-all ${
                isStep2Active
                  ? 'bg-purple-950/80 border-purple-500 text-purple-200 shadow-md shadow-purple-950/60 scale-105'
                  : 'bg-slate-900/60 border-slate-800/80 text-slate-400'
              }`}
            >
              <ArrowRight className={`w-3.5 h-3.5 ${isStep2Active ? 'text-purple-400 animate-pulse' : 'text-slate-500'}`} />
              <span className="font-semibold">Bước 2: Giữ Khí</span>
              <span className="font-mono text-[11px] opacity-80">({preset.holdIn}s)</span>
            </div>
          </div>

          {/* MIDDLE ROW: STEP 1 (LEFT) + SQUARE CONTAINER + STEP 3 (RIGHT) */}
          <div className="flex items-center justify-between w-full">
            {/* STEP 1: LEFT BADGE (HÍT VÀO) */}
            <div className="w-16 shrink-0 flex justify-end pr-1">
              <div
                className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl border text-[11px] font-medium transition-all text-center ${
                  isStep1Active
                    ? 'bg-cyan-950/80 border-cyan-500 text-cyan-200 shadow-md shadow-cyan-950/60 scale-105'
                    : 'bg-slate-900/60 border-slate-800/80 text-slate-400'
                }`}
              >
                <ArrowUp className={`w-3.5 h-3.5 mb-1 ${isStep1Active ? 'text-cyan-400 animate-pulse' : 'text-slate-500'}`} />
                <span className="font-semibold text-[10px] leading-tight">1. Hít Vào</span>
                <span className="font-mono text-[10px] opacity-80 mt-0.5">{preset.inhale}s</span>
              </div>
            </div>

            {/* THE CENTRAL BREATHING SQUARE */}
            <div className="relative w-[220px] h-[220px] shrink-0 flex items-center justify-center">
              {/* Outer Glow Ripples on Haptic */}
              <div
                className={`absolute rounded-3xl transition-all duration-500 pointer-events-none ${
                  hapticRipple
                    ? 'w-64 h-64 opacity-50 scale-110'
                    : 'w-56 h-56 opacity-15 scale-100'
                }`}
                style={{
                  background: `radial-gradient(circle, ${preset.colorScheme.glow} 0%, transparent 70%)`,
                }}
              />

              {/* Square SVG Perimeter Track & Glowing Tracer */}
              <svg className="w-full h-full pointer-events-none" viewBox={`0 0 ${boxDim} ${boxDim}`}>
                {/* Background square boundary track */}
                <rect
                  x={margin}
                  y={margin}
                  width={innerLen}
                  height={innerLen}
                  rx="18"
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.08)"
                  strokeWidth="3.5"
                />

                {/* 4 Individual Edge Highlights */}
                {/* Edge 1: Left (Inhale - Bottom to Top) */}
                <line
                  x1={margin}
                  y1={boxDim - margin}
                  x2={margin}
                  y2={margin}
                  stroke={isStep1Active ? preset.colorScheme.primary : 'rgba(255, 255, 255, 0.05)'}
                  strokeWidth={isStep1Active ? '4.5' : '2'}
                  strokeLinecap="round"
                />

                {/* Edge 2: Top (HoldIn - Left to Right) */}
                <line
                  x1={margin}
                  y1={margin}
                  x2={boxDim - margin}
                  y2={margin}
                  stroke={isStep2Active ? '#a855f7' : 'rgba(255, 255, 255, 0.05)'}
                  strokeWidth={isStep2Active ? '4.5' : '2'}
                  strokeLinecap="round"
                />

                {/* Edge 3: Right (Exhale - Top to Bottom) */}
                <line
                  x1={boxDim - margin}
                  y1={margin}
                  x2={boxDim - margin}
                  y2={boxDim - margin}
                  stroke={isStep3Active ? '#10b981' : 'rgba(255, 255, 255, 0.05)'}
                  strokeWidth={isStep3Active ? '4.5' : '2'}
                  strokeLinecap="round"
                />

                {/* Edge 4: Bottom (HoldOut - Right to Left) */}
                <line
                  x1={boxDim - margin}
                  y1={boxDim - margin}
                  x2={margin}
                  y2={boxDim - margin}
                  stroke={isStep4Active ? '#f59e0b' : 'rgba(255, 255, 255, 0.05)'}
                  strokeWidth={isStep4Active ? '4.5' : '2'}
                  strokeLinecap="round"
                />

                {/* Real-time Moving Tracer Dot along the active edge */}
                {isRunning && (
                  <>
                    {/* Glowing outer halo around tracer */}
                    <circle
                      cx={tracerX}
                      cy={tracerY}
                      r="9"
                      fill={
                        isStep1Active
                          ? preset.colorScheme.primary
                          : isStep2Active
                          ? '#a855f7'
                          : isStep3Active
                          ? '#10b981'
                          : '#f59e0b'
                      }
                      opacity="0.4"
                    />
                    {/* Solid glowing tracer bead */}
                    <circle
                      cx={tracerX}
                      cy={tracerY}
                      r="5"
                      fill="#ffffff"
                      filter="drop-shadow(0 0 6px rgba(255, 255, 255, 0.9))"
                    />
                  </>
                )}
              </svg>

              {/* Inner Lung Box that scales up and down */}
              <div
                className="absolute rounded-2xl flex flex-col items-center justify-center transition-transform shadow-2xl backdrop-blur-md"
                style={{
                  width: '136px',
                  height: '136px',
                  transform: `scale(${scale})`,
                  transition: 'transform 1s cubic-bezier(0.4, 0, 0.2, 1)',
                  background: `radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.22) 0%, ${preset.colorScheme.glow} 65%, rgba(15, 23, 42, 0.88) 100%)`,
                  border: `1.5px solid rgba(255, 255, 255, 0.22)`,
                  boxShadow: `0 0 35px ${preset.colorScheme.glow}`,
                }}
              >
                {/* Counter & Status Inside Box */}
                <div className="flex flex-col items-center justify-center text-center z-10 px-1">
                  <span className="text-[10px] tracking-widest font-bold uppercase text-white/90 drop-shadow-sm mb-0.5">
                    {phaseText}
                  </span>

                  <span className="font-mono text-4xl font-extrabold text-white tracking-tight tabular-nums drop-shadow-md">
                    {isRunning ? phaseSecondsLeft : '·'}
                  </span>

                  {isRunning && cycleCount > 0 && (
                    <span className="text-[10px] text-white/75 font-semibold mt-0.5">
                      Nhịp {cycleCount}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* STEP 3: RIGHT BADGE (THỞ RA) */}
            <div className="w-16 shrink-0 flex justify-start pl-1">
              <div
                className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl border text-[11px] font-medium transition-all text-center ${
                  isStep3Active
                    ? 'bg-emerald-950/80 border-emerald-500 text-emerald-200 shadow-md shadow-emerald-950/60 scale-105'
                    : 'bg-slate-900/60 border-slate-800/80 text-slate-400'
                }`}
              >
                <ArrowDown className={`w-3.5 h-3.5 mb-1 ${isStep3Active ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`} />
                <span className="font-semibold text-[10px] leading-tight">3. Thở Ra</span>
                <span className="font-mono text-[10px] opacity-80 mt-0.5">{preset.exhale}s</span>
              </div>
            </div>
          </div>

          {/* STEP 4: BOTTOM BADGE (GIỮ TRỐNG / NGHỈ) */}
          <div className="w-full flex justify-center mt-2">
            <div
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-medium transition-all ${
                isStep4Active
                  ? 'bg-amber-950/80 border-amber-500 text-amber-200 shadow-md shadow-amber-950/60 scale-105'
                  : 'bg-slate-900/60 border-slate-800/80 text-slate-400'
              }`}
            >
              <ArrowLeft className={`w-3.5 h-3.5 ${isStep4Active ? 'text-amber-400 animate-pulse' : 'text-slate-500'}`} />
              <span className="font-semibold">Bước 4: Giữ Trống</span>
              <span className="font-mono text-[11px] opacity-80">({preset.holdOut}s)</span>
            </div>
          </div>
        </div>
      ) : (
        /* ========================================================
           CIRCLE ZEN BREATHING
           ======================================================== */
        <div className="relative w-72 h-72 sm:w-80 sm:h-80 flex items-center justify-center">
          {/* Outer Glow Ripples on Haptic */}
          <div
            className={`absolute rounded-full transition-all duration-500 pointer-events-none ${
              hapticRipple
                ? 'w-72 h-72 opacity-60 scale-125'
                : 'w-64 h-64 opacity-20 scale-100'
            }`}
            style={{
              background: `radial-gradient(circle, ${preset.colorScheme.glow} 0%, transparent 70%)`,
            }}
          />

          {/* Circular SVG progress bar */}
          <svg className="w-full h-full -rotate-90 pointer-events-none" viewBox="0 0 240 240">
            <circle
              cx="120"
              cy="120"
              r={circleRadius}
              fill="none"
              stroke="rgba(255, 255, 255, 0.08)"
              strokeWidth="5"
            />
            {isRunning && (
              <circle
                cx="120"
                cy="120"
                r={circleRadius}
                fill="none"
                stroke={preset.colorScheme.primary}
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={circleCircumference}
                style={{
                  strokeDashoffset: isNaN(circleDashoffset) ? 0 : circleDashoffset,
                  transition: 'stroke-dashoffset 1s linear',
                }}
              />
            )}
          </svg>

          {/* Breathing Orb Circle */}
          <div
            className="absolute rounded-full flex flex-col items-center justify-center transition-transform shadow-2xl backdrop-blur-md"
            style={{
              width: '160px',
              height: '160px',
              transform: `scale(${scale})`,
              transition: 'transform 1s cubic-bezier(0.4, 0, 0.2, 1)',
              background: `radial-gradient(circle at 35% 35%, rgba(255, 255, 255, 0.25) 0%, ${preset.colorScheme.glow} 60%, rgba(15, 23, 42, 0.85) 100%)`,
              border: `1.5px solid rgba(255, 255, 255, 0.25)`,
              boxShadow: `0 0 45px ${preset.colorScheme.glow}`,
            }}
          >
            <div className="flex flex-col items-center justify-center text-center z-10 px-2">
              <span className="text-[11px] tracking-widest font-semibold uppercase opacity-90 mb-1 text-white">
                {phaseText}
              </span>

              <span className="font-mono text-5xl font-extrabold text-white tracking-tight tabular-nums drop-shadow-md">
                {isRunning ? phaseSecondsLeft : '·'}
              </span>

              {isRunning && cycleCount > 0 && (
                <span className="text-[10px] text-white/70 font-medium mt-1">
                  Nhịp {cycleCount}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Gentle instruction subtitle */}
      <div className="mt-5 text-center px-4 max-w-xs transition-opacity duration-300">
        <div className="text-xs font-medium text-cyan-300/80 mb-0.5">
          {isRunning ? phaseStep : 'Chu trình 4 bước khép kín'}
        </div>
        <p className="text-xs font-medium text-slate-300 leading-relaxed drop-shadow-sm">
          {phaseInstruction}
        </p>
      </div>
    </div>
  );
};
