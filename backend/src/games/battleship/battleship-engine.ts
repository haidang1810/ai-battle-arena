import type { GameEngine } from '../../engine/game-engine-interface.js';
import type { GameType, MoveResult, PlayerIndex, PublicGameState } from '../../types/game-types.js';
import { BattleshipBoard, SHIPS, parsePos, formatPos, type ShipName, type Orientation } from './battleship-board.js';

type GamePhase = 'placement' | 'battle';

/**
 * Battleship engine: 2-phase game (placement → battle).
 * Player 0 places ships first, then Player 1, then alternating shots.
 * AI uses make_move with encoded format:
 *   Placement: "carrier:A1:H" (shipName:position:orientation)
 *   Battle: "E5" (target position)
 */
export class BattleshipEngine implements GameEngine {
  readonly gameType: GameType = 'battleship';
  private boards: [BattleshipBoard, BattleshipBoard] = [new BattleshipBoard(), new BattleshipBoard()];
  private phase: GamePhase = 'placement';
  private currentPlayer: PlayerIndex = 0;
  private turnCount = 0;
  private finished = false;
  private winner: PlayerIndex | null = null;

  getBoard(): unknown {
    return {
      phase: this.phase,
      boards: [
        { own: this.boards[0].getSpectatorView(), tracking: this.boards[0].getTrackingView() },
        { own: this.boards[1].getSpectatorView(), tracking: this.boards[1].getTrackingView() },
      ],
    };
  }

