import { User, CommissionLedger } from './models'
import { COMMISSION_LEVELS, ROLE_HIERARCHY, USER_ROLES } from './config'

export interface CommissionDistribution {
  masterId: string
  level: number
  commissionRate: number
  commissionAmount: number
  role: string
}

export class CommissionService {
  /**
   * Calculate commission distribution for a game round
   * Commission is based on user's bet amount, not house profit
   */
  static async calculateCommissions(roundId: string): Promise<CommissionDistribution[]> {
    const distributions: CommissionDistribution[] = []
    
    // Get all bets for this round with user information
    const { default: Bet } = await import('./models')
    const bets = await Bet.find({ roundId }).populate('userId', 'parentMasterId')
    
    // Group bets by user to calculate total bet per user
    const userBets: { [userId: string]: number } = {}
    for (const bet of bets) {
      const userId = bet.userId._id.toString()
      userBets[userId] = (userBets[userId] || 0) + bet.amount
    }

    // Calculate commission for each user's total bet
    for (const [userId, totalBetAmount] of Object.entries(userBets)) {
      const user = await User.findById(userId)
      if (!user) continue

      // Get the user's upline (masters above them)
      const upline = await this.getUserUpline(user._id)
      
      // Distribute commissions to each level based on user's bet amount
      for (let i = 0; i < upline.length && i < COMMISSION_LEVELS.length; i++) {
        const master = upline[i]
        const commissionRate = COMMISSION_LEVELS[i]
        const commissionAmount = Math.floor(totalBetAmount * commissionRate)

        if (commissionAmount > 0) {
          distributions.push({
            masterId: master._id.toString(),
            level: i + 1,
            commissionRate,
            commissionAmount,
            role: master.role
          })
        }
      }
    }

    return distributions
  }

  /**
   * Get all participants in a round
   */
  private static async getRoundParticipants(roundId: string): Promise<string[]> {
    const { default: Bet } = await import('./models')
    const bets = await Bet.find({ roundId }).distinct('userId')
    return bets.map(id => id.toString())
  }

  /**
   * Get user's upline (masters above them in hierarchy)
   */
  private static async getUserUpline(userId: string): Promise<any[]> {
    const upline: any[] = []
    let currentUser = await User.findById(userId)

    while (currentUser && currentUser.parentMasterId) {
      const master = await User.findById(currentUser.parentMasterId)
      if (master && this.isMasterRole(master.role)) {
        upline.push(master)
      }
      currentUser = master
    }

    return upline
  }

  /**
   * Check if role is a master role
   */
  private static isMasterRole(role: string): boolean {
    return role !== USER_ROLES.USER
  }

  /**
   * Distribute commissions and update master balances
   */
  static async distributeCommissions(roundId: string, distributions: CommissionDistribution[]): Promise<void> {
    for (const distribution of distributions) {
      // Update master's points
      await User.findByIdAndUpdate(distribution.masterId, {
        $inc: { points: distribution.commissionAmount }
      })

      // Record commission transaction
      const { default: Transaction } = await import('./models')
      await Transaction.create({
        userId: distribution.masterId,
        type: 'commission',
        amount: distribution.commissionAmount,
        balanceAfter: await this.getUserBalance(distribution.masterId),
        meta: {
          roundId,
          level: distribution.level,
          commissionRate: distribution.commissionRate,
          role: distribution.role
        }
      })

      // Record in commission ledger
      await CommissionLedger.create({
        roundId,
        masterId: distribution.masterId,
        level: distribution.level,
        amount: distribution.commissionAmount
      })
    }
  }

  /**
   * Get user's current balance
   */
  private static async getUserBalance(userId: string): Promise<number> {
    const user = await User.findById(userId)
    return user?.points || 0
  }

  /**
   * Validate if a user can create accounts of a specific role
   */
  static canCreateRole(creatorRole: string, targetRole: string): boolean {
    const creatorLevel = ROLE_HIERARCHY[creatorRole as keyof typeof ROLE_HIERARCHY] || 0
    const targetLevel = ROLE_HIERARCHY[targetRole as keyof typeof ROLE_HIERARCHY] || 0
    
    // Can only create accounts below your level
    return targetLevel < creatorLevel
  }

  /**
   * Validate if a user can allocate points to another user
   */
  static canAllocatePoints(allocatorRole: string, targetRole: string): boolean {
    const allocatorLevel = ROLE_HIERARCHY[allocatorRole as keyof typeof ROLE_HIERARCHY] || 0
    const targetLevel = ROLE_HIERARCHY[targetRole as keyof typeof ROLE_HIERARCHY] || 0
    
    // Can only allocate to users below your level
    return targetLevel < allocatorLevel
  }

  /**
   * Get commission summary for a master
   */
  static async getMasterCommissionSummary(masterId: string, startDate?: Date, endDate?: Date): Promise<any> {
    const query: any = { masterId }
    
    if (startDate || endDate) {
      query.createdAt = {}
      if (startDate) query.createdAt.$gte = startDate
      if (endDate) query.createdAt.$lte = endDate
    }

    const commissions = await CommissionLedger.find(query)
      .populate('roundId', 'gameType winningOutcome totalBets totalPayout')
      .sort({ createdAt: -1 })

    const summary = {
      totalCommissions: 0,
      levelBreakdown: {} as any,
      recentCommissions: commissions.slice(0, 20)
    }

    for (const commission of commissions) {
      summary.totalCommissions += commission.amount
      
      if (!summary.levelBreakdown[commission.level]) {
        summary.levelBreakdown[commission.level] = 0
      }
      summary.levelBreakdown[commission.level] += commission.amount
    }

    return summary
  }
}
