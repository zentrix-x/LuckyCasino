"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

export type UserRole = "user" | "associate_master" | "master" | "senior_master" | "super_master" | "super_admin"

export interface User {
  id: string
  username: string
  role: UserRole
  points: number
  createdAt: Date
}

interface AuthContextType {
  user: User | null
  login: (username: string, password: string) => Promise<boolean>
  register: (username: string, password: string, role?: UserRole) => Promise<boolean>
  logout: () => void
  updatePoints: (points: number) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Mock list removed; using API-backed accounts

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    // Check for stored user session
    const storedUser = localStorage.getItem("casino_user")

    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser)

        setUser(userData)
        // Ensure a JWT exists for presence tracking (dev helper) - with delay to prioritize UI
        setTimeout(async () => {
          try {
            const u = JSON.parse(storedUser)
            const res = await fetch("/api/dev/ensure-user", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ username: u.username, password: "dev", role: u.role, points: u.points }),
            })
            const data = await res.json()
            if (res.ok && data.token) {
              localStorage.setItem("jwt", data.token)
            }
          } catch (error) {
            console.error('Error ensuring user:', error)
          }
        }, 500) // Increased delay for better scalability
      } catch (error) {
        console.error('Error parsing stored user:', error)
        localStorage.removeItem("casino_user")
      }
    }
  }, [])

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
  
      const res = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) })
      const data = await res.json()
      if (!res.ok) {
        return false
      }
      localStorage.setItem('jwt', data.token)
      const newUser: User = { id: data.id || 'unknown', username, role: data.role, points: data.points, createdAt: new Date() }
      setUser(newUser)
      localStorage.setItem('casino_user', JSON.stringify(newUser))
      return true
    } catch (error) {
      console.error('Login error:', error)
      return false
    }
  }

  const register = async (username: string, password: string, role: UserRole = 'user'): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password, role }) })
      const data = await res.json()
      if (!res.ok) {
        return false
      }
      localStorage.setItem('jwt', data.token)
      const newUser: User = { id: data.user.id, username: data.user.username, role: data.user.role, points: data.user.points, createdAt: new Date(data.user.createdAt) }
      setUser(newUser)
      localStorage.setItem('casino_user', JSON.stringify(newUser))
      return true
    } catch (error) {
      console.error('Registration error:', error)
      return false
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("casino_user")
    localStorage.removeItem("jwt")
  }

  const updatePoints = (newPoints: number) => {
    if (user) {
      const updatedUser = { ...user, points: newPoints }
      setUser(updatedUser)
      localStorage.setItem("casino_user", JSON.stringify(updatedUser))
    }
  }

  // Send heartbeat to mark user as online
  useEffect(() => {
    if (!user) return

    let interval: any
    const sendHeartbeat = async () => {
      try {
        const token = localStorage.getItem('jwt')
        if (!token) return
        await fetch('/api/presence/heartbeat', { 
          method: 'POST', 
          headers: { Authorization: `Bearer ${token}` } 
        })
      } catch (error) {
        console.error('Heartbeat error:', error)
      }
    }

    // Send initial heartbeat
    sendHeartbeat()
    
    // Send heartbeat every 30 seconds
          interval = setInterval(sendHeartbeat, 60000)
    
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [user])

  return <AuthContext.Provider value={{ user, login, register, logout, updatePoints }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
