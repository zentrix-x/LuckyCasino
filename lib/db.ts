import mongoose from 'mongoose'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/casino'
const MONGO_DB = process.env.MONGO_DB || 'casino'

const g = global as any

export async function connectMongo() {
	if (!g.__mongoose) {
		g.__mongoose = mongoose.connect(MONGO_URI, { 
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
