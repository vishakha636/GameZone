import { useState, useEffect } from 'react'
import { getSocket } from '../utils/socket'

export const useMatchmaking = () => {
  const [status, setStatus]       = useState('idle')   // idle|searching|found
  const [roomId, setRoomId]       = useState(null)
  const [gameType, setGameType]   = useState(null)
  const [queueStatus, setQueueStatus] = useState({})

  useEffect(() => {
    const socket = getSocket()
    if (!socket) return

    socket.on('matchmaking:queued',  ({ gameType: gt }) => { setStatus('searching'); setGameType(gt) })
    socket.on('match:found',         ({ roomId: rid, gameType: gt }) => { setRoomId(rid); setGameType(gt); setStatus('found') })
    socket.on('matchmaking:matched', ({ roomId: rid }) => { setRoomId(rid); setStatus('found') })
    socket.on('matchmaking:left',    () => setStatus('idle'))
    socket.on('queue:status',        (s) => setQueueStatus(s))

    return () => {
      socket.off('matchmaking:queued')
      socket.off('match:found')
      socket.off('matchmaking:matched')
      socket.off('matchmaking:left')
      socket.off('queue:status')
    }
  }, [])

  const joinQueue = (gt = 'tictactoe') => {
    const socket = getSocket()
    if (!socket) return
    setGameType(gt)
    socket.emit('matchmaking:join', { gameType: gt })
  }

  const leaveQueue = () => {
    const socket = getSocket()
    if (!socket) return
    socket.emit('matchmaking:leave', { gameType })
    setStatus('idle')
    setRoomId(null)
  }

  const reset = () => { setStatus('idle'); setRoomId(null); setGameType(null) }

  return { status, roomId, gameType, queueStatus, joinQueue, leaveQueue, reset }
}
