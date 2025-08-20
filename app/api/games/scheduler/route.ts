export const runtime = 'nodejs'

import { NextRequest } from 'next/server'
import { connectMongo } from '@/lib/db'
import { GameRound } from '@/lib/models'
import { getQuarterBounds } from '@/lib/config'
import { publish } from '@/lib/events'

export async function POST(req: NextRequest) {
	await connectMongo()
	
	const gameTypes = ['seven_up_down', 'spin_win', 'lottery_0_99']
	const now = new Date()
	const { start, end } = getQuarterBounds(now)
	
	const results = []
	
	for (const gameType of gameTypes) {
		try {
			// Check if current round exists
			let round = await GameRound.findOne({ 
				gameType, 
				roundStartAt: start, 
				roundEndAt: end 
			})
			
			if (!round) {
				// Create new round
				round = await GameRound.create({
					gameType,
					roundStartAt: start,
					roundEndAt: end,
					status: 'betting',
					totalBets: 0,
					totalPayout: 0
				})
				
				publish(gameType, 'round_start', {
					roundId: round._id,
					start: round.roundStartAt,
					end: round.roundEndAt
				})
				
				results.push({
					gameType,
					action: 'created',
					roundId: round._id,
					start: start.toISOString(),
					end: end.toISOString()
				})
			} else if (round.status === 'betting' && now >= end) {
				// Round should be settled
				results.push({
					gameType,
					action: 'needs_settlement',
					roundId: round._id,
					start: start.toISOString(),
					end: end.toISOString()
				})
			} else {
				results.push({
					gameType,
					action: 'exists',
					roundId: round._id,
					status: round.status,
					timeRemaining: Math.max(0, end.getTime() - now.getTime())
				})
			}
		} catch (error) {
			results.push({
				gameType,
				action: 'error',
				error: error instanceof Error ? error.message : 'Unknown error'
			})
		}
	}
	
	return Response.json({
		timestamp: now.toISOString(),
		currentQuarter: {
			start: start.toISOString(),
			end: end.toISOString()
		},
		results
	})
}




