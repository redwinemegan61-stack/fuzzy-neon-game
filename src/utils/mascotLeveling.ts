import { MascotAbility } from '../types';

export const MAX_MASCOT_LEVEL = 10;

// Upgrade costs per level (Level 1 -> 2, Level 2 -> 3, etc.)
export const MASCOT_UPGRADE_COSTS: Record<number, number> = {
  1: 2500,
  2: 6000,
  3: 12000,
  4: 20000,
  5: 32000,
  6: 48000,
  7: 70000,
  8: 100000,
  9: 140000,
};

export function getMascotUpgradeCost(currentLevel: number): number {
  if (currentLevel >= MAX_MASCOT_LEVEL) return 0;
  return MASCOT_UPGRADE_COSTS[currentLevel] || Math.round(2500 * Math.pow(1.6, currentLevel - 1));
}

// Calculate the scaled multiplier based on level and ability type
export function calculateMascotMultiplier(
  baseMultiplier: number,
  level: number,
  effectType: MascotAbility['effectType']
): number {
  if (level <= 1) return baseMultiplier;
  const levelDiff = level - 1;

  let multiplier = baseMultiplier;
  switch (effectType) {
    case 'bonus_coins':
      // Base 1.50 -> +0.15 per level (Lv 2: 1.65x, Lv 3: 1.80x, Lv 10: 2.85x)
      multiplier = baseMultiplier + levelDiff * 0.15;
      break;
    case 'slow_time':
      // Base 1.25 -> +0.10 per level (Lv 2: 1.35x, Lv 3: 1.45x, Lv 10: 2.15x slower timer)
      multiplier = baseMultiplier + levelDiff * 0.1;
      break;
    case 'lucky_dice':
      // Base 2.00 -> +0.40 per level (Lv 2: 2.4x, Lv 3: 2.8x, Lv 10: 5.6x)
      multiplier = baseMultiplier + levelDiff * 0.4;
      break;
    case 'streak_shield':
      // Base 1.00 -> +0.15 per level (combo score and reward bonus)
      multiplier = baseMultiplier + levelDiff * 0.15;
      break;
    default:
      multiplier = baseMultiplier + levelDiff * 0.15;
      break;
  }

  return Number(multiplier.toFixed(2));
}

// Generate dynamic ability description highlighting current efficiency
export function getAbilityFormattedDescription(
  ability: MascotAbility,
  level: number
): string {
  const currentMultiplier = calculateMascotMultiplier(ability.multiplier, level, ability.effectType);

  switch (ability.effectType) {
    case 'bonus_coins': {
      const pct = Math.round((currentMultiplier - 1) * 100);
      return `Awards +${pct}% bonus coins (${currentMultiplier}x) from all board tiles, raids, and puzzle victories.`;
    }
    case 'slow_time': {
      const pct = Math.round((currentMultiplier - 1) * 100);
      return `Slows down reflex puzzle timers by +${pct}% (${currentMultiplier}x window) for relaxed high combo streaks.`;
    }
    case 'lucky_dice': {
      return `Awards +${Math.round(currentMultiplier)} extra dice (${currentMultiplier}x) on mystery crates, energy tiles, and doubles star rewards.`;
    }
    case 'streak_shield': {
      const pct = Math.round((currentMultiplier - 1) * 100);
      return `Protects reflex combo streaks from breaking on missed taps and grants +${pct}% bonus streak points.`;
    }
    default:
      return ability.description;
  }
}
