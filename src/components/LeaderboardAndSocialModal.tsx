import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  Trophy, Share2, Users, Flame, Star, Shield, 
  Copy, Check, Twitter, Send, X, Swords, ArrowUpRight, Award, Sparkles
} from 'lucide-react';
import { LeaderboardEntry, Mascot, GameState, MascotBurrow } from '../types';
import { MascotAvatar } from './MascotAvatar';
import { SoundEngine } from '../utils/sound';
import { ACHIEVEMENTS, getAchievementProgress } from '../data/achievementsData';
import { AchievementsSection } from './AchievementsSection';

interface LeaderboardAndSocialModalProps {
  isOpen: boolean;
  playerName: string;
  playerScore: number;
  townLevel: number;
  activeMascot: Mascot;
  shields: number;
  highestStreak: number;
  gameState?: GameState;
  currentBurrows?: Record<string, MascotBurrow>;
  initialTab?: 'leaderboard' | 'achievements' | 'social';
  onClaimAchievement?: (achievementId: string) => void;
  onClaimAllAchievements?: () => void;
  onLaunchRaid: (targetPlayer: LeaderboardEntry) => void;
  onClose: () => void;
}

export const LeaderboardAndSocialModal: React.FC<LeaderboardAndSocialModalProps> = ({
  isOpen,
  playerName,
  playerScore,
  townLevel,
  activeMascot,
  shields,
  highestStreak,
  gameState,
  currentBurrows,
  initialTab = 'leaderboard',
  onClaimAchievement,
  onClaimAllAchievements,
  onLaunchRaid,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'achievements' | 'social'>(initialTab);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  // Sync initialTab when modal opens
  useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  // Compute number of ready-to-claim achievements
  const unclaimedCount = useMemo(() => {
    if (!gameState) return 0;
    return ACHIEVEMENTS.filter((achievement) => {
      const progress = getAchievementProgress(achievement, gameState, currentBurrows);
      return progress.isCompleted && !progress.isClaimed;
    }).length;
  }, [gameState, currentBurrows]);

  // Fetch or submit leaderboard
  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);

    fetch('/api/leaderboard', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: playerName,
        score: playerScore,
        townLevel,
        mascot: activeMascot.name,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.leaderboard) {
          setLeaderboard(data.leaderboard);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [isOpen, playerName, playerScore, townLevel, activeMascot.name]);

  const handleCopyLink = () => {
    const shareText = `Can you beat my ${playerScore.toLocaleString()} Reflex Score in Neon Fuzz Reflex Puzzles? I'm already at Town Lv.${townLevel} with mascot ${activeMascot.name}! Play here: ${window.location.origin}`;
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    SoundEngine.playCoinChime();
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareTwitter = () => {
    const tweetText = `Just hit a ${highestStreak}X reflex combo streak in #NeonFuzzGame! ⚡ My fuzzy mascot ${activeMascot.name} and I are dominating Town Lv.${townLevel}! Can you beat my score of ${playerScore.toLocaleString()}?`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent(window.location.origin)}`;
    window.open(url, '_blank');
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Neon Fuzz Reflex Puzzles',
          text: `I scored ${playerScore.toLocaleString()} points in Neon Fuzz! Challenge my fuzzy squad!`,
          url: window.location.origin,
        });
      } catch (err) {}
    } else {
      handleCopyLink();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-md">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-md rounded-3xl bg-[#0a0d24] border-2 border-fuchsia-500/50 p-4 sm:p-5 shadow-[0_0_50px_rgba(255,0,127,0.3)] flex flex-col relative max-h-[92vh] overflow-y-auto custom-scrollbar"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-all z-20"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-fuchsia-600 to-amber-500 flex items-center justify-center text-white shadow-md">
            <Trophy className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5">
              <span>Hall of Fame & Trophies</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            </h3>
            <p className="text-[10px] text-fuchsia-300 font-bold">
              Global Ranks • Milestones • Community Raids
            </p>
          </div>
        </div>

        {/* Modal 3-Tab Switch */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-900 border border-slate-800 mb-4">
          <button
            onClick={() => {
              SoundEngine.playTileStep();
              setActiveTab('leaderboard');
            }}
            className={`flex-1 py-2 px-1 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'leaderboard'
                ? 'bg-gradient-to-r from-fuchsia-600 to-pink-500 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>Leaderboard</span>
          </button>

          <button
            onClick={() => {
              SoundEngine.playTileStep();
              setActiveTab('achievements');
            }}
            className={`flex-1 py-2 px-1 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all relative ${
              activeTab === 'achievements'
                ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 shadow font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Achievements</span>
            {unclaimedCount > 0 && (
              <span className="flex items-center justify-center min-w-4 h-4 px-1 rounded-full bg-pink-500 text-white text-[9px] font-black shadow-sm animate-pulse ml-0.5">
                {unclaimedCount}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              SoundEngine.playTileStep();
              setActiveTab('social');
            }}
            className={`flex-1 py-2 px-1 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'social'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Social</span>
          </button>
        </div>

        {/* TAB 1: GLOBAL LEADERBOARDS */}
        {activeTab === 'leaderboard' && (
          <div className="flex flex-col">
            {/* Player's Highlight Bar */}
            <div className="p-3 rounded-2xl bg-gradient-to-r from-indigo-950 via-purple-950 to-slate-900 border border-fuchsia-500/50 mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <MascotAvatar mascot={activeMascot} size="sm" interactive={false} />
                <div>
                  <div className="text-[10px] text-fuchsia-300 font-bold uppercase">
                    Your Standing
                  </div>
                  <div className="text-xs font-black text-white flex items-center gap-1">
                    <span>{playerName}</span>
                    <span className="text-[10px] text-slate-400">(Town Lv.{townLevel})</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-slate-400 font-bold uppercase">Reflex Score</div>
                <div className="text-sm font-black text-amber-400">
                  {playerScore.toLocaleString()}
                </div>
              </div>
            </div>

            {/* Leaderboard Table List */}
            <div className="max-h-[260px] overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
              {leaderboard.map((entry, idx) => {
                const isMe = entry.name.toLowerCase() === playerName.toLowerCase();
                const rank = idx + 1;

                return (
                  <div
                    key={entry.id}
                    className={`p-2.5 rounded-xl border flex items-center justify-between text-xs transition-all ${
                      isMe
                        ? 'bg-fuchsia-950/40 border-fuchsia-500/60 shadow-[0_0_12px_rgba(255,0,127,0.2)]'
                        : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      {/* Rank Medal */}
                      <div className="w-5 text-center font-black">
                        {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`}
                      </div>

                      <div>
                        <div className="font-bold text-white flex items-center gap-1.5">
                          <span>{entry.name}</span>
                          <span className="text-[10px] text-slate-400">{entry.country}</span>
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Town {entry.townLevel} • {entry.mascot}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-black text-amber-400">
                        {entry.score.toLocaleString()}
                      </span>
                      {!isMe && (
                        <button
                          onClick={() => {
                            onLaunchRaid(entry);
                            onClose();
                          }}
                          className="p-1.5 rounded-lg bg-red-950/80 border border-red-500/40 text-red-300 hover:bg-red-900 active:scale-90"
                          title="Raid Rival Vault"
                        >
                          <Swords className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: MILESTONES & ACHIEVEMENTS */}
        {activeTab === 'achievements' && gameState && (
          <AchievementsSection
            gameState={gameState}
            currentBurrows={currentBurrows}
            onClaimAchievement={(id) => {
              if (onClaimAchievement) {
                onClaimAchievement(id);
              }
            }}
            onClaimAllAchievements={() => {
              if (onClaimAllAchievements) {
                onClaimAllAchievements();
              }
            }}
          />
        )}

        {/* TAB 3: SOCIAL MEDIA INTEGRATION & BRAG CARD */}
        {activeTab === 'social' && (
          <div className="flex flex-col items-center">
            {/* Neon Brag Card Visual */}
            <div className="w-full p-4 rounded-2xl bg-gradient-to-br from-indigo-950 via-slate-900 to-fuchsia-950 border-2 border-cyan-400/50 shadow-xl mb-4 relative overflow-hidden flex flex-col items-center text-center">
              <div className="absolute top-2 right-2 text-[9px] font-black uppercase text-cyan-300 bg-cyan-950 px-2 py-0.5 rounded-full border border-cyan-500/30">
                #NeonFuzz
              </div>

              <MascotAvatar mascot={activeMascot} size="md" isDancing={true} />

              <h4 className="text-base font-black text-white mt-1">{playerName}</h4>
              <p className="text-xs text-fuchsia-300 font-bold mb-3">
                Town Master Lv.{townLevel} • {activeMascot.name} Squad
              </p>

              <div className="w-full grid grid-cols-2 gap-2 text-left">
                <div className="bg-slate-950/80 p-2 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Reflex Score</span>
                  <div className="text-sm font-black text-amber-400">{playerScore.toLocaleString()}</div>
                </div>
                <div className="bg-slate-950/80 p-2 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Highest Streak</span>
                  <div className="text-sm font-black text-orange-400">{highestStreak}X Combo</div>
                </div>
              </div>
            </div>

            {/* Social Share Buttons */}
            <div className="w-full space-y-2">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleNativeShare}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md hover:brightness-110"
              >
                <Share2 className="w-4 h-4" />
                <span>Share Brag Card (Instagram / Chat)</span>
              </motion.button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleShareTwitter}
                  className="py-2.5 rounded-xl bg-slate-900 border border-sky-500/40 text-sky-400 hover:bg-slate-800 text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                >
                  <Twitter className="w-3.5 h-3.5" />
                  <span>Post to X</span>
                </button>
                <button
                  onClick={handleCopyLink}
                  className="py-2.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-slate-500 text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy Link'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};
