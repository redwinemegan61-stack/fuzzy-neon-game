import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BedDouble,
  Cloud,
  Gamepad2,
  Activity,
  Monitor,
  Zap,
  CupSoda,
  Sparkles,
  Flame,
  Radio,
  Sun,
  Compass,
  Home,
  Utensils,
  Music,
  Droplets,
  Palette,
  Check,
  Lock,
  ChevronRight,
  Star,
  Coins,
  Heart,
  Sparkle,
  Layers,
  Moon,
  Crown,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Mascot, MascotBurrow, BurrowFeature, BurrowStyleOption, Town } from '../types';
import { MascotAvatar } from './MascotAvatar';
import { SoundEngine } from '../utils/sound';
import { SurfaceSnuggleNookDiorama } from './SurfaceSnuggleNookDiorama';
import { UndergroundDenView } from './UndergroundDenView';
import { FuzzyDollhouseBurrowView } from './FuzzyDollhouseBurrowView';
import { ThreeBurrowDiorama } from './ThreeBurrowDiorama';
import { ThreeTownBurrowsMap } from './ThreeTownBurrowsMap';
import { StandaloneThreeBorough } from './StandaloneThreeBorough';
import { StandaloneThreeTown } from './StandaloneThreeTown';
import { MAX_MASCOT_LEVEL } from '../utils/mascotLeveling';
import {
  MASCOT_NOOK_SIGNATURES,
  MascotNookSignature,
} from '../data/undergroundDenData';

interface MascotBurrowsViewProps {
  mascots: Mascot[];
  activeMascot: Mascot;
  playerCoins: number;
  burrows: Record<string, MascotBurrow>;
  town?: Town;
  undergroundDen?: {
    unlockedFurnitureIds: string[];
    roomPlacements: Record<string, string>;
    dayNightMode?: 'auto' | 'day' | 'night';
    excavatedChamberIds?: string[];
  };
  onSelectActiveMascot: (mascotId: string) => void;
  onUpgradeFeature: (mascotId: string, featureId: string, cost: number) => void;
  onSelectStyle: (mascotId: string, featureId: string, styleId: string) => void;
  onBuyFurniture?: (furnitureId: string, cost: number) => void;
  onPlaceFurniture?: (slotId: string, furnitureId: string | null) => void;
  onToggleDayNight?: (mode: 'auto' | 'day' | 'night') => void;
  onExcavateChamber?: (chamberId: string, cost: number, reward: number) => void;
  onCollectDailyStash?: (amount: number) => void;
  onOpenTradingPost?: () => void;
  onUpgradeLandmark?: (landmarkId: string, cost: number) => void;
  duplicateTradesCount?: number;
}

