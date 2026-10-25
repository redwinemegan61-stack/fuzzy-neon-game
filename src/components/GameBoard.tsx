import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Dices, Sparkles, Target, Coins, Gift, Star, 
  Globe, Zap, Swords, Flame, Key, Shield, Cpu, Box, Search, Activity, ChevronRight, Gamepad2
} from 'lucide-react';
import { BoardTile, Mascot } from '../types';
import { BOARD_TILES } from '../data/gameData';
import { MascotAvatar } from './MascotAvatar';
import { SoundEngine } from '../utils/sound';
import { ThreeDiceStage } from './ThreeDiceStage';
import { MAX_MASCOT_LEVEL } from '../utils/mascotLeveling';
import { NeonTailParticles, TILE_GRID_POSITIONS } from './NeonTailParticles';

export interface AbilityMultiplierTriggerEvent {
  id: string;
  type: 'coins' | 'dice';
  multiplier: number;
  bonusAmount: number;
}

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
  diceValues?: [number, number];
  abilityMultiplierEvent?: AbilityMultiplierTriggerEvent | null;
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

// Radial particle angles for ability multiplier burst
const ABILITY_PARTICLES = Array.from({ length: 12 }, (_, idx) => {
  const angleRad = (idx * 30 * Math.PI) / 180;
  const dist = idx % 2 === 0 ? 58 : 42;
  return {
    id: idx,
    dx: Math.cos(angleRad) * dist,
    dy: Math.sin(angleRad) * dist,
    delay: (idx % 4) * 0.04,
    scale: idx % 2 === 0 ? 1.15 : 0.85,
  };
});

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
  diceValues: propDiceValues,
  abilityMultiplierEvent,
}) => {
  const [internalDiceVisuals, setInternalDiceVisuals] = useState<[number, number]>([3, 4]);
  const [is3DMode, setIs3DMode] = useState(true);
  const [abilityBurst, setAbilityBurst] = useState<{
    key: number;
    type: 'coins' | 'dice';
    color: string;
    secondaryColor: string;
    bonusText: string;
  } | null>(null);
  const wasRollingRef = useRef(isRolling);

  const diceVisuals: [number, number] = propDiceValues || internalDiceVisuals;

  const triggerAbilityBurst = (type: 'coins' | 'dice', bonusAmount?: number) => {
    const isCoin = type === 'coins';
    const color = isCoin ? '#fbbf24' : '#00f0ff';
    const secondaryColor = activeMascot.hairColors[0] || (isCoin ? '#f59e0b' : '#38bdf8');
    const mult = activeMascot.uniqueAbility.multiplier;
    const bonusLabel =
      bonusAmount && bonusAmount > 0
        ? `+${bonusAmount.toLocaleString()} ${isCoin ? '🪙' : '🎲'} (${mult}x!)`
        : `⚡ ${mult}x ${isCoin ? 'COIN' : 'DICE'} BOOST!`;

    setAbilityBurst({
      key: Date.now(),
      type,
      color,
      secondaryColor,
      bonusText: bonusLabel,
    });
  };

  // Trigger particle/glow when parent dispatches an abilityMultiplierEvent
  useEffect(() => {
    if (!abilityMultiplierEvent) return;
    triggerAbilityBurst(abilityMultiplierEvent.type, abilityMultiplierEvent.bonusAmount);
  }, [abilityMultiplierEvent?.id]);

  // Also detect landing on a coin or dice collection tile after dice roll finishes
  useEffect(() => {
    if (wasRollingRef.current && !isRolling) {
      const landedTile = BOARD_TILES[currentTileIndex];
      if (landedTile) {
        if (
          landedTile.type === 'coin_small' ||
          landedTile.type === 'coin_big' ||
          landedTile.type === 'landmark_star'
        ) {
          triggerAbilityBurst('coins');
        } else if (landedTile.type === 'mascot_energy') {
          triggerAbilityBurst('dice');
        }
      }
    }
    wasRollingRef.current = isRolling;
  }, [isRolling, currentTileIndex]);

  // Auto-clear burst after animation completes
  useEffect(() => {
    if (!abilityBurst) return;
    const timer = setTimeout(() => {
      setAbilityBurst(null);
    }, 2400);
    return () => clearTimeout(timer);
  }, [abilityBurst?.key]);

  const handleTileSelect = (tile: BoardTile) => {
    if (
      tile.type === 'coin_small' ||
      tile.type === 'coin_big' ||
      tile.type === 'landmark_star'
    ) {
      triggerAbilityBurst('coins');
    } else if (tile.type === 'mascot_energy') {
      triggerAbilityBurst('dice');
    }
    onTileClick?.(tile);
  };

  const handleRoll = () => {
    if (isRolling || rolls < rollMultiplier) return;
    SoundEngine.playDiceRoll();
    // Quick fallback random if not controlled by parent
    if (!propDiceValues) {
      const d1 = Math.floor(Math.random() * 6) + 1;
      const d2 = Math.floor(Math.random() * 6) + 1;
      setInternalDiceVisuals([d1, d2]);
    }
    onRollDice();
  };

  const topTiles = TOP_TILES;
  const rightTiles = RIGHT_TILES;
  const bottomTiles = BOTTOM_TILES;
  const leftTiles = LEFT_TILES;

  const currentTile = BOARD_TILES[currentTileIndex] || BOARD_TILES[0];

  return (
    <div className="w-full max-w-md mx-auto flex flex-col items-center">
      {/* Current Tile Info Bar with Framer Motion Entry/Exit */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentTile.id}
          initial={{ opacity: 0.6, scale: 0.95, y: -4 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0.6, scale: 0.95, y: 4 }}
          transition={{ type: 'spring', stiffness: 500, damping: 25 }}
          className="w-full px-4 mb-2 flex items-center justify-between bg-slate-900/80 border border-slate-800 rounded-xl py-2 backdrop-blur-md"
        >
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-950 font-bold shadow-md transition-transform"
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
            <span className="text-[11px] font-bold text-amber-400 bg-amber-950/60 border border-amber-500/30 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
              {currentTile.type === 'coin_big' || currentTile.type === 'coin_small'
                ? `+${currentTile.rewardValue * rollMultiplier} Coins`
                : currentTile.type === 'mascot_energy'
                ? `+${currentTile.rewardValue * rollMultiplier} Dice`
                : 'Special Event'}
            </span>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Neon Board Grid Container */}
      <div className="w-full aspect-square relative bg-[#090b1d] border-2 border-indigo-900/50 rounded-3xl p-2.5 shadow-[0_0_40px_rgba(30,15,60,0.7)] overflow-hidden flex flex-col justify-between">
        {/* Ambient Grid Lines & Corner Accents */}
        <div className="absolute inset-0 bg-[radial-gradient(#1e1b4b_1px,transparent_1px)] [background-size:16px_16px] opacity-35 pointer-events-none" />
        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-cyan-400/60 rounded-tl-2xl pointer-events-none" />
        <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-fuchsia-400/60 rounded-tr-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-emerald-400/60 rounded-bl-2xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-amber-400/60 rounded-br-2xl pointer-events-none" />

        {/* Dynamic Animated 'Neon Tail' Particle Canvas */}
        <NeonTailParticles
          currentTileIndex={currentTileIndex}
          isRolling={isRolling}
          activeMascot={activeMascot}
        />

        {/* Top Row (Tiles 0 to 4) */}
        <div className="grid grid-cols-5 gap-1.5 z-10">
          {topTiles.map((tile) => (
            <TileCard
              key={tile.id}
              tile={tile}
              isCurrent={currentTileIndex === tile.index}
              activeMascot={activeMascot}
              isRolling={isRolling}
              onClick={() => handleTileSelect(tile)}
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
                onClick={() => handleTileSelect(tile)}
              />
            ))}
          </div>

          {/* Center Stage: Active Mascot & Dice Rolling Pedestal */}
          <div
            className={`flex-1 h-full mx-1 rounded-2xl bg-gradient-to-b from-slate-900/90 to-indigo-950/80 border flex flex-col items-center justify-center p-3 relative overflow-hidden backdrop-blur-md transition-all duration-300 ${
              abilityBurst ? 'border-amber-400/80' : 'border-indigo-500/20'
            }`}
            style={
              abilityBurst
                ? ({
                    '--ability-glow-color': abilityBurst.color,
                    boxShadow: `0 0 28px ${abilityBurst.color}55, inset 0 0 24px ${abilityBurst.color}33`,
                  } as React.CSSProperties)
                : undefined
            }
          >
            {/* Soft Radial Center Light (intensifies when ability multiplier triggers) */}
            <motion.div
              animate={
                abilityBurst
                  ? { scale: [1, 1.45, 1.15], opacity: [0.3, 0.75, 0.35] }
                  : { scale: 1, opacity: 0.25 }
              }
              transition={{ type: 'tween', duration: 0.9, ease: 'easeOut' }}
              className="absolute inset-0 blur-2xl pointer-events-none"
              style={{
                background: `radial-gradient(circle, ${
                  abilityBurst ? abilityBurst.color : activeMascot.hairColors[0] || '#00f0ff'
                } 0%, transparent 70%)`,
              }}
            />

            {/* Mascot on Center Pedestal with Reactive Ability Glow & Particle Burst */}
            <div
              className={`relative mb-1 flex items-center justify-center rounded-full p-1 transition-all ${
                abilityBurst ? 'mascot-ability-aura' : ''
              }`}
              style={
                abilityBurst
                  ? ({ '--ability-glow-color': abilityBurst.color } as React.CSSProperties)
                  : undefined
              }
            >
              {/* Expanding Ability Shockwave Rings & Radial Particle Burst */}
              <AnimatePresence>
                {abilityBurst && (
                  <motion.div
                    key={abilityBurst.key}
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 flex items-center justify-center pointer-events-none z-30"
                  >
                    {/* Dual Expanding Glow Rings */}
                    <motion.div
                      initial={{ scale: 0.5, opacity: 0.95 }}
                      animate={{ scale: 2.35, opacity: 0 }}
                      transition={{ type: 'tween', duration: 0.85, ease: 'easeOut' }}
                      className="absolute w-16 h-16 rounded-full border-2"
                      style={{
                        borderColor: abilityBurst.color,
                        boxShadow: `0 0 18px ${abilityBurst.color}`,
                      }}
                    />
                    <motion.div
                      initial={{ scale: 0.6, opacity: 0.85 }}
                      animate={{ scale: 1.9, opacity: 0 }}
                      transition={{ type: 'tween', duration: 0.95, delay: 0.12, ease: 'easeOut' }}
                      className="absolute w-16 h-16 rounded-full border"
                      style={{
                        borderColor: abilityBurst.secondaryColor,
                        boxShadow: `0 0 14px ${abilityBurst.secondaryColor}`,
                      }}
                    />

                    {/* 12 Radial Burst Particles (Coins / Dice / Sparkles / Lightning) */}
                    {ABILITY_PARTICLES.map((p) => (
                      <motion.div
                        key={p.id}
                        initial={{ x: 0, y: 0, scale: 0.2, opacity: 1, rotate: 0 }}
                        animate={{
                          x: p.dx,
                          y: p.dy,
                          scale: [0.3, p.scale, 0],
                          opacity: [1, 1, 0],
                          rotate: p.id % 2 === 0 ? 180 : -180,
                        }}
                        transition={{
                          type: 'tween',
                          duration: 0.95,
                          delay: p.delay,
                          ease: 'easeOut',
                        }}
                        className="absolute text-xs select-none drop-shadow-[0_0_8px_rgba(255,255,255,0.9)]"
                      >
                        {p.id % 3 === 0
                          ? abilityBurst.type === 'coins'
                            ? '🪙'
                            : '🎲'
                          : p.id % 3 === 1
                          ? '✨'
                          : '⚡'}
                      </motion.div>
                    ))}

                    {/* Floating Multiplier Bonus Callout */}
                    <motion.div
                      initial={{ y: 6, opacity: 0, scale: 0.75 }}
                      animate={{ y: -36, opacity: [0, 1, 1, 0], scale: [0.8, 1.12, 1] }}
                      transition={{ type: 'tween', duration: 1.6, ease: 'easeOut' }}
                      className="absolute -top-3 whitespace-nowrap px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider text-slate-950 shadow-[0_0_16px_rgba(251,191,36,0.95)] border border-white z-40"
                      style={{
                        background:
                          abilityBurst.type === 'coins'
                            ? 'linear-gradient(90deg, #fde047, #f59e0b)'
                            : 'linear-gradient(90deg, #67e8f9, #38bdf8)',
                      }}
                    >
                      {abilityBurst.bonusText}
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              {activeMascot.level >= MAX_MASCOT_LEVEL && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-sm drop-shadow-[0_0_8px_rgba(251,191,36,0.9)] animate-bounce z-20 pointer-events-none">
                  👑
                </span>
              )}
              <MascotAvatar
                mascot={activeMascot}
                size="md"
                isDancing={isRolling || Boolean(abilityBurst)}
                showHairGlow={Boolean(abilityBurst) || activeMascot.level >= MAX_MASCOT_LEVEL}
                interactive={true}
              />
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-16 h-3 bg-black/60 rounded-full blur-sm -z-10" />
            </div>

            {/* Active Mascot Name & Upgraded Level */}
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-xs font-black text-white">{activeMascot.name}</span>
              {activeMascot.level >= MAX_MASCOT_LEVEL ? (
                <span className="text-[9px] bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-slate-950 font-black px-2 py-0.2 rounded-full shadow-[0_0_10px_rgba(251,191,36,0.8)] border border-white/60 animate-pulse flex items-center gap-0.5">
                  <span>👑</span>
                  <span>MAX</span>
                </span>
              ) : (
                <span className="text-[9px] bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black px-1.5 py-0.2 rounded-full shadow-sm">
                  Lv.{activeMascot.level}
                </span>
              )}
            </div>

            {/* Active Ability Pill with Upgraded Multiplier & Reactive Glow */}
            <div className="text-center mb-2">
              <motion.button
                type="button"
                onClick={() =>
                  triggerAbilityBurst(
                    activeMascot.uniqueAbility.effectType === 'lucky_dice' ? 'dice' : 'coins'
                  )
                }
                animate={
                  abilityBurst
                    ? {
                        scale: [1, 1.18, 1.05, 1],
                      }
                    : { scale: 1 }
                }
                transition={{ type: 'tween', duration: 0.65, ease: 'easeOut' }}
                title="Tap to preview ability multiplier surge!"
                className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 cursor-pointer transition-all ${
                  abilityBurst
                    ? 'bg-gradient-to-r from-amber-400 via-yellow-300 to-cyan-300 text-slate-950 border-2 border-white shadow-[0_0_18px_rgba(251,191,36,0.9)] font-black'
                    : 'text-cyan-300 bg-cyan-950/80 border border-cyan-500/30 hover:border-cyan-400/60'
                }`}
              >
                <span>⚡ {activeMascot.uniqueAbility.name}</span>
                <span className={abilityBurst ? 'text-slate-950 font-black' : 'text-amber-300 font-black'}>
                  ({activeMascot.uniqueAbility.multiplier}x)
                </span>
              </motion.button>
            </div>

            {/* Interactive 3D WebGL Dice Stage vs 2D Fallback */}
            {is3DMode ? (
              <div className="w-full my-1 relative">
                <ThreeDiceStage
                  diceValues={diceVisuals}
                  isRolling={isRolling}
                  activeMascot={activeMascot}
                  rollMultiplier={rollMultiplier}
                />
                <button
                  onClick={() => setIs3DMode(false)}
                  className="absolute top-1 left-2 text-[7.5px] font-bold text-slate-400/90 bg-slate-900/80 hover:text-white px-1.5 py-0.5 rounded border border-slate-700 uppercase transition-all"
                  title="Switch to 2D Dice view"
                >
                  2D Mode
                </button>
              </div>
            ) : (
              <div className="w-full flex flex-col items-center my-1.5">
                <div className="flex items-center gap-2 mb-1">
                  <motion.div
                    animate={isRolling ? { rotate: [0, 180, 360], scale: [1, 1.2, 1] } : {}}
                    transition={{ type: 'tween', ease: 'easeInOut', duration: 0.4, repeat: isRolling ? Infinity : 0 }}
                    className="w-8 h-8 rounded-lg bg-gradient-to-br from-white to-slate-200 border-2 border-white/80 shadow-[0_0_12px_rgba(255,255,255,0.4)] flex items-center justify-center font-black text-slate-900 text-sm"
                  >
                    {diceVisuals[0]}
                  </motion.div>
                  <motion.div
                    animate={isRolling ? { rotate: [360, 180, 0], scale: [1, 1.2, 1] } : {}}
                    transition={{ type: 'tween', ease: 'easeInOut', duration: 0.4, repeat: isRolling ? Infinity : 0 }}
                    className="w-8 h-8 rounded-lg bg-gradient-to-br from-white to-slate-200 border-2 border-white/80 shadow-[0_0_12px_rgba(255,255,255,0.4)] flex items-center justify-center font-black text-slate-900 text-sm"
                  >
                    {diceVisuals[1]}
                  </motion.div>
                </div>
                <button
                  onClick={() => setIs3DMode(true)}
                  className="text-[7.5px] font-black text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded-full border border-cyan-500/40 uppercase shadow-xs hover:bg-cyan-900 transition-all"
                >
                  Switch to 3D Graphics 🎮
                </button>
              </div>
            )}

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
                onClick={() => handleTileSelect(tile)}
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
              onClick={() => handleTileSelect(tile)}
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
  const tileInfo = TILE_GRID_POSITIONS[tile.index] || { dir: 'right' };
  const primaryNeon = activeMascot.hairColors?.[0] || activeMascot.furColor || '#00f0ff';
  const secondaryNeon = activeMascot.hairColors?.[1] || '#ff007f';

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

      {/* Pawn Indicator & Floating Reward Popup when player is on this tile */}
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
            <div className="relative flex items-center justify-center">
              {/* Animated Neon Tail plume trailing opposite to movement vector */}
              <div
                className={`absolute pointer-events-none transition-all duration-200 z-0 ${
                  tileInfo.dir === 'right'
                    ? 'right-[80%] top-1/2 -translate-y-1/2 flex flex-row-reverse items-center'
                    : tileInfo.dir === 'down'
                    ? 'bottom-[80%] left-1/2 -translate-x-1/2 flex flex-col-reverse items-center'
                    : tileInfo.dir === 'left'
                    ? 'left-[80%] top-1/2 -translate-y-1/2 flex flex-row items-center'
                    : 'top-[80%] left-1/2 -translate-x-1/2 flex flex-col items-center'
                }`}
              >
                {/* Primary Neon Comet Flare */}
                <div
                  className={`rounded-full transition-all duration-150 ${
                    isRolling ? 'w-8 h-3.5 opacity-95 scale-125' : 'w-5 h-2.5 opacity-80'
                  }`}
                  style={{
                    background: `linear-gradient(${
                      tileInfo.dir === 'right'
                        ? 'to left'
                        : tileInfo.dir === 'down'
                        ? 'to top'
                        : tileInfo.dir === 'left'
                        ? 'to right'
                        : 'to bottom'
                    }, ${primaryNeon}, ${secondaryNeon} 55%, transparent)`,
                    filter: `drop-shadow(0 0 10px ${primaryNeon})`,
                  }}
                />
                {/* Trailing Neon Spark Embers */}
                <div
                  className={`rounded-full animate-ping ${
                    isRolling ? 'w-2.5 h-2.5 opacity-90' : 'w-1.5 h-1.5 opacity-60'
                  }`}
                  style={{
                    backgroundColor: secondaryNeon,
                    boxShadow: `0 0 8px ${secondaryNeon}`,
                  }}
                />
              </div>

              {/* Luminous Mascot Ambient Glow */}
              <div
                className="absolute -inset-1 rounded-full blur-xs opacity-70 animate-pulse pointer-events-none -z-10"
                style={{
                  background: `radial-gradient(circle, ${primaryNeon} 0%, transparent 75%)`,
                }}
              />

              <div className="w-8 h-8 rounded-full border-2 border-white shadow-[0_0_12px_rgba(255,0,127,0.8)] overflow-hidden bg-slate-950 relative z-10">
                <MascotAvatar mascot={activeMascot} size="sm" showHairGlow={false} interactive={false} />
              </div>
              <div className="absolute -bottom-1 -right-1 px-1 rounded-md bg-amber-400 text-slate-950 text-[7px] font-black border border-white z-20">
                Lv.{activeMascot.level}
              </div>
            </div>
            <div className="w-2 h-2 rotate-45 bg-white mx-auto -mt-1 shadow" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Tile Event Value Badge with punchy Framer Motion entry/exit */}
      <AnimatePresence>
        {isCurrent && !isRolling && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.5 }}
            animate={{ opacity: 1, y: -26, scale: 1 }}
            exit={{ opacity: 0, y: -38, scale: 0.6 }}
            transition={{ type: 'spring', stiffness: 500, damping: 20 }}
            className="absolute -top-3 left-1/2 -translate-x-1/2 z-40 pointer-events-none whitespace-nowrap"
          >
            <div
              className="px-1.5 py-0.5 rounded-full text-[8px] font-black shadow-[0_0_10px_rgba(0,0,0,0.9)] border flex items-center gap-0.5 backdrop-blur-md"
              style={{
                backgroundColor: '#090b22',
                borderColor: tile.neonColor,
                color: tile.neonColor,
              }}
            >
              <span>
                {tile.type === 'coin_big' || tile.type === 'coin_small'
                  ? `🪙 +${tile.rewardValue}`
                  : tile.type === 'mascot_energy'
                  ? `🎲 +${tile.rewardValue}`
                  : tile.type === 'shield_vault'
                  ? `🛡️ +1`
                  : `⭐ +${tile.rewardValue}`}
              </span>
            </div>
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
