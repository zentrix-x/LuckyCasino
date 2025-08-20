"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useEffect, useState } from "react"
import { useAuth } from "@/hooks/use-auth"
import React from "react"

interface GameHistoryItem {
  id: string
  gameType: string
  betAmount: number
  outcome: string
  result: 'won' | 'lost' | 'pending'
  payout?: number
  roundId: string
  createdAt: string
}

interface TransactionItem {
  id: string
  type: string
  amount: number
  balanceAfter: number
  createdAt: string
  meta?: any
}

export const UserGameHistory = React.memo(function UserGameHistory() {
  const { user } = useAuth()
  const [gameHistory, setGameHistory] = useState<GameHistoryItem[]>([])
  const [transactions, setTransactions] = useState<TransactionItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUserHistory = async () => {
      if (!user) return

      try {
        const token = localStorage.getItem('jwt')
        if (!token) return

        // Fetch user's bets
        const betsResponse = await fetch('/api/user/bets', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        // Fetch user's transactions
        const transactionsResponse = await fetch('/api/user/transactions', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (betsResponse.ok) {
          const betsData = await betsResponse.json()
          setGameHistory(betsData)
        }

        if (transactionsResponse.ok) {
          const transactionsData = await transactionsResponse.json()
          setTransactions(transactionsData)
        }
      } catch (error) {
        console.error('Failed to fetch user history:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUserHistory()
  }, [user])

  const formatGameType = (gameType: string) => {
    switch (gameType) {
      case 'seven_up_down': return '7Up 7Down'
      case 'spin_win': return 'Spin & Win'
      case 'lottery_0_99': return 'Lottery'
      default: return gameType
    }
  }

  const formatTransactionType = (type: string) => {
    switch (type) {
      case 'bet_debit': return 'Bet Placed'
      case 'payout_credit': return 'Won'
      case 'point_allocation': return 'Points Added'
      case 'point_transfer': return 'Points Transferred'
      case 'commission_credit': return 'Commission'
      case 'point_return': return 'Points Returned'
      default: return type
    }
  }

  const getResultColor = (result: string) => {
    switch (result) {
      case 'won': return 'bg-green-500'
      case 'lost': return 'bg-red-500'
      case 'pending': return 'bg-yellow-500'
      default: return 'bg-gray-500'
    }
  }

  const getTransactionColor = (amount: number) => {
    return amount > 0 ? 'text-green-400' : 'text-red-400'
  }

  if (loading) {
    return (
      <Card className="bg-white/10 border-white/20 text-white">
        <CardHeader>
          <CardTitle>Game History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-white/60">
            Loading your game history...
          </div>
        </CardContent>
      </Card>
    )
  }

  const hasHistory = gameHistory.length > 0 || transactions.length > 0

  if (!hasHistory) {
    return (
      <Card className="bg-white/10 border-white/20 text-white">
        <CardHeader>
          <CardTitle>Game History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-white/60">
            No game history yet. Start playing to see your results!
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Game History */}
      {gameHistory.length > 0 && (
        <Card className="bg-white/10 border-white/20 text-white">
          <CardHeader>
            <CardTitle>Recent Games</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/20">
                    <TableHead className="text-white">Game</TableHead>
                    <TableHead className="text-white">Bet</TableHead>
                    <TableHead className="text-white">Outcome</TableHead>
                    <TableHead className="text-white">Result</TableHead>
                    <TableHead className="text-white">Payout</TableHead>
                    <TableHead className="text-white">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {gameHistory.slice(0, 10).map((game) => (
                    <TableRow key={game.id} className="border-white/20">
                      <TableCell className="text-white font-medium">
                        {formatGameType(game.gameType)}
                      </TableCell>
                      <TableCell className="text-white">
                        {game.betAmount.toLocaleString()} pts
                      </TableCell>
                      <TableCell className="text-white">
                        {game.outcome}
                      </TableCell>
                      <TableCell>
                        <Badge className={`${getResultColor(game.result)} text-white`}>
                          {game.result.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-white">
                        {game.payout ? `${game.payout.toLocaleString()} pts` : '-'}
                      </TableCell>
                      <TableCell className="text-white text-sm">
                        {new Date(game.createdAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transaction History */}
      {transactions.length > 0 && (
        <Card className="bg-white/10 border-white/20 text-white">
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/20">
                    <TableHead className="text-white">Type</TableHead>
                    <TableHead className="text-white">Amount</TableHead>
                    <TableHead className="text-white">Balance</TableHead>
                    <TableHead className="text-white">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.slice(0, 10).map((tx) => (
                    <TableRow key={tx.id} className="border-white/20">
                      <TableCell className="text-white font-medium">
                        {formatTransactionType(tx.type)}
                      </TableCell>
                      <TableCell className={`font-bold ${getTransactionColor(tx.amount)}`}>
                        {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString()} pts
                      </TableCell>
                      <TableCell className="text-white">
                        {tx.balanceAfter.toLocaleString()} pts
                      </TableCell>
                      <TableCell className="text-white text-sm">
                        {new Date(tx.createdAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
})
