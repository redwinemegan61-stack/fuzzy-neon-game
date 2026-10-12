import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Swords, Shield, Coins, Sparkles, X, CheckCircle2, AlertTriangle } from 'lucide-react';
import { LeaderboardEntry, Mascot } from '../types';
import { SoundEngine } from '../utils/sound';
import { MascotAvatar } from './MascotAvatar';
import confetti from 'canvas-confetti';

interface RaidModalProps {
  isOpen: boolean;
  activeMascot: Mascot;
  targetPlayer: LeaderboardEntry | null;
  onComplete: (stolenCoins: number) => void;
  onClose: () => void;
}

export const RaidModal: React.FC<RaidModalProps> = ({
  isOpen,
  activeMascot,
  targetPlayer,
  onComplete,
  onClose,
}) => {
  const [selectedVault, setSelectedVault] = useState<number | null>(null);
  const [outcome, setOutcome] = useState<'success' | 'shielded' | null>(null);
  const [stolenAmount, setStolenAmount] = useState(0);
  const timeoutRef = useRef<any>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedVault(null);
      setOutcome(null);
      setStolenAmount(0);
    }
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isOpen]);

  const handleClose = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    onClose();
  };

  const rival = targetPlayer || {
    id: 'rival-1',
    name: 'CyberKitten_99',
    country: '🇯🇵 JP',
    score: 87000,
    townLevel: 8,
    mascot: 'Ziggy',
    avatarColor: '#00f0ff',
  };

  const handlePickVault = (vaultIndex: number) => {
    if (selectedVault !== null) return;
    setSelectedVault(vaultIndex);

    // 65% chance of jackpot heist, 35% chance shielded
    const isShielded = Math.random() < 0.35;
    let won = 1500;
    if (isShielded) {
      setOutcome('shielded');
      setStolenAmount(1500);
      SoundEngine.playErrorBuzz();
    } else {
      setOutcome('success');
      won = 7500 + Math.floor(Math.random() * 5000);
      if (activeMascot.uniqueAbility.effectType === 'bonus_coins') {
        won = Math.round(won * activeMascot.uniqueAbility.multiplier);
      }
      setStolenAmount(won);
      SoundEngine.playCoinChime();
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });
    }

    timeoutRef.current = setTimeout(() => {
      onComplete(won);
    }, 2200);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-md">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-sm rounded-3xl bg-[#090c24] border-2 border-red-500/50 p-5 shadow-[0_0_50px_rgba(239,68,68,0.3)] flex flex-col relative overflow-hidden"
      >
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-all z-20"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-9 h-9 rounded-xl bg-red-500/20 border border-red-400/40 flex items-center justify-center text-red-400">
            <Swords className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase text-red-400 tracking-wider">
              Friendly Rival Heist
            </span>
            <h3 className="text-base font-black text-white">Raid {rival.name}'s Vault</h3>
          </div>
        </div>

        {/* Active Mascot Companion Heist Partner */}
        <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/80 border border-slate-800 mb-3">
          <div className="flex items-center gap-2">
            <div className="relative">
              <MascotAvatar mascot={activeMascot} size="sm" showHairGlow={false} interactive={false} />
              <div className="absolute -bottom-1 -right-1 px-1 rounded bg-amber-400 text-slate-950 text-[7px] font-black border border-white">
                Lv.{activeMascot.level}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="text-xs font-black text-white">Heist Partner: {activeMascot.name}</span>
              </div>
              <span className="text-[10px] text-cyan-300 font-bold">
                ⚡ {activeMascot.uniqueAbility.multiplier}x Multiplier Boost Active
              </span>
            </div>
          </div>
        </div>

        {/* Rival Target Card */}
        <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between mb-4">
          <div>
            <div className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>{rival.name}</span>
              <span className="text-[10px] text-slate-400">{rival.country}</span>
            </div>
            <div className="text-[11px] text-slate-400">Town Lv.{rival.townLevel} • {rival.mascot} Guard</div>
          </div>
          <div className="px-2.5 py-1 rounded-xl bg-red-950/80 border border-red-500/40 text-red-300 text-xs font-black">
            TARGET
          </div>
        </div>

        {/* Vault Selection Doors */}
        <div className="text-xs font-bold text-slate-300 text-center mb-3">
          Pick 1 of 3 Cyber Vaults to Crack:
        </div>

        <div className="grid grid-cols-3 gap-2.5 mb-4">
          {[1, 2, 3].map((num) => {
            const isSelected = selectedVault === num;
            return (
              <motion.button
                key={num}
                whileHover={selectedVault === null ? { scale: 1.05 } : undefined}
                whileTap={selectedVault === null ? { scale: 0.95 } : undefined}
                disabled={selectedVault !== null}
                onClick={() => handlePickVault(num)}
                className={`aspect-[3/4] rounded-2xl border-2 flex flex-col items-center justify-center p-2 transition-all ${
                  isSelected
                    ? outcome === 'success'
                      ? 'bg-emerald-950/90 border-emerald-400 shadow-[0_0_15px_#34d399]'
                      : 'bg-red-950/90 border-red-400'
                    : 'bg-slate-900/90 border-slate-700 hover:border-red-400/60'
                }`}
              >
                {isSelected ? (
                  outcome === 'success' ? (
                    <div className="text-center">
                      <Coins className="w-8 h-8 text-yellow-400 mx-auto mb-1 animate-bounce" />
                      <span className="text-[10px] font-black text-emerald-300">JACKPOT!</span>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Shield className="w-8 h-8 text-sky-400 mx-auto mb-1 animate-pulse" />
                      <span className="text-[10px] font-black text-sky-300">BLOCKED!</span>
                    </div>
                  )
                ) : (
                  <div className="text-center">
                    <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 mx-auto flex items-center justify-center text-xs font-black text-slate-300 mb-1">
                      {num}
                    </div>
                    <span className="text-[10px] font-bold text-slate-400">VAULT</span>
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Outcome result banner */}
        {outcome && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-3 rounded-xl border text-center text-xs font-black ${
              outcome === 'success'
                ? 'bg-emerald-950/70 border-emerald-500 text-emerald-300'
                : 'bg-sky-950/70 border-sky-500 text-sky-300'
            }`}
          >
            {outcome === 'success'
              ? `🎉 Heist Successful! Siphoned ${stolenAmount.toLocaleString()} 🪙 from rival!`
              : `🛡️ Rival's Neon Shield absorbed most of the blast! Stole ${stolenAmount.toLocaleString()} 🪙 consolation.`}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};
