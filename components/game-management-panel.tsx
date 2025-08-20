"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Pause, RotateCcw, Eye } from "lucide-react"
import { useEffect, useState } from "react"

export function GameManagementPanel() {
  const [currentGames, setCurrentGames] = useState<any[]>([])
  const [serverHistory, setServerHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch current game status
  useEffect(() => {
    const fetchCurrentGames = async () => {
      try {
        const types = ["seven_up_down", "spin_win", "lottery_0_99"]
        const responses = await Promise.all(types.map((t) => fetch(`/api/games/${t}/current-round`)))
        const games = await Promise.all(responses.map((r) => r.json()))
        
        const currentGamesData = games.map((game, index) => {
          const apiType = types[index]
          const uiType = apiType === "seven_up_down" ? "7up7down" : apiType === "spin_win" ? "spinwin" : "lottery"
          return {
            id: uiType,
            name: uiType === "7up7down" ? "7Up 7Down" : uiType === "spinwin" ? "Spin & Win" : "Lottery",
            icon: uiType === "7up7down" ? "🎯" : uiType === "spinwin" ? "🎡" : "🎫",
            status: game.status || "waiting",
            roundId: game._id?.slice(-4) || "----",
            totalBets: game.totalBets || 0,
            roundEndAt: game.roundEndAt,
            apiType
          }
        })
        
        setCurrentGames(currentGamesData)
        setLoading(false)
      } catch (error) {
        console.error('Failed to fetch current games:', error)
        setLoading(false)
      }
    }

    fetchCurrentGames()
    
    // Refresh every 5 seconds
    const interval = setInterval(fetchCurrentGames, 5000)
    return () => clearInterval(interval)
  }, [])

  // Fetch game history
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const types = ["seven_up_down", "spin_win", "lottery_0_99"]
        const resps = await Promise.all(types.map((t) => fetch(`/api/games/${t}/history`)))
        const lists = await Promise.all(resps.map((r) => r.json()))
        const mapped: any[] = []
        lists.forEach((arr: any[], idx: number) => {
          const apiType = types[idx]
          const uiType = apiType === "seven_up_down" ? "7up7down" : apiType === "spin_win" ? "spinwin" : "lottery"
          arr.forEach((round: any) => {
            mapped.push({
              id: round._id,
              gameType: uiType,
              result: round.winningOutcome,
              totalBets: round.totalBets || 0,
              totalPayout: round.totalPayout || 0,
              timestamp: round.roundEndAt || round.updatedAt || round.createdAt,
            })
          })
        })
        mapped.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        if (mounted) setServerHistory(mapped)
      } catch {
        // ignore
      }
    })()
    return () => {
      mounted = false
    }
  }, [])



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

  const getCountdown = (roundEndAt: string) => {
    if (!roundEndAt) return "0s"
    const now = new Date().getTime()
    const endTime = new Date(roundEndAt).getTime()
    const timeLeft = Math.max(0, Math.floor((endTime - now) / 1000))
    return `${timeLeft}s`
  }

  return (
    <div className="space-y-6">
      {/* Live Games Status */}
      <Card className="bg-white/10 border-white/20 text-white">
        <CardHeader>
          <CardTitle>Live Games Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-white/20">
                  <TableHead className="text-white/70">Game</TableHead>
                  <TableHead className="text-white/70">Status</TableHead>
                  <TableHead className="text-white/70">Round</TableHead>
                  <TableHead className="text-white/70">Total Bets</TableHead>
                  <TableHead className="text-white/70">Countdown</TableHead>
                  <TableHead className="text-white/70">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow className="border-white/20">
                    <TableCell colSpan={6} className="text-center text-white/60 py-8">
                      Loading game status...
                    </TableCell>
                  </TableRow>
                ) : (
                  currentGames.map((game) => (
                    <TableRow key={game.id} className="border-white/20">
                      <TableCell className="font-medium text-white">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{game.icon}</span>
                          {game.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${getStatusColor(game.status)} text-white`}>
                          {getStatusText(game.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-white">#{game.roundId}</TableCell>
                      <TableCell className="text-white">{game.totalBets.toLocaleString()}</TableCell>
                      <TableCell className="text-white">
                        <span className="font-mono text-lg">{getCountdown(game.roundEndAt)}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-white/20 text-white hover:bg-white/10 bg-transparent"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-white/20 text-white hover:bg-white/10 bg-transparent"
                          >
                            <Pause className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-white/20 text-white hover:bg-white/10 bg-transparent"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Recent Game Results */}
      <Card className="bg-white/10 border-white/20 text-white">
        <CardHeader>
          <CardTitle>Recent Game Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-white/20">
                  <TableHead className="text-white/70">Game</TableHead>
                  <TableHead className="text-white/70">Result</TableHead>
                  <TableHead className="text-white/70">Total Bets</TableHead>
                  <TableHead className="text-white/70">Total Payout</TableHead>
                  <TableHead className="text-white/70">House Profit</TableHead>
                  <TableHead className="text-white/70">Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {serverHistory.slice(0, 10).map((game, index) => (
                  <TableRow key={`${game.id}-${index}`} className="border-white/20">
                    <TableCell className="font-medium text-white">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">
                          {game.gameType === "7up7down" && "🎯"}
                          {game.gameType === "spinwin" && "🎡"}
                          {game.gameType === "lottery" && "🎫"}
                        </span>
                        {game.gameType === "7up7down" && "7Up 7Down"}
                        {game.gameType === "spinwin" && "Spin & Win"}
                        {game.gameType === "lottery" && "Lottery"}
                      </div>
                    </TableCell>
                    <TableCell className="text-white font-mono">
                      {game.gameType === "spinwin" && (
                        <Badge
                          className={
                            game.result === "red"
                              ? "bg-red-500"
                              : game.result === "black"
                                ? "bg-gray-800"
                                : "bg-green-500"
                          }
                        >
                          {game.result}
                        </Badge>
                      )}
                      {game.gameType !== "spinwin" && <span className="font-bold">{game.result}</span>}
                    </TableCell>
                    <TableCell className="text-white">{game.totalBets.toLocaleString()}</TableCell>
                    <TableCell className="text-white">{game.totalPayout.toLocaleString()}</TableCell>
                    <TableCell className="text-green-400 font-semibold">
                      +{(game.totalBets - game.totalPayout).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-white/70">{new Date(game.timestamp).toLocaleTimeString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
