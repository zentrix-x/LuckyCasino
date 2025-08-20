"use client"

import { useState, useEffect } from "react"
import { Trophy, Medal, Award, Users, TrendingUp } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface LeaderboardEntry {
  id: string
  username: string
  avatar?: string
  score: number
  rank: number
  gamesPlayed: number
  winRate: number
  totalWinnings: number
}

interface LeaderboardProps {
  className?: string
}

export function Leaderboard({ className }: LeaderboardProps) {
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [timeframe, setTimeframe] = useState<'daily' | 'weekly' | 'monthly'>('daily')

  useEffect(() => {
    const fetchLeaderboard = async () => {
      // Check if user is authenticated
      const token = localStorage.getItem('token')
      if (!token) {
        setLoading(false)
        return
      }

      setLoading(true)
      try {
        const response = await fetch(`/api/leaderboard?timeframe=${timeframe}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })

        if (!response.ok) {
          throw new Error('Failed to fetch leaderboard data')
        }

        const data = await response.json()
        setLeaderboardData(data.leaderboard)
      } catch (error) {
        console.error('Error fetching leaderboard:', error)
        // Fallback to mock data if API fails
        const mockData: LeaderboardEntry[] = [
          {
            id: '1',
            username: 'LuckyWinner',
            avatar: '/avatars/user1.jpg',
            score: 15420,
            rank: 1,
            gamesPlayed: 156,
            winRate: 68.5,
            totalWinnings: 2500
          }
        ]
        setLeaderboardData(mockData)
      } finally {
        setLoading(false)
      }
    }

    // Add a small delay to ensure authentication is ready
    const timer = setTimeout(fetchLeaderboard, 100)
    return () => clearTimeout(timer)
  }, [timeframe])

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-6 h-6 text-yellow-500" />
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />
      case 3:
        return <Award className="w-6 h-6 text-amber-600" />
      default:
        return <span className="w-6 h-6 text-center text-sm font-bold text-muted-foreground">#{rank}</span>
    }
  }

  const getPrizeAmount = (rank: number) => {
    switch (rank) {
      case 1:
        return { amount: 1000, currency: 'USD' }
      case 2:
        return { amount: 500, currency: 'USD' }
      case 3:
        return { amount: 250, currency: 'USD' }
      default:
        return { amount: 50, currency: 'USD' }
    }
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50 animate-pulse">
                <div className="w-8 h-8 bg-muted rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-24" />
                  <div className="h-3 bg-muted rounded w-16" />
                </div>
                <div className="h-6 bg-muted rounded w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-5 h-5" />
          Leaderboard
        </CardTitle>
        <Tabs value={timeframe} onValueChange={(value) => setTimeframe(value as any)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="daily">Daily</TabsTrigger>
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {leaderboardData.map((entry) => {
            const prize = getPrizeAmount(entry.rank)
            return (
              <div
                key={entry.id}
                className={`flex items-center gap-4 p-3 rounded-lg transition-colors ${
                  entry.rank <= 3 ? 'bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20' : 'bg-muted/50 hover:bg-muted/70'
                }`}
              >
                <div className="flex items-center justify-center w-8 h-8">
                  {getRankIcon(entry.rank)}
                </div>
                
                <Avatar className="w-10 h-10">
                  <AvatarImage src={entry.avatar} alt={entry.username} />
                  <AvatarFallback>{entry.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold truncate">{entry.username}</span>
                    {entry.rank <= 3 && (
                      <Badge variant="secondary" className="text-xs">
                        Top {entry.rank}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {entry.gamesPlayed} games
                    </span>
                    <span className="flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      {entry.winRate}% win rate
                    </span>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="font-bold text-lg">{entry.score.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">
                    ${entry.totalWinnings.toLocaleString()}
                  </div>
                  {entry.rank <= 5 && (
                    <div className="text-xs text-green-600 font-medium">
                      Prize: ${prize.amount}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
        
        <div className="mt-6 p-4 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg">
          <h4 className="font-semibold mb-2">🏆 Prize Pool</h4>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <div className="font-bold text-yellow-600">1st Place</div>
              <div>$1,000</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-gray-600">2nd Place</div>
              <div>$500</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-amber-600">3rd Place</div>
              <div>$250</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
