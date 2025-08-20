export const runtime = 'nodejs'

import { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'
import { connectMongo } from '@/lib/db'
import { User, Transaction } from '@/lib/models'
import { CommissionService } from '@/lib/commission-service'

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

  const { targetUserId, points, action = 'add' } = await req.json()

  // Get master and target user
  const master = await User.findById(payload.id)
  const targetUser = await User.findById(targetUserId)

  if (!master || !targetUser) {
    return new Response(JSON.stringify({ error: 'user_not_found' }), { status: 404 })
  }

  // Validate point allocation permissions
  if (!CommissionService.canAllocatePoints(master.role, targetUser.role)) {
    return new Response(JSON.stringify({ 
      error: 'invalid_allocation', 
      details: `You cannot allocate points to users with role: ${targetUser.role}` 
    }), { status: 400 })
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
    master.points += points

    await targetUser.save()
    await master.save()

    // Record transactions
    await Transaction.create({
      userId: targetUser._id,
      type: 'adjustment',
      amount: -points,
      balanceAfter: targetUser.points,
      meta: { action: 'removed_by_master', masterId: master._id }
    })

    await Transaction.create({
      userId: master._id,
      type: 'adjustment',
      amount: points,
      balanceAfter: master.points,
      meta: { action: 'received_from_user', targetUserId: targetUser._id }
    })

  } else {
    // Add points to target user
    // Super admin can create unlimited points
    // Other masters can create points if they have sufficient balance
    if (master.role !== 'super_admin' && master.points < points) {
      return new Response(JSON.stringify({ error: 'insufficient_points' }), { status: 400 })
    }

    targetUser.points += points
    
    // Only deduct points from master if not super admin
    if (master.role !== 'super_admin') {
      master.points -= points
      await master.save()
    }

    await targetUser.save()

    // Record transactions
    await Transaction.create({
      userId: targetUser._id,
      type: 'adjustment',
      amount: points,
      balanceAfter: targetUser.points,
      meta: { action: 'allocated_by_master', masterId: master._id }
    })

    if (master.role !== 'super_admin') {
      await Transaction.create({
        userId: master._id,
        type: 'adjustment',
        amount: -points,
        balanceAfter: master.points,
        meta: { action: 'allocated_to_user', targetUserId: targetUser._id }
      })
    } else {
      // Super admin creates points out of thin air
      await Transaction.create({
        userId: master._id,
        type: 'adjustment',
        amount: 0, // No deduction for super admin
        balanceAfter: master.points,
        meta: { action: 'created_points_for_user', targetUserId: targetUser._id, pointsCreated: points }
      })
    }
  }

  return Response.json({
    success: true,
    targetUser: {
      id: targetUser._id,
      username: targetUser.username,
      points: targetUser.points
    },
    master: {
      id: master._id,
      username: master.username,
      points: master.points
    }
  })
}
