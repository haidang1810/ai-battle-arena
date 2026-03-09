/**
 * Jungle Chess (Co Thu) board logic: 9x7 grid with rivers, traps, dens.
 * Handles movement, capture, jumping, and win detection.
 */
import {
  ROWS, COLS, RANK, PIECE_NAMES, WATER,
  INITIAL_POSITIONS, inBounds, isWater, isTrapOf, isDenOf, formatPos,
} from './jungle-terrain-constants.js';

/** Orthogonal direction vectors */
const DIRS = [[0, 1], [0, -1], [1, 0], [-1, 0]] as const;

export class JungleBoard {
  private grid: number[][];
  lastMove: string | null = null;

  constructor() {
    this.grid = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
    this.setupInitialPosition();
  }

  private setupInitialPosition(): void {
    for (const [r, c, v] of INITIAL_POSITIONS) {
      this.grid[r][c] = v;
    }
  }

  /** Get piece owner: 0=Red (positive), 1=Blue (negative), null=empty */
  private getOwner(piece: number): 0 | 1 | null {
    if (piece > 0) return 0;
    if (piece < 0) return 1;
    return null;
  }

  /** Get effective rank, considering trap weakening */
  private getEffectiveRank(piece: number, row: number, col: number): number {
    const owner = this.getOwner(piece);
    if (owner === null) return 0;
    const rank = Math.abs(piece);
    // On opponent's trap -> rank becomes 0
    const opponent = owner === 0 ? 1 : 0;
    if (isTrapOf(opponent, row, col)) return 0;
    return rank;
  }

  /** Check if attacker can capture target */
  private canCapture(
    aPiece: number, aRow: number, aCol: number,
    tPiece: number, tRow: number, tCol: number,
  ): boolean {
    const aRank = this.getEffectiveRank(aPiece, aRow, aCol);
    const tRank = this.getEffectiveRank(tPiece, tRow, tCol);
    const aAbs = Math.abs(aPiece);
    const tAbs = Math.abs(tPiece);

    // Rat in water cannot capture Elephant on land
    if (aAbs === RANK.RAT && tAbs === RANK.ELEPHANT && isWater(aRow, aCol) && !isWater(tRow, tCol)) {
      return false;
    }
    // Elephant cannot capture Rat
    if (aAbs === RANK.ELEPHANT && tAbs === RANK.RAT) return false;
    // Rat captures Elephant (when not blocked by water rule above)
    if (aAbs === RANK.RAT && tAbs === RANK.ELEPHANT) return true;
    // Normal: higher or equal rank captures
    return aRank >= tRank;
  }

  /** Check if any rat is in water along a jump path */
  private ratBlocksJump(fromR: number, fromC: number, toR: number, toC: number): boolean {
    const dr = Math.sign(toR - fromR);
    const dc = Math.sign(toC - fromC);
    let r = fromR + dr;
    let c = fromC + dc;
    while (r !== toR || c !== toC) {
      if (isWater(r, c) && this.grid[r][c] !== 0 && Math.abs(this.grid[r][c]) === RANK.RAT) {
        return true;
      }
      r += dr;
      c += dc;
    }
    return false;
  }

