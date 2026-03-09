/**
 * Jungle Chess (Co Thu) engine implementing GameEngine interface.
 * 9x7 board, 8 animal pieces per side, rivers, traps, dens.
 */
import type { GameEngine } from '../../engine/game-engine-interface.js';
import type { GameType, MoveResult, PlayerIndex, PublicGameState } from '../../types/game-types.js';
import { JungleBoard } from './jungle-board.js';
import { parseMove } from './jungle-terrain-constants.js';

export class JungleEngine implements GameEngine {
  readonly gameType: GameType = 'jungle';
  private board = new JungleBoard();
  private currentPlayer: PlayerIndex = 0;
  private finished = false;
  private winner: PlayerIndex | null = null;
  private turnCount = 0;
  private lastMove: string | null = null;

  getBoard(): number[][] {
    return this.board.toGrid();
  }

  getValidMoves(): string[] {
    if (this.finished) return [];
    return this.board.getValidMoveStrings(this.currentPlayer);
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
      gameType: 'jungle',
      board: this.board.toGrid(),
      currentPlayer: this.currentPlayer,
      turn: this.turnCount,
      lastMove: this.lastMove ?? undefined,
      isFinished: this.finished,
      winner: this.winner,
    };
  }

  getBoardAscii(): string {
    return this.board.toAscii();
  }

  getGameInfo(): string {
    const color = this.currentPlayer === 0 ? 'Red' : 'Blue';
    return [
      'Game: Jungle Chess (Co Thu / Dau Thu Ky)',
      'Board: 9x7 with rivers, traps, and dens',
      'Pieces: Rat(1) Cat(2) Wolf(3) Dog(4) Leopard(5) Tiger(6) Lion(7) Elephant(8)',
      `Current turn: ${this.turnCount + 1}`,
      `Your side: ${color}`,
      'Move format: "fromPos-toPos" (e.g. "a3-a4")',
      'Position: column a-g + row 1-9',
      'Win: enter opponent den or capture all opponent pieces',
      'Special: Rat captures Elephant. Lion/Tiger jump rivers. Traps weaken enemies.',
    ].join('\n');
  }

  makeMove(move: string): MoveResult {
    if (this.finished) {
      return { valid: false, reason: 'Game is already finished' };
    }

    const parsed = parseMove(move);
    if (!parsed) {
      return { valid: false, reason: `Invalid move format "${move}". Use "fromPos-toPos" (e.g. "a3-a4")` };
    }

    const { fromRow, fromCol, toRow, toCol } = parsed;
    const success = this.board.makeMove(fromRow, fromCol, toRow, toCol, this.currentPlayer);
    if (!success) {
      return { valid: false, reason: `Illegal move "${move}". Call get_valid_moves to see legal moves.` };
    }

    this.lastMove = move;

    // Check win after move
    const winResult = this.board.checkWin();
    if (winResult !== null) {
      this.finished = true;
      this.winner = winResult as PlayerIndex;
      return { valid: true, gameOver: true, winner: this.winner };
    }

    // Switch player
    this.currentPlayer = (this.currentPlayer === 0 ? 1 : 0) as PlayerIndex;
    this.turnCount++;

    // Stalemate: next player has no valid moves -> current mover wins
    if (this.board.getValidMoveStrings(this.currentPlayer).length === 0) {
      this.finished = true;
      this.winner = (this.currentPlayer === 0 ? 1 : 0) as PlayerIndex;
      return { valid: true, gameOver: true, winner: this.winner };
    }

    return { valid: true };
  }

  reset(): void {
    this.board.reset();
    this.currentPlayer = 0;
    this.finished = false;
    this.winner = null;
    this.turnCount = 0;
    this.lastMove = null;
  }
}
