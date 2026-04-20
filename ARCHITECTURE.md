# 🎮 GameZone: Cross-Device Multiplayer Architecture

## Overview

GameZone is a **real-time multiplayer gaming platform** that allows players from **different devices on different networks** to join the same game sessions. The system uses **Redis pub/sub** for cross-server synchronization, **Socket.IO** for real-time communication, and **load balancing** to distribute players across multiple server instances.

---

## System Architecture

### Technology Stack

```
┌─────────────────┐        ┌─────────────────┐
│   WINDOWS APP   │        │     MAC APP     │
│  (Browser A)    │        │   (Browser B)   │
│ 192.168.14.39   │        │ 192.168.13.180  │
└────────┬────────┘        └────────┬────────┘
         │                          │
         └──────────────┬───────────┘
                        │ HTTP REQUEST
                  ┌─────▼─────┐
                  │   NGINX    │ (Port 80)
                  │ Load Balancer
                  │ (Round-Robin)
                  └─────┬─────┘
         ┌────────┬─────┴─────┬────────┐
         │        │           │        │
    ┌────▼────────▼────┐  ┌───▼────────▼────┐
    │  GAME-SERVER-1   │  │  GAME-SERVER-2  │
    │    (Port 5001)   │  │    (Port 5001)  │
    └────┬─────────────┘  └────┬────────────┘
         │ REDIS SYNC          │
         └─────────┬───────────┘
                   │
              ┌────▼────┐
              │  REDIS  │ (Port 6379)
              │  Cache  │ + Pub/Sub
              └────┬────┘
                   │
         ┌─────────▼──────────┐
         │    MONGODB         │
         │  (Port 27017)      │
         └────────────────────┘
```

### Core Components

| Component | Purpose | Technology |
|-----------|---------|-----------|
| **NGINX** | Load balancer, reverse proxy | Round-robin distribution |
| **Socket.IO** | Real-time bidirectional communication | WebSocket + polling fallback |
| **Redis** | Pub/sub messaging, queue storage, caching | Shared state across servers |
| **MongoDB** | Persistent storage (matches, players, stats) | Document database |
| **Game Servers** | Game logic, match coordination | Node.js + Express |
| **React Client** | User interface | Vite dev server |

---

## Game Flow: Step-by-Step

### Phase 1: User Connection (Socket Handshake)

#### Client-Side:
```javascript
// client/src/utils/socket.js
export const connectSocket = (token) => {
  if (socket?.connected) return socket
  
  // Uses current page origin (auto-detects device IP)
  const socketURL = window.location.origin
  
  socket = io(socketURL, {
    auth: { token },
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  })
  
  socket.on('connect', () => console.log('[Socket] Connected:', socket.id))
  socket.on('disconnect', (r) => console.log('[Socket] Disconnected:', r))
  socket.on('connect_error', (e) => console.error('[Socket] Error:', e.message))
  
  return socket
}
```

**Why `window.location.origin`?**
- Windows user on `http://localhost:3000` → connects to `localhost`
- Mac user on `http://192.168.13.180:3000` → connects to `192.168.13.180`
- Both automatically route through NGINX → distributes to servers

#### Server-Side Authentication:
```javascript
// server/middleware/auth.js
const socketAuthMiddleware = async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token
    if (!token) return next(new Error('Authentication required'))
    
    // Verify JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    socket.player = decoded  // { id: playerId, username, ... }
    next()
  } catch (err) {
    next(new Error('Invalid token'))
  }
}
```

#### Connection Logging:
```
✅ Windows: [Socket] bnm (69e5c91afccdb569c3af5f80) connected on DJLARXnLhSaul096AAAD
✅ Mac:     [Socket] hjk (69e5cc80e18c7897af2dcb61) connected on mmzc_TD2tNQhqoMWAAAD
```

Each player gets a unique Socket.IO socket ID, even on same server instance.

---

### Phase 2: Matchmaking (Queue System)

