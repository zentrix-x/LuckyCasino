export const COMMISSION_LEVELS: number[] = [0.03, 0.015, 0.008, 0.004] // Associate Master 3%, Master 1.5%, Senior Master 0.8%, Super Master 0.4%

export const GAME_CONFIG = {
  seven_up_down: {
    minBet: 100,
    maxBet: null, // no limit
    multipliers: { '<7': 2, '=7': 3, '>7': 2 },
    payoutTarget: null // lowest payout wins
  },
  spin_win: {
    minBet: 100,
    maxBet: null, // no limit
    multipliers: { x2: 2, x7: 7, x3: 3, x6: 6, x4: 4, x5: 5 },
    payoutTarget: 0.85 // pay ≤85% of total investment
  },
  lottery_0_99: {
    minBet: 2,
    maxBet: null, // no limit
    multipliers: Object.fromEntries(Array.from({ length: 100 }, (_, i) => [String(i), 90])),
    payoutTarget: 0.90 // pay ≤90% of total investment
  }
}

export function getMultipliers(gameType: string): Record<string, number> {
  return GAME_CONFIG[gameType as keyof typeof GAME_CONFIG]?.multipliers || {}
}

export function getQuarterBounds(date = new Date()) {
  const d = new Date(date)
  // Reset to start of minute
  d.setSeconds(0, 0)
  
  // Calculate which 15-minute quarter we're in
  const minutes = d.getMinutes()
  const quarter = Math.floor(minutes / 15) * 15
  
  // Set to start of the current quarter
  d.setMinutes(quarter, 0, 0)
  const start = new Date(d)
  
  // End is 15 minutes later
  const end = new Date(start)
  end.setMinutes(start.getMinutes() + 15)
  
  return { start, end }
}

export const USER_ROLES = {
  USER: 'user',
  ASSOCIATE_MASTER: 'associate_master',
  MASTER: 'master',
  SENIOR_MASTER: 'senior_master',
  SUPER_MASTER: 'super_master',
  SUPER_ADMIN: 'super_admin'
} as const

export const ROLE_HIERARCHY = {
  [USER_ROLES.USER]: 0,
  [USER_ROLES.ASSOCIATE_MASTER]: 1,
  [USER_ROLES.MASTER]: 2,
  [USER_ROLES.SENIOR_MASTER]: 3,
  [USER_ROLES.SUPER_MASTER]: 4,
  [USER_ROLES.SUPER_ADMIN]: 5
} as const
