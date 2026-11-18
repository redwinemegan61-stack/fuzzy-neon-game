import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js';
import { Mascot } from '../types';
import { MAX_MASCOT_LEVEL } from './mascotLeveling';

let rectAreaInited = false;

/**
 * Detect software WebGL (SwiftShader, llvmpipe, softpipe, Basic Render)
 * so we can adapt pixel ratio, shadow map size, and multi-pass bloom cleanly.
 */
export const detectSoftwareWebGL = (): boolean => {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) || '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return false;
  }
};

export interface GraphicsEngineInstance {
  renderer: THREE.WebGLRenderer;
  composer: EffectComposer | null;
  bloomPass: UnrealBloomPass | null;
  envTexture: THREE.Texture;
  isSoftwareGl: boolean;
  maxAnisotropy: number;
  renderFrame: (useBloom: boolean) => void;
  scheduleNextFrame: (tick: () => void) => number;
  resize: (width: number, height: number) => void;
  dispose: () => void;
}

/**
 * Initializes the studio PBR WebGLRenderer, PMREM RoomEnvironment IBL cubemap,
 * RectAreaLight uniforms, and UnrealBloom post-processing pipeline.
 */
export function createThreeGraphicsEngine(
  scene: THREE.Scene,
  camera: THREE.PerspectiveCamera,
  width: number,
  height: number,
  options?: {
    bloomStrength?: number;
    bloomRadius?: number;
    bloomThreshold?: number;
    exposure?: number;
  }
): GraphicsEngineInstance {
  const isSoftwareGl = detectSoftwareWebGL();

  if (!rectAreaInited) {
    RectAreaLightUniformsLib.init();
    rectAreaInited = true;
  }

  const renderer = new THREE.WebGLRenderer({
    antialias: !isSoftwareGl,
    powerPreference: 'high-performance',
    alpha: false,
  });

  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = options?.exposure ?? 1.12;
  renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(width, height);
  renderer.shadowMap.enabled = !isSoftwareGl;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const maxAnisotropy = Math.min(renderer.capabilities.getMaxAnisotropy() || 1, 8);

  // Studio IBL Environment Map for metallic, crystal, glass & velvet reflections
  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  pmremGenerator.compileEquirectangularShader();
  const envTexture = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = envTexture;
  pmremGenerator.dispose();

  // Post-Processing Composer (RenderPass -> UnrealBloomPass -> OutputPass)
  let composer: EffectComposer | null = null;
  let bloomPass: UnrealBloomPass | null = null;

  if (!isSoftwareGl) {
    composer = new EffectComposer(renderer);
    composer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    composer.setSize(width, height);

    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    bloomPass = new UnrealBloomPass(
      new THREE.Vector2(width, height),
      options?.bloomStrength ?? 0.15,
      options?.bloomRadius ?? 0.40,
      options?.bloomThreshold ?? 0.88
    );
    composer.addPass(bloomPass);

    const outputPass = new OutputPass();
    composer.addPass(outputPass);
  }

  let activeTimerId = 0;

  const afterDraw = (cb: () => void) => {
    const gl = renderer.getContext() as WebGL2RenderingContext;
    if (!gl || typeof gl.fenceSync !== 'function') {
      activeTimerId = window.setTimeout(cb, 80);
      return;
    }
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (state === gl.UNSIGNALED) {
        activeTimerId = window.setTimeout(poll, 5);
      } else {
        if (sync) gl.deleteSync(sync);
        activeTimerId = window.setTimeout(cb, 80);
      }
    };
    activeTimerId = window.setTimeout(poll, 5);
  };

  const renderFrame = (useBloom: boolean) => {
    if (!isSoftwareGl && composer && useBloom) {
      composer.render();
    } else {
      renderer.render(scene, camera);
    }
  };

  const scheduleNextFrame = (tick: () => void): number => {
    if (isSoftwareGl) {
      afterDraw(tick);
      return activeTimerId;
    }
    return requestAnimationFrame(tick);
  };

  const resize = (w: number, h: number) => {
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    if (composer) {
      composer.setSize(w, h);
    }
  };

  const dispose = () => {
    if (activeTimerId) clearTimeout(activeTimerId);
    envTexture.dispose();
    if (composer) {
      composer.dispose();
    }
    renderer.dispose();
  };

  return {
    renderer,
    composer,
    bloomPass,
    envTexture,
    isSoftwareGl,
    maxAnisotropy,
    renderFrame,
    scheduleNextFrame,
    resize,
    dispose,
  };
}

