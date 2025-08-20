export const runtime = 'nodejs'

import { NextRequest } from 'next/server'
import { connectMongo } from '@/lib/db'
import { CommissionLedger, Transaction } from '@/lib/models'

export async function GET(req: NextRequest) {
	await connectMongo()
	const { searchParams } = new URL(req.url)
	const masterId = searchParams.get('masterId')
	const day = searchParams.get('day') || new Date().toISOString().slice(0, 10)
	if (!masterId) return new Response(JSON.stringify({ error: 'missing_masterId' }), { status: 400 })
	const start = new Date(day + 'T00:00:00.000Z')
	const end = new Date(day + 'T23:59:59.999Z')
	const commissions = await CommissionLedger.find({ masterId, createdAt: { $gte: start, $lte: end } }).sort({ createdAt: 1 })
	const txs = await Transaction.find({ userId: masterId, type: 'commission', createdAt: { $gte: start, $lte: end } })
	const totalCommission = commissions.reduce((sum: number, c: any) => sum + c.amount, 0)
	return Response.json({ day, totalCommission, commissions, txs })
}




