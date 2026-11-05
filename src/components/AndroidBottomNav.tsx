import React from 'react';
import { Users, Sparkles, Activity, Share2 } from 'lucide-react';
import { StudioTab } from '../types';
import { sound } from '../utils/audioSynthesizer';

interface AndroidBottomNavProps {
  activeTab: StudioTab;
  onChangeTab: (tab: StudioTab) => void;
  onOpenCreate: () => void;
}

export const AndroidBottomNav: React.FC<AndroidBottomNavProps> = ({
  activeTab,
  onChangeTab,
  onOpenCreate,
}) => {
  const tabs = [
    { id: 'cast' as StudioTab, label: 'Elenco (Cast)', icon: Users },
    { id: 'animate' as StudioTab, label: 'Animación', icon: Activity },
    { id: 'export' as StudioTab, label: 'Exportar RRSS', icon: Share2 },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#090a10]/95 backdrop-blur-lg border-t border-white/10 select-none pb-safe">
      <div className="max-w-md mx-auto flex items-center justify-around px-3 py-2 relative">
        {/* Left tabs */}
        <button
          id="nav-tab-cast"
          onClick={() => {
            sound.playClick();
            onChangeTab('cast');
          }}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
            activeTab === 'cast' ? 'text-amber-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-5 h-5" />
          <span className="text-[10px] font-semibold">Elenco</span>
        </button>

        {/* Center Floating "Crear con IA" Button */}
        <div className="relative -top-5">
          <button
            id="nav-btn-floating-create"
            onClick={() => {
              sound.playClick();
              onOpenCreate();
            }}
            className="w-13 h-13 rounded-full bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 text-slate-950 p-[2px] shadow-xl shadow-amber-500/35 active:scale-95 transition-all flex items-center justify-center group"
          >
            <div className="w-full h-full rounded-full bg-gradient-to-tr from-amber-400 to-amber-300 flex items-center justify-center">
              <Sparkles className="w-6 h-6 fill-slate-950 stroke-slate-950 group-hover:rotate-12 transition-transform" />
            </div>
          </button>
          <div className="text-[10px] font-bold text-amber-400 text-center mt-0.5 tracking-tight">
            Crear IA
          </div>
        </div>

        {/* Right tabs */}
        <button
          id="nav-tab-animate"
          onClick={() => {
            sound.playClick();
            onChangeTab('animate');
          }}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
            activeTab === 'animate' ? 'text-amber-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Activity className="w-5 h-5" />
          <span className="text-[10px] font-semibold">Animación</span>
        </button>

        <button
          id="nav-tab-export"
          onClick={() => {
            sound.playClick();
            onChangeTab('export');
          }}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
            activeTab === 'export' ? 'text-amber-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Share2 className="w-5 h-5" />
          <span className="text-[10px] font-semibold">Exportar</span>
        </button>
      </div>

      {/* Android home bar pill simulation */}
      <div className="flex justify-center pb-1">
        <div className="w-32 h-1 bg-white/20 rounded-full"></div>
      </div>
    </nav>
  );
};
