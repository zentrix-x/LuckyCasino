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
  const [isSpinning, setIsSpinning] = useState(false)
  const [spinResult, setSpinResult] = useState<string | null>(null)

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

  // Auto-settle rounds when they're ready - Enhanced for immediate settlement
  useEffect(() => {
    if (currentRound?.status === "betting" && currentRound.roundEndAt) {
      const endTime = new Date(currentRound.roundEndAt)
      const now = new Date()
      
      if (now >= endTime) {
        // Immediate settlement
        const settleRound = async () => {
          try {
            console.log("🔄 Auto-settling 7Up 7Down round...")
            await fetch("/api/auto-settle", { method: "GET" })
            // Refresh current round after settling
            setTimeout(async () => {
              const res = await fetch("/api/games/seven_up_down/current-round")
              const data = await res.json()
              if (res.ok) setCurrentRound(data)
            }, 500) // Reduced delay for faster updates
          } catch (error) {
            console.error("Failed to settle round:", error)
          }
        }
        settleRound()
      } else {
        // Set up timer for immediate settlement when round ends
        const timeUntilEnd = endTime.getTime() - now.getTime()
        if (timeUntilEnd > 0) {
          const timer = setTimeout(() => {
            const settleRound = async () => {
              try {
                console.log("⏰ Timer triggered - settling 7Up 7Down round...")
                await fetch("/api/auto-settle", { method: "GET" })
                // Refresh current round after settling
                setTimeout(async () => {
                  const res = await fetch("/api/games/seven_up_down/current-round")
                  const data = await res.json()
                  if (res.ok) setCurrentRound(data)
                }, 500)
              } catch (error) {
                console.error("Failed to settle round:", error)
              }
            }
            settleRound()
          }, timeUntilEnd)
          
          return () => clearTimeout(timer)
        }
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

  const handlePlaceBet = async () => {
    if (!user || !selectedBet || !canBet) {
      toast({
        title: "Cannot place bet",
        description: "Please select a bet type and ensure betting is open.",
        variant: "destructive",
      })
      return
    }

    if (betAmount < 10 || betAmount > 10000) {
      toast({
        title: "Invalid bet amount",
        description: "Bet must be between 10 and 10,000 points.",
        variant: "destructive",
      })
      return
    }

    if (user.points < betAmount) {
      toast({
        title: "Insufficient points",
        description: `You need ${betAmount} points for this bet.`,
        variant: "destructive",
      })
      return
    }

    // Start spinning animation
    setIsSpinning(true)
    setSpinResult(null)
    setIsLoading(true)

    // Ensure JWT token (dev helper)
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

    // Ensure round
    if (!currentRound) {
      try {
        const roundRes = await fetch("/api/games/seven_up_down/current-round")
        const roundData = await roundRes.json()
        if (roundRes.ok) setCurrentRound(roundData)
      } catch {}
    }

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
          outcome: selectedBet,
          amount: betAmount,
        }),
      })

      if (res.ok) {
      updatePoints(user.points - betAmount)
        toast({ 
          title: "Bet placed successfully!", 
          description: `${betAmount} points on ${selectedBet}` 
        })
        setSelectedBet(null)
        
        // Continue spinning for 3 seconds, then show result
        setTimeout(async () => {
          try {
            // Fetch the latest result
            const res = await fetch("/api/games/seven_up_down/current-round")
            const data = await res.json()
            if (res.ok && data.winningOutcome) {
              console.log("🎯 Backend result:", data.winningOutcome)
              setSpinResult(data.winningOutcome)
              setApiResult(data.winningOutcome)
            } else {
              // Generate random result if none provided
              const results = ["<7", "=7", ">7"]
              const randomResult = results[Math.floor(Math.random() * results.length)]
              console.log("🎲 Generated random result:", randomResult)
              setSpinResult(randomResult)
              setApiResult(randomResult)
            }
          } catch (error) {
            console.error("Failed to fetch result:", error)
            // Fallback to random result for demo
            const results = ["<7", "=7", ">7"]
            const randomResult = results[Math.floor(Math.random() * results.length)]
            console.log("🎲 Error fallback - generated random result:", randomResult)
            setSpinResult(randomResult)
            setApiResult(randomResult)
          } finally {
            setIsSpinning(false)
            setIsLoading(false)
          }
        }, 3000)
      } else {
        const errorData = await res.json()
        const errorMessage = errorData?.message || "Unable to place bet."
        toast({
          title: "Bet failed",
          description: errorMessage,
          variant: "destructive",
        })
        setIsSpinning(false)
        setIsLoading(false)
      }
    } catch (error) {
      console.error("Bet placement error:", error)
      const errorMessage = error?.message || "Unable to place bet."
      toast({
        title: "Bet failed",
        description: errorMessage,
        variant: "destructive",
      })
      setIsSpinning(false)
      setIsLoading(false)
    }
  }

  const getBetColor = (betType: string) => {
    switch (betType) {
      case "up":
        return "from-green-500 to-emerald-600"
      case "down":
        return "from-red-500 to-pink-600"
      case "seven":
        return "from-yellow-500 to-orange-600"
      default:
        return "from-gray-500 to-gray-600"
    }
  }

  const getBetIcon = (betType: string) => {
    switch (betType) {
      case "up":
        return "📈"
      case "down":
        return "📉"
      case "seven":
        return "🎯"
      default:
        return "❓"
    }
  }

  const getBetLabel = (betType: string) => {
    switch (betType) {
      case "up":
        return "7 Up (8-15)"
      case "down":
        return "7 Down (1-6)"
      case "seven":
        return "Exactly 7"
      default:
        return "Unknown"
    }
  }

  const getBetMultiplier = (betType: string) => {
    switch (betType) {
      case "up":
        return "2x"
      case "down":
        return "2x"
      case "seven":
        return "11.5x"
      default:
        return "1x"
    }
  }

  const calculatePayout = (betType: string, result: string) => {
    let isWin = false
    let multiplier = 1

    switch (betType) {
      case "up":
        isWin = result === ">7"
        multiplier = 2
        break
      case "down":
        isWin = result === "<7"
        multiplier = 2
        break
      case "seven":
        isWin = result === "=7"
        multiplier = 11.5
        break
    }

    return {
      isWin,
      payout: isWin ? betAmount * multiplier : 0,
      profitLoss: isWin ? (betAmount * multiplier) - betAmount : -betAmount
    }
  }

  if (isNavigating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white"></div>
          <p className="mt-4 text-white">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Casino Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url(/images/backgrounds/7up7down.jpg)',
          filter: 'brightness(0.6) contrast(1.3)'
        }}
      ></div>
      
      {/* Enhanced overlay for better image visibility */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/60 via-blue-900/50 to-indigo-900/60"></div>
      
      {/* Animated background elements */}
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
      <header className="border-b border-yellow-400/30 bg-black/60 backdrop-blur-xl relative z-10 shadow-2xl">
        <div className="container mx-auto px-4 py-4 sm:py-6 flex flex-col sm:flex-row gap-3 sm:gap-4 items-center justify-center sm:justify-between">
          <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto justify-center sm:justify-start mx-auto sm:mx-0">
            <button
              onClick={() => router.push("/")}
              className="p-2 rounded-lg bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-black transition-all duration-300 shadow-lg hover:scale-105"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="relative">
              <div className="w-10 h-10 sm:w-14 sm:h-14 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center casino-glow shadow-lg animate-pulse">
                <span className="text-black font-bold text-xl sm:text-2xl">🎯</span>
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-ping"></div>
              </div>
            <div className="text-center sm:text-left">
              <h1 className="text-3xl xs:text-4xl sm:text-5xl font-serif font-bold text-white leading-tight">
                <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">7Up 7Down</span>
              </h1>
              <p className="text-yellow-400 text-xs sm:text-sm font-semibold">🎯 VIP Casino Experience</p>
            </div>
          </div>
          <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
            <div className="text-center sm:text-right">
              <p className="text-white text-sm font-medium">💰 Balance</p>
              <p className="text-yellow-400 text-lg sm:text-xl font-bold casino-glow">
                {user?.points?.toLocaleString() || "0"} points
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 text-white">
        <div className="container mx-auto px-4 py-8 flex justify-center">
          <div className="max-w-4xl w-full">
            {/* Game Status Bar */}
            <GameStatusBar 
              currentRound={currentRound}
              onRefresh={handleRefresh}
              onPause={() => setIsPaused(!isPaused)}
              isPaused={isPaused}
              isDetailedView={isDetailedView}
              onToggleView={() => setIsDetailedView(!isDetailedView)}
            />

            {/* Main Game Card */}
            <Card className="relative overflow-hidden bg-gradient-to-br from-purple-900/40 to-blue-900/40 border-2 border-purple-500/30 backdrop-blur-sm shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-blue-500/10"></div>
              <CardHeader className="relative">
                <CardTitle className="text-2xl sm:text-3xl font-serif text-white text-center">
                  🎯 <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">7Up 7Down</span> - VIP Casino Game
                </CardTitle>
                <p className="text-white/80 text-center text-sm sm:text-base">
                  🎲 Predict if the next number will be above 7, below 7, or exactly 7. High payouts for exact matches!
                </p>
              </CardHeader>
              <CardContent className="relative space-y-6">
                {/* Modern Betting Options */}
                <div className="max-w-3xl mx-auto">
                  <h3 className="text-lg sm:text-xl font-semibold text-white mb-4 text-center">
                    🎯 Choose Your Bet Type
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                      { type: "up", label: "7 Up (8-15)", icon: "📈", color: "from-green-500 to-emerald-600", multiplier: "2x" },
                      { type: "down", label: "7 Down (1-6)", icon: "📉", color: "from-red-500 to-pink-600", multiplier: "2x" },
                      { type: "seven", label: "Exactly 7", icon: "🎯", color: "from-yellow-500 to-orange-600", multiplier: "11.5x" }
                    ].map((bet) => (
                      <button
                        key={bet.type}
                        onClick={() => setSelectedBet(bet.type)}
                        disabled={!canBet || isLoading || isSpinning}
                        className={`relative overflow-hidden p-6 rounded-xl border-2 transition-all duration-300 transform hover:scale-105 ${
                          selectedBet === bet.type
                            ? `bg-gradient-to-r ${bet.color} border-white shadow-2xl`
                            : "bg-gradient-to-br from-gray-800/40 to-gray-900/40 border-gray-600/30 hover:border-gray-500/50 hover:bg-gray-700/40"
                        } ${!canBet || isLoading || isSpinning ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                      >
                        <div className="text-center space-y-3">
                          <div className={`text-4xl sm:text-5xl ${selectedBet === bet.type ? "animate-bounce" : ""}`}>
                            {bet.icon}
                            </div>
                          <div>
                            <h4 className="font-bold text-lg sm:text-xl text-white">
                              {bet.label}
                            </h4>
                            <p className="text-sm text-white/80">
                              Payout: <span className="font-bold text-yellow-400">{bet.multiplier}</span>
                            </p>
                          </div>
                          {selectedBet === bet.type && (
                            <div className="absolute top-2 right-2">
                              <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                                <span className="text-black text-xs font-bold">✓</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Modern Bet Amount Section */}
                <div className="flex flex-col items-center">
                  <h3 className="text-lg sm:text-xl font-semibold text-white mb-4 text-center">
                    💰 Set Your Bet Amount
                  </h3>
                  <div className="flex flex-col sm:flex-row gap-4 items-center">
                    <div className="flex gap-2">
                      {[100, 500, 1000, 5000].map((amount) => (
                        <button
                          key={amount}
                          onClick={() => setBetAmount(amount)}
                          disabled={isLoading || isSpinning}
                          className={`px-4 py-2 rounded-lg border-2 transition-all duration-200 ${
                            betAmount === amount
                              ? "bg-gradient-to-r from-yellow-400 to-orange-500 text-black border-yellow-400 shadow-lg"
                              : "bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-yellow-400/50"
                          } ${isLoading || isSpinning ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                        >
                          {amount}
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={betAmount}
                        onChange={(e) => setBetAmount(Number(e.target.value))}
                        min={10}
                        max={10000}
                        disabled={isLoading || isSpinning}
                        className="w-32 bg-white/10 border-white/20 text-white placeholder-white/50 text-center focus:border-yellow-400/50 focus:ring-yellow-400/20"
                        placeholder="Custom"
                      />
                      <span className="text-white/80 text-sm">points</span>
                    </div>
                  </div>
                </div>

                {/* Place Bet Button */}
                {selectedBet && (
                  <div className="text-center">
                    <button
                      onClick={handlePlaceBet}
                      disabled={!canBet || isLoading || isSpinning}
                      className={`px-8 py-4 rounded-xl font-bold text-lg sm:text-xl transition-all duration-300 transform hover:scale-105 shadow-2xl ${
                        canBet && !isLoading && !isSpinning
                          ? "bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-black casino-glow"
                          : "bg-gray-600 text-gray-300 cursor-not-allowed"
                      }`}
                    >
                      {isLoading ? (
                        "Placing Bet..."
                      ) : isSpinning ? (
                        "Spinning..."
                      ) : (
                        `🎯 Place Bet - ${betAmount} points on ${getBetLabel(selectedBet)}`
                      )}
                    </button>
                  </div>
                )}

                {/* Spinning Animation */}
                {isSpinning && (
                  <div className="text-center py-8">
                    <div className="relative">
                      {/* Casino chips around the spinning wheel */}
                      <div className="absolute -top-4 -left-4 w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 rounded-full border-2 border-white/20 animate-bounce"></div>
                      <div className="absolute -top-4 -right-4 w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full border-2 border-white/20 animate-bounce" style={{ animationDelay: '0.5s' }}></div>
                      <div className="absolute -bottom-4 -left-4 w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-full border-2 border-white/20 animate-bounce" style={{ animationDelay: '1s' }}></div>
                      <div className="absolute -bottom-4 -right-4 w-8 h-8 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-full border-2 border-white/20 animate-bounce" style={{ animationDelay: '1.5s' }}></div>
                      
                      <div 
                        className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-r from-purple-500 via-pink-600 to-orange-500 text-white text-4xl font-bold mb-4 animate-spin shadow-2xl"
                        style={{ animationDuration: '1s' }}
                      >
                        🎯
                      </div>
                    </div>
                    <div className="text-white">
                      <p className="text-xl font-semibold mb-2">🎯 Rolling the Dice! 🎯</p>
                      <p className="text-base text-white/70 mb-4">💰 Good luck! 💰</p>
                    </div>
                  </div>
                )}

                {/* Current Result Display */}
                {(spinResult !== null && !isSpinning) && (
                  <div className="text-center py-8">
                    <div className="relative">
                      {/* Casino celebration elements */}
                      <div className="absolute -top-2 -left-2 text-2xl animate-bounce">🎉</div>
                      <div className="absolute -top-2 -right-2 text-2xl animate-bounce" style={{ animationDelay: '0.3s' }}>🎊</div>
                      <div className="absolute -bottom-2 -left-2 text-2xl animate-bounce" style={{ animationDelay: '0.6s' }}>💎</div>
                      <div className="absolute -bottom-2 -right-2 text-2xl animate-bounce" style={{ animationDelay: '0.9s' }}>💰</div>
                      
                      <div
                        className={`inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-r ${
                          spinResult === "=7" ? "from-yellow-500 to-orange-600" : 
                          spinResult === ">7" ? "from-green-500 to-emerald-600" : "from-red-500 to-pink-600"
                        } text-white text-4xl font-bold mb-4 shadow-2xl border-4 border-yellow-400/50`}
                      >
                        {spinResult === "=7" ? "7" : spinResult === ">7" ? "8-15" : "1-6"}
                      </div>
                    </div>
                    <div className="text-white">
                      <p className="text-xl font-semibold mb-2">🎯 Result: {spinResult} 🎯</p>
                      <p className="text-base text-white/70 mb-4">
                        {spinResult === "=7" ? "🎯 Exactly 7!" : 
                         spinResult === ">7" ? "📈 Above 7" : "📉 Below 7"}
                      </p>
                      {/* Show bet result */}
                      {selectedBet && (
                        <div className="mt-4 p-4 bg-white/10 rounded-lg border border-yellow-400/20">
                          <p className="text-lg font-semibold mb-2">💰 Your Bet Result: 💰</p>
                          {(() => {
                            const result = calculatePayout(selectedBet, spinResult)
                            return (
                              <div className="flex items-center justify-between p-2 bg-white/5 rounded">
                                <span>🎯 {getBetLabel(selectedBet)}:</span>
                                <span className={`font-bold ${result.isWin ? 'text-green-400' : 'text-red-400'}`}>
                                  {result.isWin ? '🎉 +' : '💔 '}{result.profitLoss.toLocaleString()} points
                                </span>
                              </div>
                            )
                          })()}
                        </div>
                          )}
                        </div>
                  </div>
                )}

            {/* Game Rules */}
                <div className="mt-8 p-6 bg-white/5 rounded-xl border border-white/10">
                  <h3 className="text-lg font-semibold text-white mb-4 text-center">📋 Game Rules</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                    <div className="text-center p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                      <div className="text-2xl mb-2">📈</div>
                      <p className="font-semibold text-green-400">7 Up (8-15)</p>
                      <p className="text-white/80">Payout: 2x</p>
                    </div>
                    <div className="text-center p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                      <div className="text-2xl mb-2">📉</div>
                      <p className="font-semibold text-red-400">7 Down (1-6)</p>
                      <p className="text-white/80">Payout: 2x</p>
                </div>
                    <div className="text-center p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                      <div className="text-2xl mb-2">🎯</div>
                      <p className="font-semibold text-yellow-400">Exactly 7</p>
                      <p className="text-white/80">Payout: 11.5x</p>
                </div>
                </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
