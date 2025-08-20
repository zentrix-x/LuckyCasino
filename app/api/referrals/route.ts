import { NextRequest, NextResponse } from 'next/server'
import { connectMongo } from '@/lib/db'
import { Referral } from '@/lib/models/referral'
import { User } from '@/lib/models/user'
import { verifyToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    await connectMongo()
    
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const userId = decoded.userId

    // Get user's referrals
    const referrals = await Referral.find({ referrerId: userId })
      .populate('referredId', 'username avatar')
      .lean()

    // Get user's referral code
    const user = await User.findById(userId).select('referralCode')
    const referralCode = user?.referralCode || `USER${userId.toString().slice(-6).toUpperCase()}`

    // Calculate stats
    const totalReferrals = referrals.length
    const activeReferrals = referrals.filter(r => r.status === 'active').length
    const totalEarned = referrals.reduce((sum, r) => sum + r.rewardEarned, 0)
    const nextMilestone = Math.max(0, 5 - totalReferrals)

    // Format referrals for frontend
    const formattedReferrals = referrals.map(ref => ({
      id: ref._id.toString(),
      username: (ref.referredId as any)?.username || 'Unknown User',
      avatar: (ref.referredId as any)?.avatar,
      joinedDate: ref.joinedDate.toISOString().split('T')[0],
      status: ref.status,
      rewardEarned: ref.rewardEarned
    }))

    const stats = {
      totalReferrals,
      activeReferrals,
      totalEarned,
      nextMilestone
    }

    return NextResponse.json({
      referrals: formattedReferrals,
      referralCode,
      referralLink: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/ref/${referralCode}`,
      stats
    })
  } catch (error) {
    console.error('Error fetching referrals:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectMongo()
    
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { referralCode } = await request.json()
    const userId = decoded.userId

    // Find user with this referral code
    const referrer = await User.findOne({ referralCode })
    if (!referrer) {
      return NextResponse.json({ error: 'Invalid referral code' }, { status: 400 })
    }

    if (referrer._id.toString() === userId) {
      return NextResponse.json({ error: 'Cannot refer yourself' }, { status: 400 })
    }

    // Check if already referred
    const existingReferral = await Referral.findOne({
      $or: [
        { referrerId: referrer._id, referredId: userId },
        { referrerId: userId, referredId: referrer._id }
      ]
    })

    if (existingReferral) {
      return NextResponse.json({ error: 'Referral relationship already exists' }, { status: 400 })
    }

    // Create referral
    const referral = await Referral.create({
      referrerId: referrer._id,
      referredId: userId,
      referralCode,
      status: 'pending'
    })

    // Update referrer's stats
    await User.findByIdAndUpdate(referrer._id, {
      $inc: { totalReferrals: 1 }
    })

    return NextResponse.json({ referral })
  } catch (error) {
    console.error('Error creating referral:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
