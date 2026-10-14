import React from 'react';
import { Town, Mascot, MascotBurrow } from '../types';
import { StandaloneThreeTown } from './StandaloneThreeTown';

interface ThreeTownBurrowsMapProps {
  town: Town;
  mascots: Mascot[];
  activeMascot: Mascot;
  playerCoins: number;
  burrows?: Record<string, MascotBurrow>;
  onUpgradeLandmark?: (landmarkId: string, cost: number) => void;
  onSelectActiveMascot?: (mascotId: string) => void;
}

export const ThreeTownBurrowsMap: React.FC<ThreeTownBurrowsMapProps> = ({
  town,
  mascots,
  activeMascot,
  playerCoins,
  onUpgradeLandmark = () => {},
  onSelectActiveMascot,
}) => {
  return (
    <StandaloneThreeTown
      town={town}
      coins={playerCoins}
      activeMascot={activeMascot}
      allMascots={mascots}
      onUpgradeLandmark={onUpgradeLandmark}
      onSelectActiveMascot={onSelectActiveMascot}
    />
  );
};
