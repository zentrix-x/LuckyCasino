"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/hooks/use-auth"
import { useGameEngine } from "@/hooks/use-game-engine"
import { useToast } from "@/hooks/use-toast"
import { Play, RotateCcw, Volume2, VolumeX, Settings, Zap, Crown, Target, Timer, Coins } from "lucide-react"

const SYMBOLS = [
  { symbol: '🍒', value: 10, name: 'Cherry' },
  { symbol: '🍋', value: 20, name: 'Lemon' },
  { symbol: '🍊', value: 30, name: 'Orange' },
  { symbol: '🍇', value: 40, name: 'Grape' },
  { symbol: '7️⃣', value: 50, name: 'Seven' },
  { symbol: '🔔', value: 60, name: 'Bell' },
  { symbol: '💎', value: 100, name: 'Diamond' },
  { symbol: '👑', value: 200, name: 'Crown' },
  { symbol: '🎰', value: 500, name: 'Jackpot' }
]

const PAYLINES = [
  [0, 1, 2], // Horizontal top
  [3, 4, 5], // Horizontal middle
  [6, 7, 8], // Horizontal bottom
  [0, 4, 8], // Diagonal left to right
  [2, 4, 6], // Diagonal right to left
  [0, 3, 6], // Vertical left
  [1, 4, 7], // Vertical middle
  [2, 5, 8], // Vertical right
]

