import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Town, Landmark, Mascot, MascotBurrow } from '../types';
import { MAX_MASCOT_LEVEL } from '../utils/mascotLeveling';
import { SoundEngine } from '../utils/sound';
import { 
  Building2, Home, Utensils, Droplets, Music, Gamepad2, Zap, 
  Sparkles, Radio, Layers, Sun, Moon, Sunset, Hammer, Star, 
  ChevronRight, Compass, Eye, Check, X, ArrowUpCircle, Info
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface ThreeTownBurrowsMapProps {
  town: Town;
  mascots: Mascot[];
  activeMascot: Mascot;
  playerCoins: number;
  burrows?: Record<string, MascotBurrow>;
  onUpgradeLandmark?: (landmarkId: string, cost: number) => void;
  onSelectActiveMascot?: (mascotId: string) => void;
}

// Landmark spatial positioning on surface island (polar coordinates or X/Z offsets)
const LANDMARK_OFFSETS: Record<string, { x: number; z: number; label: string; icon: string }> = {
  Home: { x: -2.8, z: 2.2, label: 'Guildhouse', icon: 'Home' },
  Utensils: { x: 2.8, z: 2.2, label: 'Star Bakery', icon: 'Utensils' },
  Droplets: { x: 0, z: 0, label: 'Prism Fountain', icon: 'Droplets' },
  Music: { x: -3.4, z: -0.6, label: 'DJ Stage', icon: 'Music' },
  Gamepad2: { x: 3.4, z: -0.6, label: 'Arcade Tower', icon: 'Gamepad2' },
  Zap: { x: -1.8, z: -3.0, label: 'Quantum Coaster', icon: 'Zap' },
  Sparkles: { x: 1.8, z: -3.0, label: 'Town Hall', icon: 'Sparkles' },
  Radio: { x: 0, z: -3.8, label: 'Ad Cinema', icon: 'Radio' },
};

// Mascot subterranean burrow chamber offsets (underground Y around -2.8 to -3.8)
const MASCOT_BURROW_OFFSETS: Record<string, { x: number; y: number; z: number; color: string; label: string }> = {
  pip: { x: -2.6, y: -2.8, z: 1.6, color: '#f59e0b', label: "Pip's Clover Den" },
  boba: { x: 2.6, y: -2.8, z: 1.6, color: '#f97316', label: "Boba's Fox Haven" },
  ziggy: { x: -2.8, y: -3.3, z: -1.4, color: '#c2410c', label: "Ziggy's Berry Cavern" },
  kora: { x: 2.8, y: -3.3, z: -1.4, color: '#06b6d4', label: "Kora's Coral Spring" },
  lulu: { x: 0, y: -3.6, z: 0.2, color: '#f472b6', label: "Lulu's Dewdrop Nest" },
};

export const ThreeTownBurrowsMap: React.FC<ThreeTownBurrowsMapProps> = ({
  town,
  mascots,
  activeMascot,
  playerCoins,
  burrows = {},
  onUpgradeLandmark,
  onSelectActiveMascot,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);

  // Inspector state
  const [selectedEntity, setSelectedEntity] = useState<{
    type: 'landmark' | 'burrow';
    id: string;
    name: string;
    level: number;
    maxLevel?: number;
    cost?: number;
    description?: string;
    color: string;
    mascot?: Mascot;
    landmark?: Landmark;
  } | null>(null);

  // View & Lighting Presets
  const [viewPreset, setViewPreset] = useState<'cutaway' | 'town' | 'burrows'>('cutaway');
  const [timeOfDay, setTimeOfDay] = useState<'day' | 'twilight' | 'night'>('night');
  const [isAutoRotate, setIsAutoRotate] = useState(true);

  // Internal mutable animation and camera state
  const sceneStateRef = useRef<{
    scene: THREE.Scene | null;
    camera: THREE.PerspectiveCamera | null;
    renderer: THREE.WebGLRenderer | null;
    animId: number;
    clock: THREE.Clock;
    targetCamPos: THREE.Vector3;
    targetLookAt: THREE.Vector3;
    currentLookAt: THREE.Vector3;
    dragStart: { x: number; y: number } | null;
    orbitAngle: { theta: number; phi: number; radius: number };
    interactiveObjects: THREE.Object3D[];
    selectionRing: THREE.Mesh | null;
    animatedProps: {
      windmillSails?: THREE.Object3D;
      fountainWater?: THREE.Mesh;
      musicRings?: THREE.Object3D[];
      tunnelPulses?: THREE.Mesh[];
      wanderingMascots?: { mesh: THREE.Group; phase: number; basePos: THREE.Vector3 }[];
      crownShrines?: THREE.Group[];
      beaconSparks?: THREE.Points;
    };
    raycaster: THREE.Raycaster;
    mouse: THREE.Vector2;
  }>({
    scene: null,
    camera: null,
    renderer: null,
    animId: 0,
    clock: new THREE.Clock(),
    targetCamPos: new THREE.Vector3(0, 7.5, 12),
    targetLookAt: new THREE.Vector3(0, -1.0, 0),
    currentLookAt: new THREE.Vector3(0, -1.0, 0),
    dragStart: null,
    orbitAngle: { theta: 0.65, phi: 0.52, radius: 14.5 },
    interactiveObjects: [],
    selectionRing: null,
    animatedProps: {},
    raycaster: new THREE.Raycaster(),
    mouse: new THREE.Vector2(-999, -999),
  });

  // Switch camera angle smoothly based on view preset
  useEffect(() => {
    const s = sceneStateRef.current;
    if (viewPreset === 'town') {
      s.orbitAngle.radius = 11.0;
      s.orbitAngle.phi = 0.72; // steeper top angle
      s.targetLookAt.set(0, 0.8, 0);
    } else if (viewPreset === 'burrows') {
      s.orbitAngle.radius = 10.5;
      s.orbitAngle.phi = 0.28; // lower angle looking into caverns
      s.targetLookAt.set(0, -2.8, 0);
    } else {
      // cutaway view
      s.orbitAngle.radius = 14.5;
      s.orbitAngle.phi = 0.52;
      s.targetLookAt.set(0, -1.0, 0);
    }
  }, [viewPreset]);

  // Main Three.js Scene Lifecycle
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 360;
    const height = container.clientHeight || 420;

    // 1. Scene & Camera Setup
    const scene = new THREE.Scene();
    sceneStateRef.current.scene = scene;

    const bgColors = {
      day: 0x87ceeb,
      twilight: 0x1f1435,
      night: 0x050816,
    };
    scene.background = new THREE.Color(bgColors[timeOfDay]);

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.set(0, 8, 14);
    camera.lookAt(0, -1, 0);
    sceneStateRef.current.camera = camera;

    // 2. WebGL Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);
    sceneStateRef.current.renderer = renderer;

    // 3. Lighting Rig
    const ambientLight = new THREE.AmbientLight(
      timeOfDay === 'night' ? 0x223355 : timeOfDay === 'twilight' ? 0x4a2c58 : 0xffffff,
      timeOfDay === 'night' ? 1.6 : 2.2
    );
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(
      timeOfDay === 'night' ? 0x6366f1 : timeOfDay === 'twilight' ? 0xf97316 : 0xfff5e6,
      timeOfDay === 'night' ? 1.8 : 3.0
    );
    sunLight.position.set(8, 14, 10);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 40;
    sunLight.shadow.camera.left = -10;
    sunLight.shadow.camera.right = 10;
    sunLight.shadow.camera.top = 10;
    sunLight.shadow.camera.bottom = -10;
    scene.add(sunLight);

    // Soft underground glow light
    const caveLight = new THREE.PointLight(0x00f0ff, 2.5, 12);
    caveLight.position.set(0, -3.2, 0);
    scene.add(caveLight);

    const interactives: THREE.Object3D[] = [];
    sceneStateRef.current.interactiveObjects = interactives;

    // 4. FLOATING ISLAND LANDMASS
    const islandGroup = new THREE.Group();

    // Surface Lush Top Cap
    const surfaceGeo = new THREE.CylinderGeometry(5.2, 5.0, 0.6, 32);
    const surfaceMat = new THREE.MeshStandardMaterial({
      color: timeOfDay === 'night' ? 0x14532d : 0x16a34a,
      roughness: 0.8,
      metalness: 0.1,
    });
    const surfaceMesh = new THREE.Mesh(surfaceGeo, surfaceMat);
    surfaceMesh.position.y = 0.3;
    surfaceMesh.receiveShadow = true;
    islandGroup.add(surfaceMesh);

    // Stone Cobblestone Town Center Plaza & Roads
    const plazaGeo = new THREE.CylinderGeometry(2.0, 2.0, 0.04, 24);
    const plazaMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.7,
      metalness: 0.2,
    });
    const plazaMesh = new THREE.Mesh(plazaGeo, plazaMat);
    plazaMesh.position.y = 0.62;
    plazaMesh.receiveShadow = true;
    islandGroup.add(plazaMesh);

    // Subterranean Rock Cutaway Body (cone pointing down)
    const subGeo = new THREE.ConeGeometry(5.0, 4.5, 24);
    const subMat = new THREE.MeshStandardMaterial({
      color: 0x1c1917,
      roughness: 0.9,
      metalness: 0.1,
      transparent: true,
      opacity: viewPreset === 'town' ? 0.95 : 0.82,
    });
    const subMesh = new THREE.Mesh(subGeo, subMat);
    subMesh.rotation.x = Math.PI;
    subMesh.position.y = -2.25;
    islandGroup.add(subMesh);

    // Golden Central Shaft connecting Town Plaza to Burrows
    const shaftGeo = new THREE.CylinderGeometry(0.7, 0.7, 3.6, 16);
    const shaftMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.3,
      metalness: 0.7,
      wireframe: true,
    });
    const shaftMesh = new THREE.Mesh(shaftGeo, shaftMat);
    shaftMesh.position.y = -1.5;
    islandGroup.add(shaftMesh);

    scene.add(islandGroup);

    // 5. 3D SURFACE TOWN LANDMARKS
    const animatedWindmillSails: THREE.Object3D[] = [];
    const animatedMusicRings: THREE.Object3D[] = [];
    const crownShrines: THREE.Group[] = [];

    town.landmarks.forEach((landmark) => {
      const pos = LANDMARK_OFFSETS[landmark.icon] || { x: 0, z: 0, label: landmark.name, icon: landmark.icon };
      const lmGroup = new THREE.Group();
      lmGroup.position.set(pos.x, 0.6, pos.z);
      lmGroup.name = `landmark_${landmark.id}`;
      (lmGroup as any).userData = { type: 'landmark', landmark };

      const level = landmark.currentLevel;
      const isMax = level >= landmark.maxLevel;

      // Base Foundation Stone
      const baseGeo = new THREE.BoxGeometry(1.3, 0.25, 1.3);
      const baseMat = new THREE.MeshStandardMaterial({
        color: 0x1e293b,
        roughness: 0.6,
      });
      const baseMesh = new THREE.Mesh(baseGeo, baseMat);
      baseMesh.castShadow = true;
      baseMesh.receiveShadow = true;
      lmGroup.add(baseMesh);

      // Building Geometry per Landmark Icon
      if (landmark.icon === 'Home') {
        // GUILDHOUSE CHALET
        const wallH = 0.7 + level * 0.15;
        const walls = new THREE.Mesh(
          new THREE.BoxGeometry(1.0, wallH, 1.0),
          new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.5 })
        );
        walls.position.y = wallH / 2;
        walls.castShadow = true;
        lmGroup.add(walls);

        // Peaked Roof
        const roof = new THREE.Mesh(
          new THREE.ConeGeometry(0.85, 0.8, 4),
          new THREE.MeshStandardMaterial({ color: isMax ? 0xf59e0b : 0xd97706, roughness: 0.4 })
        );
        roof.rotation.y = Math.PI / 4;
        roof.position.y = wallH + 0.4;
        roof.castShadow = true;
        lmGroup.add(roof);

        // Chimney
        const chimney = new THREE.Mesh(
          new THREE.BoxGeometry(0.2, 0.5, 0.2),
          new THREE.MeshStandardMaterial({ color: 0x334155 })
        );
        chimney.position.set(0.3, wallH + 0.5, 0.2);
        lmGroup.add(chimney);

      } else if (landmark.icon === 'Utensils') {
        // STAR BAKERY & WINDMILL
        const tower = new THREE.Mesh(
          new THREE.CylinderGeometry(0.5, 0.65, 1.2, 12),
          new THREE.MeshStandardMaterial({ color: 0xfde047, roughness: 0.6 })
        );
        tower.position.y = 0.6;
        tower.castShadow = true;
        lmGroup.add(tower);

        const dome = new THREE.Mesh(
          new THREE.SphereGeometry(0.5, 12, 12, 0, Math.PI * 2, 0, Math.PI / 2),
          new THREE.MeshStandardMaterial({ color: 0xb45309 })
        );
        dome.position.y = 1.2;
        lmGroup.add(dome);

        // 4 Rotating Windmill Blades
        const sailsHub = new THREE.Group();
        sailsHub.position.set(0, 1.15, 0.55);
        for (let i = 0; i < 4; i++) {
          const blade = new THREE.Mesh(
            new THREE.BoxGeometry(0.12, 0.85, 0.04),
            new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 })
          );
          blade.position.y = 0.42;
          const bladeRot = new THREE.Group();
          bladeRot.rotation.z = (i * Math.PI) / 2;
          bladeRot.add(blade);
          sailsHub.add(bladeRot);
        }
        lmGroup.add(sailsHub);
        animatedWindmillSails.push(sailsHub);

      } else if (landmark.icon === 'Droplets') {
        // LIQUID PRISM FOUNTAIN
        const basin = new THREE.Mesh(
          new THREE.CylinderGeometry(1.2, 1.1, 0.35, 24),
          new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.2, metalness: 0.3 })
        );
        basin.position.y = 0.18;
        lmGroup.add(basin);

        const waterDisc = new THREE.Mesh(
          new THREE.CircleGeometry(1.05, 24),
          new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.85 })
        );
        waterDisc.rotation.x = -Math.PI / 2;
        waterDisc.position.y = 0.34;
        lmGroup.add(waterDisc);

        const crystalSpire = new THREE.Mesh(
          new THREE.OctahedronGeometry(0.4, 0),
          new THREE.MeshStandardMaterial({ color: 0x00f0ff, roughness: 0.1, metalness: 0.9 })
        );
        crystalSpire.position.y = 0.85;
        crystalSpire.castShadow = true;
        lmGroup.add(crystalSpire);

      } else if (landmark.icon === 'Music') {
        // DJ SQUEAK & RHYTHM STAGE
        const stage = new THREE.Mesh(
          new THREE.CylinderGeometry(1.0, 1.0, 0.3, 16),
          new THREE.MeshStandardMaterial({ color: 0x4a044e, metalness: 0.6 })
        );
        stage.position.y = 0.15;
        lmGroup.add(stage);

        const arch = new THREE.Mesh(
          new THREE.TorusGeometry(0.8, 0.08, 12, 24, Math.PI),
          new THREE.MeshBasicMaterial({ color: 0xec4899 })
        );
        arch.position.y = 0.6;
        lmGroup.add(arch);
        animatedMusicRings.push(arch);

        const djDeck = new THREE.Mesh(
          new THREE.BoxGeometry(0.6, 0.4, 0.3),
          new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.2 })
        );
        djDeck.position.set(0, 0.45, 0);
        lmGroup.add(djDeck);

      } else if (landmark.icon === 'Gamepad2') {
        // ARCADE TOWER
        const height = 1.4 + level * 0.3;
        const tower = new THREE.Mesh(
          new THREE.BoxGeometry(0.8, height, 0.8),
          new THREE.MeshStandardMaterial({ color: 0x581c87, metalness: 0.5, roughness: 0.3 })
        );
        tower.position.y = height / 2;
        tower.castShadow = true;
        lmGroup.add(tower);

        // Hologram Joy-Claw crown
        const claw = new THREE.Mesh(
          new THREE.IcosahedronGeometry(0.3, 0),
          new THREE.MeshBasicMaterial({ color: 0xc084fc, wireframe: true })
        );
        claw.position.y = height + 0.35;
        lmGroup.add(claw);

      } else if (landmark.icon === 'Zap') {
        // QUANTUM COASTER BEACON
        const spireH = 1.5 + level * 0.25;
        const spire = new THREE.Mesh(
          new THREE.CylinderGeometry(0.15, 0.35, spireH, 12),
          new THREE.MeshStandardMaterial({ color: 0xeab308, metalness: 0.9, roughness: 0.2 })
        );
        spire.position.y = spireH / 2;
        spire.castShadow = true;
        lmGroup.add(spire);

        // Coaster spiral rail
        const railGeo = new THREE.TorusGeometry(0.7, 0.04, 8, 32);
        const railMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
        const rail1 = new THREE.Mesh(railGeo, railMat);
        rail1.position.y = 0.7;
        rail1.rotation.x = Math.PI / 3;
        lmGroup.add(rail1);

        const rail2 = new THREE.Mesh(railGeo, railMat);
        rail2.position.y = 1.2;
        rail2.rotation.x = -Math.PI / 4;
        lmGroup.add(rail2);

      } else if (landmark.icon === 'Sparkles') {
        // TOWN HALL & CLOCKTOWER
        const baseH = 1.2;
        const hall = new THREE.Mesh(
          new THREE.BoxGeometry(1.1, baseH, 0.9),
          new THREE.MeshStandardMaterial({ color: 0xbe123c, roughness: 0.4 })
        );
        hall.position.y = baseH / 2;
        hall.castShadow = true;
        lmGroup.add(hall);

        const spire = new THREE.Mesh(
          new THREE.ConeGeometry(0.5, 0.9, 8),
          new THREE.MeshStandardMaterial({ color: 0xfdcc0d, metalness: 0.8, roughness: 0.2 })
        );
        spire.position.y = baseH + 0.45;
        lmGroup.add(spire);

      } else if (landmark.icon === 'Radio') {
        // DRIVE-IN AD CINEMA
        const screen = new THREE.Mesh(
          new THREE.BoxGeometry(1.2, 0.7, 0.1),
          new THREE.MeshStandardMaterial({ color: 0x059669, roughness: 0.3 })
        );
        screen.position.set(0, 0.7, 0);
        lmGroup.add(screen);

        const dish = new THREE.Mesh(
          new THREE.SphereGeometry(0.25, 12, 12, 0, Math.PI * 2, 0, Math.PI / 2),
          new THREE.MeshStandardMaterial({ color: 0x10b981, metalness: 0.8 })
        );
        dish.position.set(0.4, 1.2, 0);
        dish.rotation.x = -Math.PI / 4;
        lmGroup.add(dish);
      }

      // Level Indicator Hologram Ring
      const ringGeo = new THREE.TorusGeometry(0.85, 0.03, 8, 24);
      const ringMat = new THREE.MeshBasicMaterial({
        color: isMax ? 0xffd700 : 0x00f0ff,
        transparent: true,
        opacity: 0.7,
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.rotation.x = Math.PI / 2;
      ringMesh.position.y = 0.05;
      lmGroup.add(ringMesh);

      // Invisible Raycast Hit Box for ease of clicking on touch screens
      const hitBox = new THREE.Mesh(
        new THREE.BoxGeometry(1.8, 2.5, 1.8),
        new THREE.MeshBasicMaterial({ visible: false })
      );
      hitBox.position.y = 1.0;
      (hitBox as any).userData = { type: 'landmark', landmark, parentGroup: lmGroup };
      lmGroup.add(hitBox);
      interactives.push(hitBox);

      scene.add(lmGroup);
    });

    // 6. 3D SUBTERRANEAN BURROW CHAMBERS
    const tunnelPulses: THREE.Mesh[] = [];

    mascots.forEach((mascot) => {
      const cfg = MASCOT_BURROW_OFFSETS[mascot.id] || { x: 0, y: -3.0, z: 0, color: '#f59e0b', label: mascot.name };
      const burrowGroup = new THREE.Group();
      burrowGroup.position.set(cfg.x, cfg.y, cfg.z);
      burrowGroup.name = `burrow_${mascot.id}`;

      const isMaxLvl = mascot.level >= MAX_MASCOT_LEVEL;

      // Burrow Cave Chamber Shell (Hemisphere cut into ground)
      const caveGeo = new THREE.SphereGeometry(1.15, 16, 12, 0, Math.PI * 2, 0, Math.PI / 1.5);
      const caveMat = new THREE.MeshStandardMaterial({
        color: 0x1e1b4b, // deep twilight indigo
        roughness: 0.85,
        side: THREE.BackSide,
      });
      const caveMesh = new THREE.Mesh(caveGeo, caveMat);
      burrowGroup.add(caveMesh);

      // Cozy Wood/Moss Flooring
      const floorGeo = new THREE.CylinderGeometry(1.0, 1.0, 0.1, 16);
      const floorMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(cfg.color).multiplyScalar(0.6),
        roughness: 0.9,
      });
      const floorMesh = new THREE.Mesh(floorGeo, floorMat);
      floorMesh.position.y = -0.1;
      burrowGroup.add(floorMesh);

      // Mascot Bed / Cushion
      const cushionGeo = new THREE.CylinderGeometry(0.4, 0.45, 0.15, 12);
      const cushionMat = new THREE.MeshStandardMaterial({ color: cfg.color, roughness: 0.95 });
      const cushionMesh = new THREE.Mesh(cushionGeo, cushionMat);
      cushionMesh.position.set(-0.25, 0.08, -0.2);
      burrowGroup.add(cushionMesh);

      // Cozy Warm Hearth / Crystal Lamp
      const lampGeo = new THREE.OctahedronGeometry(0.18, 0);
      const lampMat = new THREE.MeshBasicMaterial({ color: cfg.color });
      const lampMesh = new THREE.Mesh(lampGeo, lampMat);
      lampMesh.position.set(0.35, 0.35, 0.2);
      burrowGroup.add(lampMesh);

      // Point light inside each burrow chamber
      const burrowLight = new THREE.PointLight(new THREE.Color(cfg.color), isMaxLvl ? 2.5 : 1.2, 4.0);
      burrowLight.position.set(0, 0.5, 0);
      burrowGroup.add(burrowLight);

      // CELESTIAL CROWN SHRINE if Max Level Reached!
      if (isMaxLvl) {
        const crownGroup = new THREE.Group();
        const pedestal = new THREE.Mesh(
          new THREE.CylinderGeometry(0.18, 0.24, 0.4, 12),
          new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8 })
        );
        pedestal.position.y = 0.2;
        crownGroup.add(pedestal);

        const gem = new THREE.Mesh(
          new THREE.OctahedronGeometry(0.22, 0),
          new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.95, roughness: 0.1 })
        );
        gem.position.y = 0.55;
        crownGroup.add(gem);

        const halo = new THREE.Mesh(
          new THREE.TorusGeometry(0.32, 0.025, 8, 24),
          new THREE.MeshBasicMaterial({ color: 0xffe600 })
        );
        halo.position.y = 0.55;
        halo.rotation.x = Math.PI / 2;
        crownGroup.add(halo);

        crownGroup.position.set(0.2, 0, -0.1);
        burrowGroup.add(crownGroup);
        crownShrines.push(crownGroup);
      }

      // Connecting Glowing Tunnel Tube from Central Shaft to Burrow
      const tunnelCurve = new THREE.LineCurve3(
        new THREE.Vector3(0, -1.8, 0),
        new THREE.Vector3(cfg.x, cfg.y, cfg.z)
      );
      const tunnelGeo = new THREE.TubeGeometry(tunnelCurve, 12, 0.12, 8, false);
      const tunnelMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(cfg.color),
        roughness: 0.4,
        transparent: true,
        opacity: 0.65,
        wireframe: true,
      });
      const tunnelMesh = new THREE.Mesh(tunnelGeo, tunnelMat);
      islandGroup.add(tunnelMesh);

      // Animated Light Pulse Mesh moving along the tunnel
      const pulseGeo = new THREE.SphereGeometry(0.14, 8, 8);
      const pulseMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const pulseMesh = new THREE.Mesh(pulseGeo, pulseMat);
      (pulseMesh as any).userData = { curve: tunnelCurve, speed: 0.008 + Math.random() * 0.006, progress: Math.random() };
      islandGroup.add(pulseMesh);
      tunnelPulses.push(pulseMesh);

      // Interactive Click Target for Burrow Chamber
      const burrowHitBox = new THREE.Mesh(
        new THREE.SphereGeometry(1.2, 8, 8),
        new THREE.MeshBasicMaterial({ visible: false })
      );
      burrowHitBox.position.set(cfg.x, cfg.y, cfg.z);
      (burrowHitBox as any).userData = { type: 'burrow', mascot, parentGroup: burrowGroup };
      interactives.push(burrowHitBox);

      scene.add(burrowGroup);
    });

    // 7. Interactive 3D Target Selection Ring
    const selRingGeo = new THREE.TorusGeometry(1.2, 0.06, 12, 32);
    const selRingMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0,
    });
    const selectionRing = new THREE.Mesh(selRingGeo, selRingMat);
    selectionRing.rotation.x = Math.PI / 2;
    selectionRing.position.set(0, 0.65, 0);
    scene.add(selectionRing);
    sceneStateRef.current.selectionRing = selectionRing;

    // 8. Floating Ambient Starlight Spores
    const particleCount = 45;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 12;
      positions[i * 3 + 1] = Math.random() * 8 - 4;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 12;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.08,
      transparent: true,
      opacity: 0.7,
    });
    const starlightParticles = new THREE.Points(particleGeo, particleMat);
    scene.add(starlightParticles);

    // Save references to animated props
    sceneStateRef.current.animatedProps = {
      musicRings: animatedMusicRings,
      tunnelPulses,
      crownShrines,
      beaconSparks: starlightParticles,
    };

    // 9. Interactive Touch / Drag Orbit Navigation
    const domElement = renderer.domElement;

    const handlePointerDown = (e: PointerEvent) => {
      sceneStateRef.current.dragStart = { x: e.clientX, y: e.clientY };
    };

    const handlePointerMove = (e: PointerEvent) => {
      const rect = domElement.getBoundingClientRect();
      sceneStateRef.current.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      sceneStateRef.current.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      if (!sceneStateRef.current.dragStart) return;
      const dx = (e.clientX - sceneStateRef.current.dragStart.x) * 0.007;
      const dy = (e.clientY - sceneStateRef.current.dragStart.y) * 0.005;

      sceneStateRef.current.orbitAngle.theta += dx;
      sceneStateRef.current.orbitAngle.phi = Math.max(
        0.1,
        Math.min(1.4, sceneStateRef.current.orbitAngle.phi + dy)
      );

      sceneStateRef.current.dragStart = { x: e.clientX, y: e.clientY };
    };

    const handlePointerUp = (e: PointerEvent) => {
      const wasDragging = sceneStateRef.current.dragStart !== null;
      sceneStateRef.current.dragStart = null;

      // Click detection if not actively dragging far
      const rect = domElement.getBoundingClientRect();
      const clickX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const clickY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      const raycaster = sceneStateRef.current.raycaster;
      raycaster.setFromCamera(new THREE.Vector2(clickX, clickY), camera);

      const intersects = raycaster.intersectObjects(interactives, false);
      if (intersects.length > 0) {
        const hit = intersects[0].object as any;
        const data = hit.userData;

        if (data.type === 'landmark') {
          const lm = data.landmark as Landmark;
          SoundEngine.playTileStep();

          // Move selection ring
          if (selectionRing) {
            selectionRing.position.set(hit.parent.position.x, 0.65, hit.parent.position.z);
            (selectionRing.material as THREE.MeshBasicMaterial).opacity = 0.9;
            (selectionRing.material as THREE.MeshBasicMaterial).color.set(0x00f0ff);
          }

          setSelectedEntity({
            type: 'landmark',
            id: lm.id,
            name: lm.name,
            level: lm.currentLevel,
            maxLevel: lm.maxLevel,
            cost: lm.costPerLevel[lm.currentLevel] || 0,
            description: lm.description,
            color: '#38bdf8',
            landmark: lm,
          });

        } else if (data.type === 'burrow') {
          const m = data.mascot as Mascot;
          SoundEngine.playMascotSqueak('squeak');

          // Move selection ring down to burrow
          if (selectionRing) {
            selectionRing.position.set(hit.position.x, hit.position.y - 0.1, hit.position.z);
            (selectionRing.material as THREE.MeshBasicMaterial).opacity = 0.9;
            (selectionRing.material as THREE.MeshBasicMaterial).color.set(new THREE.Color(m.furColor));
          }

          setSelectedEntity({
            type: 'burrow',
            id: m.id,
            name: `${m.name}'s Cozy Burrow`,
            level: m.level,
            maxLevel: MAX_MASCOT_LEVEL,
            description: m.originStory || m.personality,
            color: m.furColor,
            mascot: m,
          });
        }
      }
    };

    domElement.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);

    // 10. Main Animation Loop
    const animate = () => {
      sceneStateRef.current.animId = requestAnimationFrame(animate);
      const elapsed = sceneStateRef.current.clock.getElapsedTime();

      // Gentle auto-rotation if enabled & not being dragged
      if (isAutoRotate && !sceneStateRef.current.dragStart) {
        sceneStateRef.current.orbitAngle.theta += 0.0025;
      }

      // Smooth Camera Positioning from Spherical Orbit Coordinates
      const { theta, phi, radius } = sceneStateRef.current.orbitAngle;
      const targetX = radius * Math.sin(theta) * Math.cos(phi);
      const targetY = radius * Math.sin(phi);
      const targetZ = radius * Math.cos(theta) * Math.cos(phi);

      camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetX, 0.08);
      camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetY, 0.08);
      camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetZ, 0.08);

      const curLook = sceneStateRef.current.currentLookAt;
      const tgtLook = sceneStateRef.current.targetLookAt;
      curLook.lerp(tgtLook, 0.06);
      camera.lookAt(curLook);

      // Rotate Windmill Sails
      animatedWindmillSails.forEach((hub) => {
        hub.rotation.z += 0.02;
      });

      // Pulse Music Stage Rings
      animatedMusicRings.forEach((arch) => {
        arch.rotation.z = Math.sin(elapsed * 4) * 0.15;
      });

      // Move Tunnel Light Pulses
      tunnelPulses.forEach((pulse) => {
        const u = pulse.userData;
        u.progress += u.speed;
        if (u.progress > 1) u.progress = 0;
        const pt = u.curve.getPoint(u.progress);
        pulse.position.copy(pt);
      });

      // Rotate Max Level Celestial Crown Shrines
      crownShrines.forEach((cs) => {
        cs.rotation.y += 0.025;
        const gem = cs.children[1];
        if (gem) {
          gem.position.y = 0.55 + Math.sin(elapsed * 3) * 0.05;
        }
      });

      // Selection ring gentle breathing pulse
      if (selectionRing && (selectionRing.material as THREE.MeshBasicMaterial).opacity > 0) {
        selectionRing.rotation.z += 0.02;
      }

      // Starlight particles floating upwards
      const posAttr = starlightParticles.geometry.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < particleCount; i++) {
        let py = posAttr.getY(i) + 0.008;
        if (py > 4) py = -4;
        posAttr.setY(i, py);
      }
      posAttr.needsUpdate = true;

      renderer.render(scene, camera);
    };

    animate();

    // 11. Resize Observer
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

    // 12. Full Memory Cleanup on Unmount
    return () => {
      cancelAnimationFrame(sceneStateRef.current.animId);
      resizeObserver.disconnect();
      domElement.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);

      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh || obj instanceof THREE.Points) {
          if (obj.geometry) obj.geometry.dispose();
          if (Array.isArray(obj.material)) {
            obj.material.forEach((mat) => mat.dispose());
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
  }, [town.id, timeOfDay]);

  // Upgrade handler from 3D Inspector
  const handleUpgradeFromInspector = () => {
    if (!selectedEntity?.landmark || !onUpgradeLandmark) return;
    const lm = selectedEntity.landmark;
    const cost = lm.costPerLevel[lm.currentLevel] || 0;
    if (playerCoins < cost) {
      SoundEngine.playErrorBuzz();
      return;
    }

    onUpgradeLandmark(lm.id, cost);
    confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
    SoundEngine.playUpgradeFanfare();

    setSelectedEntity((prev) => {
      if (!prev) return null;
      const nextLvl = prev.level + 1;
      return {
        ...prev,
        level: nextLvl,
        cost: lm.costPerLevel[nextLvl] || 0,
      };
    });
  };

  return (
    <div className="relative w-full h-[430px] rounded-3xl overflow-hidden border-2 border-indigo-900/60 shadow-2xl bg-slate-950 flex flex-col select-none">
      {/* 3D WebGL Canvas */}
      <div
        ref={mountRef}
        className="w-full h-full cursor-grab active:cursor-grabbing touch-none"
        style={{ touchAction: 'none' }}
      />

      {/* Top Controls Overlay */}
      <div className="absolute top-2.5 inset-x-3 flex items-center justify-between pointer-events-none z-10">
        <div className="flex items-center gap-1.5 pointer-events-auto">
          <span className="text-[10px] font-black uppercase tracking-wider text-cyan-300 bg-cyan-950/90 px-2.5 py-1 rounded-full border border-cyan-400/50 shadow-md flex items-center gap-1.5">
            <span className="animate-pulse">🗺️</span>
            <span>3D Town & Burrows Map</span>
          </span>
        </div>

        {/* View Mode & Lighting Presets */}
        <div className="flex items-center gap-1 pointer-events-auto bg-slate-950/80 p-1 rounded-xl border border-slate-800 backdrop-blur-md">
          <button
            onClick={() => setViewPreset('cutaway')}
            className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase transition-all ${
              viewPreset === 'cutaway'
                ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Full Cutaway View: Surface Town + Underground Burrows"
          >
            Cutaway
          </button>
          <button
            onClick={() => setViewPreset('town')}
            className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase transition-all ${
              viewPreset === 'town'
                ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-slate-950 shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Surface Town Focus"
          >
            Town
          </button>
          <button
            onClick={() => setViewPreset('burrows')}
            className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase transition-all ${
              viewPreset === 'burrows'
                ? 'bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Underground Burrows Focus"
          >
            Burrows
          </button>

          {/* Time of Day Cycle */}
          <button
            onClick={() => {
              setTimeOfDay((prev) => (prev === 'night' ? 'day' : prev === 'day' ? 'twilight' : 'night'));
              SoundEngine.playTileStep();
            }}
            className="ml-1 p-1 rounded-lg bg-slate-900 border border-slate-700 hover:border-slate-500 text-xs"
            title={`Current lighting: ${timeOfDay}. Tap to cycle day/twilight/night`}
          >
            {timeOfDay === 'night' ? '🌙' : timeOfDay === 'twilight' ? '🌆' : '☀️'}
          </button>

          {/* Auto Rotate Toggle */}
          <button
            onClick={() => setIsAutoRotate((prev) => !prev)}
            className={`p-1 rounded-lg text-xs transition-all ${
              isAutoRotate ? 'text-cyan-300 bg-cyan-950/60' : 'text-slate-500 bg-slate-900'
            }`}
            title={isAutoRotate ? 'Pause 3D rotation' : 'Resume slow 3D orbit'}
          >
            🔄
          </button>
        </div>
      </div>

      {/* Orbit & Interaction Hint Overlay */}
      {!selectedEntity && (
        <div className="absolute bottom-2.5 left-3 pointer-events-none">
          <span className="text-[8px] font-bold text-slate-300 bg-slate-950/90 px-2.5 py-1 rounded-xl border border-slate-800 uppercase tracking-wider backdrop-blur-md">
            Tap any 3D building or burrow chamber to inspect 🔍
          </span>
        </div>
      )}

      {/* 3D Inspector Drawer for Clicked Landmark or Burrow */}
      {selectedEntity && (
        <div className="absolute bottom-2 inset-x-2 p-3 rounded-2xl bg-slate-950/95 border-2 border-indigo-500/50 shadow-2xl backdrop-blur-md z-20 flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className="w-7 h-7 rounded-xl flex items-center justify-center text-sm shadow-md"
                style={{ backgroundColor: `${selectedEntity.color}33`, borderColor: selectedEntity.color, borderWidth: 1 }}
              >
                {selectedEntity.type === 'landmark' ? '🏛️' : '🐾'}
              </span>
              <div>
                <h4 className="text-xs font-black text-white leading-tight">
                  {selectedEntity.name}
                </h4>
                <div className="flex items-center gap-1.5 text-[9px] text-slate-300">
                  <span className="font-bold text-amber-300">
                    Tier {selectedEntity.level}/{selectedEntity.maxLevel || 5}
                  </span>
                  {selectedEntity.level >= (selectedEntity.maxLevel || 5) && (
                    <span className="px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-950 font-black text-[8px]">
                      👑 MASTERWORK
                    </span>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={() => setSelectedEntity(null)}
              className="p-1.5 rounded-xl bg-slate-900 text-slate-400 hover:text-white border border-slate-800 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <p className="text-[10px] text-slate-300 leading-tight">
            {selectedEntity.description}
          </p>

          {/* Action Row */}
          <div className="flex items-center gap-2 mt-0.5">
            {selectedEntity.type === 'landmark' && selectedEntity.landmark && (
              <>
                {selectedEntity.level < selectedEntity.landmark.maxLevel ? (
                  <button
                    onClick={handleUpgradeFromInspector}
                    disabled={playerCoins < (selectedEntity.cost || 0)}
                    className={`flex-1 py-2 px-3 rounded-xl font-black text-[11px] uppercase tracking-wider flex items-center justify-between transition-all cursor-pointer ${
                      playerCoins >= (selectedEntity.cost || 0)
                        ? 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 shadow-md hover:brightness-110 active:scale-98'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <Hammer className="w-3.5 h-3.5" />
                      <span>Upgrade in 3D</span>
                    </div>
                    <div className="flex items-center gap-1 bg-black/20 px-2 py-0.5 rounded-lg text-[10px]">
                      <span>{(selectedEntity.cost || 0).toLocaleString()}</span>
                      <span>🪙</span>
                    </div>
                  </button>
                ) : (
                  <div className="flex-1 py-1.5 rounded-xl bg-amber-950/80 border border-amber-500/40 text-amber-300 text-center font-black text-[10px] flex items-center justify-center gap-1">
                    <span>👑 Max Landmark Rank Achieved!</span>
                  </div>
                )}
              </>
            )}

            {selectedEntity.type === 'burrow' && selectedEntity.mascot && (
              <button
                onClick={() => {
                  if (onSelectActiveMascot && selectedEntity.mascot) {
                    onSelectActiveMascot(selectedEntity.mascot.id);
                    SoundEngine.playCoinChime();
                  }
                }}
                className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-pink-500 via-fuchsia-500 to-purple-600 text-white font-black text-[11px] uppercase tracking-wider flex items-center justify-center gap-1.5 hover:brightness-110 active:scale-98 transition-all shadow-md cursor-pointer"
              >
                <span>Equip {selectedEntity.mascot.name} (Lv.{selectedEntity.mascot.level})</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
