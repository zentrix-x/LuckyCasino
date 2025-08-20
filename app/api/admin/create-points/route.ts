export const runtime = 'nodejs'

import { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'
import { connectMongo } from '@/lib/db'
import { User, Transaction } from '@/lib/models'

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
  
  const payload = requireRole(authz, ['super_admin'])
  if (!payload) {
    return new Response(JSON.stringify({ error: 'forbidden', details: 'Super admin access required' }), { status: 403 })
  }

  const { targetUserId, points, action = 'add' } = await req.json()

  // Get target user
  const targetUser = await User.findById(targetUserId)
  if (!targetUser) {
    return new Response(JSON.stringify({ error: 'user_not_found' }), { status: 404 })
  }

  // Validate points
  if (points <= 0) {
    return new Response(JSON.stringify({ error: 'invalid_points' }), { status: 400 })
  }

  if (action === 'remove') {
    // Remove points from target user
    if (targetUser.points < points) {
      return new Response(JSON.stringify({ error: 'insufficient_points' }), { status: 400 })
    }

    targetUser.points -= points
    await targetUser.save()

    // Record transaction
    await Transaction.create({
      userId: targetUser._id,
      type: 'adjustment',
      amount: -points,
      balanceAfter: targetUser.points,
      meta: { action: 'removed_by_super_admin', superAdminId: payload.id }
    })

  } else {
    // Add points to target user (create out of thin air)
    targetUser.points += points
    await targetUser.save()

    // Record transaction
    await Transaction.create({
      userId: targetUser._id,
      type: 'adjustment',
      amount: points,
      balanceAfter: targetUser.points,
      meta: { action: 'created_by_super_admin', superAdminId: payload.id }
    })
  }

  const actionText = action === 'add' ? 'created for' : 'removed from'
  const message = `${points.toLocaleString()} points ${actionText} ${targetUser.username}! New balance: ${targetUser.points.toLocaleString()} points`

  return Response.json({
    success: true,
    message,
    targetUser: {
      id: targetUser._id,
      username: targetUser.username,
      points: targetUser.points
    }
  })
}
