export const runtime = 'nodejs'

import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { connectMongo } from '@/lib/db'
import { User } from '@/lib/models'

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
	const payload = requireRole(authz, ['super_admin'])
	if (!payload) return new Response(JSON.stringify({ error: 'forbidden' }), { status: 403 })
	const { username, password } = await req.json()
	const passwordHash = await bcrypt.hash(password, 10)
	const master = await User.create({ username, passwordHash, role: 'master', points: 0 })
	return Response.json({ id: master._id })
}

