import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, RotateCw, ArrowLeft, ArrowRight, ArrowDown, Zap, Trophy, RefreshCw } from 'lucide-react';
import { Mascot } from '../../types';
import { SoundEngine } from '../../utils/sound';
import confetti from 'canvas-confetti';

interface BlockStackerPuzzleViewProps {
  activeMascot: Mascot;
  playerLevel: number;
  onCompleteReward: (reward: { coins: number; xp: number; diceBonus: number }) => void;
}

const COLS = 10;
const ROWS = 16;

// 7 Standard Tetromino shapes and their neon colors
type ShapeMatrix = (string | null)[][];

interface TetrominoDef {
  name: string;
  color: string;
  matrix: ShapeMatrix;
}

const TETROMINOES: TetrominoDef[] = [
  // I-Piece (Cyan)
  {
    name: 'I',
    color: '#00f0ff',
    matrix: [
      [null, null, null, null],
      ['#00f0ff', '#00f0ff', '#00f0ff', '#00f0ff'],
      [null, null, null, null],
      [null, null, null, null],
    ],
  },
  // O-Piece (Yellow)
  {
    name: 'O',
    color: '#ffe600',
    matrix: [
      ['#ffe600', '#ffe600'],
      ['#ffe600', '#ffe600'],
    ],
  },
  // T-Piece (Fuchsia)
  {
    name: 'T',
    color: '#d946ef',
    matrix: [
      [null, '#d946ef', null],
      ['#d946ef', '#d946ef', '#d946ef'],
      [null, null, null],
    ],
  },
  // S-Piece (Green)
  {
    name: 'S',
    color: '#39ff14',
    matrix: [
      [null, '#39ff14', '#39ff14'],
      ['#39ff14', '#39ff14', null],
      [null, null, null],
    ],
  },
  // Z-Piece (Rose)
  {
    name: 'Z',
    color: '#ff0055',
    matrix: [
      ['#ff0055', '#ff0055', null],
      [null, '#ff0055', '#ff0055'],
      [null, null, null],
    ],
  },
  // J-Piece (Blue)
  {
    name: 'J',
    color: '#38bdf8',
    matrix: [
      ['#38bdf8', null, null],
      ['#38bdf8', '#38bdf8', '#38bdf8'],
      [null, null, null],
    ],
  },
  // L-Piece (Orange)
  {
    name: 'L',
    color: '#fb923c',
    matrix: [
      [null, null, '#fb923c'],
      ['#fb923c', '#fb923c', '#fb923c'],
      [null, null, null],
    ],
  },
];

// Helper to rotate a square matrix clockwise
const rotateMatrix = (matrix: ShapeMatrix): ShapeMatrix => {
  const N = matrix.length;
  const result: ShapeMatrix = Array(N)
    .fill(null)
    .map(() => Array(N).fill(null));

  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      result[c][N - 1 - r] = matrix[r][c];
    }
  }
  return result;
};

// Check collision
const hasCollision = (
  grid: (string | null)[][],
  pieceMatrix: ShapeMatrix,
  posR: number,
  posC: number
): boolean => {
  for (let r = 0; r < pieceMatrix.length; r++) {
    for (let c = 0; c < pieceMatrix[r].length; c++) {
      if (pieceMatrix[r][c]) {
        const boardR = posR + r;
        const boardC = posC + c;

        // Check horizontal bounds
        if (boardC < 0 || boardC >= COLS) return true;
        // Check bottom bound
        if (boardR >= ROWS) return true;
        // Check overlap with placed blocks (if on board)
        if (boardR >= 0 && grid[boardR][boardC]) return true;
      }
    }
  }
  return false;
};

