import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Trophy, RotateCcw, Zap, Flame, Star, Volume2 } from 'lucide-react';
import { Mascot } from '../../types';
import { SoundEngine } from '../../utils/sound';
import confetti from 'canvas-confetti';

interface GemMatch3PuzzleViewProps {
  activeMascot: Mascot;
  playerLevel: number;
  onCompleteReward: (reward: { coins: number; xp: number; diceBonus: number; sourceTitle: string }) => void;
  onWatchAdBonus?: () => void;
}

export type GemType = 'ruby' | 'emerald' | 'sapphire' | 'citrine' | 'amethyst' | 'topaz';
export type SpecialType = 'none' | 'bomb' | 'rainbow';

export interface GemCell {
  id: string;
  type: GemType;
  special: SpecialType;
}

const GRID_SIZE = 7;
const TARGET_SCORE = 2200;
const INITIAL_MOVES = 18;

const GEM_CONFIGS: Record<GemType, { label: string; icon: string; bgGradient: string; border: string; glow: string }> = {
  ruby: {
    label: 'Ruby Heart',
    icon: '💎',
    bgGradient: 'from-rose-500 via-red-600 to-rose-700',
    border: 'border-rose-400',
    glow: 'rgba(244,63,94,0.6)',
  },
  emerald: {
    label: 'Emerald Star',
    icon: '💚',
    bgGradient: 'from-emerald-400 via-emerald-600 to-teal-700',
    border: 'border-emerald-300',
    glow: 'rgba(52,211,153,0.6)',
  },
  sapphire: {
    label: 'Sapphire Orb',
    icon: '🔷',
    bgGradient: 'from-cyan-400 via-blue-600 to-indigo-700',
    border: 'border-cyan-300',
    glow: 'rgba(56,189,248,0.6)',
  },
  citrine: {
    label: 'Citrine Sun',
    icon: '⭐',
    bgGradient: 'from-amber-300 via-yellow-500 to-amber-600',
    border: 'border-yellow-200',
    glow: 'rgba(250,204,21,0.6)',
  },
  amethyst: {
    label: 'Amethyst Moon',
    icon: '🔮',
    bgGradient: 'from-purple-400 via-fuchsia-600 to-purple-800',
    border: 'border-fuchsia-300',
    glow: 'rgba(217,70,239,0.6)',
  },
  topaz: {
    label: 'Topaz Flame',
    icon: '🔶',
    bgGradient: 'from-orange-400 via-amber-600 to-orange-700',
    border: 'border-orange-300',
    glow: 'rgba(251,146,60,0.6)',
  },
};

const GEM_TYPES: GemType[] = ['ruby', 'emerald', 'sapphire', 'citrine', 'amethyst', 'topaz'];

function getRandomGemType(): GemType {
  return GEM_TYPES[Math.floor(Math.random() * GEM_TYPES.length)];
}

let gemIdCounter = 0;
function createGemCell(type?: GemType, special: SpecialType = 'none'): GemCell {
  gemIdCounter += 1;
  return {
    id: `gem-${Date.now()}-${gemIdCounter}-${Math.random().toString(36).substring(2, 6)}`,
    type: type || getRandomGemType(),
    special,
  };
}

// Generate an initial board without automatic 3-in-a-row matches
function generateCleanBoard(): GemCell[][] {
  const board: GemCell[][] = [];
  for (let r = 0; r < GRID_SIZE; r++) {
    const row: GemCell[] = [];
    for (let c = 0; c < GRID_SIZE; c++) {
      let allowedTypes = [...GEM_TYPES];
      // Avoid 3 in a row horizontally
      if (c >= 2 && row[c - 1].type === row[c - 2].type) {
        allowedTypes = allowedTypes.filter((t) => t !== row[c - 1].type);
      }
      // Avoid 3 in a row vertically
      if (r >= 2 && board[r - 1][c].type === board[r - 2][c].type) {
        allowedTypes = allowedTypes.filter((t) => t !== board[r - 1][c].type);
      }
      const chosenType = allowedTypes[Math.floor(Math.random() * allowedTypes.length)];
      row.push(createGemCell(chosenType));
    }
    board.push(row);
  }
  return board;
}

