import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Mascot, MascotBurrow } from '../types';
import { MAX_MASCOT_LEVEL } from '../utils/mascotLeveling';
import { SoundEngine } from '../utils/sound';
import {
  Flame, Sun, Moon, Sparkles, Heart, RotateCw, Home,
  Compass, Eye, Check, ChevronRight
} from 'lucide-react';

interface StandaloneThreeBoroughProps {
  mascot: Mascot;
  allMascots?: Mascot[];
  burrow?: MascotBurrow;
  onSelectActiveMascot?: (mascotId: string) => void;
  playerCoins?: number;
}

export const StandaloneThreeBorough: React.FC<StandaloneThreeBoroughProps> = ({
  mascot,
  allMascots = [],
  burrow,
  onSelectActiveMascot,
  playerCoins = 0,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);

  // Ambiance and Interaction States
  const [lightingPreset, setLightingPreset] = useState<'hearth' | 'twilight' | 'sun'>('hearth');
  const [isFireplaceOn, setIsFireplaceOn] = useState(true);
  const [cameraPreset, setCameraPreset] = useState<'overview' | 'mascot' | 'fireplace' | 'desk'>('overview');
  const [isAutoRotate, setIsAutoRotate] = useState(false);
  const [pettingCount, setPettingCount] = useState(0);
  const [showPetHeartToast, setShowPetHeartToast] = useState(false);

  const isMaxLevel = mascot.level >= MAX_MASCOT_LEVEL;

  // Internal mutable Three.js refs
  const stateRef = useRef<{
    scene: THREE.Scene | null;
    camera: THREE.PerspectiveCamera | null;
    renderer: THREE.WebGLRenderer | null;
    animId: number;
    clock: THREE.Clock;
    dragStart: { x: number; y: number } | null;
    orbit: { theta: number; phi: number; distance: number; target: THREE.Vector3 };
    hearthLight: THREE.PointLight | null;
    crownShrine: THREE.Group | null;
    mascotMesh: THREE.Group | null;
    heartParticles: THREE.Points | null;
    emberParticles: THREE.Points | null;
    isPettingAnim: number;
    raycaster: THREE.Raycaster;
    mouse: THREE.Vector2;
    mascotHitBox: THREE.Mesh | null;
  }>({
    scene: null,
    camera: null,
    renderer: null,
    animId: 0,
    clock: new THREE.Clock(),
    dragStart: null,
    orbit: { theta: 0.65, phi: 0.42, distance: 8.8, target: new THREE.Vector3(0, 1.2, 0) },
    hearthLight: null,
    crownShrine: null,
    mascotMesh: null,
    heartParticles: null,
    emberParticles: null,
    isPettingAnim: 0,
    raycaster: new THREE.Raycaster(),
    mouse: new THREE.Vector2(-999, -999),
    mascotHitBox: null,
  });

  // Switch camera based on view preset
  useEffect(() => {
    const s = stateRef.current;
    if (cameraPreset === 'overview') {
      s.orbit.distance = 9.2;
      s.orbit.phi = 0.46;
      s.orbit.target.set(0, 1.2, 0);
    } else if (cameraPreset === 'mascot') {
      s.orbit.distance = 4.8;
      s.orbit.phi = 0.32;
      s.orbit.target.set(0.4, 0.7, 0.2);
    } else if (cameraPreset === 'fireplace') {
      s.orbit.distance = 5.2;
      s.orbit.phi = 0.38;
      s.orbit.target.set(-2.2, 1.0, -1.8);
    } else if (cameraPreset === 'desk') {
      s.orbit.distance = 5.0;
      s.orbit.phi = 0.42;
      s.orbit.target.set(2.2, 1.0, -1.8);
    }
  }, [cameraPreset]);

  // Main Three.js Lifecycle
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 360;
    const height = container.clientHeight || 420;

    // 1. Scene & Camera Setup
    const scene = new THREE.Scene();
    stateRef.current.scene = scene;

    const bgColors = {
      hearth: 0x09070f,
      twilight: 0x0c0c1e,
      sun: 0x1a2130,
    };
    scene.background = new THREE.Color(bgColors[lightingPreset]);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 80);
    camera.position.set(0, 3.5, 7.5);
    camera.lookAt(0, 1.2, 0);
    stateRef.current.camera = camera;

    // 2. WebGL Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);
    stateRef.current.renderer = renderer;

    // 3. Lighting Rig (Cozy Interior Ambiance)
    const ambientLight = new THREE.AmbientLight(
      lightingPreset === 'sun' ? 0xffffff : lightingPreset === 'twilight' ? 0x6366f1 : 0xffedd5,
      lightingPreset === 'sun' ? 2.2 : lightingPreset === 'twilight' ? 1.6 : 1.8
    );
    scene.add(ambientLight);

    // Directional Window Light
    const windowLight = new THREE.DirectionalLight(
      lightingPreset === 'sun' ? 0xfef08a : lightingPreset === 'twilight' ? 0x818cf8 : 0xfbcfe8,
      lightingPreset === 'sun' ? 3.0 : 1.6
    );
    windowLight.position.set(0, 4, -4);
    windowLight.castShadow = true;
    windowLight.shadow.mapSize.width = 1024;
    windowLight.shadow.mapSize.height = 1024;
    scene.add(windowLight);

    // Fireplace Point Light
    const hearthLight = new THREE.PointLight(0xff7700, isFireplaceOn ? 3.8 : 0.2, 9.0);
    hearthLight.position.set(-2.2, 1.1, -1.8);
    hearthLight.castShadow = true;
    scene.add(hearthLight);
    stateRef.current.hearthLight = hearthLight;

    // Soft Overhead Lamp Chain
    const overheadLamp = new THREE.PointLight(0xfff3a1, 1.6, 8.0);
    overheadLamp.position.set(0, 3.2, 0);
    scene.add(overheadLamp);

    // 4. STANDALONE 3D BOROUGH ARCHITECTURAL SANCTUARY (NO cutaway!)
    const roomGroup = new THREE.Group();

    // Polished Hardwood Floor
    const floorGeo = new THREE.BoxGeometry(6.4, 0.3, 6.4);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x3e2723, // Warm dark oak
      roughness: 0.55,
      metalness: 0.1,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.position.y = -0.15;
    floor.receiveShadow = true;
    roomGroup.add(floor);

    // Architectural Walls (Rear Wall, Left Wall, Right Wall, Beams)
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x1e1e38, // Deep twilight stone
      roughness: 0.85,
    });

    // Rear Wall
    const rearWall = new THREE.Mesh(new THREE.BoxGeometry(6.4, 4.2, 0.3), wallMat);
    rearWall.position.set(0, 2.0, -3.2);
    rearWall.receiveShadow = true;
    roomGroup.add(rearWall);

    // Left Wall
    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.3, 4.2, 6.4), wallMat);
    leftWall.position.set(-3.2, 2.0, 0);
    leftWall.receiveShadow = true;
    roomGroup.add(leftWall);

    // Right Wall
    const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.3, 4.2, 6.4), wallMat);
    rightWall.position.set(3.2, 2.0, 0);
    rightWall.receiveShadow = true;
    roomGroup.add(rightWall);

    // Vaulted Ceiling Crossbeams (Rustic Oak)
    const beamMat = new THREE.MeshStandardMaterial({ color: 0x271911, roughness: 0.7 });
    for (let z = -2.4; z <= 2.4; z += 1.6) {
      const beam = new THREE.Mesh(new THREE.BoxGeometry(6.4, 0.25, 0.25), beamMat);
      beam.position.set(0, 3.8, z);
      beam.castShadow = true;
      roomGroup.add(beam);
    }

    // Vaulted Arch Roof Cap
    const archRoof = new THREE.Mesh(
      new THREE.CylinderGeometry(3.3, 3.3, 6.4, 24, 1, false, 0, Math.PI),
      new THREE.MeshStandardMaterial({ color: 0x16162a, roughness: 0.9, side: THREE.BackSide })
    );
    archRoof.rotation.z = Math.PI / 2;
    archRoof.rotation.y = Math.PI / 2;
    archRoof.position.set(0, 3.8, 0);
    roomGroup.add(archRoof);

    // Large Arched Rear Starlight Window
    const winRing = new THREE.Mesh(
      new THREE.TorusGeometry(1.1, 0.09, 16, 32),
      new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.4, metalness: 0.6 })
    );
    winRing.position.set(0, 2.4, -3.02);
    roomGroup.add(winRing);

    const winGlass = new THREE.Mesh(
      new THREE.CircleGeometry(1.05, 32),
      new THREE.MeshBasicMaterial({
        color: lightingPreset === 'sun' ? 0x93c5fd : lightingPreset === 'twilight' ? 0xc084fc : 0x38bdf8,
      })
    );
    winGlass.position.set(0, 2.4, -3.01);
    roomGroup.add(winGlass);

    // Window Grille Cross
    const grilleH = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.05, 0.02), beamMat);
    grilleH.position.set(0, 2.4, -3.0);
    roomGroup.add(grilleH);
    const grilleV = new THREE.Mesh(new THREE.BoxGeometry(0.05, 2.1, 0.02), beamMat);
    grilleV.position.set(0, 2.4, -3.0);
    roomGroup.add(grilleV);

    // 5. COZY STONE FIREPLACE HEARTH
    const hearthGroup = new THREE.Group();
    hearthGroup.position.set(-2.2, 0, -2.4);

    // Hearth Stone Chimney & Surround
    const hearthStone = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 2.2, 1.0),
      new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.9 })
    );
    hearthStone.position.y = 1.1;
    hearthStone.castShadow = true;
    hearthGroup.add(hearthStone);

    // Firebox Cavity
    const firebox = new THREE.Mesh(
      new THREE.BoxGeometry(1.0, 1.0, 0.6),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.95 })
    );
    firebox.position.set(0, 0.6, 0.25);
    hearthGroup.add(firebox);

    // Wooden Mantle Shelf
    const mantle = new THREE.Mesh(
      new THREE.BoxGeometry(1.9, 0.16, 1.1),
      new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.5 })
    );
    mantle.position.set(0, 1.8, 0.05);
    mantle.castShadow = true;
    hearthGroup.add(mantle);

    // Burning Firewood Logs
    const logMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.9 });
    const log1 = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 0.65, 8), logMat);
    log1.rotation.z = Math.PI / 4;
    log1.position.set(-0.1, 0.22, 0.25);
    hearthGroup.add(log1);

    const log2 = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 0.65, 8), logMat);
    log2.rotation.z = -Math.PI / 4;
    log2.position.set(0.1, 0.22, 0.25);
    hearthGroup.add(log2);

    // Glowing Fire Flame Core
    const flameGeo = new THREE.ConeGeometry(0.24, 0.55, 8);
    const flameMat = new THREE.MeshBasicMaterial({ color: 0xffaa00 });
    const flameMesh = new THREE.Mesh(flameGeo, flameMat);
    flameMesh.position.set(0, 0.42, 0.25);
    hearthGroup.add(flameMesh);

    // Rising Ember Particles
    const eCount = 20;
    const eGeo = new THREE.BufferGeometry();
    const ePos = new Float32Array(eCount * 3);
    for (let i = 0; i < eCount; i++) {
      ePos[i * 3] = (Math.random() - 0.5) * 0.4;
      ePos[i * 3 + 1] = 0.4 + Math.random() * 0.9;
      ePos[i * 3 + 2] = 0.25 + (Math.random() - 0.5) * 0.3;
    }
    eGeo.setAttribute('position', new THREE.BufferAttribute(ePos, 3));
    const eMat = new THREE.PointsMaterial({
      color: 0xffa500,
      size: 0.07,
      transparent: true,
      opacity: 0.85,
    });
    const embers = new THREE.Points(eGeo, eMat);
    hearthGroup.add(embers);
    stateRef.current.emberParticles = embers;

    roomGroup.add(hearthGroup);

    // 6. CUSTOM WOVEN RUG (Tinted in Mascot's Signature Color)
    const mascotColor = new THREE.Color(mascot.hairColors[0] || '#f59e0b');
    const rug = new THREE.Mesh(
      new THREE.CylinderGeometry(1.6, 1.6, 0.04, 32),
      new THREE.MeshStandardMaterial({
        color: mascotColor,
        roughness: 0.95,
      })
    );
    rug.position.set(0.4, 0.02, 0.2);
    rug.receiveShadow = true;
    roomGroup.add(rug);

    // Inner Rug Pattern Ring
    const rugInner = new THREE.Mesh(
      new THREE.RingGeometry(0.8, 1.35, 32),
      new THREE.MeshStandardMaterial({
        color: 0xfef08a,
        roughness: 0.9,
        side: THREE.DoubleSide,
      })
    );
    rugInner.rotation.x = -Math.PI / 2;
    rugInner.position.set(0.4, 0.045, 0.2);
    roomGroup.add(rugInner);

    // 7. COMPLETE 3D BOROUGH FURNITURE

    // Cozy Plush Canopy Bed
    const bedGroup = new THREE.Group();
    bedGroup.position.set(-1.8, 0, 1.4);

    const bedFrame = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 0.4, 2.2),
      new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.6 })
    );
    bedFrame.position.y = 0.2;
    bedFrame.castShadow = true;
    bedGroup.add(bedFrame);

    const mattress = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, 0.3, 2.0),
      new THREE.MeshStandardMaterial({ color: 0xfef9c3, roughness: 0.9 })
    );
    mattress.position.y = 0.45;
    bedGroup.add(mattress);

    const duvet = new THREE.Mesh(
      new THREE.BoxGeometry(1.42, 0.15, 1.3),
      new THREE.MeshStandardMaterial({ color: mascotColor.clone().multiplyScalar(0.9), roughness: 0.85 })
    );
    duvet.position.set(0, 0.52, 0.35);
    bedGroup.add(duvet);

    const pillow = new THREE.Mesh(
      new THREE.BoxGeometry(1.1, 0.22, 0.55),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.95 })
    );
    pillow.position.set(0, 0.65, -0.65);
    bedGroup.add(pillow);

    roomGroup.add(bedGroup);

    // Study & Inventor Desk
    const deskGroup = new THREE.Group();
    deskGroup.position.set(2.0, 0, -2.2);

    const desk = new THREE.Mesh(
      new THREE.BoxGeometry(1.8, 0.8, 1.0),
      new THREE.MeshStandardMaterial({ color: 0x854d0e, roughness: 0.5 })
    );
    desk.position.y = 0.4;
    desk.castShadow = true;
    deskGroup.add(desk);

    // Books & Scrolls on Desk
    const book = new THREE.Mesh(
      new THREE.BoxGeometry(0.35, 0.08, 0.45),
      new THREE.MeshStandardMaterial({ color: 0x0284c7 })
    );
    book.position.set(-0.4, 0.84, 0.1);
    deskGroup.add(book);

    // Glowing Crystal Desk Lamp
    const lamp = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.18, 0),
      new THREE.MeshBasicMaterial({ color: 0x00f0ff })
    );
    lamp.position.set(0.5, 1.05, -0.15);
    deskGroup.add(lamp);

    roomGroup.add(deskGroup);

    // Floor-to-Ceiling Bookshelf
    const shelfGroup = new THREE.Group();
    shelfGroup.position.set(3.0, 0, 0.8);

    const shelfBody = new THREE.Mesh(
      new THREE.BoxGeometry(0.35, 3.0, 1.8),
      new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.7 })
    );
    shelfBody.position.y = 1.5;
    shelfBody.castShadow = true;
    shelfGroup.add(shelfBody);

    // Colorful Book Spines
    const bookColors = [0xef4444, 0x3b82f6, 0x10b981, 0xf59e0b, 0x8b5cf6];
    for (let level = 0; level < 4; level++) {
      for (let b = -0.6; b <= 0.6; b += 0.28) {
        const spine = new THREE.Mesh(
          new THREE.BoxGeometry(0.28, 0.35, 0.18),
          new THREE.MeshStandardMaterial({ color: bookColors[Math.floor(Math.random() * bookColors.length)] })
        );
        spine.position.set(-0.02, 0.5 + level * 0.68, b);
        shelfGroup.add(spine);
      }
    }
    roomGroup.add(shelfGroup);

    // 8. CELESTIAL CROWN SHRINE (For Max-Level Companions)
    let crownShrine: THREE.Group | null = null;
    if (isMaxLevel) {
      crownShrine = new THREE.Group();
      crownShrine.position.set(0.4, 0, -1.2);

      const pedestal = new THREE.Mesh(
        new THREE.CylinderGeometry(0.4, 0.5, 0.85, 16),
        new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.2 })
      );
      pedestal.position.y = 0.42;
      pedestal.castShadow = true;
      crownShrine.add(pedestal);

      // Rotating Golden Crown Crystal
      const crystal = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.35, 0),
        new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.95, roughness: 0.1 })
      );
      crystal.position.y = 1.15;
      crownShrine.add(crystal);

      // Radiant Halo
      const halo = new THREE.Mesh(
        new THREE.TorusGeometry(0.55, 0.04, 16, 32),
        new THREE.MeshBasicMaterial({ color: 0xffea00 })
      );
      halo.rotation.x = Math.PI / 2;
      halo.position.y = 1.15;
      crownShrine.add(halo);

      roomGroup.add(crownShrine);
      stateRef.current.crownShrine = crownShrine;
    }

    // 9. INTERACTIVE 3D MASCOT AVATAR IN ROOM
    const mascotGroup = new THREE.Group();
    mascotGroup.position.set(0.4, 0.05, 0.2);

    // Round Cute Mascot Body
    const mBody = new THREE.Mesh(
      new THREE.SphereGeometry(0.42, 24, 24),
      new THREE.MeshStandardMaterial({ color: mascotColor, roughness: 0.4 })
    );
    mBody.position.y = 0.55;
    mBody.castShadow = true;
    mascotGroup.add(mBody);

    // Ears
    const ear1 = new THREE.Mesh(
      new THREE.ConeGeometry(0.14, 0.32, 12),
      new THREE.MeshStandardMaterial({ color: mascotColor })
    );
    ear1.position.set(-0.25, 0.9, 0);
    ear1.rotation.z = 0.35;
    mascotGroup.add(ear1);

    const ear2 = new THREE.Mesh(
      new THREE.ConeGeometry(0.14, 0.32, 12),
      new THREE.MeshStandardMaterial({ color: mascotColor })
    );
    ear2.position.set(0.25, 0.9, 0);
    ear2.rotation.z = -0.35;
    mascotGroup.add(ear2);

    // Cute Big Eyes
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });
    const eye1 = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 12), eyeMat);
    eye1.position.set(-0.14, 0.62, 0.36);
    mascotGroup.add(eye1);

    const eye2 = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 12), eyeMat);
    eye2.position.set(0.14, 0.62, 0.36);
    mascotGroup.add(eye2);

    // Wagging Tail
    const tail = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.1, 0.4, 8),
      new THREE.MeshStandardMaterial({ color: mascotColor })
    );
    tail.rotation.x = -Math.PI / 3;
    tail.position.set(0, 0.4, -0.4);
    mascotGroup.add(tail);

    // Mascot Clickable Hit Box for Petting
    const mHitBox = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 1.4, 1.2),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    mHitBox.position.y = 0.6;
    (mHitBox as any).userData = { type: 'mascot' };
    mascotGroup.add(mHitBox);
    stateRef.current.mascotHitBox = mHitBox;

    roomGroup.add(mascotGroup);
    stateRef.current.mascotMesh = mascotGroup;

    // 10. FLOATING HEART PARTICLES (For Petting)
    const hCount = 16;
    const hGeo = new THREE.BufferGeometry();
    const hPos = new Float32Array(hCount * 3);
    for (let i = 0; i < hCount; i++) {
      hPos[i * 3] = 0.4 + (Math.random() - 0.5) * 0.8;
      hPos[i * 3 + 1] = 0.6 + Math.random() * 0.8;
      hPos[i * 3 + 2] = 0.2 + (Math.random() - 0.5) * 0.8;
    }
    hGeo.setAttribute('position', new THREE.BufferAttribute(hPos, 3));
    const hMat = new THREE.PointsMaterial({
      color: 0xf43f5e,
      size: 0.14,
      transparent: true,
      opacity: 0,
    });
    const hearts = new THREE.Points(hGeo, hMat);
    scene.add(hearts);
    stateRef.current.heartParticles = hearts;

    scene.add(roomGroup);

    // 11. DRAG & ORBIT CONTROLS WITH RAYCAST PETTING
    const domElement = renderer.domElement;
    let didDrag = false;

    const onPointerDown = (e: PointerEvent) => {
      didDrag = false;
      stateRef.current.dragStart = { x: e.clientX, y: e.clientY };
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!stateRef.current.dragStart) return;
      const dx = (e.clientX - stateRef.current.dragStart.x) * 0.007;
      const dy = (e.clientY - stateRef.current.dragStart.y) * 0.005;

      if (Math.abs(dx) > 0.01 || Math.abs(dy) > 0.01) {
        didDrag = true;
      }

      stateRef.current.orbit.theta += dx;
      stateRef.current.orbit.phi = Math.max(0.12, Math.min(1.15, stateRef.current.orbit.phi + dy));

      stateRef.current.dragStart = { x: e.clientX, y: e.clientY };
    };

    const triggerPetting = () => {
      stateRef.current.isPettingAnim = 1.0;
      setPettingCount((prev) => prev + 1);
      setShowPetHeartToast(true);
      setTimeout(() => setShowPetHeartToast(false), 1200);
      SoundEngine.playMascotSqueak('giggle');
    };

    const onPointerUp = (e: PointerEvent) => {
      stateRef.current.dragStart = null;

      if (!didDrag) {
        const rect = domElement.getBoundingClientRect();
        stateRef.current.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        stateRef.current.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

        stateRef.current.raycaster.setFromCamera(stateRef.current.mouse, camera);
        const hit = stateRef.current.mascotHitBox;
        if (hit) {
          const intersects = stateRef.current.raycaster.intersectObject(hit);
          if (intersects.length > 0) {
            triggerPetting();
          }
        }
      }
    };

    domElement.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);

    // 12. ANIMATION LOOP
    const animate = () => {
      stateRef.current.animId = requestAnimationFrame(animate);
      const elapsed = stateRef.current.clock.getElapsedTime();
      const s = stateRef.current;

      // Auto rotation
      if (isAutoRotate && !s.dragStart) {
        s.orbit.theta += 0.003;
      }

      // Camera position
      const { theta, phi, distance, target } = s.orbit;
      camera.position.x = target.x + distance * Math.sin(theta) * Math.cos(phi);
      camera.position.y = target.y + distance * Math.sin(phi);
      camera.position.z = target.z + distance * Math.cos(theta) * Math.cos(phi);
      camera.lookAt(target);

      // Fireplace Flicker
      if (s.hearthLight) {
        if (isFireplaceOn) {
          s.hearthLight.intensity = 3.6 + Math.sin(elapsed * 9) * 0.5 + Math.cos(elapsed * 14) * 0.3;
        } else {
          s.hearthLight.intensity = 0.1;
        }
      }

      // Rising Fire Embers
      if (s.emberParticles) {
        const eAttr = s.emberParticles.geometry.attributes.position as THREE.BufferAttribute;
        for (let i = 0; i < eAttr.count; i++) {
          let y = eAttr.getY(i);
          y += 0.01;
          if (y > 1.8) {
            y = 0.4;
          }
          eAttr.setY(i, y);
        }
        eAttr.needsUpdate = true;
      }

      // Rotating Crown Shrine
      if (s.crownShrine) {
        s.crownShrine.rotation.y += 0.02;
        const crystal = s.crownShrine.children[1];
        if (crystal) {
          crystal.position.y = 1.15 + Math.sin(elapsed * 3) * 0.06;
        }
      }

      // Mascot Idle & Petting Animations
      if (s.mascotMesh) {
        // Subtle breathing
        const breath = 1.0 + Math.sin(elapsed * 3.5) * 0.03;
        s.mascotMesh.scale.set(breath, breath, breath);

        // Tail Wagging
        const tailMesh = s.mascotMesh.children[4];
        if (tailMesh) {
          tailMesh.rotation.y = Math.sin(elapsed * 6) * 0.35;
        }

        // Petting Jump Reaction
        if (s.isPettingAnim > 0) {
          s.isPettingAnim -= 0.035;
          const hop = Math.sin((1.0 - s.isPettingAnim) * Math.PI) * 0.35;
          s.mascotMesh.position.y = 0.05 + Math.max(0, hop);
          s.mascotMesh.rotation.y += 0.08;

          // Heart particles opacity
          if (s.heartParticles) {
            (s.heartParticles.material as THREE.PointsMaterial).opacity = s.isPettingAnim;
            const hAttr = s.heartParticles.geometry.attributes.position as THREE.BufferAttribute;
            for (let i = 0; i < hAttr.count; i++) {
              let y = hAttr.getY(i) + 0.015;
              hAttr.setY(i, y);
            }
            hAttr.needsUpdate = true;
          }
        } else {
          s.mascotMesh.position.y = 0.05;
          if (s.heartParticles) {
            (s.heartParticles.material as THREE.PointsMaterial).opacity = 0;
          }
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    // 13. Resize Observer
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth || 360;
      const h = container.clientHeight || 420;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    // 14. Cleanup
    return () => {
      cancelAnimationFrame(stateRef.current.animId);
      resizeObserver.disconnect();
      domElement.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);

      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh || obj instanceof THREE.Points) {
          if (obj.geometry) obj.geometry.dispose();
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m) => m.dispose());
          } else if (obj.material) {
            obj.material.dispose();
          }
        }
      });

      renderer.dispose();
      if (domElement.parentNode) {
        domElement.parentNode.removeChild(domElement);
      }
    };
  }, [mascot.id, isMaxLevel, lightingPreset, isFireplaceOn]);

  return (
    <div className="relative w-full aspect-[4/3] min-h-[420px] rounded-3xl overflow-hidden border-2 border-indigo-900/60 shadow-2xl bg-slate-950 select-none">
      {/* 3D Canvas Mount Point */}
      <div
        ref={mountRef}
        className="w-full h-full cursor-grab active:cursor-grabbing touch-none"
        style={{ touchAction: 'none' }}
      />

      {/* Companion Switcher & Header Bar */}
      <div className="absolute top-2.5 inset-x-3 flex items-center justify-between pointer-events-none z-10 flex-wrap gap-2">
        {/* Companion Title & Selector */}
        <div className="flex items-center gap-2 pointer-events-auto bg-slate-950/85 px-3 py-1.5 rounded-2xl border border-slate-800 backdrop-blur-md shadow-lg">
          <span className="text-base animate-bounce">🏡</span>
          <div>
            <div className="text-[11px] font-black text-white flex items-center gap-1.5 uppercase tracking-wider">
              <span>{mascot.name}&apos;s Standalone 3D Borough</span>
              {isMaxLevel && (
                <span className="text-[8px] bg-amber-400 text-slate-950 px-1.5 py-0.2 rounded-full font-black">
                  👑 CELESTIAL
                </span>
              )}
            </div>
            <div className="text-[8.5px] text-slate-400">Cozy Architectural Sanctuary • Tap mascot to pet</div>
          </div>
        </div>

        {/* Ambiance & Camera Controls */}
        <div className="flex items-center gap-1.5 pointer-events-auto bg-slate-950/85 p-1 rounded-2xl border border-slate-800 backdrop-blur-md shadow-lg">
          {/* Fireplace Toggle */}
          <button
            onClick={() => {
              setIsFireplaceOn((prev) => !prev);
              SoundEngine.playTileStep();
            }}
            className={`p-1.5 rounded-xl text-xs transition-all cursor-pointer ${
              isFireplaceOn
                ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40 shadow-sm'
                : 'bg-slate-900 text-slate-500 border border-slate-800'
            }`}
            title={isFireplaceOn ? 'Fireplace Active (Tap to extinguish)' : 'Fireplace Extinguished (Tap to ignite)'}
          >
            <Flame className={`w-3.5 h-3.5 ${isFireplaceOn ? 'animate-pulse text-amber-400' : ''}`} />
          </button>

          {/* Lighting Mode Cycle */}
          <button
            onClick={() => {
              setLightingPreset((prev) => (prev === 'hearth' ? 'twilight' : prev === 'twilight' ? 'sun' : 'hearth'));
              SoundEngine.playTileStep();
            }}
            className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs cursor-pointer"
            title={`Lighting: ${lightingPreset}. Tap to cycle.`}
          >
            {lightingPreset === 'hearth' ? '🔥' : lightingPreset === 'twilight' ? '🌙' : '☀️'}
          </button>

          {/* Camera Angles */}
          <div className="flex items-center gap-0.5 bg-slate-900 p-0.5 rounded-xl border border-slate-800">
            <button
              onClick={() => setCameraPreset('overview')}
              className={`px-2 py-0.5 rounded-lg text-[8.5px] font-black uppercase transition-all cursor-pointer ${
                cameraPreset === 'overview'
                  ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Room
            </button>
            <button
              onClick={() => setCameraPreset('mascot')}
              className={`px-2 py-0.5 rounded-lg text-[8.5px] font-black uppercase transition-all cursor-pointer ${
                cameraPreset === 'mascot'
                  ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Mascot
            </button>
            <button
              onClick={() => setCameraPreset('fireplace')}
              className={`px-2 py-0.5 rounded-lg text-[8.5px] font-black uppercase transition-all cursor-pointer ${
                cameraPreset === 'fireplace'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Hearth
            </button>
          </div>

          {/* Auto Rotate Toggle */}
          <button
            onClick={() => setIsAutoRotate((prev) => !prev)}
            className={`p-1.5 rounded-xl text-xs transition-all cursor-pointer ${
              isAutoRotate ? 'text-cyan-300 bg-cyan-950/70 border border-cyan-500/40' : 'text-slate-500 bg-slate-900 border border-slate-800'
            }`}
            title={isAutoRotate ? 'Pause 3D rotation' : 'Resume 3D auto orbit'}
          >
            <RotateCw className={`w-3.5 h-3.5 ${isAutoRotate ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Quick Companion Selector Ribbon */}
      {allMascots.length > 1 && onSelectActiveMascot && (
        <div className="absolute top-14 inset-x-3 flex items-center gap-1.5 overflow-x-auto no-scrollbar pointer-events-auto z-10 py-1">
          {allMascots.map((m) => {
            const isSelected = m.id === mascot.id;
            return (
              <button
                key={m.id}
                onClick={() => {
                  onSelectActiveMascot(m.id);
                  SoundEngine.playTileStep();
                }}
                className={`px-2.5 py-1 rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer backdrop-blur-md shadow-md ${
                  isSelected
                    ? 'bg-gradient-to-r from-amber-400 via-orange-500 to-pink-500 text-slate-950 font-black border border-white scale-105'
                    : 'bg-slate-950/80 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700'
                }`}
              >
                <span>{m.earStyle === 'bunny' ? '🐰' : m.earStyle === 'cat' ? '🦊' : m.earStyle === 'bear' ? '🐼' : m.earStyle === 'tuft' ? '🦌' : '🐾'}</span>
                <span>{m.name}</span>
                <span className="opacity-75">Lv.{m.level}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Petting Heart Floating Toast */}
      {showPetHeartToast && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20 flex flex-col items-center gap-1 animate-bounce">
          <span className="text-4xl drop-shadow-[0_0_15px_rgba(244,63,94,0.9)]">💖</span>
          <span className="text-[10px] font-black uppercase tracking-wider bg-rose-950/90 text-rose-300 px-2 py-0.5 rounded-full border border-rose-500/50 shadow-lg">
            *happy squeak!*
          </span>
        </div>
      )}

      {/* Bottom Hint Overlay */}
      <div className="absolute bottom-2.5 inset-x-3 flex items-center justify-between pointer-events-none z-10">
        <span className="text-[8.5px] font-black text-slate-300 bg-slate-950/85 px-3 py-1.5 rounded-xl border border-slate-800 uppercase tracking-wider backdrop-blur-md flex items-center gap-1.5">
          <span>🐾 Tap Mascot to Pet</span>
          <span className="text-slate-500">•</span>
          <span>🖱️ Drag to look around room</span>
        </span>

        {pettingCount > 0 && (
          <span className="text-[8.5px] font-black text-rose-300 bg-rose-950/80 px-2.5 py-1 rounded-xl border border-rose-500/40 backdrop-blur-md flex items-center gap-1 shadow-md">
            <span>❤️ Petted {pettingCount}x</span>
          </span>
        )}
      </div>
    </div>
  );
};
