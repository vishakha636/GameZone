import { useState, useEffect, useCallback } from 'react'
import { getSocket } from '../utils/socket'

export const useGame = (roomId) => {
  const [gameState, setGameState]   = useState(null)
  const [gameType, setGameType]     = useState(null)
  const [players, setPlayers]       = useState([])
  const [maxPlayers, setMaxPlayers] = useState(2)
  const [chat, setChat]             = useState([])
  const [status, setStatus]         = useState('connecting')  // connecting|waiting|active|finished
  const [waitingCount, setWaitingCount] = useState(0)
  const [error, setError]           = useState(null)

  useEffect(() => {
    const socket = getSocket()
    if (!socket || !roomId) return

    socket.emit('room:join', { roomId })

    socket.on('room:joined', ({ state, gameType: gt, players: pl, maxPlayers: mp }) => {
      setGameState(state)
      setGameType(gt)
      setPlayers(pl)
      setMaxPlayers(mp || 2)
      setStatus('waiting')
    })

    socket.on('waiting:players', ({ connectedCount, maxPlayers: mp }) => {
      setWaitingCount(connectedCount)
      setMaxPlayers(mp)
      setStatus('waiting')
    })

    socket.on('game:start', ({ state }) => {
      setGameState(state)
      setStatus('active')
      setChat(prev => [...prev, { system: true, message: 'Game started!', ts: Date.now() }])
    })

    socket.on('game:state', ({ state }) => {
      setGameState(state)
      if (['finished', 'draw'].includes(state?.status)) setStatus('finished')
    })

    socket.on('game:over', () => setStatus('finished'))

    socket.on('player:joined', ({ username, connectedCount, maxPlayers: mp }) => {
      setWaitingCount(connectedCount)
      setChat(prev => [...prev, { system: true, message: `${username} joined (${connectedCount}/${mp})`, ts: Date.now() }])
    })

    socket.on('player:disconnected', ({ username }) => {
      setChat(prev => [...prev, { system: true, message: `${username} disconnected`, ts: Date.now() }])
    })

    socket.on('chat:message', (msg) => setChat(prev => [...prev, msg]))
    socket.on('move:error', ({ message }) => setError(message))
    socket.on('error', ({ message }) => setError(message))

    return () => {
      ['room:joined','waiting:players','game:start','game:state','game:over',
       'player:joined','player:disconnected','chat:message','move:error','error']
        .forEach(ev => socket.off(ev))
    }
  }, [roomId])

  const makeMove = useCallback((moveData) => {
    const socket = getSocket()
    if (!socket) return
    setError(null)
    socket.emit('game:move', { roomId, moveData })
  }, [roomId])

  const sendChat = useCallback((message) => {
    const socket = getSocket()
    if (!socket) return
    socket.emit('chat:message', { roomId, message })
  }, [roomId])

  return { gameState, gameType, players, maxPlayers, chat, status, waitingCount, error, makeMove, sendChat }
}
