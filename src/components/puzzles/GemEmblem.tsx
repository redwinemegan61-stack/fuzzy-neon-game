import React from 'react';
import { GemType, SpecialType } from './GemMatch3PuzzleView';

interface GemEmblemProps {
  type: GemType;
  special?: SpecialType;
  isSelected?: boolean;
  isMatched?: boolean;
  className?: string;
}

export const GemEmblem: React.FC<GemEmblemProps> = ({
  type,
  special = 'none',
  isSelected = false,
  isMatched = false,
  className = 'w-full h-full',
}) => {
  // If special, render symmetrical special emblems
  if (special === 'bomb') {
    return (
      <svg
        viewBox="0 0 40 40"
        className={`${className} transition-transform ${isSelected ? 'scale-110' : ''}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <radialGradient id="bomb-core-grad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="40%" stopColor="#f59e0b" />
            <stop offset="75%" stopColor="#dc2626" />
            <stop offset="100%" stopColor="#7f1d1d" />
          </radialGradient>
          <filter id="bomb-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Outer Plasma Ring */}
        <circle cx="20" cy="20" r="16.5" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="4 2" opacity="0.85" />
        
        {/* Core Sphere */}
        <circle cx="20" cy="20" r="13" fill="url(#bomb-core-grad)" filter="url(#bomb-glow)" />
        
        {/* Symmetrical Cardinal Cross Vents */}
        <line x1="20" y1="4" x2="20" y2="9" stroke="#fef08a" strokeWidth="2" strokeLinecap="round" />
        <line x1="20" y1="31" x2="20" y2="36" stroke="#fef08a" strokeWidth="2" strokeLinecap="round" />
        <line x1="4" y1="20" x2="9" y2="20" stroke="#fef08a" strokeWidth="2" strokeLinecap="round" />
        <line x1="31" y1="20" x2="36" y2="20" stroke="#fef08a" strokeWidth="2" strokeLinecap="round" />

        {/* Diagonal Warning Nodes */}
        <circle cx="10" cy="10" r="1.5" fill="#fef08a" />
        <circle cx="30" cy="10" r="1.5" fill="#fef08a" />
        <circle cx="10" cy="30" r="1.5" fill="#fef08a" />
        <circle cx="30" cy="30" r="1.5" fill="#fef08a" />

        {/* Center Energetic Starburst */}
        <polygon
          points="20,13 22,18 27,20 22,22 20,27 18,22 13,20 18,18"
          fill="#ffffff"
          opacity="0.95"
        />
      </svg>
    );
  }

  if (special === 'rainbow') {
    return (
      <svg
        viewBox="0 0 40 40"
        className={`${className} transition-transform ${isSelected ? 'scale-110' : ''}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="rainbow-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00f0ff" />
            <stop offset="35%" stopColor="#a855f7" />
            <stop offset="70%" stopColor="#f43f5e" />
            <stop offset="100%" stopColor="#eab308" />
          </linearGradient>
          <radialGradient id="rainbow-center" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="50%" stopColor="#fef08a" />
            <stop offset="100%" stopColor="#ec4899" />
          </radialGradient>
        </defs>

        {/* Outer Radiant Orbit Ring */}
        <circle cx="20" cy="20" r="17" stroke="url(#rainbow-grad)" strokeWidth="1.5" opacity="0.8" />

        {/* Symmetrical 8-Point Prismatic Star */}
        <polygon
          points="20,4 23.5,14 34,10 26,17.5 36,20 26,22.5 34,30 23.5,26 20,36 16.5,26 6,30 14,22.5 4,20 14,17.5 6,10 16.5,14"
          fill="url(#rainbow-grad)"
          stroke="#ffffff"
          strokeWidth="1"
        />

        {/* Center Faceted Crystal Core */}
        <polygon
          points="20,12 25.5,16.5 25.5,23.5 20,28 14.5,23.5 14.5,16.5"
          fill="url(#rainbow-center)"
          stroke="#ffffff"
          strokeWidth="1"
        />

        {/* Center Highlight Specular Diamond */}
        <polygon points="20,15 23,20 20,25 17,20" fill="#ffffff" opacity="0.9" />
      </svg>
    );
  }

  // Symmetrical Standard Gems (Ruby, Emerald, Sapphire, Citrine, Amethyst, Topaz)
  switch (type) {
    case 'ruby':
      // Symmetrical Brilliant Octagon
      return (
        <svg viewBox="0 0 40 40" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="ruby-main-grad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#fb7185" />
              <stop offset="45%" stopColor="#e11d48" />
              <stop offset="100%" stopColor="#881337" />
            </linearGradient>
            <linearGradient id="ruby-table-grad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#fecdd3" />
              <stop offset="50%" stopColor="#f43f5e" />
              <stop offset="100%" stopColor="#be123c" />
            </linearGradient>
          </defs>

          {/* Outer Symmetrical Octagon Base */}
          <polygon
            points="14,6 26,6 34,14 34,26 26,34 14,34 6,26 6,14"
            fill="url(#ruby-main-grad)"
            stroke="#fda4af"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />

          {/* Symmetrical Corner Bevel Triangles */}
          <polygon points="14,6 16,12 6,14" fill="#fda4af" opacity="0.6" />
          <polygon points="26,6 24,12 34,14" fill="#fda4af" opacity="0.4" />
          <polygon points="34,26 24,28 26,34" fill="#4c0519" opacity="0.6" />
          <polygon points="6,26 16,28 14,34" fill="#4c0519" opacity="0.7" />

          {/* Symmetrical Outer Border Facets */}
          <polygon points="14,6 26,6 24,12 16,12" fill="#ffffff" opacity="0.3" />
          <polygon points="26,34 14,34 16,28 24,28" fill="#4c0519" opacity="0.8" />
          <polygon points="6,14 6,26 16,28 16,12" fill="#f43f5e" opacity="0.5" />
          <polygon points="34,14 34,26 24,28 24,12" fill="#9f1239" opacity="0.5" />

          {/* Inner Symmetrical Octagon Table */}
          <polygon
            points="16,12 24,12 29,17 29,23 24,28 16,28 11,23 11,17"
            fill="url(#ruby-table-grad)"
            stroke="#fecdd3"
            strokeWidth="0.8"
            strokeLinejoin="round"
          />

          {/* Center Refraction Star Glint */}
          <polygon points="20,15 22,20 20,25 18,20" fill="#ffffff" opacity="0.75" />
          <polygon points="15,20 20,22 25,20 20,18" fill="#ffffff" opacity="0.75" />

          {/* Top Mirror Highlight */}
          <polygon points="16,12 24,12 22,15 18,15" fill="#ffffff" opacity="0.7" />
        </svg>
      );

    case 'emerald':
      // Symmetrical Classic Step-Cut Emerald
      return (
        <svg viewBox="0 0 40 40" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="emerald-main-grad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#34d399" />
              <stop offset="45%" stopColor="#059669" />
              <stop offset="100%" stopColor="#064e3b" />
            </linearGradient>
            <linearGradient id="emerald-table-grad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#a7f3d0" />
              <stop offset="50%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#047857" />
            </linearGradient>
          </defs>

          {/* Outer Symmetrical Beveled Rectangle (8-sided step cut) */}
          <polygon
            points="13,6 27,6 33,12 33,28 27,34 13,34 7,28 7,12"
            fill="url(#emerald-main-grad)"
            stroke="#6ee7b7"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />

          {/* Top/Bottom Symmetrical Step Facets */}
          <polygon points="13,6 27,6 24,11 16,11" fill="#ffffff" opacity="0.4" />
          <polygon points="13,34 27,34 24,29 16,29" fill="#022c22" opacity="0.8" />
          <polygon points="7,12 7,28 12,25 12,15" fill="#34d399" opacity="0.4" />
          <polygon points="33,12 33,28 28,25 28,15" fill="#064e3b" opacity="0.6" />

          {/* Symmetrical Corner Facets */}
          <polygon points="13,6 16,11 12,15 7,12" fill="#a7f3d0" opacity="0.5" />
          <polygon points="27,6 33,12 28,15 24,11" fill="#a7f3d0" opacity="0.3" />
          <polygon points="7,28 12,25 16,29 13,34" fill="#022c22" opacity="0.7" />
          <polygon points="33,28 27,34 24,29 28,25" fill="#022c22" opacity="0.7" />

          {/* Symmetrical Inner Table Step */}
          <polygon
            points="16,11 24,11 28,15 28,25 24,29 16,29 12,25 12,15"
            fill="url(#emerald-table-grad)"
            stroke="#a7f3d0"
            strokeWidth="0.8"
            strokeLinejoin="round"
          />

          {/* Inner Light Reflection Table */}
          <rect x="15" y="14" width="10" height="12" rx="1" fill="#10b981" stroke="#d1fae5" strokeWidth="0.6" opacity="0.9" />

          {/* Top Specular Glint */}
          <line x1="16" y1="12" x2="24" y2="12" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
        </svg>
      );

    case 'sapphire':
      // Symmetrical Royal Lozenge / 4-Point Star Diamond
      return (
        <svg viewBox="0 0 40 40" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="sapphire-main-grad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="45%" stopColor="#2563eb" />
              <stop offset="100%" stopColor="#1e3a8a" />
            </linearGradient>
            <linearGradient id="sapphire-core-grad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#bae6fd" />
              <stop offset="50%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#1d4ed8" />
            </linearGradient>
          </defs>

          {/* Outer Symmetrical Rhombus (4 points on axes) */}
          <polygon
            points="20,5 35,20 20,35 5,20"
            fill="url(#sapphire-main-grad)"
            stroke="#7dd3fc"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />

          {/* 4 Symmetrical Quadrant Triangles */}
          <polygon points="20,5 35,20 20,20" fill="#60a5fa" opacity="0.4" />
          <polygon points="20,5 5,20 20,20" fill="#93c5fd" opacity="0.6" />
          <polygon points="5,20 20,35 20,20" fill="#1e3a8a" opacity="0.7" />
          <polygon points="35,20 20,35 20,20" fill="#172554" opacity="0.85" />

          {/* Symmetrical Inner Diamond Table */}
          <polygon
            points="20,11 29,20 20,29 11,20"
            fill="url(#sapphire-core-grad)"
            stroke="#e0f2fe"
            strokeWidth="0.8"
            strokeLinejoin="round"
          />

          {/* Symmetrical Starburst Facet Rays */}
          <line x1="20" y1="5" x2="20" y2="11" stroke="#ffffff" strokeWidth="1" opacity="0.8" />
          <line x1="20" y1="29" x2="20" y2="35" stroke="#ffffff" strokeWidth="0.8" opacity="0.4" />
          <line x1="5" y1="20" x2="11" y2="20" stroke="#ffffff" strokeWidth="1" opacity="0.7" />
          <line x1="29" y1="20" x2="35" y2="20" stroke="#ffffff" strokeWidth="0.8" opacity="0.5" />

          {/* Center Specular Starlet */}
          <polygon points="20,16 22,20 20,24 18,20" fill="#ffffff" opacity="0.9" />
        </svg>
      );

    case 'citrine':
      // Symmetrical Radiant Solar 8-Point Star / Hexagonal Sun
      return (
        <svg viewBox="0 0 40 40" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="citrine-main-grad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="45%" stopColor="#eab308" />
              <stop offset="100%" stopColor="#a16207" />
            </linearGradient>
            <radialGradient id="citrine-core-grad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="45%" stopColor="#fde047" />
              <stop offset="100%" stopColor="#ca8a04" />
            </radialGradient>
          </defs>

          {/* Symmetrical 8-Point Brilliant Star Outer */}
          <polygon
            points="20,5 24,13 33,9 29,17 37,20 29,23 33,31 24,27 20,35 16,27 7,31 11,23 3,20 11,17 7,9 16,13"
            fill="url(#citrine-main-grad)"
            stroke="#fef9c3"
            strokeWidth="1.1"
            strokeLinejoin="round"
          />

          {/* Symmetrical Inner Octagon Table */}
          <polygon
            points="16,12 24,12 28,16 28,24 24,28 16,28 12,24 12,16"
            fill="url(#citrine-core-grad)"
            stroke="#fef08a"
            strokeWidth="0.8"
            strokeLinejoin="round"
          />

          {/* Inner 8-Spoke Solar Rays */}
          <line x1="20" y1="12" x2="20" y2="28" stroke="#ffffff" strokeWidth="0.8" opacity="0.6" />
          <line x1="12" y1="20" x2="28" y2="20" stroke="#ffffff" strokeWidth="0.8" opacity="0.6" />
          <line x1="14" y1="14" x2="26" y2="26" stroke="#ffffff" strokeWidth="0.8" opacity="0.4" />
          <line x1="26" y1="14" x2="14" y2="26" stroke="#ffffff" strokeWidth="0.8" opacity="0.4" />

          {/* Center Brilliant Solar Core */}
          <circle cx="20" cy="20" r="3.5" fill="#ffffff" opacity="0.9" />
        </svg>
      );

    case 'amethyst':
      // Symmetrical 6-Sided Mystic Jewel Prism
      return (
        <svg viewBox="0 0 40 40" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="amethyst-main-grad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#e879f9" />
              <stop offset="45%" stopColor="#a855f7" />
              <stop offset="100%" stopColor="#581c87" />
            </linearGradient>
            <linearGradient id="amethyst-table-grad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#f5d0fe" />
              <stop offset="50%" stopColor="#c084fc" />
              <stop offset="100%" stopColor="#7e22ce" />
            </linearGradient>
          </defs>

          {/* Symmetrical Hexagonal Vertical Diamond Prism */}
          <polygon
            points="20,5 33,14 33,26 20,35 7,26 7,14"
            fill="url(#amethyst-main-grad)"
            stroke="#f0abfc"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />

          {/* Symmetrical Triangular Side Cleavage Facets */}
          <polygon points="20,5 7,14 15,15" fill="#fdf4ff" opacity="0.5" />
          <polygon points="20,5 33,14 25,15" fill="#f5d0fe" opacity="0.3" />
          <polygon points="7,26 20,35 15,25" fill="#3b0764" opacity="0.7" />
          <polygon points="33,26 20,35 25,25" fill="#3b0764" opacity="0.8" />

          {/* Symmetrical Center Hexagonal Table */}
          <polygon
            points="20,11 26,16 26,24 20,29 14,24 14,16"
            fill="url(#amethyst-table-grad)"
            stroke="#f5d0fe"
            strokeWidth="0.8"
            strokeLinejoin="round"
          />

          {/* Inner Diamond Star Glint */}
          <polygon points="20,15 23,20 20,25 17,20" fill="#ffffff" opacity="0.8" />

          {/* Top Specular Shine */}
          <polygon points="20,7 23,12 20,14 17,12" fill="#ffffff" opacity="0.75" />
        </svg>
      );

    case 'topaz':
      // Symmetrical Princess Square Cushion
      return (
        <svg viewBox="0 0 40 40" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="topaz-main-grad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#fb923c" />
              <stop offset="45%" stopColor="#ea580c" />
              <stop offset="100%" stopColor="#7c2d12" />
            </linearGradient>
            <linearGradient id="topaz-table-grad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffedd5" />
              <stop offset="50%" stopColor="#f97316" />
              <stop offset="100%" stopColor="#c2410c" />
            </linearGradient>
          </defs>

          {/* Outer Symmetrical Beveled Square */}
          <polygon
            points="12,6 28,6 34,12 34,28 28,34 12,34 6,28 6,12"
            fill="url(#topaz-main-grad)"
            stroke="#fed7aa"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />

          {/* 4-Way Symmetrical Cross Facets */}
          <polygon points="12,6 28,6 20,13" fill="#ffffff" opacity="0.4" />
          <polygon points="28,34 12,34 20,27" fill="#431407" opacity="0.8" />
          <polygon points="6,12 6,28 13,20" fill="#fb923c" opacity="0.5" />
          <polygon points="34,12 34,28 27,20" fill="#9a3412" opacity="0.6" />

          {/* Symmetrical Center Diamond Table */}
          <polygon
            points="20,13 27,20 20,27 13,20"
            fill="url(#topaz-table-grad)"
            stroke="#ffedd5"
            strokeWidth="0.8"
            strokeLinejoin="round"
          />

          {/* Inner Concentric Diamond Specular */}
          <polygon points="20,16 24,20 20,24 16,20" fill="#ffffff" opacity="0.75" />

          {/* Symmetrical Corner Bevel Highlights */}
          <line x1="12" y1="6" x2="6" y2="12" stroke="#ffffff" strokeWidth="1" opacity="0.6" />
          <line x1="28" y1="6" x2="34" y2="12" stroke="#ffffff" strokeWidth="0.8" opacity="0.5" />
        </svg>
      );

    default:
      return null;
  }
};
