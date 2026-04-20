import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useMatchmaking } from '../hooks/useMatchmaking'
import GAME_CONFIG from '../utils/gameConfig'

const GAME_STYLES = {
  tictactoe: {
    gradient: 'linear-gradient(135deg,#e74c3c,#c0392b)',
    artBg: 'linear-gradient(135deg,#180808,#360e0e)',
    glow: '#e74c3c', accent: '#ff6b6b',
    badge: { label: '🔥 Hot', bg: 'linear-gradient(135deg,#ff6b6b,#ee0979)', color: '#fff' },
    art: (
      <svg width="120" height="120" viewBox="0 0 120 120">
        <rect x="18" y="18" width="84" height="84" rx="10" fill="rgba(231,76,60,.1)" stroke="rgba(231,76,60,.28)" strokeWidth="1.5"/>
        <line x1="46" y1="25" x2="46" y2="95" stroke="rgba(231,76,60,.45)" strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="74" y1="25" x2="74" y2="95" stroke="rgba(231,76,60,.45)" strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="25" y1="46" x2="95" y2="46" stroke="rgba(231,76,60,.45)" strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="25" y1="74" x2="95" y2="74" stroke="rgba(231,76,60,.45)" strokeWidth="2.5" strokeLinecap="round"/>
        <circle cx="32" cy="32" r="7" fill="none" stroke="#e74c3c" strokeWidth="2.5"/>
        <line x1="64" y1="25" x2="72" y2="39" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="72" y1="25" x2="64" y2="39" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"/>
        <circle cx="60" cy="60" r="8" fill="none" stroke="#e74c3c" strokeWidth="2.5"/>
        <line x1="26" y1="32" x2="96" y2="88" stroke="#ffd700" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="4 3" opacity=".75"/>
      </svg>
    ),
  },
  quiz: {
    gradient: 'linear-gradient(135deg,#e91e8c,#9b27af)',
    artBg: 'linear-gradient(135deg,#160512,#350c2a)',
    glow: '#e91e8c', accent: '#f06292',
    badge: null,
    art: (
      <svg width="120" height="120" viewBox="0 0 120 120">
        <ellipse cx="60" cy="55" rx="30" ry="26" fill="rgba(233,30,140,.12)" stroke="rgba(233,30,140,.3)" strokeWidth="1.5"/>
        <circle cx="60" cy="32" r="11" fill="rgba(255,214,0,.1)" stroke="rgba(255,214,0,.4)" strokeWidth="1.5"/>
        <circle cx="60" cy="32" r="5.5" fill="rgba(255,214,0,.65)"/>
        <text x="28" y="88" fill="rgba(233,30,140,.7)" fontSize="16" fontWeight="800" fontFamily="sans-serif">?</text>
        <text x="84" y="76" fill="rgba(233,30,140,.5)" fontSize="13" fontWeight="800" fontFamily="sans-serif">?</text>
        <text x="54" y="100" fill="rgba(233,30,140,.35)" fontSize="10" fontWeight="800" fontFamily="sans-serif">?</text>
      </svg>
    ),
  },
  trivia3: {
    gradient: 'linear-gradient(135deg,#f39c12,#e67e22)',
    artBg: 'linear-gradient(135deg,#161000,#362800)',
    glow: '#f39c12', accent: '#ffd54f',
    badge: { label: '✨ New', bg: 'linear-gradient(135deg,#43e97b,#38f9d7)', color: '#0a2e1a' },
    art: (
      <svg width="120" height="120" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r="40" fill="none" stroke="rgba(243,156,18,.12)" strokeWidth="2"/>
        <circle cx="60" cy="60" r="28" fill="none" stroke="rgba(243,156,18,.22)" strokeWidth="2"/>
        <circle cx="60" cy="60" r="16" fill="none" stroke="rgba(243,156,18,.38)" strokeWidth="2"/>
        <circle cx="60" cy="60" r="7" fill="rgba(243,156,18,.7)"/>
        <line x1="18" y1="18" x2="56" y2="56" stroke="#f39c12" strokeWidth="3" strokeLinecap="round"/>
        <polygon points="52,48 64,52 56,64" fill="#f39c12"/>
        <text x="82" y="28" fill="rgba(255,213,0,.8)" fontSize="15" fontFamily="sans-serif">★</text>
        <text x="90" y="82" fill="rgba(255,213,0,.5)" fontSize="11" fontFamily="sans-serif">★</text>
      </svg>
    ),
  },
  ludo: {
    gradient: 'linear-gradient(135deg,#3498db,#1565c0)',
    artBg: 'linear-gradient(135deg,#000c18,#041a38)',
    glow: '#3498db', accent: '#64b5f6',
    badge: null,
    art: (
      <svg width="120" height="120" viewBox="0 0 120 120">
        <rect x="20" y="20" width="80" height="80" rx="8" fill="rgba(52,152,219,.1)" stroke="rgba(52,152,219,.28)" strokeWidth="1.5"/>
        <rect x="20" y="20" width="37" height="37" rx="8" fill="rgba(231,76,60,.18)"/>
        <rect x="63" y="20" width="37" height="37" rx="8" fill="rgba(46,204,113,.18)"/>
        <rect x="20" y="63" width="37" height="37" rx="8" fill="rgba(241,196,15,.18)"/>
        <rect x="63" y="63" width="37" height="37" rx="8" fill="rgba(52,152,219,.18)"/>
        <circle cx="32" cy="32" r="6.5" fill="#e74c3c" stroke="rgba(255,255,255,.35)" strokeWidth="1.5"/>
        <circle cx="76" cy="32" r="6.5" fill="#2ecc71" stroke="rgba(255,255,255,.35)" strokeWidth="1.5"/>
        <circle cx="32" cy="76" r="6.5" fill="#f1c40f" stroke="rgba(255,255,255,.35)" strokeWidth="1.5"/>
        <circle cx="76" cy="76" r="6.5" fill="#3498db" stroke="rgba(255,255,255,.35)" strokeWidth="1.5"/>
      </svg>
    ),
  },
  uno: {
    gradient: 'linear-gradient(135deg,#2ecc71,#1a8a4a)',
    artBg: 'linear-gradient(135deg,#001608,#003012)',
    glow: '#2ecc71', accent: '#69f0ae',
    badge: null,
    art: (
      <svg width="120" height="120" viewBox="0 0 120 120">
        <rect x="12" y="34" width="42" height="60" rx="7" fill="#e74c3c" stroke="rgba(255,255,255,.3)" strokeWidth="1.5" transform="rotate(-15 33 64)"/>
        <rect x="28" y="28" width="42" height="60" rx="7" fill="#f1c40f" stroke="rgba(255,255,255,.3)" strokeWidth="1.5" transform="rotate(-5 49 58)"/>
        <rect x="40" y="26" width="42" height="60" rx="7" fill="#2ecc71" stroke="rgba(255,255,255,.3)" strokeWidth="1.5" transform="rotate(5 61 56)"/>
        <rect x="52" y="30" width="42" height="60" rx="7" fill="#3498db" stroke="rgba(255,255,255,.3)" strokeWidth="1.5" transform="rotate(15 73 60)"/>
        <text x="58" y="64" fill="white" fontSize="12" fontWeight="900" fontFamily="sans-serif" textAnchor="middle" transform="rotate(5 58 58)">UNO</text>
      </svg>
    ),
  },
}

