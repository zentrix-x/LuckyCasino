export const runtime = 'nodejs'

import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { connectMongo } from '@/lib/db'
import { User } from '@/lib/models'

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret'

export async function POST(req: NextRequest) {
	await connectMongo()
	const { username, password } = await req.json()
	const user = await User.findOne({ username })
	if (!user) return new Response(JSON.stringify({ error: 'invalid_credentials' }), { status: 400 })
	const ok = await bcrypt.compare(password, user.passwordHash)
	if (!ok) return new Response(JSON.stringify({ error: 'invalid_credentials' }), { status: 400 })
	const token = jwt.sign({ id: user._id.toString(), role: user.role }, JWT_SECRET, { expiresIn: '7d' })
	return Response.json({ token, id: user._id.toString(), role: user.role, points: user.points })
}
