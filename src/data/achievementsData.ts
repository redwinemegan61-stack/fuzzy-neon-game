import { Achievement, GameState, MascotBurrow } from '../types';

export const ACHIEVEMENTS: Achievement[] = [
  // 1. Wealth & Fortune
  {
    id: 'first_1000_coins',
    title: 'First 1,000 Coins',
    description: 'Amass or earn your first 1,000 coins across your neon board adventure.',
    category: 'wealth',
    emoji: '🪙',
    target: 1000,
    unit: '🪙',
    rewardCoins: 500,
    rewardRolls: 5,
    rewardPoints: 10,
  },
  {
    id: 'coin_hoarder_10k',
    title: 'High Roller Stash',
    description: 'Accumulate 10,000 total coins in your sparkling vault.',
    category: 'wealth',
    emoji: '💰',
    target: 10000,
    unit: '🪙',
    rewardCoins: 2000,
    rewardRolls: 8,
    rewardPoints: 25,
  },
  {
    id: 'neon_tycoon_50k',
    title: 'Neon Tycoon',
    description: 'Reach 50,000 total coins earned throughout your journey.',
    category: 'wealth',
    emoji: '💎',
    target: 50000,
    unit: '🪙',
    rewardCoins: 5000,
    rewardRolls: 15,
    rewardPoints: 50,
  },
  {
    id: 'shield_vault_max',
    title: 'Ironclad Vault',
    description: 'Arm yourself with 3 full shields to protect your town from rival heists.',
    category: 'wealth',
    emoji: '🛡️',
    target: 3,
    unit: 'Shields',
    rewardCoins: 1200,
    rewardRolls: 5,
    rewardPoints: 15,
  },

  // 2. Burrows & Cozy Customization
  {
    id: 'cozy_renovation',
    title: 'Cozy Renovation',
    description: 'Upgrade any room feature in any burrow to Level 2 or higher.',
    category: 'burrow',
    emoji: '🪑',
    target: 1,
    unit: 'Room Upgraded',
    rewardCoins: 800,
    rewardRolls: 4,
    rewardPoints: 15,
  },
  {
    id: 'full_burrow_upgrade',
    title: 'Full Burrow Upgrade',
    description: 'Fully max out all 4 room features in any mascot burrow.',
    category: 'burrow',
    emoji: '🏡',
    target: 4,
    unit: 'Maxed Rooms',
    rewardCoins: 6000,
    rewardRolls: 12,
    rewardPoints: 60,
  },
  {
    id: 'burrow_master_collector',
    title: 'Burrow Master Artisan',
    description: 'Upgrade at least 6 total rooms across your mascot sanctuaries.',
    category: 'burrow',
    emoji: '✨',
    target: 6,
    unit: 'Rooms Lv.2+',
    rewardCoins: 3500,
    rewardRolls: 8,
    rewardPoints: 40,
  },
  {
    id: 'cavern_excavator',
    title: 'Cavern Excavator',
    description: 'Excavate 2 or more underground cavern den chambers.',
    category: 'burrow',
    emoji: '⛏️',
    target: 2,
    unit: 'Chambers',
    rewardCoins: 2500,
    rewardRolls: 6,
    rewardPoints: 30,
  },

  // 3. Reflex Puzzles & Combos
  {
    id: 'reflex_novice',
    title: 'Quick Reflexes',
    description: 'Solve 3 reflex puzzle challenges on the game board.',
    category: 'puzzles',
    emoji: '⚡',
    target: 3,
    unit: 'Puzzles',
    rewardCoins: 1000,
    rewardRolls: 5,
    rewardPoints: 15,
  },
  {
    id: 'combo_blaze_5x',
    title: 'Combo Blaze',
    description: 'Achieve a 5X or higher reflex combo streak during puzzles.',
    category: 'puzzles',
    emoji: '🔥',
    target: 5,
    unit: 'Combo Streak',
    rewardCoins: 1800,
    rewardRolls: 6,
    rewardPoints: 25,
  },
  {
    id: 'puzzle_virtuoso_12',
    title: 'Puzzle Virtuoso',
    description: 'Successfully solve 12 reflex puzzle challenges.',
    category: 'puzzles',
    emoji: '🎯',
    target: 12,
    unit: 'Puzzles Solved',
    rewardCoins: 4000,
    rewardRolls: 10,
    rewardPoints: 50,
  },

  // 4. Mascots & Companion Bonds
  {
    id: 'mascot_awakening_lv2',
    title: 'Fuzzy Awakening',
    description: 'Level up any companion mascot to Level 2 or higher in the Sanctuary.',
    category: 'mascots',
    emoji: '🐾',
    target: 2,
    unit: 'Mascot Level',
    rewardCoins: 1500,
    rewardRolls: 5,
    rewardPoints: 20,
  },
  {
    id: 'full_fuzzy_squad',
    title: 'Fuzzy Squad Assembly',
    description: 'Have 5 or more companion mascots in your active roster.',
    category: 'mascots',
    emoji: '🌟',
    target: 5,
    unit: 'Mascots',
    rewardCoins: 3000,
    rewardRolls: 8,
    rewardPoints: 35,
  },

  // 5. Adventure & Trading
  {
    id: 'town_architect',
    title: 'Town Builder',
    description: 'Upgrade landmarks and advance beyond your starting town.',
    category: 'adventure',
    emoji: '🌆',
    target: 1,
    unit: 'Town Finished',
    rewardCoins: 3000,
    rewardRolls: 10,
    rewardPoints: 35,
  },
  {
    id: 'trading_post_collector',
    title: 'Trading Post Pioneer',
    description: 'Collect or swap 3 or more decorative burrow pieces in the Trading Post.',
    category: 'adventure',
    emoji: '🔄',
    target: 3,
    unit: 'Items/Trades',
    rewardCoins: 2000,
    rewardRolls: 6,
    rewardPoints: 25,
  },
  {
    id: 'daily_streak_spark',
    title: 'Daily Dedication',
    description: 'Achieve a 2-day daily login streak or solve a Daily Featured Puzzle.',
    category: 'adventure',
    emoji: '📅',
    target: 2,
    unit: 'Streak Days',
    rewardCoins: 2500,
    rewardRolls: 6,
    rewardPoints: 30,
  },
];

