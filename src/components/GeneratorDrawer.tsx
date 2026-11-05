import React, { useState } from 'react';
import { 
  Sparkles, 
  X, 
  Wand2, 
  SlidersHorizontal, 
  Loader2, 
  Check, 
  Download,
  FileImage,
  Share2,
  ChevronDown,
  ArrowRight,
  CheckCircle2,
  Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AvatarCharacter } from '../types';
import { sound } from '../utils/audioSynthesizer';
import { renderHighResCanvas, downloadCanvasAsFile, ExportImageFormat } from '../utils/exportEngine';

interface GeneratorDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onAvatarCreated: (avatar: AvatarCharacter) => void;
  onOpenExport?: (avatar: AvatarCharacter) => void;
}

export const GeneratorDrawer: React.FC<GeneratorDrawerProps> = ({
  isOpen,
  onClose,
  onAvatarCreated,
  onOpenExport,
}) => {
  const [prompt, setPrompt] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [archetype, setArchetype] = useState<string>('wwii_pilot');
  const [age, setAge] = useState<string>('30 años');
  const [mood, setMood] = useState<string>('Heroico y decidido');
  const [lighting, setLighting] = useState<string>('ARRI Signature Prime');
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '9:16' | '16:9'>('1:1');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isEnhancing, setIsEnhancing] = useState<boolean>(false);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Success & Direct Save State
  const [generatedAvatar, setGeneratedAvatar] = useState<AvatarCharacter | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  const quickPresets = [
    {
      id: 'wwii_pilot',
      label: 'Piloto Aviador WWII (Frank)',
      prompt: 'Piloto de combate de los años 40 con cazadora de cuero gastada, gafas de aviador y porte atlético',
      name: 'Frank Miller',
      mood: 'Valiente y templado',
    },
    {
      id: 'cyberpunk',
      label: 'Mercenaria Cyberpunk PS5',
      prompt: 'Guerrera cibernética táctica con implantes de cian neón, armadura de nanotubos y corte de pelo asimétrico',
      name: 'Valkyrie-X',
      mood: 'Implacable y analítica',
    },
    {
      id: 'souls_knight',
      label: 'Caballero Souls Épico',
      prompt: 'Paladín sombrío con armadura forjada en plata oscura, cicatrices de combate y capa desgarrada',
      name: 'Sir Roland',
      mood: 'Estoico y honorable',
    },
    {
      id: 'scifi_specops',
      label: 'Soldado Sci-Fi ODST',
      prompt: 'Operativo táctico espacial con traje de combate exoesqueleto y visor holográfico parcial',
      name: 'Marcus 117',
      mood: 'Alerta táctica máxima',
    },
    {
      id: 'anime_metahuman',
      label: 'Samurai Neo-Tokyo',
      prompt: 'Ronin futurista con katana de plasma, máscara oni tecnológica y gabardina táctica impermeable',
      name: 'Ren Hayabusa',
      mood: 'Silencioso y letal',
    },
  ];

  const handleSelectPreset = (p: typeof quickPresets[0]) => {
    sound.playClick();
    setArchetype(p.id);
    setPrompt(p.prompt);
    if (!name) setName(p.name);
    setMood(p.mood);
  };

  const handleEnhancePrompt = async () => {
    if (!prompt.trim()) return;
    setIsEnhancing(true);
    sound.playClick();
    try {
      const res = await fetch('/api/avatar/enhance-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, archetype, mood, lighting }),
      });
      const data = await res.json();
      if (data.enhancedPrompt) {
        setPrompt(data.enhancedPrompt);
        sound.playSuccess();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() && !archetype) return;

    setIsGenerating(true);
    setErrorMessage(null);
    setGeneratedAvatar(null);
    sound.playClick();

    try {
      const res = await fetch('/api/avatar/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt || quickPresets[0].prompt,
          name: name.trim() || undefined,
          archetype,
          age,
          mood,
          lighting,
          aspectRatio,
        }),
      });

      const data = await res.json();
      if (data.success && data.avatar) {
        sound.playSuccess();
        onAvatarCreated(data.avatar);
        setGeneratedAvatar(data.avatar);
      } else {
        setErrorMessage(data.error || 'No se pudo generar el avatar. Inténtalo de nuevo.');
      }
    } catch (err: any) {
      console.error('Generation failure:', err);
      setErrorMessage('Error de red al conectar con el motor de IA.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Direct 1-Click High-Res Save from Drawer
  const handleQuickSaveGenerated = async (ext: ExportImageFormat) => {
    if (!generatedAvatar) return;
    setIsSaving(true);
    sound.playClick();

    try {
      const canvas = await renderHighResCanvas(generatedAvatar, {
        format: 'instagram_avatar',
        imageFormat: ext,
        quality: '2k',
        includeGamerBadge: true,
        includeWatermark: false,
        includeSpecSheet: false,
        jpegQuality: 0.95,
      });

      const cleanName = generatedAvatar.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
      const filename = `${cleanName}_avatar_2k.${ext === 'jpeg' ? 'jpg' : ext}`;

      await downloadCanvasAsFile(canvas, filename, ext, 0.95);
      sound.playSuccess();
      setSaveSuccessMessage(`¡Guardado en alta resolución (${ext.toUpperCase()} 2048px)!`);
      setTimeout(() => setSaveSuccessMessage(null), 4000);
    } catch (e) {
      console.error('Save failed:', e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetForNew = () => {
    sound.playClick();
    setGeneratedAvatar(null);
    setPrompt('');
    setName('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 backdrop-blur-sm sm:items-center p-0 sm:p-4">
      {/* Click outside backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Drawer / Modal Container */}
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 26, stiffness: 280 }}
        className="relative w-full max-w-lg bg-[#0e111a] rounded-t-3xl sm:rounded-3xl border border-white/15 shadow-2xl z-10 max-h-[92vh] flex flex-col overflow-hidden"
      >
        {/* Android drag pill */}
        <div className="flex justify-center pt-2.5 pb-1 sm:hidden">
          <div className="w-12 h-1.5 rounded-full bg-white/20" />
        </div>

        {/* Drawer Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white font-display">
                {generatedAvatar ? '¡Avatar Creado con Éxito!' : 'Generador de Avatares PS5'}
              </h2>
              <p className="text-[11px] text-slate-400">
                {generatedAvatar
                  ? 'Guarda tu render en alta resolución o personalízalo para redes'
                  : 'Crea personajes 3D cinematográficos con IA'}
              </p>
            </div>
          </div>

          <button
            id="btn-close-generator-drawer"
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* SUCCESS VIEW: Direct High-Res Export Interface */}
        {generatedAvatar ? (
          <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
            {/* Avatar Preview Spotlight */}
            <div className="p-4 rounded-2xl bg-black/60 border border-amber-400/30 shadow-xl flex flex-col items-center text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-amber-400/10 via-transparent to-transparent pointer-events-none" />

              <div className="relative w-36 h-36 rounded-2xl overflow-hidden border-2 border-amber-400 shadow-2xl mb-3">
                <img
                  src={generatedAvatar.images.portrait}
                  alt={generatedAvatar.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/80 text-[9px] font-mono text-amber-400 border border-amber-400/30">
                  UE5.4
                </div>
              </div>

              <h3 className="text-base font-bold text-white font-display">{generatedAvatar.name}</h3>
              <p className="text-xs text-sky-400 font-medium">{generatedAvatar.role}</p>
              <p className="text-[11px] text-slate-400 mt-1 max-w-sm line-clamp-2">{generatedAvatar.lore}</p>

              <div className="flex flex-wrap items-center justify-center gap-1.5 mt-2 text-[10px] font-mono">
                <span className="px-2 py-0.5 rounded bg-white/10 text-slate-300">
                  {generatedAvatar.age}
                </span>
                <span className="px-2 py-0.5 rounded bg-amber-400/10 text-amber-400 border border-amber-400/20">
                  Ultra HD 2048px
                </span>
                <span className="px-2 py-0.5 rounded bg-white/10 text-slate-300">
                  {generatedAvatar.mood}
                </span>
              </div>
            </div>

            {/* Direct High-Resolution Save Notification */}
            {saveSuccessMessage && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 text-center text-xs flex items-center justify-center gap-2 font-medium"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{saveSuccessMessage}</span>
              </motion.div>
            )}

            {/* Primary Direct Save Buttons */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Descarga Directa en Alta Resolución:
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {/* Save PNG 2K */}
                <button
                  id="btn-drawer-quick-save-png"
                  onClick={() => handleQuickSaveGenerated('png')}
                  disabled={isSaving}
                  className="py-3 px-4 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-amber-400/25 disabled:opacity-60"
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4 stroke-[2.5]" />
                  )}
                  <span>Guardar HD en PNG (2K)</span>
                </button>

                {/* Save JPG for Instagram */}
                <button
                  id="btn-drawer-quick-save-jpg"
                  onClick={() => handleQuickSaveGenerated('jpeg')}
                  disabled={isSaving}
                  className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-white/15 flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-60"
                >
                  <FileImage className="w-4 h-4 text-amber-400" />
                  <span>Guardar JPG (Instagram Feed)</span>
                </button>
              </div>
            </div>

            {/* Additional Secondary Actions */}
            <div className="pt-2 border-t border-white/10 space-y-2">
              <button
                id="btn-drawer-open-full-export"
                onClick={() => {
                  sound.playClick();
                  onClose();
                  if (onOpenExport) {
                    onOpenExport(generatedAvatar);
                  }
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                <Share2 className="w-4 h-4 text-sky-400" />
                <span>Más Opciones: TikTok 9:16, Twitch 16:9 y 4K</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  id="btn-drawer-go-stage"
                  onClick={() => {
                    sound.playClick();
                    onClose();
                  }}
                  className="py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5 text-amber-400" />
                  <span>Ver en Escenario 3D</span>
                </button>

                <button
                  id="btn-drawer-create-another"
                  onClick={handleResetForNew}
                  className="py-2.5 px-3 rounded-xl bg-slate-900 border border-white/10 hover:bg-slate-800 text-slate-300 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Crear Otro Avatar</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* CREATION FORM BODY */
          <form onSubmit={handleGenerate} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
            {/* Quick Style Inspiration Pills */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Elige un estilo o arquetipo base:
              </label>
              <div className="flex flex-wrap gap-1.5">
                {quickPresets.map((p) => {
                  const isSelected = archetype === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleSelectPreset(p)}
                      className={`px-2.5 py-1 rounded-lg text-xs transition-all ${
                        isSelected
                          ? 'bg-amber-400 text-slate-950 font-bold shadow-md shadow-amber-400/20'
                          : 'bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10'
                      }`}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Description Input (Matching Artlist screenshot) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="input-avatar-prompt" className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                  Describe el avatar que deseas crear:
                </label>
                <button
                  type="button"
                  id="btn-enhance-prompt"
                  onClick={handleEnhancePrompt}
                  disabled={isEnhancing || !prompt.trim()}
                  className="flex items-center gap-1 text-[11px] font-semibold text-amber-400 hover:text-amber-300 disabled:opacity-40 transition-opacity"
                >
                  {isEnhancing ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>Mejorando...</span>
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-3 h-3" />
                      <span>Mejorar con IA</span>
                    </>
                  )}
                </button>
              </div>

              <div className="relative">
                <textarea
                  id="input-avatar-prompt"
                  rows={3}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Ejemplo: Piloto as en sus 30s con cazadora de cuero gastada, gafas de aviador y mandíbula firme estilo PS5..."
                  className="w-full rounded-xl bg-slate-950/80 border border-white/15 p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors resize-none"
                />
              </div>
            </div>

            {/* Character Name & Age Row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="input-avatar-name" className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Nombre del personaje:
                </label>
                <input
                  id="input-avatar-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Frank Vance"
                  className="w-full rounded-xl bg-slate-950/80 border border-white/15 px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>
              <div>
                <label htmlFor="input-avatar-age" className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Edad aparente:
                </label>
                <input
                  id="input-avatar-age"
                  type="text"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="Ej: 32 años"
                  className="w-full rounded-xl bg-slate-950/80 border border-white/15 px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            {/* Aspect Ratio Selector (From Artlist screenshot: Image Ref / 1:1 / 9:16) */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Proporción para Redes Sociales:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: '1:1', label: '1:1 Avatar', sub: 'Instagram / Perfil' },
                  { id: '9:16', label: '9:16 Story', sub: 'TikTok / Reels' },
                  { id: '16:9', label: '16:9 Banner', sub: 'YouTube / Twitch' },
                ].map((ratio) => {
                  const isSelected = aspectRatio === ratio.id;
                  return (
                    <button
                      key={ratio.id}
                      type="button"
                      onClick={() => {
                        sound.playClick();
                        setAspectRatio(ratio.id as any);
                      }}
                      className={`p-2 rounded-xl text-center border transition-all ${
                        isSelected
                          ? 'bg-amber-400/15 border-amber-400 text-white'
                          : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                      }`}
                    >
                      <div className="font-bold text-xs">{ratio.label}</div>
                      <div className="text-[9px] text-slate-400">{ratio.sub}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Toggle Advanced Cinematic Settings */}
            <div>
              <button
                type="button"
                id="btn-toggle-advanced"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center justify-between w-full text-left text-slate-400 hover:text-white py-1 transition-colors"
              >
                <span className="flex items-center gap-1 font-semibold text-[11px] uppercase tracking-wider">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
                  Parámetros de Iluminación y Humor (Lumen PS5)
                </span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
              </button>

              {showAdvanced && (
                <div className="p-3 mt-2 rounded-xl bg-black/40 border border-white/5 space-y-3">
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Estado de Ánimo (Mood):</label>
                    <select
                      value={mood}
                      onChange={(e) => setMood(e.target.value)}
                      className="w-full rounded-lg bg-slate-900 border border-white/15 px-2.5 py-1.5 text-xs text-white"
                    >
                      <option value="Heroico y decidido">Heroico y decidido</option>
                      <option value="Implacable y analítico">Implacable y analítico (Cyberpunk)</option>
                      <option value="Estoico, melancólico y honorable">Estoico y solemne (Dark Fantasy)</option>
                      <option value="Feroz en combate">Feroz en combate</option>
                      <option value="Enigmático y sombrío">Enigmático y sombrío</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Preset de Iluminación de Estudio:</label>
                    <select
                      value={lighting}
                      onChange={(e) => setLighting(e.target.value)}
                      className="w-full rounded-lg bg-slate-900 border border-white/15 px-2.5 py-1.5 text-xs text-white"
                    >
                      <option value="ARRI Signature Prime">ARRI Signature Prime (Cinemática cálida)</option>
                      <option value="Unreal Engine 5 Lumen">Unreal Engine 5.4 Lumen (Trazado de Rayos)</option>
                      <option value="Cyberpunk Neon Volumétrico">Cyberpunk Neon (Cian y Magenta)</option>
                      <option value="Noir Sombrío con Niebla">Noir Sombrío con Niebla de Batalla</option>
                      <option value="Luz Solar Crepuscular 8K">Golden Hour Crepuscular 8K</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Error display if any */}
            {errorMessage && (
              <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[11px]">
                {errorMessage}
              </div>
            )}

            {/* Action Button */}
            <div className="pt-2">
              <button
                id="btn-submit-generate-avatar"
                type="submit"
                disabled={isGenerating}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-400 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.98] transition-all shadow-lg shadow-amber-400/25 disabled:opacity-60"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Renderizando Avatar PS5 con IA...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 fill-slate-950" />
                    <span>Generar Avatar PS5 Gratis</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
};
