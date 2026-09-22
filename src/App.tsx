import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Dices, Building2, Zap, Sparkles, Trophy, Plus, 
  Flame, Shield, Coins, Volume2, Share2, HelpCircle, Home
} from 'lucide-react';
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
import { MascotDetailModal } from './components/MascotDetailModal';
import { MascotScannerModal } from './components/MascotScannerModal';
import { TriviaModal } from './components/TriviaModal';
import { LeaderboardAndSocialModal } from './components/LeaderboardAndSocialModal';
import { RaidModal } from './components/RaidModal';
import { RewardChestModal } from './components/RewardChestModal';
import { PlayerLevelUpOverlay, LevelUpData } from './components/PlayerLevelUpOverlay';
import { DailyStreakModal } from './components/DailyStreakModal';
import { StreakRewardTier } from './data/dailyStreakData';
import confetti from 'canvas-confetti';

const STORAGE_KEY = 'neon_fuzz_game_save_v1';

export default function App() {
  // Load saved state or use initial defaults
  const [gameState, setGameState] = useState<GameState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
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
      unlockedMascotIds: ['pip', 'boba', 'ziggy', 'lulu'],
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
      mascotLevels: { pip: 1, boba: 1, ziggy: 1, lulu: 1 },
      burrows: {},
    };
  });

  // Navigation tab: Board, Towns, or Mascots' Burrows
  const [activeTab, setActiveTab] = useState<'board' | 'town' | 'burrows'>('board');

  // Animation & Gameplay flags
  const [isRolling, setIsRolling] = useState(false);
  const [floatingToast, setFloatingToast] = useState<{ id: number; text: string; color: string } | null>(null);

  // Modal open states
  const [isPuzzleOpen, setIsPuzzleOpen] = useState(false);
  const [isMascotModalOpen, setIsMascotModalOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isTriviaOpen, setIsTriviaOpen] = useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [isRaidOpen, setIsRaidOpen] = useState(false);
  const [raidTarget, setRaidTarget] = useState<LeaderboardEntry | null>(null);
  const [isChestOpen, setIsChestOpen] = useState(false);
  const [levelUpData, setLevelUpData] = useState<LevelUpData | null>(null);
  const [isStreakModalOpen, setIsStreakModalOpen] = useState(false);

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
  const allMascots: Mascot[] = [...INITIAL_MASCOTS, ...gameState.customMascots].map((m) => {
    const currentLevel = (gameState.mascotLevels && gameState.mascotLevels[m.id]) || m.level || 1;
    const scaledMultiplier = calculateMascotMultiplier(
      m.uniqueAbility.multiplier,
      currentLevel,
      m.uniqueAbility.effectType
    );
    return {
      ...m,
      level: currentLevel,
      uniqueAbility: {
        ...m.uniqueAbility,
        multiplier: scaledMultiplier,
        description: getAbilityFormattedDescription(m.uniqueAbility, currentLevel),
      },
    };
  });
  const activeMascot = allMascots.find((m) => m.id === gameState.activeMascotId) || allMascots[0] || INITIAL_MASCOTS[0];
  const currentTown = gameState.towns[gameState.townIndex] || gameState.towns[0];

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
    showToast(
      `🎉 ${mascot.name} reached Level ${nextLvl}! Superpower upgraded to ${upgradedMultiplier}x multiplier!`,
      '#ffe600'
    );
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

  // Helper toast notification
  const showToast = (text: string, color = '#00f0ff') => {
    setFloatingToast({ id: Date.now(), text, color });
    setTimeout(() => setFloatingToast(null), 2500);
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

    let currentStep = 0;
    const hopInterval = setInterval(() => {
      currentStep += 1;
      SoundEngine.playBoardHop();

      setGameState((prev) => {
        const nextTile = (prev.currentTileIndex + 1) % BOARD_TILES.length;
        return { ...prev, currentTileIndex: nextTile };
      });

      if (currentStep >= totalSteps) {
        clearInterval(hopInterval);
        setIsRolling(false);

        // Resolve landed tile event
        const finalTileIndex = (gameState.currentTileIndex + totalSteps) % BOARD_TILES.length;
        handleTileLanded(BOARD_TILES[finalTileIndex], bet);
      }
    }, 180);
  };

  // Resolve tile event
  const handleTileLanded = (tile: BoardTile, betMultiplier: number) => {
    switch (tile.type) {
      case 'coin_small':
      case 'coin_big': {
        let earned = tile.rewardValue * betMultiplier;
        if (activeMascot.uniqueAbility.effectType === 'bonus_coins') {
          earned = Math.round(earned * activeMascot.uniqueAbility.multiplier);
        }
        SoundEngine.playCoinChime();
        setGameState((prev) => ({
          ...prev,
          coins: prev.coins + earned,
          stats: {
            ...prev.stats,
            totalCoinsEarned: prev.stats.totalCoinsEarned + earned,
          },
        }));
        addXp(30 * betMultiplier);
        showToast(`+${earned.toLocaleString()} Coins collected!`, '#39ff14');
        break;
      }

      case 'puzzle_challenge': {
        setIsPuzzleOpen(true);
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
        let addedRolls = tile.rewardValue * betMultiplier;
        if (activeMascot.uniqueAbility.effectType === 'lucky_dice') {
          addedRolls = Math.round(addedRolls * (activeMascot.uniqueAbility.multiplier * 0.75));
        }
        SoundEngine.playComboChime(2);
        setGameState((prev) => ({
          ...prev,
          rolls: Math.min(prev.maxRolls + 50, prev.rolls + addedRolls),
        }));
        showToast(`+${addedRolls} Energy Dice Rolls! (${activeMascot.name} Lv.${activeMascot.level} Boost)`, '#38bdf8');
        break;
      }

      case 'shield_vault': {
        SoundEngine.playComboChime(1);
        setGameState((prev) => ({
          ...prev,
          shields: Math.min(prev.maxShields, prev.shields + 1),
        }));
        showToast(`+1 Defense Shield armed!`, '#10b981');
        break;
      }

      case 'landmark_star': {
        let coinBonus = tile.rewardValue * betMultiplier;
        if (activeMascot.uniqueAbility.effectType === 'bonus_coins') {
          coinBonus = Math.round(coinBonus * activeMascot.uniqueAbility.multiplier);
        }
        SoundEngine.playCoinChime();
        setGameState((prev) => ({
          ...prev,
          coins: prev.coins + coinBonus,
        }));
        addXp(60 * betMultiplier);
        showToast(`Star Boost! +${coinBonus.toLocaleString()} 🪙 & XP! (${activeMascot.name} Boost)`, '#fbbf24');
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

  // Reflex Puzzle Completion Handler
  const handlePuzzleComplete = (reward: { coins: number; xp: number; streak: number; diceBonus: number }) => {
    setIsPuzzleOpen(false);
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
        onOpenMascots={() => setIsMascotModalOpen(true)}
        onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
        onOpenScanner={() => setIsScannerOpen(true)}
        onOpenLevelOverlay={handleOpenLevelOverview}
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
            onTileClick={(tile) => handleTileLanded(tile, gameState.rollMultiplier)}
          />
        )}

        {activeTab === 'town' && (
          <TownView
            town={currentTown}
            coins={gameState.coins}
            playerLevel={gameState.playerLevel}
            activeMascot={activeMascot}
            onUpgradeLandmark={handleUpgradeLandmark}
            onAdvanceNextTown={handleAdvanceNextTown}
          />
        )}

        {activeTab === 'burrows' && (
          <MascotBurrowsView
            mascots={allMascots}
            activeMascot={activeMascot}
            playerCoins={gameState.coins}
            burrows={currentBurrows}
            onSelectActiveMascot={(mascotId) => {
              setGameState((prev) => ({ ...prev, activeMascotId: mascotId }));
              const m = allMascots.find((x) => x.id === mascotId);
              showToast(`Equipped ${m?.name || 'Mascot'} as companion!`, '#ff007f');
            }}
            onUpgradeFeature={handleUpgradeBurrowFeature}
            onSelectStyle={handleSelectBurrowStyle}
          />
        )}
      </main>

      {/* Bottom Sticky Navigation Bar */}
      <footer className="w-full max-w-md mx-auto p-3 z-30">
        <nav className="w-full rounded-2xl bg-slate-950/90 border border-slate-800 p-1 flex items-center justify-between shadow-2xl backdrop-blur-md">
          <button
            onClick={() => {
              setActiveTab('board');
              SoundEngine.playBoardHop();
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex flex-col items-center gap-1 transition-all ${
              activeTab === 'board'
                ? 'bg-gradient-to-r from-fuchsia-600 to-pink-500 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Dices className="w-4 h-4" />
            <span className="text-[10px]">Neon Board</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('town');
              SoundEngine.playBoardHop();
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex flex-col items-center gap-1 transition-all ${
              activeTab === 'town'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span className="text-[10px]">Towns ({gameState.townIndex + 1}/3)</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('burrows');
              SoundEngine.playBoardHop();
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex flex-col items-center gap-1 transition-all ${
              activeTab === 'burrows'
                ? 'bg-gradient-to-r from-amber-400 via-orange-500 to-pink-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Home className="w-4 h-4" />
            <span className="text-[10px]">Burrows</span>
          </button>
        </nav>
      </footer>

      {/* ALL MODALS */}

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

      {/* 5. Global Leaderboard & Social Media Share */}
      <LeaderboardAndSocialModal
        isOpen={isLeaderboardOpen}
        playerName={gameState.playerName}
        playerScore={gameState.stats.totalCoinsEarned}
        townLevel={gameState.townIndex + 1}
        activeMascot={activeMascot}
        shields={gameState.shields}
        highestStreak={gameState.stats.highestStreak}
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
          setGameState((prev) => ({
            ...prev,
            coins: prev.coins + coins,
            rolls: prev.rolls + dice,
            shields: Math.min(prev.maxShields, prev.shields + shields),
          }));
          showToast(`Loot Claimed: +${coins.toLocaleString()} 🪙 & +${dice} 🎲!`, '#ffe600');
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
    </div>
  );
}
