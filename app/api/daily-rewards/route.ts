import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { DailyReward } from '@/lib/models/daily-reward'
import { User } from '@/lib/models/user'
import { verifyToken } from '@/lib/auth'

// Daily reward definitions
const DAILY_REWARDS = [
  { day: 1, type: 'coins', amount: 100, description: '100 Coins', icon: '🪙' },
  { day: 2, type: 'points', amount: 50, description: '50 Points', icon: '⭐' },
  { day: 3, type: 'coins', amount: 150, description: '150 Coins', icon: '🪙' },
  { day: 4, type: 'bonus', amount: 25, description: '25% Bonus', icon: '⚡' },
  { day: 5, type: 'coins', amount: 200, description: '200 Coins', icon: '🪙' },
  { day: 6, type: 'points', amount: 100, description: '100 Points', icon: '⭐' },
  { day: 7, type: 'special', amount: 1, description: 'Mystery Box', icon: '🎁' }
]

function getWeekStartDate(date: Date = new Date()): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Adjust when day is Sunday
  return new Date(d.setDate(diff))
}

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
    const weekStartDate = getWeekStartDate()

    // Get user's daily rewards for current week
    const userRewards = await DailyReward.find({
      userId,
      weekStartDate
    }).lean()

    // Create reward map for quick lookup
    const rewardMap = new Map(userRewards.map(r => [r.day, r]))

    // Build complete reward list
    const rewards = DAILY_REWARDS.map(def => {
      const userReward = rewardMap.get(def.day)
      const today = new Date()
      const dayOfWeek = today.getDay() || 7 // Convert Sunday (0) to 7
      const isToday = dayOfWeek === def.day
      const isPast = dayOfWeek > def.day
      
      return {
        day: def.day,
        reward: {
          type: def.type,
          amount: def.amount,
          description: def.description,
          icon: def.icon
        },
        claimed: userReward?.claimed || false,
        available: isToday && !userReward?.claimed
      }
    })

    // Calculate current streak
    let currentStreak = 0
    const lastClaimDate = userRewards.length > 0 
      ? Math.max(...userRewards.map(r => new Date(r.claimedAt || 0).getTime()))
      : null

    if (lastClaimDate) {
      const lastClaim = new Date(lastClaimDate)
      const today = new Date()
      const diffTime = Math.abs(today.getTime() - lastClaim.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      
      if (diffDays <= 1) {
        currentStreak = userRewards.filter(r => r.claimed).length
      }
    }

    return NextResponse.json({
      rewards,
      currentStreak,
      lastClaimDate: lastClaimDate ? new Date(lastClaimDate).toISOString().split('T')[0] : null
    })
  } catch (error) {
    console.error('Error fetching daily rewards:', error)
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
    const { day } = await request.json()

    const weekStartDate = getWeekStartDate()
    const today = new Date()
    const dayOfWeek = today.getDay() || 7

    // Validate claim
    if (day !== dayOfWeek) {
      return NextResponse.json({ error: 'Can only claim today\'s reward' }, { status: 400 })
    }

    // Check if already claimed
    const existingReward = await DailyReward.findOne({
      userId,
      weekStartDate,
      day
    })

    if (existingReward?.claimed) {
      return NextResponse.json({ error: 'Reward already claimed' }, { status: 400 })
    }

    // Get reward definition
    const rewardDef = DAILY_REWARDS.find(r => r.day === day)
    if (!rewardDef) {
      return NextResponse.json({ error: 'Invalid reward day' }, { status: 400 })
    }

    // Create or update reward
    const reward = await DailyReward.findOneAndUpdate(
      { userId, weekStartDate, day },
      {
        userId,
        weekStartDate,
        day,
        reward: {
          type: rewardDef.type,
          amount: rewardDef.amount,
          description: rewardDef.description,
          icon: rewardDef.icon
        },
        claimed: true,
        claimedAt: new Date()
      },
      { upsert: true, new: true }
    )

    // Update user points/coins based on reward type
    const user = await User.findById(userId)
    if (user) {
      if (rewardDef.type === 'points') {
        user.points += rewardDef.amount
      } else if (rewardDef.type === 'coins') {
        user.coins = (user.coins || 0) + rewardDef.amount
      }
      await user.save()
    }

    return NextResponse.json({ reward })
  } catch (error) {
    console.error('Error claiming daily reward:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
