import React, { useState, useEffect } from 'react';
import { Smartphone, Monitor } from 'lucide-react';

interface DeviceFrameWrapperProps {
  children: React.ReactNode;
}

export const DeviceFrameWrapper: React.FC<DeviceFrameWrapperProps> = ({ children }) => {
  const [isMobileMode, setIsMobileMode] = useState<boolean>(true);
  const [isActualMobile, setIsActualMobile] = useState<boolean>(false);

  useEffect(() => {
    const checkWidth = () => {
      const isMobile = window.innerWidth < 768;
      setIsActualMobile(isMobile);
      if (isMobile) {
        setIsMobileMode(false); // Natural full screen on real mobile
      }
    };
    checkWidth();
    window.addEventListener('resize', checkWidth);
    return () => window.removeEventListener('resize', checkWidth);
  }, []);

  if (isActualMobile || !isMobileMode) {
    return (
      <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col">
        {/* If on desktop in wide view, provide a clean return-to-frame button in a subtle corner */}
        {!isActualMobile && (
          <div className="fixed top-4 right-4 z-40">
            <button
              onClick={() => setIsMobileMode(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800/80 hover:bg-slate-700/80 text-xs text-slate-300 border border-slate-700 backdrop-blur-md shadow-md transition-all active:scale-95"
            >
              <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
              <span>Khung di động (Mobile Frame)</span>
            </button>
          </div>
        )}
        <div className="w-full flex-1 flex flex-col max-w-lg mx-auto">
          {children}
        </div>
      </div>
    );
  }

  // Desktop simulator mode with realistic mobile device frame
  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-2 sm:p-6 select-none">
      {/* Top control bar on desktop */}
      <div className="mb-3 flex items-center justify-between w-full max-w-[420px] px-2 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-medium text-slate-300">Mô phỏng Mobile App</span>
        </div>
        <button
          onClick={() => setIsMobileMode(false)}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 transition-colors"
        >
          <Monitor className="w-3.5 h-3.5 text-cyan-400" />
          <span>Toàn màn hình</span>
        </button>
      </div>

      {/* Realistic Mobile Device Frame */}
      <div className="relative w-full max-w-[390px] h-[830px] max-h-[94vh] bg-slate-900 rounded-[48px] p-3 shadow-[0_0_60px_rgba(0,0,0,0.8)] border-[6px] border-slate-800 ring-1 ring-white/10 flex flex-col overflow-hidden">
        {/* Dynamic Island / Speaker Pill */}
        <div className="absolute top-5 left-1/2 -translate-x-1/2 w-28 h-5 bg-black rounded-full z-40 flex items-center justify-end px-3">
          <div className="w-2.5 h-2.5 rounded-full bg-slate-900 ring-1 ring-white/20" />
        </div>

        {/* Inner Phone Screen */}
        <div className="w-full h-full bg-slate-950 rounded-[38px] overflow-hidden flex flex-col relative">
          {children}
        </div>
      </div>
    </div>
  );
};