export const MascotBurrowsView: React.FC<MascotBurrowsViewProps> = ({
  mascots,
  activeMascot,
  playerCoins,
  burrows,
  town,
  undergroundDen,
  onSelectActiveMascot,
  onUpgradeFeature,
  onSelectStyle,
  onBuyFurniture = () => {},
  onPlaceFurniture = () => {},
  onToggleDayNight = () => {},
  onExcavateChamber = () => {},
  onCollectDailyStash,
  onOpenTradingPost,
  onUpgradeLandmark,
  duplicateTradesCount = 0,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<
    '3d_borough' | '3d_town' | 'dollhouse' | 'shadowbox' | 'upgrades' | '3d_diorama' | '3d_town_map'
  >('3d_borough');
  const [selectedMascotId, setSelectedMascotId] = useState<string>(activeMascot.id);
  const [activeFeatureModal, setActiveFeatureModal] = useState<BurrowFeature | null>(null);
  const [mascotChatQuote, setMascotChatQuote] = useState<string | null>(null);
  const [heartsTrigger, setHeartsTrigger] = useState<number>(0);
  const [isPetting, setIsPetting] = useState<boolean>(false);

  const currentMascot = mascots.find((m) => m.id === selectedMascotId) || activeMascot;
  const currentBurrow = burrows[selectedMascotId] || burrows['pip'];
  const signature: MascotNookSignature =
    MASCOT_NOOK_SIGNATURES[currentMascot.id] || MASCOT_NOOK_SIGNATURES.pip;

  // Day/Night determination
  const denMode = undergroundDen?.dayNightMode || 'auto';
  const isNight =
    denMode === 'night' ||
    (denMode === 'auto' && (new Date().getHours() >= 19 || new Date().getHours() < 7));

  const handlePetMascot = () => {
    SoundEngine.playCoo();
    setIsPetting(true);

    const quotes = signature.snuggleQuotes;
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
    setMascotChatQuote(randomQuote);
    setHeartsTrigger((prev) => prev + 1);

    confetti({
      particleCount: 25,
      spread: 45,
      origin: { y: 0.55 },
      colors: [currentMascot.furColor, signature.nestThemeColor, '#ec4899'],
    });

    setTimeout(() => {
      setIsPetting(false);
    }, 1400);

    setTimeout(() => setMascotChatQuote(null), 3600);
  };

  // Helper to render icon by name
  const renderIcon = (name: string, className = 'w-4 h-4') => {
    switch (name) {
      case 'BedDouble':
        return <BedDouble className={className} />;
      case 'Cloud':
        return <Cloud className={className} />;
      case 'Gamepad2':
        return <Gamepad2 className={className} />;
      case 'Activity':
        return <Activity className={className} />;
      case 'Monitor':
        return <Monitor className={className} />;
      case 'Zap':
        return <Zap className={className} />;
      case 'CupSoda':
        return <CupSoda className={className} />;
      case 'Sparkles':
        return <Sparkles className={className} />;
      case 'Flame':
        return <Flame className={className} />;
      case 'Radio':
        return <Radio className={className} />;
      case 'Sun':
        return <Sun className={className} />;
      case 'Compass':
        return <Compass className={className} />;
      case 'Home':
        return <Home className={className} />;
      case 'Utensils':
        return <Utensils className={className} />;
      case 'Music':
        return <Music className={className} />;
      case 'Droplets':
        return <Droplets className={className} />;
      default:
        return <Sparkles className={className} />;
    }
  };

  // Total comfort score
  const totalBurrowLevel = currentBurrow?.features.reduce((sum, f) => sum + f.level, 0) || 0;
  const maxBurrowLevel = currentBurrow?.features.reduce((sum, f) => sum + f.maxLevel, 0) || 16;
  const comfortPercent = Math.round((totalBurrowLevel / maxBurrowLevel) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="w-full flex flex-col gap-3 py-1"
    >
      {/* 1. Sub-Navigation Switch: Standalone 3D Borough + Standalone 3D Town + Fuzzy Burrow + Cavern Explorer + Style Catalog */}
      <div className="w-full flex flex-col gap-1.5">
        {/* Prominent Standalone 3D Experiences Bar */}
        <div className="w-full grid grid-cols-2 gap-2">
          <button
            onClick={() => {
              setActiveSubTab('3d_borough');
              SoundEngine.playTileStep();
            }}
            className={`py-2.5 px-3 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-between transition-all cursor-pointer relative shadow-lg ${
              activeSubTab === '3d_borough' || activeSubTab === '3d_diorama'
                ? 'bg-gradient-to-r from-amber-400 via-orange-500 to-pink-500 text-slate-950 shadow-[0_0_20px_rgba(251,146,60,0.6)] border-2 border-white scale-[1.01]'
                : 'bg-gradient-to-r from-amber-950/80 via-slate-900 to-indigo-950/80 text-amber-300 hover:text-white border border-amber-500/40 hover:border-amber-400'
            }`}
          >
            <div className="flex items-center gap-2 text-left">
              <span className="text-xl animate-bounce">🏡</span>
              <div>
                <span className="block font-black text-xs leading-tight">3D Borough</span>
                <span className="text-[9px] opacity-80 normal-case font-medium block">
                  Companion Sanctuary
                </span>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-black/25 text-[8.5px] font-black uppercase border border-white/20">
              3D
            </span>
          </button>

          {town && (
            <button
              onClick={() => {
                setActiveSubTab('3d_town');
                SoundEngine.playTileStep();
              }}
              className={`py-2.5 px-3 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-between transition-all cursor-pointer relative shadow-lg ${
                activeSubTab === '3d_town' || activeSubTab === '3d_town_map'
                  ? 'bg-gradient-to-r from-cyan-400 via-teal-500 to-indigo-600 text-slate-950 shadow-[0_0_20px_rgba(6,182,212,0.6)] border-2 border-white scale-[1.01]'
                  : 'bg-gradient-to-r from-cyan-950/80 via-slate-900 to-indigo-950/80 text-cyan-300 hover:text-white border border-cyan-500/40 hover:border-cyan-400'
              }`}
            >
              <div className="flex items-center gap-2 text-left">
                <span className="text-xl animate-bounce">🏰</span>
                <div>
                  <span className="block font-black text-xs leading-tight">3D Town</span>
                  <span className="text-[9px] opacity-80 normal-case font-medium block">
                    Standalone Town World
                  </span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-black/25 text-[8.5px] font-black uppercase border border-white/20">
                3D
              </span>
            </button>
          )}
        </div>

        <div className="w-full grid grid-cols-2 sm:grid-cols-4 p-1.5 rounded-2xl bg-slate-950/90 border border-slate-800 shadow-xl gap-1.5">
          <button
            onClick={() => {
              setActiveSubTab('dollhouse');
              SoundEngine.playTileStep();
            }}
            className={`py-2 px-3 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeSubTab === 'dollhouse'
                ? 'bg-gradient-to-r from-amber-400 via-orange-500 to-pink-500 text-slate-950 shadow-md font-black scale-102'
                : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
            }`}
          >
            <Home className="w-4 h-4" />
            <span>Fuzzy Burrow</span>
          </button>

          <button
            onClick={() => {
              setActiveSubTab('shadowbox');
              SoundEngine.playTileStep();
            }}
            className={`py-2 px-3 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeSubTab === 'shadowbox'
                ? 'bg-gradient-to-r from-cyan-500 via-indigo-600 to-fuchsia-600 text-white shadow-md font-black scale-102'
                : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Cavern Explorer</span>
          </button>

          <button
            onClick={() => {
              setActiveSubTab('upgrades');
              SoundEngine.playTileStep();
            }}
            className={`py-2 px-3 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeSubTab === 'upgrades'
                ? 'bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 text-white shadow-md font-black scale-102'
                : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
            }`}
          >
            <Sparkle className="w-4 h-4" />
            <span>Style Catalog</span>
          </button>

          {onOpenTradingPost && (
            <button
              onClick={() => {
                SoundEngine.playTileStep();
                onOpenTradingPost();
              }}
              className="py-2 px-3 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer bg-gradient-to-r from-amber-950/80 to-orange-950/80 border border-amber-500/50 hover:border-amber-400 text-amber-300 hover:text-white shadow-md relative"
              title="Swap duplicate accessories & furniture with global players"
            >
              <span className="text-sm">🔄</span>
              <span>Trading Post</span>
              {duplicateTradesCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-lime-400 text-slate-950 text-[8px] font-black border border-white">
                  {duplicateTradesCount}
                </span>
              )}
            </button>
          )}
        </div>
      </div>

      {/* RENDER STANDALONE 3D BOROUGH (Standalone 3D Mascot Sanctuary) */}
      {(activeSubTab === '3d_borough' || activeSubTab === '3d_diorama') && (
        <StandaloneThreeBorough
          mascot={currentMascot}
          allMascots={mascots}
          burrow={currentBurrow}
          onSelectActiveMascot={(id) => {
            setSelectedMascotId(id);
            if (onSelectActiveMascot) onSelectActiveMascot(id);
          }}
          playerCoins={playerCoins}
        />
      )}

      {/* RENDER STANDALONE 3D TOWN (Standalone WebGL 3D Town) */}
      {(activeSubTab === '3d_town' || activeSubTab === '3d_town_map') && town && (
        <StandaloneThreeTown
          town={town}
          coins={playerCoins}
          activeMascot={activeMascot}
          allMascots={mascots}
          onUpgradeLandmark={onUpgradeLandmark}
          onSelectActiveMascot={onSelectActiveMascot}
        />
      )}

      {/* RENDER DOLLHOUSE 2-LEVEL HAVEN VIEW */}
      {activeSubTab === 'dollhouse' && (
        <FuzzyDollhouseBurrowView
          mascots={mascots}
          activeMascot={activeMascot}
          playerCoins={playerCoins}
          onUpgradeFurniture={(itemId, cost) => onUpgradeFeature(selectedMascotId, itemId, cost)}
          onSelectFurnitureStyle={(itemId, styleId) => onSelectStyle(selectedMascotId, itemId, styleId)}
          onSelectActiveMascot={onSelectActiveMascot}
          onCollectDailyStash={onCollectDailyStash}
          customFurnitureState={
            currentBurrow?.features.reduce((acc, f) => {
              acc[f.id] = { level: f.level, selectedStyleId: f.selectedStyleId };
              return acc;
            }, {} as Record<string, { level: number; selectedStyleId: string }>) || {}
          }
        />
      )}

      {/* RENDER LIVING CAVERN SANCTUARY TAB */}
      {activeSubTab === 'shadowbox' && (
        <UndergroundDenView
          activeMascot={activeMascot}
          allMascots={mascots}
          playerCoins={playerCoins}
          unlockedFurnitureIds={undergroundDen?.unlockedFurnitureIds}
          roomPlacements={undergroundDen?.roomPlacements}
          dayNightMode={undergroundDen?.dayNightMode}
          excavatedChamberIds={undergroundDen?.excavatedChamberIds}
          onBuyFurniture={onBuyFurniture}
          onPlaceFurniture={onPlaceFurniture}
          onToggleDayNight={onToggleDayNight}
          onExcavateChamber={onExcavateChamber}
          onSelectActiveMascot={onSelectActiveMascot}
        />
      )}

      {/* RENDER BURROW ARCHITECTURAL UPGRADES TAB */}
      {activeSubTab === 'upgrades' && (
        <>
          {/* Top Mascot Picker Carousel */}
          <div className="w-full overflow-x-auto no-scrollbar flex items-center gap-2 pb-1">
            {mascots.map((mascot) => {
              const isSelected = mascot.id === selectedMascotId;
              const isEquipped = mascot.id === activeMascot.id;
              const isMaxLvl = mascot.level >= MAX_MASCOT_LEVEL;
              const burrow = burrows[mascot.id];
              const burrowLvl = burrow?.features.reduce((sum, f) => sum + f.level, 0) || 0;

              return (
                <button
                  key={mascot.id}
                  onClick={() => {
                    setSelectedMascotId(mascot.id);
                    SoundEngine.playTileStep();
                  }}
                  className={`flex-shrink-0 flex items-center gap-2.5 px-3 py-2 rounded-2xl border transition-all text-left cursor-pointer relative ${
                    isSelected
                      ? isMaxLvl
                        ? 'bg-gradient-to-r from-amber-950/90 via-slate-900 to-indigo-950/90 border-2 border-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.6)] scale-102'
                        : 'bg-slate-800/90 border-2 shadow-lg scale-102'
                      : isMaxLvl
                      ? 'bg-slate-900/80 border-amber-500/50 hover:bg-slate-800/60 shadow-[0_0_10px_rgba(251,191,36,0.25)]'
                      : 'bg-slate-900/60 border-slate-800 hover:bg-slate-800/50 opacity-80'
                  }`}
                  style={{
                    borderColor: isSelected && !isMaxLvl ? mascot.furColor : undefined,
                    boxShadow: isSelected && !isMaxLvl ? `0 0 16px ${mascot.furColor}33` : undefined,
                  }}
                >
                  <div className="w-9 h-9 flex-shrink-0 relative">
                    <MascotAvatar mascot={mascot} size="sm" showHairGlow={isMaxLvl} interactive={false} />
                    {isMaxLvl && (
                      <span className="absolute -top-1 -right-1 text-[8px] animate-bounce">👑</span>
                    )}
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-black text-white">{mascot.name}</span>
                      {isEquipped && (
                        <span className="px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[9px] font-black uppercase">
                          Equipped
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-[10px]">
                      <Home
                        className={`w-3 h-3 ${
                          isMaxLvl
                            ? 'text-amber-300 drop-shadow-[0_0_6px_rgba(251,191,36,0.95)] animate-pulse'
                            : 'text-amber-400'
                        }`}
                      />
                      <span className={isMaxLvl ? 'text-amber-300 font-black' : 'text-slate-400'}>
                        Burrow Lv.{burrowLvl} {isMaxLvl ? '✨' : ''}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Main Surface Snuggle Nook Diorama Stage */}
          <motion.div
            key={currentBurrow.mascotId}
            initial={{
              opacity: 0,
              scale: 0.88,
              y: 20,
            }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
            }}
            transition={{
              type: 'spring',
              stiffness: 280,
              damping: 18,
            }}
            className={`w-full rounded-3xl p-4 sm:p-5 border-2 border-slate-800/80 relative overflow-hidden shadow-2xl bg-gradient-to-b ${currentBurrow.bgGradient}`}
            style={{
              boxShadow: `inset 0 0 80px rgba(0,0,0,0.7), 0 10px 30px rgba(0,0,0,0.5)`,
            }}
          >
            {/* Bioluminescent Cozy Ambient Glow Orbs */}
            <motion.div
              initial={{ scale: 0.3, opacity: 0 }}
              animate={{ scale: 1, opacity: 0.25 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="absolute -top-10 -right-10 w-44 h-44 rounded-full blur-3xl pointer-events-none"
              style={{ background: currentMascot.furColor }}
            />
            <motion.div
              initial={{ scale: 0.3, opacity: 0 }}
              animate={{ scale: 1, opacity: 0.2 }}
              transition={{ duration: 0.6, delay: 0.08, ease: 'easeOut' }}
              className="absolute -bottom-10 -left-10 w-44 h-44 rounded-full blur-3xl pointer-events-none"
              style={{ background: signature.nestThemeColor }}
            />

            {/* Surface Nook Header Info */}
            <div className="relative z-10 flex items-start justify-between gap-2 mb-2">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-0.5 rounded-md bg-slate-900/85 border border-slate-700/60 text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                    <Sparkle className="w-2.5 h-2.5" />
                    Surface Snuggle Nook
                  </span>
                  {currentMascot.id !== activeMascot.id && (
                    <button
                      onClick={() => {
                        onSelectActiveMascot(currentMascot.id);
                        SoundEngine.playPowerup();
                      }}
                      className="px-2 py-0.5 rounded-md bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-[10px] font-bold transition-all cursor-pointer"
                    >
                      Set as Active Companion
                    </button>
                  )}
                </div>
                <h2 className="text-base font-black text-white mt-1">{signature.nestTitle}</h2>
                <p className="text-[11px] text-slate-300 max-w-[280px]">{signature.nestSubtitle}</p>
              </div>

              {/* Comfort Metric */}
              <div className="flex flex-col items-end shrink-0">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Comfort Level</span>
                <div className="flex items-center gap-1 text-sm font-black text-amber-300">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>
                    {totalBurrowLevel}/{maxBurrowLevel}
                  </span>
                </div>
                <div className="w-16 h-1.5 rounded-full bg-slate-900/90 overflow-hidden mt-1 border border-slate-700/50">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-400 to-pink-500 transition-all duration-500"
                    style={{ width: `${comfortPercent}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Signature Micro-Action Text Pill (Personality-Driven Idle) */}
            <div className="relative z-10 my-1 px-3 py-1.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 flex items-center gap-2 text-[11px] text-amber-200/90 shadow-inner">
              <span className="text-sm">{signature.idleSparkleIcon}</span>
              <span className="font-medium italic truncate">{signature.idleMicroAction}</span>
            </div>

            {/* Surface Snuggle Nook Diorama Stage (Tailored Nest Architecture per Mascot) */}
            <div className="relative z-10 flex flex-col items-center justify-center my-2">
              {/* Mascot Speech Bubble */}
              <AnimatePresence>
                {mascotChatQuote && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -5, scale: 0.9 }}
                    className="absolute -top-12 z-20 px-3.5 py-1.5 rounded-2xl bg-slate-950/95 border-2 shadow-2xl text-xs font-black text-white text-center max-w-[260px] pointer-events-none"
                    style={{ borderColor: currentMascot.furColor }}
                  >
                    {mascotChatQuote}
                    <div
                      className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 bg-slate-950 border-r-2 border-b-2"
                      style={{ borderColor: currentMascot.furColor }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Floating Hearts Particle Animation */}
              <AnimatePresence>
                {heartsTrigger > 0 && (
                  <motion.div
                    key={heartsTrigger}
                    initial={{ opacity: 1, y: 0, scale: 0.8 }}
                    animate={{ opacity: 0, y: -45, scale: 1.4 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.2 }}
                    className="absolute -top-4 pointer-events-none flex gap-2 text-pink-400 z-30"
                  >
                    <Heart className="w-5 h-5 fill-pink-500" />
                    <Heart className="w-4 h-4 fill-rose-400" />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* The Diorama Assembly */}
              <div
                onClick={handlePetMascot}
                className="cursor-pointer group relative flex flex-col items-center select-none"
                title="Tap to cuddle and pet mascot"
              >
                <div className="relative flex items-center justify-center">
                  {/* Backdrop SVG Nest Architecture */}
                  <SurfaceSnuggleNookDiorama
                    mascot={currentMascot}
                    signature={signature}
                    isPetting={isPetting}
                    isNight={isNight}
                  />

                  {/* Mascot Sitting Snugly Inside the Signature Diorama Nest */}
                  <motion.div
                    animate={
                      isPetting
                        ? {
                            y: [0, 14, 12, 10], // settles deeper into moss / melon / crystal hammock
                            scaleY: [1, 0.86, 0.92, 0.95],
                            scaleX: [1, 1.1, 1.05, 1.02],
                            rotate: [0, -1.5, 1.5, 0],
                          }
                        : {
                            y: [0, 2, 0], // slow, peaceful resting breath
                            scaleY: [1, 0.985, 1],
                            scaleX: [1, 1.01, 1],
                          }
                    }
                    transition={
                      isPetting
                        ? { type: 'tween', duration: 0.65, ease: 'easeOut' }
                        : { type: 'tween', duration: 3.5, repeat: Infinity, ease: 'easeInOut' }
                    }
                    className="absolute z-10 top-8 flex items-center justify-center pointer-events-none"
                  >
                    <div className="w-24 h-24 flex items-center justify-center">
                      <MascotAvatar
                        mascot={currentMascot}
                        size="md"
                        showHairGlow={true}
                        isDancing={false}
                        isResting={false}
                        enableMicroAnimations={true}
                      />
                    </div>
                  </motion.div>
                </div>

                {/* Tactile Touchpoint Indicator */}
                <div className="mt-1 flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/90 border border-slate-700/70 text-[11px] font-bold text-slate-300 group-hover:text-white group-hover:border-slate-500 transition-all shadow-md">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 group-hover:rotate-12 transition-transform" />
                  <span>Tap to pet & cuddles</span>
                </div>
              </div>
            </div>

            {/* Quick Decor Tags */}
            <div className="relative z-10 grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-800/80">
              {currentBurrow.features.map((feature) => {
                const currentStyle =
                  feature.styles.find((s) => s.id === feature.selectedStyleId) || feature.styles[0];
                const isUnlocked = feature.level > 0;

                return (
                  <div
                    key={feature.id}
                    onClick={() => {
                      setActiveFeatureModal(feature);
                      SoundEngine.playTileStep();
                    }}
                    className={`p-2.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                      isUnlocked
                        ? 'bg-slate-950/80 hover:bg-slate-900 border-slate-800 hover:border-slate-700 shadow-md'
                        : 'bg-slate-950/50 border-slate-800/60 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <div
                        className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{
                          background: `${currentStyle.previewColor}22`,
                          color: currentStyle.previewColor,
                          border: `1px solid ${currentStyle.previewColor}44`,
                        }}
                      >
                        {renderIcon(currentStyle.icon, 'w-3.5 h-3.5')}
                      </div>
                      <div className="flex flex-col truncate">
                        <span className="text-[10px] text-slate-400 font-bold truncate">
                          {feature.title}
                        </span>
                        <span className="text-xs font-black text-white truncate">
                          {isUnlocked ? currentStyle.name : 'Unbuilt'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {isUnlocked ? (
                        <span className="px-1.5 py-0.5 rounded-md bg-slate-800 text-[9px] font-black text-amber-400">
                          Lv.{feature.level}
                        </span>
                      ) : (
                        <Lock className="w-3.5 h-3.5 text-slate-500" />
                      )}
                      <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Upgrade & Style Selection List */}
          <div className="w-full flex flex-col gap-2.5 mt-1">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-xs font-black text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-cyan-400" />
                Burrow Rooms & Custom Styles
              </h3>
              <span className="text-[11px] font-black text-amber-300 flex items-center gap-1">
                <Coins className="w-3.5 h-3.5 text-amber-400" />
                {playerCoins.toLocaleString()} coins
              </span>
            </div>

            {currentBurrow.features.map((feature) => {
              const currentStyle =
                feature.styles.find((s) => s.id === feature.selectedStyleId) || feature.styles[0];
              const isMaxLevel = feature.level >= feature.maxLevel;
              const upgradeCost = feature.costPerLevel[feature.level] || 5000;
              const canAfford = playerCoins >= upgradeCost;

              return (
                <div
                  key={feature.id}
                  className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col gap-3 shadow-lg"
                >
                  {/* Feature Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{
                          background: `${currentStyle.previewColor}22`,
                          color: currentStyle.previewColor,
                          border: `1.5px solid ${currentStyle.previewColor}55`,
                        }}
                      >
                        {renderIcon(currentStyle.icon, 'w-4 h-4')}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-black text-white">{feature.title}</h4>
                          <span className="px-1.5 py-0.5 rounded-md bg-slate-800 border border-slate-700/60 text-[10px] font-bold text-amber-400">
                            {feature.level === 0 ? 'Unbuilt' : `Lv. ${feature.level}/${feature.maxLevel}`}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">{currentStyle.description}</p>
                      </div>
                    </div>

                    {/* Upgrade Button */}
                    <button
                      disabled={isMaxLevel || !canAfford}
                      onClick={() => {
                        onUpgradeFeature(currentMascot.id, feature.id, upgradeCost);
                        confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
                      }}
                      className={`flex-shrink-0 px-3 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer ${
                        isMaxLevel
                          ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                          : canAfford
                          ? 'bg-gradient-to-r from-amber-400 via-orange-500 to-pink-500 text-slate-950 font-black shadow-md hover:brightness-110 active:scale-95'
                          : 'bg-slate-800 border border-slate-700/80 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      {isMaxLevel ? (
                        <span>Maxed</span>
                      ) : (
                        <>
                          <Coins className="w-3.5 h-3.5 fill-slate-950" />
                          <span>{upgradeCost.toLocaleString()}</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Style Selector Pills */}
                  <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-800/80">
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase">
                      <span>Choose Style:</span>
                      <span className="text-cyan-400">Tap to equip free anytime</span>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      {feature.styles.map((style) => {
                        const isSelectedStyle = feature.selectedStyleId === style.id;

                        return (
                          <button
                            key={style.id}
                            onClick={() => {
                              onSelectStyle(currentMascot.id, feature.id, style.id);
                              SoundEngine.playTileStep();
                            }}
                            className={`p-2 rounded-xl border text-left flex flex-col gap-1 transition-all relative cursor-pointer ${
                              isSelectedStyle
                                ? 'bg-slate-800/90 border-2 shadow-md'
                                : 'bg-slate-950/60 border-slate-800 hover:bg-slate-850 hover:border-slate-700'
                            }`}
                            style={{
                              borderColor: isSelectedStyle ? style.previewColor : undefined,
                            }}
                          >
                            {isSelectedStyle && (
                              <div
                                className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full flex items-center justify-center text-slate-950 shadow-sm"
                                style={{ background: style.previewColor }}
                              >
                                <Check className="w-2.5 h-2.5 stroke-[3]" />
                              </div>
                            )}
                            <div className="flex items-center gap-1.5">
                              <div
                                className="w-4 h-4 rounded-md flex items-center justify-center flex-shrink-0"
                                style={{
                                  background: `${style.previewColor}33`,
                                  color: style.previewColor,
                                }}
                              >
                                {renderIcon(style.icon, 'w-2.5 h-2.5')}
                              </div>
                              <span className="text-[10px] font-black text-white truncate">
                                {style.name}
                              </span>
                            </div>
                            <span
                              className="text-[9px] font-bold px-1.5 py-0.5 rounded-md w-fit"
                              style={{
                                background: `${style.accentColor}22`,
                                color: style.accentColor,
                              }}
                            >
                              {style.visualTag}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Detailed Style Inspection Modal */}
      <AnimatePresence>
        {activeFeatureModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm rounded-3xl bg-slate-900 border-2 border-slate-800 p-5 shadow-2xl flex flex-col gap-4 text-white"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-amber-400 font-bold uppercase">
                    Burrow Customization
                  </span>
                  <h3 className="text-base font-black">{activeFeatureModal.title}</h3>
                </div>
                <button
                  onClick={() => setActiveFeatureModal(null)}
                  className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <p className="text-xs text-slate-400">
                Choose the aesthetic theme for this room in {currentMascot.name}&apos;s burrow.
                Styles can be switched freely at any time without resetting room levels.
              </p>

              <div className="flex flex-col gap-2.5">
                {activeFeatureModal.styles.map((style) => {
                  const isSelected = activeFeatureModal.selectedStyleId === style.id;

                  return (
                    <div
                      key={style.id}
                      onClick={() => {
                        onSelectStyle(currentMascot.id, activeFeatureModal.id, style.id);
                        setActiveFeatureModal((prev) =>
                          prev ? { ...prev, selectedStyleId: style.id } : null
                        );
                        SoundEngine.playTileStep();
                      }}
                      className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'bg-slate-800/90 border-2 shadow-lg'
                          : 'bg-slate-950/70 border-slate-800 hover:bg-slate-800/50'
                      }`}
                      style={{
                        borderColor: isSelected ? style.previewColor : undefined,
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
                          style={{
                            background: `${style.previewColor}33`,
                            color: style.previewColor,
                            border: `1.5px solid ${style.previewColor}66`,
                          }}
                        >
                          {renderIcon(style.icon, 'w-5 h-5')}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-black text-white">{style.name}</span>
                          <span className="text-[11px] text-slate-400">{style.description}</span>
                        </div>
                      </div>

                      {isSelected ? (
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center text-slate-950 flex-shrink-0"
                          style={{ background: style.previewColor }}
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-500 font-bold">Select</span>
                      )}
                    </div>
                  );
                })}
              </div>

              <button
                onClick={() => setActiveFeatureModal(null)}
                className="w-full py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-xs font-black uppercase tracking-wider text-white transition-all cursor-pointer"
              >
                Done
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
