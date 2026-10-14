import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { Town, Landmark, Mascot } from '../types';
import { SoundEngine } from '../utils/sound';
import confetti from 'canvas-confetti';
import {
  Sun, Moon, Sunset, RotateCw, ZoomIn, ZoomOut, Maximize2,
  Hammer, X, Sparkles, Building2, Eye, Compass
} from 'lucide-react';

interface StandaloneThreeTownProps {
  town: Town;
  coins: number;
  playerLevel?: number;
  activeMascot: Mascot;
  allMascots?: Mascot[];
  onUpgradeLandmark: (landmarkId: string, cost: number) => void;
  onSelectActiveMascot?: (mascotId: string) => void;
}

// Landmark 3D world coordinates on the standalone town landscape
const LANDMARK_OFFSETS: Record<string, { x: number; z: number; label: string; icon: string }> = {
  Sparkles: { x: 0, z: -0.6, label: 'Town Hall & Clocktower', icon: 'Sparkles' }, // Plaza Center-North
  Droplets: { x: 0, z: 2.2, label: 'Prism Fountain', icon: 'Droplets' },          // Plaza Center-South
  Home: { x: -3.4, z: -1.2, label: 'Guildhouse & Bakery', icon: 'Home' },        // West Village
  Utensils: { x: 3.5, z: -1.4, label: 'Star Windmill', icon: 'Utensils' },       // East Windmill Hill
  Gamepad2: { x: -3.2, z: 2.0, label: 'Neon Arcade', icon: 'Gamepad2' },         // South-West Arcade
  Radio: { x: 3.2, z: 2.2, label: 'Cinema & Broadcast', icon: 'Radio' },         // South-East Radio
  Music: { x: -1.8, z: -3.2, label: 'Sound Stage', icon: 'Music' },               // North-West
  Zap: { x: 1.8, z: -3.2, label: 'Quantum Beacon', icon: 'Zap' },                 // North-East
};

