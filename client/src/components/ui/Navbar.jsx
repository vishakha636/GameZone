import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function Navbar() {
  const { player, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const links = [
    { path: '/',            label: 'Lobby' },
    { path: '/leaderboard', label: 'Leaderboard' },
    { path: '/profile',     label: 'Profile' },
  ]

  return (
    <>
      <nav style={{
        background: 'rgba(8,8,18,0.92)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        padding: '0 28px',
        height: '62px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>

        {/* LEFT */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '28px' }}>

          {/* LOGO */}
          <Link to="/" style={{
            display: 'flex', alignItems: 'center', gap: '9px',
            textDecoration: 'none',
          }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '8px',
              background: 'linear-gradient(135deg,#7c3aed,#5b21b6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '16px', flexShrink: 0,
              boxShadow: '0 0 14px rgba(124,58,237,0.5)',
            }}>🎮</div>
            <span style={{
              fontSize: '19px', fontWeight: 800, letterSpacing: '-0.5px',
              background: 'linear-gradient(90deg,#a78bfa,#7c3aed)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>GameZone</span>
          </Link>

          {/* NAV LINKS */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {links.map(link => {
              const isActive = location.pathname === link.path
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  style={{
                    padding: '7px 14px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: isActive ? '#fff' : '#666688',
                    background: isActive ? 'rgba(124,58,237,0.15)' : 'transparent',
                    textDecoration: 'none',
                    position: 'relative',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => {
                    if (!isActive) {
                      e.currentTarget.style.color = '#fff'
                      e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isActive) {
                      e.currentTarget.style.color = '#666688'
                      e.currentTarget.style.background = 'transparent'
                    }
                  }}
                >
                  {link.label}
                  {isActive && (
                    <div style={{
                      position: 'absolute', bottom: 0, left: '50%',
                      transform: 'translateX(-50%)',
                      width: '20px', height: '2px', borderRadius: '2px',
                      background: 'linear-gradient(90deg,#7c3aed,#a78bfa)',
                    }} />
                  )}
                </Link>
              )
            })}
          </div>
        </div>

        {/* RIGHT */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>

          {/* COINS */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '5px 12px', borderRadius: '20px',
            background: 'rgba(255,213,0,0.08)',
            border: '1px solid rgba(255,213,0,0.2)',
            fontSize: '13px', fontWeight: 700, color: '#ffd700',
          }}>
            🪙 {player?.stats?.coins ?? 0}
          </div>

          {/* AVATAR */}
          <div style={{ position: 'relative' }}>
            <div style={{
              width: '34px', height: '34px', borderRadius: '10px',
              background: 'linear-gradient(135deg,#7c3aed,#5b21b6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '14px', fontWeight: 800, color: '#fff',
              boxShadow: '0 0 0 2px rgba(124,58,237,0.4)',
              cursor: 'pointer',
            }}>
              {player?.username?.[0]?.toUpperCase() || 'P'}
            </div>
            {/* online dot */}
            <div style={{
              position: 'absolute', bottom: '-2px', right: '-2px',
              width: '10px', height: '10px', borderRadius: '50%',
              background: '#2ecc71', border: '2px solid #080812',
            }} />
          </div>

          {/* USERNAME */}
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#e8e8f0' }}>
            {player?.username}
          </span>

          {/* LOGOUT */}
          <button
            onClick={async () => { await logout(); navigate('/login') }}
            style={{
              padding: '7px 14px', borderRadius: '9px',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.09)',
              color: '#888aaa', fontSize: '13px', fontWeight: 600,
              cursor: 'pointer', transition: 'all 0.2s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(255,77,109,0.12)'
              e.currentTarget.style.borderColor = 'rgba(255,77,109,0.3)'
              e.currentTarget.style.color = '#ff6b6b'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)'
              e.currentTarget.style.color = '#888aaa'
            }}
          >
            Logout
          </button>
        </div>
      </nav>

      {/* LIVE TICKER */}
      <div style={{
        background: 'linear-gradient(90deg,rgba(124,58,237,0.1),rgba(124,58,237,0.05))',
        borderBottom: '1px solid rgba(124,58,237,0.15)',
        padding: '7px 0', overflow: 'hidden', whiteSpace: 'nowrap',
      }}>
        <style>{`
          @keyframes marquee { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
        `}</style>
        <div style={{
          display: 'inline-flex', gap: '48px',
          animation: 'marquee 22s linear infinite',
        }}>
          {[
            '🏆 StarK beat NovaX in Ludo',
            '🎯 QuizPro won Trivia 5-0',
            '🃏 CardKing won UNO in 3 rounds',
            '🔥 ZeroCool is on a 7-win streak',
            '⚡ BladeX just hit Platinum rank',
            '🏆 StarK beat NovaX in Ludo',
            '🎯 QuizPro won Trivia 5-0',
            '🃏 CardKing won UNO in 3 rounds',
            '🔥 ZeroCool is on a 7-win streak',
            '⚡ BladeX just hit Platinum rank',
          ].map((item, i) => (
            <span key={i} style={{ fontSize: '12px', color: '#7c5cbf', fontWeight: 600 }}>
              {item}
            </span>
          ))}
        </div>
      </div>
    </>
  )
}