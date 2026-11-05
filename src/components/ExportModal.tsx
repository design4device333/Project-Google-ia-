import React, { useState } from 'react';
import { 
  Download, 
  Share2, 
  Copy, 
  Check, 
  X, 
  Video, 
  Instagram, 
  Sparkles, 
  Smartphone, 
  Tv, 
  Layers,
  Loader2,
  FileImage,
  Sliders,
  CheckCircle2
} from 'lucide-react';
import { motion } from 'motion/react';
import { AvatarCharacter, ExportFormat } from '../types';
import { sound } from '../utils/audioSynthesizer';
import { 
  renderHighResCanvas, 
  downloadCanvasAsFile, 
  getResolutionDimensions,
  ResolutionQuality,
  ExportImageFormat
} from '../utils/exportEngine';

interface ExportModalProps {
  character: AvatarCharacter;
  isOpen: boolean;
  onClose: () => void;
  defaultFormat?: ExportFormat;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  character,
  isOpen,
  onClose,
  defaultFormat = 'instagram_avatar',
}) => {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>(defaultFormat);
  const [imageFormat, setImageFormat] = useState<ExportImageFormat>('png');
  const [quality, setQuality] = useState<ResolutionQuality>('2k');
  const [includeGamerBadge, setIncludeGamerBadge] = useState<boolean>(true);
  const [includeWatermark, setIncludeWatermark] = useState<boolean>(false);
  const [includeSpecSheet, setIncludeSpecSheet] = useState<boolean>(true);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [isRecordingVideo, setIsRecordingVideo] = useState<boolean>(false);
  const [copySuccess, setCopySuccess] = useState<boolean>(false);
  const [shareSuccess, setShareSuccess] = useState<boolean>(false);
  const [downloadSuccessMessage, setDownloadSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentDims = getResolutionDimensions(selectedFormat, quality);

  const socialFormats = [
    {
      id: 'instagram_avatar' as ExportFormat,
      title: 'Avatar Perfil (1:1)',
      res: '1080 × 1080 px',
      desc: 'Instagram, WhatsApp, Discord, PSN Network',
      icon: Instagram,
      recommendedQuality: '2k' as ResolutionQuality,
    },
    {
      id: 'tiktok_story' as ExportFormat,
      title: 'Historia / Reel (9:16)',
      res: '1080 × 1920 px',
      desc: 'TikTok, Instagram Stories, Fondo Pantalla',
      icon: Smartphone,
      recommendedQuality: '2k' as ResolutionQuality,
    },
    {
      id: 'twitch_banner' as ExportFormat,
      title: 'Banner Gaming (16:9)',
      res: '1920 × 1080 px',
      desc: 'Twitch Header, YouTube, X / Twitter',
      icon: Tv,
      recommendedQuality: '4k' as ResolutionQuality,
    },
    {
      id: 'turnaround_sheet' as ExportFormat,
      title: 'Hoja Modelo 3D (16:9)',
      res: '1920 × 1080 px',
      desc: 'Frontal, Rostro y Especificaciones UE5',
      icon: Layers,
      recommendedQuality: '4k' as ResolutionQuality,
    },
  ];

  // Primary High-Resolution Download Handler
  const handleDownloadHighRes = async (targetExt?: ExportImageFormat) => {
    const ext = targetExt || imageFormat;
    setIsExporting(true);
    setDownloadSuccessMessage(null);
    sound.playClick();

    try {
      const canvas = await renderHighResCanvas(character, {
        format: selectedFormat,
        imageFormat: ext,
        quality,
        includeGamerBadge,
        includeWatermark,
        includeSpecSheet,
        jpegQuality: 0.95,
      });

      const cleanName = character.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
      const filename = `${cleanName}_${selectedFormat}_${quality}.${ext === 'jpeg' ? 'jpg' : ext}`;

      await downloadCanvasAsFile(canvas, filename, ext, 0.95);
      sound.playSuccess();
      setDownloadSuccessMessage(`¡Guardado en alta resolución (${currentDims.width}×${currentDims.height} px, ${ext.toUpperCase()})!`);
      setTimeout(() => setDownloadSuccessMessage(null), 4000);
    } catch (err) {
      console.error('Download error:', err);
    } finally {
      setIsExporting(false);
    }
  };

  // Native Web Share for Android / Mobile
  const handleNativeShare = async () => {
    sound.playClick();
    setIsExporting(true);
    try {
      const canvas = await renderHighResCanvas(character, {
        format: selectedFormat,
        imageFormat: 'png',
        quality: '1080p', // Optimize size for fast sharing
        includeGamerBadge,
        includeWatermark,
        includeSpecSheet,
      });

      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], `${character.name}_ps5.png`, { type: 'image/png' });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: `Avatar PS5: ${character.name}`,
            text: `¡Mira mi nuevo avatar 3D creado con IA al estilo PlayStation 5: ${character.name}!`,
            files: [file],
          });
          setShareSuccess(true);
          sound.playSuccess();
          setTimeout(() => setShareSuccess(false), 3500);
        } else if (navigator.share) {
          await navigator.share({
            title: `Avatar PS5: ${character.name}`,
            text: `Avatar PS5: ${character.name} (${character.role})`,
            url: window.location.href,
          });
          setShareSuccess(true);
          sound.playSuccess();
          setTimeout(() => setShareSuccess(false), 3500);
        } else {
          handleCopyImage();
        }
      }, 'image/png');
    } catch (err) {
      console.error('Share failed:', err);
    } finally {
      setIsExporting(false);
    }
  };

  // Copy Image to Clipboard
  const handleCopyImage = async () => {
    sound.playClick();
    try {
      const canvas = await renderHighResCanvas(character, {
        format: selectedFormat,
        imageFormat: 'png',
        quality: '1080p',
        includeGamerBadge,
        includeWatermark,
        includeSpecSheet,
      });

      canvas.toBlob(async (blob) => {
        if (!blob) return;
        if (navigator.clipboard && (window as any).ClipboardItem) {
          await navigator.clipboard.write([
            new (window as any).ClipboardItem({ 'image/png': blob }),
          ]);
          setCopySuccess(true);
          sound.playSuccess();
          setTimeout(() => setCopySuccess(false), 3000);
        } else {
          handleDownloadHighRes('png');
        }
      }, 'image/png');
    } catch (err) {
      console.error('Copy error:', err);
    }
  };

  // Record 3-Second Animated Video Clip for Stories / Reels
  const handleRecordVideoClip = async () => {
    setIsRecordingVideo(true);
    sound.playClick();

    try {
      const canvas = document.createElement('canvas');
      canvas.width = 720;
      canvas.height = 720;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = character.images.portrait;

      await new Promise((res) => {
        img.onload = res;
        img.onerror = res;
      });

      const stream = canvas.captureStream(30);
      const recorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
          ? 'video/webm;codecs=vp9'
          : 'video/webm',
      });

      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${character.name.toLowerCase().replace(/\s+/g, '_')}_animated_loop.webm`;
        a.click();
        sound.playSuccess();
        setIsRecordingVideo(false);
      };

      recorder.start();

      let frame = 0;
      const totalFrames = 90; // 3 seconds at 30fps

      const drawLoop = () => {
        if (frame >= totalFrames) {
          recorder.stop();
          return;
        }

        const scale = 1 + Math.sin((frame / totalFrames) * Math.PI * 2) * 0.04;
        const shimmerX = Math.sin((frame / totalFrames) * Math.PI * 2) * 150 + 360;

        ctx.fillStyle = '#0a0d14';
        ctx.fillRect(0, 0, 720, 720);

        const glow = ctx.createRadialGradient(shimmerX, 300, 20, 360, 360, 400);
        glow.addColorStop(0, 'rgba(251, 191, 36, 0.25)');
        glow.addColorStop(1, 'transparent');
        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, 720, 720);

        const w = 600 * scale;
        const h = 600 * scale;
        const x = (720 - w) / 2;
        const y = (720 - h) / 2;
        ctx.drawImage(img, x, y, w, h);

        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.beginPath();
        ctx.roundRect(20, 660, 240, 40, 8);
        ctx.fill();
        ctx.fillStyle = '#f59e0b';
        ctx.font = 'bold 16px "Chakra Petch", sans-serif';
        ctx.fillText('PS5 AVATAR STUDIO', 35, 686);

        frame++;
        requestAnimationFrame(drawLoop);
      };

      drawLoop();
    } catch (err) {
      console.error('Video recording failed:', err);
      setIsRecordingVideo(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-md sm:items-center p-0 sm:p-4">
      <div className="absolute inset-0" onClick={onClose} />

      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        className="relative w-full max-w-xl bg-[#0c0e17] rounded-t-3xl sm:rounded-3xl border border-white/15 shadow-2xl z-10 max-h-[92vh] flex flex-col overflow-hidden"
      >
        {/* Android drag pill */}
        <div className="flex justify-center pt-2.5 pb-1 sm:hidden">
          <div className="w-12 h-1.5 rounded-full bg-white/20" />
        </div>

        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-400/15 border border-amber-400/30 flex items-center justify-center text-amber-400">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white font-display">
                Guardar Avatar en Alta Resolución
              </h2>
              <p className="text-[11px] text-slate-400">
                Formatos compatibles con Instagram, TikTok, WhatsApp, X y Twitch
              </p>
            </div>
          </div>

          <button
            id="btn-close-export-modal"
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {/* Format Selector Grid */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-2">
              1. Selecciona el Formato de Red Social:
            </label>
            <div className="grid grid-cols-2 gap-2">
              {socialFormats.map((fmt) => {
                const Icon = fmt.icon;
                const isSelected = selectedFormat === fmt.id;
                return (
                  <button
                    key={fmt.id}
                    id={`btn-export-format-${fmt.id}`}
                    onClick={() => {
                      sound.playClick();
                      setSelectedFormat(fmt.id);
                    }}
                    className={`p-2.5 rounded-xl text-left border transition-all ${
                      isSelected
                        ? 'bg-amber-400/10 border-amber-400 text-white shadow-md ring-1 ring-amber-400/30'
                        : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <Icon className={`w-4 h-4 ${isSelected ? 'text-amber-400' : 'text-slate-400'}`} />
                      <span className="text-[10px] font-mono text-amber-400/80">{fmt.res}</span>
                    </div>
                    <div className="font-bold text-xs truncate">{fmt.title}</div>
                    <div className="text-[10px] text-slate-400 truncate mt-0.5">{fmt.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Resolution & File Format Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/10">
            {/* File Format: PNG vs JPG vs WEBP */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <FileImage className="w-3.5 h-3.5 text-sky-400" />
                <span>Formato de Imagen:</span>
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {(['png', 'jpeg', 'webp'] as ExportImageFormat[]).map((ext) => (
                  <button
                    key={ext}
                    id={`btn-select-ext-${ext}`}
                    onClick={() => {
                      sound.playClick();
                      setImageFormat(ext);
                    }}
                    className={`py-1.5 px-2 rounded-lg font-mono font-bold text-xs uppercase text-center border transition-all ${
                      imageFormat === ext
                        ? 'bg-amber-400 text-slate-950 border-amber-400 shadow-sm'
                        : 'bg-black/40 border-white/10 text-slate-300 hover:bg-white/5'
                    }`}
                  >
                    {ext === 'jpeg' ? 'JPG' : ext.toUpperCase()}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                {imageFormat === 'png' && 'PNG: Máxima nitidez sin pérdidas, ideal para Discord y avatares.'}
                {imageFormat === 'jpeg' && 'JPG: Ligero y ultra compatible con Instagram Feed y WhatsApp.'}
                {imageFormat === 'webp' && 'WEBP: Moderno con compresión ultra rápida.'}
              </p>
            </div>

            {/* Quality Scale: 1080p vs 2K vs 4K */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Sliders className="w-3.5 h-3.5 text-amber-400" />
                <span>Calidad / Resolución:</span>
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {(
                  [
                    { id: '1080p', label: '1080p' },
                    { id: '2k', label: '2K' },
                    { id: '4k', label: '4K Ultra' },
                  ] as { id: ResolutionQuality; label: string }[]
                ).map((q) => (
                  <button
                    key={q.id}
                    id={`btn-select-quality-${q.id}`}
                    onClick={() => {
                      sound.playClick();
                      setQuality(q.id);
                    }}
                    className={`py-1.5 px-2 rounded-lg font-mono font-bold text-xs text-center border transition-all ${
                      quality === q.id
                        ? 'bg-amber-400 text-slate-950 border-amber-400 shadow-sm'
                        : 'bg-black/40 border-white/10 text-slate-300 hover:bg-white/5'
                    }`}
                  >
                    {q.label}
                  </button>
                ))}
              </div>
              <div className="mt-1 text-[10px] font-mono text-amber-400">
                Resolución final: {currentDims.width} × {currentDims.height} px
              </div>
            </div>
          </div>

          {/* Live Preview Card */}
          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-white/10 flex flex-col items-center justify-center">
            <div className="w-full flex items-center justify-between text-[10px] text-slate-400 mb-2 font-mono uppercase tracking-wider">
              <span>Vista Previa del Render</span>
              <span className="text-amber-400 font-bold">{currentDims.label}</span>
            </div>

            <div className="relative overflow-hidden rounded-xl border border-white/15 bg-black/60 shadow-xl max-h-[220px] flex items-center justify-center">
              {selectedFormat === 'instagram_avatar' ? (
                <div className="relative p-2 flex items-center justify-center">
                  <div className="relative w-36 h-36 rounded-full overflow-hidden border-2 border-amber-400 shadow-xl">
                    <img
                      src={character.images.portrait}
                      alt={character.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {includeGamerBadge && (
                    <div className="absolute bottom-3 px-2 py-0.5 rounded bg-slate-900 border border-amber-400 text-[9px] font-bold text-amber-400 shadow-md">
                      PS5 METAHUMAN • 8K
                    </div>
                  )}
                </div>
              ) : selectedFormat === 'tiktok_story' ? (
                <div className="relative aspect-[9/16] h-[210px] rounded-lg overflow-hidden border border-white/15 bg-gradient-to-b from-slate-900 to-black p-2 flex flex-col justify-between text-center">
                  <div className="text-[9px] font-bold text-amber-400 uppercase tracking-widest">
                    PS5 REEL
                  </div>
                  <div className="w-24 h-24 mx-auto rounded-xl overflow-hidden border border-white/20">
                    <img
                      src={character.images.portrait}
                      alt={character.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white truncate">{character.name}</div>
                    <div className="text-[9px] text-slate-400 truncate">{character.role}</div>
                  </div>
                </div>
              ) : (
                <div className="relative aspect-[16/9] w-full max-w-[340px] rounded-lg overflow-hidden">
                  <img
                    src={selectedFormat === 'turnaround_sheet' ? character.images.turnaroundSheet : character.images.portrait}
                    alt={character.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-1 left-2 text-[9px] px-1.5 py-0.5 rounded bg-black/70 text-slate-300">
                    {character.name} • UNREAL ENGINE 5 ({quality.toUpperCase()})
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Customization Options */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-white/5 border border-white/10 text-xs">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={includeGamerBadge}
                onChange={(e) => setIncludeGamerBadge(e.target.checked)}
                className="rounded border-slate-700 text-amber-400 focus:ring-0"
              />
              <span className="text-slate-300">Insignia Gamer Pro (PS5 / 8K)</span>
            </label>

            {selectedFormat === 'turnaround_sheet' && (
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeSpecSheet}
                  onChange={(e) => setIncludeSpecSheet(e.target.checked)}
                  className="rounded border-slate-700 text-amber-400 focus:ring-0"
                />
                <span className="text-slate-300">Ficha Técnica Artlist / UE5</span>
              </label>
            )}

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={includeWatermark}
                onChange={(e) => setIncludeWatermark(e.target.checked)}
                className="rounded border-slate-700 text-amber-400 focus:ring-0"
              />
              <span className="text-slate-300">Marca de Agua Estudio</span>
            </label>
          </div>

          {/* Feedback messages */}
          {downloadSuccessMessage && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-2.5 rounded-lg bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 text-center text-xs flex items-center justify-center gap-2 font-medium"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{downloadSuccessMessage}</span>
            </motion.div>
          )}

          {copySuccess && (
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-center text-xs flex items-center justify-center gap-1.5">
              <Check className="w-4 h-4" />
              <span>¡Imagen copiada al portapapeles con éxito!</span>
            </div>
          )}

          {shareSuccess && (
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-center text-xs flex items-center justify-center gap-1.5">
              <Check className="w-4 h-4" />
              <span>¡Compartido correctamente en redes sociales!</span>
            </div>
          )}

          {/* Primary Action Buttons Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
            {/* Primary Direct High-Res Download (PNG or JPG) */}
            <button
              id="btn-download-highres-avatar"
              onClick={() => handleDownloadHighRes(imageFormat)}
              disabled={isExporting}
              className="py-3 px-4 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-amber-400/25 disabled:opacity-60"
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Procesando Render {quality.toUpperCase()}...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Guardar HD ({imageFormat === 'jpeg' ? 'JPG' : imageFormat.toUpperCase()}) • {currentDims.width}px</span>
                </>
              )}
            </button>

            {/* Quick JPG / Alternate format button for fast Instagram export */}
            <button
              id="btn-quick-download-alt-format"
              onClick={() => handleDownloadHighRes(imageFormat === 'jpeg' ? 'png' : 'jpeg')}
              disabled={isExporting}
              className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-white/15 flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-60"
            >
              <FileImage className="w-4 h-4 text-amber-400" />
              <span>Guardar en {imageFormat === 'jpeg' ? 'PNG (Sin Pérdida)' : 'JPG (Para Instagram)'}</span>
            </button>
          </div>

          {/* Video Clip, Android Share & Clipboard Row */}
          <div className="grid grid-cols-3 gap-2">
            <button
              id="btn-record-animated-video"
              onClick={handleRecordVideoClip}
              disabled={isRecordingVideo}
              className="py-2.5 px-2 rounded-xl bg-slate-900 border border-white/10 text-slate-200 hover:bg-slate-800 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-60"
            >
              {isRecordingVideo ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-400" />
              ) : (
                <Video className="w-3.5 h-3.5 text-sky-400" />
              )}
              <span>Clip Video</span>
            </button>

            <button
              id="btn-native-android-share"
              onClick={handleNativeShare}
              disabled={isExporting}
              className="py-2.5 px-2 rounded-xl bg-slate-900 border border-white/10 text-slate-200 hover:bg-slate-800 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <Share2 className="w-3.5 h-3.5 text-amber-400" />
              <span>Compartir RRSS</span>
            </button>

            <button
              id="btn-copy-clipboard"
              onClick={handleCopyImage}
              className="py-2.5 px-2 rounded-xl bg-slate-900 border border-white/10 text-slate-200 hover:bg-slate-800 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <Copy className="w-3.5 h-3.5 text-sky-400" />
              <span>Copiar</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
