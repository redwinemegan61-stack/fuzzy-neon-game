import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, Sparkles, Dices, Coins, Shield, Star, 
  Crown, Zap, ArrowUpRight, Flame, Check 
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { SoundEngine } from '../utils/sound';

export interface LevelUpData {
  previousLevel: number;
  newLevel: number;
  rollsBonus: number;
  maxRollsBonus: number;
  coinsBonus: number;
  playerName: string;
}

interface PlayerLevelUpOverlayProps {
  data: LevelUpData | null;
  onClaim: () => void;
}

export function getRankTitle(level: number): { title: string; color: string } {
  if (level <= 1) return { title: 'NOVICE HOPPER', color: 'from-cyan-400 to-blue-500' };
  if (level === 2) return { title: 'RISING EXPLORER', color: 'from-teal-400 to-emerald-500' };
  if (level === 3) return { title: 'NEON ROLLER', color: 'from-amber-400 to-orange-500' };
  if (level === 4) return { title: 'VAULT CRACKER', color: 'from-fuchsia-400 to-pink-500' };
  if (level === 5) return { title: 'BURROW ARCHITECT', color: 'from-purple-400 to-indigo-500' };
  if (level === 6) return { title: 'HIGH ROLLER', color: 'from-rose-400 to-red-500' };
  if (level === 7) return { title: 'CYBER MASTER', color: 'from-cyan-300 to-fuchsia-400' };
  if (level === 8) return { title: 'STAR STRATEGIST', color: 'from-yellow-300 to-amber-500' };
  if (level === 9) return { title: 'COSMIC TYCOON', color: 'from-pink-400 to-purple-600' };
  return { title: 'LEGENDARY OVERLORD', color: 'from-amber-300 via-rose-400 to-cyan-400' };
}

