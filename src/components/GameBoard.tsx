import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Dices, Sparkles, Target, Coins, Gift, Star, 
  Globe, Zap, Swords, Flame, Key, Shield, Cpu, Box, Search, Activity, ChevronRight, Gamepad2
} from 'lucide-react';
import { BoardTile, Mascot } from '../types';
import { BOARD_TILES } from '../data/gameData';
import { MascotAvatar } from './MascotAvatar';
import { SoundEngine } from '../utils/sound';

interface GameBoardProps {
  currentTileIndex: number;
  rolls: number;
  maxRolls: number;
  rollMultiplier: number;
  activeMascot: Mascot;
  isRolling: boolean;
  onRollDice: () => void;
  onToggleMultiplier: () => void;
  onOpenPuzzleArcade?: () => void;
  onTileClick?: (tile: BoardTile) => void;
}

// Icon mapper for tiles
const TileIcon: React.FC<{ name: string; className?: string }> = ({ name, className = 'w-4 h-4' }) => {
  switch (name) {
    case 'Target': return <Target className={className} />;
    case 'Coins': return <Coins className={className} />;
    case 'Gift': return <Gift className={className} />;
    case 'Star': return <Star className={className} />;
    case 'Globe': return <Globe className={className} />;
    case 'Zap': return <Zap className={className} />;
    case 'Swords': return <Swords className={className} />;
    case 'Flame': return <Flame className={className} />;
    case 'Key': return <Key className={className} />;
    case 'Shield': return <Shield className={className} />;
    case 'Cpu': return <Cpu className={className} />;
    case 'Box': return <Box className={className} />;
    case 'Search': return <Search className={className} />;
    case 'Activity': return <Activity className={className} />;
    default: return <Sparkles className={className} />;
  }
};

// Statically pre-computed tile slices
const TOP_TILES = BOARD_TILES.slice(0, 5);
const RIGHT_TILES = BOARD_TILES.slice(5, 8);
const BOTTOM_TILES = [...BOARD_TILES.slice(8, 13)].reverse();
const LEFT_TILES = [...BOARD_TILES.slice(13, 16)].reverse();

