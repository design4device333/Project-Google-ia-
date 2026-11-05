import { AvatarCharacter, ExportFormat } from '../types';

export type ResolutionQuality = '1080p' | '2k' | '4k';
export type ExportImageFormat = 'png' | 'jpeg' | 'webp';

export interface ExportOptions {
  format: ExportFormat;
  imageFormat: ExportImageFormat;
  quality: ResolutionQuality;
  includeGamerBadge: boolean;
  includeWatermark: boolean;
  includeSpecSheet: boolean;
  cameraView?: 'portrait' | 'fullBody' | 'turnaroundSheet';
  jpegQuality?: number; // 0.8 to 1.0
}

export interface DimensionConfig {
  width: number;
  height: number;
  label: string;
}

export function getResolutionDimensions(
  format: ExportFormat,
  quality: ResolutionQuality
): DimensionConfig {
  const multipliers: Record<ResolutionQuality, number> = {
    '1080p': 1,
    '2k': 1.5,
    '4k': 2,
  };

  const scale = multipliers[quality] || 1;

  if (format === 'tiktok_story') {
    // 9:16 Aspect
    const baseW = 1080;
    const baseH = 1920;
    return {
      width: Math.round(baseW * scale),
      height: Math.round(baseH * scale),
      label: `${Math.round(baseW * scale)} × ${Math.round(baseH * scale)} px (${quality.toUpperCase()})`,
    };
  }

  if (format === 'twitch_banner' || format === 'turnaround_sheet') {
    // 16:9 Aspect
    const baseW = 1920;
    const baseH = 1080;
    return {
      width: Math.round(baseW * scale),
      height: Math.round(baseH * scale),
      label: `${Math.round(baseW * scale)} × ${Math.round(baseH * scale)} px (${quality.toUpperCase()})`,
    };
  }

  // Default: 1:1 Avatar
  const baseSize = 1080;
  return {
    width: Math.round(baseSize * scale),
    height: Math.round(baseSize * scale),
    label: `${Math.round(baseSize * scale)} × ${Math.round(baseSize * scale)} px (${quality.toUpperCase()})`,
  };
}

/**
 * Loads an image safely with CORS handling
 */
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (err) => {
      // Fallback attempt without anonymous in case of local blob/data URL
      const fallbackImg = new Image();
      fallbackImg.onload = () => resolve(fallbackImg);
      fallbackImg.onerror = () => reject(err);
      fallbackImg.src = src;
    };
    img.src = src;
  });
}

/**
 * Renders the avatar in high resolution onto an HTML5 Canvas
 */
