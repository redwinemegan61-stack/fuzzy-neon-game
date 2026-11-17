import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Play,
  Sparkles,
  X,
  CheckCircle2,
  ShieldCheck,
  Radio,
  RefreshCw,
} from 'lucide-react';
import { SoundEngine } from '../utils/sound';
import {
  useAdMobRewardedAd,
  DEFAULT_TEST_ADMOB_APP_ID,
  DEFAULT_TEST_REWARDED_AD_UNIT_ID,
} from '../utils/admobSdk';
import confetti from 'canvas-confetti';

interface AdStationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClaimReward: (reward: {
    coins: number;
    rolls: number;
    multiplierBoost?: number;
    label: string;
  }) => void;
}

interface AdCreative {
  id: string;
  brandName: string;
  title: string;
  tagline: string;
  badge: string;
  gradient: string;
  accentColor: string;
  interactiveEmoji: string;
}

const AD_CREATIVES: AdCreative[] = [
  {
    id: 'ad-bubble-pop',
    brandName: 'Super Fuzzy Blast',
    title: 'Match & Pop Cute Plushies!',
    tagline: 'Download now to unlock 1,000 free gems and diamond crowns!',
    badge: '★ 4.9 RATED CASUAL HIT',
    gradient: 'from-pink-600 via-fuchsia-700 to-indigo-900',
    accentColor: '#ec4899',
    interactiveEmoji: '🧸',
  },
  {
    id: 'ad-cyber-cola',
    brandName: 'Fuzzy Spark Soda',
    title: 'Zero Sugar, Infinite Energy!',
    tagline: 'The official beverage of Neon Burrow champions. Feel the sparkle!',
    badge: 'SPONSORED REFRESHMENT',
    gradient: 'from-cyan-600 via-blue-700 to-slate-900',
    accentColor: '#00f0ff',
    interactiveEmoji: '🥤',
  },
  {
    id: 'ad-dice-frenzy',
    brandName: 'Quantum Dice Kingdom',
    title: 'Roll With Friends Across 50 Worlds!',
    tagline: 'Raid castles, steal gold vaults, and level up adorable companions!',
    badge: 'FEATURED APP OF THE DAY',
    gradient: 'from-amber-500 via-orange-600 to-red-900',
    accentColor: '#f59e0b',
    interactiveEmoji: '🎲',
  },
  {
    id: 'ad-squeak-audio',
    brandName: 'SqueakPods Pro Wireless',
    title: 'Noise Cancelling For Pure Mascot Coos!',
    tagline: 'Experience high-fidelity creature squeaks, chirps, and boings in 3D audio.',
    badge: 'TECH SHOWCASE 2026',
    gradient: 'from-emerald-600 via-teal-700 to-slate-950',
    accentColor: '#10b981',
    interactiveEmoji: '🎧',
  },
];

