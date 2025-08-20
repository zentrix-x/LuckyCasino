export const runtime = 'nodejs'

import { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'
import { connectMongo } from '@/lib/db'
import { User } from '@/lib/models'
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

export async function GET(req: NextRequest) {
  await connectMongo()
  const authz = req.headers.get('authorization')
  
  const payload = requireRole(authz, ['associate_master', 'master', 'senior_master', 'super_master', 'super_admin'])
  if (!payload) {
    return new Response(JSON.stringify({ error: 'forbidden', details: 'Authentication required' }), { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')

  const start = startDate ? new Date(startDate) : undefined
  const end = endDate ? new Date(endDate) : undefined

  try {
    const commissionSummary = await CommissionService.getMasterCommissionSummary(
      payload.id, 
      start, 
      end
    )

    // Get downline users
    const downlineUsers = await User.find({ 
      parentMasterId: payload.id 
    }).select('username role points createdAt')

    // Get total points in system
    const totalSystemPoints = await User.aggregate([
      { $group: { _id: null, totalPoints: { $sum: '$points' } } }
    ])

    // Get total points with users
    const totalUserPoints = await User.aggregate([
      { $match: { role: 'user' } },
      { $group: { _id: null, totalPoints: { $sum: '$points' } } }
    ])

    // Get total points with masters
    const totalMasterPoints = await User.aggregate([
      { $match: { role: { $ne: 'user' } } },
      { $group: { _id: null, totalPoints: { $sum: '$points' } } }
    ])

    return Response.json({
      success: true,
      commissionSummary,
      downlineUsers,
      systemStats: {
        totalSystemPoints: totalSystemPoints[0]?.totalPoints || 0,
        totalUserPoints: totalUserPoints[0]?.totalPoints || 0,
        totalMasterPoints: totalMasterPoints[0]?.totalPoints || 0
      }
    })
  } catch (error) {
    console.error('Commission report error:', error)
    return new Response(JSON.stringify({ error: 'server_error' }), { status: 500 })
  }
}




