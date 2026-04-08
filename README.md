# ⚔️ Tic-Tac-Toe Multiplayer (Server-Authoritative)

A production-ready, real-time multiplayer Tic-Tac-Toe game engineered with a **server-authoritative architecture**. Built using [Nakama](https://heroiclabs.com/nakama/) for the backend game logic and [React/Vite](https://vitejs.dev/) for the frontend. The system ensures fair play by validating every move on the server and synchronizing state across clients via WebSockets.

### 🔗 Live Demo: [Frontend (Vercel)](https://ttt-multiplayer-v1.vercel.app) | [Backend (Render)](https://ttt-multiplayer-5myz.onrender.com)

---

## ✨ Features

🎮 **Gameplay & Real-Time Sync**
- **Server-Authoritative Logic:** The server is the single source of truth. Prevents cheating and out-of-sync states.
- **WebSocket Synchronization:** Instant sync using WebSockets via Nakama's Match API.
- **Timer Mode:** Optional 30-second turn limit. Opponent wins automatically if time runs out.
- **Reconnect Support:** A 15-second grace period allows players to reconnect without losing progress.

🏢 **Lobby & Matchmaking**
- **Auto-Matchmaking:** Quickly find an opponent based on your preferred game mode (Classic or Timed).
- **Match Discovery:** Browse open matches in real-time and join with a single click.
- **Private Matches:** Create a match and share the Match ID for private play — opponents join via "Browse → Join by Match ID".
- **Join by Match ID:** Paste a match ID to join a specific game room directly.

📊 **Progression & Stats**
- **Global Leaderboard:** Track wins, losses, draws, and streaks. Wins grant points, streaks add multipliers.
- **Player Profiles:** Persistent statistics (wins, losses, draws, streaks) stored in Nakama's storage engine.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, Vite 8, TypeScript, Bootstrap 5, Zustand |
| **Backend** | Nakama (Heroic Labs), TypeScript Runtime |
| **Database** | PostgreSQL (Managed via Nakama / Supabase) |
| **Communication** | WebSockets (Nakama Socket API) |
| **DevOps** | Docker, Docker Compose |
| **Deployment** | Vercel (Frontend), Render (Backend) |

---

## 📁 Project Structure

```text
t3-multiplayer-nakama/
│
├── frontend/                # React/Vite Client
│   ├── src/
│   │   ├── pages/           # Page views (Lobby, Game, Result)
│   │   ├── services/        # Nakama-JS client initialization & RPC calls
│   │   └── store/           # Zustand state management (GameStore)
│   ├── .env                 # Frontend environment variables
│   └── package.json
│
├── nakama/                  # Nakama Backend Logic (TypeScript)
│   ├── src/
│   │   ├── main.ts          # Match Handler, RPCs, Leaderboard & Global Logic
│   │   └── global.d.ts      # Nakama runtime type definitions
│   ├── build/               # Compiled JS modules for Nakama runtime
│   ├── data/                # Nakama configuration & modules storage
│   ├── tsconfig.json        # TS build config (ES5 output for Nakama)
│   └── package.json         # Build scripts (npm run build)
│
├── Dockerfile               # Production Nakama image (for Render)
├── docker-compose.yml       # Local dev environment orchestration
└── README.md
```

---

## 🏗️ System Architecture

```text
      Player A (Client)                 Player B (Client)
             │                                 │
      WebSocket (JSON)                  WebSocket (JSON)
             ▼                                 ▼
    ┌───────────────────────────────────────────────────┐
    │                  Nakama Server                    │
    │  ┌─────────────────────────────────────────────┐  │
    │  │           Match Handler (TS Logic)          │  │
    │  │  - Validates Moves (Position/Turn)          │  │
    │  │  - Manages Turn Timers (30s limit)          │  │
    │  │  - Detects Win/Draw (8 Patterns)            │  │
    │  │  - Handles Disconnects (15s Grace)          │  │
    │  └──────────────────────┬──────────────────────┘  │
    │                         │                         │
    │               PostgreSQL Database                 │
    │        (Leaderboards, Accounts, Storage)          │
    └───────────────────────────────────────────────────┘
```

---

## 🖥️ Frontend Details

### Key Modules
- **GameStore (Zustand)**: Manages the global `GameState`, `matchId`, and user info. It listens to WebSocket updates and triggers UI re-renders.
- **Nakama Service** (`services/nakama.ts`): Wrapper around `@heroiclabs/nakama-js`. Handles authentication, socket connection, RPCs, matchmaking, and match state listening.
- **Lobby Page**: Three-tab interface — Auto Match (matchmaker), Browse (list + join by ID), and Create (private match).
- **Game Page**: Displays board, player symbols, turn indicator, countdown timer, and waiting-for-opponent state.
- **Result Page**: Shows match outcome, player stats, and the global leaderboard.

### Communication Interfacing (`frontend/src/services/nakama.ts`)
- **`initNakama(username)`**: Authenticates the device and connects the WebSocket.
- **`createMatch(mode)`**: Invokes the `create_match` RPC on the server.
- **`findMatch(mode)`**: Adds to the Nakama matchmaker pool for automatic pairing.
- **`listMatches(mode?)`**: Calls `list_matches` RPC to get open game rooms.
- **`joinMatch(matchId)`**: Joins an existing match by ID.
- **`sendMove(matchId, position)`**: Sends a `MOVE` opcode (2) with the selected board position.
- **`getLeaderboard()`**: Calls `get_leaderboard` RPC to fetch global rankings.

---

## ⚙️ Backend Details (Nakama TS)

### Match Handler Logic
The match handler (`nakama/src/main.ts`) implements the following lifecycle:
1. **`matchInit`**: Initializes the 3×3 board and game state with the selected mode.
2. **`matchJoinAttempt`**: Ensures only 2 players can join a match; allows reconnection of existing players.
3. **`matchJoin`**: Assigns symbols (X/O), starts the game when 2 players are present, handles reconnection.
4. **`matchLoop`**: Processes player moves, validates turns, checks for win/draw, manages timers, handles disconnect timeouts.
5. **`matchLeave`**: Records disconnect timestamp and starts the 15s grace period.

### Core RPCs
| RPC Name | Responsibility | Payload Example |
|---|---|---|
| `create_match` | Creates a new authoritative match on the server. | `{"mode": "classic"}` |
| `list_matches` | Filters and returns matches waiting for a 2nd player. | `{"mode": "timed"}` |
| `auto_match` | Finds an open match or creates one if none exist. | `{"mode": "classic"}` |
| `join_match` | Validates a match ID for joining. | `{"matchId": "abc-123"}` |
| `get_leaderboard` | Retrieves top rankings from the `ttt_global` leaderboard. | `{}` |

### Match Opcodes
- `1` (**MATCH_INFO**): Server broadcasts full `GameState` (board, turn, status).
- `2` (**MOVE**): Client sends `{position, moveId}` for validation.
- `3` (**ERROR**): Server sends error messages (e.g., "Invalid move", "Not your turn").

---

## 🗄️ Game State Representation

The server maintains the following state for every match:

```typescript
interface GameState {
    board: string[];                // ["X", "O", "", ...]
    players: Player[];              // [{userId, username, symbol}, ...]
    currentTurn: string;            // userId of the active player
    status: "WAITING" | "PLAYING" | "FINISHED";
    winner: string | null;          // userId, "DRAW", or null
    mode: "classic" | "timed";
    moveDeadline: number | null;    // Unix timestamp for turn expiry
    lastMoveId: string | null;      // Prevents duplicate move processing
    disconnects: Record<string, number>; // Reconnect grace period tracking
}
```

---

## 🔁 Gameplay Logical Flow

1. **Authentication**: Client calls `authenticateDevice` → Nakama returns a session token.
2. **Matchmaking**: 
   - **Auto Match**: Uses Nakama's built-in matchmaker with mode-based properties.
   - **Browse**: Client calls `list_matches` RPC → UI shows open rooms → user clicks "Join".
   - **Create Private**: Client calls `create_match` RPC → joins → shares Match ID with friend.
   - **Join by ID**: Friend pastes Match ID → joins via `socket.joinMatch`.
3. **Waiting**: First player sees "Waiting for opponent..." screen with the shareable Match ID.
4. **Gameplay**:
   - Player clicks a cell → Client sends `OPCODE 2` with `{position, moveId}`.
   - Server receives move → Validates turn and board state → Updates `board` → Broadcasts `OPCODE 1` (New State).
5. **Win Detection**: Server checks 8 win patterns → If found, updates `status` to `FINISHED`, sets `winner`, and broadcasts final state.
6. **Stats**: Server updates the `ttt_global` leaderboard and player's storage stats (wins, losses, draws, streak).

---

## 🚀 Local Setup

### 1. Prerequisites
- **Node.js**: v18+
- **Docker & Docker Compose**: For running Nakama and Postgres locally.
- **curl**: For testing API endpoints via command line.

### 2. Environment Variables

#### Backend (`nakama/.env`)
Create a file at `nakama/.env` with the following:
```env
DATABASE_URL=postgres:localdb@postgres:5432/nakama
SERVER_KEY=defaultkey
HTTP_KEY=defaultkey
ENC_KEY=supersecretkey
REFRESH_KEY=supersecretkey2
```
> For local Docker setup, the `DATABASE_URL` should point to the Docker Compose Postgres service.

#### Frontend (`frontend/.env`)
Create a file at `frontend/.env`:
```env
VITE_NAKAMA_HOST=127.0.0.1
VITE_NAKAMA_PORT=7350
VITE_NAKAMA_SSL=false
VITE_NAKAMA_KEY=defaultkey
```
> For production, update `VITE_NAKAMA_HOST` to your deployed Nakama URL, set `VITE_NAKAMA_PORT=443`, and `VITE_NAKAMA_SSL=true`.

### 3. Build Nakama Modules
Compile the TypeScript logic into the `build/` folder:
```bash
cd nakama
npm install
npm run build
```
This compiles `src/main.ts` → `build/index.js` (ES5, single file, no modules).

### 4. Start Backend (Docker)
From the project root:
```bash
docker-compose up -d
```
- Nakama API: `http://127.0.0.1:7350`
- Nakama Console: `http://127.0.0.1:7351`
- PostgreSQL: `localhost:5432`

### 5. Start Frontend
```bash
cd frontend
npm install
npm run dev
```
The dev server starts at `http://localhost:5173`.

---

## 🧪 Testing the Multiplayer Functionality

### Quick Test (Two Browser Tabs)
1. Open two browser tabs/windows pointing to the frontend URL (e.g., `http://localhost:5173`).
2. In each tab, enter a different nickname (e.g., "Alice" and "Bob").
3. In **Tab 1**: Select "Classic" mode → Click "Find Random Player".
4. In **Tab 2**: Select "Classic" mode → Click "Find Random Player".
5. Both tabs should be matched and enter the game screen.
6. Play alternating moves — observe that the board updates in real-time on both tabs.

### Test Match Browser & Join by ID
1. In **Tab 1**: Go to "Create" tab → Click "Create Private Match".
2. Tab 1 will enter a "Waiting for opponent..." screen with the Match ID displayed.
3. Copy the Match ID.
4. In **Tab 2**: Go to "Browse" tab → Paste the Match ID in the "Join by Match ID" field → Click "Join".
5. Both tabs should now enter the game.

### Test Match Discovery
1. In **Tab 1**: Create a match via the "Create" tab.
2. In **Tab 2**: Go to the "Browse" tab → The open match should appear in the list.
3. Click "Join" on the match card → Both players enter the game.

### Test Timer Mode
1. In both tabs, select "Timed" mode before matchmaking.
2. Once matched, observe the 30-second countdown timer in the game UI.
3. Let the timer run out without making a move — the other player should automatically win.

### Test Disconnect & Reconnect
1. Start a game between two tabs.
2. Close one tab (simulating disconnect).
3. Observe that the remaining player stays in the game.
4. If you reopen and rejoin within 15 seconds, the game continues.
5. After 15 seconds without reconnection, the remaining player wins automatically.

### Test Leaderboard
1. Complete a game (win or lose).
2. On the Result screen, the Global Leaderboard should display:
   - Player rankings sorted by score.
   - Wins / Losses / Draws (W/L/D) for each player.
   - Score computed as `(wins × 10) + (streak × 5)`.

### API Testing (curl)

#### 1. Generate Auth Token
```bash
curl -X POST "http://127.0.0.1:7350/v2/account/authenticate/device?create=true&username=player1" \
     -H "Content-Type: application/json" \
     -H "Authorization: Basic $(echo -n 'defaultkey:' | base64)" \
     -d '{"id": "device_id_123"}'
```
**Output**: `{"token": "eyJhbG...", ...}`

#### 2. List Open Matches
```bash
curl -X POST "http://127.0.0.1:7350/v2/rpc/list_matches?http_key=defaultkey" \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer <TOKEN_FROM_STEP_1>" \
     -d '{"mode": "classic"}'
```

#### 3. Create a Match
```bash
curl -X POST "http://127.0.0.1:7350/v2/rpc/create_match?http_key=defaultkey" \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer <TOKEN_FROM_STEP_1>" \
     -d '{"mode": "timed"}'
```

#### 4. Get Leaderboard
```bash
curl -X POST "http://127.0.0.1:7350/v2/rpc/get_leaderboard?http_key=defaultkey" \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer <TOKEN_FROM_STEP_1>" \
     -d '{}'
```

---

## ☁️ Deployment

### Backend — Render (Docker)

1. **Create a new Web Service** on [Render](https://render.com).
2. **Connect your GitHub repository** containing this project.
3. **Set the environment to Docker** — Render will use the `Dockerfile` at the project root.
4. **Configure environment variables** in the Render dashboard:

   | Variable | Value |
   |---|---|
   | `DATABASE_URL` | Your PostgreSQL connection string (e.g., a Supabase pooler URL) |
   | `SERVER_KEY` | A secure random key for Nakama server |
   | `HTTP_KEY` | A secure random key for Nakama HTTP API |
   | `ENC_KEY` | A secure random key for session encryption |
   | `REFRESH_KEY` | A secure random key for refresh token encryption |

5. **Set the exposed port** to `7350`.
6. **Deploy** — Render builds the Docker image, runs migrations, and starts Nakama.
7. Verify by visiting `https://your-service.onrender.com/healthcheck`.

### Frontend — Vercel

1. **Import the repository** on [Vercel](https://vercel.com).
2. **Set the root directory** to `frontend`.
3. **Framework Preset**: Vite.
4. **Configure environment variables** in the Vercel dashboard:

   | Variable | Value |
   |---|---|
   | `VITE_NAKAMA_HOST` | Your Render backend URL (e.g., `ttt-multiplayer-5myz.onrender.com`) |
   | `VITE_NAKAMA_PORT` | `443` |
   | `VITE_NAKAMA_SSL` | `true` |
   | `VITE_NAKAMA_KEY` | Same as your `SERVER_KEY` on Render |

5. **Deploy** — Vercel builds and serves the static frontend.
6. Verify by opening the Vercel URL and entering a nickname.

### Database — Supabase (or any PostgreSQL provider)

1. Create a new **Supabase project** (or use any managed PostgreSQL).
2. Go to **Settings → Database → Connection Pooling**.
3. Copy the **pooler connection string** (use Transaction mode).
4. Replace the placeholder in `DATABASE_URL` on Render.
5. Nakama will auto-run `migrate up` on startup to create required tables.

---

## 🔮 Future Roadmap
- **Social Integration**: Friend lists and direct match invites.
- **Customization**: Unlockable themes and icons via global points.
- **AI Opponent**: Single-player mode against a minimax-based bot.
