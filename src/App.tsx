import React, { useState, useEffect } from 'react';
import { INITIAL_AVATARS } from './data/initialAvatars';
import { AvatarCharacter, CameraView, AnimationPose, StudioTab } from './types';
import { AndroidHeader } from './components/AndroidHeader';
import { CharacterStage } from './components/CharacterStage';
import { CastGallery } from './components/CastGallery';
import { AnimationStudio } from './components/AnimationStudio';
import { GeneratorDrawer } from './components/GeneratorDrawer';
import { ExportModal } from './components/ExportModal';
import { AndroidBottomNav } from './components/AndroidBottomNav';
import { sound } from './utils/audioSynthesizer';
import { Sparkles, Share2, Layers, Cpu, Smartphone } from 'lucide-react';

export default function App() {
  const [characters, setCharacters] = useState<AvatarCharacter[]>(INITIAL_AVATARS);
  const [selectedCharacter, setSelectedCharacter] = useState<AvatarCharacter>(INITIAL_AVATARS[0]);
  const [currentPose, setCurrentPose] = useState<AnimationPose>('idle_breathing');
  const [cameraView, setCameraView] = useState<CameraView>('portrait');
  const [activeAtmosphere, setActiveAtmosphere] = useState<string>('embers');
  const [activeTab, setActiveTab] = useState<StudioTab>('cast');

  // Modals / Drawers
  const [isGeneratorOpen, setIsGeneratorOpen] = useState<boolean>(false);
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);
  const [isMobileFramed, setIsMobileFramed] = useState<boolean>(false);

  // Load custom avatars from localStorage if available
  useEffect(() => {
    try {
      const saved = localStorage.getItem('ps5_custom_avatars');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCharacters([...INITIAL_AVATARS, ...parsed]);
        }
      }
    } catch {}
  }, []);

  const handleAvatarCreated = (newAvatar: AvatarCharacter) => {
    setCharacters((prev) => [newAvatar, ...prev]);
    setSelectedCharacter(newAvatar);
    setCameraView('portrait');

    // Save to local storage
    try {
      const customOnes = [newAvatar];
      const existing = localStorage.getItem('ps5_custom_avatars');
      if (existing) {
        customOnes.push(...JSON.parse(existing));
      }
      localStorage.setItem('ps5_custom_avatars', JSON.stringify(customOnes.slice(0, 10)));
    } catch {}
  };

  return (
    <div className="min-h-screen bg-[#07080d] text-slate-100 flex flex-col items-center justify-start selection:bg-amber-400 selection:text-slate-950 font-sans">
      {/* Outer Shell Wrapper (Supports standard responsive or Android device frame) */}
      <div
        className={`w-full transition-all duration-300 ${
          isMobileFramed
            ? 'max-w-[430px] my-4 rounded-[42px] border-[10px] border-slate-900 shadow-2xl shadow-black/80 overflow-hidden ring-1 ring-white/10'
            : 'max-w-4xl'
        }`}
      >
        {/* Android Top Header */}
        <AndroidHeader
          isMobileFramed={isMobileFramed}
          onToggleFrame={() => setIsMobileFramed(!isMobileFramed)}
          onOpenCreate={() => setIsGeneratorOpen(true)}
        />

        {/* Main App Content Area */}
        <main className="px-3 sm:px-6 py-4 space-y-6 pb-28">
          {/* Main 3D Character Inspection Stage */}
          <CharacterStage
            character={selectedCharacter}
            allCharacters={characters}
            onSelectCharacter={(char) => setSelectedCharacter(char)}
            currentPose={currentPose}
            cameraView={cameraView}
            onChangeCameraView={(view) => setCameraView(view)}
            onOpenExport={(targetChar) => {
              if (targetChar) setSelectedCharacter(targetChar);
              setIsExportOpen(true);
            }}
            onOpenCreate={() => setIsGeneratorOpen(true)}
          />

          {/* Quick Sub-Navigation / Tab switcher */}
          <div className="flex items-center gap-2 border-b border-white/10 pb-2">
            <button
              onClick={() => {
                sound.playClick();
                setActiveTab('cast');
              }}
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'cast'
                  ? 'bg-amber-400/15 text-amber-400 border border-amber-400/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Elenco de Personajes (Cast)
            </button>
            <button
              onClick={() => {
                sound.playClick();
                setActiveTab('animate');
              }}
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'animate'
                  ? 'bg-amber-400/15 text-amber-400 border border-amber-400/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Estudio de Animación y Poses
            </button>
            <button
              onClick={() => {
                sound.playClick();
                setIsExportOpen(true);
              }}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg text-slate-400 hover:text-white flex items-center gap-1 ml-auto"
            >
              <Share2 className="w-3.5 h-3.5 text-sky-400" />
              <span>Exportar RRSS</span>
            </button>
          </div>

          {/* Dynamic Tab Content */}
          {activeTab === 'cast' && (
            <CastGallery
              characters={characters}
              selectedCharacterId={selectedCharacter.id}
              onSelectCharacter={(char) => setSelectedCharacter(char)}
              onOpenCreate={() => setIsGeneratorOpen(true)}
              onOpenExport={(char) => {
                setSelectedCharacter(char);
                setIsExportOpen(true);
              }}
            />
          )}

          {activeTab === 'animate' && (
            <AnimationStudio
              character={selectedCharacter}
              currentPose={currentPose}
              onSelectPose={(pose) => setCurrentPose(pose)}
              activeAtmosphere={activeAtmosphere}
              onChangeAtmosphere={(atm) => setActiveAtmosphere(atm)}
            />
          )}

          {activeTab === 'export' && (
            <div className="p-6 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950 border border-white/15 text-center space-y-4 shadow-xl">
              <div className="w-14 h-14 rounded-2xl bg-amber-400/15 border border-amber-400/30 text-amber-400 mx-auto flex items-center justify-center shadow-lg shadow-amber-400/10">
                <Share2 className="w-7 h-7" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-white font-display">
                  Suite de Exportación en Alta Resolución
                </h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                  Guarda avatares en formatos compatibles con redes sociales (PNG sin pérdidas, JPG ligero para Instagram/WhatsApp) hasta resolución 4K Master.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-w-xl mx-auto pt-2 text-left">
                <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                  <div className="text-[10px] font-mono text-amber-400">INSTAGRAM (1:1)</div>
                  <div className="text-xs font-bold text-white mt-0.5">Avatar Perfil</div>
                  <div className="text-[10px] text-slate-400">Hasta 3840×3840 px</div>
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                  <div className="text-[10px] font-mono text-amber-400">TIKTOK (9:16)</div>
                  <div className="text-xs font-bold text-white mt-0.5">Historias / Reels</div>
                  <div className="text-[10px] text-slate-400">Vertical HD & 4K</div>
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                  <div className="text-[10px] font-mono text-amber-400">TWITCH / X (16:9)</div>
                  <div className="text-xs font-bold text-white mt-0.5">Banner Gaming</div>
                  <div className="text-[10px] text-slate-400">Ultra Wide 4K</div>
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                  <div className="text-[10px] font-mono text-amber-400">3D MODEL (16:9)</div>
                  <div className="text-xs font-bold text-white mt-0.5">Hoja de Arte UE5</div>
                  <div className="text-[10px] text-slate-400">Ficha técnica Artlist</div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  id="btn-open-export-suite"
                  onClick={() => {
                    sound.playClick();
                    setIsExportOpen(true);
                  }}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-bold text-xs hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-amber-400/25"
                >
                  Exportar "{selectedCharacter.name}" en Alta Resolución
                </button>
              </div>
            </div>
          )}

          {/* PS5 Quality & Tech Spec Footer Banner */}
          <footer className="pt-4 border-t border-white/5 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-500">
            <div className="flex items-center gap-2">
              <Cpu className="w-3.5 h-3.5 text-amber-400" />
              <span>Unreal Engine 5.4 • MetaHuman Creator • 60 FPS</span>
            </div>
            <div className="flex items-center gap-2">
              <span>Android Ready • PWA Compliant</span>
            </div>
          </footer>
        </main>

        {/* Fixed Android Bottom Navigation Bar */}
        <AndroidBottomNav
          activeTab={activeTab}
          onChangeTab={(tab) => {
            if (tab === 'export') {
              setIsExportOpen(true);
            } else {
              setActiveTab(tab);
            }
          }}
          onOpenCreate={() => setIsGeneratorOpen(true)}
        />
      </div>

      {/* Slide-over / Modal Drawers */}
      <GeneratorDrawer
        isOpen={isGeneratorOpen}
        onClose={() => setIsGeneratorOpen(false)}
        onAvatarCreated={handleAvatarCreated}
        onOpenExport={(char) => {
          setSelectedCharacter(char);
          setIsExportOpen(true);
        }}
      />

      <ExportModal
        character={selectedCharacter}
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
      />
    </div>
  );
}
