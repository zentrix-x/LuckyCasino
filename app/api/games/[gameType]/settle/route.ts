export const runtime = 'nodejs'

import { NextRequest } from 'next/server'
import { connectMongo } from '@/lib/db'
import { GameRound, Bet, User, Transaction, CommissionLedger } from '@/lib/models'
import { getQuarterBounds, GAME_CONFIG } from '@/lib/config'
import { GameLogicService } from '@/lib/game-logic'
import { CommissionService } from '@/lib/commission-service'
import { publish } from '@/lib/events'

export async function POST(_req: NextRequest, context: { params: Promise<{ gameType: string }> }) {
	await connectMongo()
	const { gameType } = await context.params
	const { start, end } = getQuarterBounds()
	const round = await GameRound.findOne({ gameType, roundStartAt: start, roundEndAt: end })
	if (!round) return new Response(JSON.stringify({ error: 'round_not_found' }), { status: 404 })
	if (round.status === 'settled') return Response.json({ ok: true, alreadySettled: true, roundId: round._id })

	const bets = await Bet.find({ roundId: round._id })
	
	// Use new game logic service to calculate result
	const gameResult = GameLogicService.calculateGameResult(bets, gameType)
	const winningOutcome = gameResult.winningOutcome

	// Process payouts based on game result
	let totalBet = 0
	let totalPayout = 0
	
	// Handle multiple winning outcomes for lottery
	const winningOutcomes = winningOutcome.split(',')
	
	for (const bet of bets) {
		totalBet += bet.amount
		if (winningOutcomes.includes(bet.outcome)) {
			// Get the correct multiplier for this outcome
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
			}
		} else {
			bet.status = 'lost'
			await bet.save()
		}
	}

	round.status = 'settled'
	round.winningOutcome = winningOutcome
	round.totalsJson = gameResult.betSummary
	round.set('totalBets', gameResult.totalBets)
	round.set('totalPayout', gameResult.totalPayout)
	await round.save()

	// Commission distribution using new service
	// Commission is calculated based on user bet amounts, not house profit
	const commissionDistributions = await CommissionService.calculateCommissions(round._id.toString())
	if (commissionDistributions.length > 0) {
		await CommissionService.distributeCommissions(round._id.toString(), commissionDistributions)
	}

	publish(gameType, 'result_published', { 
		roundId: round._id, 
		winningOutcome, 
		betSummary: gameResult.betSummary, 
		totalBets: gameResult.totalBets, 
		totalPayout: gameResult.totalPayout, 
		houseProfit 
	})
	return Response.json({ 
		ok: true, 
		roundId: round._id, 
		winningOutcome, 
		betSummary: gameResult.betSummary, 
		totalBets: gameResult.totalBets, 
		totalPayout: gameResult.totalPayout, 
		houseProfit 
	})
}
