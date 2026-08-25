export interface Particle {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  originX: number;
  originY: number;
  vx: number;
  vy: number;
  color: string;
  r: number;
  g: number;
  b: number;
  size: number;
  alpha: number;
  angle: number;
  speed: number;
  friction: number;
  spring: number;
}

export type ParticleShape = 'square' | 'circle' | 'diamond';
export type AnimationMode = 'assemble' | 'disassemble' | 'assembled' | 'idle';

export interface RankShowcaseConfig {
  step: number; // 2 to 5
  shape: ParticleShape;
  speed: number; // 0.5 to 2.0
  scatterRadius: number; // 50 to 300
  enableMouseRepel: boolean;
  enableGlow: boolean;
  autoReplay: boolean;
}
