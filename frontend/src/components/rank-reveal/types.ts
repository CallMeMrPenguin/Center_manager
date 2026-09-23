import { StudentTier } from '../../pages/reports/types';

export interface ShardParticle {
  // Triangle vertices relative to center
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  x3: number;
  y3: number;
  // Center position
  cx: number;
  cy: number;
  // Physics
  vx: number;
  vy: number;
  rotation: number;
  vRot: number;
  scale: number;
  alpha: number;
  decay: number;
  color: string;
}

export interface Shockwave {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  lineWidth: number;
  alpha: number;
  speed: number;
  color: string;
}

export interface EnergyParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  maxLife: number;
  life: number;
  color: string;
  type: 'stardust' | 'ember' | 'sparkle' | 'lightning';
}

export interface RankRevealOptions {
  enableShake?: boolean;
  enableShards?: boolean;
  enableShockwave?: boolean;
  enableGodRays?: boolean;
  enableWings?: boolean;
  playbackSpeed?: number; // 1.0 = normal, 0.5 = slow, 0.25 = super slow
}

export interface RankRevealModalProps {
  isOpen: boolean;
  onClose: () => void;
  oldTier: StudentTier;
  newTier: StudentTier;
  studentName?: string;
  className?: string;
  oldScore?: number;
  newScore?: number;
  options?: RankRevealOptions;
}
