import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Town, Landmark, Mascot } from '../types';
import { SoundEngine } from '../utils/sound';
import confetti from 'canvas-confetti';
import {
  RotateCw, Hammer, X, Sparkles, ChevronDown, ChevronUp
} from 'lucide-react';
import {
  createThreeGraphicsEngine,
  createLushMeadowGrassTexture,
  createCobblestonePlazaTexture,
  createRoofShingleTexture,
  createContactShadowMesh,
  createHighDetailMascot3D,
  GraphicsEngineInstance,
} from '../utils/threeGraphicsEngine';

interface StandaloneThreeTownProps {
  town: Town;
  coins: number;
  playerLevel?: number;
  activeMascot: Mascot;
  allMascots?: Mascot[];
  onUpgradeLandmark?: (landmarkId: string, cost: number) => void;
  onSelectActiveMascot?: (mascotId: string) => void;
}

// Landmark 3D world coordinates on the standalone town landscape
const LANDMARK_OFFSETS: Record<string, { x: number; z: number; label: string; icon: string }> = {
  Sparkles: { x: 0, z: -0.7, label: 'Town Hall & Clocktower', icon: 'Sparkles' },
  Droplets: { x: 0, z: 1.85, label: 'Prism Fountain', icon: 'Droplets' },
  Home: { x: -3.45, z: -1.2, label: 'Guildhouse & Bakery', icon: 'Home' },
  Utensils: { x: 3.55, z: -1.35, label: 'Star Windmill', icon: 'Utensils' },
  Gamepad2: { x: -3.35, z: 1.9, label: 'Neon Arcade', icon: 'Gamepad2' },
  Radio: { x: 3.35, z: 2.0, label: 'Cinema & Broadcast', icon: 'Radio' },
  Music: { x: -1.85, z: -3.25, label: 'Sound Stage', icon: 'Music' },
  Zap: { x: 1.85, z: -3.25, label: 'Quantum Beacon', icon: 'Zap' },
};