#### Flow Diagram:
```
Player A                    Player B
(Windows)                   (Mac)
  │                           │
  │ socket.emit('matchmaking:join', { gameType: 'tictactoe' })
  │ ────────────────────→ Server A
  │                           │
  │                           │ socket.emit('matchmaking:join', { gameType: 'tictactoe' })
  │                           │ ────────────────────→ Server B
  │                           │
  │  ┌─────────────────── REDIS ────────────────────┐
  │  │ matchmaking:queue:tictactoe                  │
  │  │ [                                            │
  │  │   { playerId: A, username: 'bnm', ... },    │ ← A joined
  │  │   { playerId: B, username: 'hjk', ... }     │ ← B joined
  │  │ ]                                            │
  │  │ Size: 2/2 ✓ MATCH FOUND!                    │
  │  └────────────────────────────────────────────┘
  │                           │
  │ ←──── BROADCAST: match:created ────→
```

#### Server-Side: `joinQueue()`

```javascript
// server/services/matchmaking.js
const joinQueue = async (playerId, username, gameType = 'tictactoe') => {
  const config = GAME_CONFIG[gameType]
  if (!config) throw new Error(`Unknown game type: ${gameType}`)
  
  // Remove player from other queues (prevent duplicates)
  await leaveAllQueues(playerId)
  
  // Add to this game's queue
  const entry = JSON.stringify({ playerId, username, gameType, joinedAt: Date.now() })
  await getCache().lpush(QUEUE_KEY(gameType), entry)
  
  // Check queue length
  const queueLen = await getCache().llen(QUEUE_KEY(gameType))
  console.log(`[Matchmaking] ${username} joined ${gameType} queue. Queue size: ${queueLen}/${config.players}`)
  
  // If queue is full, create match
  if (queueLen >= config.players) {
    return await createMatch(gameType, config)
  }
  
  return null  // Still waiting for more players
}
```

#### Server-Side: `createMatch()`

When queue reaches required player count:

```javascript
const createMatch = async (gameType, config) => {
  const players = []
  
  // Pop N players from queue (e.g., 2 for TicTacToe)
  for (let i = 0; i < config.players; i++) {
    const raw = await getCache().rpop(QUEUE_KEY(gameType))
    if (!raw) {
      // Not enough players, push back what we popped
      for (const p of players) {
        await getCache().rpush(QUEUE_KEY(gameType), JSON.stringify(p))
      }
      return null
    }
    const p = JSON.parse(raw)
    players.push({
      ...p,
      symbol: config.symbols?.[i] || null,  // X or O for TicTacToe
    })
  }
  
  // Generate unique room ID
  const roomId = uuidv4()  // e.g., '7a3b9c1f-4d2e-11eb-ae93-0242ac130002'
  
  // Create MongoDB document
  const match = await Match.create({
    roomId,
    gameType,
    maxPlayers: config.players,
    status: 'waiting',
    players: players.map(p => ({
      playerId:  p.playerId,
      username:  p.username,
      symbol:    p.symbol,
      score:     0,
      connected: false,
    })),
    serverInstance: process.env.SERVER_ID,
  })
  
  // Cache for fast lookup (1 hour TTL)
  await getCache().setex(ROOM_KEY(roomId), 3600, JSON.stringify({
    roomId,
    gameType,
    maxPlayers: config.players,
    players,
    matchId: match._id.toString(),
  }))
  
  // 🔑 CRITICAL: Broadcast to ALL servers
  await getPub().publish('match:created', JSON.stringify({
    roomId,
    gameType,
    maxPlayers: config.players,
    playerIds: players.map(p => p.playerId),
  }))
  
  console.log(`[Matchmaking] Match created: ${roomId} (${gameType}, ${config.players} players)`)
  return { roomId, players, matchId: match._id, gameType }
}
```

#### Client-Side: Matchmaking Hook

