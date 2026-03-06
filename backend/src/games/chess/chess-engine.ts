import { Chess } from 'chess.js';
import type { GameEngine } from '../../engine/game-engine-interface.js';
import type { GameType, MoveResult, PlayerIndex, PublicGameState } from '../../types/game-types.js';

/**
 * Chess game engine implementing GameEngine interface.
 * Uses chess.js for move validation, check/checkmate detection.
 * Player 0 = White, Player 1 = Black.
 */
export class ChessEngine implements GameEngine {
  readonly gameType: GameType = 'chess';
  private chess = new Chess();
  private turnCount = 0;

  getBoard(): string {
    return this.chess.fen();
  }

  getValidMoves(): string[] {
    return this.chess.moves();
  }

  getCurrentPlayer(): PlayerIndex {
    return this.chess.turn() === 'w' ? 0 : 1;
  }

  isFinished(): boolean {
    return this.chess.isGameOver();
  }

  getWinner(): PlayerIndex | null {
    if (!this.chess.isGameOver()) return null;
    if (this.chess.isCheckmate()) {
      // The side whose turn it is lost (they are in checkmate)
      return this.chess.turn() === 'w' ? 1 : 0;
    }
    // Draw: stalemate, insufficient material, threefold, 50-move rule
    return null;
  }

  getPublicState(): PublicGameState {
    const history = this.chess.history();
    return {
      gameType: 'chess',
      board: this.chess.fen(),
      currentPlayer: this.getCurrentPlayer(),
      turn: this.turnCount,
      lastMove: history.length > 0 ? history[history.length - 1] : undefined,
      isFinished: this.isFinished(),
      winner: this.getWinner(),
    };
  }

  getBoardAscii(): string {
    return this.chess.ascii();
  }

  getGameInfo(): string {
    const color = this.chess.turn() === 'w' ? 'White' : 'Black';
    const lines = [
      'Game: Chess (Standard FIDE rules)',
      'Board: 8x8',
      'Win condition: Checkmate your opponent',
      `Current turn: ${this.turnCount + 1}`,
      `Your color: ${color}`,
      'Move format: Standard Algebraic Notation (SAN), e.g. "e4", "Nf3", "O-O", "Bxe5"',
    ];
    if (this.chess.isCheck()) lines.push('STATUS: You are in CHECK! You must escape check.');
    return lines.join('\n');
  }

  makeMove(move: string): MoveResult {
    if (this.isFinished()) {
      return { valid: false, reason: 'Game is already finished' };
    }

    try {
      const result = this.chess.move(move);
      if (!result) {
        return { valid: false, reason: `Invalid move "${move}". Use SAN notation (e.g. "e4", "Nf3", "O-O").` };
      }
    } catch {
      return { valid: false, reason: `Invalid move "${move}". Use SAN notation (e.g. "e4", "Nf3", "O-O").` };
    }

    this.turnCount++;

    if (this.isFinished()) {
      return { valid: true, gameOver: true, winner: this.getWinner() };
    }

    return { valid: true };
  }

  reset(): void {
    this.chess = new Chess();
    this.turnCount = 0;
  }
}
