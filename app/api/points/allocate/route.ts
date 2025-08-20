export const runtime = 'nodejs'

import { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'
import { connectMongo } from '@/lib/db'
import { User, Transaction } from '@/lib/models'

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret'

function requireRole(authz: string | null, roles: string[]) {
	if (!authz) return null
	const token = authz.startsWith('Bearer ') ? authz.slice(7) : authz
	try {
		const payload: any = jwt.verify(token, JWT_SECRET)
		if (!roles.includes(payload.role)) return null
		return payload
	} catch {
		return null
	}
}

export async function POST(req: NextRequest) {
	await connectMongo()
	const authz = req.headers.get('authorization')
	const payload = requireRole(authz, ['associate_master', 'master', 'senior_master', 'super_master', 'super_admin'])
	if (!payload) return new Response(JSON.stringify({ error: 'forbidden' }), { status: 403 })
	
	const { userId, delta, action = 'add' } = await req.json()
	const user = await User.findById(userId)
	if (!user) return new Response(JSON.stringify({ error: 'user_not_found' }), { status: 404 })
	
	user.points += Number(delta)
	await user.save()
	
	await Transaction.create({ 
		userId: user._id, 
		type: 'adjustment', 
		amount: delta, 
		balanceAfter: user.points, 
		meta: { by: payload.id, action } 
	})
	
	const actionText = action === 'add' ? 'added to' : 'removed from'
	const message = `${Math.abs(delta).toLocaleString()} points ${actionText} ${user.username}! New balance: ${user.points.toLocaleString()} points`
	
	return Response.json({ 
		success: true,
		message,
		points: user.points 
	})
}
