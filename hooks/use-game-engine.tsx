"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import { useAuth } from "./use-auth"

export type GameType = "7up7down" | "spinwin" | "lottery_0_99" | "slots"
export type GameStatus = "waiting" | "betting" | "playing" | "finished"

export interface GameBet {
  id: string
  userId: string
  username: string
  gameId: string
  gameType: GameType
  betAmount: number
  betChoice: string
  timestamp: Date
  result?: "win" | "lose"
  payout?: number
}

export interface GameSession {
  id: string
  gameType: GameType
  status: GameStatus
  startTime: Date
  endTime?: Date
  result?: any
  totalBets: number
  totalPayout: number
  bets: GameBet[]
  countdown: number
}

export interface GameHistory {
  id: string
  gameType: GameType
  result: any
  timestamp: Date
  totalBets: number
  totalPayout: number
  userBet?: GameBet
  betAmount?: number
  winnings?: number
}

interface GameEngineContextType {
  currentSessions: Record<GameType, GameSession | null>
  gameHistory: GameHistory[]
  userBets: GameBet[]
  placeBet: (betAmount: number, gameType: GameType, gameData?: any) => Promise<boolean>
  getGameResults: (gameType: GameType) => GameHistory[]
  isGameActive: (gameType: GameType) => boolean
  getCountdown: (gameType: GameType) => number
}

const GameEngineContext = createContext<GameEngineContextType | undefined>(undefined)

// Game configuration
const GAME_CONFIG = {
  "7up7down": {
    bettingDuration: 30, // 30 seconds betting time
    resultDelay: 5, // 5 seconds to show result
    minBet: 100,
    payouts: {
      "7up": 1.95, // Slightly less than 2x for house edge
      "7down": 1.95,
      lucky7: 11.5, // Slightly less than 12x for house edge
    },
  },
  spinwin: {
    bettingDuration: 25,
    resultDelay: 8,
    minBet: 5,
    payouts: {
      red: 1.9,
      black: 1.9,
      green: 13.5,
    },
  },
  lottery_0_99: {
    bettingDuration: 60,
    resultDelay: 10,
    minBet: 10,
    payouts: {
      exact: 95, // 95x for exact number match
      range: 9.5, // 9.5x for range match (0-9, 10-19, etc.)
    },
  },
}

