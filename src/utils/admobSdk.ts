import { useState, useEffect, useCallback, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import {
  AdMob,
  RewardAdOptions,
  AdMobRewardItem,
  RewardAdPluginEvents,
} from '@capacitor-community/admob';

// Official Google Test IDs for safe fallback when env vars are placeholders
export const DEFAULT_TEST_ADMOB_APP_ID = 'ca-app-pub-3940256099942544~3347511713';
export const DEFAULT_TEST_REWARDED_AD_UNIT_ID = 'ca-app-pub-3940256099942544/5224354917';

export interface AdMobConfig {
  appId: string;
  rewardedAdUnitId: string;
  publisherId: string;
  isTestMode: boolean;
  platform: 'capacitor-native' | 'react-native-webview' | 'web-h5-gpt';
}

export type AdMobSdkStatus =
  | 'uninitialized'
  | 'initializing'
  | 'ready'
  | 'loading_ad'
  | 'ad_loaded'
  | 'showing_ad'
  | 'reward_earned'
  | 'fallback_h5';

export interface AdMobRewardResult {
  rewarded: boolean;
  type: string;
  amount: number;
  adUnitId: string;
  provider: 'capacitor-admob' | 'gpt-rewarded-web' | 'h5-adbreak' | 'interactive-h5-fallback';
  transactionId: string;
}

declare global {
  interface Window {
    googletag?: any;
    adsbygoogle?: any[];
    adBreak?: (config: any) => void;
    adConfig?: (config: any) => void;
    ReactNativeWebView?: {
      postMessage: (msg: string) => void;
    };
  }
}

/**
 * Resolves VITE_ADMOB_APP_ID and VITE_ADMOB_REWARDED_AD_UNIT_ID from environment variables.
 */
export function resolveAdMobEnvConfig(): AdMobConfig {
  const env = (import.meta as any).env || {};
  const rawAppId = (env.VITE_ADMOB_APP_ID || '').trim();
  const rawRewardedUnitId = (env.VITE_ADMOB_REWARDED_AD_UNIT_ID || '').trim();
  const rawPubId = (env.VITE_ADSENSE_PUB_ID || '').trim();

  const appId =
    rawAppId && !rawAppId.includes('MY_ADMOB') && rawAppId.startsWith('ca-app-pub-')
      ? rawAppId
      : DEFAULT_TEST_ADMOB_APP_ID;

  const rewardedAdUnitId =
    rawRewardedUnitId &&
    !rawRewardedUnitId.includes('MY_ADMOB') &&
    rawRewardedUnitId.startsWith('ca-app-pub-')
      ? rawRewardedUnitId
      : DEFAULT_TEST_REWARDED_AD_UNIT_ID;

  // Extract publisher ID from appId (e.g. ca-app-pub-3940256099942544~3347511713 -> ca-pub-3940256099942544)
  const pubMatch = appId.match(/ca-app-pub-(\d+)/);
  const publisherId =
    rawPubId && rawPubId.startsWith('ca-pub-')
      ? rawPubId
      : pubMatch
      ? `ca-pub-${pubMatch[1]}`
      : 'ca-pub-3940256099942544';

  const isTestMode =
    appId.includes('3940256099942544') || rewardedAdUnitId.includes('3940256099942544');

  let platform: AdMobConfig['platform'] = 'web-h5-gpt';
  try {
    if (Capacitor.isNativePlatform()) {
      platform = 'capacitor-native';
    } else if (typeof window !== 'undefined' && window.ReactNativeWebView) {
      platform = 'react-native-webview';
    }
  } catch {
    platform = 'web-h5-gpt';
  }

  return {
    appId,
    rewardedAdUnitId,
    publisherId,
    isTestMode,
    platform,
  };
}

class GoogleAdMobWebH5Manager {
  private initialized = false;
  private config: AdMobConfig = resolveAdMobEnvConfig();
  private gptRewardedSlot: any = null;
  private gptMakeRewardedVisible: (() => void) | null = null;
  private pendingRewardCallback: ((result: AdMobRewardResult) => void) | null = null;

  public getConfig(): AdMobConfig {
    this.config = resolveAdMobEnvConfig();
    return this.config;
  }

  /**
   * Injects AdMob App ID meta tags, Google Publisher Tag (gpt.js), and H5 Ad Placement scripts.
   * Ensures ad scripts are loaded only once per session with robust error handling.
   */
  public async initialize(customConfig?: Partial<AdMobConfig>): Promise<AdMobConfig> {
    this.config = {
      ...resolveAdMobEnvConfig(),
      ...customConfig,
    };

    if (typeof document !== 'undefined') {
      try {
        // 1. Inject AdMob App ID & AdSense meta tags into <head>
        this.upsertMetaTag('google-adsense-account', this.config.publisherId);
        this.upsertMetaTag('admob-app-id', this.config.appId);
        this.upsertMetaTag('admob-rewarded-ad-unit-id', this.config.rewardedAdUnitId);

        // 2. Ensure ad scripts are loaded only once per session
        const sessionLoadedKey = 'admob_scripts_loaded_session';
        const alreadyLoadedInSession =
          typeof sessionStorage !== 'undefined' &&
          sessionStorage.getItem(sessionLoadedKey) === 'true';

        if (!alreadyLoadedInSession) {
          // Inject Google Publisher Tag (GPT) script for Web/H5 Rewarded Ads
          if (!document.getElementById('google-gpt-sdk-script')) {
            try {
              const gptScript = document.createElement('script');
              gptScript.id = 'google-gpt-sdk-script';
              gptScript.src = 'https://securepubads.g.doubleclick.net/tag/js/gpt.js';
              gptScript.async = true;
              gptScript.crossOrigin = 'anonymous';
              gptScript.onerror = (e) => {
                console.warn('GPT SDK script failed to load (possibly blocked by adblocker):', e);
              };
              document.head.appendChild(gptScript);
            } catch (err) {
              console.warn('Error appending GPT script:', err);
            }
          }

          // Inject Google H5 Games Ad Placement API (adsbygoogle.js)
          if (!document.getElementById('google-h5-adbreak-script')) {
            try {
              const h5Script = document.createElement('script');
              h5Script.id = 'google-h5-adbreak-script';
              h5Script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${this.config.publisherId}`;
              h5Script.async = true;
              h5Script.crossOrigin = 'anonymous';
              if (this.config.isTestMode) {
                h5Script.setAttribute('data-adbreak-test', 'on');
              }
              h5Script.onerror = (e) => {
                console.warn('AdSense H5 script failed to load (possibly blocked by adblocker):', e);
              };
              document.head.appendChild(h5Script);
            } catch (err) {
              console.warn('Error appending AdSense H5 script:', err);
            }
          }

          if (typeof sessionStorage !== 'undefined') {
            sessionStorage.setItem(sessionLoadedKey, 'true');
          }
        }

        // Initialize window.adsbygoogle and window.adBreak / window.adConfig shims
        window.adsbygoogle = window.adsbygoogle || [];
        if (!window.adBreak) {
          window.adBreak = function (o: any) {
            try {
              window.adsbygoogle?.push(o);
            } catch (err) {
              console.warn('adBreak push error:', err);
            }
          };
        }
        if (!window.adConfig) {
          window.adConfig = function (o: any) {
            try {
              window.adsbygoogle?.push(o);
            } catch (err) {
              console.warn('adConfig push error:', err);
            }
          };
        }

        try {
          window.adConfig({
            preloadAdBreaks: 'on',
            sound: 'on',
            onReady: () => {
              // H5 Games Ad Placement ready
            },
          });
        } catch {
          // Ignore if blocked by browser extension
        }
      } catch (err) {
        console.warn('Error during script injection in initialize:', err);
      }
    }

    // 4. If running on Native Capacitor (Android/iOS), initialize @capacitor-community/admob
    if (this.config.platform === 'capacitor-native') {
      try {
        await AdMob.initialize({
          initializeForTesting: this.config.isTestMode,
        });
      } catch (err) {
        console.warn('Native AdMob initialization error:', err);
      }
    }

    // 5. If running inside React Native WebView, notify host bridge of AdMob initialization
    if (this.config.platform === 'react-native-webview' && window.ReactNativeWebView) {
      try {
        window.ReactNativeWebView.postMessage(
          JSON.stringify({
            type: 'ADMOB_INIT',
            appId: this.config.appId,
            rewardedAdUnitId: this.config.rewardedAdUnitId,
          })
        );
      } catch {
        // Ignore
      }
    }

    this.initialized = true;
    return this.config;
  }

  private upsertMetaTag(name: string, content: string) {
    if (typeof document === 'undefined') return;
    try {
      let meta = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
      if (!meta) {
        meta = document.createElement('meta');
        meta.name = name;
        document.head.appendChild(meta);
      }
      meta.content = content;
    } catch (err) {
      console.warn(`Error updating meta tag ${name}:`, err);
    }
  }

  /**
   * Preloads a Rewarded Video Ad unit via Capacitor AdMob or Google Publisher Tag (GPT) Out-Of-Page Rewarded slot.
   * Includes robust error handling to prevent UI crashes if network or ad fetch fails.
   */
  public async preloadRewardedAd(customAdUnitId?: string): Promise<boolean> {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      const adUnitId = customAdUnitId || this.config.rewardedAdUnitId;

      // Native Capacitor AdMob preload
      if (this.config.platform === 'capacitor-native') {
        try {
          const options: RewardAdOptions = {
            adId: adUnitId,
            isTesting: this.config.isTestMode,
          };
          await AdMob.prepareRewardVideoAd(options);
          return true;
        } catch (err) {
          console.warn('Capacitor prepareRewardVideoAd error:', err);
        }
      }

      // Web/H5 Google Publisher Tag (GPT) OutOfPage REWARDED slot preload
      if (typeof window !== 'undefined') {
        window.googletag = window.googletag || { cmd: [] };
        return new Promise<boolean>((resolve) => {
          let settled = false;
          const timeoutId = setTimeout(() => {
            if (!settled) {
              settled = true;
              resolve(true); // Resolved for H5 fallback readiness
            }
          }, 1500);

          try {
            window.googletag.cmd.push(() => {
              try {
                const pubads = window.googletag.pubads();
                if (this.gptRewardedSlot) {
                  window.googletag.destroySlots([this.gptRewardedSlot]);
                  this.gptRewardedSlot = null;
                  this.gptMakeRewardedVisible = null;
                }

                const rewardedFormat = window.googletag.enums?.OutOfPageFormat?.REWARDED;
                if (!rewardedFormat) {
                  if (!settled) {
                    settled = true;
                    clearTimeout(timeoutId);
                    resolve(true);
                  }
                  return;
                }

                const slot = window.googletag.defineOutOfPageSlot(adUnitId, rewardedFormat);
                if (slot) {
                  this.gptRewardedSlot = slot.addService(pubads);

                  pubads.addEventListener('rewardedSlotReady', (event: any) => {
                    this.gptMakeRewardedVisible = () => event.makeRewardedVisible();
                    if (!settled) {
                      settled = true;
                      clearTimeout(timeoutId);
                      resolve(true);
                    }
                  });

                  pubads.addEventListener('rewardedSlotGranted', (event: any) => {
                    const payload = event?.payload;
                    if (this.pendingRewardCallback) {
                      this.pendingRewardCallback({
                        rewarded: true,
                        type: payload?.type || 'coins',
                        amount: payload?.amount || 1,
                        adUnitId,
                        provider: 'gpt-rewarded-web',
                        transactionId: `gpt-${Date.now()}`,
                      });
                      this.pendingRewardCallback = null;
                    }
                  });

                  pubads.addEventListener('rewardedSlotClosed', () => {
                    if (this.gptRewardedSlot) {
                      window.googletag.destroySlots([this.gptRewardedSlot]);
                      this.gptRewardedSlot = null;
                      this.gptMakeRewardedVisible = null;
                    }
                  });

                  window.googletag.enableServices();
                  window.googletag.display(this.gptRewardedSlot);
                } else if (!settled) {
                  settled = true;
                  clearTimeout(timeoutId);
                  resolve(true);
                }
              } catch (err) {
                console.warn('GPT command execution error during preload:', err);
                if (!settled) {
                  settled = true;
                  clearTimeout(timeoutId);
                  resolve(true);
                }
              }
            });
          } catch (err) {
            console.warn('googletag.cmd.push error during preload:', err);
            if (!settled) {
              settled = true;
              clearTimeout(timeoutId);
              resolve(true);
            }
          }
        });
      }

      return true;
    } catch (err) {
      console.warn('preloadRewardedAd caught error, falling back safely:', err);
      return false;
    }
  }

  /**
   * Attempts to show a native or GPT/H5 rewarded ad immediately with robust error handling.
   */
  public async showRewardedAd(
    placementName: string,
    adUnitIdOverride?: string
  ): Promise<{ handledExternally: boolean; result?: AdMobRewardResult }> {
    try {
      const adUnitId = adUnitIdOverride || this.config.rewardedAdUnitId;

      // 1. Native Capacitor AdMob
      if (this.config.platform === 'capacitor-native') {
        try {
          let rewardItem: AdMobRewardItem | null = null;
          const listener = await AdMob.addListener(
            RewardAdPluginEvents.Rewarded,
            (reward: AdMobRewardItem) => {
              rewardItem = reward;
            }
          );
          const shownReward = await AdMob.showRewardVideoAd();
          await listener.remove();
          const finalReward = shownReward || rewardItem || { type: placementName, amount: 1 };
          return {
            handledExternally: true,
            result: {
              rewarded: true,
              type: finalReward.type,
              amount: finalReward.amount,
              adUnitId,
              provider: 'capacitor-admob',
              transactionId: `cap-${Date.now()}`,
            },
          };
        } catch (err) {
          console.warn('Native showRewardVideoAd error:', err);
        }
      }

      // 2. If GPT Out-Of-Page Rewarded Slot is ready to display
      if (this.gptMakeRewardedVisible) {
        return new Promise((resolve) => {
          this.pendingRewardCallback = (res) => {
            resolve({ handledExternally: true, result: res });
          };
          try {
            this.gptMakeRewardedVisible?.();
          } catch (err) {
            console.warn('gptMakeRewardedVisible error:', err);
            this.pendingRewardCallback = null;
            resolve({ handledExternally: false });
          }
        });
      }

      // 3. Otherwise allow AdStationModal's H5 Rewarded Video Player to render with AdMob telemetry
      return { handledExternally: false };
    } catch (err) {
      console.warn('showRewardedAd error, falling back to H5 player:', err);
      return { handledExternally: false };
    }
  }
}

export const admobSdk = new GoogleAdMobWebH5Manager();

/**
 * React hook for managing Google AdMob Rewarded Ads in Web/H5 & Capacitor components
 * (patterned after `react-native-admob` / `@capacitor-community/admob` hooks).
 */
export function useAdMobRewardedAd(customAdUnitId?: string) {
  const [config, setConfig] = useState<AdMobConfig>(() => admobSdk.getConfig());
  const [status, setStatus] = useState<AdMobSdkStatus>('uninitialized');
  const [lastReward, setLastReward] = useState<AdMobRewardResult | null>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const initializeAndPreload = useCallback(async () => {
    if (!isMounted.current) return;
    setStatus('initializing');
    const resolved = await admobSdk.initialize(
      customAdUnitId ? { rewardedAdUnitId: customAdUnitId } : undefined
    );
    if (!isMounted.current) return;
    setConfig(resolved);
    setStatus('loading_ad');
    await admobSdk.preloadRewardedAd(resolved.rewardedAdUnitId);
    if (!isMounted.current) return;
    setStatus('ad_loaded');
  }, [customAdUnitId]);

  return {
    config,
    status,
    setStatus,
    lastReward,
    setLastReward,
    initializeAndPreload,
    showRewardedAd: admobSdk.showRewardedAd.bind(admobSdk),
  };
}
