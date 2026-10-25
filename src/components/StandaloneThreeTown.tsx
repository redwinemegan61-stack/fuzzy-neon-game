import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Town, Landmark, Mascot } from '../types';
import { SoundEngine } from '../utils/sound';
import confetti from 'canvas-confetti';
import {
  RotateCw, Hammer, X, Sparkles
} from 'lucide-react';

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
  Sparkles: { x: 0, z: -0.6, label: 'Town Hall & Clocktower', icon: 'Sparkles' }, // Plaza Center-North
  Droplets: { x: 0, z: 1.9, label: 'Prism Fountain', icon: 'Droplets' },          // Plaza Center-South
  Home: { x: -3.4, z: -1.2, label: 'Guildhouse & Bakery', icon: 'Home' },        // West Village
  Utensils: { x: 3.5, z: -1.4, label: 'Star Windmill', icon: 'Utensils' },       // East Windmill Hill
  Gamepad2: { x: -3.3, z: 1.9, label: 'Neon Arcade', icon: 'Gamepad2' },         // South-West Arcade
  Radio: { x: 3.3, z: 2.0, label: 'Cinema & Broadcast', icon: 'Radio' },         // South-East Radio
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
  const [isPlaygroundSelected, setIsPlaygroundSelected] = useState(false);
  const [playgroundBoostCount, setPlaygroundBoostCount] = useState(0);
  const [timeOfDay, setTimeOfDay] = useState<'day' | 'twilight' | 'night'>('day');
  const [isAutoRotate, setIsAutoRotate] = useState(true);
  const [cameraViewPreset, setCameraViewPreset] = useState<'overview' | 'plaza' | 'playground' | 'windmill'>('overview');

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
    playgroundSpinBoost: number;
    animatedProps: {
      windmillSails?: THREE.Object3D;
      fountainWater?: THREE.Points;
      bakerySmoke?: THREE.Points;
      arcadeHoloDice?: THREE.Mesh;
      radioDish?: THREE.Object3D;
      beaconLight?: THREE.PointLight;
      wanderingMascots?: { group: THREE.Group; basePos: THREE.Vector3; angle: number; speed: number }[];
      streetLanterns?: THREE.PointLight[];
      townHallClockHand?: THREE.Mesh;
      treeCrowns?: { group: THREE.Group; phase: number }[];
      merryGoRound?: THREE.Group;
      swingSeats?: THREE.Group[];
      seesawPlank?: THREE.Group;
      blossomPetals?: THREE.Points;
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
    orbit: { theta: 0.55, phi: 0.56, radius: 15.8, target: new THREE.Vector3(0, 0.5, 0.5) },
    interactiveObjects: [],
    selectionRing: null,
    playgroundSpinBoost: 0,
    animatedProps: {},
    raycaster: new THREE.Raycaster(),
    mouse: new THREE.Vector2(-999, -999),
  });

  // Switch camera smoothly based on view preset
  useEffect(() => {
    const s = stateRef.current;
    if (cameraViewPreset === 'overview') {
      s.orbit.radius = 16.0;
      s.orbit.phi = 0.6;
      s.orbit.target.set(0, 0.5, 0.4);
    } else if (cameraViewPreset === 'plaza') {
      s.orbit.radius = 10.0;
      s.orbit.phi = 0.48;
      s.orbit.target.set(0, 1.0, 0.6);
    } else if (cameraViewPreset === 'playground') {
      s.orbit.radius = 7.8;
      s.orbit.phi = 0.42;
      s.orbit.theta = 0.15;
      s.orbit.target.set(0, 0.85, 4.2);
    } else if (cameraViewPreset === 'windmill') {
      s.orbit.radius = 10.5;
      s.orbit.phi = 0.52;
      s.orbit.target.set(3.5, 1.2, -1.4);
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
    scene.fog = new THREE.FogExp2(bgColors[timeOfDay], timeOfDay === 'night' ? 0.022 : 0.013);

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
      timeOfDay === 'night' ? 1.5 : timeOfDay === 'twilight' ? 2.1 : 2.6
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

    // 4. STANDALONE 3D TOWN LANDSCAPE
    const landscapeGroup = new THREE.Group();

    // Sturdy Beveled Foundation Pedestal (Granite & Stone Tiered Base)
    const baseGeo = new THREE.CylinderGeometry(7.0, 7.2, 0.5, 48);
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
    const meadowGeo = new THREE.CylinderGeometry(6.9, 6.9, 0.4, 48);
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
    const plazaGeo = new THREE.CylinderGeometry(2.4, 2.4, 0.06, 32);
    const plazaMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      roughness: 0.8,
      metalness: 0.15,
    });
    const plazaMesh = new THREE.Mesh(plazaGeo, plazaMat);
    plazaMesh.position.y = 0.36;
    plazaMesh.receiveShadow = true;
    landscapeGroup.add(plazaMesh);

    // Plaza Inset Pattern (Lighter Stone Ring)
    const plazaRingGeo = new THREE.RingGeometry(1.55, 2.15, 32);
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
      const roadGeo = new THREE.BoxGeometry(0.8, 0.05, 3.8);
      const roadMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.85 });
      const road = new THREE.Mesh(roadGeo, roadMat);
      road.rotation.y = ang;
      road.position.set(Math.sin(ang) * 3.4, 0.35, Math.cos(ang) * 3.4);
      road.receiveShadow = true;
      landscapeGroup.add(road);
    });

    // 4B. REALISTIC MULTI-BRANCHED ORGANIC 3D TREES & FLOWER RINGS
    const treeSpecs: {
      x: number;
      z: number;
      scale: number;
      style: 'oak' | 'sakura' | 'autumn' | 'pine';
    }[] = [
      { x: -5.1, z: 0.6, scale: 1.15, style: 'oak' },
      { x: -4.7, z: -2.9, scale: 1.05, style: 'sakura' },
      { x: -2.2, z: 4.8, scale: 1.0, style: 'sakura' },
      { x: 2.3, z: 4.7, scale: 1.1, style: 'oak' },
      { x: 5.1, z: 0.3, scale: 1.2, style: 'autumn' },
      { x: 4.5, z: -3.4, scale: 1.0, style: 'oak' },
      { x: 0.1, z: -5.2, scale: 1.15, style: 'pine' },
      { x: -3.4, z: -4.6, scale: 0.95, style: 'autumn' },
      { x: -5.0, z: 3.2, scale: 0.9, style: 'pine' },
      { x: 4.9, z: 3.3, scale: 0.95, style: 'sakura' },
    ];

    const treeCrowns: { group: THREE.Group; phase: number }[] = [];

    treeSpecs.forEach((ts, idx) => {
      const treeGroup = new THREE.Group();
      treeGroup.position.set(ts.x, 0.35, ts.z);
      treeGroup.scale.setScalar(ts.scale);

      // Stone Tree-Ring Planter & Wildflower Base
      const ringStone = new THREE.Mesh(
        new THREE.TorusGeometry(0.42, 0.06, 8, 16),
        new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.85 })
      );
      ringStone.rotation.x = Math.PI / 2;
      ringStone.position.y = 0.03;
      treeGroup.add(ringStone);

      // Flared Root Base + Realistic Tapered Bark Trunk
      const barkMat = new THREE.MeshStandardMaterial({
        color: ts.style === 'sakura' ? 0x4a2c2a : 0x5c3a21,
        roughness: 0.92,
      });

      const rootFlare = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.28, 0.28, 10), barkMat);
      rootFlare.position.y = 0.14;
      rootFlare.castShadow = true;
      treeGroup.add(rootFlare);

      const mainTrunk = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.15, 0.85, 10), barkMat);
      mainTrunk.position.y = 0.55;
      mainTrunk.castShadow = true;
      treeGroup.add(mainTrunk);

      // Secondary Woody Boughs (3 angled branches)
      const branchAngles = [0, (2 * Math.PI) / 3, (4 * Math.PI) / 3];
      branchAngles.forEach((bAng, bIdx) => {
        const bough = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.07, 0.55, 8), barkMat);
        bough.position.set(Math.cos(bAng) * 0.16, 0.92 + bIdx * 0.05, Math.sin(bAng) * 0.16);
        bough.rotation.z = -Math.cos(bAng) * 0.55;
        bough.rotation.x = Math.sin(bAng) * 0.55;
        bough.castShadow = true;
        treeGroup.add(bough);
      });

      // Multi-Clustered Organic Leaf Canopy
      const crownGroup = new THREE.Group();
      crownGroup.position.y = 1.15;

      const palette =
        ts.style === 'sakura'
          ? [0xf472b6, 0xf9a8d4, 0xfbcfe8, 0xec4899]
          : ts.style === 'autumn'
          ? [0xd97706, 0xf59e0b, 0xea580c, 0xfbbf24]
          : ts.style === 'pine'
          ? [0x065f46, 0x047857, 0x059669, 0x10b981]
          : [0x15803d, 0x16a34a, 0x22c55e, 0x4ade80];

      // 6 organic foliage puffs arranged in a natural crown
      const puffOffsets = [
        { x: 0, y: 0.32, z: 0, r: 0.48 },
        { x: -0.32, y: 0.08, z: 0.18, r: 0.38 },
        { x: 0.34, y: 0.12, z: 0.16, r: 0.36 },
        { x: 0.05, y: 0.1, z: -0.34, r: 0.39 },
        { x: -0.24, y: 0.24, z: -0.22, r: 0.34 },
        { x: 0.24, y: 0.26, z: -0.18, r: 0.33 },
      ];

      puffOffsets.forEach((po, pIdx) => {
        const leafGeo = new THREE.DodecahedronGeometry(po.r, 1);
        const leafMat = new THREE.MeshStandardMaterial({
          color: palette[pIdx % palette.length],
          roughness: 0.78,
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

      // Wildflowers around the base of the tree
      const flowerColors = [0xf43f5e, 0xfacc15, 0xc084fc, 0x38bdf8];
      for (let f = 0; f < 5; f++) {
        const fAng = (f * Math.PI * 2) / 5 + idx;
        const flower = new THREE.Mesh(
          new THREE.SphereGeometry(0.055, 6, 6),
          new THREE.MeshBasicMaterial({ color: flowerColors[f % flowerColors.length] })
        );
        flower.position.set(Math.cos(fAng) * 0.32, 0.06, Math.sin(fAng) * 0.32);
        treeGroup.add(flower);
      }

      landscapeGroup.add(treeGroup);
    });

    // 4C. FUN INTERACTIVE 3D PLAYGROUND PARK ZONE (South Park District: x: 0, z: 4.35)
    const playgroundGroup = new THREE.Group();
    playgroundGroup.position.set(0, 0.36, 4.35);
    playgroundGroup.name = 'town_playground';

    // Soft Pastel Play Mat Pad with Rounded Wooden/Curb Border
    const playPad = new THREE.Mesh(
      new THREE.CylinderGeometry(1.75, 1.8, 0.06, 32),
      new THREE.MeshStandardMaterial({ color: 0x0d9488, roughness: 0.65 })
    );
    playPad.position.y = 0.03;
    playPad.receiveShadow = true;
    playgroundGroup.add(playPad);

    const playPadInner = new THREE.Mesh(
      new THREE.CylinderGeometry(1.62, 1.62, 0.07, 32),
      new THREE.MeshStandardMaterial({ color: 0x14b8a6, roughness: 0.7 })
    );
    playPadInner.position.y = 0.035;
    playPadInner.receiveShadow = true;
    playgroundGroup.add(playPadInner);

    // 1) Spinning Merry-Go-Round Carousel (Left-Front of Playground)
    const carouselGroup = new THREE.Group();
    carouselGroup.position.set(-0.72, 0.08, 0.25);

    const carouselDisc = new THREE.Mesh(
      new THREE.CylinderGeometry(0.48, 0.48, 0.06, 16),
      new THREE.MeshStandardMaterial({ color: 0xf43f5e, roughness: 0.4, metalness: 0.2 })
    );
    carouselDisc.castShadow = true;
    carouselGroup.add(carouselDisc);

    // Inner Yellow Star Disc
    const carouselInner = new THREE.Mesh(
      new THREE.CylinderGeometry(0.32, 0.32, 0.07, 16),
      new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.4 })
    );
    carouselGroup.add(carouselInner);

    // Center Pole & Grab Bars
    const centerPole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.035, 0.035, 0.42, 8),
      new THREE.MeshStandardMaterial({ color: 0xf8fafc, metalness: 0.8, roughness: 0.2 })
    );
    centerPole.position.y = 0.21;
    carouselGroup.add(centerPole);

    for (let b = 0; b < 4; b++) {
      const bar = new THREE.Mesh(
        new THREE.TorusGeometry(0.18, 0.018, 6, 12, Math.PI),
        new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.6 })
      );
      bar.rotation.y = (b * Math.PI) / 2;
      bar.position.y = 0.06;
      carouselGroup.add(bar);
    }

    // Cute Mini Mascot Riding the Merry-Go-Round!
    const riderBody = new THREE.Mesh(
      new THREE.SphereGeometry(0.14, 12, 12),
      new THREE.MeshStandardMaterial({ color: 0xfbbf24, roughness: 0.4 })
    );
    riderBody.position.set(0.24, 0.18, 0);
    carouselGroup.add(riderBody);

    playgroundGroup.add(carouselGroup);

    // 2) Rainbow Adventure Slide & Watchtower (Right-Back of Playground)
    const slideGroup = new THREE.Group();
    slideGroup.position.set(0.68, 0.06, -0.25);

    // 4 Wooden Tower Posts
    const postMat = new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.7 });
    [
      [-0.22, -0.22],
      [0.22, -0.22],
      [-0.22, 0.22],
      [0.22, 0.22],
    ].forEach(([px, pz]) => {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.95, 8), postMat);
      post.position.set(px, 0.47, pz);
      post.castShadow = true;
      slideGroup.add(post);
    });

    // Watchtower Platform Deck
    const deck = new THREE.Mesh(
      new THREE.BoxGeometry(0.56, 0.06, 0.56),
      new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.6 })
    );
    deck.position.y = 0.62;
    deck.castShadow = true;
    slideGroup.add(deck);

    // Peaked Playhouse Canopy Roof
    const playRoof = new THREE.Mesh(
      new THREE.ConeGeometry(0.46, 0.38, 4),
      new THREE.MeshStandardMaterial({ color: 0xec4899, roughness: 0.5 })
    );
    playRoof.rotation.y = Math.PI / 4;
    playRoof.position.y = 1.12;
    playRoof.castShadow = true;
    slideGroup.add(playRoof);

    // Bright Yellow Slide Chute sloping down
    const chute = new THREE.Mesh(
      new THREE.BoxGeometry(0.26, 0.04, 0.85),
      new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.25, metalness: 0.1 })
    );
    chute.position.set(0, 0.34, 0.52);
    chute.rotation.x = 0.68;
    chute.castShadow = true;
    slideGroup.add(chute);

    playgroundGroup.add(slideGroup);

    // 3) Animated Dual Swing Set (North-West of Playground)
    const swingFrameGroup = new THREE.Group();
    swingFrameGroup.position.set(-0.35, 0.06, -0.58);

    const frameMat = new THREE.MeshStandardMaterial({ color: 0x3b82f6, metalness: 0.5, roughness: 0.3 });
    const topBar = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.95, 8), frameMat);
    topBar.rotation.z = Math.PI / 2;
    topBar.position.y = 0.82;
    swingFrameGroup.add(topBar);

    // Left & Right A-Frame Legs
    [-0.44, 0.44].forEach((lx) => {
      const leg1 = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.88, 8), frameMat);
      leg1.position.set(lx, 0.42, 0.18);
      leg1.rotation.x = -0.22;
      swingFrameGroup.add(leg1);

      const leg2 = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.88, 8), frameMat);
      leg2.position.set(lx, 0.42, -0.18);
      leg2.rotation.x = 0.22;
      swingFrameGroup.add(leg2);
    });

    // Two Animated Swing Seats pivoting from topBar
    const swingSeats: THREE.Group[] = [];
    [-0.2, 0.2].forEach((sx) => {
      const pivotGroup = new THREE.Group();
      pivotGroup.position.set(sx, 0.82, 0);

      const chainMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.8 });
      const chainL = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.55, 6), chainMat);
      chainL.position.set(-0.07, -0.27, 0);
      pivotGroup.add(chainL);

      const chainR = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.55, 6), chainMat);
      chainR.position.set(0.07, -0.27, 0);
      pivotGroup.add(chainR);

      const seat = new THREE.Mesh(
        new THREE.BoxGeometry(0.18, 0.03, 0.12),
        new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.5 })
      );
      seat.position.set(0, -0.55, 0);
      pivotGroup.add(seat);

      swingFrameGroup.add(pivotGroup);
      swingSeats.push(pivotGroup);
    });

    playgroundGroup.add(swingFrameGroup);

    // 4) Rocking Seesaw / Teeter-Totter (South-East of Playground)
    const seesawGroup = new THREE.Group();
    seesawGroup.position.set(0.35, 0.06, 0.65);

    const fulcrum = new THREE.Mesh(
      new THREE.ConeGeometry(0.12, 0.2, 4),
      new THREE.MeshStandardMaterial({ color: 0xa855f7, roughness: 0.5 })
    );
    fulcrum.position.y = 0.1;
    seesawGroup.add(fulcrum);

    const seesawPlank = new THREE.Group();
    seesawPlank.position.y = 0.2;
    const plankMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.78, 0.035, 0.16),
      new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.4 })
    );
    seesawPlank.add(plankMesh);
    seesawGroup.add(seesawPlank);
    playgroundGroup.add(seesawGroup);

    // Raycast Hit Box for Playground Inspection
    const playgroundHitBox = new THREE.Mesh(
      new THREE.BoxGeometry(3.2, 1.8, 3.2),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    playgroundHitBox.position.y = 0.8;
    (playgroundHitBox as any).userData = { type: 'playground' };
    playgroundGroup.add(playgroundHitBox);
    interactives.push(playgroundHitBox);

    landscapeGroup.add(playgroundGroup);

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

      const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.04, 0.05, 1.2, 8),
        new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.8, roughness: 0.3 })
      );
      pole.position.y = 0.6;
      poleGroup.add(pole);

      const lampGlass = new THREE.Mesh(
        new THREE.SphereGeometry(0.12, 8, 8),
        new THREE.MeshBasicMaterial({ color: timeOfDay === 'night' ? 0xfff3a1 : 0xfffae0 })
      );
      lampGlass.position.y = 1.25;
      poleGroup.add(lampGlass);

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

      const baseGeo = new THREE.BoxGeometry(1.6, 0.25, 1.6);
      const baseMat = new THREE.MeshStandardMaterial({
        color: 0x1e293b,
        roughness: 0.6,
      });
      const baseMesh = new THREE.Mesh(baseGeo, baseMat);
      baseMesh.castShadow = true;
      baseMesh.receiveShadow = true;
      lmGroup.add(baseMesh);

      if (landmark.icon === 'Sparkles') {
        const hallBase = new THREE.Mesh(
          new THREE.BoxGeometry(1.4, 0.9, 1.2),
          new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.6 })
        );
        hallBase.position.y = 0.55;
        hallBase.castShadow = true;
        lmGroup.add(hallBase);

        for (let c = -0.5; c <= 0.5; c += 0.5) {
          const col = new THREE.Mesh(
            new THREE.CylinderGeometry(0.06, 0.07, 0.85, 8),
            new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.3 })
          );
          col.position.set(c, 0.55, 0.65);
          lmGroup.add(col);
        }

        const pediment = new THREE.Mesh(
          new THREE.ConeGeometry(0.9, 0.35, 4),
          new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.4 })
        );
        pediment.rotation.y = Math.PI / 4;
        pediment.position.set(0, 1.15, 0.4);
        lmGroup.add(pediment);

        const tower = new THREE.Mesh(
          new THREE.BoxGeometry(0.6, 1.4, 0.6),
          new THREE.MeshStandardMaterial({ color: 0x7f1d1d, roughness: 0.5 })
        );
        tower.position.set(0, 1.6, -0.1);
        tower.castShadow = true;
        lmGroup.add(tower);

        const clockGeo = new THREE.CircleGeometry(0.2, 16);
        const clockMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
        const clock = new THREE.Mesh(clockGeo, clockMat);
        clock.position.set(0, 1.8, 0.22);
        lmGroup.add(clock);

        const handGeo = new THREE.BoxGeometry(0.03, 0.14, 0.01);
        const handMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });
        const hand = new THREE.Mesh(handGeo, handMat);
        hand.position.set(0, 1.8, 0.23);
        lmGroup.add(hand);
        townHallClockHand = hand;

        const spire = new THREE.Mesh(
          new THREE.ConeGeometry(0.42, 0.8, 4),
          new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.8, roughness: 0.2 })
        );
        spire.rotation.y = Math.PI / 4;
        spire.position.set(0, 2.7, -0.1);
        spire.castShadow = true;
        lmGroup.add(spire);

      } else if (landmark.icon === 'Utensils') {
        const towerGeo = new THREE.CylinderGeometry(0.55, 0.75, 1.6, 16);
        const towerMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.7 });
        const millTower = new THREE.Mesh(towerGeo, towerMat);
        millTower.position.y = 0.9;
        millTower.castShadow = true;
        lmGroup.add(millTower);

        const roof = new THREE.Mesh(
          new THREE.ConeGeometry(0.7, 0.7, 16),
          new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.6 })
        );
        roof.position.y = 1.95;
        roof.castShadow = true;
        lmGroup.add(roof);

        const sailsHub = new THREE.Group();
        sailsHub.position.set(0, 1.65, 0.65);

        const hubMesh = new THREE.Mesh(
          new THREE.SphereGeometry(0.12, 12, 12),
          new THREE.MeshStandardMaterial({ color: 0x78350f, metalness: 0.5 })
        );
        sailsHub.add(hubMesh);

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
        const basin = new THREE.Mesh(
          new THREE.CylinderGeometry(0.9, 1.0, 0.4, 24),
          new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.3, metalness: 0.4 })
        );
        basin.position.y = 0.3;
        basin.castShadow = true;
        lmGroup.add(basin);

        const waterDisc = new THREE.Mesh(
          new THREE.CircleGeometry(0.85, 24),
          new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.1, metalness: 0.8, transparent: true, opacity: 0.85 })
        );
        waterDisc.rotation.x = -Math.PI / 2;
        waterDisc.position.y = 0.48;
        lmGroup.add(waterDisc);

        const tier2 = new THREE.Mesh(
          new THREE.CylinderGeometry(0.45, 0.55, 0.3, 16),
          new THREE.MeshStandardMaterial({ color: 0x0369a1, roughness: 0.4 })
        );
        tier2.position.y = 0.7;
        lmGroup.add(tier2);

        const fSpire = new THREE.Mesh(
          new THREE.ConeGeometry(0.18, 0.6, 8),
          new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.6 })
        );
        fSpire.position.y = 1.1;
        lmGroup.add(fSpire);

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
        const cottage = new THREE.Mesh(
          new THREE.BoxGeometry(1.3, 0.8, 1.1),
          new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.6 })
        );
        cottage.position.y = 0.5;
        cottage.castShadow = true;
        lmGroup.add(cottage);

        const roof = new THREE.Mesh(
          new THREE.ConeGeometry(1.0, 0.7, 4),
          new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.5 })
        );
        roof.rotation.y = Math.PI / 4;
        roof.position.y = 1.15;
        roof.castShadow = true;
        lmGroup.add(roof);

        const awning = new THREE.Mesh(
          new THREE.BoxGeometry(0.9, 0.08, 0.4),
          new THREE.MeshStandardMaterial({ color: 0xfbbf24, roughness: 0.4 })
        );
        awning.rotation.x = 0.25;
        awning.position.set(0, 0.65, 0.65);
        lmGroup.add(awning);

        const chimney = new THREE.Mesh(
          new THREE.BoxGeometry(0.22, 0.6, 0.22),
          new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.8 })
        );
        chimney.position.set(0.4, 1.35, -0.2);
        lmGroup.add(chimney);

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
        const arcadeBody = new THREE.Mesh(
          new THREE.BoxGeometry(1.2, 1.2, 1.2),
          new THREE.MeshStandardMaterial({ color: 0x6b21a8, roughness: 0.3, metalness: 0.5 })
        );
        arcadeBody.position.y = 0.7;
        arcadeBody.castShadow = true;
        lmGroup.add(arcadeBody);

        const neonTrim = new THREE.Mesh(
          new THREE.BoxGeometry(1.25, 0.08, 1.25),
          new THREE.MeshBasicMaterial({ color: 0xc084fc })
        );
        neonTrim.position.y = 1.25;
        lmGroup.add(neonTrim);

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
        const screen = new THREE.Mesh(
          new THREE.BoxGeometry(1.3, 0.8, 0.12),
          new THREE.MeshStandardMaterial({ color: 0x047857, roughness: 0.3 })
        );
        screen.position.set(0, 0.8, 0);
        screen.castShadow = true;
        lmGroup.add(screen);

        const glowFace = new THREE.Mesh(
          new THREE.PlaneGeometry(1.15, 0.65),
          new THREE.MeshBasicMaterial({ color: 0x34d399 })
        );
        glowFace.position.set(0, 0.8, 0.08);
        lmGroup.add(glowFace);

        const mast = new THREE.Mesh(
          new THREE.CylinderGeometry(0.04, 0.06, 1.5, 8),
          new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8 })
        );
        mast.position.set(0.5, 1.4, -0.2);
        lmGroup.add(mast);

        const dish = new THREE.Mesh(
          new THREE.SphereGeometry(0.24, 12, 12, 0, Math.PI * 2, 0, Math.PI / 2),
          new THREE.MeshStandardMaterial({ color: 0x10b981, metalness: 0.7 })
        );
        dish.position.set(0.5, 2.0, -0.2);
        dish.rotation.x = -Math.PI / 4;
        lmGroup.add(dish);
        radioDish = dish;

      } else {
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

      if (isMax) {
        const crown = new THREE.Mesh(
          new THREE.TorusGeometry(0.4, 0.05, 8, 24),
          new THREE.MeshBasicMaterial({ color: 0xffd700 })
        );
        crown.rotation.x = Math.PI / 2;
        crown.position.y = 3.2;
        lmGroup.add(crown);
      }

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

      const body = new THREE.Mesh(
        new THREE.SphereGeometry(0.24, 16, 16),
        new THREE.MeshStandardMaterial({ color: mascotColors[m], roughness: 0.5 })
      );
      body.position.y = 0.35;
      body.castShadow = true;
      mGroup.add(body);

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

    // 7. SELECTION RING AROUND CLICKED LANDMARK OR PLAYGROUND
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
      treeCrowns: treeCrowns,
      merryGoRound: carouselGroup,
      swingSeats: swingSeats,
      seesawPlank: seesawPlank,
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

    // 9. ANIMATION LOOP
    const animate = () => {
      stateRef.current.animId = requestAnimationFrame(animate);
      const elapsed = stateRef.current.clock.getElapsedTime();
      const s = stateRef.current;

      if (isAutoRotate && !s.dragStart) {
        s.orbit.theta += 0.0032;
      }

      const { theta, phi, radius, target } = s.orbit;
      camera.position.x = target.x + radius * Math.sin(theta) * Math.cos(phi);
      camera.position.y = target.y + radius * Math.sin(phi);
      camera.position.z = target.z + radius * Math.cos(theta) * Math.cos(phi);
      camera.lookAt(target);

      // Windmill Sails Continuous Rotation
      if (s.animatedProps.windmillSails) {
        s.animatedProps.windmillSails.rotation.z += 0.025;
      }

      // Organic Tree Canopy Gentle Breeze Sway
      if (s.animatedProps.treeCrowns) {
        s.animatedProps.treeCrowns.forEach((tc) => {
          tc.group.rotation.z = Math.sin(elapsed * 1.8 + tc.phase) * 0.035;
          tc.group.rotation.x = Math.cos(elapsed * 1.4 + tc.phase) * 0.025;
        });
      }

      // Playground Merry-Go-Round Carousel Spin
      if (s.playgroundSpinBoost > 0) {
        s.playgroundSpinBoost = Math.max(0, s.playgroundSpinBoost - 0.012);
      }
      if (s.animatedProps.merryGoRound) {
        s.animatedProps.merryGoRound.rotation.y += 0.035 + s.playgroundSpinBoost * 0.14;
      }

      // Playground Swings Rhythmic Pendulum Motion
      if (s.animatedProps.swingSeats) {
        const swingSpeed = 2.8 + s.playgroundSpinBoost * 2.0;
        s.animatedProps.swingSeats.forEach((seat, idx) => {
          seat.rotation.x = Math.sin(elapsed * swingSpeed + idx * Math.PI) * 0.42;
        });
      }

      // Playground Seesaw Rocking Motion
      if (s.animatedProps.seesawPlank) {
        s.animatedProps.seesawPlank.rotation.z = Math.sin(elapsed * 2.2) * 0.24;
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
          const r = 2.05;
          wm.group.position.x = Math.sin(wm.angle) * r;
          wm.group.position.z = Math.cos(wm.angle) * r;
          wm.group.position.y = 0.38 + Math.abs(Math.sin(elapsed * 6 * wm.speed)) * 0.12;
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
      <div className="absolute top-2.5 inset-x-3 flex items-center justify-between pointer-events-none z-10 flex-wrap gap-1.5">
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
            <div className="text-[8.5px] text-slate-400">Lush Grove & Fun Playground</div>
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
              onClick={() => {
                setCameraViewPreset('playground');
                setIsPlaygroundSelected(true);
                setSelectedLandmark(null);
              }}
              className={`px-2 py-0.5 rounded-lg text-[8.5px] font-black uppercase transition-all cursor-pointer ${
                cameraViewPreset === 'playground'
                  ? 'bg-gradient-to-r from-emerald-400 to-teal-500 text-slate-950'
                  : 'text-emerald-300 hover:text-white'
              }`}
            >
              🎠 Playground
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
      {!selectedLandmark && !isPlaygroundSelected && (
        <div className="absolute bottom-2.5 left-3 pointer-events-none">
          <span className="text-[8.5px] font-black text-slate-300 bg-slate-950/85 px-3 py-1.5 rounded-xl border border-slate-800 uppercase tracking-wider backdrop-blur-md flex items-center gap-1.5">
            <span>🌳 Realistic Trees & Playground</span>
            <span className="text-slate-500">•</span>
            <span>Tap any building or playground</span>
          </span>
        </div>
      )}

      {/* 3D Playground Inspector Drawer */}
      {isPlaygroundSelected && !selectedLandmark && (
        <div className="absolute bottom-2.5 inset-x-2.5 p-3 rounded-2xl bg-slate-950/95 border-2 border-emerald-500/60 shadow-2xl backdrop-blur-md z-20 flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-xl bg-emerald-950/80 border border-emerald-400/50 flex items-center justify-center text-lg shadow-md">
                🎠
              </span>
              <div>
                <h4 className="text-xs font-black text-white leading-tight flex items-center gap-1.5">
                  <span>Sunshine Mascot Playground</span>
                  <span className="px-1.5 py-0.2 rounded-full bg-emerald-400 text-slate-950 font-black text-[7.5px] uppercase">
                    Interactive Park
                  </span>
                </h4>
                <div className="text-[9px] text-slate-300">
                  Spinning Carousel, Rainbow Slide, Dual Swing Set & Seesaw • Cheer Spin x{playgroundBoostCount}
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
            className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md hover:brightness-110 active:scale-98 transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Spin Merry-Go-Round & Swings Faster! 🎠✨</span>
          </button>
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