export function GameEngineProvider({ children }: { children: ReactNode }) {
  const { user, updatePoints } = useAuth()
  const [currentSessions, setCurrentSessions] = useState<Record<GameType, GameSession | null>>({
    "7up7down": null,
    spinwin: null,
    lottery_0_99: null,
  })
  const [gameHistory, setGameHistory] = useState<GameHistory[]>([])
  const [userBets, setUserBets] = useState<GameBet[]>([])

  // Generate game results with house edge
  const generateGameResult = useCallback((gameType: GameType) => {
    switch (gameType) {
      case "7up7down":
        // Generate number 1-13, with slight bias toward 7 to reduce lucky7 wins
        const rand = Math.random()
        if (rand < 0.12) return 7 // 12% chance for 7 (slightly higher than 1/13)
        const num = Math.floor(Math.random() * 12) + 1
        return num >= 7 ? num + 1 : num // Skip 7 in normal generation

      case "spinwin":
        // 18 red, 18 black, 2 green (house edge via green)
        const spinRand = Math.random()
        if (spinRand < 0.05) return "green" // 5% green (house edge)
        return spinRand < 0.525 ? "red" : "black" // Slightly favor one color

      case "lottery_0_99":
        return Math.floor(Math.random() * 100) // 0-99

      default:
        return null
    }
  }, [])

  // Calculate payout for a bet
  const calculatePayout = useCallback((bet: GameBet, result: any): { isWin: boolean; payout: number } => {
    const config = GAME_CONFIG[bet.gameType]
    let isWin = false
    let multiplier = 0

    switch (bet.gameType) {
      case "7up7down":
        if (bet.betChoice === "7up" && result > 7) {
          isWin = true
          multiplier = config.payouts["7up"]
        } else if (bet.betChoice === "7down" && result < 7) {
          isWin = true
          multiplier = config.payouts["7down"]
        } else if (bet.betChoice === "lucky7" && result === 7) {
          isWin = true
          multiplier = config.payouts["lucky7"]
        }
        break

      case "spinwin":
        if (bet.betChoice === result) {
          isWin = true
          multiplier = config.payouts[result as keyof typeof config.payouts]
        }
        break

      case "lottery_0_99":
        const betNum = Number.parseInt(bet.betChoice)
        if (betNum === result) {
          isWin = true
          multiplier = config.payouts.exact
        } else {
          const betRange = Math.floor(betNum / 10)
          const resultRange = Math.floor(result / 10)
          if (betRange === resultRange) {
            isWin = true
            multiplier = config.payouts.range
          }
        }
        break
    }

    return {
      isWin,
      payout: isWin ? bet.betAmount * multiplier : 0,
    }
  }, [])

  // Start a new game session
  const startGameSession = useCallback(
    (gameType: GameType) => {
      const config = GAME_CONFIG[gameType]
      const newSession: GameSession = {
        id: `${gameType}-${Date.now()}`,
        gameType,
        status: "betting",
        startTime: new Date(),
        totalBets: 0,
        totalPayout: 0,
        bets: [],
        countdown: config.bettingDuration,
      }

      setCurrentSessions((prev) => ({ ...prev, [gameType]: newSession }))

      // Countdown timer
      const countdownInterval = setInterval(() => {
        setCurrentSessions((prev) => {
          const session = prev[gameType]
          if (!session || session.countdown <= 0) {
            clearInterval(countdownInterval)
            return prev
          }

          const newCountdown = session.countdown - 1
          if (newCountdown === 0) {
            // End betting, start playing
            setTimeout(() => {
              const result = generateGameResult(gameType)
              finishGameSession(gameType, result)
            }, config.resultDelay * 1000)

            return {
              ...prev,
              [gameType]: { ...session, status: "playing", countdown: config.resultDelay },
            }
          }

          return {
            ...prev,
            [gameType]: { ...session, countdown: newCountdown },
          }
        })
      }, 1000)
    },
    [generateGameResult],
  )

  // Finish a game session
  const finishGameSession = useCallback(
    (gameType: GameType, result: any) => {
      setCurrentSessions((prev) => {
        const session = prev[gameType]
        if (!session) return prev

        // Calculate payouts for all bets
        const updatedBets = session.bets.map((bet) => {
          const { isWin, payout } = calculatePayout(bet, result)
          return {
            ...bet,
            result: isWin ? ("win" as const) : ("lose" as const),
            payout,
          }
        })

        const totalPayout = updatedBets.reduce((sum, bet) => sum + (bet.payout || 0), 0)

        // Update user points if they had bets
        if (user) {
          const userSessionBets = updatedBets.filter((bet) => bet.userId === user.id)
          const userPayout = userSessionBets.reduce((sum, bet) => sum + (bet.payout || 0), 0)
          if (userPayout > 0) {
            updatePoints(user.points + userPayout)
          }
        }

        // Add to history
        const historyEntry: GameHistory = {
          id: session.id,
          gameType,
          result,
          timestamp: new Date(),
          totalBets: session.totalBets,
          totalPayout,
          userBet: user ? updatedBets.find((bet) => bet.userId === user.id) : undefined,
        }

        setGameHistory((prev) => [historyEntry, ...prev.slice(0, 49)]) // Keep last 50 games
        setUserBets((prev) => [...updatedBets.filter((bet) => bet.userId === user?.id), ...prev.slice(0, 99)])

        // Show result for a few seconds, then start new session
        setTimeout(() => {
          startGameSession(gameType)
        }, 5000)

        return {
          ...prev,
          [gameType]: {
            ...session,
            status: "finished",
            endTime: new Date(),
            result,
            bets: updatedBets,
            totalPayout,
            countdown: 5,
          },
        }
      })
    },
    [calculatePayout, user, updatePoints, startGameSession],
  )

        // Place a bet
      const placeBet = useCallback(
        async (betAmount: number, gameType: GameType, gameData?: any): Promise<boolean> => {
          if (!user) return false

          // For slots and other instant games, handle differently
          if (gameType === 'slots') {
            if (user.points < betAmount) return false
            
            // Deduct bet amount
            updatePoints(user.points - betAmount)
            
            // Add to history immediately
            const historyEntry: GameHistory = {
              id: `slots_${Date.now()}`,
              gameType,
              result: gameData,
              timestamp: new Date(),
              totalBets: betAmount,
              totalPayout: gameData?.winAmount || 0,
              betAmount,
              winnings: gameData?.winAmount || 0,
            }
            
            setGameHistory((prev) => [historyEntry, ...prev.slice(0, 49)])
            
            // Add winnings if any
            if (gameData?.winAmount && gameData.winAmount > 0) {
              updatePoints(user.points + gameData.winAmount)
            }

            // Update achievements and leaderboard
            try {
              const token = localStorage.getItem('token')
              if (token) {
                // Update achievements
                await fetch('/api/achievements', {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({
                    achievementId: 'first_win',
                    progress: gameData?.isWin ? 1 : 0
                  })
                }).catch(err => console.error('Error updating achievements:', err))

                // Update leaderboard stats
                await fetch('/api/leaderboard/update', {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({
                    won: gameData?.isWin || false,
                    betAmount,
                    winAmount: gameData?.winAmount || 0
                  })
                }).catch(err => console.error('Error updating leaderboard:', err))
              }
            } catch (error) {
              console.error('Error updating achievements/leaderboard:', error)
            }
            
            return true
          }

      const session = currentSessions[gameType]
      if (!session || session.status !== "betting") return false

      const config = GAME_CONFIG[gameType]
      if (betAmount < config.minBet) return false
      if (user.points < betAmount) return false

      // Deduct points immediately
      updatePoints(user.points - betAmount)

      const newBet: GameBet = {
        id: `bet-${Date.now()}-${Math.random()}`,
        userId: user.id,
        username: user.username,
        gameId: session.id,
        gameType,
        betAmount,
        betChoice,
        timestamp: new Date(),
      }

      setCurrentSessions((prev) => ({
        ...prev,
        [gameType]: {
          ...session,
          bets: [...session.bets, newBet],
          totalBets: session.totalBets + betAmount,
        },
      }))

      return true
    },
    [user, currentSessions, updatePoints],
  )

  // Initialize game sessions
  useEffect(() => {
    const gameTypes: GameType[] = ["7up7down", "spinwin", "lottery_0_99"]
    gameTypes.forEach((gameType) => {
      if (!currentSessions[gameType]) {
        startGameSession(gameType)
      }
    })
  }, []) // Only run once on mount

  const getGameResults = useCallback(
    (gameType: GameType) => {
      return gameHistory.filter((game) => game.gameType === gameType).slice(0, 10)
    },
    [gameHistory],
  )

  const isGameActive = useCallback(
    (gameType: GameType) => {
      const session = currentSessions[gameType]
      return session?.status === "betting" || session?.status === "playing"
    },
    [currentSessions],
  )

  const getCountdown = useCallback(
    (gameType: GameType) => {
      return currentSessions[gameType]?.countdown || 0
    },
    [currentSessions],
  )

  return (
    <GameEngineContext.Provider
      value={{
        currentSessions,
        gameHistory,
        userBets,
        placeBet,
        getGameResults,
        isGameActive,
        getCountdown,
      }}
    >
      {children}
    </GameEngineContext.Provider>
  )
}

export function useGameEngine() {
  const context = useContext(GameEngineContext)
  if (context === undefined) {
    throw new Error("useGameEngine must be used within a GameEngineProvider")
  }
  return context
}
