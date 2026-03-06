import type { PlayerIndex } from '../../types/game-types.js';

const BOARD_SIZE = 10;

/** Ship definitions: name and size */
export const SHIPS = [
  { name: 'carrier', size: 5 },
  { name: 'battleship', size: 4 },
  { name: 'cruiser', size: 3 },
  { name: 'submarine', size: 3 },
  { name: 'destroyer', size: 2 },
] as const;

export type ShipName = (typeof SHIPS)[number]['name'];
export type Orientation = 'H' | 'V'; // horizontal or vertical

export interface PlacedShip {
  name: ShipName;
  size: number;
  positions: Array<{ row: number; col: number }>;
  hits: Set<string>; // "row,col" keys
}

/** Cell types for own board view */
export const OwnCell = { WATER: 0, SHIP: 1, HIT: 2, MISS: 3 } as const;
/** Cell types for tracking board (shots at opponent) */
export const TrackCell = { UNKNOWN: 0, HIT: 1, MISS: 2, SUNK: 3 } as const;

/**
 * One player's Battleship board.
 * Tracks placed ships, received shots, and fired shots.
 */
export class BattleshipBoard {
  /** Own grid: 0=water, shipIndex+1=ship */
  private grid: number[][] = [];
  /** Shots received at this board */
  private shotsReceived = new Set<string>();
  /** Ships placed on this board */
  ships: PlacedShip[] = [];
  /** Tracking grid: shots fired at opponent */
  trackingGrid: number[][] = [];

  constructor() {
    this.reset();
  }

  reset() {
    this.grid = Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(0));
    this.trackingGrid = Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(TrackCell.UNKNOWN));
    this.shotsReceived = new Set();
    this.ships = [];
  }

  /** Place a ship on the board. Returns error string or null on success. */
  placeShip(shipName: ShipName, row: number, col: number, orientation: Orientation): string | null {
    const shipDef = SHIPS.find((s) => s.name === shipName);
    if (!shipDef) return `Unknown ship: ${shipName}`;
    if (this.ships.some((s) => s.name === shipName)) return `Ship ${shipName} already placed`;

    const positions: Array<{ row: number; col: number }> = [];
    for (let i = 0; i < shipDef.size; i++) {
      const r = orientation === 'V' ? row + i : row;
      const c = orientation === 'H' ? col + i : col;
      if (r < 0 || r >= BOARD_SIZE || c < 0 || c >= BOARD_SIZE) {
        return `Ship ${shipName} goes out of bounds`;
      }
      if (this.grid[r][c] !== 0) {
        return `Ship ${shipName} overlaps another ship at ${formatPos(r, c)}`;
      }
      positions.push({ row: r, col: c });
    }

    // Place on grid
    const shipIdx = this.ships.length + 1;
    for (const pos of positions) {
      this.grid[pos.row][pos.col] = shipIdx;
    }
    this.ships.push({ name: shipName, size: shipDef.size, positions, hits: new Set() });
    return null;
  }

  /** All ships placed? */
  allShipsPlaced(): boolean {
    return this.ships.length === SHIPS.length;
  }

  /** Which ships still need placement */
  unplacedShips(): Array<{ name: ShipName; size: number }> {
    const placed = new Set(this.ships.map((s) => s.name));
    return SHIPS.filter((s) => !placed.has(s.name)).map((s) => ({ name: s.name, size: s.size }));
  }

  /** Receive a shot at this board. Returns { hit, sunk, shipName } */
  receiveShot(row: number, col: number): { hit: boolean; sunk: boolean; shipName?: string } {
    const key = `${row},${col}`;
    this.shotsReceived.add(key);

    const cellValue = this.grid[row][col];
    if (cellValue === 0) {
      return { hit: false, sunk: false };
    }

    // Find which ship was hit
    const ship = this.ships[cellValue - 1];
    ship.hits.add(key);
    const sunk = ship.hits.size >= ship.size;
    return { hit: true, sunk, shipName: ship.name };
  }

  /** All ships sunk? */
  allShipsSunk(): boolean {
    return this.ships.length === SHIPS.length && this.ships.every((s) => s.hits.size >= s.size);
  }

  /** Record a shot fired at opponent on tracking grid */
  recordShot(row: number, col: number, hit: boolean, sunk: boolean) {
    this.trackingGrid[row][col] = sunk ? TrackCell.SUNK : hit ? TrackCell.HIT : TrackCell.MISS;
  }

  /** Has this position already been shot at (receiving end)? */
  wasShot(row: number, col: number): boolean {
    return this.shotsReceived.has(`${row},${col}`);
  }

  /** Get own board view (ships visible + shot markers) */
  getOwnView(): number[][] {
    return this.grid.map((row, r) =>
      row.map((cell, c) => {
        const key = `${r},${c}`;
        if (this.shotsReceived.has(key)) {
          return cell > 0 ? OwnCell.HIT : OwnCell.MISS;
        }
        return cell > 0 ? OwnCell.SHIP : OwnCell.WATER;
      }),
    );
  }

  /** Get tracking view (shots fired at opponent) */
  getTrackingView(): number[][] {
    return this.trackingGrid.map((row) => [...row]);
  }

  /** ASCII representation for AI: own board */
  ownAscii(): string {
    const header = '  ' + Array.from({ length: BOARD_SIZE }, (_, i) => String.fromCharCode(65 + i)).join(' ');
    const ownView = this.getOwnView();
    const rows = ownView.map((row, r) => {
      const num = String(r + 1).padStart(2, ' ');
      const cells = row.map((c) => {
        if (c === OwnCell.HIT) return 'X';
        if (c === OwnCell.MISS) return 'O';
        if (c === OwnCell.SHIP) return 'S';
        return '.';
      }).join(' ');
      return `${num} ${cells}`;
    });
    return [header, ...rows].join('\n');
  }

  /** ASCII representation for AI: tracking board */
  trackingAscii(): string {
    const header = '  ' + Array.from({ length: BOARD_SIZE }, (_, i) => String.fromCharCode(65 + i)).join(' ');
    const rows = this.trackingGrid.map((row, r) => {
      const num = String(r + 1).padStart(2, ' ');
      const cells = row.map((c) => {
        if (c === TrackCell.HIT) return 'X';
        if (c === TrackCell.MISS) return 'O';
        if (c === TrackCell.SUNK) return '#';
        return '.';
      }).join(' ');
      return `${num} ${cells}`;
    });
    return [header, ...rows].join('\n');
  }

  /** Spectator view: shows ships + shot results (for frontend) */
  getSpectatorView(): number[][] {
    return this.getOwnView();
  }
}

/** Parse position string like "A1" to {row, col} */
export function parsePos(position: string): { row: number; col: number } | null {
  const match = position.trim().toUpperCase().match(/^([A-J])(\d{1,2})$/);
  if (!match) return null;
  const col = match[1].charCodeAt(0) - 65;
  const row = parseInt(match[2], 10) - 1;
  if (row < 0 || row >= BOARD_SIZE || col < 0 || col >= BOARD_SIZE) return null;
  return { row, col };
}

/** Format {row, col} to position string like "A1" */
export function formatPos(row: number, col: number): string {
  return String.fromCharCode(65 + col) + (row + 1);
}
