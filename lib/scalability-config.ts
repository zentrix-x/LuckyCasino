// Scalability configuration for high user loads (2-3 lakh users)

export const SCALABILITY_CONFIG = {
  // Database settings
  database: {
    maxPoolSize: 100,
    minPoolSize: 10,
    maxIdleTimeMS: 30000,
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 10000,
    socketTimeoutMS: 45000,
  },

  // Rate limiting settings
  rateLimiting: {
    bet: {
      windowMs: 60000, // 1 minute
      maxRequests: 10, // 10 bets per minute per user
    },
    gameData: {
      windowMs: 30000, // 30 seconds
      maxRequests: 5, // 5 requests per 30 seconds per user
    },
    auth: {
      windowMs: 300000, // 5 minutes
      maxRequests: 5, // 5 login attempts per 5 minutes per IP
    },
  },

  // Polling intervals (in milliseconds)
  polling: {
    gameData: 30000, // 30 seconds (reduced from 10s)
    heartbeat: 60000, // 60 seconds (reduced from 30s)
    adminStats: 60000, // 60 seconds
    gameHistory: 60000, // 60 seconds
  },

  // Caching settings
  caching: {
    userSession: 3600000, // 1 hour
    gameData: 30000, // 30 seconds
    adminStats: 60000, // 1 minute
    presenceData: 300000, // 5 minutes
  },

  // Performance thresholds
  thresholds: {
    maxConcurrentUsers: 300000,
    maxBetsPerSecond: 1000,
    maxAPIRequestsPerSecond: 5000,
    maxDatabaseConnections: 100,
  },

  // Monitoring settings
  monitoring: {
    enableMetrics: true,
    logLevel: 'info',
    performanceTracking: true,
    errorReporting: true,
  },
}

// Environment-specific configurations
export const getScalabilityConfig = () => {
  const env = process.env.NODE_ENV || 'development'
  
  if (env === 'production') {
    return {
      ...SCALABILITY_CONFIG,
      database: {
        ...SCALABILITY_CONFIG.database,
        maxPoolSize: 200, // Higher for production
        minPoolSize: 20,
      },
      rateLimiting: {
        ...SCALABILITY_CONFIG.rateLimiting,
        bet: {
          windowMs: 60000,
          maxRequests: 20, // Higher limits for production
        },
      },
    }
  }
  
  return SCALABILITY_CONFIG
}

// Utility functions for scalability
export const calculateUserLoad = (concurrentUsers: number) => {
  const config = getScalabilityConfig()
  
  return {
    isWithinLimits: concurrentUsers <= config.thresholds.maxConcurrentUsers,
    loadPercentage: (concurrentUsers / config.thresholds.maxConcurrentUsers) * 100,
    recommendedActions: concurrentUsers > 200000 ? [
      'Implement Redis caching',
      'Add load balancing',
      'Enable database sharding',
      'Implement WebSockets for real-time updates'
    ] : []
  }
}

export const getOptimalPollingInterval = (userCount: number) => {
  if (userCount > 100000) {
    return {
      gameData: 60000, // 1 minute
      heartbeat: 120000, // 2 minutes
      adminStats: 120000, // 2 minutes
    }
  }
  
  return SCALABILITY_CONFIG.polling
}




