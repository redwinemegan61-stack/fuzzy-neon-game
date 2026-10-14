import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Mascot, MascotBurrow } from '../types';
import { MAX_MASCOT_LEVEL } from '../utils/mascotLeveling';

interface ThreeBurrowDioramaProps {
  mascot: Mascot;
  burrow?: MascotBurrow;
}

export const ThreeBurrowDiorama: React.FC<ThreeBurrowDioramaProps> = ({ mascot, burrow }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef<{
    animId: number;
    clock: THREE.Clock;
    dragStart: { x: number; y: number } | null;
    orbitRotation: { theta: number; phi: number; distance: number };
  }>({
    animId: 0,
    clock: new THREE.Clock(),
    dragStart: null,
    orbitRotation: { theta: 0.75, phi: 0.55, distance: 9.5 },
  });

  const isMaxLevel = mascot.level >= MAX_MASCOT_LEVEL;

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 320;
    const height = container.clientHeight || 260;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x060919);

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);

    // 2. WebGL Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // 3. Lighting Rig
    const ambientLight = new THREE.AmbientLight(0x2d3748, 1.8);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfff5e6, 2.0);
    sunLight.position.set(6, 12, 8);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    scene.add(sunLight);

    // Cozy Fireplace / Lantern Warm Point Light
    const hearthLight = new THREE.PointLight(0xffaa33, 3.2, 8);
    hearthLight.position.set(-2, 1.2, -1.8);
    hearthLight.castShadow = true;
    scene.add(hearthLight);

    // Celestial Max-Level Light if Max Level
    let celestialLight: THREE.PointLight | null = null;
    if (isMaxLevel) {
      celestialLight = new THREE.PointLight(0xffe600, 4.0, 10);
      celestialLight.position.set(0, 2.5, 0);
      scene.add(celestialLight);
    }

    // 4. Room Construction: Isometric Cutaway Box
    const roomGroup = new THREE.Group();

    // Floor
    const floorGeo = new THREE.BoxGeometry(6, 0.3, 6);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x3d271d, // warm wood
      roughness: 0.6,
      metalness: 0.1,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.position.y = -0.15;
    floor.receiveShadow = true;
    roomGroup.add(floor);

    // Back Left Wall
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x1e1b4b, // cozy twilight indigo
      roughness: 0.85,
    });
    const wallGeoZ = new THREE.BoxGeometry(6, 4, 0.3);
    const backWall = new THREE.Mesh(wallGeoZ, wallMat);
    backWall.position.set(0, 2, -3);
    backWall.receiveShadow = true;
    roomGroup.add(backWall);

    // Back Right Wall
    const wallGeoX = new THREE.BoxGeometry(0.3, 4, 6);
    const leftWall = new THREE.Mesh(wallGeoX, wallMat);
    leftWall.position.set(-3, 2, 0);
    leftWall.receiveShadow = true;
    roomGroup.add(leftWall);

    // Round Glowing Starlight Window
    const windowRingGeo = new THREE.TorusGeometry(0.9, 0.08, 16, 32);
    const windowRingMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.4 });
    const windowFrame = new THREE.Mesh(windowRingGeo, windowRingMat);
    windowFrame.position.set(0, 2.5, -2.84);
    roomGroup.add(windowFrame);

    const windowGlassGeo = new THREE.CircleGeometry(0.85, 32);
    const windowGlassMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const windowGlass = new THREE.Mesh(windowGlassGeo, windowGlassMat);
    windowGlass.position.set(0, 2.5, -2.83);
    roomGroup.add(windowGlass);

    // 5. 3D Furniture Pieces

    // Cozy Plush Bed
    const bedGroup = new THREE.Group();
    const bedFrame = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 0.4, 2.4),
      new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.5 })
    );
    bedFrame.position.set(0, 0.2, 0);
    bedFrame.castShadow = true;
    bedGroup.add(bedFrame);

    const mattress = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, 0.3, 2.2),
      new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.9 })
    );
    mattress.position.set(0, 0.45, 0);
    bedGroup.add(mattress);

    const pillow = new THREE.Mesh(
      new THREE.BoxGeometry(1.1, 0.2, 0.6),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 })
    );
    pillow.position.set(0, 0.65, -0.7);
    bedGroup.add(pillow);

    bedGroup.position.set(-1.8, 0, 1.4);
    roomGroup.add(bedGroup);

    // Cozy Fireplace Hearth
    const hearth = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, 1.5, 0.8),
      new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.9 })
    );
    hearth.position.set(-2, 0.75, -2.4);
    hearth.castShadow = true;
    roomGroup.add(hearth);

    // Fluffy Round Rug
    const rug = new THREE.Mesh(
      new THREE.CylinderGeometry(1.4, 1.4, 0.05, 32),
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(mascot.hairColors[0] || '#f59e0b'),
        roughness: 0.95,
      })
    );
    rug.position.set(0.6, 0.02, 0.2);
    rug.receiveShadow = true;
    roomGroup.add(rug);

    // Work / Treasure Desk
    const desk = new THREE.Mesh(
      new THREE.BoxGeometry(1.8, 0.8, 0.9),
      new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.4 })
    );
    desk.position.set(1.8, 0.4, -2.2);
    desk.castShadow = true;
    roomGroup.add(desk);

    // Glowing Crystal Lamp on Desk
    const lampGeo = new THREE.OctahedronGeometry(0.2, 0);
    const lampMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    const lamp = new THREE.Mesh(lampGeo, lampMat);
    lamp.position.set(2.2, 1.0, -2.2);
    roomGroup.add(lamp);

    // 6. Max-Level Celestial Crown Shrine (Center of Room if Max Level)
    let crownShrine: THREE.Group | null = null;
    if (isMaxLevel) {
      crownShrine = new THREE.Group();

      // Pedestal column
      const colGeo = new THREE.CylinderGeometry(0.35, 0.45, 0.8, 16);
      const colMat = new THREE.MeshStandardMaterial({
        color: 0x1e293b,
        metalness: 0.8,
        roughness: 0.2,
      });
      const col = new THREE.Mesh(colGeo, colMat);
      col.position.y = 0.4;
      crownShrine.add(col);

      // Rotating Golden Crown Crystal
      const crystalGeo = new THREE.IcosahedronGeometry(0.35, 0);
      const crystalMat = new THREE.MeshStandardMaterial({
        color: 0xffd700,
        metalness: 0.95,
        roughness: 0.1,
      });
      const crystal = new THREE.Mesh(crystalGeo, crystalMat);
      crystal.position.y = 1.05;
      crownShrine.add(crystal);

      // Floating Torus Halo
      const haloGeo = new THREE.TorusGeometry(0.5, 0.03, 16, 32);
      const haloMat = new THREE.MeshBasicMaterial({ color: 0xffe600 });
      const halo = new THREE.Mesh(haloGeo, haloMat);
      halo.position.y = 1.05;
      halo.rotation.x = Math.PI / 2;
      crownShrine.add(halo);

      crownShrine.position.set(0.6, 0, 0.2);
      roomGroup.add(crownShrine);
    }

    scene.add(roomGroup);

    // 7. Interactive Orbit Drag Controls
    const domElement = renderer.domElement;
    const onPointerDown = (e: PointerEvent) => {
      stateRef.current.dragStart = { x: e.clientX, y: e.clientY };
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!stateRef.current.dragStart) return;
      const dx = (e.clientX - stateRef.current.dragStart.x) * 0.007;
      const dy = (e.clientY - stateRef.current.dragStart.y) * 0.005;

      stateRef.current.orbitRotation.theta += dx;
      stateRef.current.orbitRotation.phi = Math.max(
        0.2,
        Math.min(1.2, stateRef.current.orbitRotation.phi + dy)
      );

      stateRef.current.dragStart = { x: e.clientX, y: e.clientY };
    };

    const onPointerUp = () => {
      stateRef.current.dragStart = null;
    };

    domElement.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    // 8. Animation Loop
    const animate = () => {
      stateRef.current.animId = requestAnimationFrame(animate);
      const elapsed = stateRef.current.clock.getElapsedTime();

      // Camera positioning from spherical orbit coordinates
      const { theta, phi, distance } = stateRef.current.orbitRotation;
      camera.position.x = distance * Math.sin(theta) * Math.cos(phi);
      camera.position.y = distance * Math.sin(phi);
      camera.position.z = distance * Math.cos(theta) * Math.cos(phi);
      camera.lookAt(0, 1.2, 0);

      // Fireplace subtle flame flicker
      hearthLight.intensity = 3.0 + Math.sin(elapsed * 8) * 0.4 + Math.cos(elapsed * 12) * 0.2;

      // Rotate Max Level Trophy
      if (crownShrine) {
        crownShrine.rotation.y += 0.02;
        const crystal = crownShrine.children[1];
        if (crystal) {
          crystal.position.y = 1.05 + Math.sin(elapsed * 3) * 0.06;
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    // 9. Resize Handling
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth || 320;
      const h = container.clientHeight || 260;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    // 10. Cleanup
    return () => {
      cancelAnimationFrame(stateRef.current.animId);
      resizeObserver.disconnect();
      domElement.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);

      floorGeo.dispose();
      floorMat.dispose();
      wallGeoZ.dispose();
      wallGeoX.dispose();
      wallMat.dispose();
      renderer.dispose();
      if (domElement.parentNode) {
        domElement.parentNode.removeChild(domElement);
      }
    };
  }, [mascot.id, isMaxLevel]);

  return (
    <div className="relative w-full h-[260px] rounded-3xl overflow-hidden border-2 border-indigo-900/60 shadow-2xl bg-slate-950">
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* 3D Diorama Header Overlay */}
      <div className="absolute top-2.5 left-3 flex items-center gap-2 pointer-events-none">
        <span className="text-[9px] font-black uppercase tracking-wider text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded-full border border-cyan-400/40 shadow-sm flex items-center gap-1">
          <span>🎮 3D Burrow Diorama</span>
        </span>
        {isMaxLevel && (
          <span className="text-[9px] font-black uppercase tracking-wider text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded-full border border-amber-400/50 shadow-[0_0_12px_rgba(251,191,36,0.5)] flex items-center gap-1">
            <span>👑 Celestial Glow Active</span>
          </span>
        )}
      </div>

      {/* Orbit Tip */}
      <div className="absolute bottom-2 right-3 pointer-events-none">
        <span className="text-[8px] font-bold text-slate-400/90 bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800 uppercase tracking-wider">
          Drag to orbit 360°
        </span>
      </div>
    </div>
  );
};