export async function renderHighResCanvas(
  character: AvatarCharacter,
  options: ExportOptions
): Promise<HTMLCanvasElement> {
  const {
    format,
    quality,
    includeGamerBadge,
    includeWatermark,
    includeSpecSheet,
    cameraView = 'portrait',
  } = options;

  const { width, height } = getResolutionDimensions(format, quality);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) {
    throw new Error('Canvas 2D context not available');
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // 1. Draw High-End Cinematic PS5 Radial Gradient Background
  const bgGrad = ctx.createRadialGradient(
    width / 2,
    height * 0.38,
    width * 0.05,
    width / 2,
    height / 2,
    width * 0.85
  );
  bgGrad.addColorStop(0, '#192231');
  bgGrad.addColorStop(0.45, '#0e131d');
  bgGrad.addColorStop(1, '#05070a');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // Subtle lighting bloom in the center
  const bloomGrad = ctx.createRadialGradient(
    width / 2,
    height * 0.35,
    10,
    width / 2,
    height * 0.35,
    width * 0.4
  );
  bloomGrad.addColorStop(0, 'rgba(251, 191, 36, 0.12)');
  bloomGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = bloomGrad;
  ctx.fillRect(0, 0, width, height);

  // 2. Select image based on requested camera view or format
  let imgSrc = character.images.portrait;
  if (format === 'turnaround_sheet') {
    imgSrc = character.images.turnaroundSheet || character.images.portrait;
  } else if (cameraView === 'fullBody') {
    imgSrc = character.images.fullBody || character.images.portrait;
  } else if (cameraView === 'turnaroundSheet') {
    imgSrc = character.images.turnaroundSheet || character.images.portrait;
  }

  const img = await loadImage(imgSrc);

  // 3. Layout Rendering based on Format
  if (format === 'instagram_avatar') {
    // Square 1:1 Social Avatar
    const avatarRadius = (width * 0.76) / 2;
    const centerX = width / 2;
    const centerY = height / 2 - (includeGamerBadge ? 20 : 0);

    // Subtle drop glow
    ctx.save();
    ctx.shadowColor = 'rgba(251, 191, 36, 0.35)';
    ctx.shadowBlur = Math.round(50 * (width / 1080));
    ctx.beginPath();
    ctx.arc(centerX, centerY, avatarRadius, 0, Math.PI * 2);
    ctx.fillStyle = '#0f172a';
    ctx.fill();
    ctx.restore();

    // Clip to circle
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, avatarRadius, 0, Math.PI * 2);
    ctx.clip();

    // Draw avatar image centered inside circle
    const imgSize = avatarRadius * 2;
    ctx.drawImage(img, centerX - avatarRadius, centerY - avatarRadius, imgSize, imgSize);
    ctx.restore();

    // Golden Gamer Ring & PS5 Accents
    if (includeGamerBadge) {
      ctx.save();
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = Math.round(14 * (width / 1080));
      ctx.beginPath();
      ctx.arc(centerX, centerY, avatarRadius + ctx.lineWidth / 2, 0, Math.PI * 2);
      ctx.stroke();

      // Outer thin ring
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = Math.round(3 * (width / 1080));
      ctx.beginPath();
      ctx.arc(centerX, centerY, avatarRadius + 22 * (width / 1080), 0, Math.PI * 2);
      ctx.stroke();

      // Lower Badge: PS5 METAHUMAN
      const badgeW = Math.round(280 * (width / 1080));
      const badgeH = Math.round(54 * (width / 1080));
      const badgeX = (width - badgeW) / 2;
      const badgeY = centerY + avatarRadius - badgeH / 2;

      ctx.fillStyle = '#090d16';
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = Math.round(3 * (width / 1080));
      ctx.beginPath();
      ctx.roundRect(badgeX, badgeY, badgeW, badgeH, Math.round(14 * (width / 1080)));
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#f59e0b';
      ctx.font = `bold ${Math.round(20 * (width / 1080))}px "Plus Jakarta Sans", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('PS5 METAHUMAN • 8K', width / 2, badgeY + badgeH / 2);
      ctx.restore();
    }
  } else if (format === 'tiktok_story') {
    // Vertical 9:16 Reel / Story
    const scaleFactor = width / 1080;
    const imgSize = Math.round(width * 0.92);
    const imgX = (width - imgSize) / 2;
    const imgY = Math.round(height * 0.18);

    // Glowing avatar frame
    ctx.save();
    ctx.shadowColor = 'rgba(251, 191, 36, 0.4)';
    ctx.shadowBlur = Math.round(60 * scaleFactor);
    ctx.beginPath();
    ctx.roundRect(imgX, imgY, imgSize, imgSize, Math.round(32 * scaleFactor));
    ctx.clip();
    ctx.drawImage(img, imgX, imgY, imgSize, imgSize);
    ctx.restore();

    // Top Category Header
    ctx.save();
    ctx.fillStyle = '#f59e0b';
    ctx.font = `bold ${Math.round(34 * scaleFactor)}px "Chakra Petch", sans-serif`;
    ctx.fillText('UNREAL ENGINE 5.4 • PS5 PRO', Math.round(70 * scaleFactor), Math.round(130 * scaleFactor));

    // Bottom Typography Block
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${Math.round(64 * scaleFactor)}px "Chakra Petch", sans-serif`;
    ctx.fillText(character.name.toUpperCase(), Math.round(70 * scaleFactor), height - Math.round(360 * scaleFactor));

    ctx.fillStyle = '#38bdf8';
    ctx.font = `600 ${Math.round(32 * scaleFactor)}px "Plus Jakarta Sans", sans-serif`;
    ctx.fillText(character.role, Math.round(70 * scaleFactor), height - Math.round(300 * scaleFactor));

    ctx.fillStyle = '#94a3b8';
    ctx.font = `${Math.round(24 * scaleFactor)}px "Plus Jakarta Sans", sans-serif`;
    ctx.fillText(
      `Arquetipo: ${character.archetype} • ${character.age}`,
      Math.round(70 * scaleFactor),
      height - Math.round(250 * scaleFactor)
    );

    // Audio frequency waveform indicator at bottom
    ctx.fillStyle = '#f59e0b';
    ctx.font = `500 ${Math.round(20 * scaleFactor)}px monospace`;
    ctx.fillText(
      `AUDIO PROFILE: ${character.voice.pitch.toUpperCase()}`,
      Math.round(70 * scaleFactor),
      height - Math.round(195 * scaleFactor)
    );
    ctx.restore();
  } else {
    // Landscape 16:9 (Twitch / YouTube Banner or Turnaround Sheet)
    const scaleFactor = width / 1920;

    // Draw main image on right or full width
    if (format === 'turnaround_sheet') {
      ctx.drawImage(img, 0, 0, width, height);

      // Spec sheet card overlay (Unreal Engine / Artlist character spec)
      if (includeSpecSheet) {
        const cardW = Math.round(520 * scaleFactor);
        const cardH = Math.round(410 * scaleFactor);
        const cardX = Math.round(60 * scaleFactor);
        const cardY = Math.round(60 * scaleFactor);

        ctx.save();
        ctx.fillStyle = 'rgba(10, 14, 23, 0.88)';
        ctx.strokeStyle = 'rgba(251, 191, 36, 0.35)';
        ctx.lineWidth = Math.round(3 * scaleFactor);
        ctx.beginPath();
        ctx.roundRect(cardX, cardY, cardW, cardH, Math.round(22 * scaleFactor));
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${Math.round(42 * scaleFactor)}px "Chakra Petch", sans-serif`;
        ctx.fillText(character.name, cardX + Math.round(35 * scaleFactor), cardY + Math.round(65 * scaleFactor));

        ctx.fillStyle = '#f59e0b';
        ctx.font = `bold ${Math.round(20 * scaleFactor)}px "Plus Jakarta Sans", sans-serif`;
        ctx.fillText(character.role.toUpperCase(), cardX + Math.round(35 * scaleFactor), cardY + Math.round(108 * scaleFactor));

        ctx.fillStyle = '#cbd5e1';
        ctx.font = `${Math.round(18 * scaleFactor)}px "Plus Jakarta Sans", sans-serif`;
        ctx.fillText(`Edad: ${character.age}`, cardX + Math.round(35 * scaleFactor), cardY + Math.round(160 * scaleFactor));
        ctx.fillText(`Complexión: ${character.build.slice(0, 40)}`, cardX + Math.round(35 * scaleFactor), cardY + Math.round(200 * scaleFactor));
        ctx.fillText(`Voz: ${character.voice.pitch}`, cardX + Math.round(35 * scaleFactor), cardY + Math.round(240 * scaleFactor));
        ctx.fillText(`Motor: ${character.renderEngine}`, cardX + Math.round(35 * scaleFactor), cardY + Math.round(280 * scaleFactor));
        ctx.fillText(`Luz: ${character.lightingPreset}`, cardX + Math.round(35 * scaleFactor), cardY + Math.round(320 * scaleFactor));
        ctx.fillText(`Calidad: ${quality.toUpperCase()} ULTRA RESOLUTION`, cardX + Math.round(35 * scaleFactor), cardY + Math.round(360 * scaleFactor));
        ctx.restore();
      }
    } else {
      // Twitch / X Banner Layout
      ctx.drawImage(img, 0, 0, width, height);

      // Subtle vignette and lower gradient
      const bannerGrad = ctx.createLinearGradient(0, height * 0.4, 0, height);
      bannerGrad.addColorStop(0, 'rgba(0,0,0,0)');
      bannerGrad.addColorStop(1, 'rgba(5, 7, 12, 0.92)');
      ctx.fillStyle = bannerGrad;
      ctx.fillRect(0, 0, width, height);

      // Title & gamer handle
      ctx.save();
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${Math.round(52 * scaleFactor)}px "Chakra Petch", sans-serif`;
      ctx.fillText(character.name, Math.round(80 * scaleFactor), height - Math.round(100 * scaleFactor));

      ctx.fillStyle = '#f59e0b';
      ctx.font = `600 ${Math.round(24 * scaleFactor)}px "Plus Jakarta Sans", sans-serif`;
      ctx.fillText(character.role, Math.round(80 * scaleFactor), height - Math.round(55 * scaleFactor));
      ctx.restore();
    }
  }

  // Watermark if enabled
  if (includeWatermark) {
    const scaleFactor = Math.min(width, height) / 1080;
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.font = `600 ${Math.round(18 * scaleFactor)}px "Plus Jakarta Sans", sans-serif`;
    ctx.textAlign = 'right';
    ctx.fillText('PS5 Avatar Studio AI • 8K MetaHuman', width - Math.round(40 * scaleFactor), height - Math.round(30 * scaleFactor));
    ctx.restore();
  }

  return canvas;
}

/**
 * Downloads a canvas as an image file (PNG, JPG, or WEBP)
 */
export async function downloadCanvasAsFile(
  canvas: HTMLCanvasElement,
  filename: string,
  imageFormat: ExportImageFormat = 'png',
  jpegQuality: number = 0.95
): Promise<void> {
  let mimeType = 'image/png';
  let extension = 'png';

  if (imageFormat === 'jpeg') {
    mimeType = 'image/jpeg';
    extension = 'jpg';
  } else if (imageFormat === 'webp') {
    mimeType = 'image/webp';
    extension = 'webp';
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Failed to create image blob'));
          return;
        }

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = filename.endsWith(`.${extension}`) ? filename : `${filename}.${extension}`;
        link.href = url;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setTimeout(() => {
          URL.revokeObjectURL(url);
          resolve();
        }, 1500);
      },
      mimeType,
      imageFormat === 'jpeg' || imageFormat === 'webp' ? jpegQuality : undefined
    );
  });
}
