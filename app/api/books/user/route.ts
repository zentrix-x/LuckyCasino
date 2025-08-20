export const runtime = 'nodejs'

import { NextRequest } from 'next/server'
import { connectMongo } from '@/lib/db'
import { Transaction } from '@/lib/models'

export async function GET(req: NextRequest) {
	await connectMongo()
	const { searchParams } = new URL(req.url)
	const userId = searchParams.get('userId')
	const day = searchParams.get('day') || new Date().toISOString().slice(0, 10)
	if (!userId) return new Response(JSON.stringify({ error: 'missing_userId' }), { status: 400 })
	const start = new Date(day + 'T00:00:00.000Z')
	const end = new Date(day + 'T23:59:59.999Z')
	const txs = await Transaction.find({ userId, createdAt: { $gte: start, $lte: end } }).sort({ createdAt: 1 })
	const summary = txs.reduce((acc: any, t: any) => {
		acc.total = (acc.total || 0) + t.amount
		acc.byType = acc.byType || {}
		acc.byType[t.type] = (acc.byType[t.type] || 0) + t.amount
		return acc
	}, {})
	return Response.json({ day, summary, txs })
}




