import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Dices, Building2, Home, Gamepad2, Tv } from 'lucide-react';
import { GameState, Mascot, BoardTile, LeaderboardEntry, Town, MascotBurrow } from './types';
import { INITIAL_MASCOTS, INITIAL_TOWNS, BOARD_TILES } from './data/gameData';
import { INITIAL_MASCOT_BURROWS, createCustomBurrow } from './data/burrowData';
import { SoundEngine } from './utils/sound';
import { MAX_MASCOT_LEVEL, getMascotUpgradeCost, calculateMascotMultiplier, getAbilityFormattedDescription } from './utils/mascotLeveling';
import { GameHeader } from './components/GameHeader';
import { GameBoard } from './components/GameBoard';
import { TownView } from './components/TownView';
import { MascotBurrowsView } from './components/MascotBurrowsView';
import { ReflexPuzzleModal } from './components/ReflexPuzzleModal';
import { PuzzleHubModal, PuzzleCategory } from './components/PuzzleHubModal';
import { MascotDetailModal } from './components/MascotDetailModal';
import { MascotScannerModal } from './components/MascotScannerModal';
import { TriviaModal } from './components/TriviaModal';
import { LeaderboardAndSocialModal } from './components/LeaderboardAndSocialModal';
import { RaidModal } from './components/RaidModal';
import { RewardChestModal } from './components/RewardChestModal';
import { PlayerLevelUpOverlay, LevelUpData } from './components/PlayerLevelUpOverlay';
import { DailyStreakModal } from './components/DailyStreakModal';
import { DailyFeaturedPuzzleCard } from './components/DailyFeaturedPuzzleCard';
import { DailyFeaturedRewardModal } from './components/DailyFeaturedRewardModal';
import { DailyFeaturedPuzzle, getDailyFeaturedPuzzle, getTodayDateString } from './data/dailyPuzzleData';
import { DailyFeaturedClaim } from './types';
import { StreakRewardTier } from './data/dailyStreakData';
import { TradingPostModal } from './components/TradingPostModal';
import { INITIAL_TRADING_POST_STATE, BURROW_TRADE_ITEMS } from './data/tradingPostData';
import { ACHIEVEMENTS, getAchievementProgress } from './data/achievementsData';
import { AdStationModal } from './components/AdStationModal';
import { BoardTileEventPopup, BoardTileEventData } from './components/BoardTileEventPopup';
import confetti from 'canvas-confetti';

const STORAGE_KEY = 'neon_fuzz_game_save_v1';

