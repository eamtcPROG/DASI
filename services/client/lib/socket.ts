import { io, Socket } from "socket.io-client"

const GATEWAY_URL = process.env.NEXT_PUBLIC_GATEWAY_URL ?? "http://localhost:3000"

let socket: Socket | null = null

export function getSocket(token: string): Socket {
  if (socket?.connected) {
    console.log("Socket already connected, reusing existing connection")
    return socket
  }

  if (socket) {
    console.log("Socket exists but not connected, disconnecting and creating new one")
    socket.disconnect()
  }

  console.log("Creating new socket connection to:", GATEWAY_URL)
  
  socket = io(GATEWAY_URL, {
    auth: { token },
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  })

  // Add connection event logging
  socket.on('connect', () => {
    console.log('Socket connected successfully!', socket?.id)
  })

  socket.on('disconnect', (reason) => {
    console.log('Socket disconnected:', reason)
  })

  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error.message)
  })

  socket.on('reconnect', (attemptNumber) => {
    console.log('Socket reconnected after', attemptNumber, 'attempts')
  })

  return socket
}

export function disconnectSocket() {
  if (socket) {
    console.log("Manually disconnecting socket")
    socket.disconnect()
    socket = null
  }
}

export function getSocketStatus(): string {
  if (!socket) return "No socket instance"
  if (socket.connected) return `Connected (${socket.id})`
  return "Disconnected"
}
