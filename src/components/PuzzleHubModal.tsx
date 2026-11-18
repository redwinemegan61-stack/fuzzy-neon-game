import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, Gamepad2, Flame, Trophy, Clock, CheckCircle2 } from 'lucide-react';
import { Mascot, GameState } from '../types';
import { MascotAvatar } from './MascotAvatar';
import { GemMatch3PuzzleView } from './puzzles/GemMatch3PuzzleView';
import { WordFindPuzzleView } from './puzzles/WordFindPuzzleView';
import { MiniCrosswordView } from './puzzles/MiniCrosswordView';
import { BlockStackerPuzzleView } from './puzzles/BlockStackerPuzzleView';
import { LaserStackPuzzleView } from './puzzles/LaserStackPuzzleView';
import { SoundEngine } from '../utils/sound';
import {
  DailyFeaturedPuzzle,
  getDailyFeaturedPuzzle,
  getTodayDateString,
  getTimeUntilDailyReset,
} from '../data/dailyPuzzleData';

export type PuzzleCategory = 'gem_match' | 'word_find' | 'crossword' | 'block_stack' | 'laser_stack' | 'reflex';

interface PuzzleHubModalProps {
  isOpen: boolean;
  activeMascot: Mascot;
  playerLevel: number;
  townLevel: number;
  initialCategory?: PuzzleCategory;
  dailyFeaturedState?: GameState['dailyFeatured'];
  onLaunchReflexGame: () => void;
  onCompleteReward: (reward: { coins: number; xp: number; diceBonus: number; sourceTitle: string }) => void;
  onCompleteDailyFeatured?: (puzzle: DailyFeaturedPuzzle, baseReward: { coins: number; xp: number; diceBonus: number }) => void;
  onWatchAdBonus?: () => void;
  onClose: () => void;
}