  /** Get all valid moves for a player as [fromRow, fromCol, toRow, toCol] tuples */
  getValidMoves(player: 0 | 1): Array<[number, number, number, number]> {
    const moves: Array<[number, number, number, number]> = [];
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const piece = this.grid[r][c];
        if (this.getOwner(piece) !== player) continue;
        const absRank = Math.abs(piece);

        for (const [dr, dc] of DIRS) {
          let tr = r + dr;
          let tc = c + dc;

          // Lion/Tiger jump across river
          if ((absRank === RANK.LION || absRank === RANK.TIGER) && inBounds(tr, tc) && isWater(tr, tc)) {
            // Jump: keep going in same direction until out of water
            while (inBounds(tr, tc) && isWater(tr, tc)) {
              tr += dr;
              tc += dc;
            }
            if (!inBounds(tr, tc)) continue;
            if (this.ratBlocksJump(r, c, tr, tc)) continue;
          } else {
            // Normal 1-step move
            if (!inBounds(tr, tc)) continue;
            // Non-Rat cannot enter water
            if (isWater(tr, tc) && absRank !== RANK.RAT) continue;
          }

          // Cannot enter own den
          if (isDenOf(player, tr, tc)) continue;

          const target = this.grid[tr][tc];
          if (target === 0) {
            moves.push([r, c, tr, tc]);
          } else if (this.getOwner(target) !== player) {
            // Rat in water cannot attack land piece, Rat on land cannot attack piece in water
            if (isWater(r, c) !== isWater(tr, tc) && absRank === RANK.RAT && Math.abs(target) !== RANK.RAT) {
              continue;
            }
            if (this.canCapture(piece, r, c, target, tr, tc)) {
              moves.push([r, c, tr, tc]);
            }
          }
        }
      }
    }
    return moves;
  }

  /** Get valid moves as formatted strings "a1-a2" */
  getValidMoveStrings(player: 0 | 1): string[] {
    return this.getValidMoves(player).map(
      ([fr, fc, tr, tc]) => `${formatPos(fr, fc)}-${formatPos(tr, tc)}`,
    );
  }

  /** Execute a move. Returns true if move was valid and applied. */
  makeMove(fromRow: number, fromCol: number, toRow: number, toCol: number, player: 0 | 1): boolean {
    const validMoves = this.getValidMoves(player);
    const isValid = validMoves.some(([fr, fc, tr, tc]) =>
      fr === fromRow && fc === fromCol && tr === toRow && tc === toCol,
    );
    if (!isValid) return false;
    this.grid[toRow][toCol] = this.grid[fromRow][fromCol];
    this.grid[fromRow][fromCol] = 0;
    this.lastMove = `${formatPos(fromRow, fromCol)}-${formatPos(toRow, toCol)}`;
    return true;
  }

  /** Check if game is won. Returns winner (0 or 1) or null. */
  checkWin(): 0 | 1 | null {
    // Den entry: any piece on opponent's den
    for (let p = 0; p < 2; p++) {
      const opponent = p === 0 ? 1 : 0;
      // Check if player p has a piece on opponent's den
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          if (this.getOwner(this.grid[r][c]) === p && isDenOf(opponent, r, c)) {
            return p as 0 | 1;
          }
        }
      }
    }
    // All pieces captured: check if either player has zero pieces
    let redCount = 0;
    let blueCount = 0;
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const piece = this.grid[r][c];
        if (piece > 0) redCount++;
        if (piece < 0) blueCount++;
      }
    }
    if (redCount === 0) return 1;
    if (blueCount === 0) return 0;
    return null;
  }

  /** ASCII board for AI readability */
  toAscii(): string {
    const colLabels = '   ' + 'abcdefg'.split('').map((c) => ` ${c} `).join('');
    const rows: string[] = [];
    for (let r = ROWS - 1; r >= 0; r--) {
      const num = String(r + 1).padStart(2, ' ');
      const cells = this.grid[r].map((cell, c) => {
        if (cell !== 0) {
          const owner = cell > 0 ? 'R' : 'B';
          const name = PIECE_NAMES[Math.abs(cell)] ?? '?';
          return `${owner}${name}${Math.abs(cell)}`.padStart(3);
        }
        if (isWater(r, c)) return ' ~~';
        if (isDenOf(0, r, c) || isDenOf(1, r, c)) return ' [*';
        if (isTrapOf(0, r, c) || isTrapOf(1, r, c)) return ' {x';
        return '  .';
      }).join('');
      rows.push(`${num}${cells}`);
    }
    return [colLabels, ...rows].join('\n');
  }

  /** Raw grid for frontend rendering */
  toGrid(): number[][] {
    return this.grid.map((row) => [...row]);
  }

  reset(): void {
    this.grid = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
    this.setupInitialPosition();
    this.lastMove = null;
  }
}
