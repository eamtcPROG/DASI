import { io, Socket } from "socket.io-client"

const GATEWAY_URL = process.env.NEXT_PUBLIC_GATEWAY_URL ?? "http://localhost:3000"

let socket: Socket | null = null

export function getSocket(token: string): Socket {
  if (socket?.connected) {
    return socket
  }

  if (socket) {
    socket.disconnect()
  }

  socket = io(GATEWAY_URL, {
    auth: { token },
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  })

  return socket
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}
