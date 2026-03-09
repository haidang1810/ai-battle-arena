# Tester Agent Memory — ai-battle-arena/frontend

## Project: AI Battle Arena

### Stack
- Backend: Node.js + TypeScript (tsx runner), `src/` under `backend/`
- Frontend: React 19 + Vite 6 + Tailwind 4 + TypeScript 5.7
- No formal test suite (Jest/Vitest) — validation via `tsc --noEmit` + manual tsx scripts

### Environment Constraint (CRITICAL)
- System Node.js: **16.20.2** — incompatible with Vite 6 (requires ≥ 20.19 or ≥ 22.12)
- `npx vite build` always fails with `crypto.getRandomValues is not a function` on Node 16
- `tsc --noEmit` works fine on Node 16 — use this for frontend code validation
- Backend `npx tsx <script>` works fine on Node 16

### Test Commands
- Backend compile: `cd backend && npx tsc --noEmit`
- Frontend compile: `cd frontend && npx tsc --noEmit`
- Backend script run: `cd backend && npx tsx <script.ts>`
- Frontend build: BLOCKED on Node 16 — skip or note as env issue

### Games Implemented
- Caro, Chess, Battleship, Jungle Chess (Co Thu)
- Jungle engine: `backend/src/games/jungle/jungle-engine.ts` + `jungle-board.ts` + `jungle-terrain-constants.ts`
- Jungle frontend: `frontend/src/components/game/jungle-board.tsx` + `frontend/src/hooks/jungle-replay-engine.ts`

### Jungle Chess Engine Notes
- Piece encoding: Red = positive int, Blue = negative int, abs = rank (1-8)
- Move format: `"a1-a2"` (col a-g + row 1-9)
- Initial valid moves = 24 (confirmed correct)
- Special rules: Rat captures Elephant, Lion/Tiger jump rivers, traps reduce rank to 0
- Win: enter opponent den OR capture all opponent pieces

### Report Location
- `E:/dev/be/ai-battle-arena/plans/reports/`
