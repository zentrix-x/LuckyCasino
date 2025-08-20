export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { connectMongo } from '@/lib/db'
import { Transaction } from '@/lib/models'
import jwt from 'jsonwebtoken'

export async function GET(request: NextRequest) {
  try {
    await connectMongo()

    // Get JWT token from Authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret') as any
    const userId = decoded.id

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')

    // Fetch user's transactions
    const transactions = await Transaction.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)

    // Format the response
    const formattedTransactions = transactions.map(tx => ({
      id: tx._id.toString(),
      type: tx.type,
      amount: tx.amount,
      balanceAfter: tx.balanceAfter,
      createdAt: tx.createdAt.toISOString(),
      meta: tx.meta
    }))

    return NextResponse.json(formattedTransactions)

  } catch (error) {
    console.error('Error fetching user transactions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

