"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, TrendingUp, DollarSign, Activity, Gamepad2, UserCheck } from "lucide-react"
import { useState, useEffect } from "react"
import { toast } from "sonner"

interface DashboardStats {
  totalUsers: number
  onlineUsers: number
  totalBets: number
  totalPayout: number
  houseProfit: number
  activeGames: number
}

export function AdminStatsCards() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    onlineUsers: 0,
    totalBets: 0,
    totalPayout: 0,
    houseProfit: 0,
    activeGames: 0
  })
  const [loading, setLoading] = useState(true)

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('jwt')
      if (!token) {
        console.error('No authentication token found')
        setLoading(false)
        return
      }

      const response = await fetch('/api/admin/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        const dashboard = data.dashboard
        
        // Calculate totals from game stats
        const totalBets = dashboard.games.stats.reduce((sum: number, game: any) => sum + (game.totalBets || 0), 0)
        const totalPayout = dashboard.games.stats.reduce((sum: number, game: any) => sum + (game.totalPayout || 0), 0)
        const houseProfit = dashboard.games.stats.reduce((sum: number, game: any) => sum + (game.houseProfit || 0), 0)
        
        setStats({
          totalUsers: dashboard.users.total,
          onlineUsers: dashboard.users.online,
          totalBets: totalBets,
          totalPayout: totalPayout,
          houseProfit: houseProfit,
          activeGames: dashboard.games.currentRounds.length
        })
      } else {
        const errorData = await response.json()
        console.error('Failed to fetch dashboard stats:', errorData)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
    const interval = setInterval(fetchStats, 60000) // Refresh every 60 seconds
    return () => clearInterval(interval)
  }, [])

  const statCards = [
    {
      title: "Total Users",
      value: stats.totalUsers.toLocaleString(),
      icon: Users,
      color: "text-blue-400",
      bgColor: "from-blue-500/20 to-blue-600/20",
    },
    {
      title: "Online Users",
      value: stats.onlineUsers.toLocaleString(),
      icon: UserCheck,
      color: "text-green-400",
      bgColor: "from-green-500/20 to-green-600/20",
    },
    {
      title: "Total Bets",
      value: stats.totalBets.toLocaleString(),
      icon: TrendingUp,
      color: "text-purple-400",
      bgColor: "from-purple-500/20 to-purple-600/20",
    },
    {
      title: "Total Payouts",
      value: stats.totalPayout.toLocaleString(),
      icon: DollarSign,
      color: "text-yellow-400",
      bgColor: "from-yellow-500/20 to-yellow-600/20",
    },
    {
      title: "House Profit",
      value: stats.houseProfit.toLocaleString(),
      icon: Activity,
      color: "text-emerald-400",
      bgColor: "from-emerald-500/20 to-emerald-600/20",
    },
    {
      title: "Active Games",
      value: stats.activeGames.toLocaleString(),
      icon: Gamepad2,
      color: "text-orange-400",
      bgColor: "from-orange-500/20 to-orange-600/20",
    },
  ]

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="bg-white/10 border-white/20 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-20 bg-white/20 rounded animate-pulse"></div>
              <div className="h-8 w-8 bg-white/20 rounded animate-pulse"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 bg-white/20 rounded animate-pulse"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {statCards.map((stat) => {
        const Icon = stat.icon
        return (
          <Card key={stat.title} className="bg-white/10 border-white/20 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white/70">{stat.title}</CardTitle>
              <div className={`p-2 rounded-lg bg-gradient-to-r ${stat.bgColor}`}>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
