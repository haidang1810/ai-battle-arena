import { useRef, useEffect, useState } from 'react';

interface ChessBoardProps {
  fen: string;
  lastMove?: string;
}

// Filled Unicode chess pieces + variation selector \uFE0E to force text rendering (not emoji)
const VS = '\uFE0E';
const PIECE_MAP: Record<string, string> = {
  K: `\u265A${VS}`, Q: `\u265B${VS}`, R: `\u265C${VS}`, B: `\u265D${VS}`, N: `\u265E${VS}`, P: `\u265F${VS}`,
  k: `\u265A${VS}`, q: `\u265B${VS}`, r: `\u265C${VS}`, b: `\u265D${VS}`, n: `\u265E${VS}`, p: `\u265F${VS}`,
};

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'];
const CELL_SIZE = 40; // w-10 = 40px

/** Parse FEN string to 8x8 grid of piece characters (or empty string) */
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

/** Check if a piece character is white */
function isWhite(piece: string): boolean {
  return piece === piece.toUpperCase();
}

/** Diff two grids to find the main moved piece's from/to squares (king for castling) */
function findMove(prev: string[][], curr: string[][]): { fromR: number; fromC: number; toR: number; toC: number; piece: string } | null {
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

  // Match: find a filled square whose piece matches an emptied square's piece (same type)
  // Prefer king for castling, otherwise first match
  for (const priority of ['k', 'K', null]) {
    for (const f of filled) {
      const match = emptied.find((e) =>
        e.piece === f.piece && (priority === null || e.piece === priority)
      );
      if (match) {
        return { fromR: match.r, fromC: match.c, toR: f.r, toC: f.c, piece: f.piece };
      }
    }
  }

  // Fallback: promotion (pawn disappears, new piece appears on same file)
  return { fromR: emptied[0].r, fromC: emptied[0].c, toR: filled[0].r, toC: filled[0].c, piece: filled[0].piece };
}

interface AnimState {
  piece: string;
  toR: number;
  toC: number;
  offsetX: number; // starting offset (from - to) in px
  offsetY: number;
}

export default function ChessBoard({ fen, lastMove }: ChessBoardProps) {
  const grid = fenToGrid(fen);
  const prevGridRef = useRef<string[][] | null>(null);
  const [anim, setAnim] = useState<AnimState | null>(null);

  useEffect(() => {
    const prevGrid = prevGridRef.current;
    prevGridRef.current = grid;

    if (!prevGrid) return;

    const move = findMove(prevGrid, grid);
    if (!move) return;

    // Start animation: piece appears at destination but offset back to origin
    const offsetX = (move.fromC - move.toC) * CELL_SIZE;
    const offsetY = (move.fromR - move.toR) * CELL_SIZE;

    setAnim({ piece: move.piece, toR: move.toR, toC: move.toC, offsetX, offsetY });

    // Double rAF ensures browser paints the initial offset before transitioning
    const frameId = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setAnim((prev) => prev ? { ...prev, offsetX: 0, offsetY: 0 } : null);
      });
    });

    // Clear animation after transition completes
    const timer = setTimeout(() => setAnim(null), 650);

    return () => {
      cancelAnimationFrame(frameId);
      clearTimeout(timer);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fen]);

  return (
    <div className="inline-block">
      {/* Column labels */}
      <div className="flex ml-8">
        {FILES.map((f) => (
          <div key={f} className="w-10 h-6 flex items-center justify-center text-xs text-gray-500 font-mono">
            {f}
          </div>
        ))}
      </div>

      {/* Board grid */}
      <div className="relative">
        {grid.map((row, r) => (
          <div key={r} className="flex">
            {/* Rank label */}
            <div className="w-8 h-10 flex items-center justify-center text-xs text-gray-500 font-mono">
              {RANKS[r]}
            </div>
            {row.map((piece, c) => {
              const isLight = (r + c) % 2 === 0;
              const isAnimating = anim && anim.toR === r && anim.toC === c;
              // Hide piece in cell during animation (it's shown as floating overlay)
              const showPiece = piece && !isAnimating;

              return (
                <div
                  key={c}
                  className={`w-10 h-10 flex items-center justify-center text-[28px] leading-none
                    ${isLight ? 'bg-[#f0d9b5]' : 'bg-[#b58863]'}`}
                  style={showPiece ? {
                    color: isWhite(piece) ? '#fff' : '#000',
                    WebkitTextStroke: isWhite(piece) ? '1px #000' : '0.5px #000',
                  } : undefined}
                >
                  {showPiece ? (PIECE_MAP[piece] || piece) : ''}
                </div>
              );
            })}
          </div>
        ))}

        {/* Animated piece overlay */}
        {anim && (
          <div
            className="absolute text-[28px] leading-none pointer-events-none z-10 w-10 h-10 flex items-center justify-center"
            style={{
              top: anim.toR * CELL_SIZE,
              left: anim.toC * CELL_SIZE,
              transform: `translate(${anim.offsetX}px, ${anim.offsetY}px)`,
              transition: anim.offsetX === 0 && anim.offsetY === 0 ? 'transform 600ms ease-in-out' : 'none',
              color: isWhite(anim.piece) ? '#fff' : '#000',
              WebkitTextStroke: isWhite(anim.piece) ? '1px #000' : '0.5px #000',
            }}
          >
            {PIECE_MAP[anim.piece] || anim.piece}
          </div>
        )}
      </div>

      {/* Last move indicator */}
      {lastMove && (
        <div className="text-center text-xs text-gray-400 mt-1">
          Last move: <span className="text-yellow-400 font-mono">{lastMove}</span>
        </div>
      )}
    </div>
  );
}
