"use client"

import { useState, useEffect } from 'react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@/hooks/use-auth'
import { toast } from 'sonner'
import { Play, AlertTriangle } from 'lucide-react'

interface DashboardData {
  users: {
    total: number
    masters: number
    online: number
    hierarchy: Array<{ _id: string; count: number; totalPoints: number }>
  }
  points: {
    totalSystem: number
    withUsers: number
    withMasters: number
  }
  games: {
    stats: Array<{
      _id: string
      totalRounds: number
      totalBets: number
      totalPayout: number
      houseProfit: number
    }>
    currentRounds: Array<{
      id: string
      gameType: string
      status: string
      totalBets: number
      roundEndAt: string
    }>
  }
  commissions: {
    stats: Array<{
      _id: number
      totalCommissions: number
      commissionCount: number
    }>
    adminTotal: number
  }
  recentTransactions: Array<{
    id: string
    userId: string
    username: string
    role: string
    type: string
    amount: number
    balanceAfter: number
    createdAt: string
    meta: any
  }>
  downline: Array<{
    id: string
    username: string
    role: string
    points: number
    createdAt: string
    lastSeen?: string
    isOnline?: boolean
  }>
}

export function AdminDashboardPanel() {
  const { user } = useAuth()
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [settling, setSettling] = useState(false)

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('jwt')
      if (!token) {
        toast.error('No authentication token found')
        setLoading(false)
        return
      }

      const response = await fetch('/api/admin/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
    
        setDashboardData(data.dashboard)
      } else {
        const errorData = await response.json()
        console.error('Dashboard API error:', errorData)
        toast.error(`Failed to load dashboard: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Failed to fetch dashboard:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const handleSettlePendingGames = async () => {
    try {
      setSettling(true)
      const token = localStorage.getItem('jwt')
      if (!token) {
        toast.error('No authentication token found')
        return
      }

      const response = await fetch('/api/admin/settle-pending', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const result = await response.json()
        toast.success(`Successfully settled ${result.settled} games!`)
        if (result.errors > 0) {
          toast.warning(`${result.errors} games had errors during settlement`)
        }
        // Refresh dashboard data
        fetchDashboardData()
      } else {
        const errorData = await response.json()
        toast.error(`Settlement failed: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Failed to settle games:', error)
      toast.error('Failed to settle pending games')
    } finally {
      setSettling(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
    const interval = setInterval(fetchDashboardData, 60000)
    return () => clearInterval(interval)
  }, [])

  const getRoleColor = (role: string) => {
    const colors = {
      user: 'bg-gray-500',
      associate_master: 'bg-blue-500',
      master: 'bg-green-500',
      senior_master: 'bg-purple-500',
      super_master: 'bg-orange-500',
      super_admin: 'bg-red-500'
    }
    return colors[role as keyof typeof colors] || 'bg-gray-500'
  }

  const formatRole = (role: string) => {
    return role.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
  }

  const formatGameType = (gameType: string) => {
    const gameNames = {
      'seven_up_down': '7Up 7Down',
      'spin_win': 'Spin & Win',
      'lottery_0_99': 'Lottery (0-99)'
    }
    return gameNames[gameType as keyof typeof gameNames] || gameType
  }

  if (loading) {
    return (
      <Card className="bg-white/10 border-white/20 text-white">
        <CardHeader>
          <CardTitle>Admin Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
            <p className="mt-2 text-white/60">Loading dashboard...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!dashboardData) {
    return (
      <Card className="bg-white/10 border-white/20 text-white">
        <CardContent>
          <div className="text-center py-8">
            <p className="text-white/60">Failed to load dashboard data</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-white/10 border-white/20 text-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-lg">📊</span>
          Admin Dashboard
          <Badge className="bg-green-500 text-white">
            {user?.role ? formatRole(user.role) : 'Admin'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-white/10 dark:bg-gray-800/50 border border-white/20 dark:border-gray-700 rounded-lg p-1 gap-1 overflow-hidden">
            <TabsTrigger value="overview" className="w-full text-sm text-gray-800 dark:text-gray-200 data-[state=active]:bg-white/20 dark:data-[state=active]:bg-gray-700/50 data-[state=active]:text-black dark:data-[state=active]:text-white rounded-md px-2 py-2 focus-visible:outline-none focus:outline-none ring-0 shadow-none">Overview</TabsTrigger>
            <TabsTrigger value="games" className="w-full text-sm text-gray-800 dark:text-gray-200 data-[state=active]:bg-white/20 dark:data-[state=active]:bg-gray-700/50 data-[state=active]:text-black dark:data-[state=active]:text-white rounded-md px-2 py-2 focus-visible:outline-none focus:outline-none ring-0 shadow-none">Games</TabsTrigger>
            <TabsTrigger value="commissions" className="w-full text-sm text-gray-800 dark:text-gray-200 data-[state=active]:bg-white/20 dark:data-[state=active]:bg-gray-700/50 data-[state=active]:text-black dark:data-[state=active]:text-white rounded-md px-2 py-2 focus-visible:outline-none focus:outline-none ring-0 shadow-none">Commissions</TabsTrigger>
            <TabsTrigger value="transactions" className="w-full text-sm text-gray-800 dark:text-gray-200 data-[state=active]:bg-white/20 dark:data-[state=active]:bg-gray-700/50 data-[state=active]:text-black dark:data-[state=active]:text-white rounded-md px-2 py-2 focus-visible:outline-none focus:outline-none ring-0 shadow-none">Transactions</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Settlement Button */}
            <Card className="bg-orange-500/20 border-orange-500/30">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                  <div>
                    <p className="text-sm text-orange-200">Pending Games</p>
                    <p className="text-base sm:text-lg font-semibold text-white">Manual Settlement</p>
                  </div>
                  <Button
                    onClick={handleSettlePendingGames}
                    disabled={settling}
                    className="bg-orange-600 hover:bg-orange-700 text-white w-full sm:w-auto text-sm sm:text-base px-3 sm:px-4"
                  >
                    {settling ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Settling...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        Settle All Pending
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-xs text-orange-200 mt-2">
                  Resolve all pending games that have passed their end time
                </p>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-blue-500/20 border-blue-500/30">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-blue-200">Total Users</p>
                      <p className="text-2xl font-bold text-white">{dashboardData.users.total.toLocaleString()}</p>
                    </div>
                    <span className="text-2xl">👥</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-green-500/20 border-green-500/30">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-green-200">Online Users</p>
                      <p className="text-2xl font-bold text-white">{dashboardData.users.online.toLocaleString()}</p>
                    </div>
                    <span className="text-2xl">🟢</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-purple-500/20 border-purple-500/30">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-purple-200">Total Points</p>
                      <p className="text-2xl font-bold text-white">{dashboardData.points.totalSystem.toLocaleString()}</p>
                    </div>
                    <span className="text-2xl">💰</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-orange-500/20 border-orange-500/30">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-orange-200">Your Commissions</p>
                      <p className="text-2xl font-bold text-white">{dashboardData.commissions.adminTotal.toLocaleString()}</p>
                    </div>
                    <span className="text-2xl">💸</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-white/5 border-white/20">
              <CardHeader>
                <CardTitle className="text-lg">Points Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm text-white/60 mb-2">With Users</h4>
                    <p className="text-xl font-bold text-white">{dashboardData.points.withUsers.toLocaleString()}</p>
                  </div>
                  <div>
                    <h4 className="text-sm text-white/60 mb-2">With Masters</h4>
                    <p className="text-xl font-bold text-white">{dashboardData.points.withMasters.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="games" className="space-y-6">
            <Card className="bg-white/5 border-white/20">
              <CardHeader>
                <CardTitle className="text-lg">24-Hour Game Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-white/20">
                        <TableHead className="text-white">Game</TableHead>
                        <TableHead className="text-white">Rounds</TableHead>
                        <TableHead className="text-white">Total Bets</TableHead>
                        <TableHead className="text-white">Total Payout</TableHead>
                        <TableHead className="text-white">House Profit</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dashboardData.games.stats.map((stat) => (
                        <TableRow key={stat._id} className="border-white/20">
                          <TableCell className="text-white font-medium">
                            {formatGameType(stat._id)}
                          </TableCell>
                          <TableCell className="text-white">{stat.totalRounds}</TableCell>
                          <TableCell className="text-white">{stat.totalBets.toLocaleString()}</TableCell>
                          <TableCell className="text-white">{stat.totalPayout.toLocaleString()}</TableCell>
                          <TableCell className="text-white font-bold text-green-400">
                            {stat.houseProfit.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="commissions" className="space-y-6">
            <Card className="bg-white/5 border-white/20">
              <CardHeader>
                <CardTitle className="text-lg">Your Commission Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center mb-6">
                  <p className="text-3xl font-bold text-white">{dashboardData.commissions.adminTotal.toLocaleString()}</p>
                  <p className="text-white/60">Total Commissions Earned</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {dashboardData.commissions.stats.map((stat) => (
                    <div key={stat._id} className="text-center">
                      <Badge className="bg-blue-500 text-white mb-2">Level {stat._id}</Badge>
                      <p className="text-lg font-bold text-white">{stat.totalCommissions.toLocaleString()}</p>
                      <p className="text-sm text-white/60">{stat.commissionCount} transactions</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="transactions" className="space-y-6">
            <Card className="bg-white/5 border-white/20">
              <CardHeader>
                <CardTitle className="text-lg">Recent Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-white/20">
                        <TableHead className="text-white">User</TableHead>
                        <TableHead className="text-white">Type</TableHead>
                        <TableHead className="text-white">Amount</TableHead>
                        <TableHead className="text-white">Balance</TableHead>
                        <TableHead className="text-white">Time</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dashboardData.recentTransactions.map((tx) => (
                        <TableRow key={tx.id} className="border-white/20">
                          <TableCell className="text-white">
                            <div>
                              <div className="font-medium">{tx.username}</div>
                              <Badge className={`${getRoleColor(tx.role)} text-white text-xs`}>
                                {formatRole(tx.role)}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="text-white capitalize">
                            {tx.type.replace('_', ' ')}
                          </TableCell>
                          <TableCell className={`font-mono ${
                            tx.amount > 0 ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-white font-mono">
                            {tx.balanceAfter.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-white text-sm">
                            {new Date(tx.createdAt).toLocaleTimeString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
