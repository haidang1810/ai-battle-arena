export type GameType = 'caro' | 'chess' | 'battleship';
export type PlayerIndex = 0 | 1;
export type SessionStatus = 'waiting' | 'playing' | 'paused' | 'finished';

export interface PlayerConfig {
  providerId: string;
  modelId: string;
  displayName: string;
}

export interface RecordedMove {
  turn: number;
  player: PlayerIndex;
  move: string;
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
  board: number[][] | string | unknown; // number[][] (caro), string/FEN (chess), object (battleship)
  currentPlayer: PlayerIndex;
  turn: number;
  lastMove?: string;
  isFinished: boolean;
  winner?: PlayerIndex | null;
}

export interface ModelInfo {
  id: string;
  name: string;
  pricing: { prompt: string; completion: string };
  contextLength: number;
}

export interface ProviderInfo {
  id: string;
  displayName: string;
}
