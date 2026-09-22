export interface MascotAbility {
  name: string;
  description: string;
  effectType: 'slow_time' | 'bonus_coins' | 'streak_shield' | 'lucky_dice';
  multiplier: number;
}

export interface Mascot {
  id: string;
  name: string;
  title: string;
  personality: string;
  hairColors: string[]; // Multicolored fuzzy hair
  furColor: string;
  eyesColor: string;
  earStyle: 'bunny' | 'bear' | 'cat' | 'tuft' | 'fluff';
  voiceName: 'Kore' | 'Puck' | 'Zephyr' | 'Fenrir';
  uniqueAbility: MascotAbility;
  level: number;
  cheerQuote: string;
  originStory?: string;
  isCustom?: boolean;
  customPhotoUrl?: string;
}

export type BoardTileType = 
  | 'coin_small'
  | 'coin_big'
  | 'puzzle_challenge'
  | 'landmark_star'
  | 'mascot_energy'
  | 'mystery_chest'
  | 'daily_trivia'
  | 'friend_raid'
  | 'shield_vault';

export interface BoardTile {
  index: number;
  id: string;
  type: BoardTileType;
  name: string;
  iconName: string;
  rewardValue: number;
  neonColor: string;
  description: string;
}

export interface Landmark {
  id: string;
  name: string;
  description: string;
  icon: string;
  currentLevel: number;
  maxLevel: number;
  costPerLevel: number[];
  rewardStars: number;
  visualTheme: 'neon_treehouse' | 'synth_diner' | 'glow_fountain' | 'dj_deck' | 'arcade_tower' | 'coaster';
}

export interface Town {
  id: string;
  name: string;
  subtitle: string;
  worldNumber: number;
  themeColor: string;
  backgroundGradient: string;
  landmarks: Landmark[];
  completionRewardCoins: number;
  completionRewardRolls: number;
}

export type ReflexGameType = 'pulse_matrix' | 'laser_slicer' | 'cyber_lock' | 'warp_sequence';

export interface ReflexChallenge {
  type: ReflexGameType;
  title: string;
  instructions: string;
  timeLimitMs: number;
  targetCount: number;
  difficulty: number;
}

export interface TriviaQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  sources?: Array<{ title: string; uri: string }>;
  searchTopic?: string;
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  country: string;
  score: number;
  townLevel: number;
  mascot: string;
  avatarColor: string;
}

export interface PlayerStats {
  puzzlesSolved: number;
  perfectCombos: number;
  townsCompleted: number;
  totalCoinsEarned: number;
  highestStreak: number;
}

export interface BurrowStyleOption {
  id: string;
  name: string;
  description: string;
  icon: string;
  previewColor: string;
  accentColor: string;
  visualTag: string;
}

export interface BurrowFeature {
  id: string;
  category: 'nest' | 'activity' | 'snack' | 'decor';
  title: string;
  level: number;
  maxLevel: number;
  costPerLevel: number[];
  selectedStyleId: string;
  styles: BurrowStyleOption[];
}

export interface MascotBurrow {
  mascotId: string;
  name: string;
  subtitle: string;
  themeColor: string;
  bgGradient: string;
  ambientVibe: string;
  features: BurrowFeature[];
}

export interface DailyStreakState {
  currentStreak: number;
  lastLoginDate: string;
  claimedToday: boolean;
  totalDaysClaimed: number;
}

export interface GameState {
  playerName: string;
  coins: number;
  rolls: number;
  maxRolls: number;
  rollMultiplier: number;
  playerLevel: number;
  xp: number;
  xpToNextLevel: number;
  townIndex: number;
  towns: Town[];
  activeMascotId: string;
  unlockedMascotIds: string[];
  customMascots: Mascot[];
  currentTileIndex: number;
  shields: number;
  maxShields: number;
  stats: PlayerStats;
  dailyStreak?: DailyStreakState;
  mascotLevels?: Record<string, number>;
  burrows?: Record<
    string,
    {
      features: Record<
        string,
        {
          level: number;
          selectedStyleId: string;
        }
      >;
    }
  >;
}
