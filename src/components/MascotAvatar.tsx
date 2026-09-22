import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Mascot } from '../types';

interface MascotAvatarProps {
  mascot: Mascot;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showHairGlow?: boolean;
  interactive?: boolean;
  isDancing?: boolean;
  isResting?: boolean;
  onClick?: () => void;
}

export const MascotAvatar: React.FC<MascotAvatarProps> = ({
  mascot,
  size = 'md',
  showHairGlow = true,
  interactive = true,
  isDancing = false,
  isResting = false,
  onClick,
}) => {
  const [isWinking, setIsWinking] = useState(false);

  // Size mappings
  const dimensionMap = {
    sm: 'w-12 h-12',
    md: 'w-20 h-20',
    lg: 'w-32 h-32',
    xl: 'w-44 h-44',
  };

  const hairColors = mascot.hairColors?.length > 0 
    ? mascot.hairColors 
    : ['#00f0ff', '#ff007f', '#ffe600'];

  const hairC1 = hairColors[0] || '#00f0ff';
  const hairC2 = hairColors[1] || '#ff007f';
  const hairC3 = hairColors[2] || hairColors[0] || '#ffe600';
  const hairC4 = hairColors[3] || hairColors[1] || '#39ff14';

  // Check if this is the pink mascot (Lulu or pink fur)
  const isPinkMascot = 
    mascot.id === 'lulu' || 
    mascot.furColor.toLowerCase() === '#ec4899' || 
    mascot.furColor.toLowerCase() === '#ff007f' || 
    mascot.furColor.toLowerCase() === '#f43f5e' ||
    (mascot.name && mascot.name.toLowerCase().includes('lulu'));

  const handleClick = () => {
    setIsWinking(true);
    setTimeout(() => setIsWinking(false), 900);
    if (onClick) onClick();
  };

  return (
    <motion.div
      className={`relative inline-block select-none ${dimensionMap[size]} ${
        interactive ? 'cursor-pointer' : ''
      }`}
      animate={
        isResting
          ? { y: 0, rotate: 0, scale: 1 }
          : isDancing
          ? {
              y: [0, -10, 0, -6, 0],
              rotate: [0, -4, 4, -2, 0],
              scale: [1, 1.05, 0.98, 1.04, 1],
            }
          : {
              y: [0, -4, 0],
              rotate: [0, 1.5, -1.5, 0],
            }
      }
      transition={{
        duration: isDancing ? 0.7 : 3,
        repeat: isResting ? 0 : Infinity,
        ease: 'easeInOut',
      }}
      whileHover={interactive && !isResting ? { scale: 1.08, rotate: 3 } : undefined}
      whileTap={interactive && !isResting ? { scale: 0.94 } : undefined}
      onClick={handleClick}
    >
      {/* Background Soft Neon Glow */}
      {showHairGlow && (
        <div
          className="absolute inset-0 rounded-full blur-xl opacity-60 pointer-events-none -z-10"
          style={{
            background: `radial-gradient(circle, ${hairC1} 0%, ${mascot.furColor} 45%, transparent 75%)`,
          }}
        />
      )}

      {/* Mascot Vector Render */}
      <svg
        viewBox="0 0 160 160"
        className="w-full h-full drop-shadow-[0_8px_16px_rgba(0,0,0,0.5)]"
      >
        <defs>
          {/* Hair Gradient 1 */}
          <linearGradient id={`hairGrad1-${mascot.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={hairC1} />
            <stop offset="50%" stopColor={hairC2} />
            <stop offset="100%" stopColor={hairC3} />
          </linearGradient>

          {/* Hair Gradient 2 */}
          <linearGradient id={`hairGrad2-${mascot.id}`} x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={hairC2} />
            <stop offset="60%" stopColor={hairC4} />
            <stop offset="100%" stopColor={hairC1} />
          </linearGradient>

          {/* Body Fur Radial Glow */}
          <radialGradient id={`bodyGrad-${mascot.id}`} cx="40%" cy="38%" r="62%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.35" />
            <stop offset="45%" stopColor={mascot.furColor} />
            <stop offset="100%" stopColor="#120c24" />
          </radialGradient>

          {/* Super Cute Anime Eye Gradient */}
          <radialGradient id={`eyeGrad-${mascot.id}`} cx="38%" cy="32%" r="68%">
            <stop offset="0%" stopColor="#1f2438" />
            <stop offset="50%" stopColor="#0a0d18" />
            <stop offset="80%" stopColor={mascot.eyesColor} />
            <stop offset="100%" stopColor="#ffffff" />
          </radialGradient>

          {/* Eye Lower Iris Luminous Arc */}
          <linearGradient id={`eyeShine-${mascot.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={mascot.eyesColor} stopOpacity="0" />
            <stop offset="65%" stopColor={mascot.eyesColor} stopOpacity="0.8" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.95" />
          </linearGradient>
        </defs>

        {/* NEON STRANDS PEEKING OUT FROM BEHIND THE FUR */}
        <g id="neon-strands-back">
          {/* Left cheek neon strands peeking out */}
          <path
            d="M 38 84 Q 14 83 18 76"
            stroke={hairC1}
            strokeWidth="2.4"
            strokeLinecap="round"
            fill="none"
            className="drop-shadow-[0_0_4px_rgba(0,240,255,0.8)]"
          />
          <path
            d="M 35 96 Q 10 98 14 91"
            stroke={hairC2}
            strokeWidth="2.6"
            strokeLinecap="round"
            fill="none"
            className="drop-shadow-[0_0_5px_rgba(255,0,127,0.8)]"
          />
          <path
            d="M 39 108 Q 16 114 22 120"
            stroke={hairC3}
            strokeWidth="2.2"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M 44 122 Q 24 130 30 135"
            stroke={hairC4}
            strokeWidth="1.8"
            strokeLinecap="round"
            fill="none"
          />

          {/* Right cheek neon strands peeking out */}
          <path
            d="M 122 84 Q 146 83 142 76"
            stroke={hairC2}
            strokeWidth="2.4"
            strokeLinecap="round"
            fill="none"
            className="drop-shadow-[0_0_5px_rgba(255,0,127,0.8)]"
          />
          <path
            d="M 125 96 Q 150 98 146 91"
            stroke={hairC1}
            strokeWidth="2.6"
            strokeLinecap="round"
            fill="none"
            className="drop-shadow-[0_0_4px_rgba(0,240,255,0.8)]"
          />
          <path
            d="M 121 108 Q 144 114 138 120"
            stroke={hairC4}
            strokeWidth="2.2"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M 116 122 Q 136 130 130 135"
            stroke={hairC3}
            strokeWidth="1.8"
            strokeLinecap="round"
            fill="none"
          />

          {/* Crown & Ear Base Neon Strands */}
          <path
            d="M 46 52 Q 28 44 34 35"
            stroke={hairC3}
            strokeWidth="2.2"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M 114 52 Q 132 44 126 35"
            stroke={hairC1}
            strokeWidth="2.2"
            strokeLinecap="round"
            fill="none"
          />
        </g>

        {/* Ears */}
        {mascot.earStyle === 'bunny' && (
          <g>
            {/* Left Ear */}
            <path
              d="M 45 65 C 30 15, 55 5, 60 55 Z"
              fill={mascot.furColor}
              stroke="#ffffff"
              strokeWidth="2.5"
            />
            <path
              d="M 46 55 C 38 25, 52 18, 56 50 Z"
              fill={hairC1}
              opacity="0.8"
            />
            {/* Fluffy tufts on ear base */}
            <circle cx="43" cy="62" r="6" fill={mascot.furColor} />
            <circle cx="48" cy="65" r="5" fill={mascot.furColor} />
            <path d="M 40 60 Q 32 55 36 50" stroke={hairC2} strokeWidth="1.6" strokeLinecap="round" fill="none" />

            {/* Right Ear */}
            <path
              d="M 115 65 C 130 15, 105 5, 100 55 Z"
              fill={mascot.furColor}
              stroke="#ffffff"
              strokeWidth="2.5"
            />
            <path
              d="M 114 55 C 122 25, 108 18, 104 50 Z"
              fill={hairC2}
              opacity="0.8"
            />
            {/* Fluffy tufts on ear base */}
            <circle cx="117" cy="62" r="6" fill={mascot.furColor} />
            <circle cx="112" cy="65" r="5" fill={mascot.furColor} />
            <path d="M 120 60 Q 128 55 124 50" stroke={hairC1} strokeWidth="1.6" strokeLinecap="round" fill="none" />
          </g>
        )}

        {mascot.earStyle === 'cat' && (
          <g>
            {/* Left Cat Ear */}
            <polygon
              points="38,70 28,32 62,50"
              fill={mascot.furColor}
              stroke="#ffffff"
              strokeWidth="2"
            />
            <polygon points="38,62 33,38 56,48" fill={hairC1} opacity="0.85" />
            <circle cx="34" cy="66" r="6" fill={mascot.furColor} />
            <path d="M 30 62 Q 22 58 26 50" stroke={hairC2} strokeWidth="1.6" strokeLinecap="round" fill="none" />

            {/* Right Cat Ear */}
            <polygon
              points="122,70 132,32 98,50"
              fill={mascot.furColor}
              stroke="#ffffff"
              strokeWidth="2"
            />
            <polygon points="122,62 127,38 104,48" fill={hairC2} opacity="0.85" />
            <circle cx="126" cy="66" r="6" fill={mascot.furColor} />
            <path d="M 130 62 Q 138 58 134 50" stroke={hairC1} strokeWidth="1.6" strokeLinecap="round" fill="none" />
          </g>
        )}

        {(mascot.earStyle === 'bear' || mascot.earStyle === 'fluff' || mascot.earStyle === 'tuft') && (
          <g>
            {/* Left Round Ear with extra fuzz */}
            <circle cx="44" cy="52" r="18" fill={mascot.furColor} stroke="#ffffff" strokeWidth="2" />
            <circle cx="44" cy="52" r="11" fill={hairC2} opacity="0.8" />
            <circle cx="33" cy="46" r="6" fill={mascot.furColor} />
            <circle cx="39" cy="38" r="5" fill={mascot.furColor} />
            <path d="M 34 40 Q 25 36 29 30" stroke={hairC1} strokeWidth="1.6" strokeLinecap="round" fill="none" />

            {/* Right Round Ear with extra fuzz */}
            <circle cx="116" cy="52" r="18" fill={mascot.furColor} stroke="#ffffff" strokeWidth="2" />
            <circle cx="116" cy="52" r="11" fill={hairC1} opacity="0.8" />
            <circle cx="127" cy="46" r="6" fill={mascot.furColor} />
            <circle cx="121" cy="38" r="5" fill={mascot.furColor} />
            <path d="M 126 40 Q 135 36 131 30" stroke={hairC2} strokeWidth="1.6" strokeLinecap="round" fill="none" />
          </g>
        )}

        {/* EXTRA FUZZY BODY WITH MULTI-LAYERED SCALLOPED TUFTS */}
        <g id="ultra-fuzzy-body">
          {/* Outer Layer: Fluffy perimeter fur tufts creating an adorable fuzzy cloud silhouette */}
          <g fill={mascot.furColor} opacity="0.95">
            {/* Left flank & cheek fluffy clusters */}
            <circle cx="42" cy="74" r="14" />
            <circle cx="32" cy="86" r="16" />
            <circle cx="28" cy="98" r="16" />
            <circle cx="32" cy="110" r="16" />
            <circle cx="40" cy="122" r="16" />
            <circle cx="52" cy="132" r="16" />

            {/* Right flank & cheek fluffy clusters */}
            <circle cx="118" cy="74" r="14" />
            <circle cx="128" cy="86" r="16" />
            <circle cx="132" cy="98" r="16" />
            <circle cx="128" cy="110" r="16" />
            <circle cx="120" cy="122" r="16" />
            <circle cx="108" cy="132" r="16" />

            {/* Bottom fluff scallops */}
            <circle cx="68" cy="138" r="16" />
            <circle cx="80" cy="140" r="17" />
            <circle cx="92" cy="138" r="16" />

            {/* Spiky-soft fur tuft accents on cheeks */}
            <path d="M 36 80 Q 20 86 32 92 Q 16 98 30 104 Q 22 110 38 114 Z" />
            <path d="M 124 80 Q 140 86 128 92 Q 144 98 130 104 Q 138 110 122 114 Z" />
          </g>

          {/* Main Body Center Core */}
          <circle cx="80" cy="98" r="48" fill={`url(#bodyGrad-${mascot.id})`} />

          {/* Front Fluff Overlap (extra fluffiness) */}
          <circle cx="38" cy="92" r="14" fill={mascot.furColor} />
          <circle cx="122" cy="92" r="14" fill={mascot.furColor} />
          <circle cx="46" cy="124" r="15" fill={mascot.furColor} />
          <circle cx="114" cy="124" r="15" fill={mascot.furColor} />

          {/* Soft cuddly belly patch */}
          <ellipse cx="80" cy="109" rx="27" ry="22" fill="#ffffff" opacity="0.22" />

          {/* Cute fuzzy tummy fur tuft lines */}
          <path
            d="M 73 108 Q 80 114 87 108"
            stroke={hairC1}
            strokeWidth="1.6"
            strokeLinecap="round"
            fill="none"
            opacity="0.8"
          />
          <path
            d="M 70 115 Q 80 122 90 115"
            stroke={hairC2}
            strokeWidth="1.6"
            strokeLinecap="round"
            fill="none"
            opacity="0.75"
          />
          <path
            d="M 75 122 Q 80 126 85 122"
            stroke={hairC3}
            strokeWidth="1.4"
            strokeLinecap="round"
            fill="none"
            opacity="0.7"
          />
        </g>

        {/* MULTICOLORED FUZZY HAIR / CREST / MOHAWK TUFTS */}
        <g id="multicolor-fuzzy-hair">
          {/* Back hair spray with neon glow */}
          <path
            d="M 52 48 C 45 18, 65 12, 70 42 C 72 14, 94 10, 92 40 C 98 16, 116 20, 108 48 Z"
            fill={`url(#hairGrad2-${mascot.id})`}
            filter="drop-shadow(0 2px 6px rgba(0,0,0,0.35))"
          />

          {/* Hair Wisps Peeking Higher */}
          <path d="M 64 36 Q 56 16 62 10" stroke={hairC1} strokeWidth="2.2" strokeLinecap="round" fill="none" />
          <path d="M 96 36 Q 104 16 98 10" stroke={hairC2} strokeWidth="2.2" strokeLinecap="round" fill="none" />

          {/* Front Vibrant Multicolored Locks */}
          {/* Lock 1 - Left strand */}
          <path
            d="M 55 46 C 42 22, 60 18, 66 40 Z"
            fill={hairC1}
            stroke="#ffffff"
            strokeWidth="1.6"
          />
          {/* Lock 2 - Center Left strand */}
          <path
            d="M 68 42 C 60 12, 82 8, 80 38 Z"
            fill={hairC2}
            stroke="#ffffff"
            strokeWidth="1.6"
          />
          {/* Lock 3 - Center Right high strand */}
          <path
            d="M 80 38 C 82 6, 102 12, 94 40 Z"
            fill={hairC3}
            stroke="#ffffff"
            strokeWidth="1.6"
          />
          {/* Lock 4 - Right strand */}
          <path
            d="M 94 42 C 104 20, 118 24, 106 48 Z"
            fill={hairC4}
            stroke="#ffffff"
            strokeWidth="1.6"
          />

          {/* Cute sparkle hair pin or tuft highlight */}
          <circle cx="68" cy="38" r="4" fill="#ffffff" opacity="0.9" />
          <circle cx="92" cy="36" r="3.5" fill="#ffffff" opacity="0.9" />
          <polygon
            points="80,18 82,23 87,25 82,27 80,32 78,27 73,25 78,23"
            fill="#ffffff"
            opacity="0.95"
          />
        </g>

        {/* MASCOT FACE: CUTER ANIME SPARKLE EYES, BLUSHING CHEEKS & EYELASHES */}
        <g id="face">
          {/* Blushing Glowing Neon Cheeks with anime sparkle marks */}
          <g>
            <ellipse cx="49" cy="100" rx="10" ry="6" fill="#ff007f" opacity="0.55" />
            {/* Chibi blush sparkle lines */}
            <line x1="44" y1="98" x2="47" y2="103" stroke="#ffffff" strokeWidth="1.4" strokeLinecap="round" opacity="0.75" />
            <line x1="50" y1="98" x2="53" y2="103" stroke="#ffffff" strokeWidth="1.4" strokeLinecap="round" opacity="0.75" />

            <ellipse cx="111" cy="100" rx="10" ry="6" fill="#ff007f" opacity="0.55" />
            {/* Chibi blush sparkle lines */}
            <line x1="107" y1="98" x2="110" y2="103" stroke="#ffffff" strokeWidth="1.4" strokeLinecap="round" opacity="0.75" />
            <line x1="113" y1="98" x2="116" y2="103" stroke="#ffffff" strokeWidth="1.4" strokeLinecap="round" opacity="0.75" />
          </g>

          {/* LEFT EYE (Bigger, rounder, glassy anime sparkle eye) */}
          <g id="left-eye">
            {/* Eye socket / deep velvety pupil base */}
            <ellipse cx="59" cy="87" rx="11" ry="13.5" fill={`url(#eyeGrad-${mascot.id})`} />
            
            {/* Lower Iris Glassy Luminous Crescent */}
            <path
              d="M 50 89 C 50 98, 68 98, 68 89 C 68 93.5, 50 93.5, 50 89 Z"
              fill={mascot.eyesColor}
              opacity="0.9"
            />
            {/* Bottom Glass Reflection Arc */}
            <path
              d="M 52 93 Q 59 99 66 93"
              stroke="#ffffff"
              strokeWidth="1.3"
              strokeLinecap="round"
              fill="none"
              opacity="0.9"
            />

            {/* Kawaii Catchlights (Multiple glassy sparkles) */}
            {/* Primary large glossy highlight */}
            <ellipse cx="56" cy="82" rx="4.8" ry="5.6" fill="#ffffff" transform="rotate(-15 56 82)" />
            {/* Secondary sweet bubble highlight */}
            <circle cx="64" cy="91" r="2.4" fill="#ffffff" />
            {/* Tiny starlight sparkle in iris */}
            <polygon
              points="63,84.5 64,85.7 65.2,86 64,86.3 63,87.5 62,86.3 60.8,86 62,85.7"
              fill="#ffffff"
              opacity="0.95"
            />

            {/* Cute Upper Eyelid Line */}
            <path
              d="M 48 81 Q 59 73 70 80"
              stroke="#ffffff"
              strokeWidth="2.8"
              strokeLinecap="round"
              fill="none"
            />

            {/* Cute Expressive Eyebrow */}
            <path
              d="M 49 70 Q 59 65 68 69"
              stroke="#ffffff"
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
              opacity="0.9"
            />

            {/* LONG FLUTTERING EYELASHES FOR THE PINK MASCOT */}
            {isPinkMascot && (
              <g id="left-long-eyelashes" className="drop-shadow-[0_0_3px_rgba(255,255,255,0.7)]">
                {/* Top dramatic fluttering lash curling upward */}
                <path
                  d="M 49 79 Q 37 73 30 64"
                  stroke="#ffffff"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  fill="none"
                />
                {/* Middle flutter lash */}
                <path
                  d="M 48 83 Q 36 81 31 74"
                  stroke="#ffffff"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  fill="none"
                />
                {/* Lower outer flutter lash */}
                <path
                  d="M 49 87 Q 39 89 34 84"
                  stroke="#ffffff"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  fill="none"
                />
              </g>
            )}
          </g>

          {/* RIGHT EYE (Normal or Winking) */}
          <g id="right-eye">
            {isWinking ? (
              <g>
                {/* Super Cute Playful Anime Wink Arc */}
                <path
                  d="M 91 88 Q 101 78 111 87"
                  stroke="#ffffff"
                  strokeWidth="3.4"
                  strokeLinecap="round"
                  fill="none"
                />
                {/* Eyebrow */}
                <path
                  d="M 92 70 Q 101 65 111 70"
                  stroke="#ffffff"
                  strokeWidth="2"
                  strokeLinecap="round"
                  fill="none"
                  opacity="0.9"
                />

                {/* Long fluttering eyelashes on winking eye for the pink mascot */}
                {isPinkMascot ? (
                  <g id="right-wink-eyelashes">
                    <path
                      d="M 111 86 Q 123 79 129 71"
                      stroke="#ffffff"
                      strokeWidth="2.6"
                      strokeLinecap="round"
                      fill="none"
                    />
                    <path
                      d="M 110 88 Q 122 86 127 80"
                      stroke="#ffffff"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      fill="none"
                    />
                    <path
                      d="M 108 90 Q 118 93 123 88"
                      stroke="#ffffff"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      fill="none"
                    />
                  </g>
                ) : (
                  /* Standard cute wink lash flick */
                  <path
                    d="M 111 86 Q 116 83 120 81"
                    stroke="#ffffff"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    fill="none"
                  />
                )}
              </g>
            ) : (
              <g>
                {/* Right Eye socket / deep velvety pupil base */}
                <ellipse cx="101" cy="87" rx="11" ry="13.5" fill={`url(#eyeGrad-${mascot.id})`} />
                
                {/* Lower Iris Glassy Luminous Crescent */}
                <path
                  d="M 92 89 C 92 98, 110 98, 110 89 C 110 93.5, 92 93.5, 92 89 Z"
                  fill={mascot.eyesColor}
                  opacity="0.9"
                />
                {/* Bottom Glass Reflection Arc */}
                <path
                  d="M 94 93 Q 101 99 108 93"
                  stroke="#ffffff"
                  strokeWidth="1.3"
                  strokeLinecap="round"
                  fill="none"
                  opacity="0.9"
                />

                {/* Kawaii Catchlights */}
                <ellipse cx="98" cy="82" rx="4.8" ry="5.6" fill="#ffffff" transform="rotate(-15 98 82)" />
                <circle cx="106" cy="91" r="2.4" fill="#ffffff" />
                <polygon
                  points="105,84.5 106,85.7 107.2,86 106,86.3 105,87.5 104,86.3 102.8,86 104,85.7"
                  fill="#ffffff"
                  opacity="0.95"
                />

                {/* Cute Upper Eyelid Line */}
                <path
                  d="M 90 80 Q 101 73 112 81"
                  stroke="#ffffff"
                  strokeWidth="2.8"
                  strokeLinecap="round"
                  fill="none"
                />

                {/* Eyebrow */}
                <path
                  d="M 92 69 Q 101 65 111 70"
                  stroke="#ffffff"
                  strokeWidth="2"
                  strokeLinecap="round"
                  fill="none"
                  opacity="0.9"
                />

                {/* LONG FLUTTERING EYELASHES FOR THE PINK MASCOT */}
                {isPinkMascot && (
                  <g id="right-long-eyelashes" className="drop-shadow-[0_0_3px_rgba(255,255,255,0.7)]">
                    {/* Top dramatic fluttering lash curling upward */}
                    <path
                      d="M 111 79 Q 123 73 130 64"
                      stroke="#ffffff"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      fill="none"
                    />
                    {/* Middle flutter lash */}
                    <path
                      d="M 112 83 Q 124 81 129 74"
                      stroke="#ffffff"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      fill="none"
                    />
                    {/* Lower outer flutter lash */}
                    <path
                      d="M 111 87 Q 121 89 126 84"
                      stroke="#ffffff"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      fill="none"
                    />
                  </g>
                )}
              </g>
            )}
          </g>

          {/* Cute Little Button Heart Nose */}
          <ellipse cx="80" cy="94" rx="3.5" ry="2.6" fill="#ffffff" opacity="0.95" />

          {/* Cute W-shaped Smiling Mouth with little pink tongue */}
          <path
            d="M 72 102 Q 76 108 80 102 Q 84 108 88 102"
            stroke="#ffffff"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M 76 104 Q 80 112 84 104 Z"
            fill="#ff007f"
            opacity="0.88"
          />
        </g>

        {/* Tiny Fuzzy Paws with Cute Toe Tufts */}
        <g id="fuzzy-paws">
          <ellipse cx="56" cy="132" rx="12" ry="8" fill={mascot.furColor} stroke="#ffffff" strokeWidth="1.5" />
          <circle cx="56" cy="132" r="4" fill="#ffffff" opacity="0.3" />
          {/* Paw fluff tuft */}
          <path d="M 52 134 Q 48 138 52 140" stroke={hairC1} strokeWidth="1.2" strokeLinecap="round" fill="none" />

          <ellipse cx="104" cy="132" rx="12" ry="8" fill={mascot.furColor} stroke="#ffffff" strokeWidth="1.5" />
          <circle cx="104" cy="132" r="4" fill="#ffffff" opacity="0.3" />
          {/* Paw fluff tuft */}
          <path d="M 108 134 Q 112 138 108 140" stroke={hairC2} strokeWidth="1.2" strokeLinecap="round" fill="none" />
        </g>
      </svg>

      {/* Level Badge Pill */}
      {size !== 'sm' && (
        <div
          className="absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider text-slate-900 border border-white/40 shadow-lg"
          style={{ background: hairC1 }}
        >
          Lv.{mascot.level || 1}
        </div>
      )}
    </motion.div>
  );
};
