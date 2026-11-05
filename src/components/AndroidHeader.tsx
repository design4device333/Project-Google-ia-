import React from 'react';
import { Wifi, BatteryMedium, Signal, Smartphone, Maximize2, Sparkles } from 'lucide-react';
import { sound } from '../utils/audioSynthesizer';

interface AndroidHeaderProps {
  isMobileFramed: boolean;
  onToggleFrame: () => void;
  onOpenCreate: () => void;
}

export const AndroidHeader: React.FC<AndroidHeaderProps> = ({
  isMobileFramed,
  onToggleFrame,
  onOpenCreate,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#090b10]/95 backdrop-blur-md border-b border-white/10 select-none">
      {/* Android System Status Bar Simulation */}
      <div className="flex items-center justify-between px-4 py-1 text-[11px] font-medium text-slate-400 border-b border-white/5 bg-black/40">
        <div className="flex items-center gap-2 tracking-wider">
          <span className="font-semibold text-slate-200">08:30</span>
          <span className="text-[9px] px-1 py-0.5 rounded bg-white/10 text-slate-300">4G+</span>
          <span className="text-[10px] text-slate-400 hidden sm:inline">1.2 MB/s</span>
        </div>
        <div className="flex items-center gap-2">
          <Signal className="w-3 h-3 text-slate-300" />
          <Wifi className="w-3 h-3 text-slate-300" />
          <div className="flex items-center gap-1">
            <span className="text-[10px]">96%</span>
            <BatteryMedium className="w-3.5 h-3.5 text-emerald-400" />
          </div>
        </div>
      </div>

      {/* App Bar */}
      <div className="flex items-center justify-between px-3 sm:px-5 py-2.5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 via-amber-400 to-sky-400 p-[1px] shadow-lg shadow-amber-500/20">
            <div className="w-full h-full rounded-lg bg-slate-950 flex items-center justify-center font-bold text-xs text-amber-400">
              PS5
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-sm sm:text-base font-bold tracking-tight text-white flex items-center gap-1">
                AVATAR STUDIO <span className="text-amber-400 text-xs">AI</span>
              </h1>
              <span className="text-[9px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded bg-amber-400/10 text-amber-400 border border-amber-400/20">
                PRO
              </span>
            </div>
            <p className="text-[10px] text-slate-400">Motor Unreal Engine 5.4 • Android Edition</p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            id="btn-toggle-frame"
            onClick={() => {
              sound.playClick();
              onToggleFrame();
            }}
            title={isMobileFramed ? "Cambiar a pantalla completa" : "Modo móvil Android"}
            className="hidden md:flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition-colors"
          >
            {isMobileFramed ? (
              <>
                <Maximize2 className="w-3.5 h-3.5 text-sky-400" />
                <span>Expandir</span>
              </>
            ) : (
              <>
                <Smartphone className="w-3.5 h-3.5 text-amber-400" />
                <span>Marco Android</span>
              </>
            )}
          </button>

          <button
            id="btn-header-quick-create"
            onClick={() => {
              sound.playClick();
              onOpenCreate();
            }}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 hover:brightness-110 active:scale-95 transition-all shadow-md shadow-amber-500/25"
          >
            <Sparkles className="w-3.5 h-3.5 fill-slate-950" />
            <span>Crear Avatar</span>
          </button>
        </div>
      </div>
    </header>
  );
};