export interface AchievementProgress {
  current: number;
  target: number;
  percent: number;
  isCompleted: boolean;
  isClaimed: boolean;
}

export function getAchievementProgress(
  achievement: Achievement,
  gameState: GameState,
  currentBurrows?: Record<string, MascotBurrow>
): AchievementProgress {
  const isClaimed = Boolean(gameState.claimedAchievementIds?.includes(achievement.id));
  let current = 0;

  switch (achievement.id) {
    case 'first_1000_coins':
    case 'coin_hoarder_10k':
    case 'neon_tycoon_50k':
      current = Math.max(gameState.coins, gameState.stats?.totalCoinsEarned || 0);
      break;

    case 'shield_vault_max':
      current = gameState.shields || 0;
      break;

    case 'cozy_renovation': {
      let upgradedCount = 0;
      if (currentBurrows) {
        Object.values(currentBurrows).forEach((b) => {
          b.features.forEach((f) => {
            if (f.level >= 2) upgradedCount++;
          });
        });
      }
      current = upgradedCount;
      break;
    }

    case 'full_burrow_upgrade': {
      // Find burrow with the most max-level features
      let maxFullFeatures = 0;
      if (currentBurrows) {
        Object.values(currentBurrows).forEach((b) => {
          const maxed = b.features.filter((f) => f.level >= f.maxLevel).length;
          if (maxed > maxFullFeatures) maxFullFeatures = maxed;
        });
      }
      current = maxFullFeatures;
      break;
    }

    case 'burrow_master_collector': {
      let totalLv2Plus = 0;
      if (currentBurrows) {
        Object.values(currentBurrows).forEach((b) => {
          b.features.forEach((f) => {
            if (f.level >= 2) totalLv2Plus++;
          });
        });
      }
      current = totalLv2Plus;
      break;
    }

    case 'cavern_excavator':
      current = (gameState.undergroundDen?.excavatedChamberIds || []).length;
      break;

    case 'reflex_novice':
    case 'puzzle_virtuoso_12':
      current = gameState.stats?.puzzlesSolved || 0;
      break;

    case 'combo_blaze_5x':
      current = gameState.stats?.highestStreak || 0;
      break;

    case 'mascot_awakening_lv2': {
      const levels = Object.values(gameState.mascotLevels || {});
      current = levels.length > 0 ? Math.max(...levels) : 1;
      break;
    }

    case 'full_fuzzy_squad':
      current = gameState.unlockedMascotIds?.length || 0;
      break;

    case 'town_architect':
      current = Math.max(gameState.stats?.townsCompleted || 0, gameState.townIndex || 0);
      break;

    case 'trading_post_collector': {
      const invCount = Object.values(gameState.tradingPost?.inventory || {}).reduce(
        (a, b) => a + b,
        0
      );
      const tradesCount = gameState.tradingPost?.tradeHistory?.length || 0;
      current = invCount + tradesCount;
      break;
    }

    case 'daily_streak_spark': {
      const streak = gameState.dailyStreak?.currentStreak || 1;
      const featuredStreak = gameState.dailyFeatured?.consecutiveStreak || 0;
      current = Math.max(streak, featuredStreak);
      break;
    }

    default:
      current = 0;
  }

  const cappedCurrent = Math.min(current, achievement.target);
  const percent = Math.min(100, Math.round((current / achievement.target) * 100));
  const isCompleted = current >= achievement.target;

  return {
    current: cappedCurrent,
    target: achievement.target,
    percent,
    isCompleted,
    isClaimed,
  };
}