export const GemMatch3PuzzleView: React.FC<GemMatch3PuzzleViewProps> = ({
  activeMascot,
  playerLevel,
  onCompleteReward,
  onWatchAdBonus,
}) => {
  const [board, setBoard] = useState<GemCell[][]>(generateCleanBoard);
  const [selectedPos, setSelectedPos] = useState<{ r: number; c: number } | null>(null);
  const [score, setScore] = useState(0);
  const [movesLeft, setMovesLeft] = useState(INITIAL_MOVES);
  const [comboCount, setComboCount] = useState(0);
  const [comboBanner, setComboBanner] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasWon, setHasWon] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);

  // Restart puzzle
  const handleRestart = () => {
    setBoard(generateCleanBoard());
    setSelectedPos(null);
    setScore(0);
    setMovesLeft(INITIAL_MOVES);
    setComboCount(0);
    setComboBanner(null);
    setIsProcessing(false);
    setHasWon(false);
    setIsGameOver(false);
    SoundEngine.playBoardHop();
  };

  // Find all horizontal and vertical matches
  const findMatches = (currentBoard: GemCell[][]): { matches: Set<string>; specialCreations: { r: number; c: number; special: SpecialType; type: GemType }[] } => {
    const matchedCoords = new Set<string>();
    const specialCreations: { r: number; c: number; special: SpecialType; type: GemType }[] = [];

    // Horizontal check
    for (let r = 0; r < GRID_SIZE; r++) {
      let matchLen = 1;
      for (let c = 0; c < GRID_SIZE; c++) {
        const checkNext = c < GRID_SIZE - 1 && currentBoard[r][c].type === currentBoard[r][c + 1].type;
        if (checkNext) {
          matchLen += 1;
        } else {
          if (matchLen >= 3) {
            const startC = c - matchLen + 1;
            for (let i = startC; i <= c; i++) {
              matchedCoords.add(`${r},${i}`);
            }
            if (matchLen >= 5) {
              specialCreations.push({ r, c: startC + 2, special: 'rainbow', type: currentBoard[r][startC].type });
            } else if (matchLen === 4) {
              specialCreations.push({ r, c: startC + 1, special: 'bomb', type: currentBoard[r][startC].type });
            }
          }
          matchLen = 1;
        }
      }
    }

    // Vertical check
    for (let c = 0; c < GRID_SIZE; c++) {
      let matchLen = 1;
      for (let r = 0; r < GRID_SIZE; r++) {
        const checkNext = r < GRID_SIZE - 1 && currentBoard[r][c].type === currentBoard[r + 1][c].type;
        if (checkNext) {
          matchLen += 1;
        } else {
          if (matchLen >= 3) {
            const startR = r - matchLen + 1;
            for (let i = startR; i <= r; i++) {
              matchedCoords.add(`${i},${c}`);
            }
            if (matchLen >= 5) {
              specialCreations.push({ r: startR + 2, c, special: 'rainbow', type: currentBoard[startR][c].type });
            } else if (matchLen === 4) {
              specialCreations.push({ r: startR + 1, c, special: 'bomb', type: currentBoard[startR][c].type });
            }
          }
          matchLen = 1;
        }
      }
    }

    return { matches: matchedCoords, specialCreations };
  };

  // Resolve matches, apply bomb explosions, trigger cascades & gravity
  const processMatchesAndCascades = useCallback(async (initialBoard: GemCell[][], comboMultiplier = 1) => {
    let currentBoard = initialBoard.map((row) => [...row]);
    let totalEarnedScore = 0;
    let cascadeStep = comboMultiplier;

    while (true) {
      const { matches, specialCreations } = findMatches(currentBoard);
      if (matches.size === 0) break;

      // Expand matches if any matched cell is a bomb
      const allExploded = new Set<string>(matches);
      matches.forEach((coord) => {
        const [r, c] = coord.split(',').map(Number);
        const cell = currentBoard[r][c];
        if (cell.special === 'bomb') {
          // Explode 3x3
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              const nr = r + dr;
              const nc = c + dc;
              if (nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE) {
                allExploded.add(`${nr},${nc}`);
              }
            }
          }
        }
      });

      // Score calculation
      const stepScore = allExploded.size * 50 * cascadeStep;
      totalEarnedScore += stepScore;

      // Sound & visuals for combo
      SoundEngine.playCoinChime();
      if (cascadeStep >= 2) {
        const phrases = ['Sweet!', 'Tasty Crush!', 'Hyper Blast!', 'Sugar Frenzy!', 'Mega Cascade!'];
        const chosen = phrases[Math.min(cascadeStep - 2, phrases.length - 1)];
        setComboBanner(`${chosen} (x${cascadeStep})`);
      }

      // Clear exploded cells
      for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
          if (allExploded.has(`${r},${c}`)) {
            // Check if this position spawns a special gem
            const specialToSpawn = specialCreations.find((sc) => sc.r === r && sc.c === c);
            if (specialToSpawn) {
              currentBoard[r][c] = createGemCell(specialToSpawn.type, specialToSpawn.special);
            } else {
              currentBoard[r][c] = null as any;
            }
          }
        }
      }

      // Gravity: pull gems down
      for (let c = 0; c < GRID_SIZE; c++) {
        const validGems: GemCell[] = [];
        for (let r = GRID_SIZE - 1; r >= 0; r--) {
          if (currentBoard[r][c] !== null && currentBoard[r][c] !== undefined) {
            validGems.push(currentBoard[r][c]);
          }
        }
        // Fill from bottom up
        for (let r = GRID_SIZE - 1; r >= 0; r--) {
          const gemIndex = (GRID_SIZE - 1) - r;
          if (gemIndex < validGems.length) {
            currentBoard[r][c] = validGems[gemIndex];
          } else {
            // New gem dropped from top
            currentBoard[r][c] = createGemCell();
          }
        }
      }

      cascadeStep += 1;
      // Brief pause for juiciness
      await new Promise((res) => setTimeout(res, 220));
      setBoard(currentBoard.map((row) => [...row]));
    }

    setScore((prev) => {
      const newScore = prev + totalEarnedScore;
      // Check win condition
      if (newScore >= TARGET_SCORE && !hasWon) {
        setHasWon(true);
        SoundEngine.playUpgradeFanfare();
        confetti({ particleCount: 90, spread: 80, origin: { y: 0.6 } });
        onCompleteReward({
          coins: Math.round(5500 + playerLevel * 1200 * activeMascot.uniqueAbility.multiplier),
          xp: 250 + playerLevel * 50,
          diceBonus: 4,
          sourceTitle: 'Gem Match-3 Crush Victory',
        });
      }
      return newScore;
    });

    setComboCount(cascadeStep - 1);
    setIsProcessing(false);
  }, [hasWon, onCompleteReward, playerLevel, activeMascot]);

  // Handle gem click / swap
  const handleCellClick = async (r: number, c: number) => {
    if (isProcessing || hasWon || isGameOver) return;

    if (!selectedPos) {
      // First click: select gem
      setSelectedPos({ r, c });
      SoundEngine.playBoardHop();
      return;
    }

    const { r: r1, c: c1 } = selectedPos;

    // Clicked same cell: deselect
    if (r1 === r && c1 === c) {
      setSelectedPos(null);
      return;
    }

    // Check adjacency (horizontal or vertical neighbor only)
    const isAdjacent = (Math.abs(r1 - r) === 1 && c1 === c) || (Math.abs(c1 - c) === 1 && r1 === r);

    if (!isAdjacent) {
      // Not adjacent: select the newly clicked gem instead
      setSelectedPos({ r, c });
      SoundEngine.playBoardHop();
      return;
    }

    // Process swap
    setSelectedPos(null);
    setIsProcessing(true);

    const newBoard = board.map((row) => [...row]);
    const gemA = newBoard[r1][c1];
    const gemB = newBoard[r][c];

    // Rainbow star special match logic
    if (gemA.special === 'rainbow' || gemB.special === 'rainbow') {
      const targetColor = gemA.special === 'rainbow' ? gemB.type : gemA.type;
      SoundEngine.playLaserHit();
      // Clear all gems of targetColor
      for (let row = 0; row < GRID_SIZE; row++) {
        for (let col = 0; col < GRID_SIZE; col++) {
          if (newBoard[row][col].type === targetColor || newBoard[row][col].special === 'rainbow') {
            newBoard[row][col] = null as any;
          }
        }
      }
      setMovesLeft((m) => Math.max(0, m - 1));
      await processMatchesAndCascades(newBoard, 2);
      return;
    }

    // Standard swap
    newBoard[r1][c1] = gemB;
    newBoard[r][c] = gemA;

    // Check if swap produces a match
    const { matches } = findMatches(newBoard);

    if (matches.size > 0) {
      // Valid move!
      SoundEngine.playBoardHop();
      setMovesLeft((m) => {
        const nextMoves = m - 1;
        if (nextMoves <= 0 && score < TARGET_SCORE) {
          setIsGameOver(true);
        }
        return nextMoves;
      });
      setBoard(newBoard);
      await processMatchesAndCascades(newBoard, 1);
    } else {
      // Invalid move: bounce back
      SoundEngine.playErrorBuzz();
      setIsProcessing(false);
    }
  };

  const progressPercent = Math.min(100, Math.round((score / TARGET_SCORE) * 100));

  return (
    <div className="w-full flex flex-col gap-2.5 py-1">
      {/* Top Match-3 Stats Bar */}
      <div className="flex items-center justify-between bg-slate-900/90 border border-fuchsia-500/40 rounded-2xl px-3 py-2 shadow-lg">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 border border-pink-300 flex items-center justify-center font-black text-white text-base shadow-md">
            💎
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black text-white">Gem Match-3 Crush</span>
              <span className="text-[9px] bg-fuchsia-950 text-fuchsia-300 font-bold px-1.5 py-0.2 rounded-full border border-fuchsia-500/30">
                Candy Style
              </span>
            </div>
            <div className="text-[10px] text-slate-300">
              Score: <strong className="text-amber-300">{score.toLocaleString()}</strong> / {TARGET_SCORE.toLocaleString()}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-right">
            <span className="text-[9px] uppercase font-bold text-slate-400">Moves Left</span>
            <div className={`text-base font-black ${movesLeft <= 3 ? 'text-rose-400 animate-pulse' : 'text-cyan-300'}`}>
              {movesLeft}
            </div>
          </div>
          <button
            onClick={handleRestart}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all shadow-sm"
            title="Restart Board"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Target Score Star Progress Bar */}
      <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-2 shadow-md">
        <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 px-1">
          <span className="flex items-center gap-1">
            <Star className={`w-3 h-3 ${progressPercent >= 33 ? 'text-amber-400 fill-amber-400' : 'text-slate-600'}`} />
            <Star className={`w-3 h-3 ${progressPercent >= 66 ? 'text-amber-400 fill-amber-400' : 'text-slate-600'}`} />
            <Star className={`w-3 h-3 ${progressPercent >= 100 ? 'text-amber-400 fill-amber-400 animate-bounce' : 'text-slate-600'}`} />
          </span>
          <span className="text-cyan-300 font-black">{progressPercent}% to Victory</span>
        </div>
        <div className="w-full bg-slate-800/80 rounded-full h-2.5 overflow-hidden border border-slate-700/50">
          <motion.div
            className="h-full bg-gradient-to-r from-cyan-400 via-fuchsia-500 to-amber-400"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Sweet Combo Callout Bubble */}
      <AnimatePresence>
        {comboBanner && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="w-full py-1.5 rounded-xl bg-gradient-to-r from-amber-500 via-pink-500 to-purple-600 text-slate-950 font-black text-center text-xs tracking-wider shadow-lg flex items-center justify-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-white animate-spin" />
            <span className="text-white drop-shadow-md">{comboBanner}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Match-3 Board Grid */}
      <div className="w-full max-w-[340px] mx-auto aspect-square bg-[#07091c] border-2 border-indigo-900/80 rounded-3xl p-2.5 shadow-2xl flex flex-col justify-between select-none relative overflow-hidden">
        {/* Soft Ambient Board Glow */}
        <div className="absolute inset-0 bg-radial from-fuchsia-600/10 via-transparent to-transparent pointer-events-none" />

        {board.map((row, rIdx) => (
          <div key={rIdx} className="grid grid-cols-7 gap-1.5 flex-1">
            {row.map((gem, cIdx) => {
              if (!gem) {
                return (
                  <div
                    key={`${rIdx}-${cIdx}`}
                    className="flex-1 rounded-xl bg-slate-950/40 border border-slate-900"
                  />
                );
              }

              const isSelected = selectedPos?.r === rIdx && selectedPos?.c === cIdx;
              const config = GEM_CONFIGS[gem.type] || GEM_CONFIGS.ruby;

              return (
                <motion.button
                  key={gem.id}
                  whileTap={{ scale: 0.88 }}
                  onClick={() => handleCellClick(rIdx, cIdx)}
                  className={`flex-1 rounded-xl flex items-center justify-center relative transition-all border shadow-sm ${
                    isSelected
                      ? 'ring-2 ring-white scale-110 z-20 shadow-[0_0_18px_rgba(255,255,255,0.9)] animate-pulse'
                      : 'hover:scale-105 active:scale-90'
                  } bg-gradient-to-br ${config.bgGradient} ${config.border}`}
                  style={{
                    boxShadow: isSelected
                      ? `0 0 20px ${config.glow}, inset 0 0 8px rgba(255,255,255,0.8)`
                      : `0 2px 6px ${config.glow}`,
                  }}
                >
                  {/* Gem Inner Facet Highlight */}
                  <div className="absolute top-0.5 left-0.5 w-1.5 h-1.5 rounded-full bg-white/70 blur-[0.5px]" />

                  {/* Special Gem Icons (Bomb 💣 or Rainbow 🌟) */}
                  {gem.special === 'rainbow' ? (
                    <span className="text-base animate-spin filter drop-shadow">🌟</span>
                  ) : gem.special === 'bomb' ? (
                    <span className="text-base animate-bounce filter drop-shadow">💣</span>
                  ) : (
                    <span className="text-sm select-none drop-shadow-sm">{config.icon}</span>
                  )}
                </motion.button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Cheering Mascot & Controls Tip */}
      <div className="flex items-center justify-between px-2 py-1 bg-slate-950/70 border border-slate-800 rounded-xl">
        <div className="flex items-center gap-1.5">
          <span className="text-base animate-bounce">🐾</span>
          <span className="text-[10px] text-slate-300">
            {activeMascot.name}: Match 4 for Bomb 💣, Match 5 for Rainbow Star 🌟!
          </span>
        </div>
        <span className="text-[9px] text-amber-300 font-bold bg-amber-950/80 px-2 py-0.5 rounded-full border border-amber-500/40">
          {activeMascot.uniqueAbility.multiplier}x Multiplier
        </span>
      </div>

      {/* Win Banner */}
      <AnimatePresence>
        {hasWon && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-900 border border-emerald-400 shadow-2xl flex flex-col gap-2.5"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🏆</span>
                <div>
                  <div className="text-sm font-black text-white">Target Score Smashed!</div>
                  <div className="text-[11px] text-emerald-300 font-bold">
                    Scored {score.toLocaleString()} points with {movesLeft} moves to spare!
                  </div>
                </div>
              </div>
              <button
                onClick={handleRestart}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-400 text-slate-950 font-black text-xs shadow-md hover:brightness-110 active:scale-95 transition-all"
              >
                Play Again ➔
              </button>
            </div>
            {onWatchAdBonus && (
              <button
                onClick={onWatchAdBonus}
                className="w-full py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 hover:brightness-110 active:scale-98 transition-all shadow-lg"
              >
                <span>🎬 Watch Short Ad for 2X Coins & +10 Extra Dice!</span>
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Game Over (Out of moves before target) */}
      <AnimatePresence>
        {isGameOver && !hasWon && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-3.5 rounded-2xl bg-slate-900/95 border border-rose-500 shadow-xl flex items-center justify-between"
          >
            <div>
              <div className="text-xs font-black text-rose-400">Out of Moves!</div>
              <div className="text-[10px] text-slate-300">
                You scored {score.toLocaleString()} / {TARGET_SCORE.toLocaleString()}
              </div>
            </div>
            <button
              onClick={handleRestart}
              className="px-3 py-1.5 rounded-xl bg-rose-500 text-white font-black text-xs hover:brightness-110 active:scale-95 transition-all shadow-md"
            >
              Try Again 🔄
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