// ============================================================================
// PROCEDURAL PBR TEXTURES (100% Zero-404 Canvas Generators)
// ============================================================================

/**
 * Creates a soft radial ambient occlusion contact shadow texture
 */
export function createContactShadowMesh(radius = 0.8, opacity = 0.48): THREE.Mesh {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createRadialGradient(size / 2, size / 2, size * 0.06, size / 2, size / 2, size * 0.48);
  grad.addColorStop(0, `rgba(6, 8, 20, ${opacity})`);
  grad.addColorStop(0.55, `rgba(6, 8, 20, ${opacity * 0.45})`);
  grad.addColorStop(1, 'rgba(6, 8, 20, 0)');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;

  const geo = new THREE.PlaneGeometry(radius * 2, radius * 2);
  const mat = new THREE.MeshBasicMaterial({
    map: tex,
    transparent: true,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });

  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = 0.015;
  mesh.renderOrder = 1;
  return mesh;
}

/**
 * Creates a rich hardwood plank floor texture with wood grain & seams
 */
export function createHardwoodPlankTexture(anisotropy = 4): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#4a2c18';
  ctx.fillRect(0, 0, 512, 512);

  const plankRows = 8;
  const plankH = 512 / plankRows;
  const tones = ['#5a351d', '#4d2d18', '#633b20', '#52301a', '#6b4023'];

  for (let r = 0; r < plankRows; r++) {
    const y = r * plankH;
    const cols = 3;
    const offset = (r % 2) * 85;
    for (let c = -1; c <= cols; c++) {
      const x = c * (512 / cols) + offset;
      const w = 512 / cols;
      ctx.fillStyle = tones[(r * 3 + c + 10) % tones.length];
      ctx.fillRect(x, y, w, plankH);

      // Subtle wood grain lines
      ctx.strokeStyle = 'rgba(30, 14, 5, 0.22)';
      ctx.lineWidth = 1.2;
      for (let g = 0; g < 10; g++) {
        const gy = y + (g + 0.5) * (plankH / 10);
        ctx.beginPath();
        ctx.moveTo(x, gy);
        ctx.bezierCurveTo(
          x + w * 0.33,
          gy + Math.sin(r + g) * 3,
          x + w * 0.66,
          gy - Math.cos(r + g) * 3,
          x + w,
          gy
        );
        ctx.stroke();
      }

      // Plank border seam
      ctx.strokeStyle = '#241207';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(x, y, w, plankH);
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 2);
  tex.anisotropy = anisotropy;
  return tex;
}

/**
 * Creates a dressed castle/sanctuary stone masonry wall texture
 */
export function createStoneMasonryTexture(anisotropy = 4): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#181c30';
  ctx.fillRect(0, 0, 512, 512);

  const rows = 10;
  const rowH = 512 / rows;
  const stoneTones = ['#252b45', '#1f243b', '#2b3250', '#222740', '#2e3554'];

  for (let r = 0; r < rows; r++) {
    const y = r * rowH;
    const blocks = 6;
    const blockW = 512 / blocks;
    const shift = (r % 2) * (blockW * 0.5);

    for (let b = -1; b <= blocks; b++) {
      const x = b * blockW + shift;
      ctx.fillStyle = stoneTones[(r * 5 + b + 12) % stoneTones.length];
      ctx.beginPath();
      ctx.roundRect(x + 2, y + 2, blockW - 4, rowH - 4, 4);
      ctx.fill();

      // Subtle highlight bevel on top edge of stone
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.14)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x + 4, y + 3.5);
      ctx.lineTo(x + blockW - 4, y + 3.5);
      ctx.stroke();
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 1.5);
  tex.anisotropy = anisotropy;
  return tex;
}

