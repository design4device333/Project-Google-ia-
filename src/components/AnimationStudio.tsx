import React, { useState } from 'react';
import { 
  Play, 
  Pause, 
  RotateCw, 
  Flame, 
  CloudRain, 
  Wind, 
  Zap, 
  Sun, 
  Camera, 
  Crosshair, 
  Activity,
  Sliders
} from 'lucide-react';
import { AnimationPose, AvatarCharacter } from '../types';
import { sound } from '../utils/audioSynthesizer';

interface AnimationStudioProps {
  character: AvatarCharacter;
  currentPose: AnimationPose;
  onSelectPose: (pose: AnimationPose) => void;
  activeAtmosphere: string;
  onChangeAtmosphere: (atm: string) => void;
}

export const AnimationStudio: React.FC<AnimationStudioProps> = ({
  character,
  currentPose,
  onSelectPose,
  activeAtmosphere,
  onChangeAtmosphere,
}) => {
  const [animationSpeed, setAnimationSpeed] = useState<number>(1);

  const poses = [
    {
      id: 'idle_breathing' as AnimationPose,
      label: 'Reposo / Respiración (Idle)',
      desc: 'Movimiento orgánico de pecho y micro-oscilaciones de postura',
      icon: Activity,
    },
    {
      id: 'combat_ready' as AnimationPose,
      label: 'Listo para el Combate',
      desc: 'Tensión muscular, postura de guardia y reflejos de luz reactivos',
      icon: Crosshair,
    },
    {
      id: 'glance_close' as AnimationPose,
      label: 'Enfoque Cinemático Facial',
      desc: 'Zoom de cámara con profundidad de campo y luz de contorno',
      icon: Camera,
    },
    {
      id: 'turntable_360' as AnimationPose,
      label: 'Inspección Giratoria 360°',
      desc: 'Giro orbital continuo a 60 FPS estilo Unreal Engine 5',
      icon: RotateCw,
    },
  ];

  const atmospheres = [
    { id: 'embers', label: 'Chispas de Fuego (Souls)', icon: Flame },
    { id: 'neon', label: 'Bioluminiscencia Cyber', icon: Zap },
    { id: 'dust', label: 'Polvo de Cabina (WWII)', icon: Wind },
    { id: 'fog', label: 'Niebla Volumétrica', icon: CloudRain },
  ];

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-2">
          <span>Estudio de Animación y Poses PS5</span>
          <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-sky-400/10 text-sky-400 border border-sky-400/20">
            60 FPS EN VIVO
          </span>
        </h2>
        <p className="text-xs text-slate-400">
          Controla las animaciones de idle, poses de combate y efectos ambientales para {character.name}
        </p>
      </div>

      {/* Poses Selection Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {poses.map((p) => {
          const Icon = p.icon;
          const isSelected = currentPose === p.id;
          return (
            <button
              key={p.id}
              id={`btn-pose-${p.id}`}
              onClick={() => {
                sound.playClick();
                onSelectPose(p.id);
              }}
              className={`p-3 rounded-xl text-left border transition-all flex items-start gap-3 select-none ${
                isSelected
                  ? 'bg-amber-400/10 border-amber-400 text-white shadow-lg shadow-amber-400/10 ring-1 ring-amber-400/40'
                  : 'bg-slate-950/80 border-white/10 text-slate-300 hover:bg-slate-900/80 hover:border-white/20'
              }`}
            >
              <div
                className={`p-2 rounded-lg ${
                  isSelected ? 'bg-amber-400 text-slate-950' : 'bg-white/5 text-slate-400'
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-xs flex items-center justify-between">
                  <span>{p.label}</span>
                  {isSelected && (
                    <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 font-mono">
                      Activo
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{p.desc}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Atmospheric Weather / Particle FX */}
      <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-white/10 space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-300 flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            Atmósfera y Partículas Cinemáticas:
          </span>
          <span className="text-[11px] text-amber-400 font-mono capitalize">{activeAtmosphere}</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {atmospheres.map((atm) => {
            const Icon = atm.icon;
            const isActive = activeAtmosphere === atm.id;
            return (
              <button
                key={atm.id}
                onClick={() => {
                  sound.playClick();
                  onChangeAtmosphere(atm.id);
                }}
                className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-medium border transition-all ${
                  isActive
                    ? 'bg-white/15 border-white/30 text-white shadow-sm'
                    : 'bg-white/5 border-white/5 text-slate-400 hover:text-slate-200 hover:bg-white/10'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
                <span className="truncate">{atm.label.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};
