export const runtime = 'nodejs'

import { NextRequest } from 'next/server'
import { connectMongo } from '@/lib/db'
import { GameRound } from '@/lib/models'
import { getQuarterBounds } from '@/lib/config'

const GAME_TYPES = ['seven_up_down', 'spin_win', 'lottery_0_99']

export async function GET() {
	await connectMongo()
	const { start, end } = getQuarterBounds()
	// Ensure current round exists
	for (const gameType of GAME_TYPES) {
		const exists = await GameRound.findOne({ gameType, roundStartAt: start, roundEndAt: end })
		if (!exists) await GameRound.create({ gameType, roundStartAt: start, roundEndAt: end, status: 'betting' })
	}
	return Response.json({ ok: true, start, end })
}