export default function App() {
  // Load saved state or use initial defaults
  const [gameState, setGameState] = useState<GameState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Ensure all 5 default mascots are included in unlocked list
        const defaultIds = ['pip', 'boba', 'ziggy', 'kora', 'lulu'];
        const mergedUnlocked = Array.from(new Set([...(parsed.unlockedMascotIds || []), ...defaultIds]));
        return {
          ...parsed,
          unlockedMascotIds: mergedUnlocked,
          mascotLevels: {
            pip: 1,
            boba: 1,
            ziggy: 1,
            kora: 1,
            lulu: 1,
            ...(parsed.mascotLevels || {}),
          },
          dailyFeatured: parsed.dailyFeatured || {
            consecutiveStreak: 0,
            totalCompletedCount: 0,
            claimedHistory: [],
          },
          tradingPost: parsed.tradingPost || INITIAL_TRADING_POST_STATE,
          claimedAchievementIds: parsed.claimedAchievementIds || [],
        };
      }
    } catch (e) {}

    return {
      playerName: 'NeonRider',
      coins: 8500,
      rolls: 40,
      maxRolls: 50,
      rollMultiplier: 1,
      playerLevel: 1,
      xp: 120,
      xpToNextLevel: 500,
      townIndex: 0,
      towns: INITIAL_TOWNS,
      activeMascotId: 'pip',
      unlockedMascotIds: ['pip', 'boba', 'ziggy', 'kora', 'lulu'],
      customMascots: [],
      currentTileIndex: 0,
      shields: 2,
      maxShields: 3,
      stats: {
        puzzlesSolved: 0,
        perfectCombos: 0,
        townsCompleted: 0,
        totalCoinsEarned: 8500,
        highestStreak: 0,
      },
      dailyStreak: {
        currentStreak: 1,
        lastLoginDate: '',
        claimedToday: false,
        totalDaysClaimed: 0,
      },
      dailyFeatured: {
        consecutiveStreak: 0,
        totalCompletedCount: 0,
        claimedHistory: [],
      },
      mascotLevels: { pip: 1, boba: 1, ziggy: 1, kora: 1, lulu: 1 },
      undergroundDen: {
        unlockedFurnitureIds: ['furn_holo_rug', 'furn_mushroom_stool', 'furn_patchwork_pillows', 'furn_hanging_egg_chair'],
        roomPlacements: {
          chamber_hearth_center: 'furn_patchwork_pillows',
          chamber_hearth_left: 'furn_log_fireplace',
          chamber_grotto_center: 'furn_mushroom_stool',
          chamber_grotto_right: 'furn_nectar_fountain',
          chamber_arcade_center: 'furn_holo_rug',
        },
        dayNightMode: 'auto',
        excavatedChamberIds: ['chamber_hearth', 'chamber_grotto', 'chamber_arcade'],
      },
      burrows: {},
      tradingPost: INITIAL_TRADING_POST_STATE,
      claimedAchievementIds: [],
    };
  });

  // Navigation tab: Board (main), Town, Puzzles/Arcade, Burrows, or Cinema Ads
  const [activeTab, setActiveTab] = useState<'board' | 'town' | 'arcade' | 'burrows' | 'cinema'>('board');

  // Animation & Gameplay flags
  const [isRolling, setIsRolling] = useState(false);
  const [floatingToast, setFloatingToast] = useState<{ id: number; text: string; color: string } | null>(null);

  // Modal open states
  const [isPuzzleOpen, setIsPuzzleOpen] = useState(false);
  const [isPuzzleHubOpen, setIsPuzzleHubOpen] = useState(false);
  const [puzzleHubCategory, setPuzzleHubCategory] = useState<PuzzleCategory>('gem_match');
  const [isAdStationOpen, setIsAdStationOpen] = useState(false);
  const [isMascotModalOpen, setIsMascotModalOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isTriviaOpen, setIsTriviaOpen] = useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [isRaidOpen, setIsRaidOpen] = useState(false);
  const [raidTarget, setRaidTarget] = useState<LeaderboardEntry | null>(null);
  const [isChestOpen, setIsChestOpen] = useState(false);
  const [levelUpData, setLevelUpData] = useState<LevelUpData | null>(null);
  const [isStreakModalOpen, setIsStreakModalOpen] = useState(false);
  const [isTradingPostOpen, setIsTradingPostOpen] = useState(false);
  const [boardTileEvent, setBoardTileEvent] = useState<BoardTileEventData | null>(null);
  const [dailyRewardPending, setDailyRewardPending] = useState<{
    puzzle: DailyFeaturedPuzzle;
    coins: number;
    dice: number;
    shields: number;
    xp: number;
    streak: number;
  } | null>(null);
  const hopIntervalRef = useRef<any>(null);

  // Compute total duplicate burrow pieces available to trade
  const duplicateTradesCount = useMemo(() => {
    const inv = gameState.tradingPost?.inventory || {};
    return Object.values(inv).reduce((sum, count) => sum + Math.max(0, count - 1), 0);
  }, [gameState.tradingPost?.inventory]);

  // Cleanup pending intervals on unmount
  useEffect(() => {
    return () => {
      if (hopIntervalRef.current) {
        clearInterval(hopIntervalRef.current);
      }
    };
  }, []);

  // Persist game state
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(gameState));
    } catch (e) {}
  }, [gameState]);

  // Daily Login Streak Check on First Launch Each Day
  useEffect(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    let shouldShowPopup = false;

    setGameState((prev) => {
      const existingStreak = prev.dailyStreak || {
        currentStreak: 1,
        lastLoginDate: '',
        claimedToday: false,
        totalDaysClaimed: 0,
      };

      let newStreak = existingStreak.currentStreak || 1;
      let claimedToday = existingStreak.claimedToday;

      if (!existingStreak.lastLoginDate) {
        // First ever launch with streak system
        claimedToday = false;
        newStreak = 1;
        shouldShowPopup = true;
      } else if (existingStreak.lastLoginDate === todayStr) {
        // Same calendar day: show popup if not claimed yet
        if (!claimedToday) {
          shouldShowPopup = true;
        }
      } else if (existingStreak.lastLoginDate === yesterdayStr) {
        // Consecutive calendar day: increment streak and show popup
        claimedToday = false;
        newStreak = existingStreak.currentStreak + 1;
        shouldShowPopup = true;
      } else {
        // Missed one or more days: reset to Day 1
        claimedToday = false;
        newStreak = 1;
        shouldShowPopup = true;
      }

      return {
        ...prev,
        dailyStreak: {
          ...existingStreak,
          currentStreak: newStreak,
          lastLoginDate: todayStr,
          claimedToday,
        },
      };
    });

    if (shouldShowPopup) {
      // Delay slightly for initial game interface mounting
      const timer = setTimeout(() => {
        setIsStreakModalOpen(true);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, []);

  // Dice rolls auto-recharge timer (+1 roll every 40s)
  useEffect(() => {
    const timer = setInterval(() => {
      setGameState((prev) => {
        if (prev.rolls < prev.maxRolls) {
          return { ...prev, rolls: prev.rolls + 1 };
        }
        return prev;
      });
    }, 40000);
    return () => clearInterval(timer);
  }, []);

  // Compute all available mascots with dynamic level and multiplier upgrades
  const allMascots: Mascot[] = useMemo(() => {
    return [...INITIAL_MASCOTS, ...gameState.customMascots].map((m) => {
      const currentLevel = (gameState.mascotLevels && gameState.mascotLevels[m.id]) || m.level || 1;
      const scaledMultiplier = calculateMascotMultiplier(
        m.uniqueAbility.multiplier,
        currentLevel,
        m.uniqueAbility.effectType
      );
      // Ensure all cheerQuotes are cute squeaks and creature noises, never talking English words
      let cleanCheerQuote = m.cheerQuote;
      if (
        !cleanCheerQuote ||
        cleanCheerQuote.includes('conquer the next puzzle') ||
        cleanCheerQuote.includes('butterflies love us') ||
        cleanCheerQuote.includes('dragonfly buddies') ||
        cleanCheerQuote.includes('coral frequencies') ||
        cleanCheerQuote.includes('dewdrops and pink fluff') ||
        cleanCheerQuote.includes('maximum sparkly intensity') ||
        !cleanCheerQuote.includes('*')
      ) {
        const squeakPool = [
          '*pip pip!* ✨ *squeeeak!* 🐾',
          '*squeak-yip!* 🦋 *purrrrr~* 🐾',
          '*boing boing!* 🐾 *squeeee!* ✨',
          '*chirp-chirp!* 🌊 *trill purr!* ✨',
          '*squeee-boing!* 💖 *pip-squeak!* 🌸',
        ];
        cleanCheerQuote = squeakPool[Math.abs(m.name.length) % squeakPool.length];
      }

      return {
        ...m,
        cheerQuote: cleanCheerQuote,
        level: currentLevel,
        uniqueAbility: {
          ...m.uniqueAbility,
          multiplier: scaledMultiplier,
          description: getAbilityFormattedDescription(m.uniqueAbility, currentLevel),
        },
      };
    });
  }, [gameState.customMascots, gameState.mascotLevels]);

  const activeMascot = useMemo(() => {
    return allMascots.find((m) => m.id === gameState.activeMascotId) || allMascots[0] || INITIAL_MASCOTS[0];
  }, [allMascots, gameState.activeMascotId]);

  const currentTown = useMemo(() => {
    return gameState.towns[gameState.townIndex] || gameState.towns[0];
  }, [gameState.towns, gameState.townIndex]);

  // Mascot Level-Up Handler: Spends coins to increase unique ability multiplier
  const handleUpgradeMascot = (mascotId: string) => {
    const mascot = allMascots.find((m) => m.id === mascotId);
    if (!mascot) return;

    const currentLvl = mascot.level;
    if (currentLvl >= MAX_MASCOT_LEVEL) return;

    const cost = getMascotUpgradeCost(currentLvl);
    if (gameState.coins < cost) {
      SoundEngine.playErrorBuzz();
      showToast(`Need ${(cost - gameState.coins).toLocaleString()} more coins to level up!`, '#f43f5e');
      return;
    }

    const nextLvl = currentLvl + 1;
    const upgradedMultiplier = calculateMascotMultiplier(
      mascot.uniqueAbility.multiplier,
      nextLvl,
      mascot.uniqueAbility.effectType
    );

    SoundEngine.playUpgradeFanfare();
    confetti({ particleCount: 75, spread: 80, origin: { y: 0.6 } });

    setGameState((prev) => {
      const prevLevels = prev.mascotLevels || {};
      return {
        ...prev,
        coins: prev.coins - cost,
        mascotLevels: {
          ...prevLevels,
          [mascotId]: nextLvl,
        },
        customMascots: prev.customMascots.map((cm) =>
          cm.id === mascotId ? { ...cm, level: nextLvl } : cm
        ),
      };
    });

    addXp(180 * currentLvl);
    if (nextLvl >= MAX_MASCOT_LEVEL) {
      confetti({ particleCount: 120, spread: 100, origin: { y: 0.5 } });
      showToast(
        `👑 TRANSCENDENCE! ${mascot.name} reached MAX LEVEL ${MAX_MASCOT_LEVEL}! Cosmetic Burrow Glow UNLOCKED! ✨`,
        '#ffe600'
      );
    } else {
      showToast(
        `🎉 ${mascot.name} reached Level ${nextLvl}! Superpower upgraded to ${upgradedMultiplier}x multiplier!`,
        '#ffe600'
      );
    }
  };

  // Maintain burrows dictionary from INITIAL_MASCOT_BURROWS, persisted burrow states, and custom mascots
  const currentBurrows = useMemo<Record<string, MascotBurrow>>(() => {
    const baseBurrows: Record<string, MascotBurrow> = {};
    INITIAL_MASCOT_BURROWS.forEach((b) => {
      baseBurrows[b.mascotId] = {
        ...b,
        features: b.features.map((f) => {
          const savedData = gameState.burrows?.[b.mascotId]?.features?.[f.id];
          return {
            ...f,
            level: savedData !== undefined ? savedData.level : f.level,
            selectedStyleId: savedData?.selectedStyleId || f.selectedStyleId,
          };
        }),
      };
    });

    // Ensure all initial mascots have a burrow (including Kora)
    INITIAL_MASCOTS.forEach((im) => {
      if (!baseBurrows[im.id]) {
        const template = createCustomBurrow(im.id, im.name, im.furColor, im.hairColors || []);
        baseBurrows[im.id] = {
          ...template,
          features: template.features.map((f) => {
            const savedData = gameState.burrows?.[im.id]?.features?.[f.id];
            return {
              ...f,
              level: savedData !== undefined ? savedData.level : f.level,
              selectedStyleId: savedData?.selectedStyleId || f.selectedStyleId,
            };
          }),
        };
      }
    });

    // Custom mascots created by player
    gameState.customMascots.forEach((cm) => {
      const customTemplate = createCustomBurrow(cm.id, cm.name, cm.furColor, cm.hairColors || []);
      baseBurrows[cm.id] = {
        ...customTemplate,
        features: customTemplate.features.map((f) => {
          const savedData = gameState.burrows?.[cm.id]?.features?.[f.id];
          return {
            ...f,
            level: savedData !== undefined ? savedData.level : f.level,
            selectedStyleId: savedData?.selectedStyleId || f.selectedStyleId,
          };
        }),
      };
    });

    return baseBurrows;
  }, [gameState.burrows, gameState.customMascots]);

  // Burrow Room Upgrade Handler (spends coins to upgrade room level)
  const handleUpgradeBurrowFeature = (mascotId: string, featureId: string, cost: number) => {
    if (gameState.coins < cost) {
      SoundEngine.playErrorBuzz();
      showToast(`Need ${(cost - gameState.coins).toLocaleString()} more coins!`, '#f43f5e');
      return;
    }

    const currentFeatureLvl = currentBurrows[mascotId]?.features.find((f) => f.id === featureId)?.level || 0;
    const nextLvl = currentFeatureLvl + 1;

    SoundEngine.playUpgradeFanfare();
    confetti({ particleCount: 75, spread: 75, origin: { y: 0.6 } });

    setGameState((prev) => {
      const prevBurrows = prev.burrows || {};
      const prevMascotBurrow = prevBurrows[mascotId] || { features: {} };
      const prevFeature = prevMascotBurrow.features[featureId] || {
        level: currentFeatureLvl,
        selectedStyleId: currentBurrows[mascotId]?.features.find((f) => f.id === featureId)?.selectedStyleId || '',
      };

      return {
        ...prev,
        coins: prev.coins - cost,
        burrows: {
          ...prevBurrows,
          [mascotId]: {
            ...prevMascotBurrow,
            features: {
              ...prevMascotBurrow.features,
              [featureId]: {
                ...prevFeature,
                level: nextLvl,
              },
            },
          },
        },
      };
    });

    addXp(75);
    const featureName = currentBurrows[mascotId]?.features.find((f) => f.id === featureId)?.title || 'Room';
    showToast(`🎉 Upgraded ${featureName} to Lv. ${nextLvl}!`, '#10b981');
  };

  // Burrow Room Style Selection Handler (switches active aesthetic style)
  const handleSelectBurrowStyle = (mascotId: string, featureId: string, styleId: string) => {
    setGameState((prev) => {
      const prevBurrows = prev.burrows || {};
      const prevMascotBurrow = prevBurrows[mascotId] || { features: {} };
      const currentFeatureLvl = currentBurrows[mascotId]?.features.find((f) => f.id === featureId)?.level || 0;
      const prevFeature = prevMascotBurrow.features[featureId] || {
        level: currentFeatureLvl,
        selectedStyleId: styleId,
      };

      return {
        ...prev,
        burrows: {
          ...prevBurrows,
          [mascotId]: {
            ...prevMascotBurrow,
            features: {
              ...prevMascotBurrow.features,
              [featureId]: {
                ...prevFeature,
                selectedStyleId: styleId,
              },
            },
          },
        },
      };
    });

    const styleName =
      currentBurrows[mascotId]?.features
        .find((f) => f.id === featureId)
        ?.styles.find((s) => s.id === styleId)?.name || 'Custom Style';
    showToast(`✨ Equipped style: ${styleName}`, '#00f0ff');
  };

  // Buy Underground Den Furniture
  const handleBuyDenFurniture = (furnitureId: string, cost: number) => {
    setGameState((prev) => {
      const currentDen = prev.undergroundDen || {
        unlockedFurnitureIds: ['furn_holo_rug', 'furn_mushroom_stool', 'furn_patchwork_pillows'],
        roomPlacements: {
          room_hearth: 'furn_patchwork_pillows',
          room_grotto: 'furn_mushroom_stool',
          room_arcade: 'furn_holo_rug',
          room_sanctum: 'furn_log_fireplace',
        },
      };

      if (currentDen.unlockedFurnitureIds.includes(furnitureId)) return prev;

      return {
        ...prev,
        coins: prev.coins - cost,
        undergroundDen: {
          ...currentDen,
          unlockedFurnitureIds: [...currentDen.unlockedFurnitureIds, furnitureId],
        },
      };
    });

    SoundEngine.playCoinChime();
    addXp(65);
    showToast(`🏰 New Den Furniture Unlocked & added to Den Inventory!`, '#ec4899');
  };

  // Place or Remove Furniture in a Den Room Chamber
  const handlePlaceDenFurniture = (slotId: string, furnitureId: string | null) => {
    setGameState((prev) => {
      const currentDen = prev.undergroundDen || {
        unlockedFurnitureIds: ['furn_holo_rug', 'furn_mushroom_stool', 'furn_patchwork_pillows'],
        roomPlacements: {
          room_hearth: 'furn_patchwork_pillows',
          room_grotto: 'furn_mushroom_stool',
          room_arcade: 'furn_holo_rug',
          room_sanctum: 'furn_log_fireplace',
        },
      };

      const updatedPlacements = { ...currentDen.roomPlacements };
      if (furnitureId) {
        updatedPlacements[slotId] = furnitureId;
      } else {
        delete updatedPlacements[slotId];
      }

      return {
        ...prev,
        undergroundDen: {
          ...currentDen,
          roomPlacements: updatedPlacements,
        },
      };
    });
  };

  // Toggle Day/Night Lighting Mode in Den
  const handleToggleDenDayNight = (mode: 'auto' | 'day' | 'night') => {
    setGameState((prev) => {
      const currentDen = prev.undergroundDen || {
        unlockedFurnitureIds: ['furn_holo_rug', 'furn_mushroom_stool', 'furn_patchwork_pillows'],
        roomPlacements: {
          room_hearth: 'furn_patchwork_pillows',
          room_grotto: 'furn_mushroom_stool',
          room_arcade: 'furn_holo_rug',
          room_sanctum: 'furn_log_fireplace',
        },
      };

      return {
        ...prev,
        undergroundDen: {
          ...currentDen,
          dayNightMode: mode,
        },
      };
    });
  };

  // Excavate Subterranean Chambers
  const handleExcavateDenChamber = (chamberId: string, cost: number, reward: number) => {
    setGameState((prev) => {
      const currentDen = prev.undergroundDen || {
        unlockedFurnitureIds: ['furn_holo_rug', 'furn_mushroom_stool', 'furn_patchwork_pillows', 'furn_hanging_egg_chair'],
        roomPlacements: {},
        excavatedChamberIds: ['chamber_hearth', 'chamber_grotto', 'chamber_arcade'],
      };

      const excavated = currentDen.excavatedChamberIds || ['chamber_hearth', 'chamber_grotto', 'chamber_arcade'];
      if (excavated.includes(chamberId)) return prev;

      return {
        ...prev,
        coins: prev.coins - cost + reward,
        undergroundDen: {
          ...currentDen,
          excavatedChamberIds: [...excavated, chamberId],
        },
      };
    });

    SoundEngine.playExcavation();
    addXp(120);
    showToast(`⛏️ Cavern Excavated! Discovered +${reward.toLocaleString()} ancient coins!`, '#fbbf24');
  };

  // Helper toast notification
  const showToast = (text: string, color = '#00f0ff') => {
    setFloatingToast({ id: Date.now(), text, color });
    setTimeout(() => setFloatingToast(null), 2500);
  };

  // Achievements & Milestones Tracking
  const unclaimedAchievementsCount = useMemo(() => {
    return ACHIEVEMENTS.filter((achievement) => {
      const progress = getAchievementProgress(achievement, gameState, currentBurrows);
      return progress.isCompleted && !progress.isClaimed;
    }).length;
  }, [gameState, currentBurrows]);

  const handleClaimAchievement = (achievementId: string) => {
    const achievement = ACHIEVEMENTS.find((a) => a.id === achievementId);
    if (!achievement) return;
    if (gameState.claimedAchievementIds?.includes(achievementId)) return;

    const progress = getAchievementProgress(achievement, gameState, currentBurrows);
    if (!progress.isCompleted) return;

    setGameState((prev) => ({
      ...prev,
      coins: prev.coins + achievement.rewardCoins,
      rolls: Math.min(prev.maxRolls + 20, prev.rolls + achievement.rewardRolls),
      claimedAchievementIds: [...(prev.claimedAchievementIds || []), achievementId],
    }));

    addXp(achievement.rewardPoints * 10);
    showToast(
      `🏆 Milestone Claimed: ${achievement.title} (+${achievement.rewardCoins.toLocaleString()} 🪙, +${achievement.rewardRolls} 🎲)!`,
      '#ffe600'
    );
  };

  const handleClaimAllAchievements = () => {
    const unclaimed = ACHIEVEMENTS.filter((a) => {
      const progress = getAchievementProgress(a, gameState, currentBurrows);
      return progress.isCompleted && !progress.isClaimed;
    });

    if (unclaimed.length === 0) return;

    const totalCoins = unclaimed.reduce((acc, a) => acc + a.rewardCoins, 0);
    const totalRolls = unclaimed.reduce((acc, a) => acc + a.rewardRolls, 0);
    const totalAp = unclaimed.reduce((acc, a) => acc + a.rewardPoints, 0);
    const newClaimedIds = unclaimed.map((a) => a.id);

    setGameState((prev) => ({
      ...prev,
      coins: prev.coins + totalCoins,
      rolls: Math.min(prev.maxRolls + 20, prev.rolls + totalRolls),
      claimedAchievementIds: [
        ...(prev.claimedAchievementIds || []),
        ...newClaimedIds,
      ],
    }));

    addXp(totalAp * 10);
    showToast(
      `🏆 Claimed ${unclaimed.length} Milestones (+${totalCoins.toLocaleString()} 🪙, +${totalRolls} 🎲)!`,
      '#ffe600'
    );
  };

  // Add XP and check Level Up
  const addXp = (amount: number) => {
    setGameState((prev) => {
      let newXp = prev.xp + amount;
      let newLevel = prev.playerLevel;
      let newNextXp = prev.xpToNextLevel;
      let newMaxRolls = prev.maxRolls;
      let newRolls = prev.rolls;
      let newCoins = prev.coins;
      let didLevelUp = false;
      const initialLevel = prev.playerLevel;

      while (newXp >= newNextXp) {
        didLevelUp = true;
        newLevel += 1;
        newXp -= newNextXp;
        newNextXp = Math.round(newNextXp * 1.35);
        newMaxRolls += 5;
        newRolls += 25; // Bonus rolls on level up!
      }

      if (didLevelUp) {
        const levelsGained = newLevel - initialLevel;
        const totalBonusCoins = 2000 * newLevel;
        newCoins += totalBonusCoins;

        // Trigger the celebratory Level Up overlay
        setTimeout(() => {
          setLevelUpData({
            previousLevel: initialLevel,
            newLevel,
            rollsBonus: 25 * levelsGained,
            maxRollsBonus: 5 * levelsGained,
            coinsBonus: totalBonusCoins,
            playerName: prev.playerName,
          });
        }, 120);
      }

      return {
        ...prev,
        playerLevel: newLevel,
        xp: newXp,
        xpToNextLevel: newNextXp,
        maxRolls: newMaxRolls,
        rolls: newRolls,
        coins: newCoins,
      };
    });
  };

  // Manual preview/overview of player level & celebratory badge
  const handleOpenLevelOverview = () => {
    setLevelUpData({
      previousLevel: Math.max(1, gameState.playerLevel - 1),
      newLevel: gameState.playerLevel,
      rollsBonus: 25,
      maxRollsBonus: 5,
      coinsBonus: 2000 * gameState.playerLevel,
      playerName: gameState.playerName,
    });
  };

  // Claim Daily Streak Rewards
  const handleClaimDailyStreak = (reward: StreakRewardTier) => {
    const todayStr = new Date().toISOString().split('T')[0];

    setGameState((prev) => {
      const currentStreakState = prev.dailyStreak || {
        currentStreak: 1,
        lastLoginDate: todayStr,
        claimedToday: false,
        totalDaysClaimed: 0,
      };

      return {
        ...prev,
        coins: prev.coins + reward.coins,
        rolls: prev.rolls + reward.rolls,
        shields: Math.min(prev.maxShields, prev.shields + reward.shields),
        dailyStreak: {
          ...currentStreakState,
          claimedToday: true,
          totalDaysClaimed: (currentStreakState.totalDaysClaimed || 0) + 1,
          lastLoginDate: todayStr,
        },
      };
    });

    addXp(reward.xp);
    showToast(`🎉 Day ${reward.day} Streak Claimed! +${reward.coins.toLocaleString()} 🪙 & +${reward.rolls} 🎲!`, '#ffe600');
  };

  // Simulate Next Day Login for easy testing
  const handleSimulateNextDayStreak = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    setGameState((prev) => {
      const currentStreakState = prev.dailyStreak || {
        currentStreak: 1,
        lastLoginDate: todayStr,
        claimedToday: false,
        totalDaysClaimed: 0,
      };

      const nextStreak = currentStreakState.currentStreak + 1;
      return {
        ...prev,
        dailyStreak: {
          ...currentStreakState,
          currentStreak: nextStreak,
          claimedToday: false,
        },
      };
    });
    showToast('⚡ Fast-forwarded to tomorrow! Streak reward ready!', '#00f0ff');
  };

  // Toggle Bet Multiplier (1x -> 2x -> 3x -> 5x)
  const toggleMultiplier = () => {
    SoundEngine.playBoardHop();
    const multipliers = [1, 2, 3, 5];
    const currentIdx = multipliers.indexOf(gameState.rollMultiplier);
    const nextMultiplier = multipliers[(currentIdx + 1) % multipliers.length];
    setGameState((prev) => ({ ...prev, rollMultiplier: nextMultiplier }));
  };

  // Main Dice Roll & Hop Animation Sequence
  const handleRollDice = () => {
    if (isRolling || gameState.rolls < gameState.rollMultiplier) return;

    const bet = gameState.rollMultiplier;
    setGameState((prev) => ({ ...prev, rolls: prev.rolls - bet }));
    setIsRolling(true);

    // Roll two dice (sum 2 to 12)
    const dice1 = Math.floor(Math.random() * 6) + 1;
    const dice2 = Math.floor(Math.random() * 6) + 1;
    const totalSteps = dice1 + dice2;
    const startIndex = gameState.currentTileIndex;

    let currentStep = 0;
    hopIntervalRef.current = setInterval(() => {
      currentStep += 1;
      SoundEngine.playBoardHop();

      setGameState((prev) => {
        const nextTile = (prev.currentTileIndex + 1) % BOARD_TILES.length;
        return { ...prev, currentTileIndex: nextTile };
      });

      if (currentStep >= totalSteps) {
        if (hopIntervalRef.current) {
          clearInterval(hopIntervalRef.current);
          hopIntervalRef.current = null;
        }
        setIsRolling(false);

        // Resolve landed tile event accurately from starting tile
        const finalTileIndex = (startIndex + totalSteps) % BOARD_TILES.length;
        handleTileLanded(BOARD_TILES[finalTileIndex], bet);
      }
    }, 180);
  };

  // Resolve tile event
  const handleTileLanded = (tile: BoardTile, betMultiplier: number) => {
    switch (tile.type) {
      case 'coin_small':
      case 'coin_big': {
        const baseAmount = tile.rewardValue * betMultiplier;
        let earned = baseAmount;
        let mascotBonus = 0;
        if (activeMascot.uniqueAbility.effectType === 'bonus_coins') {
          earned = Math.round(earned * activeMascot.uniqueAbility.multiplier);
          mascotBonus = earned - baseAmount;
        }
        setBoardTileEvent({
          id: `tile-${tile.id}-${Date.now()}`,
          tile,
          type: 'coins',
          totalAmount: earned,
          baseAmount,
          multiplier: betMultiplier,
          mascotBonusAmount: mascotBonus,
          activeMascot,
          xpEarned: 30 * betMultiplier,
        });
        setGameState((prev) => ({
          ...prev,
          coins: prev.coins + earned,
          stats: {
            ...prev.stats,
            totalCoinsEarned: prev.stats.totalCoinsEarned + earned,
          },
        }));
        addXp(30 * betMultiplier);
        break;
      }

      case 'puzzle_challenge': {
        setIsPuzzleHubOpen(true);
        break;
      }

      case 'daily_trivia': {
        setIsTriviaOpen(true);
        break;
      }

      case 'mystery_chest': {
        setIsChestOpen(true);
        break;
      }

      case 'friend_raid': {
        setIsRaidOpen(true);
        break;
      }

      case 'mascot_energy': {
        const baseRolls = tile.rewardValue * betMultiplier;
        let addedRolls = baseRolls;
        let mascotBonus = 0;
        if (activeMascot.uniqueAbility.effectType === 'lucky_dice') {
          addedRolls = Math.round(addedRolls * (activeMascot.uniqueAbility.multiplier * 0.75));
          mascotBonus = addedRolls - baseRolls;
        }
        setBoardTileEvent({
          id: `tile-${tile.id}-${Date.now()}`,
          tile,
          type: 'dice',
          totalAmount: addedRolls,
          baseAmount: baseRolls,
          multiplier: betMultiplier,
          mascotBonusAmount: mascotBonus,
          activeMascot,
          xpEarned: 25 * betMultiplier,
        });
        setGameState((prev) => ({
          ...prev,
          rolls: Math.min(prev.maxRolls + 50, prev.rolls + addedRolls),
        }));
        addXp(25 * betMultiplier);
        break;
      }

      case 'shield_vault': {
        setBoardTileEvent({
          id: `tile-${tile.id}-${Date.now()}`,
          tile,
          type: 'shield',
          totalAmount: 1,
          baseAmount: 1,
          multiplier: betMultiplier,
          activeMascot,
          xpEarned: 25 * betMultiplier,
        });
        setGameState((prev) => ({
          ...prev,
          shields: Math.min(prev.maxShields, prev.shields + 1),
        }));
        addXp(25 * betMultiplier);
        break;
      }

      case 'landmark_star': {
        const baseCoin = tile.rewardValue * betMultiplier;
        let coinBonus = baseCoin;
        let mascotBonus = 0;
        if (activeMascot.uniqueAbility.effectType === 'bonus_coins') {
          coinBonus = Math.round(coinBonus * activeMascot.uniqueAbility.multiplier);
          mascotBonus = coinBonus - baseCoin;
        }
        setBoardTileEvent({
          id: `tile-${tile.id}-${Date.now()}`,
          tile,
          type: 'star',
          totalAmount: coinBonus,
          baseAmount: baseCoin,
          multiplier: betMultiplier,
          mascotBonusAmount: mascotBonus,
          activeMascot,
          xpEarned: 60 * betMultiplier,
        });
        setGameState((prev) => ({
          ...prev,
          coins: prev.coins + coinBonus,
        }));
        addXp(60 * betMultiplier);
        break;
      }

      default:
        break;
    }
  };

  // Upgrading a Town Landmark
  const handleUpgradeLandmark = (landmarkId: string, cost: number) => {
    setGameState((prev) => {
      const currentTownObj = prev.towns[prev.townIndex];
      const updatedLandmarks = currentTownObj.landmarks.map((lm) => {
        if (lm.id === landmarkId) {
          return { ...lm, currentLevel: lm.currentLevel + 1 };
        }
        return lm;
      });

      const updatedTowns = [...prev.towns];
      updatedTowns[prev.townIndex] = {
        ...currentTownObj,
        landmarks: updatedLandmarks,
      };

      return {
        ...prev,
        coins: prev.coins - cost,
        towns: updatedTowns,
      };
    });

    addXp(120);
    showToast(`Landmark Upgraded! Town star power rising! ⭐`, '#00f0ff');
  };

  // Advance to Next Town when complete
  const handleAdvanceNextTown = () => {
    const nextIdx = (gameState.townIndex + 1) % gameState.towns.length;
    let townRewardCoins = currentTown.completionRewardCoins;
    let townRewardRolls = currentTown.completionRewardRolls;

    if (activeMascot.uniqueAbility.effectType === 'bonus_coins') {
      townRewardCoins = Math.round(townRewardCoins * activeMascot.uniqueAbility.multiplier);
    }
    if (activeMascot.uniqueAbility.effectType === 'lucky_dice') {
      townRewardRolls = Math.round(townRewardRolls * (activeMascot.uniqueAbility.multiplier * 0.75));
    }

    SoundEngine.playUpgradeFanfare();
    confetti({ particleCount: 100, spread: 100, origin: { y: 0.5 } });

    setGameState((prev) => ({
      ...prev,
      townIndex: nextIdx,
      coins: prev.coins + townRewardCoins,
      rolls: prev.rolls + townRewardRolls,
      stats: {
        ...prev.stats,
        townsCompleted: prev.stats.townsCompleted + 1,
      },
    }));

    addXp(400);
    showToast(`🎉 Welcome to ${gameState.towns[nextIdx].name}! +${townRewardCoins.toLocaleString()} 🪙 & +${townRewardRolls} 🎲 (${activeMascot.name} Lv.${activeMascot.level})!`, '#ffe600');
  };

  // Daily Featured Puzzle Completion Handler
  const handleCompleteDailyFeatured = (
    puzzle: DailyFeaturedPuzzle,
    baseReward: { coins: number; xp: number; diceBonus: number }
  ) => {
    const todayStr = getTodayDateString();
    const prevFeatured = gameState.dailyFeatured;

    if (prevFeatured?.lastCompletedDate === todayStr) {
      handlePuzzleHubReward({ ...baseReward, sourceTitle: `${puzzle.title} Replayed!` });
      return;
    }

    let bonusCoins = puzzle.bonusCoins;
    if (activeMascot.uniqueAbility.effectType === 'bonus_coins') {
      bonusCoins = Math.round(bonusCoins * activeMascot.uniqueAbility.multiplier);
    }
    const totalCoins = baseReward.coins + bonusCoins;

    let bonusDice = puzzle.bonusDice;
    if (activeMascot.uniqueAbility.effectType === 'lucky_dice') {
      bonusDice += 2;
    }
    const totalDice = baseReward.diceBonus + bonusDice;

    const totalXp = baseReward.xp + puzzle.bonusXp;
    const shieldsAdded = puzzle.bonusShield;

    const lastDate = prevFeatured?.lastCompletedDate;
    let newStreak = (prevFeatured?.consecutiveStreak || 0) + 1;
    if (lastDate) {
      const yesterday = new Date();
      yesterday.setUTCDate(yesterday.getUTCDate() - 1);
      const yesterdayStr = yesterday.toISOString().slice(0, 10);
      if (lastDate !== yesterdayStr) {
        newStreak = 1;
      }
    }

    SoundEngine.playUpgradeFanfare();
    confetti({ particleCount: 120, spread: 100, origin: { y: 0.5 } });

    setDailyRewardPending({
      puzzle,
      coins: totalCoins,
      dice: totalDice,
      shields: shieldsAdded,
      xp: totalXp,
      streak: newStreak,
    });
  };

  const handleClaimDailyFeaturedReward = () => {
    if (!dailyRewardPending) return;
    const { puzzle, coins, dice, shields, xp, streak } = dailyRewardPending;
    const todayStr = getTodayDateString();

    setGameState((prev) => {
      const prevFeatured = prev.dailyFeatured || {
        consecutiveStreak: 0,
        totalCompletedCount: 0,
        claimedHistory: [],
      };

      const newClaim: DailyFeaturedClaim = {
        date: todayStr,
        puzzleId: puzzle.id,
        puzzleTitle: puzzle.title,
        coinsEarned: coins,
        diceEarned: dice,
        uniqueRewardName: puzzle.uniqueReward.name,
        timestamp: Date.now(),
      };

      return {
        ...prev,
        coins: prev.coins + coins,
        rolls: Math.min(prev.maxRolls + 50, prev.rolls + dice),
        shields: Math.min(prev.maxShields, prev.shields + shields),
        dailyFeatured: {
          lastCompletedDate: todayStr,
          consecutiveStreak: streak,
          totalCompletedCount: (prevFeatured.totalCompletedCount || 0) + 1,
          claimedHistory: [newClaim, ...(prevFeatured.claimedHistory || [])].slice(0, 30),
        },
        stats: {
          ...prev.stats,
          puzzlesSolved: prev.stats.puzzlesSolved + 1,
          totalCoinsEarned: prev.stats.totalCoinsEarned + coins,
        },
      };
    });

    addXp(xp);
    showToast(
      `🎉 Daily Featured Bounty Claimed! +${coins.toLocaleString()} 🪙 & ${puzzle.uniqueReward.name}!`,
      '#ffe600'
    );
    setDailyRewardPending(null);
  };

  const handlePlayFeaturedPuzzle = (puzzle: DailyFeaturedPuzzle) => {
    if (puzzle.category === 'reflex') {
      setIsPuzzleOpen(true);
    } else {
      setPuzzleHubCategory(puzzle.category);
      setIsPuzzleHubOpen(true);
    }
  };

  // Reflex Puzzle Completion Handler
  const handlePuzzleComplete = (reward: { coins: number; xp: number; streak: number; diceBonus: number }) => {
    setIsPuzzleOpen(false);
    const featured = getDailyFeaturedPuzzle();
    const todayStr = getTodayDateString();

    // Check if reflex challenge is today's daily featured puzzle
    if (featured.category === 'reflex' && gameState.dailyFeatured?.lastCompletedDate !== todayStr) {
      handleCompleteDailyFeatured(featured, { coins: reward.coins, xp: reward.xp, diceBonus: reward.diceBonus });
      return;
    }

    setGameState((prev) => ({
      ...prev,
      coins: prev.coins + reward.coins,
      rolls: prev.rolls + reward.diceBonus,
      stats: {
        ...prev.stats,
        puzzlesSolved: prev.stats.puzzlesSolved + 1,
        highestStreak: Math.max(prev.stats.highestStreak, reward.streak),
        totalCoinsEarned: prev.stats.totalCoinsEarned + reward.coins,
      },
    }));
    addXp(reward.xp);
    showToast(`Reflex Challenge Won! +${reward.coins.toLocaleString()} 🪙 & +${reward.diceBonus} 🎲!`, '#34d399');
  };

  // Master Puzzle Hub Completion Handler (Word Find, Crosswords, Block Stacker)
  const handlePuzzleHubReward = (reward: { coins: number; xp: number; diceBonus: number; sourceTitle: string }) => {
    SoundEngine.playCoinChime();
    setGameState((prev) => ({
      ...prev,
      coins: prev.coins + reward.coins,
      rolls: Math.min(prev.maxRolls + 50, prev.rolls + reward.diceBonus),
      stats: {
        ...prev.stats,
        puzzlesSolved: prev.stats.puzzlesSolved + 1,
        totalCoinsEarned: prev.stats.totalCoinsEarned + reward.coins,
      },
    }));
    addXp(reward.xp);
    showToast(`🎉 ${reward.sourceTitle} +${reward.coins.toLocaleString()} 🪙 & +${reward.diceBonus} 🎲!`, '#00f0ff');
  };

  // Google Search Trivia Reward Handler
  const handleTriviaReward = (coinsWon: number, diceWon: number) => {
    setIsTriviaOpen(false);
    setGameState((prev) => ({
      ...prev,
      coins: prev.coins + coinsWon,
      rolls: prev.rolls + diceWon,
    }));
    addXp(80);
    showToast(`Cyber Intel Solved! +${coinsWon.toLocaleString()} 🪙!`, '#00f0ff');
  };

  // Rewarded Video Ad Claim Handler
  const handleClaimAdReward = (reward: { coins: number; rolls: number; multiplierBoost?: number; label: string }) => {
    SoundEngine.playCoinChime();
    setGameState((prev) => ({
      ...prev,
      coins: prev.coins + reward.coins,
      rolls: prev.rolls + reward.rolls,
      rollMultiplier: reward.multiplierBoost ? Math.max(prev.rollMultiplier, reward.multiplierBoost) : prev.rollMultiplier,
      stats: {
        ...prev.stats,
        totalCoinsEarned: prev.stats.totalCoinsEarned + reward.coins,
      },
    }));
    addXp(60);
    showToast(`🎁 Sponsor Reward: ${reward.label}!`, '#34d399');
  };

  // Custom AI Mascot Created via Gemini 3.1 Pro Photo Scan
  const handleMascotCreated = (newMascot: Mascot) => {
    setGameState((prev) => ({
      ...prev,
      customMascots: [newMascot, ...prev.customMascots],
      unlockedMascotIds: [...prev.unlockedMascotIds, newMascot.id],
      activeMascotId: newMascot.id,
    }));
    showToast(`🎉 ${newMascot.name} adopted and equipped as your active mascot!`, '#ff007f');
  };

  return (
    <div className="min-h-screen bg-[#070815] text-slate-100 flex flex-col justify-between selection:bg-fuchsia-500 font-sans relative overflow-x-hidden">
      {/* Top Game Status Header */}
      <GameHeader
        playerName={gameState.playerName}
        playerLevel={gameState.playerLevel}
        xp={gameState.xp}
        xpToNextLevel={gameState.xpToNextLevel}
        coins={gameState.coins}
        shields={gameState.shields}
        maxShields={gameState.maxShields}
        activeMascot={activeMascot}
        onOpenPuzzles={() => setIsPuzzleHubOpen(true)}
        onOpenMascots={() => setIsMascotModalOpen(true)}
        onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
        onOpenScanner={() => setIsScannerOpen(true)}
        onOpenLevelOverlay={handleOpenLevelOverview}
        onOpenTradingPost={() => setIsTradingPostOpen(true)}
        duplicateTradesCount={duplicateTradesCount}
        unclaimedAchievementsCount={unclaimedAchievementsCount}
        dailyStreakDays={gameState.dailyStreak?.currentStreak || 1}
        dailyStreakClaimedToday={gameState.dailyStreak?.claimedToday || false}
        onOpenDailyStreak={() => setIsStreakModalOpen(true)}
      />

      {/* Floating Toast Notification */}
      <AnimatePresence>
        {floatingToast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -15, scale: 0.9 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-2xl bg-slate-900/95 border-2 shadow-2xl backdrop-blur-md text-xs font-black text-white text-center max-w-[320px]"
            style={{ borderColor: floatingToast.color }}
          >
            {floatingToast.text}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main View Area */}
      <main className="flex-1 w-full max-w-md mx-auto px-3 py-1 flex flex-col justify-center">
        {activeTab === 'board' && (
          <GameBoard
            currentTileIndex={gameState.currentTileIndex}
            rolls={gameState.rolls}
            maxRolls={gameState.maxRolls}
            rollMultiplier={gameState.rollMultiplier}
            activeMascot={activeMascot}
            isRolling={isRolling}
            onRollDice={handleRollDice}
            onToggleMultiplier={toggleMultiplier}
            onOpenPuzzleArcade={() => setIsPuzzleHubOpen(true)}
            onTileClick={(tile) => handleTileLanded(tile, gameState.rollMultiplier)}
          />
        )}

        {activeTab === 'arcade' && (
          <div className="w-full flex flex-col gap-3 py-2">
            {/* 1. Daily Featured Puzzle (24-Hour Rotating Challenge) */}
            <DailyFeaturedPuzzleCard
              activeMascot={activeMascot}
              playerLevel={gameState.playerLevel}
              dailyFeaturedState={gameState.dailyFeatured}
              onPlayFeatured={handlePlayFeaturedPuzzle}
            />

            {/* 2. Neon Puzzle Arcade Grid */}
            <div className="bg-gradient-to-r from-cyan-950/80 via-slate-900 to-fuchsia-950/80 border-2 border-cyan-400/50 rounded-3xl p-4 shadow-[0_0_30px_rgba(0,240,255,0.25)] flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-9 h-9 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-xl">
                    🎮
                  </span>
                  <div>
                    <h2 className="text-sm font-black text-white uppercase tracking-wider">
                      Neon Puzzle Arcade
                    </h2>
                    <p className="text-[10px] text-slate-300">
                      Choose your puzzle discipline to earn coins, XP & dice!
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-black text-amber-300 bg-amber-950/80 border border-amber-500/40 px-2 py-0.5 rounded-full">
                  {activeMascot.uniqueAbility.multiplier}x Boost
                </span>
              </div>

              {/* 6 Dedicated Game Cards */}
              <div className="grid grid-cols-2 gap-2">
                {/* 1. NEW GEM MATCH-3 (Candy Crush Style) */}
                <button
                  onClick={() => {
                    setPuzzleHubCategory('gem_match');
                    setIsPuzzleHubOpen(true);
                  }}
                  className="p-3 rounded-2xl bg-gradient-to-br from-pink-950/80 to-purple-950/80 hover:brightness-110 border border-pink-500/50 hover:border-pink-400 text-left transition-all group flex flex-col justify-between h-24 shadow-md cursor-pointer col-span-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xl">💎</span>
                    <span className="text-[9px] bg-pink-900 text-pink-200 font-bold px-2 py-0.5 rounded-full border border-pink-400/40">
                      Candy Style Match-3
                    </span>
                  </div>
                  <div>
                    <div className="text-xs font-black text-white group-hover:text-pink-300 transition-colors">
                      Gem Match-3 Crush
                    </div>
                    <div className="text-[9px] text-slate-300">Swap, bomb matches & cascade super combos</div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setPuzzleHubCategory('word_find');
                    setIsPuzzleHubOpen(true);
                  }}
                  className="p-3 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-cyan-500/40 hover:border-cyan-400 text-left transition-all group flex flex-col justify-between h-24 shadow-md cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xl">🔤</span>
                    <span className="text-[9px] bg-cyan-950 text-cyan-300 font-bold px-1.5 py-0.5 rounded-full">
                      Word Find
                    </span>
                  </div>
                  <div>
                    <div className="text-xs font-black text-white group-hover:text-cyan-300 transition-colors">
                      Word Search
                    </div>
                    <div className="text-[9px] text-slate-400">Casual, Tricky, Mastermind</div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setPuzzleHubCategory('crossword');
                    setIsPuzzleHubOpen(true);
                  }}
                  className="p-3 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-fuchsia-500/40 hover:border-fuchsia-400 text-left transition-all group flex flex-col justify-between h-24 shadow-md cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xl">✍️</span>
                    <span className="text-[9px] bg-fuchsia-950 text-fuchsia-300 font-bold px-1.5 py-0.5 rounded-full">
                      Crossword
                    </span>
                  </div>
                  <div>
                    <div className="text-xs font-black text-white group-hover:text-fuchsia-300 transition-colors">
                      Mini Crossword
                    </div>
                    <div className="text-[9px] text-slate-400">5x5, 6x6 & 7x7 Cyber Clues</div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setPuzzleHubCategory('block_stack');
                    setIsPuzzleHubOpen(true);
                  }}
                  className="p-3 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-amber-500/40 hover:border-amber-400 text-left transition-all group flex flex-col justify-between h-24 shadow-md cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xl">🕹️</span>
                    <span className="text-[9px] bg-amber-950 text-amber-300 font-bold px-1.5 py-0.5 rounded-full">
                      Block Stacker
                    </span>
                  </div>
                  <div>
                    <div className="text-xs font-black text-white group-hover:text-amber-300 transition-colors">
                      Block Stacker Puzzle
                    </div>
                    <div className="text-[9px] text-slate-400">Clear lines & score combos</div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setPuzzleHubCategory('laser_stack');
                    setIsPuzzleHubOpen(true);
                  }}
                  className="p-3 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-rose-500/40 hover:border-rose-400 text-left transition-all group flex flex-col justify-between h-24 shadow-md cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xl">⚡</span>
                    <span className="text-[9px] bg-rose-950 text-rose-300 font-bold px-1.5 py-0.5 rounded-full">
                      Laser Slicer
                    </span>
                  </div>
                  <div>
                    <div className="text-xs font-black text-white group-hover:text-rose-300 transition-colors">
                      Laser Stack
                    </div>
                    <div className="text-[9px] text-slate-400">Slice & stack 10 floors</div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setIsPuzzleOpen(true);
                  }}
                  className="p-3 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-emerald-500/40 hover:border-emerald-400 text-left transition-all group flex flex-col justify-between h-24 shadow-md cursor-pointer col-span-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xl">🎯</span>
                    <span className="text-[9px] bg-emerald-950 text-emerald-300 font-bold px-1.5 py-0.5 rounded-full">
                      Reflex Matrix
                    </span>
                  </div>
                  <div>
                    <div className="text-xs font-black text-white group-hover:text-emerald-300 transition-colors">
                      Pulse, Laser & Lock Reflex Arena
                    </div>
                    <div className="text-[9px] text-slate-400">High-speed rhythm and precision deflection challenges</div>
                  </div>
                </button>
              </div>

              {/* Master Arcade Play Button */}
              <button
                onClick={() => setIsPuzzleHubOpen(true)}
                className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-fuchsia-600 text-white font-black text-xs uppercase tracking-wider shadow-lg hover:brightness-110 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Gamepad2 className="w-4 h-4" />
                <span>OPEN FULL PUZZLE ARENA ➔</span>
              </button>
            </div>
          </div>
        )}

        {activeTab === 'town' && (
          <TownView
            town={currentTown}
            coins={gameState.coins}
            playerLevel={gameState.playerLevel}
            activeMascot={activeMascot}
            allMascots={allMascots}
            onUpgradeLandmark={handleUpgradeLandmark}
            onAdvanceNextTown={handleAdvanceNextTown}
            onOpenAdCinema={() => setIsAdStationOpen(true)}
          />
        )}

        {activeTab === 'cinema' && (
          <div className="w-full flex flex-col gap-3 py-2">
            <div className="rounded-3xl bg-gradient-to-br from-indigo-950 via-slate-900 to-cyan-950 border-2 border-cyan-400/50 p-4 shadow-[0_0_30px_rgba(0,240,255,0.25)] flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-2xl">
                    📺
                  </span>
                  <div>
                    <h2 className="text-base font-black text-white">Sponsor Ad Cinema</h2>
                    <p className="text-[11px] text-slate-300">Watch short video ads for free dice, coins & multipliers!</p>
                  </div>
                </div>
                <span className="text-[10px] font-black text-amber-300 bg-amber-950/80 border border-amber-500/40 px-2 py-0.5 rounded-full">
                  FREE GIFTS
                </span>
              </div>

              <button
                onClick={() => setIsAdStationOpen(true)}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-400 via-orange-500 to-pink-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg hover:brightness-110 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>🎬 WATCH ADS & CLAIM REWARDS ➔</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col gap-1">
                <span className="text-xl">🎲</span>
                <div className="text-xs font-black text-white">+30 Free Rolls</div>
                <div className="text-[9px] text-slate-400">Keep rolling without running dry</div>
              </div>
              <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col gap-1">
                <span className="text-xl">💰</span>
                <div className="text-xs font-black text-white">+45,000 Coins</div>
                <div className="text-[9px] text-slate-400">Build town landmarks in one tap</div>
              </div>
              <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col gap-1">
                <span className="text-xl">⚡</span>
                <div className="text-xs font-black text-white">2X Multiplier Boost</div>
                <div className="text-[9px] text-slate-400">Double every tile payoff</div>
              </div>
              <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col gap-1">
                <span className="text-xl">🎡</span>
                <div className="text-xs font-black text-white">Mega Jackpot</div>
                <div className="text-[9px] text-slate-400">+60,000 Coins & +40 Dice bundle</div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'burrows' && (
          <MascotBurrowsView
            mascots={allMascots}
            activeMascot={activeMascot}
            playerCoins={gameState.coins}
            burrows={currentBurrows}
            undergroundDen={gameState.undergroundDen}
            onSelectActiveMascot={(mascotId) => {
              setGameState((prev) => ({ ...prev, activeMascotId: mascotId }));
              const m = allMascots.find((x) => x.id === mascotId);
              showToast(`Equipped ${m?.name || 'Mascot'} as companion!`, '#ff007f');
            }}
            onUpgradeFeature={handleUpgradeBurrowFeature}
            onSelectStyle={handleSelectBurrowStyle}
            onBuyFurniture={handleBuyDenFurniture}
            onPlaceFurniture={handlePlaceDenFurniture}
            onToggleDayNight={handleToggleDenDayNight}
            onExcavateChamber={handleExcavateDenChamber}
            onCollectDailyStash={(amount) => {
              setGameState((prev) => ({ ...prev, coins: prev.coins + amount }));
              showToast(`✨ Collected +${amount.toLocaleString()} daily stash coins!`, '#10b981');
            }}
            onOpenTradingPost={() => setIsTradingPostOpen(true)}
            duplicateTradesCount={duplicateTradesCount}
          />
        )}
      </main>

      {/* Bottom Sticky Navigation Bar with 5 Distinct Pages */}
      <footer className="w-full max-w-md mx-auto p-2.5 z-30">
        <nav className="w-full rounded-2xl bg-slate-950/95 border border-slate-800 p-1 flex items-center justify-between shadow-2xl backdrop-blur-md gap-1">
          <button
            onClick={() => {
              setActiveTab('board');
              SoundEngine.playBoardHop();
            }}
            className={`flex-1 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider flex flex-col items-center gap-0.5 transition-all ${
              activeTab === 'board'
                ? 'bg-gradient-to-r from-fuchsia-600 to-pink-500 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Dices className="w-4 h-4" />
            <span className="text-[8.5px]">Board</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('town');
              SoundEngine.playBoardHop();
            }}
            className={`flex-1 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider flex flex-col items-center gap-0.5 transition-all ${
              activeTab === 'town'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span className="text-[8.5px]">Town</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('arcade');
              SoundEngine.playBoardHop();
            }}
            className={`flex-1 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider flex flex-col items-center gap-0.5 transition-all ${
              activeTab === 'arcade'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Gamepad2 className="w-4 h-4" />
            <span className="text-[8.5px]">Puzzles</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('burrows');
              SoundEngine.playBoardHop();
            }}
            className={`flex-1 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider flex flex-col items-center gap-0.5 transition-all relative ${
              activeTab === 'burrows'
                ? 'bg-gradient-to-r from-amber-400 via-orange-500 to-pink-500 text-slate-950 shadow-md'
                : activeMascot.level >= MAX_MASCOT_LEVEL
                ? 'text-amber-300 hover:text-amber-200'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <div className="relative flex items-center justify-center">
              <Home
                className={`w-4 h-4 transition-transform ${
                  activeMascot.level >= MAX_MASCOT_LEVEL
                    ? 'text-amber-300 drop-shadow-[0_0_10px_rgba(251,191,36,0.95)] scale-110'
                    : ''
                }`}
              />
              {/* Special Cosmetic Glow & Crown Aura for Max Level Active Mascot */}
              {activeMascot.level >= MAX_MASCOT_LEVEL && (
                <>
                  <span className="absolute -top-2 -right-2 text-[9px] drop-shadow-md animate-bounce pointer-events-none">
                    👑
                  </span>
                  <span className="absolute -inset-1.5 rounded-full bg-amber-400/25 blur-xs animate-pulse pointer-events-none -z-10" />
                </>
              )}
            </div>
            <span
              className={`text-[8.5px] ${
                activeMascot.level >= MAX_MASCOT_LEVEL
                  ? 'font-black tracking-wide text-amber-300 drop-shadow-[0_0_6px_rgba(251,191,36,0.5)]'
                  : ''
              }`}
            >
              {activeMascot.level >= MAX_MASCOT_LEVEL ? 'Burrows ✨' : 'Burrows'}
            </span>
          </button>

          <button
            onClick={() => {
              setActiveTab('cinema');
              SoundEngine.playBoardHop();
            }}
            className={`flex-1 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider flex flex-col items-center gap-0.5 transition-all ${
              activeTab === 'cinema'
                ? 'bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Tv className="w-4 h-4" />
            <span className="text-[8.5px]">Ads</span>
          </button>
        </nav>
      </footer>

      {/* ALL MODALS */}

      {/* Rewarded Video Ad Station Modal */}
      <AdStationModal
        isOpen={isAdStationOpen}
        onClose={() => setIsAdStationOpen(false)}
        onClaimReward={handleClaimAdReward}
      />

      {/* Master Puzzle Hub Modal: Gem Match, Word Finds, Crosswords, Block Stacker, Reflex */}
      <PuzzleHubModal
        isOpen={isPuzzleHubOpen}
        activeMascot={activeMascot}
        playerLevel={gameState.playerLevel}
        townLevel={gameState.townIndex + 1}
        initialCategory={puzzleHubCategory}
        dailyFeaturedState={gameState.dailyFeatured}
        onLaunchReflexGame={() => setIsPuzzleOpen(true)}
        onCompleteReward={handlePuzzleHubReward}
        onCompleteDailyFeatured={handleCompleteDailyFeatured}
        onWatchAdBonus={() => setIsAdStationOpen(true)}
        onClose={() => setIsPuzzleHubOpen(false)}
      />

      {/* Daily Featured Reward Modal (Unique 24H Bounty Claim) */}
      {dailyRewardPending && (
        <DailyFeaturedRewardModal
          isOpen={true}
          activeMascot={activeMascot}
          puzzle={dailyRewardPending.puzzle}
          coinsEarned={dailyRewardPending.coins}
          diceEarned={dailyRewardPending.dice}
          shieldsEarned={dailyRewardPending.shields}
          xpEarned={dailyRewardPending.xp}
          streak={dailyRewardPending.streak}
          onClaim={handleClaimDailyFeaturedReward}
        />
      )}

      {/* 1. Reflex Challenge Modal */}
      <ReflexPuzzleModal
        isOpen={isPuzzleOpen}
        townLevel={gameState.townIndex + 1}
        activeMascot={activeMascot}
        onComplete={handlePuzzleComplete}
        onClose={() => setIsPuzzleOpen(false)}
      />

      {/* 2. Mascot Sanctuary, Upgrades & TTS Voice Line Player */}
      <MascotDetailModal
        isOpen={isMascotModalOpen}
        allMascots={allMascots}
        activeMascotId={gameState.activeMascotId}
        coins={gameState.coins}
        onSelectMascot={(id) => setGameState((prev) => ({ ...prev, activeMascotId: id }))}
        onUpgradeMascot={handleUpgradeMascot}
        onOpenScanner={() => setIsScannerOpen(true)}
        onClose={() => setIsMascotModalOpen(false)}
      />

      {/* 3. AI Mascot Scanner (Gemini 3.1 Pro Photo Analysis) */}
      <MascotScannerModal
        isOpen={isScannerOpen}
        onMascotCreated={handleMascotCreated}
        onClose={() => setIsScannerOpen(false)}
      />

      {/* 4. Google Search Grounded Daily Trivia (Gemini 3.5 Flash) */}
      <TriviaModal
        isOpen={isTriviaOpen}
        activeMascot={activeMascot}
        rollMultiplier={gameState.rollMultiplier}
        onReward={handleTriviaReward}
        onClose={() => setIsTriviaOpen(false)}
      />

      {/* 5. Global Leaderboard, Achievements & Social Media Share */}
      <LeaderboardAndSocialModal
        isOpen={isLeaderboardOpen}
        playerName={gameState.playerName}
        playerScore={gameState.stats.totalCoinsEarned}
        townLevel={gameState.townIndex + 1}
        activeMascot={activeMascot}
        shields={gameState.shields}
        highestStreak={gameState.stats.highestStreak}
        gameState={gameState}
        currentBurrows={currentBurrows}
        onClaimAchievement={handleClaimAchievement}
        onClaimAllAchievements={handleClaimAllAchievements}
        onLaunchRaid={(target) => {
          setRaidTarget(target);
          setIsRaidOpen(true);
        }}
        onClose={() => setIsLeaderboardOpen(false)}
      />

      {/* 6. Friend Raid Heist Mini-Event */}
      <RaidModal
        isOpen={isRaidOpen}
        activeMascot={activeMascot}
        targetPlayer={raidTarget}
        onComplete={(stolen) => {
          setIsRaidOpen(false);
          setGameState((prev) => ({
            ...prev,
            coins: prev.coins + stolen,
            stats: {
              ...prev.stats,
              totalCoinsEarned: prev.stats.totalCoinsEarned + stolen,
            },
          }));
          addXp(90);
          showToast(`Heist Payout: +${stolen.toLocaleString()} 🪙!`, '#39ff14');
        }}
        onClose={() => setIsRaidOpen(false)}
      />

      {/* 7. Mystery Egg / Crate Loot Modal */}
      <RewardChestModal
        isOpen={isChestOpen}
        activeMascot={activeMascot}
        rollMultiplier={gameState.rollMultiplier}
        onClaim={(coins, dice, shields) => {
          // Chance to discover a duplicate/new burrow trade accessory in mystery chests!
          const allItemIds = Object.keys(BURROW_TRADE_ITEMS);
          const randomItemId = allItemIds[Math.floor(Math.random() * allItemIds.length)];
          const randomItem = BURROW_TRADE_ITEMS[randomItemId];

          setGameState((prev) => {
            const currentTrading = prev.tradingPost || INITIAL_TRADING_POST_STATE;
            const updatedInv = { ...currentTrading.inventory };
            updatedInv[randomItemId] = (updatedInv[randomItemId] || 0) + 1;

            return {
              ...prev,
              coins: prev.coins + coins,
              rolls: prev.rolls + dice,
              shields: Math.min(prev.maxShields, prev.shields + shields),
              tradingPost: {
                ...currentTrading,
                inventory: updatedInv,
              },
            };
          });
          showToast(`Loot Claimed: +${coins.toLocaleString()} 🪙, +${dice} 🎲 & Found ${randomItem?.name || 'Burrow Accessory'}!`, '#ffe600');
        }}
        onClose={() => setIsChestOpen(false)}
      />

      {/* 8. Dedicated Celebratory Player Level-Up Overlay */}
      <PlayerLevelUpOverlay
        data={levelUpData}
        onClaim={() => {
          setLevelUpData(null);
          showToast(`🎉 Claimed Rank ${levelUpData?.newLevel} rewards!`, '#ffe600');
        }}
      />

      {/* 9. Daily Login Streak Summary Popup */}
      <DailyStreakModal
        isOpen={isStreakModalOpen}
        streakState={gameState.dailyStreak || {
          currentStreak: 1,
          lastLoginDate: new Date().toISOString().split('T')[0],
          claimedToday: false,
          totalDaysClaimed: 0,
        }}
        onClaim={handleClaimDailyStreak}
        onSimulateNextDay={handleSimulateNextDayStreak}
        onClose={() => setIsStreakModalOpen(false)}
      />

      {/* 10. Global Burrow Trading Post Modal */}
      <TradingPostModal
        isOpen={isTradingPostOpen}
        onClose={() => setIsTradingPostOpen(false)}
        tradingState={gameState.tradingPost || INITIAL_TRADING_POST_STATE}
        activeMascot={activeMascot}
        playerCoins={gameState.coins}
        onUpdateTradingState={(updater) => {
          setGameState((prev) => ({
            ...prev,
            tradingPost: updater(prev.tradingPost || INITIAL_TRADING_POST_STATE),
          }));
        }}
        onRewardCoinsAndDice={(coins, dice, message) => {
          setGameState((prev) => ({
            ...prev,
            coins: prev.coins + coins,
            rolls: prev.rolls + dice,
            stats: {
              ...prev.stats,
              totalCoinsEarned: prev.stats.totalCoinsEarned + coins,
            },
          }));
          addXp(150);
          showToast(message, '#ffe600');
        }}
        onToast={(text, color) => showToast(text, color)}
      />

      {/* 11. Board Tile Event Popup (Punchy Framer Motion Entry/Exit for Coin & Dice Collection) */}
      <AnimatePresence>
        {boardTileEvent && (
          <BoardTileEventPopup
            event={boardTileEvent}
            onClose={() => setBoardTileEvent(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
