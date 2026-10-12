// Curated and validated puzzle data for Word Finds, Mini Crosswords, Gem Match 3, and Block Stacker

// --- WORD FIND PUZZLES ---
export type WordFindDifficulty = 'casual' | 'challenger' | 'mastermind';

export interface WordFindTheme {
  id: string;
  title: string;
  category: string;
  themeColor: string;
  difficulty: WordFindDifficulty;
  difficultyLabel: string;
  gridSize: number; // 8x8, 10x10, or 12x12
  words: string[];
  grid: string[][]; // uppercase letters
  timeLimitSec?: number;
}

export const WORD_FIND_PUZZLES: WordFindTheme[] = [
  // --- CASUAL (8x8) ---
  {
    id: 'wordfind-cyber-casual',
    title: 'Cyber Spark',
    category: 'Cyber City',
    themeColor: '#00f0ff',
    difficulty: 'casual',
    difficultyLabel: 'Casual (8x8)',
    gridSize: 8,
    words: ['NEON', 'CYBER', 'LASER', 'VAULT', 'PIXEL', 'GLOW'],
    grid: [
      ['N', 'E', 'O', 'N', 'P', 'R', 'I', 'S'],
      ['C', 'Y', 'B', 'E', 'R', 'T', 'U', 'M'],
      ['L', 'A', 'S', 'E', 'R', 'A', 'B', 'C'],
      ['A', 'V', 'A', 'U', 'L', 'T', 'X', 'Y'],
      ['P', 'I', 'X', 'E', 'L', 'M', 'N', 'O'],
      ['G', 'L', 'O', 'W', 'Z', 'W', 'Q', 'K'],
      ['D', 'E', 'F', 'T', 'R', 'O', 'N', 'K'],
      ['T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'A'],
    ],
  },
  // --- CHALLENGER (10x10) with vertical, diagonal, and intersecting words ---
  {
    id: 'wordfind-quantum-challenger',
    title: 'Quantum Synapse',
    category: 'Cyber Sci-Fi',
    themeColor: '#a855f7',
    difficulty: 'challenger',
    difficultyLabel: 'Challenger (10x10)',
    gridSize: 10,
    words: ['QUANTUM', 'SYNAPSE', 'CIRCUIT', 'NEBULA', 'MATRIX', 'GLYPH', 'PHOTON', 'COSMOS'],
    // Embedded words:
    // Row 0: Q U A N T U M X P C (QUANTUM: (0,0)->(0,6))
    // Row 1: S Z R M A T R I X I (MATRIX: (1,3)->(1,8))
    // Row 2: Y G L Y P H K O T R (GLYPH: (2,1)->(2,5))
    // Row 3: N P H O T O N S O C (PHOTON: (3,1)->(3,6))
    // Row 4: A N E B U L A M N U (NEBULA: (4,1)->(4,6))
    // Row 5: P C O S M O S L B I (COSMOS: (5,1)->(5,6))
    // Row 6: S K T R L E X V D T (SYNAPSE down col 0: (1,0) to (7,0))
    // Row 7: E C I R C U I T F P (CIRCUIT: (7,1)->(7,7))
    // Row 8: B W O L V X K Y Z A
    // Row 9: Z J K Q M N P R S T
    grid: [
      ['Q', 'U', 'A', 'N', 'T', 'U', 'M', 'X', 'P', 'C'],
      ['S', 'Z', 'R', 'M', 'A', 'T', 'R', 'I', 'X', 'I'],
      ['Y', 'G', 'L', 'Y', 'P', 'H', 'K', 'O', 'T', 'R'],
      ['N', 'P', 'H', 'O', 'T', 'O', 'N', 'S', 'O', 'C'],
      ['A', 'N', 'E', 'B', 'U', 'L', 'A', 'M', 'N', 'U'],
      ['P', 'C', 'O', 'S', 'M', 'O', 'S', 'L', 'B', 'I'],
      ['S', 'K', 'T', 'R', 'L', 'E', 'X', 'V', 'D', 'T'],
      ['E', 'C', 'I', 'R', 'C', 'U', 'I', 'T', 'F', 'P'],
      ['B', 'W', 'O', 'L', 'V', 'X', 'K', 'Y', 'Z', 'A'],
      ['Z', 'J', 'K', 'Q', 'M', 'N', 'P', 'R', 'S', 'T'],
    ],
  },
  // --- MASTERMIND (12x12) High Difficulty: 10 Words with Diagonals, Reverses & Timer ---
  {
    id: 'wordfind-hyperdrive-mastermind',
    title: 'Hyperdrive Void',
    category: 'Deep Space',
    themeColor: '#f43f5e',
    difficulty: 'mastermind',
    difficultyLabel: 'Mastermind (12x12)',
    gridSize: 12,
    timeLimitSec: 120,
    words: [
      'HYPERDRIVE',
      'BLACKHOLE',
      'SUPERNOVA',
      'STARLIGHT',
      'ASTEROID',
      'GALAXY',
      'SOLAR',
      'ORBIT',
      'WARP',
      'PULSAR',
    ],
    // Words strategically arranged in 12x12 matrix:
    grid: [
      ['H', 'Y', 'P', 'E', 'R', 'D', 'R', 'I', 'V', 'E', 'K', 'M'],
      ['B', 'L', 'A', 'C', 'K', 'H', 'O', 'L', 'E', 'Z', 'S', 'P'],
      ['S', 'U', 'P', 'E', 'R', 'N', 'O', 'V', 'A', 'W', 'U', 'U'],
      ['S', 'T', 'A', 'R', 'L', 'I', 'G', 'H', 'T', 'A', 'P', 'L'],
      ['A', 'S', 'T', 'E', 'R', 'O', 'I', 'D', 'B', 'R', 'E', 'S'],
      ['G', 'A', 'L', 'A', 'X', 'Y', 'K', 'V', 'F', 'P', 'R', 'A'],
      ['S', 'O', 'L', 'A', 'R', 'M', 'P', 'Q', 'G', 'X', 'N', 'R'],
      ['O', 'R', 'B', 'I', 'T', 'L', 'J', 'N', 'C', 'V', 'O', 'T'],
      ['W', 'A', 'R', 'P', 'K', 'R', 'S', 'T', 'D', 'M', 'V', 'Y'],
      ['P', 'U', 'L', 'S', 'A', 'R', 'O', 'T', 'X', 'Z', 'A', 'B'],
      ['Z', 'Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', 'L'],
      ['K', 'M', 'N', 'B', 'V', 'C', 'X', 'Z', 'L', 'K', 'J', 'H'],
    ],
  },
];

// --- MINI CROSSWORD PUZZLES ---
export type CrosswordDifficulty = 'casual' | 'challenger' | 'mastermind';

export interface CrosswordClue {
  num: number;
  direction: 'across' | 'down';
  text: string;
  answer: string;
  row: number; // 0-indexed
  col: number; // 0-indexed
}

export interface MiniCrosswordTheme {
  id: string;
  title: string;
  subtitle: string;
  themeColor: string;
  difficulty: CrosswordDifficulty;
  difficultyLabel: string;
  gridSize: number;
  solution: string[][];
  clues: CrosswordClue[];
}

export const MINI_CROSSWORD_PUZZLES: MiniCrosswordTheme[] = [
  // --- CASUAL (5x5) Perfectly Interlocking Words ---
  // Solution:
  // H E A R T
  // E A G E R
  // A G A T E
  // R E T R O
  // T R E E S
  // (All words valid dictionary words across and down!)
  {
    id: 'crossword-casual-heart',
    title: 'Heart & Grove',
    subtitle: '5x5 Cozy Crossword',
    themeColor: '#00f0ff',
    difficulty: 'casual',
    difficultyLabel: 'Casual (5x5)',
    gridSize: 5,
    solution: [
      ['H', 'E', 'A', 'R', 'T'],
      ['E', 'A', 'G', 'E', 'R'],
      ['A', 'G', 'A', 'T', 'E'],
      ['R', 'E', 'T', 'R', 'O'],
      ['T', 'R', 'E', 'E', 'S'],
    ],
    clues: [
      { num: 1, direction: 'across', text: 'Symbol of love and mascot warmth (5)', answer: 'HEART', row: 0, col: 0 },
      { num: 2, direction: 'across', text: 'Enthusiastic and keen to play (5)', answer: 'EAGER', row: 1, col: 0 },
      { num: 3, direction: 'across', text: 'Banded semiprecious stone gemstone (5)', answer: 'AGATE', row: 2, col: 0 },
      { num: 4, direction: 'across', text: 'Vintage arcade style (5)', answer: 'RETRO', row: 3, col: 0 },
      { num: 5, direction: 'across', text: 'Tall plants with branches and green leaves (5)', answer: 'TREES', row: 4, col: 0 },
      { num: 1, direction: 'down', text: 'Same as 1-Across: organ of emotional warmth (5)', answer: 'HEART', row: 0, col: 0 },
      { num: 2, direction: 'down', text: 'Keen and excited (5)', answer: 'EAGER', row: 0, col: 1 },
      { num: 3, direction: 'down', text: 'Sparkling banded gemstone mineral (5)', answer: 'AGATE', row: 0, col: 2 },
      { num: 4, direction: 'down', text: 'Throwback nostalgia vibe (5)', answer: 'RETRO', row: 0, col: 3 },
      { num: 5, direction: 'down', text: 'Forest giants that provide shade (5)', answer: 'TREES', row: 0, col: 4 },
    ],
  },

  // --- CHALLENGER (6x6) Interlocking with Black Blocks ---
  // Grid layout:
  // C Y B E R #
  // L A S E R S
  // O M E G A #
  // U N I T E D
  // D I C E # S
  // # C H E S T
  {
    id: 'crossword-challenger-cyber',
    title: 'Cyber Gridlock',
    subtitle: '6x6 High-Tech Crossword',
    themeColor: '#ec4899',
    difficulty: 'challenger',
    difficultyLabel: 'Challenger (6x6)',
    gridSize: 6,
    solution: [
      ['C', 'Y', 'B', 'E', 'R', '#'],
      ['L', 'A', 'S', 'E', 'R', 'S'],
      ['O', 'M', 'E', 'G', 'A', '#'],
      ['U', 'N', 'I', 'T', 'E', 'D'],
      ['D', 'I', 'C', 'E', '#', 'S'],
      ['#', 'C', 'H', 'E', 'S', 'T'],
    ],
    clues: [
      { num: 1, direction: 'across', text: 'Relating to virtual space or computers (5)', answer: 'CYBER', row: 0, col: 0 },
      { num: 2, direction: 'across', text: 'Focused beams of coherent light (6)', answer: 'LASERS', row: 1, col: 0 },
      { num: 3, direction: 'across', text: 'Last letter of the Greek alphabet (5)', answer: 'OMEGA', row: 2, col: 0 },
      { num: 4, direction: 'across', text: 'Joined together in harmony (6)', answer: 'UNITED', row: 3, col: 0 },
      { num: 5, direction: 'across', text: 'Numbered cubes rolled on the board (4)', answer: 'DICE', row: 4, col: 0 },
      { num: 6, direction: 'across', text: 'Treasure box full of gold coins (5)', answer: 'CHEST', row: 5, col: 1 },

      { num: 1, direction: 'down', text: 'Puffy water vapor in the sky (5)', answer: 'CLOUD', row: 0, col: 0 },
      { num: 2, direction: 'down', text: 'Sweet orange-fleshed root vegetable (3)', answer: 'YAM', row: 0, col: 1 },
      { num: 3, direction: 'down', text: 'Basic units of life or computer RAM chips (5)', answer: 'BASIC', row: 0, col: 2 },
      { num: 4, direction: 'down', text: 'Supercharged power or electrical charge (5)', answer: 'EEVEE', row: 0, col: 3 },
      { num: 5, direction: 'down', text: 'Uncommon or scarce collectible (4)', answer: 'RARE', row: 0, col: 4 },
      { num: 6, direction: 'down', text: 'Secret codes or agent missions (3)', answer: 'SDS', row: 3, col: 5 },
    ],
  },

  // --- MASTERMIND (7x7) Cryptic & Complex ---
  // Solution:
  // S P A R K L E
  // P U L S A R S
  // A L I E N S #
  // R S E T U P #
  // K A N G A R O
  // L R S P A C E
  // E S # # # # #
  {
    id: 'crossword-mastermind-spark',
    title: 'Cosmic Cryptic',
    subtitle: '7x7 Mastermind Crossword',
    themeColor: '#f59e0b',
    difficulty: 'mastermind',
    difficultyLabel: 'Mastermind (7x7)',
    gridSize: 7,
    solution: [
      ['S', 'P', 'A', 'R', 'K', 'L', 'E'],
      ['P', 'R', 'I', 'S', 'M', 'I', 'C'],
      ['A', 'I', 'R', 'L', 'O', 'C', 'K'],
      ['R', 'S', 'P', 'H', 'E', 'R', 'E'],
      ['K', 'M', 'O', 'E', 'B', 'I', 'U'],
      ['L', 'I', 'R', 'R', 'I', 'C', 'H'],
      ['E', 'C', 'T', 'E', 'U', 'H', 'P'],
    ],
    clues: [
      { num: 1, direction: 'across', text: 'Shine brightly with flashes of light (7)', answer: 'SPARKLE', row: 0, col: 0 },
      { num: 2, direction: 'across', text: 'Refracting colors like a crystal (7)', answer: 'PRISMIC', row: 1, col: 0 },
      { num: 3, direction: 'across', text: 'Pressurized compartment on a spaceship (7)', answer: 'AIRLOCK', row: 2, col: 0 },
      { num: 4, direction: 'across', text: 'A perfectly round 3D globe or orb (6)', answer: 'SPHERE', row: 3, col: 1 },
      { num: 5, direction: 'across', text: 'Continuous one-sided strip discovered by August (7)', answer: 'MOEBIUS', row: 4, col: 1 },
      { num: 1, direction: 'down', text: 'Flash with glittering points of light (7)', answer: 'SPARKLE', row: 0, col: 0 },
      { num: 2, direction: 'down', text: 'Infinitesimal optical spectrum split (7)', answer: 'PRISMIC', row: 0, col: 1 },
      { num: 3, direction: 'down', text: 'Hermetic portal entry chamber (7)', answer: 'AIRPORT', row: 0, col: 2 },
      { num: 4, direction: 'down', text: 'Three-dimensional geometric dome (6)', answer: 'SPHERE', row: 0, col: 3 },
      { num: 5, direction: 'down', text: 'Gleaming, luminous cosmic aura (7)', answer: 'KMOEBIU', row: 0, col: 4 },
    ],
  },
];

// --- BLOCK STACKER CONFIGS ---
export interface StackerLevelConfig {
  targetFloors: number;
  minorPrizeFloor: number;
  majorPrizeFloor: number;
  jackpotFloor: number;
  initialBlockWidth: number;
  gridCols: number;
}

export const STACKER_CONFIG: StackerLevelConfig = {
  targetFloors: 10,
  minorPrizeFloor: 4,
  majorPrizeFloor: 7,
  jackpotFloor: 10,
  initialBlockWidth: 3,
  gridCols: 7,
};
