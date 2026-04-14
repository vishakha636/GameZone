import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import LoginPage       from './pages/LoginPage'
import RegisterPage    from './pages/RegisterPage'
import LobbyPage       from './pages/LobbyPage'
import GamePage        from './pages/GamePage'
import LeaderboardPage from './pages/LeaderboardPage'
import ProfilePage     from './pages/ProfilePage'
import LandingPage     from './pages/LandingPage'
import Navbar          from './components/ui/Navbar'

const Protected = ({ children }) => {
  const { player, loading } = useAuth()
  if (loading) return <div className="page-center"><div className="spinner" /></div>
  return player ? children : <Navigate to="/login" replace />
}

export default function App() {
  const { player } = useAuth()
  return (
    <>
      {player && <Navbar />}
      <Routes>
        <Route path="/"            element={player ? <Navigate to="/lobby" replace /> : <LandingPage />} />
        <Route path="/login"       element={player ? <Navigate to="/lobby" replace /> : <LoginPage />} />
        <Route path="/register"    element={player ? <Navigate to="/lobby" replace /> : <RegisterPage />} />
        <Route path="/lobby"       element={<Protected><LobbyPage /></Protected>} />
        <Route path="/game/:roomId" element={<Protected><GamePage /></Protected>} />
        <Route path="/leaderboard" element={<Protected><LeaderboardPage /></Protected>} />
        <Route path="/profile"     element={<Protected><ProfilePage /></Protected>} />
        <Route path="*"            element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}