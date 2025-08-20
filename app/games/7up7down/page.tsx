"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, TrendingUp, TrendingDown, Target } from "lucide-react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { GameStatusBar } from "@/components/game-status-bar"
import { GameHistoryPanel } from "@/components/game-history-panel"
import { useToast } from "@/hooks/use-toast"

export default function SevenUpSevenDownPage() {
  const router = useRouter()
  const { user, updatePoints } = useAuth()
  const { toast } = useToast()
  const [betAmount, setBetAmount] = useState(100)
  const [selectedBet, setSelectedBet] = useState<string | null>(null)
  const [jwtToken, setJwtToken] = useState<string | null>(null)
  const [currentRound, setCurrentRound] = useState<any | null>(null)
  const [apiResult, setApiResult] = useState<string | null>(null)
  const [isNavigating, setIsNavigating] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [isDetailedView, setIsDetailedView] = useState(false)
  const [isPageLoading, setIsPageLoading] = useState(true)

  // Use real backend data instead of mock game engine
  const canBet = currentRound?.status === "betting"
  const recentUserBets: any[] = [] // Will be populated from backend if needed

  // Fetch current round and handle real-time updates
  useEffect(() => {
    if (isPaused) return // Don't fetch if paused

    const fetchCurrentRound = async () => {
      try {
        const res = await fetch("/api/games/seven_up_down/current-round")
        const data = await res.json()
        if (res.ok) {
          setCurrentRound(data)
        }
        setIsPageLoading(false)
      } catch (error) {
        console.error("Failed to fetch current round:", error)
      }
    }

    // Initial fetch immediately for faster loading
    fetchCurrentRound()
    
    // Poll for updates every 60 seconds for better performance
    const interval = setInterval(fetchCurrentRound, 60000)
    
    return () => {
      clearInterval(interval)
    }
  }, [isPaused])

  // Auto-settle rounds when they're ready
  useEffect(() => {
    if (currentRound?.status === "betting" && currentRound.roundEndAt) {
      const endTime = new Date(currentRound.roundEndAt)
      const now = new Date()
      
      if (now >= endTime) {

        const settleRound = async () => {
          try {
            await fetch("/api/games/seven_up_down/settle", { method: "POST" })
            // Refresh current round after settling
            setTimeout(async () => {
              const res = await fetch("/api/games/seven_up_down/current-round")
              const data = await res.json()
              if (res.ok) setCurrentRound(data)
            }, 1000)
          } catch (error) {
            console.error("Failed to settle round:", error)
          }
        }
        settleRound()
      }
    }
  }, [currentRound])

  const handleRefresh = async () => {
    try {
      const res = await fetch("/api/games/seven_up_down/current-round")
      const data = await res.json()
      if (res.ok) {
        setCurrentRound(data)
        toast({
          title: "Game data refreshed",
          description: "Latest game information loaded.",
        })
      }
    } catch (error) {
      console.error("Failed to refresh:", error)
      toast({
        title: "Refresh failed",
        description: "Could not update game data.",
        variant: "destructive",
      })
    }
  }

  const handleToggleView = () => {
    setIsDetailedView(!isDetailedView)
    toast({
      title: isDetailedView ? "Compact view" : "Detailed view",
      description: `Switched to ${isDetailedView ? "compact" : "detailed"} view.`,
    })
  }

  const handlePauseUpdates = () => {
    setIsPaused(!isPaused)
    toast({
      title: isPaused ? "Updates resumed" : "Updates paused",
      description: isPaused ? "Live updates are now active." : "Live updates are paused.",
    })
  }

  const handlePlaceBet = async (betChoice: string) => {
    if (!canBet || !user) {
      toast({
        title: "Cannot place bet",
        description: "Betting is currently closed or you're not logged in.",
        variant: "destructive",
      })
      return
    }

    if (betAmount < 100 || betAmount > 1000) {
      toast({
        title: "Invalid bet amount",
        description: "Bet must be between 100 and 1000 points.",
        variant: "destructive",
      })
      return
    }

    if (user.points < betAmount) {
      toast({
        title: "Insufficient points",
        description: "You don't have enough points for this bet.",
        variant: "destructive",
      })
      return
    }
    // Ensure we have a JWT token (dev helper)
    let token = jwtToken
    try {
      if (!token && user?.username) {
        const res = await fetch("/api/dev/ensure-user", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: user.username, password: "dev", role: "user", points: user.points }),
        })
        const data = await res.json()
        if (res.ok && data.token) {
          token = data.token
          setJwtToken(token)
          try { if (token) localStorage.setItem("jwt", token) } catch {}
        }
      }
      if (!token) {
        try { token = localStorage.getItem("jwt") } catch {}
      }
    } catch {}

    // Fetch current round if needed
    if (!currentRound) {
      try {
        const roundRes = await fetch("/api/games/seven_up_down/current-round")
        const roundData = await roundRes.json()
        if (roundRes.ok) setCurrentRound(roundData)
      } catch {}
    }

    // Map UI betChoice to API outcome
    const outcomeMap: Record<string, string> = { "7up": ">7", "7down": "<7", "lucky7": "=7" }
    const outcome = outcomeMap[betChoice] || betChoice

    try {
      const res = await fetch("/api/bets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          gameType: "seven_up_down",
          roundId: (currentRound as any)?._id,
          outcome,
          amount: betAmount,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.error || "Bet failed")
      }
      setSelectedBet(betChoice)
      updatePoints(user.points - betAmount)
      toast({
        title: "Bet placed!",
        description: `${betAmount} points on ${betChoice.replace(/([A-Z])/g, " $1").toLowerCase()}`,
      })
    } catch (e: any) {
      console.error('Bet placement error:', e)
      const errorMessage = e?.message || "Unable to place bet."
      if (errorMessage.includes('forbidden')) {
        toast({ 
          title: "Authentication Error", 
          description: "Please log out and log back in to refresh your session.", 
          variant: "destructive" 
        })
      } else {
        toast({ title: "Bet failed", description: errorMessage, variant: "destructive" })
      }
    }
  }

  const getBetTypeInfo = (betType: string) => {
    switch (betType) {
      case "7up":
        return {
          label: "7 Up",
          description: "Numbers 8-13",
          payout: "1.95x",
          icon: TrendingUp,
          color: "from-red-500 to-red-600",
        }
      case "7down":
        return {
          label: "7 Down",
          description: "Numbers 1-6",
          payout: "1.95x",
          icon: TrendingDown,
          color: "from-blue-500 to-blue-600",
        }
      case "lucky7":
        return {
          label: "Lucky 7",
          description: "Exactly 7",
          payout: "11.5x",
          icon: Target,
          color: "from-yellow-500 to-orange-500",
        }
      default:
        return { label: "", description: "", payout: "", icon: Target, color: "" }
    }
  }

  useEffect(() => {
    // Only redirect if user is explicitly null (not loading)
    // Check if we're on client side and if localStorage has user data
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem("casino_user")
      if (!user && !storedUser) {
        router.replace("/")
      }
    }
  }, [user, router])

  // Load token and current round on mount
  useEffect(() => {
    // Only access localStorage on client side
    if (typeof window !== 'undefined') {
      try {
        const t = localStorage.getItem("jwt")
        if (t) setJwtToken(t)
      } catch {}
    }
    
    // Fetch current round
    const fetchRound = async () => {
      try {
        const roundRes = await fetch("/api/games/seven_up_down/current-round")
        const roundData = await roundRes.json()
        if (roundRes.ok) setCurrentRound(roundData)
      } catch {}
    }
    
    fetchRound()
  }, [])

  // Poll current round and auto-settle when ended
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/games/seven_up_down/current-round")
        const data = await res.json()
        if (res.ok) {
          setCurrentRound(data)
          const endTs = data?.roundEndAt ? new Date(data.roundEndAt).getTime() : 0
          const now = Date.now()
          if (endTs && now >= endTs && data.status !== "settled") {
            const settle = await fetch("/api/games/seven_up_down/settle", { method: "POST" })
            const sData = await settle.json().catch(() => ({}))
            if (settle.ok) {
              setApiResult(sData?.winningOutcome || data?.winningOutcome || null)
            }
          } else if (data?.status === "settled") {
            setApiResult(data?.winningOutcome || null)
          }
        }
      } catch {}
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  // Removed SSE updates - using polling instead

  if (!user) return null

  // Show loading screen while page is loading
  if (isPageLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-red-500 via-purple-600 to-blue-500 rounded-xl shadow-lg shadow-purple-500/30 flex items-center justify-center mx-auto mb-4 animate-pulse">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-white rounded-full opacity-80"></div>
              <span className="text-white font-black text-sm">7</span>
              <div className="w-2 h-2 bg-white rounded-full opacity-80"></div>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Loading 7Up 7Down...</h2>
          <p className="text-white/60">Preparing your game experience</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4 flex flex-col sm:flex-row gap-2 sm:gap-0 sm:items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => {
                if (isNavigating) return
                setIsNavigating(true)
                // Try to go back in history first, fallback to dashboard
                if (window.history.length > 1) {
                  router.back()
                } else {
                  router.replace("/")
                }
                // Reset navigation state after a short delay
                setTimeout(() => setIsNavigating(false), 1000)
              }} 
              disabled={isNavigating}
              className="text-white hover:bg-white/10"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {isNavigating ? "Loading..." : "Back to Dashboard"}
            </Button>
            <div className="flex items-center gap-3">
              <div className="relative">
                {/* Modern gradient background with glow */}
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-red-500 via-purple-600 to-blue-500 rounded-xl shadow-lg shadow-purple-500/30 flex items-center justify-center relative overflow-hidden">
                  {/* Animated gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
                  
                  {/* Modern 7Up 7Down icon */}
                  <div className="relative z-10 flex items-center justify-center">
                    <div className="flex items-center gap-1">
                      {/* Down arrow */}
                      <div className="w-2 h-2 bg-white rounded-full opacity-80"></div>
                      {/* Center 7 */}
                      <span className="text-white font-black text-xs sm:text-sm drop-shadow-lg">7</span>
                      {/* Up arrow */}
                      <div className="w-2 h-2 bg-white rounded-full opacity-80"></div>
                    </div>
                  </div>
                  
                  {/* Corner accent */}
                  <div className="absolute top-0 right-0 w-2 h-2 sm:w-3 sm:h-3 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-bl-lg"></div>
                </div>
                
                {/* Outer glow ring */}
                <div className="absolute inset-0 w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-red-500/30 via-purple-500/30 to-blue-500/30 rounded-xl blur-sm animate-pulse"></div>
              </div>
              
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-white drop-shadow-lg">7Up 7Down</h1>
                <p className="text-[10px] sm:text-xs text-white/60 font-medium">Live Casino Game</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="text-white">
              <span className="text-xs sm:text-sm opacity-80">Points: </span>
              <span className="font-bold text-base sm:text-lg">{user.points.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8 mobile-spacing">
        <div className="grid lg:grid-cols-3 gap-4 sm:gap-8">
          {/* Main Game Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Game Status */}
            <GameStatusBar 
              gameType="7up7down" 
              currentRound={currentRound || null}
              onRefresh={handleRefresh}
              onToggleView={handleToggleView}
              onPauseUpdates={handlePauseUpdates}
            />

            {/* Game Board */}
            <Card className="bg-white/10 border-white/20 text-white">
              <CardHeader>
                <CardTitle className="text-center text-xl sm:text-2xl">Choose Your Prediction</CardTitle>
                <p className="text-center text-white/70 text-sm">Predict where the next number (1-13) will fall</p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Modern Betting Options */}
                <div className="grid md:grid-cols-3 gap-3 sm:gap-6 px-2 sm:px-4">
                  {[
                    { betType: "7down", label: "7 Down", gradient: "from-blue-500 via-blue-600 to-blue-700", glow: "shadow-blue-500/30", payout: "1.95x", description: "Numbers 1-6", icon: "🔽" },
                    { betType: "lucky7", label: "Lucky 7", gradient: "from-orange-500 via-orange-600 to-orange-700", glow: "shadow-orange-500/30", payout: "11.5x", description: "Exactly 7", icon: "🎯" },
                    { betType: "7up", label: "7 Up", gradient: "from-red-500 via-red-600 to-red-700", glow: "shadow-red-500/30", payout: "1.95x", description: "Numbers 8-13", icon: "🔼" }
                  ].map((betOption) => {
                    const isSelected = selectedBet === betOption.betType
                    const isDisabled = !canBet

                    return (
                      <Card
                        key={betOption.betType}
                        className={`cursor-pointer transition-all duration-300 transform hover:scale-105 ${
                          isSelected 
                            ? "ring-2 ring-yellow-400 bg-white/20 shadow-lg shadow-yellow-400/20" 
                            : "bg-white/5 hover:bg-white/10 hover:shadow-lg"
                        } ${isDisabled ? "opacity-50 cursor-not-allowed" : ""} border-white/20 backdrop-blur-sm`}
                        onClick={() => !isDisabled && handlePlaceBet(betOption.betType)}
                      >
                        <CardContent className="p-3 sm:p-5 text-center relative overflow-hidden">
                          {/* Background glow effect */}
                          <div className={`absolute inset-0 bg-gradient-to-br ${betOption.gradient} opacity-10 rounded-lg ${isSelected ? 'animate-pulse' : ''}`}></div>
                          
                          {/* Modern betting circle */}
                          <div className={`w-10 h-10 sm:w-14 sm:h-14 mx-auto mb-2 sm:mb-4 rounded-full bg-gradient-to-br ${betOption.gradient} flex items-center justify-center ${betOption.glow} shadow-lg relative z-10`}>
                            <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-white/20 to-transparent flex items-center justify-center">
                              <span className="text-white text-xs sm:text-base font-black drop-shadow-lg">{betOption.icon}</span>
                            </div>
                          </div>
                          
                          <h3 className="text-sm sm:text-base font-bold text-white mb-1 sm:mb-2 relative z-10">{betOption.label}</h3>
                          <p className="text-xs text-white/70 mb-1 sm:mb-2 relative z-10">{betOption.description}</p>
                          
                          <Badge className={`bg-gradient-to-r ${betOption.gradient} text-white text-[10px] sm:text-xs font-bold px-2 py-0.5 sm:px-3 sm:py-1 relative z-10 shadow-lg`}>
                            Pays {betOption.payout}
                          </Badge>
                          
                          {/* Selection indicator */}
                          {isSelected && (
                            <div className="absolute top-2 right-2 w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
                          )}
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>

                {/* Modern Bet Amount Section */}
                <div className="max-w-md mx-auto px-2 sm:px-4">
                  <label className="block text-white text-sm font-bold mb-2 sm:mb-3 text-center">🎯 Bet Amount (min: 100 points)</label>
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                    <div className="relative">
                      <Input
                        type="number"
                        min="100"

                        value={betAmount}
                        onChange={(e) => setBetAmount(Number(e.target.value))}
                        className="bg-white/10 border-white/30 text-white placeholder-white/50 backdrop-blur-sm focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400/50 transition-all duration-300"
                        disabled={!canBet}
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-md"></div>
                    </div>
                    <div className="flex gap-2 justify-center sm:justify-start">
                      {[100, 250, 500, 1000].map((amount) => (
                        <Button
                          key={amount}
                          variant="outline"
                          size="sm"
                          onClick={() => setBetAmount(amount)}
                          disabled={!canBet}
                          className="border-white/30 text-white hover:bg-white/15 hover:border-yellow-400/50 hover:shadow-lg hover:shadow-yellow-400/20 text-xs sm:text-sm font-bold transition-all duration-300 transform hover:scale-105 backdrop-blur-sm"
                        >
                          {amount}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Current Result Display */}
                {currentRound?.status === "settled" && currentRound.winningOutcome && (
                  <div className="text-center py-6 sm:py-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 text-black text-3xl sm:text-4xl font-bold mb-3 sm:mb-4">
                      {currentRound.winningOutcome}
                    </div>
                    <div className="text-white">
                      <p className="text-base sm:text-lg font-semibold mb-2">
                        Result: {currentRound.winningOutcome === "=7" ? "Lucky 7!" : currentRound.winningOutcome === ">7" ? "7 Up" : "7 Down"}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4 sm:space-y-6">
            {/* Game History */}
            <GameHistoryPanel gameType="seven_up_down" />

            {/* Your Recent Bets */}
            <Card className="bg-white/10 border-white/20 text-white">
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">Your Recent Bets</CardTitle>
              </CardHeader>
              <CardContent>
                {recentUserBets.length === 0 ? (
                  <p className="text-white/60 text-sm">No bets placed yet</p>
                ) : (
                  <div className="space-y-3">
                    {recentUserBets.map((bet) => (
                      <div key={bet.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                        <div>
                          <p className="text-sm font-medium">{getBetTypeInfo(bet.betChoice).label}</p>
                          <p className="text-xs text-white/60">{bet.betAmount} points</p>
                        </div>
                        <div className="text-right">
                          {bet.result ? (
                            <Badge className={bet.result === "win" ? "bg-green-500" : "bg-red-500"}>
                              {bet.result === "win" ? `+${bet.payout}` : `-${bet.betAmount}`}
                            </Badge>
                          ) : (
                            <Badge className="bg-yellow-500">Pending</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Game Rules */}
            <Card className="bg-white/10 border-white/20 text-white">
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">How to Play</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
                <div>
                  <p className="font-semibold text-blue-400">7 Down (1-6)</p>
                  <p className="text-white/70">Pays 1.95x your bet</p>
                </div>
                <div>
                  <p className="font-semibold text-red-400">7 Up (8-13)</p>
                  <p className="text-white/70">Pays 1.95x your bet</p>
                </div>
                <div>
                  <p className="font-semibold text-yellow-400">Lucky 7</p>
                  <p className="text-white/70">Pays 11.5x your bet</p>
                </div>
                <div className="pt-2 border-t border-white/20">
                  <p className="text-xs text-white/60">
                    A random number from 1-13 is drawn each round. Place your bet before the countdown ends!
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
