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
  voiceName: 'Kore' | 'Puck' | 'Aoede' | 'Zephyr' | 'Fenrir';
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

export type AchievementCategory = 'wealth' | 'burrow' | 'puzzles' | 'mascots' | 'adventure';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  category: AchievementCategory;
  emoji: string;
  target: number;
  unit?: string;
  rewardCoins: number;
  rewardRolls: number;
  rewardPoints: number;
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

export interface DailyFeaturedClaim {
  date: string;
  puzzleId: string;
  puzzleTitle: string;
  coinsEarned: number;
  diceEarned: number;
  uniqueRewardName: string;
  timestamp: number;
}

export interface DailyFeaturedPuzzleState {
  lastCompletedDate?: string;
  consecutiveStreak: number;
  totalCompletedCount: number;
  claimedHistory: DailyFeaturedClaim[];
}

export interface BurrowTradeItem {
  id: string;
  name: string;
  category: 'seating' | 'table' | 'rug' | 'lighting' | 'shelving' | 'chest' | 'bed' | 'decor' | 'crystals' | 'wall_art';
  setId: 'toadstool_forest' | 'bioluminescent_grotto' | 'sweet_pastels' | 'deep_sea_coral' | 'celestial_aurora';
  setName: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  description: string;
  previewColor: string;
  accentColor: string;
  cozyAuraBonus: number;
}

export interface BurrowCollectionSet {
  id: string;
  name: string;
  theme: string;
  icon: string;
  badgeColor: string;
  gradient: string;
  itemIds: string[];
  completionReward: {
    coins: number;
    diceBonus: number;
    title: string;
    cozyAuraBoost: number;
  };
}

export interface GlobalTradeOffer {
  id: string;
  traderName: string;
  traderCountry: string;
  traderCountryFlag: string;
  traderMascot: string;
  traderAvatarColor: string;
  traderRating: number;
  wantsItemId: string;
  offersItemId: string;
  status: 'available' | 'completed';
  postedTimeAgo: string;
  isFeaturedRequest?: boolean;
}

export interface PlayerTradeListing {
  id: string;
  offeringItemId: string;
  requestingItemId: string | 'any_missing';
  postedAt: number;
  status: 'active' | 'matched' | 'completed';
}

export interface TradeLogEntry {
  id: string;
  traderName: string;
  givenItemName: string;
  givenItemIcon: string;
  receivedItemName: string;
  receivedItemIcon: string;
  completedAt: string;
  setCompleted?: string;
}

export interface TradingPostState {
  inventory: Record<string, number>; // itemId -> count
  completedSetIds: string[];
  playerListings: PlayerTradeListing[];
  tradeHistory: TradeLogEntry[];
  courierCooldownUntil?: number;
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
  dailyFeatured?: DailyFeaturedPuzzleState;
  mascotLevels?: Record<string, number>;
  undergroundDen?: {
    unlockedFurnitureIds: string[];
    roomPlacements: Record<string, string>; // slotId -> furnitureId
    dayNightMode?: 'auto' | 'day' | 'night';
    excavatedChamberIds?: string[]; // IDs of dug-out cavern chambers
    mascotLocation?: {
      chamberId: string; // 'surface' or chamber ID
      nodeId?: 'left' | 'center' | 'right' | 'cubby';
      cubbyId?: string;
      action?: 'idle' | 'snuggle' | 'sleeping' | 'bouncing' | 'lofi_dance' | 'in_cubby';
    };
  };
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
  tradingPost?: TradingPostState;
  claimedAchievementIds?: string[];
}
