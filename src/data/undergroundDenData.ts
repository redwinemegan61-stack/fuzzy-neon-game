export interface DenFurnitureItem {
  id: string;
  name: string;
  category: 'seating' | 'lighting' | 'interactive' | 'accent';
  theme: 'cyber_pastel' | 'bioluminescent_grotto' | 'retro_plush';
  icon: string;
  previewColor: string;
  accentColor: string;
  cost: number;
  unlockedLevel: number;
  description: string;
  interactiveType?: 'radio' | 'trampoline' | 'cushion' | 'fireplace' | 'fountain' | 'terrarium' | 'gummy_bear';
  soundTrigger?: 'lofi' | 'bounce' | 'coo' | 'chime' | 'purr';
}

export interface MascotNookSignature {
  mascotId: string;
  nestTitle: string;
  nestSubtitle: string;
  nestStructureType: 'stump_fluff' | 'butterfly_melon' | 'crystal_stalks' | 'coral_grotto' | 'cloud_cradle';
  nestThemeColor: string;
  ambientLightColor: string;
  idleMicroAction: string; // signature micro-animation text
  idleSparkleIcon: string;
  purrAudioPitch: number;
  snuggleQuotes: string[];
}

export const MASCOT_NOOK_SIGNATURES: Record<string, MascotNookSignature> = {
  pip: {
    mascotId: 'pip',
    nestTitle: 'Sunlit Moss Knoll & Golden Fluff Stump',
    nestSubtitle: 'A hollowed-out ancient tree trunk lined with cloud-soft neon fluff & glowing dewleaves',
    nestStructureType: 'stump_fluff',
    nestThemeColor: '#fbbf24',
    ambientLightColor: '#f59e0b',
    idleMicroAction: 'Curled into a golden neon puffball with tiny "zzz" sparkles drifting upward',
    idleSparkleIcon: '✨',
    purrAudioPitch: 1.25,
    snuggleQuotes: [
      '*cooooo...* ❤️ The warm golden moss nest is so soft and charged! ⚡',
      '*happy electric purr* Golden fluff wraps around me like a sunny blanket! 🍃',
      '*melts down into moss cushion* Ahhh, peak snuggle mode achieved! ✨',
      '*soft electric coo* Thank you for loving my mossy sun knoll! 🐾',
    ],
  },
  boba: {
    mascotId: 'boba',
    nestTitle: 'Sugar-Melon Slice & Butterfly Alcove',
    nestSubtitle: 'A giant hollowed-out pastel melon slice strung with sweet berry vines & fluttering companions',
    nestStructureType: 'butterfly_melon',
    nestThemeColor: '#f97316',
    ambientLightColor: '#38bdf8',
    idleMicroAction: 'Obsessively fluffing an oversized melon cushion and sipping from a glowing juice box',
    idleSparkleIcon: '🧋',
    purrAudioPitch: 1.15,
    snuggleQuotes: [
      '*cooooo...* ❤️ Sinking deep into my juicy sweet melon hammock! 🍉',
      '*gentle boba purr* Mochi softness with pastel butterfly tickles! 🦋',
      '*happy boba sigh* Sipping cool sweet nectar in my cozy melon slice! ✨',
      '*coos softly* Best little butterfly nook in the whole neon burrow! 🍯',
    ],
  },
  ziggy: {
    mascotId: 'ziggy',
    nestTitle: 'Iridescent Crystal Stalks & Velvet Hammock',
    nestSubtitle: 'A cozy woven velvet hammock suspended between towering bioluminescent quartz stalks',
    nestStructureType: 'crystal_stalks',
    nestThemeColor: '#10b981',
    ambientLightColor: '#34d399',
    idleMicroAction: 'Dusting tiny crystal lamps and tossing mini dragonfly confetti',
    idleSparkleIcon: '💎',
    purrAudioPitch: 0.95,
    snuggleQuotes: [
      '*deep rumbling purr* The crystal vibrations in this hammock are supreme! 🎵',
      '*cooooo...* ❤️ Sinking deep into emerald velvet beneath glowing quartz... 🐾',
      '*kneads paws softly* The dragonfly lanterns are so tranquil tonight! ⚡',
      '*coos contentedly* Purrrrr... master ninja comfort unlocked! 💤',
    ],
  },
  kora: {
    mascotId: 'kora',
    nestTitle: 'Bioluminescent Sea Grotto & Pearl Shell',
    nestSubtitle: 'An iridescent giant clam cradled by pulsing neon sea anemones and tranquil wave glass',
    nestStructureType: 'coral_grotto',
    nestThemeColor: '#06b6d4',
    ambientLightColor: '#38bdf8',
    idleMicroAction: 'Watching floating water sprites swirl with gentle ocean bubble sighs',
    idleSparkleIcon: '🪸',
    purrAudioPitch: 1.35,
    snuggleQuotes: [
      '*peaceful bubble coo...* ❤️ Warm seafoam waters wrap around me! 🌊',
      '*soft oceanic purr* The pearl clam bed is so velvety and soothing! 🪸',
      '*coos and closes eyes* Listening to distant coral chimes... ✨',
      '*happy water sigh* Floating like a little cloud in my sea grotto! 💎',
    ],
  },
  lulu: {
    mascotId: 'lulu',
    nestTitle: 'Giant Pastel Mushroom Cap & Cloud Cradle',
    nestSubtitle: 'An enchanted velvety lavender toadstool canopy stuffed with floating stardust cushions',
    nestStructureType: 'cloud_cradle',
    nestThemeColor: '#ec4899',
    ambientLightColor: '#d946ef',
    idleMicroAction: 'Twirling a tiny stardust mobile and yawning with glittery pink sparkles',
    idleSparkleIcon: '🌸',
    purrAudioPitch: 1.4,
    snuggleQuotes: [
      '*sweet melodic coo...* ❤️ Celestial stardust warmth under the giant mushroom! 🌌',
      '*soft purr* Melting like warm spun cotton candy into the cloud cradle! 💖',
      '*coos and hugs stardust pillow* So dreamy and peaceful up here... ✨',
      '*happy little hum* Gentle pets make my neon aura sparkle! 🌈',
    ],
  },
};

