import { useEffect, useRef } from 'react';
import { ShardParticle, Shockwave, EnergyParticle, RankRevealOptions } from './types';
import { StudentTier } from '../../pages/reports/types';

export function useRankRevealCanvas(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  phase: 'idle' | 'crack' | 'shatter' | 'slam' | 'reveal',
  oldTier: StudentTier,
  newTier: StudentTier,
  options?: RankRevealOptions
) {
  const shardsRef = useRef<ShardParticle[]>([]);
  const shockwavesRef = useRef<Shockwave[]>([]);
  const particlesRef = useRef<EnergyParticle[]>([]);
  const rayAngleRef = useRef<number>(0);
  const animFrameIdRef = useRef<number | null>(null);

  // Trigger shockwave & shards on phase transitions
  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    if (phase === 'shatter' && options?.enableShards !== false) {
      // Spawn shards
      const count = 36;
      const shards: ShardParticle[] = [];
      const shardColors = [oldTier.color, '#ffffff', '#ffd700', oldTier.color];
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.4;
        const speed = 4 + Math.random() * 8;
        const size = 12 + Math.random() * 18;
        shards.push({
          x1: -size / 2, y1: -size / 2,
          x2: size / 2, y2: -size / 4,
          x3: 0, y3: size / 2,
          cx, cy,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed + 1,
          rotation: Math.random() * Math.PI * 2,
          vRot: (Math.random() - 0.5) * 0.25,
          scale: 1,
          alpha: 1,
          decay: 0.015 + Math.random() * 0.02,
          color: shardColors[i % shardColors.length],
        });
      }
      shardsRef.current = shards;

      // Spawn Shockwave 1
      if (options?.enableShockwave !== false) {
        shockwavesRef.current.push({
          x: cx, y: cy, radius: 20, maxRadius: 380, lineWidth: 8, alpha: 0.9, speed: 12, color: oldTier.color,
        });
      }
    }

    if (phase === 'slam' && options?.enableShockwave !== false) {
      // Spawn massive Shockwave 2
      shockwavesRef.current.push(
        { x: cx, y: cy, radius: 30, maxRadius: 550, lineWidth: 14, alpha: 1, speed: 16, color: '#ffffff' },
        { x: cx, y: cy, radius: 10, maxRadius: 450, lineWidth: 10, alpha: 0.8, speed: 10, color: newTier.color }
      );
    }
  }, [phase, oldTier, newTier, options]);

  // Main animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let isRunning = true;

    const render = () => {
      if (!isRunning) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const speedMult = options?.playbackSpeed ?? 1.0;

      // 1. GOD RAYS (Phase: reveal)
      if (phase === 'reveal' && options?.enableGodRays !== false) {
        rayAngleRef.current += 0.005 * speedMult;
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.translate(cx, cy);
        ctx.rotate(rayAngleRef.current);
        const rayCount = 14;
        const rayRadius = Math.max(canvas.width, canvas.height) * 0.6;
        for (let i = 0; i < rayCount; i++) {
          const a = (Math.PI * 2 * i) / rayCount;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.arc(0, 0, rayRadius, a - 0.08, a + 0.08);
          ctx.closePath();
          const grad = ctx.createRadialGradient(0, 0, 50, 0, 0, rayRadius);
          grad.addColorStop(0, `${newTier.color}40`);
          grad.addColorStop(0.5, `${newTier.color}15`);
          grad.addColorStop(1, 'transparent');
          ctx.fillStyle = grad;
          ctx.fill();
        }
        ctx.restore();
      }

      // 2. SHOCKWAVES
      if (shockwavesRef.current.length > 0) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        shockwavesRef.current = shockwavesRef.current.filter((sw) => sw.alpha > 0.01 && sw.radius < sw.maxRadius);
        for (const sw of shockwavesRef.current) {
          ctx.beginPath();
          ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
          ctx.strokeStyle = sw.color;
          ctx.lineWidth = sw.lineWidth * (sw.radius / sw.maxRadius > 0.6 ? 1 - (sw.radius / sw.maxRadius - 0.6) * 2.5 : 1);
          ctx.globalAlpha = sw.alpha;
          ctx.stroke();

          sw.radius += sw.speed * speedMult;
          sw.alpha = Math.max(0, 1 - sw.radius / sw.maxRadius);
        }
        ctx.restore();
      }

      // 3. SHARDS
      if (shardsRef.current.length > 0) {
        ctx.save();
        shardsRef.current = shardsRef.current.filter((s) => s.alpha > 0.02);
        for (const s of shardsRef.current) {
          ctx.save();
          ctx.translate(s.cx, s.cy);
          ctx.rotate(s.rotation);
          ctx.globalAlpha = s.alpha;
          ctx.fillStyle = s.color;
          ctx.beginPath();
          ctx.moveTo(s.x1, s.y1);
          ctx.lineTo(s.x2, s.y2);
          ctx.lineTo(s.x3, s.y3);
          ctx.closePath();
          ctx.fill();

          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1;
          ctx.stroke();
          ctx.restore();

          s.cx += s.vx * speedMult;
          s.cy += s.vy * speedMult;
          s.vy += 0.15 * speedMult; // gravity
          s.rotation += s.vRot * speedMult;
          s.alpha = Math.max(0, s.alpha - s.decay * speedMult);
        }
        ctx.restore();
      }

      // 4. ENERGY PARTICLES (Tier-specific)
      if (phase === 'reveal' || phase === 'slam') {
        // Spawn continuous particles
        if (particlesRef.current.length < 55 && Math.random() < 0.45) {
          const angle = Math.random() * Math.PI * 2;
          const dist = 70 + Math.random() * 80;
          const isHighTier = newTier.tier >= 7;
          const isDiamond = newTier.tier === 5 || newTier.tier === 6;

          particlesRef.current.push({
            x: cx + Math.cos(angle) * dist,
            y: cy + Math.sin(angle) * dist,
            vx: (Math.random() - 0.5) * (isHighTier ? 2.5 : 1.2),
            vy: isHighTier ? -1.8 - Math.random() * 2.2 : (Math.random() - 0.5) * 1.5,
            size: isDiamond ? 2 + Math.random() * 3.5 : 1.5 + Math.random() * 2.5,
            alpha: 1,
            maxLife: 40 + Math.random() * 35,
            life: 0,
            color: isHighTier ? (Math.random() > 0.3 ? '#f97316' : '#ec4899') : newTier.color,
            type: isHighTier ? 'ember' : isDiamond ? 'sparkle' : 'stardust',
          });
        }
      }

      // Render & update particles
      if (particlesRef.current.length > 0) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        particlesRef.current = particlesRef.current.filter((p) => p.life < p.maxLife);
        for (const p of particlesRef.current) {
          p.life += speedMult;
          p.x += p.vx * speedMult;
          p.y += p.vy * speedMult;
          const progress = p.life / p.maxLife;
          const currentAlpha = (1 - progress) * (progress < 0.2 ? progress / 0.2 : 1);

          ctx.fillStyle = p.color;
          ctx.globalAlpha = Math.max(0, currentAlpha);

          if (p.type === 'sparkle') {
            // Cross sparkle ✦
            const sz = p.size;
            ctx.beginPath();
            ctx.moveTo(p.x - sz, p.y);
            ctx.lineTo(p.x + sz, p.y);
            ctx.moveTo(p.x, p.y - sz);
            ctx.lineTo(p.x, p.y + sz);
            ctx.strokeStyle = p.color;
            ctx.lineWidth = 1.5;
            ctx.stroke();
          } else {
            // Circular ember/stardust
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        ctx.restore();
      }

      animFrameIdRef.current = requestAnimationFrame(render);
    };

    animFrameIdRef.current = requestAnimationFrame(render);

    return () => {
      isRunning = false;
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    };
  }, [phase, newTier, oldTier, options]);

  return { shardsRef, shockwavesRef, particlesRef };
}
