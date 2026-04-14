import { useState, useEffect } from 'react'
import api from '../utils/api'
import { useAuth } from '../context/AuthContext'

export default function LeaderboardPage() {
  const { player }          = useAuth()
  const [leaders, setLeaders] = useState([])
  const [loading, setLoading] = useState(true)
  const medals               = ['🥇', '🥈', '🥉']

  useEffect(() => {
    api.get('/players/leaderboard')
      .then(res => setLeaders(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', padding: '32px 20px' }}>
      <h1 style={{ fontSize: '26px', fontWeight: 700, marginBottom: '4px' }}>🏆 Leaderboard</h1>
      <p style={{ color: 'var(--text2)', marginBottom: '28px', fontSize: '14px' }}>Top 50 players by wins</p>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px' }}><div className="spinner" /></div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {leaders.length === 0 && (
            <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text2)' }}>
              No players yet. Be the first to play!
            </div>
          )}
          {leaders.map((p, i) => {
            const isMe    = p.username === player?.username
            const winRate = p.stats.totalGames > 0
              ? Math.round((p.stats.wins / p.stats.totalGames) * 100) : 0
            return (
              <div key={p._id} style={{
                display: 'flex', alignItems: 'center', gap: '16px',
                padding: '14px 20px',
                borderBottom: i < leaders.length - 1 ? '1px solid var(--border)' : 'none',
                background: isMe ? 'rgba(124,77,255,0.07)' : 'transparent',
                transition: 'background 0.2s',
              }}>
                {/* Rank */}
                <div style={{ width: '30px', textAlign: 'center', flexShrink: 0,
                  fontSize: i < 3 ? '22px' : '14px', color: 'var(--text3)', fontWeight: 600 }}>
                  {i < 3 ? medals[i] : i + 1}
                </div>

                {/* Avatar */}
                <div style={{
                  width: '38px', height: '38px', borderRadius: '50%', flexShrink: 0,
                  background: isMe ? 'rgba(124,77,255,0.25)' : 'var(--bg3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, color: isMe ? 'var(--accent)' : 'var(--text2)',
                }}>
                  {p.username[0].toUpperCase()}
                </div>

                {/* Name & rate */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '15px' }}>
                    {p.username}
                    {isMe && <span style={{ fontSize: '12px', color: 'var(--accent)', marginLeft: '6px' }}>(You)</span>}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text2)', marginTop: '1px' }}>
                    {p.stats.totalGames} games · {winRate}% win rate
                  </div>
                </div>

                {/* W/L/D */}
                <div style={{ display: 'flex', gap: '16px' }}>
                  {[
                    { v: p.stats.wins,   c: 'var(--green)',  l: 'W' },
                    { v: p.stats.losses, c: 'var(--red)',    l: 'L' },
                    { v: p.stats.draws,  c: 'var(--yellow)', l: 'D' },
                  ].map(s => (
                    <div key={s.l} style={{ textAlign: 'center' }}>
                      <div style={{ fontWeight: 700, color: s.c, fontSize: '15px' }}>{s.v}</div>
                      <div style={{ fontSize: '10px', color: 'var(--text3)' }}>{s.l}</div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
