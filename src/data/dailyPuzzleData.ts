import { PuzzleCategory } from '../components/PuzzleHubModal';

export interface UniqueDailyReward {
  id: string;
  name: string;
  icon: string;
  rarity: 'rare' | 'epic' | 'legendary';
  perkText: string;
  description: string;
}

export interface DailyFeaturedPuzzle {
  id: string;
  dayIndex: number; // 0 to 6
  category: PuzzleCategory;
  title: string;
  badge: string;
  icon: string;
  tagline: string;
  description: string;
  objective: string;
  bonusCoins: number;
  bonusDice: number;
  bonusShield: number;
  bonusXp: number;
  uniqueReward: UniqueDailyReward;
  accentColor: string;
  borderGlow: string;
  bannerGradient: string;
}

// 7 distinct rotating daily featured challenges (one for each 24h cycle)
export const ROTATING_DAILY_PUZZLES: DailyFeaturedPuzzle[] = [
  {
    id: 'daily-wordfind-fauna',
    dayIndex: 0,
    category: 'word_find',
    title: 'Neon Word Hunt: Cyber Fauna',
    badge: 'Word Find Day',
    icon: '🔤',
    tagline: 'Track down hidden cyber flora & mascot species in the neon matrix!',
    description: 'A 24-hour botanical word matrix. Find all hidden secret words to claim the botanical bounty.',
    objective: 'Solve the complete Word Find grid',
    bonusCoins: 25000,
    bonusDice: 15,
    bonusShield: 1,
    bonusXp: 220,
    uniqueReward: {
      id: 'reward-golden-leaf-totem',
      name: 'Golden Dewleaf Talisman',
      icon: '🍃',
      rarity: 'epic',
      perkText: '+1 Max Shield & +25% Board Coin Magnetism',
      description: 'An ancient dewdrop leaf blessed by Pip that shimmers with perpetual sunlight.',
    },
    accentColor: '#00f0ff',
    borderGlow: 'rgba(0, 240, 255, 0.45)',
    bannerGradient: 'from-cyan-950 via-slate-900 to-indigo-950',
  },
  {
    id: 'daily-crossword-quantum',
    dayIndex: 1,
    category: 'crossword',
    title: 'Quantum Gridlock 5x5 Crossword',
    badge: 'Mini Crossword Day',
    icon: '✍️',
    tagline: 'Crack the cyber crossword encryption across all intersecting clues!',
    description: 'Solve the daily neon mini crossword. Decrypt all across and down entries before the timer resets.',
    objective: 'Fill all grid cells correctly with zero unresolved clues',
    bonusCoins: 30000,
    bonusDice: 18,
    bonusShield: 1,
    bonusXp: 260,
    uniqueReward: {
      id: 'reward-quantum-cipher-key',
      name: 'Quantum Cipher Core',
      icon: '🔑',
      rarity: 'legendary',
      perkText: 'Instantly grants +10 Energy Dice & Mascot XP surge',
      description: 'A glowing neon prism key capable of unlocking encrypted daily bonus caches.',
    },
    accentColor: '#d946ef',
    borderGlow: 'rgba(217, 70, 239, 0.45)',
    bannerGradient: 'from-fuchsia-950 via-slate-900 to-pink-950',
  },
  {
    id: 'daily-blockstack-blitz',
    dayIndex: 2,
    category: 'block_stack',
    title: 'Tetromino Hyper-Stack Blitz',
    badge: 'Block Stacker Day',
    icon: '🕹️',
    tagline: 'Clear neon lines and unleash hyper combos in the Block Stacker arena!',
    description: 'High-voltage block clearing challenge! Drop, rotate, and clear lines to hit the jackpot threshold.',
    objective: 'Score points & clear lines in the Tetromino Stacker',
    bonusCoins: 35000,
    bonusDice: 20,
    bonusShield: 1,
    bonusXp: 300,
    uniqueReward: {
      id: 'reward-prismatic-tetrad',
      name: 'Prismatic Tetrad Shard',
      icon: '💎',
      rarity: 'legendary',
      perkText: 'Boosts all arcade minigame payouts by +25%',
      description: 'A crystalline neon block vibrating with four harmonious geometric frequencies.',
    },
    accentColor: '#f59e0b',
    borderGlow: 'rgba(245, 158, 11, 0.45)',
    bannerGradient: 'from-amber-950 via-slate-900 to-yellow-950',
  },
  {
    id: 'daily-laser-overdrive',
    dayIndex: 3,
    category: 'laser_stack',
    title: 'Laser Slicer Apex Tower',
    badge: 'Laser Tower Day',
    icon: '⚡',
    tagline: 'Time your laser slice with surgical precision to stack to the sky!',
    description: 'Dynamic reflex challenge! Slice and align moving neon beams to build the tallest laser tower.',
    objective: 'Reach floor 6 or higher to trigger the Daily Apex Jackpot',
    bonusCoins: 28000,
    bonusDice: 16,
    bonusShield: 1,
    bonusXp: 240,
    uniqueReward: {
      id: 'reward-overclocked-aegis',
      name: 'Overclocked Laser Aegis',
      icon: '🛡️',
      rarity: 'epic',
      perkText: 'Refills your energy shields instantly to maximum capacity',
      description: 'A hardened photonic shield generator tuned to absorb rival raid attacks.',
    },
    accentColor: '#f43f5e',
    borderGlow: 'rgba(244, 63, 94, 0.45)',
    bannerGradient: 'from-rose-950 via-slate-900 to-red-950',
  },
  {
    id: 'daily-reflex-matrix',
    dayIndex: 4,
    category: 'reflex',
    title: 'Cyber Pulse & Lock Reflex Arena',
    badge: 'Reflex Speed Day',
    icon: '🎯',
    tagline: 'Test your reflexes with rhythm pulses, laser strikes & cyber locks!',
    description: 'Pure reaction speed trial. Survive incoming pulses and deflections to achieve legendary combo streaks.',
    objective: 'Survive the reflex challenges with at least a 3x combo streak',
    bonusCoins: 32000,
    bonusDice: 18,
    bonusShield: 1,
    bonusXp: 280,
    uniqueReward: {
      id: 'reward-dragonfly-spark',
      name: 'Iridescent Dragonfly Brooch',
      icon: '✨',
      rarity: 'epic',
      perkText: 'Prevents combo streak reset on your next 3 puzzle misses',
      description: 'Shimmering turquoise dragonfly wing motif inspired by Ziggy’s sanctuary companions.',
    },
    accentColor: '#10b981',
    borderGlow: 'rgba(16, 185, 129, 0.45)',
    bannerGradient: 'from-emerald-950 via-slate-900 to-teal-950',
  },
  {
    id: 'daily-wordfind-sanctuary',
    dayIndex: 5,
    category: 'word_find',
    title: 'Sanctuary Mascot Word Expedition',
    badge: 'Word Find Day',
    icon: '🔤',
    tagline: 'Uncover the hidden names and powers of Pip, Boba, Ziggy, Kora & Lulu!',
    description: 'Special sanctuary edition! Hunt down words honoring our beloved fuzzy mascot champions.',
    objective: 'Complete the Mascot Sanctuary word grid',
    bonusCoins: 26000,
    bonusDice: 16,
    bonusShield: 1,
    bonusXp: 230,
    uniqueReward: {
      id: 'reward-bioluminescent-coral',
      name: 'Bioluminescent Coral Branch',
      icon: '🪸',
      rarity: 'epic',
      perkText: '+150 Mascot Energy per hour in your burrows habitat',
      description: 'Luminous cyan sea branch blessed by Kora that radiates calming oceanic tranquility.',
    },
    accentColor: '#06b6d4',
    borderGlow: 'rgba(6, 182, 212, 0.45)',
    bannerGradient: 'from-cyan-950 via-slate-900 to-blue-950',
  },
  {
    id: 'daily-crossword-vault',
    dayIndex: 6,
    category: 'crossword',
    title: 'Neon Vault Cryptic Crossword',
    badge: 'Mini Crossword Day',
    icon: '✍️',
    tagline: 'Crack the vault code with crisp cyber vocabulary across the 4x4 matrix!',
    description: 'Fast-paced high-stakes crossword decryption designed to test your cyber wits.',
    objective: 'Solve all across and down words in the 4x4 neon vault',
    bonusCoins: 30000,
    bonusDice: 18,
    bonusShield: 1,
    bonusXp: 260,
    uniqueReward: {
      id: 'reward-butterfly-charm',
      name: 'Cerulean Butterfly Brooch',
      icon: '🦋',
      rarity: 'legendary',
      perkText: '+50% Bonus Coin chance on all daily board hop tiles',
      description: 'A delicate blue butterfly emblem inspired by Boba’s sweet woodland friend.',
    },
    accentColor: '#8b5cf6',
    borderGlow: 'rgba(139, 92, 246, 0.45)',
    bannerGradient: 'from-purple-950 via-slate-900 to-indigo-950',
  },
];

