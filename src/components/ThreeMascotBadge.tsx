import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Mascot } from '../types';

interface ThreeMascotBadgeProps {
  mascot: Mascot;
  isMaxLevel: boolean;
}

export const ThreeMascotBadge: React.FC<ThreeMascotBadgeProps> = ({ mascot, isMaxLevel }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<{
    animId: number;
    rotationSpeed: number;
    dragStart: number | null;
  }>({
    animId: 0,
    rotationSpeed: 0.015,
    dragStart: null,
  });

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 160;
    const height = container.clientHeight || 120;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 50);
    camera.position.set(0, 0, 4.2);

    // 2. WebGL Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    // 3. Lighting Rig
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xfff0b3, 2.5);
    dirLight1.position.set(3, 4, 3);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x00f0ff, 1.8);
    dirLight2.position.set(-3, -2, 2);
    scene.add(dirLight2);

    // 4. Celestial Trophy Group
    const trophyGroup = new THREE.Group();

    // Central Radiant Gem (Octahedron with bevelled facets)
    const gemGeo = new THREE.OctahedronGeometry(1.0, 0);
    const gemMat = new THREE.MeshStandardMaterial({
      color: isMaxLevel ? 0xffd700 : 0x38bdf8,
      metalness: 0.85,
      roughness: 0.18,
      wireframe: false,
    });
    const gemMesh = new THREE.Mesh(gemGeo, gemMat);
    trophyGroup.add(gemMesh);

    // Inner wireframe glow layer
    const wireMat = new THREE.MeshBasicMaterial({
      color: isMaxLevel ? 0xffffff : 0x00f0ff,
      wireframe: true,
      transparent: true,
      opacity: 0.45,
    });
    const wireMesh = new THREE.Mesh(gemGeo, wireMat);
    wireMesh.scale.set(1.08, 1.08, 1.08);
    trophyGroup.add(wireMesh);

    // Outer Orbiting Crown Torus Ring
    const ringGeo = new THREE.TorusGeometry(1.4, 0.04, 16, 64);
    const ringMat = new THREE.MeshStandardMaterial({
      color: isMaxLevel ? 0xf59e0b : 0xa855f7,
      metalness: 0.9,
      roughness: 0.2,
    });
    const ringMesh1 = new THREE.Mesh(ringGeo, ringMat);
    ringMesh1.rotation.x = Math.PI / 3;
    trophyGroup.add(ringMesh1);

    const ringMesh2 = new THREE.Mesh(ringGeo, ringMat);
    ringMesh2.rotation.x = -Math.PI / 3;
    ringMesh2.rotation.y = Math.PI / 4;
    trophyGroup.add(ringMesh2);

    // Floating Starlight Particles around trophy
    const particleCount = 24;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      const theta = (i / particleCount) * Math.PI * 2;
      const radius = 1.6 + (i % 3) * 0.2;
      positions[i * 3] = Math.cos(theta) * radius;
      positions[i * 3 + 1] = ((i % 4) - 1.5) * 0.4;
      positions[i * 3 + 2] = Math.sin(theta) * radius;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: isMaxLevel ? 0xffe600 : 0x38bdf8,
      size: 0.08,
      transparent: true,
      opacity: 0.85,
    });
    const particleMesh = new THREE.Points(particleGeo, particleMat);
    trophyGroup.add(particleMesh);

    scene.add(trophyGroup);

    // 5. Interactive Drag to Spin
    const domElement = renderer.domElement;
    const onPointerDown = (e: PointerEvent) => {
      animRef.current.dragStart = e.clientX;
    };
    const onPointerMove = (e: PointerEvent) => {
      if (animRef.current.dragStart === null) return;
      const deltaX = e.clientX - animRef.current.dragStart;
      trophyGroup.rotation.y += deltaX * 0.015;
      animRef.current.dragStart = e.clientX;
    };
    const onPointerUp = () => {
      animRef.current.dragStart = null;
    };

    domElement.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);

    // 6. Animation Loop
    let clock = new THREE.Clock();
    const animate = () => {
      animRef.current.animId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Continuous rotation
      trophyGroup.rotation.y += animRef.current.rotationSpeed;
      trophyGroup.rotation.x = Math.sin(elapsed * 0.8) * 0.15;
      ringMesh1.rotation.z += 0.01;
      ringMesh2.rotation.z -= 0.012;

      renderer.render(scene, camera);
    };

    animate();

    // 7. Cleanup
    return () => {
      cancelAnimationFrame(animRef.current.animId);
      domElement.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);

      scene.traverse((object) => {
        if (object instanceof THREE.Mesh || object instanceof THREE.Points) {
          if (object.geometry) object.geometry.dispose();
          if (Array.isArray(object.material)) {
            object.material.forEach((mat) => mat.dispose());
          } else if (object.material) {
            object.material.dispose();
          }
        }
      });

      renderer.dispose();
      if (domElement.parentNode) {
        domElement.parentNode.removeChild(domElement);
      }
    };
  }, [isMaxLevel, mascot.id]);

  return (
    <div className="relative w-full h-[120px] flex items-center justify-center select-none overflow-hidden rounded-2xl bg-gradient-to-b from-indigo-950/40 to-slate-950/60 border border-amber-500/30">
      <div
        ref={mountRef}
        className="w-full h-full cursor-grab active:cursor-grabbing touch-none"
        style={{ touchAction: 'none' }}
      />
      <div className="absolute bottom-1 right-2 pointer-events-none">
        <span className="text-[7.5px] font-black text-amber-300 uppercase tracking-widest bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-500/40">
          3D Interactive Trophy
        </span>
      </div>
    </div>
  );
};
