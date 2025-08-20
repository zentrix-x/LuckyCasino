export const runtime = 'nodejs'

import { NextRequest } from 'next/server'
import { connectMongo } from '@/lib/db'
import { GameRound } from '@/lib/models'
import { publish } from '@/lib/events'
import { getQuarterBounds } from '@/lib/config'

export async function GET(_req: NextRequest, context: { params: Promise<{ gameType: string }> }) {
	await connectMongo()
	const { gameType } = await context.params
	
	// Get the current quarter bounds (this should be stable for the current 15-minute period)
	const currentTime = new Date()
	const { start, end } = getQuarterBounds(currentTime)
	
	// Always get the current quarter's round
	let round = await GameRound.findOne({ gameType, roundStartAt: start, roundEndAt: end })
	
	if (!round) {
		// Create the round if it doesn't exist
		round = await GameRound.create({ 
			gameType, 
			roundStartAt: start, 
			roundEndAt: end, 
			status: 'betting',
			totalBets: 0,
			totalPayout: 0
		})
		
		// Publish round start event
		publish(gameType, 'round_start', { 
			roundId: round._id, 
			start: round.roundStartAt, 
			end: round.roundEndAt 
		})
		
		
	}
	
	// Check if round should be settled
	const now = new Date()
	if (round.status === 'betting' && now >= end) {
		// Round should be settled, but let the settle endpoint handle it
		
	}
	
	return Response.json(round)
}
