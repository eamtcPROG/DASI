import { io, Socket } from "socket.io-client"

/** Must match gateway Socket.IO path. Trailing slash matters: without it, requests are
 *  `/socket.io?EIO=…` which does NOT match nginx `location /socket.io/` and hit Next → 404. */
export const SOCKET_IO_PATH = "/socket.io/"

/**
 * Public base URL for Socket.IO. Resolved at connect time (not module load) so the
 * browser sees the real hostname.
 *
 * - Production: same origin as the page when NEXT_PUBLIC_GATEWAY_URL is missing or still
 *   points at localhost from an old Docker build (nginx must proxy /socket.io/ → gateway).
 * - Local dev: Next :3100 + gateway :3000 → hostname:3000 or explicit NEXT_PUBLIC_GATEWAY_URL.
 */
function getSocketBaseUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_GATEWAY_URL?.replace(/\/$/, "") ?? ""

  if (typeof window === "undefined") {
    return fromEnv || "http://localhost:3000"
  }

  const { hostname, origin, protocol } = window.location
  const isLocalDev =
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "[::1]"

  if (!isLocalDev) {
    const envPointsToLoopback =
      fromEnv.includes("localhost") || fromEnv.includes("127.0.0.1")
    if (fromEnv && !envPointsToLoopback) {
      return fromEnv
    }
    return origin
  }

  if (fromEnv) {
    return fromEnv
  }

  return `${protocol}//${hostname}:3000`
}

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

  const baseUrl = getSocketBaseUrl()
  console.log("Creating new socket connection to:", baseUrl)

  socket = io(baseUrl, {
    path: SOCKET_IO_PATH,
    auth: { token },
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 8,
    reconnectionDelay: 2000,
    reconnectionDelayMax: 15000,
    randomizationFactor: 0.5,
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
