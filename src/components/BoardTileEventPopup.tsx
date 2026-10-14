import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Coins, Flame, Shield, Star, Sparkles, Zap, Check, ArrowUpRight } from 'lucide-react';
import { BoardTile, Mascot } from '../types';
import { SoundEngine } from '../utils/sound';
import { MascotAvatar } from './MascotAvatar';
import confetti from 'canvas-confetti';

export type BoardTileEventType = 'coins' | 'dice' | 'shield' | 'star';

export interface BoardTileEventData {
  id: string;
  tile: BoardTile;
  type: BoardTileEventType;
  totalAmount: number;
  baseAmount: number;
  multiplier: number;
  mascotBonusAmount?: number;
  activeMascot: Mascot;
  xpEarned?: number;
}

interface BoardTileEventPopupProps {
  event: BoardTileEventData | null;
  onClose: () => void;
}

// Generate pre-calculated radial particle angles for explosive burst
const BURST_PARTICLES = Array.from({ length: 12 }, (_, i) => {
  const angle = (i * 30 * Math.PI) / 180;
  const distance = 80 + (i % 3) * 25;
  return {
    id: i,
    x: Math.cos(angle) * distance,
    y: Math.sin(angle) * distance,
    size: i % 2 === 0 ? 18 : 12,
    delay: (i % 4) * 0.03,
  };
});

// Flying collection particles when user taps collect
const FLYING_TOKENS = Array.from({ length: 8 }, (_, i) => ({
  id: i,
  delay: i * 0.04,
  offsetX: (i - 3.5) * 22,
  offsetY: (Math.random() - 0.5) * 30,
}));

