import type { PlayerIndex } from '../../types/game-types.js';

const BOARD_SIZE = 15;
const WIN_LENGTH = 5;

// Direction vectors for win checking: horizontal, vertical, diagonal, anti-diagonal
const DIRECTIONS = [
  [0, 1],  // horizontal
  [1, 0],  // vertical
  [1, 1],  // diagonal
  [1, -1], // anti-diagonal
] as const;

/**
 * Caro (Gomoku) board logic: 15x15 grid, 5-in-a-row wins.
 */
export class CaroBoard {
  private grid: number[][];
  lastMove: { row: number; col: number } | null = null;

  constructor() {
    this.grid = Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(0));
  }

  isValidMove(row: number, col: number): boolean {
    return row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE && this.grid[row][col] === 0;
  }

  place(row: number, col: number, player: PlayerIndex): boolean {
    if (!this.isValidMove(row, col)) return false;
    this.grid[row][col] = player + 1; // 1 or 2
    this.lastMove = { row, col };
    return true;
  }

  /**
   * Check if last move creates 5+ consecutive stones.
   * Only checks from the last placed position (O(1)).
   */
  checkWin(row: number, col: number): boolean {
    const stone = this.grid[row][col];
    if (stone === 0) return false;

    for (const [dr, dc] of DIRECTIONS) {
      let count = 1;
      // Count in positive direction
      for (let i = 1; i < WIN_LENGTH; i++) {
        const r = row + dr * i;
        const c = col + dc * i;
        if (r < 0 || r >= BOARD_SIZE || c < 0 || c >= BOARD_SIZE || this.grid[r][c] !== stone) break;
        count++;
      }
      // Count in negative direction
      for (let i = 1; i < WIN_LENGTH; i++) {
        const r = row - dr * i;
        const c = col - dc * i;
        if (r < 0 || r >= BOARD_SIZE || c < 0 || c >= BOARD_SIZE || this.grid[r][c] !== stone) break;
        count++;
      }
      if (count >= WIN_LENGTH) return true;
    }
    return false;
  }

  isFull(): boolean {
    return this.grid.every((row) => row.every((cell) => cell !== 0));
  }

  getEmptyCells(): Array<{ row: number; col: number }> {
    const cells: Array<{ row: number; col: number }> = [];
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (this.grid[r][c] === 0) cells.push({ row: r, col: c });
      }
    }
    return cells;
  }

  /** ASCII board with labeled axes for AI readability */
  toAscii(): string {
    const colLabels = '   ' + Array.from({ length: BOARD_SIZE }, (_, i) => String.fromCharCode(65 + i)).join(' ');
    const rows = this.grid.map((row, i) => {
      const num = String(i + 1).padStart(2, ' ');
      const cells = row.map((cell) => (cell === 0 ? '.' : cell === 1 ? 'X' : 'O')).join(' ');
      return `${num} ${cells}`;
    });
    return [colLabels, ...rows].join('\n');
  }

  /** Raw grid for frontend rendering */
  toGrid(): number[][] {
    return this.grid.map((row) => [...row]);
  }

  reset() {
    this.grid = Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(0));
    this.lastMove = null;
  }
}

/** Parse position string like "H8" to {row, col} */
export function parsePosition(position: string): { row: number; col: number } | null {
  const match = position.trim().toUpperCase().match(/^([A-O])(\d{1,2})$/);
  if (!match) return null;
  const col = match[1].charCodeAt(0) - 65;
  const row = parseInt(match[2], 10) - 1;
  if (row < 0 || row >= BOARD_SIZE || col < 0 || col >= BOARD_SIZE) return null;
  return { row, col };
}

/** Format {row, col} to position string like "H8" */
export function formatPosition(row: number, col: number): string {
  return String.fromCharCode(65 + col) + (row + 1);
}
