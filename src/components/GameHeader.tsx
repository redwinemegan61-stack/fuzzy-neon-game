import React from 'react';
import { motion } from 'motion/react';
import { Coins, Shield, Trophy, Sparkles, Volume2, Plus, Star, Flame, Gamepad2, ArrowLeftRight } from 'lucide-react';
import { Mascot } from '../types';
import { MascotAvatar } from './MascotAvatar';
import { SoundEngine } from '../utils/sound';

interface GameHeaderProps {
  playerName: string;
  playerLevel: number;
  xp: number;
  xpToNextLevel: number;
  coins: number;
  shields: number;
  maxShields: number;
  activeMascot: Mascot;
  dailyStreakDays?: number;
  dailyStreakClaimedToday?: boolean;
  duplicateTradesCount?: number;
  unclaimedAchievementsCount?: number;
  onOpenDailyStreak?: () => void;
  onOpenPuzzles?: () => void;
  onOpenMascots: () => void;
  onOpenLeaderboard: () => void;
  onOpenScanner: () => void;
  onOpenLevelOverlay?: () => void;
  onOpenTradingPost?: () => void;
}

export const GameHeader: React.FC<GameHeaderProps> = ({
  playerName,
  playerLevel,
  xp,
  xpToNextLevel,
  coins,
  shields,
  maxShields,
  activeMascot,
  dailyStreakDays = 1,
  dailyStreakClaimedToday = false,
  duplicateTradesCount = 0,
  unclaimedAchievementsCount = 0,
  onOpenDailyStreak,
  onOpenPuzzles,
  onOpenMascots,
  onOpenLeaderboard,
  onOpenScanner,
  onOpenLevelOverlay,
  onOpenTradingPost,
}) => {
  return (
    <header className="w-full max-w-md mx-auto px-3 py-2 flex flex-col gap-2">
      {/* Top Status Strip */}
      <div className="flex items-center justify-between gap-2">
        {/* Player Profile & Active Mascot */}
        <div
          className="flex items-center gap-2 p-1 pr-3 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-amber-500/40 transition-all shadow-md backdrop-blur-md"
        >
          <div 
            onClick={() => {
              SoundEngine.playMascotSqueak('squeak');
              onOpenMascots();
            }}
            className="relative cursor-pointer hover:scale-105 transition-transform" 
            title="Mascot Sanctuary & Squeaks"
          >
            <MascotAvatar mascot={activeMascot} size="sm" showHairGlow={false} interactive={false} />
            <div className="absolute -bottom-1 -right-1 px-1 rounded-md bg-amber-400 text-slate-950 text-[8px] font-black border border-white">
              Lv.{activeMascot.level}
            </div>
          </div>
          <div 
            onClick={onOpenLevelOverlay || onOpenMascots}
            className="cursor-pointer group" 
            title="View Player Rank & Level Celebration"
          >
            <div className="text-xs font-black text-white leading-tight flex items-center gap-1.5">
              <span>{playerName}</span>
              <span className="text-[9px] text-amber-300 font-black px-1.5 py-0.5 rounded-md bg-amber-500/20 border border-amber-400/40 group-hover:bg-amber-500/40 transition-all flex items-center gap-0.5">
                <Star className="w-2.5 h-2.5 fill-amber-300 text-amber-300" />
                <span>Rank {playerLevel}</span>
              </span>
            </div>
            {/* XP Mini Bar */}
            <div className="w-20 bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1 relative">
              <div
                className="bg-gradient-to-r from-cyan-400 to-amber-300 h-full transition-all duration-300"
                style={{ width: `${Math.min(100, (xp / xpToNextLevel) * 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Currency, Shield & Daily Streak Badges */}
        <div className="flex items-center gap-1.5">
          {/* Daily Streak Trigger */}
          {onOpenDailyStreak && (
            <button
              id="header-daily-streak-btn"
              onClick={onOpenDailyStreak}
              className={`flex items-center gap-1 px-2 py-1.5 rounded-xl border shadow-md transition-all cursor-pointer relative ${
                !dailyStreakClaimedToday
                  ? 'bg-gradient-to-r from-amber-950 to-orange-950 border-amber-400/90 text-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.35)]'
                  : 'bg-slate-900/90 border-slate-800 text-slate-300 hover:border-amber-500/40'
              }`}
              title="Daily Login Streak Rewards"
            >
              <Flame className={`w-3.5 h-3.5 ${!dailyStreakClaimedToday ? 'text-amber-400 fill-amber-400 animate-bounce' : 'text-orange-400 fill-orange-400/40'}`} />
              <span className="text-[11px] font-black">
                D.{dailyStreakDays}
              </span>
              {!dailyStreakClaimedToday && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-rose-500 border border-white animate-pulse" />
              )}
            </button>
          )}

          {/* Shields */}
          <div className="flex items-center gap-1 px-2 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 shadow-md">
            <Shield className="w-3.5 h-3.5 text-sky-400" />
            <span className="text-xs font-black text-white">
              {shields}/{maxShields}
            </span>
          </div>

          {/* Coins */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-950/80 to-slate-900 border border-amber-500/40 shadow-md">
            <div className="w-4 h-4 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center font-black text-[10px]">
              🪙
            </div>
            <span className="text-xs font-black text-amber-300">
              {coins.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Quick Action Navigation Bar */}
      <div className="flex items-center justify-between gap-1.5">
        {onOpenPuzzles && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.96 }}
            onClick={onOpenPuzzles}
            className="flex-1 py-1.5 px-2 rounded-xl bg-gradient-to-r from-fuchsia-950/80 to-pink-950/80 border border-fuchsia-500/50 hover:border-fuchsia-400 text-fuchsia-300 hover:text-white text-[11px] font-black flex items-center justify-center gap-1 transition-all shadow-[0_0_12px_rgba(255,0,127,0.25)]"
          >
            <Gamepad2 className="w-3.5 h-3.5 text-fuchsia-400 animate-pulse" />
            <span>Puzzles</span>
          </motion.button>
        )}

        <button
          onClick={onOpenMascots}
          className="flex-1 py-1.5 px-2 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-[11px] font-bold flex items-center justify-center gap-1 transition-all"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Mascots</span>
        </button>

        {onOpenTradingPost && (
          <button
            onClick={onOpenTradingPost}
            className="flex-1 py-1.5 px-2 rounded-xl bg-gradient-to-r from-amber-950/80 to-orange-950/80 border border-amber-500/50 hover:border-amber-400 text-amber-300 hover:text-white text-[11px] font-black flex items-center justify-center gap-1 transition-all relative shadow-sm"
            title="Trade duplicate burrow items with global players"
          >
            <ArrowLeftRight className="w-3.5 h-3.5 text-amber-400" />
            <span>Trade</span>
            {duplicateTradesCount > 0 && (
              <span className="absolute -top-1 -right-1 px-1 rounded-full bg-lime-400 text-slate-950 text-[8px] font-black border border-white">
                {duplicateTradesCount}
              </span>
            )}
          </button>
        )}

        <button
          onClick={onOpenScanner}
          className="flex-1 py-1.5 px-2 rounded-xl bg-cyan-950/60 border border-cyan-500/40 hover:border-cyan-400 text-cyan-300 text-[11px] font-bold flex items-center justify-center gap-1 transition-all shadow-sm"
        >
          <Plus className="w-3.5 h-3.5 text-cyan-400" />
          <span>AI Scan</span>
        </button>

        <button
          onClick={onOpenLeaderboard}
          className="flex-1 py-1.5 px-2 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-[11px] font-bold flex items-center justify-center gap-1 transition-all relative"
          title="Leaderboard & Milestones"
        >
          <Trophy className="w-3.5 h-3.5 text-amber-400" />
          <span>Trophies</span>
          {unclaimedAchievementsCount > 0 && (
            <span className="w-2 h-2 rounded-full bg-pink-500 animate-ping absolute -top-1 -right-1" />
          )}
          {unclaimedAchievementsCount > 0 && (
            <span className="px-1 rounded-full bg-pink-500 text-white text-[8px] font-black absolute -top-1 -right-1 shadow-sm">
              {unclaimedAchievementsCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
};