export const StandaloneThreeTown: React.FC<StandaloneThreeTownProps> = ({
  town,
  coins,
  activeMascot,
  allMascots = [],
  onUpgradeLandmark,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);

  // Inspector, Ambiance & Graphics Engine state
  const [selectedLandmark, setSelectedLandmark] = useState<Landmark | null>(null);
  const [isPlaygroundSelected, setIsPlaygroundSelected] = useState(false);
  const [playgroundBoostCount, setPlaygroundBoostCount] = useState(0);
  const [timeOfDay, setTimeOfDay] = useState<'day' | 'twilight' | 'night'>('day');
  const [isAutoRotate, setIsAutoRotate] = useState(true);
  const [enableBloomEngine, setEnableBloomEngine] = useState(true);
  const [isHudCollapsed, setIsHudCollapsed] = useState(false);
  const [cameraViewPreset, setCameraViewPreset] = useState<'overview' | 'plaza' | 'playground' | 'windmill'>('overview');

  // Synced refs for animation loop
  const autoRotateRef = useRef(isAutoRotate);
  autoRotateRef.current = isAutoRotate;
  const bloomEnabledRef = useRef(enableBloomEngine);
  bloomEnabledRef.current = enableBloomEngine;

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
      radius: number;
      target: THREE.Vector3;
      desiredTheta: number;
      desiredPhi: number;
      desiredRadius: number;
      desiredTarget: THREE.Vector3;
    };
    interactiveObjects: THREE.Object3D[];
    selectionRing: THREE.Mesh | null;
    playgroundSpinBoost: number;
    animatedProps: {
      windmillSails?: THREE.Object3D;
      fountainWater?: THREE.Points;
      bakerySmoke?: THREE.Points;
      arcadeHoloDice?: THREE.Mesh;
      radioDish?: THREE.Object3D;
      wanderingMascots?: {
        group: THREE.Group;
        tail: THREE.Group;
        angle: number;
        speed: number;
      }[];
      townHallClockHand?: THREE.Mesh;
      treeCrowns?: { group: THREE.Group; phase: number }[];
      merryGoRound?: THREE.Group;
      swingSeats?: THREE.Group[];
      seesawPlank?: THREE.Group;
      blossomPetals?: THREE.Points;
      cloudsGroup?: THREE.Group;
      waterfallDroplets?: THREE.Points;
    };
    raycaster: THREE.Raycaster;
    mouse: THREE.Vector2;
  }>({
    engine: null,
    scene: null,
    camera: null,
    animId: 0,
    clock: new THREE.Clock(),
    dragStart: null,
    orbit: {
      theta: 0.45,
      phi: 0.54,
      radius: 15.2,
      target: new THREE.Vector3(0, 0.65, 0.4),
      desiredTheta: 0.45,
      desiredPhi: 0.54,
      desiredRadius: 15.2,
      desiredTarget: new THREE.Vector3(0, 0.65, 0.4),
    },
    interactiveObjects: [],
    selectionRing: null,
    playgroundSpinBoost: 0,
    animatedProps: {},
    raycaster: new THREE.Raycaster(),
    mouse: new THREE.Vector2(-999, -999),
  });

  // Smooth camera transitions on preset change
  useEffect(() => {
    const o = stateRef.current.orbit;
    if (cameraViewPreset === 'overview') {
      o.desiredRadius = 15.2;
      o.desiredPhi = 0.54;
      o.desiredTarget.set(0, 0.65, 0.4);
    } else if (cameraViewPreset === 'plaza') {
      o.desiredRadius = 9.2;
      o.desiredPhi = 0.44;
      o.desiredTarget.set(0, 1.05, 0.5);
    } else if (cameraViewPreset === 'playground') {
      o.desiredRadius = 7.4;
      o.desiredPhi = 0.38;
      o.desiredTheta = 0.12;
      o.desiredTarget.set(0, 0.85, 4.35);
    } else if (cameraViewPreset === 'windmill') {
      o.desiredRadius = 9.8;
      o.desiredPhi = 0.46;
      o.desiredTheta = 0.72;
      o.desiredTarget.set(3.55, 1.25, -1.35);
    }
  }, [cameraViewPreset]);

  // Main Three.js Studio Town Lifecycle
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 420;
    const height = container.clientHeight || 450;

    // 1. Scene & Camera Setup
    const scene = new THREE.Scene();
    stateRef.current.scene = scene;

    const bgColors = {
      day: 0x60bdf2,
      twilight: 0x1e1538,
      night: 0x060a1c,
    };
    scene.background = new THREE.Color(bgColors[timeOfDay]);
    scene.fog = new THREE.FogExp2(bgColors[timeOfDay], timeOfDay === 'night' ? 0.02 : 0.012);

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 110);
    camera.position.set(0, 9.5, 15.2);
    camera.lookAt(0, 0.65, 0.4);
    stateRef.current.camera = camera;

    // 2. Studio PBR & Post-Processing Engine
    const engine = createThreeGraphicsEngine(scene, camera, width, height, {
      bloomStrength: timeOfDay === 'day' ? 0.24 : 0.42,
      bloomRadius: 0.45,
      bloomThreshold: 0.78,
      exposure: timeOfDay === 'day' ? 1.15 : 1.08,
    });
    container.appendChild(engine.renderer.domElement);
    stateRef.current.engine = engine;

    // 3. Studio Sky/Ground Hemisphere & Directional Sun Lighting Rig
    const hemiLight = new THREE.HemisphereLight(
      timeOfDay === 'night' ? 0x3b82f6 : timeOfDay === 'twilight' ? 0xc084fc : 0xe0f2fe,
      timeOfDay === 'night' ? 0x091526 : 0x14532d,
      timeOfDay === 'night' ? 1.15 : timeOfDay === 'twilight' ? 1.55 : 1.9
    );
    hemiLight.position.set(0, 25, 0);
    scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight(
      timeOfDay === 'night' ? 0x93c5fd : timeOfDay === 'twilight' ? 0xfb923c : 0xfffbeb,
      timeOfDay === 'night' ? 1.45 : timeOfDay === 'twilight' ? 2.85 : 3.2
    );
    sunLight.position.set(11, 19, 13);
    sunLight.castShadow = !engine.isSoftwareGl;
    sunLight.shadow.mapSize.width = engine.isSoftwareGl ? 1024 : 2048;
    sunLight.shadow.mapSize.height = engine.isSoftwareGl ? 1024 : 2048;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 48;
    sunLight.shadow.camera.left = -10.5;
    sunLight.shadow.camera.right = 10.5;
    sunLight.shadow.camera.top = 10.5;
    sunLight.shadow.camera.bottom = -10.5;
    sunLight.shadow.bias = -0.0005;
    sunLight.shadow.normalBias = 0.02;
    scene.add(sunLight);

    // Rim / Backlight for 3D Silhouette Separation
    const rimLight = new THREE.DirectionalLight(
      timeOfDay === 'day' ? 0xbae6fd : 0x818cf8,
      0.85
    );
    rimLight.position.set(-10, 8, -12);
    scene.add(rimLight);

    // 4. PROCEDURAL PBR TEXTURES
    const grassTex = createLushMeadowGrassTexture(timeOfDay, engine.maxAnisotropy);
    const cobbleTex = createCobblestonePlazaTexture(engine.maxAnisotropy);
    const redRoofTex = createRoofShingleTexture('#b91c1c', engine.maxAnisotropy);
    const amberRoofTex = createRoofShingleTexture('#b45309', engine.maxAnisotropy);

    const interactives: THREE.Object3D[] = [];
    stateRef.current.interactiveObjects = interactives;

    const landscapeGroup = new THREE.Group();

    // 5. SCULPTED MULTI-TIER ISLAND TERRAIN, ROCKY CLIFFS & CRYSTAL WATERFALL LAGOON
    // Tier 1: Deep Basalt Cliff Foundation
    const cliffMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.88,
      metalness: 0.12,
      flatShading: true,
    });
    const cliffBase = new THREE.Mesh(new THREE.CylinderGeometry(7.35, 6.65, 1.2, 32), cliffMat);
    cliffBase.position.y = -0.45;
    cliffBase.receiveShadow = true;
    landscapeGroup.add(cliffBase);

    // Tier 2: Warm Sandstone Rim
    const rimMat = new THREE.MeshStandardMaterial({
      color: 0x64748b,
      roughness: 0.8,
      metalness: 0.1,
    });
    const rimMesh = new THREE.Mesh(new THREE.CylinderGeometry(7.2, 7.35, 0.28, 48), rimMat);
    rimMesh.position.y = 0.06;
    rimMesh.receiveShadow = true;
    landscapeGroup.add(rimMesh);

    // Tier 3: Textured Botanical Meadow Lawn
    const meadowMat = new THREE.MeshStandardMaterial({
      map: grassTex,
      roughness: 0.78,
      metalness: 0.04,
    });
    const meadowMesh = new THREE.Mesh(new THREE.CylinderGeometry(7.05, 7.12, 0.36, 64), meadowMat);
    meadowMesh.position.y = 0.18;
    meadowMesh.receiveShadow = true;
    landscapeGroup.add(meadowMesh);

    // Natural Perimeter Rock Outcrops around the Island Edge
    const rockAngles = [0.35, 0.95, 1.85, 2.55, 3.65, 4.35, 5.25, 5.85];
    rockAngles.forEach((rAng, idx) => {
      const rockGroup = new THREE.Group();
      const rad = 6.55 + (idx % 2) * 0.2;
      rockGroup.position.set(Math.cos(rAng) * rad, 0.36, Math.sin(rAng) * rad);

      const mainBoulder = new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.34 + (idx % 3) * 0.08, 0),
        cliffMat
      );
      mainBoulder.scale.set(1.2, 0.75, 1.0);
      mainBoulder.rotation.set(idx * 0.4, rAng, 0);
      mainBoulder.castShadow = true;
      mainBoulder.receiveShadow = true;
      rockGroup.add(mainBoulder);

      const subBoulder = new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.22, 0),
        rimMat
      );
      subBoulder.position.set(0.24, -0.06, 0.12);
      subBoulder.castShadow = true;
      rockGroup.add(subBoulder);

      landscapeGroup.add(rockGroup);
    });

    // Crystal Lagoon Stream & Cascading Waterfall (West/South-West Cove)
    const waterMat = new THREE.MeshPhysicalMaterial({
      color: 0x38bdf8,
      emissive: timeOfDay === 'night' ? 0x0284c7 : 0x000000,
      emissiveIntensity: timeOfDay === 'night' ? 0.35 : 0,
      roughness: 0.08,
      metalness: 0.15,
      transmission: engine.isSoftwareGl ? 0 : 0.75,
      transparent: true,
      opacity: engine.isSoftwareGl ? 0.82 : 0.92,
      ior: 1.33,
      clearcoat: 1.0,
    });

    const lagoonPond = new THREE.Mesh(new THREE.CylinderGeometry(1.35, 1.35, 0.05, 32), waterMat);
    lagoonPond.position.set(-5.15, 0.365, -0.85);
    landscapeGroup.add(lagoonPond);

    // Waterfall Cascade down the Western Cliff Edge
    const cascade = new THREE.Mesh(new THREE.BoxGeometry(0.65, 1.15, 0.08), waterMat);
    cascade.position.set(-6.95, -0.18, -0.85);
    cascade.rotation.z = 0.22;
    landscapeGroup.add(cascade);

    // Waterfall Mist / Droplet Particles
    const wfCount = 24;
    const wfGeo = new THREE.BufferGeometry();
    const wfPos = new Float32Array(wfCount * 3);
    for (let i = 0; i < wfCount; i++) {
      wfPos[i * 3] = -6.85 + (Math.random() - 0.5) * 0.35;
      wfPos[i * 3 + 1] = -0.6 + Math.random() * 1.0;
      wfPos[i * 3 + 2] = -0.85 + (Math.random() - 0.5) * 0.45;
    }
    wfGeo.setAttribute('position', new THREE.BufferAttribute(wfPos, 3));
    const wfMat = new THREE.PointsMaterial({
      color: 0xe0f2fe,
      size: 0.09,
      transparent: true,
      opacity: 0.75,
    });
    const waterfallDroplets = new THREE.Points(wfGeo, wfMat);
    landscapeGroup.add(waterfallDroplets);

    // Arched Timber Footbridge over Lagoon
    const bridgeGroup = new THREE.Group();
    bridgeGroup.position.set(-4.65, 0.38, -0.85);
    const bridgeWoodMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.65 });
    for (let p = -3; p <= 3; p++) {
      const plank = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.04, 0.68), bridgeWoodMat);
      plank.position.set(p * 0.16, Math.cos(p * 0.35) * 0.12, 0);
      plank.castShadow = true;
      bridgeGroup.add(plank);
    }
    landscapeGroup.add(bridgeGroup);

    // 6. COBBLESTONE GRAND PLAZA & RADIATING STONE AVENUES
    const plazaMat = new THREE.MeshStandardMaterial({
      map: cobbleTex,
      roughness: 0.68,
      metalness: 0.1,
    });
    const plazaMesh = new THREE.Mesh(new THREE.CylinderGeometry(2.55, 2.58, 0.05, 48), plazaMat);
    plazaMesh.position.y = 0.37;
    plazaMesh.receiveShadow = true;
    landscapeGroup.add(plazaMesh);

    const roadAngles = [
      0,
      Math.PI / 4,
      Math.PI / 2,
      (3 * Math.PI) / 4,
      Math.PI,
      (5 * Math.PI) / 4,
      (3 * Math.PI) / 2,
      (7 * Math.PI) / 4,
    ];
    const roadMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      roughness: 0.75,
      metalness: 0.08,
    });
    roadAngles.forEach((ang) => {
      const road = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.04, 3.85), roadMat);
      road.rotation.y = ang;
      road.position.set(Math.sin(ang) * 3.45, 0.362, Math.cos(ang) * 3.45);
      road.receiveShadow = true;
      landscapeGroup.add(road);
    });

    // 7. VOLUMETRIC DRIFTING SKY CLOUDS
    const cloudsGroup = new THREE.Group();
    const cloudMat = new THREE.MeshStandardMaterial({
      color: timeOfDay === 'night' ? 0x334155 : timeOfDay === 'twilight' ? 0xfda4af : 0xffffff,
      roughness: 0.9,
      transparent: true,
      opacity: 0.85,
    });
    for (let c = 0; c < 5; c++) {
      const cCluster = new THREE.Group();
      const cAng = (c * Math.PI * 2) / 5;
      cCluster.position.set(Math.cos(cAng) * 11.5, 6.2 + (c % 2) * 0.9, Math.sin(cAng) * 11.5);
      [
        { x: 0, y: 0, z: 0, r: 0.75 },
        { x: -0.55, y: -0.1, z: 0.1, r: 0.55 },
        { x: 0.55, y: -0.08, z: -0.1, r: 0.52 },
      ].forEach((puff) => {
        const m = new THREE.Mesh(new THREE.SphereGeometry(puff.r, 14, 14), cloudMat);
        m.scale.set(1.3, 0.75, 1.0);
        m.position.set(puff.x, puff.y, puff.z);
        cCluster.add(m);
      });
      cloudsGroup.add(cCluster);
    }
    scene.add(cloudsGroup);

    // 8. REALISTIC MULTI-BRANCHED ORGANIC 3D TREES WITH CONTACT SHADOWS
    const treeSpecs: {
      x: number;
      z: number;
      scale: number;
      style: 'oak' | 'sakura' | 'autumn' | 'pine';
    }[] = [
      { x: -5.2, z: 0.75, scale: 1.18, style: 'oak' },
      { x: -4.75, z: -2.95, scale: 1.08, style: 'sakura' },
      { x: -2.25, z: 4.85, scale: 1.04, style: 'sakura' },
      { x: 2.35, z: 4.75, scale: 1.12, style: 'oak' },
      { x: 5.15, z: 0.35, scale: 1.22, style: 'autumn' },
      { x: 4.55, z: -3.45, scale: 1.05, style: 'oak' },
      { x: 0.1, z: -5.25, scale: 1.18, style: 'pine' },
      { x: -3.45, z: -4.65, scale: 0.98, style: 'autumn' },
      { x: -5.05, z: 3.25, scale: 0.94, style: 'pine' },
      { x: 4.95, z: 3.35, scale: 1.0, style: 'sakura' },
    ];

    const treeCrowns: { group: THREE.Group; phase: number }[] = [];

    treeSpecs.forEach((ts, idx) => {
      const treeGroup = new THREE.Group();
      treeGroup.position.set(ts.x, 0.36, ts.z);
      treeGroup.scale.setScalar(ts.scale);
      treeGroup.add(createContactShadowMesh(0.72, 0.48));

      // Stone Tree-Ring Planter
      const ringStone = new THREE.Mesh(
        new THREE.TorusGeometry(0.44, 0.065, 10, 20),
        new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.82 })
      );
      ringStone.rotation.x = Math.PI / 2;
      ringStone.position.y = 0.03;
      treeGroup.add(ringStone);

      const barkMat = new THREE.MeshStandardMaterial({
        color: ts.style === 'sakura' ? 0x4a2c2a : 0x5c3a21,
        roughness: 0.88,
      });

      const rootFlare = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.29, 0.3, 12), barkMat);
      rootFlare.position.y = 0.15;
      rootFlare.castShadow = true;
      treeGroup.add(rootFlare);

      const mainTrunk = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.16, 0.88, 12), barkMat);
      mainTrunk.position.y = 0.56;
      mainTrunk.castShadow = true;
      treeGroup.add(mainTrunk);

      // 3 Secondary Woody Boughs
      const branchAngles = [0, (2 * Math.PI) / 3, (4 * Math.PI) / 3];
      branchAngles.forEach((bAng, bIdx) => {
        const bough = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.075, 0.58, 10), barkMat);
        bough.position.set(Math.cos(bAng) * 0.17, 0.94 + bIdx * 0.05, Math.sin(bAng) * 0.17);
        bough.rotation.z = -Math.cos(bAng) * 0.56;
        bough.rotation.x = Math.sin(bAng) * 0.56;
        bough.castShadow = true;
        treeGroup.add(bough);
      });

      // Multi-Clustered Organic Canopy
      const crownGroup = new THREE.Group();
      crownGroup.position.y = 1.18;

      const palette =
        ts.style === 'sakura'
          ? [0xf472b6, 0xf9a8d4, 0xfbcfe8, 0xec4899]
          : ts.style === 'autumn'
          ? [0xd97706, 0xf59e0b, 0xea580c, 0xfbbf24]
          : ts.style === 'pine'
          ? [0x065f46, 0x047857, 0x059669, 0x10b981]
          : [0x15803d, 0x16a34a, 0x22c55e, 0x4ade80];

      const puffOffsets = [
        { x: 0, y: 0.34, z: 0, r: 0.5 },
        { x: -0.34, y: 0.08, z: 0.18, r: 0.4 },
        { x: 0.36, y: 0.12, z: 0.16, r: 0.38 },
        { x: 0.05, y: 0.1, z: -0.36, r: 0.41 },
        { x: -0.25, y: 0.25, z: -0.22, r: 0.36 },
        { x: 0.25, y: 0.27, z: -0.18, r: 0.35 },
      ];

      puffOffsets.forEach((po, pIdx) => {
        const leafGeo = new THREE.DodecahedronGeometry(po.r, 1);
        const leafMat = new THREE.MeshStandardMaterial({
          color: palette[pIdx % palette.length],
          roughness: 0.68,
          metalness: 0.04,
          flatShading: true,
        });
        const puff = new THREE.Mesh(leafGeo, leafMat);
        puff.position.set(po.x, po.y, po.z);
        puff.rotation.set(pIdx * 0.5, pIdx * 0.8, 0);
        puff.castShadow = true;
        puff.receiveShadow = true;
        crownGroup.add(puff);
      });

      treeGroup.add(crownGroup);
      treeCrowns.push({ group: crownGroup, phase: idx * 0.9 });

      // Wildflowers at base
      const flowerColors = [0xf43f5e, 0xfacc15, 0xc084fc, 0x38bdf8];
      for (let f = 0; f < 5; f++) {
        const fAng = (f * Math.PI * 2) / 5 + idx;
        const flower = new THREE.Mesh(
          new THREE.SphereGeometry(0.055, 8, 8),
          new THREE.MeshBasicMaterial({ color: flowerColors[f % flowerColors.length] })
        );
        flower.position.set(Math.cos(fAng) * 0.33, 0.06, Math.sin(fAng) * 0.33);
        treeGroup.add(flower);
      }

      landscapeGroup.add(treeGroup);
    });

    // Drifting Sakura & Leaf Petals across Town
    const petalCount = 36;
    const petalGeo = new THREE.BufferGeometry();
    const petalPos = new Float32Array(petalCount * 3);
    for (let i = 0; i < petalCount; i++) {
      petalPos[i * 3] = (Math.random() - 0.5) * 11;
      petalPos[i * 3 + 1] = 0.6 + Math.random() * 3.8;
      petalPos[i * 3 + 2] = (Math.random() - 0.5) * 11;
    }
    petalGeo.setAttribute('position', new THREE.BufferAttribute(petalPos, 3));
    const petalMat = new THREE.PointsMaterial({
      color: 0xf9a8d4,
      size: 0.08,
      transparent: true,
      opacity: 0.85,
    });
    const blossomPetals = new THREE.Points(petalGeo, petalMat);
    scene.add(blossomPetals);

    // 9. SUNSHINE MASCOT PLAYGROUND PARK (South Park District: x: 0, z: 4.35)
    const playgroundGroup = new THREE.Group();
    playgroundGroup.position.set(0, 0.36, 4.35);
    playgroundGroup.name = 'town_playground';
    playgroundGroup.add(createContactShadowMesh(1.95, 0.45));

    const playPad = new THREE.Mesh(
      new THREE.CylinderGeometry(1.78, 1.84, 0.06, 40),
      new THREE.MeshStandardMaterial({ color: 0x0d9488, roughness: 0.6 })
    );
    playPad.position.y = 0.03;
    playPad.receiveShadow = true;
    playgroundGroup.add(playPad);

    const playPadInner = new THREE.Mesh(
      new THREE.CylinderGeometry(1.64, 1.64, 0.07, 40),
      new THREE.MeshStandardMaterial({ color: 0x14b8a6, roughness: 0.65 })
    );
    playPadInner.position.y = 0.035;
    playPadInner.receiveShadow = true;
    playgroundGroup.add(playPadInner);

    // 9A) Ornate Pavilion Merry-Go-Round Carousel
    const carouselGroup = new THREE.Group();
    carouselGroup.position.set(-0.72, 0.08, 0.25);

    const carouselDisc = new THREE.Mesh(
      new THREE.CylinderGeometry(0.5, 0.52, 0.07, 24),
      new THREE.MeshPhysicalMaterial({
        color: 0xf43f5e,
        roughness: 0.28,
        metalness: 0.15,
        clearcoat: 0.6,
      })
    );
    carouselDisc.castShadow = true;
    carouselGroup.add(carouselDisc);

    const carouselInner = new THREE.Mesh(
      new THREE.CylinderGeometry(0.34, 0.34, 0.08, 24),
      new THREE.MeshPhysicalMaterial({ color: 0xfacc15, roughness: 0.3, clearcoat: 0.5 })
    );
    carouselGroup.add(carouselInner);

    const brassMat = new THREE.MeshPhysicalMaterial({
      color: 0xfbbf24,
      metalness: 0.9,
      roughness: 0.15,
      clearcoat: 0.8,
    });
    const centerPole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.72, 12), brassMat);
    centerPole.position.y = 0.36;
    carouselGroup.add(centerPole);

    // Carousel Pavilion Canopy Tent Top
    const carouselCanopy = new THREE.Mesh(
      new THREE.ConeGeometry(0.54, 0.28, 16),
      new THREE.MeshPhysicalMaterial({ color: 0xec4899, roughness: 0.35, clearcoat: 0.4 })
    );
    carouselCanopy.position.y = 0.76;
    carouselCanopy.castShadow = true;
    carouselGroup.add(carouselCanopy);

    for (let b = 0; b < 4; b++) {
      const bar = new THREE.Mesh(
        new THREE.TorusGeometry(0.2, 0.018, 8, 16, Math.PI),
        new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.7, roughness: 0.2 })
      );
      bar.rotation.y = (b * Math.PI) / 2;
      bar.position.y = 0.06;
      carouselGroup.add(bar);
    }

    // High-Detail Mini Mascot Riding the Carousel
    const carouselRider = createHighDetailMascot3D(activeMascot, {
      scale: 0.36,
      includeShadow: false,
    });
    carouselRider.group.position.set(0.26, 0.04, 0);
    carouselGroup.add(carouselRider.group);

    playgroundGroup.add(carouselGroup);

    // 9B) Rainbow Adventure Slide & Timber Fort
    const slideGroup = new THREE.Group();
    slideGroup.position.set(0.68, 0.06, -0.25);

    const postMat = new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.65 });
    [
      [-0.22, -0.22],
      [0.22, -0.22],
      [-0.22, 0.22],
      [0.22, 0.22],
    ].forEach(([px, pz]) => {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.038, 0.98, 10), postMat);
      post.position.set(px, 0.49, pz);
      post.castShadow = true;
      slideGroup.add(post);
    });

    const deck = new THREE.Mesh(
      new THREE.BoxGeometry(0.58, 0.065, 0.58),
      new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.55 })
    );
    deck.position.y = 0.64;
    deck.castShadow = true;
    slideGroup.add(deck);

    const playRoof = new THREE.Mesh(
      new THREE.ConeGeometry(0.48, 0.4, 4),
      new THREE.MeshStandardMaterial({ map: redRoofTex, roughness: 0.5 })
    );
    playRoof.rotation.y = Math.PI / 4;
    playRoof.position.y = 1.15;
    playRoof.castShadow = true;
    slideGroup.add(playRoof);

    // Glossy Slide Chute with Side Rails
    const chuteMat = new THREE.MeshPhysicalMaterial({
      color: 0xfacc15,
      roughness: 0.18,
      metalness: 0.1,
      clearcoat: 0.9,
    });
    const chute = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.04, 0.88), chuteMat);
    chute.position.set(0, 0.35, 0.54);
    chute.rotation.x = 0.68;
    chute.castShadow = true;
    slideGroup.add(chute);

    playgroundGroup.add(slideGroup);

    // 9C) Animated Dual Swing Set
    const swingFrameGroup = new THREE.Group();
    swingFrameGroup.position.set(-0.35, 0.06, -0.58);

    const frameMat = new THREE.MeshPhysicalMaterial({
      color: 0x3b82f6,
      metalness: 0.6,
      roughness: 0.25,
      clearcoat: 0.5,
    });
    const topBar = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.96, 10), frameMat);
    topBar.rotation.z = Math.PI / 2;
    topBar.position.y = 0.84;
    swingFrameGroup.add(topBar);

    [-0.44, 0.44].forEach((lx) => {
      const leg1 = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.026, 0.9, 10), frameMat);
      leg1.position.set(lx, 0.43, 0.18);
      leg1.rotation.x = -0.22;
      swingFrameGroup.add(leg1);

      const leg2 = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.026, 0.9, 10), frameMat);
      leg2.position.set(lx, 0.43, -0.18);
      leg2.rotation.x = 0.22;
      swingFrameGroup.add(leg2);
    });

    const swingSeats: THREE.Group[] = [];
    [-0.2, 0.2].forEach((sx) => {
      const pivotGroup = new THREE.Group();
      pivotGroup.position.set(sx, 0.84, 0);

      const chainMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.85, roughness: 0.2 });
      const chainL = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.56, 8), chainMat);
      chainL.position.set(-0.07, -0.28, 0);
      pivotGroup.add(chainL);

      const chainR = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.56, 8), chainMat);
      chainR.position.set(0.07, -0.28, 0);
      pivotGroup.add(chainR);

      const seat = new THREE.Mesh(
        new THREE.BoxGeometry(0.19, 0.032, 0.13),
        new THREE.MeshPhysicalMaterial({ color: 0xf97316, roughness: 0.35, clearcoat: 0.5 })
      );
      seat.position.set(0, -0.56, 0);
      pivotGroup.add(seat);

      swingFrameGroup.add(pivotGroup);
      swingSeats.push(pivotGroup);
    });

    playgroundGroup.add(swingFrameGroup);

    // 9D) Rocking Seesaw
    const seesawGroup = new THREE.Group();
    seesawGroup.position.set(0.35, 0.06, 0.65);

    const fulcrum = new THREE.Mesh(
      new THREE.ConeGeometry(0.13, 0.21, 6),
      new THREE.MeshStandardMaterial({ color: 0xa855f7, roughness: 0.45 })
    );
    fulcrum.position.y = 0.1;
    seesawGroup.add(fulcrum);

    const seesawPlank = new THREE.Group();
    seesawPlank.position.y = 0.21;
    const plankMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 0.038, 0.17),
      new THREE.MeshPhysicalMaterial({ color: 0x22c55e, roughness: 0.35, clearcoat: 0.5 })
    );
    seesawPlank.add(plankMesh);
    seesawGroup.add(seesawPlank);
    playgroundGroup.add(seesawGroup);

    const playgroundHitBox = new THREE.Mesh(
      new THREE.BoxGeometry(3.3, 1.9, 3.3),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    playgroundHitBox.position.y = 0.85;
    (playgroundHitBox as any).userData = { type: 'playground' };
    playgroundGroup.add(playgroundHitBox);
    interactives.push(playgroundHitBox);

    landscapeGroup.add(playgroundGroup);

    // 10. WROUGHT-IRON STREET LANTERNS
    const lanternPositions = [
      { x: -1.85, z: 1.85 },
      { x: 1.85, z: 1.85 },
      { x: -1.85, z: -1.85 },
      { x: 1.85, z: -1.85 },
    ];
    lanternPositions.forEach((lp) => {
      const poleGroup = new THREE.Group();
      poleGroup.position.set(lp.x, 0.36, lp.z);
      poleGroup.add(createContactShadowMesh(0.32, 0.4));

      const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.038, 0.052, 1.25, 10),
        new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.85, roughness: 0.25 })
      );
      pole.position.y = 0.62;
      pole.castShadow = true;
      poleGroup.add(pole);

      const lampGlass = new THREE.Mesh(
        new THREE.SphereGeometry(0.13, 14, 14),
        new THREE.MeshStandardMaterial({
          color: 0xfef08a,
          emissive: 0xfbbf24,
          emissiveIntensity: timeOfDay === 'day' ? 0.4 : 1.4,
          roughness: 0.15,
        })
      );
      lampGlass.position.y = 1.28;
      poleGroup.add(lampGlass);

      const pLight = new THREE.PointLight(
        0xffb703,
        timeOfDay === 'night' ? 2.1 : timeOfDay === 'twilight' ? 1.4 : 0.35,
        5.2
      );
      pLight.position.y = 1.28;
      poleGroup.add(pLight);

      landscapeGroup.add(poleGroup);
    });

    scene.add(landscapeGroup);

    // 11. ARCHITECTURAL 3D TOWN LANDMARKS WITH SHINGLE ROOFS & CONTACT SHADOWS
    let animatedWindmillSails: THREE.Object3D | undefined;
    let fountainWaterParticles: THREE.Points | undefined;
    let bakerySmokeParticles: THREE.Points | undefined;
    let arcadeHoloDice: THREE.Mesh | undefined;
    let radioDish: THREE.Object3D | undefined;
    let townHallClockHand: THREE.Mesh | undefined;

    const windowGlowMat = new THREE.MeshStandardMaterial({
      color: 0xfef08a,
      emissive: 0xfbbf24,
      emissiveIntensity: timeOfDay === 'day' ? 0.35 : 1.25,
      roughness: 0.2,
    });

    town.landmarks.forEach((landmark) => {
      const pos = LANDMARK_OFFSETS[landmark.icon] || {
        x: 0,
        z: 0,
        label: landmark.name,
        icon: landmark.icon,
      };
      const lmGroup = new THREE.Group();
      lmGroup.position.set(pos.x, 0.38, pos.z);
      lmGroup.name = `landmark_${landmark.id}`;
      (lmGroup as any).userData = { type: 'landmark', landmark };

      lmGroup.add(createContactShadowMesh(1.35, 0.55));

      const level = landmark.currentLevel;
      const isMax = level >= landmark.maxLevel;

      // Dressed Stone Plinth Foundation
      const plinth = new THREE.Mesh(
        new THREE.BoxGeometry(1.68, 0.24, 1.68),
        new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.65, metalness: 0.15 })
      );
      plinth.castShadow = true;
      plinth.receiveShadow = true;
      lmGroup.add(plinth);

      if (landmark.icon === 'Sparkles') {
        // Grand Town Hall & Clocktower
        const hallBody = new THREE.Mesh(
          new THREE.BoxGeometry(1.44, 0.95, 1.24),
          new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.55 })
        );
        hallBody.position.y = 0.58;
        hallBody.castShadow = true;
        lmGroup.add(hallBody);

        // Glowing Hall Windows
        [-0.42, 0.42].forEach((wx) => {
          const win = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.32, 0.04), windowGlowMat);
          win.position.set(wx, 0.62, 0.62);
          lmGroup.add(win);
        });

        // Marble Portico Columns
        const marbleMat = new THREE.MeshPhysicalMaterial({
          color: 0xf8fafc,
          roughness: 0.22,
          clearcoat: 0.4,
        });
        for (let c = -0.52; c <= 0.52; c += 0.52) {
          const col = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.072, 0.88, 12), marbleMat);
          col.position.set(c, 0.56, 0.66);
          col.castShadow = true;
          lmGroup.add(col);
        }

        const pediment = new THREE.Mesh(new THREE.ConeGeometry(0.95, 0.38, 4), marbleMat);
        pediment.rotation.y = Math.PI / 4;
        pediment.position.set(0, 1.18, 0.42);
        lmGroup.add(pediment);

        const tower = new THREE.Mesh(
          new THREE.BoxGeometry(0.64, 1.48, 0.64),
          new THREE.MeshStandardMaterial({ color: 0x7f1d1d, roughness: 0.5 })
        );
        tower.position.set(0, 1.64, -0.08);
        tower.castShadow = true;
        lmGroup.add(tower);

        const clockFace = new THREE.Mesh(
          new THREE.CircleGeometry(0.22, 24),
          new THREE.MeshStandardMaterial({
            color: 0xfef9c3,
            emissive: 0xfde047,
            emissiveIntensity: 0.65,
          })
        );
        clockFace.position.set(0, 1.85, 0.25);
        lmGroup.add(clockFace);

        const hand = new THREE.Mesh(
          new THREE.BoxGeometry(0.032, 0.15, 0.015),
          new THREE.MeshBasicMaterial({ color: 0x0f172a })
        );
        hand.position.set(0, 1.85, 0.265);
        lmGroup.add(hand);
        townHallClockHand = hand;

        const spire = new THREE.Mesh(new THREE.ConeGeometry(0.46, 0.88, 8), brassMat);
        spire.position.set(0, 2.8, -0.08);
        spire.castShadow = true;
        lmGroup.add(spire);
      } else if (landmark.icon === 'Utensils') {
        // Star Windmill with Timber Framing & Cloth Sails
        const millTower = new THREE.Mesh(
          new THREE.CylinderGeometry(0.54, 0.78, 1.68, 24),
          new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.62 })
        );
        millTower.position.y = 0.94;
        millTower.castShadow = true;
        lmGroup.add(millTower);

        const roof = new THREE.Mesh(
          new THREE.ConeGeometry(0.72, 0.74, 24),
          new THREE.MeshStandardMaterial({ map: amberRoofTex, roughness: 0.55 })
        );
        roof.position.y = 2.02;
        roof.castShadow = true;
        lmGroup.add(roof);

        const sailsHub = new THREE.Group();
        sailsHub.position.set(0, 1.7, 0.66);

        const hubMesh = new THREE.Mesh(new THREE.SphereGeometry(0.13, 16, 16), brassMat);
        sailsHub.add(hubMesh);

        for (let i = 0; i < 4; i++) {
          const bladeGroup = new THREE.Group();
          bladeGroup.rotation.z = (i * Math.PI) / 2;

          const spar = new THREE.Mesh(
            new THREE.BoxGeometry(0.045, 1.45, 0.025),
            new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.7 })
          );
          spar.position.y = 0.72;
          bladeGroup.add(spar);

          const cloth = new THREE.Mesh(
            new THREE.PlaneGeometry(0.28, 1.12),
            new THREE.MeshStandardMaterial({
              color: 0xfef3c7,
              roughness: 0.6,
              side: THREE.DoubleSide,
            })
          );
          cloth.position.set(0.13, 0.76, 0.012);
          bladeGroup.add(cloth);

          sailsHub.add(bladeGroup);
        }

        lmGroup.add(sailsHub);
        animatedWindmillSails = sailsHub;
      } else if (landmark.icon === 'Droplets') {
        // Multi-Tier Marble & Crystal Prism Fountain
        const basinMat = new THREE.MeshPhysicalMaterial({
          color: 0xe2e8f0,
          roughness: 0.25,
          metalness: 0.1,
          clearcoat: 0.6,
        });
        const basin = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 1.05, 0.42, 32), basinMat);
        basin.position.y = 0.31;
        basin.castShadow = true;
        lmGroup.add(basin);

        const waterDisc = new THREE.Mesh(new THREE.CircleGeometry(0.88, 32), waterMat);
        waterDisc.rotation.x = -Math.PI / 2;
        waterDisc.position.y = 0.5;
        lmGroup.add(waterDisc);

        const tier2 = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.58, 0.34, 24), basinMat);
        tier2.position.y = 0.72;
        lmGroup.add(tier2);

        const fSpire = new THREE.Mesh(
          new THREE.OctahedronGeometry(0.26, 0),
          new THREE.MeshPhysicalMaterial({
            color: 0x38bdf8,
            emissive: 0x0ea5e9,
            emissiveIntensity: 0.5,
            roughness: 0.08,
            clearcoat: 1.0,
          })
        );
        fSpire.position.y = 1.18;
        lmGroup.add(fSpire);

        const pCount = 34;
        const pGeo = new THREE.BufferGeometry();
        const pPos = new Float32Array(pCount * 3);
        for (let i = 0; i < pCount; i++) {
          pPos[i * 3] = (Math.random() - 0.5) * 0.45;
          pPos[i * 3 + 1] = 0.95 + Math.random() * 0.55;
          pPos[i * 3 + 2] = (Math.random() - 0.5) * 0.45;
        }
        pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
        const pMat = new THREE.PointsMaterial({
          color: 0x7dd3fc,
          size: 0.085,
          transparent: true,
          opacity: 0.9,
        });
        const waterParticles = new THREE.Points(pGeo, pMat);
        lmGroup.add(waterParticles);
        fountainWaterParticles = waterParticles;
      } else if (landmark.icon === 'Home') {
        // Guildhouse & Artisan Bakery Cottage
        const cottage = new THREE.Mesh(
          new THREE.BoxGeometry(1.34, 0.85, 1.14),
          new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.65 })
        );
        cottage.position.y = 0.52;
        cottage.castShadow = true;
        lmGroup.add(cottage);

        const roof = new THREE.Mesh(
          new THREE.ConeGeometry(1.06, 0.76, 4),
          new THREE.MeshStandardMaterial({ map: redRoofTex, roughness: 0.55 })
        );
        roof.rotation.y = Math.PI / 4;
        roof.position.y = 1.22;
        roof.castShadow = true;
        lmGroup.add(roof);

        const awning = new THREE.Mesh(
          new THREE.BoxGeometry(0.94, 0.08, 0.42),
          new THREE.MeshPhysicalMaterial({ color: 0xf59e0b, roughness: 0.35, clearcoat: 0.4 })
        );
        awning.rotation.x = 0.25;
        awning.position.set(0, 0.68, 0.66);
        lmGroup.add(awning);

        const win = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.28, 0.04), windowGlowMat);
        win.position.set(0, 0.48, 0.58);
        lmGroup.add(win);

        const chimney = new THREE.Mesh(
          new THREE.BoxGeometry(0.24, 0.65, 0.24),
          new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.8 })
        );
        chimney.position.set(0.42, 1.38, -0.2);
        lmGroup.add(chimney);

        const sCount = 14;
        const sGeo = new THREE.BufferGeometry();
        const sPos = new Float32Array(sCount * 3);
        for (let i = 0; i < sCount; i++) {
          sPos[i * 3] = 0.42 + (Math.random() - 0.5) * 0.1;
          sPos[i * 3 + 1] = 1.65 + i * 0.15;
          sPos[i * 3 + 2] = -0.2 + (Math.random() - 0.5) * 0.1;
        }
        sGeo.setAttribute('position', new THREE.BufferAttribute(sPos, 3));
        const sMat = new THREE.PointsMaterial({
          color: 0xf1f5f9,
          size: 0.14,
          transparent: true,
          opacity: 0.65,
        });
        const smoke = new THREE.Points(sGeo, sMat);
        lmGroup.add(smoke);
        bakerySmokeParticles = smoke;
      } else if (landmark.icon === 'Gamepad2') {
        // Neon Puzzle Arcade Pavilion
        const arcadeBody = new THREE.Mesh(
          new THREE.BoxGeometry(1.24, 1.24, 1.24),
          new THREE.MeshPhysicalMaterial({
            color: 0x581c87,
            roughness: 0.22,
            metalness: 0.55,
            clearcoat: 0.8,
          })
        );
        arcadeBody.position.y = 0.72;
        arcadeBody.castShadow = true;
        lmGroup.add(arcadeBody);

        const neonTrim = new THREE.Mesh(
          new THREE.BoxGeometry(1.3, 0.09, 1.3),
          new THREE.MeshStandardMaterial({
            color: 0xe879f9,
            emissive: 0xd946ef,
            emissiveIntensity: 1.1,
          })
        );
        neonTrim.position.y = 1.28;
        lmGroup.add(neonTrim);

        const holoDice = new THREE.Mesh(
          new THREE.BoxGeometry(0.38, 0.38, 0.38),
          new THREE.MeshPhysicalMaterial({
            color: 0x00f0ff,
            emissive: 0x00f0ff,
            emissiveIntensity: 0.75,
            metalness: 0.7,
            roughness: 0.1,
            clearcoat: 1.0,
          })
        );
        holoDice.position.set(0, 1.75, 0);
        lmGroup.add(holoDice);
        arcadeHoloDice = holoDice;
      } else if (landmark.icon === 'Radio') {
        // Cinema & Broadcast Amphitheater
        const screenFrame = new THREE.Mesh(
          new THREE.BoxGeometry(1.36, 0.86, 0.15),
          new THREE.MeshPhysicalMaterial({ color: 0x065f46, roughness: 0.25, metalness: 0.4 })
        );
        screenFrame.position.set(0, 0.82, 0);
        screenFrame.castShadow = true;
        lmGroup.add(screenFrame);

        const glowFace = new THREE.Mesh(
          new THREE.PlaneGeometry(1.2, 0.7),
          new THREE.MeshStandardMaterial({
            color: 0x34d399,
            emissive: 0x10b981,
            emissiveIntensity: 0.85,
          })
        );
        glowFace.position.set(0, 0.82, 0.085);
        lmGroup.add(glowFace);

        const mast = new THREE.Mesh(
          new THREE.CylinderGeometry(0.04, 0.06, 1.55, 10),
          new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.85, roughness: 0.2 })
        );
        mast.position.set(0.52, 1.42, -0.2);
        lmGroup.add(mast);

        const dish = new THREE.Mesh(
          new THREE.SphereGeometry(0.25, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2),
          new THREE.MeshPhysicalMaterial({ color: 0x10b981, metalness: 0.75, roughness: 0.2 })
        );
        dish.position.set(0.52, 2.02, -0.2);
        dish.rotation.x = -Math.PI / 4;
        lmGroup.add(dish);
        radioDish = dish;
      } else {
        const stage = new THREE.Mesh(
          new THREE.CylinderGeometry(0.78, 0.88, 0.52, 24),
          new THREE.MeshPhysicalMaterial({ color: 0xec4899, roughness: 0.3, clearcoat: 0.5 })
        );
        stage.position.y = 0.36;
        stage.castShadow = true;
        lmGroup.add(stage);

        const totem = new THREE.Mesh(
          new THREE.OctahedronGeometry(0.36, 0),
          new THREE.MeshPhysicalMaterial({
            color: 0xf43f5e,
            emissive: 0xf43f5e,
            emissiveIntensity: 0.4,
            metalness: 0.85,
            roughness: 0.15,
          })
        );
        totem.position.y = 1.12;
        lmGroup.add(totem);
      }

      if (isMax) {
        const crown = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.05, 12, 28), brassMat);
        crown.rotation.x = Math.PI / 2;
        crown.position.y = 3.25;
        lmGroup.add(crown);
      }

      const hitBox = new THREE.Mesh(
        new THREE.BoxGeometry(2.05, 3.25, 2.05),
        new THREE.MeshBasicMaterial({ visible: false })
      );
      hitBox.position.y = 1.45;
      (hitBox as any).userData = { type: 'landmark', landmark, parentGroup: lmGroup };
      lmGroup.add(hitBox);
      interactives.push(hitBox);

      scene.add(lmGroup);
    });

    // 12. HIGH-DETAIL WANDERING 3D MASCOT CITIZENS ON PLAZA AVENUES
    const wanderingMascots: {
      group: THREE.Group;
      tail: THREE.Group;
      angle: number;
      speed: number;
    }[] = [];

    const citizenConfigs =
      allMascots.length >= 4
        ? allMascots.slice(0, 4)
        : [
            { furColor: '#f43f5e', hairColors: ['#f43f5e', '#fde047'], earStyle: 'bunny' },
            { furColor: '#06b6d4', hairColors: ['#06b6d4', '#a855f7'], earStyle: 'cat' },
            { furColor: '#f59e0b', hairColors: ['#f59e0b', '#fef08a'], earStyle: 'bear' },
            { furColor: '#a855f7', hairColors: ['#a855f7', '#ec4899'], earStyle: 'tuft' },
          ];

    citizenConfigs.forEach((cfg, mIdx) => {
      const built = createHighDetailMascot3D(cfg, {
        scale: 0.52,
        includeShadow: true,
        includeHitBox: false,
      });
      const baseAngle = (mIdx * Math.PI) / 2;
      built.group.position.set(Math.sin(baseAngle) * 2.1, 0.39, Math.cos(baseAngle) * 2.1);
      scene.add(built.group);

      wanderingMascots.push({
        group: built.group,
        tail: built.tailGroup,
        angle: baseAngle,
        speed: 0.38 + mIdx * 0.08,
      });
    });

    // 13. SELECTION RING AROUND CLICKED LANDMARK OR PLAYGROUND
    const ringGeo = new THREE.RingGeometry(1.22, 1.38, 36);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0,
    });
    const selRing = new THREE.Mesh(ringGeo, ringMat);
    selRing.rotation.x = -Math.PI / 2;
    selRing.position.y = 0.42;
    scene.add(selRing);
    stateRef.current.selectionRing = selRing;

    stateRef.current.animatedProps = {
      windmillSails: animatedWindmillSails,
      fountainWater: fountainWaterParticles,
      bakerySmoke: bakerySmokeParticles,
      arcadeHoloDice: arcadeHoloDice,
      radioDish: radioDish,
      wanderingMascots: wanderingMascots,
      townHallClockHand: townHallClockHand,
      treeCrowns: treeCrowns,
      merryGoRound: carouselGroup,
      swingSeats: swingSeats,
      seesawPlank: seesawPlank,
      blossomPetals: blossomPetals,
      cloudsGroup: cloudsGroup,
      waterfallDroplets: waterfallDroplets,
    };

    if (!engine.isSoftwareGl) {
      engine.renderer.compile(scene, camera);
    }

    // 14. INTERACTIVE DRAG & ORBIT CONTROLS WITH RAYCAST SELECTION
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
      o.desiredPhi = Math.max(0.18, Math.min(1.22, o.desiredPhi + dy));
      stateRef.current.dragStart = { x: e.clientX, y: e.clientY };
    };

    const onPointerUp = (e: PointerEvent) => {
      stateRef.current.dragStart = null;

      if (!didDrag) {
        const rect = domElement.getBoundingClientRect();
        stateRef.current.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        stateRef.current.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

        stateRef.current.raycaster.setFromCamera(stateRef.current.mouse, camera);
        const intersects = stateRef.current.raycaster.intersectObjects(interactives, true);

        if (intersects.length > 0) {
          const hit = intersects[0].object;
          const uData = (hit as any).userData;
          if (uData && uData.type === 'landmark') {
            setIsPlaygroundSelected(false);
            setSelectedLandmark(uData.landmark);
            SoundEngine.playTileStep();
            const pos = LANDMARK_OFFSETS[uData.landmark.icon] || { x: 0, z: 0 };
            selRing.position.set(pos.x, 0.45, pos.z);
            (selRing.material as THREE.MeshBasicMaterial).opacity = 0.9;
          } else if (uData && uData.type === 'playground') {
            setSelectedLandmark(null);
            setIsPlaygroundSelected(true);
            stateRef.current.playgroundSpinBoost = 1.0;
            SoundEngine.playMascotSqueak('giggle');
            selRing.position.set(0, 0.45, 4.35);
            (selRing.material as THREE.MeshBasicMaterial).opacity = 0.9;
          }
        } else {
          setSelectedLandmark(null);
          setIsPlaygroundSelected(false);
          (selRing.material as THREE.MeshBasicMaterial).opacity = 0;
        }
      }
    };

    domElement.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);

    // 15. FRAME-RATE INDEPENDENT DAMPED ANIMATION LOOP
    let disposed = false;
    stateRef.current.clock.start();

    const tick = () => {
      if (disposed) return;
      const dt = Math.min(stateRef.current.clock.getDelta(), 0.1);
      const elapsed = stateRef.current.clock.elapsedTime;
      const s = stateRef.current;
      const o = s.orbit;

      if (autoRotateRef.current && !s.dragStart) {
        o.desiredTheta += dt * 0.18;
      }

      // Exponential camera damping
      o.theta = THREE.MathUtils.damp(o.theta, o.desiredTheta, 6.0, dt);
      o.phi = THREE.MathUtils.damp(o.phi, o.desiredPhi, 6.0, dt);
      o.radius = THREE.MathUtils.damp(o.radius, o.desiredRadius, 6.0, dt);
      o.target.x = THREE.MathUtils.damp(o.target.x, o.desiredTarget.x, 6.0, dt);
      o.target.y = THREE.MathUtils.damp(o.target.y, o.desiredTarget.y, 6.0, dt);
      o.target.z = THREE.MathUtils.damp(o.target.z, o.desiredTarget.z, 6.0, dt);

      camera.position.x = o.target.x + o.radius * Math.sin(o.theta) * Math.cos(o.phi);
      camera.position.y = o.target.y + o.radius * Math.sin(o.phi);
      camera.position.z = o.target.z + o.radius * Math.cos(o.theta) * Math.cos(o.phi);
      camera.lookAt(o.target);

      // Windmill Sails Rotation
      if (s.animatedProps.windmillSails) {
        s.animatedProps.windmillSails.rotation.z += dt * 1.4;
      }

      // Drifting Sky Clouds
      if (s.animatedProps.cloudsGroup) {
        s.animatedProps.cloudsGroup.rotation.y = elapsed * 0.025;
      }

      // Organic Tree Canopy Breeze Sway
      if (s.animatedProps.treeCrowns) {
        s.animatedProps.treeCrowns.forEach((tc) => {
          tc.group.rotation.z = Math.sin(elapsed * 1.8 + tc.phase) * 0.038;
          tc.group.rotation.x = Math.cos(elapsed * 1.4 + tc.phase) * 0.028;
        });
      }

      // Drifting Blossom Petals
      if (s.animatedProps.blossomPetals) {
        const pAttr = s.animatedProps.blossomPetals.geometry.attributes.position as THREE.BufferAttribute;
        for (let i = 0; i < pAttr.count; i++) {
          let y = pAttr.getY(i) - dt * 0.35;
          let x = pAttr.getX(i) + Math.sin(elapsed + i) * dt * 0.15;
          if (y < 0.4) y = 4.2;
          pAttr.setY(i, y);
          pAttr.setX(i, x);
        }
        pAttr.needsUpdate = true;
      }

      // Waterfall Mist Droplets
      if (s.animatedProps.waterfallDroplets) {
        const wAttr = s.animatedProps.waterfallDroplets.geometry.attributes.position as THREE.BufferAttribute;
        for (let i = 0; i < wAttr.count; i++) {
          let y = wAttr.getY(i) - dt * 1.2;
          if (y < -0.75) y = 0.38;
          wAttr.setY(i, y);
        }
        wAttr.needsUpdate = true;
      }

      // Playground Merry-Go-Round Spin
      if (s.playgroundSpinBoost > 0) {
        s.playgroundSpinBoost = Math.max(0, s.playgroundSpinBoost - dt * 0.65);
      }
      if (s.animatedProps.merryGoRound) {
        s.animatedProps.merryGoRound.rotation.y += dt * (2.0 + s.playgroundSpinBoost * 8.0);
      }

      // Playground Swings Pendulum Motion
      if (s.animatedProps.swingSeats) {
        const swingSpeed = 2.8 + s.playgroundSpinBoost * 2.0;
        s.animatedProps.swingSeats.forEach((seat, idx) => {
          seat.rotation.x = Math.sin(elapsed * swingSpeed + idx * Math.PI) * 0.44;
        });
      }

      // Playground Seesaw Rocking
      if (s.animatedProps.seesawPlank) {
        s.animatedProps.seesawPlank.rotation.z = Math.sin(elapsed * 2.2) * 0.24;
      }

      // Town Hall Clock Hand
      if (s.animatedProps.townHallClockHand) {
        s.animatedProps.townHallClockHand.rotation.z = -elapsed * 0.5;
      }

      // Arcade Holo Dice
      if (s.animatedProps.arcadeHoloDice) {
        s.animatedProps.arcadeHoloDice.rotation.x += dt * 1.2;
        s.animatedProps.arcadeHoloDice.rotation.y += dt * 1.8;
        s.animatedProps.arcadeHoloDice.position.y = 1.75 + Math.sin(elapsed * 3) * 0.08;
      }

      // Radio Dish
      if (s.animatedProps.radioDish) {
        s.animatedProps.radioDish.rotation.y = Math.sin(elapsed * 1.5) * 0.42;
      }

      // Fountain Water Particles
      if (s.animatedProps.fountainWater) {
        const posAttr = s.animatedProps.fountainWater.geometry.attributes.position as THREE.BufferAttribute;
        for (let i = 0; i < posAttr.count; i++) {
          let y = posAttr.getY(i) - dt * 0.9;
          if (y < 0.7) y = 1.38 + Math.random() * 0.2;
          posAttr.setY(i, y);
        }
        posAttr.needsUpdate = true;
      }

      // Bakery Smoke
      if (s.animatedProps.bakerySmoke) {
        const sAttr = s.animatedProps.bakerySmoke.geometry.attributes.position as THREE.BufferAttribute;
        for (let i = 0; i < sAttr.count; i++) {
          let y = sAttr.getY(i) + dt * 0.45;
          let x = sAttr.getX(i) + Math.sin(elapsed * 2 + i) * dt * 0.1;
          if (y > 2.8) {
            y = 1.65;
            x = 0.42 + (Math.random() - 0.5) * 0.08;
          }
          sAttr.setY(i, y);
          sAttr.setX(i, x);
        }
        sAttr.needsUpdate = true;
      }

      // Wandering High-Detail Mascots
      if (s.animatedProps.wanderingMascots) {
        s.animatedProps.wanderingMascots.forEach((wm) => {
          wm.angle += dt * 0.35 * wm.speed;
          const r = 2.1;
          wm.group.position.x = Math.sin(wm.angle) * r;
          wm.group.position.z = Math.cos(wm.angle) * r;
          wm.group.position.y = 0.39 + Math.abs(Math.sin(elapsed * 6 * wm.speed)) * 0.1;
          wm.group.rotation.y = wm.angle + Math.PI / 2;
          wm.tail.rotation.y = Math.sin(elapsed * 8) * 0.35;
        });
      }

      // Selection Ring Pulse
      if (s.selectionRing && (s.selectionRing.material as THREE.MeshBasicMaterial).opacity > 0) {
        s.selectionRing.rotation.z += dt * 1.8;
        const scale = 1.0 + Math.sin(elapsed * 5) * 0.05;
        s.selectionRing.scale.set(scale, scale, 1);
      }

      engine.renderFrame(bloomEnabledRef.current);
      s.animId = engine.scheduleNextFrame(tick);
    };

    stateRef.current.animId = engine.scheduleNextFrame(tick);

    // 16. Resize Handling
    const handleResize = () => {
      if (!container || !stateRef.current.engine) return;
      const w = container.clientWidth || 420;
      const h = container.clientHeight || 450;
      stateRef.current.engine.resize(w, h);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    // 17. Cleanup
    return () => {
      disposed = true;
      cancelAnimationFrame(stateRef.current.animId);
      clearTimeout(stateRef.current.animId);
      resizeObserver.disconnect();
      domElement.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);

      grassTex.dispose();
      cobbleTex.dispose();
      redRoofTex.dispose();
      amberRoofTex.dispose();

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
  }, [town.id, timeOfDay, town.landmarks]);

  // Upgrade handler from within 3D
  const handleUpgradeFrom3D = () => {
    if (!selectedLandmark) return;
    const cost = selectedLandmark.costPerLevel[selectedLandmark.currentLevel] || 999999;
    if (coins < cost) {
      SoundEngine.playErrorBuzz();
      return;
    }

    SoundEngine.playUpgradeFanfare();
    confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });
    if (onUpgradeLandmark) {
      onUpgradeLandmark(selectedLandmark.id, cost);
    }

    setSelectedLandmark((prev) => {
      if (!prev) return null;
      return { ...prev, currentLevel: prev.currentLevel + 1 };
    });
  };

  const handleBoostPlayground = () => {
    stateRef.current.playgroundSpinBoost = 1.5;
    setPlaygroundBoostCount((c) => c + 1);
    SoundEngine.playMascotSqueak('giggle');
    confetti({ particleCount: 35, spread: 55, origin: { y: 0.65 } });
  };

  const currentCost = selectedLandmark
    ? selectedLandmark.costPerLevel[selectedLandmark.currentLevel] || 0
    : 0;
  const isMaxLevel = selectedLandmark
    ? selectedLandmark.currentLevel >= selectedLandmark.maxLevel
    : false;

  return (
    <div className="relative w-full aspect-[4/3] min-h-[430px] rounded-3xl overflow-hidden border-2 border-indigo-900/60 shadow-2xl bg-slate-950 select-none">
      {/* Dedicated Isolated WebGL Canvas Mount */}
      <div
        ref={mountRef}
        className="w-full h-full cursor-grab active:cursor-grabbing touch-none"
        style={{ touchAction: 'none' }}
      />

      {/* Minimal Top-Left Town Title Badge */}
      <div className="absolute top-2.5 left-3 right-3 flex items-center justify-between pointer-events-none z-10">
        <div className="flex items-center gap-2 pointer-events-auto bg-slate-950/90 px-3 py-1.5 rounded-2xl border border-slate-800 shadow-lg">
          <span className="text-base">🏰</span>
          <div>
            <div className="text-[11px] font-black text-white flex items-center gap-1.5">
              <span>{town.name} · 3D World W{town.worldNumber}</span>
              <span className="text-[9px] text-cyan-300 font-bold">
                · {enableBloomEngine ? 'PBR + Bloom' : 'PBR Studio'}
              </span>
            </div>
            <div className="text-[8.5px] text-slate-400">
              Tap any landmark or playground · Drag to orbit
            </div>
          </div>
        </div>
      </div>

      {/* 3D Playground Inspector Drawer */}
      {isPlaygroundSelected && !selectedLandmark && (
        <div className="absolute bottom-16 inset-x-3 p-3 rounded-2xl bg-slate-950/95 border-2 border-emerald-500/60 shadow-2xl z-20 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-xl bg-emerald-950/80 border border-emerald-400/50 flex items-center justify-center text-lg shadow-md">
                🎠
              </span>
              <div>
                <h4 className="text-xs font-black text-white leading-tight">
                  Sunshine Mascot Playground · Interactive Park
                </h4>
                <div className="text-[9px] text-slate-300">
                  Pavilion Carousel, Rainbow Slide, Dual Swings & Seesaw · Spin Boosts: {playgroundBoostCount}
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsPlaygroundSelected(false)}
              className="p-1.5 rounded-xl bg-slate-900 text-slate-400 hover:text-white border border-slate-800 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={handleBoostPlayground}
            className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-md hover:brightness-110 active:scale-98 transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Spin Merry-Go-Round & Swings Faster! 🎠</span>
          </button>
        </div>
      )}

      {/* 3D Interactive Building Inspector Drawer */}
      {selectedLandmark && (
        <div className="absolute bottom-16 inset-x-3 p-3 rounded-2xl bg-slate-950/95 border-2 border-indigo-500/60 shadow-2xl z-20 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-xl bg-indigo-950/80 border border-indigo-500/40 flex items-center justify-center text-lg shadow-md">
                🏛️
              </span>
              <div>
                <h4 className="text-xs font-black text-white leading-tight">
                  {selectedLandmark.name}
                  {isMaxLevel ? ' · Masterwork' : ''}
                </h4>
                <div className="flex items-center gap-2 text-[9px] text-slate-400">
                  <span className="text-amber-300 font-bold">
                    Tier {selectedLandmark.currentLevel}/{selectedLandmark.maxLevel}
                  </span>
                  <span>·</span>
                  <span>{selectedLandmark.description}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setSelectedLandmark(null)}
              className="p-1.5 rounded-xl bg-slate-900 text-slate-400 hover:text-white border border-slate-800 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2 mt-0.5">
            {!isMaxLevel ? (
              <button
                onClick={handleUpgradeFrom3D}
                disabled={coins < currentCost}
                className={`flex-1 py-2 px-3 rounded-xl font-black text-xs flex items-center justify-between transition-all cursor-pointer ${
                  coins >= currentCost
                    ? 'bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500 text-slate-950 shadow-md hover:brightness-110 active:scale-98'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Hammer className="w-4 h-4" />
                  <span>Upgrade Landmark in 3D</span>
                </div>
                <div className="flex items-center gap-1 bg-black/25 px-2 py-0.5 rounded-lg text-[10px] tabular-nums">
                  <span>{currentCost.toLocaleString()}</span>
                  <span>🪙</span>
                </div>
              </button>
            ) : (
              <div className="flex-1 py-2 px-3 rounded-xl bg-amber-950/80 border border-amber-500/40 text-amber-300 text-center font-black text-xs">
                👑 Maximum Landmark Tier Achieved!
              </div>
            )}
          </div>
        </div>
      )}

      {/* Unified Collapsible Bottom Control Dock (Zero Viewport Occlusion) */}
      <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center w-[95%] max-w-[540px] pointer-events-none">
        <button
          onClick={() => setIsHudCollapsed((prev) => !prev)}
          className="pointer-events-auto mb-1 px-2.5 py-0.5 rounded-t-xl bg-slate-950/90 border border-b-0 border-slate-800 text-[9px] font-bold text-slate-300 hover:text-white flex items-center gap-1 cursor-pointer shadow-md"
        >
          {isHudCollapsed ? (
            <>
              <ChevronUp className="w-3 h-3" />
              <span>Show Town Controls</span>
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
              <button
                onClick={() => setCameraViewPreset('overview')}
                className={`px-2 py-1 rounded-lg text-[9px] font-bold whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                  cameraViewPreset === 'overview'
                    ? 'bg-cyan-400 text-slate-950 font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setCameraViewPreset('plaza')}
                className={`px-2 py-1 rounded-lg text-[9px] font-bold whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                  cameraViewPreset === 'plaza'
                    ? 'bg-amber-400 text-slate-950 font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Plaza
              </button>
              <button
                onClick={() => {
                  setCameraViewPreset('playground');
                  setIsPlaygroundSelected(true);
                  setSelectedLandmark(null);
                }}
                className={`px-2 py-1 rounded-lg text-[9px] font-bold whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                  cameraViewPreset === 'playground'
                    ? 'bg-emerald-400 text-slate-950 font-black'
                    : 'text-emerald-300 hover:text-white'
                }`}
              >
                🎠 Playground
              </button>
              <button
                onClick={() => setCameraViewPreset('windmill')}
                className={`px-2 py-1 rounded-lg text-[9px] font-bold whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                  cameraViewPreset === 'windmill'
                    ? 'bg-pink-400 text-slate-950 font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Windmill
              </button>
            </div>

            {/* Time of Day, Bloom Graphics Engine & Orbit Controls */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => {
                  setTimeOfDay((prev) =>
                    prev === 'day' ? 'twilight' : prev === 'twilight' ? 'night' : 'day'
                  );
                  SoundEngine.playTileStep();
                }}
                className="px-2 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-[9px] font-bold text-slate-200 cursor-pointer whitespace-nowrap shrink-0"
                title="Cycle Day / Twilight / Night Lighting"
              >
                {timeOfDay === 'day'
                  ? '☀️ Day'
                  : timeOfDay === 'twilight'
                  ? '🌆 Sunset'
                  : '🌙 Night'}
              </button>

              <button
                onClick={() => setEnableBloomEngine((prev) => !prev)}
                className={`px-2 py-1 rounded-xl text-[9px] font-bold flex items-center gap-1 border transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  enableBloomEngine
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/50'
                    : 'bg-slate-900 text-slate-400 border-slate-800'
                }`}
                title="Toggle UnrealBloom Post-Processing Engine"
              >
                <Sparkles className="w-3 h-3" />
                <span>FX</span>
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
