import React from 'react';
import { motion } from 'motion/react';
import { Mascot } from '../types';
import { MascotNookSignature } from '../data/undergroundDenData';

interface SurfaceSnuggleNookDioramaProps {
  mascot: Mascot;
  signature: MascotNookSignature;
  isPetting: boolean;
  isNight?: boolean;
}

export const SurfaceSnuggleNookDiorama: React.FC<SurfaceSnuggleNookDioramaProps> = ({
  mascot,
  signature,
  isPetting,
  isNight = false,
}) => {
  const { nestStructureType, nestThemeColor } = signature;

  return (
    <div className="relative w-72 h-44 flex items-center justify-center select-none">
      {/* 1. Ambient Glow Underlay (velvety soft pastel light on character fuzz) */}
      <div
        className="absolute bottom-2 w-52 h-12 rounded-full blur-xl opacity-60 pointer-events-none transition-all duration-700"
        style={{
          background: isNight ? `${nestThemeColor}55` : `${nestThemeColor}88`,
        }}
      />
      <div className="absolute bottom-0 w-56 h-6 rounded-full bg-slate-950/90 blur-sm pointer-events-none" />

      {/* 2. SVG Architectural Backdrop: Unique Diorama Structure per Mascot */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
        <svg viewBox="0 0 280 160" className="w-72 h-44 overflow-visible drop-shadow-2xl">
          <defs>
            <radialGradient id={`glowHalo-${mascot.id}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={nestThemeColor} stopOpacity={isNight ? '0.45' : '0.6'} />
              <stop offset="100%" stopColor="transparent" stopOpacity="0" />
            </radialGradient>

            <linearGradient id={`stumpWood-${mascot.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3d2b1f" />
              <stop offset="50%" stopColor="#251a14" />
              <stop offset="100%" stopColor="#140f0c" />
            </linearGradient>

            <linearGradient id={`mossGreen-${mascot.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#22c55e" />
              <stop offset="60%" stopColor="#15803d" />
              <stop offset="100%" stopColor="#14532d" />
            </linearGradient>

            <linearGradient id={`melonSkin-${mascot.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="25%" stopColor="#34d399" />
              <stop offset="50%" stopColor="#f43f5e" />
              <stop offset="100%" stopColor="#fb7185" />
            </linearGradient>

            <linearGradient id={`crystalGrad-${mascot.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#34d399" />
              <stop offset="50%" stopColor="#059669" />
              <stop offset="100%" stopColor="#064e3b" />
            </linearGradient>

            <linearGradient id={`shroomPurple-${mascot.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#f472b6" />
              <stop offset="50%" stopColor="#a855f7" />
              <stop offset="100%" stopColor="#4c1d95" />
            </linearGradient>
          </defs>

          {/* Ambient Glow Center */}
          <circle cx="140" cy="85" r="75" fill={`url(#glowHalo-${mascot.id})`} />

          {/* ================= TYPE 1: PIP - Hollowed-out Tree Trunk & Moss Knoll ================= */}
          {nestStructureType === 'stump_fluff' && (
            <g>
              {/* Back Hollow Trunk Wall */}
              <path
                d="M 40 120 C 40 35, 80 15, 140 15 C 200 15, 240 35, 240 120 Z"
                fill={`url(#stumpWood-${mascot.id})`}
                stroke="#573c2a"
                strokeWidth="3.5"
              />
              {/* Mossy Crest on Top of Trunk */}
              <path
                d="M 35 48 Q 70 20 140 22 Q 210 20 245 48 C 235 60 215 55 190 60 C 160 55 120 55 90 60 C 65 55 45 60 35 48 Z"
                fill={`url(#mossGreen-${mascot.id})`}
                stroke="#166534"
                strokeWidth="2"
              />
              {/* Glowing Golden Dewleaves */}
              <ellipse cx="65" cy="38" rx="8" ry="4" fill="#fde047" opacity="0.9" />
              <ellipse cx="215" cy="38" rx="8" ry="4" fill="#fde047" opacity="0.9" />
              {/* Golden neon fluff filling */}
              <ellipse cx="140" cy="98" rx="72" ry="32" fill="#451a03" stroke="#f59e0b" strokeWidth="2" />
              <ellipse cx="140" cy="96" rx="55" ry="22" fill="#78350f" opacity="0.7" />
            </g>
          )}

          {/* ================= TYPE 2: BOBA - Giant Hollowed Melon Slice ================= */}
          {nestStructureType === 'butterfly_melon' && (
            <g>
              {/* Back Melon Rim Arc */}
              <path
                d="M 30 115 C 40 25, 240 25, 250 115 C 200 135, 80 135, 30 115 Z"
                fill="#831843"
                stroke="#047857"
                strokeWidth="4"
              />
              {/* Juicy Melon Flesh Layer */}
              <path
                d="M 45 105 C 55 40, 225 40, 235 105 C 190 120, 90 120, 45 105 Z"
                fill={`url(#melonSkin-${mascot.id})`}
                opacity="0.85"
              />
              {/* Pastel Butterfly Companions Perched on Melon */}
              <g transform="translate(60, 40) rotate(-15)">
                <path d="M 0 0 C -8 -10 -15 -5 -10 2 C -15 8 -6 10 0 2 C 6 10 15 8 10 2 C 15 -5 8 -10 0 0 Z" fill="#38bdf8" />
              </g>
              <g transform="translate(220, 40) rotate(15)">
                <path d="M 0 0 C -8 -10 -15 -5 -10 2 C -15 8 -6 10 0 2 C 6 10 15 8 10 2 C 15 -5 8 -10 0 0 Z" fill="#f472b6" />
              </g>
              {/* Soft Melon Cradle Bed Base */}
              <ellipse cx="140" cy="100" rx="70" ry="28" fill="#500724" stroke="#f43f5e" strokeWidth="2" />
            </g>
          )}

          {/* ================= TYPE 3: ZIGGY - Iridescent Crystal Stalks & Hammock ================= */}
          {nestStructureType === 'crystal_stalks' && (
            <g>
              {/* Towering Quartz Crystal Stalks (Left) */}
              <polygon points="40,120 30,30 55,18 70,40 60,120" fill={`url(#crystalGrad-${mascot.id})`} stroke="#10b981" strokeWidth="2" />
              <polygon points="20,120 12,65 30,55 40,120" fill="#064e3b" stroke="#34d399" strokeWidth="1.5" />
              {/* Towering Quartz Crystal Stalks (Right) */}
              <polygon points="240,120 250,30 225,18 210,40 220,120" fill={`url(#crystalGrad-${mascot.id})`} stroke="#10b981" strokeWidth="2" />
              <polygon points="260,120 268,65 250,55 240,120" fill="#064e3b" stroke="#34d399" strokeWidth="1.5" />

              {/* Glowing crystal facets */}
              <line x1="55" y1="18" x2="50" y2="120" stroke="#6ee7b7" strokeWidth="1.5" opacity="0.7" />
              <line x1="225" y1="18" x2="230" y2="120" stroke="#6ee7b7" strokeWidth="1.5" opacity="0.7" />

              {/* Woven Velvet Hammock Strung Between Stalks */}
              <path
                d="M 50 48 Q 140 125 230 48 Q 140 145 50 48 Z"
                fill="#0f291e"
                stroke="#10b981"
                strokeWidth="2.5"
              />
              <path d="M 50 48 Q 140 125 230 48" fill="none" stroke="#34d399" strokeWidth="2" strokeDasharray="5 3" />
            </g>
          )}

          {/* ================= TYPE 4: KORA - Sea Grotto & Pearl Clam ================= */}
          {nestStructureType === 'coral_grotto' && (
            <g>
              {/* Back Giant Scalloped Clam Shell */}
              <path
                d="M 45 115 C 35 40, 100 15, 140 15 C 180 15, 245 40, 235 115 Z"
                fill="#0c4a6e"
                stroke="#06b6d4"
                strokeWidth="3"
              />
              {/* Shell Rib Ridges */}
              <path d="M 140 15 L 65 110 M 140 15 L 105 112 M 140 15 L 140 114 M 140 15 L 175 112 M 140 15 L 215 110" stroke="#38bdf8" strokeWidth="1.5" opacity="0.6" />
              {/* Bioluminescent Coral Anemones */}
              <circle cx="50" cy="100" r="10" fill="#f43f5e" opacity="0.8" />
              <circle cx="230" cy="100" r="10" fill="#ec4899" opacity="0.8" />
              <ellipse cx="140" cy="98" rx="68" ry="26" fill="#082f49" stroke="#0ea5e9" strokeWidth="2" />
            </g>
          )}

          {/* ================= TYPE 5: LULU - Giant Pastel Mushroom Cap & Cloud ================= */}
          {nestStructureType === 'cloud_cradle' && (
            <g>
              {/* Sturdy Mushroom Stem */}
              <path d="M 105 120 L 115 50 L 165 50 L 175 120 Z" fill="#4c1d95" opacity="0.5" />
              {/* Giant Overarching Velvety Mushroom Cap */}
              <path
                d="M 30 75 C 30 0, 250 0, 250 75 C 210 82, 70 82, 30 75 Z"
                fill={`url(#shroomPurple-${mascot.id})`}
                stroke="#f472b6"
                strokeWidth="3"
              />
              {/* Glowing Pastel Spots on Cap */}
              <ellipse cx="80" cy="35" rx="14" ry="10" fill="#fbcfe8" opacity="0.8" />
              <ellipse cx="140" cy="24" rx="16" ry="12" fill="#fdf2f8" opacity="0.9" />
              <ellipse cx="200" cy="35" rx="14" ry="10" fill="#fbcfe8" opacity="0.8" />
              {/* Fluffy Down Cloud Pillow Cradle */}
              <ellipse cx="140" cy="98" rx="72" ry="28" fill="#581c87" stroke="#ec4899" strokeWidth="2" />
            </g>
          )}
        </svg>
      </div>

      {/* 3. Front Fore-Bolster & Mascot Base Snuggle Cushion (overlaps mascot so they rest snugly INSIDE the nest!) */}
      <motion.div
        animate={
          isPetting
            ? { scaleY: [1, 0.92, 0.96, 1], y: [0, 4, 1, 0] }
            : { scaleY: 1, y: 0 }
        }
        transition={{ type: 'tween', ease: 'easeInOut', duration: 0.55 }}
        className="absolute bottom-1 w-64 h-16 pointer-events-none z-20 flex items-end justify-center"
      >
        <svg viewBox="0 0 240 60" className="w-64 h-16 overflow-visible drop-shadow-md">
          {/* Front Plush Bolster Lip */}
          <path
            d="M 20 20 C 40 40, 200 40, 220 20 C 230 32, 224 54, 195 57 C 145 61, 95 61, 45 57 C 16 54, 10 32, 20 20 Z"
            fill="#090d16"
            stroke={nestThemeColor}
            strokeWidth="2.5"
          />
          {/* Plush Piping Highlight */}
          <path
            d="M 32 25 C 60 40, 180 40, 208 25"
            fill="none"
            stroke={`${nestThemeColor}bb`}
            strokeWidth="2"
            strokeLinecap="round"
          />
          {/* Micro Stitched Paw / Leaf Icon */}
          <circle cx="120" cy="42" r="3.5" fill={nestThemeColor} />
          <circle cx="114" cy="37" r="1.8" fill={nestThemeColor} />
          <circle cx="120" cy="35" r="1.8" fill={nestThemeColor} />
          <circle cx="126" cy="37" r="1.8" fill={nestThemeColor} />
        </svg>
      </motion.div>
    </div>
  );
};
