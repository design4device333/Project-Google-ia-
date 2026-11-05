export interface CharacterVoice {
  pitch: string;
  roughness: string;
  tone: string;
  frequencyProfile: number[];
}

export interface CharacterImages {
  portrait: string;
  fullBody: string;
  turnaroundSheet: string;
  backView: string;
}

export interface AvatarCharacter {
  id: string;
  name: string;
  role: string;
  archetype: string;
  age: string;
  build: string;
  lore: string;
  mood: string;
  voice: CharacterVoice;
  lightingPreset: string;
  renderEngine: string;
  images: CharacterImages;
  tags: string[];
  createdAt?: string;
}

export type AnimationPose = 'idle_breathing' | 'combat_ready' | 'glance_close' | 'turntable_360' | 'victory';

export type CameraView = 'portrait' | 'fullBody' | 'backView' | 'turnaroundSheet';

export type ExportFormat = 'instagram_avatar' | 'tiktok_story' | 'twitch_banner' | 'turnaround_sheet';

export type StudioTab = 'cast' | 'create' | 'animate' | 'export';
