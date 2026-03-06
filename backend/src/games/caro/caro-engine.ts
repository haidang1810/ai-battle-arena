import type { GameEngine } from '../../engine/game-engine-interface.js';
import type { GameType, MoveResult, PlayerIndex, PublicGameState } from '../../types/game-types.js';
import { CaroBoard, parsePosition, formatPosition } from './caro-board.js';

/**
 * Caro (Gomoku) game engine implementing GameEngine interface.
 * 15x15 board, first to 5 consecutive stones wins.
 */
export class CaroEngine implements GameEngine {
  readonly gameType: GameType = 'caro';
  private board = new CaroBoard();
  private currentPlayer: PlayerIndex = 0;
  private finished = false;
  private winner: PlayerIndex | null = null;
  private turnCount = 0;

  getBoard(): number[][] {
    return this.board.toGrid();
  }

  getValidMoves(): string[] {
    if (this.finished) return [];
    return this.board.getEmptyCells().map((c) => formatPosition(c.row, c.col));
  }

  getCurrentPlayer(): PlayerIndex {
    return this.currentPlayer;
  }

  isFinished(): boolean {
    return this.finished;
  }

  getWinner(): PlayerIndex | null {
    return this.winner;
  }

  getPublicState(): PublicGameState {
    return {
      gameType: 'caro',
      board: this.board.toGrid(),
      currentPlayer: this.currentPlayer,
      turn: this.turnCount,
      lastMove: this.board.lastMove
        ? formatPosition(this.board.lastMove.row, this.board.lastMove.col)
        : undefined,
      isFinished: this.finished,
      winner: this.winner,
    };
  }

  getBoardAscii(): string {
    return this.board.toAscii();
  }

  getGameInfo(): string {
    const playerSymbol = this.currentPlayer === 0 ? 'X' : 'O';
    return [
      'Game: Caro (Gomoku)',
      'Board: 15x15',
      'Win condition: 5 consecutive stones in a row (horizontal, vertical, or diagonal)',
      `Current turn: ${this.turnCount + 1}`,
      `Your symbol: ${playerSymbol}`,
      'Move format: Column letter (A-O) + Row number (1-15), e.g. "H8"',
    ].join('\n');
  }

  makeMove(move: string): MoveResult {
    if (this.finished) {
      return { valid: false, reason: 'Game is already finished' };
    }

    const pos = parsePosition(move);
    if (!pos) {
      return { valid: false, reason: `Invalid position format "${move}". Use letter A-O + number 1-15 (e.g. "H8")` };
    }

    if (!this.board.isValidMove(pos.row, pos.col)) {
      return { valid: false, reason: `Position ${move} is already occupied or out of bounds` };
    }

    this.board.place(pos.row, pos.col, this.currentPlayer);

    // Check win from last placed position
    if (this.board.checkWin(pos.row, pos.col)) {
      this.finished = true;
      this.winner = this.currentPlayer;
      return { valid: true, gameOver: true, winner: this.currentPlayer };
    }

    // Check draw
    if (this.board.isFull()) {
      this.finished = true;
      this.winner = null;
      return { valid: true, gameOver: true, winner: null };
    }

    // Switch player
    this.currentPlayer = (this.currentPlayer === 0 ? 1 : 0) as PlayerIndex;
    this.turnCount++;
    return { valid: true };
  }

  reset(): void {
    this.board.reset();
    this.currentPlayer = 0;
    this.finished = false;
    this.winner = null;
    this.turnCount = 0;
  }
}
