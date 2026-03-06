import { useRef, useEffect, useState } from 'react';

interface ChessBoardProps {
  fen: string;
  lastMove?: string;
}

const VS = '\uFE0E';
const PIECE_MAP: Record<string, string> = {
  K: `\u265A${VS}`, Q: `\u265B${VS}`, R: `\u265C${VS}`, B: `\u265D${VS}`, N: `\u265E${VS}`, P: `\u265F${VS}`,
  k: `\u265A${VS}`, q: `\u265B${VS}`, r: `\u265C${VS}`, b: `\u265D${VS}`, n: `\u265E${VS}`, p: `\u265F${VS}`,
};

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'];

function fenToGrid(fen: string): string[][] {
  const rows = fen.split(' ')[0].split('/');
  return rows.map((row) => {
    const cells: string[] = [];
    for (const ch of row) {
      if (ch >= '1' && ch <= '8') {
        cells.push(...Array(parseInt(ch)).fill(''));
      } else {
        cells.push(ch);
      }
    }
    return cells;
  });
}

function isWhite(piece: string): boolean {
  return piece === piece.toUpperCase();
}

/** Diff two grids to find from/to squares for highlight */
function findMoveSquares(prev: string[][], curr: string[][]): { fromR: number; fromC: number; toR: number; toC: number } | null {
  const emptied: Array<{ r: number; c: number; piece: string }> = [];
  const filled: Array<{ r: number; c: number; piece: string }> = [];

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = prev[r][c];
      const n = curr[r][c];
      if (p && !n) emptied.push({ r, c, piece: p });
      else if (p !== n && n) filled.push({ r, c, piece: n });
    }
  }

  if (emptied.length === 0 || filled.length === 0) return null;

  // Prefer king for castling
  for (const priority of ['k', 'K', null]) {
    for (const f of filled) {
      const match = emptied.find((e) =>
        e.piece === f.piece && (priority === null || e.piece === priority)
      );
      if (match) {
        return { fromR: match.r, fromC: match.c, toR: f.r, toC: f.c };
      }
    }
  }

  return { fromR: emptied[0].r, fromC: emptied[0].c, toR: filled[0].r, toC: filled[0].c };
}

// Highlight colors (yellow tint like Lichess)
const HIGHLIGHT_LIGHT = '#cdd26a'; // light square highlight
const HIGHLIGHT_DARK = '#aaa23a';  // dark square highlight

export default function ChessBoard({ fen, lastMove }: ChessBoardProps) {
  const grid = fenToGrid(fen);
  const prevGridRef = useRef<string[][] | null>(null);
  const [highlight, setHighlight] = useState<{ fromR: number; fromC: number; toR: number; toC: number } | null>(null);

  useEffect(() => {
    const prevGrid = prevGridRef.current;
    prevGridRef.current = grid;

    if (!prevGrid) return;

    const move = findMoveSquares(prevGrid, grid);
    if (move) setHighlight(move);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fen]);

  const isHighlighted = (r: number, c: number) =>
    highlight && ((highlight.fromR === r && highlight.fromC === c) || (highlight.toR === r && highlight.toC === c));

  return (
    <div className="inline-block">
      <div className="flex ml-8">
        {FILES.map((f) => (
          <div key={f} className="w-10 h-6 flex items-center justify-center text-xs text-gray-500 font-mono">
            {f}
          </div>
        ))}
      </div>

      {grid.map((row, r) => (
        <div key={r} className="flex">
          <div className="w-8 h-10 flex items-center justify-center text-xs text-gray-500 font-mono">
            {RANKS[r]}
          </div>
          {row.map((piece, c) => {
            const isLight = (r + c) % 2 === 0;
            const highlighted = isHighlighted(r, c);
            const bg = highlighted
              ? (isLight ? HIGHLIGHT_LIGHT : HIGHLIGHT_DARK)
              : (isLight ? '#f0d9b5' : '#b58863');

            return (
              <div
                key={c}
                className="w-10 h-10 flex items-center justify-center text-[28px] leading-none"
                style={{
                  backgroundColor: bg,
                  ...(piece ? {
                    color: isWhite(piece) ? '#fff' : '#000',
                    WebkitTextStroke: isWhite(piece) ? '1px #000' : '0.5px #000',
                  } : {}),
                }}
              >
                {piece ? (PIECE_MAP[piece] || piece) : ''}
              </div>
            );
          })}
        </div>
      ))}

      {lastMove && (
        <div className="text-center text-xs text-gray-400 mt-1">
          Last move: <span className="text-yellow-400 font-mono">{lastMove}</span>
        </div>
      )}
    </div>
  );
}
