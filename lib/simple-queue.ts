// Simple in-memory queue system for high scalability
// This is a temporary solution until Redis/Bull is properly configured

interface QueueJob {
  id: string
  type: string
  data: any
  priority: number
  createdAt: Date
  attempts: number
  maxAttempts: number
}

interface QueueProcessor {
  (job: QueueJob): Promise<any>
}

export class SimpleQueueManager {
  private static instance: SimpleQueueManager
  private queues: Map<string, QueueJob[]> = new Map()
  private processors: Map<string, QueueProcessor> = new Map()
  private isProcessing: Map<string, boolean> = new Map()
  private processingInterval: NodeJS.Timeout | null = null

  private constructor() {
    this.startProcessing()
  }

  static getInstance(): SimpleQueueManager {
    if (!SimpleQueueManager.instance) {
      SimpleQueueManager.instance = new SimpleQueueManager()
    }
    return SimpleQueueManager.instance
  }

  // Add a job to a queue
  async addJob(queueName: string, data: any, options: { priority?: number; delay?: number } = {}): Promise<string> {
    const job: QueueJob = {
      id: `${queueName}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: queueName,
      data,
      priority: options.priority || 1,
      createdAt: new Date(),
      attempts: 0,
      maxAttempts: 3
    }

    if (!this.queues.has(queueName)) {
      this.queues.set(queueName, [])
    }

    const queue = this.queues.get(queueName)!
    
    if (options.delay) {
      setTimeout(() => {
        queue.push(job)
        queue.sort((a, b) => b.priority - a.priority)
      }, options.delay)
    } else {
      queue.push(job)
      queue.sort((a, b) => b.priority - a.priority)
    }

    // Removed console.log for better performance
    return job.id
  }

  // Register a processor for a queue
  registerProcessor(queueName: string, processor: QueueProcessor): void {
    this.processors.set(queueName, processor)
    
  }

  // Start processing jobs
  private startProcessing(): void {
    this.processingInterval = setInterval(() => {
      this.processQueues()
    }, 5000) // Process every 5 seconds for better performance


  }

  // Process all queues
  private async processQueues(): Promise<void> {
    for (const [queueName, queue] of this.queues.entries()) {
      if (this.isProcessing.get(queueName)) continue
      
      const processor = this.processors.get(queueName)
      if (!processor) continue

      if (queue.length > 0) {
        this.isProcessing.set(queueName, true)
        await this.processQueue(queueName, queue, processor)
        this.isProcessing.set(queueName, false)
      }
    }
  }

  // Process a specific queue
  private async processQueue(queueName: string, queue: QueueJob[], processor: QueueProcessor): Promise<void> {
    const job = queue.shift()
    if (!job) return

    try {
      console.log(`⚡ Processing job ${job.id} in queue ${queueName}`)
      await processor(job)
      console.log(`✅ Job ${job.id} completed successfully`)
    } catch (error) {
      console.error(`❌ Job ${job.id} failed:`, error)
      
      job.attempts++
      if (job.attempts < job.maxAttempts) {
        // Re-add job to queue with exponential backoff
        const backoffDelay = Math.pow(2, job.attempts) * 1000
        setTimeout(() => {
          queue.push(job)
          queue.sort((a, b) => b.priority - a.priority)
        }, backoffDelay)
        console.log(`🔄 Job ${job.id} will be retried in ${backoffDelay}ms (attempt ${job.attempts}/${job.maxAttempts})`)
      } else {
        console.log(`💀 Job ${job.id} failed permanently after ${job.maxAttempts} attempts`)
      }
    }
  }

  // Get queue statistics
  getQueueStats(): any {
    const stats: any = {}
    
    for (const [queueName, queue] of this.queues.entries()) {
      stats[queueName] = {
        waiting: queue.length,
        processing: this.isProcessing.get(queueName) || false
      }
    }
    
    return stats
  }

  // Stop processing
  stop(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval)
      this.processingInterval = null
    }
    console.log('🔌 Simple queue manager stopped')
  }
}

// Export singleton instance
export const simpleQueueManager = SimpleQueueManager.getInstance()
