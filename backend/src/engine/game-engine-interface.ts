import type { GameType, MoveResult, PlayerIndex, PublicGameState } from '../types/game-types.js';

/**
 * Abstract interface all games must implement.
 * Engine-as-referee: server validates all moves.
 */
export interface GameEngine {
  readonly gameType: GameType;

  // Queries
  getBoard(): unknown;
  getValidMoves(): string[];
  getCurrentPlayer(): PlayerIndex;
  isFinished(): boolean;
  getWinner(): PlayerIndex | null;
  getPublicState(): PublicGameState;
  getBoardAscii(): string;
  getGameInfo(): string;

  // Commands
  makeMove(move: string): MoveResult;
  reset(): void;
}
