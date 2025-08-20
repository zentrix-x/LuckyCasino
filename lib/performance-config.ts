// Performance configuration for the casino site
// Centralized settings for optimal performance

export const PERFORMANCE_CONFIG = {
  // Cache settings
  CACHE: {
    ADMIN_DASHBOARD_TTL: 300, // 5 minutes
    USER_SESSION_TTL: 3600, // 1 hour
    GAME_DATA_TTL: 300, // 5 minutes
    PRESENCE_TTL: 300, // 5 minutes
    CLEANUP_INTERVAL: 5 * 60 * 1000, // 5 minutes
  },

  // Queue settings
  QUEUE: {
    PROCESSING_INTERVAL: 5000, // 5 seconds
    MAX_ATTEMPTS: 3,
    DEFAULT_PRIORITY: 1,
  },

  // WebSocket settings
  WEBSOCKET: {
    PING_TIMEOUT: 120000, // 2 minutes
    PING_INTERVAL: 60000, // 1 minute
    UPGRADE_TIMEOUT: 10000, // 10 seconds
    MAX_BUFFER_SIZE: 1e6, // 1MB
  },

  // API polling settings
  API: {
    GAME_ROUND_POLLING: 60000, // 1 minute
    ADMIN_DASHBOARD_POLLING: 30000, // 30 seconds
    USER_PRESENCE_POLLING: 30000, // 30 seconds
  },

  // Database settings
  DATABASE: {
    CONNECTION_TIMEOUT: 10000, // 10 seconds
    QUERY_TIMEOUT: 5000, // 5 seconds
    MAX_POOL_SIZE: 10,
  },

  // Rate limiting
  RATE_LIMIT: {
    API_REQUESTS: {
      WINDOW: 60000, // 1 minute
      MAX_REQUESTS: 100,
    },
    WEBSOCKET_CONNECTIONS: {
      WINDOW: 60000, // 1 minute
      MAX_CONNECTIONS: 50,
    },
  },
}

// Helper function to get performance setting
export function getPerformanceSetting(category: keyof typeof PERFORMANCE_CONFIG, setting: string): any {
  return PERFORMANCE_CONFIG[category][setting as keyof typeof PERFORMANCE_CONFIG[typeof category]]
}