export const BlockStackerPuzzleView: React.FC<BlockStackerPuzzleViewProps> = ({
  activeMascot,
  playerLevel,
  onCompleteReward,
}) => {
  // Empty board
  const createEmptyBoard = () =>
    Array(ROWS)
      .fill(null)
      .map(() => Array(COLS).fill(null));

  const [board, setBoard] = useState<(string | null)[][]>(createEmptyBoard);
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'gameover' | 'won'>('idle');
  const [score, setScore] = useState(0);
  const [linesCleared, setLinesCleared] = useState(0);

  // Pieces
  const [currentPiece, setCurrentPiece] = useState<TetrominoDef>(() => TETROMINOES[0]);
  const [nextPiece, setNextPiece] = useState<TetrominoDef>(() => TETROMINOES[1]);
  const [piecePos, setPiecePos] = useState<{ r: number; c: number }>({ r: 0, c: 3 });
  const [pieceMatrix, setPieceMatrix] = useState<ShapeMatrix>(() => TETROMINOES[0].matrix);

  const dropTimerRef = useRef<any>(null);

  // Target lines goal: 8 lines for milestone, 12 lines for stacker jackpot
  const TARGET_LINES = 10;

  // Fall speed (slowed down if mascot has slow_time)
  const getDropInterval = useCallback(() => {
    let speed = Math.max(220, 600 - linesCleared * 35);
    if (activeMascot.uniqueAbility.effectType === 'slow_time') {
      speed = Math.round(speed * activeMascot.uniqueAbility.multiplier);
    }
    return speed;
  }, [linesCleared, activeMascot]);

  // Pick random tetromino
  const getRandomPiece = () => {
    const idx = Math.floor(Math.random() * TETROMINOES.length);
    return TETROMINOES[idx];
  };

  // Start new game
  const startGame = () => {
    SoundEngine.playBoardHop();
    const p1 = getRandomPiece();
    const p2 = getRandomPiece();

    setBoard(createEmptyBoard());
    setCurrentPiece(p1);
    setPieceMatrix(p1.matrix);
    setNextPiece(p2);
    setPiecePos({ r: 0, c: 3 });
    setScore(0);
    setLinesCleared(0);
    setGameState('playing');
  };

  // Hard drop ghost calculation
  const getGhostRow = useCallback(() => {
    let ghostR = piecePos.r;
    while (!hasCollision(board, pieceMatrix, ghostR + 1, piecePos.c)) {
      ghostR++;
    }
    return ghostR;
  }, [board, pieceMatrix, piecePos]);

  // Lock piece into board
  const lockPiece = useCallback(() => {
    const newBoard = board.map((row) => [...row]);
    let gameOver = false;

    for (let r = 0; r < pieceMatrix.length; r++) {
      for (let c = 0; c < pieceMatrix[r].length; c++) {
        if (pieceMatrix[r][c]) {
          const boardR = piecePos.r + r;
          const boardC = piecePos.c + c;

          if (boardR < 0) {
            gameOver = true;
          } else if (boardR < ROWS) {
            newBoard[boardR][boardC] = pieceMatrix[r][c];
          }
        }
      }
    }

    if (gameOver) {
      SoundEngine.playErrorBuzz();
      setGameState('gameover');
      return;
    }

    // Line clearing check
    let clearedCount = 0;
    const filteredBoard = newBoard.filter((row) => {
      const isFull = row.every((cell) => cell !== null);
      if (isFull) clearedCount++;
      return !isFull;
    });

    if (clearedCount > 0) {
      // Re-fill empty rows at top
      const emptyRows = Array(clearedCount)
        .fill(null)
        .map(() => Array(COLS).fill(null));
      const updatedBoard = [...emptyRows, ...filteredBoard];
      setBoard(updatedBoard);

      const addedLines = linesCleared + clearedCount;
      setLinesCleared(addedLines);

      // Score points
      const points = clearedCount === 4 ? 1200 : clearedCount === 3 ? 600 : clearedCount === 2 ? 300 : 100;
      setScore((s) => s + points);

      if (clearedCount === 4) {
        SoundEngine.playUpgradeFanfare();
        confetti({ particleCount: 70, spread: 80, origin: { y: 0.5 } });
      } else {
        SoundEngine.playLaserHit(1.3);
      }

      // Check win jackpot
      if (addedLines >= TARGET_LINES) {
        setGameState('won');
        SoundEngine.playUpgradeFanfare();
        confetti({ particleCount: 90, spread: 90, origin: { y: 0.5 } });

        let coinBonus = 9000 + playerLevel * 1800;
        if (activeMascot.uniqueAbility.effectType === 'bonus_coins') {
          coinBonus = Math.round(coinBonus * activeMascot.uniqueAbility.multiplier);
        }
        const xpBonus = 260 + playerLevel * 50;
        const diceBonus = activeMascot.uniqueAbility.effectType === 'lucky_dice' ? 4 : 3;

        onCompleteReward({
          coins: coinBonus,
          xp: xpBonus,
          diceBonus,
        });
        return;
      }
    } else {
      SoundEngine.playDiceRoll();
      setBoard(newBoard);
    }

    // Spawn next piece
    const next = nextPiece;
    const newNext = getRandomPiece();

    if (hasCollision(newBoard, next.matrix, 0, 3)) {
      SoundEngine.playErrorBuzz();
      setGameState('gameover');
    } else {
      setCurrentPiece(next);
      setPieceMatrix(next.matrix);
      setNextPiece(newNext);
      setPiecePos({ r: 0, c: 3 });
    }
  }, [board, pieceMatrix, piecePos, nextPiece, linesCleared, playerLevel, activeMascot, onCompleteReward]);

  // Move left
  const moveLeft = () => {
    if (gameState !== 'playing') return;
    if (!hasCollision(board, pieceMatrix, piecePos.r, piecePos.c - 1)) {
      setPiecePos((p) => ({ ...p, c: p.c - 1 }));
      SoundEngine.playBoardHop();
    }
  };

  // Move right
  const moveRight = () => {
    if (gameState !== 'playing') return;
    if (!hasCollision(board, pieceMatrix, piecePos.r, piecePos.c + 1)) {
      setPiecePos((p) => ({ ...p, c: p.c + 1 }));
      SoundEngine.playBoardHop();
    }
  };

  // Rotate piece
  const rotatePiece = () => {
    if (gameState !== 'playing') return;
    const rotated = rotateMatrix(pieceMatrix);

    // Try normal rotation
    if (!hasCollision(board, rotated, piecePos.r, piecePos.c)) {
      setPieceMatrix(rotated);
      SoundEngine.playBoardHop();
    } else if (!hasCollision(board, rotated, piecePos.r, piecePos.c - 1)) {
      // Wall kick left
      setPiecePos((p) => ({ ...p, c: p.c - 1 }));
      setPieceMatrix(rotated);
      SoundEngine.playBoardHop();
    } else if (!hasCollision(board, rotated, piecePos.r, piecePos.c + 1)) {
      // Wall kick right
      setPiecePos((p) => ({ ...p, c: p.c + 1 }));
      setPieceMatrix(rotated);
      SoundEngine.playBoardHop();
    }
  };

  // Soft drop
  const softDrop = () => {
    if (gameState !== 'playing') return;
    if (!hasCollision(board, pieceMatrix, piecePos.r + 1, piecePos.c)) {
      setPiecePos((p) => ({ ...p, r: p.r + 1 }));
      setScore((s) => s + 1);
    } else {
      lockPiece();
    }
  };

  // Hard drop (instant)
  const hardDrop = () => {
    if (gameState !== 'playing') return;
    const targetR = getGhostRow();
    setPiecePos((p) => ({ ...p, r: targetR }));
    setScore((s) => s + (targetR - piecePos.r) * 2);
    // Lock on next tick
    setTimeout(() => {
      lockPiece();
    }, 10);
  };

  // Auto-fall interval
  useEffect(() => {
    if (gameState !== 'playing') {
      if (dropTimerRef.current) clearInterval(dropTimerRef.current);
      return;
    }

    dropTimerRef.current = setInterval(() => {
      setPiecePos((prev) => {
        if (!hasCollision(board, pieceMatrix, prev.r + 1, prev.c)) {
          return { ...prev, r: prev.r + 1 };
        } else {
          lockPiece();
          return prev;
        }
      });
    }, getDropInterval());

    return () => clearInterval(dropTimerRef.current);
  }, [gameState, board, pieceMatrix, getDropInterval, lockPiece]);

  // Physical keyboard listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== 'playing') {
        if (e.code === 'Space' || e.code === 'Enter') {
          startGame();
        }
        return;
      }

      if (e.code === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        moveLeft();
      } else if (e.code === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        moveRight();
      } else if (e.code === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        rotatePiece();
      } else if (e.code === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        e.preventDefault();
        softDrop();
      } else if (e.code === 'Space') {
        e.preventDefault();
        hardDrop();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, board, pieceMatrix, piecePos]);

  const ghostR = getGhostRow();

  return (
    <div className="w-full flex flex-col gap-2 py-1 select-none">
      {/* Header Info Strip */}
      <div className="flex items-center justify-between bg-slate-900/90 border border-cyan-500/30 rounded-2xl px-3 py-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center font-black text-cyan-300 text-sm">
            🕹️
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black text-white">Neon Block Stacker</span>
              <span className="text-[9px] bg-cyan-950 text-cyan-300 font-bold px-1.5 py-0.2 rounded-full border border-cyan-500/30">
                Block Stacker
              </span>
            </div>
            <div className="text-[10px] text-slate-400">
              Lines: <strong className="text-cyan-300">{linesCleared}</strong>/{TARGET_LINES} | Score:{' '}
              <strong className="text-amber-300">{score.toLocaleString()}</strong>
            </div>
          </div>
        </div>

        {/* Next Piece Mini Box */}
        <div className="flex items-center gap-2">
          <div className="flex flex-col items-center bg-slate-950 px-2 py-1 rounded-xl border border-slate-800">
            <span className="text-[8px] text-slate-400 uppercase font-black">NEXT</span>
            <div className="w-6 h-6 flex items-center justify-center">
              <div
                className="w-4 h-4 rounded-xs shadow-xs"
                style={{ backgroundColor: nextPiece.color }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Block Grid Container */}
      <div className="relative w-full max-w-[260px] mx-auto aspect-[10/16] bg-[#07091c] border-2 border-indigo-900/80 rounded-3xl p-2 shadow-2xl flex flex-col justify-between overflow-hidden">
        {/* Background Grid Cells */}
        <div className="grid grid-cols-10 gap-0.5 w-full h-full">
          {board.map((row, rIdx) =>
            row.map((cellColor, cIdx) => {
              // Check if current active piece occupies (rIdx, cIdx)
              let activeColor: string | null = null;
              if (
                gameState === 'playing' &&
                rIdx >= piecePos.r &&
                rIdx < piecePos.r + pieceMatrix.length &&
                cIdx >= piecePos.c &&
                cIdx < piecePos.c + pieceMatrix[0].length
              ) {
                const pr = rIdx - piecePos.r;
                const pc = cIdx - piecePos.c;
                if (pieceMatrix[pr] && pieceMatrix[pr][pc]) {
                  activeColor = pieceMatrix[pr][pc];
                }
              }

              // Check if ghost piece occupies (rIdx, cIdx)
              let isGhost = false;
              if (
                !activeColor &&
                gameState === 'playing' &&
                rIdx >= ghostR &&
                rIdx < ghostR + pieceMatrix.length &&
                cIdx >= piecePos.c &&
                cIdx < piecePos.c + pieceMatrix[0].length
              ) {
                const pr = rIdx - ghostR;
                const pc = cIdx - piecePos.c;
                if (pieceMatrix[pr] && pieceMatrix[pr][pc]) {
                  isGhost = true;
                }
              }

              return (
                <div
                  key={`${rIdx}-${cIdx}`}
                  className={`rounded-xs transition-all relative overflow-hidden ${
                    activeColor
                      ? 'shadow-[0_0_12px_rgba(0,240,255,0.9)] border-2 border-white'
                      : cellColor
                      ? 'shadow-xs border border-white/50'
                      : isGhost
                      ? 'border border-cyan-400/50 bg-cyan-950/30'
                      : 'bg-slate-900/40 border border-slate-800/20'
                  }`}
                  style={{
                    backgroundColor: activeColor || cellColor || undefined,
                  }}
                >
                  {(activeColor || cellColor) && (
                    <div className="absolute top-0 inset-x-0 h-[1.5px] bg-white/70 pointer-events-none" />
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Start / Gameover Overlay */}
        {gameState !== 'playing' && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-xs flex flex-col items-center justify-center p-4 text-center z-20">
            {gameState === 'idle' && (
              <>
                <div className="text-3xl mb-2">🕹️</div>
                <h3 className="text-sm font-black text-white mb-1">BLOCK STACKER PUZZLE</h3>
                <p className="text-[10px] text-slate-300 mb-3 max-w-[180px]">
                  Clear {TARGET_LINES} lines to trigger the Gold Stacker Jackpot!
                </p>
                <button
                  onClick={startGame}
                  className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5"
                >
                  <Play className="w-3.5 h-3.5 fill-slate-950" />
                  <span>START GAME</span>
                </button>
              </>
            )}

            {gameState === 'gameover' && (
              <>
                <div className="text-3xl mb-1">💥</div>
                <h3 className="text-sm font-black text-rose-400 mb-1">BLOCKS TOPPED OUT</h3>
                <p className="text-[10px] text-slate-300 mb-3">
                  Cleared {linesCleared} lines • Score: {score.toLocaleString()}
                </p>
                <button
                  onClick={startGame}
                  className="px-4 py-2 rounded-2xl bg-gradient-to-r from-amber-400 to-rose-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>PLAY AGAIN</span>
                </button>
              </>
            )}

            {gameState === 'won' && (
              <>
                <div className="text-3xl mb-1">🏆</div>
                <h3 className="text-sm font-black text-emerald-400 mb-1">STACKER JACKPOT WON!</h3>
                <p className="text-[10px] text-emerald-200 mb-3">
                  All {TARGET_LINES} lines cleared! Score: {score.toLocaleString()}
                </p>
                <button
                  onClick={startGame}
                  className="px-4 py-2 rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg hover:brightness-110 active:scale-95 transition-all"
                >
                  Keep Playing ➔
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Mobile Touch Controls Bar */}
      <div className="w-full max-w-[280px] mx-auto grid grid-cols-5 gap-1.5 mt-1">
        <button
          onClick={moveLeft}
          disabled={gameState !== 'playing'}
          className="py-3 rounded-2xl bg-slate-900 border border-slate-700 active:bg-cyan-500 active:text-slate-950 flex items-center justify-center text-slate-200 shadow-md transition-all active:scale-95 disabled:opacity-40"
          title="Move Left"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <button
          onClick={moveRight}
          disabled={gameState !== 'playing'}
          className="py-3 rounded-2xl bg-slate-900 border border-slate-700 active:bg-cyan-500 active:text-slate-950 flex items-center justify-center text-slate-200 shadow-md transition-all active:scale-95 disabled:opacity-40"
          title="Move Right"
        >
          <ArrowRight className="w-5 h-5" />
        </button>

        <button
          onClick={rotatePiece}
          disabled={gameState !== 'playing'}
          className="py-3 rounded-2xl bg-indigo-950 border border-indigo-500/50 active:bg-fuchsia-500 active:text-slate-950 flex items-center justify-center text-cyan-300 shadow-md transition-all active:scale-95 disabled:opacity-40"
          title="Rotate Piece"
        >
          <RotateCw className="w-5 h-5" />
        </button>

        <button
          onClick={softDrop}
          disabled={gameState !== 'playing'}
          className="py-3 rounded-2xl bg-slate-900 border border-slate-700 active:bg-amber-400 active:text-slate-950 flex items-center justify-center text-slate-200 shadow-md transition-all active:scale-95 disabled:opacity-40"
          title="Soft Drop"
        >
          <ArrowDown className="w-5 h-5" />
        </button>

        <button
          onClick={hardDrop}
          disabled={gameState !== 'playing'}
          className="py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-500 active:brightness-125 flex items-center justify-center text-slate-950 shadow-md transition-all active:scale-95 disabled:opacity-40"
          title="Hard Drop"
        >
          <Zap className="w-5 h-5 fill-slate-950" />
        </button>
      </div>

      <div className="text-center text-[9px] text-slate-400">
        💡 Controls: ◄ / ► to move • ⟳ or Up Arrow to rotate • ⚡ / Spacebar to hard drop
      </div>
    </div>
  );
};
