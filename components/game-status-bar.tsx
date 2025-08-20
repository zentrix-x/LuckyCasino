"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { useEffect, useState, useRef } from "react"
import React from "react"
import { Eye, Pause, RefreshCw } from "lucide-react"

interface GameStatusBarProps {
  gameType: string
  currentRound: any | null
  onRefresh?: () => void
  onToggleView?: () => void
  onPauseUpdates?: () => void
}

export const GameStatusBar = React.memo(function GameStatusBar({ 
  gameType, 
  currentRound, 
  onRefresh, 
  onToggleView, 
  onPauseUpdates 
}: GameStatusBarProps) {
  const [countdown, setCountdown] = useState(0)
  const [isPulsing, setIsPulsing] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [isDetailedView, setIsDetailedView] = useState(false)
  const roundEndTimeRef = useRef<number | null>(null)

  // Calculate countdown based on current round data
  useEffect(() => {
    if (!currentRound?.roundEndAt) return
    
    const roundEndTime = new Date(currentRound.roundEndAt).getTime()
    
    // Always update the ref when roundEndAt changes
    roundEndTimeRef.current = roundEndTime

    const updateCountdown = () => {
      const now = new Date().getTime()
      const timeLeft = Math.max(0, Math.floor((roundEndTime - now) / 1000))
      

      
      setCountdown(timeLeft)
      
      // Add pulsing animation for low countdown
      if (timeLeft <= 10 && timeLeft > 0) {
        setIsPulsing(true)
      } else {
        setIsPulsing(false)
      }
    }

    // Update immediately
    updateCountdown()
    
    // Update every second
    const interval = setInterval(updateCountdown, 1000)
    
    return () => {
      clearInterval(interval)
    }
  }, [currentRound?.roundEndAt]) // Re-run when roundEndAt changes

  if (!currentRound) return null

  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh()
    }
  }

  const handleToggleView = () => {
    setIsDetailedView(!isDetailedView)
    if (onToggleView) {
      onToggleView()
    }
  }

  const handlePauseUpdates = () => {
    setIsPaused(!isPaused)
    if (onPauseUpdates) {
      onPauseUpdates()
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "betting":
        return "bg-green-500"
      case "playing":
        return "bg-yellow-500"
      case "finished":
        return "bg-blue-500"
      default:
        return "bg-gray-500"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "betting":
        return "Betting Open"
      case "playing":
        return "Drawing Result"
      case "finished":
        return "Round Complete"
      default:
        return "Waiting"
    }
  }

  return (
        <Card className="bg-gradient-to-r from-purple-900/80 to-blue-900/80 border-white/20 shadow-lg backdrop-blur-sm relative overflow-hidden">
      {/* Subtle animated background effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-blue-500/10 animate-pulse opacity-50"></div>
      <div className="relative z-10">
        <CardContent className="p-2 xs:p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 xs:gap-3 sm:gap-4">
            {/* Left Section - Status and Round */}
            <div className="flex flex-col sm:flex-row items-center gap-1 xs:gap-2 sm:gap-3 w-full sm:w-auto">
              <Badge className={`${getStatusColor(currentRound.status)} text-white text-[10px] xs:text-xs sm:text-sm px-2 xs:px-3 py-1 font-semibold shadow-md transition-all duration-300 ${
                currentRound.status === 'betting' ? 'animate-pulse' : ''
              }`}>
                {getStatusText(currentRound.status)}
              </Badge>
              <div className="text-center sm:text-left">
                <div className="text-white text-[10px] xs:text-xs sm:text-sm opacity-90">Round</div>
                <div className="text-white text-xs xs:text-sm sm:text-base font-bold">#{currentRound._id?.slice(-4) || '0000'}</div>
              </div>
            </div>

            {/* Right Section - Bets, Countdown, and Controls */}
            <div className="flex items-center gap-2 xs:gap-3 sm:gap-4 w-full sm:w-auto justify-center sm:justify-end">
              <div className="text-center sm:text-right">
                <div className="text-white text-[10px] xs:text-xs sm:text-sm opacity-70">Total Bets</div>
                <div className="text-white text-xs xs:text-sm sm:text-base font-bold">{(currentRound.totalBets || 0).toLocaleString()}</div>
              </div>

              <div className="text-center">
                <div className={`text-white text-base xs:text-lg sm:text-2xl font-bold bg-white/10 rounded-lg px-2 xs:px-3 py-1 min-w-[2.5rem] xs:min-w-[3rem] sm:min-w-[4rem] transition-all duration-300 ${
                  isPulsing ? 'animate-pulse bg-red-500/20 ring-2 ring-red-400' : ''
                }`}>
                  {countdown > 0 ? countdown : "0"}
                </div>
                <div className="text-white text-[10px] xs:text-xs sm:text-sm opacity-70 mt-1">sec</div>
              </div>

              {/* Control Buttons */}
              <div className="flex items-center gap-1 xs:gap-2">
                <button
                  onClick={handleToggleView}
                  className={`p-1.5 xs:p-2 rounded-lg border border-white/20 transition-all duration-200 hover:bg-white/10 hover:border-white/40 ${
                    isDetailedView ? 'bg-white/20 border-white/40' : 'bg-transparent'
                  }`}
                  title={isDetailedView ? "Switch to compact view" : "Switch to detailed view"}
                >
                  <Eye className="w-3 h-3 xs:w-4 xs:h-4 text-white" />
                </button>
                
                <button
                  onClick={handlePauseUpdates}
                  className={`p-1.5 xs:p-2 rounded-lg border border-white/20 transition-all duration-200 hover:bg-white/10 hover:border-white/40 ${
                    isPaused ? 'bg-white/20 border-white/40' : 'bg-transparent'
                  }`}
                  title={isPaused ? "Resume updates" : "Pause updates"}
                >
                  <Pause className="w-3 h-3 xs:w-4 xs:h-4 text-white" />
                </button>
                
                <button
                  onClick={handleRefresh}
                  className="p-1.5 xs:p-2 rounded-lg border border-white/20 bg-transparent transition-all duration-200 hover:bg-white/10 hover:border-white/40"
                  title="Refresh game data"
                >
                  <RefreshCw className="w-3 h-3 xs:w-4 xs:h-4 text-white" />
                </button>
              </div>
            </div>
          </div>

          {/* Result Section */}
          {currentRound.status === "finished" && currentRound.result !== undefined && (
            <div className="mt-2 xs:mt-3 pt-2 xs:pt-3 border-t border-white/20">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-1 xs:gap-2">
                <span className="text-white/70 text-[10px] xs:text-xs sm:text-sm">Result:</span>
                <span className="text-white font-bold text-xs xs:text-sm sm:text-base bg-white/10 rounded px-2 xs:px-3 py-1">
                  {gameType === "7up7down" && `Number: ${currentRound.result}`}
                  {gameType === "spinwin" && `Color: ${currentRound.result}`}
                  {gameType === "lottery_0_99" && `Number: ${currentRound.result}`}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </div>
    </Card>
  )
})