export default function SlotsGame() {
  const { user } = useAuth()
  const { placeBet, gameHistory } = useGameEngine()
  const { toast } = useToast()
  
  const [betAmount, setBetAmount] = useState(10)
  const [isSpinning, setIsSpinning] = useState(false)
  const [reels, setReels] = useState<string[]>(Array(9).fill('🍒'))
  const [totalWin, setTotalWin] = useState(0)
  const [isPageLoading, setIsPageLoading] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [autoPlay, setAutoPlay] = useState(false)
  const [autoPlayCount, setAutoPlayCount] = useState(10)
  const [progressiveJackpot, setProgressiveJackpot] = useState(50000)
  const [bonusRound, setBonusRound] = useState(false)
  const [freeSpins, setFreeSpins] = useState(0)
  const [multiplier, setMultiplier] = useState(1)
  const [showPaytable, setShowPaytable] = useState(false)
  const [winningLines, setWinningLines] = useState<number[]>([])
  const [spinHistory, setSpinHistory] = useState<Array<{reels: string[], win: number, lines: number[]}>>([])

  // Sound effects
  const playSound = useCallback((type: 'spin' | 'win' | 'jackpot' | 'bonus') => {
    if (!soundEnabled) return
    
    // Simulate sound effects with console logs (in real app, use actual audio)
    switch (type) {
      case 'spin':
        console.log('🎵 Spin sound effect')
        break
      case 'win':
        console.log('🎵 Win sound effect')
        break
      case 'jackpot':
        console.log('🎵 Jackpot sound effect')
        break
      case 'bonus':
        console.log('🎵 Bonus round sound effect')
        break
    }
  }, [soundEnabled])

  const calculateWinnings = useCallback((finalReels: string[]) => {
    let totalWin = 0
    const winningLines: number[] = []

    PAYLINES.forEach((line, lineIndex) => {
      const symbols = line.map(index => finalReels[index])
      const firstSymbol = symbols[0]
      
      if (symbols.every(symbol => symbol === firstSymbol)) {
        const symbolData = SYMBOLS.find(s => s.symbol === firstSymbol)
        if (symbolData) {
          const lineWin = symbolData.value * betAmount * multiplier
          totalWin += lineWin
          winningLines.push(lineIndex)
        }
      }
    })

    // Progressive jackpot check (3 jackpot symbols)
    const jackpotCount = finalReels.filter(symbol => symbol === '🎰').length
    if (jackpotCount >= 3) {
      totalWin += progressiveJackpot
      setProgressiveJackpot(50000) // Reset jackpot
      playSound('jackpot')
      toast({
        title: "🎰 MEGA JACKPOT!",
        description: `You won ${progressiveJackpot.toLocaleString()} points!`,
      })
    }

    // Bonus round trigger (3 crown symbols)
    const crownCount = finalReels.filter(symbol => symbol === '👑').length
    if (crownCount >= 3 && !bonusRound) {
      setBonusRound(true)
      setFreeSpins(prev => prev + 10)
      playSound('bonus')
      toast({
        title: "👑 BONUS ROUND!",
        description: "You've triggered 10 free spins!",
      })
    }

    return { totalWin, winningLines }
  }, [betAmount, multiplier, progressiveJackpot, bonusRound, playSound, toast])

  const spin = useCallback(async () => {
    if (isSpinning || betAmount <= 0) return

    if (user && user.points < betAmount) {
      toast({
        title: "Insufficient Balance",
        description: "You don't have enough points to place this bet.",
        variant: "destructive"
      })
      return
    }

    setIsSpinning(true)
    setTotalWin(0)
    setWinningLines([])
    playSound('spin')

    // Simulate spinning animation
    for (let i = 0; i < 15; i++) {
      await new Promise(resolve => setTimeout(resolve, 80))
      setReels(SYMBOLS.map(() => SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)].symbol))
    }

    // Final result
    const finalReels = SYMBOLS.map(() => SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)].symbol)
    setReels(finalReels)

    // Calculate winnings
    const { totalWin: winAmount, winningLines: lines } = calculateWinnings(finalReels)
    setTotalWin(winAmount)
    setWinningLines(lines)

    // Update progressive jackpot
    setProgressiveJackpot(prev => prev + Math.floor(betAmount * 0.1))

    // Add to spin history
    setSpinHistory(prev => [...prev.slice(-9), { reels: finalReels, win: winAmount, lines }])

    // Place bet
    if (user) {
      await placeBet(betAmount, 'slots', {
        reels: finalReels,
        isWin: winAmount > 0,
        winAmount,
        winningLines: lines
      })

      if (winAmount > 0) {
        playSound('win')
        toast({
          title: winAmount >= progressiveJackpot ? "🎰 MEGA JACKPOT!" : "🎉 WIN!",
          description: `You won ${winAmount.toLocaleString()} points!`,
        })
      }
    }

    setIsSpinning(false)

    // Auto-play logic
    if (autoPlay && autoPlayCount > 1) {
      setTimeout(() => {
        setAutoPlayCount(prev => prev - 1)
        spin()
      }, 1000)
    } else if (autoPlay && autoPlayCount <= 1) {
      setAutoPlay(false)
      setAutoPlayCount(10)
    }
  }, [isSpinning, betAmount, user, placeBet, toast, calculateWinnings, playSound, autoPlay, autoPlayCount])

  // Auto-play effect
  useEffect(() => {
    if (autoPlay && !isSpinning && autoPlayCount > 0) {
      const timer = setTimeout(() => {
        spin()
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [autoPlay, isSpinning, autoPlayCount, spin])

  const getSymbolClass = (index: number) => {
    const isWinning = winningLines.some(lineIndex => 
      PAYLINES[lineIndex].includes(index)
    )
    return `w-12 h-12 sm:w-16 sm:h-16 bg-gray-700 rounded-lg flex items-center justify-center text-2xl sm:text-3xl border-2 transition-all duration-300 ${
      isWinning 
        ? 'border-yellow-400 bg-yellow-400/20 scale-110 shadow-lg shadow-yellow-400/50' 
        : 'border-purple-400'
    }`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">🎰 Lucky Slots</h1>
          <p className="text-purple-200">Match symbols on paylines to win big!</p>
          
          {/* Progressive Jackpot */}
          <div className="mt-4 p-4 bg-gradient-to-r from-yellow-400/20 to-orange-400/20 rounded-lg border border-yellow-400/50">
            <div className="text-2xl font-bold text-yellow-400">
              🎰 Progressive Jackpot: {progressiveJackpot.toLocaleString()} pts
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Slot Machine */}
          <Card className="lg:col-span-2 bg-black/20 border-purple-500/30 backdrop-blur-sm">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-white">Slot Machine</CardTitle>
                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSoundEnabled(!soundEnabled)}
                    className="text-white border-purple-300"
                  >
                    {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPaytable(!showPaytable)}
                    className="text-white border-purple-300"
                  >
                    <Target className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="bg-gradient-to-b from-gray-800 to-gray-900 p-4 rounded-lg border-2 border-purple-500/50 mb-6">
                <div className="grid grid-cols-3 gap-2">
                  {reels.map((symbol, index) => (
                    <div key={index} className={getSymbolClass(index)}>
                      {symbol}
                    </div>
                  ))}
                </div>
              </div>

              {/* Paylines indicator */}
              <div className="mb-4">
                <div className="text-sm text-purple-200 mb-2">Active Paylines: {PAYLINES.length}</div>
                <div className="flex flex-wrap gap-1">
                  {PAYLINES.map((line, index) => (
                    <Badge 
                      key={index}
                      variant={winningLines.includes(index) ? "default" : "secondary"}
                      className={winningLines.includes(index) ? "bg-green-500" : ""}
                    >
                      Line {index + 1}
                    </Badge>
                  ))}
                </div>
              </div>

              {totalWin > 0 && (
                <div className="text-center p-4 bg-gradient-to-r from-yellow-400/20 to-orange-400/20 rounded-lg border border-yellow-400/50 mb-4">
                  <div className="text-2xl font-bold text-yellow-400">
                    🎉 WIN! {totalWin.toLocaleString()} pts
                  </div>
                  {multiplier > 1 && (
                    <div className="text-sm text-yellow-300">x{multiplier} Multiplier Active!</div>
                  )}
                </div>
              )}

              {bonusRound && (
                <div className="text-center p-4 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-lg border border-purple-400/50 mb-4">
                  <div className="text-xl font-bold text-purple-400">
                    👑 BONUS ROUND ACTIVE!
                  </div>
                  <div className="text-sm text-purple-300">Free Spins: {freeSpins}</div>
                </div>
              )}

              <div className="text-center text-purple-200">
                <div className="text-sm">Balance: {user?.points?.toLocaleString() || 0} pts</div>
              </div>
            </CardContent>
          </Card>

          {/* Controls */}
          <Card className="bg-black/20 border-purple-500/30 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white">Controls</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="bet-amount" className="text-purple-200">Bet Amount</Label>
                <Input
                  id="bet-amount"
                  type="number"
                  value={betAmount}
                  onChange={(e) => setBetAmount(Number(e.target.value))}
                  min="1"
                  max={user?.points || 1000}
                  className="bg-gray-800 border-purple-500 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  onClick={() => setBetAmount(10)}
                  className="text-white border-purple-300 hover:bg-purple-800"
                >
                  10
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setBetAmount(25)}
                  className="text-white border-purple-300 hover:bg-purple-800"
                >
                  25
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setBetAmount(50)}
                  className="text-white border-purple-300 hover:bg-purple-800"
                >
                  50
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setBetAmount(100)}
                  className="text-white border-purple-300 hover:bg-purple-800"
                >
                  100
                </Button>
              </div>

              {/* Auto-play controls */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-purple-200">Auto-play</Label>
                  <Switch
                    checked={autoPlay}
                    onCheckedChange={setAutoPlay}
                    disabled={isSpinning}
                  />
                </div>
                {autoPlay && (
                  <div>
                    <Label className="text-purple-200 text-sm">Auto-plays remaining: {autoPlayCount}</Label>
                    <Slider
                      value={[autoPlayCount]}
                      onValueChange={([value]) => setAutoPlayCount(value)}
                      max={50}
                      min={1}
                      step={1}
                      className="mt-2"
                    />
                  </div>
                )}
              </div>

              <Button
                onClick={spin}
                disabled={isSpinning || autoPlay}
                size="lg"
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold"
              >
                {isSpinning ? (
                  <>
                    <RotateCcw className="w-5 h-5 mr-2 animate-spin" />
                    Spinning...
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 mr-2" />
                    SPIN
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Paytable */}
        {showPaytable && (
          <Card className="mt-8 bg-black/20 border-purple-500/30 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white">Paytable</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                {SYMBOLS.map((symbol) => (
                  <div key={symbol.symbol} className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg">
                    <div className="text-2xl">{symbol.symbol}</div>
                    <div>
                      <div className="font-semibold text-white">{symbol.name}</div>
                      <div className="text-sm text-purple-200">{symbol.value}x bet</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Game Stats */}
        <Card className="mt-8 bg-black/20 border-purple-500/30 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white">Game Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-purple-400">
                  {gameHistory.filter(g => g.gameType === 'slots').length}
                </div>
                <div className="text-sm text-purple-200">Games Played</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-400">
                  {gameHistory
                    .filter(g => g.gameType === 'slots')
                    .reduce((sum, g) => sum + (g.winnings || 0), 0)
                    .toLocaleString()}
                </div>
                <div className="text-sm text-purple-200">Total Won</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-400">
                  {gameHistory
                    .filter(g => g.gameType === 'slots')
                    .reduce((sum, g) => sum + (g.betAmount || 0), 0)
                    .toLocaleString()}
                </div>
                <div className="text-sm text-purple-200">Total Wagered</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-yellow-400">
                  {freeSpins}
                </div>
                <div className="text-sm text-purple-200">Free Spins</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
