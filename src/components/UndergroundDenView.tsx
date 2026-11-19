import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Heart,
  Moon,
  Sun,
  Flame,
  Volume2,
  VolumeX,
  Plus,
  Trash2,
  Lock,
  Coins,
  Smile,
  Zap,
  Sliders,
  Check,
  ChevronDown,
  ArrowDown,
  ArrowUp,
  Pickaxe,
  BookOpen,
  Coffee,
  Eye,
  Music,
  Compass,
  Radio,
  Layers,
  Move,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Mascot } from '../types';
import { MascotAvatar } from './MascotAvatar';
import { SoundEngine } from '../utils/sound';
import { SurfaceSnuggleNookDiorama } from './SurfaceSnuggleNookDiorama';
import {
  DEN_FURNITURE_CATALOG,
  DenFurnitureItem,
  MASCOT_NOOK_SIGNATURES,
  MascotNookSignature,
  DEN_CHAMBERS,
  DenChamberDefinition,
  DenWallCubby,
} from '../data/undergroundDenData';

interface UndergroundDenProps {
  activeMascot: Mascot;
  allMascots: Mascot[];
  playerCoins: number;
  unlockedFurnitureIds?: string[];
  roomPlacements?: Record<string, string>; // slotId (e.g. chamber_hearth_center) -> furnitureId
  dayNightMode?: 'auto' | 'day' | 'night';
  excavatedChamberIds?: string[];
  onBuyFurniture: (furnitureId: string, cost: number) => void;
  onPlaceFurniture: (slotId: string, furnitureId: string | null) => void;
  onToggleDayNight: (mode: 'auto' | 'day' | 'night') => void;
  onExcavateChamber?: (chamberId: string, cost: number, reward: number) => void;
  onSelectActiveMascot?: (mascotId: string) => void;
}

