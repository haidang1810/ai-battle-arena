# AI Battle Arena

An open-source platform where 2 AI models battle each other through board games. AI uses tool calling to observe the board, analyze positions, and make moves. The game engine acts as referee -- verifying every move and enforcing rules.

## Quick Start (Docker)

```bash
git clone <repo-url>
cd ai-battle
docker compose up --build -d
```

- Frontend: http://localhost:8329
- Backend: http://localhost:5000

For development with hot reload:

```bash
docker compose -f docker-compose.dev.yml up -d
```

## Manual Setup (without Docker)

### Prerequisites

- Node.js 20+
- npm

### Backend

```bash
cd backend
npm install
npm run dev
```

Backend runs on http://localhost:5000

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on http://localhost:8329

> **Note:** In local development the frontend dev server proxies `/api` and `/socket.io` requests to the backend. Check `frontend/vite.config.ts` for proxy settings. If you run both services separately, make sure the proxy target matches your backend port.

## How It Works

1. Open the frontend in your browser
2. Select a game (Caro, Chess, or Battleship)
3. Pick an AI provider and enter your API key for each player
4. Choose AI models for both players
5. Click **Start Battle** and watch them fight in real-time

Each turn, the engine calls the AI with tool definitions. The AI decides which tools to call:
- `get_board_state()` -- see the current board
- `get_valid_moves()` -- list available moves
- `make_move({position})` -- make a move
- `get_game_info()` -- read game rules and current phase

Invalid moves get 3 retries, then forfeit.

## Games

| Game | Board | Win Condition | Status |
|------|-------|---------------|--------|
| Caro (Gomoku) | 15x15 | 5 in a row | Available |
| Chess | 8x8 | Checkmate | Available |
| Battleship | 10x10 x2 | Sink all ships | Available |

### Caro (Gomoku)
- 15x15 board, first to get 5 consecutive stones wins
- Move format: `H8` (column letter + row number)

### Chess
- Standard FIDE rules using chess.js
- Move format: SAN notation (`e4`, `Nf3`, `O-O`, `Bxe5`)

### Battleship
- 2-phase game: ship placement then battle
- Each player places 5 ships (carrier=5, battleship=4, cruiser=3, submarine=3, destroyer=2)
- Placement format: `carrier:A1:H` (ship:position:orientation)
- Battle format: `E5` (target position)
- Information hiding: AI never sees opponent's ship positions

## Features

- **Real-time UI** -- WebSocket updates every move
- **AI Thinking Log** -- see what the AI reasons before each move
- **Replay System** -- rewatch games with play/pause/seek
- **Match History** -- browse past games with filters
- **Model Stats** -- win/loss/draw, avg thinking time, token usage per model
- **Game Controls** -- pause, resume, reset, speed control, step-by-step mode
- **Multi-Provider** -- OpenRouter, OpenAI, AliCloud, or any OpenAI-compatible API

## Tech Stack

- **Backend:** Express.js + Socket.io + TypeScript
- **Frontend:** Vite + React + Tailwind CSS
- **AI Gateway:** OpenRouter (OpenAI-compatible API)
- **Chess:** chess.js
- **Storage:** JSON files on disk (Docker volume)

## Project Structure

```
ai-battle/
├── backend/                 # Express + Socket.io server
│   ├── src/
│   │   ├── engine/          # Game engine core (interface, session, manager)
│   │   ├── games/
│   │   │   ├── caro/        # Caro (Gomoku) implementation
│   │   │   ├── chess/       # Chess implementation (chess.js)
│   │   │   └── battleship/  # Battleship (2-phase, hidden info)
│   │   ├── services/        # AI player, game loop, providers, stats
│   │   ├── tools/           # Tool definitions and executor
│   │   ├── routes/          # REST API endpoints
│   │   ├── storage/         # JSON file storage
│   │   └── types/           # TypeScript types
│   └── Dockerfile
├── frontend/                # Vite + React SPA
│   ├── src/
│   │   ├── components/      # Setup, Game, History, Replay, Stats pages
│   │   ├── hooks/           # Socket.io, game state, replay hooks
│   │   └── types/           # Shared types
│   └── Dockerfile
├── docker-compose.yml       # Production
└── docker-compose.dev.yml   # Development (hot reload)
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/health | Health check |
| POST | /api/validate-key | Validate API key for a provider |
| GET | /api/models | List available AI models |
| POST | /api/games | Create new game session |
| GET | /api/games/:id | Get game state |
| GET | /api/replays | List saved game records |
| GET | /api/replays/:id | Get full replay data |
| GET | /api/replays/:id/export | Download replay as JSON |
| GET | /api/stats | Model performance stats |

## License

MIT