```javascript
// client/src/hooks/useMatchmaking.js
export const useMatchmaking = () => {
  const [status, setStatus] = useState('idle')      // idle|searching|found
  const [roomId, setRoomId] = useState(null)
  const [gameType, setGameType] = useState(null)
  
  useEffect(() => {
    const socket = getSocket()
    if (!socket) return
    
    // Listen for match results
    socket.on('matchmaking:queued', ({ gameType: gt }) => {
      setStatus('searching')
      setGameType(gt)
    })
    
    socket.on('match:found', ({ roomId: rid, gameType: gt }) => {
      setRoomId(rid)
      setGameType(gt)
      setStatus('found')  // ← Triggers room:join automatically
    })
    
    socket.on('matchmaking:matched', ({ roomId: rid }) => {
      setRoomId(rid)
      setStatus('found')
    })
  }, [])
  
  const joinQueue = (gt = 'tictactoe') => {
    const socket = getSocket()
    if (!socket) return
    setGameType(gt)
    socket.emit('matchmaking:join', { gameType: gt })  // ← Send to server
  }
  
  return { status, roomId, gameType, joinQueue }
}
```

#### Redis Pub/Sub Broadcast (Critical for Multi-Server Sync)

```javascript
// server/services/socketHandler.js
const sub = getSub()
sub.subscribe('game:move', 'match:created', 'game:over')

sub.on('message', (channel, message) => {
  try {
    const data = JSON.parse(message)
    
    if (channel === 'match:created') {
      // Notify each matched player on their specific socket
      data.playerIds.forEach(playerId => {
        io.to(`player:${playerId}`).emit('match:found', {
          roomId: data.roomId,
          gameType: data.gameType,
          maxPlayers: data.maxPlayers,
        })
      })
    }
  } catch (err) {
    console.error('[Socket] Redis message parse error:', err.message)
  }
})
```

**Why this matters:**
- Server A creates match and publishes to Redis
- Redis pub/sub broadcasts to ALL servers (A and B)
- Server A notifies its own clients
- Server B notifies its own clients
- Both players get 'match:found' event, even on different servers!

---

### Phase 3: Room Join (Game Initialization)

#### Client-Side:
```javascript
// client/src/hooks/useGame.js
export const useGame = (roomId) => {
  const [gameState, setGameState] = useState(null)
  const [players, setPlayers] = useState([])
  const [status, setStatus] = useState('connecting')  // connecting|waiting|active|finished
  
  useEffect(() => {
    const socket = getSocket()
    if (!socket || !roomId) return
    
    // Join game room
    socket.emit('room:join', { roomId })
    
    // Receive initial room state
    socket.on('room:joined', ({ state, gameType: gt, players: pl, maxPlayers: mp }) => {
      setGameState(state)      // Initial game board/state
      setPlayers(pl)           // List of players in room
      setStatus('waiting')     // Waiting for other players
    })
    
    // Notified when all players connected
    socket.on('game:start', ({ state }) => {
      setGameState(state)
      setStatus('active')      // Game is now playable!
    })
    
    // Receive state updates from other players' moves
    socket.on('game:state', ({ state }) => {
      setGameState(state)      // Update board
    })
  }, [roomId])
  
  const makeMove = useCallback((moveData) => {
    const socket = getSocket()
    if (!socket) return
    socket.emit('game:move', { roomId, moveData })  // Send move to server
  }, [roomId])
  
  return { gameState, players, status, makeMove }
}
```

#### Server-Side: Room Join Handler

```javascript
// server/services/socketHandler.js
socket.on('room:join', async ({ roomId } = {}) => {
  try {
    if (!roomId) return socket.emit('error', { message: 'roomId required' })
    
    // Add socket to Socket.IO room
    socket.join(roomId)
    
    // Check if room already initialized on this server
    let room = getRoom(roomId)
    
    if (!room) {
      // First player from this server - initialize room
      const match = await Match.findOne({ roomId })
      if (!match) return socket.emit('error', { message: 'Room not found' })
      
      // Normalize player data from MongoDB
      const normalizedPlayers = match.players.map(p => ({
        playerId: p.playerId.toString(),
        username: p.username,
        symbol: p.symbol,
        score: p.score,
      }))
      
      // Initialize game state (creates new board, etc.)
      const state = await initRoom(
        roomId,
        match.gameType,
        normalizedPlayers,
        match.maxPlayers
      )
      
      room = getRoom(roomId)  // Retrieve from activeRooms
    }
    
    // Send room data to this socket
    socket.emit('room:joined', {
      roomId,
      state: room.state,
      gameType: room.gameType,
      maxPlayers: room.maxPlayers,
      players: room.players,
    })
    
    // Mark this player as connected
    const result = await playerConnected(roomId, playerId)
    
    // Broadcast to all sockets in room
    io.to(roomId).emit('player:joined', {
      playerId,
      username,
      connectedCount: result?.connectedCount ?? room.maxPlayers,
      maxPlayers: room.maxPlayers,
    })
    
    // If all players connected, start game
    if (result?.allConnected) {
      io.to(roomId).emit('game:start', {
        state: result.state,
        message: 'All players connected! Game starting...',
      })
    } else if (result) {
      io.to(roomId).emit('waiting:players', {
        connectedCount: result.connectedCount,
        maxPlayers: room.maxPlayers,
        needed: room.maxPlayers - result.connectedCount,
      })
    }
  } catch (err) {
    console.error('[Socket] room:join error:', err.message)
    socket.emit('error', { message: err.message })
  }
})
```

