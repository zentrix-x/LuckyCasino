export const runtime = 'nodejs'

import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { connectMongo } from '@/lib/db'
import { User } from '@/lib/models'

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret'

export async function POST(req: NextRequest) {
    if (process.env.NODE_ENV === 'production') {
        return new Response(JSON.stringify({ error: 'disabled_in_production' }), { status: 403 })
    }
    
    try {
        await connectMongo()
        const { username, password, role, points } = await req.json()
        
        // Find or create user
        let user = await User.findOne({ username })
        
        if (!user) {
            // Create new user
            const passwordHash = await bcrypt.hash(password, 10)
            user = await User.create({
                username,
                passwordHash,
                role: role || 'user',
                points: points || 1000
            })
        } else {
            // Update existing user's points if provided
            if (points !== undefined) {
                user.points = points
                await user.save()
            }
        }
        
        // Generate JWT token
        const token = jwt.sign(
            { id: user._id, username: user.username, role: user.role },
            JWT_SECRET,
            { expiresIn: '7d' }
        )
        
        return Response.json({
            success: true,
            token,
            user: {
                id: user._id,
                username: user.username,
                role: user.role,
                points: user.points
            }
        })
        
    } catch (error) {
        console.error('Ensure user error:', error)
        return Response.json({ 
            error: error instanceof Error ? error.message : 'Unknown error' 
        }, { status: 500 })
    }
}
