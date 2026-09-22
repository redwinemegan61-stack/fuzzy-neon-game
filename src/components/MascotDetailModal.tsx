import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Sparkles, Volume2, ShieldCheck, X, Check, Loader2, Plus, Zap, ArrowUpCircle, TrendingUp, Coins, Award } from 'lucide-react';
import { Mascot } from '../types';
import { MascotAvatar } from './MascotAvatar';
import { SoundEngine, playGeminiTTS, playFallbackMascotVoice } from '../utils/sound';
import { MAX_MASCOT_LEVEL, getMascotUpgradeCost, calculateMascotMultiplier } from '../utils/mascotLeveling';

interface MascotDetailModalProps {
  isOpen: boolean;
  allMascots: Mascot[];
  activeMascotId: string;
  coins: number;
  onSelectMascot: (mascotId: string) => void;
  onUpgradeMascot: (mascotId: string) => void;
  onOpenScanner: () => void;
  onClose: () => void;
}

export const MascotDetailModal: React.FC<MascotDetailModalProps> = ({
  isOpen,
  allMascots,
  activeMascotId,
  coins,
  onSelectMascot,
  onUpgradeMascot,
  onOpenScanner,
  onClose,
}) => {
  const [selectedMascotId, setSelectedMascotId] = useState<string>(activeMascotId || allMascots[0]?.id);
  const [isPlayingTts, setIsPlayingTts] = useState(false);
  const [voiceQuote, setVoiceQuote] = useState<string | null>(null);

  // Sync selected mascot with the latest updated allMascots data (for instant level up display)
  const selectedMascot = allMascots.find((m) => m.id === selectedMascotId) || allMascots[0];

  const handleSpeakMascot = async (mascot: Mascot) => {
    if (isPlayingTts) return;
    setIsPlayingTts(true);
    setVoiceQuote(mascot.cheerQuote);

    try {
      const response = await fetch('/api/mascot/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: mascot.cheerQuote,
          voice: mascot.voiceName || 'Kore',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.audio) {
          await playGeminiTTS(data.audio, data.sampleRate || 24000);
        } else {
          playFallbackMascotVoice(mascot.cheerQuote);
        }
      } else {
        // Fallback to browser synthesis
        playFallbackMascotVoice(mascot.cheerQuote);
      }
    } catch (e) {
      playFallbackMascotVoice(mascot.cheerQuote);
    } finally {
      setIsPlayingTts(false);
    }
  };

  if (!isOpen || !selectedMascot) return null;

  const isEquipped = activeMascotId === selectedMascot.id;
  const isMaxLevel = selectedMascot.level >= MAX_MASCOT_LEVEL;
  const upgradeCost = getMascotUpgradeCost(selectedMascot.level);
  const canAfford = coins >= upgradeCost && !isMaxLevel;

  // Next level multiplier calculation
  const nextMultiplier = calculateMascotMultiplier(
    selectedMascot.uniqueAbility.multiplier,
    selectedMascot.level + 1,
    selectedMascot.uniqueAbility.effectType
  );
  const multiplierGain = Number((nextMultiplier - selectedMascot.uniqueAbility.multiplier).toFixed(2));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-md">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-sm rounded-3xl bg-[#090b22] border-2 border-fuchsia-500/50 p-4 shadow-[0_0_50px_rgba(255,0,127,0.3)] flex flex-col relative max-h-[92vh] overflow-y-auto custom-scrollbar"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-all z-20"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center justify-between mb-2 pr-8">
          <div>
            <span className="text-[10px] font-black uppercase text-fuchsia-400 tracking-wider">
              Mascot Sanctuary
            </span>
            <h3 className="text-base font-black text-white">Fuzzy Squad & Upgrades</h3>
          </div>
          <button
            onClick={() => {
              onClose();
              onOpenScanner();
            }}
            className="px-2.5 py-1.5 rounded-xl bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 text-xs font-black flex items-center gap-1 hover:bg-cyan-500/30 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>AI Pet Scan</span>
          </button>
        </div>

        {/* Horizontal Mascot Selector Strip */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-2.5 custom-scrollbar">
          {allMascots.map((mascot) => {
            const isSelected = selectedMascot.id === mascot.id;
            const isCurrent = activeMascotId === mascot.id;

            return (
              <button
                key={mascot.id}
                onClick={() => {
                  setSelectedMascotId(mascot.id);
                  SoundEngine.playBoardHop();
                }}
                className={`flex-shrink-0 p-1.5 rounded-2xl border-2 flex flex-col items-center transition-all ${
                  isSelected
                    ? 'border-white bg-slate-800 shadow-md scale-105'
                    : 'border-slate-800 bg-slate-900/60 opacity-75 hover:opacity-100'
                }`}
              >
                <div className="relative">
                  <MascotAvatar mascot={mascot} size="sm" showHairGlow={false} interactive={false} />
                  {isCurrent && (
                    <div className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-400 text-slate-950 flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                  )}
                  {/* Mini Level badge */}
                  <div className="absolute -bottom-1 -left-1 px-1 rounded-md bg-amber-500 text-slate-950 text-[8px] font-black">
                    Lv.{mascot.level}
                  </div>
                </div>
                <span className="text-[10px] font-black text-white mt-1">{mascot.name}</span>
              </button>
            );
          })}
        </div>

        {/* Active Mascot Display Card */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-b from-indigo-950/80 via-slate-900 to-slate-950 border border-indigo-500/30 mb-2.5 flex flex-col items-center text-center">
          <MascotAvatar mascot={selectedMascot} size="lg" isDancing={isPlayingTts} />

          <div className="flex items-center gap-2 mt-2">
            <h4 className="text-lg font-black text-white">{selectedMascot.name}</h4>
            <div className="flex items-center gap-1">
              <span className="text-[10px] bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black px-2 py-0.5 rounded-full shadow-sm">
                LVL {selectedMascot.level}
              </span>
              <span className="text-[10px] bg-slate-800 text-slate-300 font-bold px-2 py-0.5 rounded-full">
                {selectedMascot.title}
              </span>
            </div>
          </div>

          <p className="text-xs text-fuchsia-300 font-medium italic mt-0.5 max-w-[240px]">
            "{selectedMascot.personality}"
          </p>

          {/* Multicolored Hair Swatches */}
          <div className="flex items-center gap-1.5 my-2">
            <span className="text-[10px] text-slate-400 font-bold">Fuzzy Hair Colors:</span>
            {selectedMascot.hairColors.map((color, i) => (
              <div
                key={i}
                className="w-3.5 h-3.5 rounded-full border border-white/40 shadow-sm"
                style={{ backgroundColor: color }}
              />
            ))}
          </div>

          {/* Ability & Multiplier Box */}
          <div className="w-full p-2.5 rounded-xl bg-slate-950/90 border border-slate-800 text-left mb-2">
            <div className="flex items-center justify-between mb-0.5">
              <div className="flex items-center gap-1.5 text-xs font-black text-cyan-300">
                <Zap className="w-3.5 h-3.5 text-cyan-400" />
                <span>Superpower: {selectedMascot.uniqueAbility.name}</span>
              </div>
              <span className="text-[11px] font-black text-amber-300 bg-amber-950/80 border border-amber-500/40 px-2 py-0.5 rounded-full">
                {selectedMascot.uniqueAbility.multiplier}x Multiplier
              </span>
            </div>
            <p className="text-[11px] text-slate-300 leading-tight">
              {selectedMascot.uniqueAbility.description}
            </p>
          </div>

          {/* LEVEL UP SYSTEM PANEL */}
          <div className="w-full p-3 rounded-2xl bg-gradient-to-b from-indigo-950 to-slate-900 border border-amber-500/40 text-left mb-2.5 shadow-md">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5">
                <Award className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-black text-white uppercase tracking-wider">
                  Ability Multiplier Level-Up
                </span>
              </div>
              <span className="text-[10px] font-black text-amber-400">
                Rank {selectedMascot.level}/{MAX_MASCOT_LEVEL}
              </span>
            </div>

            {/* Level Progress Pip Bar */}
            <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800 mb-2">
              <div
                className="h-full bg-gradient-to-r from-cyan-400 via-pink-500 to-amber-400 transition-all duration-500"
                style={{ width: `${(selectedMascot.level / MAX_MASCOT_LEVEL) * 100}%` }}
              />
            </div>

            {/* Multiplier Progression Display */}
            {!isMaxLevel ? (
              <div className="flex items-center justify-between bg-slate-950/80 rounded-xl p-2 border border-slate-800 mb-2 text-xs">
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">Current Boost</span>
                  <span className="text-sm font-black text-cyan-300">
                    {selectedMascot.uniqueAbility.multiplier}x
                  </span>
                </div>
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-[10px] font-black">
                  <TrendingUp className="w-3 h-3 text-emerald-400" />
                  <span>+{multiplierGain > 0 ? multiplierGain : 0.15}x</span>
                </div>
                <div className="text-right">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">Next Level ({selectedMascot.level + 1})</span>
                  <span className="text-sm font-black text-amber-300">
                    {nextMultiplier}x
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-2 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-center mb-2">
                <span className="text-xs font-black text-emerald-300 flex items-center justify-center gap-1">
                  ⭐ MAX LEVEL ABILITY (2.85x - 5.6x Multiplier Peak) ⭐
                </span>
              </div>
            )}

            {/* Upgrade Action Button */}
            {!isMaxLevel ? (
              <motion.button
                whileTap={{ scale: 0.96 }}
                disabled={!canAfford}
                onClick={() => onUpgradeMascot(selectedMascot.id)}
                className={`w-full py-2.5 px-3 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-between transition-all shadow-md ${
                  canAfford
                    ? 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 hover:brightness-110 active:brightness-95 shadow-[0_0_15px_rgba(251,191,36,0.5)]'
                    : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <ArrowUpCircle className="w-4 h-4" />
                  <span>Level Up to Lv.{selectedMascot.level + 1}</span>
                </div>
                <div className="flex items-center gap-1 bg-black/20 px-2 py-0.5 rounded-lg text-xs font-black">
                  <span>{upgradeCost.toLocaleString()}</span>
                  <span>🪙</span>
                </div>
              </motion.button>
            ) : (
              <div className="w-full py-2 rounded-xl bg-slate-950 text-slate-400 border border-slate-800 text-center text-xs font-bold">
                Maxed Out! Maximum Resource Harvesting Efficiency!
              </div>
            )}

            {!canAfford && !isMaxLevel && (
              <div className="text-[10px] text-rose-400 font-bold text-center mt-1">
                Need {(upgradeCost - coins).toLocaleString()} more 🪙 (You have {coins.toLocaleString()} 🪙)
              </div>
            )}
          </div>

          {/* TTS Voice Line Player Button (gemini-3.1-flash-tts-preview) */}
          <button
            onClick={() => handleSpeakMascot(selectedMascot)}
            disabled={isPlayingTts}
            className="w-full py-2 px-3 rounded-xl bg-slate-900 border border-fuchsia-500/40 hover:bg-slate-800 text-fuchsia-300 text-xs font-bold flex items-center justify-center gap-2 transition-all"
          >
            {isPlayingTts ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Volume2 className="w-3.5 h-3.5 text-fuchsia-400" />
            )}
            <span>
              {isPlayingTts ? 'Speaking...' : `Hear ${selectedMascot.name}'s Voice (TTS)`}
            </span>
          </button>
        </div>

        {/* Action Button: Equip Mascot */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            onSelectMascot(selectedMascot.id);
            SoundEngine.playCoinChime();
            onClose();
          }}
          disabled={isEquipped}
          className={`w-full py-3 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all ${
            isEquipped
              ? 'bg-slate-800 text-slate-400 border border-slate-700 cursor-default'
              : 'bg-gradient-to-r from-fuchsia-600 via-pink-500 to-rose-500 text-white hover:brightness-110 active:brightness-95'
          }`}
        >
          {isEquipped ? (
            <>
              <Check className="w-4 h-4 text-emerald-400" />
              <span>Currently Active Mascot</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Equip {selectedMascot.name} (Lv.{selectedMascot.level})</span>
            </>
          )}
        </motion.button>
      </motion.div>
    </div>
  );
};