  getValidMoves(): string[] {
    if (this.finished) return [];

    if (this.phase === 'placement') {
      const board = this.boards[this.currentPlayer];
      const unplaced = board.unplacedShips();
      if (unplaced.length === 0) return [];
      // Return examples for the next ship to place
      const ship = unplaced[0];
      const moves: string[] = [];
      for (let r = 0; r < 10; r++) {
        for (let c = 0; c < 10; c++) {
          for (const ori of ['H', 'V'] as const) {
            const endR = ori === 'V' ? r + ship.size - 1 : r;
            const endC = ori === 'H' ? c + ship.size - 1 : c;
            if (endR < 10 && endC < 10) {
              moves.push(`${ship.name}:${formatPos(r, c)}:${ori}`);
            }
          }
        }
      }
      return moves;
    }

    // Battle phase: all unshot positions on opponent's board
    const opponentIdx = this.currentPlayer === 0 ? 1 : 0;
    const opponentBoard = this.boards[opponentIdx];
    const moves: string[] = [];
    for (let r = 0; r < 10; r++) {
      for (let c = 0; c < 10; c++) {
        if (!opponentBoard.wasShot(r, c)) {
          moves.push(formatPos(r, c));
        }
      }
    }
    return moves;
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
      gameType: 'battleship',
      board: this.getBoard(),
      currentPlayer: this.currentPlayer,
      turn: this.turnCount,
      isFinished: this.finished,
      winner: this.winner,
    };
  }

  /** ASCII board filtered for the CURRENT player */
  getBoardAscii(): string {
    const board = this.boards[this.currentPlayer];

    if (this.phase === 'placement') {
      const unplaced = board.unplacedShips();
      const lines = [
        '=== YOUR BOARD (placement phase) ===',
        board.ownAscii(),
        '',
        `Ships to place: ${unplaced.map((s) => `${s.name}(${s.size})`).join(', ')}`,
        'Format: shipName:position:orientation (H=horizontal, V=vertical)',
        'Example: carrier:A1:H',
      ];
      return lines.join('\n');
    }

    const lines = [
      '=== YOUR BOARD ===',
      board.ownAscii(),
      '',
      '=== TRACKING BOARD (shots at opponent) ===',
      board.trackingAscii(),
      '',
      'Legend: S=ship, X=hit, O=miss, #=sunk, .=unknown',
    ];
    return lines.join('\n');
  }

  getGameInfo(): string {
    if (this.phase === 'placement') {
      const board = this.boards[this.currentPlayer];
      const unplaced = board.unplacedShips();
      return [
        'Game: Battleship',
        'Board: 10x10 per player',
        `Phase: PLACEMENT — place your ${unplaced.length} remaining ship(s)`,
        `Ships to place: ${unplaced.map((s) => `${s.name}(size ${s.size})`).join(', ')}`,
        'Move format: shipName:position:orientation',
        'Orientation: H=horizontal (right), V=vertical (down)',
        'Example: carrier:A1:H places carrier at A1 going right to E1',
        'Position: Column A-J + Row 1-10',
      ].join('\n');
    }

    const myBoard = this.boards[this.currentPlayer];
    const oppIdx = this.currentPlayer === 0 ? 1 : 0;
    const oppBoard = this.boards[oppIdx];
    const mySunk = myBoard.ships.filter((s) => s.hits.size >= s.size).length;
    const oppSunk = oppBoard.ships.filter((s) => s.hits.size >= s.size).length;

    return [
      'Game: Battleship',
      'Board: 10x10 per player',
      'Phase: BATTLE — fire at opponent\'s board',
      `Your ships sunk: ${mySunk}/${SHIPS.length}`,
      `Opponent ships sunk: ${oppSunk}/${SHIPS.length}`,
      'Move format: position (e.g. "E5")',
      'Position: Column A-J + Row 1-10',
    ].join('\n');
  }

  makeMove(move: string): MoveResult {
    if (this.finished) {
      return { valid: false, reason: 'Game is already finished' };
    }

    if (this.phase === 'placement') {
      return this.handlePlacement(move);
    }
    return this.handleBattle(move);
  }

  private handlePlacement(move: string): MoveResult {
    // Parse "shipName:position:orientation"
    const parts = move.trim().toLowerCase().split(':');
    if (parts.length !== 3) {
      return { valid: false, reason: 'Placement format: shipName:position:orientation (e.g. carrier:A1:H)' };
    }

    const [shipName, posStr, oriStr] = parts;
    const pos = parsePos(posStr);
    if (!pos) {
      return { valid: false, reason: `Invalid position "${posStr}". Use A-J + 1-10 (e.g. A1)` };
    }

    const orientation = oriStr.toUpperCase();
    if (orientation !== 'H' && orientation !== 'V') {
      return { valid: false, reason: 'Orientation must be H (horizontal) or V (vertical)' };
    }

    const board = this.boards[this.currentPlayer];
    const error = board.placeShip(shipName as ShipName, pos.row, pos.col, orientation as Orientation);
    if (error) {
      return { valid: false, reason: error };
    }

    // Check if current player finished placing all ships
    if (board.allShipsPlaced()) {
      if (this.currentPlayer === 0) {
        // Switch to player 1 for placement
        this.currentPlayer = 1;
      } else {
        // Both players done placing — switch to battle phase
        this.phase = 'battle';
        this.currentPlayer = 0;
      }
    }

    this.turnCount++;
    return { valid: true };
  }

  private handleBattle(move: string): MoveResult {
    const pos = parsePos(move);
    if (!pos) {
      return { valid: false, reason: `Invalid position "${move}". Use A-J + 1-10 (e.g. E5)` };
    }

    const opponentIdx = (this.currentPlayer === 0 ? 1 : 0) as PlayerIndex;
    const opponentBoard = this.boards[opponentIdx];
    const myBoard = this.boards[this.currentPlayer];

    if (opponentBoard.wasShot(pos.row, pos.col)) {
      return { valid: false, reason: `Position ${move} was already targeted` };
    }

    const result = opponentBoard.receiveShot(pos.row, pos.col);
    myBoard.recordShot(pos.row, pos.col, result.hit, result.sunk);

    // Check if all opponent ships sunk
    if (opponentBoard.allShipsSunk()) {
      this.finished = true;
      this.winner = this.currentPlayer;
      return { valid: true, gameOver: true, winner: this.currentPlayer };
    }

    // Switch player
    this.currentPlayer = opponentIdx;
    this.turnCount++;
    return { valid: true };
  }

  reset(): void {
    this.boards = [new BattleshipBoard(), new BattleshipBoard()];
    this.phase = 'placement';
    this.currentPlayer = 0;
    this.turnCount = 0;
    this.finished = false;
    this.winner = null;
  }
}
