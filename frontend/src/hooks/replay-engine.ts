/**
 * Lightweight client-side Caro engine for replay reconstruction.
 * Only needs place + board output — no validation needed.
 */
export class CaroEngine {
  private grid: number[][];
  private currentPlayer = 1; // 1 = X, 2 = O

  constructor() {
    this.grid = Array.from({ length: 15 }, () => Array(15).fill(0));
  }

  makeMove(position: string): void {
    const match = position.toUpperCase().match(/^([A-O])(\d{1,2})$/);
    if (!match) return;
    const col = match[1].charCodeAt(0) - 65;
    const row = parseInt(match[2], 10) - 1;
    if (row >= 0 && row < 15 && col >= 0 && col < 15) {
      this.grid[row][col] = this.currentPlayer;
      this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
    }
  }

  getBoard(): number[][] {
    return this.grid.map((row) => [...row]);
  }
}
