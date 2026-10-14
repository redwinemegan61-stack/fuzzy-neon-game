import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Globe, ExternalLink, CheckCircle2, XCircle, Sparkles, X, Loader2 } from 'lucide-react';
import { TriviaQuestion, Mascot } from '../types';
import { SoundEngine } from '../utils/sound';
import { MascotAvatar } from './MascotAvatar';
import confetti from 'canvas-confetti';

interface TriviaModalProps {
  isOpen: boolean;
  activeMascot: Mascot;
  rollMultiplier: number;
  onReward: (coins: number, dice: number) => void;
  onClose: () => void;
}

export const TriviaModal: React.FC<TriviaModalProps> = ({
  isOpen,
  activeMascot,
  rollMultiplier,
  onReward,
  onClose,
}) => {
  const [trivia, setTrivia] = useState<TriviaQuestion | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    setLoading(true);
    setSelectedIndex(null);
    setHasAnswered(false);

    fetch('/api/trivia/daily-search')
      .then((res) => res.json())
      .then((data) => {
        setTrivia(data);
      })
      .catch((err) => {
        console.error(err);
        setTrivia({
          question: 'Which iconic arcade game first introduced the concept of high score leaderboards?',
          options: ['Space Invaders (1978)', 'Pac-Man (1980)', 'Asteroids (1979)', 'Donkey Kong (1981)'],
          correctIndex: 2,
          explanation: 'Asteroids was the first video game to allow high-scoring players to enter their initials for posterity!',
          sources: [{ title: 'Arcade History Archives', uri: 'https://en.wikipedia.org/wiki/Asteroids_(video_game)' }],
        });
      })
      .finally(() => setLoading(false));
  }, [isOpen]);

  const handleSelectOption = (idx: number) => {
    if (hasAnswered || !trivia) return;
    setSelectedIndex(idx);
    setHasAnswered(true);

    const isCorrect = idx === trivia.correctIndex;
    if (isCorrect) {
      SoundEngine.playUpgradeFanfare();
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });
      let coinsWon = 4000 * rollMultiplier;
      let diceWon = 3 * rollMultiplier;
      if (activeMascot.uniqueAbility.effectType === 'bonus_coins') {
        coinsWon = Math.round(coinsWon * activeMascot.uniqueAbility.multiplier);
      }
      if (activeMascot.uniqueAbility.effectType === 'lucky_dice') {
        diceWon = Math.round(diceWon + (activeMascot.uniqueAbility.multiplier * 2));
      }
      setTimeout(() => {
        onReward(coinsWon, diceWon);
      }, 2000);
    } else {
      SoundEngine.playErrorBuzz();
      setTimeout(() => {
        onReward(800 * rollMultiplier, 1);
      }, 2500);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-md">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-sm rounded-3xl bg-[#0a0d24] border-2 border-cyan-500/50 p-5 shadow-[0_0_50px_rgba(0,240,255,0.3)] flex flex-col relative overflow-hidden"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-all z-20"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-black uppercase text-cyan-400 tracking-wider">
                Google Search Grounding
              </span>
              <span className="text-[9px] bg-indigo-900/80 text-cyan-300 font-bold px-1.5 py-0.5 rounded-full">
                Gemini 3.8 Flash
              </span>
            </div>
            <h3 className="text-base font-black text-white">Daily Cyber Trivia</h3>
          </div>
        </div>

        {/* Active Mascot Companion Assistant */}
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
                <span className="text-xs font-black text-white">Intel Partner: {activeMascot.name}</span>
              </div>
              <span className="text-[10px] text-cyan-300 font-bold">
                ⚡ {activeMascot.uniqueAbility.multiplier}x Multiplier Boost Active
              </span>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="min-h-[220px] flex flex-col items-center justify-center text-center">
            <Loader2 className="w-8 h-8 text-cyan-400 animate-spin mb-2" />
            <span className="text-xs font-bold text-slate-300">
              Querying Google Search Grounding...
            </span>
          </div>
        ) : trivia ? (
          <div className="flex flex-col">
            {/* Mascot Tip */}
            <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-900/80 border border-slate-800 mb-3">
              <MascotAvatar mascot={activeMascot} size="sm" interactive={false} />
              <p className="text-[11px] text-cyan-200 font-bold">
                "{activeMascot.name}: Answer correctly for {4000 * rollMultiplier} 🪙 and +{3 * rollMultiplier} 🎲!"
              </p>
            </div>

            {/* Question Text */}
            <h4 className="text-sm font-bold text-white mb-3 leading-snug">
              {trivia.question}
            </h4>

            {/* Options List */}
            <div className="space-y-2 mb-3">
              {trivia.options.map((option, idx) => {
                const isSelected = selectedIndex === idx;
                const isCorrect = idx === trivia.correctIndex;

                let btnStyles = 'bg-slate-900/80 border-slate-800 text-slate-200 hover:border-cyan-500/40';
                if (hasAnswered) {
                  if (isCorrect) {
                    btnStyles = 'bg-emerald-950/80 border-emerald-500 text-emerald-300 shadow-[0_0_12px_rgba(52,211,153,0.3)]';
                  } else if (isSelected) {
                    btnStyles = 'bg-rose-950/80 border-rose-500 text-rose-300';
                  }
                }

                return (
                  <motion.button
                    key={idx}
                    whileTap={!hasAnswered ? { scale: 0.98 } : undefined}
                    disabled={hasAnswered}
                    onClick={() => handleSelectOption(idx)}
                    className={`w-full p-2.5 rounded-xl border text-left text-xs font-bold transition-all flex items-center justify-between ${btnStyles}`}
                  >
                    <span>{option}</span>
                    {hasAnswered && isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />}
                    {hasAnswered && isSelected && !isCorrect && <XCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />}
                  </motion.button>
                );
              })}
            </div>

            {/* Explanation & Grounding Sources */}
            {hasAnswered && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-xl bg-slate-950/90 border border-slate-800 text-[11px] mb-2"
              >
                <div className="font-bold text-slate-300 mb-1">{trivia.explanation}</div>
                {trivia.sources && trivia.sources.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-slate-800 flex flex-wrap gap-2 items-center">
                    <span className="text-[10px] text-slate-400 font-bold">Sources:</span>
                    {trivia.sources.map((src, i) => (
                      <a
                        key={i}
                        href={src.uri}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] text-cyan-400 hover:underline flex items-center gap-0.5"
                      >
                        <span>{src.title}</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </div>
        ) : null}
      </motion.div>
    </div>
  );
};