#### Game State Initialization

```javascript
// server/services/gameRoomManager.js
const initRoom = async (roomId, gameType, players, maxPlayers) => {
  const playerIds = players.map(p => p.playerId.toString())
  let state
  
  // Create game-specific initial state
  switch (gameType) {
    case 'tictactoe':
      state = TicTacToe.createState()
      // Returns: {
      //   board: [null, null, null, ..., null],  (9 cells)
      //   currentPlayer: 'X',
      //   winner: null,
      //   status: 'active'
      // }
      break
      
    case 'quiz':
      state = Quiz.createState(2)
      // Returns: {
      //   questions: [...],
      //   currentQuestion: 0,
      //   scores: { playerId1: 0, playerId2: 0 },
      //   status: 'active'
      // }
      break
      
    case 'uno':
      state = Uno.createState(playerIds)
      // Returns: {
      //   deck: [...],
      //   hands: { playerId1: [...], playerId2: [...] },
      //   currentPlayer: playerIds[0],
      //   status: 'active'
      // }
      break
      
    default:
      throw new Error(`Unknown game type: ${gameType}`)
  }
  
  // Store room in memory on this server
  const room = { state, gameType, players, connectedCount: 0, maxPlayers }
  activeRooms.set(roomId, room)
  
  // Persist to MongoDB
  await Match.findOneAndUpdate(
    { roomId },
    { gameState: state, startedAt: new Date() }
  )
  
  return state
}
```

#### Player Connection Tracking

```javascript
const playerConnected = async (roomId, playerId) => {
  const room = activeRooms.get(roomId)
  if (!room) return null
  
  // Increment connected count
  room.connectedCount = Math.min(room.connectedCount + 1, room.maxPlayers)
  
  console.log(`[Room] ${roomId}: ${room.connectedCount}/${room.maxPlayers} connected`)
  
  // If all players connected, game can start
  if (room.connectedCount === room.maxPlayers) {
    await Match.findOneAndUpdate({ roomId }, { status: 'active' })
    return { allConnected: true, state: room.state }
  }
  
  return { allConnected: false, connectedCount: room.connectedCount }
}
```

---

### Phase 4: Gameplay (Real-Time Move Sync)

#### Player Makes Move

```javascript
// Component: TicTacToe.jsx
const handleCellClick = (index) => {
  if (gameState.board[index] !== null) return  // Cell occupied
  if (gameState.currentPlayer !== mySymbol) return  // Not my turn
  
  makeMove({
    index,
    player: mySymbol,  // 'X' or 'O'
  })
}

// useGame hook sends move
const makeMove = useCallback((moveData) => {
  const socket = getSocket()
  if (!socket) return
  socket.emit('game:move', { roomId, moveData })
}, [roomId])
```

#### Server Processes Move

```javascript
// server/services/socketHandler.js
socket.on('game:move', async ({ roomId, moveData } = {}) => {
  try {
    if (!roomId || !moveData) return socket.emit('move:error', { message: 'Invalid move data' })
    
    // Process move
    const result = await processMove(roomId, playerId, moveData)
    if (result.error) return socket.emit('move:error', { message: result.error })
    
    // On success, the move is already broadcast via Redis pub/sub
    // (handled inside processMove function)
  } catch (err) {
    socket.emit('move:error', { message: err.message })
  }
})
```