/**
 * Returns the current date in YYYY-MM-DD format (UTC)
 */
export function getTodayDateString(): string {
  const d = new Date();
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Deterministically gets the featured puzzle for any given date
 */
export function getDailyFeaturedPuzzle(date = new Date()): DailyFeaturedPuzzle {
  // Days since UTC epoch
  const utcMs = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  const dayNumber = Math.floor(utcMs / (1000 * 60 * 60 * 24));
  const puzzleIdx = Math.abs(dayNumber) % ROTATING_DAILY_PUZZLES.length;
  return ROTATING_DAILY_PUZZLES[puzzleIdx];
}

/**
 * Returns remaining time until next UTC midnight reset
 */
export function getTimeUntilDailyReset(): {
  hours: number;
  minutes: number;
  seconds: number;
  formatted: string;
} {
  const now = new Date();
  const tomorrowUtc = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1,
    0,
    0,
    0
  );
  const diffMs = Math.max(0, tomorrowUtc - now.getTime());

  const totalSecs = Math.floor(diffMs / 1000);
  const hours = Math.floor(totalSecs / 3600);
  const minutes = Math.floor((totalSecs % 3600) / 60);
  const seconds = totalSecs % 60;

  const hh = String(hours).padStart(2, '0');
  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');

  return {
    hours,
    minutes,
    seconds,
    formatted: `${hh}h ${mm}m ${ss}s`,
  };
}
