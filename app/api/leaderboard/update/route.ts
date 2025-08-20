import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { Leaderboard } from '@/lib/models/leaderboard'
import { User } from '@/lib/models/user'
import { verifyToken } from '@/lib/auth'

function getPeriodDates(timeframe: 'daily' | 'weekly' | 'monthly') {
  const now = new Date()
  let periodStart: Date
  let periodEnd: Date

  switch (timeframe) {
    case 'daily':
      periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      periodEnd = new Date(periodStart.getTime() + 24 * 60 * 60 * 1000)
      break
    case 'weekly':
      const dayOfWeek = now.getDay()
      const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1
      periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysToSubtract)
      periodEnd = new Date(periodStart.getTime() + 7 * 24 * 60 * 60 * 1000)
      break
    case 'monthly':
      periodStart = new Date(now.getFullYear(), now.getMonth(), 1)
      periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1)
      break
  }

  return { periodStart, periodEnd }
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
    const { won, betAmount, winAmount } = await request.json()

    const timeframes: ('daily' | 'weekly' | 'monthly')[] = ['daily', 'weekly', 'monthly']
    
    for (const timeframe of timeframes) {
      const { periodStart, periodEnd } = getPeriodDates(timeframe)
      
      // Find or create leaderboard entry
      let entry = await Leaderboard.findOne({
        userId,
        timeframe,
        periodStart: { $gte: periodStart, $lt: periodEnd }
      })

      if (!entry) {
        const user = await User.findById(userId).select('username avatar')
        entry = new Leaderboard({
          userId,
          username: user?.username || 'Unknown User',
          avatar: user?.avatar,
          timeframe,
          periodStart,
          periodEnd,
          score: 0,
          gamesPlayed: 0,
          gamesWon: 0,
          totalWinnings: 0,
          totalBets: 0
        })
      }

      // Update stats
      entry.gamesPlayed += 1
      if (won) {
        entry.gamesWon += 1
        entry.totalWinnings += winAmount || 0
      }
      entry.totalBets += betAmount || 0
      
      // Calculate score (example formula)
      entry.score = Math.floor(
        (entry.gamesWon * 100) + 
        (entry.totalWinnings * 0.1) + 
        (entry.gamesPlayed * 10)
      )
      
      entry.lastUpdated = new Date()
      await entry.save()
    }

    // Also update user stats
    const user = await User.findById(userId)
    if (user) {
      user.gamesPlayed += 1
      if (won) {
        user.gamesWon += 1
        user.totalEarnings += winAmount || 0
      }
      await user.save()
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating leaderboard:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
