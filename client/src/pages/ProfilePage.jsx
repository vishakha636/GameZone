import { useState, useEffect } from 'react'
import api from '../utils/api'
import { useAuth } from '../context/AuthContext'

const GAME_LABELS = {
  tictactoe: 'Tic Tac Toe',
  quiz:      'Quiz Battle',
  trivia3:   '3P Trivia',
  ludo:      'Ludo',
  uno:       'UNO',
}

const GAME_ICONS = {
  tictactoe: '⭕',
  quiz:      '🧠',
  trivia3:   '🎯',
  ludo:      '🎲',
  uno:       '🃏',
}

const RANK_TIERS = [
  { label: 'Bronze',   min: 0,   max: 4,   color: '#cd7f32', bg: 'rgba(205,127,50,.15)',  icon: '🥉' },
  { label: 'Silver',   min: 5,   max: 14,  color: '#c0c0c0', bg: 'rgba(192,192,192,.15)', icon: '🥈' },
  { label: 'Gold',     min: 15,  max: 29,  color: '#ffd700', bg: 'rgba(255,215,0,.15)',   icon: '🥇' },
  { label: 'Platinum', min: 30,  max: 59,  color: '#4ecdc4', bg: 'rgba(78,205,196,.15)',  icon: '💎' },
  { label: 'Diamond',  min: 60,  max: 99,  color: '#a78bfa', bg: 'rgba(167,139,250,.15)', icon: '💠' },
  { label: 'Legend',   min: 100, max: Infinity, color: '#ff6b6b', bg: 'rgba(255,107,107,.15)', icon: '👑' },
]

const getRank = (wins) => RANK_TIERS.find(r => wins >= r.min && wins <= r.max) || RANK_TIERS[0]

const ACHIEVEMENTS = [
  { id: 'first_win',   icon: '🎯', label: 'First Blood',    desc: 'Win your first game',          check: (s) => s.wins >= 1 },
  { id: 'wins5',       icon: '🔥', label: 'On Fire',        desc: 'Win 5 games',                  check: (s) => s.wins >= 5 },
  { id: 'wins25',      icon: '⚡', label: 'Unstoppable',    desc: 'Win 25 games',                 check: (s) => s.wins >= 25 },
  { id: 'wins100',     icon: '👑', label: 'Legend',         desc: 'Win 100 games',                check: (s) => s.wins >= 100 },
  { id: 'played10',   icon: '🎮', label: 'Dedicated',      desc: 'Play 10 games',                check: (s) => s.totalGames >= 10 },
  { id: 'played50',   icon: '🏟️', label: 'Veteran',        desc: 'Play 50 games',                check: (s) => s.totalGames >= 50 },
  { id: 'winrate70',  icon: '🎖️', label: 'Sharp Shooter',  desc: 'Achieve 70%+ win rate',        check: (s) => s.totalGames >= 5 && Math.round((s.wins/s.totalGames)*100) >= 70 },
  { id: 'nodraw',     icon: '⚔️', label: 'No Mercy',       desc: 'Win 10 games with 0 draws',    check: (s) => s.wins >= 10 && s.draws === 0 },
]

