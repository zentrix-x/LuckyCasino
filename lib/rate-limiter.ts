// Rate limiter for high scalability
interface RateLimitConfig {
  windowMs: number
  maxRequests: number
}

class RateLimiter {
  private requests: Map<string, { count: number; resetTime: number }> = new Map()
  private config: RateLimitConfig

  constructor(config: RateLimitConfig) {
    this.config = config
  }

  isAllowed(identifier: string): boolean {
    const now = Date.now()
    const record = this.requests.get(identifier)

    if (!record || now > record.resetTime) {
      // Reset or create new record
      this.requests.set(identifier, {
        count: 1,
        resetTime: now + this.config.windowMs
      })
      return true
    }

    if (record.count >= this.config.maxRequests) {
      return false
    }

    record.count++
    return true
  }

  getRemaining(identifier: string): number {
    const record = this.requests.get(identifier)
    if (!record) return this.config.maxRequests
    return Math.max(0, this.config.maxRequests - record.count)
  }

  getResetTime(identifier: string): number {
    const record = this.requests.get(identifier)
    return record ? record.resetTime : Date.now() + this.config.windowMs
  }

  // Clean up expired records periodically
  cleanup() {
    const now = Date.now()
    for (const [key, record] of this.requests.entries()) {
      if (now > record.resetTime) {
        this.requests.delete(key)
      }
    }
  }
}

// Create rate limiters for different endpoints
export const betRateLimiter = new RateLimiter({
  windowMs: 60000, // 1 minute
  maxRequests: 10 // 10 bets per minute per user
})

export const gameDataRateLimiter = new RateLimiter({
  windowMs: 30000, // 30 seconds
  maxRequests: 5 // 5 requests per 30 seconds per user
})

export const authRateLimiter = new RateLimiter({
  windowMs: 300000, // 5 minutes
  maxRequests: 5 // 5 login attempts per 5 minutes per IP
})

// Cleanup expired records every 5 minutes
setInterval(() => {
  betRateLimiter.cleanup()
  gameDataRateLimiter.cleanup()
  authRateLimiter.cleanup()
}, 300000)

export function getRateLimitHeaders(limiter: RateLimiter, identifier: string) {
  return {
    'X-RateLimit-Limit': limiter.config.maxRequests.toString(),
    'X-RateLimit-Remaining': limiter.getRemaining(identifier).toString(),
    'X-RateLimit-Reset': limiter.getResetTime(identifier).toString()
  }
}




