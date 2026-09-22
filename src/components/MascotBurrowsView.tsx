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
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Mascot, MascotBurrow, BurrowFeature, BurrowStyleOption } from '../types';
import { MascotAvatar } from './MascotAvatar';
import { SoundEngine } from '../utils/sound';

interface MascotBurrowsViewProps {
  mascots: Mascot[];
  activeMascot: Mascot;
  playerCoins: number;
  burrows: Record<string, MascotBurrow>;
  onSelectActiveMascot: (mascotId: string) => void;
  onUpgradeFeature: (mascotId: string, featureId: string, cost: number) => void;
  onSelectStyle: (mascotId: string, featureId: string, styleId: string) => void;
}

export const MascotBurrowsView: React.FC<MascotBurrowsViewProps> = ({
  mascots,
  activeMascot,
  playerCoins,
  burrows,
  onSelectActiveMascot,
  onUpgradeFeature,
  onSelectStyle,
}) => {
  const [selectedMascotId, setSelectedMascotId] = useState<string>(activeMascot.id);
  const [activeFeatureModal, setActiveFeatureModal] = useState<BurrowFeature | null>(null);
  const [mascotChatQuote, setMascotChatQuote] = useState<string | null>(null);
  const [heartsTrigger, setHeartsTrigger] = useState<number>(0);
  const [isPetting, setIsPetting] = useState<boolean>(false);

  const currentMascot = mascots.find((m) => m.id === selectedMascotId) || activeMascot;
  const currentBurrow = burrows[selectedMascotId] || burrows['pip'];

  // Mascot quotes when petted in their cat bed
  const cuteQuotes: Record<string, string[]> = {
    pip: [
      '*cooooo...* ❤️ My little cat bed is so warm and charged! ⚡',
      '*happy soft purr* That petting feels so nice, human friend! 🎧',
      '*melts down into cushion* Ahhh, perfectly cozy in my bed! ✨',
      '*soft electric coo* Purrrrr... thank you for the gentle pets! 🔋',
    ],
    boba: [
      '*cooooo...* ❤️ Sinking deep into my squishy cat bed! 🧋',
      '*gentle boba purr* Mochi softness is pure bliss! 🍡',
      '*happy sigh* Sinking into mochi cushions is the best feeling! ✨',
      '*coos softly* Petting right behind my ears is heavenly! 🍯',
    ],
    ziggy: [
      '*deep rumbling purr* The acoustics in this cat bed are supreme! 🎵',
      '*cooooo...* ❤️ Sinking deep into emerald velvet... 🐾',
      '*kneads paws softly* You know just how to pet a master ninja! ⚡',
      '*coos contentedly* Purrrrr... peak comfort attained! 💤',
    ],
    lulu: [
      '*sweet melodic coo...* ❤️ Celestial stardust warmth! 🌌',
      '*soft purr* Melting like warm cotton candy into my bed! 💖',
      '*coos and closes eyes* So dreamy and peaceful in here... ✨',
      '*happy little hum* More gentle pets please! 🌈',
    ],
  };

  const handlePetMascot = () => {
    SoundEngine.playCoo();
    setIsPetting(true);

    const quotes = cuteQuotes[currentMascot.id] || [
      '*cooooo...* ❤️ Purring softly in my cozy cat bed...',
      '*soft purr* That petting feels so wonderful! ✨',
      '*melts down into cushion* So warm and cozy in here...',
      '*happy soft coo* Best cat bed in the whole neon city! 🐾',
    ];
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
    setMascotChatQuote(randomQuote);
    setHeartsTrigger((prev) => prev + 1);

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
      {/* 1. Top Mascot Picker Carousel */}
      <div className="w-full overflow-x-auto no-scrollbar flex items-center gap-2 pb-1">
        {mascots.map((mascot) => {
          const isSelected = mascot.id === selectedMascotId;
          const isEquipped = mascot.id === activeMascot.id;
          const burrow = burrows[mascot.id];
          const burrowLvl = burrow?.features.reduce((sum, f) => sum + f.level, 0) || 0;

          return (
            <button
              key={mascot.id}
              onClick={() => {
                setSelectedMascotId(mascot.id);
                SoundEngine.playTileStep();
              }}
              className={`flex-shrink-0 flex items-center gap-2.5 px-3 py-2 rounded-2xl border transition-all text-left ${
                isSelected
                  ? 'bg-slate-800/90 border-2 shadow-lg scale-102'
                  : 'bg-slate-900/60 border-slate-800 hover:bg-slate-800/50 opacity-80'
              }`}
              style={{
                borderColor: isSelected ? mascot.furColor : undefined,
                boxShadow: isSelected ? `0 0 16px ${mascot.furColor}33` : undefined,
              }}
            >
              <div className="w-9 h-9 flex-shrink-0">
                <MascotAvatar mascot={mascot} size="sm" showHairGlow={false} interactive={false} />
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
                <div className="flex items-center gap-1 text-[10px] text-slate-400">
                  <Home className="w-3 h-3 text-amber-400" />
                  <span>Burrow Lv.{burrowLvl}</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* 2. Main Burrow Sanctuary Stage with 'Opening / Popping' Entrance Animation */}
      <motion.div
        key={currentBurrow.mascotId}
        initial={{
          opacity: 0,
          scale: 0.78,
          y: 36,
          rotateX: 12,
          filter: 'blur(6px)',
        }}
        animate={{
          opacity: 1,
          scale: 1,
          y: 0,
          rotateX: 0,
          filter: 'blur(0px)',
        }}
        transition={{
          type: 'spring',
          stiffness: 280,
          damping: 18,
          mass: 0.85,
        }}
        className={`w-full rounded-3xl p-4 border border-slate-800 relative overflow-hidden shadow-2xl bg-gradient-to-b ${currentBurrow.bgGradient}`}
        style={{
          boxShadow: `inset 0 0 80px rgba(0,0,0,0.6), 0 10px 30px rgba(0,0,0,0.5)`,
          transformOrigin: '50% 90%',
        }}
      >
        {/* Ambient Glow Orbs */}
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
          style={{ background: currentBurrow.themeColor }}
        />

        {/* Burrow Header Info */}
        <div className="relative z-10 flex items-start justify-between gap-2 mb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-slate-900/80 border border-slate-700/60 text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                <Sparkle className="w-2.5 h-2.5" />
                Mascot Burrow
              </span>
              {currentMascot.id !== activeMascot.id && (
                <button
                  onClick={() => {
                    onSelectActiveMascot(currentMascot.id);
                    SoundEngine.playPowerup();
                  }}
                  className="px-2 py-0.5 rounded-md bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-[10px] font-bold transition-all"
                >
                  Set as Active Companion
                </button>
              )}
            </div>
            <h2 className="text-base font-black text-white mt-1">{currentBurrow.name}</h2>
            <p className="text-[11px] text-slate-300 max-w-[270px]">{currentBurrow.subtitle}</p>
          </div>

          {/* Burrow Comfort Metric */}
          <div className="flex flex-col items-end">
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

        {/* Mascot Center Stage with Interactive Speech Bubble */}
        <motion.div
          initial={{ scale: 0.4, opacity: 0, y: 22 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{
            type: 'spring',
            stiffness: 320,
            damping: 16,
            delay: 0.1,
          }}
          className="relative z-10 flex flex-col items-center justify-center my-2"
        >
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
                className="absolute -top-4 pointer-events-none flex gap-2 text-pink-400"
              >
                <Heart className="w-5 h-5 fill-pink-500" />
                <Heart className="w-4 h-4 fill-rose-400" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Interactive Cat Bed Stage */}
          <div
            onClick={handlePetMascot}
            className="cursor-pointer group relative flex flex-col items-center select-none"
            title="Tap to pet and interact"
          >
            {/* The Cat Bed Assembly */}
            <div className="relative w-60 h-36 flex items-center justify-center">
              {/* 1. Floor Ambient Underglow & Soft Bed Shadow */}
              <div
                className="absolute bottom-1 w-44 h-8 rounded-full blur-md opacity-60 pointer-events-none"
                style={{ background: currentBurrow.themeColor }}
              />
              <div className="absolute bottom-0 w-48 h-6 rounded-full bg-slate-950/80 blur-sm pointer-events-none" />

              {/* 2. Cat Bed Back Bolster with Cute Cat Ears */}
              <div className="absolute inset-x-0 bottom-3 top-0 flex items-center justify-center pointer-events-none">
                <svg viewBox="0 0 220 120" className="w-60 h-32 overflow-visible drop-shadow-xl">
                  <defs>
                    <linearGradient id={`bedOuterGrad-${currentMascot.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor={`${currentBurrow.themeColor}dd`} />
                      <stop offset="50%" stopColor="#1e293b" />
                      <stop offset="100%" stopColor="#0f172a" />
                    </linearGradient>
                    <linearGradient id={`bedInnerCushion-${currentMascot.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#090d16" />
                      <stop offset="50%" stopColor={`${currentBurrow.themeColor}33`} />
                      <stop offset="100%" stopColor="#020617" />
                    </linearGradient>
                    <radialGradient id={`bedGlow-${currentMascot.id}`} cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor={currentMascot.furColor} stopOpacity="0.45" />
                      <stop offset="100%" stopColor="transparent" stopOpacity="0" />
                    </radialGradient>
                  </defs>

                  {/* Left Cat Ear on Bed Rim */}
                  <polygon
                    points="42,40 22,8 62,24"
                    fill={`url(#bedOuterGrad-${currentMascot.id})`}
                    stroke={currentBurrow.themeColor}
                    strokeWidth="2.5"
                    strokeLinejoin="round"
                  />
                  <polygon points="40,36 26,14 54,26" fill={currentMascot.furColor} opacity="0.65" />

                  {/* Right Cat Ear on Bed Rim */}
                  <polygon
                    points="178,40 198,8 158,24"
                    fill={`url(#bedOuterGrad-${currentMascot.id})`}
                    stroke={currentBurrow.themeColor}
                    strokeWidth="2.5"
                    strokeLinejoin="round"
                  />
                  <polygon points="180,36 194,14 166,26" fill={currentMascot.furColor} opacity="0.65" />

                  {/* Back High Bolster Padded Rim */}
                  <path
                    d="M 22 72 C 22 22, 198 22, 198 72 C 198 102, 22 102, 22 72 Z"
                    fill={`url(#bedOuterGrad-${currentMascot.id})`}
                    stroke={currentBurrow.themeColor}
                    strokeWidth="3"
                  />

                  {/* Inner Sunken Plush Cushion (where mascot rests) */}
                  <ellipse
                    cx="110"
                    cy="75"
                    rx="80"
                    ry="35"
                    fill={`url(#bedInnerCushion-${currentMascot.id})`}
                    stroke={`${currentBurrow.themeColor}66`}
                    strokeWidth="1.5"
                  />
                  {/* Tufted Cushion Stitching Details */}
                  <ellipse
                    cx="110"
                    cy="76"
                    rx="54"
                    ry="21"
                    fill="none"
                    stroke={`${currentBurrow.themeColor}44`}
                    strokeWidth="1.5"
                    strokeDasharray="4 3"
                  />
                  {/* Warm Glowing Bed Center */}
                  <ellipse
                    cx="110"
                    cy="74"
                    rx="62"
                    ry="26"
                    fill={`url(#bedGlow-${currentMascot.id})`}
                  />
                </svg>
              </div>

              {/* 3. Mascot resting inside the cat bed - Snuggle Down on Pet, No Bouncing */}
              <motion.div
                animate={
                  isPetting
                    ? {
                        y: [0, 16, 14, 12], // settles down deeper into the cat bed cushion!
                        scaleY: [1, 0.85, 0.9, 0.93], // cute squish down into the plush bed
                        scaleX: [1, 1.1, 1.06, 1.04], // spreads out contentedly in the bed
                        rotate: [0, -1.5, 1.5, 0],
                      }
                    : {
                        y: [0, 2, 0], // very calm, slow resting breath, NO BOUNCING
                        scaleY: [1, 0.985, 1],
                        scaleX: [1, 1.01, 1],
                        rotate: [0, 0.5, -0.5, 0],
                      }
                }
                transition={
                  isPetting
                    ? { duration: 0.65, ease: 'easeOut' }
                    : { duration: 3.5, repeat: Infinity, ease: 'easeInOut' }
                }
                className="relative z-10 -mt-2 flex items-center justify-center pointer-events-none"
              >
                <div className="w-24 h-24 flex items-center justify-center">
                  <MascotAvatar
                    mascot={currentMascot}
                    size="md"
                    showHairGlow={true}
                    isDancing={false}
                    isResting={true}
                  />
                </div>
              </motion.div>

              {/* 4. Cat Bed Front Bolster (overlaps mascot base so they are truly tucked inside!) */}
              <motion.div
                animate={
                  isPetting
                    ? { scaleY: [1, 0.93, 0.97, 1], y: [0, 3, 1, 0] }
                    : { scaleY: 1, y: 0 }
                }
                transition={{ duration: 0.65, ease: 'easeOut' }}
                className="absolute bottom-1 w-56 h-14 pointer-events-none z-20 flex items-end justify-center"
              >
                <svg viewBox="0 0 208 56" className="w-56 h-14 overflow-visible drop-shadow-md">
                  <defs>
                    <linearGradient id={`frontBolsterGrad-${currentMascot.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#1e293b" />
                      <stop offset="45%" stopColor="#0f172a" />
                      <stop offset="100%" stopColor="#020617" />
                    </linearGradient>
                  </defs>

                  {/* Front Bolster Padded Rolled Rim */}
                  <path
                    d="M 12 18 C 30 38, 178 38, 196 18 C 204 28, 200 48, 175 52 C 130 57, 78 57, 33 52 C 8 48, 4 28, 12 18 Z"
                    fill={`url(#frontBolsterGrad-${currentMascot.id})`}
                    stroke={currentBurrow.themeColor}
                    strokeWidth="2.5"
                  />

                  {/* Plush Trim Piping Highlight */}
                  <path
                    d="M 22 23 C 48 38, 160 38, 186 23"
                    fill="none"
                    stroke={`${currentBurrow.themeColor}aa`}
                    strokeWidth="2"
                    strokeLinecap="round"
                  />

                  {/* Cute Stitched Pawprint Emblem on Bed Front */}
                  <g transform="translate(104, 38)">
                    <circle cx="0" cy="0" r="3.5" fill={currentMascot.furColor} opacity="0.9" />
                    <circle cx="-5" cy="-4" r="1.8" fill={currentMascot.furColor} opacity="0.9" />
                    <circle cx="0" cy="-6" r="1.8" fill={currentMascot.furColor} opacity="0.9" />
                    <circle cx="5" cy="-4" r="1.8" fill={currentMascot.furColor} opacity="0.9" />
                  </g>
                </svg>
              </motion.div>
            </div>

            {/* Tap to pet and interact button indicator */}
            <div className="mt-2.5 flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/90 border border-slate-700/70 text-[11px] font-bold text-slate-300 group-hover:text-white group-hover:border-slate-500 transition-all shadow-md">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 group-hover:rotate-12 transition-transform" />
              <span>Tap to pet and interact</span>
            </div>
          </div>
        </motion.div>

        {/* 3. Burrow Decor Quick Tags (Visualizing Active Styles in Room) */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.16 }}
          className="relative z-10 grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-800/80"
        >
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
        </motion.div>
      </motion.div>

      {/* 4. Upgrade & Style Selection List */}
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
                  className={`flex-shrink-0 px-3 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all ${
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

              {/* Style Selector Pills (Choose between 3 distinct styles matching mascot) */}
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
                        className={`p-2 rounded-xl border text-left flex flex-col gap-1 transition-all relative ${
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

      {/* 5. Detailed Style Inspection Modal */}
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
                  className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
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
                className="w-full py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-xs font-black uppercase tracking-wider text-white transition-all"
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
