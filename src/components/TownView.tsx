import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Town, Landmark, Mascot } from '../types';
import {
  Building2, Home, Utensils, Droplets, Music, Gamepad2, Zap,
  Sparkles, Radio, Sun, Compass, Eye, Crown, Check, ArrowRight,
  Star, Hammer, MapPin, ChevronRight, Volume2, Info, EyeOff
} from 'lucide-react';
import { SoundEngine } from '../utils/sound';
import { MascotAvatar } from './MascotAvatar';
import { StandaloneThreeTown } from './StandaloneThreeTown';
import confetti from 'canvas-confetti';

interface TownViewProps {
  town: Town;
  coins: number;
  playerLevel: number;
  activeMascot: Mascot;
  allMascots?: Mascot[];
  onUpgradeLandmark: (landmarkId: string, cost: number) => void;
  onAdvanceNextTown?: () => void;
  onOpenAdCinema?: () => void;
  onOpen3DTownMap?: () => void;
}

// Stage labels for construction
const STAGE_NAMES = [
  'Empty Plot',
  'Wooden Scaffolding',
  'Stone Masonry',
  'Roof & Framing',
  'Grand Structure',
  'Masterwork Landmark ✨',
];

// Architectural visual representations per theme & level
const LANDMARK_VISUALS: Record<string, { icon: string; emoji: string; color: string; desc: string }> = {
  Home: { icon: 'Home', emoji: '🏡', color: '#38bdf8', desc: 'Mascot Guildhouse & Bakery' },
  Utensils: { icon: 'Utensils', emoji: '🥐', color: '#f59e0b', desc: 'Windmill & Star-Boba Mill' },
  Droplets: { icon: 'Droplets', emoji: '⛲', color: '#06b6d4', desc: 'Liquid Prism Fountain' },
  Music: { icon: 'Music', emoji: '📻', color: '#ec4899', desc: 'DJ Squeak & Rhythm Stage' },
  Gamepad2: { icon: 'Gamepad2', emoji: '🕹️', color: '#a855f7', desc: 'Arcade Tower & Holo Claw' },
  Zap: { icon: 'Zap', emoji: '⚡', color: '#eab308', desc: 'Quantum Coaster Beacon' },
  Sparkles: { icon: 'Sparkles', emoji: '🏰', color: '#f43f5e', desc: 'Town Hall & Clocktower' },
  Radio: { icon: 'Radio', emoji: '📡', color: '#10b981', desc: 'Drive-In Ad Cinema' },
};

