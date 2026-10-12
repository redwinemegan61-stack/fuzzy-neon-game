import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Check, RefreshCw, Lightbulb, Trophy, Star, Volume2, Flame, Timer, Zap } from 'lucide-react';
import { Mascot } from '../../types';
import { WORD_FIND_PUZZLES, WordFindTheme, WordFindDifficulty } from '../../data/puzzleData';
import { SoundEngine } from '../../utils/sound';
import confetti from 'canvas-confetti';

interface WordFindPuzzleViewProps {
  activeMascot: Mascot;
  playerLevel: number;
  onCompleteReward: (reward: { coins: number; xp: number; diceBonus: number }) => void;
  onWatchAdBonus?: () => void;
}

interface CellPos {
  row: number;
  col: number;
}

export const WordFindPuzzleView: React.FC<WordFindPuzzleViewProps> = ({
  activeMascot,
  playerLevel,
  onCompleteReward,
  onWatchAdBonus,
}) => {
  const [selectedDifficulty, setSelectedDifficulty] = useState<WordFindDifficulty>('casual');
  
  // Filter puzzles matching selected difficulty
  const availablePuzzles = useMemo(() => {
    return WORD_FIND_PUZZLES.filter((p) => p.difficulty === selectedDifficulty);
  }, [selectedDifficulty]);

  const [puzzleIndex, setPuzzleIndex] = useState(0);
  const currentPuzzle: WordFindTheme = availablePuzzles[puzzleIndex % availablePuzzles.length] || WORD_FIND_PUZZLES[0];

  const [foundWords, setFoundWords] = useState<string[]>([]);
  const [selectedCells, setSelectedCells] = useState<CellPos[]>([]);
  const [isSelecting, setIsSelecting] = useState(false);
  const [hintCell, setHintCell] = useState<CellPos | null>(null);
  const [hasWon, setHasWon] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState<number | null>(currentPuzzle.timeLimitSec || null);

  // Permanently highlight cells that belong to found words
  const [foundWordCells, setFoundWordCells] = useState<Record<string, CellPos[]>>({});

  // Reset state on puzzle switch or difficulty change
  useEffect(() => {
    setFoundWords([]);
    setSelectedCells([]);
    setFoundWordCells({});
    setHintCell(null);
    setHasWon(false);
    setScore(0);
    setTimeLeft(currentPuzzle.timeLimitSec || null);
  }, [puzzleIndex, selectedDifficulty, currentPuzzle]);

  // Optional countdown timer for Mastermind difficulty
  useEffect(() => {
    if (timeLeft === null || hasWon || timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft((t) => (t !== null && t > 0 ? t - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLeft, hasWon]);

  // Check if cell is in current selection
  const isCellSelected = (r: number, c: number) => {
    return selectedCells.some((cell) => cell.row === r && cell.col === c);
  };

  // Check if cell belongs to an already found word
  const isCellFound = (r: number, c: number) => {
    return Object.values(foundWordCells).some((cells) =>
      cells.some((cell) => cell.row === r && cell.col === c)
    );
  };

  // Current spelled string
  const currentSelectedWord = useMemo(() => {
    return selectedCells
      .map((cell) => currentPuzzle.grid[cell.row]?.[cell.col] || '')
      .join('');
  }, [selectedCells, currentPuzzle]);

  // Handle cell click / tap
  const handleCellClick = (r: number, c: number) => {
    if (hasWon) return;

    // If starting a fresh selection
    if (selectedCells.length === 0) {
      SoundEngine.playBoardHop();
      setSelectedCells([{ row: r, col: c }]);
      setIsSelecting(true);
      return;
    }

    // If clicking the same cell again, clear
    const lastCell = selectedCells[selectedCells.length - 1];
    if (lastCell.row === r && lastCell.col === c && selectedCells.length === 1) {
      setSelectedCells([]);
      setIsSelecting(false);
      return;
    }

    // Build straight line from first cell to clicked cell (row, col, or diagonal)
    const firstCell = selectedCells[0];
    const dr = r - firstCell.row;
    const dc = c - firstCell.col;
    const absDr = Math.abs(dr);
    const absDc = Math.abs(dc);

    if (dr === 0 || dc === 0 || absDr === absDc) {
      const steps = Math.max(absDr, absDc);
      const stepR = dr === 0 ? 0 : dr / absDr;
      const stepC = dc === 0 ? 0 : dc / absDc;

      const path: CellPos[] = [];
      for (let i = 0; i <= steps; i++) {
        path.push({
          row: firstCell.row + i * stepR,
          col: firstCell.col + i * stepC,
        });
      }

      SoundEngine.playBoardHop();
      setSelectedCells(path);
      checkSelection(path);
    } else {
      // Not a straight line, restart selection from this cell
      SoundEngine.playBoardHop();
      setSelectedCells([{ row: r, col: c }]);
    }
  };

  // Check if current path matches any unfound word (forward or backward)
  const checkSelection = (path: CellPos[]) => {
    const forward = path.map((cell) => currentPuzzle.grid[cell.row]?.[cell.col] || '').join('');
    const backward = forward.split('').reverse().join('');

    const match = currentPuzzle.words.find(
      (w) => (!foundWords.includes(w) && (w === forward || w === backward))
    );

    if (match) {
      SoundEngine.playCoinChime();
      const updatedFound = [...foundWords, match];
      setFoundWords(updatedFound);
      setFoundWordCells((prev) => ({ ...prev, [match]: path }));
      setSelectedCells([]);
      setHintCell(null);
      setScore((s) => s + match.length * 150);

      // Check for full puzzle win
      if (updatedFound.length === currentPuzzle.words.length) {
        setHasWon(true);
        SoundEngine.playUpgradeFanfare();
        confetti({ particleCount: 85, spread: 85, origin: { y: 0.6 } });

        // Calculate rewards with difficulty scaling & mascot boost
        const diffMultiplier = selectedDifficulty === 'mastermind' ? 2.5 : selectedDifficulty === 'challenger' ? 1.7 : 1.0;
        let coinBonus = Math.round((4500 + playerLevel * 1000) * diffMultiplier);
        if (activeMascot.uniqueAbility.effectType === 'bonus_coins') {
          coinBonus = Math.round(coinBonus * activeMascot.uniqueAbility.multiplier);
        }
        const xpBonus = Math.round((200 + playerLevel * 50) * diffMultiplier);
        const diceBonus = selectedDifficulty === 'mastermind' ? 5 : selectedDifficulty === 'challenger' ? 3 : 2;

        onCompleteReward({
          coins: coinBonus,
          xp: xpBonus,
          diceBonus,
        });
      }
    }
  };

  // Provide mascot clue hint
  const handleGiveHint = () => {
    const unfound = currentPuzzle.words.find((w) => !foundWords.includes(w));
    if (!unfound) return;

    // Find the first letter of unfound word in the grid
    const firstChar = unfound[0];
    for (let r = 0; r < currentPuzzle.gridSize; r++) {
      for (let c = 0; c < currentPuzzle.gridSize; c++) {
        if (currentPuzzle.grid[r]?.[c] === firstChar && !isCellFound(r, c)) {
          setHintCell({ row: r, col: c });
          SoundEngine.playComboChime(1);
          return;
        }
      }
    }
  };

  const gridColsClass = 
    currentPuzzle.gridSize === 12
      ? 'grid-cols-12'
      : currentPuzzle.gridSize === 10
      ? 'grid-cols-10'
      : 'grid-cols-8';

  return (
    <div className="w-full flex flex-col gap-2.5 py-1">
      {/* Difficulty Selection Bar */}
      <div className="flex items-center justify-between bg-slate-950/90 border border-slate-800 rounded-2xl p-1 shadow-md">
        <span className="text-[10px] font-black uppercase text-slate-400 pl-2">Difficulty:</span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              setSelectedDifficulty('casual');
              SoundEngine.playBoardHop();
            }}
            className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase transition-all ${
              selectedDifficulty === 'casual'
                ? 'bg-cyan-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Casual (8x8)
          </button>
          <button
            onClick={() => {
              setSelectedDifficulty('challenger');
              SoundEngine.playBoardHop();
            }}
            className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-1 ${
              selectedDifficulty === 'challenger'
                ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Flame className="w-3 h-3 text-amber-400" />
            <span>Tricky (10x10)</span>
          </button>
          <button
            onClick={() => {
              setSelectedDifficulty('mastermind');
              SoundEngine.playBoardHop();
            }}
            className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-1 ${
              selectedDifficulty === 'mastermind'
                ? 'bg-gradient-to-r from-rose-500 to-amber-500 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Zap className="w-3 h-3 text-amber-300" />
            <span>Expert (12x12)</span>
          </button>
        </div>
      </div>

      {/* Puzzle Header Strip */}
      <div className="flex items-center justify-between bg-slate-900/90 border border-cyan-500/30 rounded-2xl px-3 py-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center font-black text-cyan-300 text-sm">
            🔤
          </div>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-black text-white">{currentPuzzle.title}</span>
              <span className="text-[9px] bg-cyan-950 text-cyan-300 font-bold px-1.5 py-0.2 rounded-full border border-cyan-500/30">
                {currentPuzzle.difficultyLabel}
              </span>
            </div>
            <div className="text-[10px] text-slate-400">
              Found: <strong className="text-cyan-300">{foundWords.length}</strong>/{currentPuzzle.words.length} Words
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {timeLeft !== null && (
            <div className={`flex items-center gap-1 px-2 py-1 rounded-xl text-[10px] font-black border ${
              timeLeft < 30 ? 'bg-rose-950/80 border-rose-500/50 text-rose-300 animate-pulse' : 'bg-slate-800 text-cyan-300 border-slate-700'
            }`}>
              <Timer className="w-3 h-3" />
              <span>{timeLeft}s</span>
            </div>
          )}
          <button
            onClick={handleGiveHint}
            disabled={hasWon || foundWords.length === currentPuzzle.words.length}
            className="p-1.5 rounded-xl bg-amber-950/80 border border-amber-500/40 text-amber-300 hover:text-white text-xs font-bold flex items-center gap-1 transition-all disabled:opacity-40"
            title="Mascot Clue Hint"
          >
            <Lightbulb className="w-3.5 h-3.5" />
            <span className="text-[10px]">Hint</span>
          </button>
          <button
            onClick={() => setPuzzleIndex((prev) => prev + 1)}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all"
            title="Next Puzzle Board"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Word Bank Checklist */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-2.5 shadow-md">
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
          <span>Target Words ({foundWords.length}/{currentPuzzle.words.length}):</span>
          {currentSelectedWord && (
            <span className="text-cyan-300 font-black tracking-widest text-[11px] animate-pulse">
              Selecting: {currentSelectedWord}
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {currentPuzzle.words.map((word) => {
            const isFound = foundWords.includes(word);
            return (
              <span
                key={word}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-black tracking-wider transition-all flex items-center gap-1 ${
                  isFound
                    ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 line-through opacity-80'
                    : 'bg-slate-900 text-slate-200 border border-slate-700/80'
                }`}
              >
                {isFound && <Check className="w-2.5 h-2.5 text-emerald-400" />}
                <span>{word}</span>
              </span>
            );
          })}
        </div>
      </div>

      {/* Responsive Word Grid */}
      <div className="w-full aspect-square bg-[#0a0c20] border-2 border-indigo-900/60 rounded-3xl p-2 shadow-2xl flex flex-col justify-between select-none">
        {currentPuzzle.grid.map((row, rIdx) => (
          <div key={rIdx} className={`grid ${gridColsClass} gap-1 flex-1`}>
            {row.map((letter, cIdx) => {
              const selected = isCellSelected(rIdx, cIdx);
              const found = isCellFound(rIdx, cIdx);
              const isHint = hintCell?.row === rIdx && hintCell?.col === cIdx;

              return (
                <button
                  key={`${rIdx}-${cIdx}`}
                  onClick={() => handleCellClick(rIdx, cIdx)}
                  className={`flex items-center justify-center font-black ${
                    currentPuzzle.gridSize >= 12
                      ? 'text-[10px]'
                      : currentPuzzle.gridSize >= 10
                      ? 'text-xs'
                      : 'text-xs sm:text-sm'
                  } rounded-lg transition-all relative ${
                    selected
                      ? 'bg-gradient-to-br from-cyan-400 to-blue-500 text-slate-950 shadow-[0_0_12px_rgba(0,240,255,0.8)] scale-105 z-10'
                      : found
                      ? 'bg-emerald-950/70 border border-emerald-500/50 text-emerald-300 shadow-sm'
                      : isHint
                      ? 'bg-amber-400 text-slate-950 animate-bounce shadow-[0_0_15px_rgba(251,191,36,0.9)]'
                      : 'bg-slate-900/90 text-slate-200 border border-slate-800/80 hover:border-cyan-500/40 active:scale-95'
                  }`}
                >
                  <span>{letter}</span>
                  {found && (
                    <span className="absolute bottom-0.5 right-0.5 w-1 h-1 rounded-full bg-emerald-400" />
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Clear selection or instructions */}
      <div className="flex items-center justify-between px-1">
        <span className="text-[10px] text-slate-400">
          💡 Tap first letter, then last letter. Words can be forward, backward, horizontal, vertical or diagonal!
        </span>
        {selectedCells.length > 0 && (
          <button
            onClick={() => setSelectedCells([])}
            className="text-[10px] font-bold text-rose-400 hover:text-rose-300 underline"
          >
            Clear
          </button>
        )}
      </div>

      {/* Win Celebration Banner */}
      <AnimatePresence>
        {hasWon && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-3 rounded-2xl bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-900 border border-emerald-400 shadow-xl flex flex-col gap-2"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">🏆</span>
                <div>
                  <div className="text-xs font-black text-white">{currentPuzzle.difficultyLabel} Solved!</div>
                  <div className="text-[10px] text-emerald-300 font-bold">
                    All {currentPuzzle.words.length} cyber words found!
                  </div>
                </div>
              </div>
              <button
                onClick={() => setPuzzleIndex((p) => p + 1)}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-400 text-slate-950 font-black text-xs shadow-md hover:brightness-110 active:scale-95 transition-all"
              >
                Next Puzzle ➔
              </button>
            </div>
            {onWatchAdBonus && (
              <button
                onClick={onWatchAdBonus}
                className="w-full py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black text-[11px] uppercase tracking-wider flex items-center justify-center gap-1.5 hover:brightness-110 active:scale-98 transition-all shadow-md"
              >
                <span>🎬 Watch Short Ad for 2X Coins & +5 Extra Dice!</span>
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

