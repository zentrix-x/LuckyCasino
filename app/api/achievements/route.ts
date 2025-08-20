import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { Achievement } from '@/lib/models/achievement'
import { User } from '@/lib/models/user'
import { verifyToken } from '@/lib/auth'

// Achievement definitions
const ACHIEVEMENT_DEFINITIONS = [
  {
    id: 'first_win',
    title: 'First Win',
    description: 'Win your first game',
    icon: '🎯',
    category: 'gaming',
    maxProgress: 1,
    reward: { type: 'points', amount: 100, description: '100 Points' },
    rarity: 'common'
  },
  {
    id: 'lucky_streak',
    title: 'Lucky Streak',
    description: 'Win 5 games in a row',
    icon: '🔥',
    category: 'gaming',
    maxProgress: 5,
    reward: { type: 'coins', amount: 500, description: '500 Coins' },
    rarity: 'rare'
  },
  {
    id: 'high_roller',
    title: 'High Roller',
    description: 'Place a bet of $100 or more',
    icon: '💎',
    category: 'financial',
    maxProgress: 1,
    reward: { type: 'badge', amount: 1, description: 'High Roller Badge' },
    rarity: 'epic'
  },
  {
    id: 'social_butterfly',
    title: 'Social Butterfly',
    description: 'Add 10 friends',
    icon: '🦋',
    category: 'social',
    maxProgress: 10,
    reward: { type: 'bonus', amount: 200, description: '200% Bonus' },
    rarity: 'rare'
  },
  {
    id: 'casino_master',
    title: 'Casino Master',
    description: 'Play all available games',
    icon: '👑',
    category: 'gaming',
    maxProgress: 3,
    reward: { type: 'points', amount: 1000, description: '1000 Points' },
    rarity: 'legendary'
  },
  {
    id: 'daily_grinder',
    title: 'Daily Grinder',
    description: 'Log in for 7 consecutive days',
    icon: '📅',
    category: 'special',
    maxProgress: 7,
    reward: { type: 'coins', amount: 1000, description: '1000 Coins' },
    rarity: 'common'
  },
  {
    id: 'big_winner',
    title: 'Big Winner',
    description: 'Win $1000 in a single game',
    icon: '💰',
    category: 'financial',
    maxProgress: 1,
    reward: { type: 'badge', amount: 1, description: 'Big Winner Badge' },
    rarity: 'legendary'
  },
  {
    id: 'referral_king',
    title: 'Referral King',
    description: 'Refer 5 friends who sign up',
    icon: '👥',
    category: 'social',
    maxProgress: 5,
    reward: { type: 'bonus', amount: 500, description: '500% Bonus' },
    rarity: 'epic'
  }
]

export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const userId = decoded.userId

    // Get user's achievements
    const userAchievements = await Achievement.find({ userId }).lean()

    // Create achievement map for quick lookup
    const achievementMap = new Map(userAchievements.map(a => [a.achievementId, a]))

    // Build complete achievement list
    const achievements = ACHIEVEMENT_DEFINITIONS.map(def => {
      const userAchievement = achievementMap.get(def.id)
      return {
        id: def.id,
        title: def.title,
        description: def.description,
        icon: def.icon,
        category: def.category,
        progress: userAchievement?.progress || 0,
        maxProgress: def.maxProgress,
        reward: def.reward,
        unlocked: userAchievement?.unlocked || false,
        rarity: def.rarity
      }
    })

    // Calculate stats
    const unlocked = achievements.filter(a => a.unlocked).length
    const totalRewards = achievements
      .filter(a => a.unlocked)
      .reduce((sum, a) => sum + a.reward.amount, 0)

    const stats = {
      total: achievements.length,
      unlocked,
      completionRate: Math.round((unlocked / achievements.length) * 100),
      totalRewards
    }

    return NextResponse.json({ achievements, stats })
  } catch (error) {
    console.error('Error fetching achievements:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const userId = decoded.userId
    const { achievementId, progress } = await request.json()

    // Find achievement definition
    const achievementDef = ACHIEVEMENT_DEFINITIONS.find(def => def.id === achievementId)
    if (!achievementDef) {
      return NextResponse.json({ error: 'Achievement not found' }, { status: 404 })
    }

    // Update or create achievement
    const achievement = await Achievement.findOneAndUpdate(
      { userId, achievementId },
      {
        userId,
        achievementId,
        title: achievementDef.title,
        description: achievementDef.description,
        icon: achievementDef.icon,
        category: achievementDef.category,
        progress,
        maxProgress: achievementDef.maxProgress,
        reward: achievementDef.reward,
        rarity: achievementDef.rarity,
        unlocked: progress >= achievementDef.maxProgress,
        unlockedAt: progress >= achievementDef.maxProgress ? new Date() : undefined
      },
      { upsert: true, new: true }
    )

    return NextResponse.json({ achievement })
  } catch (error) {
    console.error('Error updating achievement:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
