import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Heart,
  Repeat,
  ArrowUpCircle,
  Coins,
  Palette,
  ChevronRight,
  Sun,
  Moon,
  Info,
  Check,
  Coffee,
  BookOpen,
  Pickaxe,
  Home,
  Star,
  Zap,
  Sliders,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Mascot } from '../types';
import { SoundEngine } from '../utils/sound';
import {
  DEFAULT_DOLLHOUSE_FURNITURE,
  DollhouseFurnitureItem,
  DollhouseFurnitureStyle,
} from '../data/dollhouseDenData';

interface FuzzyDollhouseBurrowViewProps {
  mascots: Mascot[];
  activeMascot: Mascot;
  playerCoins: number;
  onUpgradeFurniture: (itemId: string, cost: number) => void;
  onSelectFurnitureStyle: (itemId: string, styleId: string) => void;
  onSelectActiveMascot: (mascotId: string) => void;
  onCollectDailyStash?: (amount: number) => void;
  customFurnitureState?: Record<string, { level: number; selectedStyleId: string }>;
}

export const FuzzyDollhouseBurrowView: React.FC<FuzzyDollhouseBurrowViewProps> = ({
  mascots,
  activeMascot,
  playerCoins,
  onUpgradeFurniture,
  onSelectFurnitureStyle,
  onSelectActiveMascot,
  onCollectDailyStash,
  customFurnitureState = {},
}) => {
  // Selected Item for Customizer & Swap Drawer
  const [selectedItemId, setSelectedItemId] = useState<string | null>('sofa');
  const [ambientLightingMode, setAmbientLightingMode] = useState<'day' | 'twilight' | 'night'>('twilight');

  // Mascot assignments in the 2 tiers
  // Top tier (Stump Cocoa Nest): default to Pip or activeMascot
  // Bottom tier (Mushroom Sofa): default to Kora or Boba
  const [upperMascotId, setUpperMascotId] = useState<string>('pip');
  const [lowerMascotId, setLowerMascotId] = useState<string>('kora');

  // Interactive feedback
  const [dialogueBubble, setDialogueBubble] = useState<{ speaker: string; text: string; role: 'upper' | 'lower' } | null>(null);
  const [heartsTrigger, setHeartsTrigger] = useState<number>(0);
  const [hasCollectedChestToday, setHasCollectedChestToday] = useState<boolean>(false);
  const [isExcavatedLowerCavern, setIsExcavatedLowerCavern] = useState<boolean>(false);

  // Toggle-able Ambient Neon FX layer & Sparkling Crystal Dust state
  const [isNeonFxActive, setIsNeonFxActive] = useState<boolean>(false);
  const [isFirefliesActive, setIsFirefliesActive] = useState<boolean>(false);
  const [tappedFireflyId, setTappedFireflyId] = useState<string | null>(null);
  const [sparkleIntensity, setSparkleIntensity] = useState<'radiant' | 'twinkle' | 'subtle'>('radiant');
  const [crystalSurgeTrigger, setCrystalSurgeTrigger] = useState<number>(0);
  const [surgeCoords, setSurgeCoords] = useState<{ x: number; y: number }>({ x: 400, y: 650 });

  // Retrieve current state of furniture items merged with custom state
  const getFurnitureItem = (id: string): DollhouseFurnitureItem => {
    const defaultItem = DEFAULT_DOLLHOUSE_FURNITURE[id] || DEFAULT_DOLLHOUSE_FURNITURE.sofa;
    const custom = customFurnitureState[id];
    if (!custom) return defaultItem;
    return {
      ...defaultItem,
      level: custom.level ?? defaultItem.level,
      selectedStyleId: custom.selectedStyleId ?? defaultItem.selectedStyleId,
    };
  };

  const selectedItem = selectedItemId ? getFurnitureItem(selectedItemId) : null;

  // Selected mascot references
  const upperMascot = mascots.find((m) => m.id === upperMascotId) || mascots[0];
  const lowerMascot = mascots.find((m) => m.id === lowerMascotId) || mascots[1] || mascots[0];

  // Calculate Cozy Score & Hourly Coins
  const allItemIds = Object.keys(DEFAULT_DOLLHOUSE_FURNITURE);
  const totalCozyScore = allItemIds.reduce((sum, id) => {
    const item = getFurnitureItem(id);
    const score = item.cozyAuraPerLevel[item.level - 1] || item.cozyAuraPerLevel[0];
    return sum + score;
  }, 0);

  const totalHourlyCoins = allItemIds.reduce((sum, id) => {
    const item = getFurnitureItem(id);
    const coins = item.coinPerHrPerLevel[item.level - 1] || item.coinPerHrPerLevel[0];
    return sum + coins;
  }, 0);

  // Upgrade selected item handler
  const handleUpgradeItem = (item: DollhouseFurnitureItem) => {
    if (item.level >= item.maxLevel) return;
    const cost = item.costPerLevel[item.level];
    if (playerCoins < cost) {
      SoundEngine.playTileStep();
      return;
    }

    onUpgradeFurniture(item.id, cost);
    SoundEngine.playCoo();
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 },
      colors: [item.styles[0]?.previewColor || '#f59e0b', '#38bdf8', '#ec4899', '#ffffff'],
    });
  };

  // Swap style handler
  const handleSelectStyle = (itemId: string, styleId: string) => {
    SoundEngine.playTileStep();
    onSelectFurnitureStyle(itemId, styleId);
  };

  // Click on Upper Mascot in Cocoa Nest
  const handleTapUpperMascot = () => {
    SoundEngine.playMascotSqueak('purr');
    setHeartsTrigger((prev) => prev + 1);
    const quotes = [
      `*purrrrrrr~* ✨ *happy squeak!* 🐾`,
      `*squeeeak!* 🍃 *snuggle-purr* 💕`,
      `*pip-pip!* ☕ *warm squeak* 🌸`,
      `*purrrr-chirp!* 💖 *cozy nuzzle* 💤`,
    ];
    setDialogueBubble({
      speaker: upperMascot.name,
      text: quotes[Math.floor(Math.random() * quotes.length)],
      role: 'upper',
    });
    setTimeout(() => setDialogueBubble(null), 4500);
  };

  // Click on Lower Mascot on Mushroom Sofa
  const handleTapLowerMascot = () => {
    SoundEngine.playMascotSqueak('squeak');
    setHeartsTrigger((prev) => prev + 1);
    const quotes = [
      `*coo-coo!* 🍄 *soft purr* 💖`,
      `*squeee-boing!* 🪸 *chirp!* ✨`,
      `*purrrrrr~* 💕 *gentle squeak* 🐾`,
      `*pip-pip-squeak!* 🌟 *happy chirp* 🌸`,
    ];
    setDialogueBubble({
      speaker: lowerMascot.name,
      text: quotes[Math.floor(Math.random() * quotes.length)],
      role: 'lower',
    });
    setTimeout(() => setDialogueBubble(null), 4500);
  };

  // Open Treasure Chest for daily bonus
  const handleTapChest = () => {
    if (hasCollectedChestToday) {
      SoundEngine.playTileStep();
      setDialogueBubble({
        speaker: 'Fluffy Sherpa Chest',
        text: 'The chest is resting! Return tomorrow for more cozy coin treasures! 🎁',
        role: 'lower',
      });
      setTimeout(() => setDialogueBubble(null), 3000);
      return;
    }

    setHasCollectedChestToday(true);
    SoundEngine.playExcavation();
    const reward = 3500;
    if (onCollectDailyStash) {
      onCollectDailyStash(reward);
    }
    confetti({
      particleCount: 70,
      spread: 80,
      origin: { y: 0.7 },
      colors: ['#fbbf24', '#f59e0b', '#ffffff', '#ec4899'],
    });
    setDialogueBubble({
      speaker: 'Fluffy Sherpa Chest',
      text: `✨ Opened cozy vault! +${reward.toLocaleString()} Cozy Stash Coins collected! 🪙`,
      role: 'lower',
    });
    setTimeout(() => setDialogueBubble(null), 4500);
  };

  // Swap which mascots sit where
  const handleSwapMascotPositions = () => {
    SoundEngine.playTileStep();
    const prevUpper = upperMascotId;
    setUpperMascotId(lowerMascotId);
    setLowerMascotId(prevUpper);
  };

  // Toggle ambient lighting
  const handleToggleLighting = () => {
    SoundEngine.playTileStep();
    setAmbientLightingMode((prev) => (prev === 'day' ? 'twilight' : prev === 'twilight' ? 'night' : 'day'));
  };

  // Real furniture objects
  const sofa = getFurnitureItem('sofa');
  const coffeeTable = getFurnitureItem('coffee_table');
  const rug = getFurnitureItem('rug');
  const shelving = getFurnitureItem('shelving');
  const chest = getFurnitureItem('chest');
  const bed = getFurnitureItem('bed');
  const lantern = getFurnitureItem('lantern');
  const windowItem = getFurnitureItem('window');
  const tapestry = getFurnitureItem('tapestry');
  const wallShelves = getFurnitureItem('wall_shelves');
  const floorPouf = getFurnitureItem('floor_pouf');
  const crystals = getFurnitureItem('crystals');

  // Dynamic Neon Theme Palette mapped to equipped crystal style
  const crystalStyleId = crystals.selectedStyleId || 'prismatic_quartz';
  const crystalTheme =
    crystalStyleId === 'emerald_spore'
      ? {
          primary: '#34d399',
          secondary: '#10b981',
          tertiary: '#a3e635',
          accent: '#67e8f9',
          starFill: '#a7f3d0',
          glowA: 'url(#emeraldCrystalGlow)',
          glowB: 'url(#cyanCrystalGlow)',
          bloomFilter: 'url(#neonSparkleBloom)',
          themeName: 'Emerald Cave Glow',
          badgeGradient: 'from-emerald-500 to-teal-400',
        }
      : crystalStyleId === 'amethyst_starlight'
      ? {
          primary: '#c084fc',
          secondary: '#f472b6',
          tertiary: '#fde047',
          accent: '#e879f9',
          starFill: '#fbcfe8',
          glowA: 'url(#purpleCrystalGlow)',
          glowB: 'url(#goldCrystalGlow)',
          bloomFilter: 'url(#neonSparkleBloom)',
          themeName: 'Amethyst Starlight Vein',
          badgeGradient: 'from-purple-500 to-pink-500',
        }
      : {
          primary: '#38bdf8',
          secondary: '#f472b6',
          tertiary: '#c084fc',
          accent: '#67e8f9',
          starFill: '#bae6fd',
          glowA: 'url(#cyanCrystalGlow)',
          glowB: 'url(#pinkCrystalGlow)',
          bloomFilter: 'url(#neonSparkleBloom)',
          themeName: 'Prismatic Neon Quartz',
          badgeGradient: 'from-cyan-500 to-fuchsia-500',
        };

  // Toggle Ambient Neon FX layer
  const handleToggleNeonFx = () => {
    const nextState = !isNeonFxActive;
    setIsNeonFxActive(nextState);
    if (nextState) {
      SoundEngine.playPowerup();
      confetti({
        particleCount: 40,
        spread: 70,
        origin: { y: 0.7 },
        colors: [crystalTheme.primary, crystalTheme.secondary, crystalTheme.tertiary, '#ffffff'],
      });
      setDialogueBubble({
        speaker: 'Den Crystals',
        text: `✨ Neon crystal dust activated! Shimmering ${crystalTheme.themeName} stardust fills the cavern! 💎`,
        role: 'lower',
      });
      setTimeout(() => setDialogueBubble(null), 3500);
    } else {
      SoundEngine.playTileStep();
      setDialogueBubble({
        speaker: 'Den Crystals',
        text: 'Ambient neon dust muted. Soft cavern lighting restored.',
        role: 'lower',
      });
      setTimeout(() => setDialogueBubble(null), 3000);
    }
  };

  // Click on any bioluminescent crystal cluster in the den
  const handleTapCrystals = (x: number = 400, y: number = 650) => {
    SoundEngine.playPowerup();
    setSurgeCoords({ x, y });
    setCrystalSurgeTrigger((prev) => prev + 1);
    setSelectedItemId('crystals');
    setHeartsTrigger((prev) => prev + 1);
    const quotes = [
      `*sparkle-squeak!* ✨💎 *pip-pip!* 🐾`,
      `*chirp-chirp!* 🌟 *purrrrr~* 💕`,
      `*purrs happily* 💎 *squeeeeak!* ✨`,
    ];
    setDialogueBubble({
      speaker: lowerMascot.name,
      text: quotes[Math.floor(Math.random() * quotes.length)],
      role: 'lower',
    });
    setTimeout(() => setDialogueBubble(null), 4200);
  };

  // Ambient Stardust Particles clustered strategically around bioluminescent crystals
  const AMBIENT_CRYSTAL_PARTICLES = [
    // Left wall upper rim crystals (around 80, 555)
    { id: 'lp1', cx: 72, cy: 535, size: 5, type: 'star', color: crystalTheme.primary, anim: 'neonDustFloatA', dur: 2.8, del: 0 },
    { id: 'lp2', cx: 94, cy: 545, size: 3.5, type: 'orb', color: crystalTheme.secondary, anim: 'neonDustFloatB', dur: 3.2, del: 0.6 },
    { id: 'lp3', cx: 64, cy: 565, size: 4, type: 'cross', color: '#ffffff', anim: 'neonDustTwinkle', dur: 2.1, del: 1.2 },
    { id: 'lp4', cx: 85, cy: 575, size: 6, type: 'star', color: crystalTheme.tertiary, anim: 'neonDustFloatC', dur: 3.5, del: 1.8 },
    { id: 'lp5', cx: 102, cy: 560, size: 3, type: 'orb', color: crystalTheme.accent, anim: 'neonDustFloatA', dur: 2.6, del: 2.2 },

    // Left wall middle rim crystals (around 55, 665)
    { id: 'lp6', cx: 48, cy: 645, size: 4.5, type: 'star', color: crystalTheme.secondary, anim: 'neonDustFloatB', dur: 3.0, del: 0.3 },
    { id: 'lp7', cx: 68, cy: 655, size: 3, type: 'orb', color: crystalTheme.primary, anim: 'neonDustFloatA', dur: 2.7, del: 0.9 },
    { id: 'lp8', cx: 38, cy: 670, size: 5, type: 'cross', color: '#ffffff', anim: 'neonDustTwinkle', dur: 2.4, del: 1.5 },
    { id: 'lp9', cx: 74, cy: 680, size: 4, type: 'star', color: crystalTheme.accent, anim: 'neonDustFloatC', dur: 3.6, del: 2.1 },
    { id: 'lp10', cx: 58, cy: 690, size: 3.5, type: 'orb', color: crystalTheme.tertiary, anim: 'neonDustFloatB', dur: 2.9, del: 2.7 },

    // Left wall lower rim crystals (around 68, 760)
    { id: 'lp11', cx: 52, cy: 745, size: 4, type: 'star', color: crystalTheme.primary, anim: 'neonDustFloatA', dur: 3.1, del: 0.4 },
    { id: 'lp12', cx: 76, cy: 755, size: 3.5, type: 'orb', color: crystalTheme.secondary, anim: 'neonDustFloatC', dur: 2.5, del: 1.1 },
    { id: 'lp13', cx: 62, cy: 775, size: 5, type: 'cross', color: '#ffffff', anim: 'neonDustTwinkle', dur: 2.2, del: 1.7 },
    { id: 'lp14', cx: 84, cy: 785, size: 3, type: 'orb', color: crystalTheme.accent, anim: 'neonDustFloatB', dur: 3.4, del: 2.3 },

    // Right wall upper rim crystals (around 745, 545)
    { id: 'rp1', cx: 752, cy: 530, size: 5, type: 'star', color: crystalTheme.primary, anim: 'neonDustFloatB', dur: 2.9, del: 0.2 },
    { id: 'rp2', cx: 730, cy: 540, size: 3.5, type: 'orb', color: crystalTheme.secondary, anim: 'neonDustFloatA', dur: 3.3, del: 0.8 },
    { id: 'rp3', cx: 760, cy: 555, size: 4, type: 'cross', color: '#ffffff', anim: 'neonDustTwinkle', dur: 2.3, del: 1.4 },
    { id: 'rp4', cx: 738, cy: 570, size: 5.5, type: 'star', color: crystalTheme.tertiary, anim: 'neonDustFloatC', dur: 3.7, del: 2.0 },
    { id: 'rp5', cx: 722, cy: 555, size: 3, type: 'orb', color: crystalTheme.accent, anim: 'neonDustFloatB', dur: 2.6, del: 2.5 },

    // Right wall middle rim crystals (around 750, 635)
    { id: 'rp6', cx: 758, cy: 620, size: 4.5, type: 'star', color: crystalTheme.secondary, anim: 'neonDustFloatC', dur: 3.2, del: 0.5 },
    { id: 'rp7', cx: 736, cy: 630, size: 3, type: 'orb', color: crystalTheme.primary, anim: 'neonDustFloatB', dur: 2.8, del: 1.0 },
    { id: 'rp8', cx: 765, cy: 648, size: 5, type: 'cross', color: '#ffffff', anim: 'neonDustTwinkle', dur: 2.5, del: 1.6 },
    { id: 'rp9', cx: 742, cy: 660, size: 4, type: 'star', color: crystalTheme.accent, anim: 'neonDustFloatA', dur: 3.4, del: 2.2 },
    { id: 'rp10', cx: 728, cy: 645, size: 3.5, type: 'orb', color: crystalTheme.tertiary, anim: 'neonDustFloatC', dur: 3.0, del: 2.8 },

    // Right wall lower rim crystals (around 725, 745)
    { id: 'rp11', cx: 735, cy: 730, size: 4, type: 'star', color: crystalTheme.primary, anim: 'neonDustFloatA', dur: 2.8, del: 0.3 },
    { id: 'rp12', cx: 712, cy: 740, size: 3.5, type: 'orb', color: crystalTheme.secondary, anim: 'neonDustFloatB', dur: 3.3, del: 1.2 },
    { id: 'rp13', cx: 742, cy: 755, size: 5, type: 'cross', color: '#ffffff', anim: 'neonDustTwinkle', dur: 2.0, del: 1.9 },

    // Ceiling hanging crystal stalactites (238, 520 / 328, 525 / 417, 520)
    { id: 'cp1', cx: 236, cy: 528, size: 5, type: 'star', color: crystalTheme.primary, anim: 'neonDustFloatC', dur: 3.0, del: 0.1 },
    { id: 'cp2', cx: 246, cy: 536, size: 3.5, type: 'orb', color: crystalTheme.accent, anim: 'neonDustFloatA', dur: 2.7, del: 1.0 },
    { id: 'cp3', cx: 326, cy: 532, size: 5.5, type: 'star', color: crystalTheme.tertiary, anim: 'neonDustFloatB', dur: 3.4, del: 0.5 },
    { id: 'cp4', cx: 338, cy: 540, size: 3, type: 'cross', color: '#ffffff', anim: 'neonDustTwinkle', dur: 2.2, del: 1.4 },
    { id: 'cp5', cx: 415, cy: 528, size: 5, type: 'star', color: crystalTheme.primary, anim: 'neonDustFloatA', dur: 2.9, del: 0.7 },
    { id: 'cp6', cx: 426, cy: 538, size: 3.5, type: 'orb', color: crystalTheme.secondary, anim: 'neonDustFloatC', dur: 3.1, del: 1.6 },

    // Mid stratum embedded crystals (182, 454 / 642, 454)
    { id: 'ep1', cx: 180, cy: 442, size: 4.5, type: 'star', color: crystalTheme.primary, anim: 'neonDustFloatB', dur: 3.2, del: 0.4 },
    { id: 'ep2', cx: 190, cy: 462, size: 3, type: 'orb', color: crystalTheme.secondary, anim: 'neonDustFloatA', dur: 2.5, del: 1.3 },
    { id: 'ep3', cx: 640, cy: 442, size: 4.5, type: 'star', color: crystalTheme.primary, anim: 'neonDustFloatC', dur: 3.3, del: 0.6 },
    { id: 'ep4', cx: 650, cy: 462, size: 3, type: 'orb', color: crystalTheme.secondary, anim: 'neonDustFloatB', dur: 2.6, del: 1.5 },

    // Stump roots crystals (225, 350 / 585, 355)
    { id: 'sp1', cx: 220, cy: 338, size: 4, type: 'star', color: crystalTheme.primary, anim: 'neonDustFloatA', dur: 2.8, del: 0.2 },
    { id: 'sp2', cx: 232, cy: 355, size: 3, type: 'orb', color: crystalTheme.secondary, anim: 'neonDustFloatC', dur: 3.0, del: 1.1 },
    { id: 'sp3', cx: 580, cy: 342, size: 4, type: 'star', color: crystalTheme.primary, anim: 'neonDustFloatB', dur: 2.9, del: 0.7 },
    { id: 'sp4', cx: 592, cy: 358, size: 3, type: 'orb', color: crystalTheme.tertiary, anim: 'neonDustFloatA', dur: 3.1, del: 1.7 },

    // Cavern central atmospheric stardust drift
    { id: 'dp1', cx: 210, cy: 620, size: 3, type: 'orb', color: crystalTheme.primary, anim: 'neonDustFloatA', dur: 4.2, del: 0.5 },
    { id: 'dp2', cx: 290, cy: 670, size: 4, type: 'star', color: crystalTheme.accent, anim: 'neonDustFloatC', dur: 4.0, del: 1.8 },
    { id: 'dp3', cx: 370, cy: 630, size: 3.5, type: 'cross', color: '#ffffff', anim: 'neonDustTwinkle', dur: 3.2, del: 1.2 },
    { id: 'dp4', cx: 450, cy: 660, size: 3, type: 'orb', color: crystalTheme.secondary, anim: 'neonDustFloatB', dur: 4.5, del: 2.0 },
    { id: 'dp5', cx: 500, cy: 720, size: 4, type: 'star', color: crystalTheme.tertiary, anim: 'neonDustFloatA', dur: 3.8, del: 0.9 },
  ];

  // Bioluminescent Cave Fireflies dataset drifting through the underground den background
  const CAVERN_FIREFLIES = [
    { id: 'ff1', name: 'Mossfire', x: 140, y: 585, size: 4.5, colorType: 'lime' as const, wanderAnim: 'fireflyWander1', wanderDur: 8.2, wanderDelay: 0.2, pulseDur: 2.4, pulseDelay: 0.1 },
    { id: 'ff2', name: 'Moonwhisper', x: 235, y: 545, size: 4.0, colorType: 'cyan' as const, wanderAnim: 'fireflyWander2', wanderDur: 9.5, wanderDelay: 1.1, pulseDur: 2.8, pulseDelay: 0.6 },
    { id: 'ff3', name: 'Glimmerwing', x: 255, y: 645, size: 4.2, colorType: 'amber' as const, wanderAnim: 'fireflyWander3', wanderDur: 7.8, wanderDelay: 0.7, pulseDur: 2.1, pulseDelay: 1.2 },
    { id: 'ff4', name: 'Sporelight', x: 345, y: 575, size: 4.8, colorType: 'lime' as const, wanderAnim: 'fireflyWander4', wanderDur: 9.2, wanderDelay: 1.5, pulseDur: 3.0, pulseDelay: 0.4 },
    { id: 'ff5', name: 'Petaldrift', x: 430, y: 675, size: 4.2, colorType: 'rose' as const, wanderAnim: 'fireflyWander1', wanderDur: 8.8, wanderDelay: 2.2, pulseDur: 2.6, pulseDelay: 1.8 },
    { id: 'ff6', name: 'Frostspark', x: 310, y: 520, size: 3.8, colorType: 'cyan' as const, wanderAnim: 'fireflyWander2', wanderDur: 8.4, wanderDelay: 0.4, pulseDur: 2.2, pulseDelay: 0.9 },
    { id: 'ff7', name: 'Starlight', x: 640, y: 615, size: 4.5, colorType: 'amber' as const, wanderAnim: 'fireflyWander3', wanderDur: 8.0, wanderDelay: 1.8, pulseDur: 2.5, pulseDelay: 0.3 },
    { id: 'ff8', name: 'Fernwisp', x: 580, y: 685, size: 4.0, colorType: 'lime' as const, wanderAnim: 'fireflyWander4', wanderDur: 8.6, wanderDelay: 2.5, pulseDur: 2.9, pulseDelay: 1.5 },
    { id: 'ff9', name: 'Breezedot', x: 665, y: 740, size: 4.2, colorType: 'cyan' as const, wanderAnim: 'fireflyWander1', wanderDur: 7.6, wanderDelay: 0.8, pulseDur: 2.3, pulseDelay: 0.7 },
    { id: 'ff10', name: 'Blushspark', x: 360, y: 765, size: 4.6, colorType: 'rose' as const, wanderAnim: 'fireflyWander2', wanderDur: 9.0, wanderDelay: 1.4, pulseDur: 2.7, pulseDelay: 1.1 },
    { id: 'ff11', name: 'Sunmote', x: 710, y: 670, size: 4.0, colorType: 'amber' as const, wanderAnim: 'fireflyWander3', wanderDur: 8.1, wanderDelay: 0.5, pulseDur: 2.4, pulseDelay: 1.9 },
    { id: 'ff12', name: 'Twigdancer', x: 165, y: 525, size: 4.4, colorType: 'lime' as const, wanderAnim: 'fireflyWander4', wanderDur: 9.4, wanderDelay: 2.0, pulseDur: 2.6, pulseDelay: 0.8 },
  ];

  // Delicate glowing dust motes floating on subterranean cavern air currents
  const CAVERN_DUST_MOTES = [
    { id: 'dm1', x: 120, y: 560, r: 1.6, color: '#fef08a', anim: 'dustMoteFloatSlow', dur: 7.5, del: 0.2 },
    { id: 'dm2', x: 190, y: 630, r: 2.1, color: '#a3e635', anim: 'dustMoteFloatSway', dur: 8.4, del: 1.2 },
    { id: 'dm3', x: 260, y: 580, r: 1.4, color: '#67e8f9', anim: 'dustMoteFloatSlow', dur: 9.0, del: 0.6 },
    { id: 'dm4', x: 280, y: 710, r: 2.4, color: '#fbcfe8', anim: 'dustMoteFloatSway', dur: 8.0, del: 2.0 },
    { id: 'dm5', x: 350, y: 640, r: 1.8, color: '#fef08a', anim: 'dustMoteFloatSlow', dur: 7.2, del: 1.5 },
    { id: 'dm6', x: 390, y: 550, r: 1.3, color: '#67e8f9', anim: 'dustMoteFloatSway', dur: 8.8, del: 0.3 },
    { id: 'dm7', x: 420, y: 730, r: 2.2, color: '#a3e635', anim: 'dustMoteFloatSlow', dur: 9.6, del: 2.4 },
    { id: 'dm8', x: 470, y: 600, r: 1.5, color: '#fef08a', anim: 'dustMoteFloatSway', dur: 7.8, del: 1.1 },
    { id: 'dm9', x: 510, y: 680, r: 2.0, color: '#67e8f9', anim: 'dustMoteFloatSlow', dur: 8.5, del: 1.9 },
    { id: 'dm10', x: 560, y: 570, r: 1.4, color: '#fbcfe8', anim: 'dustMoteFloatSway', dur: 9.2, del: 0.8 },
    { id: 'dm11', x: 610, y: 720, r: 2.3, color: '#a3e635', anim: 'dustMoteFloatSlow', dur: 8.1, del: 2.2 },
    { id: 'dm12', x: 650, y: 630, r: 1.7, color: '#fef08a', anim: 'dustMoteFloatSway', dur: 7.9, del: 0.5 },
    { id: 'dm13', x: 690, y: 580, r: 1.5, color: '#67e8f9', anim: 'dustMoteFloatSlow', dur: 8.7, del: 1.7 },
    { id: 'dm14', x: 150, y: 740, r: 2.0, color: '#fef08a', anim: 'dustMoteFloatSway', dur: 9.4, del: 2.6 },
    { id: 'dm15', x: 220, y: 780, r: 1.6, color: '#a3e635', anim: 'dustMoteFloatSlow', dur: 8.3, del: 1.4 },
    { id: 'dm16', x: 320, y: 790, r: 1.8, color: '#67e8f9', anim: 'dustMoteFloatSway', dur: 7.7, del: 0.9 },
    { id: 'dm17', x: 480, y: 770, r: 2.1, color: '#fbcfe8', anim: 'dustMoteFloatSlow', dur: 8.9, del: 2.1 },
    { id: 'dm18', x: 580, y: 760, r: 1.5, color: '#fef08a', anim: 'dustMoteFloatSway', dur: 9.1, del: 1.6 },
    { id: 'dm19', x: 640, y: 780, r: 1.9, color: '#a3e635', anim: 'dustMoteFloatSlow', dur: 8.0, del: 0.4 },
    { id: 'dm20', x: 720, y: 730, r: 1.6, color: '#67e8f9', anim: 'dustMoteFloatSway', dur: 8.6, del: 2.5 },
  ];

  // Tap a firefly in the cavern
  const handleTapFirefly = (ff: (typeof CAVERN_FIREFLIES)[number]) => {
    SoundEngine.playTileStep();
    setTappedFireflyId(ff.id);
    setTimeout(() => setTappedFireflyId(null), 1500);
    const fireflyQuotes = [
      `*flutter-glow!* ${ff.name} the cave firefly blinked happily at you! ✨`,
      `*buzz-chime!* ${ff.name} swirls in a warm bioluminescent loop! 🌟`,
      `*sparkle!* A tiny firefly dances to keep the burrow cozy and bright! 💛`,
    ];
    setDialogueBubble({
      speaker: ff.name,
      text: fireflyQuotes[Math.floor(Math.random() * fireflyQuotes.length)],
      role: 'lower',
    });
    setTimeout(() => setDialogueBubble(null), 3500);
  };

  return (
    <div className="w-full flex flex-col items-center gap-4 py-1 select-none">
      {/* ========================================================================= */}
      {/* 1. TITLE BANNER: "YOUR FUZZY BURROW" (From User Illustration)             */}
      {/* ========================================================================= */}
      <div className="w-full max-w-4xl flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-2 rounded-3xl bg-slate-950/85 border border-amber-900/40 shadow-2xl backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="relative">
            <h1
              className="text-2xl sm:text-3xl font-black tracking-wider text-[#fff7ed] drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)]"
              style={{
                fontFamily: 'system-ui, -apple-system, sans-serif',
                WebkitTextStroke: '1.5px #78350f',
              }}
            >
              YOUR FUZZY BURROW
            </h1>
            <span className="absolute -top-1 -right-3 text-amber-300 text-xs animate-bounce">✨</span>
          </div>

          <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-black uppercase tracking-wider">
            Dollhouse Sanctuary
          </span>
        </div>

        {/* Cozy Stats Summary & Quick Lighting Toggle */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-2xl bg-amber-950/50 border border-amber-500/30 text-xs font-bold text-amber-200">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Cozy Aura: <strong>{totalCozyScore}</strong></span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-2xl bg-cyan-950/50 border border-cyan-500/30 text-xs font-bold text-cyan-200">
            <Coins className="w-3.5 h-3.5 text-amber-400" />
            <span>+{totalHourlyCoins}/hr</span>
          </div>

          <button
            onClick={handleToggleLighting}
            className="px-2.5 py-1 rounded-2xl bg-slate-900 border border-slate-700 hover:border-amber-400 text-[11px] font-bold text-slate-300 flex items-center gap-1 transition-all cursor-pointer"
            title="Toggle Day / Twilight / Night lighting"
          >
            {ambientLightingMode === 'day' ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span className="capitalize">Day</span>
              </>
            ) : ambientLightingMode === 'twilight' ? (
              <>
                <Sparkles className="w-3.5 h-3.5 text-fuchsia-400" />
                <span className="capitalize">Twilight</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-cyan-400" />
                <span className="capitalize">Night</span>
              </>
            )}
          </button>

        </div>
      </div>

      {/* Mascot Switcher & Companion Swapper Bar */}
      <div className="w-full max-w-4xl flex items-center justify-between gap-2 px-3 py-1.5 rounded-2xl bg-slate-900/60 border border-slate-800 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-black uppercase text-slate-400">Nook Companions:</span>
          <div className="flex items-center gap-1.5">
            <span className="px-2 py-0.5 rounded-xl bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30 flex items-center gap-1">
              <Coffee className="w-3 h-3 text-amber-400" />
              {upperMascot.name} (Stump Cocoa)
            </span>
            <span className="text-slate-500 text-xs">↔</span>
            <span className="px-2 py-0.5 rounded-xl bg-cyan-500/20 text-cyan-300 text-xs font-bold border border-cyan-500/30 flex items-center gap-1">
              <BookOpen className="w-3 h-3 text-cyan-400" />
              {lowerMascot.name} (Mushroom Sofa)
            </span>
          </div>
        </div>

        <button
          onClick={handleSwapMascotPositions}
          className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 border border-slate-700 transition-transform active:scale-95 cursor-pointer"
        >
          <Repeat className="w-3 h-3 text-amber-400" />
          <span>Swap Nook Seats</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 2. THE DOLLHOUSE 2-LEVEL HAVEN SCENE (Exact Match to Illustration)         */}
      {/* ========================================================================= */}
      <div className="relative w-full max-w-4xl rounded-3xl overflow-hidden border-2 border-amber-950/60 shadow-[0_12px_40px_rgba(0,0,0,0.8)] bg-gradient-to-b from-[#172554]/40 via-[#271b38] to-[#120a1d]">
        {/* Floating Heart Reaction Particle */}
        <AnimatePresence>
          {heartsTrigger > 0 && (
            <motion.div
              key={heartsTrigger}
              initial={{ opacity: 1, y: 0, scale: 0.8 }}
              animate={{ opacity: 0, y: -50, scale: 1.5 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2 }}
              className="absolute top-1/3 left-1/2 -translate-x-1/2 pointer-events-none flex gap-2 text-pink-400 z-50"
            >
              <Heart className="w-6 h-6 fill-pink-500" />
              <Heart className="w-5 h-5 fill-rose-400" />
              <Sparkles className="w-5 h-5 text-amber-300" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dialogue Bubble */}
        <AnimatePresence>
          {dialogueBubble && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.9 }}
              className={`absolute z-50 px-4 py-2 rounded-2xl bg-slate-950/95 border-2 text-xs font-bold text-white shadow-2xl max-w-xs text-center pointer-events-none ${
                dialogueBubble.role === 'upper'
                  ? 'top-8 left-1/2 -translate-x-1/2 border-amber-400'
                  : 'bottom-20 left-12 border-cyan-400'
              }`}
            >
              <span className="block text-[10px] text-amber-300 font-black uppercase tracking-wider mb-0.5">
                {dialogueBubble.speaker}
              </span>
              {dialogueBubble.text}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Ambient Sky / Forest Canopy Backdrop behind Stump */}
        <div className="absolute top-0 inset-x-0 h-48 pointer-events-none overflow-hidden opacity-60">
          <div
            className={`w-full h-full transition-colors duration-700 ${
              ambientLightingMode === 'day'
                ? 'bg-gradient-to-b from-sky-400/40 via-emerald-900/30 to-transparent'
                : ambientLightingMode === 'twilight'
                ? 'bg-gradient-to-b from-indigo-950 via-purple-950/40 to-transparent'
                : 'bg-gradient-to-b from-[#020617] via-[#0f172a] to-transparent'
            }`}
          />
        </div>

        {/* ========================================================================= */}
        {/* DOLLHOUSE INTERACTIVE SVG FRAMEWORK                                       */}
        {/* ========================================================================= */}
        <div className="relative w-full aspect-[4/5] sm:aspect-[4/4.6] max-h-[760px]">
          <svg viewBox="0 0 800 950" className="w-full h-full object-contain overflow-visible select-none">
            <defs>
              {/* Stump Wood Gradients */}
              <linearGradient id="stumpBarkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#78350f" />
                <stop offset="35%" stopColor="#92400e" />
                <stop offset="70%" stopColor="#78350f" />
                <stop offset="100%" stopColor="#451a03" />
              </linearGradient>
              <radialGradient id="stumpTopRings" cx="50%" cy="40%" r="55%">
                <stop offset="0%" stopColor="#d97706" />
                <stop offset="40%" stopColor="#b45309" />
                <stop offset="75%" stopColor="#78350f" />
                <stop offset="100%" stopColor="#451a03" />
              </radialGradient>
              <linearGradient id="mossGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#84cc16" />
                <stop offset="50%" stopColor="#65a30d" />
                <stop offset="100%" stopColor="#3f6212" />
              </linearGradient>

              {/* Earth Strata Gradient */}
              <linearGradient id="earthSoilGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#573016" />
                <stop offset="25%" stopColor="#451a03" />
                <stop offset="60%" stopColor="#2c1404" />
                <stop offset="100%" stopColor="#1a0c02" />
              </linearGradient>

              {/* Floor Woodboards Gradient */}
              <linearGradient id="floorPlankGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#78350f" />
                <stop offset="30%" stopColor="#92400e" />
                <stop offset="70%" stopColor="#78350f" />
                <stop offset="100%" stopColor="#573016" />
              </linearGradient>

              {/* Crystal Glow Radiance Gradients */}
              <radialGradient id="cyanCrystalGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.85" />
                <stop offset="60%" stopColor="#0284c7" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#0284c7" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="pinkCrystalGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#f472b6" stopOpacity="0.85" />
                <stop offset="60%" stopColor="#db2777" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#db2777" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="purpleCrystalGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#c084fc" stopOpacity="0.85" />
                <stop offset="60%" stopColor="#7e22ce" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#7e22ce" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="emeraldCrystalGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#34d399" stopOpacity="0.85" />
                <stop offset="60%" stopColor="#059669" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#059669" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="goldCrystalGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#fde047" stopOpacity="0.9" />
                <stop offset="60%" stopColor="#d97706" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#d97706" stopOpacity="0" />
              </radialGradient>

              {/* Bioluminescent Cave Firefly Halo Gradients */}
              <radialGradient id="fireflyLimeHalo" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#d9f99d" stopOpacity="0.95" />
                <stop offset="35%" stopColor="#bef264" stopOpacity="0.65" />
                <stop offset="70%" stopColor="#65a30d" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#4d7c0f" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="fireflyCyanHalo" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#cffafe" stopOpacity="0.95" />
                <stop offset="35%" stopColor="#38bdf8" stopOpacity="0.65" />
                <stop offset="70%" stopColor="#0284c7" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#0369a1" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="fireflyAmberHalo" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#fef9c3" stopOpacity="0.95" />
                <stop offset="35%" stopColor="#fde047" stopOpacity="0.7" />
                <stop offset="70%" stopColor="#d97706" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#b45309" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="fireflyRoseHalo" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#fce7f3" stopOpacity="0.95" />
                <stop offset="35%" stopColor="#f472b6" stopOpacity="0.65" />
                <stop offset="70%" stopColor="#db2777" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#9d174d" stopOpacity="0" />
              </radialGradient>

              {/* Enhanced Neon Bloom Filter for Sparkling Crystals & Dust */}
              <filter id="neonSparkleBloom" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="blur1" />
                <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur2" />
                <feMerge>
                  <feMergeNode in="blur2" />
                  <feMergeNode in="blur1" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>

              {/* Keyframe Animations for Ethereal Sparkling Dust and Neon Crystals */}
              <style>
                {`
                  @keyframes neonDustFloatA {
                    0% { transform: translate(0px, 0px) scale(0.65); opacity: 0.2; }
                    50% { transform: translate(-8px, -18px) scale(1.15); opacity: 0.95; }
                    100% { transform: translate(6px, -36px) scale(0.4); opacity: 0.05; }
                  }
                  @keyframes neonDustFloatB {
                    0% { transform: translate(0px, 0px) scale(0.6); opacity: 0.3; }
                    50% { transform: translate(10px, -20px) scale(1.25); opacity: 1; }
                    100% { transform: translate(-8px, -40px) scale(0.35); opacity: 0.08; }
                  }
                  @keyframes neonDustFloatC {
                    0% { transform: translate(0px, 0px) scale(0.7) rotate(0deg); opacity: 0.35; }
                    50% { transform: translate(-6px, -14px) scale(1.2) rotate(45deg); opacity: 0.95; }
                    100% { transform: translate(8px, -30px) scale(0.5) rotate(90deg); opacity: 0.1; }
                  }
                  @keyframes neonDustTwinkle {
                    0%, 100% { transform: scale(0.4) rotate(0deg); opacity: 0.2; }
                    50% { transform: scale(1.3) rotate(45deg); opacity: 1; filter: drop-shadow(0 0 5px #fff); }
                  }
                  @keyframes neonPulseGlow {
                    0%, 100% { opacity: 0.45; transform: scale(1); }
                    50% { opacity: 0.95; transform: scale(1.28); }
                  }
                  @keyframes neonSurgeWave {
                    0% { r: 10px; opacity: 0.9; stroke-width: 5px; }
                    100% { r: 120px; opacity: 0; stroke-width: 1px; }
                  }
                  .neon-star-particle {
                    transform-origin: center;
                    transform-box: fill-box;
                  }

                  /* Subterranean Firefly & Glowing Dust Mote Keyframes */
                  @keyframes fireflyWander1 {
                    0% { transform: translate(0px, 0px); }
                    25% { transform: translate(22px, -18px); }
                    50% { transform: translate(10px, -34px); }
                    75% { transform: translate(-16px, -14px); }
                    100% { transform: translate(0px, 0px); }
                  }
                  @keyframes fireflyWander2 {
                    0% { transform: translate(0px, 0px); }
                    25% { transform: translate(-20px, -22px); }
                    50% { transform: translate(-32px, -8px); }
                    75% { transform: translate(-12px, 14px); }
                    100% { transform: translate(0px, 0px); }
                  }
                  @keyframes fireflyWander3 {
                    0% { transform: translate(0px, 0px); }
                    30% { transform: translate(26px, 16px); }
                    60% { transform: translate(14px, -24px); }
                    85% { transform: translate(-18px, -12px); }
                    100% { transform: translate(0px, 0px); }
                  }
                  @keyframes fireflyWander4 {
                    0% { transform: translate(0px, 0px); }
                    33% { transform: translate(-16px, 22px); }
                    66% { transform: translate(20px, 28px); }
                    100% { transform: translate(0px, 0px); }
                  }
                  @keyframes fireflyGlowPulse {
                    0%, 100% { opacity: 0.28; transform: scale(0.85); }
                    45% { opacity: 1; transform: scale(1.35); }
                    65% { opacity: 0.85; transform: scale(1.15); }
                  }
                  @keyframes fireflyWingFlutter {
                    0%, 100% { transform: scaleY(1) rotate(0deg); }
                    50% { transform: scaleY(0.25) rotate(20deg); }
                  }
                  @keyframes dustMoteFloatSlow {
                    0% { transform: translate(0px, 0px); opacity: 0.1; }
                    35% { transform: translate(16px, -24px); opacity: 0.85; }
                    70% { transform: translate(30px, -48px); opacity: 0.6; }
                    100% { transform: translate(42px, -74px); opacity: 0; }
                  }
                  @keyframes dustMoteFloatSway {
                    0% { transform: translate(0px, 0px); opacity: 0.1; }
                    25% { transform: translate(-14px, -18px); opacity: 0.75; }
                    50% { transform: translate(8px, -38px); opacity: 0.95; }
                    75% { transform: translate(-10px, -56px); opacity: 0.5; }
                    100% { transform: translate(0px, -78px); opacity: 0; }
                  }
                `}
              </style>

              {/* Lantern Warmth Radial */}
              <radialGradient id="lanternRadial" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#fef08a" stopOpacity="0.85" />
                <stop offset="50%" stopColor="#f59e0b" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#b45309" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* ------------------------------------------------------------- */}
            {/* LEVEL 1: THE UPPER SNUGGLE NOOK (MOSSY TREE STUMP)             */}
            {/* ------------------------------------------------------------- */}

            {/* Tree Stump Outer Silhouette */}
            <g id="upper-tree-stump">
              {/* Deep Roots Spreading into Earth */}
              <path
                d="M 180 340 C 160 380, 120 420, 80 430 Q 120 440 180 400 Z"
                fill="url(#stumpBarkGrad)"
                stroke="#291102"
                strokeWidth="2"
              />
              <path
                d="M 620 340 C 640 380, 680 420, 720 430 Q 680 440 620 400 Z"
                fill="url(#stumpBarkGrad)"
                stroke="#291102"
                strokeWidth="2"
              />

              {/* Main Stump Body */}
              <path
                d="M 230 180 C 220 80, 580 80, 570 180 C 610 240, 630 330, 610 380 C 500 395, 300 395, 190 380 C 170 330, 190 240, 230 180 Z"
                fill="url(#stumpBarkGrad)"
                stroke="#291102"
                strokeWidth="3"
              />

              {/* Top Cut Tree Ring Cross-Section */}
              <ellipse cx="400" cy="115" rx="175" ry="38" fill="url(#stumpTopRings)" stroke="#451a03" strokeWidth="2.5" />
              <ellipse cx="400" cy="115" rx="145" ry="30" fill="none" stroke="#78350f" strokeWidth="1.8" opacity="0.6" />
              <ellipse cx="400" cy="115" rx="110" ry="22" fill="none" stroke="#78350f" strokeWidth="1.8" opacity="0.6" />
              <ellipse cx="400" cy="115" rx="70" ry="14" fill="none" stroke="#78350f" strokeWidth="1.8" opacity="0.6" />

              {/* Moss Clusters on Top of Stump */}
              <path
                d="M 240 115 Q 260 90 290 100 Q 320 85 350 95 Q 380 90 410 98 Q 440 85 470 100 Q 510 90 540 115 C 500 130, 280 130, 240 115 Z"
                fill="url(#mossGrad)"
                stroke="#365314"
                strokeWidth="1.5"
              />

              {/* Hollow Interior Archway of the Snuggle Nook */}
              <path
                d="M 270 350 C 260 210, 310 150, 400 150 C 490 150, 540 210, 530 350 C 470 365, 330 365, 270 350 Z"
                fill="#27150a"
                stroke="#451a03"
                strokeWidth="3"
              />

              {/* Warm Backwall Lighting Sheen */}
              <ellipse cx="400" cy="240" rx="100" ry="80" fill="url(#lanternRadial)" />

              {/* Wall Hanging Star Photo Frame on Stump Wall (Left) */}
              <g
                id="stump-star-frame"
                className="cursor-pointer transition-transform hover:scale-110"
                onClick={() => setSelectedItemId('bed')}
              >
                <rect x="300" y="220" width="38" height="42" rx="4" fill="#3b2210" stroke="#78350f" strokeWidth="1.5" />
                <rect x="305" y="225" width="28" height="32" rx="2" fill="#1e1b4b" />
                <polygon points="319,233 322,239 328,240 324,244 325,250 319,247 314,250 315,244 311,240 317,239" fill="#fbbf24" />
                <circle cx="313" cy="235" r="1.5" fill="#ffffff" />
                <circle cx="327" cy="248" r="1.2" fill="#ffffff" />
              </g>

              {/* Mini Wall Bookshelf on Stump Wall (Right) */}
              <g
                id="stump-wall-bookshelf"
                className="cursor-pointer transition-transform hover:scale-110"
                onClick={() => setSelectedItemId('wall_shelves')}
              >
                <rect x="460" y="250" width="46" height="6" rx="2" fill="#78350f" stroke="#451a03" strokeWidth="1" />
                {/* Colorful Books */}
                <rect x="466" y="234" width="8" height="16" rx="1.5" fill="#ef4444" />
                <rect x="476" y="230" width="10" height="20" rx="1.5" fill="#06b6d4" />
                <rect x="488" y="236" width="7" height="14" rx="1.5" fill="#f59e0b" transform="rotate(12 492 245)" />
              </g>

              {/* Hanging Glowing Amber Lantern from Arch Ceiling */}
              <g
                id="ceiling-lantern"
                className="cursor-pointer group"
                onClick={() => {
                  setSelectedItemId('lantern');
                  handleToggleLighting();
                }}
              >
                {/* Chain & Mount */}
                <line x1="400" y1="150" x2="400" y2="200" stroke="#78350f" strokeWidth="2.5" />
                <circle cx="400" cy="154" r="3" fill="#451a03" />

                {/* Lantern Body */}
                <ellipse cx="400" cy="222" rx="20" ry="24" fill="url(#lanternRadial)" />
                <rect x="388" y="196" width="24" height="6" rx="2" fill="#92400e" stroke="#451a03" strokeWidth="1" />
                <rect x="390" y="202" width="20" height="26" rx="6" fill="#fef08a" stroke="#d97706" strokeWidth="1.5" opacity="0.9" />
                <rect x="388" y="228" width="24" height="6" rx="2" fill="#92400e" stroke="#451a03" strokeWidth="1" />
                {/* Glowing Candle Flame */}
                <ellipse cx="400" cy="215" rx="3.5" ry="6" fill="#ea580c" />
                <ellipse cx="400" cy="216" rx="2" ry="4" fill="#ffffff" />
              </g>

              {/* ======================================================= */}
              {/* THE WOVEN HOT-PINK BASKET BED WITH YELLOW MASCOT PIP    */}
              {/* ======================================================= */}
              <g id="stump-basket-bed" className="cursor-pointer" onClick={() => setSelectedItemId('bed')}>
                {/* Outer Braided Pink Yarn Rim */}
                <ellipse cx="400" cy="336" rx="115" ry="42" fill="#ec4899" stroke="#9d174d" strokeWidth="2.5" />
                {/* Inner Mattress & Pillows */}
                <ellipse cx="400" cy="330" rx="98" ry="32" fill="#a855f7" opacity="0.8" />
                {/* Fluffy Cushions: Sky Blue, Peach, Mint */}
                <ellipse cx="340" cy="326" rx="24" ry="18" fill="#38bdf8" stroke="#0284c7" strokeWidth="1" />
                <ellipse cx="455" cy="324" rx="22" ry="16" fill="#fb923c" stroke="#c2410c" strokeWidth="1" />
                <ellipse cx="468" cy="336" rx="20" ry="14" fill="#4ade80" stroke="#16a34a" strokeWidth="1" />

                {/* Cozy Folded Teal Blanket */}
                <path
                  d="M 400 338 C 430 335, 470 345, 485 360 C 460 368, 380 368, 370 358 Z"
                  fill="#06b6d4"
                  stroke="#0891b2"
                  strokeWidth="1.2"
                />

                {/* Braided Knitted Cable Texture on the Basket */}
                <path
                  d="M 300 336 Q 320 350 340 336 Q 360 350 380 336 Q 400 350 420 336 Q 440 350 460 336 Q 480 350 500 336"
                  stroke="#be185d"
                  strokeWidth="3"
                  strokeLinecap="round"
                  fill="none"
                />
                <path
                  d="M 310 346 Q 330 360 350 346 Q 370 360 390 346 Q 410 360 430 346 Q 450 360 470 346 Q 490 360 500 346"
                  stroke="#be185d"
                  strokeWidth="3"
                  strokeLinecap="round"
                  fill="none"
                />
              </g>

              {/* YELLOW MASCOT (PIP) LOUNGING IN BED WITH COCOA MUG */}
              <g
                id="yellow-mascot-pip-cocoa"
                className="cursor-pointer group"
                onClick={handleTapUpperMascot}
                transform="translate(360, 275)"
              >
                {/* Fluffy Golden Body */}
                <ellipse cx="40" cy="40" rx="34" ry="30" fill="#fcd34d" stroke="#f59e0b" strokeWidth="1.5" />
                <ellipse cx="40" cy="24" rx="16" ry="9" fill="#fef08a" opacity="0.6" />

                {/* Ears */}
                <ellipse cx="22" cy="18" rx="7" ry="9" fill="#f59e0b" transform="rotate(-15 22 18)" />
                <ellipse cx="58" cy="18" rx="7" ry="9" fill="#f59e0b" transform="rotate(15 58 18)" />

                {/* Big Button Eyes with Animated Blink */}
                <ellipse cx="32" cy="38" rx="4.5" ry="5.5" fill="#18181b" />
                <circle cx="34" cy="36" r="1.5" fill="#ffffff" />
                <ellipse cx="48" cy="38" rx="4.5" ry="5.5" fill="#18181b" />
                <circle cx="50" cy="36" r="1.5" fill="#ffffff" />

                {/* Happy Rosy Cheeks */}
                <ellipse cx="26" cy="44" rx="4" ry="2.5" fill="#f43f5e" opacity="0.6" />
                <ellipse cx="54" cy="44" rx="4" ry="2.5" fill="#f43f5e" opacity="0.6" />

                {/* Little Cat Smile */}
                <path d="M 37 42 Q 40 45 43 42" stroke="#78350f" strokeWidth="1.5" fill="none" strokeLinecap="round" />

                {/* Tiny Paws Holding Cyan Cocoa Mug */}
                <g id="cocoa-mug">
                  <rect x="34" y="44" width="13" height="12" rx="3" fill="#38bdf8" stroke="#0284c7" strokeWidth="1" />
                  <path d="M 47 47 Q 50 49 47 52" stroke="#0284c7" strokeWidth="1.5" fill="none" />
                  <ellipse cx="40" cy="45" rx="5" ry="2" fill="#78350f" />
                  <ellipse cx="40" cy="45" rx="3.5" ry="1.2" fill="#fef3c7" opacity="0.7" />

                  {/* Rising Animated Steam Curls */}
                  <path
                    d="M 38 42 Q 36 36 39 32 Q 42 28 39 24"
                    stroke="#ffffff"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                    fill="none"
                    opacity="0.8"
                    className="animate-pulse"
                  />
                  <path
                    d="M 42 41 Q 44 35 41 31 Q 38 27 42 23"
                    stroke="#ffffff"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                    fill="none"
                    opacity="0.8"
                    className="animate-pulse"
                  />
                </g>
              </g>

              {/* Bioluminescent Crystals Sprouting on Stump Roots */}
              <g
                id="stump-crystals"
                className="cursor-pointer group hover:brightness-125 transition-all"
                onClick={() => handleTapCrystals(225, 350)}
              >
                <polygon points="215,360 220,335 227,362" fill={crystalTheme.primary} opacity="0.9" />
                <polygon points="225,362 232,342 237,364" fill={crystalTheme.secondary} opacity="0.9" />
                <circle cx="225" cy="350" r="10" fill={crystalTheme.glowA} />
                <polygon points="575,365 582,340 588,367" fill={crystalTheme.primary} opacity="0.9" />
                <polygon points="585,367 594,346 598,368" fill={crystalTheme.tertiary} opacity="0.9" />
                <circle cx="585" cy="355" r="10" fill={crystalTheme.glowB} />
              </g>
            </g>

            {/* ------------------------------------------------------------- */}
            {/* MID STRATUM: EARTH SOIL CROSS-SECTION & CURLED ROOT LADDER    */}
            {/* ------------------------------------------------------------- */}
            <g id="stratum-earth">
              {/* Earth Cross-Cut Barrier */}
              <path
                d="M 0 380 Q 200 395 400 395 Q 600 395 800 380 L 800 500 Q 600 505 400 505 Q 200 505 0 500 Z"
                fill="url(#earthSoilGrad)"
              />

              {/* Twisting Tree Roots Embedded in Loam */}
              <path
                d="M 190 385 Q 160 430 110 450 Q 80 480 30 490"
                stroke="#78350f"
                strokeWidth="7"
                fill="none"
                strokeLinecap="round"
              />
              <path
                d="M 230 390 Q 250 440 220 480 Q 200 500 160 515"
                stroke="#573016"
                strokeWidth="5"
                fill="none"
                strokeLinecap="round"
              />
              <path
                d="M 610 385 Q 640 430 690 450 Q 720 480 770 490"
                stroke="#78350f"
                strokeWidth="7"
                fill="none"
                strokeLinecap="round"
              />
              <path
                d="M 570 390 Q 550 440 570 480 Q 590 500 640 515"
                stroke="#573016"
                strokeWidth="5"
                fill="none"
                strokeLinecap="round"
              />

              {/* Smooth Embedded Pebbles */}
              <ellipse cx="140" cy="440" rx="9" ry="6" fill="#3f2312" />
              <ellipse cx="260" cy="460" rx="12" ry="7" fill="#2d170a" />
              <ellipse cx="660" cy="445" rx="11" ry="8" fill="#3f2312" />
              <ellipse cx="720" cy="470" rx="8" ry="5" fill="#2d170a" />

              {/* Embedded Glowing Crystals in Dirt */}
              <g
                id="dirt-embedded-crystals"
                className="cursor-pointer group hover:brightness-125 transition-all"
                onClick={() => handleTapCrystals(182, 454)}
              >
                <polygon points="175,465 182,448 187,466" fill={crystalTheme.primary} />
                <circle cx="182" cy="454" r="8" fill={crystalTheme.glowA} />
                <polygon points="635,465 642,448 647,466" fill={crystalTheme.secondary} />
                <circle cx="642" cy="454" r="8" fill={crystalTheme.glowB} />
              </g>

              {/* CURLED VINE & WOOD ROOT LADDER DESCENDING FROM STUMP */}
              <g id="root-ladder" className="cursor-pointer" onClick={() => setSelectedItemId('bed')}>
                {/* Left Rail (Curled Vine) */}
                <path
                  d="M 480 375 Q 495 410 485 450 Q 475 490 490 525 Q 505 545 490 555"
                  stroke="#b45309"
                  strokeWidth="5.5"
                  fill="none"
                  strokeLinecap="round"
                />
                {/* Right Rail */}
                <path
                  d="M 505 385 Q 520 420 510 460 Q 500 500 515 535"
                  stroke="#b45309"
                  strokeWidth="5.5"
                  fill="none"
                  strokeLinecap="round"
                />
                {/* Rungs */}
                <line x1="487" y1="410" x2="513" y2="415" stroke="#f59e0b" strokeWidth="4" strokeLinecap="round" />
                <line x1="482" y1="445" x2="508" y2="450" stroke="#f59e0b" strokeWidth="4" strokeLinecap="round" />
                <line x1="479" y1="480" x2="505" y2="485" stroke="#f59e0b" strokeWidth="4" strokeLinecap="round" />
                <line x1="488" y1="515" x2="512" y2="520" stroke="#f59e0b" strokeWidth="4" strokeLinecap="round" />
              </g>
            </g>

            {/* ------------------------------------------------------------- */}
            {/* LEVEL 2: THE UNDERGROUND DEN (CAVERN INTERIOR)                */}
            {/* ------------------------------------------------------------- */}
            <g id="underground-cavern">
              {/* Cavern Hollow Interior Silhouette */}
              <path
                d="M 80 500 C 70 480, 730 480, 720 500 C 770 560, 780 770, 730 840 C 650 885, 150 885, 70 840 C 20 770, 30 560, 80 500 Z"
                fill="#2d170f"
                stroke="#1a0c02"
                strokeWidth="4"
              />

              {/* Curved Wooden Floorboards at Base of Cavern */}
              <path
                d="M 120 770 Q 400 810 680 770 L 690 835 Q 400 880 110 835 Z"
                fill="url(#floorPlankGrad)"
                stroke="#451a03"
                strokeWidth="2"
              />
              {/* Floor Plank Seams */}
              <path d="M 230 780 Q 235 845 240 855" stroke="#451a03" strokeWidth="1.5" opacity="0.6" />
              <path d="M 370 786 Q 375 850 380 870" stroke="#451a03" strokeWidth="1.5" opacity="0.6" />
              <path d="M 520 786 Q 525 850 530 870" stroke="#451a03" strokeWidth="1.5" opacity="0.6" />

              {/* ======================================================= */}
              {/* SUBTERRANEAN DRIFTING FIREFLIES & GLOWING DUST MOTES    */}
              {/* Deepens bioluminescent ambiance drifting in background */}
              {/* ======================================================= */}
              {isFirefliesActive && (
                <g id="cavern-background-drift-overlay">
                  {/* 1. Micro Glowing Dust Motes drifting on cavern air currents */}
                  <g id="cavern-drifting-dust-motes" className="pointer-events-none">
                    {CAVERN_DUST_MOTES.map((dm) => (
                      <circle
                        key={dm.id}
                        cx={dm.x}
                        cy={dm.y}
                        r={dm.r}
                        fill={dm.color}
                        opacity="0.8"
                        filter="url(#neonSparkleBloom)"
                        style={{
                          animation: `${dm.anim} ${dm.dur}s ease-in-out infinite`,
                          animationDelay: `${dm.del}s`,
                        }}
                      />
                    ))}
                  </g>

                  {/* 2. Bioluminescent Fireflies wandering gracefully in background */}
                  <g id="cavern-drifting-fireflies">
                    {CAVERN_FIREFLIES.map((ff) => {
                      const haloGradientId =
                        ff.colorType === 'lime'
                          ? 'url(#fireflyLimeHalo)'
                          : ff.colorType === 'cyan'
                          ? 'url(#fireflyCyanHalo)'
                          : ff.colorType === 'amber'
                          ? 'url(#fireflyAmberHalo)'
                          : 'url(#fireflyRoseHalo)';

                      const glowColor =
                        ff.colorType === 'lime'
                          ? '#bef264'
                          : ff.colorType === 'cyan'
                          ? '#38bdf8'
                          : ff.colorType === 'amber'
                          ? '#fde047'
                          : '#f472b6';

                      const isTapped = tappedFireflyId === ff.id;

                      return (
                        <g
                          key={ff.id}
                          transform={`translate(${ff.x}, ${ff.y})`}
                          style={{
                            animation: `${ff.wanderAnim} ${ff.wanderDur}s ease-in-out infinite`,
                            animationDelay: `${ff.wanderDelay}s`,
                          }}
                          className="cursor-pointer group select-none transition-transform hover:scale-125"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTapFirefly(ff);
                          }}
                        >
                          {/* Wide Soft Ambient Bioluminescent Light Halo */}
                          <circle
                            cx="0"
                            cy="0"
                            r={ff.size * 5}
                            fill={haloGradientId}
                            opacity="0.85"
                            style={{
                              animation: `fireflyGlowPulse ${ff.pulseDur}s ease-in-out infinite`,
                              animationDelay: `${ff.pulseDelay}s`,
                            }}
                          />

                          {/* Expanding Ping Pulse on Tap */}
                          {isTapped && (
                            <circle
                              cx="0"
                              cy="0"
                              r={ff.size * 4}
                              fill="none"
                              stroke="#ffffff"
                              strokeWidth="2.5"
                              className="animate-ping"
                            />
                          )}

                          {/* Delicate Fluttering Translucent Wings */}
                          <g
                            opacity="0.8"
                            style={{
                              animation: 'fireflyWingFlutter 0.16s ease-in-out infinite alternate',
                              transformOrigin: '0px 0px',
                            }}
                          >
                            <ellipse cx="-2.6" cy="-2.5" rx="3.5" ry="1.4" fill="#ffffff" transform="rotate(-30)" />
                            <ellipse cx="2.6" cy="-2.5" rx="3.5" ry="1.4" fill="#ffffff" transform="rotate(30)" />
                          </g>

                          {/* Tiny Firefly Body / Thorax */}
                          <ellipse cx="0" cy="-0.6" rx="1.6" ry="2.2" fill="#2d170f" />

                          {/* Bioluminescent Glowing Abdomen / Light Core */}
                          <circle
                            cx="0"
                            cy="1.2"
                            r={ff.size * 0.75}
                            fill={glowColor}
                            filter="url(#neonSparkleBloom)"
                            style={{
                              animation: `fireflyGlowPulse ${ff.pulseDur}s ease-in-out infinite`,
                              animationDelay: `${ff.pulseDelay}s`,
                            }}
                          />
                          <circle cx="0" cy="1.2" r={ff.size * 0.35} fill="#ffffff" />

                          {/* Tiny Whimsical Antennae */}
                          <line x1="-0.8" y1="-2.4" x2="-2.2" y2="-4.2" stroke="#451a03" strokeWidth="0.6" strokeLinecap="round" />
                          <line x1="0.8" y1="-2.4" x2="2.2" y2="-4.2" stroke="#451a03" strokeWidth="0.6" strokeLinecap="round" />
                        </g>
                      );
                    })}
                  </g>
                </g>
              )}

              {/* Bioluminescent Wall Crystals Lining Cavern Rim */}
              <g
                id="cavern-rim-crystals"
                className="cursor-pointer group hover:brightness-125 transition-all"
                onClick={() => handleTapCrystals(70, 660)}
              >
                {/* Left Wall Crystal Clusters */}
                <polygon points="90,560 70,545 88,575" fill={crystalTheme.primary} />
                <circle cx="80" cy="555" r="12" fill={crystalTheme.glowA} />
                <polygon points="65,665 42,652 64,680" fill={crystalTheme.secondary} />
                <circle cx="55" cy="665" r="14" fill={crystalTheme.glowB} />
                <polygon points="68,760 48,775 75,785" fill={crystalTheme.primary} />
                <circle cx="68" cy="760" r="10" fill={crystalTheme.glowA} />

                {/* Right Wall Crystal Clusters */}
                <polygon points="730,550 755,535 738,565" fill={crystalTheme.primary} />
                <circle cx="745" cy="545" r="12" fill={crystalTheme.glowA} />
                <polygon points="735,640 760,628 742,655" fill={crystalTheme.secondary} />
                <circle cx="750" cy="635" r="14" fill={crystalTheme.glowB} />
                <polygon points="720,735 745,745 725,758" fill={crystalTheme.tertiary} />
                <circle cx="725" cy="745" r="10" fill={crystalTheme.glowB} />

                {/* Ceiling Hanging Crystal Stalactite Clusters */}
                <polygon points="230,510 238,532 245,510" fill={crystalTheme.primary} />
                <circle cx="238" cy="522" r="8" fill={crystalTheme.glowA} />
                <polygon points="320,512 328,535 336,512" fill={crystalTheme.tertiary} />
                <circle cx="328" cy="525" r="9" fill={crystalTheme.glowB} />
                <polygon points="410,510 417,532 424,510" fill={crystalTheme.primary} />
                <circle cx="417" cy="522" r="8" fill={crystalTheme.glowA} />
              </g>

              {/* ======================================================= */}
              {/* TOGGLE-ABLE AMBIENT NEON FX LAYER: SPARKLING DUST MOTES */}
              {/* ======================================================= */}
              {isNeonFxActive && (
                <g id="ambient-neon-sparkles-layer" className="pointer-events-none">
                  {/* 1. Cavern Atmospheric Bioluminescent Aura Glows */}
                  <g id="ambient-crystal-auras">
                    <ellipse
                      cx="80"
                      cy="555"
                      rx="26"
                      ry="26"
                      fill={crystalTheme.glowA}
                      opacity="0.7"
                      style={{ animation: 'neonPulseGlow 3.2s ease-in-out infinite' }}
                    />
                    <ellipse
                      cx="55"
                      cy="665"
                      rx="30"
                      ry="30"
                      fill={crystalTheme.glowB}
                      opacity="0.65"
                      style={{ animation: 'neonPulseGlow 3.8s ease-in-out infinite 0.6s' }}
                    />
                    <ellipse
                      cx="745"
                      cy="545"
                      rx="26"
                      ry="26"
                      fill={crystalTheme.glowA}
                      opacity="0.7"
                      style={{ animation: 'neonPulseGlow 3.4s ease-in-out infinite 0.3s' }}
                    />
                    <ellipse
                      cx="750"
                      cy="635"
                      rx="30"
                      ry="30"
                      fill={crystalTheme.glowB}
                      opacity="0.65"
                      style={{ animation: 'neonPulseGlow 3.6s ease-in-out infinite 0.9s' }}
                    />
                    <ellipse
                      cx="328"
                      cy="525"
                      rx="24"
                      ry="18"
                      fill={crystalTheme.glowB}
                      opacity="0.6"
                      style={{ animation: 'neonPulseGlow 2.9s ease-in-out infinite 0.4s' }}
                    />
                  </g>

                  {/* 2. Sparkling Stardust Particles & Diamond Twinkles */}
                  <g id="sparkling-dust-particles">
                    {AMBIENT_CRYSTAL_PARTICLES.filter((_, idx) => {
                      if (sparkleIntensity === 'radiant') return true;
                      if (sparkleIntensity === 'twinkle') return idx % 2 === 0;
                      return idx % 3 === 0;
                    }).map((p) => {
                      return (
                        <g
                          key={p.id}
                          transform={`translate(${p.cx}, ${p.cy})`}
                          className="neon-star-particle"
                          style={{
                            animation: `${p.anim} ${p.dur}s ease-in-out infinite`,
                            animationDelay: `${p.del}s`,
                          }}
                        >
                          {p.type === 'star' && (
                            <>
                              {/* Glowing 4-Point Diamond Stardust */}
                              <path
                                d={`M 0,-${p.size * 1.4} L ${p.size * 0.35},-${p.size * 0.35} L ${p.size * 1.4},0 L ${p.size * 0.35},${p.size * 0.35} L 0,${p.size * 1.4} L -${p.size * 0.35},${p.size * 0.35} L -${p.size * 1.4},0 L -${p.size * 0.35},-${p.size * 0.35} Z`}
                                fill={p.color}
                                filter={crystalTheme.bloomFilter}
                              />
                              {/* Bright White Core */}
                              <circle r={p.size * 0.28} fill="#ffffff" />
                            </>
                          )}

                          {p.type === 'cross' && (
                            <>
                              {/* Sharp 4-Point Glint */}
                              <path
                                d={`M -${p.size} 0 L ${p.size} 0 M 0 -${p.size} L 0 ${p.size}`}
                                stroke={p.color}
                                strokeWidth="1.6"
                                strokeLinecap="round"
                                filter={crystalTheme.bloomFilter}
                              />
                              <circle r="1" fill="#ffffff" />
                            </>
                          )}

                          {p.type === 'orb' && (
                            <>
                              {/* Floating Bioluminescent Spore Mote */}
                              <circle
                                r={p.size * 0.8}
                                fill={p.color}
                                opacity="0.9"
                                filter={crystalTheme.bloomFilter}
                              />
                              <circle r={p.size * 0.38} fill="#ffffff" opacity="0.95" />
                            </>
                          )}
                        </g>
                      );
                    })}
                  </g>

                  {/* 3. Interactive Crystal Energy Pulse Wave on Tap */}
                  {crystalSurgeTrigger > 0 && (
                    <g key={`surge-${crystalSurgeTrigger}`} id="crystal-surge-burst">
                      {/* Shockwave Rings */}
                      <circle
                        cx={surgeCoords.x}
                        cy={surgeCoords.y}
                        r="10"
                        fill="none"
                        stroke={crystalTheme.primary}
                        strokeWidth="3.5"
                        style={{
                          animation: 'neonSurgeWave 1.2s cubic-bezier(0.1, 0.8, 0.3, 1) forwards',
                        }}
                      />
                      <circle
                        cx={surgeCoords.x}
                        cy={surgeCoords.y}
                        r="10"
                        fill="none"
                        stroke={crystalTheme.secondary}
                        strokeWidth="2.5"
                        style={{
                          animation: 'neonSurgeWave 1.6s cubic-bezier(0.1, 0.8, 0.3, 1) forwards 0.15s',
                        }}
                      />

                      {/* Outward Bursting Star Flashes */}
                      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => {
                        const rad = (deg * Math.PI) / 180;
                        const dist = 55;
                        const bx = surgeCoords.x + Math.cos(rad) * dist;
                        const by = surgeCoords.y + Math.sin(rad) * dist;
                        return (
                          <g
                            key={i}
                            transform={`translate(${bx}, ${by})`}
                            style={{
                              animation: 'neonDustTwinkle 1.2s ease-out forwards',
                            }}
                          >
                            <path
                              d="M 0,-7 L 2,-2 L 7,0 L 2,2 L 0,7 L -2,2 L -7,0 L -2,-2 Z"
                              fill={i % 2 === 0 ? crystalTheme.primary : crystalTheme.secondary}
                              filter={crystalTheme.bloomFilter}
                            />
                            <circle r="1.5" fill="#ffffff" />
                          </g>
                        );
                      })}
                    </g>
                  )}
                </g>
              )}

              {/* ======================================================= */}
              {/* WALL DECOR: BOHO TAPESTRIES (TOP LEFT DIRT WALL)        */}
              {/* ======================================================= */}
              <g id="wall-tapestries" className="cursor-pointer group" onClick={() => setSelectedItemId('tapestry')}>
                {/* Hanging Rods & Cords */}
                <line x1="160" y1="585" x2="185" y2="585" stroke="#78350f" strokeWidth="2" strokeLinecap="round" />
                <line x1="205" y1="580" x2="245" y2="580" stroke="#78350f" strokeWidth="2.5" strokeLinecap="round" />
                <line x1="265" y1="580" x2="305" y2="580" stroke="#78350f" strokeWidth="2.5" strokeLinecap="round" />

                {/* Tapestry 1: Mini Geometric (Left) */}
                <path d="M 165 588 L 180 588 L 180 620 L 172 630 L 165 620 Z" fill="#475569" stroke="#94a3b8" strokeWidth="0.8" />
                <polygon points="172,596 177,605 167,605" fill="#fb923c" />

                {/* Tapestry 2: Pastel Mountain Landscape (Center) */}
                <path d="M 210 585 L 240 585 L 240 640 L 225 655 L 210 640 Z" fill="#6366f1" stroke="#818cf8" strokeWidth="1" />
                <path d="M 210 610 Q 225 600 240 610" stroke="#f472b6" strokeWidth="3" fill="none" />
                <path d="M 210 622 Q 225 612 240 622" stroke="#34d399" strokeWidth="3" fill="none" />
                <circle cx="225" cy="598" r="4.5" fill="#fbbf24" />

                {/* Tapestry 3: Mystic Crystal Rune (Right) */}
                <path d="M 270 585 L 300 585 L 300 635 L 285 648 L 270 635 Z" fill="#0284c7" stroke="#38bdf8" strokeWidth="1" />
                <polygon points="285,595 292,608 285,622 278,608" fill="#f472b6" />
                <circle cx="285" cy="608" r="3" fill="#ffffff" />
              </g>

              {/* ======================================================= */}
              {/* WALL DECOR: CARVED DIRT SHELVES (TOP CENTER WALL)       */}
              {/* ======================================================= */}
              <g id="wall-carved-shelves" className="cursor-pointer group" onClick={() => setSelectedItemId('wall_shelves')}>
                {/* Upper Shelf */}
                <rect x="360" y="582" width="65" height="5" rx="2" fill="#78350f" stroke="#451a03" strokeWidth="0.8" />
                <polygon points="378,578 382,568 387,578" fill="#38bdf8" />
                <rect x="400" y="570" width="8" height="12" rx="2" fill="#f59e0b" stroke="#78350f" strokeWidth="0.8" />

                {/* Middle Shelf */}
                <rect x="360" y="612" width="65" height="5" rx="2" fill="#78350f" stroke="#451a03" strokeWidth="0.8" />
                <ellipse cx="376" cy="606" rx="5" ry="5.5" fill="#fb923c" />
                <path d="M 398 610 Q 403 600 408 610" stroke="#a855f7" strokeWidth="1.5" fill="none" />

                {/* Lower Shelf */}
                <rect x="360" y="642" width="65" height="5" rx="2" fill="#78350f" stroke="#451a03" strokeWidth="0.8" />
                <rect x="372" y="628" width="6" height="14" fill="#ef4444" rx="1" />
                <rect x="380" y="626" width="7" height="16" fill="#3b82f6" rx="1" />
                <rect x="388" y="628" width="6" height="14" fill="#10b981" rx="1" />
                <circle cx="410" cy="635" r="4.5" fill="#2dd4bf" stroke="#0f766e" strokeWidth="0.8" />
              </g>

              {/* ======================================================= */}
              {/* RIGHT WALL: CARVED DIRT WINDOW (STAR GAZING ALCOVE)     */}
              {/* ======================================================= */}
              <g id="carved-dirt-window" className="cursor-pointer group" onClick={() => setSelectedItemId('window')}>
                {/* Wooden Arched Window Frame */}
                <path
                  d="M 660 630 C 655 600, 715 600, 710 630 C 715 690, 655 690, 660 630 Z"
                  fill="#78350f"
                  stroke="#451a03"
                  strokeWidth="2"
                />
                {/* Starry Night Sky Glass Pane */}
                <path
                  d="M 665 632 C 662 608, 708 608, 705 632 C 708 680, 662 680, 665 632 Z"
                  fill="#090d24"
                />
                {/* Window Panes Grid */}
                <line x1="685" y1="610" x2="685" y2="675" stroke="#78350f" strokeWidth="2.5" />
                <line x1="664" y1="645" x2="706" y2="645" stroke="#78350f" strokeWidth="2.5" />
                {/* Twinkling Stars in Window */}
                <circle cx="676" cy="625" r="1.5" fill="#fef08a" />
                <circle cx="695" cy="632" r="1.8" fill="#ffffff" />
                <circle cx="678" cy="660" r="1.2" fill="#ffffff" />
              </g>

              {/* ======================================================= */}
              {/* FLOOR: PASTEL AURA FRINGE RUG UNDER COFFEE TABLE        */}
              {/* ======================================================= */}
              <g id="pastel-fringe-rug" className="cursor-pointer" onClick={() => setSelectedItemId('rug')}>
                {/* Radial Rainbow Glow Halo */}
                <ellipse cx="340" cy="808" rx="85" ry="34" fill="url(#pinkCrystalGlow)" opacity="0.6" />
                <ellipse cx="340" cy="808" rx="78" ry="30" fill="#fbcfe8" stroke="#f472b6" strokeWidth="1" />
                <ellipse cx="340" cy="808" rx="64" ry="24" fill="#a5f3fc" />
                <ellipse cx="340" cy="808" rx="48" ry="18" fill="#fed7aa" />
                {/* Knitted Fringe Strands around perimeter */}
                <path
                  d="M 260 808 C 255 815, 270 825, 280 828 C 300 835, 340 842, 380 838 C 410 832, 425 820, 420 808"
                  stroke="#ffffff"
                  strokeWidth="2.5"
                  strokeDasharray="3 3"
                  fill="none"
                />
              </g>

              {/* ======================================================= */}
              {/* CENTER: TREE-SLICE COFFEE TABLE WITH GLOWING POTION     */}
              {/* ======================================================= */}
              <g id="tree-slice-table" className="cursor-pointer group" onClick={() => setSelectedItemId('coffee_table')}>
                {/* 3 Wooden Peg Legs */}
                <rect x="290" y="796" width="10" height="20" rx="3" fill="#451a03" />
                <rect x="380" y="796" width="10" height="20" rx="3" fill="#451a03" />
                <rect x="335" y="802" width="10" height="18" rx="3" fill="#2d170a" />

                {/* Natural Organic Slab Cross-Cut with Visible Growth Rings */}
                <path
                  d="M 285 778 C 280 765, 330 758, 360 762 C 400 756, 425 770, 420 782 C 415 794, 380 802, 340 800 C 300 802, 285 790, 285 778 Z"
                  fill="#b45309"
                  stroke="#78350f"
                  strokeWidth="2.5"
                />
                <ellipse cx="348" cy="778" rx="55" ry="15" fill="#f59e0b" stroke="#d97706" strokeWidth="1.5" />
                <ellipse cx="348" cy="778" rx="42" ry="11" fill="none" stroke="#b45309" strokeWidth="1.5" opacity="0.7" />
                <ellipse cx="348" cy="778" rx="26" ry="7" fill="none" stroke="#b45309" strokeWidth="1.5" opacity="0.7" />

                {/* Glowing Glass Spherical Potion Jar in Center */}
                <ellipse cx="345" cy="766" rx="9" ry="9" fill="#38bdf8" stroke="#0284c7" strokeWidth="1" opacity="0.9" />
                <ellipse cx="345" cy="768" rx="6" ry="4" fill="#ffffff" opacity="0.6" />
                <rect x="343" y="754" width="4" height="4" fill="#78350f" rx="1" />
                {/* Floating sparkle from potion */}
                <circle cx="345" cy="750" r="1.5" fill="#fef08a" className="animate-ping" />
              </g>

              {/* ======================================================= */}
              {/* SEATING: MUSHROOM SOFA & CYAN MASCOT READING BOOK       */}
              {/* ======================================================= */}
              <g id="mushroom-sofa" className="cursor-pointer" onClick={() => setSelectedItemId('sofa')}>
                {/* Creamy Mushroom Stalk Feet */}
                <ellipse cx="160" cy="780" rx="11" ry="8" fill="#fef08a" stroke="#d97706" strokeWidth="1" />
                <ellipse cx="230" cy="780" rx="11" ry="8" fill="#fef08a" stroke="#d97706" strokeWidth="1" />
                <ellipse cx="195" cy="785" rx="12" ry="8" fill="#fef08a" stroke="#d97706" strokeWidth="1" />

                {/* Toadstool Green Mushroom Cap Armrests with White Dots */}
                <ellipse cx="140" cy="745" rx="18" ry="16" fill="#84cc16" stroke="#4d7c0f" strokeWidth="1.8" />
                <circle cx="134" cy="740" r="3" fill="#ffffff" />
                <circle cx="146" cy="748" r="2.5" fill="#ffffff" />

                <ellipse cx="245" cy="745" rx="18" ry="16" fill="#84cc16" stroke="#4d7c0f" strokeWidth="1.8" />
                <circle cx="240" cy="742" r="3" fill="#ffffff" />
                <circle cx="250" cy="749" r="2.2" fill="#ffffff" />

                {/* Main Curved Green Mushroom Couch Backrest */}
                <path
                  d="M 145 745 C 140 690, 245 690, 240 745 C 220 755, 160 755, 145 745 Z"
                  fill="#84cc16"
                  stroke="#4d7c0f"
                  strokeWidth="2.5"
                />
                {/* White Dots on Backrest */}
                <circle cx="170" cy="715" r="4.5" fill="#ffffff" />
                <circle cx="215" cy="715" r="4.5" fill="#ffffff" />
                <circle cx="192" cy="704" r="5" fill="#ffffff" />

                {/* Plush Seat Cushion with Peach Throw Pillow */}
                <ellipse cx="192" cy="752" rx="45" ry="18" fill="#a3e635" stroke="#4d7c0f" strokeWidth="1.5" />
                <rect x="150" y="740" width="16" height="14" rx="3" fill="#fed7aa" stroke="#fb923c" strokeWidth="1" transform="rotate(-15 150 740)" />
              </g>

              {/* CYN MASCOT (KORA / BOBA) SEATED ON SOFA READING BOOK */}
              <g
                id="cyan-mascot-reading"
                className="cursor-pointer group"
                onClick={handleTapLowerMascot}
                transform="translate(195, 700)"
              >
                {/* Fluffy Cyan Body */}
                <ellipse cx="20" cy="30" rx="26" ry="24" fill="#2dd4bf" stroke="#0d9488" strokeWidth="1.5" />
                <ellipse cx="20" cy="18" rx="12" ry="7" fill="#a5f3fc" opacity="0.6" />

                {/* Cute Ears / Horns */}
                <ellipse cx="6" cy="12" rx="6" ry="8" fill="#0d9488" transform="rotate(-20 6 12)" />
                <ellipse cx="34" cy="12" rx="6" ry="8" fill="#0d9488" transform="rotate(20 34 12)" />

                {/* Big Button Eyes with Blink */}
                <ellipse cx="14" cy="28" rx="3.8" ry="4.5" fill="#0f172a" />
                <circle cx="16" cy="26" r="1.2" fill="#ffffff" />
                <ellipse cx="28" cy="28" rx="3.8" ry="4.5" fill="#0f172a" />
                <circle cx="30" cy="26" r="1.2" fill="#ffffff" />

                {/* Rosy Cheeks */}
                <ellipse cx="10" cy="33" rx="3.5" ry="2" fill="#f43f5e" opacity="0.6" />
                <ellipse cx="32" cy="33" rx="3.5" ry="2" fill="#f43f5e" opacity="0.6" />

                {/* Sweet Reading Smile */}
                <path d="M 18 33 Q 21 36 24 33" stroke="#042f2e" strokeWidth="1.2" fill="none" strokeLinecap="round" />

                {/* Open Purple Book Held in Paws */}
                <g id="open-purple-book" transform="translate(10, 32)">
                  {/* Left Page */}
                  <polygon points="0,6 10,2 10,18 0,22" fill="#fdf4ff" stroke="#a855f7" strokeWidth="1" />
                  {/* Right Page */}
                  <polygon points="10,2 20,6 20,22 10,18" fill="#fdf4ff" stroke="#a855f7" strokeWidth="1" />
                  {/* Purple Cover */}
                  <path d="M -1 23 Q 10 18 21 23" stroke="#7e22ce" strokeWidth="2.5" fill="none" />
                  {/* Text Squiggles on Pages */}
                  <line x1="2" y1="8" x2="8" y2="6" stroke="#c084fc" strokeWidth="0.8" />
                  <line x1="2" y1="12" x2="8" y2="10" stroke="#c084fc" strokeWidth="0.8" />
                  <line x1="12" y1="6" x2="18" y2="8" stroke="#c084fc" strokeWidth="0.8" />
                  <line x1="12" y1="10" x2="18" y2="12" stroke="#c084fc" strokeWidth="0.8" />
                </g>
              </g>

              {/* ======================================================= */}
              {/* FLOOR: PASTEL MACARON POUF (CENTER RIGHT)               */}
              {/* ======================================================= */}
              <g id="floor-pouf" className="cursor-pointer group" onClick={() => setSelectedItemId('floor_pouf')}>
                <ellipse cx="495" cy="808" rx="34" ry="14" fill="#2dd4bf" stroke="#0d9488" strokeWidth="1.5" />
                <ellipse cx="495" cy="804" rx="30" ry="11" fill="#5eead4" />
                {/* Purple Side Pillow */}
                <ellipse cx="468" cy="808" rx="14" ry="8" fill="#c084fc" stroke="#7e22ce" strokeWidth="1" transform="rotate(-15 468 808)" />
              </g>

              {/* ======================================================= */}
              {/* RIGHT: 3-TIER DISPLAY SHELVES (LAVA LAMP & BLANKETS)    */}
              {/* ======================================================= */}
              <g id="display-shelves" className="cursor-pointer group" onClick={() => setSelectedItemId('shelving')}>
                {/* Shelf Side Pillars */}
                <rect x="525" y="605" width="8" height="155" rx="3" fill="#78350f" stroke="#451a03" strokeWidth="1" />
                <rect x="635" y="605" width="8" height="155" rx="3" fill="#78350f" stroke="#451a03" strokeWidth="1" />

                {/* Top Shelf */}
                <rect x="520" y="618" width="130" height="7" rx="2" fill="#b45309" stroke="#78350f" strokeWidth="1" />
                {/* Top Shelf Items: Mini Purple Pet Bed */}
                <ellipse cx="550" cy="610" rx="16" ry="8" fill="#d946ef" stroke="#a21caf" strokeWidth="1" />
                <ellipse cx="550" cy="608" rx="12" ry="5" fill="#f0abfc" />

                {/* Glowing Cyan Crystal Cluster on Top Shelf */}
                <polygon points="578,618 584,598 590,618" fill="#38bdf8" />
                <polygon points="586,618 594,604 598,618" fill="#67e8f9" />
                <circle cx="586" cy="608" r="8" fill="url(#cyanCrystalGlow)" />

                {/* ANIMATED PINK/PURPLE NEON LAVA LAMP */}
                <g id="lava-lamp" transform="translate(615, 574)">
                  <polygon points="4,44 14,44 12,38 6,38" fill="#78350f" />
                  {/* Glass Bottle */}
                  <path d="M 6 12 C 4 20, 2 30, 4 38 L 14 38 C 16 30, 14 20, 12 12 Z" fill="#ec4899" stroke="#9d174d" strokeWidth="1" />
                  <rect x="6" y="8" width="6" height="4" fill="#78350f" rx="1" />
                  {/* Rising Lava Wax Blobs */}
                  <ellipse cx="9" cy="32" rx="3.5" ry="4.5" fill="#fef08a" className="animate-bounce" />
                  <circle cx="9" cy="20" r="2.5" fill="#fef08a" className="animate-pulse" />
                  <circle cx="9" cy="24" r="6" fill="url(#pinkCrystalGlow)" />
                </g>

                {/* Middle Shelf */}
                <rect x="520" y="666" width="130" height="7" rx="2" fill="#b45309" stroke="#78350f" strokeWidth="1" />
                {/* Middle Shelf Items: Folded Colorful Pillows & Blankets */}
                <rect x="536" y="654" width="26" height="12" rx="3" fill="#f472b6" stroke="#db2777" strokeWidth="0.8" />
                <rect x="575" y="650" width="30" height="16" rx="4" fill="#2dd4bf" stroke="#0f766e" strokeWidth="0.8" />

                {/* Bottom Shelf */}
                <rect x="520" y="718" width="130" height="7" rx="2" fill="#b45309" stroke="#78350f" strokeWidth="1" />
                {/* Bottom Shelf Items: Iridescent Rolled Mats & Quilts */}
                <rect x="532" y="700" width="45" height="18" rx="4" fill="#a855f7" stroke="#7e22ce" strokeWidth="0.8" />
                <rect x="585" y="702" width="46" height="16" rx="4" fill="#38bdf8" stroke="#0284c7" strokeWidth="0.8" />
                {/* Rainbow Stripes on Blankets */}
                <line x1="535" y1="708" x2="574" y2="708" stroke="#f472b6" strokeWidth="2" />
                <line x1="588" y1="710" x2="628" y2="710" stroke="#fef08a" strokeWidth="2" />
              </g>

              {/* ======================================================= */}
              {/* FLOOR: FLUFFY SHERPA TREASURE CHEST (BOTTOM RIGHT)      */}
              {/* ======================================================= */}
              <g
                id="sherpa-treasure-chest"
                className="cursor-pointer group transition-transform hover:scale-105"
                onClick={handleTapChest}
              >
                {/* Wooden Cedar Chest Base */}
                <rect x="635" y="750" width="70" height="42" rx="6" fill="#78350f" stroke="#451a03" strokeWidth="1.5" />
                {/* Fluffy White Sherpa Edge Fur Border */}
                <rect x="633" y="746" width="74" height="10" rx="5" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1.2" />
                <rect x="633" y="782" width="74" height="10" rx="5" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1.2" />
                <rect x="633" y="748" width="8" height="40" rx="3" fill="#f8fafc" />
                <rect x="699" y="748" width="8" height="40" rx="3" fill="#f8fafc" />

                {/* Golden Keyhole Plate */}
                <rect x="665" y="760" width="10" height="12" rx="2" fill="#fbbf24" stroke="#d97706" strokeWidth="0.8" />
                <circle cx="670" cy="764" r="1.8" fill="#451a03" />
                <polygon points="669,764 671,764 672,769 668,769" fill="#451a03" />

                {/* Daily Stash Indicator Pill */}
                {!hasCollectedChestToday && (
                  <g className="animate-bounce">
                    <circle cx="670" cy="735" r="7" fill="#fbbf24" stroke="#ffffff" strokeWidth="1.5" />
                    <text x="670" y="738" textAnchor="middle" fontSize="9" fontWeight="900" fill="#78350f">
                      !
                    </text>
                  </g>
                )}
              </g>

              {/* ======================================================= */}
              {/* INTERACTIVE SWAP UI PILL: FLOATING `↻` (From User Image) */}
              {/* ======================================================= */}
              <g
                id="interactive-swap-pill"
                className="cursor-pointer group animate-pulse"
                onClick={() => setSelectedItemId('sofa')}
                transform="translate(430, 650)"
              >
                {/* Circular Swap Button */}
                <circle cx="28" cy="28" r="24" fill="#ffffff" stroke="#78350f" strokeWidth="3" />
                {/* Circular Arrow `↻` */}
                <path
                  d="M 28 14 A 14 14 0 1 1 16 22 L 13 18 M 16 22 L 18 28"
                  stroke="#78350f"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              </g>

              {/* Floating Furniture Category Card beside Swap Pill (From User Image) */}
              <g
                id="swap-category-card"
                className="cursor-pointer group"
                onClick={() => setSelectedItemId('sofa')}
                transform="translate(370, 680)"
              >
                <rect x="0" y="0" width="70" height="45" rx="8" fill="#38bdf8" stroke="#ffffff" strokeWidth="2.5" />
                <rect x="6" y="6" width="26" height="15" rx="3" fill="#ec4899" />
                <circle cx="50" cy="14" r="6" fill="#fbbf24" stroke="#d97706" strokeWidth="1" />
                <rect x="6" y="25" width="26" height="15" rx="3" fill="#d97706" />
                <circle cx="48" cy="32" r="5" fill="#fbbf24" />
                <circle cx="56" cy="34" r="5" fill="#fbbf24" />
              </g>
            </g>
          </svg>

          {/* Floating On-Stage Neon Ambient FX Quick Controls */}
          <div className="absolute bottom-3 left-4 z-20 flex items-center gap-2 flex-wrap pointer-events-auto">


            {/* Subterranean Fireflies & Glowing Motes Overlay Toggle */}
            <button
              onClick={() => {
                const nextState = !isFirefliesActive;
                setIsFirefliesActive(nextState);
                if (nextState) {
                  SoundEngine.playTileStep();
                  setDialogueBubble({
                    speaker: 'Cave Fireflies',
                    text: '✨ Bioluminescent fireflies & glowing dust motes are drifting through the den!',
                    role: 'lower',
                  });
                  setTimeout(() => setDialogueBubble(null), 3000);
                } else {
                  SoundEngine.playTileStep();
                  setDialogueBubble({
                    speaker: 'Den',
                    text: 'Fireflies & dust motes rested for a quiet sleep. 💤',
                    role: 'lower',
                  });
                  setTimeout(() => setDialogueBubble(null), 2500);
                }
              }}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 backdrop-blur-md border transition-all active:scale-95 cursor-pointer shadow-xl ${
                isFirefliesActive
                  ? 'bg-slate-950/85 border-lime-400/80 text-lime-200 shadow-[0_0_15px_rgba(163,230,53,0.35)]'
                  : 'bg-slate-950/85 border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-500'
              }`}
              title="Toggle Drifting Fireflies & Glowing Dust Motes Overlay"
            >
              <span className={`text-xs ${isFirefliesActive ? 'animate-bounce' : 'opacity-50'}`}>🪲</span>
              <span>Fireflies: {isFirefliesActive ? 'Drifting ✨' : 'Sleeping'}</span>
            </button>

            {isNeonFxActive && (
              <button
                onClick={() => handleTapCrystals(400, 650)}
                className="px-2.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider bg-slate-900/85 hover:bg-slate-800 border border-fuchsia-500/50 text-fuchsia-200 flex items-center gap-1 backdrop-blur-md shadow-lg transition-transform active:scale-95 cursor-pointer"
                title="Pulse a surge wave of sparkling stardust through the den"
              >
                <Zap className="w-3 h-3 text-amber-400" />
                <span>Surge Wave</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. INTERACTIVE FURNITURE CUSTOMIZER & UPGRADE DRAWER (Directly Actionable) */}
      {/* ========================================================================= */}
      <div className="w-full max-w-4xl rounded-3xl p-4 sm:p-5 bg-slate-950/90 border border-slate-800 shadow-2xl flex flex-col gap-4">
        {/* Category Quick Selector Tabs */}
        <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-3 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-black text-amber-300 uppercase tracking-wider">
              Den Furniture Customizer:
            </span>
            <span className="text-[10px] text-slate-400">
              Tap any item to upgrade its level or swap its aesthetic style!
            </span>
          </div>

          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-1">
            {allItemIds.map((id) => {
              const item = getFurnitureItem(id);
              const isSelected = selectedItemId === id;
              return (
                <button
                  key={id}
                  onClick={() => setSelectedItemId(id)}
                  className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1 whitespace-nowrap cursor-pointer ${
                    isSelected
                      ? 'bg-amber-400 text-slate-950 shadow-md scale-105'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  <span>{item.styles[0]?.icon || '🛋️'}</span>
                  <span>{item.title.split(' ')[0]}</span>
                  <span className="text-[9px] opacity-75">Lv.{item.level}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Item Upgrade & Style Customizer Card */}
        {selectedItem && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
            {/* 1. Item Overview & Level Up Card */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl p-1.5 rounded-xl bg-amber-500/20 border border-amber-500/30">
                    {selectedItem.styles[0]?.icon}
                  </span>
                  <div>
                    <h3 className="text-sm font-black text-white">{selectedItem.title}</h3>
                    <span className="text-[10px] text-amber-400 font-bold">
                      Current: Level {selectedItem.level} / {selectedItem.maxLevel}
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">{selectedItem.description}</p>

              {/* Stats Perks */}
              <div className="flex items-center gap-3 text-xs pt-1 border-t border-slate-800">
                <div className="flex items-center gap-1 text-amber-300 font-bold">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>+{selectedItem.cozyAuraPerLevel[selectedItem.level - 1]} Cozy Aura</span>
                </div>
                <div className="flex items-center gap-1 text-cyan-300 font-bold">
                  <Coins className="w-3.5 h-3.5" />
                  <span>+{selectedItem.coinPerHrPerLevel[selectedItem.level - 1]} Coins/hr</span>
                </div>
              </div>

              {/* Upgrade Button */}
              {selectedItem.level < selectedItem.maxLevel ? (
                <button
                  disabled={playerCoins < selectedItem.costPerLevel[selectedItem.level]}
                  onClick={() => handleUpgradeItem(selectedItem)}
                  className={`w-full mt-1 py-2 px-3 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-transform active:scale-95 cursor-pointer ${
                    playerCoins >= selectedItem.costPerLevel[selectedItem.level]
                      ? 'bg-gradient-to-r from-amber-400 via-orange-500 to-pink-500 text-slate-950 hover:brightness-110 shadow-lg'
                      : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                  }`}
                >
                  <ArrowUpCircle className="w-4 h-4 stroke-[2.5]" />
                  <span>
                    Upgrade to Lv.{selectedItem.level + 1} (
                    {selectedItem.costPerLevel[selectedItem.level].toLocaleString()} Coins)
                  </span>
                </button>
              ) : (
                <div className="w-full mt-1 py-1.5 px-3 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 text-center font-black text-xs uppercase tracking-wider">
                  ★ Maximum Cozy Tier Achieved!
                </div>
              )}
            </div>

            {/* 2. Visual Style Swapper (Directly swaps the visual style in the dollhouse!) */}
            <div className="md:col-span-2 p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Palette className="w-4 h-4 text-cyan-400" />
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-200">
                    Aesthetic Styles & Themes (Instant Swap)
                  </h4>
                </div>
                <span className="text-[10px] text-slate-400">
                  Select a style to customize the visual appearance
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {selectedItem.styles.map((style) => {
                  const isCurrentStyle = selectedItem.selectedStyleId === style.id;
                  return (
                    <button
                      key={style.id}
                      onClick={() => handleSelectStyle(selectedItem.id, style.id)}
                      className={`p-2.5 rounded-xl border flex flex-col text-left transition-all cursor-pointer ${
                        isCurrentStyle
                          ? 'bg-slate-800 border-2 shadow-lg scale-102'
                          : 'bg-slate-950/60 border-slate-800 hover:bg-slate-800/60 opacity-80'
                      }`}
                      style={{
                        borderColor: isCurrentStyle ? style.previewColor : undefined,
                        boxShadow: isCurrentStyle ? `0 0 16px ${style.previewColor}44` : undefined,
                      }}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-black text-white">{style.name}</span>
                        {isCurrentStyle && <Check className="w-3.5 h-3.5 text-cyan-400 stroke-[3]" />}
                      </div>

                      <p className="text-[10px] text-slate-300 leading-tight mb-2 flex-1">
                        {style.description}
                      </p>

                      <div className="flex items-center justify-between">
                        <span
                          className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase text-slate-900"
                          style={{ background: style.previewColor }}
                        >
                          {style.tag}
                        </span>
                        <span className="text-[10px] text-cyan-300 font-bold">
                          {isCurrentStyle ? 'Equipped' : 'Tap to Swap ↻'}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Ambient Neon Crystal FX Layer Controls (Live in Burrow) */}
            <div className="md:col-span-3 p-4 rounded-2xl bg-gradient-to-r from-slate-900/90 via-indigo-950/40 to-slate-900/90 border border-cyan-800/40 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300">
                  <Sparkles className={`w-5 h-5 ${isNeonFxActive ? 'animate-spin' : ''}`} style={{ animationDuration: '8s' }} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-black uppercase tracking-wider text-white">
                      Cavern Ambient Neon FX & Sparkling Dust
                    </h4>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase border ${
                      isNeonFxActive
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}>
                      {isNeonFxActive ? 'Layer Active ✨' : 'Layer Muted'}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Pulsing neon auric blooms and floating stardust spores reacting to the equipped crystal theme ({crystalTheme.themeName}).
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                {/* Intensity selector buttons */}
                <div className="flex items-center bg-slate-950/80 p-1 rounded-xl border border-slate-800 gap-1 text-[10px] font-bold">
                  {(['radiant', 'twinkle', 'subtle'] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => {
                        SoundEngine.playTileStep();
                        setSparkleIntensity(mode);
                      }}
                      className={`px-2 py-1 rounded-lg capitalize transition-all cursor-pointer ${
                        sparkleIntensity === mode
                          ? 'bg-cyan-500 text-slate-950 font-black shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>

                {/* Main Toggle Switch */}
                <button
                  onClick={handleToggleNeonFx}
                  className={`px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-transform active:scale-95 cursor-pointer ${
                    isNeonFxActive
                      ? 'bg-gradient-to-r from-cyan-500 to-fuchsia-500 text-slate-950 font-black shadow-md hover:brightness-110'
                      : 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isNeonFxActive ? 'Disable FX' : 'Enable FX'}</span>
                </button>

                {/* Trigger Surge Pulse */}
                {isNeonFxActive && (
                  <button
                    onClick={() => handleTapCrystals(400, 650)}
                    className="px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-slate-800 hover:bg-slate-700 border border-amber-500/40 text-amber-300 flex items-center gap-1.5 transition-transform active:scale-95 cursor-pointer"
                    title="Pulse crystal energy wave"
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    <span>Surge Wave</span>
                  </button>
                )}
              </div>
            </div>

            {/* 4. Subterranean Fireflies & Glowing Dust Motes Overlay Controls */}
            <div className="md:col-span-3 p-4 rounded-2xl bg-gradient-to-r from-slate-900/90 via-emerald-950/30 to-slate-900/90 border border-lime-800/40 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-lime-500/20 border border-lime-500/40 flex items-center justify-center text-xl text-lime-300">
                  🪲
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-black uppercase tracking-wider text-white">
                      Drifting Cave Fireflies & Luminous Dust Motes
                    </h4>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase border ${
                      isFirefliesActive
                        ? 'bg-lime-500/20 text-lime-300 border-lime-500/40 shadow-[0_0_10px_rgba(163,230,53,0.3)]'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}>
                      {isFirefliesActive ? 'Overlay Drifting ✨' : 'Overlay Asleep'}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Tiny bioluminescent fireflies and dust motes gently drifting along cavern drafts behind the cozy furniture. Tap any firefly in the cavern to make it twinkle!
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const next = !isFirefliesActive;
                    setIsFirefliesActive(next);
                    if (next) {
                      SoundEngine.playTileStep();
                      setDialogueBubble({
                        speaker: 'Cave Fireflies',
                        text: '✨ The glowing cave fireflies awoke and dance through the den air!',
                        role: 'lower',
                      });
                      setTimeout(() => setDialogueBubble(null), 3000);
                    } else {
                      SoundEngine.playTileStep();
                    }
                  }}
                  className={`px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-transform active:scale-95 cursor-pointer ${
                    isFirefliesActive
                      ? 'bg-gradient-to-r from-lime-500 to-emerald-500 text-slate-950 font-black shadow-md hover:brightness-110'
                      : 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  <span>🪲</span>
                  <span>{isFirefliesActive ? 'Put Fireflies to Sleep' : 'Awaken Fireflies ✨'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* 4. EXPANDABLE LOWER EXCAVATION (Subterranean Geode Basement)   */}
        {/* ------------------------------------------------------------- */}
        <div className="w-full mt-2 p-3.5 rounded-2xl bg-gradient-to-r from-purple-950/60 via-slate-950 to-indigo-950/60 border border-purple-800/40 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-xl">
              ⛏️
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h4 className="text-xs font-black text-white">Expandable Subterranean Cavern</h4>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase bg-purple-500/20 text-purple-300 border border-purple-500/40">
                  Expansion Layer
                </span>
              </div>
              <p className="text-[10px] text-slate-400">
                {isExcavatedLowerCavern
                  ? 'Lower Geode Chamber excavated! Ancient quartz veins uncovered.'
                  : 'Dig deeper underneath your burrow floor to uncover raw geode chambers and unlock extra slots!'}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              if (isExcavatedLowerCavern) {
                SoundEngine.playTileStep();
                setSelectedItemId('crystals');
                return;
              }
              const cost = 10000;
              if (playerCoins < cost) {
                SoundEngine.playTileStep();
                return;
              }
              onUpgradeFurniture('crystals', cost);
              setIsExcavatedLowerCavern(true);
              SoundEngine.playExcavation();
              confetti({
                particleCount: 80,
                spread: 90,
                origin: { y: 0.8 },
                colors: ['#a855f7', '#06b6d4', '#fbbf24', '#ffffff'],
              });
            }}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-transform active:scale-95 cursor-pointer whitespace-nowrap ${
              isExcavatedLowerCavern
                ? 'bg-purple-900/60 border border-purple-500 text-purple-200 hover:bg-purple-800/60'
                : playerCoins >= 10000
                ? 'bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white shadow-lg'
                : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
            }`}
          >
            <Pickaxe className="w-3.5 h-3.5" />
            <span>
              {isExcavatedLowerCavern ? 'Inspect Geode Vein' : 'Dig Deeper (10,000 Coins)'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
