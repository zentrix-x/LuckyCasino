"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/hooks/use-auth"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
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
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const [activeGame, setActiveGame] = useState<string | null>(null)
  const [showReturnModal, setShowReturnModal] = useState(false)
  const [activeTab, setActiveTab] = useState<string>("games")

  // Only show mobile navigation on the main dashboard page
  const isDashboardPage = pathname === "/"

  // Handle URL parameters for tab switching
  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab && ['games', 'recent', 'history', 'community', 'manage', 'admin', 'super'].includes(tab)) {
      setActiveTab(tab)
    }
  }, [searchParams])

  // Update URL when tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value)
    const url = new URL(window.location.href)
    url.searchParams.set('tab', value)
    router.replace(url.pathname + url.search, { scroll: false })
  }

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
    <div 
      className="min-h-screen relative"
      style={{
        backgroundImage: 'url(/images/backgrounds/game-room.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Semi-transparent overlay for better readability while keeping background visible */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px]"></div>
      
      {/* Content */}
      <div className="relative z-10">
      {/* Enhanced Header */}
      <header className="border-b-2 border-yellow-400/40 bg-gradient-to-r from-black/80 via-black/70 to-black/80 backdrop-blur-2xl shadow-2xl">
        <div className="container mx-auto px-4 py-6 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 rounded-full flex items-center justify-center shadow-2xl">
                <span className="text-black font-black text-xl">🎰</span>
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-ping"></div>
            </div>
            <div>
              <h1 className="text-3xl font-black text-white">
                <span className="bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent">LUCKY</span>{" "}
                <span className="bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">CASINO</span>
              </h1>
              <p className="text-yellow-400 text-sm font-bold">🎯 VIP GAMING EXPERIENCE</p>
            </div>
            <Badge className={`${getRoleBadgeColor(user.role)} text-white font-black px-4 py-2 text-sm shadow-xl max-[450px]:hidden`}>
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
            {/* Mobile menu button */}
            <button
              className="max-[639px]:block min-[640px]:hidden relative group"
              onClick={() => {
                // This will be handled by the MobileNavigation component
                const mobileNav = document.querySelector('.mobile-menu-btn') as HTMLElement
                if (mobileNav) mobileNav.click()
              }}
              aria-label="Toggle mobile menu"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
              <span className="relative block w-6 h-0.5 bg-white transition-all duration-300"></span>
              <span className="relative block w-6 h-0.5 bg-white transition-all duration-300 mt-1.5"></span>
              <span className="relative block w-6 h-0.5 bg-white transition-all duration-300 mt-1.5"></span>
            </button>
            <Button variant="outline" onClick={logout} className="min-[640px]:block max-[639px]:hidden">
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
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

          <TabsContent value="games" className="mt-8">
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="bg-purple-100/60 border-2 border-purple-200/60 text-gray-800 cursor-pointer hover:scale-105 transition-all duration-300 shadow-xl group backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <div className="relative">
                    <div className="w-full h-32 bg-purple-100/40 rounded-lg mb-4 flex items-center justify-center">
                      <div className="relative">
                        <div className="w-20 h-20 bg-gradient-to-r from-red-500 to-blue-500 rounded-full flex items-center justify-center shadow-lg">
                          <div className="flex gap-1">
                            <TrendingDown className="w-6 h-6 text-white" />
                            <Target className="w-6 h-6 text-white" />
                            <TrendingUp className="w-6 h-6 text-white" />
                          </div>
                        </div>
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-md">
                          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        </div>
                      </div>
                    </div>
                    <div className="absolute top-2 right-2 flex gap-2">
                      <Badge className="bg-purple-500 text-white font-bold px-2 py-1 text-xs">Up to 11.5x</Badge>
                      <Badge className="bg-green-500 text-white font-bold px-2 py-1 text-xs">🔥 LIVE</Badge>
                    </div>
                  </div>
                  <CardTitle className="text-2xl font-black text-gray-800">7Up 7Down</CardTitle>
                  <CardDescription className="text-gray-700 text-base">
                    Predict if the next number will be above 7, below 7, or exactly 7. High payouts for exact matches!
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="text-gray-700 font-semibold">Live Now</span>
                      </div>
                      <span className="text-gray-700 font-semibold">Max: 11.5x</span>
                    </div>
                    <Button
                      className="w-full h-16 bg-purple-500 hover:bg-purple-600 text-white font-bold shadow-lg hover:scale-105 transition-all duration-300"
                      onClick={() => navigateToGame("7up7down")}
                      disabled={activeGame === "7up7down"}
                    >
                      {activeGame === "7up7down" ? "Loading..." : "🎮 Play Now"}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-green-100/60 border-2 border-green-200/60 text-gray-800 cursor-pointer hover:scale-105 transition-all duration-300 shadow-xl group backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <div className="relative">
                    <div className="w-full h-32 bg-green-100/40 rounded-lg mb-4 flex items-center justify-center">
                      <div className="relative">
                        <div className="w-20 h-20 bg-gradient-to-r from-purple-400 to-yellow-400 rounded-full flex items-center justify-center shadow-lg">
                          <Zap className="w-10 h-10 text-white" />
                        </div>
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-md">
                          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        </div>
                      </div>
                    </div>
                    <div className="absolute top-2 right-2 flex gap-2">
                      <Badge className="bg-green-500 text-white font-bold px-2 py-1 text-xs">Up to 13.5x</Badge>
                      <Badge className="bg-green-500 text-white font-bold px-2 py-1 text-xs">🔥 LIVE</Badge>
                    </div>
                  </div>
                  <CardTitle className="text-2xl font-black text-gray-800">Spin & Win</CardTitle>
                  <CardDescription className="text-gray-700 text-base">
                    Watch the wheel spin and bet on red, black, or green. Feel the excitement of every spin!
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="text-gray-700 font-semibold">Live Now</span>
                      </div>
                      <span className="text-gray-700 font-semibold">Max: 13.5x</span>
                    </div>
                    <Button
                      className="w-full h-16 bg-green-500 hover:bg-green-600 text-white font-bold shadow-lg hover:scale-105 transition-all duration-300"
                      onClick={() => navigateToGame("spinwin")}
                      disabled={activeGame === "spinwin"}
                    >
                      {activeGame === "spinwin" ? "Loading..." : "🎮 Play Now"}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-pink-100/60 border-2 border-pink-200/60 text-gray-800 cursor-pointer hover:scale-105 transition-all duration-300 shadow-xl group backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <div className="relative">
                    <div className="w-full h-32 bg-pink-100/40 rounded-lg mb-4 flex items-center justify-center">
                      <div className="relative">
                        <div className="w-20 h-20 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center justify-center shadow-lg">
                          <Ticket className="w-10 h-10 text-white" />
                        </div>
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-md">
                          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        </div>
                      </div>
                    </div>
                    <div className="absolute top-2 right-2 flex gap-2">
                      <Badge className="bg-red-500 text-white font-bold px-2 py-1 text-xs">Up to 95x</Badge>
                      <Badge className="bg-red-500 text-white font-bold px-2 py-1 text-xs">🔥 LIVE</Badge>
                    </div>
                  </div>
                  <CardTitle className="text-2xl font-black text-gray-800">Lottery</CardTitle>
                  <CardDescription className="text-gray-700 text-base">
                    Pick your lucky numbers from 0-99. Exact matches pay huge, range matches pay well!
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="text-gray-700 font-semibold">Live Now</span>
                      </div>
                      <span className="text-gray-700 font-semibold">Max: 95x</span>
                    </div>
                    <Button
                      className="w-full h-16 bg-red-500 hover:bg-red-600 text-white font-bold shadow-lg hover:scale-105 transition-all duration-300"
                      onClick={() => navigateToGame("lottery")}
                      disabled={activeGame === "lottery"}
                    >
                      {activeGame === "lottery" ? "Loading..." : "🎮 Play Now"}
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
      
      {/* Mobile Navigation (rendered at root level) - only on dashboard page */}
      {isDashboardPage && (
        <div className="max-[639px]:block min-[640px]:hidden">
          <MobileNavigation />
        </div>
      )}
    </div>
  )
}
