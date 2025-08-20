export const runtime = 'nodejs'

import { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'
import { connectMongo } from '@/lib/db'
import { User } from '@/lib/models'

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret'

export async function GET(req: NextRequest) {
    try {
        await connectMongo()
        const authz = req.headers.get('authorization')
        
        if (!authz) {
            return Response.json({ 
                error: 'no_authorization_header',
                message: 'No Authorization header provided'
            }, { status: 401 })
        }
        
        const token = authz.startsWith('Bearer ') ? authz.slice(7) : authz
        
        try {
            const payload: any = jwt.verify(token, JWT_SECRET)
            const user = await User.findById(payload.id)
            
            if (!user) {
                return Response.json({ 
                    error: 'user_not_found',
                    message: 'User not found in database'
                }, { status: 404 })
            }
            
            return Response.json({
                success: true,
                user: {
                    id: user._id,
                    username: user.username,
                    role: user.role,
                    points: user.points
                },
                token_payload: payload
            })
            
        } catch (jwtError) {
            return Response.json({ 
                error: 'invalid_token',
                message: 'Invalid or expired JWT token',
                details: jwtError instanceof Error ? jwtError.message : 'Unknown JWT error'
            }, { status: 401 })
        }
        
    } catch (error) {
        console.error('Test auth error:', error)
        return Response.json({ 
            error: 'server_error',
            message: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
    }
}




