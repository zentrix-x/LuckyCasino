export const runtime = 'nodejs'

import { NextRequest } from 'next/server'
import { connectMongo } from '@/lib/db'
import { User } from '@/lib/models'

export async function GET(req: NextRequest) {
	try {
		await connectMongo()
		
		// Test database connection
		const userCount = await User.countDocuments()
		
		// Get environment info
		const envInfo = {
			mongodbUri: process.env.MONGODB_URI ? 'Set' : 'Not set',
			jwtSecret: process.env.JWT_SECRET ? 'Set' : 'Not set',
			nodeEnv: process.env.NODE_ENV || 'Not set'
		}
		
		return Response.json({ 
			message: 'Debug info',
			database: {
				connected: true,
				userCount
			},
			environment: envInfo,
			timestamp: new Date().toISOString()
		})
	} catch (error) {
		return Response.json({ 
			message: 'Debug error',
			error: error instanceof Error ? error.message : 'Unknown error',
			timestamp: new Date().toISOString()
		}, { status: 500 })
	}
}




