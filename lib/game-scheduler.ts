

class GameScheduler {
  private static instance: GameScheduler
  private isRunning = false
  private intervalId: NodeJS.Timeout | null = null

  private constructor() {}

  static getInstance(): GameScheduler {
    if (!GameScheduler.instance) {
      GameScheduler.instance = new GameScheduler()
    }
    return GameScheduler.instance
  }

  start() {
    if (this.isRunning) {
      console.log('🔄 Game scheduler is already running')
      return
    }

    console.log('🚀 Starting game scheduler...')
    this.isRunning = true

    // Run settlement every 60 seconds
    this.intervalId = setInterval(async () => {
      try {
        console.log('⏰ Running scheduled game settlement...')
        
        // Directly call the settlement API
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/cron/settle`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        })
        
        if (response.ok) {
          const result = await response.json()
          console.log('✅ Scheduled settlement completed:', result)
        } else {
          console.error('❌ Scheduled settlement failed:', response.status)
        }
        
      } catch (error) {
        console.error('❌ Error in game scheduler:', error)
      }
    }, 60000) // Every 60 seconds

    console.log('✅ Game scheduler started successfully')
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
    this.isRunning = false
    console.log('🛑 Game scheduler stopped')
  }

  isActive(): boolean {
    return this.isRunning
  }
}

export const gameScheduler = GameScheduler.getInstance()