#### Process Move (Core Game Logic)

```javascript
// server/services/gameRoomManager.js
const processMove = async (roomId, playerId, moveData) => {
  const room = activeRooms.get(roomId)
  if (!room) return { error: 'Room not found on this server' }
  if (room.state.status !== 'active') return { error: 'Game is not active' }
  
  const normalizedPlayers = room.players.map(p => ({
    ...p,
    playerId: p.playerId.toString(),
  }))
  
  let newState
  
  // Apply move based on game type
  switch (room.gameType) {
    case 'tictactoe':
      newState = TicTacToe.applyMove(room.state, playerId, moveData, normalizedPlayers)
      // Inside applyMove:
      // 1. Validate move (cell empty? correct player?)
      // 2. Update board: state.board[moveData.index] = currentPlayer
      // 3. Check winner: TicTacToe.checkWin(board)
      // 4. Switch turn: currentPlayer = otherPlayer
      // 5. Return new state object
      break
      
    case 'quiz':
      newState = Quiz.applyMove(room.state, playerId, moveData)
      // 1. Record answer
      // 2. Calculate score
      // 3. Move to next question
      break
      
    case 'uno':
      if (moveData.action === 'draw') {
        newState = Uno.drawCard(room.state, playerId)
      } else {
        newState = Uno.playCard(room.state, playerId, moveData)
      }
      break
  }
  
  if (newState?.error) return newState
  
  // Update in-memory state
  room.state = newState
  
  // Persist to MongoDB
  await Match.findOneAndUpdate(
    { roomId },
    {
      gameState: newState,
      $push: {
        moves: {
          playerId,
          move: moveData,
          timestamp: new Date(),
        },
      },
    }
  )
  
  // 🔑 BROADCAST TO ALL SERVERS via Redis Pub/Sub
  await getPub().publish('game:move', JSON.stringify({
    roomId,
    state: newState,
    moveData,
    playerId,
  }))
  
  // Check if game is over
  const isOver = ['finished', 'draw'].includes(newState.status)
  if (isOver) {
    await handleGameEnd(roomId, room, newState)
  }
  
  return { state: newState }
}
```

#### Redis Broadcasts Move to All Clients

```javascript
// server/services/socketHandler.js
sub.on('message', (channel, message) => {
  try {
    const data = JSON.parse(message)
    
    if (channel === 'game:move') {
      // Send updated game state to ALL sockets in this room
      // Regardless of which server they're connected to!
      io.to(data.roomId).emit('game:state', {
        state: data.state,
        lastMove: data.moveData,
        movedBy: data.playerId,
      })
    }
    
    if (channel === 'game:over') {
      io.to(data.roomId).emit('game:over', {
        winnerId: data.winnerId,
        isDraw: data.isDraw,
      })
    }
  } catch (err) {
    console.error('[Socket] Redis message parse error:', err.message)
  }
})
```

#### Client Receives Updated State

```javascript
// useGame hook
socket.on('game:state', ({ state, lastMove, movedBy }) => {
  setGameState(state)  // Update board instantly!
  
  // state.board now shows the move
  // state.currentPlayer is now other player
  // UI re-renders automatically
})
```

#### Multi-Server Scenario Example:

```
SCENARIO: Windows player on SERVER-1, Mac player on SERVER-2

Windows Player: Clicks TicTacToe cell 4
  │
  └─→ SERVER-1 receives game:move event
      │
      ├─→ Processes move (validates, updates board)
      │
      ├─→ Updates activeRooms map on SERVER-1
      │
      ├─→ Saves to MongoDB
      │
      ├─→ Publishes to Redis: 'game:move' channel
      │      {
      │        roomId: '7a3b9c1f...',
      │        state: { board: [...X...], currentPlayer: 'O', ... },
      │        moveData: { index: 4, player: 'X' },
      │        playerId: 'windows-user-id'
      │      }
      │
      └─→ Redis Pub/Sub broadcasts to ALL servers (1, 2, etc.)
         │
         ├─→ SERVER-1 sub.on('message') fires
         │   io.to(roomId).emit('game:state', ...)
         │   ↓
         │   Windows client receives 'game:state'
         │   setGameState(newState)
         │   ✅ Windows board updates
         │
         └─→ SERVER-2 sub.on('message') fires
             io.to(roomId).emit('game:state', ...)
             ↓
             Mac client receives 'game:state'
             setGameState(newState)
             ✅ Mac board updates INSTANTLY!

RESULT: Both players see the move in real-time, even on different servers!
```