export const UndergroundDenView: React.FC<UndergroundDenProps> = ({
  activeMascot,
  allMascots,
  playerCoins,
  unlockedFurnitureIds = ['furn_holo_rug', 'furn_mushroom_stool', 'furn_patchwork_pillows', 'furn_hanging_egg_chair'],
  roomPlacements = {
    chamber_hearth_center: 'furn_patchwork_pillows',
    chamber_hearth_left: 'furn_log_fireplace',
    chamber_grotto_center: 'furn_mushroom_stool',
    chamber_grotto_right: 'furn_nectar_fountain',
    chamber_arcade_center: 'furn_holo_rug',
    chamber_arcade_left: 'furn_cyber_trampoline',
  },
  dayNightMode = 'auto',
  excavatedChamberIds = ['chamber_hearth', 'chamber_grotto', 'chamber_arcade'],
  onBuyFurniture,
  onPlaceFurniture,
  onToggleDayNight,
  onExcavateChamber = () => {},
  onSelectActiveMascot = () => {},
}) => {
  const [selectedThemeFilter, setSelectedThemeFilter] = useState<'all' | 'cyber_pastel' | 'bioluminescent_grotto' | 'retro_plush'>('all');
  const [activePickingSlot, setActivePickingSlot] = useState<string | null>(null);
  const [mascotInDenId, setMascotInDenId] = useState<string>(activeMascot.id);
  const [playingLofi, setPlayingLofi] = useState<boolean>(false);
  const [interactionParticles, setInteractionParticles] = useState<Array<{ id: number; icon: string; text: string }>>([]);
  const [mascotDialogue, setMascotDialogue] = useState<string | null>(null);

  // Mascot Spatial Location in the 2D Living Shadowbox:
  // level: 'surface' | chamberId
  // spot: 'nest' | 'left' | 'center' | 'right' | 'cubby' | 'chute'
  const [mascotLocation, setMascotLocation] = useState<{
    chamberId: string;
    nodeId: 'nest' | 'left' | 'center' | 'right' | 'cubby';
    action: 'idle' | 'sleeping' | 'bouncing' | 'lofi_dance' | 'in_cubby' | 'zipping';
  }>({
    chamberId: 'chamber_hearth',
    nodeId: 'center',
    action: 'idle',
  });

  // Scruff-and-Drop Handling State
  const [isScruffHeld, setIsScruffHeld] = useState<boolean>(false);
  const [scruffHoldTimer, setScruffHoldTimer] = useState<any>(null);
  const [activeDropTarget, setActiveDropTarget] = useState<string | null>(null);

  // Transit Chute Animation State
  const [isZippingChute, setIsZippingChute] = useState<boolean>(false);
  const [zippingDirection, setZippingDirection] = useState<'down' | 'up'>('down');

  // Sleepy Burrowing Bugs tap states
  const [glowingBugStates, setGlowingBugStates] = useState<Record<string, boolean>>({});

  // Toggle-able Ambient Neon FX layer & Fireflies state
  const [isNeonFxActive, setIsNeonFxActive] = useState<boolean>(false);
  const [isFirefliesActive, setIsFirefliesActive] = useState<boolean>(false);

  // Surface and Den section references for smooth scrolling
  const surfaceRef = useRef<HTMLDivElement>(null);
  const chuteRef = useRef<HTMLDivElement>(null);
  const denTopRef = useRef<HTMLDivElement>(null);
  const catalogRef = useRef<HTMLDivElement>(null);

  // Day/Night determination
  const isNight =
    dayNightMode === 'night' ||
    (dayNightMode === 'auto' && (new Date().getHours() >= 19 || new Date().getHours() < 7));

  const currentMascot = allMascots.find((m) => m.id === mascotInDenId) || activeMascot;
  const nookSignature: MascotNookSignature =
    MASCOT_NOOK_SIGNATURES[currentMascot.id] || MASCOT_NOOK_SIGNATURES.pip;

  // Floating feedback
  const triggerFloatingParticle = (icon: string, text: string) => {
    const newId = Date.now() + Math.random();
    setInteractionParticles((prev) => [...prev.slice(-3), { id: newId, icon, text }]);
    setTimeout(() => {
      setInteractionParticles((prev) => prev.filter((p) => p.id !== newId));
    }, 2500);
  };

  // Scruff-and-Drop Touch/Mouse Handlers
  const handleStartScruffHold = () => {
    SoundEngine.playTileStep();
    const timer = setTimeout(() => {
      setIsScruffHeld(true);
      SoundEngine.playCoo();
      triggerFloatingParticle('🤏', `Held ${currentMascot.name} by the scruff!`);
    }, 280);
    setScruffHoldTimer(timer);
  };

  const handleEndScruffHold = (targetChamberId?: string, targetNodeId?: 'left' | 'center' | 'right' | 'cubby' | 'nest') => {
    if (scruffHoldTimer) {
      clearTimeout(scruffHoldTimer);
      setScruffHoldTimer(null);
    }

    if (isScruffHeld) {
      setIsScruffHeld(false);
      SoundEngine.playBounce();

      if (targetChamberId && targetNodeId) {
        snapMascotToNode(targetChamberId, targetNodeId);
      } else {
        triggerFloatingParticle('✨', `${currentMascot.name} landed softly!`);
      }
    }
  };

  // Snap Mascot Directly onto Furniture / Cubby / Nest
  const snapMascotToNode = (chamberId: string, nodeId: 'nest' | 'left' | 'center' | 'right' | 'cubby') => {
    SoundEngine.playBounce();

    if (nodeId === 'nest') {
      setMascotLocation({ chamberId: 'surface', nodeId: 'nest', action: 'sleeping' });
      setMascotDialogue(nookSignature.snuggleQuotes[0]);
      triggerFloatingParticle('💖', `${currentMascot.name} curled into the surface nest!`);
      return;
    }

    if (nodeId === 'cubby') {
      const chamber = DEN_CHAMBERS.find((c) => c.id === chamberId);
      const cubby = chamber?.wallCubby;
      setMascotLocation({ chamberId, nodeId: 'cubby', action: 'in_cubby' });
      if (cubby) {
        setMascotDialogue(cubby.mascotQuote);
        triggerFloatingParticle(cubby.icon, `${currentMascot.name} tucked into ${cubby.name}!`);
      }
      return;
    }

    // Checking furniture at this slot
    const slotKey = `${chamberId}_${nodeId}`;
    const furnitureId = roomPlacements[slotKey];
    const furniture = DEN_FURNITURE_CATALOG.find((f) => f.id === furnitureId);

    if (furniture) {
      if (furniture.interactiveType === 'trampoline') {
        setMascotLocation({ chamberId, nodeId, action: 'bouncing' });
        SoundEngine.playBounce();
        triggerFloatingParticle('🤸', `Bouncing happily on ${furniture.name}!`);
      } else if (furniture.interactiveType === 'radio') {
        setMascotLocation({ chamberId, nodeId, action: 'lofi_dance' });
        SoundEngine.playLofiTune();
        setPlayingLofi(true);
        triggerFloatingParticle('🎶', `Grooving to lofi beats on ${furniture.name}!`);
      } else if (furniture.interactiveType === 'cushion' || furniture.interactiveType === 'gummy_bear') {
        setMascotLocation({ chamberId, nodeId, action: 'sleeping' });
        SoundEngine.playCoo();
        triggerFloatingParticle('💤', `Curled into a ball on ${furniture.name}!`);
      } else {
        setMascotLocation({ chamberId, nodeId, action: 'idle' });
        triggerFloatingParticle('✨', `Relaxing at ${furniture.name}!`);
      }
      setMascotDialogue(`*contented purr* ${furniture.name} is peak coziness! ❤️`);
    } else {
      setMascotLocation({ chamberId, nodeId, action: 'idle' });
      triggerFloatingParticle('🐾', `Pacing around the cavern floor`);
    }
  };

  // Visible Transit Chute: Zip Mascot between Surface and Subterranean Chambers
  const handleZipTransitChute = (targetDirection: 'down' | 'up') => {
    SoundEngine.playWhooshZip();
    setIsZippingChute(true);
    setZippingDirection(targetDirection);

    if (targetDirection === 'down') {
      // Zip down from surface into den
      setMascotLocation({ chamberId: 'transit', nodeId: 'center', action: 'zipping' });
      setTimeout(() => {
        setIsZippingChute(false);
        setMascotLocation({ chamberId: 'chamber_hearth', nodeId: 'center', action: 'bouncing' });
        SoundEngine.playBounce();
        triggerFloatingParticle('🚀', `${currentMascot.name} zoomed down the suction chute!`);
        denTopRef.current?.scrollIntoView({ behavior: 'smooth' });
        confetti({ particleCount: 30, spread: 50, origin: { y: 0.6 } });
      }, 700);
    } else {
      // Ascend from den to surface nest
      setMascotLocation({ chamberId: 'transit', nodeId: 'center', action: 'zipping' });
      setTimeout(() => {
        setIsZippingChute(false);
        setMascotLocation({ chamberId: 'surface', nodeId: 'nest', action: 'sleeping' });
        SoundEngine.playCoo();
        triggerFloatingParticle('🌿', `${currentMascot.name} climbed back to the sunny nest!`);
        surfaceRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 700);
    }
  };

  // Handle Chamber Excavation
  const handleExcavate = (chamber: DenChamberDefinition) => {
    if (playerCoins < chamber.excavationCost) return;
    onExcavateChamber(chamber.id, chamber.excavationCost, chamber.excavationRewardCoins);
    SoundEngine.playExcavation();
    confetti({
      particleCount: 60,
      spread: 70,
      origin: { y: 0.7 },
      colors: [chamber.neonAccent, '#fbbf24', '#ffffff'],
    });
    triggerFloatingParticle('⛏️', `Excavated ${chamber.name}! Found +${chamber.excavationRewardCoins} coins!`);
  };

  // Sleepy Bug Tap
  const handleTapSleepyBug = (bugId: string) => {
    SoundEngine.playTileStep();
    setGlowingBugStates((prev) => ({ ...prev, [bugId]: !prev[bugId] }));
    triggerFloatingParticle('🪲', 'The sleepy neon glow-beetle purred softly!');
  };

  // Theme catalog filtering
  const filteredFurniture = DEN_FURNITURE_CATALOG.filter(
    (item) => selectedThemeFilter === 'all' || item.theme === selectedThemeFilter
  );

  return (
    <div className="w-full flex flex-col gap-4 py-1 select-none">
      {/* 1. Master Control Bar & Vertical Shadowbox Navigation Anchor */}
      <div className="flex items-center justify-between gap-2 p-3 rounded-2xl bg-slate-950/90 border border-slate-800 shadow-2xl backdrop-blur-md flex-wrap sticky top-1 z-40">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-fuchsia-600 flex items-center justify-center text-lg shadow-md">
            🏰
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black text-white">Living Vertical Shadowbox</span>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                Living Cavern Sanctuary
              </span>
            </div>
            <p className="text-[10px] text-slate-400">
              Cross-section soil strata, visible transit chutes & expandable chambers
            </p>
          </div>
        </div>

        {/* Quick Vertical Jump Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <button
            onClick={() => surfaceRef.current?.scrollIntoView({ behavior: 'smooth' })}
            className="px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-[10px] font-black text-amber-300 flex items-center gap-1 cursor-pointer"
          >
            <span>☀️ Surface</span>
          </button>
          <button
            onClick={() => chuteRef.current?.scrollIntoView({ behavior: 'smooth' })}
            className="px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-[10px] font-black text-cyan-300 flex items-center gap-1 cursor-pointer"
          >
            <span>🚀 Chute</span>
          </button>
          <button
            onClick={() => denTopRef.current?.scrollIntoView({ behavior: 'smooth' })}
            className="px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-[10px] font-black text-fuchsia-300 flex items-center gap-1 cursor-pointer"
          >
            <span>🏰 Den Tiers</span>
          </button>
          <button
            onClick={() => catalogRef.current?.scrollIntoView({ behavior: 'smooth' })}
            className="px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-[10px] font-black text-emerald-300 flex items-center gap-1 cursor-pointer"
          >
            <span>🛋️ Catalog</span>
          </button>

          {/* Day / Night Toggle */}
          <button
            onClick={() => {
              const next = dayNightMode === 'auto' ? 'day' : dayNightMode === 'day' ? 'night' : 'auto';
              onToggleDayNight(next);
              SoundEngine.playTileStep();
            }}
            className={`p-1.5 rounded-xl border transition-all cursor-pointer ${
              isNight
                ? 'bg-indigo-950 border-indigo-500/60 text-indigo-300'
                : 'bg-amber-950 border-amber-500/60 text-amber-300'
            }`}
            title="Toggle Day/Night Strata Glow"
          >
            {isNight ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
          </button>

          {/* Lofi Radio Toggle */}
          <button
            onClick={() => {
              SoundEngine.playLofiTune();
              setPlayingLofi(!playingLofi);
            }}
            className={`p-1.5 rounded-xl border transition-all cursor-pointer ${
              playingLofi
                ? 'bg-cyan-950 border-cyan-400 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}
            title="Toggle Lofi Beats"
          >
            {playingLofi ? <Volume2 className="w-3.5 h-3.5 text-cyan-400 animate-pulse" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>



          {/* Toggle-able Drifting Fireflies & Glowing Motes */}
          <button
            onClick={() => {
              const next = !isFirefliesActive;
              setIsFirefliesActive(next);
              if (next) {
                SoundEngine.playTileStep();
                triggerFloatingParticle('🪲', 'Drifting Fireflies Awoken!');
              } else {
                SoundEngine.playTileStep();
                triggerFloatingParticle('💤', 'Fireflies Resting');
              }
            }}
            className={`px-2.5 py-1 rounded-xl border text-[10px] font-black uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer ${
              isFirefliesActive
                ? 'bg-gradient-to-r from-lime-950 to-emerald-950 border-lime-400 text-lime-200 shadow-[0_0_12px_rgba(163,230,53,0.4)]'
                : 'bg-slate-950 border-slate-800 text-slate-400'
            }`}
            title="Toggle Drifting Fireflies & Glowing Dust Motes Overlay"
          >
            <span className={`text-xs ${isFirefliesActive ? 'animate-bounce' : 'opacity-40'}`}>🪲</span>
            <span>Fireflies: {isFirefliesActive ? 'ON' : 'OFF'}</span>
          </button>
        </div>
      </div>

      {/* Mascot Companion Selector */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 shrink-0 ml-1">
          Active Mascot in Den:
        </span>
        {allMascots.map((mascot) => {
          const isSelected = mascot.id === mascotInDenId;
          return (
            <button
              key={mascot.id}
              onClick={() => {
                setMascotInDenId(mascot.id);
                SoundEngine.playTileStep();
              }}
              className={`px-2.5 py-1 rounded-xl border text-xs font-black flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
                isSelected
                  ? 'bg-slate-800 text-white border-2 shadow-md'
                  : 'bg-slate-900/70 border-slate-800 text-slate-400 hover:text-white'
              }`}
              style={{
                borderColor: isSelected ? mascot.furColor : undefined,
              }}
            >
              <span className="w-2 h-2 rounded-full" style={{ background: mascot.furColor }} />
              <span>{mascot.name}</span>
            </button>
          );
        })}
      </div>

      {/* Floating Interaction Feedback Particles */}
      <div className="fixed top-20 right-4 z-50 flex flex-col gap-1.5 pointer-events-none items-end">
        <AnimatePresence>
          {interactionParticles.map((p) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 15, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.8 }}
              className="px-3 py-1.5 rounded-2xl bg-slate-950/95 border border-fuchsia-500/50 shadow-2xl text-xs font-black text-white flex items-center gap-2"
            >
              <span>{p.icon}</span>
              <span className="text-[11px] text-fuchsia-200">{p.text}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* ========================================================================= */}
      {/* 2. THE LIVING SHADOWBOX: VERTICAL CAVERN STRATA CONTAINER                */}
      {/* ========================================================================= */}
      <div className="w-full rounded-3xl border-4 border-slate-800/90 shadow-2xl overflow-hidden relative bg-[#070814]">
        {/* Soft Shadow Inside Frame */}
        <div className="absolute inset-0 shadow-[inset_0_0_60px_rgba(0,0,0,0.9)] pointer-events-none z-30" />

        {/* ----------------------------------------------------------------------- */}
        {/* TIER 0: SURFACE SNUGGLE NOOK (Canopy & Sky Backdrop)                    */}
        {/* ----------------------------------------------------------------------- */}
        <div
          ref={surfaceRef}
          className={`relative w-full pt-4 pb-6 px-4 flex flex-col items-center justify-between border-b-4 border-[#2b1f14] transition-colors duration-700 ${
            isNight
              ? 'bg-gradient-to-b from-[#050716] via-[#09102b] to-[#1a1223]'
              : 'bg-gradient-to-b from-[#38bdf8]/30 via-[#fde047]/15 to-[#1a1223]'
          }`}
        >
          {/* Sky Backdrop & Canopy Leaves Layer */}
          <div className="absolute top-0 inset-x-0 h-28 pointer-events-none overflow-hidden opacity-80">
            {/* Hanging Canopy Vine Leaves */}
            <svg viewBox="0 0 800 120" className="w-full h-24 object-cover" preserveAspectRatio="none">
              <path
                d="M 0 0 Q 100 45 200 15 Q 300 50 400 20 Q 500 55 600 25 Q 700 45 800 0 L 800 0 L 0 0 Z"
                fill="#15803d"
                opacity="0.85"
              />
              <path
                d="M 50 0 Q 150 65 250 20 Q 350 70 450 25 Q 550 60 650 30 L 750 0 Z"
                fill="#166534"
                opacity="0.6"
              />
            </svg>
            {/* Ambient Sunbeams or Night Fireflies */}
            <div
              className="absolute top-2 left-1/3 w-64 h-24 blur-2xl opacity-40 pointer-events-none rounded-full"
              style={{ background: isNight ? '#818cf8' : '#fbbf24' }}
            />
          </div>

          {/* Surface Nook Header */}
          <div className="relative z-10 w-full flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] font-black uppercase">
                Depth 0.0m • Canopy Surface
              </span>
              <h3 className="text-xs font-black text-white">{nookSignature.nestTitle}</h3>
            </div>

            {/* Quick Button to Zip Down Chute */}
            <button
              onClick={() => handleZipTransitChute('down')}
              className="px-3 py-1 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-[10px] uppercase tracking-wider flex items-center gap-1.5 shadow-lg transition-transform active:scale-95 cursor-pointer"
            >
              <span>🚀 Zip Down Chute</span>
              <ArrowDown className="w-3 h-3 stroke-[3]" />
            </button>
          </div>

          {/* Surface Diorama Stage & Mascot Nest */}
          <div className="relative z-10 flex flex-col items-center justify-center my-2">
            {/* Speech Bubble */}
            <AnimatePresence>
              {mascotDialogue && mascotLocation.chamberId === 'surface' && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mb-1 px-3 py-1 rounded-xl bg-slate-950/90 border border-amber-400 text-[11px] font-bold text-white shadow-xl text-center max-w-[280px]"
                >
                  {mascotDialogue}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Diorama Framework */}
            <div className="relative flex items-center justify-center">
              <SurfaceSnuggleNookDiorama
                mascot={currentMascot}
                signature={nookSignature}
                isPetting={false}
                isNight={isNight}
              />

              {/* Mascot Sitting in Surface Nest if here */}
              {mascotLocation.chamberId === 'surface' && (
                <div
                  onMouseDown={handleStartScruffHold}
                  onMouseUp={() => handleEndScruffHold()}
                  onTouchStart={handleStartScruffHold}
                  onTouchEnd={() => handleEndScruffHold()}
                  className="absolute z-10 top-8 cursor-grab active:cursor-grabbing flex flex-col items-center"
                  title="Tap-and-hold to scruff & stretch like neon dough!"
                >
                  <motion.div
                    animate={
                      isScruffHeld
                        ? {
                            scaleY: [1, 1.38, 1.32],
                            scaleX: [1, 0.78, 0.82],
                            y: [0, -18, -14],
                            rotate: [0, -4, 4, 0],
                          }
                        : {
                            scaleY: [1, 0.97, 1],
                            scaleX: [1, 1.02, 1],
                            y: [0, 2, 0],
                          }
                    }
                    transition={
                      isScruffHeld
                        ? { type: 'tween', duration: 0.35, ease: 'easeOut' }
                        : { type: 'tween', duration: 3.4, repeat: Infinity, ease: 'easeInOut' }
                    }
                  >
                    <MascotAvatar
                      mascot={currentMascot}
                      size="md"
                      showHairGlow={true}
                      isDancing={false}
                      isResting={mascotLocation.action === 'sleeping'}
                      enableMicroAnimations={true}
                    />
                  </motion.div>

                  {/* Scruff Stretching Tag */}
                  {isScruffHeld && (
                    <span className="px-2 py-0.5 rounded-full bg-pink-600 text-white text-[9px] font-black uppercase tracking-wider -mt-2 shadow-lg animate-pulse">
                      🤏 Scruff Grip! Drop to place
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Instruction Pill */}
            <div className="mt-1 flex items-center gap-1.5 text-[10px] text-slate-400 font-semibold bg-slate-950/60 px-3 py-0.5 rounded-full border border-slate-800">
              <Move className="w-3 h-3 text-amber-400" />
              <span>Tap & hold mascot by the scruff to stretch and drop into lower rooms!</span>
            </div>
          </div>
        </div>

        {/* ----------------------------------------------------------------------- */}
        {/* TRANSIT CHUTE & CROSS-CUT SOIL STRATA LAYER                             */}
        {/* ----------------------------------------------------------------------- */}
        <div
          ref={chuteRef}
          className="relative w-full py-4 px-4 bg-gradient-to-b from-[#1a1223] via-[#24172f] to-[#120e24] border-y-4 border-[#331c40] flex flex-col items-center overflow-hidden"
        >
          {/* Velvety Plush Earthen Edges with Exposed Roots & Glowing Neon Gems */}
          <div className="absolute inset-0 pointer-events-none opacity-50">
            {/* Cavern Stratum Rock Bandings */}
            <div className="absolute top-2 inset-x-0 h-1 bg-[#432357]/40 blur-xs" />
            <div className="absolute top-8 inset-x-0 h-1.5 bg-[#5b2b78]/30 blur-xs" />
            <div className="absolute bottom-4 inset-x-0 h-2 bg-[#2d183d]/50 blur-xs" />

            {/* Exposed Glowing Roots & Mineral Veins */}
            <svg viewBox="0 0 600 120" className="w-full h-full opacity-60">
              <path d="M 0 20 Q 80 40 160 25 T 320 50 T 480 30 T 600 45" fill="none" stroke="#a855f7" strokeWidth="2" opacity="0.6" strokeDasharray="6 4" />
              <path d="M 20 80 Q 140 100 240 75 T 420 90 T 580 70" fill="none" stroke="#06b6d4" strokeWidth="1.5" opacity="0.5" strokeDasharray="4 4" />
            </svg>
          </div>

          {/* Sleepy Burrowing Beetle 1 in the Dirt Strata */}
          <div
            onClick={() => handleTapSleepyBug('bug_strata_1')}
            className="absolute left-6 top-6 z-20 cursor-pointer p-1.5 rounded-xl bg-slate-950/80 border border-purple-500/40 hover:border-purple-400 transition-all flex items-center gap-1 shadow-md group"
            title="Tap sleepy dirt bug!"
          >
            <span className="text-sm transition-transform group-hover:scale-125">🪲</span>
            <span className="text-[9px] font-bold text-purple-300">
              {glowingBugStates['bug_strata_1'] ? '✨ Chirp!' : 'Sleepy Burrow Bug'}
            </span>
          </div>

          {/* Sleepy Burrowing Beetle 2 on the right */}
          <div
            onClick={() => handleTapSleepyBug('bug_strata_2')}
            className="absolute right-6 top-6 z-20 cursor-pointer p-1.5 rounded-xl bg-slate-950/80 border border-cyan-500/40 hover:border-cyan-400 transition-all flex items-center gap-1 shadow-md group"
            title="Tap sleepy dirt bug!"
          >
            <span className="text-sm transition-transform group-hover:scale-125">🐛</span>
            <span className="text-[9px] font-bold text-cyan-300">
              {glowingBugStates['bug_strata_2'] ? '✨ Glow!' : 'Glow-Caterpillar'}
            </span>
          </div>

          {/* The Translucent Suction Pipe / Transit Chute */}
          <div className="relative z-10 flex flex-col items-center">
            <span className="text-[9px] font-black uppercase text-cyan-300 tracking-wider mb-1 bg-slate-950/80 px-2 py-0.5 rounded-full border border-cyan-500/40">
              Depth -2.5m • Translucent Neon Suction Chute
            </span>

            {/* Suction Pipe Visual Architecture */}
            <div className="relative w-48 h-20 rounded-2xl border-2 border-cyan-400/60 bg-gradient-to-b from-cyan-950/40 via-cyan-900/20 to-cyan-950/60 shadow-[0_0_25px_rgba(6,182,212,0.35)] flex items-center justify-center overflow-hidden">
              {/* Internal Suction Rings */}
              <div className="absolute inset-y-0 left-4 w-1.5 bg-cyan-400/50 rounded-full blur-[1px]" />
              <div className="absolute inset-y-0 left-16 w-1.5 bg-cyan-400/70 rounded-full blur-[1px]" />
              <div className="absolute inset-y-0 right-16 w-1.5 bg-cyan-400/70 rounded-full blur-[1px]" />
              <div className="absolute inset-y-0 right-4 w-1.5 bg-cyan-400/50 rounded-full blur-[1px]" />

              {/* Mascot whooshing inside transit chute */}
              {isZippingChute ? (
                <motion.div
                  initial={{ x: zippingDirection === 'down' ? -80 : 80, scale: 0.7 }}
                  animate={{ x: zippingDirection === 'down' ? 80 : -80, scale: [0.7, 1.1, 0.7] }}
                  transition={{ type: 'tween', duration: 0.65, ease: 'easeInOut' }}
                  className="flex items-center gap-1 text-cyan-200 font-black text-xs"
                >
                  <span className="text-xl animate-spin">🌀</span>
                  <span>{currentMascot.name} WHOOSH!</span>
                </motion.div>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleZipTransitChute('down')}
                    className="px-2.5 py-1 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/40 border border-cyan-400 text-[10px] font-black text-cyan-200 flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                  >
                    <span>Slide Down</span>
                    <ArrowDown className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => handleZipTransitChute('up')}
                    className="px-2.5 py-1 rounded-xl bg-amber-500/20 hover:bg-amber-500/40 border border-amber-400 text-[10px] font-black text-amber-200 flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                  >
                    <ArrowUp className="w-3 h-3" />
                    <span>Climb Up</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ----------------------------------------------------------------------- */}
        {/* TIER 1 & BEYOND: EXCAVATED SUBTERRANEAN CHAMBERS (Three-Plane Depth)     */}
        {/* ----------------------------------------------------------------------- */}
        <div ref={denTopRef} className="relative w-full p-4 flex flex-col gap-5">
          {DEN_CHAMBERS.map((chamber) => {
            const isExcavated = excavatedChamberIds.includes(chamber.id);
            const isMascotInThisChamber = mascotLocation.chamberId === chamber.id;
            const cubby = chamber.wallCubby;

            return (
              <div
                key={chamber.id}
                className={`relative w-full rounded-3xl border-2 transition-all duration-500 overflow-hidden shadow-2xl flex flex-col ${
                  isExcavated
                    ? 'border-indigo-500/40 bg-gradient-to-b ' + chamber.bgGradient
                    : 'border-dashed border-amber-700/50 bg-[#160c1c]'
                }`}
                style={{
                  minHeight: '260px',
                }}
              >
                {/* =============================================================== */}
                {/* 1. BACKDROP LAYER (Wallpapers, Neon Signs, Fairy Lights, Veins)  */}
                {/* =============================================================== */}
                <div className="absolute inset-0 pointer-events-none z-0">
                  {/* Rounded Cavity Soft Shadow Contour */}
                  <div className="absolute inset-0 shadow-[inset_0_0_70px_rgba(0,0,0,0.85)]" />

                  {/* Bioluminescent glow pool */}
                  <div
                    className="absolute -bottom-8 inset-x-12 h-24 rounded-full blur-3xl opacity-30"
                    style={{ background: chamber.neonAccent }}
                  />

                  {/* Ambient Sparkling Dust Particles for Bioluminescent Neon Aesthetic */}
                  {isNeonFxActive && (
                    <div className="absolute inset-0 pointer-events-none overflow-hidden">
                      {[12, 28, 45, 62, 78, 90].map((leftPct, idx) => (
                        <div
                          key={idx}
                          className="absolute w-1.5 h-1.5 rounded-full animate-ping opacity-75"
                          style={{
                            left: `${leftPct}%`,
                            top: `${25 + ((idx * 13) % 55)}%`,
                            background: chamber.neonAccent,
                            animationDuration: `${2.2 + idx * 0.4}s`,
                            animationDelay: `${idx * 0.35}s`,
                            boxShadow: `0 0 8px ${chamber.neonAccent}`,
                          }}
                        />
                      ))}
                      {[22, 52, 82].map((leftPct, idx) => (
                        <div
                          key={`star-${idx}`}
                          className="absolute text-xs select-none animate-pulse"
                          style={{
                            left: `${leftPct}%`,
                            top: `${30 + idx * 16}%`,
                            color: '#ffffff',
                            animationDuration: `${2.5 + idx * 0.6}s`,
                            textShadow: `0 0 10px ${chamber.neonAccent}, 0 0 16px ${chamber.neonAccent}`,
                          }}
                        >
                          ✦
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Drifting Bioluminescent Fireflies & Glowing Dust Motes Layer */}
                  {isFirefliesActive && (
                    <div className="absolute inset-0 pointer-events-none overflow-hidden z-1">
                      {/* Luminous Cave Dust Motes */}
                      {[
                        { left: '15%', top: '35%', delay: '0s', dur: '7s', color: '#fef08a' },
                        { left: '32%', top: '68%', delay: '1.5s', dur: '8.5s', color: '#a3e635' },
                        { left: '52%', top: '28%', delay: '0.8s', dur: '6.5s', color: '#67e8f9' },
                        { left: '70%', top: '72%', delay: '2.2s', dur: '9s', color: '#fbcfe8' },
                        { left: '86%', top: '42%', delay: '1.2s', dur: '7.8s', color: '#fef08a' },
                      ].map((mote, mIdx) => (
                        <div
                          key={`mote-${mIdx}`}
                          className="absolute w-1.5 h-1.5 rounded-full blur-[0.5px] animate-pulse"
                          style={{
                            left: mote.left,
                            top: mote.top,
                            background: mote.color,
                            boxShadow: `0 0 7px ${mote.color}`,
                            animationDelay: mote.delay,
                            animationDuration: mote.dur,
                          }}
                        />
                      ))}

                      {/* Gentle Animated Drifting Cave Fireflies */}
                      {[
                        { id: 'ch_ff1', left: '24%', top: '45%', color: '#bef264', glow: 'rgba(190,242,100,0.6)', delay: '0.3s', dur: '3.4s', name: 'Mossfire' },
                        { id: 'ch_ff2', left: '56%', top: '32%', color: '#38bdf8', glow: 'rgba(56,189,248,0.6)', delay: '1.1s', dur: '2.9s', name: 'Moonwhisper' },
                        { id: 'ch_ff3', left: '78%', top: '58%', color: '#fde047', glow: 'rgba(253,224,71,0.6)', delay: '1.8s', dur: '3.6s', name: 'Glimmerwing' },
                      ].map((ff) => (
                        <div
                          key={ff.id}
                          className="absolute pointer-events-auto cursor-pointer group select-none transition-transform hover:scale-150"
                          style={{
                            left: ff.left,
                            top: ff.top,
                            animation: `bounce ${ff.dur} infinite ease-in-out`,
                            animationDelay: ff.delay,
                          }}
                          onClick={() => {
                            SoundEngine.playTileStep();
                            triggerFloatingParticle('✨', `${ff.name} firefly blinked playfully!`);
                          }}
                          title={`Tap ${ff.name} firefly!`}
                        >
                          {/* Soft Light Halo */}
                          <div
                            className="absolute -inset-2 rounded-full blur-[4px] animate-ping opacity-60"
                            style={{ background: ff.glow }}
                          />
                          {/* Translucent Wings */}
                          <div className="absolute -top-1 -left-1 flex gap-0.5 opacity-80">
                            <span className="w-1.5 h-0.5 rounded-full bg-white/90 rotate-[-25deg]" />
                            <span className="w-1.5 h-0.5 rounded-full bg-white/90 rotate-[25deg]" />
                          </div>
                          {/* Glowing Abdomen */}
                          <div
                            className="w-2 h-2 rounded-full border border-white/60"
                            style={{
                              background: ff.color,
                              boxShadow: `0 0 10px ${ff.color}`,
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Hanging fairy string lights across ceiling */}
                  <div className="absolute top-2 inset-x-4 flex items-center justify-between opacity-70">
                    <span className="w-2 h-2 rounded-full blur-xs" style={{ background: chamber.neonAccent }} />
                    <span className="w-2.5 h-2.5 rounded-full blur-xs bg-amber-400" />
                    <span className="w-2 h-2 rounded-full blur-xs bg-pink-400" />
                    <span className="w-2.5 h-2.5 rounded-full blur-xs bg-cyan-400" />
                    <span className="w-2 h-2 rounded-full blur-xs" style={{ background: chamber.neonAccent }} />
                  </div>
                </div>

                {/* Header Information: Depth & Cavern Silhouette */}
                <div className="relative z-10 flex items-start justify-between p-3.5 pb-1 flex-wrap gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full bg-slate-900/90 text-slate-300 border border-slate-700 text-[9px] font-black uppercase">
                        Depth -{chamber.depthMeters}.0m • {chamber.tierLevel}
                      </span>
                      <span
                        className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase"
                        style={{
                          background: `${chamber.neonAccent}22`,
                          color: chamber.neonAccent,
                          border: `1px solid ${chamber.neonAccent}44`,
                        }}
                      >
                        {chamber.shapeSilhouette.replace('_', ' ')}
                      </span>
                    </div>
                    <h3 className="text-sm font-black text-white mt-1">{chamber.name}</h3>
                    <p className="text-[10px] text-slate-300 max-w-sm">{chamber.description}</p>
                  </div>

                  {/* Transit connector label */}
                  <div className="flex items-center gap-1.5 bg-slate-950/80 px-2.5 py-1 rounded-xl border border-slate-800 text-[10px] font-bold text-cyan-300">
                    <span>{chamber.transitConnector.icon}</span>
                    <span>{chamber.transitConnector.label}</span>
                  </div>
                </div>

                {/* IF NOT EXCAVATED: Display Expandable Cavern Mining Wall */}
                {!isExcavated ? (
                  <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-6 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-amber-950/80 border-2 border-amber-500/50 flex items-center justify-center text-3xl shadow-xl mb-2">
                      ⛏️
                    </div>
                    <h4 className="text-sm font-black text-amber-200">Unexcavated Cavern Strata</h4>
                    <p className="text-xs text-slate-400 max-w-sm mt-0.5">
                      Rich with glowing thermal gems & ancient coin caches! Dig out this chamber to expand your underground shadowbox.
                    </p>

                    <div className="mt-3 flex items-center gap-3">
                      <button
                        disabled={playerCoins < chamber.excavationCost}
                        onClick={() => handleExcavate(chamber)}
                        className={`px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-xl transition-all cursor-pointer ${
                          playerCoins >= chamber.excavationCost
                            ? 'bg-gradient-to-r from-amber-400 via-orange-500 to-pink-500 text-slate-950 hover:scale-105 active:scale-95'
                            : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                        }`}
                      >
                        <Pickaxe className="w-4 h-4 stroke-[2.5]" />
                        <span>Dig Out Cavern ({chamber.excavationCost.toLocaleString()} Coins)</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  /* IF EXCAVATED: Render Midground Plane (Floor + Furniture Nodes + Mascot + Cubby) */
                  <div className="relative z-10 flex-1 flex flex-col justify-end p-3 pt-2">
                    {/* Speech Quote if mascot here */}
                    <AnimatePresence>
                      {mascotDialogue && isMascotInThisChamber && (
                        <motion.div
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className="self-center mb-1 px-3 py-1 rounded-xl bg-slate-950/95 border border-fuchsia-400 text-[10px] font-bold text-white shadow-xl text-center max-w-[280px]"
                        >
                          {mascotDialogue}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* =========================================================== */}
                    {/* 2. MIDGROUND PLANE: Walkable Floor Strip & Snap Nodes        */}
                    {/* =========================================================== */}
                    <div className="relative w-full rounded-2xl bg-gradient-to-r from-slate-950/90 via-slate-900/80 to-slate-950/90 border border-slate-800/80 p-2 shadow-inner">
                      {/* Floorboard / Moss Slat Overlay */}
                      <div className="absolute inset-x-0 bottom-0 h-2 bg-[#20152c] rounded-b-2xl border-t border-purple-500/20" />

                      {/* Snap Nodes (Left, Center, Right) + Mascot Life */}
                      <div className="grid grid-cols-3 gap-2 relative z-10 items-end min-h-[120px]">
                        {chamber.snapNodes.map((node) => {
                          const slotKey = `${chamber.id}_${node.id}`;
                          const furnitureId = roomPlacements[slotKey];
                          const furniture = DEN_FURNITURE_CATALOG.find((f) => f.id === furnitureId);
                          const isMascotHere =
                            isMascotInThisChamber && mascotLocation.nodeId === node.id;

                          return (
                            <div
                              key={node.id}
                              onMouseUp={() => handleEndScruffHold(chamber.id, node.id)}
                              onTouchEnd={() => handleEndScruffHold(chamber.id, node.id)}
                              className={`relative rounded-2xl p-2 flex flex-col items-center justify-end transition-all min-h-[105px] border ${
                                isScruffHeld
                                  ? 'border-dashed border-pink-400/80 bg-pink-950/20 animate-pulse'
                                  : furniture
                                  ? 'border-slate-800 bg-slate-950/40 hover:border-slate-700'
                                  : 'border-dashed border-slate-800/80 hover:border-slate-700'
                              }`}
                            >
                              {/* Node Label Pill */}
                              <span className="absolute top-1 text-[8px] font-black uppercase text-slate-500 tracking-wider">
                                {node.label}
                              </span>

                              {/* MASCOT DIRECT PROP SNAPPING & PHYSICAL QUIRKS */}
                              {isMascotHere && (
                                <div
                                  onMouseDown={handleStartScruffHold}
                                  onMouseUp={() => handleEndScruffHold()}
                                  onTouchStart={handleStartScruffHold}
                                  onTouchEnd={() => handleEndScruffHold()}
                                  className="relative z-20 -mb-2 cursor-grab active:cursor-grabbing flex flex-col items-center"
                                  title="Tap-and-hold to scruff!"
                                >
                                  <motion.div
                                    animate={
                                      isScruffHeld
                                        ? { scaleY: 1.35, scaleX: 0.82, y: -16 }
                                        : mascotLocation.action === 'bouncing'
                                        ? { y: [0, -22, 0], scaleY: [1, 1.15, 0.9, 1] }
                                        : mascotLocation.action === 'sleeping'
                                        ? { y: [0, 2, 0], scaleY: [1, 0.92, 1], scaleX: [1, 1.06, 1] }
                                        : mascotLocation.action === 'lofi_dance'
                                        ? { y: [0, -6, 0], rotate: [0, -4, 4, 0] }
                                        : { y: [0, -2, 0] }
                                    }
                                    transition={
                                      mascotLocation.action === 'bouncing'
                                        ? { type: 'tween', duration: 0.55, repeat: Infinity, ease: 'easeInOut' }
                                        : mascotLocation.action === 'lofi_dance'
                                        ? { type: 'tween', duration: 0.65, repeat: Infinity, ease: 'easeInOut' }
                                        : { type: 'tween', duration: 2.8, repeat: Infinity, ease: 'easeInOut' }
                                    }
                                  >
                                    <MascotAvatar
                                      mascot={currentMascot}
                                      size="sm"
                                      showHairGlow={false}
                                      isResting={mascotLocation.action === 'sleeping'}
                                      isDancing={mascotLocation.action === 'lofi_dance'}
                                    />
                                  </motion.div>

                                  {/* Action indicator tag */}
                                  {mascotLocation.action === 'sleeping' && (
                                    <span className="text-[9px] text-amber-300 font-bold -mt-1">💤 zzz</span>
                                  )}
                                  {mascotLocation.action === 'bouncing' && (
                                    <span className="text-[9px] text-fuchsia-300 font-bold -mt-1">🤸 BOING!</span>
                                  )}
                                </div>
                              )}

                              {/* Placed Furniture Stage */}
                              {furniture ? (
                                <div
                                  onClick={() => snapMascotToNode(chamber.id, node.id)}
                                  className="flex flex-col items-center gap-1 cursor-pointer group"
                                >
                                  <div
                                    className="p-2 rounded-xl border flex items-center justify-center transition-transform group-hover:scale-105 shadow-md"
                                    style={{
                                      borderColor: furniture.previewColor,
                                      background: `${furniture.previewColor}18`,
                                    }}
                                  >
                                    <span className="text-2xl filter drop-shadow">{furniture.icon}</span>
                                  </div>
                                  <span className="text-[9px] font-black text-white text-center leading-tight truncate max-w-[80px]">
                                    {furniture.name}
                                  </span>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setActivePickingSlot(slotKey)}
                                  className="w-full py-1.5 rounded-xl bg-slate-900/60 hover:bg-slate-800 text-[9px] font-black uppercase text-slate-400 hover:text-white flex items-center justify-center gap-1 border border-slate-800 cursor-pointer"
                                >
                                  <Plus className="w-3 h-3" />
                                  <span>Place</span>
                                </button>
                              )}

                              {/* Remove / Swap furniture buttons */}
                              {furniture && (
                                <div className="mt-1 flex items-center gap-1">
                                  <button
                                    onClick={() => onPlaceFurniture(slotKey, null)}
                                    className="p-1 rounded bg-slate-900 hover:bg-rose-950 text-slate-500 hover:text-rose-400 text-[8px] cursor-pointer"
                                    title="Remove item"
                                  >
                                    <Trash2 className="w-2.5 h-2.5" />
                                  </button>
                                  <button
                                    onClick={() => setActivePickingSlot(slotKey)}
                                    className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[8px] font-bold cursor-pointer"
                                  >
                                    Swap
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* =========================================================== */}
                    {/* 3. WALL-CUTOUT CUBBIES (Secret Alcoves In Dirt Side Walls)   */}
                    {/* =========================================================== */}
                    {cubby && (
                      <div
                        onClick={() => snapMascotToNode(chamber.id, 'cubby')}
                        className={`absolute top-12 ${
                          cubby.side === 'left' ? 'left-2' : 'right-2'
                        } z-20 cursor-pointer p-2 rounded-2xl bg-slate-950/95 border-2 shadow-xl transition-all hover:scale-105 active:scale-95 flex items-center gap-2 group`}
                        style={{
                          borderColor: cubby.glowColor,
                          boxShadow: `0 0 16px ${cubby.glowColor}44`,
                        }}
                        title={`Secret Wall Cubby: ${cubby.name}`}
                      >
                        <div
                          className="w-8 h-8 rounded-xl flex items-center justify-center text-lg shrink-0"
                          style={{ background: `${cubby.glowColor}25` }}
                        >
                          {cubby.icon}
                        </div>
                        <div className="flex flex-col text-left pr-1">
                          <span className="text-[8px] font-black uppercase text-amber-400">
                            Wall Cubby
                          </span>
                          <span className="text-[10px] font-black text-white leading-tight">
                            {cubby.name}
                          </span>
                        </div>

                        {/* Mascot peeking out of the cubby if inside */}
                        {isMascotInThisChamber && mascotLocation.nodeId === 'cubby' && (
                          <div className="ml-1 px-1.5 py-0.5 rounded-full bg-fuchsia-600 text-white text-[9px] font-black uppercase animate-bounce">
                            Peeking Out! {cubby.itemHeldEmoji}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* =============================================================== */}
                {/* 4. FOREGROUND FRAME: Plush Earthen Edges, Roots, Spores, Gems   */}
                {/* =============================================================== */}
                <div className="absolute inset-0 pointer-events-none z-30">
                  {/* Curved plush earth framing arch */}
                  <svg viewBox="0 0 800 260" className="w-full h-full" preserveAspectRatio="none">
                    {/* Left plush earth curve */}
                    <path
                      d="M 0 0 C 40 40 40 220 0 260 L 0 0 Z"
                      fill={chamber.wallStrataColor}
                      opacity="0.75"
                    />
                    {/* Right plush earth curve */}
                    <path
                      d="M 800 0 C 760 40 760 220 800 260 L 800 0 Z"
                      fill={chamber.wallStrataColor}
                      opacity="0.75"
                    />
                  </svg>
                  {/* Drifting spore dust particles */}
                  <div className="absolute top-8 right-16 w-1.5 h-1.5 rounded-full bg-cyan-300 blur-xs opacity-70 animate-pulse" />
                  <div className="absolute bottom-10 left-20 w-1 h-1 rounded-full bg-pink-300 blur-xs opacity-60 animate-pulse" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. THEMED FURNITURE & DECOR CATALOG WORKSHOP                              */}
      {/* ========================================================================= */}
      <div ref={catalogRef} className="w-full flex flex-col gap-3 p-4 rounded-3xl bg-slate-950/90 border border-slate-800 shadow-xl mt-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Den Furniture & Decor Workshop</span>
            </h3>
            <p className="text-[10px] text-slate-400">
              Unlock authentic Cyber-Pastel, Bioluminescent Grotto, and Retro Cozy Plush decor!
            </p>
          </div>

          <div className="flex items-center gap-1 text-xs font-black text-amber-300 bg-amber-950/80 px-2.5 py-1 rounded-xl border border-amber-500/40">
            <Coins className="w-3.5 h-3.5 text-amber-400" />
            <span>{playerCoins.toLocaleString()} Coins</span>
          </div>
        </div>

        {/* Theme tabs */}
        <div className="grid grid-cols-4 gap-1 p-1 rounded-2xl bg-slate-900 border border-slate-800">
          {(
            [
              { id: 'all', label: 'All Sets' },
              { id: 'cyber_pastel', label: 'Cyber-Pastel' },
              { id: 'bioluminescent_grotto', label: 'Grotto' },
              { id: 'retro_plush', label: 'Retro Plush' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setSelectedThemeFilter(tab.id);
                SoundEngine.playTileStep();
              }}
              className={`py-1 px-1 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer truncate ${
                selectedThemeFilter === tab.id
                  ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Catalog Items */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {filteredFurniture.map((item) => {
            const isUnlocked = unlockedFurnitureIds.includes(item.id);
            const canAfford = playerCoins >= item.cost;

            return (
              <div
                key={item.id}
                className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-start justify-between gap-2.5 hover:border-slate-700 transition-all shadow-md"
              >
                <div className="flex items-start gap-2.5 min-w-0">
                  <div
                    className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl shrink-0 shadow-inner"
                    style={{
                      background: `${item.previewColor}22`,
                      border: `1.5px solid ${item.previewColor}66`,
                    }}
                  >
                    {item.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-black text-white truncate">{item.name}</span>
                      <span
                        className="text-[8px] font-black uppercase px-1 rounded"
                        style={{ background: `${item.accentColor}33`, color: item.accentColor }}
                      >
                        {item.theme.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-300 leading-snug line-clamp-2 mt-0.5">
                      {item.description}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 flex flex-col items-end gap-1">
                  {isUnlocked ? (
                    <span className="px-2 py-1 rounded-xl bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 text-[9px] font-black flex items-center gap-1">
                      <Check className="w-3 h-3 text-emerald-400 stroke-[3]" />
                      <span>OWNED</span>
                    </span>
                  ) : (
                    <button
                      disabled={!canAfford}
                      onClick={() => {
                        onBuyFurniture(item.id, item.cost);
                        confetti({ particleCount: 35, spread: 50, origin: { y: 0.7 } });
                      }}
                      className={`px-2.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-md transition-all cursor-pointer ${
                        canAfford
                          ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 hover:brightness-110 active:scale-95'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                      }`}
                    >
                      <Coins className="w-3 h-3 fill-slate-950" />
                      <span>{item.cost.toLocaleString()}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. MODAL: PICK & PLACE FURNITURE INTO CHAMBER SNAP NODES                  */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {activePickingSlot && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md rounded-3xl bg-[#0b0e26] border-2 border-indigo-500/50 p-5 shadow-2xl flex flex-col gap-4 text-white max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <span className="text-[10px] text-amber-400 font-bold uppercase">
                    Den Snap Node Decor
                  </span>
                  <h3 className="text-base font-black">Choose Furniture Piece</h3>
                </div>
                <button
                  onClick={() => setActivePickingSlot(null)}
                  className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-[11px] text-slate-300">
                  Select an owned piece from your inventory to place at this floor node:
                </span>

                {unlockedFurnitureIds.map((furnId) => {
                  const item = DEN_FURNITURE_CATALOG.find((f) => f.id === furnId);
                  if (!item) return null;
                  const isCurrent = roomPlacements[activePickingSlot] === item.id;

                  return (
                    <div
                      key={item.id}
                      onClick={() => {
                        onPlaceFurniture(activePickingSlot, item.id);
                        setActivePickingSlot(null);
                        SoundEngine.playTileStep();
                      }}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isCurrent
                          ? 'bg-indigo-950/90 border-2 border-indigo-400 shadow-lg'
                          : 'bg-slate-900/80 hover:bg-slate-800/80 border-slate-800 hover:border-indigo-500/40'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{item.icon}</span>
                        <div>
                          <div className="text-xs font-black text-white">{item.name}</div>
                          <div className="text-[10px] text-slate-400">{item.description}</div>
                        </div>
                      </div>

                      {isCurrent ? (
                        <span className="text-[10px] font-black text-indigo-300 uppercase px-2 py-0.5 rounded bg-indigo-900/80">
                          Active
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-cyan-400">Place ➔</span>
                      )}
                    </div>
                  );
                })}
              </div>

              <button
                onClick={() => setActivePickingSlot(null)}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-black text-xs uppercase tracking-wider transition-colors cursor-pointer"
              >
                Done
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
