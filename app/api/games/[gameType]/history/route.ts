export const runtime = 'nodejs'

import { NextRequest } from 'next/server'
import { connectMongo } from '@/lib/db'
import { GameRound } from '@/lib/models'

export async function GET(_req: NextRequest, context: { params: Promise<{ gameType: string }> }) {
	await connectMongo()
	const { gameType } = await context.params
	const rounds = await GameRound.find({ gameType, status: 'settled' }).sort({ roundEndAt: -1 }).limit(50)
	return Response.json(rounds)
}
