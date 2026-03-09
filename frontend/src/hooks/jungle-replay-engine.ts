/**
 * Lightweight client-side Jungle engine for replay reconstruction.
 * Only needs move execution + board output -- no full validation.
 */
const ROWS = 9;
const COLS = 7;

export class JungleReplayEngine {
  private grid: number[][];

  constructor() {
    this.grid = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
    this.setupInitial();
  }

  private setupInitial(): void {
    // Red (positive)
    this.grid[0][0] = 7; this.grid[0][6] = 6;
    this.grid[1][1] = 4; this.grid[1][5] = 2;
    this.grid[2][0] = 8; this.grid[2][2] = 3;
    this.grid[2][4] = 5; this.grid[2][6] = 1;
    // Blue (negative)
    this.grid[8][0] = -6; this.grid[8][6] = -7;
    this.grid[7][1] = -2; this.grid[7][5] = -4;
    this.grid[6][0] = -1; this.grid[6][2] = -5;
    this.grid[6][4] = -3; this.grid[6][6] = -8;
  }

  makeMove(move: string): void {
    const m = move.match(/^([a-g])([1-9])-([a-g])([1-9])$/);
    if (!m) return;
    const fromCol = m[1].charCodeAt(0) - 97;
    const fromRow = parseInt(m[2]) - 1;
    const toCol = m[3].charCodeAt(0) - 97;
    const toRow = parseInt(m[4]) - 1;
    if (fromRow < 0 || fromRow >= ROWS || toRow < 0 || toRow >= ROWS) return;
    if (fromCol < 0 || fromCol >= COLS || toCol < 0 || toCol >= COLS) return;
    this.grid[toRow][toCol] = this.grid[fromRow][fromCol];
    this.grid[fromRow][fromCol] = 0;
  }

  getBoard(): number[][] {
    return this.grid.map(row => [...row]);
  }
}
