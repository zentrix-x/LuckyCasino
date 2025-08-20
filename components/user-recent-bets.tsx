"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useEffect, useState } from "react"
import { useAuth } from "@/hooks/use-auth"
import { Clock, Trophy, X } from "lucide-react"

interface RecentBet {
  id: string
  gameType: string
  betAmount: number
  outcome: string
  result: 'won' | 'lost' | 'pending'
  payout?: number
  roundId: string
  createdAt: string
}

export function UserRecentBets() {
  const { user } = useAuth()
  const [recentBets, setRecentBets] = useState<RecentBet[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRecentBets = async () => {
      if (!user) return

      try {
        const token = localStorage.getItem('jwt')
        if (!token) return

        const response = await fetch('/api/user/bets?limit=5', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (response.ok) {
          const data = await response.json()
          setRecentBets(data.slice(0, 5)) // Show last 5 bets
        }
      } catch (error) {
        console.error('Failed to fetch recent bets:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchRecentBets()
    
    // Refresh every 30 seconds for real-time updates
    const interval = setInterval(fetchRecentBets, 30000)
    return () => clearInterval(interval)
  }, [user])

  const formatGameType = (gameType: string) => {
    switch (gameType) {
      case 'seven_up_down': return '7Up 7Down'
      case 'spin_win': return 'Spin & Win'
      case 'lottery_0_99': return 'Lottery'
      default: return gameType
    }
  }

  const getResultIcon = (result: string) => {
    switch (result) {
      case 'won': return <Trophy className="w-4 h-4 text-yellow-400" />
      case 'lost': return <X className="w-4 h-4 text-red-400" />
      case 'pending': return <Clock className="w-4 h-4 text-blue-400" />
      default: return null
    }
  }

  const getResultColor = (result: string) => {
    switch (result) {
      case 'won': return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'lost': return 'bg-red-500/20 text-red-400 border-red-500/30'
      case 'pending': return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return `${Math.floor(diffInMinutes / 1440)}d ago`
  }

  if (loading) {
    return (
      <Card className="bg-white/10 border-white/20 text-white">
        <CardHeader>
          <CardTitle className="text-2xl">Your Recent Bets</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-white/60">
            Loading your recent bets...
          </div>
        </CardContent>
      </Card>
    )
  }

  if (recentBets.length === 0) {
    return (
      <Card className="bg-white/10 border-white/20 text-white">
        <CardHeader>
          <CardTitle className="text-2xl">Your Recent Bets</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-white/60">
            <div className="text-lg mb-2">No bets placed yet</div>
            <div className="text-sm text-white/40">Start playing games to see your betting history here!</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-white/10 border-white/20 text-white">
      <CardHeader>
        <CardTitle className="text-2xl">Your Recent Bets</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentBets.map((bet) => (
            <div key={bet.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
              <div className="flex items-center gap-3">
                {getResultIcon(bet.result)}
                <div>
                  <div className="font-medium text-white">
                    {formatGameType(bet.gameType)}
                  </div>
                  <div className="text-sm text-white/60">
                    {bet.outcome} • {bet.betAmount.toLocaleString()} pts
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Badge className={`${getResultColor(bet.result)} border`}>
                  {bet.result.toUpperCase()}
                </Badge>
                
                {bet.payout && bet.result === 'won' && (
                  <div className="text-green-400 font-bold">
                    +{bet.payout.toLocaleString()}
                  </div>
                )}
                
                <div className="text-xs text-white/40">
                  {formatTimeAgo(bet.createdAt)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
