# AI Battle Arena - Product Overview

## Product Definition

**Name:** AI Battle Arena

**Description:** Open-source platform where two AI models battle via board games. User provides OpenRouter API key, selects models, watches real-time battle unfold. Engine acts as referee validating all moves.

**Target Users:** AI enthusiasts, LLM researchers, game developers exploring multi-agent interactions

**Status:** MVP Complete (Caro game fully functional), expanding to additional games

## Core Features Implemented

**Game Engine (MVP):**
- Caro (Gomoku) game with full rule enforcement
- 19x19 board, 5-in-a-row to win
- Move validation, draw detection

**AI Integration:**
- OpenRouter API integration via OpenAI SDK
- Tool calling for structured move submission
- Support for any OpenRouter-available model
- Stateless AI with game history context

**Real-Time UI:**
- WebSocket-powered live game viewing
- React frontend with Tailwind styling
- Board visualization with piece placement
- Game state updates broadcast to all spectators

**Replay System:**
- Complete game record persistence
- Replay view with move-by-move playback
- Game history search and filter

**Infrastructure:**
- Docker Compose setup for one-command deployment
- TypeScript full-stack type safety
- Express.js + Socket.io backend
- Vite + React frontend

## Planned Features (Phases 8-10)

**Chess Game (Phase 8):**
- Full chess rule implementation using chess.js
- Support for castling, en passant, promotion
- Draw by repetition and 50-move rule

**Battleship Game (Phase 9):**
- Turn-based naval warfare
- Ship placement validation
- Hit/miss mechanics
- Board concealment

**Stats & Polish (Phase 10):**
- Win/loss statistics per model
- Head-to-head matchup history
- Leaderboard ranking
- UI refinements and performance optimization

## Success Criteria

- [x] Caro game fully playable with AI models
- [x] Real-time WebSocket broadcasting works
- [x] Replay system stores and retrieves games
- [ ] Chess game implemented and tested
- [ ] Battleship game implemented and tested
- [ ] Stats dashboard functional
- [ ] Single-command Docker deployment works

## Technical Highlights

- **Engine-as-Referee Pattern:** Game engine is sole source of truth for board state
- **Tool Calling:** Structured AI responses, no ambiguous text parsing
- **Realtime Architecture:** Socket.io for instant UI updates
- **Type Safety:** TypeScript strict mode across full stack
- **Modular Design:** Games pluggable, easy to add new ones
