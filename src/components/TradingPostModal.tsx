import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeftRight,
  Package,
  Sparkles,
  Trophy,
  History,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  Coins,
  Dices,
  Send,
  X,
  Plus,
  RefreshCw,
  Gift,
  Star,
  ChevronRight,
  Award,
  Zap,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  BurrowTradeItem,
  BurrowCollectionSet,
  GlobalTradeOffer,
  TradingPostState,
  TradeLogEntry,
  PlayerTradeListing,
  Mascot,
} from '../types';
import {
  BURROW_TRADE_ITEMS,
  BURROW_COLLECTION_SETS,
  INITIAL_GLOBAL_TRADE_OFFERS,
} from '../data/tradingPostData';
import { SoundEngine } from '../utils/sound';

interface TradingPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  tradingState: TradingPostState;
  activeMascot: Mascot;
  playerCoins: number;
  onUpdateTradingState: (updater: (prev: TradingPostState) => TradingPostState) => void;
  onRewardCoinsAndDice: (coins: number, dice: number, message: string) => void;
  onToast: (text: string, color?: string) => void;
}

export const TradingPostModal: React.FC<TradingPostModalProps> = ({
  isOpen,
  onClose,
  tradingState,
  activeMascot,
  playerCoins,
  onUpdateTradingState,
  onRewardCoinsAndDice,
  onToast,
}) => {
  const [activeTab, setActiveTab] = useState<'market' | 'bag' | 'sets' | 'courier' | 'ledger'>('market');
  const [selectedSetFilter, setSelectedSetFilter] = useState<string>('all');
  const [onlyShowMatches, setOnlyShowMatches] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [inventorySortBy, setInventorySortBy] = useState<'rarity' | 'type' | 'quantity'>('rarity');
  const [swappingOfferId, setSwappingOfferId] = useState<string | null>(null);
  const [completedTradeReceipt, setCompletedTradeReceipt] = useState<{
    givenItem: BurrowTradeItem;
    receivedItem: BurrowTradeItem;
    traderName: string;
    completedSet?: BurrowCollectionSet | null;
  } | null>(null);

  // New Trade Listing Creation Modal state
  const [isCreatingListing, setIsCreatingListing] = useState<boolean>(false);
  const [listingOfferItemId, setListingOfferItemId] = useState<string>('');
  const [listingRequestSetId, setListingRequestSetId] = useState<string>('any_missing');

  // Courier Mystery Swap state
  const [courierSelectedItemId, setCourierSelectedItemId] = useState<string>('');
  const [isCourierDispatching, setIsCourierDispatching] = useState<boolean>(false);
  const [courierResultItem, setCourierResultItem] = useState<BurrowTradeItem | null>(null);

  // Helper getters
  const inventory = tradingState.inventory || {};
  const completedSets = tradingState.completedSetIds || [];

  // Compute duplicate items player owns (count >= 2)
  const duplicateItems = useMemo(() => {
    return Object.entries(inventory)
      .filter(([_, count]) => count > 1)
      .map(([id, count]) => ({
        item: BURROW_TRADE_ITEMS[id],
        duplicateCount: count - 1,
        totalCount: count,
      }))
      .filter((entry) => !!entry.item);
  }, [inventory]);

  // Sorted duplicate items for inventory bag view
  const sortedDuplicateItems = useMemo(() => {
    const list = [...duplicateItems];
    const rarityRank: Record<string, number> = { legendary: 4, epic: 3, rare: 2, common: 1 };

    list.sort((a, b) => {
      if (inventorySortBy === 'rarity') {
        return (rarityRank[b.item.rarity] || 0) - (rarityRank[a.item.rarity] || 0);
      } else if (inventorySortBy === 'type') {
        return a.item.category.localeCompare(b.item.category);
      } else if (inventorySortBy === 'quantity') {
        return b.totalCount - a.totalCount;
      }
      return 0;
    });

    return list;
  }, [duplicateItems, inventorySortBy]);

  // Total duplicate pieces available
  const totalDuplicatesCount = useMemo(() => {
    return duplicateItems.reduce((sum, item) => sum + item.duplicateCount, 0);
  }, [duplicateItems]);

  // Missing items player does not own at all
  const missingItems = useMemo(() => {
    return Object.values(BURROW_TRADE_ITEMS).filter((item) => !inventory[item.id] || inventory[item.id] < 1);
  }, [inventory]);

  // Check set completion helper
  const checkNewlyCompletedSets = (newInventory: Record<string, number>): BurrowCollectionSet[] => {
    const newlyCompleted: BurrowCollectionSet[] = [];
    BURROW_COLLECTION_SETS.forEach((set) => {
      if (!completedSets.includes(set.id)) {
        const hasAll = set.itemIds.every((id) => (newInventory[id] || 0) >= 1);
        if (hasAll) {
          newlyCompleted.push(set);
        }
      }
    });
    return newlyCompleted;
  };

  // Perform a Global Trade Swap
  const handleExecuteTrade = (offer: GlobalTradeOffer) => {
    const offeredItem = BURROW_TRADE_ITEMS[offer.offersItemId];
    const wantedItem = BURROW_TRADE_ITEMS[offer.wantsItemId];

    if (!offeredItem || !wantedItem) return;

    const currentWantedCount = inventory[offer.wantsItemId] || 0;
    if (currentWantedCount <= 0) {
      onToast(`You need "${wantedItem.name}" to make this trade!`, '#ef4444');
      return;
    }

    setSwappingOfferId(offer.id);
    SoundEngine.playTileStep();

    setTimeout(() => {
      let newlyCompletedSet: BurrowCollectionSet | null = null;

      onUpdateTradingState((prev) => {
        const updatedInv = { ...prev.inventory };

        // Deduct traded item
        if (updatedInv[offer.wantsItemId] > 1) {
          updatedInv[offer.wantsItemId] -= 1;
        } else {
          delete updatedInv[offer.wantsItemId];
        }

        // Add received item
        updatedInv[offer.offersItemId] = (updatedInv[offer.offersItemId] || 0) + 1;

        // Check if a collection set is completed by this new item!
        const completed = checkNewlyCompletedSets(updatedInv);
        if (completed.length > 0) {
          newlyCompletedSet = completed[0];
        }

        const newLog: TradeLogEntry = {
          id: `log_${Date.now()}`,
          traderName: `${offer.traderName} ${offer.traderCountryFlag}`,
          givenItemName: wantedItem.name,
          givenItemIcon: wantedItem.icon,
          receivedItemName: offeredItem.name,
          receivedItemIcon: offeredItem.icon,
          completedAt: 'Just now',
          setCompleted: newlyCompletedSet ? newlyCompletedSet.name : undefined,
        };

        return {
          ...prev,
          inventory: updatedInv,
          tradeHistory: [newLog, ...(prev.tradeHistory || [])].slice(0, 40),
        };
      });

      SoundEngine.playUpgradeFanfare();
      confetti({
        particleCount: 75,
        spread: 70,
        origin: { y: 0.6 },
      });

      setSwappingOfferId(null);
      setCompletedTradeReceipt({
        givenItem: wantedItem,
        receivedItem: offeredItem,
        traderName: `${offer.traderName} ${offer.traderCountryFlag}`,
        completedSet: newlyCompletedSet,
      });

      onToast(`Trade Successful! Received ${offeredItem.name}! ✨`, '#10b981');
    }, 600);
  };

  // Claim Set Completion Reward
  const handleClaimSetReward = (set: BurrowCollectionSet) => {
    if (completedSets.includes(set.id)) return;

    SoundEngine.playUpgradeFanfare();
    confetti({
      particleCount: 120,
      spread: 100,
      origin: { y: 0.5 },
    });

    onRewardCoinsAndDice(
      set.completionReward.coins,
      set.completionReward.diceBonus,
      `🏆 ${set.name} Completed! +${set.completionReward.coins.toLocaleString()} Coins & +${set.completionReward.diceBonus} Rolls!`
    );

    onUpdateTradingState((prev) => ({
      ...prev,
      completedSetIds: [...(prev.completedSetIds || []), set.id],
    }));

    onToast(`🏆 Set Mastered! Awarded Title: ${set.completionReward.title}`, '#ffe600');
  };

  // Post Player Listing
  const handlePostListing = () => {
    if (!listingOfferItemId) return;
    const offeringItem = BURROW_TRADE_ITEMS[listingOfferItemId];
    if (!offeringItem) return;

    const newListing: PlayerTradeListing = {
      id: `listing_${Date.now()}`,
      offeringItemId: listingOfferItemId,
      requestingItemId: listingRequestSetId,
      postedAt: Date.now(),
      status: 'active',
    };

    onUpdateTradingState((prev) => {
      const updatedInv = { ...prev.inventory };
      if (updatedInv[listingOfferItemId] > 1) {
        updatedInv[listingOfferItemId] -= 1;
      } else {
        delete updatedInv[listingOfferItemId];
      }
      return {
        ...prev,
        inventory: updatedInv,
        playerListings: [newListing, ...(prev.playerListings || [])],
      };
    });

    SoundEngine.playBoardHop();
    setIsCreatingListing(false);
    setListingOfferItemId('');
    onToast(`Listed ${offeringItem.name} on the Global Board!`, '#38bdf8');
  };

  // Dispatch Mascot Courier (Wonder Swap)
  const handleDispatchCourier = () => {
    if (!courierSelectedItemId || isCourierDispatching) return;
    const itemSent = BURROW_TRADE_ITEMS[courierSelectedItemId];
    if (!itemSent) return;

    setIsCourierDispatching(true);
    SoundEngine.playDiceRoll();

    setTimeout(() => {
      // Pick a random missing item, or random trade item if all owned
      let candidateItems = missingItems;
      if (candidateItems.length === 0) {
        candidateItems = Object.values(BURROW_TRADE_ITEMS).filter((it) => it.id !== courierSelectedItemId);
      }
      const receivedItem = candidateItems[Math.floor(Math.random() * candidateItems.length)];

      let newlyCompletedSet: BurrowCollectionSet | null = null;

      onUpdateTradingState((prev) => {
        const updatedInv = { ...prev.inventory };
        if (updatedInv[courierSelectedItemId] > 1) {
          updatedInv[courierSelectedItemId] -= 1;
        } else {
          delete updatedInv[courierSelectedItemId];
        }

        updatedInv[receivedItem.id] = (updatedInv[receivedItem.id] || 0) + 1;

        const completed = checkNewlyCompletedSets(updatedInv);
        if (completed.length > 0) {
          newlyCompletedSet = completed[0];
        }

        const newLog: TradeLogEntry = {
          id: `courier_log_${Date.now()}`,
          traderName: `${activeMascot.name}'s Courier Express 🦉`,
          givenItemName: itemSent.name,
          givenItemIcon: itemSent.icon,
          receivedItemName: receivedItem.name,
          receivedItemIcon: receivedItem.icon,
          completedAt: 'Just now',
          setCompleted: newlyCompletedSet ? newlyCompletedSet.name : undefined,
        };

        return {
          ...prev,
          inventory: updatedInv,
          tradeHistory: [newLog, ...(prev.tradeHistory || [])].slice(0, 40),
        };
      });

      setIsCourierDispatching(false);
      setCourierResultItem(receivedItem);
      SoundEngine.playUpgradeFanfare();
      confetti({ particleCount: 80, spread: 80, origin: { y: 0.6 } });
    }, 1800);
  };

  // Instant Instant-Match Player Listing
  const handleInstantMatchListing = (listing: PlayerTradeListing) => {
    const offeringItem = BURROW_TRADE_ITEMS[listing.offeringItemId];
    if (!offeringItem) return;

    // Pick an item from missing items or the requested set
    let candidates = missingItems;
    if (listing.requestingItemId !== 'any_missing') {
      const set = BURROW_COLLECTION_SETS.find((s) => s.id === listing.requestingItemId);
      if (set) {
        const setMissing = set.itemIds.map((id) => BURROW_TRADE_ITEMS[id]).filter((it) => !inventory[it.id]);
        if (setMissing.length > 0) candidates = setMissing;
      }
    }
    if (candidates.length === 0) {
      candidates = Object.values(BURROW_TRADE_ITEMS);
    }
    const matchingItem = candidates[Math.floor(Math.random() * candidates.length)];

    let newlyCompletedSet: BurrowCollectionSet | null = null;

    onUpdateTradingState((prev) => {
      const updatedInv = { ...prev.inventory };
      updatedInv[matchingItem.id] = (updatedInv[matchingItem.id] || 0) + 1;

      const completed = checkNewlyCompletedSets(updatedInv);
      if (completed.length > 0) {
        newlyCompletedSet = completed[0];
      }

      const updatedListings = (prev.playerListings || []).filter((l) => l.id !== listing.id);

      const log: TradeLogEntry = {
        id: `log_player_${Date.now()}`,
        traderName: 'Global Trader Match 🌐',
        givenItemName: offeringItem.name,
        givenItemIcon: offeringItem.icon,
        receivedItemName: matchingItem.name,
        receivedItemIcon: matchingItem.icon,
        completedAt: 'Just now',
        setCompleted: newlyCompletedSet ? newlyCompletedSet.name : undefined,
      };

      return {
        ...prev,
        inventory: updatedInv,
        playerListings: updatedListings,
        tradeHistory: [log, ...(prev.tradeHistory || [])].slice(0, 40),
      };
    });

    SoundEngine.playUpgradeFanfare();
    confetti({ particleCount: 70, spread: 70 });
    onToast(`Listing matched! Received ${matchingItem.name}!`, '#34d399');
  };

  // Filter Global Offers
  const filteredGlobalOffers = useMemo(() => {
    return INITIAL_GLOBAL_TRADE_OFFERS.filter((offer) => {
      const wantsItem = BURROW_TRADE_ITEMS[offer.wantsItemId];
      const offersItem = BURROW_TRADE_ITEMS[offer.offersItemId];

      if (!wantsItem || !offersItem) return false;

      // Set filter
      if (selectedSetFilter !== 'all') {
        if (offersItem.setId !== selectedSetFilter && wantsItem.setId !== selectedSetFilter) {
          return false;
        }
      }

      // "Matches My Duplicates" filter
      if (onlyShowMatches) {
        const duplicatesOwned = (inventory[offer.wantsItemId] || 0) > 1;
        if (!duplicatesOwned) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName =
          wantsItem.name.toLowerCase().includes(query) ||
          offersItem.name.toLowerCase().includes(query) ||
          offer.traderName.toLowerCase().includes(query) ||
          wantsItem.setName.toLowerCase().includes(query) ||
          offersItem.setName.toLowerCase().includes(query);
        if (!matchesName) return false;
      }

      return true;
    });
  }, [selectedSetFilter, onlyShowMatches, searchQuery, inventory]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-2xl bg-gradient-to-b from-slate-900 via-slate-950 to-[#070815] border-2 border-amber-500/50 rounded-3xl shadow-[0_0_50px_rgba(245,158,11,0.25)] flex flex-col max-h-[92vh] overflow-hidden text-slate-100"
        >
          {/* Top Header Banner */}
          <div className="p-4 sm:p-5 border-b border-amber-500/30 bg-gradient-to-r from-amber-950/70 via-slate-900/90 to-purple-950/70 relative">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer z-10"
              title="Close Trading Post"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-600 p-0.5 shadow-lg flex items-center justify-center text-2xl">
                <span className="animate-pulse">🔄</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-black uppercase tracking-wider text-white">
                    Global Burrow Trading Post
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-950/90 text-emerald-300 border border-emerald-500/40">
                    Live P2P Market
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  Swap duplicate accessories & furniture with players worldwide to complete your cozy collection sets!
                </p>
              </div>
            </div>

            {/* Top Stat Pills */}
            <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-amber-500/20">
              <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-900/80 border border-slate-800">
                <Package className="w-4 h-4 text-amber-400" />
                <div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Your Duplicates</div>
                  <div className="text-xs font-black text-amber-300">
                    {totalDuplicatesCount} Pieces Ready
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-900/80 border border-slate-800">
                <Trophy className="w-4 h-4 text-yellow-400" />
                <div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Sets Completed</div>
                  <div className="text-xs font-black text-yellow-300">
                    {completedSets.length} / {BURROW_COLLECTION_SETS.length} Sets
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-900/80 border border-slate-800">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Online Swappers</div>
                  <div className="text-xs font-black text-cyan-300">1,482 Active</div>
                </div>
              </div>
            </div>
          </div>

          {/* Sub-Navigation Tabs */}
          <div className="p-2 border-b border-slate-800 bg-slate-950/90 flex items-center justify-between gap-1 overflow-x-auto">
            <button
              onClick={() => {
                setActiveTab('market');
                SoundEngine.playTileStep();
              }}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'market'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              <span>Global Market</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('bag');
                SoundEngine.playTileStep();
              }}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'bag'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-black shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>My Duplicates ({totalDuplicatesCount})</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('sets');
                SoundEngine.playTileStep();
              }}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'sets'
                  ? 'bg-gradient-to-r from-fuchsia-500 to-pink-500 text-white font-black shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>Collection Sets</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('courier');
                SoundEngine.playTileStep();
              }}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'courier'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Gift className="w-3.5 h-3.5" />
              <span>Mascot Courier</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('ledger');
                SoundEngine.playTileStep();
              }}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'ledger'
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-black shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Trade Ledger</span>
            </button>
          </div>

          {/* MAIN TAB CONTENT CONTAINER */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4">
            {/* ---------------------------------------------------- */}
            {/* TAB 1: GLOBAL MARKET */}
            {/* ---------------------------------------------------- */}
            {activeTab === 'market' && (
              <div className="space-y-3">
                {/* Search & Filter Controls */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 bg-slate-900/90 p-2.5 rounded-2xl border border-slate-800">
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search furniture, accessories, sets, or traders..."
                      className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  {/* Filter matches toggle */}
                  <button
                    onClick={() => {
                      setOnlyShowMatches(!onlyShowMatches);
                      SoundEngine.playTileStep();
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      onlyShowMatches
                        ? 'bg-emerald-500 text-slate-950 font-black shadow-md'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Matches My Duplicates</span>
                  </button>

                  {/* Post Your Own Listing Button */}
                  <button
                    onClick={() => setIsCreatingListing(true)}
                    className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1 shadow-md hover:brightness-110 active:scale-95 transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Post Trade</span>
                  </button>
                </div>

                {/* Set Pills Horizontal Scroll */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                  <button
                    onClick={() => setSelectedSetFilter('all')}
                    className={`px-2.5 py-1 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap text-[11px] ${
                      selectedSetFilter === 'all'
                        ? 'bg-amber-400 text-slate-950 font-black'
                        : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    All Sets ({INITIAL_GLOBAL_TRADE_OFFERS.length})
                  </button>
                  {BURROW_COLLECTION_SETS.map((set) => (
                    <button
                      key={set.id}
                      onClick={() => setSelectedSetFilter(set.id)}
                      className={`px-2.5 py-1 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap text-[11px] flex items-center gap-1 ${
                        selectedSetFilter === set.id
                          ? 'bg-amber-400 text-slate-950 font-black shadow-sm'
                          : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      <span>{set.icon}</span>
                      <span>{set.name.split(' ')[0]}</span>
                    </button>
                  ))}
                </div>

                {/* Player's Active Listings (if any) */}
                {tradingState.playerListings && tradingState.playerListings.length > 0 && (
                  <div className="p-3 rounded-2xl bg-cyan-950/40 border border-cyan-500/40 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-black uppercase text-cyan-300">
                        <span>📢 Your Active Postings ({tradingState.playerListings.length})</span>
                      </div>
                      <span className="text-[10px] text-cyan-400">Waiting for global match</span>
                    </div>

                    <div className="space-y-1.5">
                      {tradingState.playerListings.map((listing) => {
                        const itemOffered = BURROW_TRADE_ITEMS[listing.offeringItemId];
                        return (
                          <div
                            key={listing.id}
                            className="flex items-center justify-between p-2 rounded-xl bg-slate-900/90 border border-cyan-500/30 text-xs"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{itemOffered?.icon || '📦'}</span>
                              <div>
                                <span className="font-bold text-white">{itemOffered?.name}</span>
                                <span className="text-[10px] text-slate-400 block">
                                  Looking for:{' '}
                                  {listing.requestingItemId === 'any_missing'
                                    ? 'Any Missing Set Piece'
                                    : BURROW_COLLECTION_SETS.find((s) => s.id === listing.requestingItemId)?.name}
                                </span>
                              </div>
                            </div>
                            <button
                              onClick={() => handleInstantMatchListing(listing)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[11px] font-black uppercase tracking-wider flex items-center gap-1 active:scale-95 transition-all cursor-pointer shadow-sm"
                              title="Instant match with an interested worldwide trade bot"
                            >
                              <Zap className="w-3 h-3 fill-slate-950" />
                              <span>Instant Match</span>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Live Trade Offers List */}
                <div className="space-y-3">
                  {filteredGlobalOffers.map((offer) => {
                    const offersItem = BURROW_TRADE_ITEMS[offer.offersItemId];
                    const wantsItem = BURROW_TRADE_ITEMS[offer.wantsItemId];

                    if (!offersItem || !wantsItem) return null;

                    const duplicateCount = Math.max(0, (inventory[offer.wantsItemId] || 0) - 1);
                    const totalOwned = inventory[offer.wantsItemId] || 0;
                    const playerNeedsOffered = (inventory[offer.offersItemId] || 0) === 0;
                    const isSwapping = swappingOfferId === offer.id;

                    const rarityColor =
                      offersItem.rarity === 'legendary'
                        ? 'text-amber-400 border-amber-500/60 bg-amber-950/30'
                        : offersItem.rarity === 'epic'
                        ? 'text-purple-400 border-purple-500/60 bg-purple-950/30'
                        : offersItem.rarity === 'rare'
                        ? 'text-sky-400 border-sky-500/60 bg-sky-950/30'
                        : 'text-emerald-400 border-emerald-500/60 bg-emerald-950/30';

                    return (
                      <motion.div
                        key={offer.id}
                        layout
                        className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-amber-500/40 transition-all shadow-md space-y-3"
                      >
                        {/* Trader Header */}
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-black text-slate-950 border border-white"
                              style={{ background: offer.traderAvatarColor }}
                            >
                              {offer.traderName.charAt(0)}
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-white">{offer.traderName}</span>
                              <span>{offer.traderCountryFlag}</span>
                              <span className="text-[10px] text-slate-400">({offer.traderCountry})</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400">
                            <span className="flex items-center text-amber-300 font-bold">
                              <Star className="w-2.5 h-2.5 fill-amber-300 mr-0.5" />
                              {offer.traderRating}
                            </span>
                            <span>•</span>
                            <span>{offer.postedTimeAgo}</span>
                          </div>
                        </div>

                        {/* Trade Item Exchange Columns */}
                        <div className="grid grid-cols-1 sm:grid-cols-7 gap-2 items-center">
                          {/* Left: What they offer */}
                          <div className="sm:col-span-3 p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center gap-2.5">
                            <div
                              className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 border"
                              style={{
                                background: offersItem.previewColor + '20',
                                borderColor: offersItem.accentColor,
                              }}
                            >
                              {offersItem.icon}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded border ${rarityColor}`}>
                                  {offersItem.rarity}
                                </span>
                                {playerNeedsOffered ? (
                                  <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                                    ✨ Needed
                                  </span>
                                ) : (
                                  <span className="text-[9px] font-bold text-slate-500">
                                    Owned ({inventory[offersItem.id]})
                                  </span>
                                )}
                              </div>
                              <h4 className="text-xs font-black text-white truncate mt-0.5">
                                {offersItem.name}
                              </h4>
                              <p className="text-[10px] text-slate-400 truncate">
                                {offersItem.setName} • +{offersItem.cozyAuraBonus} Aura
                              </p>
                            </div>
                          </div>

                          {/* Middle: Swap Arrow */}
                          <div className="sm:col-span-1 flex flex-col items-center justify-center text-slate-500 py-1 sm:py-0">
                            <div className="w-8 h-8 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center text-amber-400 shadow-inner">
                              <ArrowLeftRight className={`w-3.5 h-3.5 ${isSwapping ? 'animate-spin' : ''}`} />
                            </div>
                            <span className="text-[9px] font-bold text-slate-400 mt-0.5">Swap</span>
                          </div>

                          {/* Right: What they want from you */}
                          <div className="sm:col-span-3 p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center gap-2.5">
                            <div
                              className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 border"
                              style={{
                                background: wantsItem.previewColor + '20',
                                borderColor: wantsItem.accentColor,
                              }}
                            >
                              {wantsItem.icon}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">
                                  {wantsItem.rarity}
                                </span>
                                {duplicateCount > 0 ? (
                                  <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-lime-500/20 text-lime-300 border border-lime-500/40">
                                    ✓ {duplicateCount} Duplicate{duplicateCount > 1 ? 's' : ''}
                                  </span>
                                ) : totalOwned === 1 ? (
                                  <span className="text-[9px] font-bold text-amber-400">
                                    1 in Burrow
                                  </span>
                                ) : (
                                  <span className="text-[9px] font-bold text-rose-400">
                                    Not Owned
                                  </span>
                                )}
                              </div>
                              <h4 className="text-xs font-black text-white truncate mt-0.5">
                                {wantsItem.name}
                              </h4>
                              <p className="text-[10px] text-slate-400 truncate">
                                {wantsItem.setName}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Trade Execution Action Row */}
                        <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                          <div className="text-[11px] text-slate-400 flex items-center gap-1">
                            {duplicateCount > 0 ? (
                              <span className="text-emerald-300 font-bold flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                Ready to swap without touching your decorated burrow!
                              </span>
                            ) : totalOwned === 1 ? (
                              <span className="text-amber-400 flex items-center gap-1">
                                <AlertCircle className="w-3.5 h-3.5" />
                                Traded from your burrow inventory.
                              </span>
                            ) : (
                              <span className="text-slate-500 flex items-center gap-1">
                                <AlertCircle className="w-3.5 h-3.5" />
                                Missing requested item to accept trade.
                              </span>
                            )}
                          </div>

                          <button
                            disabled={totalOwned <= 0 || isSwapping}
                            onClick={() => handleExecuteTrade(offer)}
                            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer ${
                              totalOwned > 0 && !isSwapping
                                ? duplicateCount > 0
                                  ? 'bg-gradient-to-r from-lime-400 to-emerald-500 text-slate-950 hover:brightness-110'
                                  : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                            }`}
                          >
                            <span>{isSwapping ? 'Swapping...' : 'Accept Swap ➔'}</span>
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}

                  {filteredGlobalOffers.length === 0 && (
                    <div className="p-8 text-center rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
                      <div className="text-3xl">🔍</div>
                      <h4 className="text-sm font-black text-white">No Matching Swaps Found</h4>
                      <p className="text-xs text-slate-400 max-w-sm mx-auto">
                        Try clearing filters or post your own trade listing on the board!
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ---------------------------------------------------- */}
            {/* TAB 2: MY DUPLICATES BAG */}
            {/* ---------------------------------------------------- */}
            {activeTab === 'bag' && (
              <div className="space-y-4">
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-cyan-950/60 to-slate-900 border border-cyan-500/40 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-wider text-white">
                      Your Duplicate Vault
                    </h3>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Items marked with duplicate badges are safe to trade without affecting your burrow decor.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsCreatingListing(true)}
                    className="px-3 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 text-xs font-black uppercase tracking-wider shadow-md hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create Listing</span>
                  </button>
                </div>

                {/* Inventory Sorting Dropdown */}
                {duplicateItems.length > 0 && (
                  <div className="flex items-center justify-between gap-2 bg-slate-900/90 p-2.5 rounded-2xl border border-slate-800">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                      <Filter className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Sort Inventory By:</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <select
                        value={inventorySortBy}
                        onChange={(e) => {
                          setInventorySortBy(e.target.value as 'rarity' | 'type' | 'quantity');
                          SoundEngine.playTileStep();
                        }}
                        className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white font-bold focus:outline-none focus:border-cyan-400 cursor-pointer"
                      >
                        <option value="rarity">★ Rarity (High to Low)</option>
                        <option value="type">📁 Type / Category</option>
                        <option value="quantity">📊 Quantity (Most Owned)</option>
                      </select>
                    </div>
                  </div>
                )}

                {duplicateItems.length === 0 ? (
                  <div className="p-8 text-center rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
                    <div className="text-4xl">🎒</div>
                    <h4 className="text-sm font-black text-white">No Duplicate Pieces in Vault</h4>
                    <p className="text-xs text-slate-400 max-w-md mx-auto">
                      Earn more furniture & accessories by rolling dice on mystery chest tiles or daily puzzle bounties!
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {sortedDuplicateItems.map(({ item, duplicateCount, totalCount }) => (
                      <div
                        key={item.id}
                        className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between gap-3 shadow-md"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 border relative"
                            style={{
                              background: item.previewColor + '20',
                              borderColor: item.accentColor,
                            }}
                          >
                            {item.icon}
                            <span className="absolute -bottom-1 -right-1 px-1.5 py-0.2 rounded-md bg-amber-400 text-slate-950 font-black text-[9px] border border-white">
                              x{totalCount}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                                {duplicateCount} Duplicate{duplicateCount > 1 ? 's' : ''}
                              </span>
                              <span className="text-[9px] font-bold text-slate-400">
                                {item.rarity}
                              </span>
                            </div>
                            <h4 className="text-xs font-black text-white truncate mt-0.5">
                              {item.name}
                            </h4>
                            <p className="text-[10px] text-slate-400 truncate">{item.setName}</p>
                          </div>
                        </div>

                        <div className="flex flex-col gap-1.5 shrink-0">
                          <button
                            onClick={() => {
                              setListingOfferItemId(item.id);
                              setIsCreatingListing(true);
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer text-center"
                          >
                            Post Trade
                          </button>
                          <button
                            onClick={() => {
                              setCourierSelectedItemId(item.id);
                              setActiveTab('courier');
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold transition-all cursor-pointer text-center"
                          >
                            Send Courier 🦉
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ---------------------------------------------------- */}
            {/* TAB 3: COLLECTION SETS SHOWCASE */}
            {/* ---------------------------------------------------- */}
            {activeTab === 'sets' && (
              <div className="space-y-4">
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-fuchsia-950/60 to-slate-900 border border-fuchsia-500/40 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-wider text-white">
                      Themed Collection Showcase
                    </h3>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Collect all 6 signature accessories & furniture pieces in each set to earn massive coin bounties, bonus dice & titles!
                    </p>
                  </div>
                  <span className="text-xs font-black text-fuchsia-300 bg-fuchsia-950 px-3 py-1 rounded-full border border-fuchsia-500/40">
                    {completedSets.length} / {BURROW_COLLECTION_SETS.length} Complete
                  </span>
                </div>

                <div className="space-y-4">
                  {BURROW_COLLECTION_SETS.map((set) => {
                    const ownedCount = set.itemIds.filter((id) => (inventory[id] || 0) >= 1).length;
                    const isComplete = ownedCount === set.itemIds.length;
                    const isClaimed = completedSets.includes(set.id);
                    const percent = Math.round((ownedCount / set.itemIds.length) * 100);

                    return (
                      <div
                        key={set.id}
                        className={`p-4 rounded-3xl border transition-all shadow-lg space-y-3 bg-gradient-to-r ${set.gradient} ${
                          isComplete
                            ? 'border-amber-400/80 shadow-[0_0_20px_rgba(251,191,36,0.2)]'
                            : 'border-slate-800'
                        }`}
                      >
                        {/* Set Header */}
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-2.5">
                            <span className="text-2xl">{set.icon}</span>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-sm font-black text-white">{set.name}</h4>
                                {isClaimed ? (
                                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-amber-400 text-slate-950 flex items-center gap-1">
                                    <Award className="w-3 h-3 fill-slate-950" />
                                    Mastered
                                  </span>
                                ) : isComplete ? (
                                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-400 text-slate-950 animate-bounce">
                                    Ready to Claim!
                                  </span>
                                ) : null}
                              </div>
                              <p className="text-[11px] text-slate-300">{set.theme}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-amber-300">
                              {ownedCount} / {set.itemIds.length} Items ({percent}%)
                            </span>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-slate-950/80 h-2 rounded-full overflow-hidden border border-slate-800">
                          <div
                            className="h-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-500"
                            style={{ width: `${percent}%` }}
                          />
                        </div>

                        {/* 6 Items Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                          {set.itemIds.map((itemId) => {
                            const item = BURROW_TRADE_ITEMS[itemId];
                            const count = inventory[itemId] || 0;
                            const isOwned = count > 0;

                            if (!item) return null;

                            return (
                              <div
                                key={itemId}
                                className={`p-2 rounded-xl flex flex-col items-center justify-between text-center transition-all border ${
                                  isOwned
                                    ? 'bg-slate-900/90 border-slate-700'
                                    : 'bg-slate-950/60 border-slate-800/80 opacity-60'
                                }`}
                                title={item.name}
                              >
                                <div className="text-2xl mb-1 relative">
                                  {item.icon}
                                  {count > 1 && (
                                    <span className="absolute -bottom-1 -right-2 px-1 rounded bg-lime-400 text-slate-950 font-black text-[8px]">
                                      x{count}
                                    </span>
                                  )}
                                </div>
                                <span className="text-[10px] font-bold text-white leading-tight line-clamp-1">
                                  {item.name}
                                </span>
                                <span
                                  className={`text-[8px] font-black uppercase mt-1 px-1 rounded ${
                                    isOwned
                                      ? 'bg-emerald-500/20 text-emerald-300'
                                      : 'bg-slate-800 text-slate-500'
                                  }`}
                                >
                                  {isOwned ? 'Owned' : 'Missing'}
                                </span>
                              </div>
                            );
                          })}
                        </div>

                        {/* Set Reward Claim Banner */}
                        <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 flex-wrap gap-2 text-xs">
                          <div className="flex items-center gap-2 text-amber-300 font-bold">
                            <Gift className="w-3.5 h-3.5 text-amber-400" />
                            <span>
                              Reward: +{set.completionReward.coins.toLocaleString()} 🪙 & +
                              {set.completionReward.diceBonus} 🎲 • Title: {set.completionReward.title}
                            </span>
                          </div>

                          {isComplete && !isClaimed && (
                            <button
                              onClick={() => handleClaimSetReward(set)}
                              className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 font-black uppercase tracking-wider text-xs shadow-lg hover:brightness-110 active:scale-95 cursor-pointer animate-pulse"
                            >
                              Claim Set Reward! 🏆
                            </button>
                          )}
                          {isClaimed && (
                            <span className="text-emerald-400 font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Reward Claimed
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ---------------------------------------------------- */}
            {/* TAB 4: MASCOT COURIER (WONDER SWAP) */}
            {/* ---------------------------------------------------- */}
            {activeTab === 'courier' && (
              <div className="space-y-4">
                <div className="p-4 rounded-3xl bg-gradient-to-r from-emerald-950/70 via-slate-900 to-teal-950/70 border border-emerald-500/40 text-center space-y-2">
                  <div className="text-4xl animate-bounce">🦉</div>
                  <h3 className="text-base font-black uppercase tracking-wider text-white">
                    {activeMascot.name}'s Mystery Wonder Swap Express
                  </h3>
                  <p className="text-xs text-slate-300 max-w-md mx-auto">
                    Give an unwanted duplicate piece to the subterranean courier network. The courier will return with a mystery parcel containing a new collection piece!
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
                    Step 1: Choose a Duplicate to Send
                  </h4>

                  {duplicateItems.length === 0 ? (
                    <p className="text-xs text-amber-400">
                      You don't currently have any duplicates in your bag to dispatch with the courier.
                    </p>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {duplicateItems.map(({ item, duplicateCount }) => (
                        <button
                          key={item.id}
                          onClick={() => {
                            setCourierSelectedItemId(item.id);
                            SoundEngine.playTileStep();
                          }}
                          className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                            courierSelectedItemId === item.id
                              ? 'bg-emerald-950/80 border-emerald-400 text-white shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                              : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                          }`}
                        >
                          <span className="text-2xl">{item.icon}</span>
                          <div className="min-w-0">
                            <div className="text-xs font-bold truncate">{item.name}</div>
                            <div className="text-[10px] text-emerald-400 font-bold">
                              {duplicateCount} duplicate{duplicateCount > 1 ? 's' : ''}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                    <div className="text-xs text-slate-400">
                      {courierSelectedItemId ? (
                        <span>
                          Ready to dispatch:{' '}
                          <strong className="text-white">
                            {BURROW_TRADE_ITEMS[courierSelectedItemId]?.name}
                          </strong>
                        </span>
                      ) : (
                        <span>Select an item above to dispatch</span>
                      )}
                    </div>

                    <button
                      disabled={!courierSelectedItemId || isCourierDispatching}
                      onClick={handleDispatchCourier}
                      className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg transition-all active:scale-95 cursor-pointer ${
                        courierSelectedItemId && !isCourierDispatching
                          ? 'bg-gradient-to-r from-emerald-400 to-teal-500 text-slate-950 hover:brightness-110'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                      }`}
                    >
                      <Send className={`w-3.5 h-3.5 ${isCourierDispatching ? 'animate-spin' : ''}`} />
                      <span>{isCourierDispatching ? 'Courier Flying...' : 'Dispatch Courier ➔'}</span>
                    </button>
                  </div>
                </div>

                {/* Courier Unboxed Result Banner */}
                {courierResultItem && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-4 rounded-3xl bg-gradient-to-r from-amber-950/80 via-emerald-950/80 to-slate-900 border-2 border-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.3)] flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-400 flex items-center justify-center text-3xl">
                        {courierResultItem.icon}
                      </div>
                      <div>
                        <span className="text-[10px] font-black uppercase text-emerald-300">
                          ✨ Courier Returned with Parcel!
                        </span>
                        <h4 className="text-sm font-black text-white">
                          {courierResultItem.name}
                        </h4>
                        <p className="text-xs text-slate-300">
                          Added to your collection for {courierResultItem.setName}!
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setCourierResultItem(null)}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white border border-slate-700 cursor-pointer"
                    >
                      Collect & Close
                    </button>
                  </motion.div>
                )}
              </div>
            )}

            {/* ---------------------------------------------------- */}
            {/* TAB 5: TRADE LEDGER (HISTORY) */}
            {/* ---------------------------------------------------- */}
            {activeTab === 'ledger' && (
              <div className="space-y-3">
                <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
                    Completed Global Trade Receipts
                  </h3>
                  <span className="text-[10px] text-slate-500">
                    {tradingState.tradeHistory?.length || 0} Transactions
                  </span>
                </div>

                <div className="space-y-2">
                  {(tradingState.tradeHistory || []).map((log) => (
                    <div
                      key={log.id}
                      className="p-3 rounded-xl bg-slate-950/90 border border-slate-800/80 flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-emerald-950/60 border border-emerald-500/30 flex items-center justify-center text-sm">
                          {log.receivedItemIcon}
                        </div>
                        <div className="min-w-0">
                          <div className="text-white font-bold truncate">
                            Traded <span className="text-slate-400">{log.givenItemName}</span> for{' '}
                            <span className="text-emerald-300">{log.receivedItemName}</span>
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Partner: {log.traderName} • {log.completedAt}
                          </div>
                        </div>
                      </div>

                      {log.setCompleted && (
                        <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40 shrink-0">
                          🏆 {log.setCompleted}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer Bar with Close button */}
          <div className="p-3 border-t border-slate-800/90 bg-slate-950/90 flex items-center justify-between text-xs text-slate-400">
            <span>Live exchange fee: 0% • Instant P2P fulfillment</span>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-black text-xs uppercase tracking-wider transition-colors cursor-pointer"
            >
              Back to Burrow
            </button>
          </div>

          {/* POPUP MODAL: CREATE GLOBAL TRADE LISTING */}
          {isCreatingListing && (
            <div className="absolute inset-0 z-30 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md bg-slate-900 border-2 border-amber-500/60 rounded-3xl p-5 shadow-2xl space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
                    <span>📢 Post to Global Board</span>
                  </h3>
                  <button
                    onClick={() => setIsCreatingListing(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1">
                      1. Select Your Duplicate Item to Offer:
                    </label>
                    <select
                      value={listingOfferItemId}
                      onChange={(e) => setListingOfferItemId(e.target.value)}
                      className="w-full p-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-400"
                    >
                      <option value="">-- Choose duplicate piece --</option>
                      {duplicateItems.map(({ item, duplicateCount }) => (
                        <option key={item.id} value={item.id}>
                          {item.icon} {item.name} ({duplicateCount} duplicate available)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1">
                      2. What do you want in return?
                    </label>
                    <select
                      value={listingRequestSetId}
                      onChange={(e) => setListingRequestSetId(e.target.value)}
                      className="w-full p-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-400"
                    >
                      <option value="any_missing">✨ Any missing piece from my collections</option>
                      {BURROW_COLLECTION_SETS.map((set) => (
                        <option key={set.id} value={set.id}>
                          {set.icon} Any missing piece from {set.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                  <button
                    onClick={() => setIsCreatingListing(false)}
                    className="px-3 py-1.5 rounded-xl text-xs text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={!listingOfferItemId}
                    onClick={handlePostListing}
                    className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider shadow-md transition-all ${
                      listingOfferItemId
                        ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 hover:brightness-110 cursor-pointer'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    Publish to Global Board ➔
                  </button>
                </div>
              </motion.div>
            </div>
          )}

          {/* POPUP MODAL: CELEBRATORY TRADE RECEIPT */}
          {completedTradeReceipt && (
            <div className="absolute inset-0 z-40 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.85, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="w-full max-w-sm bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-emerald-400 rounded-3xl p-5 shadow-[0_0_40px_rgba(16,185,129,0.3)] text-center space-y-4"
              >
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 mx-auto flex items-center justify-center text-3xl animate-bounce">
                  ✨
                </div>

                <div>
                  <h3 className="text-base font-black text-white uppercase tracking-wider">
                    Swap Finalized!
                  </h3>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Traded with <strong className="text-emerald-300">{completedTradeReceipt.traderName}</strong>
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-around">
                  <div className="flex flex-col items-center">
                    <span className="text-2xl">{completedTradeReceipt.givenItem.icon}</span>
                    <span className="text-[10px] text-slate-400 line-through mt-1">
                      {completedTradeReceipt.givenItem.name}
                    </span>
                    <span className="text-[9px] text-rose-400 font-bold">-1 Traded</span>
                  </div>

                  <ArrowLeftRight className="w-4 h-4 text-emerald-400" />

                  <div className="flex flex-col items-center">
                    <span className="text-2xl animate-pulse">{completedTradeReceipt.receivedItem.icon}</span>
                    <span className="text-[10px] text-white font-bold mt-1">
                      {completedTradeReceipt.receivedItem.name}
                    </span>
                    <span className="text-[9px] text-emerald-400 font-bold">+1 Received!</span>
                  </div>
                </div>

                {completedTradeReceipt.completedSet && (
                  <div className="p-3 rounded-2xl bg-amber-950/60 border border-amber-500/60 text-center space-y-1">
                    <div className="text-lg">🏆</div>
                    <div className="text-xs font-black text-amber-300 uppercase tracking-wider">
                      Collection Set Completed!
                    </div>
                    <p className="text-[11px] text-slate-200">
                      You now hold all pieces of{' '}
                      <strong>{completedTradeReceipt.completedSet.name}</strong>!
                    </p>
                  </div>
                )}

                <button
                  onClick={() => setCompletedTradeReceipt(null)}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg hover:brightness-110 active:scale-95 transition-all cursor-pointer"
                >
                  Awesome! Continue Trading ➔
                </button>
              </motion.div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
