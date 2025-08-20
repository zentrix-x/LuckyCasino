"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/hooks/use-auth"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useRouter } from "next/navigation"
import { TrendingUp, TrendingDown, Target, Zap, Ticket } from "lucide-react"
import { AdminStatsCards } from "./admin-stats-cards"
import { UserManagementPanel } from "./user-management-panel"
import { GameManagementPanel } from "./game-management-panel"
import { AdminDashboardPanel } from "./admin-dashboard-panel"
import { SuperAdminPanel } from "./super-admin-panel"
import { ThemeToggle } from "@/components/theme-toggle"
import { Leaderboard } from "./leaderboard"
import { Achievements } from "./achievements"
import { DailyRewards } from "./daily-rewards"
import { ReferralSystem } from "./referral-system"
import { MobileNavigation } from "./mobile-navigation"

import { UserGameHistory } from "./user-game-history"
import { UserRecentBets } from "./user-recent-bets"
import { PointReturnModal } from "./point-return-modal"

export function UserDashboard() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [activeGame, setActiveGame] = useState<string | null>(null)
  const [showReturnModal, setShowReturnModal] = useState(false)
  const [activeTab, setActiveTab] = useState<string>("games")

  if (!user) return null

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "super_admin":
        return "bg-red-500"
      case "master":
        return "bg-blue-500"
      default:
        return "bg-green-500"
    }
  }

  const navigateToGame = (gameType: string) => {
    setActiveGame(gameType)
    router.push(`/games/${gameType}`)
    setTimeout(() => {
      setActiveGame(null)
    }, 2000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 dark:from-gray-900 dark:via-blue-950 dark:to-indigo-950">
      {/* Header */}
      <header className="border-b border-white/10 dark:border-gray-700 bg-black/20 dark:bg-gray-900/20 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
              <span className="text-black font-bold text-sm">🎰</span>
            </div>
            <h1 className="text-2xl font-bold text-white">Lucky Casino</h1>
            <Badge className={`${getRoleBadgeColor(user.role)} text-white max-[450px]:hidden`}>
              {user.role.replace("_", " ").toUpperCase()}
            </Badge>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-white max-[639px]:hidden">
              <span className="text-sm opacity-80">Points: </span>
              <span className="font-bold text-lg">{user.points.toLocaleString()}</span>
            </div>
            <div className="text-white max-[639px]:hidden">
              <span className="text-sm opacity-80">Welcome, </span>
              <span className="font-semibold">{user.username}</span>
            </div>
            {user.role === "user" && user.points >= 100 && (
              <Button
                onClick={() => setShowReturnModal(true)}
                className="bg-green-600 hover:bg-green-700 text-white text-sm px-3 py-1 max-[639px]:hidden"
                size="sm"
              >
                💰 Return Points
              </Button>
            )}
            <ThemeToggle />
            {/* Mobile navigation button + overlay */}
            <MobileNavigation />
            <Button variant="outline" onClick={logout} className="min-[640px]:block max-[639px]:hidden">
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Desktop/Tablet tab list (hidden on mobile where mobile-navigation is used) */}
          <TabsList className="flex w-full overflow-x-auto bg-white/10 dark:bg-gray-800/50 border border-white/20 dark:border-gray-700 rounded-xl gap-1 p-1 custom-scrollbar tabs-list min-[640px]:flex max-[639px]:hidden">
            <TabsTrigger value="games" className="text-gray-800 dark:text-gray-200 data-[state=active]:bg-white/20 dark:data-[state=active]:bg-gray-700/50 data-[state=active]:text-black dark:data-[state=active]:text-white rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap flex-shrink-0 min-w-[70px] text-center">Games</TabsTrigger>
            <TabsTrigger value="recent" className="text-gray-800 dark:text-gray-200 data-[state=active]:bg-white/20 dark:data-[state=active]:bg-gray-700/50 data-[state=active]:text-black dark:data-[state=active]:text-white rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap flex-shrink-0 min-w-[85px] text-center">Recent Bets</TabsTrigger>
            <TabsTrigger value="history" className="text-gray-800 dark:text-gray-200 data-[state=active]:bg-white/20 dark:data-[state=active]:bg-gray-700/50 data-[state=active]:text-black dark:data-[state=active]:text-white rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap flex-shrink-0 min-w-[70px] text-center">History</TabsTrigger>
            <TabsTrigger value="community" className="text-gray-800 dark:text-gray-200 data-[state=active]:bg-white/20 dark:data-[state=active]:bg-gray-700/50 data-[state=active]:text-black dark:data-[state=active]:text-white rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap flex-shrink-0 min-w-[85px] text-center">Community</TabsTrigger>
            {(user.role === "associate_master" || user.role === "master" || user.role === "senior_master" || user.role === "super_master" || user.role === "super_admin") && (
              <TabsTrigger value="manage" className="text-gray-800 dark:text-gray-200 data-[state=active]:bg-white/20 dark:data-[state=active]:bg-gray-700/50 data-[state=active]:text-black dark:data-[state=active]:text-white rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap flex-shrink-0 min-w-[70px] text-center">Manage</TabsTrigger>
            )}
            {(user.role === "associate_master" || user.role === "master" || user.role === "senior_master" || user.role === "super_master" || user.role === "super_admin") && (
              <TabsTrigger value="admin" className="text-gray-800 dark:text-gray-200 data-[state=active]:bg-white/20 dark:data-[state=active]:bg-gray-700/50 data-[state=active]:text-black dark:data-[state=active]:text-white rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap flex-shrink-0 min-w-[70px] text-center">Admin</TabsTrigger>
            )}
            {user.role === "super_admin" && (
              <TabsTrigger value="super" className="text-gray-800 dark:text-gray-200 data-[state=active]:bg-white/20 dark:data-[state=active]:bg-gray-700/50 data-[state=active]:text-black dark:data-[state=active]:text-white rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap flex-shrink-0 min-w-[85px] text-center">Super Admin</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="games" className="mt-6">
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="bg-white/10 dark:bg-gray-800/50 border-white/20 dark:border-gray-700 text-white dark:text-gray-200 cursor-pointer hover:bg-white/15 dark:hover:bg-gray-700/50 transition-all duration-200 hover:scale-105">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-blue-500 rounded-full flex items-center justify-center">
                      <div className="flex gap-1">
                        <TrendingDown className="w-4 h-4" />
                        <Target className="w-4 h-4" />
                        <TrendingUp className="w-4 h-4" />
                      </div>
                    </div>
                    <div>
                      <CardTitle>7Up 7Down</CardTitle>
                      <Badge className="bg-green-500 text-white text-xs">Live</Badge>
                    </div>
                  </div>
                  <CardDescription className="text-white/70 dark:text-gray-300">
                    Predict if the next number will be above, below, or exactly 7
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-white/70">Payouts:</span>
                      <span className="text-yellow-400">Up to 11.5x</span>
                    </div>
                    <Button
                      className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-black hover:from-yellow-500 hover:to-orange-600"
                      onClick={() => navigateToGame("7up7down")}
                      disabled={activeGame === "7up7down"}
                    >
                      {activeGame === "7up7down" ? "Loading..." : "Play Now"}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/10 dark:bg-gray-800/50 border-white/20 dark:border-gray-700 text-white dark:text-gray-200 cursor-pointer hover:bg-white/15 dark:hover:bg-gray-700/50 transition-all duration-200 hover:scale-105">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-purple-500 rounded-full flex items-center justify-center">
                      <Zap className="w-6 h-6" />
                    </div>
                    <div>
                      <CardTitle>Spin & Win</CardTitle>
                      <Badge className="bg-green-500 text-white text-xs">Live</Badge>
                    </div>
                  </div>
                  <CardDescription className="text-white/70 dark:text-gray-300">
                    Spin the wheel and win based on where it lands
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-white/70">Payouts:</span>
                      <span className="text-yellow-400">Up to 13.5x</span>
                    </div>
                    <Button
                      className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-black hover:from-yellow-500 hover:to-orange-600"
                      onClick={() => navigateToGame("spinwin")}
                      disabled={activeGame === "spinwin"}
                    >
                      {activeGame === "spinwin" ? "Loading..." : "Play Now"}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/10 dark:bg-gray-800/50 border-white/20 dark:border-gray-700 text-white dark:text-gray-200 cursor-pointer hover:bg-white/15 dark:hover:bg-gray-700/50 transition-all duration-200 hover:scale-105">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                      <Ticket className="w-6 h-6" />
                    </div>
                    <div>
                      <CardTitle>Lottery</CardTitle>
                      <Badge className="bg-green-500 text-white text-xs">Live</Badge>
                    </div>
                  </div>
                  <CardDescription className="text-white/70 dark:text-gray-300">Pick numbers from 0-99 and win big prizes</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-white/70">Payouts:</span>
                      <span className="text-yellow-400">Up to 95x</span>
                    </div>
                    <Button
                      className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-black hover:from-yellow-500 hover:to-orange-600"
                      onClick={() => navigateToGame("lottery")}
                      disabled={activeGame === "lottery"}
                    >
                      {activeGame === "lottery" ? "Loading..." : "Play Now"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="recent" className="mt-6">
            <UserRecentBets />
          </TabsContent>

          <TabsContent value="history" className="mt-6">
            <UserGameHistory />
          </TabsContent>

          <TabsContent value="community" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Leaderboard />
              <DailyRewards />
              <Achievements />
              <ReferralSystem />
            </div>
          </TabsContent>

          {(user.role === "associate_master" || user.role === "master" || user.role === "senior_master" || user.role === "super_master" || user.role === "super_admin") && (
            <TabsContent value="manage" className="mt-6">
              <div className="space-y-6">
                <UserManagementPanel />
              </div>
            </TabsContent>
          )}

          {(user.role === "associate_master" || user.role === "master" || user.role === "senior_master" || user.role === "super_master" || user.role === "super_admin") && (
            <TabsContent value="admin" className="mt-6">
              <div className="space-y-6">
                <AdminStatsCards />
                <AdminDashboardPanel />
                <GameManagementPanel />
              </div>
            </TabsContent>
          )}

          {user.role === "super_admin" && (
            <TabsContent value="super" className="mt-6">
              <div className="space-y-6">
                <SuperAdminPanel />
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>

      {/* Point Return Modal */}
      <PointReturnModal
        isOpen={showReturnModal}
        onClose={() => setShowReturnModal(false)}
        onSuccess={() => {}}
      />
    </div>
  )
}