export const BoardTileEventPopup: React.FC<BoardTileEventPopupProps> = ({ event, onClose }) => {
  const [isCollecting, setIsCollecting] = useState(false);

  useEffect(() => {
    if (!event) {
      setIsCollecting(false);
      return;
    }

    // Sound effect trigger on popup mount
    if (event.type === 'coins' || event.type === 'star') {
      SoundEngine.playCoinChime();
      if (event.totalAmount >= 3000) {
        confetti({
          particleCount: 35,
          spread: 60,
          origin: { y: 0.55 },
          colors: ['#ffe600', '#fbbf24', '#f59e0b', '#39ff14'],
        });
      }
    } else if (event.type === 'dice') {
      SoundEngine.playComboChime(3);
      if (event.totalAmount >= 10) {
        confetti({
          particleCount: 30,
          spread: 55,
          origin: { y: 0.55 },
          colors: ['#38bdf8', '#00f0ff', '#818cf8', '#c084fc'],
        });
      }
    } else if (event.type === 'shield') {
      SoundEngine.playComboChime(2);
    }

    // Auto-dismiss after 2.4s if not manually collected
    const autoTimer = setTimeout(() => {
      handleCollect();
    }, 2400);

    return () => clearTimeout(autoTimer);
  }, [event?.id]);

  const handleCollect = () => {
    if (isCollecting) return;
    setIsCollecting(true);
    SoundEngine.playPop();

    // Allow flying collection animation to play briefly before unmounting
    setTimeout(() => {
      onClose();
      setIsCollecting(false);
    }, 320);
  };

  if (!event) return null;

  const { tile, type, totalAmount, baseAmount, multiplier, mascotBonusAmount, activeMascot, xpEarned } = event;

  // Mascot cheer quote customized to the collection event
  const getCheerQuote = () => {
    if (type === 'coins') {
      if (activeMascot.id === 'boba') return "*Squeak-yip! Coin Magnet surge!* 🦋💰";
      if (activeMascot.id === 'pip') return "*Boing boing! Golden leaf treasure!* 🐾✨";
      if (activeMascot.id === 'ziggy') return "*Nom nom! Shinies for everyone!* 🫐🪙";
      return `*Woohoo! Big cash stash!* 🐾✨`;
    }
    if (type === 'dice') {
      if (activeMascot.id === 'pip') return "*Whoosh! Rolling high speed!* 🐾⚡";
      if (activeMascot.id === 'boba') return "*Flutter power! Free rolls refill!* 🦋🎲";
      return `*Super dice recharge!* 🎲⚡`;
    }
    if (type === 'shield') {
      return `*Fortress barrier locked in!* 🛡️✨`;
    }
    return `*Star power soaring to the moon!* ⭐🚀`;
  };

  // Color schemes by event type
  const theme = {
    coins: {
      primary: '#ffe600',
      secondary: '#f59e0b',
      border: 'border-amber-400/80',
      glow: 'shadow-[0_0_50px_rgba(255,230,0,0.35)]',
      bgGlow: 'from-amber-500/25 via-yellow-500/10 to-transparent',
      textGrad: 'from-yellow-300 via-amber-400 to-yellow-500',
      label: 'COINS COLLECTED!',
      iconEmoji: '🪙',
      targetY: -350,
      targetX: -120, // towards top left coins counter
    },
    dice: {
      primary: '#38bdf8',
      secondary: '#0284c7',
      border: 'border-cyan-400/80',
      glow: 'shadow-[0_0_50px_rgba(56,189,248,0.35)]',
      bgGlow: 'from-cyan-500/25 via-sky-500/10 to-transparent',
      textGrad: 'from-cyan-300 via-sky-400 to-blue-500',
      label: 'ENERGY DICE COLLECTED!',
      iconEmoji: '🎲',
      targetY: -350,
      targetX: 120, // towards top right dice counter
    },
    shield: {
      primary: '#10b981',
      secondary: '#059669',
      border: 'border-emerald-400/80',
      glow: 'shadow-[0_0_50px_rgba(16,185,129,0.35)]',
      bgGlow: 'from-emerald-500/25 via-teal-500/10 to-transparent',
      textGrad: 'from-emerald-300 via-teal-400 to-green-500',
      label: 'DEFENSE SHIELD ARMED!',
      iconEmoji: '🛡️',
      targetY: -350,
      targetX: 0,
    },
    star: {
      primary: '#fbbf24',
      secondary: '#d97706',
      border: 'border-amber-400/80',
      glow: 'shadow-[0_0_50px_rgba(251,191,36,0.35)]',
      bgGlow: 'from-amber-500/25 via-purple-500/15 to-transparent',
      textGrad: 'from-amber-200 via-yellow-400 to-amber-500',
      label: 'STAR POWER BONUS!',
      iconEmoji: '⭐',
      targetY: -350,
      targetX: -80,
    },
  }[type];

  return (
    <div
      onClick={handleCollect}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md cursor-pointer select-none"
    >
      {/* Expanding Shockwave Ring on Entry */}
      <motion.div
        key={`shockwave-${event.id}`}
        initial={{ scale: 0.3, opacity: 0.9 }}
        animate={{ scale: [0.3, 1.4, 2.2], opacity: [0.9, 0.4, 0] }}
        transition={{ duration: 0.9, ease: 'easeOut' }}
        className="absolute w-72 h-72 rounded-full border-4 pointer-events-none"
        style={{ borderColor: theme.primary }}
      />

      {/* Second Subtle Shockwave Wave */}
      <motion.div
        key={`shockwave-2-${event.id}`}
        initial={{ scale: 0.2, opacity: 0.7 }}
        animate={{ scale: [0.2, 1.2, 1.9], opacity: [0.7, 0.3, 0] }}
        transition={{ duration: 1.1, delay: 0.12, ease: 'easeOut' }}
        className="absolute w-80 h-80 rounded-full border-2 pointer-events-none"
        style={{ borderColor: theme.secondary }}
      />

      {/* Main Punchy Card Modal Container with Framer Motion spring physics */}
      <motion.div
        key={`card-${event.id}`}
        initial={{ scale: 0.25, y: 55, rotate: -7, opacity: 0 }}
        animate={{
          scale: isCollecting ? 0.85 : 1,
          y: isCollecting ? -40 : 0,
          rotate: isCollecting ? 4 : 0,
          opacity: isCollecting ? 0 : 1,
        }}
        exit={{ scale: 0.85, y: -45, opacity: 0 }}
        transition={{
          type: 'spring',
          stiffness: 460,
          damping: 22,
          mass: 0.8,
        }}
        onClick={(e) => {
          e.stopPropagation();
          handleCollect();
        }}
        className={`w-full max-w-[340px] rounded-3xl bg-[#090b22] border-2 ${theme.border} p-5 ${theme.glow} flex flex-col items-center text-center relative overflow-hidden backdrop-blur-xl shadow-2xl cursor-pointer`}
      >
        {/* Radial Ambient Glow Background */}
        <div className={`absolute inset-0 bg-gradient-to-b ${theme.bgGlow} pointer-events-none`} />

        {/* Ambient Spinning Sunburst Rays behind hero emblem */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 16, ease: 'linear' }}
          className="absolute -top-12 left-1/2 -translate-x-1/2 w-80 h-80 opacity-20 pointer-events-none -z-10"
        >
          <div
            className="w-full h-full"
            style={{
              background: `repeating-conic-gradient(from 0deg, ${theme.primary} 0deg 15deg, transparent 15deg 30deg)`,
            }}
          />
        </motion.div>

        {/* Top Tile Badge */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/90 border text-[11px] font-black uppercase tracking-wider mb-2 shadow-sm"
          style={{ borderColor: tile.neonColor }}
        >
          <span
            className="w-2.5 h-2.5 rounded-full inline-block animate-pulse"
            style={{ backgroundColor: tile.neonColor }}
          />
          <span className="text-white">{tile.name}</span>
          <span className="text-slate-400">• Landed!</span>
        </motion.div>

        {/* Hero Reward Icon Stage with Punchy Scale Bounce & Flying Particles */}
        <div className="relative my-2 w-28 h-28 flex items-center justify-center">
          {/* Radial Particle Explosion on Entry */}
          {BURST_PARTICLES.map((p) => (
            <motion.div
              key={p.id}
              initial={{ x: 0, y: 0, scale: 0, opacity: 0 }}
              animate={{
                x: p.x,
                y: p.y,
                scale: [0, 1.3, 0.9, 0],
                opacity: [0, 1, 0.9, 0],
              }}
              transition={{
                duration: 0.85,
                delay: 0.05 + p.delay,
                ease: 'easeOut',
              }}
              className="absolute pointer-events-none z-20 flex items-center justify-center font-bold"
              style={{ fontSize: `${p.size}px` }}
            >
              {type === 'coins' ? (p.id % 3 === 0 ? '✨' : '🪙') : type === 'dice' ? (p.id % 2 === 0 ? '🎲' : '⚡') : '⭐'}
            </motion.div>
          ))}

          {/* Central Hero Emblem with Punchy Pop-in */}
          <motion.div
            initial={{ scale: 0.2, rotate: -25 }}
            animate={{
              scale: 1,
              rotate: 0,
            }}
            transition={{
              type: 'spring',
              stiffness: 500,
              damping: 18,
              mass: 0.7,
            }}
            className="relative z-10 w-24 h-24 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.4)]"
            style={{
              background: `radial-gradient(circle, ${theme.primary} 0%, ${theme.secondary} 100%)`,
            }}
          >
            {/* Shimmer Highlight */}
            <div className="absolute inset-1 rounded-xl border border-white/40 pointer-events-none" />
            <div className="absolute top-1 left-2 right-2 h-1/3 bg-gradient-to-b from-white/40 to-transparent rounded-t-lg pointer-events-none" />

            {/* Icon Graphic */}
            {type === 'coins' && <Coins className="w-13 h-13 text-slate-950 stroke-[2.5] drop-shadow-md" />}
            {type === 'dice' && <Flame className="w-13 h-13 text-slate-950 stroke-[2.5] drop-shadow-md" />}
            {type === 'shield' && <Shield className="w-13 h-13 text-slate-950 stroke-[2.5] drop-shadow-md" />}
            {type === 'star' && <Star className="w-13 h-13 text-slate-950 stroke-[2.5] fill-slate-950 drop-shadow-md" />}

            {/* Pulsing Corner Sparkles */}
            <motion.div
              animate={{ scale: [1, 1.4, 1], opacity: [0.7, 1, 0.7] }}
              transition={{ repeat: Infinity, duration: 1.2 }}
              className="absolute -top-1 -right-1 text-white"
            >
              <Sparkles className="w-5 h-5" />
            </motion.div>
          </motion.div>
        </div>

        {/* Big Juicy Punchy Reward Number */}
        <motion.div
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.14, type: 'spring', stiffness: 450, damping: 20 }}
          className="mb-1"
        >
          <div
            className={`text-3xl font-black tracking-tight bg-gradient-to-r ${theme.textGrad} bg-clip-text text-transparent drop-shadow-[0_2px_12px_rgba(255,255,255,0.3)]`}
          >
            +{totalAmount.toLocaleString()} {type === 'coins' ? 'COINS' : type === 'dice' ? 'ROLLS' : type === 'shield' ? 'SHIELD' : 'STAR BOOST'}
          </div>
          <div className="text-[10px] font-black uppercase tracking-wider text-slate-300 mt-0.5">
            {theme.label}
          </div>
        </motion.div>

        {/* Detailed Breakdown Chips (Base, Bet Multiplier, Mascot Bonus) */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22 }}
          className="w-full flex flex-wrap items-center justify-center gap-1.5 my-2 text-[10px] font-bold"
        >
          <span className="px-2 py-0.5 rounded-lg bg-slate-900/90 border border-slate-700 text-slate-300">
            Base: +{baseAmount.toLocaleString()}
          </span>

          {multiplier > 1 && (
            <span className="px-2 py-0.5 rounded-lg bg-indigo-950/80 border border-indigo-500/40 text-cyan-300 font-black">
              ⚡ {multiplier}X Bet Multiplier
            </span>
          )}

          {mascotBonusAmount && mascotBonusAmount > 0 && (
            <span className="px-2 py-0.5 rounded-lg bg-amber-950/80 border border-amber-500/40 text-amber-300 font-black flex items-center gap-1">
              <span>✨ {activeMascot.name} Boost (+{mascotBonusAmount.toLocaleString()})</span>
            </span>
          )}

          {xpEarned && xpEarned > 0 && (
            <span className="px-2 py-0.5 rounded-lg bg-purple-950/80 border border-purple-500/40 text-fuchsia-300 font-black">
              ⭐ +{xpEarned} Mascot XP
            </span>
          )}
        </motion.div>

        {/* Mascot Cheering Cameo Strip */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28 }}
          className="w-full p-2 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center gap-2.5 my-1 text-left"
        >
          <div className="relative flex-shrink-0">
            <MascotAvatar
              mascot={activeMascot}
              size="sm"
              isDancing={true}
              showHairGlow={false}
              interactive={false}
            />
            <div className="absolute -bottom-1 -right-1 px-1 rounded bg-amber-400 text-slate-950 text-[7px] font-black border border-white">
              Lv.{activeMascot.level}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <span className="text-xs font-black text-white">{activeMascot.name}</span>
              <span className="text-[9px] text-amber-300 font-bold">
                ({activeMascot.uniqueAbility.multiplier}x {activeMascot.uniqueAbility.name})
              </span>
            </div>
            <p className="text-[10px] text-cyan-300 font-medium italic truncate">
              {getCheerQuote()}
            </p>
          </div>
        </motion.div>

        {/* Snappy Collect Button with Hover & Tap feedback */}
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.94 }}
          onClick={(e) => {
            e.stopPropagation();
            handleCollect();
          }}
          className={`w-full mt-2.5 py-3 rounded-2xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 text-slate-950 shadow-lg cursor-pointer transition-all ${
            type === 'coins'
              ? 'bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-500 hover:brightness-110'
              : type === 'dice'
              ? 'bg-gradient-to-r from-cyan-300 via-sky-400 to-blue-400 hover:brightness-110'
              : type === 'shield'
              ? 'bg-gradient-to-r from-emerald-300 via-teal-400 to-green-400 hover:brightness-110'
              : 'bg-gradient-to-r from-amber-300 via-yellow-400 to-orange-400 hover:brightness-110'
          }`}
        >
          <Check className="w-4 h-4 stroke-[3]" />
          <span>COLLECT (+{totalAmount.toLocaleString()}) 💥</span>
        </motion.button>

        {/* Auto-Dismiss Countdown Bar */}
        <div className="w-full h-1 bg-slate-800 rounded-full mt-2 overflow-hidden">
          <motion.div
            initial={{ width: '100%' }}
            animate={{ width: '0%' }}
            transition={{ duration: 2.3, ease: 'linear' }}
            className="h-full rounded-full"
            style={{ backgroundColor: theme.primary }}
          />
        </div>
        <span className="text-[8px] text-slate-400 mt-1 uppercase tracking-wider">
          Tap anywhere or auto-collects in 2s
        </span>

        {/* Flying Collection Cascade Animation towards top counters on exit */}
        <AnimatePresence>
          {isCollecting && (
            <div className="absolute inset-0 pointer-events-none z-50">
              {FLYING_TOKENS.map((token) => (
                <motion.div
                  key={token.id}
                  initial={{ x: token.offsetX, y: 0, scale: 1, opacity: 1 }}
                  animate={{
                    x: theme.targetX + token.offsetX * 0.4,
                    y: theme.targetY + token.offsetY,
                    scale: [1, 1.25, 0.4],
                    opacity: [1, 1, 0],
                  }}
                  transition={{
                    duration: 0.38,
                    delay: token.delay,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-2xl drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]"
                >
                  {theme.iconEmoji}
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
