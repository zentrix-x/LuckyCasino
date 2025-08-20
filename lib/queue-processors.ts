import { connectMongo } from './db'
import { User, GameRound, Bet, Transaction, CommissionLedger } from './models'
import { cacheManager } from './cache'
import { websocketManager } from './websocket-server'
import { simpleQueueManager } from './simple-queue'
import { gameScheduler } from './game-scheduler'

// Initialize queue processors for high scalability
export function initializeQueueProcessors(): void {
  // Bet processing processor
  simpleQueueManager.registerProcessor('bet-processing', async (job) => {
    const { betId, userId, amount, gameType, roundId } = job.data

    try {
      await connectMongo()

      const bet = await Bet.findById(betId)
      if (!bet) throw new Error('Bet not found')

      const user = await User.findById(userId)
      if (!user) throw new Error('User not found')

      // Deduct points from user
      user.points -= amount
      await user.save()

      // Create transaction record
      await Transaction.create({
        userId: user._id,
        type: 'bet_debit',
        amount: -amount,
        balanceAfter: user.points,
        meta: { gameType, roundId, betId }
      })

      // Update cache
      await cacheManager.setUserSession(userId.toString(), {
        points: user.points,
        lastBet: new Date().toISOString()
      }, 3600)

      // Notify user via WebSocket
      websocketManager.sendToUser(userId.toString(), 'bet-processed', {
        betId,
        amount,
        newBalance: user.points
      })


      return { success: true, betId, newBalance: user.points }

    } catch (error) {
      console.error('Bet processing error:', error)
      throw error
    }
  })

  // Commission calculation processor
  simpleQueueManager.registerProcessor('commission-calculation', async (job) => {
    const { roundId, gameType } = job.data

    try {
      await connectMongo()

      const round = await GameRound.findById(roundId)
      if (!round) throw new Error('Game round not found')

      const totalBets = round.totalBets || 0
      const houseProfit = totalBets - (round.totalPayout || 0)

      const commissionRates = {
        associate_master: 0.05,
        master: 0.10,
        senior_master: 0.15,
        super_master: 0.20,
        super_admin: 0.25,
      }

      const bets = await Bet.find({ roundId }).populate('userId')
      
      for (const bet of bets) {
        const user = bet.userId as any
        if (!user || user.role === 'user') continue

        const commissionRate = commissionRates[user.role as keyof typeof commissionRates] || 0
        const commissionAmount = bet.amount * commissionRate

        if (commissionAmount > 0) {
          user.points += commissionAmount
          await user.save()

          await CommissionLedger.create({
            masterId: user._id,
            betId: bet._id,
            roundId,
            gameType,
            amount: commissionAmount,
            level: user.role,
            commissionRate
          })

          await Transaction.create({
            userId: user._id,
            type: 'commission_credit',
            amount: commissionAmount,
            balanceAfter: user.points,
            meta: { betId: bet._id, roundId, gameType }
          })

          websocketManager.sendToUser(user._id.toString(), 'commission-earned', {
            amount: commissionAmount,
            newBalance: user.points,
            betId: bet._id
          })
        }
      }


      return { success: true, roundId, totalCommissions: houseProfit }

    } catch (error) {
      console.error('Commission calculation error:', error)
      throw error
    }
  })

  // Game settlement processor
  simpleQueueManager.registerProcessor('game-settlement', async (job) => {
    const { roundId, gameType, outcome } = job.data

    try {
      await connectMongo()

      const round = await GameRound.findById(roundId)
      if (!round) throw new Error('Game round not found')

      const bets = await Bet.find({ roundId }).populate('userId')
      let totalPayout = 0

      for (const bet of bets) {
        const user = bet.userId as any
        let payout = 0

        if (gameType === '7up7down' && bet.outcome === outcome) {
          payout = bet.amount * 2
        } else if (gameType === 'spinwin' && bet.outcome === outcome) {
          payout = bet.amount * 1.5
        } else if (gameType === 'lottery' && bet.outcome === outcome) {
          payout = bet.amount * 10
        }

        if (payout > 0) {
          user.points += payout
          await user.save()

          await Transaction.create({
            userId: user._id,
            type: 'payout_credit',
            amount: payout,
            balanceAfter: user.points,
            meta: { betId: bet._id, roundId, gameType, outcome }
          })

          totalPayout += payout

          websocketManager.sendToUser(user._id.toString(), 'payout-received', {
            amount: payout,
            newBalance: user.points,
            betId: bet._id,
            outcome
          })
        }
      }

      round.status = 'settled'
      round.totalPayout = totalPayout
      round.settledAt = new Date()
      await round.save()

      websocketManager.broadcastGameUpdate(gameType, {
        roundId,
        outcome,
        totalPayout,
        status: 'settled'
      })


      return { success: true, roundId, totalPayout }

    } catch (error) {
      console.error('Game settlement error:', error)
      throw error
    }
  })

  // Start the game scheduler for automatic settlement
  // gameScheduler.start() // Temporarily disabled to fix import issues

}
