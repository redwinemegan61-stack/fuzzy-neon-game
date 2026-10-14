import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Layers, Play, Trophy, Sparkles } from 'lucide-react';
import { Mascot } from '../../types';
import { STACKER_CONFIG } from '../../data/puzzleData';
import { SoundEngine } from '../../utils/sound';
import confetti from 'canvas-confetti';

interface LaserStackPuzzleViewProps {
  activeMascot: Mascot;
  playerLevel: number;
  onCompleteReward: (reward: { coins: number; xp: number; diceBonus: number }) => void;
}

interface PlacedFloor {
  startCol: number;
  width: number;
}

export const LaserStackPuzzleView: React.FC<LaserStackPuzzleViewProps> = ({
  activeMascot,
  playerLevel,
  onCompleteReward,
}) => {
  const COLS = STACKER_CONFIG.gridCols; // 7
  const ROWS = STACKER_CONFIG.targetFloors; // 10

  const [currentFloor, setCurrentFloor] = useState(0); // 0 to 9
  const [blockWidth, setBlockWidth] = useState(STACKER_CONFIG.initialBlockWidth); // 3
  const [currentCol, setCurrentCol] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [placedFloors, setPlacedFloors] = useState<PlacedFloor[]>([]);
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'won' | 'lost'>('idle');
  const [perfectCount, setPerfectCount] = useState(0);
  const [feedbackText, setFeedbackText] = useState<string | null>(null);
  const [slicedFragment, setSlicedFragment] = useState<{ col: number; width: number; floor: number } | null>(null);

  const loopTimerRef = useRef<any>(null);

  // Speed calculation: starts moderate, speeds up on higher floors
  // Mascot 'slow_time' ability slows moving blocks!
  const getSpeedMs = (floor: number) => {
    const base = Math.max(90, 220 - floor * 15);
    if (activeMascot.uniqueAbility.effectType === 'slow_time') {
      return Math.round(base * activeMascot.uniqueAbility.multiplier);
    }
    return base;
  };

  // Start / Reset Game
  const handleStartGame = () => {
    SoundEngine.playBoardHop();
    setCurrentFloor(0);
    setBlockWidth(STACKER_CONFIG.initialBlockWidth);
    setCurrentCol(0);
    setDirection(1);
    setPlacedFloors([]);
    setPerfectCount(0);
    setFeedbackText('STACK EM HIGH!');
    setGameState('playing');
  };

  // Game Animation Loop: moving block horizontally
  useEffect(() => {
    if (gameState !== 'playing') {
      if (loopTimerRef.current) clearInterval(loopTimerRef.current);
      return;
    }

    const interval = getSpeedMs(currentFloor);
    loopTimerRef.current = setInterval(() => {
      setCurrentCol((prev) => {
        let next = prev + direction;
        if (next + blockWidth > COLS) {
          setDirection(-1);
          return COLS - blockWidth;
        } else if (next < 0) {
          setDirection(1);
          return 0;
        }
        return next;
      });
    }, interval);

    return () => clearInterval(loopTimerRef.current);
  }, [gameState, currentFloor, blockWidth, direction, activeMascot]);

  // Drop / Stack Action
  const handleDropBlock = () => {
    if (gameState !== 'playing') return;

    SoundEngine.playDiceRoll();

    if (currentFloor === 0) {
      // First floor locks with full initial width
      const newFloor: PlacedFloor = { startCol: currentCol, width: blockWidth };
      setPlacedFloors([newFloor]);
      setCurrentFloor(1);
      setFeedbackText('PERFECT BASE!');
      return;
    }

    const prevFloor = placedFloors[placedFloors.length - 1];
    const prevStart = prevFloor.startCol;
    const prevEnd = prevFloor.startCol + prevFloor.width;

    const currStart = currentCol;
    const currEnd = currentCol + blockWidth;

    // Calculate overlap
    const overlapStart = Math.max(prevStart, currStart);
    const overlapEnd = Math.min(prevEnd, currEnd);
    const overlapWidth = Math.max(0, overlapEnd - overlapStart);

    if (overlapWidth <= 0) {
      // Missed the stack! Game Over
      SoundEngine.playErrorBuzz();
      setGameState('lost');
      setFeedbackText('MISS! LASER TOWER COLLAPSED');
      return;
    }

    // Check if perfect drop
    const isPerfect = overlapWidth === prevFloor.width && currStart === prevStart;
    if (isPerfect) {
      SoundEngine.playComboChime(perfectCount + 1);
      setPerfectCount((p) => p + 1);
      setFeedbackText('★ PERFECT LASER ALIGNMENT! ★');
      setSlicedFragment(null);
    } else {
      SoundEngine.playLaserHit(1.2);
      setFeedbackText(`LASER SLICED (-${blockWidth - overlapWidth})`);
      const slicedCol = currStart < prevStart ? currStart : prevEnd;
      const slicedW = blockWidth - overlapWidth;
      setSlicedFragment({ col: slicedCol, width: slicedW, floor: currentFloor });
      setTimeout(() => setSlicedFragment(null), 450);
    }

    const newPlaced: PlacedFloor = {
      startCol: overlapStart,
      width: overlapWidth,
    };
    const nextPlacedFloors = [...placedFloors, newPlaced];
    setPlacedFloors(nextPlacedFloors);
    setBlockWidth(overlapWidth);

    // Check win condition (reached top floor!)
    const nextFloorIndex = currentFloor + 1;
    if (nextFloorIndex >= ROWS) {
      // JACKPOT!
      setGameState('won');
      setFeedbackText('🏆 LASER JACKPOT REACHED!');
      SoundEngine.playUpgradeFanfare();
      confetti({ particleCount: 90, spread: 90, origin: { y: 0.5 } });

      let coinBonus = 8000 + playerLevel * 1500 + perfectCount * 1000;
      if (activeMascot.uniqueAbility.effectType === 'bonus_coins') {
        coinBonus = Math.round(coinBonus * activeMascot.uniqueAbility.multiplier);
      }
      const xpBonus = 250 + playerLevel * 50;
      const diceBonus = activeMascot.uniqueAbility.effectType === 'lucky_dice' ? 4 : 3;

      onCompleteReward({
        coins: coinBonus,
        xp: xpBonus,
        diceBonus,
      });
    } else {
      setCurrentFloor(nextFloorIndex);
      setCurrentCol(0);
      setDirection(1);
    }
  };

  // Keyboard spacebar to drop
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        if (gameState === 'playing') {
          handleDropBlock();
        } else if (gameState === 'idle' || gameState === 'lost') {
          handleStartGame();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, currentFloor, currentCol, blockWidth, placedFloors]);

  return (
    <div className="w-full flex flex-col gap-3 py-1 select-none">
      {/* Header Info */}
      <div className="flex items-center justify-between bg-slate-900/90 border border-fuchsia-500/30 rounded-2xl px-3 py-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-fuchsia-500/20 border border-fuchsia-400/40 flex items-center justify-center font-black text-fuchsia-300 text-sm">
            ⚡
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black text-white">Neon Laser Stack</span>
              <span className="text-[9px] bg-fuchsia-950 text-fuchsia-300 font-black px-1.5 py-0.2 rounded-full border border-fuchsia-500/40">
                Floor {currentFloor + 1}/{ROWS}
              </span>
            </div>
            <div className="text-[10px] text-slate-400">
              Perfects: <strong className="text-amber-300">{perfectCount}</strong> | Width:{' '}
              <strong className="text-cyan-300">{blockWidth}</strong>
            </div>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[10px] font-black uppercase text-cyan-300 bg-cyan-950/80 border border-cyan-500/40 px-2 py-0.5 rounded-full">
            {activeMascot.uniqueAbility.effectType === 'slow_time' ? '⚡ SLOW TIME' : '⚡ 1X SPEED'}
          </span>
        </div>
      </div>

      {/* Floating Feedback Banner */}
      <div className="text-center h-5">
        {feedbackText && (
          <span className="text-xs font-black text-amber-300 animate-pulse tracking-wide">
            {feedbackText}
          </span>
        )}
      </div>

      {/* Stacker Grid Arena (10 floors high x 7 cols wide) */}
      <div className="w-full max-w-[280px] mx-auto aspect-[7/10] bg-[#07091d] border-2 border-indigo-900/80 rounded-3xl p-3 shadow-2xl flex flex-col-reverse justify-between relative overflow-hidden">
        {/* Jackpot line at top */}
        <div className="absolute top-2 left-2 right-2 flex items-center justify-between text-[8px] font-black text-yellow-400 uppercase tracking-wider border-b border-yellow-500/30 pb-0.5 pointer-events-none z-10">
          <span>★ LASER JACKPOT TIER ★</span>
          <span>FL.10</span>
        </div>

        {Array.from({ length: ROWS }).map((_, rIdx) => {
          const isCurrentMovingRow = gameState === 'playing' && currentFloor === rIdx;
          const placed = placedFloors[rIdx];

          return (
            <div key={rIdx} className="grid grid-cols-7 gap-1 h-full items-center relative">
              {/* Grid Slots & Placed Floors */}
              {Array.from({ length: COLS }).map((_, cIdx) => {
                const isPlaced = placed && cIdx >= placed.startCol && cIdx < placed.startCol + placed.width;

                return (
                  <div
                    key={cIdx}
                    className={`h-4.5 rounded-md transition-all relative overflow-hidden ${
                      isPlaced
                        ? rIdx >= STACKER_CONFIG.majorPrizeFloor
                          ? 'bg-gradient-to-b from-yellow-200 via-amber-400 to-yellow-600 shadow-[0_0_12px_rgba(251,191,36,0.85)] border border-yellow-100'
                          : 'bg-gradient-to-b from-cyan-200 via-cyan-400 to-blue-600 shadow-[0_0_10px_rgba(0,240,255,0.75)] border border-cyan-200'
                        : 'bg-slate-900/60 border border-slate-800/40'
                    }`}
                  >
                    {/* Glass Bevel Top Specular Glint */}
                    {isPlaced && (
                      <div className="absolute top-0 inset-x-0.5 h-[1.5px] rounded-full bg-white/80 pointer-events-none" />
                    )}
                  </div>
                );
              })}

              {/* Smooth 60fps Gliding Laser Block Overlay */}
              {isCurrentMovingRow && (
                <div
                  className="absolute inset-y-0.5 rounded-md bg-gradient-to-r from-fuchsia-400 via-rose-500 to-pink-500 shadow-[0_0_16px_rgba(255,0,127,0.95)] border-2 border-white z-20 pointer-events-none flex items-center justify-center overflow-hidden"
                  style={{
                    left: `${(currentCol / COLS) * 100}%`,
                    width: `${(blockWidth / COLS) * 100}%`,
                    transition: `left ${getSpeedMs(currentFloor)}ms linear`,
                  }}
                >
                  <div className="absolute top-0 inset-x-0.5 h-[2px] rounded-full bg-white/90 pointer-events-none" />
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.4)_0%,transparent_70%)]" />
                  <span className="text-[8px] font-black text-white/90 drop-shadow">⚡</span>
                </div>
              )}

              {/* Sliced Overhang Falling Fragment */}
              {slicedFragment && slicedFragment.floor === rIdx && (
                <motion.div
                  initial={{ y: 0, opacity: 1, scale: 1 }}
                  animate={{ y: 28, opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.45, ease: 'easeIn' }}
                  className="absolute inset-y-0.5 rounded-md bg-gradient-to-b from-red-400 via-orange-500 to-red-600 shadow-[0_0_14px_rgba(239,68,68,0.9)] border border-yellow-200 z-10 pointer-events-none flex items-center justify-center overflow-hidden"
                  style={{
                    left: `${(slicedFragment.col / COLS) * 100}%`,
                    width: `${(slicedFragment.width / COLS) * 100}%`,
                  }}
                >
                  <span className="text-[7px] text-white">💥</span>
                </motion.div>
              )}
            </div>
          );
        })}
      </div>

      {/* Main Drop Controls */}
      <div className="w-full max-w-[280px] mx-auto mt-1">
        {gameState === 'playing' ? (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.94 }}
            onClick={handleDropBlock}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-fuchsia-600 via-pink-500 to-rose-500 text-white font-black text-base uppercase tracking-wider shadow-[0_0_30px_rgba(255,0,127,0.5)] border-2 border-white hover:brightness-110 active:brightness-95 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Layers className="w-5 h-5 animate-bounce" />
            <span>DROP / SLICE LASER!</span>
          </motion.button>
        ) : (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.94 }}
            onClick={handleStartGame}
            className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-slate-950 font-black text-sm uppercase tracking-wider shadow-[0_0_25px_rgba(251,191,36,0.5)] border-2 border-amber-200 hover:brightness-110 active:brightness-95 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Play className="w-4 h-4 fill-slate-950" />
            <span>{gameState === 'idle' ? 'START LASER STACK' : 'TRY AGAIN (RESTART)'}</span>
          </motion.button>
        )}
      </div>

      {/* Instructions */}
      <div className="text-center text-[10px] text-slate-400">
        💡 Tap <strong className="text-fuchsia-400">DROP</strong> or press <strong className="text-fuchsia-400">Spacebar</strong> to slice & freeze each layer. Climb to Floor 10!
      </div>
    </div>
  );
};
