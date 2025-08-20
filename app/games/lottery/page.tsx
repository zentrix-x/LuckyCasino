"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Hash, Target } from "lucide-react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { GameStatusBar } from "@/components/game-status-bar"
import { GameHistoryPanel } from "@/components/game-history-panel"
import { useToast } from "@/hooks/use-toast"

export default function LotteryPage() {
  const router = useRouter()
  const { user, updatePoints } = useAuth()
  const { toast } = useToast()
  const [betAmount, setBetAmount] = useState(10)
  const [selectedNumber, setSelectedNumber] = useState<number | null>(null)
  const [betType, setBetType] = useState<"exact" | "range">("exact")
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
  const shownLotteryResult = (apiResult as string | null) ?? (currentRound?.status === "settled" ? (currentRound.winningOutcome as number | undefined) : undefined)

  // Fetch current round and handle real-time updates
  useEffect(() => {
    if (isPaused) return // Don't fetch if paused

    const fetchCurrentRound = async () => {
      try {
        const res = await fetch("/api/games/lottery_0_99/current-round")
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
            await fetch("/api/games/lottery_0_99/settle", { method: "POST" })
            // Refresh current round after settling
            setTimeout(async () => {
              const res = await fetch("/api/games/lottery_0_99/current-round")
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

  const handleNumberSelect = (number: number) => {
    setSelectedNumber(number)
  }

  const handleRefresh = async () => {
    try {
      const res = await fetch("/api/games/lottery_0_99/current-round")
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

  const handlePlaceBet = async () => {
    if (!canBet || !user || selectedNumber === null) {
      toast({
        title: "Cannot place bet",
        description: "Please select a number and ensure betting is open.",
        variant: "destructive",
      })
      return
    }

    if (betAmount < 1 || betAmount > 100) {
      toast({
        title: "Invalid bet amount",
        description: "Bet must be between 1 and 100 points.",
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
        const roundRes = await fetch("/api/games/lottery_0_99/current-round")
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
          gameType: "lottery_0_99",
          roundId: (currentRound as any)?._id,
          outcome: String(selectedNumber),
          amount: betAmount,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.error || "Bet failed")
      }
      updatePoints(user.points - betAmount)
      toast({ title: "Bet placed!", description: `${betAmount} points on number ${selectedNumber}` })
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

  const getNumberRange = (number: number) => {
    return Math.floor(number / 10)
  }

  const getRangeLabel = (range: number) => {
    return `${range * 10}-${range * 10 + 9}`
  }

  const getNumberColor = (number: number) => {
    const range = getNumberRange(number)
    const colors = [
      "from-red-500 to-red-600", // 0-9
      "from-blue-500 to-blue-600", // 10-19
      "from-green-500 to-green-600", // 20-29
      "from-yellow-500 to-yellow-600", // 30-39
      "from-purple-500 to-purple-600", // 40-49
      "from-pink-500 to-pink-600", // 50-59
      "from-indigo-500 to-indigo-600", // 60-69
      "from-orange-500 to-orange-600", // 70-79
      "from-teal-500 to-teal-600", // 80-89
      "from-cyan-500 to-cyan-600", // 90-99
    ]
    return colors[range] || "from-gray-500 to-gray-600"
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
        const roundRes = await fetch("/api/games/lottery_0_99/current-round")
        const roundData = await roundRes.json()
        if (roundRes.ok) setCurrentRound(roundData)
      } catch {}
    }
    
    fetchRound()
  }, [])

  // Poll and auto-settle
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/games/lottery_0_99/current-round")
        const data = await res.json()
        if (res.ok) {
          setCurrentRound(data)
          const endTs = data?.roundEndAt ? new Date(data.roundEndAt).getTime() : 0
          const now = Date.now()
          if (endTs && now >= endTs && data.status !== "settled") {
            const settle = await fetch("/api/games/lottery_0_99/settle", { method: "POST" })
            const sData = await settle.json().catch(() => ({}))
            if (settle.ok) setApiResult(sData?.winningOutcome || data?.winningOutcome || null)
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
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 via-pink-600 to-orange-500 rounded-xl shadow-lg shadow-purple-500/30 flex items-center justify-center mx-auto mb-4 animate-pulse">
            <span className="text-white text-2xl font-black">🎰</span>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Loading Lottery...</h2>
          <p className="text-white/60">Preparing your game experience</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="container mx-auto px-2 xs:px-4 py-2 xs:py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-1 xs:gap-2 sm:gap-4">
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
              className="text-white hover:bg-white/10 text-[10px] xs:text-xs sm:text-sm px-2 xs:px-3"
            >
              <ArrowLeft className="w-2.5 h-2.5 xs:w-3 xs:h-3 sm:w-4 sm:h-4 mr-0.5 xs:mr-1 sm:mr-2" />
              {isNavigating ? "Loading..." : "Back"}
            </Button>
            <div className="flex items-center gap-2 xs:gap-3">
              <div className="relative">
                {/* Modern gradient background with glow */}
                <div className="w-6 h-6 xs:w-8 xs:h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-500 via-pink-600 to-orange-500 rounded-xl shadow-lg shadow-purple-500/30 flex items-center justify-center relative overflow-hidden">
                  {/* Animated gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
                  
                  {/* Modern Lottery icon */}
                  <div className="relative z-10 flex items-center justify-center">
                    <div className="w-3 h-3 xs:w-4 xs:h-4 sm:w-6 sm:h-6 rounded-full bg-gradient-to-br from-white/20 to-transparent flex items-center justify-center">
                      <span className="text-white text-xs xs:text-sm sm:text-sm font-black drop-shadow-lg">🎰</span>
                    </div>
                  </div>
                  
                  {/* Corner accent */}
                  <div className="absolute top-0 right-0 w-1.5 h-1.5 xs:w-2 xs:h-2 sm:w-3 sm:h-3 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-bl-lg"></div>
                </div>
                
                {/* Outer glow ring */}
                <div className="absolute inset-0 w-6 h-6 xs:w-8 xs:h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-500/30 via-pink-500/30 to-orange-500/30 rounded-xl blur-sm animate-pulse"></div>
              </div>
              
              <div>
                <h1 className="text-sm xs:text-lg sm:text-2xl font-black text-white drop-shadow-lg">Lottery</h1>
                <p className="text-xs text-white/60 font-medium">Live Casino Game</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-white">
              <span className="text-sm opacity-80">Points: </span>
              <span className="font-bold text-lg">{user.points.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Game Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Game Status */}
            <GameStatusBar 
              gameType="lottery_0_99" 
              currentRound={currentRound || null}
              onRefresh={handleRefresh}
              onToggleView={handleToggleView}
              onPauseUpdates={handlePauseUpdates}
            />

            {/* Game Board */}
            <Card className="bg-white/10 border-white/20 text-white">
              <CardHeader>
                <CardTitle className="text-center text-2xl">Pick Your Lucky Number</CardTitle>
                <p className="text-center text-white/70">Choose a number from 0-99 and win big!</p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Number Grid */}
                <div className="grid grid-cols-10 gap-0.5 xs:gap-1 sm:gap-2 md:gap-3 max-w-full sm:max-w-4xl md:max-w-5xl mx-auto px-1 xs:px-2">
                  {Array.from({ length: 100 }, (_, i) => (
                    <button
                      key={i}
                      onClick={() => canBet && handleNumberSelect(i)}
                      disabled={!canBet}
                      className={`
                        aspect-square rounded-md xs:rounded-lg text-[8px] xs:text-xs sm:text-sm md:text-lg font-bold transition-all duration-200
                        ${
                          selectedNumber === i
                            ? `bg-gradient-to-r ${getNumberColor(i)} ring-1 xs:ring-2 ring-yellow-400 scale-110 text-white`
                            : `bg-gradient-to-r ${getNumberColor(i)} hover:scale-105 text-white opacity-80 hover:opacity-100`
                        }
                        ${!canBet ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                      `}
                    >
                      {i}
                    </button>
                  ))}
                </div>

                {/* Selected Number Display */}
                {selectedNumber !== null && (
                  <div className="text-center py-3 xs:py-4">
                    <div className="inline-flex flex-col sm:flex-row items-center gap-3 xs:gap-4 sm:gap-6 p-3 xs:p-4 sm:p-6 bg-white/10 rounded-lg">
                      <div
                        className={`w-12 h-12 xs:w-16 xs:h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-r ${getNumberColor(selectedNumber)} flex items-center justify-center text-white text-lg xs:text-2xl sm:text-3xl font-bold`}
                      >
                        {selectedNumber}
                      </div>
                      <div className="text-center sm:text-left">
                        <p className="text-white font-semibold text-sm xs:text-base sm:text-lg">Selected: {selectedNumber}</p>
                        <p className="text-white/70 text-xs xs:text-sm sm:text-base">Range: {getRangeLabel(getNumberRange(selectedNumber))}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Bet Amount */}
                <div className="max-w-md mx-auto px-2 xs:px-4">
                  <label className="block text-white text-xs xs:text-sm font-medium mb-2">Bet Amount (min: 10 points)</label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Input
                      type="number"
                      min="1"
                      
                      value={betAmount}
                      onChange={(e) => setBetAmount(Number(e.target.value))}
                      className="bg-white/10 border-white/20 text-white placeholder-white/50 text-sm"
                      disabled={!canBet}
                    />
                    <div className="flex gap-1 justify-center sm:justify-start">
                      {[1, 5, 10, 25].map((amount) => (
                        <Button
                          key={amount}
                          variant="outline"
                          size="sm"
                          onClick={() => setBetAmount(amount)}
                          disabled={!canBet}
                          className="border-white/20 text-white hover:bg-white/10 text-[10px] xs:text-xs sm:text-sm px-2 xs:px-3"
                        >
                          {amount}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Place Bet Button */}
                <div className="text-center px-4">
                  <Button
                    onClick={handlePlaceBet}
                    disabled={!canBet || selectedNumber === null}
                    className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black hover:from-yellow-500 hover:to-orange-600 px-6 sm:px-8 py-3 text-base sm:text-lg font-semibold w-full sm:w-auto"
                  >
                    {selectedNumber !== null ? `Bet ${betAmount} on ${selectedNumber}` : "Select a Number"}
                  </Button>
                </div>

                {/* Current Result Display (API or mock engine) */}
                {shownLotteryResult !== null && shownLotteryResult !== undefined && (
                  <div className="text-center py-8">
                    <div
                      className={`inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-r ${getNumberColor(Number(shownLotteryResult))} text-white text-4xl font-bold mb-4`}
                    >
                      {shownLotteryResult}
                    </div>
                    <div className="text-white">
                      <p className="text-xl font-semibold mb-2">Winning Number: {shownLotteryResult}</p>
                      <p className="text-base text-white/70 mb-4">
                        Range: {getRangeLabel(getNumberRange(Number(shownLotteryResult)))}
                      </p>
                      {/* User bet result will be shown here when implemented */}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Game History */}
            <GameHistoryPanel gameType="lottery_0_99" />

            {/* Your Recent Bets */}
            <Card className="bg-white/10 border-white/20 text-white">
              <CardHeader>
                <CardTitle className="text-lg">Your Recent Bets</CardTitle>
              </CardHeader>
              <CardContent>
                {recentUserBets.length === 0 ? (
                  <p className="text-white/60 text-sm">No bets placed yet</p>
                ) : (
                  <div className="space-y-3">
                    {recentUserBets.map((bet) => {
                      const betNumber = Number.parseInt(bet.betChoice)
                      return (
                        <div key={bet.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-8 h-8 rounded-full bg-gradient-to-r ${getNumberColor(betNumber)} flex items-center justify-center text-white text-sm font-bold`}
                            >
                              {betNumber}
                            </div>
                            <div>
                              <p className="text-sm font-medium">Number {betNumber}</p>
                              <p className="text-xs text-white/60">
                                {bet.betAmount} points • Range {getRangeLabel(getNumberRange(betNumber))}
                              </p>
                            </div>
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
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Game Rules */}
            <Card className="bg-white/10 border-white/20 text-white">
              <CardHeader>
                <CardTitle className="text-lg">How to Play</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="flex items-center gap-3">
                  <Target className="w-5 h-5 text-yellow-400" />
                  <div>
                    <p className="font-semibold text-yellow-400">Exact Match</p>
                    <p className="text-white/70">Pick the exact winning number</p>
                    <p className="text-green-400 font-semibold">Pays 95x your bet</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Hash className="w-5 h-5 text-blue-400" />
                  <div>
                    <p className="font-semibold text-blue-400">Range Match</p>
                    <p className="text-white/70">Same decade as winning number</p>
                    <p className="text-green-400 font-semibold">Pays 9.5x your bet</p>
                  </div>
                </div>

                <div className="pt-3 border-t border-white/20">
                  <p className="text-xs text-white/60 mb-2">
                    <strong>Ranges:</strong> 0-9, 10-19, 20-29, 30-39, 40-49, 50-59, 60-69, 70-79, 80-89, 90-99
                  </p>
                  <p className="text-xs text-white/60">
                    A random number from 0-99 is drawn each round. You win both payouts if you get an exact match!
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Number Ranges Guide */}
            <Card className="bg-white/10 border-white/20 text-white">
              <CardHeader>
                <CardTitle className="text-lg">Number Ranges</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {Array.from({ length: 10 }, (_, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded bg-gradient-to-r ${getNumberColor(i * 10)}`} />
                      <span className="text-white/70">{getRangeLabel(i)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
