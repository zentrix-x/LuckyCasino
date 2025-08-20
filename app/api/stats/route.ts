export const runtime = 'nodejs'

import { NextRequest } from 'next/server'
import { connectMongo } from '@/lib/db'
import { User, Transaction, GameRound, Presence } from '@/lib/models'

export async function GET() {
	await connectMongo()
	const [totalUsers, totals, currentRounds, online] = await Promise.all([
		User.countDocuments({}),
		Transaction.aggregate([
			{ $group: { _id: '$type', sum: { $sum: '$amount' } } },
		]),
		GameRound.countDocuments({ status: { $in: ['betting', 'locked'] } }),
		Presence.countDocuments({ lastSeen: { $gte: new Date(Date.now() - 60_000) } }), // 60s activity window
	])
	const byType = Object.fromEntries(totals.map((t: any) => [t._id, t.sum]))
	const totalBets = Math.abs(byType['bet_debit'] || 0)
	const totalPayout = byType['payout_credit'] || 0
	const houseProfit = totalBets - totalPayout
	return Response.json({ totalUsers, totalBets, totalPayout, houseProfit, activeGames: currentRounds, onlineUsers: online })
}