export const TownView: React.FC<TownViewProps> = React.memo(({
  town,
  coins,
  playerLevel,
  activeMascot,
  allMascots = [],
  onUpgradeLandmark,
  onAdvanceNextTown,
  onOpenAdCinema,
  onOpen3DTownMap,
}) => {
  // Selected landmark for inspector drawer
  const [selectedLandmarkId, setSelectedLandmarkId] = useState<string>(town.landmarks[0]?.id || '');
  const [viewMode, setViewMode] = useState<'3d' | 'map' | 'list'>('3d');
  const [buildingEffectId, setBuildingEffectId] = useState<string | null>(null);

  // Mascots wandering positions across town paths
  const [mascotPositions, setMascotPositions] = useState([
    { id: 'pip', x: 22, y: 35, quote: '*boing boing!* 🐾', facing: 'right' },
    { id: 'boba', x: 68, y: 45, quote: '*squeee!* ✨', facing: 'left' },
    { id: 'ziggy', x: 42, y: 70, quote: '*purrrr!* 💖', facing: 'right' },
    { id: 'kora', x: 75, y: 25, quote: '*chirp-chirp!* 🌊', facing: 'left' },
    { id: 'lulu', x: 18, y: 65, quote: '*pip-squeak!* 🌸', facing: 'right' },
  ]);

  // Wandering timer for mascots
  useEffect(() => {
    const wanderTimer = setInterval(() => {
      setMascotPositions((prev) =>
        prev.map((m) => {
          const deltaX = (Math.random() - 0.5) * 14;
          const deltaY = (Math.random() - 0.5) * 10;
          const newX = Math.max(15, Math.min(82, m.x + deltaX));
          const newY = Math.max(25, Math.min(80, m.y + deltaY));
          return {
            ...m,
            x: newX,
            y: newY,
            facing: deltaX > 0 ? 'right' : 'left',
          };
        })
      );
    }, 4500);

    return () => clearInterval(wanderTimer);
  }, []);

  // Total completion calculation
  const totalLevels = town.landmarks.reduce((acc, lm) => acc + lm.currentLevel, 0);
  const maxLevels = town.landmarks.reduce((acc, lm) => acc + lm.maxLevel, 0);
  const isTownComplete = totalLevels >= maxLevels;

  const selectedLandmark = town.landmarks.find((l) => l.id === selectedLandmarkId) || town.landmarks[0];

  const handleUpgrade = (lm: Landmark) => {
    if (lm.currentLevel >= lm.maxLevel) return;
    const cost = lm.costPerLevel[lm.currentLevel] || 999999;
    if (coins < cost) {
      SoundEngine.playErrorBuzz();
      return;
    }

    // Trigger visual build effect
    setBuildingEffectId(lm.id);
    setTimeout(() => setBuildingEffectId(null), 1200);

    SoundEngine.playUpgradeFanfare();
    confetti({ particleCount: 45, spread: 60, origin: { y: 0.6 } });
    onUpgradeLandmark(lm.id, cost);
  };

  const handleMascotTap = (name: string) => {
    SoundEngine.playMascotSqueak('squeak');
  };

  return (
    <div className="w-full max-w-md mx-auto flex flex-col items-center gap-3 py-1">
      {/* 1. Town Progress & World Status Header */}
      <div className="w-full rounded-3xl bg-slate-900/90 border border-slate-800 p-3.5 shadow-xl relative overflow-hidden backdrop-blur-md">
        <div
          className="absolute -top-12 -right-12 w-44 h-44 rounded-full blur-3xl opacity-25 pointer-events-none"
          style={{ backgroundColor: town.themeColor }}
        />

        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="relative flex-shrink-0">
              <MascotAvatar
                mascot={activeMascot}
                size="sm"
                showHairGlow={true}
                interactive={false}
                enableMicroAnimations={true}
              />
              <div className="absolute -bottom-1 -right-1 px-1 rounded-md bg-amber-400 text-slate-950 text-[7px] font-black border border-slate-900">
                Lv.{activeMascot.level}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-cyan-400">
                  World {town.worldNumber} • Level {town.worldNumber} Town
                </span>
                <span className="text-[9px] bg-fuchsia-950 text-fuchsia-300 font-bold px-2 py-0.2 rounded-full border border-fuchsia-500/30">
                  Town Rank {playerLevel}
                </span>
              </div>
              <h2 className="text-lg font-black text-white flex items-center gap-1.5">
                <span>🏰</span>
                <span>{town.name}</span>
              </h2>
              <p className="text-[11px] text-slate-300">
                Builder companion: <span className="text-amber-300 font-bold">{activeMascot.name}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-col items-end">
            <div className="flex items-center gap-1 bg-slate-950/80 px-2 py-1 rounded-xl border border-slate-800">
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span className="text-xs font-black text-white">
                {totalLevels} / {maxLevels}
              </span>
            </div>

            {/* Toggle 3D Town / 2D Map / List View */}
            <div className="flex items-center gap-1 mt-1.5 bg-slate-950/80 p-0.5 rounded-xl border border-slate-800">
              <button
                onClick={() => {
                  setViewMode('3d');
                  SoundEngine.playTileStep();
                }}
                className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase transition-all cursor-pointer ${
                  viewMode === '3d'
                    ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                3D Town
              </button>
              <button
                onClick={() => {
                  setViewMode('map');
                  SoundEngine.playTileStep();
                }}
                className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase transition-all cursor-pointer ${
                  viewMode === 'map' ? 'bg-cyan-500 text-slate-950 shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                2D Map
              </button>
              <button
                onClick={() => {
                  setViewMode('list');
                  SoundEngine.playTileStep();
                }}
                className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase transition-all cursor-pointer ${
                  viewMode === 'list' ? 'bg-cyan-500 text-slate-950 shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                Cards
              </button>
            </div>
          </div>
        </div>

        {/* Town Completion Bar */}
        <div className="w-full bg-slate-800/80 rounded-full h-2 overflow-hidden border border-slate-700/50">
          <motion.div
            className="h-full bg-gradient-to-r from-cyan-400 via-pink-500 to-amber-400"
            initial={{ width: 0 }}
            animate={{ width: `${(totalLevels / maxLevels) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>

        {/* Standalone 3D Borough Shortcut Banner */}
        {onOpen3DTownMap && (
          <button
            onClick={() => {
              SoundEngine.playTileStep();
              onOpen3DTownMap();
            }}
            className="w-full mt-2 py-2 px-3 rounded-xl bg-gradient-to-r from-amber-950/80 via-slate-900 to-indigo-950/80 hover:border-amber-400 border border-amber-500/40 text-amber-300 hover:text-white flex items-center justify-between transition-all cursor-pointer shadow-md"
          >
            <div className="flex items-center gap-2">
              <span className="text-base animate-bounce">🏡</span>
              <span className="text-[11px] font-black uppercase tracking-wider">
                Tour Companion in Standalone 3D Borough
              </span>
            </div>
            <span className="text-[9px] font-black bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-400/40 uppercase">
              3D Borough ➔
            </span>
          </button>
        )}

        {/* Town Completion & Travel Button */}
        {isTownComplete && (
          <div className="mt-3 p-3 rounded-2xl bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-900 border border-emerald-400 shadow-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-400 animate-spin" />
              <div>
                <div className="text-xs font-black text-emerald-300 uppercase tracking-wider">
                  Town Mastered!
                </div>
                <div className="text-[10px] text-slate-300">
                  Ready to travel to the next world!
                </div>
              </div>
            </div>
            {onAdvanceNextTown && (
              <button
                onClick={onAdvanceNextTown}
                className="px-3 py-1.5 rounded-xl bg-emerald-400 text-slate-950 font-black text-xs uppercase flex items-center gap-1 shadow-md hover:brightness-110 active:scale-95 transition-all animate-pulse"
              >
                <span>Travel World ➔</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* 2. LIVING INTERACTIVE TOWN SCENE */}
      {viewMode === '3d' ? (
        <StandaloneThreeTown
          town={town}
          coins={coins}
          playerLevel={playerLevel}
          activeMascot={activeMascot}
          allMascots={allMascots}
          onUpgradeLandmark={onUpgradeLandmark}
        />
      ) : viewMode === 'map' ? (
        <div className="w-full relative aspect-[4/3] rounded-3xl bg-gradient-to-b from-[#09152b] via-[#0d2238] to-[#0b2824] border-2 border-indigo-900/60 p-3 shadow-2xl overflow-hidden select-none">
          {/* Natural/Neon landscape background detailing */}
          <div className="absolute inset-0 opacity-40 pointer-events-none">
            {/* Cyber Grass Grid Patches */}
            <div className="absolute top-1/4 left-1/3 w-32 h-20 rounded-full bg-emerald-500/20 blur-xl" />
            <div className="absolute bottom-1/4 right-1/4 w-36 h-24 rounded-full bg-cyan-500/20 blur-xl" />
            {/* Winding Cobblestone Pathway */}
            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <path
                d="M 15 25 Q 35 30 50 50 T 85 75 M 50 50 Q 70 30 80 20 M 50 50 Q 25 70 20 80"
                fill="none"
                stroke="#334155"
                strokeWidth="7"
                strokeDasharray="2,3"
                opacity="0.7"
              />
              <path
                d="M 15 25 Q 35 30 50 50 T 85 75 M 50 50 Q 70 30 80 20 M 50 50 Q 25 70 20 80"
                fill="none"
                stroke="#38bdf8"
                strokeWidth="1.5"
                opacity="0.5"
              />
            </svg>
          </div>

          {/* Realistic Multi-Layered Town Trees & Glowing Lanterns */}
          {/* Top-Left Ancient Oak Tree */}
          <div className="absolute top-2 left-3 z-10 pointer-events-none drop-shadow-[0_4px_8px_rgba(0,0,0,0.6)]">
            <svg width="36" height="40" viewBox="0 0 36 40">
              <ellipse cx="18" cy="36" rx="10" ry="3" fill="rgba(0,0,0,0.45)" />
              <path d="M15 36 L16 22 L11 16 M21 36 L20 22 L25 17" stroke="#5c3a21" strokeWidth="3" strokeLinecap="round" fill="none" />
              <rect x="16" y="21" width="4" height="15" rx="1.5" fill="#7c4d2b" />
              <circle cx="11" cy="17" r="7" fill="#15803d" />
              <circle cx="25" cy="17" r="7" fill="#166534" />
              <circle cx="18" cy="11" r="8.5" fill="#22c55e" />
              <circle cx="15" cy="14" r="6" fill="#4ade80" opacity="0.85" />
            </svg>
          </div>

          {/* Top-Right Alpine Pine & Sakura Grove */}
          <div className="absolute top-2 right-3 z-10 pointer-events-none drop-shadow-[0_4px_8px_rgba(0,0,0,0.6)]">
            <svg width="40" height="42" viewBox="0 0 40 42">
              <ellipse cx="20" cy="38" rx="12" ry="3" fill="rgba(0,0,0,0.45)" />
              <rect x="12" y="26" width="3.5" height="12" rx="1" fill="#5c3a21" />
              <polygon points="13.7,8 5,22 22.5,22" fill="#065f46" />
              <polygon points="13.7,14 4,28 23.5,28" fill="#047857" />
              <polygon points="13.7,5 7,16 20.5,16" fill="#10b981" />
              <rect x="26" y="25" width="3.5" height="13" rx="1" fill="#6b4226" />
              <circle cx="27.5" cy="18" r="7.5" fill="#ec4899" />
              <circle cx="24" cy="15" r="5.5" fill="#f472b6" />
              <circle cx="31" cy="15" r="5" fill="#fbcfe8" />
            </svg>
          </div>

          {/* Bottom-Left Cherry Blossom Tree */}
          <div className="absolute bottom-2 left-3 z-10 pointer-events-none drop-shadow-[0_4px_8px_rgba(0,0,0,0.6)]">
            <svg width="34" height="36" viewBox="0 0 34 36">
              <ellipse cx="17" cy="33" rx="9" ry="2.5" fill="rgba(0,0,0,0.4)" />
              <path d="M15 33 Q17 24 12 18 M19 33 Q17 24 23 18" stroke="#5c3a21" strokeWidth="2.8" strokeLinecap="round" fill="none" />
              <circle cx="11" cy="16" r="6.5" fill="#db2777" />
              <circle cx="23" cy="16" r="6.5" fill="#ec4899" />
              <circle cx="17" cy="11" r="7.5" fill="#f472b6" />
              <circle cx="16" cy="9" r="4.5" fill="#fbcfe8" />
            </svg>
          </div>

          {/* Interactive Fun Playground Park (Bottom Center) */}
          <motion.div
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              SoundEngine.playMascotSqueak('giggle');
              confetti({ particleCount: 25, spread: 50, origin: { y: 0.65 } });
            }}
            className="absolute bottom-2.5 left-1/2 -translate-x-1/2 z-20 cursor-pointer group flex flex-col items-center"
            title="Town Fun Playground! Tap to spin the carousel & play!"
          >
            <div className="px-2.5 py-1 rounded-2xl bg-gradient-to-r from-amber-500/30 via-pink-500/30 to-cyan-500/30 border border-amber-300/60 backdrop-blur-md shadow-[0_0_15px_rgba(251,191,36,0.35)] flex items-center gap-1.5">
              <span className="text-sm animate-spin" style={{ animationDuration: '5s' }}>🎠</span>
              <span className="text-xs animate-bounce">🛝</span>
              <span className="text-[9px] font-black text-amber-200 uppercase tracking-wider">
                Playground
              </span>
            </div>
          </motion.div>

          <div className="absolute top-1/2 left-4 text-xs filter drop-shadow">🏮</div>
          <div className="absolute top-1/2 right-4 text-xs filter drop-shadow">🏮</div>

          {/* 5 BUILDING PLOTS ON TOWN MAP */}
          {town.landmarks.map((lm, idx) => {
            // Coordinate plots distributed gracefully on map
            const positions = [
              { top: '15%', left: '14%' }, // Plot 1 (Top Left)
              { top: '12%', left: '68%' }, // Plot 2 (Top Right)
              { top: '42%', left: '42%' }, // Plot 3 (Center Plaza)
              { top: '68%', left: '14%' }, // Plot 4 (Bottom Left)
              { top: '65%', left: '68%' }, // Plot 5 (Bottom Right)
            ];
            const pos = positions[idx] || positions[0];
            const isSelected = selectedLandmark?.id === lm.id;
            const isBuilding = buildingEffectId === lm.id;
            const visual = LANDMARK_VISUALS[lm.icon] || { emoji: '🏛️', color: '#00f0ff' };
            const isMax = lm.currentLevel >= lm.maxLevel;

            return (
              <motion.div
                key={lm.id}
                style={{ top: pos.top, left: pos.left }}
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.94 }}
                onClick={() => {
                  setSelectedLandmarkId(lm.id);
                  SoundEngine.playBoardHop();
                }}
                className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-10 flex flex-col items-center group`}
              >
                {/* Building Construct Avatar */}
                <div
                  className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex flex-col items-center justify-center relative transition-all shadow-xl ${
                    isSelected
                      ? 'ring-3 ring-amber-400 scale-105 shadow-[0_0_20px_rgba(251,191,36,0.8)]'
                      : 'hover:border-white/60'
                  } ${
                    lm.currentLevel === 0
                      ? 'bg-slate-900/80 border-2 border-dashed border-slate-600'
                      : isMax
                      ? 'bg-gradient-to-br from-emerald-600 via-teal-700 to-slate-900 border-2 border-emerald-400'
                      : 'bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border-2 border-indigo-500/60'
                  }`}
                >
                  {/* Hammer build burst effect */}
                  {isBuilding && (
                    <motion.div
                      initial={{ scale: 0, rotate: -30 }}
                      animate={{ scale: 1.4, rotate: 15 }}
                      exit={{ scale: 0 }}
                      className="absolute -top-3 -right-3 text-2xl z-30 filter drop-shadow animate-bounce"
                    >
                      🔨
                    </motion.div>
                  )}

                  {/* Visual Stage Display */}
                  {lm.currentLevel === 0 ? (
                    <div className="flex flex-col items-center">
                      <span className="text-lg opacity-60">📋</span>
                      <span className="text-[7px] text-amber-300 font-bold uppercase">Plot</span>
                    </div>
                  ) : lm.currentLevel <= 2 ? (
                    <div className="flex flex-col items-center">
                      <span className="text-xl">🪵</span>
                      <span className="text-[7px] text-cyan-300 font-bold uppercase">Lv.{lm.currentLevel}</span>
                    </div>
                  ) : lm.currentLevel < lm.maxLevel ? (
                    <div className="flex flex-col items-center">
                      <span className="text-2xl">{visual.emoji}</span>
                      <span className="text-[7px] text-cyan-300 font-bold uppercase">Lv.{lm.currentLevel}</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <span className="text-2xl animate-pulse">{visual.emoji}</span>
                      <span className="text-[7px] text-emerald-300 font-black uppercase">MAX ★</span>
                    </div>
                  )}

                  {/* Star Badge on Landmark */}
                  <div className="absolute -bottom-1 -right-1 px-1 rounded-full bg-slate-950 border border-slate-700 flex items-center gap-0.5 text-[8px] font-black text-amber-400">
                    <Star className="w-2 h-2 fill-amber-400 text-amber-400" />
                    <span>{lm.currentLevel}</span>
                  </div>
                </div>

                {/* Building Name Pill below */}
                <div
                  className={`mt-1 px-1.5 py-0.5 rounded-md text-[8px] sm:text-[9px] font-black whitespace-nowrap shadow-md transition-all ${
                    isSelected
                      ? 'bg-amber-400 text-slate-950 font-black'
                      : 'bg-slate-950/90 text-slate-200 border border-slate-800'
                  }`}
                >
                  {lm.name}
                </div>
              </motion.div>
            );
          })}

          {/* WANDERING ANIMATED MASCOTS ON THE TOWN PATHS (Restored original character artwork) */}
          {mascotPositions.map((m) => {
            const mascotObj = allMascots.find((mascot) => mascot.id === m.id) || activeMascot;
            return (
              <motion.div
                key={m.id}
                animate={{ left: `${m.x}%`, top: `${m.y}%` }}
                transition={{ duration: 4, ease: 'easeInOut' }}
                onClick={() => handleMascotTap(mascotObj.name)}
                className="absolute z-20 cursor-pointer -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group"
              >
                {/* Mascot Bubble Thought (squeaks only!) */}
                <div className="px-1.5 py-0.5 rounded-full bg-slate-900/90 text-amber-300 text-[8px] font-black shadow-lg opacity-90 group-hover:opacity-100 mb-0.5 border border-amber-400/50 backdrop-blur-sm whitespace-nowrap animate-bounce flex items-center gap-1">
                  <span>{mascotObj.cheerQuote || m.quote}</span>
                </div>

                {/* Original Animated Mascot Artwork */}
                <motion.div
                  animate={{ y: [0, -3.5, 0] }}
                  transition={{ type: 'tween', repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
                  className={`w-10 h-10 drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)] ${m.facing === 'left' ? 'scale-x-[-1]' : ''}`}
                >
                  <MascotAvatar
                    mascot={mascotObj}
                    size="sm"
                    interactive={false}
                    showHairGlow={true}
                    enableMicroAnimations={true}
                  />
                </motion.div>

                {/* Character Name Tag */}
                <span className="text-[8px] font-black text-amber-300 bg-slate-950/90 px-1.5 py-0.2 rounded-full border border-amber-500/40 -mt-1 shadow-md">
                  {mascotObj.name}
                </span>
              </motion.div>
            );
          })}

          {/* Bottom Town Diorama Tip */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-slate-950/80 border border-slate-800 text-[8px] text-cyan-300 font-bold backdrop-blur-md">
            Tap any building to build or upgrade stages!
          </div>
        </div>
      ) : (
        /* Alternative List View */
        <div className="w-full space-y-2.5">
          {town.landmarks.map((lm) => {
            const isMax = lm.currentLevel >= lm.maxLevel;
            const cost = lm.costPerLevel[lm.currentLevel] || 0;
            const canAfford = coins >= cost && !isMax;

            return (
              <div
                key={lm.id}
                className={`rounded-2xl p-3 border transition-all ${
                  isMax
                    ? 'bg-slate-900/60 border-emerald-500/40'
                    : 'bg-slate-900/90 border-slate-800/90 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-xl shadow-md ${
                        isMax ? 'bg-gradient-to-br from-emerald-500 to-teal-700 text-white' : 'bg-slate-800 text-slate-200'
                      }`}
                    >
                      {LANDMARK_VISUALS[lm.icon]?.emoji || '🏛️'}
                    </div>

                    <div>
                      <h4 className="text-xs font-black text-white flex items-center gap-1.5">
                        <span>{lm.name}</span>
                        <span className="text-[10px] text-slate-400 font-bold">
                          (Stage {lm.currentLevel}/{lm.maxLevel})
                        </span>
                      </h4>
                      <p className="text-[10px] text-slate-400 line-clamp-1">
                        {STAGE_NAMES[lm.currentLevel]}
                      </p>

                      <div className="flex items-center gap-1 mt-1">
                        {Array.from({ length: lm.maxLevel }).map((_, i) => (
                          <div
                            key={i}
                            className={`w-3.5 h-1.5 rounded-full transition-all ${
                              i < lm.currentLevel ? 'bg-amber-400 shadow-[0_0_6px_#fbbf24]' : 'bg-slate-800'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    {isMax ? (
                      <span className="px-3 py-1.5 rounded-xl bg-emerald-950/70 border border-emerald-500/30 text-emerald-400 text-xs font-black uppercase">
                        MAX
                      </span>
                    ) : (
                      <button
                        onClick={() => handleUpgrade(lm)}
                        disabled={!canAfford}
                        className={`px-3 py-2 rounded-xl text-xs font-black uppercase flex flex-col items-center min-w-[85px] transition-all shadow-md ${
                          canAfford
                            ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 hover:brightness-110 active:scale-95'
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                        }`}
                      >
                        <span className="text-[8px] opacity-80">BUILD</span>
                        <span className="text-xs font-black">{cost.toLocaleString()} 🪙</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 3. SELECTED LANDMARK INSPECTOR & UPGRADE CARD */}
      {selectedLandmark && (
        <div className="w-full rounded-2xl bg-slate-900/95 border-2 border-indigo-500/50 p-3.5 shadow-xl flex flex-col gap-2 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-indigo-950 border border-indigo-400/50 flex items-center justify-center text-2xl shadow-inner">
                {LANDMARK_VISUALS[selectedLandmark.icon]?.emoji || '🏛️'}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-black text-white">{selectedLandmark.name}</h3>
                  <span className="text-[9px] bg-indigo-950 text-indigo-300 font-bold px-1.5 py-0.2 rounded-full border border-indigo-500/30">
                    Stage {selectedLandmark.currentLevel} / {selectedLandmark.maxLevel}
                  </span>
                </div>
                <div className="text-[11px] text-cyan-300 font-bold">
                  {STAGE_NAMES[selectedLandmark.currentLevel]}
                </div>
              </div>
            </div>

            {/* Stars Awarded */}
            <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded-xl border border-slate-800">
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span className="text-xs font-black text-white">
                +{selectedLandmark.rewardStars} Stars
              </span>
            </div>
          </div>

          <p className="text-[11px] text-slate-300">
            {selectedLandmark.description}
          </p>

          {/* Construction Stage Indicators */}
          <div className="flex items-center justify-between gap-1 py-1">
            {Array.from({ length: selectedLandmark.maxLevel }).map((_, i) => (
              <div
                key={i}
                className={`flex-1 h-2 rounded-full transition-all ${
                  i < selectedLandmark.currentLevel
                    ? 'bg-gradient-to-r from-amber-400 to-yellow-300 shadow-[0_0_8px_rgba(251,191,36,0.8)]'
                    : 'bg-slate-800 border border-slate-700'
                }`}
              />
            ))}
          </div>

          {/* Upgrade Action Footer */}
          <div className="flex items-center justify-between pt-1 border-t border-slate-800">
            <div className="text-[10px] text-slate-400">
              {selectedLandmark.currentLevel >= selectedLandmark.maxLevel ? (
                <span className="text-emerald-400 font-bold">✓ Masterwork Landmark complete!</span>
              ) : (
                <span>Next Stage: <strong className="text-slate-200">{STAGE_NAMES[selectedLandmark.currentLevel + 1]}</strong></span>
              )}
            </div>

            {selectedLandmark.currentLevel >= selectedLandmark.maxLevel ? (
              <span className="px-3 py-1.5 rounded-xl bg-emerald-950/80 border border-emerald-400 text-emerald-300 text-xs font-black uppercase">
                COMPLETED
              </span>
            ) : (
              <button
                onClick={() => handleUpgrade(selectedLandmark)}
                disabled={coins < (selectedLandmark.costPerLevel[selectedLandmark.currentLevel] || 0)}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-lg transition-all ${
                  coins >= (selectedLandmark.costPerLevel[selectedLandmark.currentLevel] || 0)
                    ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 hover:brightness-110 active:scale-95'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                }`}
              >
                <Hammer className="w-3.5 h-3.5" />
                <span>
                  BUILD ({(selectedLandmark.costPerLevel[selectedLandmark.currentLevel] || 0).toLocaleString()} 🪙)
                </span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* 4. DRIVE-IN AD CINEMA BILLBOARD BUTTON */}
      {onOpenAdCinema && (
        <div className="w-full rounded-2xl bg-gradient-to-r from-cyan-950 via-slate-900 to-fuchsia-950 border border-cyan-500/40 p-3 shadow-md flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl animate-pulse">📺</span>
            <div>
              <div className="text-xs font-black text-white">Drive-In Ad Cinema</div>
              <div className="text-[10px] text-slate-300">
                Watch short video ads for free dice rolls & coins!
              </div>
            </div>
          </div>

          <button
            onClick={onOpenAdCinema}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-black text-xs uppercase tracking-wider shadow-md hover:brightness-110 active:scale-95 transition-all"
          >
            Watch Ads ➔
          </button>
        </div>
      )}
    </div>
  );
});
