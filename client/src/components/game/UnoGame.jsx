import { useState } from 'react'

const COLOR_STYLE = {
  red:    { bg: 'rgba(255,82,82,0.15)',   border: '#ff5252', text: '#ff5252' },
  green:  { bg: 'rgba(0,230,118,0.15)',   border: '#00e676', text: '#00e676' },
  blue:   { bg: 'rgba(124,77,255,0.15)',  border: '#7c4dff', text: '#7c4dff' },
  yellow: { bg: 'rgba(255,215,64,0.15)',  border: '#ffd740', text: '#ffd740' },
  wild:   { bg: 'rgba(255,145,0,0.15)',   border: '#ff9100', text: '#ff9100' },
}

function UnoCard({ card, onClick, small = false, selectable = false }) {
  if (!card) return null
  const style = COLOR_STYLE[card.color] || COLOR_STYLE.wild
  return (
    <button
      onClick={onClick}
      disabled={!selectable}
      style={{
        width: small ? '38px' : '52px',
        height: small ? '56px' : '76px',
        borderRadius: '8px',
        background: style.bg,
        border: `2px solid ${style.border}`,
        color: style.text,
        fontSize: small ? '10px' : '12px',
        fontWeight: 700,
        cursor: selectable ? 'pointer' : 'default',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: '2px', padding: '4px', transition: 'all 0.15s',
        flexShrink: 0,
      }}
      onMouseEnter={e => { if (selectable) e.currentTarget.style.transform = 'translateY(-4px)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'none' }}
    >
      <span style={{ fontSize: small ? '8px' : '10px', opacity: 0.7, textTransform: 'uppercase' }}>
        {card.color === 'wild' ? 'W' : card.color[0].toUpperCase()}
      </span>
      <span style={{ fontSize: small ? '12px' : '16px' }}>{card.value?.replace(' ', '\n') || '?'}</span>
    </button>
  )
}

export default function UnoGame({ gameState, playerId, players, onMove, disabled }) {
  const [wildColor, setWildColor] = useState(null)
  const [pickingColor, setPickingColor] = useState(false)
  const [pendingCardIdx, setPendingCardIdx] = useState(null)

  if (!gameState) return null
  const { hands, discardTop, currentTurn, status, winner, direction, chosenColor } = gameState
  const isMyTurn = currentTurn === playerId && status === 'active'
  const myHand   = hands?.[playerId] || []

  const COLORS = ['red', 'green', 'blue', 'yellow']

  const canPlay = (card) => {
    if (!isMyTurn) return false
    const effectiveColor = chosenColor || discardTop?.color
    if (card.type === 'wild') return true
    if (card.color === effectiveColor) return true
    if (card.value === discardTop?.value) return true
    return false
  }

  const handleCardClick = (idx) => {
    const card = myHand[idx]
    if (!card || !canPlay(card)) return
    if (card.type === 'wild') {
      setPendingCardIdx(idx)
      setPickingColor(true)
    } else {
      onMove({ cardIndex: idx })
    }
  }

  const handleColorPick = (color) => {
    onMove({ cardIndex: pendingCardIdx, chosenColor: color })
    setPickingColor(false)
    setPendingCardIdx(null)
  }

  const handleDraw = () => {
    if (!isMyTurn || disabled) return
    onMove({ action: 'draw' })
  }

  if (status === 'finished') {
    const isWinner = winner === playerId
    return (
      <div style={{ textAlign: 'center', padding: '20px' }}>
        <div style={{ fontSize: '60px', marginBottom: '12px' }}>{isWinner ? '🏆' : '😞'}</div>
        <h2 style={{ fontSize: '22px', fontWeight: 700, color: isWinner ? 'var(--green)' : 'var(--red)' }}>
          {isWinner ? 'You Won!' : 'You Lost!'}
        </h2>
      </div>
    )
  }

  return (
    <div>
      {/* Status */}
      <div style={{
        textAlign: 'center', padding: '10px', marginBottom: '16px',
        background: 'var(--bg3)', borderRadius: '8px', fontSize: '13px',
      }}>
        {isMyTurn
          ? <span style={{ color: 'var(--green)', fontWeight: 600 }}>✅ Your turn!</span>
          : <span style={{ color: 'var(--text2)' }}>⏳ Waiting for {players?.find(p => p.playerId === currentTurn)?.username || 'opponent'}</span>
        }
        <span style={{ marginLeft: '12px', color: 'var(--text3)', fontSize: '12px' }}>
          {direction === 1 ? '→ clockwise' : '← counter-clockwise'}
        </span>
        {chosenColor && (
          <span style={{ marginLeft: '12px', color: COLOR_STYLE[chosenColor]?.text, fontSize: '12px', fontWeight: 600 }}>
            Wild color: {chosenColor}
          </span>
        )}
      </div>

      {/* Discard pile */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px', marginBottom: '20px' }}>
        <div>
          <p style={{ fontSize: '11px', color: 'var(--text3)', textAlign: 'center', marginBottom: '6px' }}>DISCARD</p>
          <UnoCard card={discardTop} />
        </div>
        <div>
          <p style={{ fontSize: '11px', color: 'var(--text3)', textAlign: 'center', marginBottom: '6px' }}>DECK</p>
          <button
            onClick={handleDraw}
            disabled={!isMyTurn || disabled}
            style={{
              width: '52px', height: '76px', borderRadius: '8px',
              background: 'var(--bg3)', border: '2px solid var(--border)',
              color: 'var(--text2)', fontSize: '11px', fontWeight: 600,
              cursor: isMyTurn ? 'pointer' : 'default', transition: 'all 0.15s',
            }}
            onMouseEnter={e => { if (isMyTurn) e.currentTarget.style.borderColor = 'var(--accent)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)' }}>
            DRAW
          </button>
        </div>
      </div>

      {/* Other players' card counts */}
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '16px', flexWrap: 'wrap' }}>
        {players?.filter(p => p.playerId !== playerId).map(p => (
          <div key={p.playerId} style={{
            background: currentTurn === p.playerId ? 'rgba(124,77,255,0.15)' : 'var(--bg3)',
            border: `1px solid ${currentTurn === p.playerId ? 'var(--accent)' : 'var(--border)'}`,
            borderRadius: '8px', padding: '6px 12px', fontSize: '12px',
          }}>
            <span style={{ color: 'var(--text2)' }}>{p.username}: </span>
            <strong style={{ color: 'var(--yellow)' }}>{hands?.[p.playerId]?.length || 0} cards</strong>
          </div>
        ))}
      </div>

      {/* Wild color picker */}
      {pickingColor && (
        <div style={{
          background: 'var(--bg2)', border: '1px solid var(--border)',
          borderRadius: '10px', padding: '16px', marginBottom: '16px', textAlign: 'center',
        }}>
          <p style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '12px' }}>Choose a color:</p>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            {COLORS.map(c => (
              <button key={c} onClick={() => handleColorPick(c)}
                style={{
                  width: '40px', height: '40px', borderRadius: '50%',
                  background: COLOR_STYLE[c].bg, border: `2px solid ${COLOR_STYLE[c].border}`,
                  cursor: 'pointer', transition: 'transform 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.15)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'none'}
              />
            ))}
          </div>
        </div>
      )}

      {/* My hand */}
      <div>
        <p style={{ fontSize: '12px', color: 'var(--text3)', marginBottom: '8px' }}>
          Your hand ({myHand.length} cards)
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {myHand.map((card, idx) => {
            const playable = canPlay(card)
            return (
              <div key={idx} style={{ opacity: !isMyTurn || playable ? 1 : 0.4, transition: 'opacity 0.2s' }}>
                <UnoCard card={card} onClick={() => handleCardClick(idx)} selectable={isMyTurn && playable && !disabled} />
              </div>
            )
          })}
        </div>
        {isMyTurn && myHand.filter(c => canPlay(c)).length === 0 && (
          <p style={{ fontSize: '13px', color: 'var(--yellow)', marginTop: '10px' }}>
            No playable cards — draw one!
          </p>
        )}
      </div>
    </div>
  )
}
