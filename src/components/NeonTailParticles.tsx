import React, { useEffect, useRef } from 'react';
import { Mascot } from '../types';

interface NeonTailParticlesProps {
  currentTileIndex: number;
  isRolling: boolean;
  activeMascot: Mascot;
}

// 5x5 grid perimeter tile mapping (0 to 15 clockwise)
export const TILE_GRID_POSITIONS: Record<number, { col: number; row: number; dir: 'right' | 'down' | 'left' | 'up' }> = {
  0: { col: 0, row: 0, dir: 'right' },
  1: { col: 1, row: 0, dir: 'right' },
  2: { col: 2, row: 0, dir: 'right' },
  3: { col: 3, row: 0, dir: 'right' },
  4: { col: 4, row: 0, dir: 'down' },
  5: { col: 4, row: 1, dir: 'down' },
  6: { col: 4, row: 2, dir: 'down' },
  7: { col: 4, row: 3, dir: 'down' },
  8: { col: 4, row: 4, dir: 'left' },
  9: { col: 3, row: 4, dir: 'left' },
  10: { col: 2, row: 4, dir: 'left' },
  11: { col: 1, row: 4, dir: 'left' },
  12: { col: 0, row: 4, dir: 'up' },
  13: { col: 0, row: 3, dir: 'up' },
  14: { col: 0, row: 2, dir: 'up' },
  15: { col: 0, row: 1, dir: 'right' },
};

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  maxSize: number;
  alpha: number;
  life: number;
  maxLife: number;
  color: string;
  type: 'spark' | 'star' | 'plasma' | 'ember';
  rotation: number;
  rotationSpeed: number;
}

interface Shockwave {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
  color: string;
}

interface TrailNode {
  x: number;
  y: number;
  alpha: number;
  size: number;
  color: string;
  timestamp: number;
}

