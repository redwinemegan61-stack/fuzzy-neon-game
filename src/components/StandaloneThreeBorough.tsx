import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Mascot, MascotBurrow } from '../types';
import { MAX_MASCOT_LEVEL } from '../utils/mascotLeveling';
import { SoundEngine } from '../utils/sound';
import {
  Flame, RotateCw, Sparkles, ChevronDown, ChevronUp
} from 'lucide-react';
import {
  createThreeGraphicsEngine,
  createHardwoodPlankTexture,
  createStoneMasonryTexture,
  createWovenTapestryRugTexture,
  createContactShadowMesh,
  createHighDetailMascot3D,
  GraphicsEngineInstance,
} from '../utils/threeGraphicsEngine';

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
  onSelectActiveMascot,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);

  // Ambiance, Graphics Engine & Interaction States
  const [lightingPreset, setLightingPreset] = useState<'hearth' | 'twilight' | 'sun'>('hearth');
  const [isFireplaceOn, setIsFireplaceOn] = useState(true);
  const [cameraPreset, setCameraPreset] = useState<'overview' | 'mascot' | 'fireplace' | 'desk'>('overview');
  const [isAutoRotate, setIsAutoRotate] = useState(false);
  const [enableBloomEngine, setEnableBloomEngine] = useState(false);
  const [isHudCollapsed, setIsHudCollapsed] = useState(false);
  const [pettingCount, setPettingCount] = useState(0);
  const [showPetHeartToast, setShowPetHeartToast] = useState(false);

  const isMaxLevel = mascot.level >= MAX_MASCOT_LEVEL;

  // Refs synced to animation loop
  const autoRotateRef = useRef(isAutoRotate);
  autoRotateRef.current = isAutoRotate;
  const bloomEnabledRef = useRef(enableBloomEngine);
  bloomEnabledRef.current = enableBloomEngine;
  const fireplaceOnRef = useRef(isFireplaceOn);
  fireplaceOnRef.current = isFireplaceOn;

  const stateRef = useRef<{
    engine: GraphicsEngineInstance | null;
    scene: THREE.Scene | null;
    camera: THREE.PerspectiveCamera | null;
    animId: number;
    clock: THREE.Clock;
    dragStart: { x: number; y: number } | null;
    orbit: {
      theta: number;
      phi: number;
      distance: number;
      target: THREE.Vector3;
      desiredTheta: number;
      desiredPhi: number;
      desiredDistance: number;
      desiredTarget: THREE.Vector3;
    };
    hearthLight: THREE.PointLight | null;
    flameGroup: THREE.Group | null;
    chandelierGroup: THREE.Group | null;
    crownShrine: THREE.Group | null;
    mascotGroup: THREE.Group | null;
    mascotTail: THREE.Group | null;
    mascotHead: THREE.Group | null;
    heartParticles: THREE.Points | null;
    emberParticles: THREE.Points | null;
    dustMotes: THREE.Points | null;
    isPettingAnim: number;
    raycaster: THREE.Raycaster;
    mouse: THREE.Vector2;
    mascotHitBox: THREE.Mesh | null;
  }>({
    engine: null,
    scene: null,
    camera: null,
    animId: 0,
    clock: new THREE.Clock(),
    dragStart: null,
    orbit: {
      theta: 0.42,
      phi: 0.44,
      distance: 8.4,
      target: new THREE.Vector3(0, 1.35, 0),
      desiredTheta: 0.42,
      desiredPhi: 0.44,
      desiredDistance: 8.4,
      desiredTarget: new THREE.Vector3(0, 1.35, 0),
    },
    hearthLight: null,
    flameGroup: null,
    chandelierGroup: null,
    crownShrine: null,
    mascotGroup: null,
    mascotTail: null,
    mascotHead: null,
    heartParticles: null,
    emberParticles: null,
    dustMotes: null,
    isPettingAnim: 0,
    raycaster: new THREE.Raycaster(),
    mouse: new THREE.Vector2(-999, -999),
    mascotHitBox: null,
  });

  // Smoothly interpolate camera target and spherical coordinates on preset change
  useEffect(() => {
    const o = stateRef.current.orbit;
    if (cameraPreset === 'overview') {
      o.desiredDistance = 8.4;
      o.desiredPhi = 0.44;
      o.desiredTheta = 0.38;
      o.desiredTarget.set(0, 1.35, 0);
    } else if (cameraPreset === 'mascot') {
      o.desiredDistance = 4.2;
      o.desiredPhi = 0.3;
      o.desiredTheta = 0.15;
      o.desiredTarget.set(0.35, 0.85, 0.25);
    } else if (cameraPreset === 'fireplace') {
      o.desiredDistance = 4.8;
      o.desiredPhi = 0.34;
      o.desiredTheta = -0.35;
      o.desiredTarget.set(-2.0, 1.15, -1.8);
    } else if (cameraPreset === 'desk') {
      o.desiredDistance = 4.6;
      o.desiredPhi = 0.38;
      o.desiredTheta = 0.55;
      o.desiredTarget.set(2.0, 1.15, -1.7);
    }
  }, [cameraPreset]);

  // Main Three.js Studio Sanctuary Lifecycle
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 400;
    const height = container.clientHeight || 440;

    // 1. Scene & Camera Setup
    const scene = new THREE.Scene();
    stateRef.current.scene = scene;

    const bgColors = {
      hearth: 0x090712,
      twilight: 0x0b0e24,
      sun: 0x1e293b,
    };
    scene.background = new THREE.Color(bgColors[lightingPreset]);
    scene.fog = new THREE.FogExp2(bgColors[lightingPreset], 0.025);

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 80);
    camera.position.set(0, 3.8, 8.2);
    camera.lookAt(0, 1.35, 0);
    stateRef.current.camera = camera;

    // 2. Initialize Studio PBR & Post-Processing Engine
    const engine = createThreeGraphicsEngine(scene, camera, width, height, {
      bloomStrength: 0,
      bloomRadius: 0,
      bloomThreshold: 1.0,
      exposure: lightingPreset === 'sun' ? 1.18 : 1.08,
    });
    container.appendChild(engine.renderer.domElement);
    stateRef.current.engine = engine;

    // 3. Studio 3-Point & Architectural Lighting Rig
    const hemiLight = new THREE.HemisphereLight(
      lightingPreset === 'sun' ? 0xe0f2fe : lightingPreset === 'twilight' ? 0x818cf8 : 0xffedd5,
      0x1e1b4b,
      lightingPreset === 'sun' ? 1.55 : lightingPreset === 'twilight' ? 1.15 : 1.25
    );
    hemiLight.position.set(0, 8, 0);
    scene.add(hemiLight);

    // Directional Sun / Moon Shaft Light through Rear Arched Window
    const windowDirLight = new THREE.DirectionalLight(
      lightingPreset === 'sun' ? 0xfef08a : lightingPreset === 'twilight' ? 0xa5b4fc : 0xfda4af,
      lightingPreset === 'sun' ? 2.8 : 1.5
    );
    windowDirLight.position.set(-1.5, 5.2, -5.5);
    windowDirLight.castShadow = !engine.isSoftwareGl;
    windowDirLight.shadow.mapSize.width = engine.isSoftwareGl ? 1024 : 2048;
    windowDirLight.shadow.mapSize.height = engine.isSoftwareGl ? 1024 : 2048;
    windowDirLight.shadow.camera.near = 0.5;
    windowDirLight.shadow.camera.far = 22;
    windowDirLight.shadow.camera.left = -5;
    windowDirLight.shadow.camera.right = 5;
    windowDirLight.shadow.camera.top = 5;
    windowDirLight.shadow.camera.bottom = -5;
    windowDirLight.shadow.bias = -0.0005;
    windowDirLight.shadow.normalBias = 0.02;
    scene.add(windowDirLight);

    // Studio Softbox Area Light at the Arched Window
    if (!engine.isSoftwareGl) {
      const windowSoftbox = new THREE.RectAreaLight(
        lightingPreset === 'sun' ? 0xbae6fd : lightingPreset === 'twilight' ? 0x818cf8 : 0xfbcfe8,
        lightingPreset === 'sun' ? 4.5 : 2.8,
        2.2,
        2.2
      );
      windowSoftbox.position.set(0, 2.4, -2.95);
      windowSoftbox.lookAt(0, 1.0, 1.5);
      scene.add(windowSoftbox);
    }

    // Warm Hearth Point Light
    const hearthLight = new THREE.PointLight(0xff6b00, isFireplaceOn ? 4.5 : 0.15, 11.0, 1.6);
    hearthLight.position.set(-2.0, 0.95, -1.75);
    hearthLight.castShadow = !engine.isSoftwareGl;
    hearthLight.shadow.bias = -0.002;
    scene.add(hearthLight);
    stateRef.current.hearthLight = hearthLight;

    // Wrought-Iron Chandelier Warm Overhead Light
    const chandelierLight = new THREE.PointLight(0xffe49e, 2.2, 10.5, 1.5);
    chandelierLight.position.set(0, 3.35, 0);
    scene.add(chandelierLight);

    // 4. PROCEDURAL PBR TEXTURES
    const woodPlankTex = createHardwoodPlankTexture(engine.maxAnisotropy);
    const masonryWallTex = createStoneMasonryTexture(engine.maxAnisotropy);
    const rugTex = createWovenTapestryRugTexture(
      mascot.furColor || mascot.hairColors[0] || '#f59e0b',
      mascot.hairColors[1] || '#fef08a',
      engine.maxAnisotropy
    );

    const roomGroup = new THREE.Group();

    // 5. HARDWOOD PLANK FLOOR & TIMBER BASEBOARD
    const floorMat = new THREE.MeshPhysicalMaterial({
      map: woodPlankTex,
      roughness: 0.38,
      metalness: 0.06,
      clearcoat: 0.35,
      clearcoatRoughness: 0.28,
    });
    const floor = new THREE.Mesh(new THREE.BoxGeometry(6.8, 0.32, 6.8), floorMat);
    floor.position.y = -0.16;
    floor.receiveShadow = true;
    roomGroup.add(floor);

    // Carved Oak Foundation Trim around Sanctuary Floor
    const trimMat = new THREE.MeshStandardMaterial({
      color: 0x2a180d,
      roughness: 0.55,
      metalness: 0.15,
    });
    const baseFrame = new THREE.Mesh(new THREE.BoxGeometry(7.05, 0.18, 7.05), trimMat);
    baseFrame.position.y = -0.26;
    roomGroup.add(baseFrame);

    // 6. MASONRY WALLS, WAINSCOTING & VAULTED TIMBER TRUSSES
    const wallMat = new THREE.MeshStandardMaterial({
      map: masonryWallTex,
      roughness: 0.82,
      metalness: 0.08,
    });

    const rearWall = new THREE.Mesh(new THREE.BoxGeometry(6.8, 4.5, 0.34), wallMat);
    rearWall.position.set(0, 2.15, -3.35);
    rearWall.receiveShadow = true;
    roomGroup.add(rearWall);

    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.34, 4.5, 6.8), wallMat);
    leftWall.position.set(-3.35, 2.15, 0);
    leftWall.receiveShadow = true;
    roomGroup.add(leftWall);

    const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.34, 4.5, 6.8), wallMat);
    rightWall.position.set(3.35, 2.15, 0);
    rightWall.receiveShadow = true;
    roomGroup.add(rightWall);

    // Warm Oak Wainscoting Lower Wall Paneling
    const wainscotMat = new THREE.MeshStandardMaterial({
      color: 0x3b2213,
      roughness: 0.52,
      metalness: 0.1,
    });
    const rearWainscot = new THREE.Mesh(new THREE.BoxGeometry(6.5, 1.05, 0.08), wainscotMat);
    rearWainscot.position.set(0, 0.52, -3.15);
    roomGroup.add(rearWainscot);

    const leftWainscot = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.05, 6.5), wainscotMat);
    leftWainscot.position.set(-3.15, 0.52, 0);
    roomGroup.add(leftWainscot);

    const rightWainscot = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.05, 6.5), wainscotMat);
    rightWainscot.position.set(3.15, 0.52, 0);
    roomGroup.add(rightWainscot);

    // Corner Timber Pillars
    [
      [-3.12, -3.12],
      [3.12, -3.12],
      [-3.12, 3.12],
      [3.12, 3.12],
    ].forEach(([px, pz]) => {
      const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.28, 4.5, 0.28), trimMat);
      pillar.position.set(px, 2.15, pz);
      pillar.castShadow = true;
      roomGroup.add(pillar);
    });

    // Vaulted Ceiling Timber Beams
    for (let z = -2.6; z <= 2.6; z += 1.7) {
      const beam = new THREE.Mesh(new THREE.BoxGeometry(6.7, 0.22, 0.22), trimMat);
      beam.position.set(0, 4.15, z);
      beam.castShadow = true;
      roomGroup.add(beam);
    }

    // Wrought-Iron & Glowing Candle Chandelier
    const chandelierGroup = new THREE.Group();
    chandelierGroup.position.set(0, 3.65, 0);
    const ironMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.85, roughness: 0.25 });
    const chainRod = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.85, 8), ironMat);
    chainRod.position.y = 0.42;
    chandelierGroup.add(chainRod);

    const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.04, 12, 28), ironMat);
    wheel.rotation.x = Math.PI / 2;
    chandelierGroup.add(wheel);

    const candleMat = new THREE.MeshStandardMaterial({
      color: 0xfef9c3,
      emissive: 0xfbbf24,
      emissiveIntensity: 0.85,
      roughness: 0.3,
    });
    for (let c = 0; c < 6; c++) {
      const ang = (c * Math.PI * 2) / 6;
      const candle = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.18, 10), candleMat);
      candle.position.set(Math.cos(ang) * 0.62, 0.11, Math.sin(ang) * 0.62);
      chandelierGroup.add(candle);

      const flameTip = new THREE.Mesh(
        new THREE.ConeGeometry(0.03, 0.09, 8),
        new THREE.MeshBasicMaterial({ color: 0xffea00 })
      );
      flameTip.position.set(Math.cos(ang) * 0.62, 0.24, Math.sin(ang) * 0.62);
      chandelierGroup.add(flameTip);
    }
    roomGroup.add(chandelierGroup);
    stateRef.current.chandelierGroup = chandelierGroup;

    // 7. GRAND ARCHED STAINED-GLASS & STARLIGHT BAY WINDOW
    const winGroup = new THREE.Group();
    winGroup.position.set(0, 2.5, -3.12);

    const brassFrameMat = new THREE.MeshPhysicalMaterial({
      color: 0xd97706,
      metalness: 0.85,
      roughness: 0.22,
      clearcoat: 0.6,
    });
    const winRing = new THREE.Mesh(new THREE.TorusGeometry(1.18, 0.1, 16, 36), brassFrameMat);
    winGroup.add(winRing);

    // Exterior Sky Panorama Disc behind window
    const skyVistaMat = new THREE.MeshBasicMaterial({
      color: lightingPreset === 'sun' ? 0x38bdf8 : lightingPreset === 'twilight' ? 0x4c1d95 : 0x0f172a,
    });
    const skyVista = new THREE.Mesh(new THREE.CircleGeometry(1.14, 32), skyVistaMat);
    skyVista.position.z = -0.04;
    winGroup.add(skyVista);

    // Glowing Moon or Golden Sun in Window Vista
    const celestialOrb = new THREE.Mesh(
      new THREE.CircleGeometry(0.28, 24),
      new THREE.MeshBasicMaterial({
        color: lightingPreset === 'sun' ? 0xfef08a : 0xfde047,
      })
    );
    celestialOrb.position.set(0.32, 0.35, -0.02);
    winGroup.add(celestialOrb);

    // Transmissive Optical Window Glass
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: lightingPreset === 'sun' ? 0xe0f2fe : 0xc4b5fd,
      transparent: true,
      opacity: engine.isSoftwareGl ? 0.28 : 0.45,
      roughness: 0.08,
      metalness: 0.1,
      clearcoat: 1.0,
    });
    const glassPane = new THREE.Mesh(new THREE.CircleGeometry(1.12, 32), glassMat);
    glassPane.position.z = 0.01;
    winGroup.add(glassPane);

    // Window Mullion Lattice
    const mullionH = new THREE.Mesh(new THREE.BoxGeometry(2.25, 0.05, 0.05), brassFrameMat);
    mullionH.position.z = 0.03;
    winGroup.add(mullionH);
    const mullionV = new THREE.Mesh(new THREE.BoxGeometry(0.05, 2.25, 0.05), brassFrameMat);
    mullionV.position.z = 0.03;
    winGroup.add(mullionV);

    roomGroup.add(winGroup);

    // 8. ARTISAN STONE FIREPLACE HEARTH WITH BRASS ANDIRONS & MULTI-FLAME CORE
    const hearthGroup = new THREE.Group();
    hearthGroup.position.set(-2.05, 0, -2.42);
    hearthGroup.add(createContactShadowMesh(1.2, 0.55));

    const hearthStoneMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.85,
      metalness: 0.12,
    });
    const chimneyBreast = new THREE.Mesh(new THREE.BoxGeometry(1.85, 2.6, 1.05), hearthStoneMat);
    chimneyBreast.position.y = 1.3;
    chimneyBreast.castShadow = true;
    chimneyBreast.receiveShadow = true;
    hearthGroup.add(chimneyBreast);

    // Upper Chimney Stack to Ceiling
    const upperFlue = new THREE.Mesh(new THREE.BoxGeometry(1.25, 1.8, 0.85), hearthStoneMat);
    upperFlue.position.set(0, 3.3, -0.08);
    hearthGroup.add(upperFlue);

    // Raised Stone Hearth Slab
    const hearthSlab = new THREE.Mesh(
      new THREE.BoxGeometry(2.15, 0.14, 1.35),
      new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.7 })
    );
    hearthSlab.position.set(0, 0.07, 0.12);
    hearthSlab.receiveShadow = true;
    hearthGroup.add(hearthSlab);

    // Firebox Interior
    const firebox = new THREE.Mesh(
      new THREE.BoxGeometry(1.15, 1.05, 0.65),
      new THREE.MeshStandardMaterial({ color: 0x090d16, roughness: 0.95 })
    );
    firebox.position.set(0, 0.62, 0.26);
    hearthGroup.add(firebox);

    // Carved Walnut Mantel Shelf
    const mantel = new THREE.Mesh(
      new THREE.BoxGeometry(2.15, 0.18, 1.22),
      new THREE.MeshPhysicalMaterial({ color: 0x78350f, roughness: 0.4, clearcoat: 0.3 })
    );
    mantel.position.set(0, 1.92, 0.08);
    mantel.castShadow = true;
    hearthGroup.add(mantel);

    // Charred Oak Logs & Glowing Coal Bed
    const coalBed = new THREE.Mesh(
      new THREE.CylinderGeometry(0.38, 0.44, 0.1, 16),
      new THREE.MeshStandardMaterial({
        color: 0x7c2d12,
        emissive: isFireplaceOn ? 0xff4500 : 0x000000,
        emissiveIntensity: isFireplaceOn ? 1.2 : 0,
        roughness: 0.9,
      })
    );
    coalBed.position.set(0, 0.16, 0.28);
    hearthGroup.add(coalBed);

    const logMat = new THREE.MeshStandardMaterial({ color: 0x3b1908, roughness: 0.88 });
    [-0.22, 0.22].forEach((rot, idx) => {
      const log = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.095, 0.72, 12), logMat);
      log.rotation.z = Math.PI / 2 + rot;
      log.rotation.y = idx === 0 ? 0.25 : -0.25;
      log.position.set(0, 0.25 + idx * 0.06, 0.28);
      hearthGroup.add(log);
    });

    // Multi-Layered Volumetric Flame Group
    const flameGroup = new THREE.Group();
    flameGroup.position.set(0, 0.32, 0.28);
    flameGroup.visible = isFireplaceOn;

    const outerFlame = new THREE.Mesh(
      new THREE.ConeGeometry(0.28, 0.62, 12),
      new THREE.MeshBasicMaterial({ color: 0xff5500, transparent: true, opacity: 0.88 })
    );
    outerFlame.position.y = 0.22;
    flameGroup.add(outerFlame);

    const midFlame = new THREE.Mesh(
      new THREE.ConeGeometry(0.19, 0.48, 12),
      new THREE.MeshBasicMaterial({ color: 0xffaa00 })
    );
    midFlame.position.set(0.04, 0.2, 0.03);
    flameGroup.add(midFlame);

    const coreFlame = new THREE.Mesh(
      new THREE.ConeGeometry(0.1, 0.32, 10),
      new THREE.MeshBasicMaterial({ color: 0xfef08a })
    );
    coreFlame.position.set(-0.03, 0.16, 0.05);
    flameGroup.add(coreFlame);

    hearthGroup.add(flameGroup);
    stateRef.current.flameGroup = flameGroup;

    // Rising Fire Embers
    const eCount = 24;
    const eGeo = new THREE.BufferGeometry();
    const ePos = new Float32Array(eCount * 3);
    for (let i = 0; i < eCount; i++) {
      ePos[i * 3] = (Math.random() - 0.5) * 0.48;
      ePos[i * 3 + 1] = 0.35 + Math.random() * 1.1;
      ePos[i * 3 + 2] = 0.28 + (Math.random() - 0.5) * 0.3;
    }
    eGeo.setAttribute('position', new THREE.BufferAttribute(ePos, 3));
    const eMat = new THREE.PointsMaterial({
      color: 0xffb703,
      size: 0.075,
      transparent: true,
      opacity: isFireplaceOn ? 0.9 : 0,
    });
    const embers = new THREE.Points(eGeo, eMat);
    hearthGroup.add(embers);
    stateRef.current.emberParticles = embers;

    roomGroup.add(hearthGroup);

    // 9. WOVEN MANDALA TAPESTRY RUG
    const rugMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(1.75, 1.78, 0.035, 48),
      new THREE.MeshStandardMaterial({
        map: rugTex,
        roughness: 0.88,
        metalness: 0.04,
      })
    );
    rugMesh.position.set(0.35, 0.02, 0.25);
    rugMesh.receiveShadow = true;
    roomGroup.add(rugMesh);

    // 10. FOUR-POSTER CANOPY BED WITH PLUSH QUILT & PILLOWS
    const bedGroup = new THREE.Group();
    bedGroup.position.set(-1.95, 0, 1.45);
    bedGroup.add(createContactShadowMesh(1.35, 0.52));

    const bedWoodMat = new THREE.MeshPhysicalMaterial({
      color: 0x5c3419,
      roughness: 0.45,
      clearcoat: 0.25,
    });
    const bedFrame = new THREE.Mesh(new THREE.BoxGeometry(1.68, 0.36, 2.28), bedWoodMat);
    bedFrame.position.y = 0.22;
    bedFrame.castShadow = true;
    bedFrame.receiveShadow = true;
    bedGroup.add(bedFrame);

    // Headboard & 4 Turned Canopy Posts
    const headboard = new THREE.Mesh(new THREE.BoxGeometry(1.66, 1.15, 0.14), bedWoodMat);
    headboard.position.set(0, 0.72, -1.08);
    headboard.castShadow = true;
    bedGroup.add(headboard);

    [
      [-0.78, -1.08],
      [0.78, -1.08],
      [-0.78, 1.08],
      [0.78, 1.08],
    ].forEach(([px, pz]) => {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.065, 1.95, 12), bedWoodMat);
      post.position.set(px, 0.98, pz);
      post.castShadow = true;
      bedGroup.add(post);

      const finial = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 12), brassFrameMat);
      finial.position.set(px, 1.98, pz);
      bedGroup.add(finial);
    });

    // Plush Mattress, Velvet Duvet & Twin Pillows
    const mattress = new THREE.Mesh(
      new THREE.BoxGeometry(1.48, 0.28, 2.06),
      new THREE.MeshStandardMaterial({ color: 0xfef9c3, roughness: 0.85 })
    );
    mattress.position.y = 0.46;
    mattress.castShadow = true;
    bedGroup.add(mattress);

    const mascotTint = new THREE.Color(mascot.furColor || mascot.hairColors[0] || '#f59e0b');
    const duvet = new THREE.Mesh(
      new THREE.BoxGeometry(1.52, 0.18, 1.38),
      new THREE.MeshPhysicalMaterial({
        color: mascotTint,
        roughness: 0.65,
        sheen: 0.85,
        sheenColor: new THREE.Color('#ffffff'),
      })
    );
    duvet.position.set(0, 0.54, 0.34);
    duvet.castShadow = true;
    bedGroup.add(duvet);

    [-0.36, 0.36].forEach((px) => {
      const pillow = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.14, 0.36, 8, 16),
        new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8 })
      );
      pillow.rotation.z = Math.PI / 2;
      pillow.position.set(px, 0.66, -0.72);
      pillow.castShadow = true;
      bedGroup.add(pillow);
    });

    roomGroup.add(bedGroup);

    // 11. INVENTOR'S STUDY DESK, TELESCOPE & CRYSTALLINE LANTERN
    const deskGroup = new THREE.Group();
    deskGroup.position.set(2.05, 0, -2.15);
    deskGroup.add(createContactShadowMesh(1.15, 0.48));

    const deskTop = new THREE.Mesh(new THREE.BoxGeometry(1.88, 0.12, 1.05), bedWoodMat);
    deskTop.position.y = 0.78;
    deskTop.castShadow = true;
    deskTop.receiveShadow = true;
    deskGroup.add(deskTop);

    [
      [-0.82, -0.42],
      [0.82, -0.42],
      [-0.82, 0.42],
      [0.82, 0.42],
    ].forEach(([lx, lz]) => {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.04, 0.76, 10), bedWoodMat);
      leg.position.set(lx, 0.38, lz);
      leg.castShadow = true;
      deskGroup.add(leg);
    });

    // Glowing Crystalline Alchemist Lamp on Desk
    const crystalLampMat = new THREE.MeshPhysicalMaterial({
      color: 0x38bdf8,
      emissive: 0x00f0ff,
      emissiveIntensity: 0.95,
      roughness: 0.1,
      metalness: 0.1,
      clearcoat: 1.0,
    });
    const crystalLamp = new THREE.Mesh(new THREE.OctahedronGeometry(0.2, 1), crystalLampMat);
    crystalLamp.position.set(0.55, 1.08, -0.15);
    deskGroup.add(crystalLamp);

    const lampBase = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 0.08, 16), brassFrameMat);
    lampBase.position.set(0.55, 0.88, -0.15);
    deskGroup.add(lampBase);

    // Brass Stargazer Telescope on Tripod
    const scopeTube = new THREE.Mesh(
      new THREE.CylinderGeometry(0.045, 0.07, 0.65, 14),
      brassFrameMat
    );
    scopeTube.rotation.z = 0.85;
    scopeTube.rotation.y = -0.4;
    scopeTube.position.set(-0.55, 1.15, -0.1);
    deskGroup.add(scopeTube);

    roomGroup.add(deskGroup);

    // 12. GRAND ARCHWAY BOOKSHELF WITH GLOWING POTIONS
    const shelfGroup = new THREE.Group();
    shelfGroup.position.set(2.92, 0, 0.85);
    shelfGroup.add(createContactShadowMesh(1.0, 0.45));

    const shelfBody = new THREE.Mesh(new THREE.BoxGeometry(0.42, 3.1, 1.95), bedWoodMat);
    shelfBody.position.y = 1.55;
    shelfBody.castShadow = true;
    shelfGroup.add(shelfBody);

    const bookColors = [0xef4444, 0x3b82f6, 0x10b981, 0xf59e0b, 0xa855f7, 0xec4899];
    for (let level = 0; level < 4; level++) {
      for (let b = -0.72; b <= 0.72; b += 0.24) {
        const spine = new THREE.Mesh(
          new THREE.BoxGeometry(0.32, 0.38, 0.16),
          new THREE.MeshStandardMaterial({
            color: bookColors[Math.abs(Math.round((level * 7 + b * 10))) % bookColors.length],
            roughness: 0.45,
          })
        );
        spine.position.set(-0.04, 0.52 + level * 0.68, b);
        shelfGroup.add(spine);
      }
    }
    roomGroup.add(shelfGroup);

    // 13. CELESTIAL CROWN SHRINE (For Max-Level Companions)
    if (isMaxLevel) {
      const crownShrine = new THREE.Group();
      crownShrine.position.set(0.35, 0, -1.35);
      crownShrine.add(createContactShadowMesh(0.65, 0.5));

      const pedestal = new THREE.Mesh(
        new THREE.CylinderGeometry(0.38, 0.48, 0.88, 24),
        new THREE.MeshPhysicalMaterial({
          color: 0x1e293b,
          metalness: 0.85,
          roughness: 0.18,
          clearcoat: 0.8,
        })
      );
      pedestal.position.y = 0.44;
      pedestal.castShadow = true;
      crownShrine.add(pedestal);

      const crystal = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.34, 0),
        new THREE.MeshPhysicalMaterial({
          color: 0xffd700,
          emissive: 0xf59e0b,
          emissiveIntensity: 0.45,
          metalness: 0.92,
          roughness: 0.08,
          clearcoat: 1.0,
        })
      );
      crystal.position.y = 1.18;
      crownShrine.add(crystal);

      const halo = new THREE.Mesh(
        new THREE.TorusGeometry(0.54, 0.035, 16, 36),
        new THREE.MeshBasicMaterial({ color: 0xfef08a })
      );
      halo.rotation.x = Math.PI / 2;
      halo.position.y = 1.18;
      crownShrine.add(halo);

      roomGroup.add(crownShrine);
      stateRef.current.crownShrine = crownShrine;
    }

    // 14. HIGH-DETAIL 10-PART VELVET PBR MASCOT COMPANION
    const mascotBuilt = createHighDetailMascot3D(mascot, {
      scale: 1.08,
      includeShadow: true,
      includeHitBox: true,
    });
    mascotBuilt.group.position.set(0.35, 0.04, 0.25);
    roomGroup.add(mascotBuilt.group);

    stateRef.current.mascotGroup = mascotBuilt.group;
    stateRef.current.mascotTail = mascotBuilt.tailGroup;
    stateRef.current.mascotHead = mascotBuilt.headGroup;
    stateRef.current.mascotHitBox = mascotBuilt.hitBox;

    // 15. ATMOSPHERIC FLOATING GOLDEN DUST MOTES & PETTING HEARTS
    const dCount = 32;
    const dGeo = new THREE.BufferGeometry();
    const dPos = new Float32Array(dCount * 3);
    for (let i = 0; i < dCount; i++) {
      dPos[i * 3] = (Math.random() - 0.5) * 5.2;
      dPos[i * 3 + 1] = 0.5 + Math.random() * 3.0;
      dPos[i * 3 + 2] = (Math.random() - 0.5) * 5.2;
    }
    dGeo.setAttribute('position', new THREE.BufferAttribute(dPos, 3));
    const dMat = new THREE.PointsMaterial({
      color: 0xfef08a,
      size: 0.055,
      transparent: true,
      opacity: 0.55,
    });
    const dustMotes = new THREE.Points(dGeo, dMat);
    scene.add(dustMotes);
    stateRef.current.dustMotes = dustMotes;

    const hCount = 18;
    const hGeo = new THREE.BufferGeometry();
    const hPos = new Float32Array(hCount * 3);
    for (let i = 0; i < hCount; i++) {
      hPos[i * 3] = 0.35 + (Math.random() - 0.5) * 0.85;
      hPos[i * 3 + 1] = 0.65 + Math.random() * 0.85;
      hPos[i * 3 + 2] = 0.25 + (Math.random() - 0.5) * 0.85;
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

    if (!engine.isSoftwareGl) {
      engine.renderer.compile(scene, camera);
    }

    // 16. POINTER ORBIT & RAYCAST PETTING INTERACTION
    const domElement = engine.renderer.domElement;
    let didDrag = false;

    const onPointerDown = (e: PointerEvent) => {
      didDrag = false;
      stateRef.current.dragStart = { x: e.clientX, y: e.clientY };
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!stateRef.current.dragStart) return;
      const dx = (e.clientX - stateRef.current.dragStart.x) * 0.007;
      const dy = (e.clientY - stateRef.current.dragStart.y) * 0.005;

      if (Math.abs(dx) > 0.008 || Math.abs(dy) > 0.008) {
        didDrag = true;
      }

      const o = stateRef.current.orbit;
      o.desiredTheta += dx;
      o.desiredPhi = Math.max(0.14, Math.min(1.12, o.desiredPhi + dy));
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

    // 17. FRAME-RATE INDEPENDENT DAMPED ANIMATION LOOP
    let disposed = false;
    stateRef.current.clock.start();

    const tick = () => {
      if (disposed) return;
      const dt = Math.min(stateRef.current.clock.getDelta(), 0.1);
      const elapsed = stateRef.current.clock.elapsedTime;
      const s = stateRef.current;
      const o = s.orbit;

      if (autoRotateRef.current && !s.dragStart) {
        o.desiredTheta += dt * 0.22;
      }

      // Exponential camera damping
      o.theta = THREE.MathUtils.damp(o.theta, o.desiredTheta, 6.5, dt);
      o.phi = THREE.MathUtils.damp(o.phi, o.desiredPhi, 6.5, dt);
      o.distance = THREE.MathUtils.damp(o.distance, o.desiredDistance, 6.5, dt);
      o.target.x = THREE.MathUtils.damp(o.target.x, o.desiredTarget.x, 6.5, dt);
      o.target.y = THREE.MathUtils.damp(o.target.y, o.desiredTarget.y, 6.5, dt);
      o.target.z = THREE.MathUtils.damp(o.target.z, o.desiredTarget.z, 6.5, dt);

      camera.position.x = o.target.x + o.distance * Math.sin(o.theta) * Math.cos(o.phi);
      camera.position.y = o.target.y + o.distance * Math.sin(o.phi);
      camera.position.z = o.target.z + o.distance * Math.cos(o.theta) * Math.cos(o.phi);
      camera.lookAt(o.target);

      // Fireplace Flicker & Volumetric Flame Dance
      if (s.hearthLight) {
        if (fireplaceOnRef.current) {
          s.hearthLight.intensity =
            4.4 + Math.sin(elapsed * 9.5) * 0.55 + Math.cos(elapsed * 15.0) * 0.35;
        } else {
          s.hearthLight.intensity = 0.1;
        }
      }
      if (s.flameGroup) {
        s.flameGroup.visible = fireplaceOnRef.current;
        if (fireplaceOnRef.current) {
          s.flameGroup.scale.y = 1.0 + Math.sin(elapsed * 12) * 0.14;
          s.flameGroup.scale.x = 1.0 + Math.cos(elapsed * 10) * 0.08;
        }
      }

      // Rising Embers
      if (s.emberParticles) {
        const mat = s.emberParticles.material as THREE.PointsMaterial;
        mat.opacity = fireplaceOnRef.current ? 0.9 : 0;
        if (fireplaceOnRef.current) {
          const eAttr = s.emberParticles.geometry.attributes.position as THREE.BufferAttribute;
          for (let i = 0; i < eAttr.count; i++) {
            let y = eAttr.getY(i) + dt * 0.65;
            if (y > 1.85) y = 0.35;
            eAttr.setY(i, y);
          }
          eAttr.needsUpdate = true;
        }
      }

      // Floating Golden Dust Motes
      if (s.dustMotes) {
        s.dustMotes.rotation.y = elapsed * 0.04;
      }

      // Subtle Chandelier Sway
      if (s.chandelierGroup) {
        s.chandelierGroup.rotation.z = Math.sin(elapsed * 1.2) * 0.015;
      }

      // Rotating Crown Shrine
      if (s.crownShrine) {
        s.crownShrine.rotation.y += dt * 1.1;
        const crystal = s.crownShrine.children[2];
        if (crystal) {
          crystal.position.y = 1.18 + Math.sin(elapsed * 3) * 0.06;
        }
      }

      // Mascot Breathing, Head Tilt, Tail Wag & Petting Hop
      if (s.mascotGroup) {
        const breath = 1.08 + Math.sin(elapsed * 3.2) * 0.025;
        s.mascotGroup.scale.set(breath, breath, breath);

        if (s.mascotTail) {
          s.mascotTail.rotation.y = Math.sin(elapsed * 6.5) * 0.38;
        }
        if (s.mascotHead) {
          s.mascotHead.rotation.z = Math.sin(elapsed * 2.1) * 0.05;
        }

        if (s.isPettingAnim > 0) {
          s.isPettingAnim = Math.max(0, s.isPettingAnim - dt * 1.6);
          const hop = Math.sin((1.0 - s.isPettingAnim) * Math.PI) * 0.38;
          s.mascotGroup.position.y = 0.04 + Math.max(0, hop);
          s.mascotGroup.rotation.y += dt * 4.5;

          if (s.heartParticles) {
            (s.heartParticles.material as THREE.PointsMaterial).opacity = s.isPettingAnim;
            const hAttr = s.heartParticles.geometry.attributes.position as THREE.BufferAttribute;
            for (let i = 0; i < hAttr.count; i++) {
              hAttr.setY(i, hAttr.getY(i) + dt * 0.8);
            }
            hAttr.needsUpdate = true;
          }
        } else {
          s.mascotGroup.position.y = 0.04;
          s.mascotGroup.rotation.y = THREE.MathUtils.damp(s.mascotGroup.rotation.y, 0, 5, dt);
          if (s.heartParticles) {
            (s.heartParticles.material as THREE.PointsMaterial).opacity = 0;
          }
        }
      }

      engine.renderFrame(bloomEnabledRef.current);
      s.animId = engine.scheduleNextFrame(tick);
    };

    stateRef.current.animId = engine.scheduleNextFrame(tick);

    // 18. Resize Observer
    const handleResize = () => {
      if (!container || !stateRef.current.engine) return;
      const w = container.clientWidth || 400;
      const h = container.clientHeight || 440;
      stateRef.current.engine.resize(w, h);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    // 19. Cleanup
    return () => {
      disposed = true;
      cancelAnimationFrame(stateRef.current.animId);
      clearTimeout(stateRef.current.animId);
      resizeObserver.disconnect();
      domElement.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);

      woodPlankTex.dispose();
      masonryWallTex.dispose();
      rugTex.dispose();

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

      engine.dispose();
      if (domElement.parentNode) {
        domElement.parentNode.removeChild(domElement);
      }
    };
  }, [mascot.id, isMaxLevel, lightingPreset]);

  return (
    <div className="relative w-full aspect-[4/3] min-h-[430px] rounded-3xl overflow-hidden border-2 border-indigo-900/60 shadow-2xl bg-slate-950 select-none">
      {/* Dedicated Isolated WebGL Canvas Mount */}
      <div
        ref={mountRef}
        className="w-full h-full cursor-grab active:cursor-grabbing touch-none"
        style={{ touchAction: 'none' }}
      />

      {/* Minimal Top-Left Sanctuary Spec Badge & Companion Selector */}
      <div className="absolute top-2.5 left-3 right-3 flex items-center justify-between pointer-events-none z-10 gap-2">
        <div className="flex items-center gap-2 pointer-events-auto bg-slate-950/90 px-3 py-1.5 rounded-2xl border border-slate-800 shadow-lg">
          <span className="text-base">🏡</span>
          <div>
            <div className="text-[11px] font-black text-white flex items-center gap-1.5">
              <span>{mascot.name}&apos;s 3D Sanctuary</span>
              <span className="text-[9px] text-amber-300 font-bold">
                · {enableBloomEngine ? 'PBR + Bloom' : 'PBR Studio'}
              </span>
            </div>
            <div className="text-[8.5px] text-slate-400">
              Tap companion to pet · Drag to orbit
              {pettingCount > 0 ? ` · Petted ${pettingCount}x` : ''}
            </div>
          </div>
        </div>

        {/* Companion Switcher Pills */}
        {allMascots.length > 1 && onSelectActiveMascot && (
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pointer-events-auto bg-slate-950/90 p-1 rounded-2xl border border-slate-800 shadow-lg max-w-[54%]">
            {allMascots.map((m) => {
              const isSelected = m.id === mascot.id;
              return (
                <button
                  key={m.id}
                  onClick={() => {
                    onSelectActiveMascot(m.id);
                    SoundEngine.playTileStep();
                  }}
                  className={`px-2 py-1 rounded-xl text-[9px] font-bold whitespace-nowrap shrink-0 flex items-center gap-1 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-amber-400 text-slate-950 font-black shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <span>
                    {m.earStyle === 'bunny'
                      ? '🐰'
                      : m.earStyle === 'cat'
                      ? '🦊'
                      : m.earStyle === 'bear'
                      ? '🐼'
                      : m.earStyle === 'tuft'
                      ? '🦌'
                      : '🐾'}
                  </span>
                  <span>{m.name}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Petting Heart Floating Toast */}
      {showPetHeartToast && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20 flex flex-col items-center gap-1">
          <span className="text-4xl drop-shadow-[0_0_15px_rgba(244,63,94,0.9)]">💖</span>
          <span className="text-[10px] font-black bg-rose-950/95 text-rose-200 px-2.5 py-0.5 rounded-xl border border-rose-500/50 shadow-lg">
            *happy squeak!*
          </span>
        </div>
      )}

      {/* Unified Collapsible Bottom Control Dock (Zero Viewport Occlusion) */}
      <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center w-[94%] max-w-[520px] pointer-events-none">
        <button
          onClick={() => setIsHudCollapsed((prev) => !prev)}
          className="pointer-events-auto mb-1 px-2.5 py-0.5 rounded-t-xl bg-slate-950/90 border border-b-0 border-slate-800 text-[9px] font-bold text-slate-300 hover:text-white flex items-center gap-1 cursor-pointer shadow-md"
        >
          {isHudCollapsed ? (
            <>
              <ChevronUp className="w-3 h-3" />
              <span>Show Sanctuary Controls</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-3 h-3" />
              <span>Hide Controls</span>
            </>
          )}
        </button>

        {!isHudCollapsed && (
          <div className="pointer-events-auto w-full bg-slate-950/95 border border-slate-800 rounded-2xl px-3 py-2 shadow-2xl flex items-center justify-between gap-1.5 flex-wrap">
            {/* Camera Presets */}
            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
              {(['overview', 'mascot', 'fireplace', 'desk'] as const).map((preset) => (
                <button
                  key={preset}
                  onClick={() => setCameraPreset(preset)}
                  className={`px-2 py-1 rounded-lg text-[9px] font-bold capitalize whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                    cameraPreset === preset
                      ? 'bg-amber-400 text-slate-950 font-black shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {preset === 'overview'
                    ? 'Room'
                    : preset === 'mascot'
                    ? 'Mascot'
                    : preset === 'fireplace'
                    ? 'Hearth'
                    : 'Study'}
                </button>
              ))}
            </div>

            {/* Ambiance, Hearth, Bloom Engine & Orbit Controls */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => {
                  setIsFireplaceOn((prev) => !prev);
                  SoundEngine.playTileStep();
                }}
                className={`px-2 py-1 rounded-xl text-[9px] font-bold flex items-center gap-1 border transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  isFireplaceOn
                    ? 'bg-amber-500/20 text-amber-300 border-amber-400/50'
                    : 'bg-slate-900 text-slate-400 border-slate-800'
                }`}
                title="Toggle Hearth Fire"
              >
                <Flame className="w-3 h-3" />
                <span>Fire</span>
              </button>

              <button
                onClick={() => {
                  setLightingPreset((prev) =>
                    prev === 'hearth' ? 'twilight' : prev === 'twilight' ? 'sun' : 'hearth'
                  );
                  SoundEngine.playTileStep();
                }}
                className="px-2 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-[9px] font-bold text-slate-200 cursor-pointer whitespace-nowrap shrink-0"
                title="Switch Lighting Mood"
              >
                {lightingPreset === 'hearth'
                  ? '🔥 Hearth'
                  : lightingPreset === 'twilight'
                  ? '🌙 Twilight'
                  : '☀️ Daylight'}
              </button>


              <button
                onClick={() => setIsAutoRotate((prev) => !prev)}
                className={`p-1.5 rounded-xl border transition-all cursor-pointer ${
                  isAutoRotate
                    ? 'text-cyan-300 bg-cyan-950/70 border-cyan-500/40'
                    : 'text-slate-400 bg-slate-900 border-slate-800'
                }`}
                title="Toggle Auto-Orbit"
              >
                <RotateCw className={`w-3.5 h-3.5 ${isAutoRotate ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
