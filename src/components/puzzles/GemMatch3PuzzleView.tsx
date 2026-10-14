import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Trophy, RotateCcw, Zap, Flame, Star, Volume2, HelpCircle } from 'lucide-react';
import { Mascot } from '../../types';
import { SoundEngine } from '../../utils/sound';
import { GemEmblem } from './GemEmblem';
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

export const GEM_CONFIGS: Record<
  GemType,
  { label: string; bgGradient: string; border: string; glow: string; particleColor: string }
> = {
  ruby: {
    label: 'Ruby Octagon',
    bgGradient: 'from-rose-500/20 via-red-950/40 to-slate-950/80',
    border: 'border-rose-400/60',
    glow: 'rgba(244,63,94,0.5)',
    particleColor: '#f43f5e',
  },
  emerald: {
    label: 'Emerald Step',
    bgGradient: 'from-emerald-500/20 via-emerald-950/40 to-slate-950/80',
    border: 'border-emerald-300/60',
    glow: 'rgba(52,211,153,0.5)',
    particleColor: '#10b981',
  },
  sapphire: {
    label: 'Sapphire Lozenge',
    bgGradient: 'from-cyan-500/20 via-blue-950/40 to-slate-950/80',
    border: 'border-cyan-300/60',
    glow: 'rgba(56,189,248,0.5)',
    particleColor: '#38bdf8',
  },
  citrine: {
    label: 'Citrine Sunburst',
    bgGradient: 'from-amber-400/20 via-yellow-950/40 to-slate-950/80',
    border: 'border-yellow-300/60',
    glow: 'rgba(250,204,21,0.5)',
    particleColor: '#eab308',
  },
  amethyst: {
    label: 'Amethyst Prism',
    bgGradient: 'from-purple-500/20 via-fuchsia-950/40 to-slate-950/80',
    border: 'border-fuchsia-300/60',
    glow: 'rgba(217,70,239,0.5)',
    particleColor: '#d946ef',
  },
  topaz: {
    label: 'Topaz Cushion',
    bgGradient: 'from-orange-500/20 via-orange-950/40 to-slate-950/80',
    border: 'border-orange-300/60',
    glow: 'rgba(251,146,60,0.5)',
    particleColor: '#f97316',
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
      if (c >= 2 && row[c - 1]?.type === row[c - 2]?.type) {
        allowedTypes = allowedTypes.filter((t) => t !== row[c - 1].type);
      }
      if (r >= 2 && board[r - 1]?.[c]?.type === board[r - 2]?.[c]?.type) {
        allowedTypes = allowedTypes.filter((t) => t !== board[r - 1][c].type);
      }
      const chosenType = allowedTypes[Math.floor(Math.random() * allowedTypes.length)];
      row.push(createGemCell(chosenType));
    }
    board.push(row);
  }
  return board;
}

interface FloatingScore {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
}

