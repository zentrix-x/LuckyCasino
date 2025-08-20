export const runtime = 'nodejs'

import { NextRequest } from 'next/server'
import { connectMongo } from '@/lib/db'
import { GameRound } from '@/lib/models'
import { getQuarterBounds } from '@/lib/config'

export async function GET(req: NextRequest) {
    try {
        console.log('Debug: Testing Lottery API...')
        
        // Test database connection
        await connectMongo()
        console.log('Debug: Database connected')
        
        // Test quarter bounds
        const { start, end } = getQuarterBounds()
        console.log('Debug: Quarter bounds:', { start: start.toISOString(), end: end.toISOString() })
        
        // Test finding lottery round
        const round = await GameRound.findOne({ 
            gameType: 'lottery_0_99', 
            roundStartAt: start, 
            roundEndAt: end 
        })
        
        console.log('Debug: Found round:', round ? 'yes' : 'no')
        
        if (!round) {
            console.log('Debug: Creating new round...')
            const newRound = await GameRound.create({
                gameType: 'lottery_0_99',
                roundStartAt: start,
                roundEndAt: end,
                status: 'betting',
                totalBets: 0,
                totalPayout: 0
            })
            console.log('Debug: Created round:', newRound._id)
            return Response.json({ 
                success: true, 
                action: 'created', 
                round: newRound,
                quarter: { start: start.toISOString(), end: end.toISOString() }
            })
        }
        
        return Response.json({ 
            success: true, 
            action: 'found', 
            round: round,
            quarter: { start: start.toISOString(), end: end.toISOString() }
        })
        
    } catch (error) {
        console.error('Debug: Error:', error)
        return Response.json({ 
            success: false, 
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined
        }, { status: 500 })
    }
}




