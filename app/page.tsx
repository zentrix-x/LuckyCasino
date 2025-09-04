"use client"

import { useState, useMemo } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AuthModal } from "@/components/auth-modal"
import { useAuth } from "@/hooks/use-auth"
import { UserDashboard } from "@/components/user-dashboard"
import { useToast } from "@/hooks/use-toast"
import { ThemeToggle } from "@/components/theme-toggle"
import { Leaderboard } from "@/components/leaderboard"
import { Achievements } from "@/components/achievements"
import { DailyRewards } from "@/components/daily-rewards"
import { ReferralSystem } from "@/components/referral-system"

export default function CasinoHomePage() {
  const [showAuth, setShowAuth] = useState(false)
  const { user } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const { toast } = useToast()

  // Only show UserDashboard on the main dashboard page
  const isDashboardPage = pathname === "/"

  // Memoize the user dashboard to prevent unnecessary re-renders
  const userDashboard = useMemo(() => {
    if (user && isDashboardPage) {
      return <UserDashboard />
    }
    return null
  }, [user, isDashboardPage])

  if (user && isDashboardPage) {
    return userDashboard
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Casino Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url(/images/backgrounds/futuristic-casino-architecture.jpg)',
          filter: 'brightness(0.8) contrast(1.1)'
        }}
      ></div>
      
      {/* Enhanced overlay for better image visibility */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 via-blue-900/25 to-indigo-900/30"></div>
      
      {/* Animated background elements - Enhanced */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Floating casino chips */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-red-500/20 to-red-600/20 rounded-full animate-bounce casino-glow"></div>
        <div className="absolute top-40 right-20 w-24 h-24 bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-full animate-bounce" style={{ animationDelay: "1s" }}></div>
        <div className="absolute bottom-40 left-1/4 w-20 h-20 bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-full animate-bounce casino-glow" style={{ animationDelay: "2s" }}></div>
        <div className="absolute top-1/2 right-1/4 w-16 h-16 bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 rounded-full animate-bounce" style={{ animationDelay: "3s" }}></div>
        
        {/* Sparkling effects */}
        <div className="absolute top-1/3 left-1/3 w-2 h-2 bg-yellow-400 rounded-full animate-ping" style={{ animationDelay: "0.5s" }}></div>
        <div className="absolute top-2/3 right-1/3 w-3 h-3 bg-blue-400 rounded-full animate-ping" style={{ animationDelay: "1.5s" }}></div>
        <div className="absolute bottom-1/3 left-2/3 w-2 h-2 bg-green-400 rounded-full animate-ping" style={{ animationDelay: "2.5s" }}></div>
        
        {/* Glowing orbs */}
        <div className="absolute top-1/4 right-1/4 w-40 h-40 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute bottom-1/4 left-1/4 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-full blur-xl animate-pulse" style={{ animationDelay: "2s" }}></div>
      </div>

      {/* Enhanced Header */}
      <header className="border-b-2 border-yellow-400/40 bg-gradient-to-r from-black/80 via-black/70 to-black/80 backdrop-blur-2xl relative z-10 shadow-2xl">
        <div className="container mx-auto px-4 py-6 sm:py-8 flex flex-col sm:flex-row gap-4 sm:gap-6 items-center justify-center sm:justify-between">
          <div className="flex items-center gap-4 sm:gap-6 w-full sm:w-auto justify-center sm:justify-start mx-auto sm:mx-0">
            <div className="relative">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 rounded-full flex items-center justify-center casino-glow shadow-2xl animate-pulse">
                <span className="text-black font-black text-2xl sm:text-3xl">🎰</span>
              </div>
              <div className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full animate-ping"></div>
              <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-green-500 rounded-full animate-ping" style={{ animationDelay: "1s" }}></div>
            </div>
            <div className="text-center sm:text-left">
              <h1 className="text-4xl xs:text-5xl sm:text-6xl font-black text-white leading-tight">
                <span className="bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent">LUCKY</span>{" "}
                <span className="bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">CASINO</span>
              </h1>
              <p className="text-yellow-400 text-sm sm:text-base font-bold mt-2">🎯 PREMIUM VIP GAMING EXPERIENCE 🎯</p>
            </div>
          </div>
          <div className="flex items-center gap-4 sm:gap-6 w-full sm:w-auto">
            <div className="hidden xs:block">
              <ThemeToggle />
            </div>
            <Button
              onClick={() => setShowAuth(true)}
              size="lg"
              className="bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 hover:from-yellow-500 hover:via-orange-600 hover:to-red-600 text-black font-black px-8 sm:px-10 py-4 sm:py-5 casino-glow text-lg sm:text-xl hover:scale-105 w-full sm:w-auto shadow-2xl transform transition-all duration-300"
            >
              🎲 SIGN IN TO PLAY 🎲
            </Button>
          </div>
        </div>
      </header>

      <main className="relative z-10 text-white">
        {/* Hero Section - Enhanced */}
        <section className="container mx-auto px-4 py-20 md:py-40 text-center">
          <div className="relative">
            {/* Enhanced animated background elements for hero */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-[500px] h-[500px] bg-gradient-to-br from-yellow-400/15 to-orange-500/15 rounded-full blur-3xl animate-pulse"></div>
              <div className="absolute w-[300px] h-[300px] bg-gradient-to-br from-blue-400/10 to-purple-500/10 rounded-full blur-2xl animate-pulse" style={{ animationDelay: "2s" }}></div>
            </div>
            
            <h2 className="relative text-5xl sm:text-6xl md:text-7xl lg:text-9xl font-black text-white mb-6 md:mb-12">
              WELCOME TO{" "}
              <span className="bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent casino-glow animate-pulse">
                LUCKY CASINO
              </span>
            </h2>
            <p className="relative text-xl sm:text-2xl md:text-3xl text-white/95 mb-10 md:mb-20 max-w-5xl mx-auto leading-relaxed px-4 font-semibold">
              🎯 EXPERIENCE THE ULTIMATE THRILL OF LAS VEGAS RIGHT FROM YOUR HOME! 🎯
              <br />
              <span className="text-yellow-400 font-bold">Play our exciting games with real-time results, stunning visuals, and the chance to win BIG! 🏆</span>
            </p>
            
            {/* Enhanced CTA buttons */}
            <div className="relative flex flex-col sm:flex-row gap-6 md:gap-10 justify-center items-center px-4">
              <Button
                size="lg"
                onClick={() => setShowAuth(true)}
                className="bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 hover:from-yellow-500 hover:via-orange-600 hover:to-red-600 text-black text-xl sm:text-2xl md:text-3xl px-10 md:px-20 py-5 md:py-7 casino-glow font-black hover:scale-110 w-full sm:w-auto shadow-2xl transform transition-all duration-300 border-2 border-white/20"
              >
                🎰 START PLAYING NOW 🎰
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-3 border-yellow-400/60 text-yellow-400 hover:bg-gradient-to-r hover:from-yellow-400 hover:to-orange-500 hover:text-black text-xl sm:text-2xl md:text-3xl px-10 md:px-20 py-5 md:py-7 bg-black/30 backdrop-blur-md font-black hover:scale-110 w-full sm:w-auto shadow-2xl transform transition-all duration-300"
                onClick={() => {
                  if (user) {
                    router.push('/?tab=leaderboard')
                    toast({
                      title: "🏆 Leaderboard",
                      description: "Taking you to the leaderboard...",
                    })
                  } else {
                    setShowAuth(true)
                    toast({
                      title: "🔐 Login Required",
                      description: "Please log in to view the leaderboard",
                    })
                  }
                }}
              >
                🏆 VIEW LEADERBOARD 🏆
              </Button>
            </div>
          </div>
        </section>

        {/* Games Section - Enhanced */}
        <section className="container mx-auto px-4 py-16 md:py-32">
          <div className="text-center mb-16 md:mb-24">
            <h3 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white mb-6 md:mb-10">
              🎮 OUR <span className="bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent">PREMIUM GAMES</span> 🎮
            </h3>
            <p className="text-xl sm:text-2xl text-white/90 max-w-4xl mx-auto px-4 font-semibold">
              Choose from our collection of thrilling casino games, each designed to deliver maximum excitement and HUGE payouts! 💰
            </p>
            <div className="flex justify-center mt-6">
              <div className="flex items-center gap-4 text-yellow-400">
                <span className="animate-pulse">✨</span>
                <span className="font-bold text-lg">EXCLUSIVE VIP GAMES</span>
                <span className="animate-pulse">✨</span>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
            {/* 7Up 7Down Game - Enhanced */}
            <Card className="group relative overflow-hidden bg-gradient-to-br from-red-900/40 to-pink-900/40 border-2 border-red-500/30 hover:border-red-400/60 transition-all duration-500 hover-lift cursor-pointer mx-2 sm:mx-0 backdrop-blur-sm shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardHeader className="relative overflow-hidden">
                <div className="relative">
                  <div className="w-full h-48 bg-gradient-to-br from-red-500/20 to-pink-500/20 rounded-lg mb-6 flex items-center justify-center group-hover:scale-105 transition-transform duration-500">
                    <span className="text-6xl animate-bounce" style={{ animationDelay: '0.5s' }}>🎯</span>
                  </div>
                  <div className="absolute top-2 right-2 flex gap-2">
                    <Badge className="bg-gradient-to-r from-red-500 to-pink-500 text-white font-bold shadow-lg">Up to 11.5x</Badge>
                    <Badge variant="outline" className="border-green-400 text-green-400 bg-green-900/20 backdrop-blur-sm">
                      🔥 Live
                    </Badge>
                  </div>
                </div>
                <CardTitle className="text-3xl font-serif text-white">7Up 7Down</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 relative">
                <p className="text-white/80 text-lg leading-relaxed">
                🎯 Predict if the next number will be above 7, below 7, or exactly 7. High payouts for exact matches!
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse shadow-lg"></div>
                    <span className="text-green-400 font-semibold">Live Now</span>
                  </div>
                  <span className="text-white/70 font-medium">Max: 11.5x</span>
                </div>
                <Button
                  className="w-full bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-bold py-4 casino-glow text-lg shadow-lg transform hover:scale-105 transition-all duration-300"
                  onClick={() => {
                    if (user) {
                      router.push('/games/7up7down')
                    } else {
                      setShowAuth(true)
                      toast({
                        title: '🔐 Login Required',
                        description: 'Please log in to play 7up7down',
                      })
                    }
                  }}
                >
                  🎮 Play Now
                </Button>
              </CardContent>
            </Card>

            {/* Spin & Win Game - Enhanced */}
            <Card className="group relative overflow-hidden bg-gradient-to-br from-green-900/40 to-emerald-900/40 border-2 border-green-500/30 hover:border-green-400/60 transition-all duration-500 hover-lift cursor-pointer mx-2 sm:mx-0 backdrop-blur-sm shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardHeader className="relative overflow-hidden">
                <div className="relative">
                  <div className="w-full h-48 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-lg mb-6 flex items-center justify-center group-hover:scale-105 transition-transform duration-500">
                    <span className="text-6xl animate-spin" style={{ animationDuration: '3s' }}>🎡</span>
                  </div>
                  <div className="absolute top-2 right-2 flex gap-2">
                    <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold shadow-lg">Up to 17x</Badge>
                    <Badge variant="outline" className="border-green-400 text-green-400 bg-green-900/20 backdrop-blur-sm">
                      🔥 Live
                    </Badge>
                  </div>
                </div>
                <CardTitle className="text-3xl font-serif text-white">Spin & Win</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 relative">
                <p className="text-white/80 text-lg leading-relaxed">
                  🎡 Watch the wheel spin and bet on red, black, or green. Feel the excitement of every spin!
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse shadow-lg"></div>
                    <span className="text-green-400 font-semibold">Live Now</span>
                  </div>
                  <span className="text-white/70 font-medium">Max: 17x</span>
                </div>
                <Button
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold py-4 casino-glow text-lg shadow-lg transform hover:scale-105 transition-all duration-300"
                  onClick={() => {
                    if (user) {
                      router.push('/games/spinwin')
                    } else {
                      setShowAuth(true)
                      toast({
                        title: '🔐 Login Required',
                        description: 'Please log in to play Spin & Win',
                      })
                    }
                  }}
                >
                  🎮 Play Now
                </Button>
              </CardContent>
            </Card>

            {/* Lottery Game - Enhanced */}
            <Card className="group relative overflow-hidden bg-gradient-to-br from-red-900/40 to-pink-900/40 border-2 border-red-500/30 hover:border-red-400/60 transition-all duration-500 hover-lift cursor-pointer mx-2 sm:mx-0 backdrop-blur-sm shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardHeader className="relative overflow-hidden">
                <div className="relative">
                  <div className="w-full h-48 bg-gradient-to-br from-red-500/20 to-pink-500/20 rounded-lg mb-6 flex items-center justify-center group-hover:scale-105 transition-transform duration-500">
                    <span className="text-6xl animate-bounce" style={{ animationDelay: '0.5s' }}>🎫</span>
                  </div>
                  <div className="absolute top-2 right-2 flex gap-2">
                    <Badge className="bg-gradient-to-r from-red-500 to-pink-500 text-white font-bold shadow-lg">Up to 95x</Badge>
                    <Badge variant="outline" className="border-green-400 text-green-400 bg-green-900/20 backdrop-blur-sm">
                      🔥 Live
                    </Badge>
                  </div>
                </div>
                <CardTitle className="text-3xl font-serif text-white">Lottery</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 relative">
                <p className="text-white/80 text-lg leading-relaxed">
                  🎫 Pick your lucky numbers from 0-99. Exact matches pay huge, range matches pay well!
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse shadow-lg"></div>
                    <span className="text-green-400 font-semibold">Live Now</span>
                  </div>
                  <span className="text-white/70 font-medium">Max: 95x</span>
                </div>
                <Button
                  className="w-full bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-bold py-4 casino-glow text-lg shadow-lg transform hover:scale-105 transition-all duration-300"
                  onClick={() => {
                    if (user) {
                      router.push('/games/lottery')
                    } else {
                      setShowAuth(true)
                      toast({
                        title: '🔐 Login Required',
                        description: 'Please log in to play Lottery',
                      })
                    }
                  }}
                >
                  🎮 Play Now
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Features Section - Enhanced */}
        <section className="container mx-auto px-4 py-24">
          <div className="text-center mb-20">
            <h3 className="text-5xl font-serif font-bold text-white mb-6">
              Why Choose <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">Lucky Casino</span>?
            </h3>
          </div>
          <div className="grid md:grid-cols-3 gap-10">
            <Card className="group relative overflow-hidden bg-gradient-to-br from-blue-900/40 to-cyan-900/40 border-2 border-blue-500/30 hover:border-blue-400/60 transition-all duration-300 hover-lift mx-2 md:mx-0 backdrop-blur-sm shadow-xl">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <CardHeader className="text-center relative">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-full flex items-center justify-center mx-auto mb-6 casino-glow group-hover:scale-110 transition-transform duration-300">
                  <span className="text-4xl animate-pulse">⚡</span>
                </div>
                <CardTitle className="text-2xl text-white font-serif">Real-time Results</CardTitle>
              </CardHeader>
              <CardContent className="relative">
                <p className="text-white/80 text-center text-lg">
                  Experience lightning-fast live game results with our advanced real-time system
                </p>
              </CardContent>
            </Card>
            
            <Card className="group relative overflow-hidden bg-gradient-to-br from-purple-900/40 to-pink-900/40 border-2 border-purple-500/30 hover:border-purple-400/60 transition-all duration-300 hover-lift mx-2 md:mx-0 backdrop-blur-sm shadow-xl">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <CardHeader className="text-center relative">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full flex items-center justify-center mx-auto mb-6 casino-glow group-hover:scale-110 transition-transform duration-300">
                  <span className="text-4xl animate-bounce">👥</span>
                </div>
                <CardTitle className="text-2xl text-white font-serif">Multiple User Roles</CardTitle>
              </CardHeader>
              <CardContent className="relative">
                <p className="text-white/80 text-center text-lg">
                  Players, Masters, and Super Admin access levels with comprehensive management tools
                </p>
              </CardContent>
            </Card>
            
            <Card className="group relative overflow-hidden bg-gradient-to-br from-green-900/40 to-emerald-900/40 border-2 border-green-500/30 hover:border-green-400/60 transition-all duration-300 hover-lift mx-2 md:mx-0 backdrop-blur-sm shadow-xl">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <CardHeader className="text-center relative">
                <div className="w-20 h-20 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6 casino-glow group-hover:scale-110 transition-transform duration-300">
                  <span className="text-4xl animate-pulse">🔒</span>
                </div>
                <CardTitle className="text-2xl text-white font-serif">Secure & Fair</CardTitle>
              </CardHeader>
              <CardContent className="relative">
                <p className="text-white/80 text-center text-lg">
                  Transparent algorithms and secure gaming environment with provably fair results
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* CTA Section - Enhanced */}
        <section className="container mx-auto px-4 py-32 max-[700px]:hidden min-[701px]:block">
          <Card className="relative overflow-hidden bg-gradient-to-br from-yellow-900/40 to-orange-900/40 border-2 border-yellow-500/30 text-center p-20 casino-glow hover-lift backdrop-blur-sm shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-orange-500/10"></div>
            <div className="absolute top-4 right-4 w-8 h-8 bg-yellow-400 rounded-full animate-ping"></div>
            <div className="absolute bottom-4 left-4 w-6 h-6 bg-orange-400 rounded-full animate-ping" style={{ animationDelay: '1s' }}></div>
            
            <CardHeader className="relative">
              <CardTitle className="text-6xl font-serif font-bold text-white mb-8">
                🚀 Ready to <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">Win Big</span>?
              </CardTitle>
            </CardHeader>
            <CardContent className="relative">
              <p className="text-2xl text-white/90 mb-12 max-w-3xl mx-auto">
                💰 Join thousands of players who are already winning. Sign in now and start your winning streak! 🎊
              </p>
              <Button
                size="lg"
                onClick={() => setShowAuth(true)}
                className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-black text-2xl px-20 py-8 casino-glow font-bold hover-lift shadow-2xl transform hover:scale-105 transition-all duration-300"
              >
                🎰 Join Lucky Casino Now!
              </Button>
            </CardContent>
          </Card>
        </section>
      </main>

      <AuthModal open={showAuth} onClose={() => setShowAuth(false)} />
    </div>
  )
}


