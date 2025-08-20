import { GAME_CONFIG } from './config'

export interface BetSummary {
  outcome: string
  totalAmount: number
  totalBets: number
  potentialPayout: number
}

export interface GameResult {
  winningOutcome: string
  totalBets: number
  totalPayout: number
  houseProfit: number
  betSummary: BetSummary[]
}

export class GameLogicService {
  /**
   * Calculate the winning outcome for 7Up 7Down
   * Strategy: Choose outcome with lowest potential payout
   */
  static calculate7Up7DownResult(bets: BetSummary[]): GameResult {
    const outcomes = ['<7', '=7', '>7']
    let bestOutcome = '<7'
    let lowestPayout = Infinity

    for (const outcome of outcomes) {
      const bet = bets.find(b => b.outcome === outcome)
      const payout = bet ? bet.potentialPayout : 0
      
      if (payout < lowestPayout) {
        lowestPayout = payout
        bestOutcome = outcome
      }
    }

    const winningBet = bets.find(b => b.outcome === bestOutcome)
    const totalBets = bets.reduce((sum, bet) => sum + bet.totalAmount, 0)
    const totalPayout = winningBet ? winningBet.potentialPayout : 0
    const houseProfit = totalBets - totalPayout

    return {
      winningOutcome: bestOutcome,
      totalBets,
      totalPayout,
      houseProfit,
      betSummary: bets
    }
  }

  /**
   * Calculate the winning outcome for Spin & Win
   * Strategy: Choose outcome that pays ≤85% of total investment
   * Priority: If multiple outcomes qualify, choose the one closest to 85%
   */
  static calculateSpinWinResult(bets: BetSummary[]): GameResult {
    const totalInvestment = bets.reduce((sum, bet) => sum + bet.totalAmount, 0)
    const targetPayout = totalInvestment * 0.85

    // Find all outcomes that pay ≤85%
    const qualifyingOutcomes = bets.filter(bet => bet.potentialPayout <= targetPayout)

    let bestOutcome = 'x2'
    let closestToTarget = Infinity

    if (qualifyingOutcomes.length > 0) {
      // Choose the one closest to 85% target
      for (const bet of qualifyingOutcomes) {
        const difference = Math.abs(targetPayout - bet.potentialPayout)
        if (difference < closestToTarget) {
          closestToTarget = difference
          bestOutcome = bet.outcome
        }
      }
    } else {
      // If no outcome qualifies, choose the one with lowest payout
      let lowestPayout = Infinity
      for (const bet of bets) {
        if (bet.potentialPayout < lowestPayout) {
          lowestPayout = bet.potentialPayout
          bestOutcome = bet.outcome
        }
      }
    }

    const winningBet = bets.find(b => b.outcome === bestOutcome)
    const totalPayout = winningBet ? winningBet.potentialPayout : 0
    const houseProfit = totalInvestment - totalPayout

    return {
      winningOutcome: bestOutcome,
      totalBets: totalInvestment,
      totalPayout,
      houseProfit,
      betSummary: bets
    }
  }

  /**
   * Calculate the winning outcome for Lottery
   * Strategy: Choose outcome(s) that pay ≤90% of total investment
   * Priority: If multiple numbers qualify, choose combination closest to 90%
   * Players can select multiple numbers, so we need to handle that properly
   */
  static calculateLotteryResult(bets: BetSummary[]): GameResult {
    const totalInvestment = bets.reduce((sum, bet) => sum + bet.totalAmount, 0)
    const targetPayout = totalInvestment * 0.90

    // Find all outcomes that pay ≤90%
    const qualifyingOutcomes = bets.filter(bet => bet.potentialPayout <= targetPayout)

    let bestOutcomes: string[] = []
    let closestToTarget = Infinity

    if (qualifyingOutcomes.length > 0) {
      // Try single outcomes first
      for (const bet of qualifyingOutcomes) {
        const difference = Math.abs(targetPayout - bet.potentialPayout)
        if (difference < closestToTarget) {
          closestToTarget = difference
          bestOutcomes = [bet.outcome]
        }
      }

      // Try combinations of 2-3 outcomes (as per client requirement)
      for (let i = 0; i < qualifyingOutcomes.length; i++) {
        for (let j = i + 1; j < qualifyingOutcomes.length; j++) {
          const combinedPayout = qualifyingOutcomes[i].potentialPayout + qualifyingOutcomes[j].potentialPayout
          if (combinedPayout <= targetPayout) {
            const difference = Math.abs(targetPayout - combinedPayout)
            if (difference < closestToTarget) {
              closestToTarget = difference
              bestOutcomes = [qualifyingOutcomes[i].outcome, qualifyingOutcomes[j].outcome]
            }
          }

          // Try 3 outcomes
          for (let k = j + 1; k < qualifyingOutcomes.length; k++) {
            const combinedPayout = qualifyingOutcomes[i].potentialPayout + 
                                 qualifyingOutcomes[j].potentialPayout + 
                                 qualifyingOutcomes[k].potentialPayout
            if (combinedPayout <= targetPayout) {
              const difference = Math.abs(targetPayout - combinedPayout)
              if (difference < closestToTarget) {
                closestToTarget = difference
                bestOutcomes = [qualifyingOutcomes[i].outcome, qualifyingOutcomes[j].outcome, qualifyingOutcomes[k].outcome]
              }
            }
          }
        }
      }
    }

    // If no qualifying outcomes, choose the one with lowest payout
    if (bestOutcomes.length === 0) {
      let lowestPayout = Infinity
      for (const bet of bets) {
        if (bet.potentialPayout < lowestPayout) {
          lowestPayout = bet.potentialPayout
          bestOutcomes = [bet.outcome]
        }
      }
    }

    const totalPayout = bestOutcomes.reduce((sum, outcome) => {
      const bet = bets.find(b => b.outcome === outcome)
      return sum + (bet ? bet.potentialPayout : 0)
    }, 0)

    const houseProfit = totalInvestment - totalPayout

    return {
      winningOutcome: bestOutcomes.join(','),
      totalBets: totalInvestment,
      totalPayout,
      houseProfit,
      betSummary: bets
    }
  }

  /**
   * Calculate bet summary for all outcomes
   */
  static calculateBetSummary(bets: any[], gameType: string): BetSummary[] {
    const multipliers = GAME_CONFIG[gameType as keyof typeof GAME_CONFIG]?.multipliers || {}
    const summary: { [key: string]: BetSummary } = {}

    for (const bet of bets) {
      const outcome = bet.outcome
      const multiplier = multipliers[outcome] || 1

      if (!summary[outcome]) {
        summary[outcome] = {
          outcome,
          totalAmount: 0,
          totalBets: 0,
          potentialPayout: 0
        }
      }

      summary[outcome].totalAmount += bet.amount
      summary[outcome].totalBets += 1
      summary[outcome].potentialPayout = summary[outcome].totalAmount * multiplier
    }

    return Object.values(summary)
  }

  /**
   * Main function to calculate game result
   */
  static calculateGameResult(bets: any[], gameType: string): GameResult {
    const betSummary = this.calculateBetSummary(bets, gameType)

    switch (gameType) {
      case 'seven_up_down':
        return this.calculate7Up7DownResult(betSummary)
      case 'spin_win':
        return this.calculateSpinWinResult(betSummary)
      case 'lottery_0_99':
        return this.calculateLotteryResult(betSummary)
      default:
        throw new Error(`Unknown game type: ${gameType}`)
    }
  }
}
