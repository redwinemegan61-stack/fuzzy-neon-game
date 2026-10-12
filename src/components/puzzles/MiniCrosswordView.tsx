import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, Lightbulb, RefreshCw, Delete, Trophy, Sparkles, Flame, Zap } from 'lucide-react';
import { Mascot } from '../../types';
import { MINI_CROSSWORD_PUZZLES, MiniCrosswordTheme, CrosswordClue, CrosswordDifficulty } from '../../data/puzzleData';
import { SoundEngine } from '../../utils/sound';
import confetti from 'canvas-confetti';

interface MiniCrosswordViewProps {
  activeMascot: Mascot;
  playerLevel: number;
  onCompleteReward: (reward: { coins: number; xp: number; diceBonus: number }) => void;
  onWatchAdBonus?: () => void;
}

export const MiniCrosswordView: React.FC<MiniCrosswordViewProps> = ({
  activeMascot,
  playerLevel,
  onCompleteReward,
  onWatchAdBonus,
}) => {
  const [selectedDifficulty, setSelectedDifficulty] = useState<CrosswordDifficulty>('casual');

  const availablePuzzles = useMemo(() => {
    return MINI_CROSSWORD_PUZZLES.filter((p) => p.difficulty === selectedDifficulty);
  }, [selectedDifficulty]);

  const [puzzleIndex, setPuzzleIndex] = useState(0);
  const currentPuzzle: MiniCrosswordTheme = availablePuzzles[puzzleIndex % availablePuzzles.length] || MINI_CROSSWORD_PUZZLES[0];

  // User entered grid (prefill '#' cells)
  const [grid, setGrid] = useState<string[][]>(() =>
    Array(currentPuzzle.gridSize)
      .fill('')
      .map((_, r) =>
        Array(currentPuzzle.gridSize)
          .fill('')
          .map((_, c) => (currentPuzzle.solution[r]?.[c] === '#' ? '#' : ''))
      )
  );

  // Focus state
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number }>({ row: 0, col: 0 });
  const [direction, setDirection] = useState<'across' | 'down'>('across');
  const [isSolved, setIsSolved] = useState(false);

  // Reset grid when puzzle index or difficulty changes
  useEffect(() => {
    setGrid(
      Array(currentPuzzle.gridSize)
        .fill('')
        .map((_, r) =>
          Array(currentPuzzle.gridSize)
            .fill('')
            .map((_, c) => (currentPuzzle.solution[r]?.[c] === '#' ? '#' : ''))
        )
    );
    // Find first non-# cell
    let startR = 0;
    let startC = 0;
    for (let r = 0; r < currentPuzzle.gridSize; r++) {
      for (let c = 0; c < currentPuzzle.gridSize; c++) {
        if (currentPuzzle.solution[r]?.[c] !== '#') {
          startR = r;
          startC = c;
          break;
        }
      }
      if (currentPuzzle.solution[startR]?.[startC] !== '#') break;
    }
    setSelectedCell({ row: startR, col: startC });
    setDirection('across');
    setIsSolved(false);
  }, [puzzleIndex, selectedDifficulty, currentPuzzle]);

  // Find the active clue based on selectedCell and direction
  const activeClue = useMemo(() => {
    return (
      currentPuzzle.clues.find(
        (c) =>
          c.direction === direction &&
          ((direction === 'across' && c.row === selectedCell.row) ||
            (direction === 'down' && c.col === selectedCell.col))
      ) || currentPuzzle.clues[0]
    );
  }, [currentPuzzle, selectedCell, direction]);

  // Handle cell click: toggle direction if clicking current cell, or move focus
  const handleCellClick = (r: number, c: number) => {
    if (currentPuzzle.solution[r]?.[c] === '#') return; // ignore blocker
    if (selectedCell.row === r && selectedCell.col === c) {
      setDirection((d) => (d === 'across' ? 'down' : 'across'));
    } else {
      setSelectedCell({ row: r, col: c });
    }
    SoundEngine.playBoardHop();
  };

  // Keyboard character input
  const handleCharInput = (char: string) => {
    if (isSolved) return;
    if (currentPuzzle.solution[selectedCell.row]?.[selectedCell.col] === '#') return;

    const upper = char.toUpperCase();
    if (!/^[A-Z]$/.test(upper)) return;

    SoundEngine.playBoardHop();
    const newGrid = grid.map((row) => [...row]);
    newGrid[selectedCell.row][selectedCell.col] = upper;
    setGrid(newGrid);

    // Auto check if fully filled
    checkFullSolution(newGrid);

    // Advance cursor in current direction skipping '#'
    if (direction === 'across') {
      let nextCol = selectedCell.col + 1;
      while (nextCol < currentPuzzle.gridSize && currentPuzzle.solution[selectedCell.row]?.[nextCol] === '#') {
        nextCol++;
      }
      if (nextCol < currentPuzzle.gridSize) {
        setSelectedCell({ row: selectedCell.row, col: nextCol });
      }
    } else {
      let nextRow = selectedCell.row + 1;
      while (nextRow < currentPuzzle.gridSize && currentPuzzle.solution[nextRow]?.[selectedCell.col] === '#') {
        nextRow++;
      }
      if (nextRow < currentPuzzle.gridSize) {
        setSelectedCell({ row: nextRow, col: selectedCell.col });
      }
    }
  };

  // Handle Backspace
  const handleBackspace = () => {
    if (isSolved) return;
    const newGrid = grid.map((row) => [...row]);
    if (newGrid[selectedCell.row][selectedCell.col] !== '#') {
      newGrid[selectedCell.row][selectedCell.col] = '';
    }
    setGrid(newGrid);

    // Move backward in current direction
    if (direction === 'across') {
      let prevCol = selectedCell.col - 1;
      while (prevCol >= 0 && currentPuzzle.solution[selectedCell.row]?.[prevCol] === '#') {
        prevCol--;
      }
      if (prevCol >= 0) {
        setSelectedCell({ row: selectedCell.row, col: prevCol });
      }
    } else {
      let prevRow = selectedCell.row - 1;
      while (prevRow >= 0 && currentPuzzle.solution[prevRow]?.[selectedCell.col] === '#') {
        prevRow--;
      }
      if (prevRow >= 0) {
        setSelectedCell({ row: prevRow, col: selectedCell.col });
      }
    }
  };

  // Check full solution
  const checkFullSolution = (currentGrid: string[][]) => {
    let allFilled = true;
    let allCorrect = true;

    for (let r = 0; r < currentPuzzle.gridSize; r++) {
      for (let c = 0; c < currentPuzzle.gridSize; c++) {
        const expected = currentPuzzle.solution[r]?.[c];
        if (expected === '#') continue; // ignore black blocks

        if (!currentGrid[r]?.[c]) {
          allFilled = false;
        } else if (currentGrid[r][c] !== expected) {
          allCorrect = false;
        }
      }
    }

    if (allFilled && allCorrect) {
      handleWin();
    }
  };

  const handleWin = () => {
    setIsSolved(true);
    SoundEngine.playUpgradeFanfare();
    confetti({ particleCount: 85, spread: 85, origin: { y: 0.6 } });

    const diffMultiplier = selectedDifficulty === 'mastermind' ? 2.5 : selectedDifficulty === 'challenger' ? 1.7 : 1.0;
    let coinBonus = Math.round((5000 + playerLevel * 1200) * diffMultiplier);
    if (activeMascot.uniqueAbility.effectType === 'bonus_coins') {
      coinBonus = Math.round(coinBonus * activeMascot.uniqueAbility.multiplier);
    }
    const xpBonus = Math.round((220 + playerLevel * 50) * diffMultiplier);
    const diceBonus = selectedDifficulty === 'mastermind' ? 5 : selectedDifficulty === 'challenger' ? 3 : 2;

    onCompleteReward({
      coins: coinBonus,
      xp: xpBonus,
      diceBonus,
    });
  };

  // Hint: reveal current cell letter
  const handleRevealLetter = () => {
    if (isSolved) return;
    const correctLetter = currentPuzzle.solution[selectedCell.row]?.[selectedCell.col];
    if (!correctLetter || correctLetter === '#') return;

    const newGrid = grid.map((row) => [...row]);
    newGrid[selectedCell.row][selectedCell.col] = correctLetter;
    setGrid(newGrid);
    SoundEngine.playComboChime(1);
    checkFullSolution(newGrid);
  };

  // Desktop physical keyboard support
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Backspace') {
        handleBackspace();
      } else if (/^[a-zA-Z]$/.test(e.key)) {
        handleCharInput(e.key);
      } else if (e.key === 'ArrowRight' && selectedCell.col < currentPuzzle.gridSize - 1) {
        setSelectedCell((prev) => ({ ...prev, col: prev.col + 1 }));
      } else if (e.key === 'ArrowLeft' && selectedCell.col > 0) {
        setSelectedCell((prev) => ({ ...prev, col: prev.col - 1 }));
      } else if (e.key === 'ArrowDown' && selectedCell.row < currentPuzzle.gridSize - 1) {
        setSelectedCell((prev) => ({ ...prev, row: prev.row + 1 }));
      } else if (e.key === 'ArrowUp' && selectedCell.row > 0) {
        setSelectedCell((prev) => ({ ...prev, row: prev.row - 1 }));
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedCell, grid, isSolved, direction, currentPuzzle]);

  const KEYBOARD_ROWS = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['Z', 'X', 'C', 'V', 'B', 'N', 'M'],
  ];

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
                ? 'bg-fuchsia-500 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Casual (5x5)
          </button>
          <button
            onClick={() => {
              setSelectedDifficulty('challenger');
              SoundEngine.playBoardHop();
            }}
            className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-1 ${
              selectedDifficulty === 'challenger'
                ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Flame className="w-3 h-3 text-amber-300" />
            <span>Tricky (6x6)</span>
          </button>
          <button
            onClick={() => {
              setSelectedDifficulty('mastermind');
              SoundEngine.playBoardHop();
            }}
            className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-1 ${
              selectedDifficulty === 'mastermind'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Zap className="w-3 h-3 text-amber-950" />
            <span>Master (7x7)</span>
          </button>
        </div>
      </div>

      {/* Header Info */}
      <div className="flex items-center justify-between bg-slate-900/90 border border-fuchsia-500/30 rounded-2xl px-3 py-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-fuchsia-500/20 border border-fuchsia-400/40 flex items-center justify-center font-black text-fuchsia-300 text-sm">
            ✍️
          </div>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-black text-white">{currentPuzzle.title}</span>
              <span className="text-[9px] bg-fuchsia-950 text-fuchsia-300 font-bold px-1.5 py-0.2 rounded-full border border-fuchsia-500/30">
                {currentPuzzle.difficultyLabel}
              </span>
            </div>
            <div className="text-[10px] text-slate-400">{currentPuzzle.subtitle}</div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleRevealLetter}
            disabled={isSolved}
            className="p-1.5 rounded-xl bg-amber-950/80 border border-amber-500/40 text-amber-300 hover:text-white text-xs font-bold flex items-center gap-1 transition-all disabled:opacity-40"
            title="Reveal Mascot Letter"
          >
            <Lightbulb className="w-3.5 h-3.5" />
            <span className="text-[10px]">Reveal</span>
          </button>
          <button
            onClick={() => setPuzzleIndex((p) => p + 1)}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all"
            title="Next Crossword"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Active Clue Banner */}
      <div className="bg-slate-950/90 border border-indigo-900/70 rounded-2xl p-2.5 shadow-md flex items-center justify-between">
        <div className="flex items-center gap-2 flex-1">
          <button
            onClick={() => setDirection((d) => (d === 'across' ? 'down' : 'across'))}
            className="px-2 py-1 rounded-lg bg-cyan-950 border border-cyan-500/40 text-cyan-300 font-black text-[10px] uppercase tracking-wider"
          >
            {direction} ↺
          </button>
          <div className="text-xs font-black text-white">
            {activeClue?.text || 'Tap an empty cell to view clue'}
          </div>
        </div>
      </div>

      {/* Crossword Grid */}
      <div className="w-full max-w-[310px] mx-auto aspect-square bg-[#0a0c22] border-2 border-fuchsia-500/40 rounded-3xl p-2.5 shadow-2xl flex flex-col justify-between select-none">
        {grid.map((row, rIdx) => (
          <div key={rIdx} className="flex gap-1 flex-1">
            {row.map((val, cIdx) => {
              const isBlocker = currentPuzzle.solution[rIdx]?.[cIdx] === '#';
              const isCurrentCell = selectedCell.row === rIdx && selectedCell.col === cIdx;
              const isInCurrentWord =
                direction === 'across' ? selectedCell.row === rIdx : selectedCell.col === cIdx;

              if (isBlocker) {
                return (
                  <div
                    key={`${rIdx}-${cIdx}`}
                    className="flex-1 rounded-lg bg-slate-950/90 border border-slate-900/80 shadow-inner"
                  />
                );
              }

              return (
                <button
                  key={`${rIdx}-${cIdx}`}
                  onClick={() => handleCellClick(rIdx, cIdx)}
                  className={`flex-1 flex items-center justify-center font-black ${
                    currentPuzzle.gridSize >= 7
                      ? 'text-sm'
                      : currentPuzzle.gridSize >= 6
                      ? 'text-base'
                      : 'text-lg'
                  } rounded-lg transition-all relative ${
                    isCurrentCell
                      ? 'bg-gradient-to-br from-amber-400 to-yellow-300 text-slate-950 shadow-[0_0_15px_rgba(251,191,36,0.9)] scale-105 z-10'
                      : isInCurrentWord
                      ? 'bg-indigo-900/60 border border-cyan-400/60 text-white shadow-sm'
                      : 'bg-slate-900/90 text-slate-200 border border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <span>{val}</span>
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Mobile Neon Cyber Touch Keyboard */}
      <div className="w-full flex flex-col gap-1 bg-slate-950/90 p-2 rounded-2xl border border-slate-800 select-none">
        {KEYBOARD_ROWS.map((row, rowIdx) => (
          <div key={rowIdx} className="flex justify-center gap-1">
            {row.map((char) => (
              <button
                key={char}
                onClick={() => handleCharInput(char)}
                className="flex-1 max-w-[32px] py-1.5 rounded-lg bg-slate-900 hover:bg-cyan-950/80 active:bg-cyan-500 active:text-slate-950 border border-slate-800 hover:border-cyan-400/40 text-xs font-black text-slate-200 transition-all shadow-xs text-center"
              >
                {char}
              </button>
            ))}
            {rowIdx === 2 && (
              <button
                onClick={handleBackspace}
                className="px-2 py-1.5 rounded-lg bg-rose-950/80 hover:bg-rose-900 border border-rose-500/40 text-rose-300 active:scale-95 text-xs font-bold transition-all flex items-center justify-center"
                title="Delete"
              >
                <Delete className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Win Notification Banner */}
      <AnimatePresence>
        {isSolved && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-3 rounded-2xl bg-gradient-to-r from-fuchsia-950 via-purple-950 to-slate-900 border border-fuchsia-400 shadow-xl flex flex-col gap-2"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">🎉</span>
                <div>
                  <div className="text-xs font-black text-white">{currentPuzzle.difficultyLabel} Solved!</div>
                  <div className="text-[10px] text-fuchsia-300 font-bold">
                    Grid completely verified & solved!
                  </div>
                </div>
              </div>
              <button
                onClick={() => setPuzzleIndex((p) => p + 1)}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-fuchsia-500 to-pink-500 text-white font-black text-xs shadow-md hover:brightness-110 active:scale-95 transition-all"
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
