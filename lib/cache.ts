// High-performance in-memory cache system
// This provides fast caching for the casino site

class CacheManager {
  private cache = new Map<string, { value: any; expiry: number }>()
  private cleanupInterval: NodeJS.Timeout | null = null

  constructor() {
    // Clean up expired items every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, 5 * 60 * 1000)
  }

  private cleanup(): void {
    const now = Date.now()
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiry) {
        this.cache.delete(key)
      }
    }
  }

  async set(key: string, value: any, ttl: number = 3600): Promise<void> {
    const expiry = Date.now() + (ttl * 1000)
    this.cache.set(key, { value, expiry })
  }

  async get(key: string): Promise<any | null> {
    const item = this.cache.get(key)
    if (!item) return null
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key)
      return null
    }
    
    return item.value
  }

  async setex(key: string, ttl: number, value: any): Promise<void> {
    await this.set(key, value, ttl)
  }

  async del(key: string): Promise<void> {
    this.cache.delete(key)
  }

  async ping(): Promise<string> {
    return 'PONG'
  }

  async info(): Promise<string> {
    return `connected_clients:1\nused_memory:${this.cache.size * 1000}\ntotal_commands_processed:${this.cache.size}`
  }

  // User session caching
  async setUserSession(userId: string, sessionData: any, ttl: number = 3600): Promise<void> {
    const key = `session:${userId}`
    await this.setex(key, ttl, JSON.stringify(sessionData))
  }

  async getUserSession(userId: string): Promise<any | null> {
    const key = `session:${userId}`
    const data = await this.get(key)
    return data ? JSON.parse(data) : null
  }

  // Game data caching
  async setGameData(gameType: string, roundId: string, data: any, ttl: number = 300): Promise<void> {
    const key = `game:${gameType}:${roundId}`
    await this.setex(key, ttl, JSON.stringify(data))
  }

  async getGameData(gameType: string, roundId: string): Promise<any | null> {
    const key = `game:${gameType}:${roundId}`
    const data = await this.get(key)
    return data ? JSON.parse(data) : null
  }

  // Admin stats caching
  async setAdminStats(adminId: string, stats: any, ttl: number = 600): Promise<void> {
    const key = `admin:stats:${adminId}`
    await this.setex(key, ttl, JSON.stringify(stats))
  }

  async getAdminStats(adminId: string): Promise<any | null> {
    const key = `admin:stats:${adminId}`
    const data = await this.get(key)
    return data ? JSON.parse(data) : null
  }

  // Presence tracking caching
  async setUserPresence(userId: string, presenceData: any, ttl: number = 300): Promise<void> {
    const key = `presence:${userId}`
    await this.setex(key, ttl, JSON.stringify(presenceData))
  }

  async getUserPresence(userId: string): Promise<any | null> {
    const key = `presence:${userId}`
    const data = await this.get(key)
    return data ? JSON.parse(data) : null
  }

  // Rate limiting
  async checkRateLimit(identifier: string, limit: number, window: number): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    const key = `ratelimit:${identifier}`
    const now = Date.now()
    const windowStart = now - window

    const currentData = await this.get(key)
    const requests = currentData ? JSON.parse(currentData) : []
    
    // Remove expired requests
    const validRequests = requests.filter((timestamp: number) => timestamp > windowStart)
    
    // Add current request
    validRequests.push(now)
    
    // Store updated requests
    await this.setex(key, Math.ceil(window / 1000), JSON.stringify(validRequests))
    
    const currentCount = validRequests.length
    
    return {
      allowed: currentCount <= limit,
      remaining: Math.max(0, limit - currentCount),
      resetTime: now + window
    }
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      await this.ping()
      return true
    } catch (error) {
      return false
    }
  }

  // Get cache stats
  getStats() {
    return {
      size: this.cache.size,
      isHealthy: true
    }
  }

  // Cleanup expired entries
  private cleanup(): void {
    const now = Date.now()
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiry) {
        this.cache.delete(key)
      }
    }
  }
}

// Create singleton instance
const cacheManager = new CacheManager()

// Export singleton instance
export { cacheManager }
export default CacheManager