export default function ProfilePage() {
  const { player }            = useAuth()
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [copied, setCopied]   = useState(false)

  useEffect(() => {
    api.get('/matches')
      .then(res => setMatches(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const stats   = player?.stats || {}
  const wins    = stats.wins || 0
  const losses  = stats.losses || 0
  const draws   = stats.draws || 0
  const total   = stats.totalGames || 0
  const winRate = total > 0 ? Math.round((wins / total) * 100) : 0
  const rank    = getRank(wins)

  // Progress to next rank
  const nextRank   = RANK_TIERS[RANK_TIERS.indexOf(rank) + 1]
  const rankProgress = nextRank
    ? Math.round(((wins - rank.min) / (nextRank.min - rank.min)) * 100)
    : 100

  // Game type breakdown
  const gameBreakdown = matches.reduce((acc, m) => {
    const gt = m.gameType || 'unknown'
    if (!acc[gt]) acc[gt] = { played: 0, won: 0 }
    acc[gt].played++
    if (m.winner?.toString() === player?._id?.toString()) acc[gt].won++
    return acc
  }, {})

  const handleCopyId = () => {
    navigator.clipboard.writeText(player?._id || '')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const tabs = ['overview', 'matches', 'achievements', 'stats']

  return (
    <div style={{
      minHeight: '100vh',
      background: '#080812',
      padding: '0 0 80px',
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      color: '#e8e8f0',
    }}>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }
        .tab-btn:hover { background: rgba(124,58,237,.12) !important; color: #a78bfa !important; }
        .match-row:hover { background: rgba(255,255,255,.04) !important; }
        .ach-card:hover { transform: translateY(-3px) !important; border-color: rgba(124,58,237,.4) !important; }
        .ach-card { transition: all .2s ease !important; }
        .copy-btn:hover { background: rgba(124,58,237,.2) !important; }
      `}</style>

      {/* ── Banner + Avatar ── */}
      <div style={{ position: 'relative', height: '180px', overflow: 'hidden' }}>
        {/* Banner */}
        <div style={{
          position: 'absolute', inset: 0,
          background: `
  radial-gradient(circle at 30% 20%, rgba(124,58,237,0.25), transparent 50%),
  radial-gradient(circle at 80% 40%, rgba(78,205,196,0.15), transparent 60%),
  linear-gradient(135deg, #080812 0%, #0d0d1f 100%)
`,
        }}>
          <div style={{
  position: 'absolute',
  top: '-50px',
  left: '50%',
  transform: 'translateX(-50%)',
  width: '500px',
  height: '200px',
  background: 'radial-gradient(ellipse, rgba(124,58,237,0.35), transparent 70%)',
  filter: 'blur(40px)',
}} />
          
          <div style={{
            position: 'absolute', top: '20px', right: '80px',
            fontSize: '80px', opacity: 0.06, userSelect: 'none',
          }}>🎮</div>
          <div style={{
            position: 'absolute', bottom: '-10px', left: '40%',
            width: '300px', height: '150px',
            background: 'radial-gradient(ellipse, rgba(124,58,237,.25) 0%, transparent 70%)',
          }}/>
        </div>

        {/* Rank badge on banner */}
        <div style={{
          position: 'absolute', top: '20px', right: '24px',
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '8px 16px', borderRadius: '30px',
          background: rank.bg, border: `1px solid ${rank.color}44`,
        }}>
          <span style={{ fontSize: '20px' }}>{rank.icon}</span>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 800, color: rank.color }}>{rank.label}</div>
            <div style={{ fontSize: '10px', color: `${rank.color}99` }}>{wins} wins</div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '860px', margin: '0 auto', padding: '0 24px' }}>

        {/* ── Avatar row ── */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '20px', marginTop: '-52px', marginBottom: '24px', position: 'relative', zIndex: 10 }}>
          {/* Avatar */}
          <div style={{
            width: '96px', height: '96px', borderRadius: '50%',
            background: 'linear-gradient(135deg,#7c3aed,#a78bfa)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '38px', fontWeight: 800, color: '#fff',
            border: '4px solid #080812',
            boxShadow: '0 0 25px rgba(124,58,237,.6), 0 0 60px rgba(124,58,237,.3)',
            flexShrink: 0,
            backdropFilter: 'blur(10px)',
          }}>
            {player?.username?.[0]?.toUpperCase()}
          </div>

          <div style={{ flex: 1, paddingBottom: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#f0f0ff', margin: 0 }}>
                {player?.username}
              </h1>
              <span style={{
                fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '20px',
                background: 'rgba(0,230,118,.15)', color: '#00e676',
                border: '1px solid rgba(0,230,118,.3)',
              }}>● Online</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
              <span style={{ fontSize: '12px', color: '#444466' }}>{player?.email}</span>
              <button
                className="copy-btn"
                onClick={handleCopyId}
                style={{
                  fontSize: '11px', color: '#555577', background: 'transparent',
                  border: '1px solid rgba(255,255,255,.08)', borderRadius: '6px',
                  padding: '2px 8px', cursor: 'pointer', transition: 'all .2s',
                }}
              >
                {copied ? '✅ Copied' : '🔗 Copy ID'}
              </button>
            </div>
          </div>

          {/* Rank progress */}
          {nextRank && (
            <div style={{
              padding: '12px 16px', borderRadius: '12px',
              background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)',
              minWidth: '180px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '6px' }}>
                <span style={{ color: rank.color, fontWeight: 700 }}>{rank.icon} {rank.label}</span>
                <span style={{ color: '#444466' }}>→ {nextRank.icon} {nextRank.label}</span>
              </div>
              <div style={{ height: '6px', background: 'rgba(255,255,255,.06)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: '4px',
                  background: `linear-gradient(90deg, ${rank.color}, ${nextRank.color})`,
                  width: `${rankProgress}%`, transition: 'width 1s ease',
                }}/>
              </div>
              <div style={{ fontSize: '10px', color: '#333355', marginTop: '4px', textAlign: 'right' }}>
                {wins - rank.min} / {nextRank.min - rank.min} wins
              </div>
            </div>
          )}
        </div>

        {/* ── Quick stats row ── */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px',
          marginBottom: '28px', animation: 'fadeUp .5s ease both',
        }}>
          {[
            { label: 'Games Played', value: total,      color: '#c8c8ff', icon: '🎮' },
            { label: 'Wins',         value: wins,        color: '#69f0ae', icon: '🏆' },
            { label: 'Losses',       value: losses,      color: '#ff6b6b', icon: '💔' },
            { label: 'Win Rate',     value: `${winRate}%`, color: '#ffd54f', icon: '📊' },
          ].map(s => (
            <div key={s.label} style={{
              background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.06)',
              borderRadius: '16px', padding: '18px 16px', textAlign: 'center',
              transition: 'transform .2s',
            }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'none'}
            >
              <div style={{ fontSize: '22px', marginBottom: '6px' }}>{s.icon}</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: '11px', color: '#444466', marginTop: '5px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.5px' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── Tabs ── */}
        <div style={{
          display: 'flex', gap: '4px', marginBottom: '24px',
          background: 'rgba(255,255,255,.03)', borderRadius: '12px', padding: '4px',
          border: '1px solid rgba(255,255,255,.06)',
        }}>
          {tabs.map(t => (
            <button
              key={t}
              className="tab-btn"
              onClick={() => setActiveTab(t)}
              style={{
                flex: 1, padding: '8px 12px', borderRadius: '9px', border: 'none',
                background: activeTab === t ? 'rgba(124,58,237,.25)' : 'transparent',
                color: activeTab === t ? '#a78bfa' : '#444466',
                fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                textTransform: 'capitalize', transition: 'all .2s',
                borderBottom: activeTab === t ? '2px solid #7c3aed' : '2px solid transparent',
              }}
            >
              {t === 'overview' ? '📋 Overview' :
               t === 'matches' ? '⚔️ Matches' :
               t === 'achievements' ? '🏅 Achievements' : '📊 Stats'}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW TAB ── */}
        {activeTab === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', animation: 'fadeUp .4s ease both' }}>

            {/* Win/Loss/Draw donut visual */}
            <div style={{
              background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.06)',
              borderRadius: '16px', padding: '24px',
            }}>
              <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#555577', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '20px' }}>
                🎯 Game Results
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[
                  { label: 'Wins',   value: wins,   color: '#69f0ae', pct: total > 0 ? Math.round((wins/total)*100) : 0 },
                  { label: 'Losses', value: losses, color: '#ff6b6b', pct: total > 0 ? Math.round((losses/total)*100) : 0 },
                  { label: 'Draws',  value: draws,  color: '#ffd54f', pct: total > 0 ? Math.round((draws/total)*100) : 0 },
                ].map(r => (
                  <div key={r.label}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                      <span style={{ fontSize: '13px', color: '#777799' }}>{r.label}</span>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: r.color }}>{r.value} ({r.pct}%)</span>
                    </div>
                    <div style={{ height: '6px', background: 'rgba(255,255,255,.06)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', borderRadius: '4px', background: r.color,
                        width: `${r.pct}%`, transition: 'width 1s ease',
                        opacity: 0.85,
                      }}/>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Game breakdown */}
            <div style={{
              background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.06)',
              borderRadius: '16px', padding: '24px',
            }}>
              <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#555577', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '20px' }}>
                🎮 By Game Type
              </h3>
              {Object.keys(gameBreakdown).length === 0 ? (
                <p style={{ color: '#333355', fontSize: '13px', textAlign: 'center', marginTop: '20px' }}>No games yet</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {Object.entries(gameBreakdown).map(([gt, data]) => (
                    <div key={gt} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '18px', width: '24px' }}>{GAME_ICONS[gt] || '🎮'}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                          <span style={{ fontSize: '12px', color: '#777799' }}>{GAME_LABELS[gt] || gt}</span>
                          <span style={{ fontSize: '12px', color: '#555577' }}>{data.won}W / {data.played - data.won}L</span>
                        </div>
                        <div style={{ height: '5px', background: 'rgba(255,255,255,.06)', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{
                            height: '100%', borderRadius: '4px',
                            background: 'linear-gradient(90deg,#7c3aed,#a78bfa)',
                            width: `${data.played > 0 ? Math.round((data.won/data.played)*100) : 0}%`,
                          }}/>
                        </div>
                      </div>
                      <span style={{ fontSize: '11px', color: '#444466', minWidth: '32px', textAlign: 'right' }}>
                        {data.played > 0 ? Math.round((data.won/data.played)*100) : 0}%
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent activity */}
            <div style={{
              gridColumn: '1 / -1',
              background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.06)',
              borderRadius: '16px', padding: '24px',
            }}>
              <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#555577', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>
                🕐 Recent Activity
              </h3>
              {loading ? (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  <div style={{ width: '28px', height: '28px', border: '3px solid rgba(124,58,237,.2)', borderTopColor: '#7c3aed', borderRadius: '50%', animation: 'pulse 1s infinite', margin: 'auto' }}/>
                </div>
              ) : matches.slice(0, 4).length === 0 ? (
                <p style={{ color: '#333355', fontSize: '13px', textAlign: 'center' }}>No recent activity</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {matches.slice(0, 4).map(m => {
                    const isWinner = m.winner?.toString() === player?._id?.toString()
                    const result   = m.isDraw ? 'Draw' : isWinner ? 'Win' : 'Loss'
                    const rColor   = m.isDraw ? '#ffd54f' : isWinner ? '#69f0ae' : '#ff6b6b'
                    const opp      = m.players?.find(p => p.username !== player?.username)
                    return (
                      <div key={m._id} className="match-row" style={{
                        display: 'flex', alignItems: 'center', gap: '12px',
                        padding: '10px 12px', borderRadius: '10px',
                        background: 'rgba(255,255,255,.02)', transition: 'background .2s',
                      }}>
                        <span style={{ fontSize: '20px' }}>{GAME_ICONS[m.gameType] || '🎮'}</span>
                        <div style={{ flex: 1 }}>
                          <span style={{ fontSize: '13px', color: '#cccce8' }}>{GAME_LABELS[m.gameType]}</span>
                          <span style={{ fontSize: '12px', color: '#444466', marginLeft: '8px' }}>vs {opp?.username || 'Unknown'}</span>
                        </div>
                        <span style={{ fontSize: '11px', color: '#333355' }}>{new Date(m.createdAt).toLocaleDateString()}</span>
                        <span style={{
                          fontSize: '12px', fontWeight: 700, color: rColor,
                          background: `${rColor}18`, padding: '3px 10px', borderRadius: '20px',
                        }}>{result}</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── MATCHES TAB ── */}
        {activeTab === 'matches' && (
          <div style={{ animation: 'fadeUp .4s ease both' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#cccce8' }}>Match History</h2>
              <span style={{ fontSize: '12px', color: '#444466' }}>{matches.length} matches</span>
            </div>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '60px' }}>
                <div style={{ width: '36px', height: '36px', border: '3px solid rgba(124,58,237,.2)', borderTopColor: '#7c3aed', borderRadius: '50%', animation: 'pulse 1s infinite', margin: 'auto' }}/>
              </div>
            ) : matches.length === 0 ? (
              <div style={{
                textAlign: 'center', padding: '60px 20px',
                background: 'rgba(255,255,255,.02)', borderRadius: '16px',
                border: '1px solid rgba(255,255,255,.06)',
              }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>🎮</div>
                <p style={{ color: '#555577', fontSize: '14px' }}>No matches yet. Go find a game!</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {matches.map((m, idx) => {
                  const isWinner = m.winner?.toString() === player?._id?.toString()
                  const result   = m.isDraw ? 'Draw' : isWinner ? 'Win' : 'Loss'
                  const rColor   = m.isDraw ? '#ffd54f' : isWinner ? '#69f0ae' : '#ff6b6b'
                  const opponents = m.players?.filter(p => p.username !== player?.username) || []
                  return (
                    <div key={m._id} className="match-row" style={{
                      display: 'flex', alignItems: 'center', gap: '14px',
                      padding: '14px 16px', borderRadius: '12px',
                      background: 'rgba(255,255,255,.025)',
                      border: '1px solid rgba(255,255,255,.05)',
                      transition: 'background .2s',
                    }}>
                      <div style={{
                        width: '42px', height: '42px', borderRadius: '10px', flexShrink: 0,
                        background: `${rColor}15`, border: `1px solid ${rColor}30`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px',
                      }}>
                        {GAME_ICONS[m.gameType] || '🎮'}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: '14px', color: '#cccce8' }}>
                          {GAME_LABELS[m.gameType] || m.gameType}
                          <span style={{ fontSize: '11px', color: '#444466', marginLeft: '8px', fontWeight: 400 }}>
                            {m.maxPlayers}P room
                          </span>
                        </div>
                        <div style={{ fontSize: '12px', color: '#444466', marginTop: '2px' }}>
                          vs {opponents.map(o => o.username).join(', ') || 'Unknown'}
                          <span style={{ margin: '0 6px', color: '#2a2a44' }}>·</span>
                          {new Date(m.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{
                          fontWeight: 700, fontSize: '13px', color: rColor,
                          background: `${rColor}18`, padding: '5px 14px', borderRadius: '20px',
                          border: `1px solid ${rColor}30`,
                        }}>
                          {result}
                        </span>
                        <div style={{ fontSize: '10px', color: '#333355', marginTop: '4px' }}>
                          #{matches.length - idx}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ── ACHIEVEMENTS TAB ── */}
        {activeTab === 'achievements' && (
          <div style={{ animation: 'fadeUp .4s ease both' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#cccce8' }}>Achievements</h2>
              <span style={{ fontSize: '12px', color: '#444466' }}>
                {ACHIEVEMENTS.filter(a => a.check(stats)).length}/{ACHIEVEMENTS.length} unlocked
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: '12px' }}>
              {ACHIEVEMENTS.map(a => {
                const unlocked = a.check(stats)
                return (
                  <div key={a.id} className="ach-card" style={{
                    padding: '20px 16px', borderRadius: '14px', textAlign: 'center',
                    background: unlocked ? 'rgba(124,58,237,.1)' : 'rgba(255,255,255,.02)',
                    border: `1px solid ${unlocked ? 'rgba(124,58,237,.35)' : 'rgba(255,255,255,.05)'}`,
                    opacity: unlocked ? 1 : 0.45,
                    position: 'relative', overflow: 'hidden',
                  }}>
                    {unlocked && (
                      <div style={{
                        position: 'absolute', top: '8px', right: '8px',
                        width: '8px', height: '8px', borderRadius: '50%',
                        background: '#69f0ae', boxShadow: '0 0 6px #69f0ae',
                      }}/>
                    )}
                    <div style={{ fontSize: '36px', marginBottom: '10px', filter: unlocked ? 'none' : 'grayscale(1)' }}>
                      {a.icon}
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '13px', color: unlocked ? '#e8e8f0' : '#444466', marginBottom: '4px' }}>
                      {a.label}
                    </div>
                    <div style={{ fontSize: '11px', color: '#444466', lineHeight: 1.4 }}>
                      {a.desc}
                    </div>
                    {unlocked && (
                      <div style={{
                        marginTop: '10px', fontSize: '11px', fontWeight: 700,
                        color: '#69f0ae', background: 'rgba(0,230,118,.1)',
                        padding: '3px 10px', borderRadius: '20px', display: 'inline-block',
                      }}>
                        ✓ Unlocked
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── STATS TAB ── */}
        {activeTab === 'stats' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', animation: 'fadeUp .4s ease both' }}>

            {/* Detailed numbers */}
            <div style={{
              background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.06)',
              borderRadius: '16px', padding: '24px',
            }}>
              <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#555577', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '18px' }}>
                📈 Detailed Stats
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                {[
                  { label: 'Total Games',  value: total },
                  { label: 'Wins',         value: wins },
                  { label: 'Losses',       value: losses },
                  { label: 'Draws',        value: draws },
                  { label: 'Win Rate',     value: `${winRate}%` },
                  { label: 'Total Score',  value: stats.totalScore || 0 },
                  { label: 'Current Rank', value: `${rank.icon} ${rank.label}` },
                ].map((r, i) => (
                  <div key={r.label} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '11px 0',
                    borderBottom: i < 6 ? '1px solid rgba(255,255,255,.04)' : 'none',
                  }}>
                    <span style={{ fontSize: '13px', color: '#555577' }}>{r.label}</span>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#cccce8' }}>{r.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Streak & info */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Rank card */}
              <div style={{
                background: rank.bg, border: `1px solid ${rank.color}33`,
                borderRadius: '16px', padding: '24px', textAlign: 'center',
              }}>
                <div style={{ fontSize: '52px', marginBottom: '8px' }}>{rank.icon}</div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: rank.color }}>{rank.label}</div>
                <div style={{ fontSize: '12px', color: `${rank.color}99`, marginTop: '4px' }}>
                  {wins} wins total
                </div>
                {nextRank && (
                  <div style={{ marginTop: '14px' }}>
                    <div style={{ fontSize: '11px', color: `${rank.color}77`, marginBottom: '6px' }}>
                      {nextRank.min - wins} wins to {nextRank.label}
                    </div>
                    <div style={{ height: '6px', background: 'rgba(0,0,0,.2)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', borderRadius: '4px', background: rank.color,
                        width: `${rankProgress}%`,
                      }}/>
                    </div>
                  </div>
                )}
              </div>

              {/* Account info */}
              <div style={{
                background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.06)',
                borderRadius: '16px', padding: '20px',
              }}>
                <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#555577', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '14px' }}>
                  🪪 Account
                </h3>
                {[
                  { label: 'Username', value: player?.username },
                  { label: 'Email',    value: player?.email },
                  { label: 'Status',   value: '● Online' },
                ].map(r => (
                  <div key={r.label} style={{
                    display: 'flex', justifyContent: 'space-between',
                    padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,.04)',
                    fontSize: '13px',
                  }}>
                    <span style={{ color: '#555577' }}>{r.label}</span>
                    <span style={{ color: r.label === 'Status' ? '#69f0ae' : '#cccce8', fontWeight: 600 }}>{r.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}