/**
 * Creates an ornate woven mandala rug texture tinted to the mascot's signature colors
 */
export function createWovenTapestryRugTexture(
  primaryHex: string,
  accentHex = '#fef08a',
  anisotropy = 4
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  const cx = 256;
  const cy = 256;

  const grad = ctx.createRadialGradient(cx, cy, 20, cx, cy, 250);
  grad.addColorStop(0, primaryHex);
  grad.addColorStop(0.7, primaryHex);
  grad.addColorStop(1, '#1e1b4b');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);

  // Concentric ornamental rings
  const rings = [235, 218, 175, 130, 75, 35];
  rings.forEach((r, idx) => {
    ctx.strokeStyle = idx % 2 === 0 ? accentHex : 'rgba(255,255,255,0.65)';
    ctx.lineWidth = idx === 1 ? 8 : 3.5;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
  });

  // Geometric star petals
  ctx.strokeStyle = accentHex;
  ctx.lineWidth = 3;
  for (let i = 0; i < 16; i++) {
    const ang = (i * Math.PI * 2) / 16;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(ang) * 38, cy + Math.sin(ang) * 38);
    ctx.lineTo(cx + Math.cos(ang) * 212, cy + Math.sin(ang) * 212);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = anisotropy;
  return tex;
}

/**
 * Creates a radial cobblestone plaza texture
 */
export function createCobblestonePlazaTexture(anisotropy = 4): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  const cx = 256;
  const cy = 256;

  ctx.fillStyle = '#334155';
  ctx.fillRect(0, 0, 512, 512);

  const stoneColors = ['#64748b', '#475569', '#52627a', '#71839b', '#5b6b82'];

  for (let ring = 24; ring < 250; ring += 22) {
    const count = Math.max(8, Math.floor((2 * Math.PI * ring) / 24));
    for (let i = 0; i < count; i++) {
      const a0 = (i / count) * Math.PI * 2;
      const a1 = ((i + 0.88) / count) * Math.PI * 2;
      ctx.fillStyle = stoneColors[(ring + i) % stoneColors.length];
      ctx.beginPath();
      ctx.arc(cx, cy, ring + 16, a0, a1);
      ctx.arc(cx, cy, ring, a1, a0, true);
      ctx.closePath();
      ctx.fill();
    }
  }

  // Ornamental compass star at plaza center
  ctx.fillStyle = '#fbbf24';
  ctx.beginPath();
  ctx.arc(cx, cy, 20, 0, Math.PI * 2);
  ctx.fill();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = anisotropy;
  return tex;
}

/**
 * Creates a botanical meadow grass & clover texture
 */
export function createLushMeadowGrassTexture(
  timeOfDay: 'day' | 'twilight' | 'night',
  anisotropy = 4
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  const baseColor =
    timeOfDay === 'night' ? '#0c3420' : timeOfDay === 'twilight' ? '#14532d' : '#16a34a';
  const bladeLight =
    timeOfDay === 'night' ? '#134e32' : timeOfDay === 'twilight' ? '#166534' : '#22c55e';
  const bladeHighlight =
    timeOfDay === 'night' ? '#10b981' : timeOfDay === 'twilight' ? '#34d399' : '#4ade80';

  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, 512, 512);

  // Dappled organic grass patches
  for (let i = 0; i < 160; i++) {
    const x = ((i * 73) % 512);
    const y = ((i * 137) % 512);
    const r = 18 + (i % 28);
    const grad = ctx.createRadialGradient(x, y, 2, x, y, r);
    grad.addColorStop(0, i % 3 === 0 ? bladeHighlight : bladeLight);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Fine grass blades
  ctx.strokeStyle = bladeHighlight;
  ctx.lineWidth = 1.5;
  for (let b = 0; b < 450; b++) {
    const bx = (b * 97) % 512;
    const by = (b * 53) % 512;
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.lineTo(bx + ((b % 5) - 2) * 2, by - 7);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 3);
  tex.anisotropy = anisotropy;
  return tex;
}

