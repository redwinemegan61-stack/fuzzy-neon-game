import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Mascot } from '../types';

interface ThreeDiceStageProps {
  diceValues: [number, number];
  isRolling: boolean;
  activeMascot: Mascot;
  rollMultiplier: number;
}

// Procedurally generate high-res canvas textures for dice faces (1-6)
function createDiceFaceTexture(number: number, dotColor = '#0f172a', bgColor = '#f8fafc'): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  // Background with subtle rounded inset & metallic border
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, 256, 256);

  // Border gradient
  ctx.lineWidth = 12;
  ctx.strokeStyle = '#cbd5e1';
  ctx.strokeRect(6, 6, 244, 244);

  // Draw pips (dots)
  ctx.fillStyle = dotColor;
  const dotRadius = 22;
  const c = 128;
  const l = 68;
  const r = 188;
  const t = 68;
  const b = 188;

  const drawDot = (x: number, y: number) => {
    ctx.beginPath();
    ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
    ctx.fill();
    // Dot specular highlight
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.beginPath();
    ctx.arc(x - 5, y - 5, dotRadius * 0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = dotColor;
  };

  switch (number) {
    case 1:
      drawDot(c, c);
      break;
    case 2:
      drawDot(l, t);
      drawDot(r, b);
      break;
    case 3:
      drawDot(l, t);
      drawDot(c, c);
      drawDot(r, b);
      break;
    case 4:
      drawDot(l, t);
      drawDot(r, t);
      drawDot(l, b);
      drawDot(r, b);
      break;
    case 5:
      drawDot(l, t);
      drawDot(r, t);
      drawDot(c, c);
      drawDot(l, b);
      drawDot(r, b);
      break;
    case 6:
      drawDot(l, t);
      drawDot(r, t);
      drawDot(l, c);
      drawDot(r, c);
      drawDot(l, b);
      drawDot(r, b);
      break;
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// Order of materials for Three.js BoxGeometry: [right, left, top, bottom, front, back]
// Standard dice layout: opposite sides sum to 7 (e.g. 1 & 6, 2 & 5, 3 & 4)
function createDiceMaterials(accentColor = '#f59e0b'): THREE.Material[] {
  const t1 = createDiceFaceTexture(1, accentColor);
  const t6 = createDiceFaceTexture(6, '#0f172a');
  const t2 = createDiceFaceTexture(2, '#0f172a');
  const t5 = createDiceFaceTexture(5, '#0f172a');
  const t3 = createDiceFaceTexture(3, '#0f172a');
  const t4 = createDiceFaceTexture(4, '#0f172a');

  // Materials for [x+, x-, y+, y-, z+, z-]
  return [
    new THREE.MeshStandardMaterial({ map: t1, roughness: 0.25, metalness: 0.1 }),
    new THREE.MeshStandardMaterial({ map: t6, roughness: 0.25, metalness: 0.1 }),
    new THREE.MeshStandardMaterial({ map: t2, roughness: 0.25, metalness: 0.1 }),
    new THREE.MeshStandardMaterial({ map: t5, roughness: 0.25, metalness: 0.1 }),
    new THREE.MeshStandardMaterial({ map: t3, roughness: 0.25, metalness: 0.1 }),
    new THREE.MeshStandardMaterial({ map: t4, roughness: 0.25, metalness: 0.1 }),
  ];
}

// Target rotations (Euler angles) to face a specific number towards camera (+Z axis)
function getRotationForNumber(num: number): THREE.Euler {
  switch (num) {
    case 1:
      return new THREE.Euler(0, -Math.PI / 2, 0); // x+ faces z+
    case 6:
      return new THREE.Euler(0, Math.PI / 2, 0); // x- faces z+
    case 2:
      return new THREE.Euler(Math.PI / 2, 0, 0); // y+ faces z+
    case 5:
      return new THREE.Euler(-Math.PI / 2, 0, 0); // y- faces z+
    case 3:
      return new THREE.Euler(0, 0, 0); // z+ faces z+
    case 4:
      return new THREE.Euler(0, Math.PI, 0); // z- faces z+
    default:
      return new THREE.Euler(0, 0, 0);
  }
}

export const ThreeDiceStage: React.FC<ThreeDiceStageProps> = ({
  diceValues,
  isRolling,
  activeMascot,
  rollMultiplier,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef<{
    diceMesh1: THREE.Mesh | null;
    diceMesh2: THREE.Mesh | null;
    pedestalRing: THREE.Mesh | null;
    particleSystem: THREE.Points | null;
    scene: THREE.Scene | null;
    camera: THREE.PerspectiveCamera | null;
    renderer: THREE.WebGLRenderer | null;
    animFrameId: number;
    clock: THREE.Clock;
    isRolling: boolean;
    diceValues: [number, number];
    dragStart: { x: number; y: number } | null;
    orbitRotation: { x: number; y: number };
  }>({
    diceMesh1: null,
    diceMesh2: null,
    pedestalRing: null,
    particleSystem: null,
    scene: null,
    camera: null,
    renderer: null,
    animFrameId: 0,
    clock: new THREE.Clock(),
    isRolling: false,
    diceValues: [3, 4],
    dragStart: null,
    orbitRotation: { x: 0.35, y: 0 },
  });

  // Keep ref synchronized with incoming props
  useEffect(() => {
    stateRef.current.isRolling = isRolling;
    stateRef.current.diceValues = diceValues;
  }, [isRolling, diceValues]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 180;
    const height = container.clientHeight || 110;

    // 1. Scene & Camera Setup
    const scene = new THREE.Scene();
    stateRef.current.scene = scene;

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 2.8, 5.2);
    camera.lookAt(0, 0, 0);
    stateRef.current.camera = camera;

    // 2. WebGL Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);
    stateRef.current.renderer = renderer;

    // 3. Lighting Rig
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const primaryLight = new THREE.DirectionalLight(0xffffff, 2.2);
    primaryLight.position.set(4, 8, 5);
    primaryLight.castShadow = true;
    scene.add(primaryLight);

    const accentLightColor = new THREE.Color(activeMascot.hairColors[0] || '#00f0ff');
    const pointLight = new THREE.PointLight(accentLightColor, 3.5, 10);
    pointLight.position.set(-2, 3, 2);
    scene.add(pointLight);

    // 4. Glowing 3D Pedestal Platform
    const pedestalGroup = new THREE.Group();

    // Base cylinder
    const baseGeo = new THREE.CylinderGeometry(2.3, 2.5, 0.3, 32);
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x0a0e27,
      metalness: 0.8,
      roughness: 0.2,
    });
    const baseMesh = new THREE.Mesh(baseGeo, baseMat);
    baseMesh.position.y = -0.65;
    baseMesh.receiveShadow = true;
    pedestalGroup.add(baseMesh);

    // Glowing Hologram Torus Ring
    const ringGeo = new THREE.TorusGeometry(2.2, 0.05, 16, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: accentLightColor,
      transparent: true,
      opacity: 0.75,
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = Math.PI / 2;
    ringMesh.position.y = -0.5;
    pedestalGroup.add(ringMesh);
    stateRef.current.pedestalRing = ringMesh;

    scene.add(pedestalGroup);

    // 5. Create the Two 3D Dice Meshes
    const diceGeo = new THREE.BoxGeometry(0.85, 0.85, 0.85);

    const diceMat1 = createDiceMaterials(activeMascot.hairColors[0] || '#f59e0b');
    const diceMesh1 = new THREE.Mesh(diceGeo, diceMat1);
    diceMesh1.position.set(-0.75, 0.1, 0);
    diceMesh1.castShadow = true;
    scene.add(diceMesh1);
    stateRef.current.diceMesh1 = diceMesh1;

    const diceMat2 = createDiceMaterials('#38bdf8');
    const diceMesh2 = new THREE.Mesh(diceGeo, diceMat2);
    diceMesh2.position.set(0.75, 0.1, 0);
    diceMesh2.castShadow = true;
    scene.add(diceMesh2);
    stateRef.current.diceMesh2 = diceMesh2;

    // 6. Floating 3D Starlight Particles
    const particleCount = 35;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 5;
      positions[i * 3 + 1] = Math.random() * 3 - 0.5;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 4;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.06,
      transparent: true,
      opacity: 0.6,
    });
    const particleSystem = new THREE.Points(particleGeo, particleMat);
    scene.add(particleSystem);
    stateRef.current.particleSystem = particleSystem;

    // 7. Touch / Drag Interaction for 3D Camera Tilt
    const handlePointerDown = (e: PointerEvent) => {
      stateRef.current.dragStart = { x: e.clientX, y: e.clientY };
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!stateRef.current.dragStart) return;
      const dx = (e.clientX - stateRef.current.dragStart.x) * 0.005;
      const dy = (e.clientY - stateRef.current.dragStart.y) * 0.005;
      stateRef.current.orbitRotation.y += dx;
      stateRef.current.orbitRotation.x = Math.max(0.15, Math.min(0.75, stateRef.current.orbitRotation.x + dy));
      stateRef.current.dragStart = { x: e.clientX, y: e.clientY };
    };

    const handlePointerUp = () => {
      stateRef.current.dragStart = null;
    };

    const domElement = renderer.domElement;
    domElement.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);

    // 8. Animation & Render Loop
    let rollAngle1 = 0;
    let rollAngle2 = 0;

    const animate = () => {
      stateRef.current.animFrameId = requestAnimationFrame(animate);
      const elapsedTime = stateRef.current.clock.getElapsedTime();

      // Camera positioning based on orbit controls
      const dist = 5.2;
      const ox = stateRef.current.orbitRotation.x;
      const oy = stateRef.current.orbitRotation.y;
      camera.position.x = Math.sin(oy) * Math.cos(ox) * dist;
      camera.position.y = Math.sin(ox) * dist;
      camera.position.z = Math.cos(oy) * Math.cos(ox) * dist;
      camera.lookAt(0, 0, 0);

      // Rotate Hologram ring gently
      if (ringMesh) {
        ringMesh.rotation.z += 0.01;
      }

      // Floating dust particles animation
      if (particleSystem) {
        const posAttr = particleSystem.geometry.attributes.position as THREE.BufferAttribute;
        for (let i = 0; i < particleCount; i++) {
          let y = posAttr.getY(i) + 0.008;
          if (y > 3) y = -0.5;
          posAttr.setY(i, y);
        }
        posAttr.needsUpdate = true;
      }

      // Dice Dynamic 3D Rolling vs Settled Physics
      if (stateRef.current.isRolling) {
        rollAngle1 += 0.28;
        rollAngle2 += 0.32;

        if (diceMesh1) {
          diceMesh1.rotation.x = rollAngle1 * 1.8;
          diceMesh1.rotation.y = rollAngle1 * 2.3;
          diceMesh1.rotation.z = rollAngle1 * 1.2;
          diceMesh1.position.y = 0.5 + Math.abs(Math.sin(rollAngle1 * 2)) * 0.45;
        }

        if (diceMesh2) {
          diceMesh2.rotation.x = rollAngle2 * 2.1;
          diceMesh2.rotation.y = -rollAngle2 * 1.7;
          diceMesh2.rotation.z = rollAngle2 * 2.5;
          diceMesh2.position.y = 0.5 + Math.abs(Math.sin(rollAngle2 * 2)) * 0.45;
        }
      } else {
        // Smoothly settle and align faces to target dice numbers
        const targetRot1 = getRotationForNumber(stateRef.current.diceValues[0]);
        const targetRot2 = getRotationForNumber(stateRef.current.diceValues[1]);

        if (diceMesh1) {
          diceMesh1.rotation.x = THREE.MathUtils.lerp(diceMesh1.rotation.x, targetRot1.x, 0.15);
          diceMesh1.rotation.y = THREE.MathUtils.lerp(diceMesh1.rotation.y, targetRot1.y, 0.15);
          diceMesh1.rotation.z = THREE.MathUtils.lerp(diceMesh1.rotation.z, targetRot1.z, 0.15);
          // Subtle idle levitation
          diceMesh1.position.y = THREE.MathUtils.lerp(diceMesh1.position.y, 0.1 + Math.sin(elapsedTime * 2.5) * 0.05, 0.1);
        }

        if (diceMesh2) {
          diceMesh2.rotation.x = THREE.MathUtils.lerp(diceMesh2.rotation.x, targetRot2.x, 0.15);
          diceMesh2.rotation.y = THREE.MathUtils.lerp(diceMesh2.rotation.y, targetRot2.y, 0.15);
          diceMesh2.rotation.z = THREE.MathUtils.lerp(diceMesh2.rotation.z, targetRot2.z, 0.15);
          // Subtle idle levitation with phase offset
          diceMesh2.position.y = THREE.MathUtils.lerp(diceMesh2.position.y, 0.1 + Math.sin(elapsedTime * 2.5 + 1.2) * 0.05, 0.1);
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    // 9. Resize Handling
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth || 180;
      const h = container.clientHeight || 110;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    // 10. Clean Cleanup on Unmount
    return () => {
      cancelAnimationFrame(stateRef.current.animFrameId);
      resizeObserver.disconnect();
      domElement.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);

      // Dispose geometries, materials, textures, renderer
      diceGeo.dispose();
      diceMat1.forEach((m) => {
        const mat = m as THREE.MeshStandardMaterial;
        if (mat.map) mat.map.dispose();
        m.dispose();
      });
      diceMat2.forEach((m) => {
        const mat = m as THREE.MeshStandardMaterial;
        if (mat.map) mat.map.dispose();
        m.dispose();
      });
      baseGeo.dispose();
      baseMat.dispose();
      ringGeo.dispose();
      ringMat.dispose();
      particleGeo.dispose();
      particleMat.dispose();

      renderer.dispose();
      if (domElement.parentNode) {
        domElement.parentNode.removeChild(domElement);
      }
    };
  }, [activeMascot.id]);

  return (
    <div className="relative w-full h-[105px] flex items-center justify-center select-none overflow-hidden rounded-xl">
      {/* 3D WebGL Canvas Mount */}
      <div
        ref={mountRef}
        className="w-full h-full cursor-grab active:cursor-grabbing touch-none"
        style={{ touchAction: 'none' }}
      />

      {/* 3D Badge Indicator Overlay */}
      <div className="absolute top-1 right-2 pointer-events-none">
        <span className="text-[8px] font-black tracking-widest text-cyan-300 bg-cyan-950/80 px-1.5 py-0.5 rounded border border-cyan-400/40 uppercase shadow-xs">
          3D WebGL
        </span>
      </div>

      {/* Drag Hint */}
      <div className="absolute bottom-0.5 left-2 pointer-events-none">
        <span className="text-[7.5px] font-bold text-slate-400/80 uppercase tracking-wider">
          Drag to orbit 3D view
        </span>
      </div>
    </div>
  );
};