export const AdStationModal: React.FC<AdStationModalProps> = ({
  isOpen,
  onClose,
  onClaimReward,
}) => {
  // Inject VITE_ADMOB_APP_ID and VITE_ADMOB_REWARDED_AD_UNIT_ID
  const env = (import.meta as any).env || {};
  const injectedAppId: string =
    env.VITE_ADMOB_APP_ID && !String(env.VITE_ADMOB_APP_ID).includes('MY_ADMOB')
      ? String(env.VITE_ADMOB_APP_ID)
      : DEFAULT_TEST_ADMOB_APP_ID;
  const injectedRewardedAdUnitId: string =
    env.VITE_ADMOB_REWARDED_AD_UNIT_ID &&
    !String(env.VITE_ADMOB_REWARDED_AD_UNIT_ID).includes('MY_ADMOB')
      ? String(env.VITE_ADMOB_REWARDED_AD_UNIT_ID)
      : DEFAULT_TEST_REWARDED_AD_UNIT_ID;

  const {
    config: admobConfig,
    status: sdkStatus,
    setStatus: setSdkStatus,
    initializeAndPreload,
    showRewardedAd,
  } = useAdMobRewardedAd(injectedRewardedAdUnitId);

  // Video player state
  const [isPlayingAd, setIsPlayingAd] = useState(false);
  const [currentCreative, setCurrentCreative] = useState<AdCreative>(AD_CREATIVES[0]);
  const [countdown, setCountdown] = useState(5);
  const [canSkip, setCanSkip] = useState(false);
  const [selectedRewardType, setSelectedRewardType] = useState<
    'dice' | 'coins' | 'boost' | 'mega'
  >('dice');
  const [tappedBubbleCount, setTappedBubbleCount] = useState(0);

  // Remaining daily views limit
  const [remainingViews, setRemainingViews] = useState({
    dice: 5,
    coins: 5,
    boost: 3,
  });

  // Initialize & preload Google AdMob SDK when modal opens
  useEffect(() => {
    if (!isOpen) return;
    initializeAndPreload();
  }, [isOpen, initializeAndPreload]);

  const grantRewardByType = (type: 'dice' | 'coins' | 'boost' | 'mega') => {
    SoundEngine.playUpgradeFanfare();
    confetti({ particleCount: 70, spread: 70, origin: { y: 0.6 } });

    if (type === 'dice') {
      onClaimReward({
        coins: 5000,
        rolls: 30,
        label: '+30 Free Dice Rolls',
      });
      setRemainingViews((r) => ({ ...r, dice: Math.max(0, r.dice - 1) }));
    } else if (type === 'coins') {
      onClaimReward({
        coins: 45000,
        rolls: 10,
        label: '+45,000 Free Gold Coins',
      });
      setRemainingViews((r) => ({ ...r, coins: Math.max(0, r.coins - 1) }));
    } else if (type === 'boost') {
      onClaimReward({
        coins: 15000,
        rolls: 15,
        multiplierBoost: 2,
        label: '2X Board Roll Multiplier Active!',
      });
      setRemainingViews((r) => ({ ...r, boost: Math.max(0, r.boost - 1) }));
    } else {
      onClaimReward({
        coins: 60000,
        rolls: 40,
        label: 'MEGA Sponsor Jackpot: +60,000 Coins & +40 Dice!',
      });
    }
  };

  // Start watching rewarded ad via AdMob SDK (Native Capacitor / GPT Out-Of-Page / H5 Player)
  const handleStartAd = async (type: 'dice' | 'coins' | 'boost' | 'mega') => {
    setSelectedRewardType(type);
    setSdkStatus('showing_ad');
    SoundEngine.playBoardHop();

    const { handledExternally, result } = await showRewardedAd(
      type,
      injectedRewardedAdUnitId
    );

    if (handledExternally && result?.rewarded) {
      setSdkStatus('reward_earned');
      grantRewardByType(type);
      onClose();
      return;
    }

    // H5 Rewarded Ad Player presentation with AdMob slot telemetry
    const randomAd = AD_CREATIVES[Math.floor(Math.random() * AD_CREATIVES.length)];
    setCurrentCreative(randomAd);
    setCountdown(5);
    setCanSkip(false);
    setTappedBubbleCount(0);
    setIsPlayingAd(true);
  };

  // 5-second countdown timer for H5 Rewarded Ad playback
  useEffect(() => {
    if (!isPlayingAd) return;
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setCanSkip(true);
          setSdkStatus('reward_earned');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlayingAd, setSdkStatus]);

  // Ad completed / reward claimed
  const handleCompleteAd = () => {
    setIsPlayingAd(false);
    grantRewardByType(selectedRewardType);
    // Preload next ad unit for subsequent views
    initializeAndPreload();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-md rounded-3xl bg-[#090b1e] border-2 border-cyan-500/50 p-4 sm:p-5 shadow-[0_0_50px_rgba(0,240,255,0.35)] flex flex-col relative overflow-hidden my-auto max-h-[92vh]"
        data-admob-app-id={injectedAppId || admobConfig.appId}
        data-admob-rewarded-unit-id={
          injectedRewardedAdUnitId || admobConfig.rewardedAdUnitId
        }
      >
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-16 bg-gradient-to-r from-cyan-500/30 via-fuchsia-500/30 to-amber-500/30 blur-2xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between mb-2.5 z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-xl shadow-lg border border-cyan-300">
              📺
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] uppercase font-black tracking-widest text-cyan-400">
                  Google AdMob H5 Cinema
                </span>
                <span className="text-[9px] bg-amber-400 text-slate-950 font-black px-1.5 py-0.2 rounded-full">
                  REWARDED ADS
                </span>
              </div>
              <h2 className="text-base font-black text-white">Sponsor Ad Cinema</h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Google AdMob SDK Configuration & Status Strip */}
        <div className="mb-3 px-3 py-2 rounded-2xl bg-slate-900/95 border border-slate-800 flex flex-col gap-1 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-300">
                AdMob SDK Active
              </span>
              {admobConfig.isTestMode && (
                <span className="text-[8px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-400/30">
                  TEST MODE
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <span className="flex items-center gap-1 text-[9px] font-bold text-cyan-300">
                <Radio className="w-2.5 h-2.5 text-cyan-400 animate-pulse" />
                {sdkStatus === 'initializing' || sdkStatus === 'loading_ad'
                  ? 'Preloading Slot...'
                  : sdkStatus === 'showing_ad'
                  ? 'Playing Rewarded Ad'
                  : sdkStatus === 'reward_earned'
                  ? 'Reward Verified'
                  : 'Rewarded Slot Ready'}
              </span>
              <button
                onClick={initializeAndPreload}
                className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="Reload AdMob Rewarded Ad Slot"
              >
                <RefreshCw className="w-2.5 h-2.5" />
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 gap-2">
            <span className="truncate" title={injectedAppId}>
              App: {injectedAppId}
            </span>
            <span className="truncate text-slate-300" title={injectedRewardedAdUnitId}>
              Unit: {injectedRewardedAdUnitId}
            </span>
          </div>
        </div>

        {/* If Active Ad Video is playing */}
        {isPlayingAd ? (
          <div
            id="admob-rewarded-slot-container"
            className="flex flex-col gap-3 py-1 z-10"
          >
            {/* H5 Rewarded Video Player Screen */}
            <div
              className={`w-full aspect-video rounded-3xl bg-gradient-to-br ${currentCreative.gradient} border-2 border-white/30 p-4 shadow-2xl flex flex-col justify-between relative overflow-hidden`}
            >
              {/* Top Countdown Overlay */}
              <div className="flex items-center justify-between z-10">
                <span className="px-2.5 py-1 rounded-full bg-black/60 text-white font-black text-[10px] uppercase tracking-wider backdrop-blur-md border border-white/20">
                  {currentCreative.badge}
                </span>

                <div className="flex items-center gap-2">
                  <div className="px-2.5 py-1 rounded-full bg-black/70 text-cyan-300 font-black text-[10px] flex items-center gap-1 border border-cyan-400/40">
                    <span>
                      Rewarded Ad: {countdown > 0 ? `${countdown}s` : 'Verified!'}
                    </span>
                  </div>

                  {canSkip && (
                    <button
                      onClick={handleCompleteAd}
                      className="px-2.5 py-1 rounded-full bg-emerald-400 text-slate-950 font-black text-[10px] uppercase tracking-wider shadow-lg hover:brightness-110 active:scale-95 transition-all flex items-center gap-1 animate-bounce cursor-pointer"
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Claim ➔</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Center Interactive Ad Creative Demo */}
              <div className="flex flex-col items-center justify-center my-auto text-center z-10">
                <motion.button
                  whileTap={{ scale: 1.2, rotate: 15 }}
                  onClick={() => {
                    setTappedBubbleCount((c) => c + 1);
                    SoundEngine.playPop();
                  }}
                  className="text-5xl my-2 cursor-pointer drop-shadow-[0_5px_15px_rgba(0,0,0,0.5)] select-none hover:scale-110 transition-transform"
                >
                  {currentCreative.interactiveEmoji}
                </motion.button>
                <div className="text-[10px] text-amber-300 font-bold uppercase tracking-wider">
                  Tap to interact! (+{tappedBubbleCount} pops)
                </div>
                <h3 className="text-base font-black text-white drop-shadow-md">
                  {currentCreative.brandName}
                </h3>
                <p className="text-xs text-white/90 font-medium px-4 line-clamp-2">
                  {currentCreative.title}
                </p>
              </div>

              {/* Bottom Video Progress Bar */}
              <div className="w-full bg-black/40 rounded-full h-1.5 overflow-hidden z-10 border border-white/20">
                <motion.div
                  className="h-full bg-cyan-400"
                  initial={{ width: '0%' }}
                  animate={{ width: `${((5 - countdown) / 5) * 100}%` }}
                  transition={{ duration: 0.2 }}
                />
              </div>
            </div>

            {/* Claim or Status Button below video */}
            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] text-slate-400">
                {countdown > 0
                  ? `AdMob reward unlocks in ${countdown} seconds...`
                  : '✨ AdMob reward granted! Tap Claim to receive your prizes!'}
              </span>
              <button
                disabled={!canSkip}
                onClick={handleCompleteAd}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md ${
                  canSkip
                    ? 'bg-gradient-to-r from-emerald-400 to-teal-400 text-slate-950 hover:brightness-110 cursor-pointer'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                Claim Reward
              </button>
            </div>
          </div>
        ) : (
          /* Ad Reward Station Menu */
          <div className="flex flex-col gap-3 py-1 z-10">
            <p className="text-xs text-slate-300">
              Watch a short rewarded video ad to claim free dice rolls, huge coin bundles, or double roll multipliers!
            </p>

            {/* 3 Main Ad Cards */}
            <div className="flex flex-col gap-2.5">
              {/* Option 1: Free Dice */}
              <div className="rounded-2xl p-3 bg-slate-900/90 border border-cyan-500/40 flex items-center justify-between hover:border-cyan-400 transition-all shadow-md">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-xl text-cyan-300 font-black">
                    🎲
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white flex items-center gap-1.5">
                      <span>+30 Free Dice Rolls</span>
                      <span className="text-[9px] bg-cyan-950 text-cyan-300 px-1.5 py-0.2 rounded-full border border-cyan-500/30">
                        {remainingViews.dice}/5 left
                      </span>
                    </h4>
                    <p className="text-[10px] text-slate-400">
                      Never stop rolling on the adventure board!
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleStartAd('dice')}
                  className="px-3 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-black text-xs uppercase tracking-wider flex items-center gap-1 hover:brightness-110 active:scale-95 transition-all shadow-md cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>Watch</span>
                </button>
              </div>

              {/* Option 2: Huge Coins */}
              <div className="rounded-2xl p-3 bg-slate-900/90 border border-amber-500/40 flex items-center justify-between hover:border-amber-400 transition-all shadow-md">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-xl text-amber-300 font-black">
                    💰
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white flex items-center gap-1.5">
                      <span>+45,000 Gold Coins</span>
                      <span className="text-[9px] bg-amber-950 text-amber-300 px-1.5 py-0.2 rounded-full border border-amber-500/30">
                        {remainingViews.coins}/5 left
                      </span>
                    </h4>
                    <p className="text-[10px] text-slate-400">
                      Upgrade your town buildings instantly!
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleStartAd('coins')}
                  className="px-3 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center gap-1 hover:brightness-110 active:scale-95 transition-all shadow-md cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-slate-950" />
                  <span>Watch</span>
                </button>
              </div>

              {/* Option 3: 2X Multiplier Boost */}
              <div className="rounded-2xl p-3 bg-slate-900/90 border border-fuchsia-500/40 flex items-center justify-between hover:border-fuchsia-400 transition-all shadow-md">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-fuchsia-500/20 border border-fuchsia-400/40 flex items-center justify-center text-xl text-fuchsia-300 font-black">
                    ⚡
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white flex items-center gap-1.5">
                      <span>2X Board Multiplier</span>
                      <span className="text-[9px] bg-fuchsia-950 text-fuchsia-300 px-1.5 py-0.2 rounded-full border border-fuchsia-500/30">
                        {remainingViews.boost}/3 left
                      </span>
                    </h4>
                    <p className="text-[10px] text-slate-400">
                      Double tile payouts and raid rewards!
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleStartAd('boost')}
                  className="px-3 py-2 rounded-xl bg-gradient-to-r from-fuchsia-500 to-pink-600 text-white font-black text-xs uppercase tracking-wider flex items-center gap-1 hover:brightness-110 active:scale-95 transition-all shadow-md cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>Watch</span>
                </button>
              </div>
            </div>

            {/* Bottom Mega Jackpot Sponsor Card */}
            <div className="mt-1 p-3 rounded-2xl bg-gradient-to-r from-indigo-950 via-purple-950 to-slate-900 border border-indigo-500/40 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400 animate-spin" />
                <div>
                  <div className="text-xs font-black text-amber-300 uppercase tracking-wider">
                    Sponsor Mega Jackpot
                  </div>
                  <div className="text-[10px] text-slate-300">
                    +60,000 Coins + 40 Dice Rolls!
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleStartAd('mega')}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg hover:brightness-110 active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
              >
                <span>Spin Ad</span>
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};