export const GameBoard: React.FC<GameBoardProps> = React.memo(({
  currentTileIndex,
  rolls,
  maxRolls,
  rollMultiplier,
  activeMascot,
  isRolling,
  onRollDice,
  onToggleMultiplier,
  onOpenPuzzleArcade,
  onTileClick,
}) => {
  const [diceVisuals, setDiceVisuals] = useState<[number, number]>([3, 4]);

  const handleRoll = () => {
    if (isRolling || rolls < rollMultiplier) return;
    SoundEngine.playDiceRoll();
    // Quick random dice values for animation
    const d1 = Math.floor(Math.random() * 6) + 1;
    const d2 = Math.floor(Math.random() * 6) + 1;
    setDiceVisuals([d1, d2]);
    onRollDice();
  };

  const topTiles = TOP_TILES;
  const rightTiles = RIGHT_TILES;
  const bottomTiles = BOTTOM_TILES;
  const leftTiles = LEFT_TILES;

  const currentTile = BOARD_TILES[currentTileIndex] || BOARD_TILES[0];

  return (
    <div className="w-full max-w-md mx-auto flex flex-col items-center">
      {/* Current Tile Info Bar */}
      <div className="w-full px-4 mb-2 flex items-center justify-between bg-slate-900/80 border border-slate-800 rounded-xl py-2 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-950 font-bold shadow-md"
            style={{ backgroundColor: currentTile.neonColor }}
          >
            <TileIcon name={currentTile.iconName} className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Landed on
            </div>
            <div className="text-xs font-black text-white flex items-center gap-1.5">
              <span style={{ color: currentTile.neonColor }}>{currentTile.name}</span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <span className="text-[11px] font-bold text-amber-400 bg-amber-950/60 border border-amber-500/30 px-2 py-0.5 rounded-full">
            {currentTile.type === 'coin_big' || currentTile.type === 'coin_small'
              ? `+${currentTile.rewardValue * rollMultiplier} Coins`
              : currentTile.type === 'mascot_energy'
              ? `+${currentTile.rewardValue * rollMultiplier} Dice`
              : 'Special Event'}
          </span>
        </div>
      </div>

      {/* Neon Board Grid Container */}
      <div className="w-full aspect-square relative bg-[#090b1d] border-2 border-indigo-900/50 rounded-3xl p-2.5 shadow-[0_0_40px_rgba(30,15,60,0.7)] overflow-hidden flex flex-col justify-between">
        {/* Ambient Grid Lines & Corner Accents */}
        <div className="absolute inset-0 bg-[radial-gradient(#1e1b4b_1px,transparent_1px)] [background-size:16px_16px] opacity-35 pointer-events-none" />
        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-cyan-400/60 rounded-tl-2xl pointer-events-none" />
        <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-fuchsia-400/60 rounded-tr-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-emerald-400/60 rounded-bl-2xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-amber-400/60 rounded-br-2xl pointer-events-none" />

        {/* Top Row (Tiles 0 to 4) */}
        <div className="grid grid-cols-5 gap-1.5 z-10">
          {topTiles.map((tile) => (
            <TileCard
              key={tile.id}
              tile={tile}
              isCurrent={currentTileIndex === tile.index}
              activeMascot={activeMascot}
              isRolling={isRolling}
              onClick={() => onTileClick?.(tile)}
            />
          ))}
        </div>

        {/* Middle Section: Left Tile, Center Arena / Mascot Stage, Right Tile */}
        <div className="flex justify-between items-center z-10 flex-1 my-1.5 gap-1.5">
          {/* Left Column (Tiles 15, 14, 13) */}
          <div className="flex flex-col gap-1.5 h-full justify-between w-[18%]">
            {leftTiles.map((tile) => (
              <TileCard
                key={tile.id}
                tile={tile}
                isCurrent={currentTileIndex === tile.index}
                activeMascot={activeMascot}
                isRolling={isRolling}
                onClick={() => onTileClick?.(tile)}
              />
            ))}
          </div>

          {/* Center Stage: Active Mascot & Dice Rolling Pedestal */}
          <div className="flex-1 h-full mx-1 rounded-2xl bg-gradient-to-b from-slate-900/90 to-indigo-950/80 border border-indigo-500/20 flex flex-col items-center justify-center p-3 relative overflow-hidden backdrop-blur-md">
            {/* Soft Radial Center Light */}
            <div
              className="absolute inset-0 opacity-25 blur-2xl pointer-events-none"
              style={{
                background: `radial-gradient(circle, ${activeMascot.hairColors[0] || '#00f0ff'} 0%, transparent 70%)`,
              }}
            />

            {/* Mascot on Center Pedestal */}
            <div className="relative mb-1">
              <MascotAvatar
                mascot={activeMascot}
                size="md"
                isDancing={isRolling}
                interactive={true}
              />
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-16 h-3 bg-black/60 rounded-full blur-sm -z-10" />
            </div>

            {/* Active Mascot Name & Upgraded Level */}
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-xs font-black text-white">{activeMascot.name}</span>
              <span className="text-[9px] bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black px-1.5 py-0.2 rounded-full shadow-sm">
                Lv.{activeMascot.level}
              </span>
            </div>

            {/* Active Ability Pill with Upgraded Multiplier */}
            <div className="text-center mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-300 bg-cyan-950/80 border border-cyan-500/30 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                <span>⚡ {activeMascot.uniqueAbility.name}</span>
                <span className="text-amber-300 font-black">({activeMascot.uniqueAbility.multiplier}x)</span>
              </span>
            </div>

            {/* Dice Visual Display */}
            <div className="flex items-center gap-2 mb-2">
              <motion.div
                animate={isRolling ? { rotate: [0, 180, 360], scale: [1, 1.2, 1] } : {}}
                transition={{ duration: 0.4, repeat: isRolling ? Infinity : 0 }}
                className="w-8 h-8 rounded-lg bg-gradient-to-br from-white to-slate-200 border-2 border-white/80 shadow-[0_0_12px_rgba(255,255,255,0.4)] flex items-center justify-center font-black text-slate-900 text-sm"
              >
                {diceVisuals[0]}
              </motion.div>
              <motion.div
                animate={isRolling ? { rotate: [360, 180, 0], scale: [1, 1.2, 1] } : {}}
                transition={{ duration: 0.4, repeat: isRolling ? Infinity : 0 }}
                className="w-8 h-8 rounded-lg bg-gradient-to-br from-white to-slate-200 border-2 border-white/80 shadow-[0_0_12px_rgba(255,255,255,0.4)] flex items-center justify-center font-black text-slate-900 text-sm"
              >
                {diceVisuals[1]}
              </motion.div>
            </div>

            {/* Rolls Remaining Counter */}
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
              <Flame className="w-3.5 h-3.5 text-orange-400" />
              <span>
                <strong className="text-white text-sm">{rolls}</strong> / {maxRolls} Dice
              </span>
            </div>
          </div>

          {/* Right Column (Tiles 5, 6, 7) */}
          <div className="flex flex-col gap-1.5 h-full justify-between w-[18%]">
            {rightTiles.map((tile) => (
              <TileCard
                key={tile.id}
                tile={tile}
                isCurrent={currentTileIndex === tile.index}
                activeMascot={activeMascot}
                isRolling={isRolling}
                onClick={() => onTileClick?.(tile)}
              />
            ))}
          </div>
        </div>

        {/* Bottom Row (Tiles 12 down to 8) */}
        <div className="grid grid-cols-5 gap-1.5 z-10">
          {bottomTiles.map((tile) => (
            <TileCard
              key={tile.id}
              tile={tile}
              isCurrent={currentTileIndex === tile.index}
              activeMascot={activeMascot}
              isRolling={isRolling}
              onClick={() => onTileClick?.(tile)}
            />
          ))}
        </div>
      </div>

      {/* Quick Play Reflex Puzzles Arcade Shortcut */}
      {onOpenPuzzleArcade && (
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          onClick={onOpenPuzzleArcade}
          className="w-full mt-2 py-2 px-3 rounded-2xl bg-gradient-to-r from-fuchsia-950/80 via-indigo-950/80 to-cyan-950/80 border border-fuchsia-500/50 hover:border-cyan-400 text-slate-100 flex items-center justify-between shadow-[0_0_15px_rgba(255,0,127,0.2)] transition-all cursor-pointer group"
        >
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-xl bg-fuchsia-500/20 text-fuchsia-300 flex items-center justify-center border border-fuchsia-400/30 group-hover:scale-110 transition-transform">
              <Gamepad2 className="w-4 h-4 animate-pulse" />
            </span>
            <div className="text-left">
              <div className="text-white text-xs font-black uppercase tracking-wide flex items-center gap-1.5">
                <span>Play Reflex Puzzles</span>
                <span className="text-[9px] bg-gradient-to-r from-fuchsia-500 to-pink-500 text-white font-black px-1.5 py-0.2 rounded-full shadow-sm">
                  Arcade
                </span>
              </div>
              <div className="text-[9px] text-slate-400">Pulse Matrix • Laser Slicer • Cyber Lock</div>
            </div>
          </div>
          <span className="text-[10px] font-black text-cyan-300 bg-cyan-950/80 border border-cyan-500/40 px-2.5 py-1 rounded-xl shadow-xs group-hover:bg-cyan-900 transition-colors">
            PLAY NOW ⚡
          </span>
        </motion.button>
      )}

      {/* Main Roll Action Footer Controls */}
      <div className="w-full mt-2 flex items-center gap-2">
        {/* Multiplier Toggle Button */}
        <button
          onClick={onToggleMultiplier}
          className="flex-shrink-0 px-3 py-3 rounded-2xl bg-indigo-950/80 border-2 border-indigo-500/40 text-cyan-300 font-black text-xs hover:border-cyan-400 active:scale-95 transition-all shadow-lg flex flex-col items-center justify-center min-w-[62px]"
          title="Change Dice Bet Multiplier"
        >
          <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">BET</span>
          <span className="text-sm font-black text-white">{rollMultiplier}X</span>
        </button>

        {/* Big Neon Roll Dice Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.96 }}
          onClick={handleRoll}
          disabled={isRolling || rolls < rollMultiplier}
          className={`flex-1 py-3.5 px-6 rounded-2xl font-black text-base uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(255,0,127,0.4)] transition-all ${
            rolls < rollMultiplier
              ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
              : 'bg-gradient-to-r from-fuchsia-600 via-pink-500 to-rose-500 text-white border-2 border-pink-300 hover:brightness-110 active:brightness-95'
          }`}
        >
          <Dices className={`w-5 h-5 ${isRolling ? 'animate-spin' : ''}`} />
          <span>{isRolling ? 'HOPPING...' : rolls < rollMultiplier ? 'NO ROLLS LEFT' : `ROLL DICE (-${rollMultiplier})`}</span>
        </motion.button>
      </div>
    </div>
  );
});

// Sub-component for individual board tile
interface TileCardProps {
  tile: BoardTile;
  isCurrent: boolean;
  activeMascot: Mascot;
  isRolling: boolean;
  onClick?: () => void;
}

const TileCard: React.FC<TileCardProps> = React.memo(({
  tile,
  isCurrent,
  activeMascot,
  isRolling,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={`relative aspect-square rounded-xl p-1 flex flex-col items-center justify-between cursor-pointer transition-all duration-300 border ${
        isCurrent
          ? 'bg-indigo-950/90 border-white shadow-[0_0_18px_rgba(255,255,255,0.7)] z-20 scale-105'
          : 'bg-slate-900/80 border-slate-800/90 hover:border-slate-700'
      }`}
    >
      {/* Glow highlight for active tile */}
      {isCurrent && (
        <div
          className="absolute inset-0 rounded-xl blur-sm opacity-50 pointer-events-none"
          style={{ backgroundColor: tile.neonColor }}
        />
      )}

      {/* Pawn Indicator when player is on this tile */}
      <AnimatePresence>
        {isCurrent && (
          <motion.div
            layoutId="mascot-pawn"
            initial={{ scale: 0.5, y: -10 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.5 }}
            transition={{ type: 'spring', stiffness: 450, damping: 25 }}
            className="absolute -top-6 left-1/2 -translate-x-1/2 z-30 pointer-events-none"
          >
            <div className="relative">
              <div className="w-8 h-8 rounded-full border-2 border-white shadow-[0_0_12px_rgba(255,0,127,0.8)] overflow-hidden bg-slate-950">
                <MascotAvatar mascot={activeMascot} size="sm" showHairGlow={false} interactive={false} />
              </div>
              <div className="absolute -bottom-1 -right-1 px-1 rounded-md bg-amber-400 text-slate-950 text-[7px] font-black border border-white">
                Lv.{activeMascot.level}
              </div>
            </div>
            <div className="w-2 h-2 rotate-45 bg-white mx-auto -mt-1 shadow" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tile Icon with Neon Accent */}
      <div
        className="w-6 h-6 rounded-lg flex items-center justify-center text-slate-950 font-bold mt-0.5 shadow-sm"
        style={{ backgroundColor: tile.neonColor }}
      >
        <TileIcon name={tile.iconName} className="w-3.5 h-3.5 text-slate-950" />
      </div>

      {/* Tile Short Label */}
      <div className="text-[9px] font-black uppercase text-center tracking-tight leading-tight line-clamp-1 text-slate-200">
        {tile.name.split(' ')[0]}
      </div>
    </div>
  );
});
