import { io } from 'socket.io-client'

let socket = null

export const connectSocket = (token) => {
  if (socket?.connected) return socket
  const socketURL = 'http://192.168.14.39:80'
  socket = io(socketURL, {
    auth: { token },
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  })
  socket.on('connect',    () => console.log('[Socket] Connected:', socket.id))
  socket.on('disconnect', (r) => console.log('[Socket] Disconnected:', r))
  socket.on('connect_error', (e) => console.error('[Socket] Error:', e.message))
  return socket
}

export const getSocket      = () => socket
export const disconnectSocket = () => { if (socket) { socket.disconnect(); socket = null } }
