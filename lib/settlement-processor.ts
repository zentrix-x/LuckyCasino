import { simpleQueueManager } from './simple-queue'

export async function processSettlementJob(job: any): Promise<void> {
  try {
    console.log('🎯 Processing settlement job:', job.id)
    
    // Call the settlement API endpoint
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/cron/settle`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    })
    
    if (!response.ok) {
      throw new Error(`Settlement API returned ${response.status}: ${response.statusText}`)
    }
    
    const result = await response.json()
    console.log('✅ Settlement completed:', result)
    
  } catch (error) {
    console.error('❌ Settlement job failed:', error)
    throw error
  }
}

// Register the settlement processor
export function registerSettlementProcessor(): void {
  simpleQueueManager.registerProcessor('settle-games', processSettlementJob)
  console.log('📋 Settlement processor registered')
}
