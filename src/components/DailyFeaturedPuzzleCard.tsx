import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Flame, Clock, Trophy, Sparkles, CheckCircle2, ChevronRight, Gift, ShieldAlert, Award } from 'lucide-react';
import { Mascot, GameState } from '../types';
import {
  DailyFeaturedPuzzle,
  getDailyFeaturedPuzzle,
  getTodayDateString,
  getTimeUntilDailyReset,
} from '../data/dailyPuzzleData';
import { SoundEngine } from '../utils/sound';
import { MascotAvatar } from './MascotAvatar';

interface DailyFeaturedPuzzleCardProps {
  activeMascot: Mascot;
  playerLevel: number;
  dailyFeaturedState?: GameState['dailyFeatured'];
  compact?: boolean;
  onPlayFeatured: (puzzle: DailyFeaturedPuzzle) => void;
  onViewRewardDetails?: (reward: DailyFeaturedPuzzle['uniqueReward']) => void;
}

export const DailyFeaturedPuzzleCard: React.FC<DailyFeaturedPuzzleCardProps> = ({
  activeMascot,
  playerLevel,
  dailyFeaturedState,
  compact = false,
  onPlayFeatured,
  onViewRewardDetails,
}) => {
  const [timerText, setTimerText] = useState(getTimeUntilDailyReset().formatted);
  const [showRewardModal, setShowRewardModal] = useState(false);

  // Update timer every second
  useEffect(() => {
    const interval = setInterval(() => {
      setTimerText(getTimeUntilDailyReset().formatted);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const todayStr = getTodayDateString();
  const featuredPuzzle = getDailyFeaturedPuzzle();
  const isCompletedToday = dailyFeaturedState?.lastCompletedDate === todayStr;
  const currentStreak = dailyFeaturedState?.consecutiveStreak || 0;

  // Calculate mascot bonus coins
  const baseCoins = featuredPuzzle.bonusCoins;
  let finalCoins = baseCoins;
  if (activeMascot.uniqueAbility.effectType === 'bonus_coins') {
    finalCoins = Math.round(baseCoins * activeMascot.uniqueAbility.multiplier);
  }

  // Mascot dice bonus if applicable
  let finalDice = featuredPuzzle.bonusDice;
  if (activeMascot.uniqueAbility.effectType === 'lucky_dice') {
    finalDice = Math.round(finalDice + 2);
  }

  return (
    <div
      className={`relative rounded-3xl overflow-hidden border-2 transition-all shadow-xl ${
        isCompletedToday
          ? 'bg-gradient-to-b from-slate-900/95 via-emerald-950/30 to-slate-950/95 border-emerald-500/40 shadow-[0_0_30px_rgba(16,185,129,0.15)]'
          : 'bg-gradient-to-b from-[#0f112e]/95 via-indigo-950/40 to-slate-950/95 border-amber-500/50 shadow-[0_0_35px_rgba(245,158,11,0.25)]'
      } ${compact ? 'p-3 sm:p-4' : 'p-4 sm:p-5'}`}
    >
      {/* Background Animated Neon Mesh Gradient */}
      <div
        className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-20 pointer-events-none -mr-16 -mt-16"
        style={{ background: featuredPuzzle.accentColor }}
      />
      <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full blur-3xl opacity-15 pointer-events-none -ml-12 -mb-12 bg-fuchsia-600" />

      {/* Header Bar: Status Badge + Live 24H Reset Countdown */}
      <div className="flex items-center justify-between gap-2 mb-3 relative z-10 flex-wrap">
        <div className="flex items-center gap-1.5">
          <div
            className={`px-2.5 py-1 rounded-full text-[10px] font-black tracking-wider uppercase flex items-center gap-1.5 shadow-sm ${
              isCompletedToday
                ? 'bg-emerald-950/90 text-emerald-300 border border-emerald-500/50'
                : 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-[0_0_12px_rgba(245,158,11,0.5)]'
            }`}
          >
            {isCompletedToday ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>COMPLETED TODAY</span>
              </>
            ) : (
              <>
                <Flame className="w-3.5 h-3.5 fill-slate-950 animate-pulse" />
                <span>DAILY FEATURED PUZZLE</span>
              </>
            )}
          </div>

          {currentStreak > 0 && (
            <div className="px-2 py-0.5 rounded-full bg-slate-900/90 text-amber-300 border border-amber-500/30 text-[10px] font-bold flex items-center gap-1">
              <span>🔥</span>
              <span>{currentStreak}d Streak</span>
            </div>
          )}
        </div>

        {/* 24-Hour Countdown Timer */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/90 border border-slate-700/80 text-slate-300 text-[10px] font-mono font-bold shadow-inner">
          <Clock className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-slate-400 text-[9px] uppercase tracking-wider">Reset:</span>
          <span className="text-cyan-300">{timerText}</span>
        </div>
      </div>

      {/* Main Puzzle Identity Banner */}
      <div className="relative z-10 mb-3">
        <div className="flex items-start gap-3">
          <div
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center text-2xl sm:text-3xl shrink-0 shadow-lg border border-white/20 relative"
            style={{
              background: `linear-gradient(135deg, ${featuredPuzzle.accentColor}33, #020617)`,
              borderColor: featuredPuzzle.accentColor,
            }}
          >
            {featuredPuzzle.icon}
            <span className="absolute -top-1 -right-1 px-1 rounded bg-amber-400 text-slate-950 font-black text-[8px] border border-slate-900 uppercase">
              24H
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <span
                className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded bg-slate-900/80 border"
                style={{ color: featuredPuzzle.accentColor, borderColor: `${featuredPuzzle.accentColor}55` }}
              >
                {featuredPuzzle.badge}
              </span>
              <span className="text-[10px] text-slate-400 font-semibold truncate">
                Objective: {featuredPuzzle.objective}
              </span>
            </div>

            <h3 className="text-base sm:text-lg font-black text-white tracking-tight leading-snug">
              {featuredPuzzle.title}
            </h3>

            <p className="text-xs text-slate-300 leading-relaxed line-clamp-2 mt-0.5">
              {featuredPuzzle.tagline}
            </p>
          </div>
        </div>
      </div>

      {/* Rewards Showcase Grid */}
      <div className="relative z-10 mb-3.5 p-3 rounded-2xl bg-slate-950/70 border border-slate-800/80">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
            <Gift className="w-3.5 h-3.5 text-amber-400" />
            <span>24H Daily Rewards Cache:</span>
          </span>
          <div className="flex items-center gap-1.5 bg-amber-950/80 px-2 py-0.5 rounded-full border border-amber-500/30">
            <div className="w-4 h-4">
              <MascotAvatar mascot={activeMascot} size="sm" showHairGlow={false} interactive={false} />
            </div>
            <span className="text-[9px] font-black text-amber-300">
              {activeMascot.name} {activeMascot.uniqueAbility.multiplier}x Boost
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {/* Bonus Coins */}
          <div className="p-2 rounded-xl bg-slate-900/80 border border-amber-500/30 flex items-center gap-2">
            <span className="text-lg">🪙</span>
            <div>
              <div className="text-[9px] text-slate-400 uppercase font-bold">Coins</div>
              <div className="text-xs font-black text-amber-300 font-mono">
                +{finalCoins.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Energy Dice */}
          <div className="p-2 rounded-xl bg-slate-900/80 border border-cyan-500/30 flex items-center gap-2">
            <span className="text-lg">🎲</span>
            <div>
              <div className="text-[9px] text-slate-400 uppercase font-bold">Energy Dice</div>
              <div className="text-xs font-black text-cyan-300 font-mono">
                +{finalDice} Rolls
              </div>
            </div>
          </div>

          {/* Shield Refill */}
          <div className="p-2 rounded-xl bg-slate-900/80 border border-blue-500/30 flex items-center gap-2">
            <span className="text-lg">🛡️</span>
            <div>
              <div className="text-[9px] text-slate-400 uppercase font-bold">Shield Vault</div>
              <div className="text-xs font-black text-blue-300 font-mono">
                +{featuredPuzzle.bonusShield} Aegis
              </div>
            </div>
          </div>

          {/* Unique Daily Artifact / Relic */}
          <button
            type="button"
            onClick={() => setShowRewardModal(true)}
            className="p-2 rounded-xl bg-gradient-to-r from-fuchsia-950/60 to-purple-950/60 border border-fuchsia-500/40 flex items-center gap-2 text-left hover:brightness-125 transition-all cursor-pointer group"
          >
            <span className="text-lg group-hover:scale-110 transition-transform">
              {featuredPuzzle.uniqueReward.icon}
            </span>
            <div className="min-w-0">
              <div className="text-[8px] text-fuchsia-400 uppercase font-black truncate">
                {featuredPuzzle.uniqueReward.rarity} Relic
              </div>
              <div className="text-[11px] font-black text-white truncate group-hover:text-fuchsia-300">
                {featuredPuzzle.uniqueReward.name}
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Action Button: Play or Status */}
      <div className="relative z-10 flex items-center gap-2">
        {isCompletedToday ? (
          <div className="w-full flex items-center justify-between gap-2 p-2.5 rounded-2xl bg-emerald-950/50 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>You solved today&apos;s featured puzzle and claimed all bonuses!</span>
            </div>
            <button
              onClick={() => {
                SoundEngine.playBoardHop();
                onPlayFeatured(featuredPuzzle);
              }}
              className="py-1 px-3 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[10px] font-black uppercase tracking-wider transition-all border border-emerald-500/40 shrink-0 cursor-pointer"
            >
              Replay Challenge
            </button>
          </div>
        ) : (
          <button
            onClick={() => {
              SoundEngine.playDiceRoll();
              onPlayFeatured(featuredPuzzle);
            }}
            className="w-full py-3 sm:py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-400 via-orange-500 to-fuchsia-600 hover:from-amber-300 hover:via-orange-400 hover:to-fuchsia-500 text-slate-950 font-black text-xs sm:text-sm uppercase tracking-wider shadow-[0_0_25px_rgba(245,158,11,0.5)] border border-white hover:brightness-110 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 fill-slate-950" />
            <span>PLAY TODAY&apos;S FEATURED PUZZLE (+{finalCoins.toLocaleString()} 🪙)</span>
            <ChevronRight className="w-4 h-4 stroke-[3]" />
          </button>
        )}
      </div>

      {/* Unique Daily Relic Inspection Modal */}
      <AnimatePresence>
        {showRewardModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm rounded-3xl bg-[#0c0e29] border-2 border-fuchsia-500/50 p-5 shadow-2xl relative overflow-hidden"
            >
              <div className="text-center mb-4">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-fuchsia-950/80 border-2 border-fuchsia-400/80 flex items-center justify-center text-4xl mb-2 shadow-[0_0_20px_rgba(217,70,239,0.5)]">
                  {featuredPuzzle.uniqueReward.icon}
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-fuchsia-950 text-fuchsia-300 border border-fuchsia-500/40">
                  {featuredPuzzle.uniqueReward.rarity} Daily Relic
                </span>
                <h3 className="text-lg font-black text-white mt-1">
                  {featuredPuzzle.uniqueReward.name}
                </h3>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  {featuredPuzzle.uniqueReward.description}
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950 border border-fuchsia-500/30 mb-4 text-center">
                <div className="text-[10px] font-bold text-fuchsia-400 uppercase tracking-wider mb-0.5">
                  Exclusive Daily Perk
                </div>
                <div className="text-xs font-black text-white">
                  {featuredPuzzle.uniqueReward.perkText}
                </div>
              </div>

              <button
                onClick={() => setShowRewardModal(false)}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-black text-xs uppercase tracking-wider transition-colors cursor-pointer"
              >
                Close Relic Preview
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
