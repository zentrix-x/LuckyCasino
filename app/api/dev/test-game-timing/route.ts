export const runtime = 'nodejs'

import { NextRequest } from 'next/server'
import { connectMongo } from '@/lib/db'
import { GameRound } from '@/lib/models'
import { getQuarterBounds } from '@/lib/config'

export async function GET(req: NextRequest) {
	await connectMongo()
	
	const now = new Date()
	const { start, end } = getQuarterBounds(now)
	const gameTypes = ['seven_up_down', 'spin_win', 'lottery_0_99']
	
	const rounds = []
	
	for (const gameType of gameTypes) {
		const round = await GameRound.findOne({ 
			gameType, 
			roundStartAt: start, 
			roundEndAt: end 
		})
		
		rounds.push({
			gameType,
			exists: !!round,
			status: round?.status || 'none',
			roundId: round?._id || null,
			start: start.toISOString(),
			end: end.toISOString(),
			timeRemaining: Math.max(0, end.getTime() - now.getTime())
		})
	}
	
	return Response.json({
		currentTime: now.toISOString(),
		currentQuarter: {
			start: start.toISOString(),
			end: end.toISOString(),
			duration: '15 minutes'
		},
		rounds,
		nextQuarter: {
			start: new Date(end).toISOString(),
			end: new Date(end.getTime() + 15 * 60 * 1000).toISOString()
		}
	})
}




