# Code Standards - AI Battle Arena

## TypeScript Configuration

- **Strict Mode:** `strict: true` enforced in tsconfig.json
- **Target:** ES2020 or later
- **Module:** ESM (import/export)
- **Null Checks:** Strict null checking enabled

## Naming Conventions

**File Names:** kebab-case with descriptive purpose
- ✅ `game-engine-caro.ts`, `ai-service.ts`, `board-validator.ts`
- ❌ `engine.ts`, `service.ts`

**Variables & Functions:** camelCase
- ✅ `makeMove()`, `isValidMove`, `playerOne`
- ❌ `MakeMove()`, `is_valid_move`

**Classes & Types:** PascalCase
- ✅ `class GameEngine`, `interface MoveResult`, `type GameState`
- ❌ `class gameEngine`, `interface move_result`

**Constants:** UPPER_SNAKE_CASE
- ✅ `const MAX_BOARD_SIZE = 19`
- ❌ `const maxBoardSize = 19`

## Module Organization

**Backend:**
- `engine/` - Game logic, move validation, rule enforcement
- `games/` - Game implementations (CaroGame, ChessGame, BattleshipGame)
- `services/` - Business logic (GameService, AIService, ReplayService)
- `tools/` - AI tool definitions for move submission
- `routes/` - Express route handlers
- `storage/` - Disk persistence layer
- `types/` - Shared TypeScript interfaces and types

**Frontend:**
- `components/` - React functional components (Board, GameControls, Setup)
- `hooks/` - Custom React hooks (useGame, useSocket, useGameState)
- `services/` - Frontend services (Socket.io client wrapper)
- `types/` - Frontend type definitions
- `pages/` - Page-level components (GameSetup, BattleArena, ReplayView)

## Code Style

**File Size:** Keep under 200 lines per file
- Split large components into smaller focused modules
- Extract utility functions into separate files
- One class/interface per file when possible

**React Components:**
- Use functional components with hooks
- Custom hooks for reusable logic
- Props interface for type safety
- Descriptive component names reflecting purpose

**Error Handling:**
- Use try-catch blocks
- Log errors with pino logger
- Return error objects or throw typed exceptions
- Validate input before processing

**Comments:**
- Add comments for complex logic and non-obvious decisions
- Keep comments up-to-date with code changes
- Use JSDoc for public functions and types
- Avoid over-commenting obvious code

## Module Dependencies

- No circular dependencies
- Backend exports types to frontend via shared type files
- Services import from engine/games, not vice versa
- Routes import from services only
- Frontend imports from services and components only

## Testing Standards

- Unit test all engine logic
- Test invalid moves are rejected
- Test game state transitions
- Mock AI responses for deterministic tests
- Coverage target: 80%+ for engine

## Import Order

1. Built-in Node modules
2. Third-party packages
3. Relative imports from parent dirs
4. Relative imports from current dir

```typescript
import { EventEmitter } from 'events';
import express from 'express';
import { GameEngine } from '../../engine/game-engine';
import { validateMove } from './move-validator';
```
