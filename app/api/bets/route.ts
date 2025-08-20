export const runtime = 'nodejs'

import { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'
import { connectMongo } from '@/lib/db'
import { User, GameRound, Bet, Transaction } from '@/lib/models'
import { GAME_CONFIG } from '@/lib/config'

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
	console.log('Bet API - Authorization header:', authz ? 'present' : 'missing')
	
	const payload = requireRole(authz, ['user', 'associate_master', 'master', 'senior_master', 'super_master', 'super_admin'])
	if (!payload) {
		console.log('Bet API - Authentication failed: no valid token')
		return new Response(JSON.stringify({ error: 'forbidden', details: 'Authentication required' }), { status: 403 })
	}
	
	// Apply Redis-based rate limiting for high scalability
	const { cacheManager } = await import('@/lib/cache')
	const userIdentifier = payload.id || 'anonymous'
	
	const rateLimit = await cacheManager.checkRateLimit(userIdentifier, 10, 60000) // 10 bets per minute
	if (!rateLimit.allowed) {
		return new Response(JSON.stringify({ error: 'rate_limit_exceeded' }), { 
			status: 429, 
			headers: {
				'Content-Type': 'application/json',
				'X-RateLimit-Limit': '10',
				'X-RateLimit-Remaining': rateLimit.remaining.toString(),
				'X-RateLimit-Reset': rateLimit.resetTime.toString()
			}
		})
	}
	const idempotencyKey = req.headers.get('idempotency-key') || undefined
	const { gameType, roundId, outcome, amount } = await req.json()

	const user = await User.findById(payload.id)
	if (!user) return new Response(JSON.stringify({ error: 'invalid_user' }), { status: 400 })
	const round = await GameRound.findById(roundId)
	if (!round || round.gameType !== gameType) return new Response(JSON.stringify({ error: 'invalid_round' }), { status: 400 })
	if (round.status !== 'betting') return new Response(JSON.stringify({ error: 'betting_closed' }), { status: 400 })
	
	// Validate bet amount against game configuration
	const gameConfig = GAME_CONFIG[gameType as keyof typeof GAME_CONFIG]
	if (!gameConfig) return new Response(JSON.stringify({ error: 'invalid_game_type' }), { status: 400 })
	
	if (amount < gameConfig.minBet) {
		return new Response(JSON.stringify({ 
			error: 'bet_too_small', 
			details: `Minimum bet is ${gameConfig.minBet} points` 
		}), { status: 400 })
	}
	
	if (gameConfig.maxBet && amount > gameConfig.maxBet) {
		return new Response(JSON.stringify({ 
			error: 'bet_too_large', 
			details: `Maximum bet is ${gameConfig.maxBet} points` 
		}), { status: 400 })
	}
	
	if (user.points < amount) return new Response(JSON.stringify({ error: 'insufficient_points' }), { status: 400 })

	if (idempotencyKey) {
		const existing = await Bet.findOne({ idempotencyKey })
		if (existing) return Response.json(existing)
	}

	// Use background queue for bet processing
	const { simpleQueueManager } = await import('@/lib/simple-queue')
	
	// Create bet record first
	const bet = await Bet.create({ roundId, userId: user._id, gameType, outcome, amount, idempotencyKey })
	
	// Add bet processing to background queue
	await simpleQueueManager.addJob('bet-processing', {
		betId: bet._id,
		userId: user._id,
		amount,
		gameType,
		roundId
	}, { priority: 1 })
	
	// Cache user session for performance
	await cacheManager.setUserSession(payload.id, {
		points: user.points - amount,
		lastBet: new Date().toISOString()
	}, 3600)
	
	return Response.json(bet)
}