export const PlayerLevelUpOverlay: React.FC<PlayerLevelUpOverlayProps> = ({ data, onClaim }) => {
  useEffect(() => {
    if (!data) return;

    // Trigger celebratory audio
    SoundEngine.playUpgradeFanfare();

    // Multi-stage fireworks and particle blast celebration
    const fireCelebrationCannons = () => {
      // Left Cannon
      confetti({
        particleCount: 60,
        angle: 60,
        spread: 70,
        origin: { x: 0.05, y: 0.75 },
        colors: ['#00f0ff', '#ff007f', '#ffe600', '#ffffff', '#a855f7'],
      });

      // Right Cannon
      confetti({
        particleCount: 60,
        angle: 120,
        spread: 70,
        origin: { x: 0.95, y: 0.75 },
        colors: ['#00f0ff', '#ff007f', '#ffe600', '#ffffff', '#10b981'],
      });

      // Center Big Star Burst
      confetti({
        particleCount: 80,
        spread: 100,
        origin: { x: 0.5, y: 0.45 },
        shapes: ['star', 'circle'],
        scalar: 1.2,
        colors: ['#ffe600', '#f59e0b', '#ec4899', '#38bdf8'],
      });
    };

    // First instant burst
    fireCelebrationCannons();

    // Second staggered burst after 400ms
    const t1 = setTimeout(() => {
      fireCelebrationCannons();
      SoundEngine.playCoinChime();
    }, 450);

    // Third delayed shimmer burst after 1200ms
    const t2 = setTimeout(() => {
      confetti({
        particleCount: 50,
        spread: 80,
        origin: { x: 0.5, y: 0.35 },
        colors: ['#ffe600', '#ffffff', '#00f0ff'],
      });
    }, 1200);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [data]);

  if (!data) return null;

  const rankInfo = getRankTitle(data.newLevel);

  const handleClaim = () => {
    SoundEngine.playCoinChime();
    confetti({
      particleCount: 40,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#ffe600', '#10b981', '#38bdf8'],
    });
    onClaim();
  };

  return (
    <AnimatePresence>
      <div 
        id="player-level-up-overlay-container" 
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md overflow-hidden select-none"
      >
        {/* Animated Background Rays & Ambient Glow */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
          {/* Pulsing Neon Orb */}
          <div className="w-[500px] h-[500px] rounded-full bg-gradient-to-r from-amber-500/25 via-fuchsia-600/20 to-cyan-500/25 blur-3xl animate-pulse" />
          
          {/* Rotating Sunburst Light Rays */}
          <div 
            className="absolute w-[600px] h-[600px] opacity-20 animate-[spin_24s_linear_infinite]"
            style={{
              background: 'conic-gradient(from 0deg at 50% 50%, #ffe600 0deg, transparent 20deg, #ff007f 45deg, transparent 65deg, #00f0ff 90deg, transparent 110deg, #ffe600 135deg, transparent 155deg, #a855f7 180deg, transparent 200deg, #ffe600 225deg, transparent 245deg, #ff007f 270deg, transparent 290deg, #00f0ff 315deg, transparent 335deg, #ffe600 360deg)'
            }}
          />
        </div>

        {/* Floating Ambient Sparkles Animation */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ 
                x: `${15 + (i * 7)}%`, 
                y: '100%', 
                opacity: 0,
                scale: 0.5 
              }}
              animate={{ 
                y: '-20%', 
                opacity: [0, 0.8, 0],
                scale: [0.5, 1.2, 0.6] 
              }}
              transition={{ 
                type: 'tween',
                duration: 3 + (i % 3) * 0.7, 
                repeat: Infinity, 
                delay: i * 0.25,
                ease: 'easeOut'
              }}
              className="absolute text-amber-300 text-lg"
            >
              ✦
            </motion.div>
          ))}
        </div>

        {/* Main Congratulatory Card & Crest */}
        <motion.div
          id="player-level-up-card"
          initial={{ scale: 0.6, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.7, opacity: 0, y: -20 }}
          transition={{ type: 'spring', damping: 18, stiffness: 220 }}
          className="relative w-full max-w-sm rounded-3xl bg-gradient-to-b from-[#11132e] via-[#0d0f26] to-[#070815] border-2 border-amber-400/80 shadow-[0_0_60px_rgba(251,191,36,0.35)] p-5 text-center flex flex-col items-center z-10 overflow-hidden"
        >
          {/* Top Decorative Header Accent */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-400 via-fuchsia-500 to-cyan-400" />

          {/* Congratulatory Ribbon Eyebrow */}
          <motion.div
            initial={{ y: -15, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/20 via-yellow-500/30 to-amber-500/20 border border-amber-400/50 text-amber-300 text-[11px] font-black tracking-wider uppercase mb-3 shadow-inner"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-spin" style={{ animationDuration: '6s' }} />
            <span>SPECTACULAR RANK UP</span>
            <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-spin" style={{ animationDuration: '6s' }} />
          </motion.div>

          {/* Central Congratulatory Crest Badge */}
          <div className="relative my-2 flex items-center justify-center">
            {/* Pulsing Outer Ring */}
            <motion.div
              animate={{ scale: [1, 1.15, 1], rotate: [0, 180, 360] }}
              transition={{ type: 'tween', duration: 12, repeat: Infinity, ease: 'linear' }}
              className="absolute -inset-4 rounded-full border-2 border-dashed border-amber-400/40 pointer-events-none"
            />
            
            {/* Glowing Golden Crest Backing */}
            <div className="relative w-28 h-28 rounded-full bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-600 p-1 shadow-[0_0_35px_rgba(251,191,36,0.6)] flex items-center justify-center">
              <div className="w-full h-full rounded-full bg-slate-950 flex flex-col items-center justify-center border-2 border-amber-200/60 relative overflow-hidden">
                {/* Metallic Highlights */}
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-amber-400/20 to-transparent pointer-events-none" />
                
                {/* Crown Icon */}
                <Crown className="w-6 h-6 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)] mb-0.5" />
                
                {/* Big Level Number */}
                <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-amber-200 to-amber-400 leading-none">
                  {data.newLevel}
                </span>
                
                <span className="text-[9px] font-black uppercase tracking-widest text-amber-300/90 mt-0.5">
                  LEVEL
                </span>
              </div>
            </div>

            {/* Orbiting Star Accents */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
              className="absolute w-36 h-36 pointer-events-none"
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-amber-400/90 text-slate-950 flex items-center justify-center text-xs font-black shadow-lg">
                ★
              </div>
            </motion.div>
          </div>

          {/* Congratulatory Title & Player Recognition */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="mt-2"
          >
            <h2 className="text-2xl font-black tracking-tight text-white flex items-center justify-center gap-1.5">
              <span>PLAYER LEVEL UP!</span>
            </h2>

            {/* Congratulatory Rank Badge */}
            <div className="mt-1 flex items-center justify-center">
              <span className={`px-3 py-0.5 rounded-full text-xs font-black tracking-wider uppercase text-slate-950 bg-gradient-to-r ${rankInfo.color} shadow-[0_0_12px_rgba(251,191,36,0.5)]`}>
                {rankInfo.title}
              </span>
            </div>

            <p className="text-xs text-slate-300 mt-2 max-w-[260px] mx-auto leading-relaxed">
              Congratulations <span className="text-white font-bold">{data.playerName}</span>! Your rank advancement grants exclusive progression rewards:
            </p>
          </motion.div>

          {/* Reward Badges Grid */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.35 }}
            className="w-full grid grid-cols-3 gap-2 mt-4"
          >
            {/* Rolls Bonus */}
            <div className="p-2.5 rounded-2xl bg-indigo-950/70 border border-cyan-400/40 flex flex-col items-center justify-center shadow-md">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center mb-1">
                <Dices className="w-4 h-4" />
              </div>
              <span className="text-sm font-black text-white">+{data.rollsBonus}</span>
              <span className="text-[10px] text-cyan-300 font-bold uppercase tracking-tight">Dice Rolls</span>
            </div>

            {/* Max Dice Expansion */}
            <div className="p-2.5 rounded-2xl bg-indigo-950/70 border border-fuchsia-400/40 flex flex-col items-center justify-center shadow-md">
              <div className="w-8 h-8 rounded-xl bg-fuchsia-500/20 text-fuchsia-400 flex items-center justify-center mb-1">
                <Zap className="w-4 h-4" />
              </div>
              <span className="text-sm font-black text-white">+{data.maxRollsBonus}</span>
              <span className="text-[10px] text-fuchsia-300 font-bold uppercase tracking-tight">Max Vault</span>
            </div>

            {/* Coins Bonus */}
            <div className="p-2.5 rounded-2xl bg-indigo-950/70 border border-amber-400/40 flex flex-col items-center justify-center shadow-md">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-1">
                <Coins className="w-4 h-4" />
              </div>
              <span className="text-sm font-black text-white">+{data.coinsBonus.toLocaleString()}</span>
              <span className="text-[10px] text-amber-300 font-bold uppercase tracking-tight">Coins</span>
            </div>
          </motion.div>

          {/* Mascot Synergy Perk Notification */}
          <div className="w-full mt-3 p-2 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] text-slate-300 flex items-center justify-center gap-2">
            <Flame className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
            <span>Mascot supercharge multiplier active!</span>
          </div>

          {/* Celebratory Claim Rewards Button */}
          <motion.button
            id="player-level-up-claim-btn"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.96 }}
            onClick={handleClaim}
            className="w-full mt-4 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-slate-950 font-black text-sm tracking-wider uppercase shadow-[0_0_25px_rgba(251,191,36,0.6)] flex items-center justify-center gap-2 border-2 border-white/60 hover:brightness-110 transition-all cursor-pointer"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>CLAIM REWARDS & CONTINUE</span>
          </motion.button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
