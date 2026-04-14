export default function TicTacToe({ gameState, mySymbol, onMove, disabled }) {
  if (!gameState) return null
  const { cells, currentTurn, status, winner, winCombo } = gameState
  const isMyTurn = currentTurn === mySymbol && status === 'active'

  return (
    <div>
      {/* Status bar */}
      <div style={{
        textAlign: 'center', marginBottom: '20px',
        padding: '10px 16px', background: 'var(--bg3)',
        borderRadius: '8px', fontSize: '14px',
      }}>
        {status === 'active' && (
          isMyTurn
            ? <span style={{ color: 'var(--green)', fontWeight: 600 }}>✅ Your turn — play {mySymbol}</span>
            : <span style={{ color: 'var(--text2)' }}>⏳ Waiting for opponent ({currentTurn})</span>
        )}
        {status === 'finished' && (
          winner === mySymbol
            ? <span style={{ color: 'var(--green)', fontWeight: 700 }}>🏆 You won!</span>
            : <span style={{ color: 'var(--red)', fontWeight: 700 }}>😞 You lost!</span>
        )}
        {status === 'draw' && (
          <span style={{ color: 'var(--yellow)', fontWeight: 700 }}>🤝 It's a draw!</span>
        )}
      </div>

      {/* Board */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3,1fr)',
        gap: '8px', maxWidth: '280px', margin: '0 auto',
      }}>
        {cells.map((cell, idx) => {
          const isWin = winCombo?.includes(idx)
          return (
            <button
              key={idx}
              onClick={() => onMove({ cellIndex: idx })}
              disabled={disabled || !!cell || !isMyTurn || status !== 'active'}
              style={{
                height: '86px', fontSize: '34px', fontWeight: 700,
                background: isWin ? 'rgba(0,230,118,0.15)' : 'var(--bg3)',
                border: `2px solid ${isWin ? 'var(--green)' : cell ? 'var(--border)' : 'var(--border)'}`,
                borderRadius: '10px',
                color: cell === 'X' ? 'var(--accent)' : 'var(--red)',
                cursor: (!cell && isMyTurn && status === 'active') ? 'pointer' : 'default',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => {
                if (!cell && isMyTurn && status === 'active')
                  e.currentTarget.style.borderColor = 'var(--accent)'
              }}
              onMouseLeave={e => {
                if (!isWin) e.currentTarget.style.borderColor = 'var(--border)'
              }}
            >
              {cell}
            </button>
          )
        })}
      </div>

      {/* Grid reference */}
      <p style={{ textAlign: 'center', fontSize: '11px', color: 'var(--text3)', marginTop: '14px' }}>
        Cells: 0–8 left→right, top→bottom
      </p>
    </div>
  )
}
