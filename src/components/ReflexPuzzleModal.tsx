import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, Timer, Flame, CheckCircle2, AlertTriangle, ShieldCheck, Sparkles, X } from 'lucide-react';
import { Mascot, ReflexGameType } from '../types';
import { SoundEngine } from '../utils/sound';
import { MascotAvatar } from './MascotAvatar';
import confetti from 'canvas-confetti';

interface ReflexPuzzleModalProps {
  isOpen: boolean;
  townLevel: number;
  activeMascot: Mascot;
  forcedGameType?: ReflexGameType;
  onComplete: (reward: { coins: number; xp: number; streak: number; diceBonus: number }) => void;
  onClose: () => void;
}

export const ReflexPuzzleModal: React.FC<ReflexPuzzleModalProps> = ({
  isOpen,
  townLevel,
  activeMascot,
  forcedGameType,
  onComplete,
  onClose,
}) => {
  // Select game type randomly if not forced
  const [gameType, setGameType] = useState<ReflexGameType>('pulse_matrix');
  const [gameState, setGameState] = useState<'countdown' | 'playing' | 'won' | 'lost'>('countdown');
  const [countdown, setCountdown] = useState(3);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [shieldUsed, setShieldUsed] = useState(false);
  const [mascotCheer, setMascotCheer] = useState<string>('');

  // Target count needed to win
  const targetRequired = Math.min(10, 5 + Math.floor(townLevel / 2));

  // Pulse Matrix / Chroma Tap State
  const [currentTargetColor, setCurrentTargetColor] = useState<string>('#00f0ff');
  const [targetLabel, setTargetLabel] = useState<string>('ALPHA');
  const [timeLeftMs, setTimeLeftMs] = useState(1200);
  const [maxTimePerStep, setMaxTimePerStep] = useState(1200);

  // Cyber Lock State
  const [needleAngle, setNeedleAngle] = useState(0);
  const [targetAngleRange, setTargetAngleRange] = useState<[number, number]>([120, 160]);
  const [pinsUnlocked, setPinsUnlocked] = useState(0);
  const pinsNeeded = Math.min(5, 3 + Math.floor(townLevel / 3));

  // Laser Deflector State
  const [incomingLaser, setIncomingLaser] = useState<{ id: number; color: string; direction: 'top' | 'right' | 'bottom' | 'left' } | null>(null);

  // Timer Ref
  const timerRef = useRef<any>(null);

  const colors = [
    { name: 'CYAN', color: '#00f0ff', label: 'ALPHA' },
    { name: 'PINK', color: '#ff007f', label: 'BETA' },
    { name: 'LIME', color: '#39ff14', label: 'GAMMA' },
    { name: 'GOLD', color: '#ffe600', label: 'DELTA' },
  ];

  // Base reaction time calculation scaling with town level (faster as you level up!)
  const baseReactionTime = Math.max(
    650,
    1400 - (townLevel - 1) * 75
  ) * (activeMascot.uniqueAbility.effectType === 'slow_time' ? activeMascot.uniqueAbility.multiplier : 1.0);

  // Initialize game on open
  useEffect(() => {
    if (!isOpen) return;

    const gameTypes: ReflexGameType[] = ['pulse_matrix', 'laser_slicer', 'cyber_lock'];
    const chosenType = forcedGameType || gameTypes[Math.floor(Math.random() * gameTypes.length)];
    setGameType(chosenType);

    setGameState('countdown');
    setCountdown(3);
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setShieldUsed(false);
    setPinsUnlocked(0);
    setMascotCheer(activeMascot.cheerQuote);
    SoundEngine.playMascotSqueak('squeak');

    // Initial countdown
    const cdInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(cdInterval);
          startPlaying(chosenType);
          return 0;
        }
        SoundEngine.playDiceRoll();
        return prev - 1;
      });
    }, 800);

    return () => clearInterval(cdInterval);
  }, [isOpen, townLevel, forcedGameType]);

  const startPlaying = (type: ReflexGameType) => {
    setGameState('playing');
    if (type === 'pulse_matrix') {
      nextPulseMatrixRound();
    } else if (type === 'cyber_lock') {
      startCyberLockRound();
    } else if (type === 'laser_slicer') {
      spawnIncomingLaser();
    }
  };

  const switchGameType = (newType: ReflexGameType) => {
    if (timerRef.current) clearInterval(timerRef.current);
    SoundEngine.playBoardHop();
    setGameType(newType);
    setGameState('playing');
    setCountdown(0);
    setScore(0);
    setStreak(0);
    setPinsUnlocked(0);
    startPlaying(newType);
  };

  // 1. PULSE MATRIX LOGIC
  const nextPulseMatrixRound = () => {
    const randomItem = colors[Math.floor(Math.random() * colors.length)];
    setCurrentTargetColor(randomItem.color);
    setTargetLabel(randomItem.label);

    const stepTime = Math.round(baseReactionTime);
    setMaxTimePerStep(stepTime);
    setTimeLeftMs(stepTime);

    if (timerRef.current) clearInterval(timerRef.current);
    const intervalMs = 25;
    timerRef.current = setInterval(() => {
      setTimeLeftMs((prev) => {
        if (prev <= intervalMs) {
          clearInterval(timerRef.current);
          handleMiss();
          return 0;
        }
        return prev - intervalMs;
      });
    }, intervalMs);
  };

  const handlePulseTap = (colorHex: string) => {
    if (gameState !== 'playing') return;

    if (colorHex === currentTargetColor) {
      // Hit!
      clearInterval(timerRef.current);
      SoundEngine.playLaserHit(1 + streak * 0.1);
      const newScore = score + 1;
      const newStreak = streak + 1;
      setScore(newScore);
      setStreak(newStreak);
      setBestStreak((prev) => Math.max(prev, newStreak));

      if (newScore >= targetRequired) {
        handleWin(newStreak);
      } else {
        nextPulseMatrixRound();
      }
    } else {
      // Missed!
      handleMiss();
    }
  };

  // 2. CYBER LOCK LOGIC
  const startCyberLockRound = () => {
    setNeedleAngle(0);
    // Random target arc between 40 and 320 deg
    const startArc = Math.floor(Math.random() * 260) + 40;
    const arcWidth = Math.max(30, 60 - townLevel * 3);
    setTargetAngleRange([startArc, startArc + arcWidth]);

    if (timerRef.current) clearInterval(timerRef.current);
    const speed = (2.8 + townLevel * 0.4) * (activeMascot.uniqueAbility.effectType === 'slow_time' ? 0.8 : 1.0);

    timerRef.current = setInterval(() => {
      setNeedleAngle((prev) => (prev + speed) % 360);
    }, 20);
  };

  const handleCyberLockPress = () => {
    if (gameState !== 'playing') return;

    const [minAngle, maxAngle] = targetAngleRange;
    const isHit = needleAngle >= minAngle && needleAngle <= maxAngle;

    if (isHit) {
      clearInterval(timerRef.current);
      SoundEngine.playLaserHit(1.4);
      const newPins = pinsUnlocked + 1;
      setPinsUnlocked(newPins);
      setScore(newPins);
      setStreak((prev) => prev + 1);

      if (newPins >= pinsNeeded) {
        handleWin(streak + 1);
      } else {
        startCyberLockRound();
      }
    } else {
      handleMiss();
    }
  };

  // 3. LASER SLICER LOGIC
  const spawnIncomingLaser = () => {
    const directions: Array<'top' | 'right' | 'bottom' | 'left'> = ['top', 'right', 'bottom', 'left'];
    const randomDir = directions[Math.floor(Math.random() * directions.length)];
    const randomColor = colors[Math.floor(Math.random() * colors.length)].color;

    setIncomingLaser({
      id: Date.now(),
      color: randomColor,
      direction: randomDir,
    });

    const stepTime = Math.round(baseReactionTime * 1.1);
    setMaxTimePerStep(stepTime);
    setTimeLeftMs(stepTime);

    if (timerRef.current) clearInterval(timerRef.current);
    const intervalMs = 25;
    timerRef.current = setInterval(() => {
      setTimeLeftMs((prev) => {
        if (prev <= intervalMs) {
          clearInterval(timerRef.current);
          handleMiss();
          return 0;
        }
        return prev - intervalMs;
      });
    }, intervalMs);
  };

  const handleLaserDeflect = (colorHex: string) => {
    if (gameState !== 'playing' || !incomingLaser) return;

    if (colorHex === incomingLaser.color) {
      clearInterval(timerRef.current);
      SoundEngine.playLaserHit(1.2 + streak * 0.1);
      const newScore = score + 1;
      const newStreak = streak + 1;
      setScore(newScore);
      setStreak(newStreak);
      setBestStreak((prev) => Math.max(prev, newStreak));

      if (newScore >= targetRequired) {
        handleWin(newStreak);
      } else {
        spawnIncomingLaser();
      }
    } else {
      handleMiss();
    }
  };

  // COMMON MISS / WIN HANDLERS
  const handleMiss = () => {
    // Check if Ziggy's streak shield or custom shield saves us!
    if (!shieldUsed && activeMascot.uniqueAbility.effectType === 'streak_shield') {
      setShieldUsed(true);
      SoundEngine.playComboChime(2);
      setMascotCheer('🛡️ Streak Shield saved your combo!');
      if (gameType === 'pulse_matrix') nextPulseMatrixRound();
      else if (gameType === 'cyber_lock') startCyberLockRound();
      else if (gameType === 'laser_slicer') spawnIncomingLaser();
      return;
    }

    SoundEngine.playErrorBuzz();
    setStreak(0);

    // If score is 0 or multiple misses, end game or let retry
    setGameState('lost');
    clearInterval(timerRef.current);
  };

  const handleWin = (finalStreak: number) => {
    clearInterval(timerRef.current);
    setGameState('won');
    SoundEngine.playUpgradeFanfare();
    confetti({ particleCount: 65, spread: 70, origin: { y: 0.6 } });

    // Calculate dynamic rewards based on town level, mascot multiplier, and streaks
    let coinReward = 3500 + townLevel * 1200 + finalStreak * 400;
    if (activeMascot.uniqueAbility.effectType === 'bonus_coins') {
      coinReward = Math.round(coinReward * activeMascot.uniqueAbility.multiplier);
    } else if (activeMascot.uniqueAbility.effectType === 'streak_shield') {
      coinReward = Math.round((3500 + townLevel * 1200) + (finalStreak * 400 * activeMascot.uniqueAbility.multiplier));
    }
    const xpReward = 150 + townLevel * 40;
    const diceBonus = activeMascot.uniqueAbility.effectType === 'lucky_dice'
      ? Math.max(2, Math.round(activeMascot.uniqueAbility.multiplier))
      : 1;

    setTimeout(() => {
      onComplete({
        coins: coinReward,
        xp: xpReward,
        streak: Math.max(finalStreak, bestStreak),
        diceBonus,
      });
    }, 1800);
  };

  // Clean timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-md">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-sm rounded-3xl bg-[#090b1e] border-2 border-fuchsia-500/60 p-5 shadow-[0_0_50px_rgba(255,0,127,0.4)] flex flex-col relative overflow-hidden"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-all z-20"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header with Active Mascot */}
        <div className="flex items-center gap-3 mb-4">
          <div className="relative">
            <MascotAvatar mascot={activeMascot} size="sm" isDancing={gameState === 'won'} />
            <div className="absolute -bottom-1 -right-1 px-1 rounded bg-amber-400 text-slate-950 text-[7px] font-black border border-white">
              Lv.{activeMascot.level}
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-black uppercase text-fuchsia-400 tracking-wider">
                Reflex Challenge
              </span>
              <span className="text-[10px] bg-indigo-900/80 text-cyan-300 font-bold px-2 py-0.5 rounded-full border border-indigo-500/30">
                Town Lv.{townLevel}
              </span>
              <span className="text-[10px] bg-amber-950/80 text-amber-300 font-black px-1.5 py-0.5 rounded-full border border-amber-500/40">
                {activeMascot.name} ({activeMascot.uniqueAbility.multiplier}x)
              </span>
            </div>
            <h3 className="text-base font-black text-white capitalize">
              {gameType.replace('_', ' ')}
            </h3>
          </div>
        </div>

        {/* Game Mode Selector Buttons */}
        <div className="grid grid-cols-3 gap-1 mb-3 p-1 rounded-xl bg-slate-950/80 border border-slate-800">
          <button
            onClick={() => switchGameType('pulse_matrix')}
            className={`py-1 px-1.5 rounded-lg text-[10px] font-black uppercase transition-all flex items-center justify-center gap-1 ${
              gameType === 'pulse_matrix'
                ? 'bg-cyan-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>⚡ Pulse</span>
          </button>
          <button
            onClick={() => switchGameType('laser_slicer')}
            className={`py-1 px-1.5 rounded-lg text-[10px] font-black uppercase transition-all flex items-center justify-center gap-1 ${
              gameType === 'laser_slicer'
                ? 'bg-fuchsia-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>⚔️ Laser</span>
          </button>
          <button
            onClick={() => switchGameType('cyber_lock')}
            className={`py-1 px-1.5 rounded-lg text-[10px] font-black uppercase transition-all flex items-center justify-center gap-1 ${
              gameType === 'cyber_lock'
                ? 'bg-amber-400 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>🔐 Lock</span>
          </button>
        </div>

        {/* Mascot Active Ability Cheer Bubble */}
        <div 
          onClick={() => SoundEngine.playMascotSqueak('squeak')}
          className="mb-3 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-pink-500/40 flex items-center justify-between text-xs cursor-pointer transition-colors group"
          title="Tap to hear mascot squeak!"
        >
          <div className="flex items-center gap-1.5 text-cyan-300 font-bold text-[11px] truncate group-hover:text-pink-300 transition-colors">
            <Sparkles className="w-3.5 h-3.5 text-yellow-400 group-hover:text-pink-400 flex-shrink-0 animate-pulse" />
            <span className="truncate">{mascotCheer || activeMascot.uniqueAbility.description}</span>
          </div>
          {activeMascot.uniqueAbility.effectType === 'streak_shield' && (
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${shieldUsed ? 'bg-red-950 text-red-400' : 'bg-emerald-950 text-emerald-400'}`}>
              {shieldUsed ? 'Shield Used' : 'Shield Ready'}
            </span>
          )}
        </div>

        {/* Score & Streak Counters */}
        <div className="flex justify-between items-center bg-slate-950/70 rounded-2xl px-4 py-2 border border-slate-800/80 mb-4">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase">Progress</span>
            <div className="text-lg font-black text-white">
              {score} / <span className="text-slate-500 text-sm">{gameType === 'cyber_lock' ? pinsNeeded : targetRequired}</span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1 justify-end">
              <Flame className="w-3 h-3 text-orange-400" /> Combo
            </span>
            <div className="text-lg font-black text-orange-400">
              {streak}X
            </div>
          </div>
        </div>

        {/* GAME CONTENT ARENA */}
        <div className="min-h-[260px] flex flex-col items-center justify-center relative">
          {/* Countdown Overlay */}
          {gameState === 'countdown' && (
            <motion.div
              key={countdown}
              initial={{ scale: 2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              className="flex flex-col items-center justify-center"
            >
              <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-pink-400 to-yellow-400">
                {countdown}
              </div>
              <p className="text-xs text-slate-400 uppercase tracking-widest mt-2 font-bold">
                Get Ready!
              </p>
            </motion.div>
          )}

          {/* Victory Overlay */}
          {gameState === 'won' && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col items-center text-center"
            >
              <CheckCircle2 className="w-14 h-14 text-emerald-400 mb-2 drop-shadow-[0_0_15px_rgba(52,211,153,0.6)]" />
              <h4 className="text-xl font-black text-white uppercase tracking-wider mb-1">
                Reflex Master!
              </h4>
              <p className="text-xs text-emerald-300 font-bold mb-3">
                {activeMascot.name} is celebrating your lightning paws!
              </p>
              <div className="text-xs text-yellow-300 font-black animate-pulse">
                Awarding Coins & Upgrades...
              </div>
            </motion.div>
          )}

          {/* Defeat / Retry Overlay */}
          {gameState === 'lost' && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col items-center text-center"
            >
              <AlertTriangle className="w-12 h-12 text-rose-500 mb-2" />
              <h4 className="text-lg font-black text-white uppercase tracking-wider mb-1">
                Reflex Slip!
              </h4>
              <p className="text-xs text-slate-400 mb-4 max-w-[220px]">
                Reaction timer expired or wrong tap. Don't worry, shake those fuzzy paws and retry!
              </p>
              <button
                onClick={() => startPlaying(gameType)}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-pink-600 to-fuchsia-600 text-white font-black text-xs uppercase tracking-wider shadow-lg hover:brightness-110 active:scale-95"
              >
                Try Again
              </button>
            </motion.div>
          )}

          {/* 1. PULSE MATRIX ARENA */}
          {gameState === 'playing' && gameType === 'pulse_matrix' && (
            <div className="w-full flex flex-col items-center">
              {/* Central Target Orb with Shrinking Neon Ring */}
              <div className="relative w-28 h-28 flex items-center justify-center mb-6">
                {/* SVG Countdown Ring */}
                <svg className="w-full h-full -rotate-90">
                  <circle
                    cx="56"
                    cy="56"
                    r="50"
                    fill="none"
                    stroke="#1e293b"
                    strokeWidth="8"
                  />
                  <circle
                    cx="56"
                    cy="56"
                    r="50"
                    fill="none"
                    stroke={currentTargetColor}
                    strokeWidth="8"
                    strokeDasharray={314}
                    strokeDashoffset={314 * (1 - timeLeftMs / maxTimePerStep)}
                    strokeLinecap="round"
                    className="transition-all duration-75"
                  />
                </svg>

                {/* Central Pulsing Rune */}
                <div
                  className="absolute inset-4 rounded-full flex flex-col items-center justify-center text-slate-950 font-black shadow-lg"
                  style={{ backgroundColor: currentTargetColor }}
                >
                  <span className="text-xs tracking-wider uppercase font-black">
                    TAP
                  </span>
                  <span className="text-base font-black">
                    {targetLabel}
                  </span>
                </div>
              </div>

              {/* 4 Neon Glyph Tap Buttons */}
              <div className="grid grid-cols-2 gap-3 w-full">
                {colors.map((item) => (
                  <motion.button
                    key={item.color}
                    whileTap={{ scale: 0.92 }}
                    onClick={() => handlePulseTap(item.color)}
                    className="py-3 px-4 rounded-2xl border-2 font-black text-sm uppercase tracking-wider flex items-center justify-between shadow-md transition-all"
                    style={{
                      borderColor: item.color,
                      backgroundColor: `${item.color}15`,
                      color: item.color,
                    }}
                  >
                    <span>{item.name}</span>
                    <span className="text-xs opacity-75">{item.label}</span>
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          {/* 2. CYBER LOCK ARENA */}
          {gameState === 'playing' && gameType === 'cyber_lock' && (
            <div className="w-full flex flex-col items-center">
              <div className="text-xs font-bold text-slate-400 mb-2">
                Stop needle inside the <span className="text-amber-400">Golden Zone</span>!
              </div>

              {/* Rotating Circular Dial */}
              <div className="relative w-44 h-44 rounded-full border-4 border-slate-800 flex items-center justify-center mb-6 bg-slate-950 shadow-[0_0_30px_rgba(0,0,0,0.8)]">
                {/* Visual Target Arc (Golden sweet spot) */}
                <div
                  className="absolute inset-0 rounded-full pointer-events-none"
                  style={{
                    background: `conic-gradient(from 0deg, transparent 0deg, transparent ${targetAngleRange[0]}deg, #ffe600 ${targetAngleRange[0]}deg, #ffe600 ${targetAngleRange[1]}deg, transparent ${targetAngleRange[1]}deg)`,
                    opacity: 0.45,
                  }}
                />

                {/* Center Core */}
                <div className="w-12 h-12 rounded-full bg-slate-900 border-2 border-slate-700 flex items-center justify-center font-bold text-xs text-white z-10">
                  {pinsUnlocked} / {pinsNeeded}
                </div>

                {/* Rotating Needle Indicator */}
                <div
                  className="absolute top-0 left-0 w-full h-full pointer-events-none"
                  style={{ transform: `rotate(${needleAngle}deg)` }}
                >
                  <div className="w-1 h-20 bg-gradient-to-t from-pink-500 to-white mx-auto shadow-[0_0_8px_#ff007f] rounded-full" />
                </div>
              </div>

              {/* Lock Button */}
              <motion.button
                whileTap={{ scale: 0.94 }}
                onClick={handleCyberLockPress}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-400 text-slate-950 font-black text-base uppercase tracking-wider shadow-[0_0_25px_rgba(251,191,36,0.5)]"
              >
                LOCK PIN ({pinsUnlocked + 1}/{pinsNeeded})
              </motion.button>
            </div>
          )}

          {/* 3. LASER DEFLECTOR ARENA */}
          {gameState === 'playing' && gameType === 'laser_slicer' && incomingLaser && (
            <div className="w-full flex flex-col items-center">
              {/* Laser Chamber Visual */}
              <div className="relative w-40 h-40 rounded-3xl border-2 border-slate-800 bg-slate-950 flex items-center justify-center mb-5 overflow-hidden">
                {/* Incoming Laser Beam Animated */}
                <motion.div
                  key={incomingLaser.id}
                  initial={{
                    x: incomingLaser.direction === 'left' ? -80 : incomingLaser.direction === 'right' ? 80 : 0,
                    y: incomingLaser.direction === 'top' ? -80 : incomingLaser.direction === 'bottom' ? 80 : 0,
                    scale: 1.8,
                  }}
                  animate={{ x: 0, y: 0, scale: 0.8 }}
                  transition={{ duration: maxTimePerStep / 1000, ease: 'linear' }}
                  className="w-6 h-6 rounded-full blur-[1px] shadow-[0_0_15px]"
                  style={{ backgroundColor: incomingLaser.color, color: incomingLaser.color }}
                />

                {/* Center Core Shield */}
                <div className="w-14 h-14 rounded-full border-2 border-white/60 bg-slate-900 flex items-center justify-center text-xs font-bold text-white z-10">
                  SHIELD
                </div>
              </div>

              {/* Matching Color Deflect Buttons */}
              <div className="grid grid-cols-2 gap-3 w-full">
                {colors.map((item) => (
                  <motion.button
                    key={item.color}
                    whileTap={{ scale: 0.92 }}
                    onClick={() => handleLaserDeflect(item.color)}
                    className="py-3 px-4 rounded-2xl border-2 font-black text-sm uppercase tracking-wider flex items-center justify-center shadow-md transition-all"
                    style={{
                      borderColor: item.color,
                      backgroundColor: `${item.color}20`,
                      color: item.color,
                    }}
                  >
                    DEFLECT {item.name}
                  </motion.button>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
