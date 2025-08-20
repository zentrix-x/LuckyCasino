export const runtime = 'nodejs'

import { NextRequest } from 'next/server'
import { connectMongo } from '@/lib/db'
import { GameRound, Bet, User, Transaction } from '@/lib/models'
import { getQuarterBounds, GAME_CONFIG } from '@/lib/config'
import { GameLogicService } from '@/lib/game-logic'
import { CommissionService } from '@/lib/commission-service'
import { publish } from '@/lib/events'

const GAME_TYPES = ['seven_up_down', 'spin_win', 'lottery_0_99']

export async function POST(req: NextRequest) {
  try {
    await connectMongo()
    const now = new Date()
    
    console.log(`🕐 [${now.toISOString()}] Manual settlement triggered...`)
    
    let totalSettled = 0
    let totalErrors = 0
    const results: any[] = []
    
    for (const gameType of GAME_TYPES) {
      try {
        // Find all rounds that should be settled (past their end time and still betting)
        const pendingRounds = await GameRound.find({
          gameType,
          status: 'betting',
          roundEndAt: { $lt: now }
        })
        
        console.log(`🎮 Found ${pendingRounds.length} pending rounds for ${gameType}`)
        
        for (const round of pendingRounds) {
          try {
            console.log(`📊 Settling round ${round._id} for ${gameType}`)
            
            // Get all bets for this round
            const bets = await Bet.find({ roundId: round._id })
            
            if (bets.length === 0) {
              console.log(`⚠️ No bets found for round ${round._id}, marking as settled`)
              round.status = 'settled'
              round.winningOutcome = 'no_bets'
              await round.save()
              continue
            }
            
            // Calculate game result
            const gameResult = GameLogicService.calculateGameResult(bets, gameType)
            const winningOutcome = gameResult.winningOutcome
            
            console.log(`🎯 Winning outcome for ${gameType}: ${winningOutcome}`)
            
            // Process payouts
            let totalBet = 0
            let totalPayout = 0
            const winningOutcomes = winningOutcome.split(',')
            
            for (const bet of bets) {
              totalBet += bet.amount
              if (winningOutcomes.includes(bet.outcome)) {
                // Get multiplier for this outcome
                const gameConfig = GAME_CONFIG[gameType as keyof typeof GAME_CONFIG]
                const multiplier = gameConfig?.multipliers[bet.outcome] || 1
                const payout = Math.floor(bet.amount * multiplier)
                
                bet.status = 'won'
                bet.payout = payout
                await bet.save()
                
                const user = await User.findById(bet.userId)
                if (user) {
                  user.points += payout
                  await user.save()
                  await Transaction.create({
                    userId: user._id,
                    type: 'payout_credit',
                    amount: payout,
                    balanceAfter: user.points,
                    meta: { gameType, roundId: round._id, outcome: bet.outcome, multiplier }
                  })
                  totalPayout += payout
                  console.log(`💰 User ${user.username} won ${payout} points`)
                }
              } else {
                bet.status = 'lost'
                await bet.save()
              }
            }
            
            // Update round status
            round.status = 'settled'
            round.winningOutcome = winningOutcome
            round.totalsJson = gameResult.betSummary
            round.set('totalBets', gameResult.totalBets)
            round.set('totalPayout', gameResult.totalPayout)
            await round.save()
            
            // Distribute commissions
            try {
              const commissionDistributions = await CommissionService.calculateCommissions(round._id.toString())
              if (commissionDistributions.length > 0) {
                await CommissionService.distributeCommissions(round._id.toString(), commissionDistributions)
              }
            } catch (commissionError) {
              console.error(`❌ Commission distribution failed for round ${round._id}:`, commissionError)
            }
            
            // Publish result
            try {
              publish(gameType, 'result_published', {
                roundId: round._id,
                winningOutcome,
                betSummary: gameResult.betSummary,
                totalBets: gameResult.totalBets,
                totalPayout: gameResult.totalPayout
              })
            } catch (publishError) {
              console.error(`❌ Result publishing failed for round ${round._id}:`, publishError)
            }
            
            totalSettled++
            results.push({
              roundId: round._id,
              gameType,
              winningOutcome,
              totalBets: gameResult.totalBets,
              totalPayout: gameResult.totalPayout,
              status: 'settled'
            })
            
            console.log(`✅ Successfully settled round ${round._id}`)
            
          } catch (roundError) {
            console.error(`❌ Failed to settle round ${round._id}:`, roundError)
            totalErrors++
            results.push({
              roundId: round._id,
              gameType,
              error: roundError.message,
              status: 'failed'
            })
          }
        }
        
      } catch (gameTypeError) {
        console.error(`❌ Failed to process ${gameType}:`, gameTypeError)
        totalErrors++
      }
    }
    
    console.log(`🏁 Manual settlement complete: ${totalSettled} rounds settled, ${totalErrors} errors`)
    
    return Response.json({
      success: true,
      settled: totalSettled,
      errors: totalErrors,
      results,
      timestamp: now.toISOString()
    })
    
  } catch (error) {
    console.error('❌ Manual settlement failed:', error)
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}
