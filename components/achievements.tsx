"use client"

import { useState, useEffect } from "react"
import { Trophy, Star, Target, Zap, Crown, Gift, Lock, CheckCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  category: 'gaming' | 'social' | 'financial' | 'special'
  progress: number
  maxProgress: number
  reward: {
    type: 'points' | 'coins' | 'badge' | 'bonus'
    amount: number
    description: string
  }
  unlocked: boolean
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
}

// Helper functions
const getRarityBadge = (rarity: string) => {
  switch (rarity) {
    case 'common': return <Badge variant="secondary">Common</Badge>
    case 'rare': return <Badge variant="default" className="bg-blue-500">Rare</Badge>
    case 'epic': return <Badge variant="default" className="bg-purple-500">Epic</Badge>
    case 'legendary': return <Badge variant="default" className="bg-orange-500">Legendary</Badge>
    default: return <Badge variant="secondary">Common</Badge>
  }
}

const getRewardIcon = (type: string) => {
  switch (type) {
    case 'points': return <Star className="w-4 h-4" />
    case 'coins': return <Trophy className="w-4 h-4" />
    case 'badge': return <Crown className="w-4 h-4" />
    case 'bonus': return <Zap className="w-4 h-4" />
    default: return <Gift className="w-4 h-4" />
  }
}

interface AchievementsProps {
  className?: string
}

export function Achievements({ className }: AchievementsProps) {
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    total: 0,
    unlocked: 0,
    completionRate: 0,
    totalRewards: 0
  })

  useEffect(() => {
    const fetchAchievements = async () => {
      // Check if user is authenticated
      const token = localStorage.getItem('token')
      if (!token) {
        setLoading(false)
        return
      }

      setLoading(true)
      try {
        const response = await fetch('/api/achievements', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })

        if (!response.ok) {
          throw new Error('Failed to fetch achievements')
        }

        const data = await response.json()
        setAchievements(data.achievements)
        setStats(data.stats)
      } catch (error) {
        console.error('Error fetching achievements:', error)
        // Fallback to mock data if API fails
        const mockAchievements: Achievement[] = [
          {
            id: '1',
            title: 'First Win',
            description: 'Win your first game',
            icon: '🎯',
            category: 'gaming',
            progress: 0,
            maxProgress: 1,
            reward: { type: 'points', amount: 100, description: '100 Points' },
            unlocked: false,
            rarity: 'common'
          }
        ]
        setAchievements(mockAchievements)
        setStats({
          total: 1,
          unlocked: 0,
          completionRate: 0,
          totalRewards: 0
        })
      } finally {
        setLoading(false)
      }
    }

    // Add a small delay to ensure authentication is ready
    const timer = setTimeout(fetchAchievements, 100)
    return () => clearTimeout(timer)
  }, [])

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'text-gray-600'
      case 'rare': return 'text-blue-600'
      case 'epic': return 'text-purple-600'
      case 'legendary': return 'text-orange-600'
      default: return 'text-gray-600'
    }
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            Achievements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="p-4 rounded-lg bg-muted/50 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-muted rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-32" />
                    <div className="h-3 bg-muted rounded w-48" />
                    <div className="h-2 bg-muted rounded w-full" />
                  </div>
                </div>
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
          Achievements
        </CardTitle>
        
        {/* Stats Overview */}
        <div className="grid grid-cols-4 gap-4 mt-4">
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold text-primary">{stats.unlocked}</div>
            <div className="text-sm text-muted-foreground">Unlocked</div>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-sm text-muted-foreground">Total</div>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{stats.completionRate}%</div>
            <div className="text-sm text-muted-foreground">Complete</div>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">{stats.totalRewards}</div>
            <div className="text-sm text-muted-foreground">Rewards</div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="gaming">Gaming</TabsTrigger>
            <TabsTrigger value="social">Social</TabsTrigger>
            <TabsTrigger value="financial">Financial</TabsTrigger>
            <TabsTrigger value="special">Special</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="mt-4">
            <AchievementList achievements={achievements} />
          </TabsContent>
          <TabsContent value="gaming" className="mt-4">
            <AchievementList achievements={achievements.filter(a => a.category === 'gaming')} />
          </TabsContent>
          <TabsContent value="social" className="mt-4">
            <AchievementList achievements={achievements.filter(a => a.category === 'social')} />
          </TabsContent>
          <TabsContent value="financial" className="mt-4">
            <AchievementList achievements={achievements.filter(a => a.category === 'financial')} />
          </TabsContent>
          <TabsContent value="special" className="mt-4">
            <AchievementList achievements={achievements.filter(a => a.category === 'special')} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

function AchievementList({ achievements }: { achievements: Achievement[] }) {
  return (
    <div className="space-y-4">
      {achievements.map((achievement) => {
        const progressPercentage = (achievement.progress / achievement.maxProgress) * 100
        
        return (
          <div
            key={achievement.id}
            className={`p-4 rounded-lg border transition-all ${
              achievement.unlocked
                ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200'
                : 'bg-muted/30 border-border hover:bg-muted/50'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className={`text-3xl ${achievement.unlocked ? '' : 'grayscale opacity-50'}`}>
                {achievement.icon}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className={`font-semibold ${achievement.unlocked ? 'text-green-700' : ''}`}>
                    {achievement.title}
                  </h3>
                  {getRarityBadge(achievement.rarity)}
                  {achievement.unlocked && (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  )}
                </div>
                
                <p className="text-sm text-muted-foreground mb-3">
                  {achievement.description}
                </p>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Progress: {achievement.progress}/{achievement.maxProgress}</span>
                    <span className="font-medium">{Math.round(progressPercentage)}%</span>
                  </div>
                  <Progress value={progressPercentage} className="h-2" />
                </div>
                
                <div className="flex items-center gap-2 mt-3">
                  <div className="flex items-center gap-1 text-sm">
                    {getRewardIcon(achievement.reward.type)}
                    <span className="font-medium">{achievement.reward.description}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col items-end gap-2">
                {achievement.unlocked ? (
                  <Button size="sm" variant="outline" className="text-green-600 border-green-600">
                    Claimed
                  </Button>
                ) : (
                  <Button size="sm" variant="outline" disabled>
                    <Lock className="w-3 h-3 mr-1" />
                    Locked
                  </Button>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
