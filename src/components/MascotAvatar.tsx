import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Mascot } from '../types';

interface MascotAvatarProps {
  mascot: Mascot;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showHairGlow?: boolean;
  interactive?: boolean;
  isDancing?: boolean;
  isResting?: boolean;
  enableMicroAnimations?: boolean;
  onClick?: () => void;
}

export const MascotAvatar: React.FC<MascotAvatarProps> = React.memo(({
  mascot,
  size = 'md',
  showHairGlow = true,
  interactive = true,
  isDancing = false,
  isResting = false,
  enableMicroAnimations = true,
  onClick,
}) => {
  const [isWinking, setIsWinking] = useState(false);
  const [isBlinking, setIsBlinking] = useState(false);
  const [isTwitching, setIsTwitching] = useState(false);

  // Micro-Animation Engine: Procedural Blinking & Twitching Loop
  useEffect(() => {
    if (!enableMicroAnimations || isDancing) return;

    let blinkTimeout: any;
    let blinkSecondTimeout: any;
    let twitchTimeout: any;
    let isMounted = true;

    // 1. Procedural Natural Blinking Loop (with random jitter & occasional double-blink)
    const scheduleNextBlink = () => {
      const nextDelay = 2600 + Math.random() * 2800; // 2.6s - 5.4s
      blinkTimeout = setTimeout(() => {
        if (!isMounted) return;
        setIsBlinking(true);

        const blinkDuration = 130;
        setTimeout(() => {
          if (!isMounted) return;
          setIsBlinking(false);

          // 25% chance of a cute rapid double-blink
          if (Math.random() < 0.25) {
            blinkSecondTimeout = setTimeout(() => {
              if (!isMounted) return;
              setIsBlinking(true);
              setTimeout(() => {
                if (!isMounted) return;
                setIsBlinking(false);
                scheduleNextBlink();
              }, 110);
            }, 80);
          } else {
            scheduleNextBlink();
          }
        }, blinkDuration);
      }, nextDelay);
    };

    // 2. Procedural Ear/Wing/Antennae Micro-Twitch Loop
    const scheduleNextTwitch = () => {
      const nextDelay = 3200 + Math.random() * 3000; // 3.2s - 6.2s
      twitchTimeout = setTimeout(() => {
        if (!isMounted) return;
        setIsTwitching(true);
        setTimeout(() => {
          if (!isMounted) return;
          setIsTwitching(false);
          scheduleNextTwitch();
        }, 360);
      }, nextDelay);
    };

    scheduleNextBlink();
    scheduleNextTwitch();

    return () => {
      isMounted = false;
      clearTimeout(blinkTimeout);
      clearTimeout(blinkSecondTimeout);
      clearTimeout(twitchTimeout);
    };
  }, [enableMicroAnimations, isDancing]);

  // Dimension mapping
  const dimensionMap = {
    sm: 'w-12 h-12',
    md: 'w-20 h-20',
    lg: 'w-32 h-32',
    xl: 'w-44 h-44',
  };

  const handleClick = () => {
    setIsWinking(true);
    setIsTwitching(true);
    setTimeout(() => {
      setIsWinking(false);
      setIsTwitching(false);
    }, 900);
    if (onClick) onClick();
  };

  // Determine character type
  const mascotId = (mascot.id || '').toLowerCase();
  const mascotName = (mascot.name || '').toLowerCase();

  const isPip = mascotId === 'pip' || mascotName.includes('pip') || mascotName.includes('leaf') || mascotName.includes('golden');
  const isBoba = mascotId === 'boba' || mascotName.includes('boba') || mascotName.includes('fox') || mascotName.includes('butterfly');
  const isZiggy = mascotId === 'ziggy' || mascotName.includes('ziggy') || mascotName.includes('panda') || mascotName.includes('dragonfly');
  const isKora = mascotId === 'kora' || mascotName.includes('kora') || mascotName.includes('coral') || mascotName.includes('sprite');
  const isLulu = mascotId === 'lulu' || mascotName.includes('lulu') || mascotName.includes('dew') || mascotName.includes('pink');

  // Ambient glow color
  const glowColor = isPip
    ? '#f59e0b'
    : isBoba
    ? '#f97316'
    : isZiggy
    ? '#c2410c'
    : isKora
    ? '#06b6d4'
    : isLulu
    ? '#f472b6'
    : mascot.furColor || '#8b5cf6';

  return (
    <motion.div
      className={`relative inline-block select-none ${dimensionMap[size]} ${
        interactive ? 'cursor-pointer' : ''
      }`}
      animate={
        isResting
          ? {
              y: [0, 2, 0],
              scaleY: [1, 0.965, 1],
              scaleX: [1, 1.025, 1],
              rotate: [0, -0.6, 0.6, 0],
            }
          : isDancing
          ? {
              y: [0, -10, 0, -6, 0],
              rotate: [0, -4, 4, -2, 0],
              scale: [1, 1.06, 0.98, 1.04, 1],
            }
          : enableMicroAnimations
          ? {
              // Smooth organic idle floating & breathing rhythm
              y: [0, -5, 0.8, -4, 0],
              rotate: [0, -1.4, 1.1, -0.7, 0],
              scaleY: [1, 1.028, 0.982, 1.015, 1],
              scaleX: [1, 0.985, 1.018, 0.99, 1],
            }
          : {
              y: [0, -4, 0],
              rotate: [0, 1.2, -1.2, 0],
            }
      }
      transition={{
        duration: isDancing ? 0.7 : isResting ? 3.5 : 3.8,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
      whileHover={interactive && !isResting ? { scale: 1.08, rotate: 2 } : undefined}
      whileTap={interactive && !isResting ? { scale: 0.94 } : undefined}
      onClick={handleClick}
    >
      {/* Background Soft Ambient Glow */}
      {showHairGlow && (
        <div
          className="absolute inset-0 rounded-full blur-xl opacity-60 pointer-events-none -z-10"
          style={{
            background: `radial-gradient(circle, ${glowColor} 0%, rgba(15,23,42,0.6) 50%, transparent 75%)`,
          }}
        />
      )}

      {/* Render Custom Photo if present */}
      {mascot.customPhotoUrl ? (
        <div className="relative w-full h-full rounded-2xl overflow-hidden border-2 border-cyan-400/80 shadow-[0_0_16px_rgba(6,182,212,0.5)]">
          <img
            src={mascot.customPhotoUrl}
            alt={mascot.name}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent pointer-events-none" />
        </div>
      ) : (
        /* Render SVG Avatar with micro-animation engine hooks */
        <svg
          viewBox="0 0 160 160"
          className="w-full h-full drop-shadow-[0_8px_16px_rgba(0,0,0,0.55)] overflow-visible"
        >
          {isPip && <PipGoldenLeafPuff isWinking={isWinking} isBlinking={isBlinking} isTwitching={isTwitching} />}
          {isBoba && <BobaButterflyFox isWinking={isWinking} isBlinking={isBlinking} isTwitching={isTwitching} />}
          {isZiggy && <ZiggyDragonflyPanda isWinking={isWinking} isBlinking={isBlinking} isTwitching={isTwitching} />}
          {isKora && <KoraCoralSprite isWinking={isWinking} isBlinking={isBlinking} isTwitching={isTwitching} />}
          {isLulu && <LuluPinkDewPuff isWinking={isWinking} isBlinking={isBlinking} isTwitching={isTwitching} />}
          {!isPip && !isBoba && !isZiggy && !isKora && !isLulu && (
            <GenericFuzzyMascot mascot={mascot} isWinking={isWinking} isBlinking={isBlinking} isTwitching={isTwitching} />
          )}
        </svg>
      )}

      {/* Level Badge Pill */}
      {size !== 'sm' && (
        <div
          className="absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider text-slate-900 border border-white/40 shadow-lg"
          style={{ background: glowColor }}
        >
          Lv.{mascot.level || 1}
        </div>
      )}
    </motion.div>
  );
});

// =========================================================================
// 1. PIP: THE GOLDEN LEAF-PUFF (Photo 1)
// Ultra-fluffy golden spherical puffball on a green leaf with big button eyes
// =========================================================================
function PipGoldenLeafPuff({
  isWinking,
  isBlinking,
  isTwitching,
}: {
  isWinking: boolean;
  isBlinking: boolean;
  isTwitching: boolean;
}) {
  return (
    <g id="mascot-pip-golden-leaf">
      <defs>
        {/* Leaf Gradients */}
        <linearGradient id="pipLeafGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4ade80" />
          <stop offset="40%" stopColor="#22c55e" />
          <stop offset="85%" stopColor="#15803d" />
          <stop offset="100%" stopColor="#14532d" />
        </linearGradient>
        {/* Golden Fur Gradient */}
        <radialGradient id="pipFurGrad" cx="45%" cy="40%" r="58%">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="35%" stopColor="#fcd34d" />
          <stop offset="70%" stopColor="#f59e0b" />
          <stop offset="92%" stopColor="#d97706" />
          <stop offset="100%" stopColor="#b45309" />
        </radialGradient>
        {/* Eye Depth Gradient */}
        <radialGradient id="pipEyeGrad" cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#262626" />
          <stop offset="60%" stopColor="#0a0a0a" />
          <stop offset="100%" stopColor="#000000" />
        </radialGradient>
        {/* Dewdrop Gradient */}
        <radialGradient id="pipDewGrad" cx="30%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
          <stop offset="40%" stopColor="#a7f3d0" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#059669" stopOpacity="0.2" />
        </radialGradient>
      </defs>

      {/* Lush Green Leaf Platform under the creature */}
      <g id="leaf-base">
        <path
          d="M 12 138 C 30 118, 70 122, 110 126 C 142 129, 155 142, 150 152 C 120 158, 60 156, 12 138 Z"
          fill="url(#pipLeafGrad)"
          stroke="#166534"
          strokeWidth="1.5"
        />
        {/* Leaf Central Vein */}
        <path
          d="M 18 139 Q 80 134 146 148"
          stroke="#86efac"
          strokeWidth="1.8"
          strokeLinecap="round"
          fill="none"
          opacity="0.8"
        />
        {/* Lateral Veins */}
        <path d="M 45 137 Q 52 143 55 148" stroke="#86efac" strokeWidth="1" fill="none" opacity="0.6" />
        <path d="M 75 136 Q 84 142 90 149" stroke="#86efac" strokeWidth="1" fill="none" opacity="0.6" />
        <path d="M 105 137 Q 115 143 125 150" stroke="#86efac" strokeWidth="1" fill="none" opacity="0.6" />
        {/* Dewdrops on leaf */}
        <ellipse cx="28" cy="136" rx="4.5" ry="3" fill="url(#pipDewGrad)" />
        <circle cx="27" cy="135" r="1.2" fill="#ffffff" />
        <ellipse cx="138" cy="146" rx="3.5" ry="2.2" fill="url(#pipDewGrad)" />
        <circle cx="137" cy="145" r="1" fill="#ffffff" />
      </g>

      {/* Tiny Fuzzy Golden Ears with Micro-Twitch Animation */}
      <motion.g
        id="pip-ears"
        animate={isTwitching ? { rotate: [-5, 7, -3, 0] } : { rotate: 0 }}
        transition={{ duration: 0.35, ease: 'easeInOut' }}
        style={{ transformOrigin: '80px 48px' }}
      >
        {/* Left ear */}
        <path
          d="M 48 46 Q 42 22 56 25 Q 66 32 63 50 Z"
          fill="#f59e0b"
          stroke="#d97706"
          strokeWidth="1.2"
        />
        <path d="M 50 42 Q 47 28 54 30 Q 59 36 57 45 Z" fill="#fed7aa" opacity="0.85" />
        {/* Right ear */}
        <path
          d="M 112 46 Q 118 22 104 25 Q 94 32 97 50 Z"
          fill="#f59e0b"
          stroke="#d97706"
          strokeWidth="1.2"
        />
        <path d="M 110 42 Q 113 28 106 30 Q 101 36 103 45 Z" fill="#fed7aa" opacity="0.85" />
      </motion.g>

      {/* Outer Fluffy Spiky Fur Halo */}
      <g id="pip-spiky-fur" fill="#f59e0b" opacity="0.95">
        <path d="M 42 38 Q 30 28 36 44 Q 24 38 30 54 Q 18 52 26 68 Q 14 70 24 84 Q 16 90 28 100 Q 22 108 36 116 Q 32 124 48 126 Z" />
        <path d="M 118 38 Q 130 28 124 44 Q 136 38 130 54 Q 142 52 134 68 Q 146 70 136 84 Q 144 90 132 100 Q 138 108 124 116 Q 128 124 112 126 Z" />
        <path d="M 52 30 Q 64 16 72 28 Q 80 14 88 28 Q 96 16 108 30 Z" />
      </g>

      {/* Main Fluffy Spherical Golden Body */}
      <ellipse
        cx="80"
        cy="80"
        rx="52"
        ry="46"
        fill="url(#pipFurGrad)"
        stroke="#d97706"
        strokeWidth="1.5"
      />

      {/* Soft Fluffy Highlight Sheen on forehead and cheeks */}
      <ellipse cx="80" cy="56" rx="26" ry="14" fill="#fef08a" opacity="0.5" />
      <ellipse cx="50" cy="85" rx="16" ry="12" fill="#fef9c3" opacity="0.35" />
      <ellipse cx="110" cy="85" rx="16" ry="12" fill="#fef9c3" opacity="0.35" />

      {/* Tiny Golden Paws resting on the leaf */}
      <g id="pip-paws">
        <ellipse cx="64" cy="123" rx="10" ry="6" fill="#fbbf24" stroke="#d97706" strokeWidth="1.2" />
        <ellipse cx="96" cy="123" rx="10" ry="6" fill="#fbbf24" stroke="#d97706" strokeWidth="1.2" />
        <path d="M 61 121 Q 61 126 61 128" stroke="#b45309" strokeWidth="1" strokeLinecap="round" />
        <path d="M 67 121 Q 67 126 67 128" stroke="#b45309" strokeWidth="1" strokeLinecap="round" />
        <path d="M 93 121 Q 93 126 93 128" stroke="#b45309" strokeWidth="1" strokeLinecap="round" />
        <path d="M 99 121 Q 99 126 99 128" stroke="#b45309" strokeWidth="1" strokeLinecap="round" />
      </g>

      {/* Big Glossy Button Eyes with Micro-Blink Keyframes */}
      <g id="pip-eyes">
        {isBlinking ? (
          /* Closed Happy Squint Lashes during procedural micro-blink */
          <>
            <path d="M 50 74 Q 62 84 74 74" stroke="#171717" strokeWidth="3.5" strokeLinecap="round" fill="none" />
            <path d="M 86 74 Q 98 84 110 74" stroke="#171717" strokeWidth="3.5" strokeLinecap="round" fill="none" />
          </>
        ) : (
          <>
            {/* Left Eye */}
            <ellipse cx="62" cy="74" rx="15" ry="16" fill="url(#pipEyeGrad)" stroke="#171717" strokeWidth="1.2" />
            <circle cx="67" cy="68" r="5" fill="#ffffff" />
            <circle cx="57" cy="80" r="2.2" fill="#ffffff" opacity="0.85" />
            <ellipse cx="64" cy="84" rx="4" ry="1.5" fill="#ffffff" opacity="0.35" />

            {/* Right Eye */}
            {isWinking ? (
              <path
                d="M 87 76 Q 98 64 109 76"
                stroke="#171717"
                strokeWidth="3.5"
                strokeLinecap="round"
                fill="none"
              />
            ) : (
              <>
                <ellipse cx="98" cy="74" rx="15" ry="16" fill="url(#pipEyeGrad)" stroke="#171717" strokeWidth="1.2" />
                <circle cx="103" cy="68" r="5" fill="#ffffff" />
                <circle cx="93" cy="80" r="2.2" fill="#ffffff" opacity="0.85" />
                <ellipse cx="100" cy="84" rx="4" ry="1.5" fill="#ffffff" opacity="0.35" />
              </>
            )}
          </>
        )}
      </g>

      {/* Cute Kitten ":3" Smile and Tiny Snout */}
      <g id="pip-mouth">
        <ellipse cx="80" cy="81" rx="3.5" ry="2.5" fill="#78350f" />
        <path
          d="M 72 86 Q 76 92 80 88 Q 84 92 88 86"
          stroke="#78350f"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
        <path d="M 77 88 Q 80 94 83 88 Z" fill="#fb7185" opacity="0.9" />
      </g>
    </g>
  );
}

// =========================================================================
// 2. BOBA: THE BUTTERFLY FOX (Photo 2)
// Cute baby fox with chubby cream cheeks, blue butterfly on cheek, pink on ear
// =========================================================================
function BobaButterflyFox({
  isWinking,
  isBlinking,
  isTwitching,
}: {
  isWinking: boolean;
  isBlinking: boolean;
  isTwitching: boolean;
}) {
  return (
    <g id="mascot-boba-butterfly-fox" transform="rotate(-3 80 80)">
      <defs>
        <linearGradient id="foxGingerGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ea580c" />
          <stop offset="40%" stopColor="#f97316" />
          <stop offset="100%" stopColor="#fb923c" />
        </linearGradient>
        <radialGradient id="foxCheekGrad" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="70%" stopColor="#fef3c7" />
          <stop offset="100%" stopColor="#fed7aa" />
        </radialGradient>
        <linearGradient id="blueWingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#7dd3fc" />
          <stop offset="50%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#0284c7" />
        </linearGradient>
        <linearGradient id="pinkWingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fbcfe8" />
          <stop offset="60%" stopColor="#f472b6" />
          <stop offset="100%" stopColor="#db2777" />
        </linearGradient>
        <radialGradient id="foxWarmBg" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fef08a" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#ea580c" stopOpacity="0" />
        </radialGradient>
      </defs>

      <circle cx="80" cy="80" r="65" fill="url(#foxWarmBg)" />

      {/* Tall Alert Fox Ears with Micro-Twitch Animation */}
      <motion.g
        id="fox-ears"
        animate={isTwitching ? { rotate: [-6, 8, -4, 0] } : { rotate: 0 }}
        transition={{ duration: 0.35, ease: 'easeInOut' }}
        style={{ transformOrigin: '80px 60px' }}
      >
        {/* Left Ear */}
        <path
          d="M 38 64 Q 28 14 58 24 Q 72 44 64 68 Z"
          fill="url(#foxGingerGrad)"
          stroke="#c2410c"
          strokeWidth="1.5"
        />
        <path d="M 44 58 Q 38 28 54 32 Q 62 44 56 60 Z" fill="#fff7ed" />
        <path d="M 46 54 Q 42 34 50 38" stroke="#fbcfe8" strokeWidth="2.5" strokeLinecap="round" />

        {/* Right Ear */}
        <path
          d="M 122 64 Q 132 14 102 24 Q 88 44 96 68 Z"
          fill="url(#foxGingerGrad)"
          stroke="#c2410c"
          strokeWidth="1.5"
        />
        <path d="M 116 58 Q 122 28 106 32 Q 98 44 104 60 Z" fill="#fff7ed" />
        <path d="M 114 54 Q 118 34 110 38" stroke="#fbcfe8" strokeWidth="2.5" strokeLinecap="round" />

        {/* PASTEL PINK BUTTERFLY on Ear with Fluttering Micro-Animation */}
        <motion.g
          id="pink-ear-butterfly"
          transform="translate(116, 26) rotate(18)"
          animate={isTwitching ? { scaleX: [1, 0.3, 1.1, 1], rotate: [18, 30, 10, 18] } : { rotate: 18 }}
          transition={{ duration: 0.3 }}
        >
          <path d="M 0 0 C 6 -12, 18 -10, 16 0 C 18 10, 6 12, 0 0 Z" fill="url(#pinkWingGrad)" stroke="#9d174d" strokeWidth="0.8" />
          <path d="M 0 0 C -4 -10, -12 -8, -10 0 C -12 8, -4 10, 0 0 Z" fill="url(#pinkWingGrad)" stroke="#9d174d" strokeWidth="0.8" />
          <ellipse cx="0" cy="0" rx="1.5" ry="5" fill="#4c0519" />
          <path d="M 0 -4 Q -3 -8 -5 -9" stroke="#4c0519" strokeWidth="0.6" fill="none" />
          <path d="M 0 -4 Q 3 -8 5 -9" stroke="#4c0519" strokeWidth="0.6" fill="none" />
        </motion.g>
      </motion.g>

      {/* Fox Head & Fur Base */}
      <g id="fox-head">
        <ellipse cx="80" cy="80" rx="46" ry="42" fill="url(#foxGingerGrad)" />
        <path
          d="M 80 62 C 60 62, 24 74, 26 96 C 28 116, 56 122, 80 122 C 104 122, 132 116, 134 96 C 136 74, 100 62, 80 62 Z"
          fill="url(#foxCheekGrad)"
          stroke="#fed7aa"
          strokeWidth="1.2"
        />
        <path d="M 80 62 Q 74 74 76 86 L 84 86 Q 86 74 80 62 Z" fill="#ffffff" opacity="0.9" />
        <path d="M 26 92 Q 16 96 28 104" stroke="#fed7aa" strokeWidth="1.5" fill="none" />
        <path d="M 134 92 Q 144 96 132 104" stroke="#fed7aa" strokeWidth="1.5" fill="none" />
        <path d="M 64 120 Q 80 144 96 120" fill="#ffffff" stroke="#fed7aa" strokeWidth="1" />
      </g>

      {/* Soulful Big Dark Puppy Eyes with Micro-Blink */}
      <g id="fox-eyes">
        {isBlinking ? (
          <>
            <path d="M 52 78 Q 62 86 72 78" stroke="#0f172a" strokeWidth="3.2" strokeLinecap="round" fill="none" />
            <path d="M 88 78 Q 98 86 108 78" stroke="#0f172a" strokeWidth="3.2" strokeLinecap="round" fill="none" />
          </>
        ) : (
          <>
            {/* Left Eye */}
            <ellipse cx="62" cy="78" rx="12" ry="14" fill="#0f172a" stroke="#020617" strokeWidth="1.2" />
            <circle cx="66" cy="73" r="4.2" fill="#ffffff" />
            <circle cx="58" cy="84" r="1.8" fill="#ffffff" opacity="0.85" />

            {/* Right Eye */}
            {isWinking ? (
              <path d="M 88 80 Q 98 70 108 80" stroke="#0f172a" strokeWidth="3.2" strokeLinecap="round" fill="none" />
            ) : (
              <>
                <ellipse cx="98" cy="78" rx="12" ry="14" fill="#0f172a" stroke="#020617" strokeWidth="1.2" />
                <circle cx="102" cy="73" r="4.2" fill="#ffffff" />
                <circle cx="94" cy="84" r="1.8" fill="#ffffff" opacity="0.85" />
              </>
            )}
          </>
        )}
      </g>

      {/* Button Black Fox Nose & Gentle Mouth */}
      <g id="fox-snout">
        <ellipse cx="80" cy="94" rx="5" ry="3.5" fill="#0f172a" />
        <circle cx="79" cy="93" r="1.2" fill="#ffffff" opacity="0.8" />
        <path d="M 80 97.5 L 80 102" stroke="#0f172a" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M 75 102 Q 80 105 85 102" stroke="#0f172a" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      </g>

      {/* SKY-BLUE BUTTERFLY ON CHEEK with Wing Flutter Micro-Animation */}
      <motion.g
        id="blue-cheek-butterfly"
        transform="translate(42, 92) rotate(-14)"
        animate={isTwitching ? { scaleX: [1, 0.4, 1.15, 1] } : { scaleX: 1 }}
        transition={{ duration: 0.32 }}
      >
        <path d="M 0 0 C -12 -16, -26 -10, -22 2 C -18 10, -6 6, 0 0 Z" fill="url(#blueWingGrad)" stroke="#0369a1" strokeWidth="0.8" />
        <path d="M 0 0 C -16 6, -18 18, -6 16 C -2 14, 0 8, 0 0 Z" fill="url(#blueWingGrad)" stroke="#0369a1" strokeWidth="0.8" />
        <ellipse cx="0" cy="0" rx="1.6" ry="5.5" fill="#082f49" />
        <path d="M 0 -5 Q -2 -10 -4 -12" stroke="#082f49" strokeWidth="0.7" fill="none" />
        <path d="M 0 -5 Q 2 -10 4 -12" stroke="#082f49" strokeWidth="0.7" fill="none" />
      </motion.g>
    </g>
  );
}

// =========================================================================
// 3. ZIGGY: THE DRAGONFLY RED PANDA (Photo 3)
// Red panda cub with dragonflies on ears & blueberry basket
// =========================================================================
function ZiggyDragonflyPanda({
  isWinking,
  isBlinking,
  isTwitching,
}: {
  isWinking: boolean;
  isBlinking: boolean;
  isTwitching: boolean;
}) {
  return (
    <g id="mascot-ziggy-dragonfly-panda">
      <defs>
        <linearGradient id="pandaRussetGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ea580c" />
          <stop offset="50%" stopColor="#c2410c" />
          <stop offset="100%" stopColor="#9a3412" />
        </linearGradient>
        <linearGradient id="pandaDarkGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#451a03" />
          <stop offset="100%" stopColor="#1c0b02" />
        </linearGradient>
        <linearGradient id="dragonflyWingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#a5f3fc" stopOpacity="0.85" />
          <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.75" />
          <stop offset="100%" stopColor="#818cf8" stopOpacity="0.85" />
        </linearGradient>
        <radialGradient id="blueberryGrad" cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#60a5fa" />
          <stop offset="45%" stopColor="#2563eb" />
          <stop offset="85%" stopColor="#1e3a8a" />
          <stop offset="100%" stopColor="#0f172a" />
        </radialGradient>
      </defs>

      {/* Plush Striped Red Panda Tail */}
      <motion.g
        id="panda-tail"
        animate={isTwitching ? { rotate: [0, 8, -6, 0] } : { rotate: 0 }}
        transition={{ duration: 0.4 }}
        style={{ transformOrigin: '115px 125px' }}
      >
        <path
          d="M 115 110 C 145 105, 158 128, 142 144 C 128 155, 108 140, 110 128 Z"
          fill="url(#pandaRussetGrad)"
          stroke="#7c2d12"
          strokeWidth="1.2"
        />
        <path d="M 124 116 Q 134 126 122 138" stroke="#3b1b0b" strokeWidth="5" fill="none" opacity="0.85" />
        <path d="M 136 122 Q 146 132 134 144" stroke="#3b1b0b" strokeWidth="5" fill="none" opacity="0.85" />
      </motion.g>

      <ellipse cx="80" cy="115" rx="38" ry="28" fill="url(#pandaDarkGrad)" />

      {/* Fluffy Red Panda Ears with Micro-Twitching Dragonflies */}
      <motion.g
        id="panda-ears"
        animate={isTwitching ? { rotate: [-5, 7, -3, 0] } : { rotate: 0 }}
        transition={{ duration: 0.35 }}
        style={{ transformOrigin: '80px 50px' }}
      >
        {/* Left Ear */}
        <ellipse cx="46" cy="48" rx="16" ry="14" fill="#ffffff" />
        <ellipse cx="48" cy="49" rx="13" ry="11" fill="url(#pandaRussetGrad)" />
        <ellipse cx="50" cy="50" rx="8" ry="7" fill="#fef3c7" />

        {/* Right Ear */}
        <ellipse cx="114" cy="48" rx="16" ry="14" fill="#ffffff" />
        <ellipse cx="112" cy="49" rx="13" ry="11" fill="url(#pandaRussetGrad)" />
        <ellipse cx="110" cy="50" rx="8" ry="7" fill="#fef3c7" />

        {/* IRIDESCENT DRAGONFLY #1 on Left Ear with Flutter */}
        <motion.g
          id="dragonfly-left"
          transform="translate(42, 38) rotate(-18)"
          animate={isTwitching ? { rotate: [-18, -30, -8, -18], scale: [1, 1.15, 0.95, 1] } : { rotate: -18 }}
          transition={{ duration: 0.35 }}
        >
          <ellipse cx="-12" cy="-6" rx="14" ry="4" fill="url(#dragonflyWingGrad)" stroke="#06b6d4" strokeWidth="0.6" />
          <ellipse cx="-10" cy="3" rx="12" ry="3.5" fill="url(#dragonflyWingGrad)" stroke="#06b6d4" strokeWidth="0.6" />
          <rect x="-2" y="-12" width="3" height="18" rx="1.5" fill="#0891b2" />
          <circle cx="-0.5" cy="-12" r="2.2" fill="#0e7490" />
        </motion.g>

        {/* IRIDESCENT DRAGONFLY #2 on Right Ear with Flutter */}
        <motion.g
          id="dragonfly-right"
          transform="translate(118, 38) rotate(18)"
          animate={isTwitching ? { rotate: [18, 30, 8, 18], scale: [1, 1.15, 0.95, 1] } : { rotate: 18 }}
          transition={{ duration: 0.35 }}
        >
          <ellipse cx="12" cy="-6" rx="14" ry="4" fill="url(#dragonflyWingGrad)" stroke="#06b6d4" strokeWidth="0.6" />
          <ellipse cx="10" cy="3" rx="12" ry="3.5" fill="url(#dragonflyWingGrad)" stroke="#06b6d4" strokeWidth="0.6" />
          <rect x="-1" y="-12" width="3" height="18" rx="1.5" fill="#0891b2" />
          <circle cx="0.5" cy="-12" r="2.2" fill="#0e7490" />
        </motion.g>
      </motion.g>

      {/* Red Panda Head */}
      <g id="panda-head">
        <ellipse cx="80" cy="74" rx="42" ry="36" fill="url(#pandaRussetGrad)" />
        <ellipse cx="64" cy="58" rx="8" ry="6" fill="#ffffff" opacity="0.95" />
        <ellipse cx="96" cy="58" rx="8" ry="6" fill="#ffffff" opacity="0.95" />
        <ellipse cx="50" cy="82" rx="12" ry="10" fill="#ffffff" />
        <ellipse cx="110" cy="82" rx="12" ry="10" fill="#ffffff" />
        <ellipse cx="80" cy="86" rx="15" ry="12" fill="#ffffff" />
        <path d="M 60 76 Q 58 86 64 92" stroke="#c2410c" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        <path d="M 100 76 Q 102 86 96 92" stroke="#c2410c" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      </g>

      {/* Sweet Soulful Panda Eyes with Micro-Blink */}
      <g id="panda-eyes">
        {isBlinking ? (
          <>
            <path d="M 55 72 Q 64 80 73 72" stroke="#0f172a" strokeWidth="2.8" strokeLinecap="round" fill="none" />
            <path d="M 87 72 Q 96 80 105 72" stroke="#0f172a" strokeWidth="2.8" strokeLinecap="round" fill="none" />
          </>
        ) : (
          <>
            <ellipse cx="64" cy="72" rx="9" ry="11" fill="#0f172a" />
            <circle cx="67" cy="69" r="3.2" fill="#ffffff" />
            <circle cx="62" cy="77" r="1.4" fill="#ffffff" opacity="0.8" />

            {isWinking ? (
              <path d="M 88 74 Q 96 66 104 74" stroke="#0f172a" strokeWidth="2.8" strokeLinecap="round" fill="none" />
            ) : (
              <>
                <ellipse cx="96" cy="72" rx="9" ry="11" fill="#0f172a" />
                <circle cx="99" cy="69" r="3.2" fill="#ffffff" />
                <circle cx="94" cy="77" r="1.4" fill="#ffffff" opacity="0.8" />
              </>
            )}
          </>
        )}
      </g>

      {/* Black Button Nose & Mouth */}
      <g id="panda-snout">
        <ellipse cx="80" cy="84" rx="4.5" ry="3.2" fill="#0a0a0a" />
        <circle cx="79" cy="83" r="1" fill="#ffffff" opacity="0.75" />
        <path d="M 80 87.2 L 80 91" stroke="#0a0a0a" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M 76 91 Q 80 94 84 91" stroke="#0a0a0a" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      </g>

      <ellipse cx="60" cy="128" rx="10" ry="7" fill="url(#pandaDarkGrad)" />
      <ellipse cx="100" cy="128" rx="10" ry="7" fill="url(#pandaDarkGrad)" />

      {/* BASKET OF BLUEBERRIES */}
      <g id="blueberry-basket" transform="translate(18, 114)">
        <ellipse cx="16" cy="24" rx="15" ry="10" fill="#b45309" stroke="#78350f" strokeWidth="1.2" />
        <path d="M 4 23 Q 16 30 28 23" stroke="#d97706" strokeWidth="1.2" fill="none" />
        <path d="M 6 18 Q 16 26 26 18" stroke="#d97706" strokeWidth="1.2" fill="none" />
        <path d="M 5 20 C 5 6, 27 6, 27 20" stroke="#78350f" strokeWidth="1.8" fill="none" strokeLinecap="round" />
        <circle cx="10" cy="16" r="4.2" fill="url(#blueberryGrad)" />
        <circle cx="16" cy="14" r="4.6" fill="url(#blueberryGrad)" />
        <circle cx="22" cy="16" r="4.2" fill="url(#blueberryGrad)" />
        <circle cx="13" cy="20" r="4" fill="url(#blueberryGrad)" />
        <circle cx="19" cy="20" r="4.2" fill="url(#blueberryGrad)" />
      </g>
    </g>
  );
}

// =========================================================================
// 4. KORA: THE CORAL AQUA-SPRITE (Photo 4)
// Fluffy turquoise sprite with branching bioluminescent coral antlers
// =========================================================================
function KoraCoralSprite({
  isWinking,
  isBlinking,
  isTwitching,
}: {
  isWinking: boolean;
  isBlinking: boolean;
  isTwitching: boolean;
}) {
  return (
    <g id="mascot-kora-coral-sprite">
      <defs>
        <linearGradient id="koraAquaFur" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#2dd4bf" />
          <stop offset="45%" stopColor="#14b8a6" />
          <stop offset="100%" stopColor="#0f766e" />
        </linearGradient>
        <linearGradient id="koraCoralGrad" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#0d9488" />
          <stop offset="30%" stopColor="#06b6d4" />
          <stop offset="70%" stopColor="#67e8f9" />
          <stop offset="100%" stopColor="#cffafe" />
        </linearGradient>
        <radialGradient id="koraPinkMembrane" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fbcfe8" />
          <stop offset="60%" stopColor="#f472b6" />
          <stop offset="100%" stopColor="#db2777" />
        </radialGradient>
      </defs>

      <ellipse cx="80" cy="142" rx="46" ry="12" fill="#065f46" opacity="0.8" />
      <circle cx="55" cy="142" r="1.5" fill="#34d399" opacity="0.8" />
      <circle cx="105" cy="142" r="1.5" fill="#67e8f9" opacity="0.8" />

      {/* BRANCHING BIOLUMINESCENT CORAL ANTLERS with Micro-Twitch */}
      <motion.g
        id="kora-coral-antlers"
        animate={isTwitching ? { rotate: [-4, 5, -2, 0] } : { rotate: 0 }}
        transition={{ duration: 0.35 }}
        style={{ transformOrigin: '80px 56px' }}
      >
        {/* Left Coral Horn */}
        <path
          d="M 52 56 C 44 48, 30 40, 24 24 C 20 14, 28 8, 34 16 C 36 20, 38 24, 42 22 C 46 20, 48 10, 56 12 C 60 14, 58 22, 60 26 C 64 30, 72 26, 70 36 C 68 44, 62 52, 52 56 Z"
          fill="url(#koraCoralGrad)"
          stroke="#0891b2"
          strokeWidth="1.2"
        />
        <ellipse cx="45" cy="38" rx="8" ry="12" fill="url(#koraPinkMembrane)" opacity="0.85" />

        {/* Right Coral Horn */}
        <path
          d="M 108 56 C 116 48, 130 40, 136 24 C 140 14, 132 8, 126 16 C 124 20, 122 24, 118 22 C 114 20, 112 10, 104 12 C 100 14, 102 22, 100 26 C 96 30, 88 26, 90 36 C 92 44, 98 52, 108 56 Z"
          fill="url(#koraCoralGrad)"
          stroke="#0891b2"
          strokeWidth="1.2"
        />
        <ellipse cx="115" cy="38" rx="8" ry="12" fill="url(#koraPinkMembrane)" opacity="0.85" />

        <circle cx="30" cy="14" r="2.5" fill="#ffffff" opacity="0.9" />
        <circle cx="55" cy="13" r="2.5" fill="#ffffff" opacity="0.9" />
        <circle cx="130" cy="14" r="2.5" fill="#ffffff" opacity="0.9" />
        <circle cx="105" cy="13" r="2.5" fill="#ffffff" opacity="0.9" />
      </motion.g>

      <ellipse cx="80" cy="116" rx="34" ry="26" fill="url(#koraAquaFur)" />
      <ellipse cx="80" cy="78" rx="40" ry="35" fill="url(#koraAquaFur)" stroke="#0d9488" strokeWidth="1.2" />

      {/* GLOWING FOREHEAD CREST */}
      <g id="kora-forehead-crest" opacity="0.9">
        <path d="M 80 50 Q 82 58 80 64 Q 78 58 80 50 Z" fill="#a5f3fc" />
        <circle cx="80" cy="48" r="1.8" fill="#ffffff" />
        <circle cx="75" cy="54" r="1.2" fill="#67e8f9" />
        <circle cx="85" cy="54" r="1.2" fill="#67e8f9" />
      </g>

      <ellipse cx="56" cy="86" rx="8" ry="5" fill="#f472b6" opacity="0.55" />
      <ellipse cx="104" cy="86" rx="8" ry="5" fill="#f472b6" opacity="0.55" />

      {/* Soulful Deep Luminous Eyes with Micro-Blink */}
      <g id="kora-eyes">
        {isBlinking ? (
          <>
            <path d="M 54 75 Q 64 83 74 75" stroke="#0a192f" strokeWidth="3" strokeLinecap="round" fill="none" />
            <path d="M 86 75 Q 96 83 106 75" stroke="#0a192f" strokeWidth="3" strokeLinecap="round" fill="none" />
          </>
        ) : (
          <>
            <ellipse cx="64" cy="75" rx="11" ry="13" fill="#0a192f" stroke="#042f2e" strokeWidth="1.2" />
            <circle cx="67" cy="71" r="3.8" fill="#ffffff" />
            <circle cx="61" cy="80" r="1.6" fill="#ffffff" opacity="0.85" />
            <ellipse cx="64" cy="83" rx="4" ry="1.5" fill="#2dd4bf" opacity="0.5" />

            {isWinking ? (
              <path d="M 87 77 Q 96 68 105 77" stroke="#0a192f" strokeWidth="3" strokeLinecap="round" fill="none" />
            ) : (
              <>
                <ellipse cx="96" cy="75" rx="11" ry="13" fill="#0a192f" stroke="#042f2e" strokeWidth="1.2" />
                <circle cx="99" cy="71" r="3.8" fill="#ffffff" />
                <circle cx="93" cy="80" r="1.6" fill="#ffffff" opacity="0.85" />
                <ellipse cx="96" cy="83" rx="4" ry="1.5" fill="#2dd4bf" opacity="0.5" />
              </>
            )}
          </>
        )}
      </g>

      <g id="kora-snout">
        <ellipse cx="80" cy="85" rx="3" ry="2" fill="#042f2e" />
        <path d="M 77 90 Q 80 93 83 90" stroke="#042f2e" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      </g>

      <g id="kora-paws">
        <ellipse cx="66" cy="130" rx="9" ry="6" fill="#2dd4bf" stroke="#0f766e" strokeWidth="1" />
        <ellipse cx="94" cy="130" rx="9" ry="6" fill="#2dd4bf" stroke="#0f766e" strokeWidth="1" />
      </g>
    </g>
  );
}

// =========================================================================
// 5. LULU: THE PINK DEW-PUFF (Photo 5)
// Ultra-fluffy spherical baby-pink puffball with webbed feet on dewdrop leaf
// =========================================================================
function LuluPinkDewPuff({
  isWinking,
  isBlinking,
  isTwitching,
}: {
  isWinking: boolean;
  isBlinking: boolean;
  isTwitching: boolean;
}) {
  return (
    <g id="mascot-lulu-pink-dewpuff">
      <defs>
        <radialGradient id="luluPinkFur" cx="45%" cy="38%" r="60%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="30%" stopColor="#fdf2f8" />
          <stop offset="60%" stopColor="#fbcfe8" />
          <stop offset="85%" stopColor="#f472b6" />
          <stop offset="100%" stopColor="#db2777" />
        </radialGradient>
        <linearGradient id="luluLeafGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#86efac" />
          <stop offset="40%" stopColor="#22c55e" />
          <stop offset="90%" stopColor="#15803d" />
        </linearGradient>
        <radialGradient id="luluDewdropGrad" cx="30%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="50%" stopColor="#bae6fd" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#0284c7" stopOpacity="0.25" />
        </radialGradient>
      </defs>

      {/* Fresh Morning Dewdrop Leaf Platform */}
      <g id="lulu-leaf">
        <path
          d="M 8 136 C 30 114, 70 120, 110 124 C 145 128, 156 142, 152 154 C 118 160, 50 156, 8 136 Z"
          fill="url(#luluLeafGrad)"
          stroke="#166534"
          strokeWidth="1.5"
        />
        <path d="M 14 138 Q 78 132 148 148" stroke="#bbf7d0" strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.8" />
        <ellipse cx="24" cy="134" rx="5.5" ry="3.5" fill="url(#luluDewdropGrad)" />
        <circle cx="23" cy="133" r="1.4" fill="#ffffff" />
        <ellipse cx="140" cy="144" rx="4.5" ry="2.8" fill="url(#luluDewdropGrad)" />
        <circle cx="139" cy="143" r="1.2" fill="#ffffff" />
      </g>

      {/* Outer Fluffy Cotton Candy Spiky Fur Tufts with Micro-Twitch */}
      <motion.g
        id="lulu-fluff-tufts"
        fill="#fbcfe8"
        opacity="0.95"
        animate={isTwitching ? { scale: [1, 1.05, 0.98, 1] } : { scale: 1 }}
        transition={{ duration: 0.35 }}
        style={{ transformOrigin: '80px 78px' }}
      >
        <path d="M 40 38 Q 28 26 34 44 Q 22 38 28 54 Q 16 52 24 68 Q 14 72 22 86 Q 14 92 26 102 Q 20 110 34 118 Q 30 126 46 128 Z" />
        <path d="M 120 38 Q 132 26 126 44 Q 138 38 132 54 Q 144 52 136 68 Q 146 72 138 86 Q 146 92 134 102 Q 140 110 126 118 Q 130 126 114 128 Z" />
        <path d="M 50 28 Q 62 14 70 26 Q 80 12 90 26 Q 100 14 110 28 Z" />
      </motion.g>

      <ellipse
        cx="80"
        cy="78"
        rx="50"
        ry="45"
        fill="url(#luluPinkFur)"
        stroke="#f472b6"
        strokeWidth="1.2"
      />

      <ellipse cx="80" cy="54" rx="26" ry="14" fill="#ffffff" opacity="0.6" />
      <ellipse cx="52" cy="82" rx="14" ry="10" fill="#ffffff" opacity="0.4" />
      <ellipse cx="108" cy="82" rx="14" ry="10" fill="#ffffff" opacity="0.4" />
      <ellipse cx="48" cy="80" rx="11" ry="8" fill="#fb7185" opacity="0.75" />
      <ellipse cx="112" cy="80" rx="11" ry="8" fill="#fb7185" opacity="0.75" />

      {/* Webbed Pink Feet */}
      <g id="lulu-webbed-feet">
        <path d="M 54 120 L 44 133 Q 48 135 52 132 Q 55 135 59 132 Q 62 135 66 133 L 58 120 Z" fill="#fda4af" stroke="#f43f5e" strokeWidth="1.2" />
        <path d="M 106 120 L 96 133 Q 100 135 104 132 Q 107 135 111 132 Q 114 135 118 133 L 110 120 Z" fill="#fda4af" stroke="#f43f5e" strokeWidth="1.2" />
      </g>

      {/* Giant Glossy Button Eyes with Micro-Blink */}
      <g id="lulu-eyes">
        {isBlinking ? (
          <>
            <path d="M 52 74 Q 63 83 74 74" stroke="#18181b" strokeWidth="3.2" strokeLinecap="round" fill="none" />
            <path d="M 85 74 Q 96 83 107 74" stroke="#18181b" strokeWidth="3.2" strokeLinecap="round" fill="none" />
          </>
        ) : (
          <>
            <ellipse cx="64" cy="74" rx="14" ry="15" fill="#18181b" stroke="#09090b" strokeWidth="1.2" />
            <circle cx="68" cy="69" r="4.8" fill="#ffffff" />
            <circle cx="60" cy="79" r="2" fill="#ffffff" opacity="0.85" />
            <ellipse cx="65" cy="83" rx="3.5" ry="1.2" fill="#ffffff" opacity="0.3" />

            {isWinking ? (
              <path d="M 87 76 Q 97 65 107 76" stroke="#18181b" strokeWidth="3.2" strokeLinecap="round" fill="none" />
            ) : (
              <>
                <ellipse cx="96" cy="74" rx="14" ry="15" fill="#18181b" stroke="#09090b" strokeWidth="1.2" />
                <circle cx="100" cy="69" r="4.8" fill="#ffffff" />
                <circle cx="92" cy="79" r="2" fill="#ffffff" opacity="0.85" />
                <ellipse cx="97" cy="83" rx="3.5" ry="1.2" fill="#ffffff" opacity="0.3" />
              </>
            )}
          </>
        )}
      </g>

      <g id="lulu-snout">
        <ellipse cx="80" cy="80" rx="3.2" ry="2.2" fill="#9f1239" />
        <path d="M 77 84 Q 80 88 83 84" stroke="#9f1239" strokeWidth="1.6" strokeLinecap="round" fill="none" />
      </g>
    </g>
  );
}

// =========================================================================
// 6. DYNAMIC GENERIC FUZZY MASCOT (For custom player created mascots)
// =========================================================================
function GenericFuzzyMascot({
  mascot,
  isWinking,
  isBlinking,
  isTwitching,
}: {
  mascot: Mascot;
  isWinking: boolean;
  isBlinking: boolean;
  isTwitching: boolean;
}) {
  const fur = mascot.furColor || '#8b5cf6';
  const c1 = mascot.hairColors?.[0] || '#00f0ff';
  const c2 = mascot.hairColors?.[1] || '#ff007f';

  return (
    <g id="mascot-generic-fuzzy">
      <defs>
        <radialGradient id={`genGrad-${mascot.id}`} cx="45%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.4" />
          <stop offset="40%" stopColor={fur} />
          <stop offset="100%" stopColor="#1e1b4b" />
        </radialGradient>
      </defs>

      {/* Fuzzy Ears with Micro-Twitch */}
      <motion.g
        animate={isTwitching ? { rotate: [-6, 7, -3, 0] } : { rotate: 0 }}
        transition={{ duration: 0.35 }}
        style={{ transformOrigin: '80px 46px' }}
      >
        <ellipse cx="50" cy="46" rx="14" ry="16" fill={c1} stroke="#ffffff" strokeWidth="1" />
        <ellipse cx="50" cy="46" rx="8" ry="10" fill="#fbcfe8" />
        <ellipse cx="110" cy="46" rx="14" ry="16" fill={c2} stroke="#ffffff" strokeWidth="1" />
        <ellipse cx="110" cy="46" rx="8" ry="10" fill="#fbcfe8" />
      </motion.g>

      <ellipse cx="80" cy="82" rx="46" ry="42" fill={`url(#genGrad-${mascot.id})`} stroke="#ffffff" strokeWidth="1.2" />
      <ellipse cx="52" cy="88" rx="8" ry="5" fill="#f43f5e" opacity="0.6" />
      <ellipse cx="108" cy="88" rx="8" ry="5" fill="#f43f5e" opacity="0.6" />

      {/* Eyes with Micro-Blink */}
      <g>
        {isBlinking ? (
          <>
            <path d="M 54 76 Q 64 84 74 76" stroke="#0f172a" strokeWidth="2.8" strokeLinecap="round" fill="none" />
            <path d="M 86 76 Q 96 84 106 76" stroke="#0f172a" strokeWidth="2.8" strokeLinecap="round" fill="none" />
          </>
        ) : (
          <>
            <ellipse cx="64" cy="76" rx="10" ry="12" fill="#0f172a" />
            <circle cx="67" cy="72" r="3.5" fill="#ffffff" />

            {isWinking ? (
              <path d="M 88 78 Q 96 70 104 78" stroke="#0f172a" strokeWidth="2.8" strokeLinecap="round" fill="none" />
            ) : (
              <>
                <ellipse cx="96" cy="76" rx="10" ry="12" fill="#0f172a" />
                <circle cx="99" cy="72" r="3.5" fill="#ffffff" />
              </>
            )}
          </>
        )}
      </g>

      <ellipse cx="80" cy="86" rx="4" ry="2.8" fill="#1e1b4b" />
      <path d="M 76 90 Q 80 94 84 90" stroke="#1e1b4b" strokeWidth="1.8" strokeLinecap="round" fill="none" />
    </g>
  );
}