export const NeonTailParticles: React.FC<NeonTailParticlesProps> = ({
  currentTileIndex,
  isRolling,
  activeMascot,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const prevTileRef = useRef<number>(currentTileIndex);

  // Mutable particle system storage
  const stateRef = useRef<{
    particles: Particle[];
    shockwaves: Shockwave[];
    trailHistory: TrailNode[];
    animId: number;
    lastTime: number;
    currentPos: { x: number; y: number };
    targetPos: { x: number; y: number };
    displayPos: { x: number; y: number };
  }>({
    particles: [],
    shockwaves: [],
    trailHistory: [],
    animId: 0,
    lastTime: performance.now(),
    currentPos: { x: 0, y: 0 },
    targetPos: { x: 0, y: 0 },
    displayPos: { x: 0, y: 0 },
  });

  // Determine neon color palette based on active mascot
  const primaryNeon = activeMascot.hairColors?.[0] || activeMascot.furColor || '#00f0ff';
  const secondaryNeon = activeMascot.hairColors?.[1] || '#ff007f';
  const tertiaryNeon = '#ffe600';

  // Helper to get pixel coordinates on canvas for a tile index
  const getTileCenter = (tileIdx: number, width: number, height: number) => {
    const info = TILE_GRID_POSITIONS[tileIdx] || TILE_GRID_POSITIONS[0];
    return {
      x: ((info.col + 0.5) / 5) * width,
      y: ((info.row + 0.5) / 5) * height,
      dir: info.dir,
    };
  };

  // Helper to spawn a burst of neon tail particles
  const spawnTailParticles = (
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    dir: 'right' | 'down' | 'left' | 'up',
    count: number,
    intensity: number
  ) => {
    const particles = stateRef.current.particles;
    const colors = [primaryNeon, secondaryNeon, tertiaryNeon, '#ffffff'];

    // Direction vector opposite to movement for tail trailing effect
    let baseAngle = Math.PI; // default for moving right: trail shoots left
    if (dir === 'right') baseAngle = Math.PI;
    else if (dir === 'down') baseAngle = -Math.PI / 2; // trail shoots up
    else if (dir === 'left') baseAngle = 0; // trail shoots right
    else if (dir === 'up') baseAngle = Math.PI / 2; // trail shoots down

    for (let i = 0; i < count; i++) {
      // Interpolate along the hop line from previous to target
      const t = Math.random();
      const spawnX = fromX + (toX - fromX) * t + (Math.random() - 0.5) * 12;
      const spawnY = fromY + (toY - fromY) * t + (Math.random() - 0.5) * 12;

      // Particle velocity shoots backwards in a cone with random spread
      const angle = baseAngle + (Math.random() - 0.5) * 1.5;
      const speed = (Math.random() * 2.8 + 1.2) * intensity;
      const maxLife = Math.floor(Math.random() * 28 + 24);

      const typeRoll = Math.random();
      const type: 'spark' | 'star' | 'plasma' | 'ember' =
        typeRoll < 0.4 ? 'spark' : typeRoll < 0.7 ? 'star' : typeRoll < 0.9 ? 'ember' : 'plasma';

      const color = colors[Math.floor(Math.random() * colors.length)];
      const size = type === 'plasma' ? Math.random() * 8 + 6 : Math.random() * 4.5 + 2.5;

      particles.push({
        x: spawnX,
        y: spawnY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size,
        maxSize: size,
        alpha: 1.0,
        life: 0,
        maxLife,
        color,
        type,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.2,
      });
    }

    // Add shockwave at landing tile
    stateRef.current.shockwaves.push({
      x: toX,
      y: toY,
      radius: 6,
      maxRadius: 36,
      alpha: 0.9,
      color: primaryNeon,
    });
  };

  // Watch for tile changes and trigger animated tail bursts
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const w = canvas.width;
    const h = canvas.height;
    if (w === 0 || h === 0) return;

    const prevIdx = prevTileRef.current;
    const currentIdx = currentTileIndex;

    const fromCenter = getTileCenter(prevIdx, w, h);
    const toCenter = getTileCenter(currentIdx, w, h);

    stateRef.current.targetPos = { x: toCenter.x, y: toCenter.y };

    if (prevIdx !== currentIdx) {
      // Spawn burst of vibrant particles
      spawnTailParticles(
        fromCenter.x,
        fromCenter.y,
        toCenter.x,
        toCenter.y,
        fromCenter.dir,
        isRolling ? 30 : 20,
        isRolling ? 1.4 : 1.0
      );

      // Add to trail history
      stateRef.current.trailHistory.push({
        x: toCenter.x,
        y: toCenter.y,
        alpha: 1.0,
        size: 16,
        color: primaryNeon,
        timestamp: performance.now(),
      });

      // Keep only recent 8 nodes
      if (stateRef.current.trailHistory.length > 8) {
        stateRef.current.trailHistory.shift();
      }

      prevTileRef.current = currentIdx;
    }
  }, [currentTileIndex, isRolling, primaryNeon]);

  // Main 60fps Particle Animation Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let isRunning = true;

    // Resize canvas to match display size
    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.resetTransform();
      ctx.scale(dpr, dpr);

      const initialCenter = getTileCenter(currentTileIndex, rect.width, rect.height);
      stateRef.current.currentPos = { x: initialCenter.x, y: initialCenter.y };
      stateRef.current.targetPos = { x: initialCenter.x, y: initialCenter.y };
      stateRef.current.displayPos = { x: initialCenter.x, y: initialCenter.y };
    };

    resizeCanvas();
    const ro = new ResizeObserver(resizeCanvas);
    ro.observe(canvas);

    // Animation frame step
    const render = (time: number) => {
      if (!isRunning) return;

      const rect = canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;

      ctx.clearRect(0, 0, width, height);

      // Smooth lerp display position towards target
      const s = stateRef.current;
      const lerpSpeed = isRolling ? 0.35 : 0.25;
      s.displayPos.x += (s.targetPos.x - s.displayPos.x) * lerpSpeed;
      s.displayPos.y += (s.targetPos.y - s.displayPos.y) * lerpSpeed;

      // 1. Continuous emission while rolling or gentle idle wisps
      const currentTileInfo = TILE_GRID_POSITIONS[currentTileIndex] || TILE_GRID_POSITIONS[0];
      if (isRolling) {
        // Continuous neon trail streamer particles while mascot is moving
        if (Math.random() < 0.75) {
          const colors = [primaryNeon, secondaryNeon, '#ffffff'];
          const angle =
            currentTileInfo.dir === 'right'
              ? Math.PI + (Math.random() - 0.5) * 0.9
              : currentTileInfo.dir === 'down'
              ? -Math.PI / 2 + (Math.random() - 0.5) * 0.9
              : currentTileInfo.dir === 'left'
              ? 0 + (Math.random() - 0.5) * 0.9
              : Math.PI / 2 + (Math.random() - 0.5) * 0.9;

          const speed = Math.random() * 2.5 + 1.2;
          s.particles.push({
            x: s.displayPos.x + (Math.random() - 0.5) * 8,
            y: s.displayPos.y + (Math.random() - 0.5) * 8,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            size: Math.random() * 4 + 2,
            maxSize: Math.random() * 4 + 2,
            alpha: 0.95,
            life: 0,
            maxLife: Math.floor(Math.random() * 22 + 18),
            color: colors[Math.floor(Math.random() * colors.length)],
            type: Math.random() < 0.6 ? 'spark' : 'star',
            rotation: Math.random() * Math.PI,
            rotationSpeed: (Math.random() - 0.5) * 0.2,
          });
        }
      } else {
        // Gentle ambient neon sparkles around active mascot pawn
        if (Math.random() < 0.12) {
          const orbitAngle = Math.random() * Math.PI * 2;
          const radius = Math.random() * 14 + 10;
          s.particles.push({
            x: s.displayPos.x + Math.cos(orbitAngle) * radius,
            y: s.displayPos.y + Math.sin(orbitAngle) * radius,
            vx: -Math.sin(orbitAngle) * 0.4 + (Math.random() - 0.5) * 0.2,
            vy: Math.cos(orbitAngle) * 0.4 - 0.3,
            size: Math.random() * 2.8 + 1.5,
            maxSize: Math.random() * 2.8 + 1.5,
            alpha: 0.7,
            life: 0,
            maxLife: Math.floor(Math.random() * 35 + 25),
            color: primaryNeon,
            type: 'ember',
            rotation: 0,
            rotationSpeed: 0.05,
          });
        }
      }

      ctx.save();
      ctx.globalCompositeOperation = 'lighter';

      // 2. Render Glowing Neon Trail Ribbon (connecting recent trail nodes)
      if (s.trailHistory.length > 1) {
        ctx.beginPath();
        ctx.moveTo(s.trailHistory[0].x, s.trailHistory[0].y);
        for (let i = 1; i < s.trailHistory.length; i++) {
          const prev = s.trailHistory[i - 1];
          const curr = s.trailHistory[i];
          const midX = (prev.x + curr.x) / 2;
          const midY = (prev.y + curr.y) / 2;
          ctx.quadraticCurveTo(prev.x, prev.y, midX, midY);
        }
        ctx.lineTo(s.displayPos.x, s.displayPos.y);

        ctx.strokeStyle = primaryNeon;
        ctx.lineWidth = isRolling ? 6 : 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.shadowColor = primaryNeon;
        ctx.shadowBlur = 14;
        ctx.globalAlpha = isRolling ? 0.65 : 0.35;
        ctx.stroke();

        // Inner white-hot neon laser core
        ctx.lineWidth = isRolling ? 2 : 1;
        ctx.strokeStyle = '#ffffff';
        ctx.shadowBlur = 6;
        ctx.globalAlpha = isRolling ? 0.85 : 0.4;
        ctx.stroke();
      }

      // Age trail history
      for (let i = s.trailHistory.length - 1; i >= 0; i--) {
        const node = s.trailHistory[i];
        node.alpha -= 0.015;
        if (node.alpha <= 0) {
          s.trailHistory.splice(i, 1);
        }
      }

      // 3. Render Shockwaves
      for (let i = s.shockwaves.length - 1; i >= 0; i--) {
        const sw = s.shockwaves[i];
        sw.radius += (sw.maxRadius - sw.radius) * 0.14;
        sw.alpha -= 0.035;

        if (sw.alpha <= 0) {
          s.shockwaves.splice(i, 1);
          continue;
        }

        ctx.beginPath();
        ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
        ctx.strokeStyle = sw.color;
        ctx.lineWidth = 2.5;
        ctx.shadowColor = sw.color;
        ctx.shadowBlur = 12;
        ctx.globalAlpha = sw.alpha;
        ctx.stroke();
      }

      // 4. Render and Update Neon Tail Particles
      for (let i = s.particles.length - 1; i >= 0; i--) {
        const p = s.particles[i];
        p.life++;
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.94; // subtle friction
        p.vy *= 0.94;
        p.rotation += p.rotationSpeed;

        const progress = p.life / p.maxLife;
        p.alpha = Math.max(0, (1 - progress) * 0.95);
        p.size = p.maxSize * (1 - progress * 0.5);

        if (p.life >= p.maxLife || p.alpha <= 0) {
          s.particles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = p.type === 'plasma' ? 14 : 8;

        if (p.type === 'spark' || p.type === 'ember') {
          ctx.beginPath();
          ctx.arc(0, 0, p.size, 0, Math.PI * 2);
          ctx.fill();

          // White center core
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(0, 0, p.size * 0.45, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.type === 'star') {
          // 4-point shining star
          const sRad = p.size * 1.4;
          ctx.beginPath();
          ctx.moveTo(0, -sRad);
          ctx.quadraticCurveTo(0, 0, sRad, 0);
          ctx.quadraticCurveTo(0, 0, 0, sRad);
          ctx.quadraticCurveTo(0, 0, -sRad, 0);
          ctx.quadraticCurveTo(0, 0, 0, -sRad);
          ctx.closePath();
          ctx.fill();

          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(0, 0, p.size * 0.35, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.type === 'plasma') {
          // Soft glowing plasma orb
          const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, p.size);
          grad.addColorStop(0, '#ffffff');
          grad.addColorStop(0.35, p.color);
          grad.addColorStop(1, 'transparent');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(0, 0, p.size, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }

      ctx.restore();

      s.animId = requestAnimationFrame(render);
    };

    stateRef.current.animId = requestAnimationFrame(render);

    return () => {
      isRunning = false;
      cancelAnimationFrame(stateRef.current.animId);
      ro.disconnect();
    };
  }, [currentTileIndex, isRolling, primaryNeon, secondaryNeon, tertiaryNeon]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-20"
      aria-hidden="true"
    />
  );
};
