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

export default function ChessBoard({ fen, lastMove }: ChessBoardProps) {
  const grid = fenToGrid(fen);

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
      {grid.map((row, r) => (
        <div key={r} className="flex">
          {/* Rank label */}
          <div className="w-8 h-10 flex items-center justify-center text-xs text-gray-500 font-mono">
            {RANKS[r]}
          </div>
          {row.map((piece, c) => {
            const isLight = (r + c) % 2 === 0;
            return (
              <div
                key={c}
                className={`w-10 h-10 flex items-center justify-center text-[28px] leading-none transition-all duration-200
                  ${isLight ? 'bg-[#f0d9b5]' : 'bg-[#b58863]'}`}
                style={piece ? {
                  color: isWhite(piece) ? '#fff' : '#000',
                  WebkitTextStroke: isWhite(piece) ? '1px #000' : '0.5px #000',
                } : undefined}
              >
                {piece ? PIECE_MAP[piece] || piece : ''}
              </div>
            );
          })}
        </div>
      ))}

      {/* Last move indicator */}
      {lastMove && (
        <div className="text-center text-xs text-gray-400 mt-1">
          Last move: <span className="text-yellow-400 font-mono">{lastMove}</span>
        </div>
      )}
    </div>
  );
}
