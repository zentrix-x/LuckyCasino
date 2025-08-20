"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useEffect, useState } from "react"
import React from "react"

interface GameHistoryPanelProps {
  gameType: string
}

export const GameHistoryPanel = React.memo(function GameHistoryPanel({ gameType }: GameHistoryPanelProps) {
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch game history from backend
  useEffect(() => {
    const fetchResults = async () => {
      try {
        const response = await fetch(`/api/games/${gameType}/history`)
        if (response.ok) {
          const data = await response.json()
          setResults(data.slice(0, 10)) // Show last 10 results
        }
      } catch (error) {
        console.error('Failed to fetch game history:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchResults()
    
    // Refresh every 60 seconds to improve performance
    const interval = setInterval(fetchResults, 60000)
    return () => clearInterval(interval)
  }, [gameType])

  const formatResult = (result: any, gameType: string) => {
    switch (gameType) {
      case "seven_up_down":
        return `${result}`
      case "spin_win":
        return result // Already formatted as x2, x7, etc.
      case "lottery_0_99":
        return `${result}`
      default:
        return result
    }
  }

  const getResultColor = (result: any, gameType: string) => {
    switch (gameType) {
      case "seven_up_down":
        if (result === 7) return "bg-yellow-500"
        return result > 7 ? "bg-red-500" : "bg-blue-500"
      case "spin_win":
        // Handle the new 6-block system
        if (result === "x2") return "bg-red-500"
        if (result === "x7") return "bg-blue-500"
        if (result === "x3") return "bg-green-500"
        if (result === "x6") return "bg-yellow-500"
        if (result === "x4") return "bg-purple-500"
        if (result === "x5") return "bg-orange-500"
        return "bg-gray-500"
      case "lottery_0_99":
        return "bg-purple-500"
      default:
        return "bg-gray-500"
    }
  }

  return (
    <Card className="bg-white/10 border-white/20 text-white">
      <CardHeader>
        <CardTitle className="text-lg">Recent Results</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {loading ? (
            <p className="text-white/60 text-sm">Loading results...</p>
          ) : results.length === 0 ? (
            <p className="text-white/60 text-sm">No results yet</p>
          ) : (
            results.map((game, index) => (
              <Badge key={`${game._id}-${index}`} className={`${getResultColor(game.winningOutcome, gameType)} text-white`}>
                {formatResult(game.winningOutcome, gameType)}
              </Badge>
            ))
          )}
        </div>

        {results.length > 0 && (
          <div className="mt-4 pt-4 border-t border-white/20">
            <div className="text-xs text-white/60">
              Last result: {new Date(results[0]?.roundEndAt).toLocaleTimeString()}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
})
