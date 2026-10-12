import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Trophy, Flame, CheckCircle, Shield, Gift, ArrowRight } from 'lucide-react';
import { Mascot } from '../types';
import { DailyFeaturedPuzzle } from '../data/dailyPuzzleData';
import { SoundEngine } from '../utils/sound';

interface DailyFeaturedRewardModalProps {
  isOpen: boolean;
  activeMascot: Mascot;
  puzzle: DailyFeaturedPuzzle;
  coinsEarned: number;
  diceEarned: number;
  shieldsEarned: number;
  xpEarned: number;
  streak: number;
  onClaim: () => void;
}

export const DailyFeaturedRewardModal: React.FC<DailyFeaturedRewardModalProps> = ({
  isOpen,
  activeMascot,
  puzzle,
  coinsEarned,
  diceEarned,
  shieldsEarned,
  xpEarned,
  streak,
  onClaim,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <motion.div
        initial={{ scale: 0.85, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.85, opacity: 0, y: 20 }}
        className="w-full max-w-md rounded-3xl bg-[#090b20] border-2 border-amber-500/60 p-5 sm:p-6 shadow-[0_0_60px_rgba(245,158,11,0.35)] flex flex-col relative overflow-hidden"
      >
        {/* Glow Halo */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-32 bg-gradient-to-r from-amber-500/30 via-orange-500/30 to-fuchsia-600/30 blur-3xl pointer-events-none" />

        {/* Mascot & Trophy Header */}
        <div className="text-center relative z-10 mb-4">
          <div className="relative inline-block mb-2">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center text-4xl shadow-2xl border-2 border-white animate-bounce">
              🏆
            </div>
            <div className="absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 text-[10px] font-black border border-amber-500 flex items-center gap-1 shadow">
              <Flame className="w-3 h-3 fill-amber-400" />
              <span>{streak}d STREAK</span>
            </div>
          </div>

          <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 bg-amber-950/80 px-2.5 py-1 rounded-full border border-amber-500/40">
            24-HOUR DAILY CHALLENGE CLEARED
          </span>

          <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
            Daily Featured Victory!
          </h2>

          <p className="text-xs text-slate-300 max-w-xs mx-auto mt-0.5">
            You conquered <strong className="text-white">{puzzle.title}</strong> and secured the full daily jackpot reward cache!
          </p>
        </div>

        {/* Unique Daily Relic Reward Spotlight */}
        <div className="relative z-10 mb-3.5 p-3.5 rounded-2xl bg-gradient-to-r from-fuchsia-950/70 via-purple-950/50 to-indigo-950/70 border border-fuchsia-500/50 shadow-inner">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-fuchsia-900/60 border border-fuchsia-400 flex items-center justify-center text-2xl shrink-0 shadow-lg">
              {puzzle.uniqueReward.icon}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-[8px] font-black uppercase tracking-widest text-fuchsia-300 bg-fuchsia-950 px-1.5 py-0.2 rounded border border-fuchsia-500/40">
                  {puzzle.uniqueReward.rarity} DAILY RELIC
                </span>
                <span className="text-[10px] text-amber-300 font-bold flex items-center gap-0.5">
                  <Sparkles className="w-3 h-3" />
                  <span>UNLOCKED</span>
                </span>
              </div>
              <h4 className="text-sm font-black text-white truncate mt-0.5">
                {puzzle.uniqueReward.name}
              </h4>
              <p className="text-[10px] text-fuchsia-200 truncate">
                {puzzle.uniqueReward.perkText}
              </p>
            </div>
          </div>
        </div>

        {/* Resources Reward Breakdown Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 relative z-10 mb-4">
          <div className="p-2.5 rounded-xl bg-slate-950/80 border border-amber-500/40 text-center">
            <span className="text-lg">🪙</span>
            <div className="text-[9px] text-slate-400 uppercase font-bold">Coins</div>
            <div className="text-xs font-black text-amber-300 font-mono">
              +{coinsEarned.toLocaleString()}
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-950/80 border border-cyan-500/40 text-center">
            <span className="text-lg">🎲</span>
            <div className="text-[9px] text-slate-400 uppercase font-bold">Dice</div>
            <div className="text-xs font-black text-cyan-300 font-mono">
              +{diceEarned} Rolls
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-950/80 border border-blue-500/40 text-center">
            <span className="text-lg">🛡️</span>
            <div className="text-[9px] text-slate-400 uppercase font-bold">Shields</div>
            <div className="text-xs font-black text-blue-300 font-mono">
              +{shieldsEarned} Refill
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-950/80 border border-emerald-500/40 text-center">
            <span className="text-lg">⭐</span>
            <div className="text-[9px] text-slate-400 uppercase font-bold">XP Surge</div>
            <div className="text-xs font-black text-emerald-300 font-mono">
              +{xpEarned} XP
            </div>
          </div>
        </div>

        {/* Claim Rewards Button */}
        <button
          onClick={() => {
            SoundEngine.playCoinChime();
            onClaim();
          }}
          className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-400 via-orange-500 to-fuchsia-600 hover:from-amber-300 hover:via-orange-400 hover:to-fuchsia-500 text-slate-950 font-black text-sm uppercase tracking-wider shadow-[0_0_30px_rgba(245,158,11,0.6)] border border-white hover:brightness-110 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer z-10"
        >
          <Gift className="w-4 h-4 fill-slate-950" />
          <span>CLAIM DAILY FEATURED BOUNTY</span>
          <ArrowRight className="w-4 h-4 stroke-[3]" />
        </button>
      </motion.div>
    </div>
  );
};
