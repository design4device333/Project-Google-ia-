import React, { useState } from 'react';
import { 
  Sparkles, 
  Users, 
  Radio, 
  Check, 
  Plus, 
  Shield, 
  Swords, 
  Zap, 
  Compass,
  Download,
  Share2,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { AvatarCharacter } from '../types';
import { sound } from '../utils/audioSynthesizer';
import { renderHighResCanvas, downloadCanvasAsFile } from '../utils/exportEngine';

interface CastGalleryProps {
  characters: AvatarCharacter[];
  selectedCharacterId: string;
  onSelectCharacter: (char: AvatarCharacter) => void;
  onOpenCreate: () => void;
  onOpenExport?: (char: AvatarCharacter) => void;
}

export const CastGallery: React.FC<CastGalleryProps> = ({
  characters,
  selectedCharacterId,
  onSelectCharacter,
  onOpenCreate,
  onOpenExport,
}) => {
  const [filterGenre, setFilterGenre] = useState<string>('all');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [quickSavedName, setQuickSavedName] = useState<string | null>(null);

  const genres = [
    { id: 'all', label: 'Todos', icon: Users },
    { id: 'wwii', label: 'Militar / WWII', icon: Shield },
    { id: 'cyber', label: 'Cyberpunk', icon: Zap },
    { id: 'fantasy', label: 'Souls / Épico', icon: Swords },
    { id: 'scifi', label: 'Sci-Fi Operativo', icon: Compass },
  ];

  const filtered = characters.filter((c) => {
    if (filterGenre === 'all') return true;
    if (filterGenre === 'wwii') return c.archetype.toLowerCase().includes('wwii') || c.archetype.toLowerCase().includes('piloto');
    if (filterGenre === 'cyber') return c.archetype.toLowerCase().includes('cyber');
    if (filterGenre === 'fantasy') return c.archetype.toLowerCase().includes('fantas') || c.archetype.toLowerCase().includes('knight');
    if (filterGenre === 'scifi') return c.archetype.toLowerCase().includes('scifi') || c.archetype.toLowerCase().includes('operat');
    return true;
  });

  const handleQuickDownload = async (e: React.MouseEvent, char: AvatarCharacter) => {
    e.stopPropagation();
    sound.playClick();
    setDownloadingId(char.id);

    try {
      const canvas = await renderHighResCanvas(char, {
        format: 'instagram_avatar',
        imageFormat: 'png',
        quality: '2k',
        includeGamerBadge: true,
        includeWatermark: false,
        includeSpecSheet: false,
        jpegQuality: 0.95,
      });

      const cleanName = char.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
      await downloadCanvasAsFile(canvas, `${cleanName}_avatar_2k.png`, 'png');
      sound.playSuccess();
      setQuickSavedName(char.name);
      setTimeout(() => setQuickSavedName(null), 3000);
    } catch (err) {
      console.error('Quick download failed:', err);
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <section className="space-y-4">
      {/* Quick feedback banner */}
      {quickSavedName && (
        <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs flex items-center justify-center gap-2 font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>¡{quickSavedName} guardado en alta resolución (2K PNG)!</span>
        </div>
      )}

      {/* Header with Title & Action */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-2 font-display">
            <span>Elenco de Personajes (Cast)</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-slate-300 font-mono">
              {characters.length}
            </span>
          </h2>
          <p className="text-xs text-slate-400">
            Personajes 3D listos para animación, exportación en alta resolución y redes sociales
          </p>
        </div>

        <button
          id="btn-cast-new-character"
          onClick={() => {
            sound.playClick();
            onOpenCreate();
          }}
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-amber-400 text-slate-950 hover:bg-amber-300 active:scale-95 transition-all shadow-md shadow-amber-400/20"
        >
          <Plus className="w-4 h-4" />
          <span>Crear IA</span>
        </button>
      </div>

      {/* Genre Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
        {genres.map((g) => {
          const Icon = g.icon;
          const isActive = filterGenre === g.id;
          return (
            <button
              key={g.id}
              onClick={() => {
                sound.playClick();
                setFilterGenre(g.id);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-amber-400 text-slate-950 font-semibold shadow-sm'
                  : 'bg-slate-900/90 text-slate-300 border border-white/10 hover:bg-white/5'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{g.label}</span>
            </button>
          );
        })}
      </div>

      {/* Characters Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3">
        {filtered.map((char) => {
          const isSelected = char.id === selectedCharacterId;
          const isDownloading = downloadingId === char.id;

          return (
            <div
              key={char.id}
              id={`card-cast-avatar-${char.id}`}
              onClick={() => {
                sound.playClick();
                onSelectCharacter(char);
              }}
              className={`group relative rounded-xl overflow-hidden cursor-pointer border transition-all duration-300 select-none flex flex-col justify-between ${
                isSelected
                  ? 'border-amber-400 ring-2 ring-amber-400/30 shadow-xl shadow-amber-400/15 bg-slate-900'
                  : 'border-white/10 bg-slate-950/80 hover:border-white/25 hover:bg-slate-900/90'
              }`}
            >
              {/* Thumbnail Image */}
              <div className="relative aspect-square w-full overflow-hidden bg-slate-900">
                <img
                  src={char.images.portrait}
                  alt={char.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />

                {/* Selected Checkmark Badge */}
                {isSelected && (
                  <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center shadow-lg">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                )}

                {/* Quick Save HD Button on Card Hover / Touch */}
                <button
                  id={`btn-card-quicksave-${char.id}`}
                  onClick={(e) => handleQuickDownload(e, char)}
                  disabled={isDownloading}
                  title="Descargar avatar en alta resolución (2K PNG)"
                  className="absolute top-2 left-2 p-1.5 rounded-lg bg-black/70 hover:bg-amber-400 hover:text-slate-950 text-white backdrop-blur-md border border-white/20 transition-all opacity-90 group-hover:opacity-100 shadow-md"
                >
                  {isDownloading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                  ) : (
                    <Download className="w-3.5 h-3.5" />
                  )}
                </button>

                {/* Age Badge */}
                <div className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-md text-[9px] text-slate-300 font-medium">
                  {char.age}
                </div>

                {/* Turnaround Indicator */}
                <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-md text-[9px] text-amber-400 font-mono">
                  3D PS5
                </div>
              </div>

              {/* Card Meta Content */}
              <div className="p-2.5 space-y-1">
                <h3 className="font-bold text-xs sm:text-sm text-white truncate font-display">
                  {char.name}
                </h3>
                <p className="text-[11px] text-slate-400 truncate">{char.role}</p>

                <div className="pt-1.5 flex items-center justify-between text-[10px] text-slate-400 border-t border-white/5">
                  <span className="truncate max-w-[85px]">{char.mood}</span>

                  <div className="flex items-center gap-1">
                    {onOpenExport && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          sound.playClick();
                          onSelectCharacter(char);
                          onOpenExport(char);
                        }}
                        title="Exportar para redes sociales"
                        className="p-1 rounded text-slate-400 hover:text-amber-400 hover:bg-white/10 transition-colors"
                      >
                        <Share2 className="w-3 h-3" />
                      </button>
                    )}
                    <Radio className="w-3 h-3 text-sky-400" />
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Quick New Character Creation Card */}
        <div
          id="btn-cast-create-card"
          onClick={() => {
            sound.playClick();
            onOpenCreate();
          }}
          className="rounded-xl border border-dashed border-white/20 bg-white/[0.02] hover:bg-white/[0.05] hover:border-amber-400/50 p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-all group min-h-[160px]"
        >
          <div className="w-10 h-10 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
            <Sparkles className="w-5 h-5" />
          </div>
          <span className="text-xs font-semibold text-white">Generar con IA</span>
          <span className="text-[10px] text-slate-400 mt-0.5">Crear nuevo avatar PS5</span>
        </div>
      </div>
    </section>
  );
};
