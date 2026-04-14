export default function WaitingRoom({ connectedCount, maxPlayers, gameType, players }) {
  const needed = maxPlayers - connectedCount

  return (
    <div style={{ textAlign: 'center', padding: '32px 20px' }}>
      <div style={{ fontSize: '52px', marginBottom: '16px' }}>⏳</div>
      <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>Waiting for players</h2>
      <p style={{ color: 'var(--text2)', fontSize: '14px', marginBottom: '28px' }}>
        {connectedCount}/{maxPlayers} connected — need {needed} more
      </p>

      {/* Player slots */}
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '28px' }}>
        {Array.from({ length: maxPlayers }).map((_, i) => {
          const p        = players?.[i]
          const joined   = i < connectedCount
          return (
            <div key={i} style={{
              width: '80px', padding: '14px 10px', borderRadius: '10px', textAlign: 'center',
              background: joined ? 'rgba(0,230,118,0.1)' : 'var(--bg3)',
              border: `1px solid ${joined ? 'var(--green)' : 'var(--border)'}`,
              transition: 'all 0.3s',
            }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '50%', margin: '0 auto 8px',
                background: joined ? 'rgba(0,230,118,0.2)' : 'var(--bg2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '18px',
              }}>
                {joined ? (p?.username?.[0]?.toUpperCase() || '✓') : '?'}
              </div>
              <div style={{ fontSize: '11px', color: joined ? 'var(--green)' : 'var(--text3)', fontWeight: 600 }}>
                {joined ? (p?.username || `P${i + 1}`) : 'Waiting...'}
              </div>
              {p?.symbol && (
                <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '2px' }}>{p.symbol}</div>
              )}
            </div>
          )
        })}
      </div>

      {/* Pulsing dots */}
      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: '8px', height: '8px', borderRadius: '50%',
            background: 'var(--accent)', opacity: 0.6,
            animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
          }} />
        ))}
      </div>
      <style>{`@keyframes pulse { 0%,100%{transform:scale(1);opacity:0.4} 50%{transform:scale(1.4);opacity:1} }`}</style>
    </div>
  )
}
