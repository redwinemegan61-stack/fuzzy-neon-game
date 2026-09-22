import React from 'react';
import { motion } from 'motion/react';
import { Town, Landmark, Mascot } from '../types';
import { 
  Building2, Home, Utensils, Droplets, Music, Gamepad2, Zap, 
  Sparkles, Radio, Sun, Compass, Eye, Crown, Check, ArrowRight, Star
} from 'lucide-react';
import { SoundEngine } from '../utils/sound';
import { MascotAvatar } from './MascotAvatar';
import confetti from 'canvas-confetti';

interface TownViewProps {
  town: Town;
  coins: number;
  playerLevel: number;
  activeMascot: Mascot;
  onUpgradeLandmark: (landmarkId: string, cost: number) => void;
  onAdvanceNextTown?: () => void;
}

// Icon mapper for landmarks
const LandmarkIcon: React.FC<{ name: string; className?: string }> = ({ name, className = 'w-5 h-5' }) => {
  switch (name) {
    case 'Home': return <Home className={className} />;
    case 'Utensils': return <Utensils className={className} />;
    case 'Droplets': return <Droplets className={className} />;
    case 'Music': return <Music className={className} />;
    case 'Gamepad2': return <Gamepad2 className={className} />;
    case 'Zap': return <Zap className={className} />;
    case 'Sparkles': return <Sparkles className={className} />;
    case 'Radio': return <Radio className={className} />;
    case 'Sun': return <Sun className={className} />;
    case 'Compass': return <Compass className={className} />;
    case 'Eye': return <Eye className={className} />;
    case 'Crown': return <Crown className={className} />;
    default: return <Building2 className={className} />;
  }
};

