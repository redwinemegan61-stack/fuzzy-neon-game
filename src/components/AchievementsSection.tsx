import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, CheckCircle2, Gift, Sparkles, 
  Coins, Dices, ChevronRight, Check, Award
} from 'lucide-react';
import { GameState, MascotBurrow, AchievementCategory } from '../types';
import { ACHIEVEMENTS, getAchievementProgress, AchievementProgress } from '../data/achievementsData';
import { SoundEngine } from '../utils/sound';
import confetti from 'canvas-confetti';

interface AchievementsSectionProps {
  gameState: GameState;
  currentBurrows?: Record<string, MascotBurrow>;
  onClaimAchievement: (achievementId: string) => void;
  onClaimAllAchievements: () => void;
}

export const AchievementsSection: React.FC<AchievementsSectionProps> = ({
  gameState,
  currentBurrows,
  onClaimAchievement,
  onClaimAllAchievements,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<AchievementCategory | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unclaimed' | 'completed' | 'in_progress'>('all');

  // Compute progress for all achievements
  const achievementsWithProgress = useMemo(() => {
    return ACHIEVEMENTS.map((achievement) => ({
      achievement,
      progress: getAchievementProgress(achievement, gameState, currentBurrows),
    }));
  }, [gameState, currentBurrows]);

  // Overall stats
  const totalAchievements = achievementsWithProgress.length;
  const completedAchievements = achievementsWithProgress.filter((item) => item.progress.isCompleted).length;
  const claimedAchievements = achievementsWithProgress.filter((item) => item.progress.isClaimed).length;
  const unclaimedAchievements = achievementsWithProgress.filter(
    (item) => item.progress.isCompleted && !item.progress.isClaimed
  );

  const totalPoints = ACHIEVEMENTS.reduce((sum, a) => sum + a.rewardPoints, 0);
  const earnedPoints = achievementsWithProgress.reduce((sum, item) => {
    return item.progress.isCompleted ? sum + item.achievement.rewardPoints : sum;
  }, 0);

  // Filtered achievements
  const filteredList = useMemo(() => {
    return achievementsWithProgress.filter(({ achievement, progress }) => {
      // Category filter
      if (selectedCategory !== 'all' && achievement.category !== selectedCategory) {
        return false;
      }
      // Status filter
      if (statusFilter === 'unclaimed') {
        return progress.isCompleted && !progress.isClaimed;
      }
      if (statusFilter === 'completed') {
        return progress.isCompleted;
      }
      if (statusFilter === 'in_progress') {
        return !progress.isCompleted;
      }
      return true;
    });
  }, [achievementsWithProgress, selectedCategory, statusFilter]);

  const handleClaim = (achievementId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    SoundEngine.playComboChime(5);
    SoundEngine.playCoinChime();
    confetti({
      particleCount: 40,
      spread: 60,
      origin: { y: 0.6 },
    });
    onClaimAchievement(achievementId);
  };

  const handleClaimAll = () => {
    SoundEngine.playUpgradeFanfare();
    confetti({
      particleCount: 80,
      spread: 90,
      origin: { y: 0.6 },
    });
    onClaimAllAchievements();
  };

  return (
    <div className="flex flex-col space-y-3">
      {/* 1. Milestone Progress Overview Banner */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-950/90 via-indigo-950/90 to-slate-900 border border-fuchsia-500/40 shadow-lg relative overflow-hidden">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
              <Trophy className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-fuchsia-300 font-bold uppercase tracking-wider">
                Milestone Mastery
              </div>
              <div className="text-sm font-black text-white flex items-center gap-1.5">
                <span>{completedAchievements} / {totalAchievements} Unlocked</span>
                <span className="text-[10px] text-amber-300 font-bold px-1.5 py-0.2 rounded-md bg-amber-500/20 border border-amber-500/30">
                  {earnedPoints} AP
                </span>
              </div>
            </div>
          </div>

          {unclaimedAchievements.length > 0 && (
            <motion.button
              whileTap={{ scale: 0.94 }}
              animate={{ scale: [1, 1.04, 1] }}
              transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
              onClick={handleClaimAll}
              className="py-1.5 px-3 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-[0_0_15px_rgba(251,191,36,0.6)]"
            >
              <Gift className="w-3.5 h-3.5" />
              <span>Claim All ({unclaimedAchievements.length})</span>
            </motion.button>
          )}
        </div>

        {/* Global Progress Bar */}
        <div className="w-full bg-slate-950/80 h-2 rounded-full overflow-hidden border border-slate-800 relative">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.round((completedAchievements / totalAchievements) * 100)}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="h-full bg-gradient-to-r from-cyan-400 via-pink-500 to-amber-400 rounded-full"
          />
        </div>
        <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold mt-1">
          <span>{Math.round((completedAchievements / totalAchievements) * 100)}% Complete</span>
          <span>{totalPoints - earnedPoints} AP Remaining</span>
        </div>
      </div>

      {/* 2. Filter Bar: Categories */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 custom-scrollbar text-[11px] font-bold">
        {[
          { id: 'all', label: 'All', emoji: '🌟' },
          { id: 'wealth', label: 'Wealth', emoji: '🪙' },
          { id: 'burrow', label: 'Burrows', emoji: '🏡' },
          { id: 'puzzles', label: 'Puzzles', emoji: '⚡' },
          { id: 'mascots', label: 'Mascots', emoji: '🐾' },
          { id: 'adventure', label: 'Adventure', emoji: '🌆' },
        ].map((cat) => {
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => {
                SoundEngine.playTileStep();
                setSelectedCategory(cat.id as any);
              }}
              className={`px-2.5 py-1 rounded-xl whitespace-nowrap flex items-center gap-1 transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-fuchsia-600 to-pink-500 text-white shadow-sm'
                  : 'bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <span>{cat.emoji}</span>
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3. Status Tabs (All / Ready to Claim / In Progress) */}
      <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 px-1">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setStatusFilter('all')}
            className={`hover:text-white transition-colors ${statusFilter === 'all' ? 'text-amber-400 font-black underline underline-offset-4' : ''}`}
          >
            All ({filteredList.length})
          </button>
          {unclaimedAchievements.length > 0 && (
            <button
              onClick={() => setStatusFilter('unclaimed')}
              className={`flex items-center gap-1 text-emerald-400 hover:text-emerald-300 transition-colors ${statusFilter === 'unclaimed' ? 'font-black underline underline-offset-4' : ''}`}
            >
              <Sparkles className="w-2.5 h-2.5" />
              <span>Ready ({unclaimedAchievements.length})</span>
            </button>
          )}
          <button
            onClick={() => setStatusFilter('in_progress')}
            className={`hover:text-white transition-colors ${statusFilter === 'in_progress' ? 'text-cyan-400 font-black underline underline-offset-4' : ''}`}
          >
            In Progress
          </button>
          <button
            onClick={() => setStatusFilter('completed')}
            className={`hover:text-white transition-colors ${statusFilter === 'completed' ? 'text-pink-400 font-black underline underline-offset-4' : ''}`}
          >
            Done
          </button>
        </div>
        <span className="text-[9px] text-slate-500">
          Showing {filteredList.length} of {totalAchievements}
        </span>
      </div>

      {/* 4. Achievements Scrollable Cards List */}
      <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
        <AnimatePresence>
          {filteredList.map(({ achievement, progress }) => {
            const isReadyToClaim = progress.isCompleted && !progress.isClaimed;
            const isClaimed = progress.isClaimed;

            return (
              <motion.div
                key={achievement.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`p-3 rounded-2xl border transition-all ${
                  isReadyToClaim
                    ? 'bg-gradient-to-r from-amber-950/40 via-purple-950/40 to-slate-900 border-amber-400/60 shadow-[0_0_15px_rgba(251,191,36,0.25)]'
                    : isClaimed
                    ? 'bg-slate-950/60 border-emerald-500/30'
                    : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Emoji / Badge Icon */}
                  <div
                    className={`w-10 h-10 rounded-2xl flex-shrink-0 flex items-center justify-center text-lg border ${
                      isReadyToClaim
                        ? 'bg-amber-500/20 border-amber-400/60 shadow-[0_0_10px_rgba(251,191,36,0.3)] animate-pulse'
                        : isClaimed
                        ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-400'
                        : 'bg-slate-800/60 border-slate-700/60'
                    }`}
                  >
                    <span>{achievement.emoji}</span>
                  </div>

                  {/* Title, Description & Progress */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <h4 className="text-xs font-black text-white truncate flex items-center gap-1.5">
                        <span>{achievement.title}</span>
                        {isClaimed && (
                          <span className="text-[9px] text-emerald-400 font-bold bg-emerald-950/60 px-1.5 py-0.2 rounded-md border border-emerald-500/40 flex items-center gap-0.5">
                            <Check className="w-2.5 h-2.5" /> Done
                          </span>
                        )}
                      </h4>
                      <span className="text-[10px] font-black text-amber-300 bg-amber-950/60 border border-amber-500/30 px-1.5 py-0.2 rounded-md flex-shrink-0">
                        +{achievement.rewardPoints} AP
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-300 font-medium leading-tight mb-2">
                      {achievement.description}
                    </p>

                    {/* Progress Bar & Target */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[10px] font-bold">
                        <span className="text-slate-400">
                          Progress:{' '}
                          <span className={progress.isCompleted ? 'text-amber-300' : 'text-slate-200'}>
                            {progress.current.toLocaleString()} / {progress.target.toLocaleString()}
                          </span>
                          {achievement.unit && !['🪙', 'Shields'].includes(achievement.unit) && (
                            <span className="text-slate-500 text-[9px] ml-1">({achievement.unit})</span>
                          )}
                        </span>
                        <span className={progress.isCompleted ? 'text-emerald-400 font-black' : 'text-slate-400'}>
                          {progress.percent}%
                        </span>
                      </div>

                      <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-800/80">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isClaimed
                              ? 'bg-emerald-400'
                              : isReadyToClaim
                              ? 'bg-gradient-to-r from-amber-400 to-yellow-300'
                              : 'bg-gradient-to-r from-cyan-400 to-blue-500'
                          }`}
                          style={{ width: `${progress.percent}%` }}
                        />
                      </div>
                    </div>

                    {/* Bottom Action Area */}
                    <div className="mt-2 pt-2 border-t border-slate-800/50 flex items-center justify-between">
                      {/* Rewards Preview */}
                      <div className="flex items-center gap-2 text-[10px] font-bold text-slate-300">
                        <span className="text-slate-400 text-[9px] uppercase">Reward:</span>
                        <span className="flex items-center gap-0.5 text-amber-300">
                          <Coins className="w-3 h-3 text-amber-400" />
                          <span>+{achievement.rewardCoins.toLocaleString()}</span>
                        </span>
                        <span className="flex items-center gap-0.5 text-cyan-300">
                          <Dices className="w-3 h-3 text-cyan-400" />
                          <span>+{achievement.rewardRolls}</span>
                        </span>
                      </div>

                      {/* Claim or Claimed State Button */}
                      {isReadyToClaim ? (
                        <motion.button
                          whileTap={{ scale: 0.94 }}
                          animate={{ scale: [1, 1.05, 1] }}
                          transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
                          onClick={(e) => handleClaim(achievement.id, e)}
                          className="py-1 px-3 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-[0_0_12px_rgba(251,191,36,0.5)] transition-all"
                        >
                          <Gift className="w-3 h-3" />
                          <span>Claim Reward</span>
                        </motion.button>
                      ) : isClaimed ? (
                        <div className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Claimed</span>
                        </div>
                      ) : (
                        <div className="text-[9px] font-bold text-slate-400 flex items-center gap-0.5">
                          <span>In Progress</span>
                          <ChevronRight className="w-3 h-3" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {filteredList.length === 0 && (
          <div className="p-8 text-center text-slate-400 text-xs">
            <Trophy className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="font-bold">No achievements found in this filter.</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Keep rolling and exploring to make progress!</p>
          </div>
        )}
      </div>
    </div>
  );
};
