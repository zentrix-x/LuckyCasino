export const runtime = 'nodejs'

import { NextRequest } from 'next/server'
import { connectMongo } from '@/lib/db'
import { User } from '@/lib/models'

export async function GET(req: NextRequest) {
	await connectMongo()
	
	// Get all users for debugging
	const users = await User.find({}).select('-passwordHash')
	
	return Response.json({ 
		message: 'Auth test endpoint',
		userCount: users.length,
		users: users
	})
}


