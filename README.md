# AI Battle Arena

An open-source platform where 2 AI models battle each other through board games. AI uses tool calling to observe the board, analyze positions, and make moves. The game engine acts as referee — verifying every move and enforcing rules.

## Quick Start

```bash
# Clone and run
git clone <repo-url>
cd ai-battle

# Option 1: Docker (recommended)
echo "OPENROUTER_API_KEY=your_key_here" > .env
docker compose up

# Option 2: Local development
cd backend && npm install && npm run dev &
cd frontend && npm install && npm run dev &
```

- Frontend: http://localhost:8329
- Backend: http://localhost:5000

## How It Works

1. Enter your [OpenRouter](https://openrouter.ai) API key
2. Pick 2 AI models (e.g., GPT-4 vs Claude)
3. Choose a game (Caro/Gomoku)
4. Watch them battle in real-time

Each turn, the engine calls the AI via OpenRouter with tool definitions. The AI decides which tools to call:
- `get_board_state()` — see the current board
- `get_valid_moves()` — list available moves
- `make_move({position})` — place a stone
- `get_game_info()` — read game rules

Invalid moves get 3 retries, then forfeit.

## Games

| Game | Board | Win Condition | Status |
|------|-------|---------------|--------|
| Caro (Gomoku) | 15x15 | 5 in a row | Available |
| Chess | 8x8 | Checkmate | Planned |
| Battleship | 10x10 x2 | Sink all ships | Planned |

## Features

- **Real-time UI** — WebSocket updates every move
- **AI Thinking Log** — see what the AI reasons before each move
- **Replay System** — rewatch games with play/pause/seek
- **Match History** — browse past games with filters
- **Game Controls** — pause, resume, reset, speed control, step-by-step mode
- **Stats** — token usage, thinking time, cost estimate per move

## Tech Stack

- **Backend:** Express.js + Socket.io + TypeScript
- **Frontend:** Vite + React + Tailwind CSS
- **AI Gateway:** OpenRouter (OpenAI-compatible API)
- **Storage:** JSON files on disk (Docker volume)

## Project Structure

```
ai-battle/
├── backend/                 # Express + Socket.io server
│   ├── src/
│   │   ├── engine/          # Game engine core (interface, session, manager)
│   │   ├── games/caro/      # Caro (Gomoku) implementation
│   │   ├── services/        # OpenRouter client, AI player, game loop
│   │   ├── tools/           # Tool definitions and executor
│   │   ├── routes/          # REST API endpoints
│   │   ├── storage/         # JSON file storage
│   │   └── types/           # TypeScript types
│   └── Dockerfile
├── frontend/                # Vite + React SPA
│   ├── src/
│   │   ├── components/      # Setup, Game, History, Replay pages
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
| POST | /api/validate-key | Validate OpenRouter API key |
| GET | /api/models | List available AI models |
| POST | /api/games | Create new game session |
| GET | /api/games/:id | Get game state |
| GET | /api/replays | List saved game records |
| GET | /api/replays/:id | Get full replay data |
| GET | /api/replays/:id/export | Download replay as JSON |

## License

MIT
