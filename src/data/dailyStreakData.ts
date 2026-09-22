export interface StreakRewardTier {
  day: number;
  coins: number;
  rolls: number;
  shields: number;
  xp: number;
  highlightTag?: string;
  isGrandJackpot?: boolean;
}

export const DAILY_STREAK_REWARDS: StreakRewardTier[] = [
  {
    day: 1,
    coins: 2500,
    rolls: 10,
    shields: 0,
    xp: 50,
    highlightTag: 'Kickoff',
  },
  {
    day: 2,
    coins: 5000,
    rolls: 15,
    shields: 0,
    xp: 100,
    highlightTag: 'Heating Up',
  },
  {
    day: 3,
    coins: 8000,
    rolls: 20,
    shields: 1,
    xp: 150,
    highlightTag: '+1 Shield',
  },
  {
    day: 4,
    coins: 12000,
    rolls: 25,
    shields: 0,
    xp: 200,
    highlightTag: 'Mega Coins',
  },
  {
    day: 5,
    coins: 18000,
    rolls: 30,
    shields: 1,
    xp: 250,
    highlightTag: 'Pro Roller',
  },
  {
    day: 6,
    coins: 25000,
    rolls: 40,
    shields: 2,
    xp: 350,
    highlightTag: 'Double Defense',
  },
  {
    day: 7,
    coins: 50000,
    rolls: 70,
    shields: 3,
    xp: 600,
    highlightTag: 'Grand Jackpot',
    isGrandJackpot: true,
  },
];
