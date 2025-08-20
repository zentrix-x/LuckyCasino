export const runtime = 'nodejs'

import { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'
import { connectMongo } from '@/lib/db'
import { User } from '@/lib/models'

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

export async function GET(req: NextRequest) {
  await connectMongo()
  const authz = req.headers.get('authorization')
  
  const payload = requireRole(authz, ['super_admin'])
  if (!payload) {
    return new Response(JSON.stringify({ error: 'forbidden', details: 'Super admin access required' }), { status: 403 })
  }

  try {
    const users = await User.find({}, {
      _id: 1,
      username: 1,
      role: 1,
      points: 1,
      createdAt: 1
    }).sort({ createdAt: -1 })

    const formattedUsers = users.map(user => ({
      id: user._id.toString(),
      username: user.username,
      role: user.role,
      points: user.points,
      createdAt: user.createdAt.toISOString()
    }))

    return Response.json({
      success: true,
      users: formattedUsers
    })
  } catch (error) {
    console.error('Error fetching users:', error)
    return new Response(JSON.stringify({ error: 'server_error' }), { status: 500 })
  }
}