export const StandaloneThreeTown: React.FC<StandaloneThreeTownProps> = ({
  town,
  coins,
  playerLevel = 1,
  activeMascot,
  allMascots = [],
  onUpgradeLandmark,
  onSelectActiveMascot,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);

  // Inspector & selection state
  const [selectedLandmark, setSelectedLandmark] = useState<Landmark | null>(null);
  const [timeOfDay, setTimeOfDay] = useState<'day' | 'twilight' | 'night'>('day');
  const [isAutoRotate, setIsAutoRotate] = useState(true);
  const [cameraViewPreset, setCameraViewPreset] = useState<'overview' | 'plaza' | 'windmill' | 'street'>('overview');

  // Internal mutable Three.js references
  const stateRef = useRef<{
    scene: THREE.Scene | null;
    camera: THREE.PerspectiveCamera | null;
    renderer: THREE.WebGLRenderer | null;
    animId: number;
    clock: THREE.Clock;
    dragStart: { x: number; y: number } | null;
    orbit: { theta: number; phi: number; radius: number; target: THREE.Vector3 };
    interactiveObjects: THREE.Object3D[];
    selectionRing: THREE.Mesh | null;
    animatedProps: {
      windmillSails?: THREE.Object3D;
      fountainWater?: THREE.Points;
      bakerySmoke?: THREE.Points;
      arcadeHoloDice?: THREE.Mesh;
      radioDish?: THREE.Object3D;
      beaconLight?: THREE.PointLight;
      wanderingMascots?: { group: THREE.Group; basePos: THREE.Vector3; angle: number; speed: number }[];
      streetLanterns?: THREE.PointLight[];
      dustParticles?: THREE.Points;
      townHallClockHand?: THREE.Mesh;
    };
    raycaster: THREE.Raycaster;
    mouse: THREE.Vector2;
  }>({
    scene: null,
    camera: null,
    renderer: null,
    animId: 0,
    clock: new THREE.Clock(),
    dragStart: null,
    orbit: { theta: 0.78, phi: 0.58, radius: 15.5, target: new THREE.Vector3(0, 0.4, 0) },
    interactiveObjects: [],
    selectionRing: null,
    animatedProps: {},
    raycaster: new THREE.Raycaster(),
    mouse: new THREE.Vector2(-999, -999),
  });

  // Switch camera smoothly based on view preset
  useEffect(() => {
    const s = stateRef.current;
    if (cameraViewPreset === 'overview') {
      s.orbit.radius = 16.0;
      s.orbit.phi = 0.62;
      s.orbit.target.set(0, 0.5, 0);
    } else if (cameraViewPreset === 'plaza') {
      s.orbit.radius = 10.0;
      s.orbit.phi = 0.48;
      s.orbit.target.set(0, 1.0, 0.8);
    } else if (cameraViewPreset === 'windmill') {
      s.orbit.radius = 10.5;
      s.orbit.phi = 0.52;
      s.orbit.target.set(3.5, 1.2, -1.4);
    } else if (cameraViewPreset === 'street') {
      s.orbit.radius = 8.5;
      s.orbit.phi = 0.28;
      s.orbit.target.set(-1.0, 0.8, 1.0);
    }
  }, [cameraViewPreset]);

  // Main Three.js Scene Lifecycle
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 400;
    const height = container.clientHeight || 450;

    // 1. Scene & Camera Setup
    const scene = new THREE.Scene();
    stateRef.current.scene = scene;

    const bgColors = {
      day: 0x70c5f4,
      twilight: 0x241738,
      night: 0x050818,
    };
    scene.background = new THREE.Color(bgColors[timeOfDay]);
    scene.fog = new THREE.FogExp2(bgColors[timeOfDay], timeOfDay === 'night' ? 0.025 : 0.015);

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.set(0, 10, 16);
    camera.lookAt(0, 0.5, 0);
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

    // 3. Lighting Rig (Full Day/Twilight/Night PBR Setup)
    const ambientLight = new THREE.AmbientLight(
      timeOfDay === 'night' ? 0x1d2951 : timeOfDay === 'twilight' ? 0x5b3366 : 0xf1f5f9,
      timeOfDay === 'night' ? 1.5 : timeOfDay === 'twilight' ? 2.0 : 2.5
    );
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(
      timeOfDay === 'night' ? 0x818cf8 : timeOfDay === 'twilight' ? 0xfb923c : 0xfffae6,
      timeOfDay === 'night' ? 1.6 : timeOfDay === 'twilight' ? 3.2 : 3.6
    );
    sunLight.position.set(10, 18, 12);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 45;
    sunLight.shadow.camera.left = -12;
    sunLight.shadow.camera.right = 12;
    sunLight.shadow.camera.top = 12;
    sunLight.shadow.camera.bottom = -12;
    sunLight.shadow.bias = -0.0005;
    scene.add(sunLight);

    // Warm Town Center Fill Light
    const plazaFill = new THREE.PointLight(
      timeOfDay === 'night' ? 0x38bdf8 : 0xffedd5,
      timeOfDay === 'night' ? 2.5 : 1.2,
      18
    );
    plazaFill.position.set(0, 4.5, 0);
    scene.add(plazaFill);

    const interactives: THREE.Object3D[] = [];
    stateRef.current.interactiveObjects = interactives;

    // 4. STANDALONE 3D TOWN LANDSCAPE (NO cutaway cone!)
    const landscapeGroup = new THREE.Group();

    // Sturdy Beveled Foundation Pedestal (Granite & Stone Tiered Base)
    const baseGeo = new THREE.CylinderGeometry(6.6, 6.8, 0.5, 48);
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.85,
      metalness: 0.2,
    });
    const baseMesh = new THREE.Mesh(baseGeo, baseMat);
    baseMesh.position.y = -0.25;
    baseMesh.receiveShadow = true;
    landscapeGroup.add(baseMesh);

    // Lush Green Meadow Surface
    const meadowGeo = new THREE.CylinderGeometry(6.5, 6.5, 0.4, 48);
    const meadowColor = timeOfDay === 'night' ? 0x0f3820 : timeOfDay === 'twilight' ? 0x165b2d : 0x22c55e;
    const meadowMat = new THREE.MeshStandardMaterial({
      color: meadowColor,
      roughness: 0.75,
      metalness: 0.05,
    });
    const meadowMesh = new THREE.Mesh(meadowGeo, meadowMat);
    meadowMesh.position.y = 0.15;
    meadowMesh.receiveShadow = true;
    landscapeGroup.add(meadowMesh);

    // Central Cobblestone Plaza (Circle with Stone Curb)
    const plazaGeo = new THREE.CylinderGeometry(2.5, 2.5, 0.06, 32);
    const plazaMat = new THREE.MeshStandardMaterial({
      color: 0x475569, // Slate cobblestone
      roughness: 0.8,
      metalness: 0.15,
    });
    const plazaMesh = new THREE.Mesh(plazaGeo, plazaMat);
    plazaMesh.position.y = 0.36;
    plazaMesh.receiveShadow = true;
    landscapeGroup.add(plazaMesh);

    // Plaza Inset Pattern (Lighter Stone Ring)
    const plazaRingGeo = new THREE.RingGeometry(1.6, 2.2, 32);
    const plazaRingMat = new THREE.MeshStandardMaterial({
      color: 0x64748b,
      roughness: 0.7,
      side: THREE.DoubleSide,
    });
    const plazaRing = new THREE.Mesh(plazaRingGeo, plazaRingMat);
    plazaRing.rotation.x = -Math.PI / 2;
    plazaRing.position.y = 0.4;
    landscapeGroup.add(plazaRing);

    // Radiating Avenues / Stone Pathways to each district
    const roadAngles = [0, Math.PI / 4, Math.PI / 2, (3 * Math.PI) / 4, Math.PI, (5 * Math.PI) / 4, (3 * Math.PI) / 2, (7 * Math.PI) / 4];
    roadAngles.forEach((ang) => {
      const roadGeo = new THREE.BoxGeometry(0.85, 0.05, 3.8);
      const roadMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.85 });
      const road = new THREE.Mesh(roadGeo, roadMat);
      road.rotation.y = ang;
      road.position.set(Math.sin(ang) * 3.4, 0.35, Math.cos(ang) * 3.4);
      road.receiveShadow = true;
      landscapeGroup.add(road);
    });

    // Decorative Foliage: Trees, Shrubs & Flower Beds around town perimeter
    const treePositions = [
      { x: -4.8, z: 0.8 },
      { x: -4.5, z: -3.0 },
      { x: -1.2, z: 4.8 },
      { x: 2.2, z: 4.6 },
      { x: 4.8, z: 0.2 },
      { x: 4.2, z: -3.5 },
      { x: 0.2, z: -5.0 },
      { x: -3.2, z: -4.5 },
    ];

    treePositions.forEach((tp, idx) => {
      const treeGroup = new THREE.Group();
      treeGroup.position.set(tp.x, 0.35, tp.z);

      // Wood Trunk
      const trunkGeo = new THREE.CylinderGeometry(0.12, 0.16, 0.7, 8);
      const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5c3a21, roughness: 0.9 });
      const trunk = new THREE.Mesh(trunkGeo, trunkMat);
      trunk.position.y = 0.35;
      trunk.castShadow = true;
      treeGroup.add(trunk);

      // Layered Foliage Canopies
      const foliageColor = idx % 2 === 0 ? 0x15803d : 0x16a34a;
      const f1 = new THREE.Mesh(
        new THREE.ConeGeometry(0.65, 0.8, 8),
        new THREE.MeshStandardMaterial({ color: foliageColor, roughness: 0.8 })
      );
      f1.position.y = 0.9;
      f1.castShadow = true;
      treeGroup.add(f1);

      const f2 = new THREE.Mesh(
        new THREE.ConeGeometry(0.5, 0.7, 8),
        new THREE.MeshStandardMaterial({ color: foliageColor + 0x051a05, roughness: 0.8 })
      );
      f2.position.y = 1.35;
      f2.castShadow = true;
      treeGroup.add(f2);

      landscapeGroup.add(treeGroup);
    });

    // Street Lanterns with glowing globes and light sources
    const streetLanterns: THREE.PointLight[] = [];
    const lanternPositions = [
      { x: -1.8, z: 1.8 },
      { x: 1.8, z: 1.8 },
      { x: -1.8, z: -1.8 },
      { x: 1.8, z: -1.8 },
    ];

    lanternPositions.forEach((lp) => {
      const poleGroup = new THREE.Group();
      poleGroup.position.set(lp.x, 0.35, lp.z);

      // Post
      const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.04, 0.05, 1.2, 8),
        new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.8, roughness: 0.3 })
      );
      pole.position.y = 0.6;
      poleGroup.add(pole);

      // Glowing Glass Lantern
      const lampGlass = new THREE.Mesh(
        new THREE.SphereGeometry(0.12, 8, 8),
        new THREE.MeshBasicMaterial({ color: timeOfDay === 'night' ? 0xfff3a1 : 0xfffae0 })
      );
      lampGlass.position.y = 1.25;
      poleGroup.add(lampGlass);

      // Point Light
      const pLight = new THREE.PointLight(
        0xffb703,
        timeOfDay === 'night' ? 1.8 : timeOfDay === 'twilight' ? 1.2 : 0.4,
        4.5
      );
      pLight.position.y = 1.25;
      poleGroup.add(pLight);
      streetLanterns.push(pLight);

      landscapeGroup.add(poleGroup);
    });
    stateRef.current.animatedProps.streetLanterns = streetLanterns;

    scene.add(landscapeGroup);

    // 5. DETAILED STANDALONE 3D TOWN BUILDINGS
    let animatedWindmillSails: THREE.Object3D | undefined;
    let fountainWaterParticles: THREE.Points | undefined;
    let bakerySmokeParticles: THREE.Points | undefined;
    let arcadeHoloDice: THREE.Mesh | undefined;
    let radioDish: THREE.Object3D | undefined;
    let beaconLight: THREE.PointLight | undefined;
    let townHallClockHand: THREE.Mesh | undefined;

    town.landmarks.forEach((landmark) => {
      const pos = LANDMARK_OFFSETS[landmark.icon] || { x: 0, z: 0, label: landmark.name, icon: landmark.icon };
      const lmGroup = new THREE.Group();
      lmGroup.position.set(pos.x, 0.38, pos.z);
      lmGroup.name = `landmark_${landmark.id}`;
      (lmGroup as any).userData = { type: 'landmark', landmark };

      const level = landmark.currentLevel;
      const isMax = level >= landmark.maxLevel;

      // Base Foundation Stone
      const baseGeo = new THREE.BoxGeometry(1.6, 0.25, 1.6);
      const baseMat = new THREE.MeshStandardMaterial({
        color: 0x1e293b,
        roughness: 0.6,
      });
      const baseMesh = new THREE.Mesh(baseGeo, baseMat);
      baseMesh.castShadow = true;
      baseMesh.receiveShadow = true;
      lmGroup.add(baseMesh);

      // Construct distinct architectural geometries per landmark type
      if (landmark.icon === 'Sparkles') {
        // TOWN HALL & CLOCKTOWER (Grand Civic Center)
        const hallBase = new THREE.Mesh(
          new THREE.BoxGeometry(1.4, 0.9, 1.2),
          new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.6 }) // Crimson brick
        );
        hallBase.position.y = 0.55;
        hallBase.castShadow = true;
        lmGroup.add(hallBase);

        // Columns
        for (let c = -0.5; c <= 0.5; c += 0.5) {
          const col = new THREE.Mesh(
            new THREE.CylinderGeometry(0.06, 0.07, 0.85, 8),
            new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.3 })
          );
          col.position.set(c, 0.55, 0.65);
          lmGroup.add(col);
        }

        // Triangular Pediment
        const pediment = new THREE.Mesh(
          new THREE.ConeGeometry(0.9, 0.35, 4),
          new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.4 })
        );
        pediment.rotation.y = Math.PI / 4;
        pediment.position.set(0, 1.15, 0.4);
        lmGroup.add(pediment);

        // Clocktower Spire
        const tower = new THREE.Mesh(
          new THREE.BoxGeometry(0.6, 1.4, 0.6),
          new THREE.MeshStandardMaterial({ color: 0x7f1d1d, roughness: 0.5 })
        );
        tower.position.set(0, 1.6, -0.1);
        tower.castShadow = true;
        lmGroup.add(tower);

        // Glowing Clock Face
        const clockGeo = new THREE.CircleGeometry(0.2, 16);
        const clockMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
        const clock = new THREE.Mesh(clockGeo, clockMat);
        clock.position.set(0, 1.8, 0.22);
        lmGroup.add(clock);

        // Clock Hands
        const handGeo = new THREE.BoxGeometry(0.03, 0.14, 0.01);
        const handMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });
        const hand = new THREE.Mesh(handGeo, handMat);
        hand.position.set(0, 1.8, 0.23);
        lmGroup.add(hand);
        townHallClockHand = hand;

        // Golden Spire Roof
        const spire = new THREE.Mesh(
          new THREE.ConeGeometry(0.42, 0.8, 4),
          new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.8, roughness: 0.2 })
        );
        spire.rotation.y = Math.PI / 4;
        spire.position.set(0, 2.7, -0.1);
        spire.castShadow = true;
        lmGroup.add(spire);

      } else if (landmark.icon === 'Utensils') {
        // STAR WINDMILL (Windmill & Millhouse)
        const towerGeo = new THREE.CylinderGeometry(0.55, 0.75, 1.6, 16);
        const towerMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.7 });
        const millTower = new THREE.Mesh(towerGeo, towerMat);
        millTower.position.y = 0.9;
        millTower.castShadow = true;
        lmGroup.add(millTower);

        // Conical Roof
        const roof = new THREE.Mesh(
          new THREE.ConeGeometry(0.7, 0.7, 16),
          new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.6 })
        );
        roof.position.y = 1.95;
        roof.castShadow = true;
        lmGroup.add(roof);

        // Windmill Sails Hub & Blades
        const sailsHub = new THREE.Group();
        sailsHub.position.set(0, 1.65, 0.65);

        const hubMesh = new THREE.Mesh(
          new THREE.SphereGeometry(0.12, 12, 12),
          new THREE.MeshStandardMaterial({ color: 0x78350f, metalness: 0.5 })
        );
        sailsHub.add(hubMesh);

        // 4 Sails
        for (let i = 0; i < 4; i++) {
          const bladeGroup = new THREE.Group();
          bladeGroup.rotation.z = (i * Math.PI) / 2;

          const spar = new THREE.Mesh(
            new THREE.BoxGeometry(0.04, 1.4, 0.02),
            new THREE.MeshStandardMaterial({ color: 0x451a03 })
          );
          spar.position.y = 0.7;
          bladeGroup.add(spar);

          const cloth = new THREE.Mesh(
            new THREE.PlaneGeometry(0.26, 1.1),
            new THREE.MeshStandardMaterial({ color: 0xfef3c7, side: THREE.DoubleSide })
          );
          cloth.position.set(0.12, 0.75, 0.01);
          bladeGroup.add(cloth);

          sailsHub.add(bladeGroup);
        }

        lmGroup.add(sailsHub);
        animatedWindmillSails = sailsHub;

      } else if (landmark.icon === 'Droplets') {
        // LIQUID PRISM FOUNTAIN
        const basin = new THREE.Mesh(
          new THREE.CylinderGeometry(0.9, 1.0, 0.4, 24),
          new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.3, metalness: 0.4 })
        );
        basin.position.y = 0.3;
        basin.castShadow = true;
        lmGroup.add(basin);

        // Water surface disc
        const waterDisc = new THREE.Mesh(
          new THREE.CircleGeometry(0.85, 24),
          new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.1, metalness: 0.8, transparent: true, opacity: 0.85 })
        );
        waterDisc.rotation.x = -Math.PI / 2;
        waterDisc.position.y = 0.48;
        lmGroup.add(waterDisc);

        // Tier 2 Basin
        const tier2 = new THREE.Mesh(
          new THREE.CylinderGeometry(0.45, 0.55, 0.3, 16),
          new THREE.MeshStandardMaterial({ color: 0x0369a1, roughness: 0.4 })
        );
        tier2.position.y = 0.7;
        lmGroup.add(tier2);

        // Fountain Spire
        const fSpire = new THREE.Mesh(
          new THREE.ConeGeometry(0.18, 0.6, 8),
          new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.6 })
        );
        fSpire.position.y = 1.1;
        lmGroup.add(fSpire);

        // Animated Water Particles Spray
        const pCount = 30;
        const pGeo = new THREE.BufferGeometry();
        const pPos = new Float32Array(pCount * 3);
        for (let i = 0; i < pCount; i++) {
          pPos[i * 3] = (Math.random() - 0.5) * 0.4;
          pPos[i * 3 + 1] = 1.0 + Math.random() * 0.5;
          pPos[i * 3 + 2] = (Math.random() - 0.5) * 0.4;
        }
        pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
        const pMat = new THREE.PointsMaterial({
          color: 0x7dd3fc,
          size: 0.08,
          transparent: true,
          opacity: 0.85,
        });
        const waterParticles = new THREE.Points(pGeo, pMat);
        lmGroup.add(waterParticles);
        fountainWaterParticles = waterParticles;

      } else if (landmark.icon === 'Home') {
        // MASCOT GUILDHOUSE & BAKERY
        const cottage = new THREE.Mesh(
          new THREE.BoxGeometry(1.3, 0.8, 1.1),
          new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.6 })
        );
        cottage.position.y = 0.5;
        cottage.castShadow = true;
        lmGroup.add(cottage);

        // Peaked Gable Roof
        const roof = new THREE.Mesh(
          new THREE.ConeGeometry(1.0, 0.7, 4),
          new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.5 })
        );
        roof.rotation.y = Math.PI / 4;
        roof.position.y = 1.15;
        roof.castShadow = true;
        lmGroup.add(roof);

        // Striped Awning
        const awning = new THREE.Mesh(
          new THREE.BoxGeometry(0.9, 0.08, 0.4),
          new THREE.MeshStandardMaterial({ color: 0xfbbf24, roughness: 0.4 })
        );
        awning.rotation.x = 0.25;
        awning.position.set(0, 0.65, 0.65);
        lmGroup.add(awning);

        // Chimney
        const chimney = new THREE.Mesh(
          new THREE.BoxGeometry(0.22, 0.6, 0.22),
          new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.8 })
        );
        chimney.position.set(0.4, 1.35, -0.2);
        lmGroup.add(chimney);

        // Chimney Smoke Particles
        const sCount = 12;
        const sGeo = new THREE.BufferGeometry();
        const sPos = new Float32Array(sCount * 3);
        for (let i = 0; i < sCount; i++) {
          sPos[i * 3] = 0.4 + (Math.random() - 0.5) * 0.1;
          sPos[i * 3 + 1] = 1.6 + i * 0.15;
          sPos[i * 3 + 2] = -0.2 + (Math.random() - 0.5) * 0.1;
        }
        sGeo.setAttribute('position', new THREE.BufferAttribute(sPos, 3));
        const sMat = new THREE.PointsMaterial({
          color: 0xe2e8f0,
          size: 0.14,
          transparent: true,
          opacity: 0.6,
        });
        const smoke = new THREE.Points(sGeo, sMat);
        lmGroup.add(smoke);
        bakerySmokeParticles = smoke;

      } else if (landmark.icon === 'Gamepad2') {
        // NEON ARCADE & HOLO ARENA
        const arcadeBody = new THREE.Mesh(
          new THREE.BoxGeometry(1.2, 1.2, 1.2),
          new THREE.MeshStandardMaterial({ color: 0x6b21a8, roughness: 0.3, metalness: 0.5 })
        );
        arcadeBody.position.y = 0.7;
        arcadeBody.castShadow = true;
        lmGroup.add(arcadeBody);

        // Glowing Neon Trim Lines
        const neonTrim = new THREE.Mesh(
          new THREE.BoxGeometry(1.25, 0.08, 1.25),
          new THREE.MeshBasicMaterial({ color: 0xc084fc })
        );
        neonTrim.position.y = 1.25;
        lmGroup.add(neonTrim);

        // Floating Holographic Dice on Roof
        const diceGeo = new THREE.BoxGeometry(0.35, 0.35, 0.35);
        const diceMat = new THREE.MeshStandardMaterial({
          color: 0x00f0ff,
          metalness: 0.8,
          roughness: 0.1,
          emissive: 0x00f0ff,
          emissiveIntensity: 0.4,
        });
        const holoDice = new THREE.Mesh(diceGeo, diceMat);
        holoDice.position.set(0, 1.7, 0);
        lmGroup.add(holoDice);
        arcadeHoloDice = holoDice;

      } else if (landmark.icon === 'Radio') {
        // DRIVE-IN CINEMA & BROADCAST TOWER
        const screen = new THREE.Mesh(
          new THREE.BoxGeometry(1.3, 0.8, 0.12),
          new THREE.MeshStandardMaterial({ color: 0x047857, roughness: 0.3 })
        );
        screen.position.set(0, 0.8, 0);
        screen.castShadow = true;
        lmGroup.add(screen);

        // Screen Glow Face
        const glowFace = new THREE.Mesh(
          new THREE.PlaneGeometry(1.15, 0.65),
          new THREE.MeshBasicMaterial({ color: 0x34d399 })
        );
        glowFace.position.set(0, 0.8, 0.08);
        lmGroup.add(glowFace);

        // Radio Mast
        const mast = new THREE.Mesh(
          new THREE.CylinderGeometry(0.04, 0.06, 1.5, 8),
          new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8 })
        );
        mast.position.set(0.5, 1.4, -0.2);
        lmGroup.add(mast);

        // Satellite Dish
        const dish = new THREE.Mesh(
          new THREE.SphereGeometry(0.24, 12, 12, 0, Math.PI * 2, 0, Math.PI / 2),
          new THREE.MeshStandardMaterial({ color: 0x10b981, metalness: 0.7 })
        );
        dish.position.set(0.5, 2.0, -0.2);
        dish.rotation.x = -Math.PI / 4;
        lmGroup.add(dish);
        radioDish = dish;

      } else {
        // MUSIC / SOUND STAGE or GENERIC LANDMARK
        const stage = new THREE.Mesh(
          new THREE.CylinderGeometry(0.75, 0.85, 0.5, 16),
          new THREE.MeshStandardMaterial({ color: 0xec4899, roughness: 0.4 })
        );
        stage.position.y = 0.35;
        stage.castShadow = true;
        lmGroup.add(stage);

        const totem = new THREE.Mesh(
          new THREE.OctahedronGeometry(0.35, 0),
          new THREE.MeshStandardMaterial({ color: 0xf43f5e, metalness: 0.8, roughness: 0.2 })
        );
        totem.position.y = 1.1;
        lmGroup.add(totem);
      }

      // Masterwork Crown / Star if Max Level
      if (isMax) {
        const crown = new THREE.Mesh(
          new THREE.TorusGeometry(0.4, 0.05, 8, 24),
          new THREE.MeshBasicMaterial({ color: 0xffd700 })
        );
        crown.rotation.x = Math.PI / 2;
        crown.position.y = 3.2;
        lmGroup.add(crown);
      }

      // Invisible Raycast Hit Box for touch / mouse selection
      const hitBox = new THREE.Mesh(
        new THREE.BoxGeometry(2.0, 3.2, 2.0),
        new THREE.MeshBasicMaterial({ visible: false })
      );
      hitBox.position.y = 1.4;
      (hitBox as any).userData = { type: 'landmark', landmark, parentGroup: lmGroup };
      lmGroup.add(hitBox);
      interactives.push(hitBox);

      scene.add(lmGroup);
    });

    // 6. WANDERING 3D MASCOT CITIZENS ON COBBLESTONE STREETS
    const wanderingMascots: { group: THREE.Group; basePos: THREE.Vector3; angle: number; speed: number }[] = [];
    const mascotColors = [0xf43f5e, 0x06b6d4, 0xf59e0b, 0xa855f7];

    for (let m = 0; m < 4; m++) {
      const mGroup = new THREE.Group();

      // Cute Mascot Round Body
      const body = new THREE.Mesh(
        new THREE.SphereGeometry(0.24, 16, 16),
        new THREE.MeshStandardMaterial({ color: mascotColors[m], roughness: 0.5 })
      );
      body.position.y = 0.35;
      body.castShadow = true;
      mGroup.add(body);

      // Cute Ears
      const ear1 = new THREE.Mesh(
        new THREE.ConeGeometry(0.08, 0.16, 8),
        new THREE.MeshStandardMaterial({ color: mascotColors[m] })
      );
      ear1.position.set(-0.12, 0.55, 0);
      ear1.rotation.z = 0.3;
      mGroup.add(ear1);

      const ear2 = new THREE.Mesh(
        new THREE.ConeGeometry(0.08, 0.16, 8),
        new THREE.MeshStandardMaterial({ color: mascotColors[m] })
      );
      ear2.position.set(0.12, 0.55, 0);
      ear2.rotation.z = -0.3;
      mGroup.add(ear2);

      // Cute Eyes
      const eyeMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });
      const eye1 = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), eyeMat);
      eye1.position.set(-0.08, 0.38, 0.2);
      mGroup.add(eye1);

      const eye2 = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), eyeMat);
      eye2.position.set(0.08, 0.38, 0.2);
      mGroup.add(eye2);

      const baseAngle = (m * Math.PI) / 2;
      mGroup.position.set(Math.sin(baseAngle) * 2.0, 0.38, Math.cos(baseAngle) * 2.0);
      scene.add(mGroup);

      wanderingMascots.push({
        group: mGroup,
        basePos: new THREE.Vector3(0, 0.38, 0),
        angle: baseAngle,
        speed: 0.35 + m * 0.1,
      });
    }

    // 7. SELECTION RING AROUND CLICKED LANDMARK
    const ringGeo = new THREE.RingGeometry(1.2, 1.35, 32);
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

    // Save animated props references
    stateRef.current.animatedProps = {
      windmillSails: animatedWindmillSails,
      fountainWater: fountainWaterParticles,
      bakerySmoke: bakerySmokeParticles,
      arcadeHoloDice: arcadeHoloDice,
      radioDish: radioDish,
      beaconLight: beaconLight,
      wanderingMascots: wanderingMascots,
      streetLanterns: streetLanterns,
      townHallClockHand: townHallClockHand,
    };

    // 8. INTERACTIVE DRAG & ORBIT CONTROLS
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
      stateRef.current.orbit.phi = Math.max(0.18, Math.min(1.25, stateRef.current.orbit.phi + dy));

      stateRef.current.dragStart = { x: e.clientX, y: e.clientY };
    };

    const onPointerUp = (e: PointerEvent) => {
      stateRef.current.dragStart = null;

      // Click / Tap detection for raycasting
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
            setSelectedLandmark(uData.landmark);
            SoundEngine.playTileStep();
            // Position selection ring
            const pos = LANDMARK_OFFSETS[uData.landmark.icon] || { x: 0, z: 0 };
            selRing.position.set(pos.x, 0.45, pos.z);
            (selRing.material as THREE.MeshBasicMaterial).opacity = 0.9;
          }
        } else {
          // Tap background to dismiss selection
          setSelectedLandmark(null);
          (selRing.material as THREE.MeshBasicMaterial).opacity = 0;
        }
      }
    };

    domElement.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);

    // 9. ANIMATION LOOP
    const animate = () => {
      stateRef.current.animId = requestAnimationFrame(animate);
      const elapsed = stateRef.current.clock.getElapsedTime();
      const s = stateRef.current;

      // Auto rotation
      if (isAutoRotate && !s.dragStart) {
        s.orbit.theta += 0.0035;
      }

      // Camera position from spherical coordinates
      const { theta, phi, radius, target } = s.orbit;
      camera.position.x = target.x + radius * Math.sin(theta) * Math.cos(phi);
      camera.position.y = target.y + radius * Math.sin(phi);
      camera.position.z = target.z + radius * Math.cos(theta) * Math.cos(phi);
      camera.lookAt(target);

      // Windmill Sails Continuous Rotation
      if (s.animatedProps.windmillSails) {
        s.animatedProps.windmillSails.rotation.z += 0.025;
      }

      // Town Hall Clock Hand Rotation
      if (s.animatedProps.townHallClockHand) {
        s.animatedProps.townHallClockHand.rotation.z = -elapsed * 0.5;
      }

      // Arcade Holo Dice Rotation & Bobbing
      if (s.animatedProps.arcadeHoloDice) {
        s.animatedProps.arcadeHoloDice.rotation.x += 0.02;
        s.animatedProps.arcadeHoloDice.rotation.y += 0.03;
        s.animatedProps.arcadeHoloDice.position.y = 1.7 + Math.sin(elapsed * 3) * 0.08;
      }

      // Radio Dish Scanning Motion
      if (s.animatedProps.radioDish) {
        s.animatedProps.radioDish.rotation.y = Math.sin(elapsed * 1.5) * 0.4;
      }

      // Water Particles Animation
      if (s.animatedProps.fountainWater) {
        const posAttr = s.animatedProps.fountainWater.geometry.attributes.position as THREE.BufferAttribute;
        for (let i = 0; i < posAttr.count; i++) {
          let y = posAttr.getY(i);
          y -= 0.015;
          if (y < 0.7) {
            y = 1.35 + Math.random() * 0.2;
          }
          posAttr.setY(i, y);
        }
        posAttr.needsUpdate = true;
      }

      // Bakery Smoke Particles
      if (s.animatedProps.bakerySmoke) {
        const sAttr = s.animatedProps.bakerySmoke.geometry.attributes.position as THREE.BufferAttribute;
        for (let i = 0; i < sAttr.count; i++) {
          let y = sAttr.getY(i);
          let x = sAttr.getX(i);
          y += 0.008;
          x += Math.sin(elapsed * 2 + i) * 0.002;
          if (y > 2.8) {
            y = 1.6;
            x = 0.4 + (Math.random() - 0.5) * 0.08;
          }
          sAttr.setY(i, y);
          sAttr.setX(i, x);
        }
        sAttr.needsUpdate = true;
      }

      // Wandering Mascots walking along circular path
      if (s.animatedProps.wanderingMascots) {
        s.animatedProps.wanderingMascots.forEach((wm) => {
          wm.angle += 0.006 * wm.speed;
          const r = 2.1;
          wm.group.position.x = Math.sin(wm.angle) * r;
          wm.group.position.z = Math.cos(wm.angle) * r;
          // Hop bounce
          wm.group.position.y = 0.38 + Math.abs(Math.sin(elapsed * 6 * wm.speed)) * 0.12;
          // Face tangent direction of motion
          wm.group.rotation.y = wm.angle + Math.PI / 2;
        });
      }

      // Selection Ring Pulse
      if (s.selectionRing && (s.selectionRing.material as THREE.MeshBasicMaterial).opacity > 0) {
        s.selectionRing.rotation.z += 0.03;
        const scale = 1.0 + Math.sin(elapsed * 5) * 0.05;
        s.selectionRing.scale.set(scale, scale, 1);
      }

      renderer.render(scene, camera);
    };

    animate();

    // 10. Resize Handling
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth || 400;
      const h = container.clientHeight || 450;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    // 11. Complete Cleanup
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
    onUpgradeLandmark(selectedLandmark.id, cost);

    // Update selected landmark local reference
    setSelectedLandmark((prev) => {
      if (!prev) return null;
      return { ...prev, currentLevel: prev.currentLevel + 1 };
    });
  };

  const currentCost = selectedLandmark ? selectedLandmark.costPerLevel[selectedLandmark.currentLevel] || 0 : 0;
  const isMaxLevel = selectedLandmark ? selectedLandmark.currentLevel >= selectedLandmark.maxLevel : false;

  return (
    <div className="relative w-full aspect-[4/3] min-h-[420px] rounded-3xl overflow-hidden border-2 border-indigo-900/60 shadow-2xl bg-slate-950 select-none">
      {/* 3D Canvas Mount Point */}
      <div
        ref={mountRef}
        className="w-full h-full cursor-grab active:cursor-grabbing touch-none"
        style={{ touchAction: 'none' }}
      />

      {/* Top Floating Controls Bar */}
      <div className="absolute top-2.5 inset-x-3 flex items-center justify-between pointer-events-none z-10">
        {/* Title Badge */}
        <div className="flex items-center gap-2 pointer-events-auto bg-slate-950/85 px-3 py-1.5 rounded-2xl border border-slate-800 backdrop-blur-md shadow-lg">
          <span className="text-base animate-bounce">🏰</span>
          <div>
            <div className="text-[11px] font-black text-white flex items-center gap-1.5 uppercase tracking-wider">
              <span>Standalone 3D Town</span>
              <span className="text-[8px] bg-cyan-500/20 text-cyan-300 px-1.5 py-0.2 rounded-full border border-cyan-400/40 font-bold">
                W{town.worldNumber}
              </span>
            </div>
            <div className="text-[8.5px] text-slate-400">Full 360° Architectural Environment</div>
          </div>
        </div>

        {/* View Camera Presets & Ambiance Toggle */}
        <div className="flex items-center gap-1.5 pointer-events-auto bg-slate-950/85 p-1 rounded-2xl border border-slate-800 backdrop-blur-md shadow-lg">
          {/* Day / Twilight / Night */}
          <button
            onClick={() => {
              setTimeOfDay((prev) => (prev === 'day' ? 'twilight' : prev === 'twilight' ? 'night' : 'day'));
              SoundEngine.playTileStep();
            }}
            className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs cursor-pointer"
            title={`Current lighting: ${timeOfDay}. Tap to cycle day/twilight/night.`}
          >
            {timeOfDay === 'day' ? '☀️' : timeOfDay === 'twilight' ? '🌆' : '🌙'}
          </button>

          {/* Camera Angles */}
          <div className="flex items-center gap-0.5 bg-slate-900 p-0.5 rounded-xl border border-slate-800">
            <button
              onClick={() => setCameraViewPreset('overview')}
              className={`px-2 py-0.5 rounded-lg text-[8.5px] font-black uppercase transition-all cursor-pointer ${
                cameraViewPreset === 'overview'
                  ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setCameraViewPreset('plaza')}
              className={`px-2 py-0.5 rounded-lg text-[8.5px] font-black uppercase transition-all cursor-pointer ${
                cameraViewPreset === 'plaza'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Plaza
            </button>
            <button
              onClick={() => setCameraViewPreset('windmill')}
              className={`px-2 py-0.5 rounded-lg text-[8.5px] font-black uppercase transition-all cursor-pointer ${
                cameraViewPreset === 'windmill'
                  ? 'bg-gradient-to-r from-pink-500 to-fuchsia-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Windmill
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

      {/* Orbit Tip Overlay */}
      {!selectedLandmark && (
        <div className="absolute bottom-2.5 left-3 pointer-events-none">
          <span className="text-[8.5px] font-black text-slate-300 bg-slate-950/85 px-3 py-1.5 rounded-xl border border-slate-800 uppercase tracking-wider backdrop-blur-md flex items-center gap-1.5">
            <span>🖱️ Drag to orbit 360°</span>
            <span className="text-slate-500">•</span>
            <span>Tap any building to inspect & upgrade</span>
          </span>
        </div>
      )}

      {/* 3D Interactive Building Inspector Drawer */}
      {selectedLandmark && (
        <div className="absolute bottom-2.5 inset-x-2.5 p-3 rounded-2xl bg-slate-950/95 border-2 border-indigo-500/60 shadow-2xl backdrop-blur-md z-20 flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-xl bg-indigo-950/80 border border-indigo-500/40 flex items-center justify-center text-lg shadow-md">
                🏛️
              </span>
              <div>
                <h4 className="text-xs font-black text-white leading-tight flex items-center gap-1.5">
                  <span>{selectedLandmark.name}</span>
                  {isMaxLevel && (
                    <span className="px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-950 font-black text-[7.5px] uppercase">
                      Masterwork
                    </span>
                  )}
                </h4>
                <div className="flex items-center gap-2 text-[9px] text-slate-400">
                  <span className="text-amber-300 font-bold">
                    Tier {selectedLandmark.currentLevel}/{selectedLandmark.maxLevel}
                  </span>
                  <span>•</span>
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

          {/* Action Row */}
          <div className="flex items-center gap-2 mt-0.5">
            {!isMaxLevel ? (
              <button
                onClick={handleUpgradeFrom3D}
                disabled={coins < currentCost}
                className={`flex-1 py-2 px-3 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-between transition-all cursor-pointer ${
                  coins >= currentCost
                    ? 'bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500 text-slate-950 shadow-md hover:brightness-110 active:scale-98'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Hammer className="w-4 h-4" />
                  <span>Upgrade Landmark in 3D</span>
                </div>
                <div className="flex items-center gap-1 bg-black/25 px-2 py-0.5 rounded-lg text-[10px]">
                  <span>{currentCost.toLocaleString()}</span>
                  <span>🪙</span>
                </div>
              </button>
            ) : (
              <div className="flex-1 py-2 px-3 rounded-xl bg-amber-950/80 border border-amber-500/40 text-amber-300 text-center font-black text-xs flex items-center justify-center gap-1.5">
                <span>👑 Maximum Landmark Tier Achieved!</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