export const DEN_FURNITURE_CATALOG: DenFurnitureItem[] = [
  // 1. Cyber-Pastel Set
  {
    id: 'furn_holo_rug',
    name: 'Prismatic Holo-Rug',
    category: 'accent',
    theme: 'cyber_pastel',
    icon: '✨',
    previewColor: '#00f0ff',
    accentColor: '#d946ef',
    cost: 3500,
    unlockedLevel: 1,
    description: 'Iridescent floor projection featuring swimming cyber koi and pastel wireframes.',
    interactiveType: 'cushion',
    soundTrigger: 'chime',
  },
  {
    id: 'furn_gummy_bear_chair',
    name: 'Translucent Gummy Bear Chair',
    category: 'seating',
    theme: 'cyber_pastel',
    icon: '🧸',
    previewColor: '#ec4899',
    accentColor: '#f43f5e',
    cost: 5000,
    unlockedLevel: 1,
    description: 'Squishy candy-gel armchair that glows softly and giggles when sat upon.',
    interactiveType: 'gummy_bear',
    soundTrigger: 'purr',
  },
  {
    id: 'furn_bubble_tube_lamp',
    name: 'Pastel Bubble-Tube Pillar',
    category: 'lighting',
    theme: 'cyber_pastel',
    icon: '🫧',
    previewColor: '#06b6d4',
    accentColor: '#38bdf8',
    cost: 4200,
    unlockedLevel: 1,
    description: 'Tall acrylic cylinder filled with floating neon bubbles and color-shifting LEDs.',
    interactiveType: 'fountain',
    soundTrigger: 'chime',
  },
  {
    id: 'furn_neon_sign_fluff',
    name: "'STAY COZY' Fluffy Neon Sign',",
    category: 'lighting',
    theme: 'cyber_pastel',
    icon: '💡',
    previewColor: '#ffe600',
    accentColor: '#fbbf24',
    cost: 6000,
    unlockedLevel: 2,
    description: 'Warm glowing retro sign framed in fluffy white synthetic cloud fleece.',
    interactiveType: 'cushion',
    soundTrigger: 'chime',
  },
  {
    id: 'furn_cyber_trampoline',
    name: 'Neon Bounce Trampoline',
    category: 'interactive',
    theme: 'cyber_pastel',
    icon: '🎪',
    previewColor: '#a855f7',
    accentColor: '#ec4899',
    cost: 8500,
    unlockedLevel: 2,
    description: 'Springy anti-gravity pad that sends mascots flying into cheerful cartwheels.',
    interactiveType: 'trampoline',
    soundTrigger: 'bounce',
  },

  // 2. Bioluminescent Grotto Set
  {
    id: 'furn_mushroom_stool',
    name: 'Giant Glow Mushroom Stool',
    category: 'seating',
    theme: 'bioluminescent_grotto',
    icon: '🍄',
    previewColor: '#10b981',
    accentColor: '#34d399',
    cost: 4500,
    unlockedLevel: 1,
    description: 'Plump velvety moss mushroom with soft spotted cap that illuminates feet.',
    interactiveType: 'cushion',
    soundTrigger: 'purr',
  },
  {
    id: 'furn_firefly_terrarium',
    name: 'Hanging Firefly Terrarium',
    category: 'lighting',
    theme: 'bioluminescent_grotto',
    icon: '🏮',
    previewColor: '#fbbf24',
    accentColor: '#f59e0b',
    cost: 5200,
    unlockedLevel: 1,
    description: 'Blown-glass orb sheltering a swarm of gentle golden forest fireflies.',
    interactiveType: 'terrarium',
    soundTrigger: 'chime',
  },
  {
    id: 'furn_nectar_fountain',
    name: 'Dripping Dew Nectar Fountain',
    category: 'interactive',
    theme: 'bioluminescent_grotto',
    icon: '💧',
    previewColor: '#00f0ff',
    accentColor: '#06b6d4',
    cost: 7800,
    unlockedLevel: 2,
    description: 'Carved jade basin bubbling with sweet luminous spring water.',
    interactiveType: 'fountain',
    soundTrigger: 'chime',
  },
  {
    id: 'furn_quartz_bed',
    name: 'Amethyst Quartz Crystal Cradle',
    category: 'seating',
    theme: 'bioluminescent_grotto',
    icon: '🔮',
    previewColor: '#8b5cf6',
    accentColor: '#c084fc',
    cost: 9200,
    unlockedLevel: 3,
    description: 'Hollow geode bed lined with downy violet velvet and warm thermal crystals.',
    interactiveType: 'cushion',
    soundTrigger: 'purr',
  },

  // 3. Retro Cozy Plush Set
  {
    id: 'furn_patchwork_pillows',
    name: 'Oversized Patchwork Floor Pillows',
    category: 'seating',
    theme: 'retro_plush',
    icon: '🛋️',
    previewColor: '#f43f5e',
    accentColor: '#fb7185',
    cost: 3800,
    unlockedLevel: 1,
    description: 'Massive quilted pillows stitched from pastel corduroy, sherpa, and velvet.',
    interactiveType: 'cushion',
    soundTrigger: 'purr',
  },
  {
    id: 'furn_log_fireplace',
    name: 'Hollow-Log Bioluminescent Fireplace',
    category: 'lighting',
    theme: 'retro_plush',
    icon: '🪵',
    previewColor: '#f97316',
    accentColor: '#ea580c',
    cost: 7200,
    unlockedLevel: 2,
    description: 'A cozy hollow birch log crackling with smokeless violet and cyan fairy flames.',
    interactiveType: 'fireplace',
    soundTrigger: 'chime',
  },
  {
    id: 'furn_retro_lofi_radio',
    name: 'Antique Pastel Tube Radio',
    category: 'interactive',
    theme: 'retro_plush',
    icon: '📻',
    previewColor: '#38bdf8',
    accentColor: '#0284c7',
    cost: 6500,
    unlockedLevel: 2,
    description: 'Cream-colored vintage radio playing calming subterranean lofi beats.',
    interactiveType: 'radio',
    soundTrigger: 'lofi',
  },
  {
    id: 'furn_reed_shelving',
    name: 'Woven Reed Trinket Shelf',
    category: 'accent',
    theme: 'retro_plush',
    icon: '🪴',
    previewColor: '#84cc16',
    accentColor: '#65a30d',
    cost: 4800,
    unlockedLevel: 1,
    description: 'Curved bamboo shelving holding tiny crystal jars, dried tea herbs, and books.',
    interactiveType: 'cushion',
    soundTrigger: 'chime',
  },
  {
    id: 'furn_hanging_egg_chair',
    name: 'Suspended Wicker Egg Chair',
    category: 'seating',
    theme: 'retro_plush',
    icon: '🪑',
    previewColor: '#fbbf24',
    accentColor: '#f59e0b',
    cost: 5400,
    unlockedLevel: 1,
    description: 'A cozy suspended woven pod lined with sheepskin fluff where mascots curl into tight fuzzy balls.',
    interactiveType: 'cushion',
    soundTrigger: 'purr',
  },
  {
    id: 'furn_squishy_beanbag',
    name: 'Neon Dough Beanbag',
    category: 'seating',
    theme: 'cyber_pastel',
    icon: '🛋️',
    previewColor: '#ec4899',
    accentColor: '#d946ef',
    cost: 4600,
    unlockedLevel: 1,
    description: 'Ultra-squishy oversized memory gel beanbag that rebounds enthusiastically when bounced on.',
    interactiveType: 'trampoline',
    soundTrigger: 'bounce',
  },
  {
    id: 'furn_canopy_loft_bed',
    name: 'Bioluminescent Loft Snooze Bed',
    category: 'seating',
    theme: 'bioluminescent_grotto',
    icon: '🛏️',
    previewColor: '#00f0ff',
    accentColor: '#06b6d4',
    cost: 8800,
    unlockedLevel: 2,
    description: 'Two-tier carved root loft framed in glowing fairy vines and downy star moss cushions.',
    interactiveType: 'cushion',
    soundTrigger: 'purr',
  },
];

