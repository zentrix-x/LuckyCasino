"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Circle } from "lucide-react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { GameStatusBar } from "@/components/game-status-bar"
import { GameHistoryPanel } from "@/components/game-history-panel"
import { useToast } from "@/hooks/use-toast"

export default function SpinWinPage() {
  const router = useRouter()
  const { user, updatePoints } = useAuth()
  const { toast } = useToast()
  const [betAmount, setBetAmount] = useState(100)
  const [selectedBet, setSelectedBet] = useState<string | null>(null)
  const [isSpinning, setIsSpinning] = useState(false)
  const [wheelRotation, setWheelRotation] = useState(0)
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
  // Only show result when user has placed a bet (apiResult is set)
  const shownSpinResult = apiResult as string | null

  // Fetch current round and handle real-time updates
  useEffect(() => {
    if (isPaused) return // Don't fetch if paused

    const fetchCurrentRound = async () => {
      try {
        const res = await fetch("/api/games/spin_win/current-round")
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
            console.log("🔄 Auto-settling spin & win round...")
            await fetch("/api/auto-settle", { method: "GET" })
            // Refresh current round after settling
            setTimeout(async () => {
              const res = await fetch("/api/games/spin_win/current-round")
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
                console.log("⏰ Timer triggered - settling spin & win round...")
                await fetch("/api/auto-settle", { method: "GET" })
                // Refresh current round after settling
                setTimeout(async () => {
                  const res = await fetch("/api/games/spin_win/current-round")
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

  // Handle wheel spinning animation - Only when user places a bet
  // Removed automatic spinning when round is settled
  // Wheel will only spin when handlePlaceBet is called

  const handleRefresh = async () => {
    try {
      const res = await fetch("/api/games/spin_win/current-round")
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

    if (betAmount < 100 || betAmount > 500) {
      toast({
        title: "Invalid bet amount",
        description: "Bet must be between 100 and 500 points.",
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
    // Ensure we have a JWT token
    let token = jwtToken
    if (!token && typeof window !== 'undefined') {
      try {
        token = localStorage.getItem("jwt")
        if (token) setJwtToken(token)
      } catch {}
    }
    
    // If still no token, try to get a new one
    if (!token && user?.username) {
      try {
        const res = await fetch("/api/dev/ensure-user", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: user.username, password: "dev", role: "user", points: user.points }),
        })
        const data = await res.json()
        if (res.ok && data.token) {
          token = data.token
          setJwtToken(token)
          if (typeof window !== 'undefined' && token) {
            localStorage.setItem("jwt", token)
          }
        }
      } catch {}
    }
    
    // Check if we have a valid token
    if (!token) {
      toast({
        title: "Authentication Required",
        description: "Please log out and log back in to continue.",
        variant: "destructive",
      })
      return
    }

    // Fetch current round if needed
    if (!currentRound) {
      try {
        const roundRes = await fetch("/api/games/spin_win/current-round")
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
          gameType: "spin_win",
          roundId: (currentRound as any)?._id,
          outcome: betChoice,
          amount: betAmount,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.error || "Bet failed")
      }
      
      // Start spinning animation immediately after successful bet
      setIsSpinning(true)
      setSelectedBet(betChoice)
      updatePoints(user.points - betAmount)
      toast({ title: "Bet placed!", description: `${betAmount} points on ${betChoice}` })
      
      // Spin the wheel with dramatic animation
      const spinDuration = 8000 // 8 seconds
      const finalRotation = wheelRotation + 1800 + Math.random() * 360 // Multiple spins + random final position
      setWheelRotation(finalRotation)
      
      // Show result after spinning
      setTimeout(async () => {
        try {
          // Fetch the latest result
          const resultRes = await fetch("/api/games/spin_win/current-round")
          const resultData = await resultRes.json()
          if (resultRes.ok && resultData.winningOutcome) {
            console.log("🎯 Backend result:", resultData.winningOutcome)
            setApiResult(resultData.winningOutcome)
          } else {
            // Generate random result if none provided
            const results = ["x2", "x7", "x3", "x6", "x4", "x5"]
            const randomResult = results[Math.floor(Math.random() * results.length)]
            console.log("🎲 Generated random result:", randomResult)
            setApiResult(randomResult)
          }
        } catch (error) {
          console.error("Failed to fetch result:", error)
          // Fallback to random result for demo
          const results = ["x2", "x7", "x3", "x6", "x4", "x5"]
          setApiResult(results[Math.floor(Math.random() * results.length)])
        } finally {
          setIsSpinning(false)
        }
      }, spinDuration)
    } catch (e: any) {
      console.error('Bet placement error:', e)
      const errorMessage = e?.message || "Unable to place bet."
      
      if (errorMessage.includes('forbidden') || errorMessage.includes('unauthorized')) {
        toast({ 
          title: "Authentication Error", 
          description: "Please log out and log back in to refresh your session.", 
          variant: "destructive" 
        })
      } else if (errorMessage.includes('token')) {
        toast({ 
          title: "Session Expired", 
          description: "Your session has expired. Please log in again.", 
          variant: "destructive" 
        })
      } else {
        toast({ title: "Bet failed", description: errorMessage, variant: "destructive" })
      }
    }
  }

  const getBetTypeInfo = (betType: string) => {
    switch (betType) {
      case "x2":
        return { label: "x2 Multiplier", payout: "2x", color: "from-red-500 to-red-600", bgColor: "bg-red-500" }
      case "x7":
        return { label: "x7 Multiplier", payout: "7x", color: "from-blue-500 to-blue-600", bgColor: "bg-blue-500" }
      case "x3":
        return { label: "x3 Multiplier", payout: "3x", color: "from-green-500 to-green-600", bgColor: "bg-green-500" }
      case "x6":
        return { label: "x6 Multiplier", payout: "6x", color: "from-yellow-500 to-yellow-600", bgColor: "bg-yellow-500" }
      case "x4":
        return { label: "x4 Multiplier", payout: "4x", color: "from-purple-500 to-purple-600", bgColor: "bg-purple-500" }
      case "x5":
        return { label: "x5 Multiplier", payout: "5x", color: "from-orange-500 to-orange-600", bgColor: "bg-orange-500" }
      default:
        return { label: "", payout: "", color: "", bgColor: "" }
    }
  }

  const getResultColor = (result: string) => {
    switch (result) {
      case "x2":
        return "text-red-400"
      case "x7":
        return "text-blue-400"
      case "x3":
        return "text-green-400"
      case "x6":
        return "text-yellow-400"
      case "x4":
        return "text-purple-400"
      case "x5":
        return "text-orange-400"
      default:
        return "text-white"
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
        const roundRes = await fetch("/api/games/spin_win/current-round")
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
        const res = await fetch("/api/games/spin_win/current-round")
        const data = await res.json()
        if (res.ok) {
          setCurrentRound(data)
          const endTs = data?.roundEndAt ? new Date(data.roundEndAt).getTime() : 0
          const now = Date.now()
          if (endTs && now >= endTs && data.status !== "settled") {
            const settle = await fetch("/api/games/spin_win/settle", { method: "POST" })
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
            <span className="text-white text-2xl font-black">⚡</span>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Loading Spin & Win...</h2>
          <p className="text-white/60">Preparing your game experience</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Spin & Win Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url(/images/backgrounds/spin&win.jpg)',
          filter: 'brightness(0.6) contrast(1.3)'
        }}
      ></div>
      
      {/* Overlay for better text readability */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/50 via-blue-900/40 to-indigo-900/50"></div>
      {/* Header */}
      <header className="border-b border-white/10 bg-black/40 backdrop-blur-md relative z-10">
        <div className="container mx-auto px-4 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4">
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
              className="text-white hover:bg-white/10 text-xs sm:text-sm"
            >
              <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              {isNavigating ? "Loading..." : "Back"}
            </Button>
            <div className="flex items-center gap-3">
              <div className="relative">
                {/* Modern gradient background with glow */}
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-500 via-pink-600 to-orange-500 rounded-xl shadow-lg shadow-purple-500/30 flex items-center justify-center relative overflow-hidden">
                  {/* Animated gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
                  
                  {/* Modern Spin & Win icon */}
                  <div className="relative z-10 flex items-center justify-center">
                    <div className="w-4 h-4 sm:w-6 sm:h-6 rounded-full bg-gradient-to-br from-white/20 to-transparent flex items-center justify-center">
                      <span className="text-white text-xs sm:text-sm font-black drop-shadow-lg">⚡</span>
                    </div>
                  </div>
                  
                  {/* Corner accent */}
                  <div className="absolute top-0 right-0 w-2 h-2 sm:w-3 sm:h-3 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-bl-lg"></div>
                </div>
                
                {/* Outer glow ring */}
                <div className="absolute inset-0 w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-500/30 via-pink-500/30 to-orange-500/30 rounded-xl blur-sm animate-pulse"></div>
              </div>
              
              <div>
                <h1 className="text-lg sm:text-2xl font-black text-white drop-shadow-lg">Spin & Win</h1>
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
        <div className="flex justify-center">
          {/* Main Game Area - Centered */}
          <div className="max-w-5xl w-full space-y-8">
            {/* Game Status */}
            <GameStatusBar 
              gameType="spinwin" 
              currentRound={currentRound || null}
              onRefresh={handleRefresh}
              onToggleView={handleToggleView}
              onPauseUpdates={handlePauseUpdates}
            />

            {/* Game Board */}
            <Card className="bg-gradient-to-br from-white/15 via-white/10 to-white/5 border-white/30 text-white backdrop-blur-xl shadow-2xl">
              <CardHeader className="text-center pb-8">
                <CardTitle className="text-center text-4xl font-black bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent mb-4">
                  🎰 SPIN & WIN 🎰
                </CardTitle>
                <p className="text-center text-white/90 text-lg font-semibold">Bet on any of the 6 multipliers and watch the wheel spin!</p>
                <div className="flex justify-center mt-4">
                  <div className="flex items-center gap-2 text-yellow-400">
                    <span className="animate-pulse">✨</span>
                    <span className="font-bold">LUCKY WHEEL</span>
                    <span className="animate-pulse">✨</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Modern Spinning Wheel */}
                <div className="flex flex-col items-center py-8 xs:py-12 sm:py-16 px-4 xs:px-6">
                  <div className="text-center mb-8">
                    <h3 className="text-2xl sm:text-3xl font-black text-white mb-4 text-center bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                      🎡 SPIN THE WHEEL 🎡
                    </h3>
                    <p className="text-lg text-white/90 mb-4 text-center font-semibold">
                      Win Amazing Multipliers!
                    </p>
                    <div className="flex justify-center gap-4 text-sm text-white/80">
                      <span className="bg-red-500/20 px-3 py-1 rounded-full border border-red-500/30">x2</span>
                      <span className="bg-blue-500/20 px-3 py-1 rounded-full border border-blue-500/30">x7</span>
                      <span className="bg-green-500/20 px-3 py-1 rounded-full border border-green-500/30">x3</span>
                      <span className="bg-yellow-500/20 px-3 py-1 rounded-full border border-yellow-500/30">x6</span>
                      <span className="bg-purple-500/20 px-3 py-1 rounded-full border border-purple-500/30">x4</span>
                      <span className="bg-orange-500/20 px-3 py-1 rounded-full border border-orange-500/30">x5</span>
                    </div>
                  </div>
                  <div className="flex justify-center">
                  <div className="relative">
                    {/* Enhanced outer glow ring */}
                    <div className="absolute inset-0 w-56 h-56 xs:w-64 xs:h-64 sm:w-80 sm:h-80 rounded-full bg-gradient-to-r from-purple-500/30 via-blue-500/30 to-pink-500/30 blur-xl animate-pulse"></div>
                    <div className="absolute inset-0 w-52 h-52 xs:w-60 xs:h-60 sm:w-76 sm:h-76 rounded-full bg-gradient-to-r from-yellow-500/20 via-orange-500/20 to-red-500/20 blur-lg animate-pulse" style={{ animationDelay: '1s' }}></div>
                    
                    {/* Wheel container with modern styling */}
                    <div className="relative">
                      {/* Wheel with enhanced styling */}
                      <div
                        className={`w-56 h-56 xs:w-64 xs:h-64 sm:w-80 sm:h-80 rounded-full border-4 border-white/50 relative overflow-hidden transition-transform duration-[8000ms] shadow-2xl ${
                          isSpinning 
                            ? "ease-out shadow-[0_0_80px_rgba(255,255,255,0.4)]" 
                            : "ease-in-out hover:shadow-[0_0_50px_rgba(255,255,255,0.3)]"
                        }`}
                        style={{ 
                          transform: `rotate(${wheelRotation}deg)`,
                          background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%)'
                        }}
                      >
                        {/* 6 Colored Wheel Segments - Solid Colors */}
                        {[
                          { multiplier: "x2", color: "bg-red-500", glow: "shadow-red-500/50" },
                          { multiplier: "x7", color: "bg-blue-500", glow: "shadow-blue-500/50" },
                          { multiplier: "x3", color: "bg-green-500", glow: "shadow-green-500/50" },
                          { multiplier: "x6", color: "bg-yellow-500", glow: "shadow-yellow-500/50" },
                          { multiplier: "x4", color: "bg-purple-500", glow: "shadow-purple-500/50" },
                          { multiplier: "x5", color: "bg-orange-500", glow: "shadow-orange-500/50" }
                        ].map((segment, i) => {
                          const angle = (360 / 6) * i

                          return (
                            <div
                              key={i}
                              className={`absolute w-full h-full ${segment.color} flex items-center justify-center ${segment.glow} transition-all duration-300`}
                              style={{
                                clipPath: `polygon(50% 50%, ${50 + 50 * Math.cos(((angle - 30) * Math.PI) / 180)}% ${50 + 50 * Math.sin(((angle - 30) * Math.PI) / 180)}%, ${50 + 50 * Math.cos(((angle + 30) * Math.PI) / 180)}% ${50 + 50 * Math.sin(((angle + 30) * Math.PI) / 180)}%)`,
                              }}
                            >
                              {/* Multiplier text with enhanced styling */}
                              <span 
                                className="text-white text-xl xs:text-2xl sm:text-3xl font-black drop-shadow-lg relative z-10 bg-black/40 px-4 py-3 rounded-2xl border-2 border-white/30 shadow-xl backdrop-blur-sm" 
                                style={{ transform: `rotate(${-wheelRotation}deg)` }}
                              >
                                {segment.multiplier}
                              </span>
                            </div>
                          )
                        })}

                        {/* Enhanced center circle with SPIN button */}
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-20 h-20 xs:w-24 xs:h-24 sm:w-28 sm:h-28 bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 rounded-full border-4 border-white/60 shadow-2xl flex items-center justify-center z-20">
                          <div className="w-16 h-16 xs:w-20 xs:h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-full flex items-center justify-center p-1 shadow-inner">
                            <div className="text-center">
                              <div className="text-white text-xl xs:text-2xl sm:text-3xl font-black drop-shadow-lg animate-pulse">
                                SPIN
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Inner ring for depth */}
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 xs:w-20 xs:h-20 sm:w-24 sm:h-24 rounded-full border-2 border-white/30 bg-gradient-to-br from-white/10 to-transparent"></div>
                      </div>

                      {/* Enhanced pointer with glow effect */}
                      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-4 z-30">
                        <div className="relative">
                          {/* Pointer glow */}
                          <div className="absolute inset-0 w-0 h-0 border-l-8 border-r-8 border-b-16 border-l-transparent border-r-transparent border-b-yellow-400/40 blur-md"></div>
                          {/* Main pointer */}
                          <div className="w-0 h-0 border-l-6 border-r-6 border-b-12 border-l-transparent border-r-transparent border-b-yellow-400 relative z-10 drop-shadow-xl"></div>
                          {/* Pointer highlight */}
                          <div className="absolute top-1 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-3 border-r-3 border-b-6 border-l-transparent border-r-transparent border-b-yellow-300"></div>
                          {/* Pointer sparkle */}
                          <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-yellow-300 rounded-full animate-ping"></div>
                        </div>
                      </div>

                      {/* Enhanced spinning animation overlay */}
                      {isSpinning && (
                        <>
                          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/15 to-transparent animate-spin"></div>
                          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-yellow-400/25 via-orange-500/25 to-red-500/25 animate-spin" style={{ animationDuration: '2s' }}></div>
                          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500/25 via-blue-500/25 to-cyan-500/25 animate-spin" style={{ animationDuration: '3s', animationDirection: 'reverse' }}></div>
                          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-green-400/20 via-yellow-500/20 to-orange-500/20 animate-spin" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }}></div>
                        </>
                      )}
                    </div>

                    {/* Enhanced outer decorative rings */}
                    <div className="absolute inset-0 w-56 h-56 xs:w-64 xs:h-64 sm:w-80 sm:h-80 rounded-full border-2 border-white/30 animate-pulse"></div>
                    <div className="absolute inset-2 w-52 h-52 xs:w-60 xs:h-60 sm:w-76 sm:h-76 rounded-full border border-white/20 animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                    <div className="absolute inset-4 w-48 h-48 xs:w-56 xs:h-56 sm:w-72 sm:h-72 rounded-full border border-white/10 animate-pulse" style={{ animationDelay: '1s' }}></div>
                  </div>
                </div>
                </div>

                {/* 6 Multiplier Betting Options */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 sm:gap-8 px-4 max-w-5xl mx-auto">
                  {[
                    { betType: "x2", label: "x2 Multiplier", gradient: "from-red-500 via-red-600 to-red-700", glow: "shadow-red-500/30", payout: "2x" },
                    { betType: "x7", label: "x7 Multiplier", gradient: "from-blue-500 via-blue-600 to-blue-700", glow: "shadow-blue-500/30", payout: "7x" },
                    { betType: "x3", label: "x3 Multiplier", gradient: "from-green-500 via-green-600 to-green-700", glow: "shadow-green-500/30", payout: "3x" },
                    { betType: "x6", label: "x6 Multiplier", gradient: "from-yellow-500 via-yellow-600 to-yellow-700", glow: "shadow-yellow-500/30", payout: "6x" },
                    { betType: "x4", label: "x4 Multiplier", gradient: "from-purple-500 via-purple-600 to-purple-700", glow: "shadow-purple-500/30", payout: "4x" },
                    { betType: "x5", label: "x5 Multiplier", gradient: "from-orange-500 via-orange-600 to-orange-700", glow: "shadow-orange-500/30", payout: "5x" }
                  ].map((betOption) => {
                    const isSelected = selectedBet === betOption.betType
                    const isDisabled = !canBet

                    return (
                      <Card
                        key={betOption.betType}
                        className={`cursor-pointer transition-all duration-300 transform hover:scale-110 ${
                          isSelected 
                            ? "ring-4 ring-yellow-400 bg-gradient-to-br from-white/25 to-white/10 shadow-2xl shadow-yellow-400/30" 
                            : "bg-gradient-to-br from-white/10 to-white/5 hover:bg-gradient-to-br hover:from-white/20 hover:to-white/10 hover:shadow-xl"
                        } ${isDisabled ? "opacity-50 cursor-not-allowed" : ""} border-white/30 backdrop-blur-md rounded-2xl`}
                        onClick={() => !isDisabled && handlePlaceBet(betOption.betType)}
                      >
                        <CardContent className="p-4 sm:p-5 text-center relative overflow-hidden">
                          {/* Background glow effect */}
                          <div className={`absolute inset-0 bg-gradient-to-br ${betOption.gradient} opacity-10 rounded-lg ${isSelected ? 'animate-pulse' : ''}`}></div>
                          
                          {/* Modern multiplier circle */}
                          <div
                            className={`w-16 h-16 sm:w-18 sm:h-18 mx-auto mb-4 sm:mb-5 rounded-full bg-gradient-to-br ${betOption.gradient} flex items-center justify-center ${betOption.glow} shadow-xl relative z-10 transform hover:scale-110 transition-transform duration-200`}
                          >
                            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-white/30 to-transparent flex items-center justify-center">
                              <span className="text-white text-lg sm:text-xl font-black drop-shadow-lg">{betOption.betType}</span>
                            </div>
                          </div>
                          
                          <h3 className="text-base sm:text-lg font-bold text-white mb-3 relative z-10">{betOption.label}</h3>
                          
                          <Badge className={`bg-gradient-to-r ${betOption.gradient} text-white text-sm font-bold px-4 py-2 relative z-10 shadow-xl rounded-full`}>
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

                {/* Enhanced Bet Amount Section */}
                <div className="max-w-lg mx-auto px-4 flex flex-col items-center">
                  <div className="text-center mb-6">
                    <label className="block text-white text-lg font-bold mb-4 text-center bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                      🎯 BET AMOUNT 🎯
                    </label>
                    <p className="text-white/80 text-sm mb-4">Minimum: 5 points | Maximum: 1000 points</p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative">
                      <Input
                        type="number"
                        min="5"
                        max="1000"
                        value={betAmount}
                        onChange={(e) => setBetAmount(Number(e.target.value))}
                        className="bg-white/15 border-white/40 text-white placeholder-white/60 backdrop-blur-md focus:ring-4 focus:ring-yellow-400/50 focus:border-yellow-400/50 transition-all duration-300 text-center text-lg font-bold rounded-xl"
                        disabled={!canBet}
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-md"></div>
                    </div>
                    <div className="flex gap-3 justify-center sm:justify-start">
                      {[10, 25, 50, 100, 250, 500].map((amount) => (
                        <Button
                          key={amount}
                          variant="outline"
                          size="sm"
                          onClick={() => setBetAmount(amount)}
                          disabled={!canBet}
                          className="border-white/40 text-white hover:bg-gradient-to-r hover:from-yellow-400/20 hover:to-orange-500/20 hover:border-yellow-400/50 hover:shadow-xl hover:shadow-yellow-400/30 text-sm sm:text-base font-bold transition-all duration-300 transform hover:scale-110 backdrop-blur-md rounded-xl px-4 py-2"
                        >
                          {amount}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Enhanced Result Display */}
                {shownSpinResult && (
                  <div className="text-center py-8">
                    <div className="relative">
                      {/* Enhanced result glow effect */}
                      <div className="absolute inset-0 w-32 h-32 rounded-full bg-gradient-to-r from-purple-500/30 via-blue-500/30 to-pink-500/30 blur-xl animate-pulse"></div>
                      <div className="absolute inset-0 w-28 h-28 rounded-full bg-gradient-to-r from-yellow-500/20 via-orange-500/20 to-red-500/20 blur-lg animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                      
                      {/* Casino celebration elements */}
                      <div className="absolute -top-2 -left-2 text-2xl animate-bounce">🎉</div>
                      <div className="absolute -top-2 -right-2 text-2xl animate-bounce" style={{ animationDelay: '0.3s' }}>🎊</div>
                      <div className="absolute -bottom-2 -left-2 text-2xl animate-bounce" style={{ animationDelay: '0.6s' }}>💎</div>
                      <div className="absolute -bottom-2 -right-2 text-2xl animate-bounce" style={{ animationDelay: '0.9s' }}>💰</div>
                      
                      {/* Result circle with enhanced styling */}
                      <div
                        className={`relative inline-flex items-center justify-center w-28 h-28 rounded-full ${
                          shownSpinResult === "x2" ? "bg-gradient-to-br from-red-500 to-red-700" :
                          shownSpinResult === "x3" ? "bg-gradient-to-br from-green-500 to-green-700" :
                          shownSpinResult === "x4" ? "bg-gradient-to-br from-purple-500 to-purple-700" :
                          shownSpinResult === "x5" ? "bg-gradient-to-br from-orange-500 to-orange-700" :
                          shownSpinResult === "x6" ? "bg-gradient-to-br from-yellow-500 to-yellow-700" :
                          shownSpinResult === "x7" ? "bg-gradient-to-br from-blue-500 to-blue-700" :
                          "bg-gradient-to-br from-gray-500 to-gray-700"
                        } text-white text-3xl font-black mb-4 shadow-2xl border-4 border-yellow-400/50 backdrop-blur-sm casino-glow`}
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-full"></div>
                        <span className="relative z-10 drop-shadow-lg animate-pulse">{shownSpinResult.toUpperCase()}</span>
                      </div>
                    </div>
                    
                    <div className="text-white">
                      <p className={`text-2xl font-bold mb-3 ${getResultColor(shownSpinResult)} drop-shadow-lg animate-pulse`}>
                        🎉 Winning Result: {shownSpinResult} 🎉
                      </p>
                      <div className="text-white/80 text-base">
                        <p className="mb-2">✨ Congratulations to the winners! ✨</p>
                        <p className="text-yellow-400 font-bold text-lg">🎯 Multiplier: {shownSpinResult}</p>
                        <p className="text-green-400 font-semibold mt-2">💰 Payout: {shownSpinResult} times your bet!</p>
                      </div>
                      
                      {/* Show bet result if user had a bet */}
                      {selectedBet && (
                        <div className="mt-6 p-4 bg-white/10 rounded-lg border border-yellow-400/20 backdrop-blur-sm">
                          <p className="text-lg font-semibold mb-3">🎯 Your Bet Result: 🎯</p>
                          {(() => {
                            const isWin = selectedBet === shownSpinResult
                            const payout = isWin ? betAmount * parseInt(shownSpinResult.replace('x', '')) : 0
                            const profitLoss = payout - betAmount
                            
                            return (
                              <div className="flex items-center justify-between p-3 bg-white/5 rounded">
                                <span>🎰 Your bet on {selectedBet}:</span>
                                <span className={`font-bold text-lg ${isWin ? 'text-green-400' : 'text-red-400'}`}>
                                  {isWin ? '🎉 +' : '💔 '}{profitLoss.toLocaleString()} points
                                </span>
                              </div>
                            )
                          })()}
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
