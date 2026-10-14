import React from 'react';
import { Mascot, MascotBurrow } from '../types';
import { StandaloneThreeBorough } from './StandaloneThreeBorough';

interface ThreeBurrowDioramaProps {
  mascot: Mascot;
  burrow?: MascotBurrow;
  allMascots?: Mascot[];
  onSelectActiveMascot?: (mascotId: string) => void;
  playerCoins?: number;
}

export const ThreeBurrowDiorama: React.FC<ThreeBurrowDioramaProps> = ({
  mascot,
  burrow,
  allMascots,
  onSelectActiveMascot,
  playerCoins,
}) => {
  return (
    <StandaloneThreeBorough
      mascot={mascot}
      burrow={burrow}
      allMascots={allMascots}
      onSelectActiveMascot={onSelectActiveMascot}
      playerCoins={playerCoins}
    />
  );
};