---

### Phase 5: Game End

#### Win Detection

```javascript
// TicTacToe.applyMove checks after each move
const state = TicTacToe.applyMove(...)

if (state.status === 'finished') {  // Winner found!
  // state.winner = playerId of winner
}

// Or check for draw
if (state.status === 'draw') {  // All cells filled, no winner
  // state.isDraw = true
}
```

#### Handle Game End

```javascript
// server/services/gameRoomManager.js
const handleGameEnd = async (roomId, room, state) => {
  let winnerId = null
  
  switch (room.gameType) {
    case 'tictactoe':
      winnerId = TicTacToe.getWinnerId(state, room.players.map(p => ({
        ...p, playerId: p.playerId.toString(),
      })))
      break
    // ... other game types
  }
  
  // Update player stats in MongoDB
  if (winnerId) {
    await Player.updateOne(
      { _id: winnerId },
      { $inc: { wins: 1, gamesPlayed: 1 } }
    )
    
    // Update losers
    const losers = room.players.filter(p => p.playerId !== winnerId)
    for (const loser of losers) {
      await Player.updateOne(
        { _id: loser.playerId },
        { $inc: { losses: 1, gamesPlayed: 1 } }
      )
    }
  } else if (state.isDraw) {
    // Update all players for draw
    for (const player of room.players) {
      await Player.updateOne(
        { _id: player.playerId },
        { $inc: { draws: 1, gamesPlayed: 1 } }
      )
    }
  }
  
  // Update match in MongoDB
  await Match.findOneAndUpdate(
    { roomId },
    {
      status: 'finished',
      winner: winnerId,
      isDraw: state.isDraw,
      endedAt: new Date(),
    }
  )
  
  // Broadcast game over to all clients
  await getPub().publish('game:over', JSON.stringify({
    roomId,
    winnerId,
    isDraw: state.isDraw,
  }))
  
  // Clean up room from memory
  activeRooms.delete(roomId)
  
  console.log(`[Game] ${roomId} finished. Winner: ${winnerId || 'draw'}`)
}
```

#### Client Updates UI

```javascript
// useGame hook
socket.on('game:over', () => {
  setStatus('finished')  // UI shows results
})

socket.on('game:state', ({ state }) => {
  setGameState(state)
  if (['finished', 'draw'].includes(state?.status)) {
    setStatus('finished')
  }
})
```

---

## Key Design Patterns

### 1. **Redis Pub/Sub for Cross-Server Communication**

Why Redis instead of direct socket broadcast?

```
❌ Without Redis Pub/Sub:
   Server-1 only broadcasts to its own clients
   Server-2 only broadcasts to its own clients
   Clients on different servers DON'T see events from each other!

✅ With Redis Pub/Sub:
   Server-1 publishes: 'game:move' → Redis
   Redis broadcasts to ALL servers
   Server-1 AND Server-2 receive the message
   Both can emit to their connected clients
   → Full sync across servers!
```

### 2. **Socket.IO Rooms for Client Targeting**

```javascript
// Join player to their personal room
socket.join(`player:${playerId}`)
// Later: io.to(`player:${playerId}`).emit(...)

// Join player to game room
socket.join(roomId)
// Later: io.to(roomId).emit(...)
// → Reaches ALL clients in this game, regardless of server

// Broadcast to everyone
io.emit('...')
```

### 3. **In-Memory Game State + Database Persistence**

```
In-Memory (activeRooms):
- Fast reads/writes
- Live game state
- Lost if server crashes

MongoDB:
- Persistent storage
- Historical data
- Can recover game state on server restart

Best of both worlds:
1. Process move in-memory (fast)
2. Save to DB (persistent)
3. Broadcast to other servers (sync)
```

