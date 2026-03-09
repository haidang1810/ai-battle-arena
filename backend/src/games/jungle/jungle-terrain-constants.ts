/**
 * Jungle Chess (Co Thu) terrain constants and piece definitions.
 * Board: 9 rows x 7 cols. Row 0 = board row 1 (Red back), Row 8 = board row 9 (Blue back).
 */

export const ROWS = 9;
export const COLS = 7;

const key = (r: number, c: number) => `${r},${c}`;

/** Piece rank constants */
export const RANK = {
  RAT: 1, CAT: 2, WOLF: 3, DOG: 4,
  LEOPARD: 5, TIGER: 6, LION: 7, ELEPHANT: 8,
} as const;

/** Piece name by rank (for ASCII display) */
export const PIECE_NAMES: Record<number, string> = {
  1: 'R', 2: 'C', 3: 'W', 4: 'D', 5: 'L', 6: 'T', 7: 'N', 8: 'E',
};

/** Water squares: board rows 4-6 (internal rows 3-5), columns b-c and e-f (cols 1-2, 4-5) */
export const WATER = new Set([
  key(3, 1), key(3, 2), key(4, 1), key(4, 2), key(5, 1), key(5, 2),
  key(3, 4), key(3, 5), key(4, 4), key(4, 5), key(5, 4), key(5, 5),
]);

/** Traps per player: index 0 = Red traps (near Red den), index 1 = Blue traps (near Blue den) */
export const TRAPS: readonly [ReadonlySet<string>, ReadonlySet<string>] = [
  new Set([key(0, 2), key(0, 4), key(1, 3)]),
  new Set([key(8, 2), key(8, 4), key(7, 3)]),
];

/** Dens per player: Red den at d1 (0,3), Blue den at d9 (8,3) */
export const DENS: readonly [string, string] = [key(0, 3), key(8, 3)];

/** Initial piece positions: [row, col, pieceValue] */
export const INITIAL_POSITIONS: ReadonlyArray<[number, number, number]> = [
  // Red (Player 0, positive values)
  [0, 0, RANK.LION], [0, 6, RANK.TIGER],
  [1, 1, RANK.DOG], [1, 5, RANK.CAT],
  [2, 0, RANK.ELEPHANT], [2, 2, RANK.WOLF],
  [2, 4, RANK.LEOPARD], [2, 6, RANK.RAT],
  // Blue (Player 1, negative values)
  [8, 0, -RANK.TIGER], [8, 6, -RANK.LION],
  [7, 1, -RANK.CAT], [7, 5, -RANK.DOG],
  [6, 0, -RANK.RAT], [6, 2, -RANK.LEOPARD],
  [6, 4, -RANK.WOLF], [6, 6, -RANK.ELEPHANT],
];

/** Check if a coordinate is within board bounds */
export function inBounds(r: number, c: number): boolean {
  return r >= 0 && r < ROWS && c >= 0 && c < COLS;
}

/** Check if a square is water */
export function isWater(r: number, c: number): boolean {
  return WATER.has(key(r, c));
}

/** Check if a square is a specific player's trap */
export function isTrapOf(player: 0 | 1, r: number, c: number): boolean {
  return TRAPS[player].has(key(r, c));
}

/** Check if a square is a specific player's den */
export function isDenOf(player: 0 | 1, r: number, c: number): boolean {
  return DENS[player] === key(r, c);
}

/** Parse position string "a1" -> {row, col} (0-indexed) */
export function parsePos(pos: string): { row: number; col: number } | null {
  const match = pos.trim().toLowerCase().match(/^([a-g])([1-9])$/);
  if (!match) return null;
  return { col: match[1].charCodeAt(0) - 97, row: parseInt(match[2], 10) - 1 };
}

/** Format row,col to position string "a1" */
export function formatPos(row: number, col: number): string {
  return String.fromCharCode(97 + col) + (row + 1);
}

/** Parse move string "a1-a2" -> from/to coordinates */
export function parseMove(move: string): { fromRow: number; fromCol: number; toRow: number; toCol: number } | null {
  const parts = move.trim().toLowerCase().split('-');
  if (parts.length !== 2) return null;
  const from = parsePos(parts[0]);
  const to = parsePos(parts[1]);
  if (!from || !to) return null;
  return { fromRow: from.row, fromCol: from.col, toRow: to.row, toCol: to.col };
}
