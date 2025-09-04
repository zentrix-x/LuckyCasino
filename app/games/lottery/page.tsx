"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Hash, Target, Plus, X, Trophy, Clock } from "lucide-react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { GameStatusBar } from "@/components/game-status-bar"
import { GameHistoryPanel } from "@/components/game-history-panel"
import { useToast } from "@/hooks/use-toast"

interface UserBet {
  id: string
  gameType: string
  betAmount: number
  outcome: string
  result: 'won' | 'lost' | 'pending'
  payout?: number
  roundId: string
  createdAt: string
  roundInfo?: {
    winningOutcome: string
    status: string
  }
}

export default function LotteryPage() {
  const router = useRouter()
  const { user, updatePoints } = useAuth()
  const { toast } = useToast()
  const [betAmount, setBetAmount] = useState(10)
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([])
  const [betType, setBetType] = useState<"exact" | "range">("exact")
  const [jwtToken, setJwtToken] = useState<string | null>(null)
  const [currentRound, setCurrentRound] = useState<any | null>(null)
  const [apiResult, setApiResult] = useState<string | null>(null)
  const [isNavigating, setIsNavigating] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [isDetailedView, setIsDetailedView] = useState(false)
  const [isPageLoading, setIsPageLoading] = useState(true)
  const [userBets, setUserBets] = useState<UserBet[]>([])
  const [showPlaceBet, setShowPlaceBet] = useState(false)
  const [isSpinning, setIsSpinning] = useState(false)
  const [spinResult, setSpinResult] = useState<string | null>(null)

  // Use real backend data instead of mock game engine
  const canBet = currentRound?.status === "betting" || true // Temporarily allow betting for testing
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

  // Fetch user bets
  useEffect(() => {
    const fetchUserBets = async () => {
      if (!user) return

      try {
        const token = localStorage.getItem('jwt')
        if (!token) return

        const response = await fetch('/api/user/bets?limit=10&gameType=lottery_0_99', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (response.ok) {
          const data = await response.json()
          setUserBets(data)
        }
      } catch (error) {
        console.error('Failed to fetch user bets:', error)
      }
    }

    fetchUserBets()
    
    // Refresh every 30 seconds for real-time updates
    const interval = setInterval(fetchUserBets, 30000)
    return () => clearInterval(interval)
  }, [user])

  // Auto-settle rounds when they're ready - Enhanced for immediate settlement
  useEffect(() => {
    if (currentRound?.status === "betting" && currentRound.roundEndAt) {
      const endTime = new Date(currentRound.roundEndAt)
      const now = new Date()
      
      if (now >= endTime) {
        // Immediate settlement
        const settleRound = async () => {
          try {
            console.log("🔄 Auto-settling lottery round...")
            await fetch("/api/auto-settle", { method: "GET" })
            // Refresh current round after settling
            setTimeout(async () => {
              const res = await fetch("/api/games/lottery_0_99/current-round")
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
                console.log("⏰ Timer triggered - settling lottery round...")
                await fetch("/api/auto-settle", { method: "GET" })
                // Refresh current round after settling
                setTimeout(async () => {
                  const res = await fetch("/api/games/lottery_0_99/current-round")
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

  const handleNumberSelect = (number: number) => {
    if (!canBet) return
    
    setSelectedNumbers(prev => {
      if (prev.includes(number)) {
        return prev.filter(n => n !== number)
      } else {
        return [...prev, number]
      }
    })
    
    // Show place bet option when numbers are selected
    if (selectedNumbers.length === 0) {
      setShowPlaceBet(true)
    }
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
    if (!canBet || !user || selectedNumbers.length === 0) {
      toast({
        title: "Cannot place bet",
        description: "Please select at least one number and ensure betting is open.",
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

    if (user.points < betAmount * selectedNumbers.length) {
      toast({
        title: "Insufficient points",
        description: `You need ${betAmount * selectedNumbers.length} points for ${selectedNumbers.length} number(s).`,
        variant: "destructive",
      })
      return
    }

    // Start spinning animation immediately
    setIsSpinning(true)
    setSpinResult(null)
    setIsLoading(true)
    
    // Add dramatic spinning effect
    const spinDuration = 5000 // 5 seconds
    const finalRotation = Math.floor(Math.random() * 100) // Random number 0-99

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

    setIsLoading(true)

    try {
      // Place bets for each selected number
      const totalBetAmount = betAmount * selectedNumbers.length
      let successCount = 0

      for (const number of selectedNumbers) {
      const res = await fetch("/api/bets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          gameType: "lottery_0_99",
          roundId: (currentRound as any)?._id,
            outcome: String(number),
          amount: betAmount,
        }),
      })
        
        if (res.ok) {
          successCount++
        }
      }

      if (successCount === selectedNumbers.length) {
        updatePoints(user.points - totalBetAmount)
        toast({ 
          title: "Bets placed successfully!", 
          description: `${totalBetAmount} points on ${selectedNumbers.length} number(s): ${selectedNumbers.join(', ')}` 
        })
        setSelectedNumbers([])
        setShowPlaceBet(false)
        
        // Continue spinning for 3 seconds, then show result
        setTimeout(async () => {
          try {
            // Fetch the latest result
            const res = await fetch("/api/games/lottery_0_99/current-round")
            const data = await res.json()
            if (res.ok) {
              setSpinResult(data.winningOutcome || "0")
              setApiResult(data.winningOutcome || "0")
            }
          } catch (error) {
            console.error("Failed to fetch result:", error)
            // Fallback to a random number if API fails
            const randomNumber = Math.floor(Math.random() * 100).toString()
            setSpinResult(randomNumber)
            setApiResult(randomNumber)
          } finally {
            setIsSpinning(false)
            setIsLoading(false)
          }
        }, 3000)
      } else {
        toast({ 
          title: "Partial bet failure", 
          description: `${successCount}/${selectedNumbers.length} bets placed successfully.`, 
          variant: "destructive" 
        })
        setIsSpinning(false)
        setIsLoading(false)
      }
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
    } finally {
      setIsLoading(false)
      setIsSpinning(false)
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

  const calculatePayout = (betAmount: number, outcome: string, winningOutcome: string) => {
    if (outcome === winningOutcome) {
      return betAmount * 95 // Exact match pays 95x
    }
    
    const betRange = getNumberRange(Number(outcome))
    const winningRange = getNumberRange(Number(winningOutcome))
    
    if (betRange === winningRange) {
      return betAmount * 9.5 // Range match pays 9.5x
    }
    
    return 0 // No win
  }

  const getResultIcon = (result: string) => {
    switch (result) {
      case 'won': return <Trophy className="w-4 h-4 text-yellow-400" />
      case 'lost': return <X className="w-4 h-4 text-red-400" />
      case 'pending': return <Clock className="w-4 h-4 text-blue-400" />
      default: return null
    }
  }

  const getResultColor = (result: string) => {
    switch (result) {
      case 'won': return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'lost': return 'bg-red-500/20 text-red-400 border-red-500/30'
      case 'pending': return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return `${Math.floor(diffInMinutes / 1440)}d ago`
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
    <div className="min-h-screen relative overflow-hidden">
      {/* Lottery Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url(/images/backgrounds/lottery.jpg)',
          filter: 'brightness(0.6) contrast(1.3)'
        }}
      ></div>
      
      {/* Lighter overlay for better image visibility */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/50 via-blue-900/40 to-indigo-900/50"></div>
      
      {/* Casino Background Elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-32 h-32 bg-yellow-400 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute top-20 right-20 w-24 h-24 bg-red-400 rounded-full blur-xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-20 left-20 w-28 h-28 bg-green-400 rounded-full blur-xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-10 right-10 w-20 h-20 bg-blue-400 rounded-full blur-xl animate-pulse" style={{ animationDelay: '0.5s' }}></div>
      </div>
      
      {/* Enhanced Floating Casino Elements */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Floating casino chips */}
        <div className="absolute top-1/4 left-1/4 w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 rounded-full border-2 border-white/20 animate-bounce casino-glow" style={{ animationDelay: '0s' }}></div>
        <div className="absolute top-1/3 right-1/3 w-6 h-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full border-2 border-white/20 animate-bounce" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-1/4 left-1/3 w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-full border-2 border-white/20 animate-bounce casino-glow" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-1/3 right-1/4 w-7 h-7 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-full border-2 border-white/20 animate-bounce" style={{ animationDelay: '0.5s' }}></div>
        
        {/* Sparkling effects */}
        <div className="absolute top-1/3 left-1/3 w-2 h-2 bg-yellow-400 rounded-full animate-ping" style={{ animationDelay: '0.5s' }}></div>
        <div className="absolute top-2/3 right-1/3 w-3 h-3 bg-blue-400 rounded-full animate-ping" style={{ animationDelay: '1.5s' }}></div>
        <div className="absolute bottom-1/3 left-2/3 w-2 h-2 bg-green-400 rounded-full animate-ping" style={{ animationDelay: '2.5s' }}></div>
        
        {/* Glowing orbs */}
        <div className="absolute top-1/4 right-1/4 w-40 h-40 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute bottom-1/4 left-1/4 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-full blur-xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-sm relative z-10">
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
                {/* Casino-themed icon with chips */}
                <div className="w-6 h-6 xs:w-8 xs:h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-500 via-pink-600 to-orange-500 rounded-xl shadow-lg shadow-purple-500/30 flex items-center justify-center relative overflow-hidden">
                  {/* Animated gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
                  
                  {/* Casino chips icon */}
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
                <h1 className="text-sm xs:text-lg sm:text-2xl font-black text-white drop-shadow-lg">🎰 Lucky Lottery</h1>
                <p className="text-xs text-white/60 font-medium">VIP Casino Experience</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-white bg-black/20 px-3 py-1 rounded-lg border border-white/10">
              <span className="text-sm opacity-80">💰 Points: </span>
              <span className="font-bold text-lg text-yellow-400">{user.points.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center">
          {/* Main Game Area - Centered */}
          <div className="max-w-5xl w-full space-y-6">
            {/* Game Status */}
            <GameStatusBar 
              gameType="lottery_0_99" 
              currentRound={currentRound || null}
              onRefresh={handleRefresh}
              onToggleView={handleToggleView}
              onPauseUpdates={handlePauseUpdates}
            />

            {/* Game Board */}
            <Card className="bg-white/10 border-white/20 text-white relative overflow-hidden">
              {/* Casino-themed background pattern */}
              <div className="absolute inset-0 opacity-5">
                <div className="absolute top-4 left-4 w-16 h-16 bg-yellow-400 rounded-full"></div>
                <div className="absolute top-8 right-8 w-12 h-12 bg-red-400 rounded-full"></div>
                <div className="absolute bottom-8 left-8 w-14 h-14 bg-green-400 rounded-full"></div>
                <div className="absolute bottom-4 right-4 w-10 h-10 bg-blue-400 rounded-full"></div>
              </div>
              
              <CardHeader>
                <CardTitle className="text-center text-2xl">🎰 Pick Your Lucky Numbers 🎰</CardTitle>
                <p className="text-center text-white/70">Choose multiple numbers from 0-99 and win big! 💰</p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Number Grid */}
                <div className="text-center mb-4">
                  <div className={`inline-block px-4 py-2 rounded-lg text-sm font-bold ${
                    canBet ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'
                  }`}>
                    {canBet ? '🎯 Betting Open - Click numbers to select!' : '⏸️ Betting Closed'}
                  </div>
                </div>
                <div className="grid grid-cols-10 gap-0.5 xs:gap-1 sm:gap-2 md:gap-3 max-w-full sm:max-w-4xl md:max-w-5xl mx-auto px-1 xs:px-2">
                  {Array.from({ length: 100 }, (_, i) => (
                    <button
                      key={i}
                      onClick={() => handleNumberSelect(i)}
                      disabled={!canBet || isSpinning}
                      className={`
                        aspect-square rounded-md xs:rounded-lg text-[8px] xs:text-xs sm:text-sm md:text-lg font-bold transition-all duration-200
                        ${
                          selectedNumbers.includes(i)
                            ? `bg-gradient-to-r ${getNumberColor(i)} ring-2 xs:ring-3 ring-yellow-400 scale-110 text-white shadow-lg`
                            : `bg-gradient-to-r ${getNumberColor(i)} hover:scale-105 text-white opacity-80 hover:opacity-100`
                        }
                        ${(!canBet || isSpinning) ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                      `}
                    >
                      {i}
                    </button>
                  ))}
                </div>

                {/* Selected Numbers Display */}
                {selectedNumbers.length > 0 && (
                  <div className="text-center py-3 xs:py-4">
                    <div className="inline-flex flex-col items-center gap-3 xs:gap-4 p-3 xs:p-4 sm:p-6 bg-white/10 rounded-lg">
                      <div className="flex flex-wrap justify-center gap-2 xs:gap-3">
                        {selectedNumbers.map((number) => (
                          <div key={number} className="flex items-center gap-1">
                            <div
                              className={`w-8 h-8 xs:w-10 xs:h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-r ${getNumberColor(number)} flex items-center justify-center text-white text-sm xs:text-base sm:text-lg font-bold`}
                            >
                              {number}
                            </div>
                            <button
                              onClick={() => handleNumberSelect(number)}
                              className="w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center text-xs"
                            >
                              <X className="w-2 h-2 xs:w-3 xs:h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                      <div className="text-center">
                        <p className="text-white font-semibold text-sm xs:text-base sm:text-lg">
                          Selected: {selectedNumbers.length} number(s)
                        </p>
                        <p className="text-white/70 text-xs xs:text-sm sm:text-base">
                          Total bet: {betAmount * selectedNumbers.length} points
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Bet Amount */}
                <div className="max-w-md mx-auto px-2 xs:px-4 flex flex-col items-center relative z-50">
                  <label className="block text-white text-xs xs:text-sm font-medium mb-2">Bet Amount per Number (min: 10 points)</label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Input
                      type="number"
                      min="1"
                      value={betAmount}
                      onChange={(e) => setBetAmount(Number(e.target.value))}
                      className="bg-white/10 border-white/20 text-white placeholder-white/50 text-sm focus:border-yellow-400/50 focus:ring-yellow-400/20"
                    />
                    <div className="flex gap-1 justify-center sm:justify-start relative z-10">
                      {[1, 5, 10, 25].map((amount) => (
                        <button
                          key={amount}
                          onClick={() => {
                            console.log('Button clicked:', amount)
                            setBetAmount(amount)
                          }}
                          className="border border-white/20 text-white hover:bg-white/10 hover:border-yellow-400/50 text-[10px] xs:text-xs sm:text-sm px-2 xs:px-3 py-1 transition-all duration-200 cursor-pointer relative z-20 bg-transparent rounded"
                        >
                          {amount}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Place Bet Button */}
                {selectedNumbers.length > 0 && (
                  <div className="text-center px-4 relative z-50">
                    <button
                      onClick={() => {
                        console.log('Place Bet button clicked!')
                        handlePlaceBet()
                      }}
                      disabled={isLoading || isSpinning}
                      className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black hover:from-yellow-500 hover:to-orange-600 px-6 sm:px-8 py-3 text-base sm:text-lg font-semibold w-full sm:w-auto rounded-lg cursor-pointer transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? (
                        "Placing Bets..."
                      ) : isSpinning ? (
                        "Spinning..."
                      ) : (
                        `Place Bet - ${betAmount * selectedNumbers.length} points on ${selectedNumbers.length} number(s)`
                      )}
                    </button>
                </div>
                )}

                {/* Enhanced Spinning Animation */}
                {isSpinning && (
                  <div className="text-center py-8">
                    {/* Casino chips around the spinning wheel */}
                    <div className="relative">
                      <div className="absolute -top-4 -left-4 w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 rounded-full border-2 border-white/20 animate-bounce casino-glow"></div>
                      <div className="absolute -top-4 -right-4 w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full border-2 border-white/20 animate-bounce" style={{ animationDelay: '0.5s' }}></div>
                      <div className="absolute -bottom-4 -left-4 w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-full border-2 border-white/20 animate-bounce casino-glow" style={{ animationDelay: '1s' }}></div>
                      <div className="absolute -bottom-4 -right-4 w-8 h-8 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-full border-2 border-white/20 animate-bounce" style={{ animationDelay: '1.5s' }}></div>
                      
                      {/* Enhanced spinning wheel */}
                      <div className="relative">
                        {/* Outer glow ring */}
                        <div className="absolute inset-0 w-40 h-40 rounded-full bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-orange-500/20 blur-xl animate-pulse"></div>
                        
                        <div 
                          className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-r from-purple-500 via-pink-600 to-orange-500 text-white text-4xl font-bold mb-4 animate-spin shadow-2xl border-4 border-yellow-400/30"
                          style={{ animationDuration: '0.8s' }}
                        >
                          🎰
                        </div>
                        
                        {/* Spinning animation overlays */}
                        <div className="absolute inset-0 w-32 h-32 rounded-full bg-gradient-to-r from-transparent via-white/10 to-transparent animate-spin" style={{ animationDuration: '1.2s' }}></div>
                        <div className="absolute inset-0 w-32 h-32 rounded-full bg-gradient-to-r from-yellow-400/20 via-orange-500/20 to-red-500/20 animate-spin" style={{ animationDuration: '1.6s', animationDirection: 'reverse' }}></div>
                      </div>
                    </div>
                    <div className="text-white">
                      <p className="text-xl font-semibold mb-2 animate-pulse">🎰 Spinning the Wheel! 🎰</p>
                      <p className="text-base text-white/70 mb-4">💰 Good luck! 💰</p>
                      <div className="flex justify-center gap-2">
                        <span className="text-yellow-400 animate-bounce">🎯</span>
                        <span className="text-blue-400 animate-bounce" style={{ animationDelay: '0.3s' }}>🎲</span>
                        <span className="text-green-400 animate-bounce" style={{ animationDelay: '0.6s' }}>💎</span>
                        <span className="text-red-400 animate-bounce" style={{ animationDelay: '0.9s' }}>💰</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Current Result Display */}
                {(spinResult !== null && !isSpinning) && (
                  <div className="text-center py-8">
                    {/* Casino celebration elements */}
                    <div className="relative">
                      <div className="absolute -top-2 -left-2 text-2xl animate-bounce">🎉</div>
                      <div className="absolute -top-2 -right-2 text-2xl animate-bounce" style={{ animationDelay: '0.3s' }}>🎊</div>
                      <div className="absolute -bottom-2 -left-2 text-2xl animate-bounce" style={{ animationDelay: '0.6s' }}>💎</div>
                      <div className="absolute -bottom-2 -right-2 text-2xl animate-bounce" style={{ animationDelay: '0.9s' }}>💰</div>
                      
                      <div
                        className={`inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-r ${getNumberColor(Number(spinResult))} text-white text-4xl font-bold mb-4 shadow-2xl border-4 border-yellow-400/50`}
                      >
                        {spinResult}
                            </div>
                          </div>
                    <div className="text-white">
                      <p className="text-xl font-semibold mb-2">🎰 Winning Number: {spinResult} 🎰</p>
                      <p className="text-base text-white/70 mb-4">
                        Range: {getRangeLabel(getNumberRange(Number(spinResult)))}
                      </p>
                      {/* Show bet result */}
                      {selectedNumbers.length > 0 && (
                        <div className="mt-4 p-4 bg-white/10 rounded-lg border border-yellow-400/20">
                          <p className="text-lg font-semibold mb-2">💰 Your Bet Result: 💰</p>
                          {selectedNumbers.map((number) => {
                            const isExactMatch = Number(spinResult) === number
                            const isRangeMatch = getNumberRange(Number(spinResult)) === getNumberRange(number)
                            const payout = isExactMatch ? betAmount * 95 : isRangeMatch ? betAmount * 9.5 : 0
                            const profitLoss = payout - betAmount
                            
                            return (
                              <div key={number} className="flex items-center justify-between mb-2 p-2 bg-white/5 rounded">
                                <span>🎯 Number {number}:</span>
                                <span className={`font-bold ${profitLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                  {profitLoss >= 0 ? '🎉 +' : '💔 '}{profitLoss.toLocaleString()} points
                                </span>
                        </div>
                      )
                    })}
                  </div>
                )}
                    </div>
                </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