export const GemMatch3PuzzleView: React.FC<GemMatch3PuzzleViewProps> = ({
  activeMascot,
  playerLevel,
  onCompleteReward,
  onWatchAdBonus,
}) => {
  const [board, setBoard] = useState<GemCell[][]>(generateCleanBoard);
  const [selectedPos, setSelectedPos] = useState<{ r: number; c: number } | null>(null);
  const [swappingPair, setSwappingPair] = useState<{ r1: number; c1: number; r2: number; c2: number } | null>(null);
  const [dragTargetPos, setDragTargetPos] = useState<{ r: number; c: number } | null>(null);
  const [explodingCoords, setExplodingCoords] = useState<Set<string>>(new Set());
  const [floatingScores, setFloatingScores] = useState<FloatingScore[]>([]);
  const [hintPair, setHintPair] = useState<[{ r: number; c: number }, { r: number; c: number }] | null>(null);

  const [score, setScore] = useState(0);
  const [movesLeft, setMovesLeft] = useState(INITIAL_MOVES);
  const [comboCount, setComboCount] = useState(0);
  const [comboBanner, setComboBanner] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasWon, setHasWon] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);

  // Swipe gesture tracking
  const pointerStartRef = useRef<{ r: number; c: number; x: number; y: number } | null>(null);
  const idleTimerRef = useRef<any>(null);

  // Find all horizontal and vertical matches
  const findMatches = (
    currentBoard: GemCell[][]
  ): {
    matches: Set<string>;
    specialCreations: { r: number; c: number; special: SpecialType; type: GemType }[];
  } => {
    const matchedCoords = new Set<string>();
    const specialCreations: { r: number; c: number; special: SpecialType; type: GemType }[] = [];

    // Horizontal check
    for (let r = 0; r < GRID_SIZE; r++) {
      let matchLen = 1;
      for (let c = 0; c < GRID_SIZE; c++) {
        const checkNext = c < GRID_SIZE - 1 && currentBoard[r][c]?.type === currentBoard[r][c + 1]?.type;
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
        const checkNext = r < GRID_SIZE - 1 && currentBoard[r][c]?.type === currentBoard[r + 1][c]?.type;
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

  // Find a valid potential move on the board for the idle hint
  const findPossibleMove = useCallback(
    (b: GemCell[][]): [{ r: number; c: number }, { r: number; c: number }] | null => {
      for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
          // Try swap right
          if (c < GRID_SIZE - 1) {
            const testBoard = b.map((row) => [...row]);
            const temp = testBoard[r][c];
            testBoard[r][c] = testBoard[r][c + 1];
            testBoard[r][c + 1] = temp;
            if (findMatches(testBoard).matches.size > 0) {
              return [
                { r, c },
                { r, c: c + 1 },
              ];
            }
          }
          // Try swap down
          if (r < GRID_SIZE - 1) {
            const testBoard = b.map((row) => [...row]);
            const temp = testBoard[r][c];
            testBoard[r][c] = testBoard[r + 1][c];
            testBoard[r + 1][c] = temp;
            if (findMatches(testBoard).matches.size > 0) {
              return [
                { r, c },
                { r: r + 1, c },
              ];
            }
          }
        }
      }
      return null;
    },
    []
  );

  // Reset idle hint timer
  const resetIdleHint = useCallback(() => {
    setHintPair(null);
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => {
      if (!isProcessing && !hasWon && !isGameOver) {
        const move = findPossibleMove(board);
        if (move) setHintPair(move);
      }
    }, 4500);
  }, [board, isProcessing, hasWon, isGameOver, findPossibleMove]);

  useEffect(() => {
    resetIdleHint();
    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [resetIdleHint]);

  // Restart puzzle
  const handleRestart = () => {
    setBoard(generateCleanBoard());
    setSelectedPos(null);
    setSwappingPair(null);
    setExplodingCoords(new Set());
    setFloatingScores([]);
    setHintPair(null);
    setScore(0);
    setMovesLeft(INITIAL_MOVES);
    setComboCount(0);
    setComboBanner(null);
    setIsProcessing(false);
    setHasWon(false);
    setIsGameOver(false);
    SoundEngine.playBoardHop();
    resetIdleHint();
  };

  // Resolve matches, apply bomb explosions, trigger cascades & gravity
  const processMatchesAndCascades = useCallback(
    async (initialBoard: GemCell[][], comboMultiplier = 1) => {
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
          const cell = currentBoard[r]?.[c];
          if (cell && cell.special === 'bomb') {
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

        // Score calculation & floating popups
        const stepScore = allExploded.size * 55 * cascadeStep;
        totalEarnedScore += stepScore;

        // Visual flash of exploding cells
        setExplodingCoords(new Set(allExploded));

        // Add floating score chip at first match location
        const firstCoord = Array.from(allExploded)[0];
        if (firstCoord) {
          const [fr, fc] = firstCoord.split(',').map(Number);
          const newFloating: FloatingScore = {
            id: Date.now() + Math.random(),
            x: ((fc + 0.5) / GRID_SIZE) * 100,
            y: ((fr + 0.5) / GRID_SIZE) * 100,
            text: `+${stepScore}`,
            color: cascadeStep >= 2 ? '#f59e0b' : '#38bdf8',
          };
          setFloatingScores((prev) => [...prev.slice(-4), newFloating]);
        }

        // Sound & visuals for combo
        SoundEngine.playCoinChime();
        if (cascadeStep >= 2) {
          const phrases = ['Sweet!', 'Tasty Crush!', 'Hyper Blast!', 'Sugar Frenzy!', 'Mega Cascade!'];
          const chosen = phrases[Math.min(cascadeStep - 2, phrases.length - 1)];
          setComboBanner(`${chosen} (x${cascadeStep})`);
        }

        // Wait for pop animation to finish
        await new Promise((res) => setTimeout(res, 220));

        // Clear exploded cells & spawn specials
        for (let r = 0; r < GRID_SIZE; r++) {
          for (let c = 0; c < GRID_SIZE; c++) {
            if (allExploded.has(`${r},${c}`)) {
              const specialToSpawn = specialCreations.find((sc) => sc.r === r && sc.c === c);
              if (specialToSpawn) {
                currentBoard[r][c] = createGemCell(specialToSpawn.type, specialToSpawn.special);
              } else {
                currentBoard[r][c] = null as any;
              }
            }
          }
        }

        setExplodingCoords(new Set());

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
            const gemIndex = GRID_SIZE - 1 - r;
            if (gemIndex < validGems.length) {
              currentBoard[r][c] = validGems[gemIndex];
            } else {
              // New gem dropped from top
              currentBoard[r][c] = createGemCell();
            }
          }
        }

        cascadeStep += 1;
        setBoard(currentBoard.map((row) => [...row]));
        // Brief pause for gravity settle
        await new Promise((res) => setTimeout(res, 200));
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
      resetIdleHint();
    },
    [hasWon, onCompleteReward, playerLevel, activeMascot, resetIdleHint]
  );

  // Execute swap between two cells (r1, c1) and (r2, c2)
  const executeSwap = async (r1: number, c1: number, r2: number, c2: number) => {
    if (isProcessing || hasWon || isGameOver) return;
    setIsProcessing(true);
    setSelectedPos(null);
    setDragTargetPos(null);
    setHintPair(null);
    setSwappingPair({ r1, c1, r2, c2 });
    SoundEngine.playBoardHop();

    const newBoard = board.map((row) => [...row]);
    const gemA = newBoard[r1][c1];
    const gemB = newBoard[r2][c2];

    // Smooth visual slide animation duration
    await new Promise((res) => setTimeout(res, 160));

    // Rainbow star special match logic
    if (gemA?.special === 'rainbow' || gemB?.special === 'rainbow') {
      const targetColor = gemA?.special === 'rainbow' ? gemB?.type : gemA?.type;
      SoundEngine.playLaserHit();
      newBoard[r1][c1] = gemB;
      newBoard[r2][c2] = gemA;
      setBoard(newBoard);
      setSwappingPair(null);

      // Clear all gems of targetColor
      for (let row = 0; row < GRID_SIZE; row++) {
        for (let col = 0; col < GRID_SIZE; col++) {
          if (newBoard[row][col]?.type === targetColor || newBoard[row][col]?.special === 'rainbow') {
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
    newBoard[r2][c2] = gemA;
    setBoard(newBoard);
    setSwappingPair(null);

    // Check if swap produces a match
    const { matches } = findMatches(newBoard);

    if (matches.size > 0) {
      // Valid move!
      setMovesLeft((m) => {
        const nextMoves = m - 1;
        if (nextMoves <= 0 && score < TARGET_SCORE) {
          setIsGameOver(true);
        }
        return nextMoves;
      });
      await processMatchesAndCascades(newBoard, 1);
    } else {
      // Invalid move: smoothly animate rebound back
      SoundEngine.playErrorBuzz();
      setSwappingPair({ r1: r2, c1: c2, r2: r1, c2: c1 });
      await new Promise((res) => setTimeout(res, 160));
      // Swap back
      const revertedBoard = newBoard.map((row) => [...row]);
      revertedBoard[r1][c1] = gemA;
      revertedBoard[r2][c2] = gemB;
      setBoard(revertedBoard);
      setSwappingPair(null);
      setIsProcessing(false);
      resetIdleHint();
    }
  };

  // Handle pointer down (for click or swipe start)
  const handlePointerDown = (r: number, c: number, e: React.PointerEvent) => {
    if (isProcessing || hasWon || isGameOver) return;
    pointerStartRef.current = { r, c, x: e.clientX, y: e.clientY };
    setDragTargetPos(null);
  };

  // Handle pointer move for real-time drag target feedback
  const handlePointerMove = (r: number, c: number, e: React.PointerEvent) => {
    if (isProcessing || hasWon || isGameOver || !pointerStartRef.current) return;
    const start = pointerStartRef.current;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    const dist = Math.hypot(dx, dy);

    if (dist > 12) {
      let targetR = start.r;
      let targetC = start.c;
      if (Math.abs(dx) > Math.abs(dy)) {
        targetC += dx > 0 ? 1 : -1;
      } else {
        targetR += dy > 0 ? 1 : -1;
      }

      if (targetR >= 0 && targetR < GRID_SIZE && targetC >= 0 && targetC < GRID_SIZE) {
        setDragTargetPos({ r: targetR, c: targetC });
      } else {
        setDragTargetPos(null);
      }
    }
  };

  // Handle pointer up (for click resolution or swipe completion)
  const handlePointerUp = (r: number, c: number, e: React.PointerEvent) => {
    if (isProcessing || hasWon || isGameOver || !pointerStartRef.current) return;

    const start = pointerStartRef.current;
    pointerStartRef.current = null;
    setDragTargetPos(null);

    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    const dist = Math.hypot(dx, dy);

    // Threshold for swipe gesture
    if (dist > 16) {
      let targetR = start.r;
      let targetC = start.c;

      if (Math.abs(dx) > Math.abs(dy)) {
        targetC += dx > 0 ? 1 : -1;
      } else {
        targetR += dy > 0 ? 1 : -1;
      }

      // Check bounds
      if (targetR >= 0 && targetR < GRID_SIZE && targetC >= 0 && targetC < GRID_SIZE) {
        executeSwap(start.r, start.c, targetR, targetC);
        return;
      }
    }

    // Otherwise, treat as tap/click selection
    handleCellClick(r, c);
  };

  // Handle cell click (select or swap with selected)
  const handleCellClick = (r: number, c: number) => {
    if (isProcessing || hasWon || isGameOver) return;

    if (!selectedPos) {
      setSelectedPos({ r, c });
      SoundEngine.playBoardHop();
      resetIdleHint();
      return;
    }

    const { r: r1, c: c1 } = selectedPos;

    // Clicked same cell: deselect
    if (r1 === r && c1 === c) {
      setSelectedPos(null);
      return;
    }

    // Check adjacency
    const isAdjacent = (Math.abs(r1 - r) === 1 && c1 === c) || (Math.abs(c1 - c) === 1 && r1 === r);

    if (!isAdjacent) {
      // Not adjacent: select the newly clicked gem instead
      setSelectedPos({ r, c });
      SoundEngine.playBoardHop();
      resetIdleHint();
      return;
    }

    // Adjacent: execute swap
    executeSwap(r1, c1, r, c);
  };

  const progressPercent = Math.min(100, Math.round((score / TARGET_SCORE) * 100));

  return (
    <div className="w-full flex flex-col gap-2.5 py-1 select-none">
      {/* Top Match-3 Stats Bar */}
      <div className="flex items-center justify-between bg-slate-900/90 border border-fuchsia-500/40 rounded-2xl px-3 py-2 shadow-lg backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-pink-500 via-rose-600 to-purple-700 border-2 border-pink-300 flex items-center justify-center p-1 shadow-md">
            <GemEmblem type="ruby" className="w-6 h-6 drop-shadow-md" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black text-white">Gem Match-3 Crush</span>
              <span className="text-[9px] bg-fuchsia-950 text-fuchsia-300 font-bold px-1.5 py-0.2 rounded-full border border-fuchsia-500/30">
                Symmetrical Gems
              </span>
            </div>
            <div className="text-[10px] text-slate-300">
              Score: <strong className="text-amber-300">{score.toLocaleString()}</strong> /{' '}
              {TARGET_SCORE.toLocaleString()}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-right">
            <span className="text-[9px] uppercase font-bold text-slate-400">Moves Left</span>
            <div
              className={`text-base font-black ${
                movesLeft <= 3 ? 'text-rose-400 animate-pulse' : 'text-cyan-300'
              }`}
            >
              {movesLeft}
            </div>
          </div>
          <button
            onClick={handleRestart}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all shadow-sm cursor-pointer"
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
            <Star
              className={`w-3.5 h-3.5 ${
                progressPercent >= 33 ? 'text-amber-400 fill-amber-400' : 'text-slate-600'
              }`}
            />
            <Star
              className={`w-3.5 h-3.5 ${
                progressPercent >= 66 ? 'text-amber-400 fill-amber-400' : 'text-slate-600'
              }`}
            />
            <Star
              className={`w-3.5 h-3.5 ${
                progressPercent >= 100 ? 'text-amber-400 fill-amber-400 animate-bounce' : 'text-slate-600'
              }`}
            />
          </span>
          <span className="text-cyan-300 font-black">{progressPercent}% to Victory</span>
        </div>
        <div className="w-full bg-slate-800/80 rounded-full h-2.5 overflow-hidden border border-slate-700/50">
          <motion.div
            className="h-full bg-gradient-to-r from-cyan-400 via-fuchsia-500 to-amber-400 shadow-[0_0_10px_rgba(0,240,255,0.8)]"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Sweet Combo Callout Banner */}
      <AnimatePresence>
        {comboBanner && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="w-full py-1.5 rounded-xl bg-gradient-to-r from-amber-500 via-pink-500 to-purple-600 text-slate-950 font-black text-center text-xs tracking-wider shadow-lg flex items-center justify-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-white animate-spin" />
            <span className="text-white drop-shadow-md">{comboBanner}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Match-3 Board Grid Container */}
      <div
        className="w-full max-w-[340px] mx-auto aspect-square bg-[#060818] border-2 border-indigo-900/80 rounded-3xl p-2 shadow-2xl flex flex-col justify-between relative overflow-hidden select-none"
        style={{ touchAction: 'none' }}
      >
        {/* Subtle Ambient Board Radial Glow */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(99,102,241,0.12)_0%,transparent_75%)] pointer-events-none" />

        {/* Board Tiles */}
        {board.map((row, rIdx) => (
          <div key={rIdx} className="grid grid-cols-7 gap-1.5 flex-1">
            {row.map((gem, cIdx) => {
              if (!gem) {
                return (
                  <div
                    key={`empty-${rIdx}-${cIdx}`}
                    className="flex-1 rounded-xl bg-slate-950/30 border border-slate-900/50"
                  />
                );
              }

              const isSelected = selectedPos?.r === rIdx && selectedPos?.c === cIdx;
              const isDragTarget = dragTargetPos?.r === rIdx && dragTargetPos?.c === cIdx;
              const isExploding = explodingCoords.has(`${rIdx},${cIdx}`);
              const isHinted =
                hintPair &&
                ((hintPair[0].r === rIdx && hintPair[0].c === cIdx) ||
                  (hintPair[1].r === rIdx && hintPair[1].c === cIdx));
              const config = GEM_CONFIGS[gem.type] || GEM_CONFIGS.ruby;

              // Smooth visual slide calculation when swapping
              const isSwappingA = swappingPair && swappingPair.r1 === rIdx && swappingPair.c1 === cIdx;
              const isSwappingB = swappingPair && swappingPair.r2 === rIdx && swappingPair.c2 === cIdx;
              let swapTranslateX = 0;
              let swapTranslateY = 0;
              if (isSwappingA && swappingPair) {
                swapTranslateX = (swappingPair.c2 - swappingPair.c1) * 100;
                swapTranslateY = (swappingPair.r2 - swappingPair.r1) * 100;
              } else if (isSwappingB && swappingPair) {
                swapTranslateX = (swappingPair.c1 - swappingPair.c2) * 100;
                swapTranslateY = (swappingPair.r1 - swappingPair.r2) * 100;
              }

              return (
                <motion.div
                  key={gem.id}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{
                    scale: isExploding ? 1.3 : isSelected ? 1.1 : isDragTarget ? 1.05 : 1,
                    opacity: isExploding ? 0 : 1,
                  }}
                  transition={{
                    scale: { duration: isExploding ? 0.22 : 0.14 },
                    opacity: { duration: 0.18 },
                  }}
                  onPointerDown={(e) => handlePointerDown(rIdx, cIdx, e)}
                  onPointerMove={(e) => handlePointerMove(rIdx, cIdx, e)}
                  onPointerUp={(e) => handlePointerUp(rIdx, cIdx, e)}
                  className={`flex-1 rounded-xl p-1 flex items-center justify-center relative cursor-pointer border shadow-sm select-none ${
                    isSelected
                      ? 'ring-2 ring-white scale-110 z-20 shadow-[0_0_20px_rgba(255,255,255,0.95)] animate-pulse'
                      : isDragTarget
                      ? 'ring-2 ring-cyan-400 scale-105 z-20 shadow-[0_0_16px_rgba(6,182,212,0.9)]'
                      : isHinted
                      ? 'ring-2 ring-amber-400 shadow-[0_0_14px_rgba(251,191,36,0.7)]'
                      : 'hover:scale-104 active:scale-95'
                  } bg-gradient-to-br ${config.bgGradient} ${config.border}`}
                  style={{
                    transform: isSwappingA || isSwappingB ? `translate(${swapTranslateX}%, ${swapTranslateY}%)` : 'none',
                    transition: isSwappingA || isSwappingB ? 'transform 160ms cubic-bezier(0.2, 0.9, 0.3, 1)' : 'transform 120ms ease-out',
                    zIndex: isSwappingA || isSwappingB ? 30 : isSelected || isDragTarget ? 20 : 1,
                    boxShadow: isSelected
                      ? `0 0 20px ${config.glow}, inset 0 0 8px rgba(255,255,255,0.85)`
                      : isDragTarget
                      ? `0 0 16px rgba(6,182,212,0.8), inset 0 0 6px rgba(255,255,255,0.6)`
                      : `0 2px 8px ${config.glow}, inset 0 1px 1px rgba(255,255,255,0.2)`,
                  }}
                >
                  {/* Glass Top Bevel Reflection */}
                  <div className="absolute top-0.5 inset-x-1.5 h-1.5 rounded-full bg-white/25 blur-[0.4px] pointer-events-none" />

                  {/* Explosive Match Burst Ring */}
                  {isExploding && (
                    <div className="absolute inset-0 rounded-xl bg-white/70 animate-ping pointer-events-none" />
                  )}

                  {/* Directional Drag Arrow for Target Cell */}
                  {isDragTarget && (
                    <div className="absolute inset-0 rounded-xl border-2 border-cyan-300 animate-pulse pointer-events-none flex items-center justify-center">
                      <span className="text-[10px] text-cyan-200 font-black drop-shadow">⚡</span>
                    </div>
                  )}

                  {/* Symmetrical Vector Gem Emblem */}
                  <GemEmblem
                    type={gem.type}
                    special={gem.special}
                    isSelected={isSelected}
                    isMatched={isExploding}
                    className="w-full h-full p-0.5 drop-shadow-md select-none"
                  />
                </motion.div>
              );
            })}
          </div>
        ))}

        {/* Floating Score Chips */}
        <AnimatePresence>
          {floatingScores.map((fs) => (
            <motion.div
              key={fs.id}
              initial={{ opacity: 1, scale: 0.6, y: 0 }}
              animate={{ opacity: 0, scale: 1.25, y: -36 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="absolute z-30 pointer-events-none font-black text-sm tracking-wider drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]"
              style={{
                left: `${fs.x}%`,
                top: `${fs.y}%`,
                transform: 'translate(-50%, -50%)',
                color: fs.color,
                textShadow: `0 0 10px ${fs.color}`,
              }}
            >
              {fs.text}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Cheering Mascot, Controls Tip & Multiplier Pill */}
      <div className="flex items-center justify-between px-2.5 py-1.5 bg-slate-950/80 border border-slate-800 rounded-xl">
        <div className="flex items-center gap-1.5">
          <span className="text-base animate-bounce">🐾</span>
          <span className="text-[10px] text-slate-300">
            <strong>Swipe or tap</strong> adjacent gems • Match 4 for Bomb, 5 for Rainbow!
          </span>
        </div>
        <span className="text-[9px] text-amber-300 font-bold bg-amber-950/80 px-2 py-0.5 rounded-full border border-amber-500/40 flex items-center gap-1">
          <span>⚡</span>
          <span>{activeMascot.uniqueAbility.multiplier}x Multiplier</span>
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
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-400 text-slate-950 font-black text-xs shadow-md hover:brightness-110 active:scale-95 transition-all cursor-pointer"
              >
                Play Again ➔
              </button>
            </div>
            {onWatchAdBonus && (
              <button
                onClick={onWatchAdBonus}
                className="w-full py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 hover:brightness-110 active:scale-98 transition-all shadow-lg cursor-pointer"
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
              className="px-3 py-1.5 rounded-xl bg-rose-500 text-white font-black text-xs hover:brightness-110 active:scale-95 transition-all shadow-md cursor-pointer"
            >
              Try Again 🔄
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
