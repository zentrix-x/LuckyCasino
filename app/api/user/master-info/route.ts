export const runtime = 'nodejs'

import { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'
import { connectMongo } from '@/lib/db'
import { User } from '@/lib/models'

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret'

function requireAuth(authz: string | null) {
  if (!authz) return null
  const token = authz.startsWith('Bearer ') ? authz.slice(7) : authz
  try {
    const payload: any = jwt.verify(token, JWT_SECRET)
    return payload
  } catch {
    return null
  }
}

export async function GET(req: NextRequest) {
  await connectMongo()
  const authz = req.headers.get('authorization')
  
  const payload = requireAuth(authz)
  if (!payload) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 })
  }

  try {
    const user = await User.findById(payload.id)
    if (!user) {
      return new Response(JSON.stringify({ error: 'user_not_found' }), { status: 404 })
    }

    // Find the user's master (parent)
    const master = await User.findById(user.parentMasterId)
    if (!master) {
      return new Response(JSON.stringify({ error: 'master_not_found' }), { status: 404 })
    }

    return Response.json({
      success: true,
      master: {
        id: master._id,
        username: master.username,
        role: master.role
      }
    })

  } catch (error) {
    console.error('Master info error:', error)
    return new Response(JSON.stringify({ error: 'server_error' }), { status: 500 })
  }
}