const TIPS = [
  'Win 10 games to unlock exclusive profile badges!',
  'Challenge friends by sharing your lobby code.',
  'Play Trivia on weekends for 2x XP!',
  'Your win rate updates on the leaderboard weekly.',
  'UNO supports 4 wild players — fill the queue fast!',
  'Consecutive wins boost your ranking faster.',
]

const WINNERS = [
  '🏆 StarK beat NovaX in Ludo',
  '🎯 QuizPro won Trivia 5-0',
  '🃏 CardKing rules UNO again',
  '⚡ BladeX hit Platinum rank',
  '🔥 ZeroCool is on a 7-win streak',
]



export default function LobbyPage() {
  const { player }    = useAuth()
  const navigate      = useNavigate()
  const { status, roomId, gameType: matchedType, queueStatus, joinQueue, leaveQueue } = useMatchmaking()
  const [selected, setSelected]   = useState('tictactoe')
  const [hoveredCard, setHoveredCard] = useState(null)
  const [tipIdx, setTipIdx]       = useState(0)
  const [tipVisible, setTipVisible] = useState(true)
  const tipTimer = useRef(null)
  const [onlineCount, setOnlineCount] = useState(0)

  useEffect(() => {
    // Fetch immediately
    api.get('/players/online')
      .then(res => setOnlineCount(res.data.count))
      .catch(() => setOnlineCount(0))
  
    // Then every 10 seconds
    const t = setInterval(() => {
      api.get('/players/online')
        .then(res => setOnlineCount(res.data.count))
        .catch(() => setOnlineCount(0))
    }, 10000)
  
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    if (status === 'found' && roomId) {
      const t = setTimeout(() => navigate(`/game/${roomId}`), 800)
      return () => clearTimeout(t)
    }
  }, [status, roomId, navigate])

  useEffect(() => {
    tipTimer.current = setInterval(() => {
      setTipVisible(false)
      setTimeout(() => { setTipIdx(i => (i + 1) % TIPS.length); setTipVisible(true) }, 300)
    }, 4500)
    return () => clearInterval(tipTimer.current)
  }, [])

  const stats   = player?.stats || {}
  const winRate = stats.totalGames > 0 ? Math.round((stats.wins / stats.totalGames) * 100) : 0

  const statItems = [
    { label: 'Games',    value: stats.totalGames || 0, color: '#c8c8ff' },
    { label: 'Wins',     value: stats.wins   || 0,     color: '#69f0ae' },
    { label: 'Losses',   value: stats.losses || 0,     color: '#ff6b6b' },
    { label: 'Win Rate', value: `${winRate}%`,          color: '#ffd54f' },
  ]

  return (
    <div style={{
      minHeight: '100vh',
      background: '#080812',
      padding: '0 0 80px',
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      position: 'relative',
      overflowX: 'hidden',
    }}>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(22px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse  { 0%,100%{opacity:1} 50%{opacity:.45} }
        @keyframes spin   { to{transform:rotate(360deg)} }
        @keyframes glow   { 0%,100%{box-shadow:0 0 22px rgba(124,58,237,.4)} 50%{box-shadow:0 0 52px rgba(124,58,237,.85)} }
        @keyframes float  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-7px)} }
        @keyframes ping   { 0%{transform:scale(1);opacity:1} 75%,100%{transform:scale(2.4);opacity:0} }
        .game-card { transition: all .32s cubic-bezier(.4,0,.2,1) !important; }
        .game-card:hover { transform: translateY(-10px) scale(1.03) !important; }
        .stat-card { transition: transform .25s ease !important; }
        .stat-card:hover { transform: translateY(-4px) !important; }
        .find-btn:hover  { transform: scale(1.06) !important; }
        .find-btn:active { transform: scale(0.97) !important; }
        .card-art svg    { animation: float 3s ease-in-out infinite; }
        .hot-badge       { animation: pulse .9s infinite; }
      `}</style>

      {/* Ambient blobs */}
      <div style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:0, overflow:'hidden' }}>
        <div style={{ position:'absolute', top:'-10%', left:'-5%',  width:'500px', height:'500px', borderRadius:'50%', background:'radial-gradient(circle,rgba(124,58,237,.13) 0%,transparent 70%)' }}/>
        <div style={{ position:'absolute', top:'30%',  right:'-8%', width:'400px', height:'400px', borderRadius:'50%', background:'radial-gradient(circle,rgba(46,204,113,.07) 0%,transparent 70%)' }}/>
        <div style={{ position:'absolute', bottom:'-5%',left:'30%', width:'600px', height:'300px', borderRadius:'50%', background:'radial-gradient(circle,rgba(52,152,219,.07) 0%,transparent 70%)' }}/>
      </div>

      <div style={{ maxWidth:'1060px', margin:'0 auto', padding:'36px 24px', position:'relative', zIndex:1 }}>

        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', gap:'14px', marginBottom:'32px', animation:'fadeUp .5s ease both' }}>
          <div style={{
            width:'46px', height:'46px', borderRadius:'12px',
            background:'linear-gradient(135deg,#7c3aed,#5b21b6)',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:'22px', fontWeight:800, color:'#fff',
            boxShadow:'0 4px 20px rgba(124,58,237,.5)',
          }}>
            {player?.username?.[0]?.toUpperCase() || 'P'}
          </div>
          <div>
            <h1 style={{ fontSize:'clamp(1.3rem,3vw,1.85rem)', fontWeight:800, letterSpacing:'-0.5px', color:'#f0f0ff', margin:0 }}>
              Welcome back,{' '}
              <span style={{ background:'linear-gradient(90deg,#a78bfa,#7c3aed)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
                {player?.username}
              </span>{' '}👋
            </h1>
            <p style={{ color:'#555577', margin:'2px 0 0', fontSize:'13px' }}>Choose your battle. Find your match.</p>
          </div>
          <div style={{
            display:'flex', alignItems:'center', gap:'7px', marginLeft:'auto',
            fontSize:'12px', color:'#4ecdc4', fontWeight:600,
            padding:'5px 13px', borderRadius:'30px',
            border:'1px solid rgba(78,205,196,.2)', background:'rgba(78,205,196,.06)',
          }}>
            <div style={{ position:'relative', width:'7px', height:'7px' }}>
              <div style={{ position:'absolute', inset:0, borderRadius:'50%', background:'#4ecdc4', animation:'ping 1.4s infinite' }}/>
              <div style={{ position:'absolute', inset:0, borderRadius:'50%', background:'#4ecdc4' }}/>
            </div>
            {onlineCount} online
          </div>
        </div>

        {/* Stats */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'14px', marginBottom:'38px', animation:'fadeUp .5s .1s ease both' }}>
          {statItems.map(s => (
            <div key={s.label} className="stat-card" style={{
              background:'rgba(255,255,255,.03)', border:'1px solid rgba(255,255,255,.06)',
              borderRadius:'16px', padding:'20px 16px', textAlign:'center', cursor:'default',
            }}>
              <div style={{ fontSize:'2rem', fontWeight:800, color:s.color, lineHeight:1 }}>{s.value}</div>
              <div style={{ fontSize:'11px', color:'#444466', marginTop:'6px', fontWeight:600, textTransform:'uppercase', letterSpacing:'.5px' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Section heading */}
        <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'18px', animation:'fadeUp .5s .18s ease both' }}>
          <div style={{ width:'4px', height:'22px', borderRadius:'2px', background:'linear-gradient(180deg,#7c3aed,#a78bfa)' }}/>
          <h2 style={{ fontSize:'12px', fontWeight:700, color:'#6655aa', letterSpacing:'2px', textTransform:'uppercase', margin:0 }}>Select Game</h2>
          <div style={{ flex:1, height:'1px', background:'rgba(255,255,255,.04)' }}/>
          <span style={{ fontSize:'12px', color:'#333355' }}>{Object.keys(GAME_CONFIG).length} available</span>
        </div>

        {/* Game Cards */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(195px,1fr))', gap:'16px', marginBottom:'28px', animation:'fadeUp .5s .22s ease both' }}>
          {Object.entries(GAME_CONFIG).map(([id, cfg]) => {
            const qs          = queueStatus[id] || {}
            const inQueue     = qs.inQueue || 0
            const isSelected  = selected === id
            const gs          = GAME_STYLES[id] || GAME_STYLES.tictactoe
            const isSearching = status === 'searching' && matchedType === id

            return (
              <button
                key={id}
                className="game-card"
                onClick={() => setSelected(id)}
                onMouseEnter={() => setHoveredCard(id)}
                onMouseLeave={() => setHoveredCard(null)}
                disabled={status === 'searching'}
                style={{
                  background: isSelected ? 'rgba(124,58,237,.08)' : hoveredCard === id ? 'rgba(255,255,255,.04)' : 'rgba(255,255,255,.02)',
                  border: `2px solid ${isSelected ? 'rgba(124,58,237,.65)' : 'rgba(255,255,255,.06)'}`,
                  borderRadius:'20px', padding:0,
                  cursor: status === 'searching' ? 'not-allowed' : 'pointer',
                  textAlign:'left', color:'#e8e8f0',
                  position:'relative', overflow:'hidden',
                  boxShadow: isSelected ? `0 0 32px ${gs.glow}22` : 'none',
                }}
              >
                {isSelected && <div style={{ position:'absolute', top:0, left:0, right:0, height:'3px', background:gs.gradient }}/>}

                {gs.badge && (
                  <div className={gs.badge.label.includes('🔥') ? 'hot-badge' : ''} style={{
                    position:'absolute', top:'10px', right:'10px', zIndex:5,
                    fontSize:'10px', fontWeight:800, padding:'3px 9px', borderRadius:'20px',
                    textTransform:'uppercase', letterSpacing:'.5px',
                    background: gs.badge.bg, color: gs.badge.color,
                  }}>
                    {gs.badge.label}
                  </div>
                )}

                {isSearching && (
                  <div style={{
                    position:'absolute', top:'12px', right:'12px',
                    width:'8px', height:'8px', borderRadius:'50%',
                    background:'#2ecc71', animation:'pulse 1s infinite',
                    boxShadow:'0 0 8px #2ecc71', zIndex:5,
                  }}/>
                )}

                <div className="card-art" style={{
                  width:'100%', height:'155px',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  background: gs.artBg, position:'relative', overflow:'hidden',
                }}>
                  {gs.art}
                  <div style={{
                    position:'absolute', bottom:'8px', right:'10px',
                    fontSize:'11px', fontWeight:700,
                    color:`${gs.glow}ee`, background:`${gs.glow}18`,
                    padding:'2px 8px', borderRadius:'8px',
                  }}>
                    {cfg.players}P
                  </div>
                </div>

                <div style={{ padding:'15px' }}>
                  <div style={{ fontWeight:700, fontSize:'14px', marginBottom:'2px', color: isSelected ? '#fff' : '#cccce8' }}>
                    {cfg.label}
                  </div>
                  <div style={{ fontSize:'12px', color:'#555577' }}>{cfg.desc}</div>
                  <div style={{
                    display:'inline-flex', alignItems:'center', gap:'5px',
                    fontSize:'11px', fontWeight:600,
                    color: inQueue > 0 ? gs.accent : '#444466',
                    padding:'4px 10px', borderRadius:'100px',
                    background: inQueue > 0 ? `${gs.glow}15` : 'rgba(255,255,255,.04)',
                    border: `1px solid ${inQueue > 0 ? `${gs.glow}30` : 'rgba(255,255,255,.06)'}`,
                    marginTop:'10px',
                  }}>
                    <div style={{
                      width:'5px', height:'5px', borderRadius:'50%',
                      background: inQueue > 0 ? gs.accent : '#333355',
                      animation: inQueue > 0 ? 'pulse 1s infinite' : 'none',
                    }}/>
                    {inQueue}/{cfg.players} in queue
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        {/* Matchmaking Panel */}
        <div style={{
          background:'rgba(255,255,255,.025)', border:'1px solid rgba(255,255,255,.07)',
          borderRadius:'22px', padding:'36px', textAlign:'center',
          animation:'fadeUp .5s .32s ease both', position:'relative', overflow:'hidden',
        }}>
          <div style={{
            position:'absolute', bottom:'-60px', left:'50%', transform:'translateX(-50%)',
            width:'400px', height:'140px', borderRadius:'50%',
            background:'radial-gradient(ellipse,rgba(124,58,237,.1) 0%,transparent 70%)',
            pointerEvents:'none',
          }}/>

          {/* Tip ticker */}
          <div style={{ display:'flex', alignItems:'center', gap:'8px', justifyContent:'center', marginBottom:'18px' }}>
            <span style={{ fontSize:'11px', fontWeight:700, color:'#7c3aed', textTransform:'uppercase', letterSpacing:'1px' }}>💡 Tip</span>
            <span style={{ fontSize:'12px', color:'#555577', opacity: tipVisible ? 1 : 0, transition:'opacity .3s ease' }}>
              {TIPS[tipIdx]}
            </span>
          </div>

          {status === 'idle' && (
            <div style={{ position:'relative', zIndex:1 }}>
              <p style={{ color:'#555577', marginBottom:'20px', fontSize:'14px' }}>
                Playing{' '}
                <strong style={{ color:'#a78bfa', background:'rgba(124,58,237,.14)', padding:'2px 10px', borderRadius:'6px', border:'1px solid rgba(124,58,237,.28)' }}>
                  {GAME_CONFIG[selected]?.label}
                </strong>
                {' '}— needs {GAME_CONFIG[selected]?.players} players
              </p>
              <button
                className="find-btn"
                onClick={() => joinQueue(selected)}
                style={{
                  padding:'15px 52px', borderRadius:'13px',
                  background:'linear-gradient(135deg,#7c3aed,#5b21b6)',
                  color:'#fff', fontSize:'16px', fontWeight:700,
                  border:'none', cursor:'pointer',
                  boxShadow:'0 4px 30px rgba(124,58,237,.5)',
                  transition:'all .2s', letterSpacing:'.3px',
                  animation:'glow 3s ease infinite',
                }}
              >
                🔍 Find Match
              </button>
            </div>
          )}

          {status === 'searching' && (
            <div style={{ position:'relative', zIndex:1 }}>
              <div style={{ position:'relative', width:'64px', height:'64px', margin:'0 auto 20px' }}>
                <div style={{ position:'absolute', inset:0, borderRadius:'50%', border:'3px solid rgba(124,58,237,.15)', borderTopColor:'#7c3aed', animation:'spin 1s linear infinite' }}/>
                <div style={{ position:'absolute', inset:'8px', borderRadius:'50%', border:'3px solid rgba(167,139,250,.1)', borderTopColor:'#a78bfa', animation:'spin .7s linear infinite reverse' }}/>
                <div style={{ position:'absolute', inset:'18px', borderRadius:'50%', background:'rgba(124,58,237,.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'14px' }}>🔍</div>
              </div>
              <p style={{ fontWeight:700, fontSize:'18px', marginBottom:'6px', color:'#e8e8f0' }}>
                Searching for {GAME_CONFIG[matchedType]?.players - 1} opponent{GAME_CONFIG[matchedType]?.players > 2 ? 's' : ''}...
              </p>
              <p style={{ color:'#555577', fontSize:'13px', marginBottom:'24px' }}>
                {GAME_CONFIG[matchedType]?.label} · {queueStatus[matchedType]?.inQueue || 1}/{GAME_CONFIG[matchedType]?.players} joined
              </p>
              <button onClick={leaveQueue} style={{
                padding:'10px 28px', borderRadius:'10px',
                background:'rgba(255,255,255,.05)', border:'1px solid rgba(255,255,255,.1)',
                color:'#888899', fontSize:'14px', fontWeight:600, cursor:'pointer',
              }}>
                Cancel
              </button>
            </div>
          )}

          {status === 'found' && (
            <div style={{ position:'relative', zIndex:1 }}>
              <div style={{ fontSize:'56px', marginBottom:'14px', animation:'fadeUp .4s ease both' }}>🎉</div>
              <p style={{ fontWeight:800, fontSize:'24px', marginBottom:'6px', background:'linear-gradient(90deg,#69f0ae,#2ecc71)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
                Match Found!
              </p>
              <p style={{ color:'#555577', fontSize:'14px' }}>Entering game room...</p>
            </div>
          )}

          {/* Recent winners */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'12px', flexWrap:'wrap', marginTop:'26px', paddingTop:'20px', borderTop:'1px solid rgba(255,255,255,.05)' }}>
            <span style={{ fontSize:'11px', color:'#333355', fontWeight:600, textTransform:'uppercase', letterSpacing:'1px' }}>Recent</span>
            {WINNERS.map((w, i) => (
              <span key={i} style={{ fontSize:'12px', color:'#555577', background:'rgba(255,255,255,.04)', padding:'5px 13px', borderRadius:'20px', border:'1px solid rgba(255,255,255,.07)' }}>
                {w}
              </span>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}