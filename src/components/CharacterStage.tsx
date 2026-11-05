import React, { useState, useRef, useEffect } from 'react';
import { 
  RotateCcw, 
  Volume2, 
  Camera, 
  Sparkles, 
  Eye, 
  ShieldAlert, 
  Maximize, 
  Sun,
  Layers,
  Flame,
  Radio,
  Columns2,
  ArrowLeftRight,
  Check,
  Download,
  FileImage,
  CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AvatarCharacter, CameraView, AnimationPose } from '../types';
import { sound } from '../utils/audioSynthesizer';
import { renderHighResCanvas, downloadCanvasAsFile, ExportImageFormat } from '../utils/exportEngine';

interface CharacterStageProps {
  character: AvatarCharacter;
  allCharacters?: AvatarCharacter[];
  onSelectCharacter?: (char: AvatarCharacter) => void;
  currentPose: AnimationPose;
  cameraView: CameraView;
  onChangeCameraView: (view: CameraView) => void;
  onOpenExport: (targetChar?: AvatarCharacter) => void;
  onOpenCreate: () => void;
}

export const CharacterStage: React.FC<CharacterStageProps> = ({
  character,
  allCharacters = [],
  onSelectCharacter,
  currentPose,
  cameraView,
  onChangeCameraView,
  onOpenExport,
}) => {
  const [rotationAngle, setRotationAngle] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStartX, setDragStartX] = useState<number>(0);
  const [isPlayingVoice, setIsPlayingVoice] = useState<boolean>(false);
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [showLightingTool, setShowLightingTool] = useState<boolean>(false);
  const [rimLightPosition, setRimLightPosition] = useState<{ x: number; y: number }>({ x: 75, y: 25 });
  const [showInfoSheet, setShowInfoSheet] = useState<boolean>(true);

  // Comparison Mode States
  const [isCompareMode, setIsCompareMode] = useState<boolean>(false);
  const [compareCharId, setCompareCharId] = useState<string>('');

  // Quick High-Resolution Save State
  const [isQuickSaving, setIsQuickSaving] = useState<boolean>(false);
  const [quickSaveMessage, setQuickSaveMessage] = useState<string | null>(null);

  const handleQuickSave = async (targetChar: AvatarCharacter, ext: ExportImageFormat = 'png') => {
    setIsQuickSaving(true);
    sound.playClick();
    try {
      const canvas = await renderHighResCanvas(targetChar, {
        format: 'instagram_avatar',
        imageFormat: ext,
        quality: '2k',
        includeGamerBadge: true,
        includeWatermark: false,
        includeSpecSheet: false,
        jpegQuality: 0.95,
      });
      const cleanName = targetChar.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
      const filename = `${cleanName}_ps5_2k.${ext === 'jpeg' ? 'jpg' : ext}`;
      await downloadCanvasAsFile(canvas, filename, ext, 0.95);
      sound.playSuccess();
      setQuickSaveMessage(`¡${targetChar.name} guardado en alta resolución (${ext === 'jpeg' ? 'JPG' : 'PNG'} 2048px)!`);
      setTimeout(() => setQuickSaveMessage(null), 3500);
    } catch (e) {
      console.error('Quick save error:', e);
    } finally {
      setIsQuickSaving(false);
    }
  };

  const containerRef = useRef<HTMLDivElement>(null);

  // Derive secondary comparison character
  const otherCharacters = allCharacters.filter((c) => c.id !== character.id);
  const compareCharacter: AvatarCharacter = 
    allCharacters.find((c) => c.id === compareCharId) ||
    otherCharacters[0] ||
    character;

  // Turntable continuous spin when in turntable_360 pose
  useEffect(() => {
    if (currentPose === 'turntable_360') {
      const interval = setInterval(() => {
        setRotationAngle((prev) => (prev + 1) % 360);
      }, 30);
      return () => clearInterval(interval);
    }
  }, [currentPose]);

  // Touch and mouse drag handlers for 360 rotation
  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    setDragStartX(e.clientX);
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const deltaX = e.clientX - dragStartX;
    setRotationAngle((prev) => (prev + deltaX * 0.7) % 360);
    setDragStartX(e.clientX);

    // Update rim light following pointer
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const xPercent = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
      const yPercent = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
      setRimLightPosition({ x: xPercent, y: yPercent });
    }
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  // Play simulated character voice
  const handlePlayVoice = () => {
    sound.playRadioComms(character.voice.pitch);
    setIsPlayingVoice(true);
    setPlayingVoiceId(character.id);
    setTimeout(() => {
      setIsPlayingVoice(false);
      setPlayingVoiceId(null);
    }, 2800);
  };

  const handlePlayVoiceFor = (char: AvatarCharacter) => {
    sound.playRadioComms(char.voice.pitch);
    setPlayingVoiceId(char.id);
    setTimeout(() => {
      setPlayingVoiceId(null);
    }, 2800);
  };

  const handleSwapCharacters = () => {
    if (!onSelectCharacter || compareCharacter.id === character.id) return;
    sound.playClick();
    const oldPrimary = character;
    const oldSecondary = compareCharacter;
    onSelectCharacter(oldSecondary);
    setCompareCharId(oldPrimary.id);
  };

  // Helper to select image based on camera view
  const getImageFor = (char: AvatarCharacter, view: CameraView) => {
    return view === 'portrait' ? char.images.portrait :
      view === 'fullBody' ? char.images.fullBody :
      view === 'turnaroundSheet' ? char.images.turnaroundSheet :
      char.images.portrait;
  };

  const currentImage = getImageFor(character, cameraView);
  const compareImage = getImageFor(compareCharacter, cameraView);

  const poseAnimation = currentPose === 'idle_breathing'
    ? {
        y: [0, -4, 0],
        scale: [1, 1.012, 1],
        rotateZ: Math.sin((rotationAngle * Math.PI) / 180) * 1.5,
      }
    : currentPose === 'combat_ready'
    ? {
        y: [0, -2, 0],
        scale: 1.03,
        rotateZ: -1,
      }
    : currentPose === 'glance_close'
    ? {
        scale: 1.15,
        y: -10,
      }
    : {
        rotateY: rotationAngle,
      };

  const poseTransition = {
    y: { duration: 3.2, repeat: Infinity, ease: 'easeInOut' },
    scale: { duration: 3.2, repeat: Infinity, ease: 'easeInOut' },
  };

  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl">
      {/* 3D Viewport Header */}
      <div className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-zinc-900/90 backdrop-blur-md border border-zinc-700 text-[10px] font-bold tracking-wider text-zinc-200 pointer-events-auto">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)] animate-pulse"></div>
          <span className="font-mono uppercase tracking-widest text-zinc-300">
            {isCompareMode ? 'MODO COMPARACIÓN (2P)' : 'NEXT-GEN 60FPS'}
          </span>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 pointer-events-auto">
          {/* Compare Mode Toggle Button */}
          <button
            id="btn-stage-compare-mode"
            onClick={() => {
              sound.playClick();
              setIsCompareMode(!isCompareMode);
              if (!isCompareMode) {
                setShowInfoSheet(true);
              }
            }}
            title={isCompareMode ? 'Desactivar modo comparación' : 'Activar Modo Comparación lado a lado'}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-xs font-semibold backdrop-blur-md transition-all ${
              isCompareMode
                ? 'bg-blue-600 text-white border-blue-400 shadow-[0_0_14px_rgba(59,130,246,0.7)] ring-1 ring-blue-300'
                : 'bg-zinc-900/80 text-zinc-300 border-zinc-700 hover:border-zinc-500 hover:text-white'
            }`}
          >
            <Columns2 className={`w-3.5 h-3.5 ${isCompareMode ? 'text-white' : 'text-blue-400'}`} />
            <span className="text-[11px] font-bold tracking-tight">
              {isCompareMode ? 'Comparando' : 'Modo Comparación'}
            </span>
          </button>
          
          <button
            id="btn-stage-lighting"
            onClick={() => {
              sound.playClick();
              setShowLightingTool(!showLightingTool);
            }}
            title="Ajustar iluminación Lumen"
            className={`p-2 rounded-md border backdrop-blur-md transition-all ${
              showLightingTool
                ? 'bg-blue-500 text-white border-blue-400 shadow-[0_0_12px_rgba(59,130,246,0.6)]'
                : 'bg-zinc-900/80 text-zinc-400 border-zinc-700 hover:border-zinc-500 hover:text-white'
            }`}
          >
            <Sun className="w-3.5 h-3.5" />
          </button>
          
          <button
            id="btn-stage-info-toggle"
            onClick={() => {
              sound.playClick();
              setShowInfoSheet(!showInfoSheet);
            }}
            title={isCompareMode ? 'Ficha comparativa' : 'Mostrar ficha del personaje'}
            className={`p-2 rounded-md border backdrop-blur-md transition-all ${
              showInfoSheet
                ? 'bg-zinc-800 text-blue-400 border-blue-500/50'
                : 'bg-zinc-900/80 text-zinc-400 border-zinc-700 hover:border-zinc-500 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Interactive 3D Stage Area */}
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="relative h-[390px] sm:h-[460px] w-full flex items-center justify-center cursor-grab active:cursor-grabbing overflow-hidden turnaround-strip touch-none"
      >
        {/* Dot Matrix Pattern Overlay from Artistic Flair */}
        <div className="absolute inset-0 opacity-15 pointer-events-none artistic-dot-grid" />

        {/* Concentric Pulse Rings behind character */}
        <div className="absolute w-[300px] sm:w-[380px] h-[300px] sm:h-[380px] rounded-full border-[0.5px] border-zinc-700/60 pointer-events-none animate-pulse" />
        <div className="absolute w-[380px] sm:w-[480px] h-[380px] sm:h-[480px] rounded-full border border-blue-500/10 pointer-events-none" />

        {/* Subtle big watermark typography in background */}
        <div className="absolute top-12 right-6 flex flex-col items-end pointer-events-none select-none opacity-10">
          <span className="text-[44px] sm:text-[60px] font-black tracking-tighter text-white font-display leading-none">GEN.01</span>
          <span className="text-[10px] font-mono tracking-[0.3em] uppercase text-zinc-400">STAGE VIEWPORT</span>
        </div>

        {/* Dynamic Ray-Tracing Rim Light Gradient (Electric Blue & Violet) */}
        <div
          className="absolute inset-0 pointer-events-none transition-opacity duration-300"
          style={{
            background: `radial-gradient(circle 360px at ${rimLightPosition.x}% ${rimLightPosition.y}%, rgba(59, 130, 246, 0.22), rgba(147, 51, 234, 0.14) 45%, transparent 70%)`,
          }}
        />

        {/* Ambient Glowing Mote Particles (Electric Blue & Violet) */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-60">
          {[...Array(9)].map((_, i) => (
            <motion.div
              key={i}
              className={`absolute w-1 h-1 rounded-full ${
                i % 2 === 0
                  ? 'bg-blue-400 shadow-[0_0_8px_#3b82f6]'
                  : 'bg-purple-400 shadow-[0_0_8px_#a855f7]'
              }`}
              initial={{
                x: `${(i * 12 + 10) % 95}%`,
                y: '105%',
                opacity: 0.1,
              }}
              animate={{
                y: '-10%',
                opacity: [0.1, 0.8, 0],
                x: `${((i * 12 + 10) % 95) + (i % 2 === 0 ? 5 : -5)}%`,
              }}
              transition={{
                duration: 4 + (i % 4) * 1.5,
                repeat: Infinity,
                ease: 'linear',
                delay: i * 0.7,
              }}
            />
          ))}
        </div>

        {/* Visual Subject Area: Single View or Side-by-Side Comparison Mode */}
        {isCompareMode ? (
          <div className="relative w-full h-full flex flex-row items-stretch divide-x divide-zinc-800/80 z-10">
            {/* Left Slot: Avatar A */}
            <div className="relative flex-1 flex flex-col items-center justify-center p-2 pt-14 pb-12 overflow-hidden group">
              {/* Slot Header: Badge & Selector */}
              <div className="absolute top-12 left-2 right-2 flex items-center justify-between z-20 pointer-events-auto gap-1">
                <span className="px-2 py-0.5 rounded bg-blue-600/90 text-white text-[9px] font-mono font-bold tracking-wider uppercase shadow-sm">
                  AVATAR A
                </span>
                {allCharacters.length > 1 && onSelectCharacter && (
                  <select
                    id="select-compare-avatar-a"
                    value={character.id}
                    onChange={(e) => {
                      const found = allCharacters.find((c) => c.id === e.target.value);
                      if (found) {
                        sound.playClick();
                        onSelectCharacter(found);
                      }
                    }}
                    className="text-[10px] max-w-[110px] sm:max-w-[140px] truncate bg-zinc-900/90 border border-zinc-700 text-zinc-200 rounded px-1.5 py-0.5 focus:outline-none focus:border-blue-500"
                  >
                    {allCharacters.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Avatar A Visual (Interactive 3D Turntable Sync) */}
              <motion.div
                animate={poseAnimation}
                transition={poseTransition}
                className="relative max-w-[90%] max-h-[85%] flex flex-col items-center justify-center pointer-events-none select-none my-auto"
                style={{
                  perspective: 1000,
                  transformStyle: 'preserve-3d',
                  transform: `rotateY(${rotationAngle * 0.35}deg)`,
                }}
              >
                <div className="relative">
                  <div className="absolute -inset-2 rounded-2xl bg-blue-600/20 blur-lg pointer-events-none"></div>
                  <img
                    src={currentImage}
                    alt={character.name}
                    referrerPolicy="no-referrer"
                    className={`relative object-cover rounded-xl shadow-2xl border border-blue-500/50 ${
                      cameraView === 'portrait'
                        ? 'w-[125px] h-[125px] sm:w-[170px] sm:h-[170px]'
                        : 'max-h-[220px] sm:max-h-[260px] w-auto'
                    }`}
                  />
                  <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-zinc-950/95 border border-blue-500/40 text-[9px] text-blue-300 font-bold whitespace-nowrap shadow-md">
                    {character.name}
                  </div>
                </div>
              </motion.div>

              {/* Avatar A Controls */}
              <div className="absolute bottom-2 left-2 right-2 flex items-center justify-center gap-1.5 z-20 pointer-events-auto">
                <button
                  id="btn-voice-avatar-a"
                  onClick={() => handlePlayVoiceFor(character)}
                  title="Escuchar perfil de voz"
                  className={`px-2 py-1 rounded bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700 text-[10px] font-medium flex items-center gap-1 transition-colors ${
                    playingVoiceId === character.id ? 'text-blue-400 border-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]' : 'text-zinc-300'
                  }`}
                >
                  <Volume2 className="w-3 h-3 text-blue-400" />
                  <span className="hidden sm:inline">Voz</span>
                </button>
                <button
                  id="btn-export-avatar-a"
                  onClick={() => {
                    sound.playClick();
                    onOpenExport(character);
                  }}
                  className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white font-bold text-[10px] flex items-center gap-1 shadow-sm transition-all"
                >
                  <Sparkles className="w-3 h-3 fill-white" />
                  <span>Exportar A</span>
                </button>
              </div>
            </div>

            {/* Center VS Visual Divider */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-zinc-950 border border-blue-500/80 text-blue-400 flex items-center justify-center text-[10px] sm:text-[11px] font-black font-mono shadow-[0_0_14px_rgba(59,130,246,0.6)] ring-4 ring-black/80">
                VS
              </div>
            </div>

            {/* Right Slot: Avatar B */}
            <div className="relative flex-1 flex flex-col items-center justify-center p-2 pt-14 pb-12 overflow-hidden group">
              {/* Slot Header: Badge & Selector */}
              <div className="absolute top-12 left-2 right-2 flex items-center justify-between z-20 pointer-events-auto gap-1">
                <span className="px-2 py-0.5 rounded bg-purple-600/90 text-white text-[9px] font-mono font-bold tracking-wider uppercase shadow-sm">
                  AVATAR B
                </span>
                {allCharacters.length > 1 && (
                  <select
                    id="select-compare-avatar-b"
                    value={compareCharacter.id}
                    onChange={(e) => {
                      sound.playClick();
                      setCompareCharId(e.target.value);
                    }}
                    className="text-[10px] max-w-[110px] sm:max-w-[140px] truncate bg-zinc-900/90 border border-zinc-700 text-zinc-200 rounded px-1.5 py-0.5 focus:outline-none focus:border-purple-500"
                  >
                    {allCharacters.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Avatar B Visual (Interactive 3D Turntable Sync) */}
              <motion.div
                animate={poseAnimation}
                transition={poseTransition}
                className="relative max-w-[90%] max-h-[85%] flex flex-col items-center justify-center pointer-events-none select-none my-auto"
                style={{
                  perspective: 1000,
                  transformStyle: 'preserve-3d',
                  transform: `rotateY(${rotationAngle * 0.35}deg)`,
                }}
              >
                <div className="relative">
                  <div className="absolute -inset-2 rounded-2xl bg-purple-600/20 blur-lg pointer-events-none"></div>
                  <img
                    src={compareImage}
                    alt={compareCharacter.name}
                    referrerPolicy="no-referrer"
                    className={`relative object-cover rounded-xl shadow-2xl border border-purple-500/50 ${
                      cameraView === 'portrait'
                        ? 'w-[125px] h-[125px] sm:w-[170px] sm:h-[170px]'
                        : 'max-h-[220px] sm:max-h-[260px] w-auto'
                    }`}
                  />
                  <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-zinc-950/95 border border-purple-500/40 text-[9px] text-purple-300 font-bold whitespace-nowrap shadow-md">
                    {compareCharacter.name}
                  </div>
                </div>
              </motion.div>

              {/* Avatar B Controls */}
              <div className="absolute bottom-2 left-2 right-2 flex items-center justify-center gap-1.5 z-20 pointer-events-auto">
                <button
                  id="btn-voice-avatar-b"
                  onClick={() => handlePlayVoiceFor(compareCharacter)}
                  title="Escuchar perfil de voz"
                  className={`px-2 py-1 rounded bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700 text-[10px] font-medium flex items-center gap-1 transition-colors ${
                    playingVoiceId === compareCharacter.id ? 'text-purple-400 border-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]' : 'text-zinc-300'
                  }`}
                >
                  <Volume2 className="w-3 h-3 text-purple-400" />
                  <span className="hidden sm:inline">Voz</span>
                </button>
                <button
                  id="btn-export-avatar-b"
                  onClick={() => {
                    sound.playClick();
                    onOpenExport(compareCharacter);
                  }}
                  className="px-2.5 py-1 rounded bg-purple-600 hover:bg-purple-500 text-white font-bold text-[10px] flex items-center gap-1 shadow-sm transition-all"
                >
                  <Sparkles className="w-3 h-3 fill-white" />
                  <span>Exportar B</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Single Avatar Subject View */
          <motion.div
            animate={poseAnimation}
            transition={poseTransition}
            className="relative max-w-[85%] max-h-[90%] flex items-center justify-center pointer-events-none select-none z-10"
            style={{
              perspective: 1000,
              transformStyle: 'preserve-3d',
              transform: `rotateY(${rotationAngle * 0.35}deg)`,
            }}
          >
            {cameraView === 'turnaroundSheet' ? (
              <div className="relative rounded-xl overflow-hidden shadow-2xl border border-zinc-700 max-w-full">
                <img
                  src={currentImage}
                  alt={`${character.name} turnaround`}
                  referrerPolicy="no-referrer"
                  className="w-full h-auto max-h-[360px] object-contain rounded-xl"
                />
                <div className="absolute bottom-2 left-2 right-2 flex justify-between items-center text-[10px] px-2.5 py-1 bg-black/80 backdrop-blur-md rounded border border-zinc-800 text-zinc-300">
                  <span className="font-mono text-zinc-400">360° MODEL SHEET</span>
                  <span className="text-blue-400 font-bold uppercase tracking-wider">GENESIS UE5 ENGINE</span>
                </div>
              </div>
            ) : (
              <div className="relative group">
                {/* Subtle electric blue ambient glow */}
                <div className="absolute -inset-4 rounded-3xl bg-gradient-to-t from-blue-600/20 via-purple-600/15 to-transparent blur-xl opacity-75"></div>
                
                <img
                  src={currentImage}
                  alt={character.name}
                  referrerPolicy="no-referrer"
                  className={`relative rounded-2xl object-cover shadow-2xl border border-zinc-700/80 transition-all duration-300 ${
                    cameraView === 'portrait' 
                      ? 'w-[280px] h-[280px] sm:w-[320px] sm:h-[320px] rounded-2xl' 
                      : 'max-h-[350px] sm:max-h-[380px] w-auto rounded-xl'
                  }`}
                />

                {/* 360 Angle Watermark / Turn Indicator */}
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-zinc-900/90 backdrop-blur-md border border-zinc-700 text-[10px] text-blue-400 font-mono tracking-widest shadow-lg">
                  ROTATION {Math.round(rotationAngle % 360)}°
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Drag Hint Overlay */}
        <div className="absolute bottom-2.5 left-3 text-[10px] text-zinc-400 pointer-events-none flex items-center gap-1.5 bg-zinc-950/70 border border-zinc-800 px-2 py-0.5 rounded-md backdrop-blur-sm">
          <RotateCcw className="w-3 h-3 text-blue-400 animate-spin" style={{ animationDuration: '8s' }} />
          <span>{isCompareMode ? 'Girar 360° en paralelo' : 'Arrastra para girar 360°'}</span>
        </div>

        {/* Quick Voice Comms Button (Shown in single view) */}
        {!isCompareMode && (
          <div className="absolute bottom-2.5 right-3 pointer-events-auto">
            <button
              id="btn-stage-play-voice"
              onClick={handlePlayVoice}
              className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-md border backdrop-blur-md transition-all active:scale-95 ${
                isPlayingVoice
                  ? 'bg-blue-600 text-white border-blue-400 shadow-[0_0_12px_rgba(59,130,246,0.6)]'
                  : 'bg-zinc-900/80 text-zinc-300 border-zinc-700 hover:border-zinc-500'
              }`}
            >
              <Radio className={`w-3.5 h-3.5 ${isPlayingVoice ? 'animate-pulse text-white' : 'text-blue-400'}`} />
              <span>{isPlayingVoice ? 'Transmitiendo...' : 'Voz / Audio'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Lighting Control Tray (if open) */}
      <AnimatePresence>
        {showLightingTool && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-4 py-2.5 bg-zinc-950 border-t border-zinc-800 flex flex-wrap items-center justify-between gap-2 text-xs"
          >
            <span className="text-zinc-400 flex items-center gap-1.5 font-medium">
              <Sun className="w-3.5 h-3.5 text-blue-400" />
              Luz de Borde (Rim Light):
            </span>
            <div className="flex items-center gap-2">
              {[
                { label: 'Izquierda', pos: { x: 20, y: 30 } },
                { label: 'Derecha', pos: { x: 80, y: 30 } },
                { label: 'Cénit', pos: { x: 50, y: 15 } },
                { label: 'Contraluz', pos: { x: 50, y: 85 } },
              ].map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => setRimLightPosition(preset.pos)}
                  className="px-2.5 py-1 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/60 text-zinc-300 text-[11px] transition-colors"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Camera Viewport Switcher Tabs */}
      <div className="flex items-center justify-around px-2 py-2 bg-black/80 border-t border-zinc-800 select-none overflow-x-auto no-scrollbar">
        {[
          { id: 'portrait' as CameraView, label: 'Rostro (1:1)', icon: Eye },
          { id: 'fullBody' as CameraView, label: 'Cuerpo Entero', icon: Camera },
          { id: 'turnaroundSheet' as CameraView, label: 'Hoja 3D (Artlist)', icon: Layers },
        ].map((view) => {
          const Icon = view.icon;
          const isActive = cameraView === view.id;
          return (
            <button
              key={view.id}
              id={`btn-camera-view-${view.id}`}
              onClick={() => {
                sound.playClick();
                onChangeCameraView(view.id);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                isActive
                  ? 'bg-zinc-900 text-white font-semibold border border-zinc-700 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/50'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-blue-400' : 'text-zinc-500'}`} />
              <span>{view.label}</span>
            </button>
          );
        })}
      </div>

      {/* Character Profile / Comparative Lore Drawer */}
      <AnimatePresence>
        {quickSaveMessage && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="mx-4 sm:mx-6 my-2 p-2.5 rounded-xl bg-amber-400/15 border border-amber-400/40 text-amber-300 text-xs flex items-center justify-center gap-2 font-bold shadow-lg"
          >
            <CheckCircle2 className="w-4 h-4 text-amber-400" />
            <span>{quickSaveMessage}</span>
          </motion.div>
        )}

        {showInfoSheet && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="p-4 bg-gradient-to-b from-zinc-900/90 to-zinc-950 border-t border-zinc-800 space-y-3"
          >
            {isCompareMode ? (
              /* COMPARISON MODE DETAILED SHEET */
              <div className="space-y-3">
                {/* Header & Swap Button */}
                <div className="flex items-center justify-between gap-2 pb-2 border-b border-zinc-800">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold uppercase tracking-wider text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                        COMPARATIVA DE DETALLES
                      </span>
                      <span className="text-[11px] text-zinc-400">UE5.4 & Lumen</span>
                    </div>
                    <p className="text-xs text-zinc-300 font-medium mt-0.5">
                      Inspecciona las diferencias anatómicas, acústicas y de render antes de exportar
                    </p>
                  </div>

                  {allCharacters.length > 1 && onSelectCharacter && (
                    <button
                      id="btn-swap-comparison"
                      onClick={handleSwapCharacters}
                      title="Intercambiar Avatar A y Avatar B"
                      className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 font-medium transition-colors shrink-0"
                    >
                      <ArrowLeftRight className="w-3.5 h-3.5 text-blue-400" />
                      <span className="hidden sm:inline">Intercambiar</span>
                    </button>
                  )}
                </div>

                {/* Side-by-side Specifications Matrix */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {/* Left Column Specs (Avatar A) */}
                  <div className="p-3 rounded-xl bg-blue-950/20 border border-blue-500/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-blue-400 text-sm">{character.name}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono">
                        {character.age}
                      </span>
                    </div>

                    <div className="space-y-1.5 text-[11px]">
                      <div>
                        <span className="text-zinc-500 block text-[10px] uppercase font-mono">Rol / Arquetipo</span>
                        <span className="text-zinc-200 font-medium">{character.role}</span>
                      </div>
                      <div>
                        <span className="text-zinc-500 block text-[10px] uppercase font-mono">Complexión (Build)</span>
                        <span className="text-zinc-300">{character.build}</span>
                      </div>
                      <div>
                        <span className="text-zinc-500 block text-[10px] uppercase font-mono">Humor / Actitud</span>
                        <span className="text-zinc-300">{character.mood}</span>
                      </div>
                      <div>
                        <span className="text-zinc-500 block text-[10px] uppercase font-mono">Iluminación</span>
                        <span className="text-zinc-300">{character.lightingPreset}</span>
                      </div>
                      <div>
                        <span className="text-zinc-500 block text-[10px] uppercase font-mono">Audio / Voz</span>
                        <span className="text-zinc-300">{character.voice.pitch} ({character.voice.roughness})</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5 mt-2">
                      <button
                        id="btn-compare-quicksave-left"
                        onClick={() => handleQuickSave(character, 'png')}
                        disabled={isQuickSaving}
                        className="py-1.5 px-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs flex items-center justify-center gap-1 shadow-sm transition-all disabled:opacity-50"
                      >
                        <Download className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>Guardar HD</span>
                      </button>
                      <button
                        id="btn-compare-export-left"
                        onClick={() => {
                          sound.playClick();
                          onOpenExport(character);
                        }}
                        className="py-1.5 px-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-sm transition-all"
                      >
                        <Sparkles className="w-3.5 h-3.5 fill-white" />
                        <span>Exportar RRSS</span>
                      </button>
                    </div>
                  </div>

                  {/* Right Column Specs (Avatar B) */}
                  <div className="p-3 rounded-xl bg-purple-950/20 border border-purple-500/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-purple-400 text-sm">{compareCharacter.name}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono">
                        {compareCharacter.age}
                      </span>
                    </div>

                    <div className="space-y-1.5 text-[11px]">
                      <div>
                        <span className="text-zinc-500 block text-[10px] uppercase font-mono">Rol / Arquetipo</span>
                        <span className="text-zinc-200 font-medium">{compareCharacter.role}</span>
                      </div>
                      <div>
                        <span className="text-zinc-500 block text-[10px] uppercase font-mono">Complexión (Build)</span>
                        <span className="text-zinc-300">{compareCharacter.build}</span>
                      </div>
                      <div>
                        <span className="text-zinc-500 block text-[10px] uppercase font-mono">Humor / Actitud</span>
                        <span className="text-zinc-300">{compareCharacter.mood}</span>
                      </div>
                      <div>
                        <span className="text-zinc-500 block text-[10px] uppercase font-mono">Iluminación</span>
                        <span className="text-zinc-300">{compareCharacter.lightingPreset}</span>
                      </div>
                      <div>
                        <span className="text-zinc-500 block text-[10px] uppercase font-mono">Audio / Voz</span>
                        <span className="text-zinc-300">{compareCharacter.voice.pitch} ({compareCharacter.voice.roughness})</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5 mt-2">
                      <button
                        id="btn-compare-quicksave-right"
                        onClick={() => handleQuickSave(compareCharacter, 'png')}
                        disabled={isQuickSaving}
                        className="py-1.5 px-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs flex items-center justify-center gap-1 shadow-sm transition-all disabled:opacity-50"
                      >
                        <Download className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>Guardar HD</span>
                      </button>
                      <button
                        id="btn-compare-export-right"
                        onClick={() => {
                          sound.playClick();
                          onOpenExport(compareCharacter);
                        }}
                        className="py-1.5 px-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-sm transition-all"
                      >
                        <Sparkles className="w-3.5 h-3.5 fill-white" />
                        <span>Exportar RRSS</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Lore Comparison Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                  <div className="p-2.5 rounded-lg bg-black/40 border border-zinc-800/80">
                    <span className="text-[10px] font-mono text-blue-400 font-bold block mb-1">
                      HISTORIA // {character.name}
                    </span>
                    <p className="text-zinc-300 text-[11px] leading-relaxed line-clamp-3">
                      {character.lore}
                    </p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-black/40 border border-zinc-800/80">
                    <span className="text-[10px] font-mono text-purple-400 font-bold block mb-1">
                      HISTORIA // {compareCharacter.name}
                    </span>
                    <p className="text-zinc-300 text-[11px] leading-relaxed line-clamp-3">
                      {compareCharacter.lore}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              /* REGULAR SINGLE CHARACTER SPEC SHEET */
              <>
                {/* Header: Name, Role, Archetype */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white font-display">
                        {character.name}
                      </h2>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/30">
                        {character.age}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 font-medium">{character.role}</p>
                  </div>

                  {/* Action Buttons: Quick Save HD & Export to Social */}
                  <div className="flex items-center gap-2">
                    <button
                      id="btn-stage-quicksave-hd"
                      onClick={() => handleQuickSave(character, 'png')}
                      disabled={isQuickSaving}
                      className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 uppercase tracking-tighter active:scale-95 transition-all shadow-sm disabled:opacity-50"
                      title="Descargar avatar en alta resolución (2048px PNG)"
                    >
                      <Download className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Guardar HD</span>
                    </button>

                    <button
                      id="btn-stage-export-social"
                      onClick={() => {
                        sound.playClick();
                        onOpenExport(character);
                      }}
                      className="flex items-center gap-1.5 text-xs font-bold px-3.5 py-1.5 rounded-xl bg-white text-black uppercase tracking-tighter hover:bg-zinc-200 active:scale-95 transition-all shadow-sm"
                    >
                      <Sparkles className="w-3.5 h-3.5 fill-black" />
                      <span>Exportar RRSS</span>
                    </button>
                  </div>
                </div>

                {/* Lore & Physical Presence Description */}
                <p className="text-xs text-zinc-300 leading-relaxed line-clamp-2 sm:line-clamp-3">
                  {character.lore}
                </p>

                {/* Voice & Acoustic Profile Bar */}
                <div className="p-2.5 rounded-xl bg-black/60 border border-zinc-800/80 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-zinc-400 flex items-center gap-1.5">
                      <Volume2 className="w-3.5 h-3.5 text-blue-400" />
                      Perfil de Audio: <span className="text-zinc-200 font-medium">{character.voice.pitch}</span>
                    </span>
                    <span className="text-[10px] text-zinc-500 font-mono uppercase">{character.voice.roughness}</span>
                  </div>

                  {/* Waveform Bars */}
                  <div className="flex items-center gap-1 h-6 px-1">
                    {character.voice.frequencyProfile.map((freq, idx) => (
                      <motion.div
                        key={idx}
                        animate={
                          isPlayingVoice
                            ? {
                                height: [`${freq * 0.2}%`, `${Math.min(100, freq * 1.3)}%`, `${freq * 0.4}%`],
                              }
                            : { height: `${freq}%` }
                        }
                        transition={{
                          duration: 0.4 + (idx % 3) * 0.1,
                          repeat: isPlayingVoice ? Infinity : 0,
                          repeatType: 'reverse',
                        }}
                        className={`flex-1 rounded-full transition-all ${
                          isPlayingVoice ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.7)]' : 'bg-zinc-800'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Tech Tags: PS5 Specs */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[10px] text-zinc-500 font-mono">
                  <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">
                    {character.renderEngine}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">
                    {character.lightingPreset}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">
                    {character.build}
                  </span>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
