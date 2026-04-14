const COLOR_MAP = {
  R: { name: 'Red',    bg: 'rgba(255,82,82,0.2)',   border: 'var(--red)',    text: 'var(--red)' },
  G: { name: 'Green',  bg: 'rgba(0,230,118,0.2)',   border: 'var(--green)',  text: 'var(--green)' },
  B: { name: 'Blue',   bg: 'rgba(124,77,255,0.2)',  border: 'var(--accent)', text: 'var(--accent)' },
  Y: { name: 'Yellow', bg: 'rgba(255,215,64,0.2)',  border: 'var(--yellow)', text: 'var(--yellow)' },
}

export default function LudoGame({ gameState, mySymbol, onMove, disabled }) {
  if (!gameState) return null
  const { pieces, currentTurn, diceValue, diceRolled, status, winner } = gameState
  const isMyTurn = currentTurn === mySymbol && status === 'active'
  const myColor  = COLOR_MAP[mySymbol] || COLOR_MAP['R']

  const handleRoll = () => {
    if (!isMyTurn || diceRolled || disabled) return
    onMove({ action: 'roll' })
  }

  const handleMove = (pieceIndex) => {
    if (!isMyTurn || !diceRolled || disabled) return
    onMove({ action: 'move', pieceIndex })
  }

  const myPieces = pieces?.[mySymbol] || []

  return (
    <div>
      {/* Status */}
      <div style={{
        textAlign: 'center', padding: '10px 16px', marginBottom: '20px',
        background: 'var(--bg3)', borderRadius: '8px', fontSize: '14px',
      }}>
        {status === 'finished'
          ? <span style={{ color: winner === mySymbol ? 'var(--green)' : 'var(--red)', fontWeight: 700 }}>
              {winner === mySymbol ? '🏆 You won!' : `${COLOR_MAP[winner]?.name} wins!`}
            </span>
          : isMyTurn
            ? <span style={{ color: 'var(--green)', fontWeight: 600 }}>
                {diceRolled ? `Rolled ${diceValue} — pick a piece to move` : '🎲 Your turn — roll the dice!'}
              </span>
            : <span style={{ color: 'var(--text2)' }}>
                ⏳ {COLOR_MAP[currentTurn]?.name}'s turn
              </span>
        }
      </div>

      {/* All players' pieces */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
        {Object.entries(pieces || {}).map(([color, pcs]) => {
          const cfg     = COLOR_MAP[color]
          const isActive = currentTurn === color
          return (
            <div key={color} style={{
              background: isActive ? cfg.bg : 'var(--bg3)',
              border: `1px solid ${isActive ? cfg.border : 'var(--border)'}`,
              borderRadius: '10px', padding: '12px',
            }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: cfg.text, marginBottom: '8px' }}>
                {cfg.name} {color === mySymbol ? '(You)' : ''}
                {isActive && <span style={{ marginLeft: '6px', fontSize: '11px' }}>●</span>}
              </div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {pcs.map((pos, idx) => (
                  <button
                    key={idx}
                    onClick={() => color === mySymbol && handleMove(idx)}
                    disabled={!isMyTurn || !diceRolled || color !== mySymbol || disabled}
                    style={{
                      width: '36px', height: '36px', borderRadius: '50%',
                      background: pos === 52 ? cfg.bg : pos === -1 ? 'var(--bg2)' : cfg.bg,
                      border: `2px solid ${cfg.border}`,
                      color: cfg.text, fontSize: '11px', fontWeight: 700,
                      cursor: (isMyTurn && diceRolled && color === mySymbol) ? 'pointer' : 'default',
                      opacity: pos === 52 ? 1 : 1,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                    {pos === -1 ? '🏠' : pos === 52 ? '✅' : pos}
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Dice */}
      {status === 'active' && (
        <div style={{ textAlign: 'center' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: '64px', height: '64px', borderRadius: '12px', fontSize: '36px',
            background: diceValue ? 'var(--bg3)' : 'var(--bg3)',
            border: `2px solid ${isMyTurn ? 'var(--accent)' : 'var(--border)'}`,
            marginBottom: '14px',
          }}>
            {diceValue ? ['','⚀','⚁','⚂','⚃','⚄','⚅'][diceValue] : '🎲'}
          </div>
          <br />
          {isMyTurn && !diceRolled && (
            <button className="btn btn-primary" onClick={handleRoll} disabled={disabled}>
              Roll Dice
            </button>
          )}
          {!isMyTurn && (
            <p style={{ fontSize: '13px', color: 'var(--text2)' }}>
              Waiting for {COLOR_MAP[currentTurn]?.name} to roll...
            </p>
          )}
        </div>
      )}
    </div>
  )
}