export const TownView: React.FC<TownViewProps> = ({
  town,
  coins,
  playerLevel,
  activeMascot,
  onUpgradeLandmark,
  onAdvanceNextTown,
}) => {
  // Calculate total landmarks progress
  const totalLevels = town.landmarks.reduce((acc, lm) => acc + lm.currentLevel, 0);
  const maxLevels = town.landmarks.reduce((acc, lm) => acc + lm.maxLevel, 0);
  const isTownComplete = totalLevels >= maxLevels;

  const handleUpgrade = (lm: Landmark) => {
    if (lm.currentLevel >= lm.maxLevel) return;
    const cost = lm.costPerLevel[lm.currentLevel] || 999999;
    if (coins < cost) {
      SoundEngine.playErrorBuzz();
      return;
    }

    SoundEngine.playUpgradeFanfare();
    confetti({ particleCount: 30, spread: 50, origin: { y: 0.7 } });
    onUpgradeLandmark(lm.id, cost);
  };

  return (
    <div className="w-full max-w-md mx-auto flex flex-col items-center">
      {/* Town Header Card */}
      <div className="w-full rounded-3xl bg-slate-900/90 border border-slate-800 p-4 mb-4 backdrop-blur-md shadow-xl relative overflow-hidden">
        {/* Soft background ambient gradient */}
        <div
          className="absolute -top-10 -right-10 w-40 h-40 rounded-full blur-3xl opacity-30 pointer-events-none"
          style={{ backgroundColor: town.themeColor }}
        />

        <div className="flex items-center justify-between mb-2">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                World {town.worldNumber}
              </span>
              <span className="text-[10px] bg-fuchsia-950/80 text-fuchsia-300 font-bold px-2 py-0.5 rounded-full border border-fuchsia-500/30">
                Rank {playerLevel}
              </span>
            </div>
            <h2 className="text-xl font-black text-white">{town.name}</h2>
            <p className="text-xs text-slate-400">{town.subtitle}</p>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Town Build</span>
            <div className="text-base font-black text-white flex items-center justify-end gap-1">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span>{totalLevels} / {maxLevels}</span>
            </div>
          </div>
        </div>

        {/* Town Completion Progress Bar */}
        <div className="w-full bg-slate-800/80 rounded-full h-2.5 overflow-hidden border border-slate-700/50">
          <motion.div
            className="h-full bg-gradient-to-r from-cyan-400 via-pink-500 to-amber-400"
            initial={{ width: 0 }}
            animate={{ width: `${(totalLevels / maxLevels) * 100}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>

        {/* Town Completion Alert Banner */}
        {isTownComplete && (
          <div className="mt-3 p-3 rounded-2xl bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-900 border border-emerald-500/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-400 animate-spin" />
              <div>
                <div className="text-xs font-black text-emerald-300 uppercase tracking-wider">
                  Town Mastered!
                </div>
                <div className="text-[11px] text-slate-300">
                  Ready to travel to the next neon realm!
                </div>
              </div>
            </div>
            {onAdvanceNextTown && (
              <button
                onClick={onAdvanceNextTown}
                className="px-3 py-1.5 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs uppercase flex items-center gap-1 hover:brightness-110 active:scale-95 transition-all shadow-md"
              >
                <span>Travel</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {/* Mascot Traveling Companion Banner */}
        <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MascotAvatar mascot={activeMascot} size="sm" showHairGlow={false} interactive={false} />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black text-white">{activeMascot.name}</span>
                <span className="text-[9px] bg-amber-400 text-slate-950 font-black px-1.5 py-0.2 rounded-full">
                  Lv.{activeMascot.level}
                </span>
                <span className="text-[9px] text-amber-300 bg-amber-950/60 border border-amber-500/30 px-1.5 py-0.2 rounded-full font-bold">
                  {activeMascot.uniqueAbility.multiplier}x Multiplier
                </span>
              </div>
              <p className="text-[10px] text-cyan-300 font-medium">
                ⚡ Companion Perk: {activeMascot.uniqueAbility.name} boosting your town journey!
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Landmarks Grid */}
      <div className="w-full space-y-3">
        {town.landmarks.map((lm) => {
          const isMax = lm.currentLevel >= lm.maxLevel;
          const cost = lm.costPerLevel[lm.currentLevel] || 0;
          const canAfford = coins >= cost && !isMax;

          return (
            <div
              key={lm.id}
              className={`rounded-2xl p-3.5 border transition-all ${
                isMax
                  ? 'bg-slate-900/60 border-emerald-500/40'
                  : 'bg-slate-900/90 border-slate-800/90 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                {/* Landmark Icon & Info */}
                <div className="flex items-center gap-3">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-white shadow-md relative ${
                      isMax ? 'bg-gradient-to-br from-emerald-500 to-teal-700' : 'bg-slate-800'
                    }`}
                  >
                    <LandmarkIcon name={lm.icon} className="w-6 h-6" />
                    {isMax && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-400 text-slate-950 flex items-center justify-center">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}
                  </div>

                  <div>
                    <h4 className="text-sm font-black text-white flex items-center gap-1.5">
                      <span>{lm.name}</span>
                      <span className="text-[10px] text-slate-400 font-bold">
                        (Lv.{lm.currentLevel}/{lm.maxLevel})
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-400 line-clamp-1">{lm.description}</p>

                    {/* Stage Star Dots */}
                    <div className="flex items-center gap-1 mt-1.5">
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

                {/* Upgrade Button */}
                <div>
                  {isMax ? (
                    <span className="px-3 py-1.5 rounded-xl bg-emerald-950/70 border border-emerald-500/30 text-emerald-400 text-xs font-black uppercase tracking-wider">
                      MAX
                    </span>
                  ) : (
                    <motion.button
                      whileTap={{ scale: 0.94 }}
                      onClick={() => handleUpgrade(lm)}
                      disabled={!canAfford}
                      className={`px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex flex-col items-center min-w-[90px] transition-all shadow-md ${
                        canAfford
                          ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 hover:brightness-110'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                      }`}
                    >
                      <span className="text-[9px] opacity-80">UPGRADE</span>
                      <span className="text-xs font-black">
                        {cost.toLocaleString()} 🪙
                      </span>
                    </motion.button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
