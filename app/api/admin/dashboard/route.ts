export const runtime = 'nodejs'

import { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'
import { connectMongo } from '@/lib/db'
import { User, GameRound, Bet, Transaction, CommissionLedger, Presence } from '@/lib/models'

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
  
  const payload = requireRole(authz, ['super_admin', 'super_master', 'senior_master', 'master', 'associate_master'])
  if (!payload) {
    return new Response(JSON.stringify({ error: 'forbidden', details: 'Admin access required' }), { status: 403 })
  }

  try {
    // Check cache first for high scalability
    const { cacheManager } = await import('@/lib/cache')
    const cacheKey = `admin:dashboard:${payload.id}`
    
    // Try to get cached data, but don't fail if Redis is not available
    let cachedData = null
    try {
      cachedData = await cacheManager.getAdminStats(cacheKey)
    } catch (cacheError) {
      console.log('⚠️ Cache not available, proceeding without cache')
    }
    
    if (cachedData) {
      console.log('📊 Serving admin dashboard from cache')
      return Response.json(cachedData)
    }

    // Optimized parallel queries for high scalability
    const [
      totalUsers,
      totalMasters,
      totalSystemPoints,
      userPoints,
      masterPoints,
      onlineUsers
    ] = await Promise.all([
      User.countDocuments({ role: 'user' }).lean(),
      User.countDocuments({ role: { $ne: 'user' } }).lean(),
      User.aggregate([
        { $group: { _id: null, totalPoints: { $sum: '$points' } } }
      ]),
      User.aggregate([
        { $match: { role: 'user' } },
        { $group: { _id: null, totalPoints: { $sum: '$points' } } }
      ]),
      User.aggregate([
        { $match: { role: { $ne: 'user' } } },
        { $group: { _id: null, totalPoints: { $sum: '$points' } } }
      ]),
      Presence.countDocuments({
        'lastSeen': { $gte: new Date(Date.now() - 5 * 60 * 1000) }
      }).lean()
    ])
    

    
    // Debug: Get all presence records
    const allPresence = await Presence.find().sort({ lastSeen: -1 }).limit(10)


    // Get game statistics for last 24 hours
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const gameStats = await GameRound.aggregate([
      { $match: { createdAt: { $gte: yesterday } } },
      { $group: { 
        _id: '$gameType', 
        totalRounds: { $sum: 1 },
        totalBets: { $sum: '$totalBets' },
        totalPayout: { $sum: '$totalPayout' },
        houseProfit: { $sum: { $subtract: ['$totalBets', '$totalPayout'] } }
      }}
    ])

    // Get commission statistics
    const commissionStats = await CommissionLedger.aggregate([
      { $match: { createdAt: { $gte: yesterday } } },
      { $group: { 
        _id: '$level', 
        totalCommissions: { $sum: '$amount' },
        commissionCount: { $sum: 1 }
      }}
    ])

    // Get recent transactions
    const recentTransactions = await Transaction.find()
      .populate('userId', 'username role')
      .sort({ createdAt: -1 })
      .limit(20)

    // Get current game rounds
    const currentRounds = await GameRound.find({ status: 'betting' })
      .sort({ roundEndAt: 1 })

    // Get user hierarchy statistics
    const userHierarchy = await User.aggregate([
      { $group: { 
        _id: '$role', 
        count: { $sum: 1 },
        totalPoints: { $sum: '$points' }
      }}
    ])

    // Get downline users for the requesting admin
    const downlineUsers = await User.find({ 
      parentMasterId: payload.id 
    }).select('username role points createdAt lastSeen')

    // Calculate total commission earned by this admin
    const adminCommissions = await CommissionLedger.aggregate([
      { $match: { masterId: payload.id } },
      { $group: { 
        _id: null, 
        totalCommissions: { $sum: '$amount' }
      }}
    ])

    const dashboardData = {
      success: true,
      dashboard: {
        // User Statistics
        users: {
          total: totalUsers,
          masters: totalMasters,
          online: onlineUsers,
          hierarchy: userHierarchy
        },
        
        // Point Statistics
        points: {
          totalSystem: totalSystemPoints[0]?.totalPoints || 0,
          withUsers: userPoints[0]?.totalPoints || 0,
          withMasters: masterPoints[0]?.totalPoints || 0
        },
        
        // Game Statistics (24 hours)
        games: {
          stats: gameStats,
          currentRounds: currentRounds.map(round => ({
            id: round._id,
            gameType: round.gameType,
            status: round.status,
            totalBets: round.totalBets || 0,
            roundEndAt: round.roundEndAt
          }))
        },
        
        // Commission Statistics
        commissions: {
          stats: commissionStats,
          adminTotal: adminCommissions[0]?.totalCommissions || 0
        },
        
        // Recent Activity
        recentTransactions: recentTransactions
          .filter(tx => tx.userId) // Filter out transactions with null userId
          .map(tx => ({
            id: tx._id,
            userId: tx.userId._id,
            username: tx.userId.username,
            role: tx.userId.role,
            type: tx.type,
            amount: tx.amount,
            balanceAfter: tx.balanceAfter,
            createdAt: tx.createdAt,
            meta: tx.meta
          })),
        
        // Admin's Downline
        downline: downlineUsers.map(user => ({
          id: user._id,
          username: user.username,
          role: user.role,
          points: user.points,
          createdAt: user.createdAt,
          lastSeen: user.lastSeen,
          isOnline: user.lastSeen && user.lastSeen > fiveMinutesAgo
        }))
      }
    }

    // Cache the dashboard data for 5 minutes for better performance
    try {
      await cacheManager.setAdminStats(cacheKey, dashboardData, 300)
    } catch (cacheError) {
      // Silently fail cache operations for better performance
    }
    
    return Response.json(dashboardData)
  } catch (error) {
    console.error('Admin dashboard error:', error)
    return new Response(JSON.stringify({ error: 'server_error' }), { status: 500 })
  }
}
