import React from 'react';
import { motion } from 'motion/react';
import { 
  Flame, Sparkles, Coins, Dices, Shield, 
  Check, Lock, Crown, X, Clock
} from 'lucide-react';
import { DAILY_STREAK_REWARDS, StreakRewardTier } from '../data/dailyStreakData';
import { DailyStreakState } from '../types';
import { SoundEngine } from '../utils/sound';
import confetti from 'canvas-confetti';

interface DailyStreakModalProps {
  isOpen: boolean;
  streakState: DailyStreakState;
  onClaim: (reward: StreakRewardTier) => void;
  onSimulateNextDay?: () => void;
  onClose: () => void;
}

export const DailyStreakModal: React.FC<DailyStreakModalProps> = ({
  isOpen,
  streakState,
  onClaim,
  onSimulateNextDay,
  onClose,
}) => {
  if (!isOpen) return null;

  // Active day index (1-based, capped at 7 or cyclical)
  const currentDayNumber = ((streakState.currentStreak - 1) % 7) + 1;
  const todayReward = DAILY_STREAK_REWARDS.find((r) => r.day === currentDayNumber) || DAILY_STREAK_REWARDS[0];

  const handleClaim = () => {
    if (streakState.claimedToday) return;

    SoundEngine.playCoinChime();
    confetti({
      particleCount: 80,
      spread: 80,
      origin: { y: 0.6 },
      colors: ['#ffe600', '#f59e0b', '#ec4899', '#00f0ff', '#10b981'],
    });

    onClaim(todayReward);
  };

  return (
    <div 
      id="daily-streak-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-md overflow-y-auto"
    >
      <motion.div
        id="daily-streak-modal-card"
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 15 }}
        transition={{ type: 'spring', damping: 20, stiffness: 240 }}
        className="w-full max-w-md rounded-3xl bg-gradient-to-b from-[#11132c] via-[#0d0e22] to-[#070817] border-2 border-amber-500/50 p-5 shadow-[0_0_50px_rgba(245,158,11,0.25)] flex flex-col items-center relative overflow-hidden text-center"
      >
        {/* Ambient Top Glow */}
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-72 h-40 bg-amber-500/20 blur-3xl pointer-events-none rounded-full" />
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-all z-20 cursor-pointer"
          title="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Top Eyebrow Banner */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-[11px] font-black tracking-wider uppercase mb-2">
          <Flame className="w-3.5 h-3.5 fill-amber-400 text-amber-400 animate-pulse" />
          <span>DAILY LOGIN STREAK</span>
        </div>

        {/* Title & Consecutive Days Counter */}
        <h2 className="text-2xl font-black text-white tracking-tight flex items-center justify-center gap-2">
          <span>Day {streakState.currentStreak} Streak!</span>
        </h2>
        <p className="text-xs text-slate-300 mt-1 max-w-[320px]">
          Play every consecutive day to unlock escalated coin windfalls, energy dice rolls, and defensive shields!
        </p>

        {/* 7-Day Reward Grid */}
        <div className="w-full grid grid-cols-4 gap-2 mt-4">
          {DAILY_STREAK_REWARDS.map((tier) => {
            const isPast = tier.day < currentDayNumber || (tier.day === currentDayNumber && streakState.claimedToday);
            const isToday = tier.day === currentDayNumber;
            const isUpcoming = tier.day > currentDayNumber;

            // Day 7 is styled as wide grand jackpot taking remaining 2 columns or special span
            const isDay7 = tier.day === 7;

            return (
              <div
                key={tier.day}
                className={`relative rounded-2xl p-2 flex flex-col items-center justify-between transition-all ${
                  isDay7 ? 'col-span-2 bg-gradient-to-br from-amber-950/80 via-indigo-950/90 to-purple-950/90 border-2' : ''
                } ${
                  isToday && !streakState.claimedToday
                    ? 'bg-amber-950/70 border-2 border-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.4)] scale-102 z-10'
                    : isToday && streakState.claimedToday
                    ? 'bg-emerald-950/40 border border-emerald-500/50'
                    : isPast
                    ? 'bg-slate-900/60 border border-slate-800 opacity-75'
                    : 'bg-slate-900/80 border border-slate-800'
                }`}
              >
                {/* Header Tag / Day Label */}
                <div className="w-full flex items-center justify-between text-[10px] font-black">
                  <span className={isToday ? 'text-amber-300' : isPast ? 'text-emerald-400' : 'text-slate-400'}>
                    Day {tier.day}
                  </span>
                  {tier.highlightTag && (
                    <span className="text-[8px] font-bold px-1 rounded bg-amber-400/20 text-amber-300 uppercase truncate max-w-[65px]">
                      {tier.highlightTag}
                    </span>
                  )}
                </div>

                {/* Central Reward Icon / Graphic */}
                <div className="my-1.5 relative flex items-center justify-center">
                  {tier.isGrandJackpot ? (
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-400 to-yellow-200 text-slate-950 flex items-center justify-center shadow-md">
                      <Crown className="w-6 h-6 fill-amber-900 text-amber-950" />
                    </div>
                  ) : tier.shields > 0 ? (
                    <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center">
                      <Shield className="w-4 h-4 fill-sky-400/30" />
                    </div>
                  ) : tier.rolls >= 25 ? (
                    <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center">
                      <Dices className="w-4 h-4" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center">
                      <Coins className="w-4 h-4" />
                    </div>
                  )}

                  {/* Claimed check overlay */}
                  {isPast && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center text-[10px] font-black border border-white">
                      ✓
                    </div>
                  )}
                </div>

                {/* Reward breakdown text */}
                <div className="text-[10px] font-bold text-slate-200 leading-tight">
                  <div className="text-amber-300 font-black">+{tier.coins.toLocaleString()} 🪙</div>
                  {tier.rolls > 0 && <div className="text-cyan-300">+{tier.rolls} 🎲</div>}
                  {tier.shields > 0 && <div className="text-sky-300">+{tier.shields} 🛡️</div>}
                </div>

                {/* Status indicator pill */}
                <div className="w-full mt-1.5">
                  {isPast ? (
                    <span className="text-[8px] font-bold text-emerald-400 block text-center">CLAIMED</span>
                  ) : isToday ? (
                    <span className="text-[9px] font-black text-amber-300 uppercase block text-center animate-pulse">
                      TODAY!
                    </span>
                  ) : (
                    <span className="text-[8px] font-bold text-slate-500 flex items-center justify-center gap-0.5">
                      <Lock className="w-2.5 h-2.5" />
                      <span>LOCKED</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Button: Claim or Claimed Status */}
        <div className="w-full mt-5">
          {!streakState.claimedToday ? (
            <motion.button
              id="claim-daily-streak-btn"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleClaim}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-slate-950 font-black text-sm tracking-wider uppercase shadow-[0_0_30px_rgba(251,191,36,0.6)] flex items-center justify-center gap-2 border-2 border-white/60 hover:brightness-110 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>CLAIM DAY {currentDayNumber} REWARDS (+{todayReward.coins.toLocaleString()} 🪙)</span>
            </motion.button>
          ) : (
            <div className="w-full py-3 px-4 rounded-2xl bg-emerald-950/70 border border-emerald-500/50 text-emerald-300 text-xs font-bold flex items-center justify-center gap-2">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>Day {currentDayNumber} rewards claimed! Return tomorrow for Day {((currentDayNumber % 7) + 1)}!</span>
            </div>
          )}
        </div>

        {/* Dev / Preview Utility: Simulate Next Day */}
        {onSimulateNextDay && (
          <div className="mt-3 flex items-center justify-between w-full pt-2 border-t border-slate-800 text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Total Days: {streakState.totalDaysClaimed || 0}</span>
            </span>
            <button
              onClick={() => {
                SoundEngine.playPop();
                onSimulateNextDay();
              }}
              className="text-[10px] font-bold text-cyan-400 hover:text-cyan-300 px-2 py-1 rounded-lg bg-cyan-950/60 border border-cyan-500/30 hover:border-cyan-400 transition-all cursor-pointer"
              title="Fast forward to test consecutive day streaks"
            >
              ⚡ Test Next Day Streak
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};
