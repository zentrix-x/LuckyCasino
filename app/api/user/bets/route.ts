export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { connectMongo } from '@/lib/db'
import { Bet, GameRound } from '@/lib/models'

export async function GET(request: NextRequest) {
  try {
    await connectMongo()

    // Get JWT token from Authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret') as any
    const userId = decoded.id

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    const gameType = searchParams.get('gameType')

    // Build query
    const query: any = { userId }
    if (gameType) {
      query.gameType = gameType
    }

    // Fetch user's bets with round information
    const bets = await Bet.find(query)
      .populate('roundId', 'gameType winningOutcome status roundEndAt')
      .sort({ createdAt: -1 })
      .limit(limit)

    // Format the response
    const formattedBets = bets.map(bet => {
      const round = bet.roundId as any
      let result: 'won' | 'lost' | 'pending' = 'pending'
      let payout: number | undefined
      let roundStatus = round?.status || 'unknown'
      let roundEndTime = round?.roundEndAt || null

      if (round && round.status === 'settled') {
        if (round.winningOutcome === bet.outcome) {
          result = 'won'
          // Calculate payout based on game type
          switch (round.gameType) {
            case 'seven_up_down':
              payout = bet.amount * 2
              break
            case 'spin_win':
              payout = bet.amount * 1.5
              break
            case 'lottery_0_99':
              payout = bet.amount * 10
              break
            default:
              payout = bet.amount
          }
        } else {
          result = 'lost'
        }
      } else if (round && round.status === 'betting' && roundEndTime && new Date(roundEndTime) < new Date()) {
        // Round has ended but not settled - this is why it shows as pending
        result = 'pending'
      }

      return {
        id: bet._id.toString(),
        gameType: round?.gameType || bet.gameType,
        betAmount: bet.amount,
        outcome: bet.outcome,
        result,
        payout,
        roundId: bet.roundId.toString(),
        roundStatus,
        roundEndTime: roundEndTime ? new Date(roundEndTime).toISOString() : null,
        createdAt: bet.createdAt.toISOString()
      }
    })

    return NextResponse.json(formattedBets)

  } catch (error) {
    console.error('Error fetching user bets:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

