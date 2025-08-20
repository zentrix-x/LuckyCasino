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
  const shownSpinResult = (apiResult as string | null) ?? (currentRound?.status === "settled" ? (currentRound.winningOutcome as string | undefined) : undefined)

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

  // Auto-settle rounds when they're ready
  useEffect(() => {
    if (currentRound?.status === "betting" && new Date() > new Date(currentRound.roundEndAt)) {
      const settleRound = async () => {
        try {
          await fetch("/api/games/spin_win/settle", { method: "POST" })
          // Refresh current round after settling
          setTimeout(async () => {
            const res = await fetch("/api/games/spin_win/current-round")
            const data = await res.json()
            if (res.ok) setCurrentRound(data)
          }, 1000)
        } catch (error) {
          console.error("Failed to settle round:", error)
        }
      }
      settleRound()
    }
  }, [currentRound])

  // Handle wheel spinning animation
  useEffect(() => {
    if (currentRound?.status === "settled" && currentRound.winningOutcome) {
      setIsSpinning(true)
      // Spin for the duration of the playing phase
      const spinDuration = 8000 // 8 seconds
      const finalRotation = wheelRotation + 1800 + Math.random() * 360 // Multiple spins + random final position
      setWheelRotation(finalRotation)

      setTimeout(() => {
        setIsSpinning(false)
      }, spinDuration)
    }
  }, [currentRound?.status, currentRound?.winningOutcome])

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
      setSelectedBet(betChoice)
      updatePoints(user.points - betAmount)
      toast({ title: "Bet placed!", description: `${betAmount} points on ${betChoice}` })
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
      case "red":
        return "text-red-400"
      case "black":
        return "text-gray-300"
      case "green":
        return "text-green-400"
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
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-sm">
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
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Game Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Game Status */}
            <GameStatusBar 
              gameType="spinwin" 
              currentRound={currentRound || null}
              onRefresh={handleRefresh}
              onToggleView={handleToggleView}
              onPauseUpdates={handlePauseUpdates}
            />

            {/* Game Board */}
            <Card className="bg-white/10 border-white/20 text-white">
              <CardHeader>
                <CardTitle className="text-center text-2xl">Spin the Wheel</CardTitle>
                <p className="text-center text-white/70">Bet on any of the 6 multipliers and watch the wheel spin!</p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Modern Spinning Wheel */}
                <div className="flex justify-center py-6 xs:py-8 sm:py-12 px-4 xs:px-6">
                  <div className="relative">
                    {/* Outer glow ring */}
                    <div className="absolute inset-0 w-56 h-56 xs:w-64 xs:h-64 sm:w-80 sm:h-80 rounded-full bg-gradient-to-r from-purple-500/20 via-blue-500/20 to-pink-500/20 blur-xl animate-pulse"></div>
                    
                    {/* Wheel container with modern styling */}
                    <div className="relative">
                      {/* Wheel with enhanced styling */}
                      <div
                        className={`w-56 h-56 xs:w-64 xs:h-64 sm:w-80 sm:h-80 rounded-full border-4 border-white/30 relative overflow-hidden transition-transform duration-[8000ms] shadow-2xl ${
                          isSpinning 
                            ? "ease-out shadow-[0_0_50px_rgba(255,255,255,0.3)]" 
                            : "ease-in-out hover:shadow-[0_0_30px_rgba(255,255,255,0.2)]"
                        }`}
                        style={{ 
                          transform: `rotate(${wheelRotation}deg)`,
                          background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)'
                        }}
                      >
                        {/* 6 Multiplier Wheel Segments - Randomly Arranged */}
                        {[
                          { multiplier: "x2", color: "bg-red-600", glow: "shadow-red-500/50" },
                          { multiplier: "x7", color: "bg-blue-600", glow: "shadow-blue-500/50" },
                          { multiplier: "x3", color: "bg-green-600", glow: "shadow-green-500/50" },
                          { multiplier: "x6", color: "bg-yellow-600", glow: "shadow-yellow-500/50" },
                          { multiplier: "x4", color: "bg-purple-600", glow: "shadow-purple-500/50" },
                          { multiplier: "x5", color: "bg-orange-600", glow: "shadow-orange-500/50" }
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
                              {/* Segment inner glow */}
                              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-full"></div>
                              
                              {/* Multiplier text with enhanced styling */}
                              <span 
                                className="text-white text-xs xs:text-sm sm:text-lg font-black drop-shadow-lg transform -rotate-90 relative z-10" 
                                style={{ transform: `rotate(${-wheelRotation}deg)` }}
                              >
                                {segment.multiplier}
                              </span>
                            </div>
                          )
                        })}

                        {/* Enhanced center circle */}
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 xs:w-10 xs:h-10 sm:w-14 sm:h-14 bg-gradient-to-br from-white via-gray-100 to-gray-200 rounded-full border-4 border-white/50 shadow-lg flex items-center justify-center z-20">
                          <div className="w-6 h-6 xs:w-8 xs:h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-gray-800 to-gray-900 rounded-full flex items-center justify-center">
                            <span className="text-white text-[8px] xs:text-xs sm:text-sm font-black tracking-wider">SPIN</span>
                          </div>
                        </div>

                        {/* Inner ring for depth */}
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 xs:w-20 xs:h-20 sm:w-24 sm:h-24 rounded-full border-2 border-white/30 bg-gradient-to-br from-white/10 to-transparent"></div>
                      </div>

                      {/* Modern pointer with glow effect */}
                      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-3 z-30">
                        <div className="relative">
                          {/* Pointer glow */}
                          <div className="absolute inset-0 w-0 h-0 border-l-6 border-r-6 border-b-12 border-l-transparent border-r-transparent border-b-white/30 blur-sm"></div>
                          {/* Main pointer */}
                          <div className="w-0 h-0 border-l-4 border-r-4 border-b-8 border-l-transparent border-r-transparent border-b-white relative z-10 drop-shadow-lg"></div>
                          {/* Pointer highlight */}
                          <div className="absolute top-1 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-b-4 border-l-transparent border-r-transparent border-b-white/60"></div>
                        </div>
                      </div>

                      {/* Spinning animation overlay */}
                      {isSpinning && (
                        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/5 to-transparent animate-spin"></div>
                      )}
                    </div>

                    {/* Outer decorative rings */}
                    <div className="absolute inset-0 w-56 h-56 xs:w-64 xs:h-64 sm:w-80 sm:h-80 rounded-full border border-white/20 animate-pulse"></div>
                    <div className="absolute inset-2 w-52 h-52 xs:w-60 xs:h-60 sm:w-76 sm:h-76 rounded-full border border-white/10 animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                  </div>
                </div>

                {/* 6 Multiplier Betting Options */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6 px-4">
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
                        className={`cursor-pointer transition-all duration-300 transform hover:scale-105 ${
                          isSelected 
                            ? "ring-2 ring-yellow-400 bg-white/20 shadow-lg shadow-yellow-400/20" 
                            : "bg-white/5 hover:bg-white/10 hover:shadow-lg"
                        } ${isDisabled ? "opacity-50 cursor-not-allowed" : ""} border-white/20 backdrop-blur-sm`}
                        onClick={() => !isDisabled && handlePlaceBet(betOption.betType)}
                      >
                        <CardContent className="p-4 sm:p-5 text-center relative overflow-hidden">
                          {/* Background glow effect */}
                          <div className={`absolute inset-0 bg-gradient-to-br ${betOption.gradient} opacity-10 rounded-lg ${isSelected ? 'animate-pulse' : ''}`}></div>
                          
                          {/* Modern multiplier circle */}
                          <div
                            className={`w-12 h-12 sm:w-14 sm:h-14 mx-auto mb-3 sm:mb-4 rounded-full bg-gradient-to-br ${betOption.gradient} flex items-center justify-center ${betOption.glow} shadow-lg relative z-10`}
                          >
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-white/20 to-transparent flex items-center justify-center">
                              <span className="text-white text-sm sm:text-base font-black drop-shadow-lg">{betOption.betType}</span>
                            </div>
                          </div>
                          
                          <h3 className="text-sm sm:text-base font-bold text-white mb-2 relative z-10">{betOption.label}</h3>
                          
                          <Badge className={`bg-gradient-to-r ${betOption.gradient} text-white text-xs font-bold px-3 py-1 relative z-10 shadow-lg`}>
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
                <div className="max-w-md mx-auto px-4">
                  <label className="block text-white text-sm font-bold mb-3 text-center">🎯 Bet Amount (min: 5 points)</label>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative">
                      <Input
                        type="number"
                        min="5"

                        value={betAmount}
                        onChange={(e) => setBetAmount(Number(e.target.value))}
                        className="bg-white/10 border-white/30 text-white placeholder-white/50 backdrop-blur-sm focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400/50 transition-all duration-300"
                        disabled={!canBet}
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-md"></div>
                    </div>
                    <div className="flex gap-2 justify-center sm:justify-start">
                      {[10, 25, 50, 100].map((amount) => (
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

                {/* Modern Result Display */}
                {shownSpinResult && (
                  <div className="text-center py-8">
                    <div className="relative">
                      {/* Result glow effect */}
                      <div className="absolute inset-0 w-24 h-24 rounded-full bg-gradient-to-r from-purple-500/20 via-blue-500/20 to-pink-500/20 blur-xl animate-pulse"></div>
                      
                      {/* Result circle with enhanced styling */}
                      <div
                        className={`relative inline-flex items-center justify-center w-24 h-24 rounded-full ${
                          shownSpinResult === "x2" ? "bg-red-600" :
                          shownSpinResult === "x3" ? "bg-green-600" :
                          shownSpinResult === "x4" ? "bg-purple-600" :
                          shownSpinResult === "x5" ? "bg-orange-600" :
                          shownSpinResult === "x6" ? "bg-yellow-600" :
                          shownSpinResult === "x7" ? "bg-blue-600" :
                          "bg-gray-600"
                        } text-white text-2xl font-black mb-4 shadow-2xl border-4 border-white/30 backdrop-blur-sm`}
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-full"></div>
                        <span className="relative z-10 drop-shadow-lg">{shownSpinResult.toUpperCase()}</span>
                      </div>
                    </div>
                    
                    <div className="text-white">
                      <p className={`text-xl font-bold mb-2 ${getResultColor(shownSpinResult)} drop-shadow-lg`}>
                        🎉 Result: {shownSpinResult}
                      </p>
                      <div className="text-white/70 text-sm">
                        <p>✨ Congratulations to the winners!</p>
                        <p className="text-yellow-400 font-bold">🎯 Multiplier: {shownSpinResult}</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Game History */}
            <GameHistoryPanel gameType="spin_win" />

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
                    {recentUserBets.map((bet) => (
                      <div key={bet.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`w-4 h-4 rounded-full ${getBetTypeInfo(bet.betChoice).bgColor}`} />
                          <div>
                            <p className="text-sm font-medium">{getBetTypeInfo(bet.betChoice).label}</p>
                            <p className="text-xs text-white/60">{bet.betAmount} points</p>
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
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Game Rules */}
            <Card className="bg-white/10 border-white/20 text-white">
              <CardHeader>
                <CardTitle className="text-lg">How to Play</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-red-500" />
                  <div>
                    <p className="font-semibold text-red-400">Red</p>
                    <p className="text-white/70">Pays 1.9x your bet</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-gray-800" />
                  <div>
                    <p className="font-semibold text-gray-300">Black</p>
                    <p className="text-white/70">Pays 1.9x your bet</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-green-500" />
                  <div>
                    <p className="font-semibold text-green-400">Green</p>
                    <p className="text-white/70">Pays 13.5x your bet</p>
                  </div>
                </div>
                <div className="pt-2 border-t border-white/20">
                  <p className="text-xs text-white/60">
                    The wheel has 6 multiplier blocks: x2, x7, x3, x6, x4, x5. Place your bet before the countdown ends!
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