export const PuzzleHubModal: React.FC<PuzzleHubModalProps> = ({
  isOpen,
  activeMascot,
  playerLevel,
  townLevel,
  initialCategory = 'gem_match',
  dailyFeaturedState,
  onLaunchReflexGame,
  onCompleteReward,
  onCompleteDailyFeatured,
  onWatchAdBonus,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<PuzzleCategory>(initialCategory);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [resetTimer, setResetTimer] = useState(getTimeUntilDailyReset().formatted);

  // Sync tab if initialCategory changes
  useEffect(() => {
    setActiveTab(initialCategory);
  }, [initialCategory]);

  // Live timer for 24h reset
  useEffect(() => {
    const timer = setInterval(() => {
      setResetTimer(getTimeUntilDailyReset().formatted);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (!isOpen) return null;

  const todayStr = getTodayDateString();
  const featuredPuzzle = getDailyFeaturedPuzzle();
  const isCompletedToday = dailyFeaturedState?.lastCompletedDate === todayStr;
  const isViewingFeaturedCategory = activeTab === featuredPuzzle.category;

  const getDifficultyMultiplier = (diff: 'easy' | 'medium' | 'hard') => {
    switch (diff) {
      case 'easy':
        return 1.0;
      case 'medium':
        return 1.5;
      case 'hard':
        return 2.5;
    }
  };

  const handleGameSolved = (baseReward: { coins: number; xp: number; diceBonus: number }, sourceTitle: string) => {
    const mult = getDifficultyMultiplier(difficulty);
    const scaledReward = {
      coins: Math.round(baseReward.coins * mult),
      xp: Math.round(baseReward.xp * mult),
      diceBonus: Math.round(baseReward.diceBonus * (mult > 1 ? Math.sqrt(mult) : 1)),
    };

    if (isViewingFeaturedCategory && !isCompletedToday && onCompleteDailyFeatured) {
      onCompleteDailyFeatured(featuredPuzzle, {
        coins: Math.round(featuredPuzzle.bonusCoins * mult),
        xp: scaledReward.xp,
        diceBonus: scaledReward.diceBonus,
      });
    } else {
      onCompleteReward({ ...scaledReward, sourceTitle: `${sourceTitle} (${difficulty.toUpperCase()})` });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-md rounded-3xl bg-[#080a1e] border-2 border-indigo-500/40 p-4 sm:p-5 shadow-[0_0_50px_rgba(0,240,255,0.3)] flex flex-col relative overflow-hidden my-auto max-h-[92vh]"
      >
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-16 bg-gradient-to-r from-fuchsia-600/20 via-cyan-500/20 to-indigo-600/20 blur-2xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between mb-2.5 z-10">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <MascotAvatar mascot={activeMascot} size="sm" interactive={false} />
              <div className="absolute -bottom-1 -right-1 px-1 rounded bg-amber-400 text-slate-950 text-[7px] font-black border border-white">
                Lv.{activeMascot.level}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] uppercase font-black tracking-widest text-cyan-400">
                  Neon Puzzle Arcade
                </span>
                <span className="text-[9px] bg-amber-950/80 text-amber-300 font-black px-1.5 py-0.2 rounded-full border border-amber-500/30">
                  {activeMascot.name} Boost
                </span>
              </div>
              <h2 className="text-base font-black text-white flex items-center gap-1.5">
                <span>Puzzle Arena</span>
                <span className="text-xs text-slate-400 font-bold">({activeMascot.uniqueAbility.multiplier}x Multiplier)</span>
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 24-Hour Daily Featured Puzzle Banner in Hub */}
        <div
          onClick={() => {
            if (activeTab !== featuredPuzzle.category) {
              setActiveTab(featuredPuzzle.category);
              SoundEngine.playBoardHop();
            }
          }}
          className={`mb-3 p-2.5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden z-10 ${
            isViewingFeaturedCategory
              ? 'bg-gradient-to-r from-amber-950/70 via-indigo-950/70 to-fuchsia-950/70 border-amber-500/70 shadow-[0_0_20px_rgba(245,158,11,0.2)]'
              : 'bg-slate-950/80 hover:bg-slate-900 border-slate-800 hover:border-amber-500/40'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-lg shrink-0">{featuredPuzzle.icon}</span>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[8px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-0.5">
                    <Flame className="w-2.5 h-2.5 fill-amber-400" />
                    <span>DAILY FEATURED (24H)</span>
                  </span>
                  {isCompletedToday ? (
                    <span className="text-[8px] font-bold text-emerald-400 bg-emerald-950 px-1 rounded flex items-center gap-0.5">
                      <CheckCircle2 className="w-2.5 h-2.5" /> Claimed
                    </span>
                  ) : (
                    <span className="text-[8px] font-black text-amber-300 bg-amber-950/80 px-1 rounded border border-amber-500/30">
                      +{featuredPuzzle.bonusCoins.toLocaleString()} 🪙
                    </span>
                  )}
                </div>
                <div className="text-xs font-black text-white truncate">
                  {featuredPuzzle.title}
                </div>
              </div>
            </div>

            <div className="text-right shrink-0">
              <div className="text-[8px] text-slate-400 font-mono flex items-center gap-1 justify-end">
                <Clock className="w-2.5 h-2.5 text-cyan-400" />
                <span>{resetTimer}</span>
              </div>
              <span className="text-[9px] font-bold text-cyan-300">
                {isViewingFeaturedCategory ? '★ Active Tab' : 'Switch Tab ➔'}
              </span>
            </div>
          </div>
        </div>

        {/* Difficulty Level Selection */}
        <div className="mb-3 flex items-center justify-between gap-1.5 p-1 rounded-2xl bg-slate-950/90 border border-slate-800 z-10">
          <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-2 flex items-center gap-1">
            <span>⚙️</span>
            <span>Difficulty:</span>
          </div>
          <div className="grid grid-cols-3 gap-1 flex-1">
            <button
              onClick={() => {
                setDifficulty('easy');
                SoundEngine.playBoardHop();
              }}
              className={`py-1.5 px-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer ${
                difficulty === 'easy'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-md scale-102'
                  : 'text-slate-400 hover:text-white bg-slate-900/60'
              }`}
            >
              <span>🌱</span>
              <span>Easy (1x)</span>
            </button>

            <button
              onClick={() => {
                setDifficulty('medium');
                SoundEngine.playBoardHop();
              }}
              className={`py-1.5 px-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer ${
                difficulty === 'medium'
                  ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 shadow-md scale-102'
                  : 'text-slate-400 hover:text-white bg-slate-900/60'
              }`}
            >
              <span>⭐</span>
              <span>Medium (1.5x)</span>
            </button>

            <button
              onClick={() => {
                setDifficulty('hard');
                SoundEngine.playBoardHop();
              }}
              className={`py-1.5 px-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer ${
                difficulty === 'hard'
                  ? 'bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-md scale-102'
                  : 'text-slate-400 hover:text-white bg-slate-900/60'
              }`}
            >
              <span>🔥</span>
              <span>Hard (2.5x)</span>
            </button>
          </div>
        </div>

        {/* Category Tabs: Gem Match, Word Find, Crossword, Block Stacker, Laser Stack, Reflex */}
        <div className="grid grid-cols-6 gap-1 p-1 rounded-2xl bg-slate-950/90 border border-slate-800 mb-3 z-10">
          <button
            onClick={() => {
              setActiveTab('gem_match');
              SoundEngine.playBoardHop();
            }}
            className={`py-1.5 px-0.5 rounded-xl text-[9px] font-black uppercase tracking-wider flex flex-col items-center gap-0.5 transition-all relative ${
              activeTab === 'gem_match'
                ? 'bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-md scale-102'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>💎</span>
            <span className="text-[7.5px] sm:text-[8.5px]">Gems</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('word_find');
              SoundEngine.playBoardHop();
            }}
            className={`py-1.5 px-0.5 rounded-xl text-[9px] font-black uppercase tracking-wider flex flex-col items-center gap-0.5 transition-all relative ${
              activeTab === 'word_find'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-950 shadow-md scale-102'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {featuredPuzzle.category === 'word_find' && (
              <span className="absolute -top-1 px-1 bg-amber-400 text-slate-950 text-[6px] font-black rounded-full uppercase">
                DAILY
              </span>
            )}
            <span>🔤</span>
            <span className="text-[7.5px] sm:text-[8.5px]">Words</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('crossword');
              SoundEngine.playBoardHop();
            }}
            className={`py-1.5 px-0.5 rounded-xl text-[9px] font-black uppercase tracking-wider flex flex-col items-center gap-0.5 transition-all relative ${
              activeTab === 'crossword'
                ? 'bg-gradient-to-r from-fuchsia-500 to-pink-500 text-white shadow-md scale-102'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {featuredPuzzle.category === 'crossword' && (
              <span className="absolute -top-1 px-1 bg-amber-400 text-slate-950 text-[6px] font-black rounded-full uppercase">
                DAILY
              </span>
            )}
            <span>✍️</span>
            <span className="text-[7.5px] sm:text-[8.5px]">Cross</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('block_stack');
              SoundEngine.playBoardHop();
            }}
            className={`py-1.5 px-0.5 rounded-xl text-[9px] font-black uppercase tracking-wider flex flex-col items-center gap-0.5 transition-all relative ${
              activeTab === 'block_stack'
                ? 'bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 shadow-md scale-102'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {featuredPuzzle.category === 'block_stack' && (
              <span className="absolute -top-1 px-1 bg-amber-400 text-slate-950 text-[6px] font-black rounded-full uppercase">
                DAILY
              </span>
            )}
            <span>🕹️</span>
            <span className="text-[7.5px] sm:text-[8.5px]">Stacker</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('laser_stack');
              SoundEngine.playBoardHop();
            }}
            className={`py-1.5 px-0.5 rounded-xl text-[9px] font-black uppercase tracking-wider flex flex-col items-center gap-0.5 transition-all relative ${
              activeTab === 'laser_stack'
                ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-md scale-102'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {featuredPuzzle.category === 'laser_stack' && (
              <span className="absolute -top-1 px-1 bg-amber-400 text-slate-950 text-[6px] font-black rounded-full uppercase">
                DAILY
              </span>
            )}
            <span>⚡</span>
            <span className="text-[7.5px] sm:text-[8.5px]">Laser</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('reflex');
              SoundEngine.playBoardHop();
            }}
            className={`py-1.5 px-0.5 rounded-xl text-[9px] font-black uppercase tracking-wider flex flex-col items-center gap-0.5 transition-all relative ${
              activeTab === 'reflex'
                ? 'bg-gradient-to-r from-emerald-400 to-teal-400 text-slate-950 shadow-md scale-102'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {featuredPuzzle.category === 'reflex' && (
              <span className="absolute -top-1 px-1 bg-amber-400 text-slate-950 text-[6px] font-black rounded-full uppercase">
                DAILY
              </span>
            )}
            <span>🎯</span>
            <span className="text-[7.5px] sm:text-[8.5px]">Reflex</span>
          </button>
        </div>

        {/* Active Tab View Content Container */}
        <div className="flex-1 overflow-y-auto px-0.5 z-10">
          {activeTab === 'gem_match' && (
            <GemMatch3PuzzleView
              activeMascot={activeMascot}
              playerLevel={playerLevel}
              onWatchAdBonus={onWatchAdBonus}
              onCompleteReward={(reward) => {
                handleGameSolved(reward, 'Gem Match-3 Crush!');
              }}
            />
          )}

          {activeTab === 'word_find' && (
            <WordFindPuzzleView
              activeMascot={activeMascot}
              playerLevel={playerLevel}
              onWatchAdBonus={onWatchAdBonus}
              onCompleteReward={(reward) => {
                handleGameSolved(reward, 'Word Find Solved!');
              }}
            />
          )}

          {activeTab === 'crossword' && (
            <MiniCrosswordView
              activeMascot={activeMascot}
              playerLevel={playerLevel}
              onWatchAdBonus={onWatchAdBonus}
              onCompleteReward={(reward) => {
                handleGameSolved(reward, 'Crossword Solved!');
              }}
            />
          )}

          {activeTab === 'block_stack' && (
            <BlockStackerPuzzleView
              activeMascot={activeMascot}
              playerLevel={playerLevel}
              onCompleteReward={(reward) => {
                handleGameSolved(reward, 'Block Stacker Jackpot!');
              }}
            />
          )}

          {activeTab === 'laser_stack' && (
            <LaserStackPuzzleView
              activeMascot={activeMascot}
              playerLevel={playerLevel}
              onCompleteReward={(reward) => {
                handleGameSolved(reward, 'Laser Stack Jackpot!');
              }}
            />
          )}

          {activeTab === 'reflex' && (
            <div className="flex flex-col items-center justify-center p-6 text-center gap-4 bg-slate-900/60 rounded-3xl border border-indigo-900/50">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-fuchsia-600 to-cyan-500 flex items-center justify-center text-3xl shadow-xl animate-pulse">
                ⚡
              </div>
              <div>
                <h3 className="text-base font-black text-white mb-1">
                  High-Speed Reflex Challenges
                </h3>
                <p className="text-xs text-slate-300 max-w-xs leading-relaxed">
                  Pulse Matrix, Laser Slicer, and Cyber Lock challenges tested with reaction speeds and rhythm combos!
                </p>
              </div>

              <button
                onClick={() => {
                  onClose();
                  onLaunchReflexGame();
                }}
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-fuchsia-500 via-pink-500 to-cyan-400 text-slate-950 font-black text-sm uppercase tracking-wider shadow-[0_0_25px_rgba(255,0,127,0.5)] border border-white hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Gamepad2 className="w-4 h-4 fill-slate-950" />
                <span>LAUNCH REFLEX SUITE ➔</span>
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
