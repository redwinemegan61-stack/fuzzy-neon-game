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
  // If special: Bomb
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
            <stop offset="30%" stopColor="#fef08a" />
            <stop offset="60%" stopColor="#f97316" />
            <stop offset="85%" stopColor="#dc2626" />
            <stop offset="100%" stopColor="#7f1d1d" />
          </radialGradient>
          <radialGradient id="bomb-ring-grad" cx="50%" cy="50%" r="50%">
            <stop offset="60%" stopColor="#f59e0b" stopOpacity="0" />
            <stop offset="85%" stopColor="#f59e0b" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#ef4444" stopOpacity="1" />
          </radialGradient>
          <filter id="bomb-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="1.2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Outer Pulsing Aura Ring */}
        <circle cx="20" cy="20" r="17" stroke="#f59e0b" strokeWidth="1.2" strokeDasharray="3 2" opacity="0.85" />
        <circle cx="20" cy="20" r="15" fill="url(#bomb-ring-grad)" />

        {/* Core Sphere */}
        <circle cx="20" cy="20" r="12.5" fill="url(#bomb-core-grad)" filter="url(#bomb-glow)" />

        {/* 4 Cardinal Cross Thrusters (100% Symmetrical) */}
        <line x1="20" y1="3" x2="20" y2="8" stroke="#fef08a" strokeWidth="2.2" strokeLinecap="round" />
        <line x1="20" y1="32" x2="20" y2="37" stroke="#fef08a" strokeWidth="2.2" strokeLinecap="round" />
        <line x1="3" y1="20" x2="8" y2="20" stroke="#fef08a" strokeWidth="2.2" strokeLinecap="round" />
        <line x1="32" y1="20" x2="37" y2="20" stroke="#fef08a" strokeWidth="2.2" strokeLinecap="round" />

        {/* 4 Diagonal Warning Nodes (100% Symmetrical) */}
        <circle cx="10" cy="10" r="1.8" fill="#fef08a" stroke="#f59e0b" strokeWidth="0.8" />
        <circle cx="30" cy="10" r="1.8" fill="#fef08a" stroke="#f59e0b" strokeWidth="0.8" />
        <circle cx="10" cy="30" r="1.8" fill="#fef08a" stroke="#f59e0b" strokeWidth="0.8" />
        <circle cx="30" cy="30" r="1.8" fill="#fef08a" stroke="#f59e0b" strokeWidth="0.8" />

        {/* Center Energetic Starburst (100% Symmetrical) */}
        <polygon
          points="20,13 22,18 27,20 22,22 20,27 18,22 13,20 18,18"
          fill="#ffffff"
          stroke="#fef08a"
          strokeWidth="0.8"
          opacity="0.95"
        />
        <circle cx="20" cy="20" r="2.2" fill="#ffffff" />
      </svg>
    );
  }

  // If special: Rainbow Prismatic Star
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
            <stop offset="25%" stopColor="#a855f7" />
            <stop offset="50%" stopColor="#ec4899" />
            <stop offset="75%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
          <radialGradient id="rainbow-center" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="40%" stopColor="#fef08a" />
            <stop offset="80%" stopColor="#ec4899" />
            <stop offset="100%" stopColor="#6366f1" />
          </radialGradient>
        </defs>

        {/* Outer Radiant Orbit Ring */}
        <circle cx="20" cy="20" r="17" stroke="url(#rainbow-grad)" strokeWidth="1.5" strokeDasharray="5 2.5" opacity="0.85" />

        {/* Symmetrical 8-Point Prismatic Star */}
        <polygon
          points="20,4 23.5,14 34,10 26,17.5 36,20 26,22.5 34,30 23.5,26 20,36 16.5,26 6,30 14,22.5 4,20 14,17.5 6,10 16.5,14"
          fill="url(#rainbow-grad)"
          stroke="#ffffff"
          strokeWidth="1.2"
          strokeLinejoin="round"
        />

        {/* Center Faceted Crystal Octagon Core (100% Symmetrical) */}
        <polygon
          points="20,12 25.5,14.5 28,20 25.5,25.5 20,28 14.5,25.5 12,20 14.5,14.5"
          fill="url(#rainbow-center)"
          stroke="#ffffff"
          strokeWidth="1"
          strokeLinejoin="round"
        />

        {/* Center Highlight Specular Diamond */}
        <polygon points="20,15 24,20 20,25 16,20" fill="#ffffff" opacity="0.9" />
        <circle cx="20" cy="20" r="1.8" fill="#ffffff" />
      </svg>
    );
  }

  // Symmetrical Standard Gems (Ruby, Emerald, Sapphire, Citrine, Amethyst, Topaz)
  switch (type) {
    case 'ruby':
      // 100% Symmetrical Brilliant Octagon
      return (
        <svg viewBox="0 0 40 40" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="ruby-radial" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#fecdd3" />
              <stop offset="45%" stopColor="#f43f5e" />
              <stop offset="85%" stopColor="#be123c" />
              <stop offset="100%" stopColor="#4c0519" />
            </radialGradient>
            <linearGradient id="ruby-inner-grad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffe4e6" />
              <stop offset="50%" stopColor="#fb7185" />
              <stop offset="100%" stopColor="#e11d48" />
            </linearGradient>
          </defs>

          {/* Outer Symmetrical Octagon Base */}
          <polygon
            points="14,6 26,6 34,14 34,26 26,34 14,34 6,26 6,14"
            fill="url(#ruby-radial)"
            stroke="#fda4af"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />

          {/* 4 Cardinal Bevel Trapezoids (Identical Geometry & Balanced Shading) */}
          <polygon points="14,6 26,6 24,12 16,12" fill="#ffffff" opacity="0.4" />
          <polygon points="26,34 14,34 16,28 24,28" fill="#4c0519" opacity="0.6" />
          <polygon points="6,14 6,26 12,24 12,16" fill="#fb7185" opacity="0.3" />
          <polygon points="34,14 34,26 28,24 28,16" fill="#881337" opacity="0.4" />

          {/* 4 Corner Bevel Trapezoids (100% Symmetrical) */}
          <polygon points="26,6 34,14 28,16 24,12" fill="#fda4af" opacity="0.35" />
          <polygon points="14,6 6,14 12,16 16,12" fill="#fda4af" opacity="0.35" />
          <polygon points="34,26 26,34 24,28 28,24" fill="#4c0519" opacity="0.5" />
          <polygon points="6,26 14,34 16,28 12,24" fill="#4c0519" opacity="0.5" />

          {/* Inner Symmetrical Octagon Table */}
          <polygon
            points="16,12 24,12 28,16 28,24 24,28 16,28 12,24 12,16"
            fill="url(#ruby-inner-grad)"
            stroke="#fecdd3"
            strokeWidth="0.8"
            strokeLinejoin="round"
          />

          {/* Center 8-Ray Symmetrical Star Glint */}
          <line x1="20" y1="13" x2="20" y2="27" stroke="#ffffff" strokeWidth="0.9" opacity="0.8" strokeLinecap="round" />
          <line x1="13" y1="20" x2="27" y2="20" stroke="#ffffff" strokeWidth="0.9" opacity="0.8" strokeLinecap="round" />
          <line x1="15" y1="15" x2="25" y2="25" stroke="#ffffff" strokeWidth="0.7" opacity="0.6" strokeLinecap="round" />
          <line x1="25" y1="15" x2="15" y2="25" stroke="#ffffff" strokeWidth="0.7" opacity="0.6" strokeLinecap="round" />

          {/* Center Diamond Specular Hub */}
          <polygon points="20,17 23,20 20,23 17,20" fill="#ffffff" opacity="0.9" />
          <circle cx="20" cy="20" r="1.5" fill="#ffffff" />
        </svg>
      );

    case 'emerald':
      // 100% Symmetrical Classic Step-Cut Emerald
      return (
        <svg viewBox="0 0 40 40" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="emerald-radial" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#a7f3d0" />
              <stop offset="45%" stopColor="#10b981" />
              <stop offset="85%" stopColor="#047857" />
              <stop offset="100%" stopColor="#022c22" />
            </radialGradient>
            <linearGradient id="emerald-table-grad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#d1fae5" />
              <stop offset="50%" stopColor="#34d399" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
          </defs>

          {/* Outer Symmetrical Beveled Rectangle (8-sided step cut, 28x28 centered at 20,20) */}
          <polygon
            points="13,6 27,6 34,13 34,27 27,34 13,34 6,27 6,13"
            fill="url(#emerald-radial)"
            stroke="#6ee7b7"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />

          {/* Step 1 Inner Bevel Step (20x20 centered at 20,20) */}
          <polygon
            points="15,10 25,10 30,15 30,25 25,30 15,30 10,25 10,15"
            fill="url(#emerald-table-grad)"
            stroke="#a7f3d0"
            strokeWidth="0.8"
            strokeLinejoin="round"
          />

          {/* 4 Miter Corner Lines (100% Symmetrical Diagonal Facet Ribs) */}
          <line x1="6" y1="13" x2="10" y2="15" stroke="#ffffff" strokeWidth="0.8" opacity="0.6" />
          <line x1="34" y1="13" x2="30" y2="15" stroke="#ffffff" strokeWidth="0.8" opacity="0.6" />
          <line x1="34" y1="27" x2="30" y2="25" stroke="#022c22" strokeWidth="0.8" opacity="0.7" />
          <line x1="6" y1="27" x2="10" y2="25" stroke="#022c22" strokeWidth="0.8" opacity="0.7" />

          {/* Inner Table Step (12x12 centered at 20,20) */}
          <polygon
            points="17,14 23,14 26,17 26,23 23,26 17,26 14,23 14,17"
            fill="#059669"
            stroke="#d1fae5"
            strokeWidth="0.7"
            strokeLinejoin="round"
          />

          {/* Top/Bottom Mirror Highlights */}
          <line x1="16" y1="8" x2="24" y2="8" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" opacity="0.75" />
          <line x1="17" y1="14" x2="23" y2="14" stroke="#ffffff" strokeWidth="1" strokeLinecap="round" opacity="0.85" />

          {/* Center Specular Glint */}
          <polygon points="20,17 22,20 20,23 18,20" fill="#ffffff" opacity="0.9" />
          <circle cx="20" cy="20" r="1.4" fill="#ffffff" />
        </svg>
      );

    case 'sapphire':
      // 100% Symmetrical Royal Lozenge / 4-Point Kite Diamond
      return (
        <svg viewBox="0 0 40 40" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="sapphire-radial" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#bae6fd" />
              <stop offset="40%" stopColor="#38bdf8" />
              <stop offset="75%" stopColor="#2563eb" />
              <stop offset="100%" stopColor="#172554" />
            </radialGradient>
            <linearGradient id="sapphire-core-grad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#e0f2fe" />
              <stop offset="50%" stopColor="#60a5fa" />
              <stop offset="100%" stopColor="#1d4ed8" />
            </linearGradient>
          </defs>

          {/* Outer Symmetrical Rhombus (4 cardinal points, radius 15 from center 20,20) */}
          <polygon
            points="20,5 35,20 20,35 5,20"
            fill="url(#sapphire-radial)"
            stroke="#7dd3fc"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />

          {/* 4 Symmetrical Quadrant Bevel Facets */}
          <polygon points="20,5 35,20 28,20 20,12" fill="#ffffff" opacity="0.3" />
          <polygon points="20,5 5,20 12,20 20,12" fill="#ffffff" opacity="0.3" />
          <polygon points="5,20 20,35 20,28 12,20" fill="#0f172a" opacity="0.4" />
          <polygon points="35,20 20,35 20,28 28,20" fill="#0f172a" opacity="0.4" />

          {/* Inner Symmetrical Diamond Table (radius 8 from center 20,20) */}
          <polygon
            points="20,12 28,20 20,28 12,20"
            fill="url(#sapphire-core-grad)"
            stroke="#e0f2fe"
            strokeWidth="0.8"
            strokeLinejoin="round"
          />

          {/* 4 Cardinal Facet Ridge Lines (100% Symmetrical) */}
          <line x1="20" y1="5" x2="20" y2="12" stroke="#ffffff" strokeWidth="1" strokeLinecap="round" opacity="0.85" />
          <line x1="20" y1="28" x2="20" y2="35" stroke="#ffffff" strokeWidth="0.8" strokeLinecap="round" opacity="0.6" />
          <line x1="5" y1="20" x2="12" y2="20" stroke="#ffffff" strokeWidth="0.9" strokeLinecap="round" opacity="0.75" />
          <line x1="28" y1="20" x2="35" y2="20" stroke="#ffffff" strokeWidth="0.9" strokeLinecap="round" opacity="0.75" />

          {/* Center Brilliant Specular Starlet */}
          <polygon points="20,15 23,20 20,25 17,20" fill="#ffffff" opacity="0.95" />
          <circle cx="20" cy="20" r="1.6" fill="#ffffff" />
        </svg>
      );

    case 'citrine':
      // 100% Mathematically Symmetrical 8-Point Star Solitaire
      return (
        <svg viewBox="0 0 40 40" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="citrine-radial" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="35%" stopColor="#fef08a" />
              <stop offset="70%" stopColor="#eab308" />
              <stop offset="100%" stopColor="#854d0e" />
            </radialGradient>
            <radialGradient id="citrine-core-grad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="50%" stopColor="#fde047" />
              <stop offset="100%" stopColor="#ca8a04" />
            </radialGradient>
          </defs>

          {/* 8-Point Brilliant Star Outer (100% Mathematically Computed Symmetric Coordinates) */}
          <polygon
            points="20,5 23.6,11.2 30.6,9.4 28.8,16.4 35,20 28.8,23.6 30.6,30.6 23.6,28.8 20,35 16.4,28.8 9.4,30.6 11.2,23.6 5,20 11.2,16.4 9.4,9.4 16.4,11.2"
            fill="url(#citrine-radial)"
            stroke="#fef9c3"
            strokeWidth="1.1"
            strokeLinejoin="round"
          />

          {/* Inner Symmetrical Octagon Table */}
          <polygon
            points="16,12 24,12 28,16 28,24 24,28 16,28 12,24 12,16"
            fill="url(#citrine-core-grad)"
            stroke="#fef08a"
            strokeWidth="0.8"
            strokeLinejoin="round"
          />

          {/* 8 Symmetrical Solar Rays */}
          <line x1="20" y1="12" x2="20" y2="28" stroke="#ffffff" strokeWidth="0.9" opacity="0.8" strokeLinecap="round" />
          <line x1="12" y1="20" x2="28" y2="20" stroke="#ffffff" strokeWidth="0.9" opacity="0.8" strokeLinecap="round" />
          <line x1="14.3" y1="14.3" x2="25.7" y2="25.7" stroke="#ffffff" strokeWidth="0.7" opacity="0.7" strokeLinecap="round" />
          <line x1="25.7" y1="14.3" x2="14.3" y2="25.7" stroke="#ffffff" strokeWidth="0.7" opacity="0.7" strokeLinecap="round" />

          {/* Center Brilliant Solar Core */}
          <circle cx="20" cy="20" r="3.2" fill="#ffffff" opacity="0.95" />
          <circle cx="20" cy="20" r="1.8" fill="#fef08a" />
        </svg>
      );

    case 'amethyst':
      // 100% Symmetrical 6-Sided Mystic Hexagon Prism
      return (
        <svg viewBox="0 0 40 40" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="amethyst-radial" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#f5d0fe" />
              <stop offset="40%" stopColor="#c084fc" />
              <stop offset="75%" stopColor="#9333ea" />
              <stop offset="100%" stopColor="#3b0764" />
            </radialGradient>
            <linearGradient id="amethyst-inner-grad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#fdf4ff" />
              <stop offset="50%" stopColor="#d8b4fe" />
              <stop offset="100%" stopColor="#7e22ce" />
            </linearGradient>
          </defs>

          {/* Symmetrical Regular Hexagonal Outer Prism (radius 15 from center 20,20) */}
          <polygon
            points="20,5 33,12.5 33,27.5 20,35 7,27.5 7,12.5"
            fill="url(#amethyst-radial)"
            stroke="#f0abfc"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />

          {/* 6 Symmetrical Trapezoid Facets Connecting to Inner Hexagon */}
          <polygon points="20,5 33,12.5 26.9,16 20,12" fill="#ffffff" opacity="0.3" />
          <polygon points="7,12.5 20,5 20,12 13.1,16" fill="#ffffff" opacity="0.3" />
          <polygon points="33,12.5 33,27.5 26.9,24 26.9,16" fill="#7e22ce" opacity="0.3" />
          <polygon points="7,12.5 7,27.5 13.1,24 13.1,16" fill="#7e22ce" opacity="0.3" />
          <polygon points="33,27.5 20,35 20,28 26.9,24" fill="#3b0764" opacity="0.5" />
          <polygon points="20,35 7,27.5 13.1,24 20,28" fill="#3b0764" opacity="0.5" />

          {/* Symmetrical Inner Regular Hexagon Table (radius 8 from center 20,20) */}
          <polygon
            points="20,12 26.9,16 26.9,24 20,28 13.1,24 13.1,16"
            fill="url(#amethyst-inner-grad)"
            stroke="#f5d0fe"
            strokeWidth="0.8"
            strokeLinejoin="round"
          />

          {/* Center Mystic Specular Star Glint */}
          <polygon points="20,15 23,20 20,25 17,20" fill="#ffffff" opacity="0.9" />
          <polygon points="17,20 20,18.5 23,20 20,21.5" fill="#ffffff" opacity="0.9" />
          <circle cx="20" cy="20" r="1.6" fill="#ffffff" />
        </svg>
      );

    case 'topaz':
      // 100% Symmetrical Princess Square Cushion
      return (
        <svg viewBox="0 0 40 40" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="topaz-radial" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffedd5" />
              <stop offset="40%" stopColor="#fb923c" />
              <stop offset="75%" stopColor="#ea580c" />
              <stop offset="100%" stopColor="#7c2d12" />
            </radialGradient>
            <linearGradient id="topaz-inner-grad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#fff7ed" />
              <stop offset="50%" stopColor="#fed7aa" />
              <stop offset="100%" stopColor="#f97316" />
            </linearGradient>
          </defs>

          {/* Outer Symmetrical Beveled Square Cushion (28x28 centered at 20,20) */}
          <polygon
            points="12,6 28,6 34,12 34,28 28,34 12,34 6,28 6,12"
            fill="url(#topaz-radial)"
            stroke="#fed7aa"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />

          {/* 4 Cardinal Symmetrical Trapezoids */}
          <polygon points="12,6 28,6 20,13" fill="#ffffff" opacity="0.35" />
          <polygon points="28,34 12,34 20,27" fill="#431407" opacity="0.55" />
          <polygon points="6,12 6,28 13,20" fill="#fb923c" opacity="0.3" />
          <polygon points="34,12 34,28 27,20" fill="#9a3412" opacity="0.35" />

          {/* 4 Corner Symmetrical Triangles */}
          <polygon points="28,6 34,12 27,20" fill="#ffffff" opacity="0.25" />
          <polygon points="12,6 6,12 13,20" fill="#ffffff" opacity="0.25" />
          <polygon points="34,28 28,34 27,20" fill="#431407" opacity="0.45" />
          <polygon points="6,28 12,34 13,20" fill="#431407" opacity="0.45" />

          {/* Symmetrical Center Diamond Table (radius 7 from center 20,20) */}
          <polygon
            points="20,13 27,20 20,27 13,20"
            fill="url(#topaz-inner-grad)"
            stroke="#ffedd5"
            strokeWidth="0.8"
            strokeLinejoin="round"
          />

          {/* Inner Concentric Diamond Specular */}
          <polygon points="20,16 24,20 20,24 16,20" fill="#ffffff" opacity="0.85" />
          <circle cx="20" cy="20" r="1.6" fill="#ffffff" />

          {/* 4 Corner Miter Highlight Accents (100% Symmetrical) */}
          <line x1="12" y1="6" x2="6" y2="12" stroke="#ffffff" strokeWidth="0.8" opacity="0.6" strokeLinecap="round" />
          <line x1="28" y1="6" x2="34" y2="12" stroke="#ffffff" strokeWidth="0.8" opacity="0.6" strokeLinecap="round" />
          <line x1="6" y1="28" x2="12" y2="34" stroke="#ffffff" strokeWidth="0.6" opacity="0.4" strokeLinecap="round" />
          <line x1="34" y1="28" x2="28" y2="34" stroke="#ffffff" strokeWidth="0.6" opacity="0.4" strokeLinecap="round" />
        </svg>
      );

    default:
      return null;
  }
};
