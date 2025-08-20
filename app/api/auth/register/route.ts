export const runtime = 'nodejs'

import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { connectMongo } from '@/lib/db'
import { User } from '@/lib/models'

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret'

export async function POST(req: NextRequest) {
	await connectMongo()
	const { username, password, role = 'user' } = await req.json()
	if (!username || !password) return new Response(JSON.stringify({ error: 'missing_fields' }), { status: 400 })
	const exists = await User.findOne({ username })
	if (exists) return new Response(JSON.stringify({ error: 'username_taken' }), { status: 409 })
	const passwordHash = await bcrypt.hash(password, 10)
	const user = await User.create({ username, passwordHash, role, points: role === 'user' ? 1000 : 0 })
	const token = jwt.sign({ id: user._id.toString(), role: user.role }, JWT_SECRET, { expiresIn: '7d' })
	return Response.json({ token, user: { id: user._id, username: user.username, role: user.role, points: user.points, createdAt: user.createdAt } })
}




