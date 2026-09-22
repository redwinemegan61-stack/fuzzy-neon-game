import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Gift, Sparkles, Coins, Flame, Shield, X, Check } from 'lucide-react';
import { Mascot } from '../types';
import { SoundEngine } from '../utils/sound';
import { MascotAvatar } from './MascotAvatar';
import confetti from 'canvas-confetti';

interface RewardChestModalProps {
  isOpen: boolean;
  activeMascot: Mascot;
  rollMultiplier: number;
  onClaim: (coins: number, dice: number, shields: number) => void;
  onClose: () => void;
}

export const RewardChestModal: React.FC<RewardChestModalProps> = ({
  isOpen,
  activeMascot,
  rollMultiplier,
  onClaim,
  onClose,
}) => {
  const [opened, setOpened] = useState(false);
  const [loot, setLoot] = useState<{ coins: number; dice: number; shields: number } | null>(null);

  const handleOpenChest = () => {
    if (opened) return;
    setOpened(true);
    SoundEngine.playUpgradeFanfare();
    confetti({ particleCount: 45, spread: 70, origin: { y: 0.6 } });

    let diceBonus = (Math.floor(Math.random() * 8) + 4) * rollMultiplier;
    let coinBonus = (Math.floor(Math.random() * 4000) + 2000) * rollMultiplier;
    const shieldBonus = Math.random() < 0.5 ? 1 : 0;

    if (activeMascot.uniqueAbility.effectType === 'bonus_coins') {
      coinBonus = Math.round(coinBonus * activeMascot.uniqueAbility.multiplier);
    }
    if (activeMascot.uniqueAbility.effectType === 'lucky_dice') {
      diceBonus = Math.round(diceBonus + (activeMascot.uniqueAbility.multiplier * 2));
    }

    const reward = {
      dice: diceBonus,
      coins: coinBonus,
      shields: shieldBonus,
    };
    setLoot(reward);
  };

  const handleCollect = () => {
    if (loot) {
      onClaim(loot.coins, loot.dice, loot.shields);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-md">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-sm rounded-3xl bg-[#090b22] border-2 border-amber-500/50 p-5 shadow-[0_0_50px_rgba(251,191,36,0.3)] flex flex-col items-center text-center relative overflow-hidden"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-all z-20"
        >
          <X className="w-5 h-5" />
        </button>

        <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider mb-1">
          Special Board Prize
        </span>
        <h3 className="text-lg font-black text-white mb-2">Neon Mystery Crate</h3>

        {/* Mascot Lucky Companion Banner */}
        <div className="w-full flex items-center justify-between p-2 rounded-xl bg-slate-900/80 border border-slate-800 mb-2">
          <div className="flex items-center gap-2">
            <div className="relative">
              <MascotAvatar mascot={activeMascot} size="sm" showHairGlow={false} interactive={false} />
              <div className="absolute -bottom-1 -right-1 px-1 rounded bg-amber-400 text-slate-950 text-[7px] font-black border border-white">
                Lv.{activeMascot.level}
              </div>
            </div>
            <div className="text-left">
              <div className="flex items-center gap-1">
                <span className="text-xs font-black text-white">{activeMascot.name}</span>
                <span className="text-[9px] text-amber-300 font-bold">({activeMascot.uniqueAbility.multiplier}x)</span>
              </div>
              <p className="text-[10px] text-cyan-300 font-medium">
                ⚡ Boosting crate resource rewards!
              </p>
            </div>
          </div>
        </div>

        {/* Chest Visual */}
        <div className="my-4 relative">
          <motion.div
            animate={
              !opened
                ? {
                    rotate: [-3, 3, -3],
                    y: [0, -6, 0],
                  }
                : { scale: 1.1 }
            }
            transition={{ duration: 1.2, repeat: !opened ? Infinity : 0, ease: 'easeInOut' }}
            onClick={handleOpenChest}
            className={`w-32 h-32 rounded-3xl border-4 flex flex-col items-center justify-center cursor-pointer transition-all shadow-xl ${
              opened
                ? 'bg-gradient-to-br from-amber-500 via-yellow-400 to-amber-600 border-white shadow-[0_0_35px_rgba(251,191,36,0.8)]'
                : 'bg-gradient-to-br from-indigo-950 to-slate-900 border-amber-400/60 hover:scale-105 active:scale-95'
            }`}
          >
            <Gift className={`w-14 h-14 ${opened ? 'text-slate-950 animate-bounce' : 'text-amber-400'}`} />
            <span className="text-[11px] font-black uppercase mt-1 text-slate-200">
              {opened ? 'OPENED!' : 'TAP TO CRACK'}
            </span>
          </motion.div>
        </div>

        {/* Loot Details */}
        {opened && loot && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full space-y-2 mb-4"
          >
            <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Coins className="w-4 h-4 text-amber-400" /> Coins
              </span>
              <span className="text-sm font-black text-amber-400">+{loot.coins.toLocaleString()}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-orange-400" /> Free Dice Rolls
              </span>
              <span className="text-sm font-black text-orange-400">+{loot.dice}</span>
            </div>
            {loot.shields > 0 && (
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-sky-400" /> Defense Shield
                </span>
                <span className="text-sm font-black text-sky-400">+{loot.shields}</span>
              </div>
            )}
          </motion.div>
        )}

        {/* Action Button */}
        {opened ? (
          <button
            onClick={handleCollect}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg hover:brightness-110 active:scale-95"
          >
            Collect Loot
          </button>
        ) : (
          <button
            onClick={handleOpenChest}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-fuchsia-600 to-pink-500 text-white font-black text-xs uppercase tracking-wider shadow-lg hover:brightness-110 active:scale-95"
          >
            Tap to Open
          </button>
        )}
      </motion.div>
    </div>
  );
};
