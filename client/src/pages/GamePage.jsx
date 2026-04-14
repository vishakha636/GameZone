import { useParams, useNavigate } from 'react-router-dom'
import { useAuth }       from '../context/AuthContext'
import { useGame }       from '../hooks/useGame'
import TicTacToe         from '../components/game/TicTacToe'
import QuizGame          from '../components/game/QuizGame'
import LudoGame          from '../components/game/LudoGame'
import UnoGame           from '../components/game/UnoGame'
import Chat              from '../components/game/Chat'
import PlayerCard        from '../components/game/PlayerCard'
import WaitingRoom       from '../components/game/WaitingRoom'
import GAME_CONFIG       from '../utils/gameConfig'

const GAME_LABELS = {
  tictactoe: '⭕ Tic Tac Toe',
  quiz:      '🧠 Quiz Battle',
  trivia3:   '🎯 3-Player Trivia',
  ludo:      '🎲 Ludo',
  uno:       '🃏 UNO',
}

export default function GamePage() {
  const { roomId }  = useParams()
  const { player }  = useAuth()
  const navigate    = useNavigate()
  const {
    gameState, gameType, players, maxPlayers,
    chat, status, waitingCount, error, makeMove, sendChat,
  } = useGame(roomId)

  const myPlayerData = players?.find?.(
    p => p.playerId?.toString() === player?._id?.toString() || p.username === player?.username
  )
  const mySymbol = myPlayerData?.symbol

  const renderGame = () => {
    if (!gameState) return null
    const commonProps = { gameState, disabled: status === 'finished', onMove: makeMove }

    switch (gameType) {
      case 'tictactoe': return <TicTacToe {...commonProps} mySymbol={mySymbol} />
      case 'quiz':
      case 'trivia3':   return <QuizGame  {...commonProps} playerId={player?._id} />
      case 'ludo':      return <LudoGame  {...commonProps} mySymbol={mySymbol} />
      case 'uno':       return <UnoGame   {...commonProps} playerId={player?._id} players={players} />
      default:          return <p style={{ color: 'var(--text2)' }}>Unknown game type: {gameType}</p>
    }
  }

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', padding: '24px 20px' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 700 }}>
            {GAME_LABELS[gameType] || '🎮 Game'}
          </h1>
          <p style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '2px' }}>
            Room: {roomId?.slice(0, 8)}...
          </p>
        </div>
        <button className="btn btn-secondary" onClick={() => navigate('/')}
          style={{ padding: '7px 14px', fontSize: '13px' }}>
          ← Leave
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div className="alert alert-error" style={{ marginBottom: '16px' }}>⚠️ {error}</div>
      )}

      {/* Connecting */}
      {status === 'connecting' && (
        <div className="card" style={{ textAlign: 'center', padding: '48px' }}>
          <div className="spinner" style={{ marginBottom: '16px' }} />
          <p style={{ color: 'var(--text2)' }}>Connecting to game room...</p>
        </div>
      )}

      {/* Waiting for all N players */}
      {status === 'waiting' && (
        <div className="card">
          <WaitingRoom
            connectedCount={waitingCount}
            maxPlayers={maxPlayers}
            gameType={gameType}
            players={players}
          />
        </div>
      )}

      {/* Active / Finished game */}
      {(status === 'active' || status === 'finished') && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '16px', alignItems: 'start' }}>

          {/* Left: player cards + game board */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

            {/* Player cards */}
            {players?.length > 0 && (
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {players.map((p, i) => (
                  <PlayerCard
                    key={i}
                    player={p}
                    isMe={p.username === player?.username}
                    isCurrentTurn={
                      gameState?.currentTurn === p.symbol ||
                      gameState?.currentTurn === p.playerId?.toString()
                    }
                    score={gameState?.scores?.[p.playerId?.toString()]}
                    symbol={p.symbol}
                  />
                ))}
              </div>
            )}

            {/* Game board */}
            <div className="card">
              {renderGame()}

              {status === 'finished' && (
                <div style={{ textAlign: 'center', marginTop: '24px', paddingTop: '20px', borderTop: '1px solid var(--border)' }}>
                  <button className="btn btn-primary btn-lg" onClick={() => navigate('/')}>
                    🔍 Find New Match
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right: chat */}
          <div className="card" style={{ minHeight: '320px' }}>
            <Chat messages={chat} onSend={sendChat} />
          </div>

        </div>
      )}
    </div>
  )
}
