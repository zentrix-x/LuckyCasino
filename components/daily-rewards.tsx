"use client"

import { useState, useEffect } from "react"
import { Calendar, Gift, Star, Zap, Crown, CheckCircle, Lock } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

interface DailyReward {
  day: number
  reward: {
    type: 'coins' | 'points' | 'bonus' | 'special'
    amount: number
    description: string
    icon: string
  }
  claimed: boolean
  available: boolean
}

interface DailyRewardsProps {
  className?: string
}

export function DailyRewards({ className }: DailyRewardsProps) {
  const [rewards, setRewards] = useState<DailyReward[]>([])
  const [currentStreak, setCurrentStreak] = useState(0)
  const [loading, setLoading] = useState(true)
  const [lastClaimDate, setLastClaimDate] = useState<string | null>(null)

  useEffect(() => {
    const fetchDailyRewards = async () => {
      // Check if user is authenticated
      const token = localStorage.getItem('token')
      if (!token) {
        setLoading(false)
        return
      }

      setLoading(true)
      try {
        const response = await fetch('/api/daily-rewards', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })

        if (!response.ok) {
          throw new Error('Failed to fetch daily rewards')
        }

        const data = await response.json()
        setRewards(data.rewards)
        setCurrentStreak(data.currentStreak)
        setLastClaimDate(data.lastClaimDate)
      } catch (error) {
        console.error('Error fetching daily rewards:', error)
        // Fallback to mock data if API fails
        const mockRewards: DailyReward[] = [
          {
            day: 1,
            reward: { type: 'coins', amount: 100, description: '100 Coins', icon: '🪙' },
            claimed: false,
            available: false
          }
        ]
        setRewards(mockRewards)
        setCurrentStreak(0)
        setLastClaimDate(null)
      } finally {
        setLoading(false)
      }
    }

    // Add a small delay to ensure authentication is ready
    const timer = setTimeout(fetchDailyRewards, 100)
    return () => clearTimeout(timer)
  }, [])

  const claimReward = async (day: number) => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        console.error('No token found - user not authenticated')
        return
      }

      const response = await fetch('/api/daily-rewards', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ day })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to claim reward')
      }

      const data = await response.json()
      
      // Update local state
      setRewards(prev => prev.map(reward => 
        reward.day === day 
          ? { ...reward, claimed: true, available: false }
          : reward
      ))
      
      setCurrentStreak(prev => prev + 1)
      setLastClaimDate(new Date().toISOString().split('T')[0])
      
      // Show success message
      console.log(`Claimed day ${day} reward!`)
    } catch (error) {
      console.error('Failed to claim reward:', error)
    }
  }

  const canClaimToday = () => {
    if (!lastClaimDate) return true
    const today = new Date().toISOString().split('T')[0]
    return lastClaimDate !== today
  }

  const getRewardIcon = (type: string) => {
    switch (type) {
      case 'coins': return <Star className="w-4 h-4" />
      case 'points': return <Zap className="w-4 h-4" />
      case 'bonus': return <Crown className="w-4 h-4" />
      case 'special': return <Gift className="w-4 h-4" />
      default: return <Gift className="w-4 h-4" />
    }
  }

  const getRewardColor = (type: string) => {
    switch (type) {
      case 'coins': return 'text-yellow-600'
      case 'points': return 'text-blue-600'
      case 'bonus': return 'text-green-600'
      case 'special': return 'text-purple-600'
      default: return 'text-gray-600'
    }
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Daily Rewards
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(7)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 animate-pulse">
                <div className="w-12 h-12 bg-muted rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-24" />
                  <div className="h-3 bg-muted rounded w-16" />
                </div>
                <div className="w-20 h-8 bg-muted rounded" />
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
          <Calendar className="w-5 h-5" />
          Daily Rewards
        </CardTitle>
        
        {/* Streak Info */}
        <div className="flex items-center justify-between mt-4 p-4 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg">
          <div>
            <div className="text-2xl font-bold text-primary">{currentStreak}</div>
            <div className="text-sm text-muted-foreground">Day Streak</div>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium">Next Reward</div>
            <div className="text-xs text-muted-foreground">
              {currentStreak < 7 ? `Day ${currentStreak + 1}` : 'Complete week!'}
            </div>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex justify-between text-sm mb-2">
            <span>Week Progress</span>
            <span>{Math.min(currentStreak, 7)}/7</span>
          </div>
          <Progress value={(currentStreak / 7) * 100} className="h-2" />
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3">
          {rewards.map((reward) => (
            <div
              key={reward.day}
              className={`flex items-center gap-4 p-4 rounded-lg border transition-all ${
                reward.claimed
                  ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200'
                  : reward.available
                  ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200'
                  : 'bg-muted/30 border-border'
              }`}
            >
              {/* Day Number */}
              <div className={`flex items-center justify-center w-12 h-12 rounded-full font-bold text-lg ${
                reward.claimed
                  ? 'bg-green-100 text-green-700'
                  : reward.available
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-muted text-muted-foreground'
              }`}>
                {reward.day}
              </div>
              
              {/* Reward Info */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-2xl">{reward.reward.icon}</span>
                  <span className={`font-semibold ${getRewardColor(reward.reward.type)}`}>
                    {reward.reward.description}
                  </span>
                  {reward.claimed && <CheckCircle className="w-4 h-4 text-green-600" />}
                </div>
                <div className="text-sm text-muted-foreground">
                  Day {reward.day} Reward
                </div>
              </div>
              
              {/* Action Button */}
              <div className="flex flex-col items-end gap-2">
                {reward.claimed ? (
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    Claimed
                  </Badge>
                ) : reward.available ? (
                  <Button 
                    size="sm" 
                    onClick={() => claimReward(reward.day)}
                    className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600"
                  >
                    <Gift className="w-3 h-3 mr-1" />
                    Claim
                  </Button>
                ) : (
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Lock className="w-3 h-3" />
                    <span className="text-xs">Locked</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {/* Weekly Bonus Info */}
        <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
          <div className="flex items-center gap-2 mb-2">
            <Crown className="w-5 h-5 text-purple-600" />
            <h4 className="font-semibold text-purple-800">Weekly Bonus</h4>
          </div>
          <p className="text-sm text-purple-700 mb-3">
            Complete all 7 days to unlock a special mystery reward!
          </p>
          <div className="flex items-center gap-2">
            <div className="text-2xl">🎁</div>
            <div>
              <div className="font-medium">Mystery Box</div>
              <div className="text-xs text-purple-600">Contains exclusive rewards</div>
            </div>
          </div>
        </div>
        
        {/* Streak Benefits */}
        <div className="mt-4 p-4 bg-muted/50 rounded-lg">
          <h4 className="font-semibold mb-2">🔥 Streak Benefits</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="font-medium">3 Days</div>
              <div className="text-muted-foreground">+10% Bonus</div>
            </div>
            <div>
              <div className="font-medium">5 Days</div>
              <div className="text-muted-foreground">+25% Bonus</div>
            </div>
            <div>
              <div className="font-medium">7 Days</div>
              <div className="text-muted-foreground">+50% Bonus</div>
            </div>
            <div>
              <div className="font-medium">30 Days</div>
              <div className="text-muted-foreground">VIP Status</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
