export const runtime = 'nodejs'

import { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'
import { connectMongo } from '@/lib/db'
import { Presence } from '@/lib/models'

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret'

function getUserId(authz: string | null) {
	if (!authz) return null
	const token = authz.startsWith('Bearer ') ? authz.slice(7) : authz
	try {
		const payload: any = jwt.verify(token, JWT_SECRET)
		return payload.id as string
	} catch {
		return null
	}
}

export async function POST(req: NextRequest) {
	await connectMongo()
	const userId = getUserId(req.headers.get('authorization'))
	if (!userId) return new Response(JSON.stringify({ error: 'forbidden' }), { status: 403 })
	
	console.log(`[Heartbeat] User ${userId} heartbeat at ${new Date().toISOString()}`)
	
	await Presence.updateOne({ userId }, { $set: { lastSeen: new Date() } }, { upsert: true })
	return Response.json({ ok: true })
}
