"use client"

import { createContext, useContext, useState, useCallback, type ReactNode, useEffect } from "react"
import { useAuth, type User, type UserRole } from "./use-auth"
import { useGameEngine } from "./use-game-engine"

interface AdminStats {
  totalUsers: number
  totalBets: number
  totalPayout: number
  houseProfit: number
  activeGames: number
  onlineUsers: number
}

interface AdminContextType {
  stats: AdminStats
  getAllUsers: () => Array<User & { password?: string }>
  updateUserPoints: (userId: string, points: number) => boolean
  updateUserRole: (userId: string, role: UserRole) => boolean
  deleteUser: (userId: string) => boolean
  refreshStats: () => void
}

const AdminContext = createContext<AdminContextType | undefined>(undefined)

// Removed mock users - now using API-backed accounts

export function AdminProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const { gameHistory, userBets } = useGameEngine()
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalBets: 0,
    totalPayout: 0,
    houseProfit: 0,
    activeGames: 3,
    onlineUsers: 0,
  })

  const getAllUsers = useCallback(() => {
    return [] // TODO: Implement API call to get users
  }, [])

  const updateUserPoints = useCallback((userId: string, points: number): boolean => {
    // TODO: Implement API call to update user points
    return false
  }, [])

  const updateUserRole = useCallback((userId: string, role: UserRole): boolean => {
    // TODO: Implement API call to update user role
    return false
  }, [])

  const deleteUser = useCallback((userId: string): boolean => {
    // TODO: Implement API call to delete user
    return false
  }, [])

  const refreshStats = useCallback(async () => {
    try {
      const res = await fetch('/api/stats')
      const data = await res.json()
      if (res.ok) {
        setStats({
          totalUsers: data.totalUsers ?? 0,
          totalBets: data.totalBets ?? 0,
          totalPayout: data.totalPayout ?? 0,
          houseProfit: data.houseProfit ?? 0,
          activeGames: data.activeGames ?? 3,
          onlineUsers: data.onlineUsers ?? 0,
        })
        return
      }
    } catch {}
    // fallback using client-only data
    const totalBets = gameHistory.reduce((sum, game) => sum + game.totalBets, 0)
    const totalPayout = gameHistory.reduce((sum, game) => sum + game.totalPayout, 0)
    setStats({
      totalUsers: 0,
      totalBets,
      totalPayout,
      houseProfit: totalBets - totalPayout,
      activeGames: 3,
      onlineUsers: 0,
    })
  }, [gameHistory])

  // Heartbeat to mark user as online (if logged in)
  useEffect(() => {
    let interval: any
    const tick = async () => {
      try {
        const token = localStorage.getItem('jwt')
        if (!token) return
        await fetch('/api/presence/heartbeat', { method: 'POST', headers: { Authorization: `Bearer ${token}` } })
      } catch {}
    }
    tick()
    interval = setInterval(tick, 60000) // Increased to 60 seconds for high scalability
    return () => clearInterval(interval)
  }, [])

  return (
    <AdminContext.Provider
      value={{
        stats,
        getAllUsers,
        updateUserPoints,
        updateUserRole,
        deleteUser,
        refreshStats,
      }}
    >
      {children}
    </AdminContext.Provider>
  )
}

export function useAdmin() {
  const context = useContext(AdminContext)
  if (context === undefined) {
    throw new Error("useAdmin must be used within an AdminProvider")
  }
  return context
}
