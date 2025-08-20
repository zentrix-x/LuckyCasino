export const runtime = 'nodejs'

import { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { connectMongo } from '@/lib/db'
import { User } from '@/lib/models'
import { CommissionService } from '@/lib/commission-service'
import { USER_ROLES, ROLE_HIERARCHY } from '@/lib/config'

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
  
  const payload = requireRole(authz, ['associate_master', 'master', 'senior_master', 'super_master', 'super_admin'])
  if (!payload) {
    return new Response(JSON.stringify({ error: 'forbidden', details: 'Authentication required' }), { status: 403 })
  }

  const { username, password, role, points = 0 } = await req.json()

  // Validate role hierarchy
  if (!CommissionService.canCreateRole(payload.role, role)) {
    return new Response(JSON.stringify({ 
      error: 'invalid_role', 
      details: `You cannot create accounts with role: ${role}` 
    }), { status: 400 })
  }

  // Check if username already exists
  const existingUser = await User.findOne({ username })
  if (existingUser) {
    return new Response(JSON.stringify({ error: 'username_exists' }), { status: 400 })
  }

  // Generate referral code
  const referralCode = Math.random().toString(36).substring(2, 8).toUpperCase()

  // Create user
  const passwordHash = await bcrypt.hash(password, 10)
  const user = await User.create({
    username,
    passwordHash,
    role,
    points,
    parentMasterId: payload.id,
    referralCode,
    referredBy: payload.id
  })

  return Response.json({
    success: true,
    message: `User "${username}" created successfully with ${points} points!`,
    user: {
      id: user._id,
      username: user.username,
      role: user.role,
      points: user.points,
      referralCode: user.referralCode
    }
  })
}
