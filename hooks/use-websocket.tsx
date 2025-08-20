'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAuth } from './use-auth'

interface WebSocketMessage {
  type: string
  data: any
  timestamp: string
}

export function useWebSocket() {
  const { user } = useAuth()
  const token = typeof window !== 'undefined' ? localStorage.getItem('jwt') : null
  const socketRef = useRef<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null)
  const [connectionError, setConnectionError] = useState<string | null>(null)

  // Initialize WebSocket connection
  const connect = useCallback(() => {
    if (!user || !token) return

    try {
      const socket = io(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000', {
        transports: ['websocket'], // Only use WebSocket for better performance
        auth: {
          token
        },
        // Performance optimizations for high scalability
        timeout: 30000, // Increased timeout
        forceNew: false, // Reuse connections
        reconnection: true,
        reconnectionAttempts: 3, // Reduced attempts
        reconnectionDelay: 2000, // Increased delay
        reconnectionDelayMax: 10000, // Increased max delay
      })

      socket.on('connect', () => {
  
        setIsConnected(true)
        setConnectionError(null)

        // Authenticate with the server
        socket.emit('authenticate', {
          userId: user.id,
          token
        })
      })

      socket.on('authenticated', (data) => {

      })

      socket.on('disconnect', (reason) => {

        setIsConnected(false)
        setConnectionError(reason)
      })

      socket.on('connect_error', (error) => {
        console.error('❌ WebSocket connection error:', error)
        setConnectionError(error.message)
        setIsConnected(false)
      })

      // Game-specific events
      socket.on('game-update', (data) => {

        setLastMessage({
          type: 'game-update',
          data,
          timestamp: new Date().toISOString()
        })
      })

      socket.on('bet-processed', (data) => {

        setLastMessage({
          type: 'bet-processed',
          data,
          timestamp: new Date().toISOString()
        })
      })

      socket.on('payout-received', (data) => {

        setLastMessage({
          type: 'payout-received',
          data,
          timestamp: new Date().toISOString()
        })
      })

      socket.on('commission-earned', (data) => {

        setLastMessage({
          type: 'commission-earned',
          data,
          timestamp: new Date().toISOString()
        })
      })

      // Error handling
      socket.on('error', (error) => {
        console.error('❌ WebSocket error:', error)
        setConnectionError(error.message)
      })

      socketRef.current = socket
    } catch (error) {
      console.error('❌ Failed to initialize WebSocket:', error)
      setConnectionError('Failed to connect to server')
    }
  }, [user, token])

  // Disconnect WebSocket
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect()
      socketRef.current = null
      setIsConnected(false)
      setConnectionError(null)
    }
  }, [])

  // Join game room
  const joinGame = useCallback((gameType: string) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('join-game', gameType)
      
    }
  }, [isConnected])

  // Leave game room
  const leaveGame = useCallback((gameType: string) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('leave-game', gameType)
      
    }
  }, [isConnected])

  // Send heartbeat
  const sendHeartbeat = useCallback(() => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('heartbeat')
    }
  }, [isConnected])

  // Setup connection and cleanup
  useEffect(() => {
    if (user && token) {
      connect()
    }

    return () => {
      disconnect()
    }
  }, [user, token, connect, disconnect])

  // Setup heartbeat interval
  useEffect(() => {
    if (isConnected) {
      const heartbeatInterval = setInterval(sendHeartbeat, 30000) // 30 seconds
      return () => clearInterval(heartbeatInterval)
    }
  }, [isConnected, sendHeartbeat])

  return {
    isConnected,
    lastMessage,
    connectionError,
    joinGame,
    leaveGame,
    connect,
    disconnect
  }
}
