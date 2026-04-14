// Reusable player card used across all game types
export default function PlayerCard({ player, isMe, isCurrentTurn, score, symbol, connected = true }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '10px',
      padding: '10px 14px', borderRadius: '10px',
      background: isCurrentTurn ? 'rgba(124,77,255,0.12)' : 'var(--bg3)',
      border: `1px solid ${isCurrentTurn ? 'var(--accent)' : isMe ? 'rgba(124,77,255,0.3)' : 'var(--border)'}`,
      transition: 'all 0.2s', flex: 1,
      opacity: connected ? 1 : 0.5,
    }}>
      {/* Avatar */}
      <div style={{
        width: '34px', height: '34px', borderRadius: '50%', flexShrink: 0,
        background: isMe ? 'rgba(124,77,255,0.25)' : 'var(--bg2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 700, fontSize: '14px',
        color: isMe ? 'var(--accent)' : 'var(--text2)',
      }}>
        {player?.username?.[0]?.toUpperCase() || '?'}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {player?.username || 'Unknown'}
          </span>
          {isMe && <span style={{ fontSize: '11px', color: 'var(--text3)' }}>(You)</span>}
          {!connected && <span style={{ fontSize: '11px', color: 'var(--red)' }}>●</span>}
        </div>
        <div style={{ fontSize: '12px', color: 'var(--text2)', marginTop: '1px' }}>
          {symbol && <span style={{ color: symbol === 'X' ? 'var(--accent)' : 'var(--red)', marginRight: '6px', fontWeight: 700 }}>{symbol}</span>}
          {score !== undefined && <span>Score: <strong style={{ color: 'var(--yellow)' }}>{score}</strong></span>}
        </div>
      </div>

      {/* Turn indicator */}
      {isCurrentTurn && (
        <div style={{
          width: '8px', height: '8px', borderRadius: '50%',
          background: 'var(--green)', flexShrink: 0,
          boxShadow: '0 0 6px var(--green)',
        }} />
      )}
    </div>
  )
}
