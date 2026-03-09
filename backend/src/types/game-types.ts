export type GameType = 'caro' | 'chess' | 'battleship' | 'jungle';
export type PlayerIndex = 0 | 1;

export interface PlayerConfig {
  providerId: string;
  modelId: string;
  displayName: string;
  apiKey?: string; // stored in memory only, never persisted
}

export interface GameSettings {
  maxInvalidMoves: number;
  thinkingTimeoutMs: number;
  delayBetweenTurnsMs: number;
  stepByStep: boolean;
}

export const DEFAULT_GAME_SETTINGS: GameSettings = {
  maxInvalidMoves: 3,
  thinkingTimeoutMs: 60000,
  delayBetweenTurnsMs: 1000,
  stepByStep: false,
};

export interface MoveResult {
  valid: boolean;
  reason?: string;
  gameOver?: boolean;
  winner?: PlayerIndex | null; // null = draw
}

export interface RecordedMove {
  turn: number;
  player: PlayerIndex;
  move: unknown;
  timestamp: number;
  thinkingTimeMs: number;
  tokensUsed: number;
  costEstimate: number;
  thinkingLog: string;
  wasInvalid: boolean;
  invalidAttempts: number;
}

export interface PublicGameState {
  gameType: GameType;
  board: unknown;
  currentPlayer: PlayerIndex;
  turn: number;
  lastMove?: unknown;
  isFinished: boolean;
  winner?: PlayerIndex | null;
}

export interface GameRecord {
  id: string;
  gameType: GameType;
  players: [PlayerConfig, PlayerConfig];
  moves: RecordedMove[];
  startTime: number;
  endTime?: number;
  winner?: PlayerIndex | null;
  settings: GameSettings;
}
