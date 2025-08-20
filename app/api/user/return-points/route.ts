export const runtime = 'nodejs'

import { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'
import { connectMongo } from '@/lib/db'
import { User, Transaction } from '@/lib/models'

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

export async function POST(req: NextRequest) {
  await connectMongo()
  const authz = req.headers.get('authorization')
  
  const payload = requireAuth(authz)
  if (!payload) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 })
  }

  const { amount, masterId } = await req.json()

  try {
    const user = await User.findById(payload.id)
    const master = await User.findById(masterId)

    if (!user || !master) {
      return new Response(JSON.stringify({ error: 'user_not_found' }), { status: 404 })
    }

    // Validate that the master is actually the user's master
    if (user.parentMasterId?.toString() !== masterId) {
      return new Response(JSON.stringify({ error: 'invalid_master' }), { status: 400 })
    }

    // Validate amount
    if (!amount || amount <= 0) {
      return new Response(JSON.stringify({ error: 'invalid_amount' }), { status: 400 })
    }

    if (amount < 100) {
      return new Response(JSON.stringify({ error: 'minimum_amount_100' }), { status: 400 })
    }

    if (amount > user.points) {
      return new Response(JSON.stringify({ error: 'insufficient_points' }), { status: 400 })
    }

    // Transfer points
    user.points -= amount
    master.points += amount

    await user.save()
    await master.save()

    // Record transactions
    await Transaction.create({
      userId: user._id,
      type: 'point_return',
      amount: -amount,
      balanceAfter: user.points,
      meta: { 
        action: 'returned_to_master', 
        masterId: master._id,
        masterUsername: master.username
      }
    })

    await Transaction.create({
      userId: master._id,
      type: 'point_return',
      amount: amount,
      balanceAfter: master.points,
      meta: { 
        action: 'received_from_user', 
        userId: user._id,
        userUsername: user.username
      }
    })

    return Response.json({
      success: true,
      message: `Successfully returned ${amount.toLocaleString()} points to ${master.username}`,
      user: {
        id: user._id,
        username: user.username,
        points: user.points
      },
      master: {
        id: master._id,
        username: master.username,
        points: master.points
      }
    })

  } catch (error) {
    console.error('Return points error:', error)
    return new Response(JSON.stringify({ error: 'server_error' }), { status: 500 })
  }
}



