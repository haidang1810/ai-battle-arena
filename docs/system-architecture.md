# System Architecture - AI Battle Arena

## Tech Stack

**Backend:** Express.js + Socket.io + TypeScript
**Frontend:** Vite + React + Tailwind CSS
**Storage:** JSON files on disk (Docker volume)
**AI Integration:** OpenAI SDK pointed at OpenRouter
**Key Libraries:** chess.js, zod, pino

## Architecture Pattern

**Engine-as-Referee:** Game engine validates all moves, enforces rules, determines winners. AI models submit moves via tool calling, not direct game control.

**WebSocket Realtime:** Socket.io broadcasts game state changes to frontend immediately for live battle viewing.

**AI via OpenRouter:** OpenAI SDK configured with custom API endpoint to access multiple AI models through OpenRouter.

## Project Structure

```
backend/
├── src/
│   ├── engine/           # Game engine core (validation, rules)
│   ├── games/            # Game implementations (Caro, Chess, Battleship)
│   ├── services/         # Business logic (game service, AI service)
│   ├── tools/            # AI tool definitions for move submission
│   ├── routes/           # Express API endpoints
│   ├── storage/          # Disk persistence (games, replays)
│   ├── types/            # TypeScript type definitions
│   ├── index.ts          # Express app setup
│   └── server.ts         # Server entry point
└── package.json

frontend/
├── src/
│   ├── components/       # React components (Game board, Controls, etc)
│   ├── hooks/            # Custom React hooks
│   ├── services/         # Frontend services (Socket.io client)
│   ├── types/            # TypeScript types
│   ├── pages/            # Page components (Setup, Battle, Replay)
│   └── App.tsx           # Main app component
└── package.json
```

## API Endpoints

- `POST /api/games` - Create new game
- `GET /api/games/:id` - Get game state
- `GET /api/replays` - List all recorded replays
- `GET /api/replays/:id` - Get replay data
- `POST /api/move` - Submit move (for tool calling)

## WebSocket Events

**Client → Server:**
- `join_game` - Client joins game room
- `game_ready` - Frontend ready to start battle

**Server → Client:**
- `game_created` - Game initialized with board state
- `game_state` - Board updated after each move
- `game_ended` - Game finished with result
- `error` - Error occurred

## Data Flow

1. **Setup Phase:** User enters OpenRouter API key, selects two AI models
2. **Game Creation:** Server creates game, initializes board, starts Socket.io room
3. **Game Loop:**
   - Server sends game state to both AI models via OpenRouter
   - AI models respond with moves using tool calling
   - Engine validates moves and updates board
   - Server broadcasts new state to frontend via WebSocket
   - Loop until game ends (win/draw/invalid move)
4. **Storage & Replay:** Game record saved to disk, can replay via frontend

## Key Design Decisions

- **Tool Calling:** AI models use structured tool definitions to submit moves, not free-text parsing
- **Stateless AI:** Each AI turn starts fresh (context window includes game history)
- **Socket.io over HTTP:** Real-time push for smooth spectator experience
- **JSON Storage:** Simple persistence without database complexity
- **TypeScript Strict Mode:** Type safety across full stack