/**
 * Creates a scalloped architectural roof tile texture
 */
export function createRoofShingleTexture(baseHex: string, anisotropy = 4): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = baseHex;
  ctx.fillRect(0, 0, 256, 256);

  ctx.strokeStyle = 'rgba(0,0,0,0.28)';
  ctx.lineWidth = 2;
  const rows = 8;
  const rowH = 256 / rows;
  for (let r = 0; r <= rows; r++) {
    const y = r * rowH;
    for (let c = -1; c < 8; c++) {
      const x = c * 36 + (r % 2) * 18;
      ctx.beginPath();
      ctx.arc(x + 18, y, 18, 0, Math.PI);
      ctx.stroke();
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 2);
  tex.anisotropy = anisotropy;
  return tex;
}

// ============================================================================
// HIGH-DETAIL COMPOSITE 3D MASCOT BUILDER (10+ Sculpted Parts + Velvet PBR)
// ============================================================================

export function createHighDetailMascot3D(
  mascot: Omit<Partial<Mascot>, 'earStyle'> & {
    furColor?: string;
    hairColors?: string[];
    earStyle?: string;
    level?: number;
  },
  options?: {
    scale?: number;
    includeShadow?: boolean;
    includeHitBox?: boolean;
  }
): {
  group: THREE.Group;
  tailGroup: THREE.Group;
  headGroup: THREE.Group;
  hitBox: THREE.Mesh | null;
} {
  const group = new THREE.Group();
  const scale = options?.scale ?? 1;
  group.scale.setScalar(scale);

  const primaryColor = new THREE.Color(mascot.furColor || mascot.hairColors?.[0] || '#f59e0b');
  const accentColor = new THREE.Color(mascot.hairColors?.[1] || mascot.hairColors?.[0] || '#fde047');
  const bellyColor = primaryColor.clone().lerp(new THREE.Color('#ffffff'), 0.68);
  const innerEarColor = new THREE.Color('#f472b6');

  // Plush Velvet PBR Material
  const furMat = new THREE.MeshPhysicalMaterial({
    color: primaryColor,
    roughness: 0.52,
    metalness: 0.04,
    sheen: 0.9,
    sheenRoughness: 0.45,
    sheenColor: accentColor,
    clearcoat: 0.12,
    clearcoatRoughness: 0.4,
  });

  const bellyMat = new THREE.MeshPhysicalMaterial({
    color: bellyColor,
    roughness: 0.58,
    metalness: 0.02,
    sheen: 0.7,
    sheenColor: new THREE.Color('#ffffff'),
  });

  if (options?.includeShadow !== false) {
    const shadow = createContactShadowMesh(0.55, 0.5);
    group.add(shadow);
  }

  // 1. Torso Body (Sculpted Pear/Bean Silhouette)
  const torso = new THREE.Mesh(new THREE.SphereGeometry(0.36, 28, 28), furMat);
  torso.scale.set(1.0, 1.08, 0.94);
  torso.position.y = 0.42;
  torso.castShadow = true;
  torso.receiveShadow = true;
  group.add(torso);

  // 2. Soft Cream Tummy Patch
  const tummy = new THREE.Mesh(new THREE.SphereGeometry(0.27, 24, 24), bellyMat);
  tummy.scale.set(0.88, 0.95, 0.55);
  tummy.position.set(0, 0.4, 0.22);
  group.add(tummy);

  // 3. Sculpted Head Group
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 0.84, 0.02);

  const headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.34, 28, 28), furMat);
  headMesh.scale.set(1.08, 0.96, 1.0);
  headMesh.castShadow = true;
  headGroup.add(headMesh);

  // Chubby Cheeks
  [-0.22, 0.22].forEach((cx) => {
    const cheek = new THREE.Mesh(new THREE.SphereGeometry(0.13, 16, 16), furMat);
    cheek.scale.set(1.1, 0.85, 0.9);
    cheek.position.set(cx, -0.06, 0.18);
    headGroup.add(cheek);

    // Rosy Blush
    const blush = new THREE.Mesh(
      new THREE.SphereGeometry(0.055, 12, 12),
      new THREE.MeshBasicMaterial({ color: 0xf43f5e, transparent: true, opacity: 0.65 })
    );
    blush.scale.set(1.3, 0.7, 0.4);
    blush.position.set(cx * 1.05, -0.04, 0.29);
    headGroup.add(blush);
  });

  // Cute Muzzle & Nose
  const muzzle = new THREE.Mesh(new THREE.SphereGeometry(0.11, 16, 16), bellyMat);
  muzzle.scale.set(1.25, 0.85, 0.8);
  muzzle.position.set(0, -0.05, 0.31);
  headGroup.add(muzzle);

  const nose = new THREE.Mesh(
    new THREE.SphereGeometry(0.042, 12, 12),
    new THREE.MeshPhysicalMaterial({ color: 0x1e1b4b, roughness: 0.15, clearcoat: 1.0 })
  );
  nose.scale.set(1.2, 0.85, 0.9);
  nose.position.set(0, -0.01, 0.39);
  headGroup.add(nose);

  // 4. Glossy Expressive Eyes with Dual Specular Catchlights
  const eyeMat = new THREE.MeshPhysicalMaterial({
    color: 0x090d16,
    roughness: 0.05,
    metalness: 0.1,
    clearcoat: 1.0,
    clearcoatRoughness: 0.05,
  });
  const catchlightMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

  [-0.14, 0.14].forEach((ex) => {
    const eyeGroup = new THREE.Group();
    eyeGroup.position.set(ex, 0.04, 0.3);

    const eyeBall = new THREE.Mesh(new THREE.SphereGeometry(0.068, 18, 18), eyeMat);
    eyeBall.scale.set(1, 1.12, 0.75);
    eyeGroup.add(eyeBall);

    const specBig = new THREE.Mesh(new THREE.SphereGeometry(0.022, 10, 10), catchlightMat);
    specBig.position.set(ex < 0 ? -0.018 : 0.018, 0.024, 0.048);
    eyeGroup.add(specBig);

    const specSmall = new THREE.Mesh(new THREE.SphereGeometry(0.011, 8, 8), catchlightMat);
    specSmall.position.set(ex < 0 ? 0.016 : -0.016, -0.02, 0.048);
    eyeGroup.add(specSmall);

    headGroup.add(eyeGroup);
  });

  // 5. Species-Specific Sculpted Ears (bunny, bear, cat, tuft)
  const earStyle = mascot.earStyle || 'bunny';
  const innerEarMat = new THREE.MeshStandardMaterial({ color: innerEarColor, roughness: 0.65 });

  [-1, 1].forEach((side) => {
    const earHolder = new THREE.Group();
    if (earStyle === 'bunny') {
      earHolder.position.set(side * 0.15, 0.28, -0.02);
      earHolder.rotation.z = -side * 0.18;
      const outer = new THREE.Mesh(new THREE.CapsuleGeometry(0.085, 0.28, 8, 16), furMat);
      outer.scale.set(1, 1, 0.55);
      outer.position.y = 0.16;
      outer.castShadow = true;
      earHolder.add(outer);

      const inner = new THREE.Mesh(new THREE.CapsuleGeometry(0.05, 0.22, 6, 12), innerEarMat);
      inner.scale.set(1, 1, 0.35);
      inner.position.set(0, 0.15, 0.035);
      earHolder.add(inner);
    } else if (earStyle === 'bear') {
      earHolder.position.set(side * 0.25, 0.24, -0.02);
      const outer = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 16), furMat);
      outer.scale.set(1, 1, 0.6);
      outer.castShadow = true;
      earHolder.add(outer);

      const inner = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 12), innerEarMat);
      inner.scale.set(1, 1, 0.4);
      inner.position.set(0, 0, 0.045);
      earHolder.add(inner);
    } else {
      // Cat / Fox / Tuft ears
      earHolder.position.set(side * 0.22, 0.24, -0.02);
      earHolder.rotation.z = -side * 0.32;
      const outer = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.28, 16), furMat);
      outer.position.y = 0.1;
      outer.castShadow = true;
      earHolder.add(outer);

      const inner = new THREE.Mesh(new THREE.ConeGeometry(0.075, 0.2, 12), innerEarMat);
      inner.position.set(0, 0.09, 0.035);
      earHolder.add(inner);
    }
    headGroup.add(earHolder);
  });

  // 6. Radiant Hair Crest / Tuft on Top of Head
  const hairMat = new THREE.MeshStandardMaterial({
    color: accentColor,
    roughness: 0.3,
    metalness: 0.2,
    emissive: accentColor,
    emissiveIntensity: 0.25,
  });
  for (let h = 0; h < 3; h++) {
    const lock = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.16, 10), hairMat);
    lock.position.set((h - 1) * 0.06, 0.34, 0.06);
    lock.rotation.z = (1 - h) * 0.28;
    lock.rotation.x = 0.2;
    headGroup.add(lock);
  }

  // Optional Golden Crown for Max-Level Companion
  if ((mascot.level || 1) >= MAX_MASCOT_LEVEL) {
    const crownGroup = new THREE.Group();
    crownGroup.position.set(0, 0.42, 0);
    const crownMat = new THREE.MeshPhysicalMaterial({
      color: 0xffd700,
      metalness: 0.95,
      roughness: 0.12,
      clearcoat: 1.0,
    });
    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.11, 0.09, 16), crownMat);
    crownGroup.add(band);
    headGroup.add(crownGroup);
  }

  group.add(headGroup);

  // 7. Articulated Arms / Paws
  [-1, 1].forEach((side) => {
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.075, 0.18, 8, 14), furMat);
    arm.position.set(side * 0.36, 0.45, 0.08);
    arm.rotation.z = side * 0.45;
    arm.rotation.x = -0.35;
    arm.castShadow = true;
    group.add(arm);
  });

  // 8. Grounded Feet Paws
  [-0.16, 0.16].forEach((fx) => {
    const foot = new THREE.Mesh(new THREE.SphereGeometry(0.11, 16, 16), furMat);
    foot.scale.set(1.0, 0.65, 1.35);
    foot.position.set(fx, 0.07, 0.12);
    foot.castShadow = true;
    group.add(foot);
  });

  // 9. Fluffy Wagging Tail Group
  const tailGroup = new THREE.Group();
  tailGroup.position.set(0, 0.3, -0.3);
  const tailBase = new THREE.Mesh(new THREE.CapsuleGeometry(0.08, 0.22, 8, 14), furMat);
  tailBase.rotation.x = -Math.PI / 3;
  tailBase.position.set(0, 0.08, -0.1);
  tailBase.castShadow = true;
  tailGroup.add(tailBase);

  const tailTip = new THREE.Mesh(new THREE.SphereGeometry(0.1, 14, 14), bellyMat);
  tailTip.position.set(0, 0.17, -0.22);
  tailGroup.add(tailTip);
  group.add(tailGroup);

  // 10. Optional Raycast HitBox
  let hitBox: THREE.Mesh | null = null;
  if (options?.includeHitBox) {
    hitBox = new THREE.Mesh(
      new THREE.BoxGeometry(1.25, 1.45, 1.25),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    hitBox.position.y = 0.65;
    (hitBox as any).userData = { type: 'mascot' };
    group.add(hitBox);
  }

  return { group, tailGroup, headGroup, hitBox };
}
