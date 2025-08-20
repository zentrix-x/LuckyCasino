"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
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
  const { toast } = useToast()

  // Memoize the user dashboard to prevent unnecessary re-renders
  const userDashboard = useMemo(() => {
    if (user) {
      return <UserDashboard />
    }
    return null
  }, [user])

  if (user) {
    return userDashboard
  }

  return (
    <div className="min-h-screen casino-gradient relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-primary/10 rounded-full float-animation casino-glow"></div>
        <div
          className="absolute top-40 right-20 w-24 h-24 bg-secondary/10 rounded-full float-animation"
          style={{ animationDelay: "1s" }}
        ></div>
        <div
          className="absolute bottom-40 left-1/4 w-20 h-20 bg-primary/10 rounded-full float-animation casino-glow"
          style={{ animationDelay: "2s" }}
        ></div>
        <div
          className="absolute top-1/2 right-1/4 w-16 h-16 bg-secondary/10 rounded-full float-animation"
          style={{ animationDelay: "3s" }}
        ></div>
      </div>

      <header className="border-b border-primary/20 bg-card/90 backdrop-blur-sm relative z-10">
        <div className="container mx-auto px-4 py-4 sm:py-6 flex flex-col sm:flex-row gap-3 sm:gap-4 items-center justify-center sm:justify-between">
          <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto justify-center sm:justify-start mx-auto sm:mx-0">
            <div className="w-10 h-10 sm:w-14 sm:h-14 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center casino-glow">
              <span className="text-primary-foreground font-bold text-xl sm:text-2xl">🎰</span>
            </div>
            <h1 className="text-3xl xs:text-4xl sm:text-5xl font-serif font-bold text-primary leading-tight text-center sm:text-left">Lucky Casino</h1>
          </div>
          <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
            <div className="hidden xs:block">
              <ThemeToggle />
            </div>
            <Button
              onClick={() => setShowAuth(true)}
              size="lg"
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-6 sm:px-8 py-3 sm:py-4 casino-glow text-base sm:text-lg hover-lift w-full sm:w-auto"
            >
              🎲 Sign In to Play
            </Button>
          </div>
        </div>
      </header>

      <main className="relative z-10">
        <section className="container mx-auto px-4 py-16 md:py-32 text-center">
          <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-8xl font-serif font-bold text-foreground mb-4 md:mb-8">
            Welcome to <span className="text-primary casino-glow">Lucky Casino</span>
          </h2>
          <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground mb-8 md:mb-16 max-w-4xl mx-auto leading-relaxed px-4">
            🎯 Experience the ultimate thrill of Las Vegas right from your home. Play our exciting games with real-time
            results, stunning visuals, and the chance to win big! 🏆
          </p>
          <div className="flex flex-col sm:flex-row gap-4 md:gap-8 justify-center items-center px-4">
            <Button
              size="lg"
              onClick={() => setShowAuth(true)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground text-lg sm:text-xl md:text-2xl px-8 md:px-16 py-4 md:py-6 casino-glow font-bold hover-lift w-full sm:w-auto"
            >
              🎰 Start Playing Now
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-primary text-primary hover:bg-primary hover:text-primary-foreground text-lg sm:text-xl md:text-2xl px-8 md:px-16 py-4 md:py-6 bg-transparent font-bold hover-lift w-full sm:w-auto"
              onClick={() => {
                if (user) {
                  // If user is logged in, navigate to the dashboard with leaderboard tab
                  router.push('/?tab=leaderboard')
                  toast({
                    title: "🏆 Leaderboard",
                    description: "Taking you to the leaderboard...",
                  })
                } else {
                  // If user is not logged in, show auth modal
                  setShowAuth(true)
                  toast({
                    title: "🔐 Login Required",
                    description: "Please log in to view the leaderboard",
                  })
                }
              }}
            >
              🏆 View Leaderboard
            </Button>
          </div>
        </section>

        <section className="container mx-auto px-4 py-12 md:py-24">
          <div className="text-center mb-12 md:mb-20">
            <h3 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-foreground mb-4 md:mb-8">🎮 Our Premium Games</h3>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto px-4">
              Choose from our collection of thrilling casino games, each designed to deliver maximum excitement and huge
              payouts!
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-12">
            {/* 7Up 7Down Game */}
            <Card className="casino-card-gradient border-primary/20 hover:border-primary/60 transition-all duration-500 hover-lift cursor-pointer group mx-2 sm:mx-0">
              <CardHeader className="relative overflow-hidden">
                <div className="relative">
                  <div className="w-full h-32 sm:h-40 md:h-48 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-lg mb-4 md:mb-6 flex items-center justify-center">
                    <span className="text-4xl sm:text-5xl md:text-6xl">🎯</span>
                  </div>
                  <div className="absolute top-2 right-2 flex gap-2">
                    <Badge className="bg-primary text-primary-foreground font-bold">Up to 11.5x</Badge>
                    <Badge variant="outline" className="border-green-500 text-green-600 bg-green-50">
                      🔥 Live
                    </Badge>
                  </div>
                </div>
                <CardTitle className="text-xl sm:text-2xl md:text-3xl font-serif text-foreground">7Up 7Down</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 md:space-y-6">
                <p className="text-muted-foreground text-sm sm:text-base md:text-lg leading-relaxed">
                  🎯 Predict if the next number will be above 7, below 7, or exactly 7. High payouts for exact matches!
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-green-600 font-semibold">Live Now</span>
                  </div>
                  <span className="text-muted-foreground font-medium">Max: 11.5x</span>
                </div>
                <Button
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-4 casino-glow text-lg"
                  onClick={() => {
                    if (user) {
                      router.push('/games/7up7down')
                    } else {
                      setShowAuth(true)
                      toast({
                        title: '🔐 Login Required',
                        description: 'Please log in to play 7Up 7Down',
                      })
                    }
                  }}
                >
                  🎮 Play Now
                </Button>
              </CardContent>
            </Card>

            {/* Spin & Win Game */}
            <Card className="casino-card-gradient border-primary/20 hover:border-primary/60 transition-all duration-500 hover-lift cursor-pointer group mx-2 sm:mx-0">
              <CardHeader className="relative overflow-hidden">
                <div className="relative">
                  <div className="w-full h-48 bg-gradient-to-br from-secondary/20 to-primary/20 rounded-lg mb-6 flex items-center justify-center">
                    <span className="text-6xl">🎡</span>
                  </div>
                  <div className="absolute top-2 right-2 flex gap-2">
                    <Badge className="bg-primary text-primary-foreground font-bold">Up to 17x</Badge>
                    <Badge variant="outline" className="border-green-500 text-green-600 bg-green-50">
                      🔥 Live
                    </Badge>
                  </div>
                </div>
                <CardTitle className="text-3xl font-serif text-foreground">Spin & Win</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-muted-foreground text-lg leading-relaxed">
                  🎡 Watch the wheel spin and bet on red, black, or green. Feel the excitement of every spin!
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-green-600 font-semibold">Live Now</span>
                  </div>
                  <span className="text-muted-foreground font-medium">Max: 17x</span>
                </div>
                <Button
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-4 casino-glow text-lg"
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

            {/* Lottery Game */}
            <Card className="casino-card-gradient border-primary/20 hover:border-primary/60 transition-all duration-500 hover-lift cursor-pointer group mx-2 sm:mx-0">
              <CardHeader className="relative overflow-hidden">
                <div className="relative">
                  <div className="w-full h-48 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-lg mb-6 flex items-center justify-center">
                    <span className="text-6xl">🎫</span>
                  </div>
                  <div className="absolute top-2 right-2 flex gap-2">
                    <Badge className="bg-primary text-primary-foreground font-bold">Up to 95x</Badge>
                    <Badge variant="outline" className="border-green-500 text-green-600 bg-green-50">
                      🔥 Live
                    </Badge>
                  </div>
                </div>
                <CardTitle className="text-3xl font-serif text-foreground">Lottery</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-muted-foreground text-lg leading-relaxed">
                  🎫 Pick your lucky numbers from 0-99. Exact matches pay huge, range matches pay well!
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-green-600 font-semibold">Live Now</span>
                  </div>
                  <span className="text-muted-foreground font-medium">Max: 95x</span>
                </div>
                <Button
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-4 casino-glow text-lg"
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

        <section className="container mx-auto px-4 py-24">
          <div className="text-center mb-20">
            <h3 className="text-5xl font-serif font-bold text-foreground mb-6">Why Choose Lucky Casino?</h3>
          </div>
          <div className="grid md:grid-cols-3 gap-10">
            <Card className="casino-card-gradient border-primary/20 hover:border-primary/40 transition-all duration-300 hover-lift mx-2 md:mx-0">
              <CardHeader className="text-center">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 casino-glow">
                  <span className="text-4xl">⚡</span>
                </div>
                <CardTitle className="text-2xl text-foreground font-serif">Real-time Results</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center text-lg">
                  Experience lightning-fast live game results with our advanced real-time system
                </p>
              </CardContent>
            </Card>
            <Card className="casino-card-gradient border-primary/20 hover:border-primary/40 transition-all duration-300 hover-lift mx-2 md:mx-0">
              <CardHeader className="text-center">
                <div className="w-20 h-20 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-6 casino-glow">
                  <span className="text-4xl">👥</span>
                </div>
                <CardTitle className="text-2xl text-foreground font-serif">Multiple User Roles</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center text-lg">
                  Players, Masters, and Super Admin access levels with comprehensive management tools
                </p>
              </CardContent>
            </Card>
            <Card className="casino-card-gradient border-primary/20 hover:border-primary/40 transition-all duration-300 hover-lift mx-2 md:mx-0">
              <CardHeader className="text-center">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 casino-glow">
                  <span className="text-4xl">🔒</span>
                </div>
                <CardTitle className="text-2xl text-foreground font-serif">Secure & Fair</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center text-lg">
                  Transparent algorithms and secure gaming environment with provably fair results
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="container mx-auto px-4 py-32 max-[700px]:hidden min-[701px]:block">
          <Card className="casino-card-gradient border-primary/20 text-center p-20 casino-glow hover-lift">
            <CardHeader>
              <CardTitle className="text-6xl font-serif font-bold text-foreground mb-8">🚀 Ready to Win Big?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto">
                💰 Join thousands of players who are already winning. Sign in now and start your winning streak! 🎊
              </p>
              <Button
                size="lg"
                onClick={() => setShowAuth(true)}
                className="bg-primary hover:bg-primary/90 text-primary-foreground text-2xl px-20 py-8 casino-glow font-bold hover-lift"
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