### 4. **Load Balancing with Stateless Servers**

```
NGINX uses round-robin (no session stickiness)
→ Each request can go to different server
→ But how do we handle game state across servers?

Solution: Redis + MongoDB as shared state
- Server-1 initializes game
- Server-2 reads from Redis cache
- Both servers have consistent view
- No "session affinity" needed!
```

---

## Data Models

### Match Schema

```javascript
{
  _id: ObjectId,
  roomId: string,           // Unique per match
  gameType: 'tictactoe',
  maxPlayers: 2,
  status: 'waiting' | 'active' | 'finished',
  players: [
    {
      playerId: ObjectId,
      username: string,
      symbol: 'X' | 'O',
      score: number,
      connected: boolean
    }
  ],
  gameState: {},            // Game-specific state
  winner: ObjectId,         // null for draw
  isDraw: boolean,
  moves: [
    {
      playerId: ObjectId,
      move: {},              // Move-specific data
      timestamp: Date
    }
  ],
  serverInstance: 'server-1',
  startedAt: Date,
  endedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Player Schema

```javascript
{
  _id: ObjectId,
  username: string,
  email: string,
  passwordHash: string,
  gamesPlayed: number,
  wins: number,
  losses: number,
  draws: number,
  rating: number,
  lastActive: Date,
  createdAt: Date,
  updatedAt: Date
}
```

---

## Error Handling & Edge Cases

### Disconnect During Game

```javascript
socket.on('disconnect', async (reason) => {
  console.log(`[Socket] ${username} disconnected: ${reason}`)
  
  // Clean up queue
  await leaveQueue(playerId)
  
  // Notify room
  const rooms = [...socket.rooms].filter(
    r => r !== socket.id && r !== `player:${playerId}`
  )
  for (const roomId of rooms) {
    io.to(roomId).emit('player:disconnected', {
      playerId,
      username,
      reason,
    })
  }
})
```

### Reconnection

Client automatically tries to reconnect (Socket.IO built-in):
```javascript
socket = io(socketURL, {
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,  // 1s, 2s, 4s, 8s, 16s
})
```

### Server Crash Recovery

1. Game state saved in MongoDB
2. Redis cache has backup
3. New server instance reads from MongoDB
4. Players can rejoin same room

---

## Running Locally

### Setup

```bash
# Terminal 1: Docker containers
cd c:\Users\Michelle\Desktop\dcproj\GameZone
docker-compose up

# Terminal 2: Client dev server
cd client
npm install
npm run dev
```

### Testing Cross-Device

**Windows:**
```
http://localhost:3000
```

**Mac (same WiFi):**
```
http://192.168.14.39:3000
```

(Replace IP with your Windows machine's local IP)

---

## Performance Considerations

| Component | Optimization |
|-----------|-------------|
| **Socket.IO** | Uses WebSocket with fallback to long-polling |
| **Redis** | In-memory, fast pub/sub messaging |
| **MongoDB** | Indexed queries on roomId, playerId |
| **NGINX** | Round-robin load balancing, connection pooling |
| **Client** | React hooks, efficient re-renders, socket event cleanup |

---

## Security

1. **JWT Authentication** - Each socket must provide valid token
2. **Rate Limiting** - Express middleware limits requests
3. **Input Validation** - Move data validated before processing
4. **HTTPS Ready** - NGINX can route HTTPS → HTTP internally
5. **Helmet** - Security headers on all responses

---

## Conclusion

GameZone achieves **true cross-device multiplayer** by:

1. **Decoupling clients from servers** - NGINX load balances, not sessions
2. **Syncing state centrally** - Redis Pub/Sub coordinates all servers
3. **Persisting data** - MongoDB ensures game history survives crashes
4. **Real-time communication** - Socket.IO with fallbacks for reliability
5. **Stateless servers** - Any server can handle any game after initialization

The key insight: **Redis Pub/Sub acts as the "event bus" that connects all servers**, allowing them to broadcast game state changes to their clients in real-time.