export interface DenWallCubby {
  id: string;
  name: string;
  icon: string;
  side: 'left' | 'right';
  description: string;
  itemHeldEmoji: string;
  mascotQuote: string;
  glowColor: string;
}

export interface DenChamberDefinition {
  id: string;
  name: string;
  tierLevel: string;
  depthMeters: number;
  shapeSilhouette: 'split_level_dome' | 'teardrop_alcove' | 'arched_cavern' | 'geode_core' | 'observatory_dome';
  bgGradient: string;
  wallStrataColor: string;
  neonAccent: string;
  excavationCost: number; // 0 = unlocked initially, >0 = expandable excavation
  excavationRewardCoins: number;
  description: string;
  transitConnector: {
    type: 'pipe' | 'ladder' | 'slide';
    label: string;
    icon: string;
  };
  wallCubby?: DenWallCubby;
  snapNodes: Array<{
    id: 'left' | 'center' | 'right';
    label: string;
    defaultZ: number;
  }>;
}

export const DEN_CHAMBERS: DenChamberDefinition[] = [
  {
    id: 'chamber_hearth',
    name: 'Velvet Moss Living Hearth',
    tierLevel: 'Stratum Tier 1 (Shallow Soil)',
    depthMeters: 4,
    shapeSilhouette: 'split_level_dome',
    bgGradient: 'from-[#231535] via-[#14122c] to-[#0c0d24]',
    wallStrataColor: '#3b2447',
    neonAccent: '#ec4899',
    excavationCost: 0,
    excavationRewardCoins: 0,
    description: 'A warm subterranean hub featuring split-level moss domes and a crackling bioluminescent hearth.',
    transitConnector: {
      type: 'pipe',
      label: 'Translucent Neon Suction Chute 🚀',
      icon: '🌀',
    },
    wallCubby: {
      id: 'cubby_bookshelf',
      name: 'Tiny Bookshelf Burrow',
      icon: '📚',
      side: 'left',
      description: 'Carved mini alcove packed with neon spellbooks & steaming chamomile moss tea.',
      itemHeldEmoji: '📖',
      mascotQuote: 'Found the comfiest nook to read tiny subterranean scrolls!',
      glowColor: '#fbbf24',
    },
    snapNodes: [
      { id: 'left', label: 'Left Nook', defaultZ: 10 },
      { id: 'center', label: 'Hearth Center', defaultZ: 20 },
      { id: 'right', label: 'Reading Loft', defaultZ: 10 },
    ],
  },
  {
    id: 'chamber_grotto',
    name: 'Bioluminescent Dew Grotto',
    tierLevel: 'Stratum Tier 1 (East Hydro-Vein)',
    depthMeters: 8,
    shapeSilhouette: 'teardrop_alcove',
    bgGradient: 'from-[#0b2938] via-[#091a29] to-[#06111f]',
    wallStrataColor: '#12394c',
    neonAccent: '#06b6d4',
    excavationCost: 0,
    excavationRewardCoins: 0,
    description: 'A tranquil teardrop alcove fed by slow-dripping subterranean crystal springs.',
    transitConnector: {
      type: 'ladder',
      label: 'Curled Glow-Root Spiral Ladder 🪜',
      icon: '🌿',
    },
    wallCubby: {
      id: 'cubby_snack',
      name: 'Glowing Nectar & Mochi Cupboard',
      icon: '🍯',
      side: 'right',
      description: 'Secret carved larder stocked with glowing berry nectar jars and chewy mochi sweets.',
      itemHeldEmoji: '🧃',
      mascotQuote: 'Sneaking sweet neon berry gummies inside the wall pantry!',
      glowColor: '#38bdf8',
    },
    snapNodes: [
      { id: 'left', label: 'Spring Shore', defaultZ: 10 },
      { id: 'center', label: 'Pool Deck', defaultZ: 20 },
      { id: 'right', label: 'Grotto Perch', defaultZ: 10 },
    ],
  },
  {
    id: 'chamber_arcade',
    name: 'Cyber-Pastel Rhythm Sandbox',
    tierLevel: 'Stratum Tier 2 (Quartz Bedrock)',
    depthMeters: 14,
    shapeSilhouette: 'arched_cavern',
    bgGradient: 'from-[#2e1045] via-[#1a0e2e] to-[#0d071b]',
    wallStrataColor: '#451a5c',
    neonAccent: '#a855f7',
    excavationCost: 0,
    excavationRewardCoins: 0,
    description: 'A wide arched cavern outfitted with springy anti-gravity pads and pastel wireframes.',
    transitConnector: {
      type: 'slide',
      label: 'Smooth Earthen Slide & Rail 🛝',
      icon: '🎢',
    },
    wallCubby: {
      id: 'cubby_telescope',
      name: 'Crystal Spyhole Alcove',
      icon: '🔭',
      side: 'left',
      description: 'A miniature viewing hollow with an amethyst prism lens peering into deeper strata.',
      itemHeldEmoji: '🔮',
      mascotQuote: 'Peeking through the gem lens at subterranean glow-critters!',
      glowColor: '#c084fc',
    },
    snapNodes: [
      { id: 'left', label: 'Bounce Pad', defaultZ: 10 },
      { id: 'center', label: 'Rhythm Stage', defaultZ: 20 },
      { id: 'right', label: 'Lofi Corner', defaultZ: 10 },
    ],
  },
  {
    id: 'chamber_geode_core',
    name: 'Amethyst Geode Sanctuary',
    tierLevel: 'Stratum Tier 3 (Deep Crystal Core)',
    depthMeters: 22,
    shapeSilhouette: 'geode_core',
    bgGradient: 'from-[#2c1338] via-[#1c0d27] to-[#0e0716]',
    wallStrataColor: '#531b61',
    neonAccent: '#e879f9',
    excavationCost: 6500,
    excavationRewardCoins: 2500,
    description: 'A breathtaking hollow geode lined with thermal purple quartz spikes and warm resonant echoes.',
    transitConnector: {
      type: 'pipe',
      label: 'Deep Pressure Quartz Chute 💎',
      icon: '✨',
    },
    wallCubby: {
      id: 'cubby_nap',
      name: 'Sleepy Glow-Beetle Hammock',
      icon: '🪲',
      side: 'right',
      description: 'Velvety cocoon hollow with a sleepy neon-patterned pet bug companion.',
      itemHeldEmoji: '✨',
      mascotQuote: 'Cuddling with a drowsy glow-bug in the deep crystal wall!',
      glowColor: '#f472b6',
    },
    snapNodes: [
      { id: 'left', label: 'Thermal Geode', defaultZ: 10 },
      { id: 'center', label: 'Geode Basin', defaultZ: 20 },
      { id: 'right', label: 'Echo Ledge', defaultZ: 10 },
    ],
  },
  {
    id: 'chamber_observatory',
    name: 'Star-Drop Core Observatory',
    tierLevel: 'Stratum Tier 4 (Abyssal Geosphere)',
    depthMeters: 32,
    shapeSilhouette: 'observatory_dome',
    bgGradient: 'from-[#1b1c3e] via-[#0f1129] to-[#070817]',
    wallStrataColor: '#242857',
    neonAccent: '#38bdf8',
    excavationCost: 12000,
    excavationRewardCoins: 5000,
    description: 'Grand split-level subterranean dome illuminated by suspended cosmic stardust lanterns and bioluminescent water sprites.',
    transitConnector: {
      type: 'ladder',
      label: 'Abyssal Vine Ascension Spiral 🌌',
      icon: '🌠',
    },
    wallCubby: {
      id: 'cubby_stardust',
      name: 'Stardust Wishing Hollow',
      icon: '⭐',
      side: 'left',
      description: 'Ancient carved geode holding swirling captured cosmic stardust particles.',
      itemHeldEmoji: '🌟',
      mascotQuote: 'Making wishes on subterranean shooting stars!',
      glowColor: '#38bdf8',
    },
    snapNodes: [
      { id: 'left', label: 'Star Lens', defaultZ: 10 },
      { id: 'center', label: 'Grand Dais', defaultZ: 20 },
      { id: 'right', label: 'Stardust Rail', defaultZ: 10 },
    ],
  },
];
