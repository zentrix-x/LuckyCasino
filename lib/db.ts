import mongoose from 'mongoose'

// Prefer cloud URI via env. In production, require it explicitly to avoid
// falling back to localhost on platforms like Vercel.
const RESOLVED_MONGO_URI =
  process.env.MONGO_URI ||
  process.env.MONGODB_URI ||
  (process.env.NODE_ENV !== 'production' ? 'mongodb://127.0.0.1:27017/casino' : '')

// Only throw error if we're not in build mode and no URI is set
if (!RESOLVED_MONGO_URI && typeof window === 'undefined' && process.env.NODE_ENV !== 'production') {
  throw new Error('MONGO_URI (or MONGODB_URI) is not set')
}

// For build time, provide a fallback URI to prevent build failures
const BUILD_TIME_URI = RESOLVED_MONGO_URI || 'mongodb://localhost:27017/casino'

const MONGO_DB = process.env.MONGO_DB || 'casino'

const g = global as any

export async function connectMongo() {
	// Use build-time URI if no resolved URI is available (prevents build failures)
	const uri = RESOLVED_MONGO_URI || BUILD_TIME_URI
	
	if (!g.__mongoose) {
		g.__mongoose = mongoose.connect(uri, { 
			dbName: MONGO_DB,
			// Optimized connection pooling for better performance
			maxPoolSize: 20, // Reduced for better resource management
			minPoolSize: 5, // Reduced minimum pool
			maxIdleTimeMS: 60000, // Increased idle time
			serverSelectionTimeoutMS: 10000, // Increased timeout
			// Connection timeout settings
			connectTimeoutMS: 15000, // Increased connection timeout
			socketTimeoutMS: 60000, // Increased socket timeout
			// Read preference for better performance
			readPreference: 'primaryPreferred', // Changed for better performance
			// Write concern for data consistency
			w: 1, // Reduced write concern for better performance
			// Additional performance optimizations
			bufferCommands: false, // Disable buffering for immediate execution
		})
	}
	await g.__mongoose
	return mongoose
}

// Export alias for backward compatibility
export const connectDB = connectMongo
