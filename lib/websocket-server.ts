import { Server as SocketIOServer } from 'socket.io'
import { Server as HTTPServer } from 'http'
import { cacheManager } from './cache'

// WebSocket server for real-time updates
export class WebSocketManager {
  private static instance: WebSocketManager
  private io: SocketIOServer | null = null
  private connectedUsers: Map<string, string> = new Map() // userId -> socketId

  private constructor() {}

  static getInstance(): WebSocketManager {
    if (!WebSocketManager.instance) {
      WebSocketManager.instance = new WebSocketManager()
    }
    return WebSocketManager.instance
  }

  // Initialize WebSocket server
  initialize(httpServer: HTTPServer): void {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true
      },
      // Performance optimizations for high scalability
      transports: ['websocket'], // Only use WebSocket for better performance
      allowEIO3: true,
      pingTimeout: 120000, // 2 minutes
      pingInterval: 60000, // 1 minute - reduced frequency
      upgradeTimeout: 10000,
      maxHttpBufferSize: 1e6,
      // Rate limiting
      allowRequest: (req, callback) => {
        // Basic rate limiting for WebSocket connections
        const clientIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress
        callback(null, true) // Allow all connections for now, can add rate limiting later
      }
    })

    this.setupEventHandlers()

  }

  private setupEventHandlers(): void {
    if (!this.io) return

    this.io.on('connection', (socket) => {


      // Handle user authentication
      socket.on('authenticate', async (data: { userId: string; token: string }) => {
        try {
          // Validate token and store user connection
          this.connectedUsers.set(data.userId, socket.id)
          socket.data.userId = data.userId
          
          // Join user-specific room
          socket.join(`user:${data.userId}`)
          
          // Update presence in Redis
          await cacheManager.setUserPresence(data.userId, {
            socketId: socket.id,
            connectedAt: new Date().toISOString(),
            lastSeen: new Date().toISOString()
          })

          socket.emit('authenticated', { success: true })

        } catch (error) {
          console.error('WebSocket authentication error:', error)
          socket.emit('error', { message: 'Authentication failed' })
        }
      })

      // Handle game room joins
      socket.on('join-game', (gameType: string) => {
        socket.join(`game:${gameType}`)

      })

      // Handle game room leaves
      socket.on('leave-game', (gameType: string) => {
        socket.leave(`game:${gameType}`)

      })

      // Handle disconnection
      socket.on('disconnect', async () => {
        const userId = socket.data.userId
        if (userId) {
          this.connectedUsers.delete(userId)
          // Update presence in Redis
          await cacheManager.setUserPresence(userId, {
            disconnectedAt: new Date().toISOString(),
            lastSeen: new Date().toISOString()
          })

        }
      })

      // Handle heartbeat
      socket.on('heartbeat', async () => {
        const userId = socket.data.userId
        if (userId) {
          await cacheManager.setUserPresence(userId, {
            socketId: socket.id,
            lastSeen: new Date().toISOString(),
            heartbeat: true
          })
        }
      })
    })
  }

  // Broadcast game updates to all users in a game
  broadcastGameUpdate(gameType: string, data: any): void {
    if (!this.io) return
    
    this.io.to(`game:${gameType}`).emit('game-update', {
      gameType,
      data,
      timestamp: new Date().toISOString()
    })
  }

  // Send update to specific user
  sendToUser(userId: string, event: string, data: any): void {
    if (!this.io) return
    
    const socketId = this.connectedUsers.get(userId)
    if (socketId) {
      this.io.to(socketId).emit(event, data)
    }
  }

  // Broadcast to all connected users
  broadcastToAll(event: string, data: any): void {
    if (!this.io) return
    
    this.io.emit(event, data)
  }

  // Get connected users count
  getConnectedUsersCount(): number {
    return this.connectedUsers.size
  }

  // Get connected users list
  getConnectedUsers(): string[] {
    return Array.from(this.connectedUsers.keys())
  }

  // Check if user is connected
  isUserConnected(userId: string): boolean {
    return this.connectedUsers.has(userId)
  }

  // Force disconnect user
  disconnectUser(userId: string): void {
    if (!this.io) return
    
    const socketId = this.connectedUsers.get(userId)
    if (socketId) {
      this.io.sockets.sockets.get(socketId)?.disconnect()
      this.connectedUsers.delete(userId)
    }
  }

  // Get WebSocket server instance
  getIO(): SocketIOServer | null {
    return this.io
  }
}

// Export singleton instance
export const websocketManager = WebSocketManager.getInstance()

