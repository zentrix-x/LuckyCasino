export const runtime = 'nodejs'

import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { connectMongo } from '@/lib/db'
import { User } from '@/lib/models'

export async function POST(req: NextRequest) {
	if (process.env.NODE_ENV === 'production') {
		return new Response(JSON.stringify({ error: 'disabled_in_production' }), { status: 403 })
	}
	
	await connectMongo()
	
	// Create test users if they don't exist
	const testUsers = [
		{ username: 'testuser', password: 'test123', role: 'user', points: 1000 },
		{ username: 'admin', password: 'admin123', role: 'super_admin', points: 10000 },
		{ username: 'master', password: 'master123', role: 'master', points: 5000 }
	]
	
	const results = []
	
	for (const testUser of testUsers) {
		let user = await User.findOne({ username: testUser.username })
		if (!user) {
			const passwordHash = await bcrypt.hash(testUser.password, 10)
			user = await User.create({
				username: testUser.username,
				passwordHash,
				role: testUser.role,
				points: testUser.points
			})
			results.push({ username: testUser.username, created: true, id: user._id })
		} else {
			results.push({ username: testUser.username, created: false, id: user._id })
		}
	}
	
	return Response.json({ 
		message: 'Test users ready',
		users: results,
		loginCredentials: testUsers.map(u => ({ username: u.username, password: u.password }))
	})
}




